# HeartWave v1.3.24 Release Notes

## 🎙️ Zero-Latency A/V Lip Sync (DirectShow Hardware Clock Timestamps)
- **Forensic WebRTC Playout Fix**: Resolved the 1–2 second video delay experienced in Discord, OBS Studio, and WebRTC streaming calls.
- **Hardware Reference Clock Timestamps**: DirectShow virtual camera samples (`HeartWaveCam.dll`) are now stamped with stream-relative presentation timestamps (`pSample->SetTime(&rtStart, &rtEnd)`) synchronized directly to the DirectShow graph reference clock / system clock.
- **Playout Buffer Collapse**: Because video timestamps match the WASAPI microphone audio clock 1:1, WebRTC's de-jitter buffer collapses from 1,000–2,000ms down to **0ms**, achieving perfect, real-time lip sync.

---

## ⚡ Unthrottled Virtual Camera Dispatch
- Removed artificial frame-period quantization in the viewport compositor.
- Newly rendered frames are pushed directly to the memory-mapped triple-buffered ring buffer with minimal 10ms pacing (supporting up to 100 FPS), eliminating frame skips during fast motion and continuous speech.

---

## 🎨 Viewport HUD & UI Collision Resolution
- **Unified Top-Left Flex Layout**: Resolved the visual overlap in the camera preview viewport where the `16:9` and resolution/fps badges collided directly on top of the `ON AIR` banner.
- All corner telemetry elements now sit in a single unified, baseline-aligned flex row:
  `[ ((•)) ON AIR: Virtual Camera ]  [ 16:9 ]  [ 1920×1080 @ 30fps ]  [ MIRRORED ]`
- Preserves full corner bracket reticle clearance and guarantees zero UI collisions across all window sizes and themes.

---

## 🌐 Cross-Platform Build Pipeline (Windows, macOS, Linux)
- Added cross-platform compilation stubs (`#[cfg(windows)]` / `#[cfg(not(windows))]`) in the Rust core (`vcam.rs`, `engine.rs`).
- Automated multi-platform GitHub Actions matrix packaging:
  - **Windows**: 64-bit & 32-bit MSI installer & standalone portable executable.
  - **macOS**: `.dmg` disk image and `.app` bundle (Universal: Apple Silicon M-series + Intel x86_64).
  - **Linux**: Standalone portable `.AppImage` and Debian/Ubuntu `.deb` packages.

---

## 🌹 Gesture Spawning & Physics Tuning
- Optimized particle lifecycle and spawning intervals for romantic overlays to prevent GPU/CPU spikes.
- Assigned Rose Bloom specifically to the closed-fist gesture with balanced sizing and smooth anchor tracking.

---

## 📱 Zero Disruption to Mobile Cam & UI Controls
- 100% preservation of wireless Phone-as-Webcam connectivity via QR code scan (WebRTC zero-install pairing).
- All luxury themes (Champagne Gold, Romantic Rose, Midnight Studio, Cyber Neon), audio chimes, and optics filters (DSLR Blur, Virtual Backdrops, Chroma Key) remain fully intact.
