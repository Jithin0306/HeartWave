import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

let segmenter: ImageSegmenter | null = null;
let isInitializing = false;
let isReady = false;

// Mask dimensions matching selfie_segmenter model (256x256)
const maskWidth = 256;
const maskHeight = 256;
const totalPixels = maskWidth * maskHeight;

// Smoothing & Feathering buffers
let smoothedBuffer: Float32Array = new Float32Array(totalPixels);
let blurBuffer: Float32Array = new Float32Array(totalPixels);
let hasHistory = false;
let temporalAlpha = 0.45;
let lowerCutoff = 0.55;
let upperCutoff = 0.72;

// Offscreen Canvas for mask bitmap generation
let offscreenCanvas: OffscreenCanvas | null = null;
let offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
let maskImageData: ImageData | null = null;

// Pre-computed Look-Up Table (LUT) for hysteresis edge feathering (smoothstep)
const lut = new Uint8Array(256);

function updateLut() {
  const invRange = 1.0 / Math.max(0.001, upperCutoff - lowerCutoff);
  for (let i = 0; i < 256; i++) {
    const val = i / 255.0;
    if (val <= lowerCutoff) {
      lut[i] = 0;
    } else if (val >= upperCutoff) {
      lut[i] = 255;
    } else {
      const t = (val - lowerCutoff) * invRange;
      const smoothVal = t * t * (3.0 - 2.0 * t);
      lut[i] = Math.round(smoothVal * 255);
    }
  }
}

function initBuffers() {
  updateLut();
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      offscreenCanvas = new OffscreenCanvas(maskWidth, maskHeight);
      offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: false }) as OffscreenCanvasRenderingContext2D;
      if (offscreenCtx) {
        maskImageData = offscreenCtx.createImageData(maskWidth, maskHeight);
        const data = maskImageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255;     // R
          data[i + 1] = 255; // G
          data[i + 2] = 255; // B
          data[i + 3] = 0;   // A
        }
      }
    } catch (e) {
      console.warn('[SegmentationWorker] OffscreenCanvas setup note:', e);
    }
  }
}

initBuffers();

function resolvePath(rel: string): string {
  try {
    if (typeof self !== 'undefined' && self.location && self.location.origin) {
      return `${self.location.origin}/${rel.replace(/^\.?\//, '')}`;
    }
  } catch {}
  return `./${rel.replace(/^\.?\//, '')}`;
}

async function initSegmenter(wasmDir?: string, modelPath?: string) {
  if (isReady || isInitializing) return;
  isInitializing = true;

  try {
    const targetWasm = wasmDir || resolvePath('wasm');
    let vision;
    try {
      vision = await FilesetResolver.forVisionTasks(targetWasm);
    } catch {
      try {
        vision = await FilesetResolver.forVisionTasks('./wasm');
      } catch {
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }
    }

    const targetModel = modelPath || resolvePath('models/selfie_segmenter.tflite');
    let delegate: 'GPU' | 'CPU' = 'GPU';

    try {
      segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: targetModel,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      });
    } catch (gpuErr) {
      console.warn('[SegmentationWorker] GPU delegate failed in worker, falling back to CPU:', gpuErr);
      delegate = 'CPU';
      segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: targetModel,
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      });
    }

    isReady = true;
    self.postMessage({ type: 'init_ok', delegate });
  } catch (err: any) {
    isReady = false;
    self.postMessage({ type: 'init_err', error: err?.message || String(err) });
  } finally {
    isInitializing = false;
  }
}

let lastTimestamp = 0;

self.onmessage = async (e: MessageEvent) => {
  const data = e.data;
  if (!data) return;

  switch (data.type) {
    case 'init': {
      await initSegmenter(data.wasmDir, data.modelPath);
      break;
    }

    case 'process': {
      const bitmap: ImageBitmap = data.bitmap;
      let timestamp: number = data.timestamp || performance.now();

      if (!isReady || !segmenter || !bitmap) {
        if (bitmap) {
          try { bitmap.close(); } catch {}
        }
        self.postMessage({ type: 'mask_skip', timestamp });
        return;
      }

      // Guard monotonic timestamp progression for MediaPipe Video mode
      if (timestamp <= lastTimestamp) {
        timestamp = lastTimestamp + 1;
      }
      lastTimestamp = timestamp;

      try {
        segmenter.segmentForVideo(bitmap, timestamp, (result) => {
          try {
            const mask = (result.confidenceMasks && result.confidenceMasks.length > 1)
              ? result.confidenceMasks[1]
              : result.confidenceMasks?.[0];

            if (!mask) {
              self.postMessage({ type: 'mask_skip', timestamp });
              return;
            }

            const rawFloats = mask.getAsFloat32Array();
            const w = mask.width;
            const h = mask.height;
            const pxCount = w * h;

            if (smoothedBuffer.length !== pxCount) {
              smoothedBuffer = new Float32Array(pxCount);
              blurBuffer = new Float32Array(pxCount);
              hasHistory = false;
            }

            const alpha = temporalAlpha;
            const oneMinusAlpha = 1.0 - alpha;

            // 1. Temporal EMA Smoothing
            if (!hasHistory) {
              for (let i = 0; i < pxCount; i++) {
                smoothedBuffer[i] = rawFloats[i];
              }
              hasHistory = true;
            } else {
              for (let i = 0; i < pxCount; i++) {
                smoothedBuffer[i] = alpha * rawFloats[i] + oneMinusAlpha * smoothedBuffer[i];
              }
            }

            // 2. Spatial 5-point Cross Filtering & Hysteresis LUT Edge Clamping
            // Send lightweight 65KB alpha buffer (Zero GPU texture allocations, zero VRAM accumulation)
            const alphaBuf = new Uint8Array(pxCount);
            for (let y = 0; y < h; y++) {
              const yOffset = y * w;
              const yPrev = (y > 0 ? y - 1 : y) * w;
              const yNext = (y < h - 1 ? y + 1 : y) * w;

              for (let x = 0; x < w; x++) {
                const xPrev = x > 0 ? x - 1 : x;
                const xNext = x < w - 1 ? x + 1 : x;

                const center = smoothedBuffer[yOffset + x];
                const filtered = 0.5 * center + 0.125 * (
                  smoothedBuffer[yOffset + xPrev] +
                  smoothedBuffer[yOffset + xNext] +
                  smoothedBuffer[yPrev + x] +
                  smoothedBuffer[yNext + x]
                );
                blurBuffer[yOffset + x] = filtered;

                const b = (filtered * 255) | 0;
                alphaBuf[yOffset + x] = lut[b < 0 ? 0 : (b > 255 ? 255 : b)];
              }
            }

            (self as any).postMessage({
              type: 'mask_alpha',
              buffer: alphaBuf.buffer,
              width: w,
              height: h,
              timestamp,
            }, [alphaBuf.buffer]);
          } finally {
            // CRITICAL MEMORY LEAK FIX:
            // In MediaPipe Tasks Vision, confidenceMasks allocate WebAssembly and WebGL resources.
            // They must be explicitly closed in finally to guarantee immediate linear heap deallocation!
            if (result.confidenceMasks) {
              for (let i = 0; i < result.confidenceMasks.length; i++) {
                try {
                  result.confidenceMasks[i].close();
                } catch {}
              }
            }
          }
        });
      } catch (segErr: any) {
        self.postMessage({
          type: 'mask_err',
          error: segErr?.message || String(segErr),
          timestamp,
        });
      } finally {
        try {
          bitmap.close();
        } catch {}
      }
      break;
    }

    case 'set_temporal_smoothing': {
      if (typeof data.alpha === 'number') {
        temporalAlpha = Math.max(0.1, Math.min(0.9, data.alpha));
      }
      break;
    }

    case 'set_cutoffs': {
      if (typeof data.lower === 'number') lowerCutoff = data.lower;
      if (typeof data.upper === 'number') upperCutoff = data.upper;
      updateLut();
      break;
    }

    case 'set_edge_feather': {
      if (typeof data.feather === 'number') {
        // Dynamic edge feathering adjustment
        const feather = Math.max(0, Math.min(100, data.feather));
        lowerCutoff = Math.max(0.3, 0.55 - (feather / 100) * 0.15);
        upperCutoff = Math.min(0.85, 0.72 + (feather / 100) * 0.1);
        updateLut();
      }
      break;
    }

    case 'close': {
      if (segmenter) {
        try {
          segmenter.close();
        } catch {}
        segmenter = null;
      }
      isReady = false;
      break;
    }
  }
};
