import { Point3D, TrackedHand } from '../types/gesture';

export class LandmarkSmoother {
  private prevHands: Map<string, Point3D[]> = new Map();
  private alpha: number;

  /**
   * @param alpha Smoothing factor: higher = faster response (e.g. 0.65), lower = smoother (e.g. 0.35)
   */
  constructor(alpha: number = 0.6) {
    this.alpha = alpha;
  }

  setAlpha(alpha: number): void {
    this.alpha = Math.max(0.1, Math.min(0.95, alpha));
  }

  smooth(hands: TrackedHand[]): TrackedHand[] {
    const currentKeys = new Set<string>();

    const smoothedHands = hands.map((hand, index) => {
      const key = `${hand.handedness}-${index}`;
      currentKeys.add(key);

      const prev = this.prevHands.get(key);
      let smoothedLandmarks: Point3D[];

      if (!prev || prev.length !== hand.landmarks.length) {
        // First frame for this hand, initialize
        smoothedLandmarks = hand.landmarks.map((pt) => ({ ...pt }));
      } else {
        // Calculate velocity-adjusted alpha: if hand moved fast, snap closer to target
        smoothedLandmarks = hand.landmarks.map((curr, i) => {
          const p = prev[i];
          const distSq = (curr.x - p.x) ** 2 + (curr.y - p.y) ** 2;
          // Dynamic alpha: fast movement gets higher responsiveness
          const dynamicAlpha = distSq > 0.005 ? Math.min(0.85, this.alpha + 0.25) : this.alpha;

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
