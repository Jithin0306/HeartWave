import { Point3D, TrackedHand } from '../types/gesture';

export class LandmarkSmoother {
  private prevHands: Map<string, Point3D[]> = new Map();
  private baseAlpha: number;

  /**
   * @param alpha Base smoothing factor
   */
  constructor(alpha: number = 0.55) {
    this.baseAlpha = alpha;
  }

  setAlpha(alpha: number): void {
    this.baseAlpha = Math.max(0.1, Math.min(0.95, alpha));
  }

  smooth(hands: TrackedHand[]): TrackedHand[] {
    const currentKeys = new Set<string>();

    const smoothedHands = hands.map((hand, index) => {
      // Key by handedness; if two same hands, differentiate by index
      const key = `${hand.handedness}-${index}`;
      currentKeys.add(key);

      const prev = this.prevHands.get(key);
      let smoothedLandmarks: Point3D[];

      if (!prev || prev.length !== hand.landmarks.length) {
        smoothedLandmarks = hand.landmarks.map((pt) => ({ ...pt }));
      } else {
        smoothedLandmarks = hand.landmarks.map((curr, i) => {
          const p = prev[i];
          const distSq = (curr.x - p.x) ** 2 + (curr.y - p.y) ** 2;
          const isFingertip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;

          // Adaptive dual-rate smoothing:
          // Nearly stationary (< 0.0004): high smoothing to kill webcam sensor noise jitter
          // Fast movement (> 0.0035): high responsiveness to eliminate dragging lag
          let dynamicAlpha: number;
          if (distSq < 0.0004) {
            dynamicAlpha = isFingertip ? Math.max(0.25, this.baseAlpha - 0.25) : Math.max(0.3, this.baseAlpha - 0.18);
          } else if (distSq > 0.0035) {
            dynamicAlpha = isFingertip ? Math.min(0.92, this.baseAlpha + 0.35) : Math.min(0.88, this.baseAlpha + 0.28);
          } else {
            // Smooth linear blend in between
            const factor = (distSq - 0.0004) / (0.0035 - 0.0004);
            dynamicAlpha = Math.max(0.3, Math.min(0.88, this.baseAlpha + (factor - 0.5) * 0.4));
          }

          return {
            x: dynamicAlpha * curr.x + (1 - dynamicAlpha) * p.x,
            y: dynamicAlpha * curr.y + (1 - dynamicAlpha) * p.y,
            z: dynamicAlpha * curr.z + (1 - dynamicAlpha) * p.z,
          };
        });
      }

      this.prevHands.set(key, smoothedLandmarks);

      return {
        ...hand,
        landmarks: smoothedLandmarks,
      };
    });

    // Prune disappeared hands
    for (const key of this.prevHands.keys()) {
      if (!currentKeys.has(key)) {
        this.prevHands.delete(key);
      }
    }

    return smoothedHands;
  }

  reset(): void {
    this.prevHands.clear();
  }
}
