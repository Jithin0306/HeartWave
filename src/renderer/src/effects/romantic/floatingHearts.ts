import { VisualEffect, EffectAnchor, Particle } from '../types';
import { drawRefinedHeart } from '../proceduralShapes';

export class FloatingHeartsEffect implements VisualEffect {
  id = 'floating-hearts';
  name = 'Floating Hearts';

  private particles: Particle[] = [];
  private width: number = 1280;
  private height: number = 720;
  private spawnTimer: number = 0;
  private isHolding: boolean = false;
  private lastAnchor: EffectAnchor = { x: 0.5, y: 0.5 };

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number): void {
    this.lastAnchor = anchor;
    this.isHolding = true;

    // Gentle initial burst of hearts (restrained & fluid)
    if (this.particles.length === 0) {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: anchor.x * this.width + (Math.random() - 0.5) * 40,
          y: anchor.y * this.height + (Math.random() - 0.5) * 15,
          vx: (Math.random() - 0.5) * 35,
          vy: -60 - Math.random() * 45,
          size: 11 + Math.random() * 9,
          alpha: 0.95,
          maxLife: 2.2 + Math.random() * 0.8,
          life: 0,
          rotation: (Math.random() - 0.5) * 0.3,
          vRot: (Math.random() - 0.5) * 0.3,
          color: i % 2 === 0 ? '#D79AA6' : '#B85C70',
        });
      }
    }
  }

  update(dt: number, intensity: number, anchor?: EffectAnchor): void {
    if (anchor) this.lastAnchor = anchor;

    const intensityMult = Math.max(0.5, intensity / 100);

    // Controlled spawn rate: 1 heart every ~0.4s, max 8 particles active to eliminate any lag
    if (this.isHolding && this.particles.length < 8) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= Math.max(0.35, 0.6 / intensityMult)) {
        this.spawnTimer = 0;
        this.particles.push({
          x: this.lastAnchor.x * this.width + (Math.random() - 0.5) * 50,
          y: this.lastAnchor.y * this.height,
          vx: (Math.random() - 0.5) * 30,
          vy: -55 - Math.random() * 45 * intensityMult,
          size: 10 + Math.random() * 9,
          alpha: 0.9,
          maxLife: 2.5,
          life: 0,
          rotation: (Math.random() - 0.5) * 0.3,
          vRot: (Math.random() - 0.5) * 0.3,
          color: Math.random() > 0.5 ? '#D79AA6' : '#F5EFE9',
        });
      }
    }

    this.particles = this.particles.filter((p) => {
      p.life += dt;
      p.x += p.vx * dt + Math.sin(p.life * 2.5) * 0.7;
      p.y += p.vy * dt;
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
      ctx.globalAlpha = p.alpha;
      drawRefinedHeart(ctx, p.x, p.y, p.size, p.color, '#FFFFFF', 1);
      ctx.restore();
    });

    ctx.restore();
  }

  setHolding(holding: boolean): void {
    this.isHolding = holding;
    if (!holding) {
      this.spawnTimer = 0;
    }
  }

  hasActiveParticles(): boolean {
    return this.particles.length > 0;
  }

  reset(): void {
    this.particles = [];
    this.isHolding = false;
    this.spawnTimer = 0;
  }

  destroy(): void {
    this.reset();
  }
}
