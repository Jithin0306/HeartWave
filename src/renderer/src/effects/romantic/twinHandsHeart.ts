import { VisualEffect, EffectAnchor } from '../types';
import { drawBigVelvetHeart } from '../proceduralShapes';

interface PersistentBigHeart {
  x: number;
  y: number;
  size: number;
  scale: number;
  targetScale: number;
  alpha: number;
  pulseTime: number;
}

export class TwinHandsHeartEffect implements VisualEffect {
  id = 'big-heart';
  name = 'Twin Hands Heart';

  private heart: PersistentBigHeart | null = null;
  private isHolding: boolean = false;
  private targetAnchor: EffectAnchor = { x: 0.5, y: 0.5 };

  init(_width: number, _height: number): void {
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number): void {
    this.targetAnchor = anchor;
    this.isHolding = true;

    if (!this.heart) {
      // Create single persistent big heart between joined hands
      this.heart = {
        x: anchor.x,
        y: anchor.y,
        size: 130,
        scale: 0.1,
        targetScale: 1.0,
        alpha: 1.0,
        pulseTime: 0,
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

    const intensityMultiplier = 0.8 + (intensity / 100) * 0.4;

    if (this.isHolding) {
      // 1. Silky-smooth LERP following the center between hands
      const followSpeed = 14;
      this.heart.x += (this.targetAnchor.x - this.heart.x) * Math.min(1.0, followSpeed * dt);
      this.heart.y += (this.targetAnchor.y - this.heart.y) * Math.min(1.0, followSpeed * dt);

      // 2. Growth easing into target scale
      this.heart.scale += (this.heart.targetScale * intensityMultiplier - this.heart.scale) * Math.min(1.0, 9 * dt);

      // 3. Authentic dual-thump heartbeat rhythm
      this.heart.pulseTime += dt * 4.0;
      this.heart.alpha = 1.0;
    } else {
      // Clean dissolve on hand separation
      this.heart.scale += (0.2 - this.heart.scale) * Math.min(1.0, 7 * dt);
      this.heart.alpha -= dt * 3.2;

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

    // Dual-thump heartbeat pulse curve (lub-dub rhythm)
    let pulseScale = 0;
    if (this.isHolding) {
      const cycle = (this.heart.pulseTime % (Math.PI * 2));
      if (cycle < 0.6) {
        // First thump (systole)
        pulseScale = Math.sin((cycle / 0.6) * Math.PI) * 0.08;
      } else if (cycle > 0.8 && cycle < 1.4) {
        // Second thump (diastole)
        pulseScale = Math.sin(((cycle - 0.8) / 0.6) * Math.PI) * 0.05;
      }
    }

    const currentScale = Math.max(0.05, this.heart.scale + pulseScale);

    drawBigVelvetHeart(
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
