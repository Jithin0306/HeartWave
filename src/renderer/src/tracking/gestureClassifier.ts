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
   * Check if a hand is forming a Korean Finger Heart (crossed/pinched thumb & index).
   */
  private checkFingerHeart(hand: TrackedHand): { isHeart: boolean; anchor: { x: number; y: number } } {
    const lm = hand.landmarks;
    const wrist = lm[0];
    const middleCurled = this.isFingerCurled(lm, 12, 10);
    const ringCurled = this.isFingerCurled(lm, 16, 14);
    const pinkyCurled = this.isFingerCurled(lm, 20, 18);
    const thumbIndexTipDist = dist2D(lm[4], lm[8]);
    const indexTipDistFromWrist = dist2D(wrist, lm[8]);
    const indexPipDistFromWrist = dist2D(wrist, lm[6]);
    const isPinchedHeart = thumbIndexTipDist < 0.11 && indexTipDistFromWrist > indexPipDistFromWrist * 1.05;

    if (isPinchedHeart && middleCurled && ringCurled && pinkyCurled) {
      return {
        isHeart: true,
        anchor: {
          x: (lm[4].x + lm[8].x) / 2,
          y: Math.min(lm[4].y, lm[8].y) - 0.04,
        },
      };
    }
    return { isHeart: false, anchor: { x: 0, y: 0 } };
  }

  private isHornsPose(lm: Point3D[]): boolean {
    const hornsThumbTucked = dist2D(lm[4], lm[10]) < 0.16 || dist2D(lm[4], lm[14]) < 0.16;
    return (
      this.isFingerExtended(lm, 8, 6, 5) &&
      this.isFingerExtended(lm, 20, 18, 17) &&
      this.isFingerCurled(lm, 12, 10) &&
      this.isFingerCurled(lm, 16, 14) &&
      hornsThumbTucked
    );
  }

  /**
   * Classify hand landmarks into a semantic gesture with mutually exclusive rules.
   */
  classify(hands: TrackedHand[]): GestureDetectionResult {
    // 1. Strict anti-hallucination filter: ignore background noise, bedding folds, and low-confidence detections
    const validHands = (hands || []).filter((h) => {
      if (h.score < 0.70) return false;
      if (!h.landmarks || h.landmarks.length < 21) return false;
      // Palm span filter: real foreground user hand has palm size >= 7% of screen
      const palmSpan = dist2D(h.landmarks[0], h.landmarks[9]);
      return palmSpan >= 0.07;
    });

    if (validHands.length === 0) {
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
    if (validHands.length >= 2) {
      const h1 = validHands[0];
      const h2 = validHands[1];

      // A. Dual-Hand Korean Finger Heart:
      // Both hands actively forming the finger heart gesture simultaneously!
      // Checked first so two finger hearts held close together don't falsely match joined two_hand_heart.
      const fh1 = this.checkFingerHeart(h1);
      const fh2 = this.checkFingerHeart(h2);

      if (fh1.isHeart && fh2.isHeart) {
        return {
          gesture: 'korean_finger_heart',
          confidence: 0.96,
          anchor: {
            x: (fh1.anchor.x + fh2.anchor.x) / 2,
            y: (fh1.anchor.y + fh2.anchor.y) / 2,
          },
          anchors: [fh1.anchor, fh2.anchor],
          handsCount: 2,
          rawHands: validHands,
        };
      }

      const wristsDist = dist2D(h1.landmarks[0], h2.landmarks[0]);
      const indexTipsDist = dist2D(h1.landmarks[8], h2.landmarks[8]);
      const thumbTipsDist = dist2D(h1.landmarks[4], h2.landmarks[4]);

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

      // B. Birthday Cake Cupped Hands Pose:
      // Both hands held together in lower/mid frame, all fingers extended flat/cupped holding cake platter
      const wristsYDiff = Math.abs(h1.landmarks[0].y - h2.landmarks[0].y);
      const indexKnuckleDist = dist2D(h1.landmarks[5], h2.landmarks[5]);

      if (
        h1AllExt &&
        h2AllExt &&
        wristsDist < 0.24 &&
        indexKnuckleDist > 0.06 &&
        indexKnuckleDist < 0.24 &&
        thumbTipsDist > 0.08 &&
        wristsYDiff < 0.10 &&
        h1.landmarks[0].y > 0.38 &&
        h2.landmarks[0].y > 0.38
      ) {
        return {
          gesture: 'birthday_cake',
          confidence: 0.95,
          anchor: {
            x: (h1.landmarks[9].x + h2.landmarks[9].x) / 2,
            y: (h1.landmarks[9].y + h2.landmarks[9].y) / 2 - 0.10,
          },
          handsCount: 2,
          rawHands: validHands,
        };
      }

      // C. Two-Hand Heart Pose:
      // Index fingertips touch or come close, Thumb tips touch or come close
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

      // D. Petal Rain Pose:
      // Both hands held wide apart in upper frame, all 4 fingers extended on both
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
    for (const hand of validHands) {
      const lm = hand.landmarks;
      const wrist = lm[0];

      const indexExt = this.isFingerExtended(lm, 8, 6, 5);
      const middleExt = this.isFingerExtended(lm, 12, 10, 9);
      const ringExt = this.isFingerExtended(lm, 16, 14, 13);
      const pinkyExt = this.isFingerExtended(lm, 20, 18, 17);

      const indexCurled = this.isFingerCurled(lm, 8, 6);
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
          handsCount: validHands.length,
          rawHands: validHands,
        };
      }

      // --- VICTORY / PEACE SIGN: Dedicated Celebration Trophy & Fireworks ---
      // Index & middle extended in a V-shape, ring & pinky curled
      const vSpread = dist2D(lm[8], lm[12]) > 0.035;
      const thumbTucked = lm[4].y > lm[6].y - 0.02 || dist2D(lm[4], lm[14]) < 0.15;
      if (indexExt && middleExt && ringCurled && pinkyCurled && vSpread && thumbTucked) {
        return {
          gesture: 'victory_fireworks',
          confidence: 0.94,
          anchor: { x: (lm[8].x + lm[12].x) / 2, y: (lm[8].y + lm[12].y) / 2 },
          handsCount: validHands.length,
          rawHands: validHands,
        };
      }

      // --- ROCK-ON / DEVIL HORNS: Dedicated Elemental Flame & Frost ---
      if (this.isHornsPose(lm)) {
        const hornsAnchors: Array<{ x: number; y: number }> = [];
        for (const h of validHands) {
          if (this.isHornsPose(h.landmarks)) {
            hornsAnchors.push({ x: h.landmarks[9].x, y: h.landmarks[9].y });
          }
        }
        return {
          gesture: 'flame_frost',
          confidence: 0.95,
          anchor: { x: lm[9].x, y: lm[9].y },
          anchors: hornsAnchors.length > 0 ? hornsAnchors : [{ x: lm[9].x, y: lm[9].y }],
          handsCount: validHands.length,
          rawHands: validHands,
        };
      }

      // --- KOREAN FINGER HEART: Crossed / Pinched Mini Heart ---
      const fh = this.checkFingerHeart(hand);
      if (fh.isHeart) {
        return {
          gesture: 'korean_finger_heart',
          confidence: 0.94,
          anchor: fh.anchor,
          anchors: [fh.anchor],
          handsCount: validHands.length,
          rawHands: validHands,
        };
      }

      // --- THUMBS UP: Dedicated Champagne Pop Gesture ---
      // All 4 fingers curled into palm, thumb extended straight upwards
      const thumbIsUp = lm[4].y < lm[3].y - 0.03 && lm[3].y < lm[2].y && lm[4].y < lm[5].y - 0.04;
      if (indexCurled && middleCurled && ringCurled && pinkyCurled && thumbIsUp) {
        return {
          gesture: 'champagne_pop',
          confidence: 0.95,
          anchor: { x: lm[4].x, y: lm[4].y },
          handsCount: validHands.length,
          rawHands: validHands,
        };
      }

      // --- CLOSED FIST: Dedicated 3D Rose Gesture ---
      // All 4 fingers curled into palm, no fingers extended, thumb not pointing up
      if (indexCurled && middleCurled && ringCurled && pinkyCurled && !indexExt && !middleExt && !ringExt && !pinkyExt && !thumbIsUp) {
        return {
          gesture: 'fist',
          confidence: 0.94,
          anchor: { x: lm[9].x, y: lm[9].y - 0.06 },
          handsCount: validHands.length,
          rawHands: validHands,
        };
      }

      // --- OPEN PALM: Dedicated Floating Hearts Gesture ---
      // All 4 fingers extended open, hand held vertically upright (fingers clearly above wrist)
      const isUpright = lm[12].y < wrist.y - 0.07;
      const thumbOpen = dist2D(lm[4], lm[2]) > 0.055 || thumbIndexTipDist > 0.07;

      if (indexExt && middleExt && ringExt && pinkyExt && isUpright && thumbOpen) {
        return {
          gesture: 'open_palm',
          confidence: 0.92,
          anchor: { x: lm[9].x, y: lm[9].y },
          handsCount: validHands.length,
          rawHands: validHands,
        };
      }
    }

    return {
      gesture: 'none',
      confidence: 0,
      anchor: { x: validHands[0].landmarks[9].x, y: validHands[0].landmarks[9].y },
      handsCount: validHands.length,
      rawHands: validHands,
    };
  }
}
