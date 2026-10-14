use parking_lot::Mutex;
use std::sync::Arc;

#[cfg(windows)]
mod imp {
    use rayon::prelude::*;
    use std::fs;
    use std::path::Path;
    use std::process::Command;
    use std::ptr::{null, null_mut};
    use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
    use windows_sys::Win32::Foundation::{CloseHandle, HANDLE, INVALID_HANDLE_VALUE};
    use windows_sys::Win32::System::Memory::{
        CreateFileMappingW, FILE_MAP_ALL_ACCESS, MEMORY_MAPPED_VIEW_ADDRESS, MapViewOfFile,
        PAGE_READWRITE, UnmapViewOfFile,
    };
    use windows_sys::Win32::System::Threading::{CreateEventW, SetEvent};

    const HW_MAGIC: u32 = 0x48574156; // 'HWAV'
    const HEADER_SIZE: usize = 64;

    pub struct VirtualCameraBridge {
        mmf_handle: HANDLE,
        view_ptr: *mut u8,
        event_handle: HANDLE,
        max_size: usize,
        width: u32,
        height: u32,
        write_index: AtomicU32,
        is_broadcasting: AtomicBool,
    }

    unsafe impl Send for VirtualCameraBridge {}
    unsafe impl Sync for VirtualCameraBridge {}

    impl VirtualCameraBridge {
        pub fn new() -> Self {
            Self {
                mmf_handle: null_mut(),
                view_ptr: null_mut(),
                event_handle: null_mut(),
                max_size: 0,
                width: 1280,
                height: 720,
                write_index: AtomicU32::new(0),
                is_broadcasting: AtomicBool::new(false),
            }
        }

        pub fn start(&mut self, width: u32, height: u32) -> Result<(), String> {
            self.stop();

            self.width = width;
            self.height = height;

            let nv12_size = (width * height * 3 / 2) as usize;
            let max_nv12 = nv12_size.max((1920 * 1080 * 3 / 2) as usize);
            let total_size = HEADER_SIZE + max_nv12;
            self.max_size = total_size;

            let mmf_name: Vec<u16> = "HeartWaveSharedVideo\0".encode_utf16().collect();
            let event_name: Vec<u16> = "HeartWaveNewFrameEvent\0".encode_utf16().collect();

            unsafe {
                let h_map = CreateFileMappingW(
                    INVALID_HANDLE_VALUE,
                    null(),
                    PAGE_READWRITE,
                    0,
                    total_size as u32,
                    mmf_name.as_ptr(),
                );
                if h_map == null_mut() {
                    return Err("Failed to create shared memory file mapping".to_string());
                }

                let view_addr = MapViewOfFile(h_map, FILE_MAP_ALL_ACCESS, 0, 0, total_size);
                if view_addr.Value.is_null() {
                    CloseHandle(h_map);
                    return Err("Failed to map view of shared memory".to_string());
                }

                let h_event = CreateEventW(null(), 0, 0, event_name.as_ptr());
                if h_event == null_mut() {
                    UnmapViewOfFile(view_addr);
                    CloseHandle(h_map);
                    return Err("Failed to create frame synchronization event".to_string());
                }

                self.mmf_handle = h_map;
                self.view_ptr = view_addr.Value as *mut u8;
                self.event_handle = h_event;

                // Initialize Header (DirectShow format)
                let header_slice = std::slice::from_raw_parts_mut(self.view_ptr, HEADER_SIZE);
                header_slice[0..4].copy_from_slice(&HW_MAGIC.to_le_bytes());
                header_slice[4..8].copy_from_slice(&1u32.to_le_bytes());
                header_slice[8..12].copy_from_slice(&width.to_le_bytes());
                header_slice[12..16].copy_from_slice(&height.to_le_bytes());
                header_slice[16..20].copy_from_slice(&0u32.to_le_bytes()); // NV12
                header_slice[20..24].copy_from_slice(&0u32.to_le_bytes());
                let now_ticks = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_nanos() as u64;
                header_slice[24..32].copy_from_slice(&now_ticks.to_le_bytes());
                header_slice[32..36].copy_from_slice(&(nv12_size as u32).to_le_bytes());
                header_slice[36..40].copy_from_slice(&0u32.to_le_bytes());

                // Default dark luxury standby frame
                let frame_slice =
                    std::slice::from_raw_parts_mut(self.view_ptr.add(HEADER_SIZE), nv12_size);
                let y_size = (width * height) as usize;
                for i in 0..y_size {
                    frame_slice[i] = 26;
                }
                for i in (y_size..nv12_size).step_by(2) {
                    frame_slice[i] = 132;
                    frame_slice[i + 1] = 126;
                }

                SetEvent(self.event_handle);
                self.is_broadcasting.store(true, Ordering::SeqCst);
            }

            Ok(())
        }

        pub fn push_rgba_frame(&self, rgba: &[u8], width: u32, height: u32, is_privacy: bool) {
            if !self.is_broadcasting.load(Ordering::Relaxed) || self.view_ptr.is_null() {
                return;
            }

            let w = width as usize;
            let h = height as usize;
            let y_size = w * h;
            let nv12_size = y_size * 3 / 2;

            unsafe {
                let frame_dest =
                    std::slice::from_raw_parts_mut(self.view_ptr.add(HEADER_SIZE), nv12_size);

                if is_privacy {
                    frame_dest[0..y_size].fill(16);
                    frame_dest[y_size..nv12_size].fill(128);
                } else {
                    let (y_plane, uv_plane) = frame_dest.split_at_mut(y_size);
                    let uv_base_ptr = uv_plane.as_mut_ptr() as usize;

                    y_plane
                        .par_chunks_mut(w)
                        .enumerate()
                        .for_each(|(y, y_row)| {
                            let rgba_row_start = y * w * 4;
                            let is_even_row = (y & 1) == 0;
                            let uv_row_start = (y / 2) * w;
                            let uv_ptr = uv_base_ptr as *mut u8;

                            for x in 0..w {
                                let idx = rgba_row_start + x * 4;
                                if idx + 2 < rgba.len() {
                                    let r = rgba[idx] as i32;
                                    let g = rgba[idx + 1] as i32;
                                    let b = rgba[idx + 2] as i32;

                                    y_row[x] = (((66 * r + 129 * g + 25 * b + 128) >> 8) + 16) as u8;

                                    if is_even_row && (x & 1) == 0 {
                                        let u_val =
                                            (((-38 * r - 74 * g + 112 * b + 128) >> 8) + 128) as u8;
                                        let v_val =
                                            (((112 * r - 94 * g - 18 * b + 128) >> 8) + 128) as u8;

                                        let uv_idx = uv_row_start + x;
                                        if uv_idx + 1 < nv12_size - y_size {
                                            *uv_ptr.add(uv_idx) = u_val;
                                            *uv_ptr.add(uv_idx + 1) = v_val;
                                        }
                                    }
                                }
                            }
                        });
                }

                let idx = self.write_index.fetch_add(1, Ordering::SeqCst);
                let header_slice = std::slice::from_raw_parts_mut(self.view_ptr, HEADER_SIZE);
                header_slice[8..12].copy_from_slice(&(w as u32).to_le_bytes());
                header_slice[12..16].copy_from_slice(&(h as u32).to_le_bytes());
                header_slice[20..24].copy_from_slice(&(idx + 1).to_le_bytes());

                let now_ticks = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_nanos() as u64;
                header_slice[24..32].copy_from_slice(&now_ticks.to_le_bytes());
                header_slice[32..36].copy_from_slice(&(nv12_size as u32).to_le_bytes());
                header_slice[36..40]
                    .copy_from_slice(&(if is_privacy { 1u32 } else { 0u32 }).to_le_bytes());

                SetEvent(self.event_handle);
            }
        }

        pub fn stop(&mut self) {
            self.is_broadcasting.store(false, Ordering::SeqCst);
            unsafe {
                if !self.view_ptr.is_null() {
                    UnmapViewOfFile(MEMORY_MAPPED_VIEW_ADDRESS {
                        Value: self.view_ptr as *mut _,
                    });
                    self.view_ptr = null_mut();
                }
                if self.mmf_handle != null_mut() {
                    CloseHandle(self.mmf_handle);
                    self.mmf_handle = null_mut();
                }
                if self.event_handle != null_mut() {
                    CloseHandle(self.event_handle);
                    self.event_handle = null_mut();
                }
            }
        }

        pub fn is_broadcasting(&self) -> bool {
            self.is_broadcasting.load(Ordering::Relaxed)
        }
    }

    impl Drop for VirtualCameraBridge {
        fn drop(&mut self) {
            self.stop();
        }
    }

    pub fn ensure_obs_safeguard() {
        if let Ok(app_data) = std::env::var("APPDATA") {
            let obs_txt = Path::new(&app_data).join("obs-virtualcam.txt");
            if !obs_txt.exists() {
                let _ = fs::write(obs_txt, "1920x1080x333333");
                println!("[Rust VCam] Created obs-virtualcam.txt safeguard.");
            }
        }
    }

    pub fn ensure_driver_registered(dll_path: &Path) -> bool {
        ensure_obs_safeguard();
        if dll_path.exists() {
            let status = Command::new("regsvr32.exe")
                .arg("/s")
                .arg(dll_path)
                .status();
            return status.map(|s| s.success()).unwrap_or(false);
        }
        false
    }
}

#[cfg(not(windows))]
mod imp {
    use std::path::Path;
    use std::sync::atomic::{AtomicBool, Ordering};

    pub struct VirtualCameraBridge {
        is_broadcasting: AtomicBool,
    }

    unsafe impl Send for VirtualCameraBridge {}
    unsafe impl Sync for VirtualCameraBridge {}

    impl VirtualCameraBridge {
        pub fn new() -> Self {
            Self {
                is_broadcasting: AtomicBool::new(false),
            }
        }

        pub fn start(&mut self, _width: u32, _height: u32) -> Result<(), String> {
            self.is_broadcasting.store(true, Ordering::SeqCst);
            Ok(())
        }

        pub fn push_rgba_frame(&self, _rgba: &[u8], _width: u32, _height: u32, _is_privacy: bool) {
            // macOS/Linux virtual camera stub
        }

        pub fn stop(&mut self) {
            self.is_broadcasting.store(false, Ordering::SeqCst);
        }

        pub fn is_broadcasting(&self) -> bool {
            self.is_broadcasting.load(Ordering::Relaxed)
        }
    }

    pub fn ensure_obs_safeguard() {}

    pub fn ensure_driver_registered(_dll_path: &Path) -> bool {
        false
    }
}

pub use imp::*;

pub type SharedVcamBridge = Arc<Mutex<VirtualCameraBridge>>;
