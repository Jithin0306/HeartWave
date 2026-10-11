import { Point3D, TrackedHand, GestureDetectionResult } from '../types/gesture';

function dist2D(a: Point3D, b: Point3D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export class GestureClassifier {
  /**
   * Determine if a specific finger is extended based on joint distances from wrist.
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

    return tipDist < pipDist * 1.12;
  }

  /**
   * Classify hand landmarks into a semantic gesture with mutually exclusive rules.
   */
  classify(hands: TrackedHand[]): GestureDetectionResult {
    if (!hands || hands.length === 0) {
      return {
        gesture: 'none',
        confidence: 0,
        anchor: { x: 0.5, y: 0.5 },
        handsCount: 0,
        rawHands: [],
      };
    }

    // =========================================================================
    // 1. Two-Hand Gestures (Highest priority when 2 hands are active)
    // =========================================================================
    if (hands.length >= 2) {
      const h1 = hands[0];
      const h2 = hands[1];

      // A. Two-Hand Heart Pose:
      // Index fingertips touch or come close, Thumb tips touch or come close
      const indexTipsDist = dist2D(h1.landmarks[8], h2.landmarks[8]);
      const thumbTipsDist = dist2D(h1.landmarks[4], h2.landmarks[4]);

      // Generous but strict threshold for joined two-hand heart
      if (indexTipsDist < 0.18 && thumbTipsDist < 0.18) {
        const topY = Math.min(h1.landmarks[8].y, h2.landmarks[8].y);
        const bottomY = Math.max(h1.landmarks[4].y, h2.landmarks[4].y);

        const anchorX = (h1.landmarks[8].x + h2.landmarks[8].x + h1.landmarks[4].x + h2.landmarks[4].x) / 4;
        const anchorY = (topY + bottomY) / 2;
        const confidence = Math.max(0.75, 1 - (indexTipsDist + thumbTipsDist) * 1.8);

        return {
          gesture: 'two_hand_heart',
          confidence,
          anchor: { x: anchorX, y: anchorY },
          handsCount: 2,
          rawHands: hands,
        };
      }

      // B. Petal Rain Pose:
      // Both hands held wide apart in upper frame, all 4 fingers extended on both
      const wristsDist = dist2D(h1.landmarks[0], h2.landmarks[0]);
      const h1AllExt =
        this.isFingerExtended(h1.landmarks, 8, 6, 5) &&
        this.isFingerExtended(h1.landmarks, 12, 10, 9) &&
        this.isFingerExtended(h1.landmarks, 16, 14, 13) &&
        this.isFingerExtended(h1.landmarks, 20, 18, 17);
      const h2AllExt =
        this.isFingerExtended(h2.landmarks, 8, 6, 5) &&
        this.isFingerExtended(h2.landmarks, 12, 10, 9) &&
        this.isFingerExtended(h2.landmarks, 16, 14, 13) &&
        this.isFingerExtended(h2.landmarks, 20, 18, 17);

      if (h1AllExt && h2AllExt && wristsDist > 0.28 && h1.landmarks[0].y < 0.58 && h2.landmarks[0].y < 0.58) {
        return {
          gesture: 'petal_rain_pose',
          confidence: 0.85,
          anchor: { x: (h1.landmarks[9].x + h2.landmarks[9].x) / 2, y: 0.35 },
          handsCount: 2,
          rawHands: hands,
        };
      }
    }

    // =========================================================================
    // 2. Single-Hand Gestures (Evaluated per hand to prevent multi-hand lockouts)
    // =========================================================================
    for (const hand of hands) {
      const lm = hand.landmarks;
      const wrist = lm[0];

      const indexExt = this.isFingerExtended(lm, 8, 6, 5);
      const middleExt = this.isFingerExtended(lm, 12, 10, 9);
      const ringExt = this.isFingerExtended(lm, 16, 14, 13);
      const pinkyExt = this.isFingerExtended(lm, 20, 18, 17);

      const middleCurled = this.isFingerCurled(lm, 12, 10);
      const ringCurled = this.isFingerCurled(lm, 16, 14);
      const pinkyCurled = this.isFingerCurled(lm, 20, 18);

      const thumbIndexTipDist = dist2D(lm[4], lm[8]);

      // --- CUPID SPARK: Pointing Index Finger ---
      // Strict rule: Index MUST be extended, thumb must NOT pinch index tip, others curled
      if (indexExt && thumbIndexTipDist > 0.10 && middleCurled && ringCurled && pinkyCurled) {
        return {
          gesture: 'index_point',
          confidence: 0.92,
          anchor: { x: lm[8].x, y: lm[8].y },
          handsCount: hands.length,
          rawHands: hands,
        };
      }

      // --- KOREAN FINGER HEART: Crossed / Pinched Mini Heart ---
      // Strict rule: Thumb tip & index tip pinched close, index is NOT extended straight, others curled
      const indexTipDistFromWrist = dist2D(wrist, lm[8]);
      const indexPipDistFromWrist = dist2D(wrist, lm[6]);
      const indexNotExtended = !indexExt || indexTipDistFromWrist < indexPipDistFromWrist * 1.30;

      if (thumbIndexTipDist < 0.13 && indexNotExtended && middleCurled && ringCurled && pinkyCurled) {
        return {
          gesture: 'korean_finger_heart',
          confidence: 0.92,
          anchor: {
            x: (lm[4].x + lm[8].x) / 2,
            y: Math.min(lm[4].y, lm[8].y) - 0.04,
          },
          handsCount: hands.length,
          rawHands: hands,
        };
      }

      // --- OPEN PALM VARIANTS (Rose Bloom vs Floating Hearts) ---
      // All 4 fingers extended
      if (indexExt && middleExt && ringExt && pinkyExt) {
        // Vertical span between wrist and middle fingertip in video frame
        const verticalSpan = wrist.y - lm[12].y;

        // Upward Palm (holding flower): Hand is tilted horizontally or foreshortened
        const isUpwardHorizontal = verticalSpan < 0.19 || lm[9].z < wrist.z - 0.035;

        if (isUpwardHorizontal) {
          return {
            gesture: 'open_palm_up',
            confidence: 0.88,
            anchor: { x: lm[9].x, y: lm[9].y - 0.06 },
            handsCount: hands.length,
            rawHands: hands,
          };
        }

        // Frontal Open Palm (waving / stopping toward camera): Hand is held high & upright
        return {
          gesture: 'open_palm',
          confidence: 0.85,
          anchor: { x: lm[9].x, y: lm[9].y },
          handsCount: hands.length,
          rawHands: hands,
        };
      }
    }

    return {
      gesture: 'none',
      confidence: 0,
      anchor: { x: hands[0].landmarks[9].x, y: hands[0].landmarks[9].y },
      handsCount: hands.length,
      rawHands: hands,
    };
  }
}
