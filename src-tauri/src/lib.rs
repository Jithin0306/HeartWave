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
        platform: std::env::consts::OS.into(),
        arch: std::env::consts::ARCH.into(),
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

#[derive(serde::Deserialize)]
pub struct PushFramePayload {
    pub base64: Option<String>,
    pub rgba: Option<Vec<u8>>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    #[serde(rename = "isPrivacy")]
    pub is_privacy: Option<bool>,
}

#[tauri::command]
fn vcam_push_frame(
    state: State<SharedVcamBridge>,
    payload: PushFramePayload,
) -> Result<(), String> {
    let width = payload.width.unwrap_or(1280);
    let height = payload.height.unwrap_or(720);
    let is_privacy = payload.is_privacy.unwrap_or(false);

    let bridge = state.lock();

    if let Some(b64) = payload.base64 {
        use base64::Engine;
        if let Ok(bytes) = base64::engine::general_purpose::STANDARD.decode(b64) {
            bridge.push_rgba_frame(&bytes, width, height, is_privacy);
            return Ok(());
        }
    } else if let Some(rgba) = payload.rgba {
        bridge.push_rgba_frame(&rgba, width, height, is_privacy);
        return Ok(());
    }

    Ok(())
}

#[tauri::command]
fn vcam_push_frame_raw(
    request: tauri::ipc::Request<'_>,
    state: State<SharedVcamBridge>,
) -> Result<(), String> {
    let width = request
        .headers()
        .get("x-width")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.parse::<u32>().ok())
        .unwrap_or(1280);
    let height = request
        .headers()
        .get("x-height")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.parse::<u32>().ok())
        .unwrap_or(720);
    let is_privacy = request
        .headers()
        .get("x-privacy")
        .and_then(|v| v.to_str().ok())
        .map(|v| v == "true")
        .unwrap_or(false);

    let bridge = state.lock();

    match request.body() {
        tauri::ipc::InvokeBody::Raw(bytes) => {
            bridge.push_rgba_frame(bytes, width, height, is_privacy);
        }
        tauri::ipc::InvokeBody::Json(json) => {
            if let Some(arr) = json.as_array() {
                let bytes: Vec<u8> = arr.iter().filter_map(|v| v.as_u64().map(|n| n as u8)).collect();
                bridge.push_rgba_frame(&bytes, width, height, is_privacy);
            } else if let Some(obj) = json.as_object() {
                if let Some(b64) = obj.get("base64").and_then(|v| v.as_str()) {
                    use base64::Engine;
                    if let Ok(bytes) = base64::engine::general_purpose::STANDARD.decode(b64) {
                        bridge.push_rgba_frame(&bytes, width, height, is_privacy);
                    }
                } else if let Some(arr) = obj.get("rgba").and_then(|v| v.as_array()) {
                    let bytes: Vec<u8> = arr.iter().filter_map(|v| v.as_u64().map(|n| n as u8)).collect();
                    bridge.push_rgba_frame(&bytes, width, height, is_privacy);
                }
            }
        }
    }
    Ok(())
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
fn close_window(
    _app: AppHandle,
    window: Window,
    _state: State<SharedVcamBridge>,
) -> Result<(), String> {
    // Minimize to System Tray when close (X) is clicked so streaming continues in background!
    // To quit completely, user right-clicks tray icon -> "Quit HeartWave".
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn relaunch_app(app: AppHandle) {
    app.restart();
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
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_icon(icon.clone());
            }
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
            vcam_push_frame_raw,
            minimize_window,
            maximize_window,
            is_window_maximized,
            close_window,
            quit_app,
            relaunch_app
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_vcam_bridge() {
        let mut bridge = crate::vcam::VirtualCameraBridge::new();
        let res = bridge.start(1280, 720);
        assert!(res.is_ok());
        let frame = vec![128u8; 1280 * 720 * 4];
        bridge.push_rgba_frame(&frame, 1280, 720, false);
        assert!(bridge.is_broadcasting());
    }
}

