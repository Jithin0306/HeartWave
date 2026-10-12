import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { TrackedHand, GestureEvent, Point3D } from '../types/gesture';
import { LandmarkSmoother } from './landmarkSmoother';
import { GestureClassifier } from './gestureClassifier';
import { GestureStateMachine } from './gestureStateMachine';

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null;
  private isInitializing: boolean = false;
  private isReady: boolean = false;
  private smoother: LandmarkSmoother = new LandmarkSmoother(0.65);
  private classifier: GestureClassifier = new GestureClassifier();
  private stateMachine: GestureStateMachine = new GestureStateMachine(0.7, 1.2);
  private lastSmoothedHands: TrackedHand[] = [];

  /**
   * Initialize MediaPipe HandLandmarker with offline local assets.
   */
  async initialize(): Promise<void> {
    if (this.isReady || this.isInitializing) return;
    this.isInitializing = true;

    try {
      // 1. Initialize WASM vision tasks runtime
      let vision;
      try {
        // Attempt local public WASM directory
        vision = await FilesetResolver.forVisionTasks('./wasm');
      } catch (localWasmErr) {
        console.warn('Local WASM resolver failed, falling back to CDN:', localWasmErr);
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      }

      // 2. Create HandLandmarker instance
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: './models/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      this.isReady = true;
      console.log('MediaPipe HandLandmarker initialized successfully.');
    } catch (err) {
      console.error('Failed to initialize MediaPipe HandLandmarker:', err);
      this.isReady = false;
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Process a live video frame and return semantic gesture event.
   */
  processVideoFrame(
    videoSource: HTMLVideoElement | HTMLCanvasElement,
    timestamp: number = performance.now()
  ): { gestureEvent: GestureEvent; smoothedHands: TrackedHand[] } | null {
    if (!this.isReady || !this.handLandmarker) return null;
    const isVideo = videoSource instanceof HTMLVideoElement;
    if (isVideo && (videoSource.readyState < 2 || videoSource.videoWidth === 0)) return null;
    if (!isVideo && (videoSource.width === 0 || videoSource.height === 0)) return null;

    try {
      const results = this.handLandmarker.detectForVideo(videoSource, timestamp);

      // Extract tracked hands
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

      // Apply landmark smoothing
      const smoothedHands = this.smoother.smooth(rawHands);
      this.lastSmoothedHands = smoothedHands;

      // Classify gestures
      const detection = this.classifier.classify(smoothedHands);

      // Update state machine (hold duration & cooldowns)
      const gestureEvent = this.stateMachine.update(detection, timestamp);

      return { gestureEvent, smoothedHands };
    } catch (err) {
      console.warn('Error during hand landmark detection:', err);
      return null;
    }
  }

  getLastSmoothedHands(): TrackedHand[] {
    return this.lastSmoothedHands;
  }

  setHoldDuration(seconds: number): void {
    this.stateMachine.setHoldDuration(seconds);
  }

  setSmoothingAlpha(alpha: number): void {
    this.smoother.setAlpha(alpha);
  }

  isInitialized(): boolean {
    return this.isReady;
  }

  reset(): void {
    this.smoother.reset();
    this.stateMachine.reset();
    this.lastSmoothedHands = [];
  }

  close(): void {
    if (this.handLandmarker) {
      try {
        this.handLandmarker.close();
      } catch (e) {
        console.warn('Error closing hand landmarker:', e);
      }
      this.handLandmarker = null;
    }
    this.isReady = false;
  }
}

export const handTracker = new HandTracker();
