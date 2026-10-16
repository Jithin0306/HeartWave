import { VisualEffect, EffectAnchor, Particle } from '../types';
import { drawSparkle } from '../proceduralShapes';

export class CupidSparkEffect implements VisualEffect {
  id = 'cupid-spark';
  name = 'Cupid Spark';

  private particles: Particle[] = [];
  private width: number = 1280;
  private height: number = 720;
  private lastAnchor: EffectAnchor = { x: 0.5, y: 0.5 };
  private isPointing: boolean = false;
  private sparkTimer: number = 0;

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number): void {
    this.lastAnchor = anchor;
    this.isPointing = true;

    // Controlled burst at fingertip (restrained & sharp)
    if (this.particles.length === 0) {
      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 35 + Math.random() * 50;
        this.particles.push({
          x: anchor.x * this.width,
          y: anchor.y * this.height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 8 + Math.random() * 8,
          alpha: 1.0,
          maxLife: 1.0 + Math.random() * 0.6,
          life: 0,
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 4.0,
          color: i % 2 === 0 ? '#D6BD91' : '#F5EFE9',
        });
      }
    }
  }

  update(dt: number, intensity: number, anchor?: EffectAnchor): void {
    if (anchor) this.lastAnchor = anchor;

    const intensityMult = Math.max(0.5, intensity / 100);

    // Follow moving fingertip and emit delicate sparkle trail (max 8 particles)
    if (this.isPointing && this.particles.length < 8) {
      this.sparkTimer += dt;
      if (this.sparkTimer >= Math.max(0.18, 0.32 / intensityMult)) {
        this.sparkTimer = 0;
        this.particles.push({
          x: this.lastAnchor.x * this.width + (Math.random() - 0.5) * 8,
          y: this.lastAnchor.y * this.height + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20 - 15,
          size: 7 + Math.random() * 6,
          alpha: 0.95,
          maxLife: 0.8 + Math.random() * 0.4,
          life: 0,
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 3.0,
          color: Math.random() > 0.4 ? '#D6BD91' : '#D79AA6',
        });
      }
    }

    this.particles = this.particles.filter((p) => {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      return p.life < p.maxLife;
    });
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    this.width = width;
    this.height = height;

    if (this.particles.length === 0) return;

    ctx.save();

    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    this.particles.forEach((p) => {
      ctx.save();
      drawSparkle(ctx, p.x, p.y, p.size, p.rotation, p.color, p.alpha);
      ctx.restore();
    });

    ctx.restore();
  }

  setHolding(holding: boolean): void {
    this.isPointing = holding;
  }

  hasActiveParticles(): boolean {
    return this.particles.length > 0;
  }

  reset(): void {
    this.particles = [];
    this.isPointing = false;
    this.sparkTimer = 0;
  }

  destroy(): void {
    this.reset();
  }
}
