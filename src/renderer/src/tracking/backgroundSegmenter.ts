import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

export class BackgroundSegmenter {
  private worker: Worker | null = null;
  private isWorkerReady: boolean = false;
  private isWorkerBusy: boolean = false;

  // Mask dimensions matching selfie_segmenter model (256x256)
  private maskWidth: number = 256;
  private maskHeight: number = 256;

  // Output Mask Canvas (Hardware-accelerated bilinear scaling)
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D | null = null;
  private hasHistory: boolean = false;

  // Fallback main-thread segmenter
  private fallbackSegmenter: ImageSegmenter | null = null;
  private fallbackSmoothedBuffer: Float32Array | null = null;
  private fallbackBlurBuffer: Float32Array | null = null;
  private fallbackHasHistory: boolean = false;
  private temporalAlpha: number = 0.45;
  private lowerCutoff: number = 0.55;
  private upperCutoff: number = 0.72;
  private lut: Uint8Array = new Uint8Array(256);
  private inputCanvas: HTMLCanvasElement;
  private inputCtx: CanvasRenderingContext2D | null = null;
  private maskImageData: ImageData | null = null;

  private isInitializing: boolean = false;
  private isReady: boolean = false;
  private lastTimestamp: number = 0;
  private lastInferTime: number = 0;

  constructor() {
    this.maskCanvas = document.createElement('canvas');
    this.maskCanvas.width = this.maskWidth;
    this.maskCanvas.height = this.maskHeight;
    this.maskCtx = this.maskCanvas.getContext('2d', {
      willReadFrequently: false,
    });
    if (this.maskCtx) {
      this.maskImageData = this.maskCtx.createImageData(this.maskWidth, this.maskHeight);
      const data = this.maskImageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 0;
      }
    }

    this.inputCanvas = document.createElement('canvas');
    this.inputCanvas.width = this.maskWidth;
    this.inputCanvas.height = this.maskHeight;
    this.inputCtx = this.inputCanvas.getContext('2d', {
      willReadFrequently: false,
    });

    this.updateLut();
  }

  private updateLut(): void {
    const lowerBound = this.lowerCutoff;
    const upperBound = this.upperCutoff;
    const invRange = 1.0 / Math.max(0.001, upperBound - lowerBound);
    for (let i = 0; i < 256; i++) {
      const val = i / 255.0;
      if (val <= lowerBound) {
        this.lut[i] = 0;
      } else if (val >= upperBound) {
        this.lut[i] = 255;
      } else {
        const t = (val - lowerBound) * invRange;
        const smoothVal = t * t * (3.0 - 2.0 * t);
        this.lut[i] = Math.round(smoothVal * 255);
      }
    }
  }

  /**
   * Initialize MediaPipe ImageSegmenter with dedicated Web Worker offloading.
   */
  async initialize(): Promise<void> {
    if (this.isReady || this.isInitializing) return;
    this.isInitializing = true;

    try {
      // 1. Attempt offloading to dedicated Web Worker
      const workerInitPromise = new Promise<boolean>((resolve) => {
        try {
          const worker = new Worker(new URL('./segmentationWorker.ts', import.meta.url), {
            type: 'module',
          });

          const timeout = setTimeout(() => {
            console.warn('[BackgroundSegmenter] Worker initialization timed out, using fallback');
            resolve(false);
          }, 8000);

          worker.onmessage = (e: MessageEvent) => {
            const data = e.data;
            if (data?.type === 'init_ok') {
              clearTimeout(timeout);
              this.isWorkerReady = true;
              console.log('[BackgroundSegmenter] Dedicated Web Worker initialized on delegate:', data.delegate);
              resolve(true);
            } else if (data?.type === 'init_err') {
              clearTimeout(timeout);
              console.warn('[BackgroundSegmenter] Worker init error, falling back:', data.error);
              resolve(false);
            } else if (data?.type === 'mask_bitmap') {
              if (this.maskCtx && data.bitmap) {
                this.maskCtx.drawImage(data.bitmap, 0, 0, this.maskWidth, this.maskHeight);
                try { data.bitmap.close(); } catch {}
                this.hasHistory = true;
              }
              this.isWorkerBusy = false;
            } else if (data?.type === 'mask_buffer') {
              if (this.maskCtx && data.buffer) {
                const imgData = new ImageData(new Uint8ClampedArray(data.buffer), data.width, data.height);
                this.maskCtx.putImageData(imgData, 0, 0);
                this.hasHistory = true;
              }
              this.isWorkerBusy = false;
            } else if (data?.type === 'mask_alpha') {
              if (this.maskCtx && this.maskImageData && data.buffer) {
                const alphas = new Uint8Array(data.buffer);
                const d = this.maskImageData.data;
                for (let i = 0; i < alphas.length; i++) {
                  d[i * 4 + 3] = alphas[i];
                }
                this.maskCtx.putImageData(this.maskImageData, 0, 0);
                this.hasHistory = true;
              }
              this.isWorkerBusy = false;
            } else if (data?.type === 'mask_skip' || data?.type === 'mask_err') {
              this.isWorkerBusy = false;
            }
          };

          worker.onerror = (wErr) => {
            console.warn('[BackgroundSegmenter] Worker thread error, falling back:', wErr);
            clearTimeout(timeout);
            resolve(false);
          };

          worker.postMessage({ type: 'init' });
          this.worker = worker;
        } catch (workerSpawnErr) {
          console.warn('[BackgroundSegmenter] Worker spawn failed, falling back:', workerSpawnErr);
          resolve(false);
        }
      });

      const workerOk = await workerInitPromise;

      if (!workerOk) {
        // Fallback: Initialize main-thread segmenter
        console.log('[BackgroundSegmenter] Initializing main-thread fallback ImageSegmenter...');
        let vision;
        try {
          vision = await FilesetResolver.forVisionTasks('./wasm');
        } catch {
          vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );
        }

        this.fallbackSegmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: './models/selfie_segmenter.tflite',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          outputConfidenceMasks: true,
          outputCategoryMask: false,
        });
      }

      this.isReady = true;
    } catch (err) {
      console.error('[BackgroundSegmenter] Failed to initialize ImageSegmenter:', err);
      this.isReady = false;
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Perform real-time video frame segmentation asynchronously and return smoothed mask canvas.
   * Completely offloaded to Web Worker — takes < 0.05ms on the main render loop!
   */
  segmentVideoFrame(
    videoSource: HTMLVideoElement | HTMLCanvasElement,
    timestamp: number = performance.now()
  ): HTMLCanvasElement | null {
    if (!this.isReady) {
      return this.hasHistory ? this.maskCanvas : null;
    }

    const isVideo = videoSource instanceof HTMLVideoElement;
    if (isVideo && (videoSource.readyState < 2 || videoSource.videoWidth === 0)) {
      return this.hasHistory ? this.maskCanvas : null;
    }
    if (!isVideo && (videoSource.width === 0 || videoSource.height === 0)) {
      return this.hasHistory ? this.maskCanvas : null;
    }

    // Fast path: Web Worker offloading (Zero main-thread WebGL/WASM stall!)
    if (this.worker && this.isWorkerReady) {
      if (!this.isWorkerBusy) {
        this.isWorkerBusy = true;
        // Asynchronously capture 256x256 ImageBitmap for instant non-blocking GPU transfer
        createImageBitmap(videoSource, {
          resizeWidth: this.maskWidth,
          resizeHeight: this.maskHeight,
          resizeQuality: 'low',
        })
          .then((bitmap) => {
            if (this.worker && this.isWorkerReady) {
              this.worker.postMessage({ type: 'process', bitmap, timestamp }, [bitmap]);
            } else {
              bitmap.close();
              this.isWorkerBusy = false;
            }
          })
          .catch(() => {
            this.isWorkerBusy = false;
          });
      }

      return this.hasHistory ? this.maskCanvas : null;
    }

    // Fallback path: Synchronous main-thread execution
    if (!this.fallbackSegmenter || !this.maskCtx || !this.maskImageData) {
      return this.fallbackHasHistory ? this.maskCanvas : null;
    }

    if (this.fallbackHasHistory && timestamp - this.lastInferTime < 40) {
      return this.maskCanvas;
    }
    this.lastInferTime = timestamp;

    if (timestamp <= this.lastTimestamp) {
      timestamp = this.lastTimestamp + 1;
    }
    this.lastTimestamp = timestamp;

    try {
      if (this.inputCtx) {
        this.inputCtx.drawImage(videoSource, 0, 0, this.maskWidth, this.maskHeight);
      }
      const sourceForInference = this.inputCanvas || videoSource;

      this.fallbackSegmenter.segmentForVideo(sourceForInference, timestamp, (result) => {
        const mask = (result.confidenceMasks && result.confidenceMasks.length > 1)
          ? result.confidenceMasks[1]
          : result.confidenceMasks?.[0];
        if (!mask) return;

        const width = mask.width;
        const height = mask.height;
        const totalPixels = width * height;

        if (!this.fallbackSmoothedBuffer || this.fallbackSmoothedBuffer.length !== totalPixels) {
          this.fallbackSmoothedBuffer = new Float32Array(totalPixels);
          this.fallbackBlurBuffer = new Float32Array(totalPixels);
          this.fallbackHasHistory = false;
        }

        const rawFloats = mask.getAsFloat32Array();
        const smoothed = this.fallbackSmoothedBuffer;
        const blurBuf = this.fallbackBlurBuffer!;
        const data = this.maskImageData!.data;
        const alpha = this.temporalAlpha;
        const oneMinusAlpha = 1.0 - alpha;
        const lut = this.lut;

        if (!this.fallbackHasHistory) {
          for (let i = 0; i < totalPixels; i++) smoothed[i] = rawFloats[i];
          this.fallbackHasHistory = true;
        } else {
          for (let i = 0; i < totalPixels; i++) {
            smoothed[i] = alpha * rawFloats[i] + oneMinusAlpha * smoothed[i];
          }
        }

        for (let y = 0; y < height; y++) {
          const yOffset = y * width;
          const yPrev = (y > 0 ? y - 1 : y) * width;
          const yNext = (y < height - 1 ? y + 1 : y) * width;

          for (let x = 0; x < width; x++) {
            const xPrev = x > 0 ? x - 1 : x;
            const xNext = x < width - 1 ? x + 1 : x;

            const center = smoothed[yOffset + x];
            const filtered = 0.5 * center + 0.125 * (
              smoothed[yOffset + xPrev] +
              smoothed[yOffset + xNext] +
              smoothed[yPrev + x] +
              smoothed[yNext + x]
            );
            blurBuf[yOffset + x] = filtered;

            const b = (filtered * 255) | 0;
            data[(yOffset + x) * 4 + 3] = lut[b < 0 ? 0 : (b > 255 ? 255 : b)];
          }
        }

        this.maskCtx!.putImageData(this.maskImageData!, 0, 0);
        this.hasHistory = true;
      });

      return this.maskCanvas;
    } catch (err) {
      console.warn('[BackgroundSegmenter] Fallback error:', err);
      return this.hasHistory ? this.maskCanvas : null;
    }
  }

  setTemporalSmoothing(alpha: number): void {
    this.temporalAlpha = Math.max(0.1, Math.min(0.9, alpha));
    if (this.worker && this.isWorkerReady) {
      this.worker.postMessage({ type: 'set_temporal_smoothing', alpha: this.temporalAlpha });
    }
  }

  setEdgeFeather(feather: number): void {
    const f = Math.max(0, Math.min(100, feather));
    this.lowerCutoff = Math.max(0.3, 0.55 - (f / 100) * 0.15);
    this.upperCutoff = Math.min(0.85, 0.72 + (f / 100) * 0.1);
    this.updateLut();
    if (this.worker && this.isWorkerReady) {
      this.worker.postMessage({ type: 'set_edge_feather', feather: f });
    }
  }

  isInitialized(): boolean {
    return this.isReady;
  }

  close(): void {
    if (this.worker) {
      try {
        this.worker.postMessage({ type: 'close' });
        this.worker.terminate();
      } catch {}
      this.worker = null;
      this.isWorkerReady = false;
    }
    if (this.fallbackSegmenter) {
      try {
        this.fallbackSegmenter.close();
      } catch {}
      this.fallbackSegmenter = null;
    }
    this.isReady = false;
    this.hasHistory = false;
  }
}

export const backgroundSegmenter = new BackgroundSegmenter();
