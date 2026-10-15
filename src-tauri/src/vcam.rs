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
    const NUM_SLOTS: usize = 3;
    const MAX_SLOT_SIZE: usize = 1920 * 1080 * 4; // 8,294,400 bytes per slot
    const TOTAL_MMF_SIZE: usize = HEADER_SIZE + NUM_SLOTS * MAX_SLOT_SIZE;

    #[repr(C, packed)]
    pub struct HeartWaveSharedHeader {
        pub magic: u32,
        pub version: u32,
        pub width: u32,
        pub height: u32,
        pub format: u32,
        pub write_index: u32,
        pub timestamp: u64,
        pub frame_size: u32,
        pub is_privacy_muted: u32,
        pub num_slots: u32,
        pub slot_stride: u32,
        pub latest_slot_index: u32,
        pub requested_format: u32,
        pub consumer_active: u32,
        pub consumer_width: u16,
        pub consumer_height: u16,
    }

    pub struct VirtualCameraBridge {
        mmf_handle: HANDLE,
        view_ptr: *mut u8,
        event_handle: HANDLE,
        max_size: usize,
        width: u32,
        height: u32,
        write_index: AtomicU32,
        latest_slot: AtomicU32,
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
                latest_slot: AtomicU32::new(0),
                is_broadcasting: AtomicBool::new(false),
            }
        }

        pub fn start(&mut self, width: u32, height: u32) -> Result<(), String> {
            self.stop();

            self.width = width;
            self.height = height;

            let total_size = TOTAL_MMF_SIZE;
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

                let now_ticks = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_nanos() as u64;

                let yuy2_size = (width * height * 2) as u32;

                // Initialize Ring Buffer Header
                let header = &mut *(self.view_ptr as *mut HeartWaveSharedHeader);
                header.magic = HW_MAGIC;
                header.version = 2; // Version 2: triple-buffered ring buffer
                header.width = width;
                header.height = height;
                header.format = 2; // YUY2 by default for Discord
                header.write_index = 0;
                header.timestamp = now_ticks;
                header.frame_size = yuy2_size;
                header.is_privacy_muted = 0;
                header.num_slots = NUM_SLOTS as u32;
                header.slot_stride = MAX_SLOT_SIZE as u32;
                header.latest_slot_index = 0;
                header.requested_format = 2; // Default to YUY2
                header.consumer_active = 0;
                header.consumer_width = width as u16;
                header.consumer_height = height as u16;

                // Pre-fill all ring buffer slots with luxury dark standby video
                // so OBS Studio and Discord instantly latch onto video signal without black screen.
                for slot in 0..NUM_SLOTS {
                    let slot_offset = HEADER_SIZE + slot * MAX_SLOT_SIZE;
                    let slot_slice = std::slice::from_raw_parts_mut(
                        self.view_ptr.add(slot_offset),
                        (width * height * 2) as usize,
                    );
                    for chunk in slot_slice.chunks_exact_mut(4) {
                        chunk[0] = 26;  // Y0
                        chunk[1] = 132; // U
                        chunk[2] = 26;  // Y1
                        chunk[3] = 126; // V
                    }
                }

                self.latest_slot.store(0, Ordering::SeqCst);
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

            unsafe {
                let header = &*(self.view_ptr as *const HeartWaveSharedHeader);
                let req_format = header.requested_format;
                // If DirectShow requested NV12 (0), output NV12; otherwise default to native YUY2 (2) for Discord.
                let use_yuy2 = req_format != 0;

                let frame_size = if use_yuy2 {
                    w * h * 2
                } else {
                    w * h * 3 / 2
                };

                // Acquire next write slot in triple-buffered ring buffer
                let latest = self.latest_slot.load(Ordering::Acquire);
                let next_slot = (latest + 1) % (NUM_SLOTS as u32);
                let slot_offset = HEADER_SIZE + (next_slot as usize) * MAX_SLOT_SIZE;
                let frame_dest =
                    std::slice::from_raw_parts_mut(self.view_ptr.add(slot_offset), frame_size);

                if is_privacy {
                    if use_yuy2 {
                        for chunk in frame_dest.chunks_exact_mut(4) {
                            chunk[0] = 26;  // Y0
                            chunk[1] = 132; // U
                            chunk[2] = 26;  // Y1
                            chunk[3] = 126; // V
                        }
                    } else {
                        let y_size = w * h;
                        frame_dest[0..y_size].fill(16);
                        frame_dest[y_size..frame_size].fill(128);
                    }
                } else if use_yuy2 {
                    // Fast Direct RGBA -> YUY2 parallel conversion (Single-Pass Direct Pipeline)
                    // Eliminates intermediate RGBA -> NV12 -> YUY2 conversion overhead completely!
                    let row_stride = w * 2;
                    let chunk_rows = 48usize;
                    let chunk_len = row_stride * chunk_rows;

                    frame_dest
                        .par_chunks_mut(chunk_len)
                        .enumerate()
                        .for_each(|(chunk_idx, row_band)| {
                            let y_start = chunk_idx * chunk_rows;

                            for (local_y, yuy2_row) in row_band.chunks_exact_mut(row_stride).enumerate() {
                                let y = y_start + local_y;
                                if y >= h { break; }
                                let rgba_row_start = y * w * 4;

                                for x in (0..w).step_by(2) {
                                    let idx0 = rgba_row_start + x * 4;
                                    let idx1 = idx0 + 4;
                                    if idx1 + 2 < rgba.len() {
                                        let r0 = rgba[idx0] as i32;
                                        let g0 = rgba[idx0 + 1] as i32;
                                        let b0 = rgba[idx0 + 2] as i32;

                                        let r1 = rgba[idx1] as i32;
                                        let g1 = rgba[idx1 + 1] as i32;
                                        let b1 = rgba[idx1 + 2] as i32;

                                        let y0 = (((66 * r0 + 129 * g0 + 25 * b0 + 128) >> 8) + 16) as u8;
                                        let y1 = (((66 * r1 + 129 * g1 + 25 * b1 + 128) >> 8) + 16) as u8;

                                        let r_mid = (r0 + r1 + 1) >> 1;
                                        let g_mid = (g0 + g1 + 1) >> 1;
                                        let b_mid = (b0 + b1 + 1) >> 1;

                                        let u = (((-38 * r_mid - 74 * g_mid + 112 * b_mid + 128) >> 8) + 128) as u8;
                                        let v = (((112 * r_mid - 94 * g_mid - 18 * b_mid + 128) >> 8) + 128) as u8;

                                        let out_idx = x * 2;
                                        yuy2_row[out_idx] = y0;
                                        yuy2_row[out_idx + 1] = u;
                                        yuy2_row[out_idx + 2] = y1;
                                        yuy2_row[out_idx + 3] = v;
                                    }
                                }
                            }
                        });
                } else {
                    // Native NV12 parallel conversion (Direct single-pass for OBS NV12)
                    let y_size = w * h;
                    let (y_plane, uv_plane) = frame_dest.split_at_mut(y_size);
                    let uv_base_ptr = uv_plane.as_mut_ptr() as usize;

                    let chunk_rows = 16usize;
                    let chunk_len = w * chunk_rows;

                    y_plane
                        .par_chunks_mut(chunk_len)
                        .enumerate()
                        .for_each(|(chunk_idx, y_band)| {
                            let y_start = chunk_idx * chunk_rows;
                            let uv_ptr = uv_base_ptr as *mut u8;

                            for (local_y, y_row) in y_band.chunks_exact_mut(w).enumerate() {
                                let y = y_start + local_y;
                                if y >= h { break; }
                                let rgba_row_start = y * w * 4;
                                let is_even_row = (y & 1) == 0;
                                let uv_row_start = (y / 2) * w;

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
                                            if uv_idx + 1 < frame_size - y_size {
                                                *uv_ptr.add(uv_idx) = u_val;
                                                *uv_ptr.add(uv_idx + 1) = v_val;
                                            }
                                        }
                                    }
                                }
                            }
                        });
                }

                // Update Ring Buffer Metadata Atomically
                let idx = self.write_index.fetch_add(1, Ordering::SeqCst);
                let now_ticks = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_nanos() as u64;

                let header_mut = &mut *(self.view_ptr as *mut HeartWaveSharedHeader);
                header_mut.width = width;
                header_mut.height = height;
                header_mut.format = if use_yuy2 { 2 } else { 0 };
                header_mut.write_index = idx + 1;
                header_mut.timestamp = now_ticks;
                header_mut.frame_size = frame_size as u32;
                header_mut.is_privacy_muted = if is_privacy { 1 } else { 0 };
                header_mut.latest_slot_index = next_slot;

                self.latest_slot.store(next_slot, Ordering::Release);
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
        let mut ok = false;
        if dll_path.exists() {
            let status = Command::new("regsvr32.exe")
                .arg("/s")
                .arg(dll_path)
                .status();
            ok = status.map(|s| s.success()).unwrap_or(false);
        }

        // Also register 32-bit filter for 32-bit Discord, Zoom, and 32-bit browsers
        if let Some(parent) = dll_path.parent() {
            let dll32 = parent.join("HeartWaveCam32.dll");
            if dll32.exists() {
                let reg32_path = Path::new("C:\\Windows\\SysWOW64\\regsvr32.exe");
                let reg_cmd = if reg32_path.exists() {
                    reg32_path
                } else {
                    Path::new("regsvr32.exe")
                };
                let _ = Command::new(reg_cmd)
                    .arg("/s")
                    .arg(&dll32)
                    .status();
            }
        }
        ok
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
