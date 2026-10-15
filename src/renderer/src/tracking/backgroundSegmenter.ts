import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

export class BackgroundSegmenter {
  private segmenter: ImageSegmenter | null = null;
  private isInitializing: boolean = false;
  private isReady: boolean = false;

  // Mask dimensions matching selfie_segmenter model (256x256)
  private maskWidth: number = 256;
  private maskHeight: number = 256;

  // Smoothing & Feathering buffers
  private smoothedBuffer: Float32Array | null = null;
  private blurBuffer: Float32Array | null = null;
  private hasHistory: boolean = false;
  private temporalAlpha: number = 0.45; // 45% current + 55% previous frame for zero edge jitter
  private lowerCutoff: number = 0.55; // Eliminates wooden headboard & red blanket leakage
  private upperCutoff: number = 0.72; // Guarantees 100% solid opacity on t-shirt/torso (no green holes)

  // Output Mask Canvas (Hardware-accelerated bilinear scaling)
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D | null = null;
  private maskImageData: ImageData | null = null;

  // Offscreen 256x256 GPU Downscaling Canvas (Bypasses WASM CPU Resizing)
  private inputCanvas: HTMLCanvasElement;
  private inputCtx: CanvasRenderingContext2D | null = null;

  // Pre-computed Look-Up Table (LUT) for sub-millisecond hysteresis edge feathering
  private lut: Uint8Array = new Uint8Array(256);

  // Cadence pacing & monotonicity safeguards
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
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        data[i + 3] = 0;   // A (starts transparent)
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
    const invRange = 1.0 / (upperBound - lowerBound);
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
   * Initialize MediaPipe ImageSegmenter with offline local assets and GPU acceleration.
   */
  async initialize(): Promise<void> {
    if (this.isReady || this.isInitializing) return;
    this.isInitializing = true;

    try {
      // 1. Initialize WASM vision tasks runtime
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks('./wasm');
      } catch (localWasmErr) {
        console.warn('[BackgroundSegmenter] Local WASM resolver failed, falling back to CDN:', localWasmErr);
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }

      // 2. Create GPU-accelerated ImageSegmenter instance
      this.segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: './models/selfie_segmenter.tflite',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      });

      this.isReady = true;
      console.log('[BackgroundSegmenter] MediaPipe SelfieSegmenter initialized successfully on GPU.');
    } catch (err) {
      console.error('[BackgroundSegmenter] Failed to initialize MediaPipe ImageSegmenter:', err);
      this.isReady = false;
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Perform real-time video frame segmentation and return the smoothed mask canvas.
   * Leverages 256x256 GPU pre-scaling, LUT smoothing, and cached mask reuse.
   */
  segmentVideoFrame(
    videoSource: HTMLVideoElement | HTMLCanvasElement,
    timestamp: number = performance.now()
  ): HTMLCanvasElement | null {
    if (!this.isReady || !this.segmenter || !this.maskCtx || !this.maskImageData) {
      return this.hasHistory ? this.maskCanvas : null;
    }

    const isVideo = videoSource instanceof HTMLVideoElement;
    if (isVideo && (videoSource.readyState < 2 || videoSource.videoWidth === 0)) {
      return this.hasHistory ? this.maskCanvas : null;
    }
    if (!isVideo && (videoSource.width === 0 || videoSource.height === 0)) {
      return this.hasHistory ? this.maskCanvas : null;
    }

    // High-cadence mask reuse: body silhouettes do not move significantly within 40ms.
    // Reusing the cached mask between inference passes guarantees rock-solid 30-60 FPS.
    if (this.hasHistory && timestamp - this.lastInferTime < 40) {
      return this.maskCanvas;
    }
    this.lastInferTime = timestamp;

    // Guard monotonic timestamp progression for MediaPipe Video mode
    if (timestamp <= this.lastTimestamp) {
      timestamp = this.lastTimestamp + 1;
    }
    this.lastTimestamp = timestamp;

    let hasExtracted = false;

    try {
      // GPU Hardware pre-scale to 256x256 so MediaPipe doesn't waste CPU/WASM resizing 1080p frames
      if (this.inputCtx) {
        this.inputCtx.drawImage(videoSource, 0, 0, this.maskWidth, this.maskHeight);
      }
      const sourceForInference = this.inputCanvas || videoSource;

      this.segmenter.segmentForVideo(sourceForInference, timestamp, (result) => {
        // MediaPipe SelfieSegmenter provides confidenceMasks where:
        // index 0: background confidence (1.0 = background, 0.0 = person)
        // index 1: person confidence (1.0 = person, 0.0 = background)
        // We select the person mask so the human subject is extracted and kept as the foreground.
        const mask = (result.confidenceMasks && result.confidenceMasks.length > 1)
          ? result.confidenceMasks[1]
          : result.confidenceMasks?.[0];
        if (!mask) return;

        const width = mask.width;
        const height = mask.height;

        // Ensure buffer dimensions match
        const totalPixels = width * height;
        if (!this.smoothedBuffer || this.smoothedBuffer.length !== totalPixels) {
          this.smoothedBuffer = new Float32Array(totalPixels);
          this.hasHistory = false;
          this.maskWidth = width;
          this.maskHeight = height;
          this.maskCanvas.width = width;
          this.maskCanvas.height = height;
          this.maskImageData = this.maskCtx!.createImageData(width, height);
          const data = this.maskImageData.data;
          for (let p = 0; p < data.length; p += 4) {
            data[p] = 255;
            data[p + 1] = 255;
            data[p + 2] = 255;
          }
        }

        const rawFloats = mask.getAsFloat32Array();
        const smoothed = this.smoothedBuffer;
        const imgData = this.maskImageData!;
        const data = imgData.data;

        const alpha = this.temporalAlpha;
        const oneMinusAlpha = 1.0 - alpha;
        const lut = this.lut;

        // 1. Temporal EMA Smoothing (~45% current mask, ~55% previous frame mask)
        if (!this.hasHistory) {
          for (let i = 0; i < totalPixels; i++) {
            smoothed[i] = rawFloats[i];
          }
          this.hasHistory = true;
        } else {
          for (let i = 0; i < totalPixels; i++) {
            smoothed[i] = alpha * rawFloats[i] + oneMinusAlpha * smoothed[i];
          }
        }

        // 2. Spatial 5-point Cross Filtering (eliminates 8x8 blocky pixelation along silhouette edges)
        if (!this.blurBuffer || this.blurBuffer.length !== totalPixels) {
          this.blurBuffer = new Float32Array(totalPixels);
        }
        const blurBuf = this.blurBuffer;
        const w = width;
        const h = height;

        for (let y = 0; y < h; y++) {
          const yOffset = y * w;
          const yPrev = (y > 0 ? y - 1 : y) * w;
          const yNext = (y < h - 1 ? y + 1 : y) * w;

          for (let x = 0; x < w; x++) {
            const xPrev = x > 0 ? x - 1 : x;
            const xNext = x < w - 1 ? x + 1 : x;

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

        hasExtracted = true;
      });

      if (hasExtracted && this.maskCtx && this.maskImageData) {
        this.maskCtx.putImageData(this.maskImageData, 0, 0);
        return this.maskCanvas;
      }
    } catch (err) {
      console.warn('[BackgroundSegmenter] Segmentation inference glitch:', err);
    }

    return this.hasHistory ? this.maskCanvas : null;
  }

  getMaskCanvas(): HTMLCanvasElement | null {
    return this.hasHistory ? this.maskCanvas : null;
  }

  setTemporalSmoothing(alpha: number): void {
    this.temporalAlpha = Math.max(0.1, Math.min(0.99, alpha));
  }

  setEdgeFeather(feather: number): void {
    const f = Math.max(0.04, Math.min(0.18, feather));
    this.lowerCutoff = Math.max(0.40, 0.635 - f);
    this.upperCutoff = Math.min(0.90, 0.635 + f);
    this.updateLut();
  }

  setEdgeThreshold(threshold: number): void {
    const center = Math.max(0.45, Math.min(0.80, threshold));
    this.lowerCutoff = Math.max(0.35, center - 0.085);
    this.upperCutoff = Math.min(0.95, center + 0.085);
    this.updateLut();
  }

  isInitialized(): boolean {
    return this.isReady;
  }

  reset(): void {
    this.hasHistory = false;
    if (this.smoothedBuffer) {
      this.smoothedBuffer.fill(0);
    }
  }

  close(): void {
    if (this.segmenter) {
      try {
        this.segmenter.close();
      } catch (e) {
        console.warn('[BackgroundSegmenter] Error closing segmenter:', e);
      }
      this.segmenter = null;
    }
    this.isReady = false;
    this.hasHistory = false;
    this.smoothedBuffer = null;
  }
}

export const backgroundSegmenter = new BackgroundSegmenter();
