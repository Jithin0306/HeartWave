import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Point3D, TrackedHand } from '../types/gesture';
import { LandmarkSmoother } from './landmarkSmoother';
import { GestureClassifier } from './gestureClassifier';
import { GestureStateMachine } from './gestureStateMachine';

let handLandmarker: HandLandmarker | null = null;
let smoother = new LandmarkSmoother(0.65);
let classifier = new GestureClassifier();
let stateMachine = new GestureStateMachine(0.7, 1.2);
let isInitializing = false;
let isReady = false;

function resolvePath(rel: string): string {
  try {
    if (typeof self !== 'undefined' && self.location && self.location.origin) {
      return `${self.location.origin}/${rel.replace(/^\.?\//, '')}`;
    }
  } catch {}
  return `./${rel.replace(/^\.?\//, '')}`;
}

async function initLandmarker(wasmDir?: string, modelPath?: string) {
  if (isReady || isInitializing) return;
  isInitializing = true;

  try {
    const targetWasm = wasmDir || resolvePath('wasm');
    let vision;
    try {
      vision = await FilesetResolver.forVisionTasks(targetWasm);
    } catch (e) {
      try {
        vision = await FilesetResolver.forVisionTasks('./wasm');
      } catch {
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }
    }

    const targetModel = modelPath || resolvePath('models/hand_landmarker.task');
    let delegate: 'GPU' | 'CPU' = 'GPU';

    try {
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: targetModel,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
    } catch (gpuErr) {
      console.warn('[HandTrackingWorker] GPU delegate failed in worker, falling back to CPU:', gpuErr);
      delegate = 'CPU';
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: targetModel,
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
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

self.onmessage = async (e: MessageEvent) => {
  const data = e.data;
  if (!data) return;

  switch (data.type) {
    case 'init': {
      await initLandmarker(data.wasmDir, data.modelPath);
      break;
    }

    case 'process': {
      const bitmap: ImageBitmap = data.bitmap;
      const timestamp: number = data.timestamp || performance.now();

      if (!isReady || !handLandmarker || !bitmap) {
        if (bitmap) {
          try { bitmap.close(); } catch {}
        }
        self.postMessage({ type: 'result', gestureEvent: null, smoothedHands: [], timestamp });
        return;
      }

      try {
        const results = handLandmarker.detectForVideo(bitmap, timestamp);

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

        const smoothedHands = smoother.smooth(rawHands);
        const detection = classifier.classify(smoothedHands);
        const gestureEvent = stateMachine.update(detection, timestamp);

        self.postMessage({
          type: 'result',
          gestureEvent,
          smoothedHands,
          timestamp,
        });
      } catch (detectErr: any) {
        self.postMessage({
          type: 'result_err',
          error: detectErr?.message || String(detectErr),
          timestamp,
        });
      } finally {
        try {
          bitmap.close();
        } catch {}
      }
      break;
    }

    case 'set_hold_duration': {
      if (typeof data.duration === 'number') {
        stateMachine.setHoldDuration(data.duration);
      }
      break;
    }

    case 'set_smoothing_alpha': {
      if (typeof data.alpha === 'number') {
        smoother.setAlpha(data.alpha);
      }
      break;
    }

    case 'reset': {
      smoother.reset();
      stateMachine.reset();
      break;
    }

    case 'close': {
      if (handLandmarker) {
        try {
          handLandmarker.close();
        } catch {}
        handLandmarker = null;
      }
      isReady = false;
      break;
    }
  }
};
