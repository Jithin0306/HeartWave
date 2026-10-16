// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(windows)]
    {
        unsafe {
            std::env::set_var(
                "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
                "--disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --enable-gpu-rasterization --enable-zero-copy --disable-direct-composition-video-overlays --js-flags=--max-old-space-size=96 --disk-cache-size=10485760",
            );
        }
    }
    app_lib::run();
}
