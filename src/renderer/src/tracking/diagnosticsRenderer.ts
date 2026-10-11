import { TrackedHand, GestureEvent } from '../types/gesture';

const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm Base
  [5, 9], [9, 13], [13, 17],
];

export class DiagnosticsRenderer {
  /**
   * Render discrete, editorial landmark skeleton onto a canvas overlay.
   */
  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    hands: TrackedHand[],
    gestureEvent: GestureEvent | null,
    isMirrored: boolean
  ): void {
    ctx.clearRect(0, 0, width, height);

    if (!hands || hands.length === 0) return;

    ctx.save();

    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    hands.forEach((hand) => {
      const lm = hand.landmarks;
      if (!lm || lm.length < 21) return;

      // 1. Draw thin, restrained connector lines
      ctx.strokeStyle = 'rgba(214, 189, 145, 0.55)'; // Champagne translucent
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';

      HAND_CONNECTIONS.forEach(([start, end]) => {
        const p1 = lm[start];
        const p2 = lm[end];

        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      });

      // 2. Draw discrete landmark nodes
      lm.forEach((pt, i) => {
        const isFingertip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;

        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, isFingertip ? 3.5 : 2, 0, 2 * Math.PI);

        if (isFingertip) {
          ctx.fillStyle = '#D79AA6'; // Muted Rose
          ctx.strokeStyle = '#672F40';
          ctx.lineWidth = 1;
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(245, 239, 233, 0.7)';
          ctx.fill();
        }
      });
    });

    // 3. Draw Gesture Anchor Reticle if active
    if (gestureEvent && gestureEvent.gesture !== 'none') {
      const ax = gestureEvent.anchor.x * width;
      const ay = gestureEvent.anchor.y * height;

      // Draw subtle pulsing reticle
      ctx.beginPath();
      ctx.arc(ax, ay, 12, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(184, 92, 112, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Hold progress radial indicator
      if (gestureEvent.holdProgress > 0) {
        ctx.beginPath();
        ctx.arc(
          ax,
          ay,
          16,
          -Math.PI / 2,
          -Math.PI / 2 + gestureEvent.holdProgress * Math.PI * 2
        );
        ctx.strokeStyle = '#D6BD91';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Discrete gesture label pill above reticle
      ctx.font = '600 10px monospace';
      const textWidth = ctx.measureText(gestureEvent.label).width;
      ctx.fillStyle = 'rgba(20, 18, 17, 0.85)';
      ctx.fillRect(ax - textWidth / 2 - 6, ay - 30, textWidth + 12, 16);
      ctx.strokeStyle = 'rgba(214, 189, 145, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(ax - textWidth / 2 - 6, ay - 30, textWidth + 12, 16);
      ctx.fillStyle = '#F5EFE9';
      ctx.fillText(gestureEvent.label, ax - textWidth / 2, ay - 18);
    }

    ctx.restore();
  }
}
