// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(windows)]
    {
        unsafe {
            std::env::set_var(
                "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
                "--disable-background-timer-throttling \
                 --disable-backgrounding-occluded-windows \
                 --disable-renderer-backgrounding \
                 --enable-gpu-rasterization \
                 --enable-zero-copy \
                 --disable-direct-composition-video-overlays \
                 --enable-features=V8MemoryReducer \
                 --disable-features=SpareRendererForSitePerProcess,msWebOOUI,CalculateNativeWinOcclusion \
                 --disk-cache-size=2097152 \
                 --media-cache-size=2097152 \
                 --disable-domain-reliability \
                 --disable-component-update \
                 --disable-speech-api \
                 --disable-sync \
                 --disable-default-apps \
                 --renderer-process-limit=2 \
                 --process-per-site \
                 --js-flags=--max-old-space-size=128",
            );
        }
    }
    app_lib::run();
}
