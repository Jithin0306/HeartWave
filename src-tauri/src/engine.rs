#[cfg(windows)]
mod imp {
    use std::ffi::{c_char, CString};
    use std::path::{Path, PathBuf};
    use std::ptr::null_mut;
    use std::sync::atomic::{AtomicBool, Ordering};
    use windows_sys::Win32::Foundation::{HMODULE, HANDLE};
    use windows_sys::Win32::System::LibraryLoader::{GetProcAddress, LoadLibraryW};

    unsafe extern "system" {
        fn FreeLibrary(hLibModule: HMODULE) -> i32;
    }

    type FnInitialize = unsafe extern "C" fn(width: u32, height: u32) -> bool;
    type FnUpdate = unsafe extern "C" fn(dt: f32);
    type FnRender = unsafe extern "C" fn();
    type FnTriggerEffect = unsafe extern "C" fn(effect_id: *const c_char, anchor_x: f32, anchor_y: f32, confidence: f32);
    type FnUpdateEffectAnchor = unsafe extern "C" fn(effect_id: *const c_char, anchor_x: f32, anchor_y: f32);
    type FnReleaseEffect = unsafe extern "C" fn(effect_id: *const c_char);
    type FnPushRgbaFrame = unsafe extern "C" fn(p_rgba: *const u8, width: u32, height: u32, is_mirrored: bool) -> bool;
    #[allow(dead_code)]
    type FnGetSharedTextureHandle = unsafe extern "C" fn() -> HANDLE;
    type FnShutdown = unsafe extern "C" fn();

    pub struct NativeEngine {
    h_module: HMODULE,
    fn_init: FnInitialize,
    fn_update: FnUpdate,
    fn_render: FnRender,
    fn_trigger: FnTriggerEffect,
    fn_update_anchor: FnUpdateEffectAnchor,
    fn_release: FnReleaseEffect,
    fn_push_rgba: FnPushRgbaFrame,
    fn_shutdown: FnShutdown,
    is_running: AtomicBool,
}

unsafe impl Send for NativeEngine {}
unsafe impl Sync for NativeEngine {}

impl NativeEngine {
    pub fn try_load() -> Option<Self> {
        let candidates: Vec<PathBuf> = {
            let mut list = Vec::new();
            if let Ok(exe) = std::env::current_exe() {
                if let Some(dir) = exe.parent() {
                    list.push(dir.join("HeartWaveEngine.dll"));
                    list.push(dir.join("resources").join("bin").join("HeartWaveEngine.dll"));
                    list.push(dir.join("bin").join("HeartWaveEngine.dll"));
                }
            }
            list.push(PathBuf::from("resources/bin/HeartWaveEngine.dll"));
            list.push(PathBuf::from("HeartWaveEngine.dll"));
            list
        };

        for path in candidates {
            if path.exists() {
                if let Some(engine) = Self::load_from_path(&path) {
                    log::info!("[NativeEngine] Successfully loaded DirectX 11 engine from {:?}", path);
                    return Some(engine);
                }
            }
        }

        log::warn!("[NativeEngine] HeartWaveEngine.dll not found; using SIMD fallback pipeline.");
        None
    }

    fn load_from_path(path: &Path) -> Option<Self> {
        let path_str = path.to_str()?;
        let wide: Vec<u16> = path_str.encode_utf16().chain(std::iter::once(0)).collect();

        unsafe {
            let h_mod = LoadLibraryW(wide.as_ptr());
            if h_mod == null_mut() {
                return None;
            }

            macro_rules! get_fn {
                ($name:expr, $type:ty) => {{
                    let c_name = concat!($name, "\0");
                    let proc = GetProcAddress(h_mod, c_name.as_ptr());
                    if proc.is_none() {
                        log::error!("[NativeEngine] Missing symbol: {}", $name);
                        FreeLibrary(h_mod);
                        return None;
                    }
                    std::mem::transmute::<_, $type>(proc.unwrap())
                }};
            }

            let fn_init = get_fn!("HeartWaveEngine_Initialize", FnInitialize);
            let fn_update = get_fn!("HeartWaveEngine_Update", FnUpdate);
            let fn_render = get_fn!("HeartWaveEngine_Render", FnRender);
            let fn_trigger = get_fn!("HeartWaveEngine_TriggerEffect", FnTriggerEffect);
            let fn_update_anchor = get_fn!("HeartWaveEngine_UpdateEffectAnchor", FnUpdateEffectAnchor);
            let fn_release = get_fn!("HeartWaveEngine_ReleaseEffect", FnReleaseEffect);
            let fn_push_rgba = get_fn!("HeartWaveEngine_PushRgbaFrame", FnPushRgbaFrame);
            let fn_shutdown = get_fn!("HeartWaveEngine_Shutdown", FnShutdown);

            Some(Self {
                h_module: h_mod,
                fn_init,
                fn_update,
                fn_render,
                fn_trigger,
                fn_update_anchor,
                fn_release,
                fn_push_rgba,
                fn_shutdown,
                is_running: AtomicBool::new(false),
            })
        }
    }

    pub fn initialize(&self, width: u32, height: u32) -> bool {
        let ok = unsafe { (self.fn_init)(width, height) };
        self.is_running.store(ok, Ordering::SeqCst);
        ok
    }

    pub fn update(&self, dt: f32) {
        if self.is_running.load(Ordering::Relaxed) {
            unsafe { (self.fn_update)(dt) };
        }
    }

    pub fn render(&self) {
        if self.is_running.load(Ordering::Relaxed) {
            unsafe { (self.fn_render)() };
        }
    }

    pub fn trigger_effect(&self, effect_id: &str, x: f32, y: f32, confidence: f32) {
        if let Ok(c_str) = CString::new(effect_id) {
            unsafe { (self.fn_trigger)(c_str.as_ptr(), x, y, confidence) };
        }
    }

    pub fn update_effect_anchor(&self, effect_id: &str, x: f32, y: f32) {
        if let Ok(c_str) = CString::new(effect_id) {
            unsafe { (self.fn_update_anchor)(c_str.as_ptr(), x, y) };
        }
    }

    pub fn release_effect(&self, effect_id: &str) {
        if let Ok(c_str) = CString::new(effect_id) {
            unsafe { (self.fn_release)(c_str.as_ptr()) };
        }
    }

    pub fn push_rgba_frame(&self, rgba: &[u8], width: u32, height: u32, is_mirrored: bool) -> bool {
        if self.is_running.load(Ordering::Relaxed) {
            let ok = unsafe { (self.fn_push_rgba)(rgba.as_ptr(), width, height, is_mirrored) };
            if ok {
                self.update(0.016);
                self.render();
            }
            ok
        } else {
            false
        }
    }

    pub fn shutdown(&self) {
        self.is_running.store(false, Ordering::SeqCst);
        unsafe { (self.fn_shutdown)() };
    }
}

impl Drop for NativeEngine {
    fn drop(&mut self) {
        self.shutdown();
        if self.h_module != null_mut() {
            unsafe { FreeLibrary(self.h_module) };
        }
    }
}
}

#[cfg(not(windows))]
mod imp {
    pub struct NativeEngine;

    impl NativeEngine {
        pub fn try_load() -> Option<Self> {
            None
        }

        pub fn initialize(&self, _width: u32, _height: u32) -> bool {
            false
        }

        pub fn update(&self, _dt: f32) {}

        pub fn render(&self) {}

        pub fn trigger_effect(&self, _effect_id: &str, _x: f32, _y: f32, _confidence: f32) {}

        pub fn update_effect_anchor(&self, _effect_id: &str, _x: f32, _y: f32) {}

        pub fn release_effect(&self, _effect_id: &str) {}

        pub fn push_rgba_frame(&self, _rgba: &[u8], _width: u32, _height: u32, _is_mirrored: bool) -> bool {
            false
        }

        pub fn shutdown(&self) {}
    }
}

pub use imp::*;
use std::sync::Arc;
use parking_lot::Mutex;

pub type SharedNativeEngine = Arc<Mutex<Option<NativeEngine>>>;
