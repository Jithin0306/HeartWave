# 💖 HeartWave

<p align="center">
  <strong>Real-Time Gesture-Powered Virtual Camera with 3D Cinematic Visual Effects & Mobile Webcam</strong>
</p>

<p align="center">
  <a href="https://github.com/Jithin0306/HeartWave/releases/latest">
    <img src="https://img.shields.io/github/v/release/Jithin0306/HeartWave?style=for-the-badge&color=e05260&label=Release" alt="Latest Release">
  </a>
  <img src="https://img.shields.io/badge/Engine-Rust%20%7C%20Tauri%20v2-DEA584?style=for-the-badge&logo=rust" alt="Rust Core">
  <img src="https://img.shields.io/badge/RAM-56%20MB-success?style=for-the-badge" alt="56 MB RAM">
  <img src="https://img.shields.io/badge/Virtual%20Camera-DirectShow%20Native-brightgreen?style=for-the-badge" alt="DirectShow Native">
  <img src="https://img.shields.io/badge/Mobile%20Cam-Zero%20Install-blue?style=for-the-badge" alt="Mobile Cam">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/Jithin0306/HeartWave/main/resources/screenshots/2_heartwave_hero_showcase.jpg" alt="HeartWave Hero Showcase" width="100%">
</p>

---

## 🌟 Overview

<p align="center">
  <img src="https://raw.githubusercontent.com/Jithin0306/HeartWave/main/resources/screenshots/1_heartwave_ui_dashboard.png" alt="HeartWave App Dashboard" width="100%">
</p>

**HeartWave** transforms your ordinary webcam or smartphone into an interactive, gesture-responsive virtual broadcast camera. Powered by Google MediaPipe AI running 100% locally on your machine with an ultra-lightweight native Rust engine (using only 56 MB of RAM), HeartWave detects your hand gestures in real time and renders procedural 3D visual effects directly onto your video feed.

The output streams seamlessly as **"Heartwave Virtual Camera"** into any Windows video software, including:
- **Discord Desktop**
- **OBS Studio**
- **Zoom**
- **Google Meet / Chrome**
- **Microsoft Teams**
- **WhatsApp Desktop**

---

## 📱 Use Mobile Phone as High-Definition Webcam

Don't have a high-end webcam? Turn your iPhone or Android phone into an ultra-low latency 1080p camera with **zero mobile app downloads**:

1. Click the **Mobile Cam** button in HeartWave.
2. Scan the randomly generated QR code with your phone's native camera.
3. Your mobile browser immediately streams 1080p video directly into HeartWave over **Fast Wi-Fi** or **Zero-Latency USB Cable**.
4. The QR modal on your PC automatically closes the second your phone connects!

---

## 🚀 Key Features

- **🤲 Sub-Millisecond Gesture Tracking**:
  - Real-time 21-point 3D hand landmark estimation powered by MediaPipe Vision WASM.
  - Dual-hand detection, predictive landmark smoothing, and adaptive gesture state machine.
- **✨ Procedural 3D Visual Effects**:
  - **Floating Hearts**: Interactive particles with physics and glow.
  - **3D Rose Bloom**: Organic petal blossoming triggered by pinch/heart gestures.
  - **Cupid Spark**: High-velocity romantic sparkles and trail rays.
  - **Twin Hands Heart**: Duo-palm tracking with synchronized aura.
  - **Petal Rain**: Ambient falling blossom petals with wind turbulence simulation.
- **🎥 Standalone Native DirectShow Virtual Camera**:
  - Custom C++ DirectShow filter (`HeartWaveCam.dll`) paired with a high-throughput shared memory bridge.
  - Zero dependencies on OBS Studio — works fully standalone.
- **🦀 Native Rust Engine (Tauri v2)**:
  - Supercharged with memory-mapped frame streaming, dropping RAM usage down to just **56 MB** and CPU usage under 3%.
- **🔔 Background Streaming & System Tray**:
  - Closing or minimizing the app parks HeartWave in the Windows System Tray without dropping frames in OBS or Discord.
- **⌨️ System-Wide Global Hotkeys**:
  - Control privacy, bypass mode, and virtual camera state even while gaming in full-screen.
- **🎵 Procedural Audio Feedback**:
  - Zero-dependency Web Audio API synthesizer generates real-time harmonious acoustic chimes upon gesture triggers.
- **🎨 6 Tailored Workspace Themes**:
  - *Black & Gold*, *Royal Ivory & Gold*, *Romantic Blush*, *Studio Neutral*, *Cyber Neon*, and *Midnight Slate* with authentic 3D typography.
- **🎬 AI Cinematic DSLR Background Blur & Green Screen**:
  - Offline GPU-accelerated human segmentation powered by Google MediaPipe.
  - Optical aperture presets: **f/1.4 Prime** (deep bokeh), **f/2.8 Studio** (natural portrait depth), **f/4.0 Soft-Focus**.
  - Built-in studio environments (*Luxury Penthouse*, *Modern Studio*, *Cyberpunk*, *Cafe*) + custom photo upload.
  - Pixel-perfect Chroma Green Screen (`#00FF00`) and Blue Screen (`#0000FF`) for OBS Studio and Discord.
- **🛡️ 100% Private & On-Device**:
  - Zero video frames or biometric data leave your computer. No cloud telemetry, no accounts required.
- **🔄 Built-In Auto-Updates**:
  - Instant in-app auto updates with cryptographic verification.

---

## 📥 Multi-Platform Downloads & Installation

HeartWave provides native binaries for Windows, macOS, and Linux:

| Platform | Format | Instructions |
| :--- | :--- | :--- |
| **Windows 10 / 11** | `.exe` Setup (NSIS) | Run `HeartWave_1.3.23_x64-setup.exe` to install to user profile with desktop & start menu shortcuts. |
| **Windows (Portable)** | `.exe` Standalone | Run `HeartWave-Portable.exe` anywhere — zero installation required. |
| **Windows Enterprise** | `.msi` Package | Run `HeartWave_1.3.23_x64_en-US.msi` for automated enterprise deployments. |
| **macOS (Intel & Apple Silicon)** | `.dmg` Disk Image | Open `HeartWave_1.3.23.dmg` and drag HeartWave into your `/Applications` folder. Grant Camera permissions in *System Settings → Privacy & Security → Camera*. |
| **macOS (App Bundle)** | `.app.tar.gz` | Extract and run `HeartWave.app`. |
| **Linux (Universal)** | `.AppImage` | Run `chmod +x HeartWave_1.3.23_amd64.AppImage` and double-click to launch on any modern distribution (Ubuntu, Fedora, Arch, Debian). |
| **Linux (Debian/Ubuntu)** | `.deb` Package | Run `sudo dpkg -i heartwave_1.3.23_amd64.deb` to install system-wide. |

> [!TIP]
> Download the latest releases directly from the [**GitHub Releases Page**](https://github.com/Jithin0306/HeartWave/releases/latest).

---

## 🎥 OBS Studio & Streaming Integration Guide

HeartWave is engineered with a high-performance **Zero-Copy Native IPC Bridge** that pushes raw binary video directly to DirectShow memory-mapped frames at a rock-solid 30–60 FPS with zero frame drops:

1. **Start HeartWave Virtual Camera**:
   - In HeartWave, toggle **"Start Virtual Camera"** (or press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd>).
2. **Add to OBS Studio**:
   - In OBS Studio, navigate to the **Sources** dock and click the **`+`** (Add) icon.
   - Select **Video Capture Device**.
   - Create a new source named *"HeartWave Camera"* and click **OK**.
   - In the Device dropdown, select **Heartwave Virtual Camera**.
   - Set *Resolution/FPS Type* to **Custom**, *Resolution* to **1280x720** (or **1920x1080**), and *FPS* to **30** or **60**.
   - Click **OK**.
3. **Low-Latency Streaming**:
   - Your real-time gesture-enhanced camera feed is now broadcasting directly in OBS without consuming excess CPU or GPU cycles!

---

## ⌨️ Global Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd> | **Toggle DSLR Blur** | Instantly toggles cinematic background blur on/off |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> | **Privacy Shutter** | Immediately blacks out the video feed |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> | **Bypass Mode** | Sends clean, raw camera feed with zero effects |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | **Toggle Virtual Camera** | Starts or stops the DirectShow video broadcast |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd> | **Toggle Mirror** | Horizontally flips the camera view |

---

## 🛠️ Tech Stack & Architecture

<p align="center">
  <img src="https://raw.githubusercontent.com/Jithin0306/HeartWave/main/resources/screenshots/3_heartwave_architecture_diagram.jpg" alt="HeartWave Architecture Diagram" width="100%">
</p>

```
[ Physical Webcam / Mobile Phone Browser ]
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
[ Native Rust Zero-Copy Shared Memory Bridge (Tauri v2) ]
                    │
                    ▼
[ C++ DirectShow Virtual Camera Filter (HeartWaveCam.dll) ]
                    │
                    ▼
[ Discord / OBS / Zoom / Teams / Chrome ]
```

- **Frontend**: React 18, TypeScript, CSS Design Tokens, Lucide Icons, Zustand
- **Desktop Runtime**: Tauri v2, Rust 2024, Webview2
- **Vision AI**: Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)
- **Native Video Pipeline**: C++ DirectShow BaseClasses Filter (`HeartWaveCam.dll`), Rust memory-mapped IPC bridge
- **Packaging & Delivery**: Tauri bundler, NSIS, MSI, Minisign signature verification

---

## 💻 Developer Setup & Building from Source

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
- [Rust & Cargo](https://rustup.rs/)
- Windows 10 or 11 (64-bit)

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
powershell -ExecutionPolicy Bypass -File .\scripts\build-release.ps1 -Version "1.3.16"
```

**macOS (.dmg & .app):**
```bash
chmod +x ./scripts/build-macos.sh
./scripts/build-macos.sh
```

**Linux (.AppImage & .deb):**
```bash
chmod +x ./scripts/build-linux.sh
./scripts/build-linux.sh
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
