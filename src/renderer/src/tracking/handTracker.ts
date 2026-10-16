import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { TrackedHand, GestureEvent, Point3D } from '../types/gesture';
import { LandmarkSmoother } from './landmarkSmoother';
import { GestureClassifier } from './gestureClassifier';
import { GestureStateMachine } from './gestureStateMachine';

export class HandTracker {
  // Dedicated Web Worker for asynchronous background AI inference
  // Decoupled from the main render loop so 60 FPS compositing & virtual camera are NEVER stalled!
  private worker: Worker | null = null;
  private isWorkerReady: boolean = false;
  private isWorkerBusy: boolean = false;

  // Fallback main-thread instance if Worker fails or is unsupported
  private fallbackLandmarker: HandLandmarker | null = null;
  private fallbackSmoother: LandmarkSmoother = new LandmarkSmoother(0.55);
  private fallbackClassifier: GestureClassifier = new GestureClassifier();
  private fallbackStateMachine: GestureStateMachine = new GestureStateMachine(0.22, 0.8);
  private trackingCanvas: HTMLCanvasElement | null = null;
  private trackingCtx: CanvasRenderingContext2D | null = null;

  private isInitializing: boolean = false;
  private isReady: boolean = false;
  private lastResult: { gestureEvent: GestureEvent; smoothedHands: TrackedHand[] } | null = null;
  private lastSmoothedHands: TrackedHand[] = [];
  private lastTimestamp: number = 0;

  /**
   * Initialize MediaPipe HandLandmarker.
   * Priority: Dedicated Web Worker with GPU/CPU acceleration.
   * Fallback: Synchronous main thread with 320x180 hardware downscaler.
   */
  async initialize(): Promise<void> {
    if (this.isReady || this.isInitializing) return;
    this.isInitializing = true;

    try {
      // 1. Attempt offloading to dedicated Web Worker
      const workerInitPromise = new Promise<boolean>((resolve) => {
        try {
          const worker = new Worker(new URL('./handTrackingWorker.ts', import.meta.url), {
            type: 'module',
          });

          const timeout = setTimeout(() => {
            console.warn('[HandTracker] Worker initialization timed out, falling back to main-thread landmarker');
            resolve(false);
          }, 8000);

          worker.onmessage = (e: MessageEvent) => {
            const data = e.data;
            if (data?.type === 'init_ok') {
              clearTimeout(timeout);
              this.isWorkerReady = true;
              console.log('[HandTracker] Dedicated Web Worker initialized on delegate:', data.delegate);
              resolve(true);
            } else if (data?.type === 'init_err') {
              clearTimeout(timeout);
              console.warn('[HandTracker] Worker init error, falling back:', data.error);
              resolve(false);
            } else if (data?.type === 'result') {
              this.lastResult = {
                gestureEvent: data.gestureEvent,
                smoothedHands: data.smoothedHands || [],
              };
              this.lastSmoothedHands = data.smoothedHands || [];
              this.isWorkerBusy = false;
            } else if (data?.type === 'result_err') {
              this.isWorkerBusy = false;
            }
          };

          worker.onerror = (wErr) => {
            console.warn('[HandTracker] Worker thread error, falling back:', wErr);
            clearTimeout(timeout);
            resolve(false);
          };

          worker.postMessage({ type: 'init' });
          this.worker = worker;
        } catch (workerSpawnErr) {
          console.warn('[HandTracker] Worker spawn failed, falling back:', workerSpawnErr);
          resolve(false);
        }
      });

      const workerOk = await workerInitPromise;

      if (workerOk) {
        this.isReady = true;
        return;
      }

      // 2. Fallback: Initialize main-thread landmarker with 320x180 downscaler
      console.log('[HandTracker] Initializing fallback main-thread HandLandmarker...');
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks('./wasm');
      } catch {
        try {
          vision = await FilesetResolver.forVisionTasks('/wasm');
        } catch {
          vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );
        }
      }

      try {
        this.fallbackLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: './models/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.50,
          minHandPresenceConfidence: 0.50,
          minTrackingConfidence: 0.50,
        });
      } catch (gpuErr) {
        console.warn('[HandTracker] Fallback GPU delegate failed, trying CPU:', gpuErr);
        this.fallbackLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: './models/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.50,
          minHandPresenceConfidence: 0.50,
          minTrackingConfidence: 0.50,
        });
      }

      this.trackingCanvas = document.createElement('canvas');
      this.trackingCanvas.width = 320;
      this.trackingCanvas.height = 180;
      this.trackingCtx = this.trackingCanvas.getContext('2d', {
        alpha: false,
        willReadFrequently: false,
      });

      this.isReady = true;
    } catch (err) {
      console.error('[HandTracker] Failed to initialize MediaPipe HandLandmarker:', err);
      this.isReady = false;
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Process a live video frame asynchronously.
   * If running in Web Worker (default):
   *   Transfers a lightweight 320x180 ImageBitmap to the background worker.
   *   Main render loop takes < 0.05ms and NEVER stalls!
   *   Returns the latest smoothed hand landmarks immediately.
   */
  processVideoFrame(
    videoSource: HTMLVideoElement | HTMLCanvasElement,
    timestamp: number = performance.now()
  ): { gestureEvent: GestureEvent; smoothedHands: TrackedHand[] } | null {
    if (!this.isReady) return null;
    const isVideo = videoSource instanceof HTMLVideoElement;
    if (isVideo && (videoSource.readyState < 2 || videoSource.videoWidth === 0)) return null;
    if (!isVideo && (videoSource.width === 0 || videoSource.height === 0)) return null;

    // Fast path: Web Worker offloading (Zero main-thread event loop stalls!)
    if (this.worker && this.isWorkerReady) {
      if (!this.isWorkerBusy) {
        this.isWorkerBusy = true;
        // Non-blocking 320x180 hardware downscale to ImageBitmap
        createImageBitmap(videoSource, {
          resizeWidth: 320,
          resizeHeight: 180,
          resizeQuality: 'low',
        })
          .then((bitmap) => {
            if (this.worker && this.isWorkerReady) {
              this.worker.postMessage({ type: 'process', bitmap, timestamp }, [bitmap]);
            } else {
              try { bitmap.close(); } catch {}
              this.isWorkerBusy = false;
            }
          })
          .catch(() => {
            this.isWorkerBusy = false;
          });
      }

      return this.lastResult;
    }

    // Fallback path: Synchronous main-thread execution with 320x180 downscaler
    if (!this.fallbackLandmarker) return null;

    try {
      let targetInput: CanvasImageSource = videoSource;
      if (this.trackingCtx && this.trackingCanvas) {
        this.trackingCtx.drawImage(videoSource, 0, 0, 320, 180);
        targetInput = this.trackingCanvas;
      }

      let safeTimestamp = timestamp;
      if (safeTimestamp <= this.lastTimestamp) {
        safeTimestamp = this.lastTimestamp + 1;
      }
      this.lastTimestamp = safeTimestamp;

      const results = this.fallbackLandmarker.detectForVideo(targetInput, safeTimestamp);
      const rawHands: TrackedHand[] = [];

      if (results.landmarks && results.landmarks.length > 0) {
        results.landmarks.forEach((lms, index) => {
          const handednessCategory = results.handedness?.[index]?.[0];
          const score = handednessCategory?.score || 0.8;
          const handedness = (handednessCategory?.displayName as 'Left' | 'Right') || 'Right';

          const points: Point3D[] = lms.map((pt) => ({
            x: pt.x,
            y: pt.y,
            z: pt.z,
          }));

          rawHands.push({
            landmarks: points,
            worldLandmarks: points,
            handedness,
            score,
          });
        });
      }

      const smoothedHands = this.fallbackSmoother.smooth(rawHands);
      this.lastSmoothedHands = smoothedHands;
      const detection = this.fallbackClassifier.classify(smoothedHands);
      const gestureEvent = this.fallbackStateMachine.update(detection, safeTimestamp);

      this.lastResult = { gestureEvent, smoothedHands };
      return this.lastResult;
    } catch (err) {
      console.warn('[HandTracker] Fallback execution glitch:', err);
      return this.lastResult;
    }
  }

  getLastSmoothedHands(): TrackedHand[] {
    return this.lastSmoothedHands;
  }

  setHoldDuration(seconds: number): void {
    if (this.worker && this.isWorkerReady) {
      this.worker.postMessage({ type: 'set_hold_duration', duration: seconds });
    }
    this.fallbackStateMachine.setHoldDuration(seconds);
  }

  setSmoothingAlpha(alpha: number): void {
    if (this.worker && this.isWorkerReady) {
      this.worker.postMessage({ type: 'set_smoothing_alpha', alpha });
    }
    this.fallbackSmoother.setAlpha(alpha);
  }

  isInitialized(): boolean {
    return this.isReady;
  }

  reset(): void {
    if (this.worker && this.isWorkerReady) {
      this.worker.postMessage({ type: 'reset' });
    }
    this.fallbackSmoother.reset();
    this.fallbackStateMachine.reset();
    this.lastSmoothedHands = [];
    this.lastResult = null;
  }

  close(): void {
    if (this.worker) {
      try {
        this.worker.postMessage({ type: 'close' });
        this.worker.terminate();
      } catch {}
      this.worker = null;
      this.isWorkerReady = false;
      this.isWorkerBusy = false;
    }
    if (this.fallbackLandmarker) {
      try {
        this.fallbackLandmarker.close();
      } catch {}
      this.fallbackLandmarker = null;
    }
    if (this.trackingCanvas) {
      this.trackingCanvas.width = 0;
      this.trackingCanvas.height = 0;
      this.trackingCanvas = null;
      this.trackingCtx = null;
    }
    this.isReady = false;
  }
}

export const handTracker = new HandTracker();
