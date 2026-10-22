# 🌊 HeartWave

<p align="center">
  <strong>Next-Gen AI Virtual Camera Studio with Real-Time Hand Gesture Reactions, DSLR Optics, Wireless Phone Cam & Cinematic Streaming Effects</strong>
</p>

<p align="center">
  <a href="https://github.com/Jithin0306/HeartWave/releases/latest">
    <img src="https://img.shields.io/github/v/release/Jithin0306/HeartWave?style=for-the-badge&color=e05260&label=Release" alt="Latest Release">
  </a>
  <img src="https://img.shields.io/badge/Engine-Rust%20%7C%20Tauri%20v2-DEA584?style=for-the-badge&logo=rust" alt="Rust Core">
  <img src="https://img.shields.io/badge/RAM-56%20MB-success?style=for-the-badge" alt="56 MB RAM">
  <img src="https://img.shields.io/badge/Virtual%20Camera-DirectShow%20Native-brightgreen?style=for-the-badge" alt="DirectShow Native">
  <img src="https://img.shields.io/badge/Mobile%20Cam-Zero%20Install-blue?style=for-the-badge" alt="Mobile Cam">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-9cf?style=for-the-badge" alt="Multi-Platform">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/Jithin0306/HeartWave/main/resources/screenshots/heartwave_showcase_demo.gif" alt="HeartWave Launch Showcase" width="100%">
</p>

---

## 🌟 Overview

<p align="center">
  <img src="https://raw.githubusercontent.com/Jithin0306/HeartWave/main/resources/screenshots/1_heartwave_ui_dashboard.png" alt="HeartWave App Dashboard" width="100%">
</p>

**HeartWave** is an all-in-one AI virtual camera studio designed for **streamers, content creators, remote professionals, and everyday callers**. It transforms any standard webcam or smartphone into an interactive broadcast camera with real-time hand gesture tracking, studio-grade DSLR depth-of-field bokeh, virtual studio backdrops, and 3D visual reactions.

Powered by Google MediaPipe AI running 100% locally on your machine with an ultra-lightweight native Rust engine (consuming only **56 MB of RAM**), HeartWave detects your hand gestures and body posture in real time with zero cloud telemetry.

The virtual video output streams seamlessly as **"Heartwave Virtual Camera"** into any video platform with zero configuration:
- 🎮 **Gaming & Social**: Discord Desktop, WhatsApp Desktop, VRChat
- 🎙️ **Streaming & Content Creation**: OBS Studio, Streamlabs, Twitch Studio, vMix
- 💼 **Remote Work & Meetings**: Zoom, Google Meet (Chrome), Microsoft Teams, Slack Huddles

---

## 🚀 What Makes HeartWave Different?

### 1. 🎙️ Perfect Audio/Video Lip Sync (DirectShow Reference Clock Timestamps)
Unlike generic virtual cameras that suffer from 1–2 second video buffering delays in Discord or WebRTC, HeartWave's custom DirectShow driver stamps every video sample with monotonic stream-time timestamps aligned with the Windows reference clock. This collapses WebRTC's playout de-jitter buffer from 2,000ms down to **0ms**, guaranteeing perfectly lip-synced video and audio in every call.

### 2. 📱 Wireless Smartphone as 1080p Webcam (Zero App Install)
Turn any iPhone or Android phone into an ultra-low latency wireless webcam without downloading anything from an app store:
1. Click **Phone as Cam** in HeartWave.
2. Scan the on-screen QR code with your phone's native camera.
3. Your mobile browser immediately connects via WebRTC over local Wi-Fi or USB cable.
4. Access phone camera controls directly from your PC: rear/front lens switching, flash torch toggle, and optical zoom slider.

### 3. 🎬 AI DSLR Portrait Optics & Green Screen
- **Dual-Pass Bokeh Blur**: Real-time human segmentation with optical aperture presets: **f/1.4 Prime** (deep creamy bokeh), **f/2.8 Studio** (natural portrait depth), and **f/4.0 Soft-Focus**.
- **Virtual Studio Backdrops**: Instant virtual environments (*Luxury Penthouse*, *Modern Studio*, *Cyberpunk Haven*, *Warm Cafe*) or upload your own custom photo.
- **Pixel-Perfect Chroma Key**: Integrated green screen (`#00FF00`) and blue screen (`#0000FF`) modes for OBS streaming without physical backdrops.

### 4. ✨ Real-Time Hand Gesture Reactions & Physics
- **Sub-millisecond 21-point 3D hand tracking** powered by MediaPipe Vision WASM with dual-hand detection and predictive landmark smoothing.
- **Organic Visual Reactions**:
  - **Fist Gesture**: Procedural 3D Rose blossoming with dynamic petal physics.
  - **Finger Heart / Pinch**: Floating glowing heart particles with ambient drift.
  - **Cupid Spark**: High-velocity romantic sparkles and luminous trail rays.
  - **Twin Hands Heart**: Duo-palm tracking with synchronized champagne aura.
  - **Petal Rain**: Ambient blossom petals with turbulent wind simulation.
- **Harmonious Audio Chimes**: Synthesized acoustic audio feedback accompanies each gesture trigger in real time.

### 5. ⚡ Ultra-Lightweight Rust Architecture (56 MB RAM)
- Built on **Tauri v2 + Rust 2024** using a zero-copy triple-buffered shared memory bridge (MMF).
- Drops memory consumption to just **56 MB RAM** (vs 500 MB+ in Electron apps) and keeps CPU usage under 3%.
- Dedicated background worker ensures uninterrupted 30–60 FPS streaming even when minimized to the Windows System Tray.

---

## 📥 Multi-Platform Downloads

HeartWave provides native binaries for Windows, macOS, and Linux:

| Platform | Format | Details |
| :--- | :--- | :--- |
| **Windows 10 / 11** | `.exe` Setup (NSIS) | Full installer with start menu and desktop shortcuts. |
| **Windows (Portable)** | `.exe` Standalone | Portable zero-install executable — run from any folder or USB drive. |
| **Windows Enterprise** | `.msi` Package | Silent enterprise installation package. |
| **macOS (Apple Silicon & Intel)** | `.dmg` Disk Image | Native Universal macOS app bundle (drag-and-drop install). |
| **Linux (Universal)** | `.AppImage` | Standalone executable for Ubuntu, Fedora, Debian, Arch. |
| **Linux (Debian/Ubuntu)** | `.deb` Package | Standard Debian package (`sudo dpkg -i heartwave_*.deb`). |

> [!TIP]
> Download the latest releases directly from the [**GitHub Releases Page**](https://github.com/Jithin0306/HeartWave/releases/latest).

---

## 🎮 Discord Integration Guide (0ms Playout Delay)

Standard virtual cameras suffer from **1,000–2,000ms video lag** in Discord because Discord's WebRTC engine expands its jitter buffer when timestamps jitter or drift. HeartWave solves this at the driver level: our custom DirectShow filter writes monotonic stream-time timestamps aligned with the Windows reference clock, collapsing Discord's playout de-jitter buffer down to **0ms**.

### 30-Second Setup in Discord:

1. **Activate HeartWave Virtual Output**:
   - In HeartWave, click **"Start Virtual Output"** (or press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd>).
2. **Open Discord Video Settings**:
   - In Discord Desktop, click the **Gear Icon (⚙️ User Settings)** in the lower left corner.
   - Under **App Settings**, select **Voice & Video**.
3. **Select Heartwave Virtual Camera**:
   - Scroll down to **Video Settings**.
   - Under the **Camera** dropdown, select **"Heartwave Virtual Camera"**.
   - Click **Test Video** to preview your real-time hand gestures, bokeh optics, and virtual studio backdrops.
4. **Enjoy Instant Lip-Sync**:
   - Join any voice channel, stream in server channels, or start direct video calls with zero lip-sync delay!

---

## 🎥 OBS Studio & Streaming Integration Guide

HeartWave is engineered with a high-performance **Zero-Copy Native IPC Bridge** that pushes raw binary video directly to DirectShow memory-mapped frames at a rock-solid 30–60 FPS:

1. **Start HeartWave Virtual Camera**:
   - In HeartWave, click **"Start Virtual Output"** (or press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd>).
2. **Add to OBS Studio**:
   - In OBS Studio, go to the **Sources** dock and click **`+`** (Add).
   - Select **Video Capture Device**.
   - Name it *"HeartWave Camera"* and click **OK**.
   - In the Device dropdown, select **Heartwave Virtual Camera**.
   - Set *Resolution/FPS Type* to **Custom**, *Resolution* to **1280x720** (or **1920x1080**), and *FPS* to **30** or **60**.
   - Click **OK**.
3. **Live Broadcast**:
   - Your real-time gesture-enhanced feed is now live in OBS with zero latency and perfect lip sync!

---

## ⌨️ Global Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd> | **Toggle DSLR Blur** | Instantly toggles cinematic background blur on/off |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> | **Privacy Shutter** | Immediately blacks out the video feed with branded slate |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> | **Bypass Mode** | Sends clean, raw camera feed with zero effects |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | **Toggle Virtual Output** | Starts or stops the DirectShow video broadcast |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd> | **Toggle Mirror** | Horizontally flips the camera view |

---

## 🛠️ Architecture & Tech Stack

```
[ Physical Webcam / Mobile Phone Browser (WebRTC) ]
                     │
                     ▼
[ MediaPipe Vision WASM (Local 21-3D Landmarks) ]
                     │
                     ▼
[ Gesture State Machine & Predictive Smoother ]
                     │
                     ▼
[ Canvas 2D / WebGL Procedural Compositor ] ──► [ Web Audio Synthesizer ]
                     │
                     ▼
[ Native Rust Zero-Copy Shared Memory Ring Buffer (Tauri v2) ]
                     │
                     ▼
[ C++ DirectShow Virtual Camera Filter (HeartWaveCam.dll) ]
                     │
                     ▼
[ Discord / OBS / Zoom / Teams / Google Meet ]
```

- **Frontend**: React 18, TypeScript, CSS Design Tokens, Lucide Icons, Zustand
- **Desktop Runtime**: Tauri v2, Rust 2024, Webview2
- **Vision AI**: Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)
- **Native Video Pipeline**: C++ DirectShow BaseClasses Filter (`HeartWaveCam.dll`), Rust memory-mapped IPC bridge
- **Packaging & Delivery**: Tauri bundler, NSIS, MSI, DMG, AppImage, DEB

---

## 💻 Developer Setup & Building from Source

### Prerequisites
- [Node.js 20+](https://nodejs.org/)
- [Rust & Cargo](https://rustup.rs/) (edition 2024)
- Windows 10/11, macOS, or Linux

### Installation
```bash
# Clone the repository
git clone https://github.com/Jithin0306/HeartWave.git
cd HeartWave

# Install dependencies
npm install
```

### Running in Development
```bash
npm run dev
```

### Production Build & Packaging

**Windows (NSIS Setup, Portable EXE & MSI):**
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-release.ps1 -Version "1.3.25"
```

**Tauri Multi-Platform Build:**
```bash
npx tauri build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
