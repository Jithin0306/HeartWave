import { VisualEffect, EffectAnchor } from '../types';
import { drawGoldenHeart } from '../proceduralShapes';

interface PersistentGoldenHeart {
  x: number; // Normalized 0..1 in video space
  y: number; // Normalized 0..1 in video space
  targetX: number;
  targetY: number;
  size: number;
  scale: number;
  targetScale: number;
  alpha: number;
  breathTime: number;
  isHolding: boolean;
}

export class GoldenFingerHeartEffect implements VisualEffect {
  id = 'golden-finger-heart';
  name = 'Golden Finger Heart';

  private hearts: PersistentGoldenHeart[] = [];
  private isHolding: boolean = false;

  init(_width: number, _height: number): void {
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number, anchors?: EffectAnchor[]): void {
    const activeAnchors = (anchors && anchors.length > 0) ? anchors : [anchor];
    this.isHolding = true;

    this.syncHearts(activeAnchors, 0.25, true);
  }

  private syncHearts(activeAnchors: EffectAnchor[], threshold: number, resetScale: boolean): void {
    const claimed = new Set<PersistentGoldenHeart>();

    for (const targetAnchor of activeAnchors) {
      let bestDist = Infinity;
      let matchedHeart: PersistentGoldenHeart | null = null;

      for (const h of this.hearts) {
        if (claimed.has(h)) continue;
        const d = Math.hypot(h.targetX - targetAnchor.x, h.targetY - targetAnchor.y);
        if (d < threshold && d < bestDist) {
          bestDist = d;
          matchedHeart = h;
        }
      }

      if (matchedHeart) {
        matchedHeart.targetX = targetAnchor.x;
        matchedHeart.targetY = targetAnchor.y;
        if (resetScale) {
          matchedHeart.targetScale = 1.0;
        }
        matchedHeart.isHolding = true;
        claimed.add(matchedHeart);
      } else {
        const newHeart: PersistentGoldenHeart = {
          x: targetAnchor.x,
          y: targetAnchor.y,
          targetX: targetAnchor.x,
          targetY: targetAnchor.y,
          size: 32,
          scale: 0.1,
          targetScale: 1.0,
          alpha: 1.0,
          breathTime: Math.random() * Math.PI,
          isHolding: true,
        };
        this.hearts.push(newHeart);
        claimed.add(newHeart);
      }
    }

    for (const h of this.hearts) {
      if (!claimed.has(h)) {
        h.isHolding = false;
      }
    }
  }

  update(dt: number, intensity: number, currentAnchor?: EffectAnchor, currentAnchors?: EffectAnchor[]): void {
    const activeAnchors = (currentAnchors && currentAnchors.length > 0)
      ? currentAnchors
      : (currentAnchor ? [currentAnchor] : []);

    if (this.isHolding && activeAnchors.length > 0) {
      this.syncHearts(activeAnchors, 0.35, false);
    }

    if (this.hearts.length === 0) return;

    const intensityScale = 0.8 + (intensity / 100) * 0.4;
    const followSpeed = 16;

    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      if (this.isHolding && h.isHolding) {
        h.x += (h.targetX - h.x) * Math.min(1.0, followSpeed * dt);
        h.y += (h.targetY - h.y) * Math.min(1.0, followSpeed * dt);
        h.scale += (h.targetScale * intensityScale - h.scale) * Math.min(1.0, 10 * dt);
        h.breathTime += dt * 3.2;
        h.alpha = 1.0;
      } else {
        h.scale += (0.2 - h.scale) * Math.min(1.0, 8 * dt);
        h.alpha -= dt * 3.5;
        if (h.alpha <= 0.02) {
          this.hearts.splice(i, 1);
        }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    if (this.hearts.length === 0) return;

    ctx.save();

    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    for (const h of this.hearts) {
      const px = h.x * width;
      const py = h.y * height;

      // Gentle micro-breath oscillation
      const breathOffset = Math.sin(h.breathTime) * 0.05;
      const currentScale = Math.max(0.05, h.scale + ((this.isHolding && h.isHolding) ? breathOffset : 0));

      drawGoldenHeart(
        ctx,
        px,
        py,
        h.size,
        h.alpha,
        currentScale
      );
    }

    ctx.restore();
  }

  setHolding(holding: boolean): void {
    this.isHolding = holding;
    if (!holding) {
      this.hearts.forEach((h) => {
        h.isHolding = false;
        h.targetScale = 0.2;
      });
    }
  }

  hasActiveParticles(): boolean {
    return this.hearts.length > 0;
  }

  reset(): void {
    this.hearts = [];
    this.isHolding = false;
  }

  destroy(): void {
    this.reset();
  }
}
