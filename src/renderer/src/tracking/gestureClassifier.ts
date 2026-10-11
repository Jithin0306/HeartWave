import { Point3D, TrackedHand, GestureDetectionResult } from '../types/gesture';

function dist2D(a: Point3D, b: Point3D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export class GestureClassifier {
  /**
   * Determine if a specific finger is extended based on joint distances.
   */
  private isFingerExtended(lm: Point3D[], tipIdx: number, pipIdx: number, mcpIdx: number): boolean {
    const wrist = lm[0];
    const tipDist = dist2D(wrist, lm[tipIdx]);
    const pipDist = dist2D(wrist, lm[pipIdx]);
    const mcpDist = dist2D(wrist, lm[mcpIdx]);

    return tipDist > pipDist * 1.15 && pipDist > mcpDist * 0.95;
  }

  /**
   * Check if finger is curled inward toward palm.
   */
  private isFingerCurled(lm: Point3D[], tipIdx: number, pipIdx: number): boolean {
    const wrist = lm[0];
    const tipDist = dist2D(wrist, lm[tipIdx]);
    const pipDist = dist2D(wrist, lm[pipIdx]);

    return tipDist < pipDist * 1.1;
  }

  /**
   * Classify hand landmarks into a semantic gesture.
   */
  classify(hands: TrackedHand[], _minConfidence: number = 0.65): GestureDetectionResult {
    if (!hands || hands.length === 0) {
      return {
        gesture: 'none',
        confidence: 0,
        anchor: { x: 0.5, y: 0.5 },
        handsCount: 0,
        rawHands: [],
      };
    }

    // 1. Check Two-Hand Gestures if 2 hands are detected
    if (hands.length >= 2) {
      const h1 = hands[0];
      const h2 = hands[1];

      // Two-Hand Heart Pose:
      // Left index tip & Right index tip close, Left thumb tip & Right thumb tip close
      const indexTipsDist = dist2D(h1.landmarks[8], h2.landmarks[8]);
      const thumbTipsDist = dist2D(h1.landmarks[4], h2.landmarks[4]);

      if (indexTipsDist < 0.14 && thumbTipsDist < 0.14) {
        const topY = Math.min(h1.landmarks[8].y, h2.landmarks[8].y);
        const bottomY = Math.max(h1.landmarks[4].y, h2.landmarks[4].y);

        // Heart orientation: index tips are generally higher or near thumbs
        const anchorX = (h1.landmarks[8].x + h2.landmarks[8].x + h1.landmarks[4].x + h2.landmarks[4].x) / 4;
        const anchorY = (topY + bottomY) / 2;
        const proximityScore = Math.max(0.65, 1 - (indexTipsDist + thumbTipsDist) * 2.5);

        return {
          gesture: 'heart_hands',
          confidence: proximityScore,
          anchor: { x: anchorX, y: anchorY },
          handsCount: 2,
          rawHands: hands,
        };
      }

      // Two-Hands Love Aura Pose:
      // Both hands open, facing each other in central region
      const h1Extended =
        this.isFingerExtended(h1.landmarks, 8, 6, 5) &&
        this.isFingerExtended(h1.landmarks, 12, 10, 9) &&
        this.isFingerExtended(h1.landmarks, 16, 14, 13);
      const h2Extended =
        this.isFingerExtended(h2.landmarks, 8, 6, 5) &&
        this.isFingerExtended(h2.landmarks, 12, 10, 9) &&
        this.isFingerExtended(h2.landmarks, 16, 14, 13);

      const wristsDist = dist2D(h1.landmarks[0], h2.landmarks[0]);
      if (h1Extended && h2Extended && wristsDist > 0.2 && wristsDist < 0.55) {
        const anchorX = (h1.landmarks[0].x + h2.landmarks[0].x) / 2;
        const anchorY = (h1.landmarks[0].y + h2.landmarks[0].y) / 2;

        return {
          gesture: 'two_hands_aura',
          confidence: 0.85,
          anchor: { x: anchorX, y: anchorY },
          handsCount: 2,
          rawHands: hands,
        };
      }

      // Petal Rain Pose:
      // Both hands in upper frame (y < 0.6) with open palms
      if (h1Extended && h2Extended && h1.landmarks[0].y < 0.65 && h2.landmarks[0].y < 0.65) {
        return {
          gesture: 'petal_rain_pose',
          confidence: 0.8,
          anchor: { x: (h1.landmarks[9].x + h2.landmarks[9].x) / 2, y: 0.35 },
          handsCount: 2,
          rawHands: hands,
        };
      }
    }

    // 2. Check Single-Hand Gestures (evaluate primary/first hand)
    const primaryHand = hands[0];
    const lm = primaryHand.landmarks;

    const indexExt = this.isFingerExtended(lm, 8, 6, 5);
    const middleExt = this.isFingerExtended(lm, 12, 10, 9);
    const ringExt = this.isFingerExtended(lm, 16, 14, 13);
    const pinkyExt = this.isFingerExtended(lm, 20, 18, 17);

    const middleCurled = this.isFingerCurled(lm, 12, 10);
    const ringCurled = this.isFingerCurled(lm, 16, 14);
    const pinkyCurled = this.isFingerCurled(lm, 20, 18);

    // Single-Hand Finger-Heart (Korean mini heart: thumb and index crossed/pinched)
    const pinchDist = dist2D(lm[4], lm[8]);
    if (pinchDist < 0.055 && middleCurled && ringCurled && pinkyCurled) {
      return {
        gesture: 'heart_hands',
        confidence: 0.88,
        anchor: { x: (lm[4].x + lm[8].x) / 2, y: (lm[4].y + lm[8].y) / 2 },
        handsCount: 1,
        rawHands: hands,
      };
    }

    // Cupid Spark: Pointing Index Finger OR Pinch Spark
    if (indexExt && middleCurled && ringCurled && pinkyCurled) {
      return {
        gesture: 'index_point',
        confidence: 0.9,
        anchor: { x: lm[8].x, y: lm[8].y },
        handsCount: 1,
        rawHands: hands,
      };
    }

    // Upward Palm (Rose Bloom):
    // All fingers extended and palm facing upward (wrist y is below fingertips)
    if (indexExt && middleExt && ringExt && pinkyExt) {
      const isUpward = lm[0].y > lm[9].y && Math.abs(lm[9].x - lm[0].x) < 0.25;
      if (isUpward) {
        return {
          gesture: 'open_palm_up',
          confidence: 0.85,
          anchor: { x: lm[9].x, y: lm[9].y - 0.08 }, // Hovering above palm
          handsCount: 1,
          rawHands: hands,
        };
      }

      // Relaxed Open Palm (Floating Hearts)
      return {
        gesture: 'open_palm',
        confidence: 0.82,
        anchor: { x: lm[9].x, y: lm[9].y },
        handsCount: 1,
        rawHands: hands,
      };
    }

    return {
      gesture: 'none',
      confidence: 0,
      anchor: { x: primaryHand.landmarks[9].x, y: primaryHand.landmarks[9].y },
      handsCount: hands.length,
      rawHands: hands,
    };
  }
}
