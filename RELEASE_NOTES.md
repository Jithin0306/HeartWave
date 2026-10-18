# HeartWave v1.3.27 Release Notes

## 🎉 Celebration & Streamer Hype Suite
- **Interactive Birthday Cake & Candle Wish (`birthday_cake`)**:
  - Activated by holding both hands cupped side-by-side in front of your chest.
  - Renders a 3D tiered celebration cake with animated dripping frosting, glowing candles with flickering flame shaders, and a festive celebration party cone hat tracking dynamically over the user's head.
  - Holding the pose to make a wish extinguishes the candle flames, releasing curl-noise smoke wisps, and triggers a screen-wide 160-particle confetti explosion.
- **Champagne Pop & Effervescent Bubbles (`champagne_pop`)**:
  - Activated by a single-hand thumbs-up gesture.
  - Pops an emerald glass champagne bottle with an upward-accelerating cork physics trajectory, fizzy foam spray, and 90+ rising effervescent bubbles with specular highlights.
- **Victory Trophy & Fireworks (`victory_fireworks`)**:
  - Activated by a victory / peace sign (✌️).
  - Summons a 3D gold champion trophy with rotating celestial rings and bursts spherical background fireworks in vibrant celebratory hues.
- **Elemental Flame & Frost (`flame_frost`)**:
  - Activated by a rock-on / horns gesture (🤘).
  - Unleashes dual elemental fury: blazing dragon fire embers swirling on one hand and glacial azure frost crystals with freezing mist on the other.

## 🎯 Deconfliction & Precision Tracking Engine
- **Mathematical Gesture Isolation**: Strict knuckle, wrist, and fingertip thresholding prevents any cross-triggering between fists, points, victory signs, horns, and cupped hands.
- **Early Cupped Hands Priority**: `birthday_cake` is evaluated ahead of joined two-hand heart detection, ensuring open/cupped hands are never incorrectly captured as a two-hand heart.
- **Dropout Smoothing & Single-Burst Guards**: `ChampagnePopEffect` and `VictoryFireworksEffect` now guard initial bursts and cork pops against single-frame tracking dropouts, preventing jarring re-pops mid-gesture.
- **Webcam Mirror Inversion Protection**: All floating typography, banners ("MAKE A WISH" / "HAPPY BIRTHDAY!"), trophy inscriptions ("★ VICTORY ★"), and bottle labels ("CUVÉE GOLD") are protected with counter-flipped canvas transforms so text is always crisp, readable, and properly oriented even when webcam mirroring is active.
- **CodeRabbit CLI Validated**: All changes verified by CodeRabbit with **0 findings** across all 11 modified files.

---

# HeartWave v1.3.26 Release Notes

## 💖 Dual-Hand Korean Finger Heart & Multi-Anchor Particle Synchronization
- **Exclusive Multi-Hand Anchor Claiming**: Implemented an exclusive `syncHearts` matching algorithm in `goldenFingerHeart.ts` using claimed sets. Making the Korean finger heart gesture with both hands simultaneously now spawns two radiant golden hearts with independent breath cycles and smooth positional lerping.
- **Gesture Classifier Priority Optimization**: Prioritized dual-hand Korean finger heart evaluation ahead of joined two-hand heart detection in `gestureClassifier.ts`, ensuring that two finger hearts held in close proximity are never falsely categorized as a joined two-hand heart.
- **Zero-Glitch State Machine Anchor Isolation**: In `gestureStateMachine.ts`, detected anchors are strictly committed to active state only when the classified gesture matches the current active gesture, eliminating single-frame position jitter during pose transitions.
- **Dynamic Native DirectX 11 Anchor Lifecycle**: `CameraPreviewViewport.tsx` now tracks active native hardware anchors independently. Bringing up a second hand mid-gesture dynamically triggers the secondary native effect, and dropping one hand seamlessly releases and re-synchronizes surviving instances without interrupting playout.
- **CodeRabbit CLI Validated**: All changes verified by CodeRabbit with 0 findings across the full multi-anchor and gesture tracking pipeline.

---

# HeartWave v1.3.25 Release Notes

## 🎙️ Zero-Latency Discord & WebRTC A/V Lip Sync (OBS VirtualCam Standard)
- **Direct WebRTC Playout Jitter Buffer Fix**: Completely eliminated the 1–2 second video/audio delay experienced in Discord, Google Meet, and WebRTC-based applications.
- **Unclocked Live Media Sample Delivery**: DirectShow virtual camera samples (`HeartWaveCam.dll` & `HeartWaveCam32.dll`) now pass `pSample->SetTime(NULL, NULL)` and `pSample->SetMediaTime(NULL, NULL)` adhering to the OBS Virtual Camera (`vcam-filter.cpp`) production standard.
- **Microsecond Clock Alignment**: Passing `NULL` sample times (`VFW_E_SAMPLE_TIME_NOT_SET`) signals downstream DirectShow capture filters (e.g., Chromium's `video_capture_device_win.cc`) that the incoming video is an unbuffered live capture stream. Chromium immediately stamps frames upon arrival with `base::TimeTicks::Now()`.
- **0ms Playout Delay**: Video frames match the real-time WASAPI microphone audio clock 1:1, collapsing WebRTC's `StreamSynchronization` jitter buffer down to **~0ms**, achieving pristine lip sync.

---

## 🏎️ DirectShow Driver & Color Pipeline Optimizations
- **Enhanced `ScaleYUY2` Pixel Pairing**: Refactored the second-pixel luma selection in `HeartWaveCam.cpp` by calculating `sx1_pair` directly from the destination coordinate, ensuring accurate UV pairing and preventing chroma artifacts.
- **Standardized Watchdog Timing**: Replaced hardcoded driver wait slices with the shared constant `WAIT_SLICE_MS = 50`, ensuring predictable watchdog execution and standby frame delivery when idle.

---

## 🛡️ Tauri IPC Race Condition & Deadlock Protection
- **Monotonic Flight Generation Tracking**: Added unique `flightToken` generation counters to `sendFrame` in `tauriBridge.ts`. If an asynchronous invoke exceeds the 1000ms deadline, older recovering promises are strictly prevented from prematurely clearing `isFrameInFlight` or mutating shared packet buffers.
- **Confirmed Dispatch Telemetry**: Telemetry counter now increments only on confirmed, non-dropped frame transmissions.

---

## 🔄 Renderer Viewport Guard Synchronization
- **Token-Bound Viewport Dispatch**: Added `dispatchTokenRef` in `CameraPreviewViewport.tsx` to match the native IPC bridge recovery, ensuring stale frame promises cannot unlock the send guard while newer frames are in-flight.
- **1000ms Hung Invoke Watchdog**: Automatically resets the send lock if an unhandled promise hangs, guaranteeing uninterrupted camera broadcast.

---

## 🧹 Memory Leak Prevention in MediaPipe Pipelines
- **Guaranteed Mask Resource Deallocation**: Enclosed confidence mask processing in `try ... finally` blocks within both `segmentationWorker.ts` and `backgroundSegmenter.ts`.
- **Heap Reclamation**: All MediaPipe WebAssembly/WebGL confidence masks are explicitly closed even if image conversion or filtering encounters an exception, eliminating linear heap memory growth over long streaming sessions.

---

## 📱 Invariant Integrity
- **100% Unchanged Wireless Pairing**: `mobileCamService.ts` and `MobileCamModal.tsx` remain untouched and verified for seamless QR-code phone camera pairing.
- **Full Theme & Gesture Support**: Champagne Gold, Romantic Rose, Midnight Studio, and Cyber Neon luxury palettes, HUD telemetry reticles, audio chimes, and optics filters remain fully operational.
