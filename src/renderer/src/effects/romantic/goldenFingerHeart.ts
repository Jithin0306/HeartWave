import { VisualEffect, EffectAnchor } from '../types';
import { drawGoldenHeart } from '../proceduralShapes';

interface PersistentGoldenHeart {
  x: number; // Normalized 0..1 in video space
  y: number; // Normalized 0..1 in video space
  size: number;
  scale: number;
  targetScale: number;
  alpha: number;
  breathTime: number;
}

export class GoldenFingerHeartEffect implements VisualEffect {
  id = 'golden-finger-heart';
  name = 'Golden Finger Heart';

  private heart: PersistentGoldenHeart | null = null;
  private isHolding: boolean = false;
  private targetAnchor: EffectAnchor = { x: 0.5, y: 0.5 };

  init(_width: number, _height: number): void {
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number): void {
    this.targetAnchor = anchor;
    this.isHolding = true;

    if (!this.heart) {
      // Create single persistent heart at the finger
      this.heart = {
        x: anchor.x,
        y: anchor.y,
        size: 32,
        scale: 0.1,
        targetScale: 1.0,
        alpha: 1.0,
        breathTime: 0,
      };
    } else {
      this.heart.targetScale = 1.0;
    }
  }

  update(dt: number, intensity: number, currentAnchor?: EffectAnchor): void {
    if (currentAnchor && this.isHolding) {
      this.targetAnchor = currentAnchor;
    }

    if (!this.heart) return;

    const intensityScale = 0.8 + (intensity / 100) * 0.4;

    if (this.isHolding) {
      // 1. Silky-smooth LERP following the finger without jitter or lag
      const followSpeed = 16;
      this.heart.x += (this.targetAnchor.x - this.heart.x) * Math.min(1.0, followSpeed * dt);
      this.heart.y += (this.targetAnchor.y - this.heart.y) * Math.min(1.0, followSpeed * dt);

      // 2. Growth easing into target scale with user intensity scaling
      this.heart.scale += (this.heart.targetScale * intensityScale - this.heart.scale) * Math.min(1.0, 10 * dt);

      // 3. Subtle breathing cycle (no particle spam)
      this.heart.breathTime += dt * 3.2;
      this.heart.alpha = 1.0;
    } else {
      // Clean, elegant fade-out when released
      this.heart.scale += (0.2 - this.heart.scale) * Math.min(1.0, 8 * dt);
      this.heart.alpha -= dt * 3.5;

      if (this.heart.alpha <= 0.02) {
        this.heart = null;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    if (!this.heart) return;

    ctx.save();

    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    const px = this.heart.x * width;
    const py = this.heart.y * height;

    // Gentle micro-breath oscillation
    const breathOffset = Math.sin(this.heart.breathTime) * 0.05;
    const currentScale = Math.max(0.05, this.heart.scale + (this.isHolding ? breathOffset : 0));

    drawGoldenHeart(
      ctx,
      px,
      py,
      this.heart.size,
      this.heart.alpha,
      currentScale
    );

    ctx.restore();
  }

  setHolding(holding: boolean): void {
    this.isHolding = holding;
    if (!holding && this.heart) {
      this.heart.targetScale = 0.2;
    }
  }

  hasActiveParticles(): boolean {
    return this.heart !== null;
  }

  reset(): void {
    this.heart = null;
    this.isHolding = false;
  }

  destroy(): void {
    this.reset();
  }
}
