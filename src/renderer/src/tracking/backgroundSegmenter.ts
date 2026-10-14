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

  // Timestamp monotonicity safeguard
  private lastTimestamp: number = 0;

  constructor() {
    this.maskCanvas = document.createElement('canvas');
    this.maskCanvas.width = this.maskWidth;
    this.maskCanvas.height = this.maskHeight;
    this.maskCtx = this.maskCanvas.getContext('2d', {
      willReadFrequently: false,
    });
    if (this.maskCtx) {
      this.maskImageData = this.maskCtx.createImageData(this.maskWidth, this.maskHeight);
      // Pre-fill RGB channels with white (255)
      const data = this.maskImageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        data[i + 3] = 0;   // A (starts transparent)
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
   */
  segmentVideoFrame(
    videoSource: HTMLVideoElement | HTMLCanvasElement,
    timestamp: number = performance.now()
  ): HTMLCanvasElement | null {
    if (!this.isReady || !this.segmenter || !this.maskCtx || !this.maskImageData) {
      return null;
    }

    const isVideo = videoSource instanceof HTMLVideoElement;
    if (isVideo && (videoSource.readyState < 2 || videoSource.videoWidth === 0)) return null;
    if (!isVideo && (videoSource.width === 0 || videoSource.height === 0)) return null;

    // Guard monotonic timestamp progression for MediaPipe Video mode
    if (timestamp <= this.lastTimestamp) {
      timestamp = this.lastTimestamp + 1;
    }
    this.lastTimestamp = timestamp;

    let hasExtracted = false;

    try {
      this.segmenter.segmentForVideo(videoSource, timestamp, (result) => {
        const mask = result.confidenceMasks?.[0];
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
        const lowerBound = Math.max(0.01, this.edgeThreshold - this.edgeFeather);
        const upperBound = Math.min(0.99, this.edgeThreshold + this.edgeFeather);
        const invRange = 1.0 / (upperBound - lowerBound);

        if (!this.hasHistory) {
          for (let i = 0; i < totalPixels; i++) {
            const raw = rawFloats[i];
            smoothed[i] = raw;

            // Hermite smoothstep curve for natural edge feathering
            const t = Math.max(0, Math.min(1, (raw - lowerBound) * invRange));
            const smoothVal = t * t * (3.0 - 2.0 * t);
            data[i * 4 + 3] = (smoothVal * 255) | 0;
          }
          this.hasHistory = true;
        } else {
          for (let i = 0; i < totalPixels; i++) {
            const raw = rawFloats[i];
            const s = alpha * raw + oneMinusAlpha * smoothed[i];
            smoothed[i] = s;

            // Hermite smoothstep curve
            const t = Math.max(0, Math.min(1, (s - lowerBound) * invRange));
            const smoothVal = t * t * (3.0 - 2.0 * t);
            data[i * 4 + 3] = (smoothVal * 255) | 0;
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

    return null;
  }

  setTemporalSmoothing(alpha: number): void {
    this.temporalAlpha = Math.max(0.1, Math.min(0.99, alpha));
  }

  setEdgeFeather(feather: number): void {
    this.edgeFeather = Math.max(0.02, Math.min(0.4, feather));
  }

  setEdgeThreshold(threshold: number): void {
    this.edgeThreshold = Math.max(0.1, Math.min(0.95, threshold));
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
