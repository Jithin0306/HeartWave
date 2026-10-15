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

          // Ultra-responsive adaptive smoothing:
          // Stationary (< 0.00015): smooth sensor noise
          // Moving (> 0.0008): snappy 0.90+ alpha for instantaneous zero-lag tracking
          let dynamicAlpha: number;
          if (distSq < 0.00015) {
            dynamicAlpha = Math.max(0.45, this.baseAlpha);
          } else if (distSq > 0.0008) {
            dynamicAlpha = isFingertip ? 0.98 : 0.95;
          } else {
            const factor = (distSq - 0.00015) / (0.0008 - 0.00015);
            dynamicAlpha = this.baseAlpha + factor * (0.95 - this.baseAlpha);
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
