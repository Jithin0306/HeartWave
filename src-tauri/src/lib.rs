mod vcam;

use parking_lot::Mutex;
use serde::Serialize;
use std::sync::Arc;
use tauri::{
    AppHandle, Emitter, Manager, State, Window,
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
};
use vcam::{SharedVcamBridge, VirtualCameraBridge, ensure_driver_registered, ensure_obs_safeguard};

#[derive(Serialize)]
pub struct AppInfo {
    version: String,
    name: String,
    platform: String,
    arch: String,
}

#[derive(Serialize)]
pub struct VcamStatus {
    is_registered: bool,
    is_broadcasting: bool,
}

#[tauri::command]
fn get_app_info() -> AppInfo {
    AppInfo {
        version: env!("CARGO_PKG_VERSION").into(),
        name: "HeartWave".into(),
        platform: "win32".into(),
        arch: "x64".into(),
    }
}

#[tauri::command]
fn vcam_start(
    state: State<SharedVcamBridge>,
    width: Option<u32>,
    height: Option<u32>,
) -> Result<bool, String> {
    let mut bridge = state.lock();
    bridge.start(width.unwrap_or(1280), height.unwrap_or(720))?;
    Ok(true)
}

#[tauri::command]
fn vcam_stop(state: State<SharedVcamBridge>) -> bool {
    let mut bridge = state.lock();
    bridge.stop();
    true
}

#[tauri::command]
fn vcam_status(state: State<SharedVcamBridge>) -> VcamStatus {
    let bridge = state.lock();
    VcamStatus {
        is_registered: true,
        is_broadcasting: bridge.is_broadcasting(),
    }
}

#[tauri::command]
fn vcam_push_frame(
    state: State<SharedVcamBridge>,
    rgba: Vec<u8>,
    width: u32,
    height: u32,
    is_privacy: Option<bool>,
) {
    let bridge = state.lock();
    bridge.push_rgba_frame(&rgba, width, height, is_privacy.unwrap_or(false));
}

#[tauri::command]
fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn maximize_window(window: Window) -> Result<bool, String> {
    let is_max = window.is_maximized().unwrap_or(false);
    if is_max {
        window.unmaximize().map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        window.maximize().map_err(|e| e.to_string())?;
        Ok(true)
    }
}

#[tauri::command]
fn is_window_maximized(window: Window) -> bool {
    window.is_maximized().unwrap_or(false)
}

#[tauri::command]
fn close_window(window: Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. Windows EcoQoS & thread priority safeguard
    #[cfg(windows)]
    {
        use windows_sys::Win32::System::Power::{
            ES_CONTINUOUS, ES_SYSTEM_REQUIRED, SetThreadExecutionState,
        };
        use windows_sys::Win32::System::Threading::{
            ABOVE_NORMAL_PRIORITY_CLASS, GetCurrentProcess, SetPriorityClass,
        };
        unsafe {
            SetPriorityClass(GetCurrentProcess(), ABOVE_NORMAL_PRIORITY_CLASS);
            SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED);
        }
    }

    ensure_obs_safeguard();

    let shared_vcam: SharedVcamBridge = Arc::new(Mutex::new(VirtualCameraBridge::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(shared_vcam)
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Register DirectShow Virtual Camera DLL from resources/bin if present
            if let Ok(res_dir) = app.path().resource_dir() {
                let dll_path = res_dir.join("bin").join("HeartWaveCam.dll");
                if dll_path.exists() {
                    ensure_driver_registered(&dll_path);
                }
            }

            // System Tray Menu & Actions
            let quit_i = MenuItem::with_id(app, "quit", "Quit HeartWave", true, None::<&str>)?;
            let show_i =
                MenuItem::with_id(app, "show", "Show / Hide HeartWave", true, None::<&str>)?;
            let vcam_i =
                MenuItem::with_id(app, "vcam", "Toggle Virtual Camera", true, None::<&str>)?;
            let privacy_i =
                MenuItem::with_id(app, "privacy", "Toggle Privacy Shutter", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &vcam_i, &privacy_i, &quit_i])?;

            let icon = app.default_window_icon().cloned().unwrap();
            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .tooltip("HeartWave - Gesture Virtual Camera")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                    "vcam" => {
                        let _ = app.emit("hotkey:toggle-virtual-output", ());
                    }
                    "privacy" => {
                        let _ = app.emit("hotkey:toggle-privacy", ());
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            vcam_start,
            vcam_stop,
            vcam_status,
            vcam_push_frame,
            minimize_window,
            maximize_window,
            is_window_maximized,
            close_window,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
