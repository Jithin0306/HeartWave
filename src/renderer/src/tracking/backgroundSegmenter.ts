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
  private hasHistory: boolean = false;
  private temporalAlpha: number = 0.75; // 0.75 = crisp reaction + zero edge jitter
  private edgeThreshold: number = 0.50; // Stable center threshold (protects indoor shadows and dark shirts)
  private edgeFeather: number = 0.10; // Crisp optical feathering band (prevents artificial ghost halo)

  // Output Mask Canvas (Hardware-accelerated bilinear scaling)
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D | null = null;
  private maskImageData: ImageData | null = null;

  // Offscreen 256x256 GPU Downscaling Canvas (Bypasses WASM CPU Resizing)
  private inputCanvas: HTMLCanvasElement;
  private inputCtx: CanvasRenderingContext2D | null = null;

  // Pre-computed Look-Up Table (LUT) for sub-millisecond edge feathering
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
    const lowerBound = Math.max(0.01, this.edgeThreshold - this.edgeFeather);
    const upperBound = Math.min(0.99, this.edgeThreshold + this.edgeFeather);
    const invRange = 1.0 / (upperBound - lowerBound);
    for (let i = 0; i < 256; i++) {
      const val = i / 255.0;
      const t = Math.max(0, Math.min(1, (val - lowerBound) * invRange));
      const smoothVal = t * t * (3.0 - 2.0 * t);
      this.lut[i] = (smoothVal * 255) | 0;
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

        if (!this.hasHistory) {
          for (let i = 0; i < totalPixels; i++) {
            const raw = rawFloats[i];
            smoothed[i] = raw;
            const b = (raw * 255) | 0;
            data[i * 4 + 3] = lut[b < 0 ? 0 : (b > 255 ? 255 : b)];
          }
          this.hasHistory = true;
        } else {
          for (let i = 0; i < totalPixels; i++) {
            const raw = rawFloats[i];
            const s = alpha * raw + oneMinusAlpha * smoothed[i];
            smoothed[i] = s;
            const b = (s * 255) | 0;
            data[i * 4 + 3] = lut[b < 0 ? 0 : (b > 255 ? 255 : b)];
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
    this.edgeFeather = Math.max(0.02, Math.min(0.4, feather));
    this.updateLut();
  }

  setEdgeThreshold(threshold: number): void {
    this.edgeThreshold = Math.max(0.1, Math.min(0.95, threshold));
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
