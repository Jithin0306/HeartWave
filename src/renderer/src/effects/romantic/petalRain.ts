import { VisualEffect, EffectAnchor, Particle } from '../types';
import { drawPetal } from '../proceduralShapes';

export class PetalRainEffect implements VisualEffect {
  id = 'petal-rain';
  name = 'Petal Rain';

  private petals: Particle[] = [];
  private width: number = 1280;
  private height: number = 720;
  private isRaining: boolean = false;
  private spawnTimer: number = 0;

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.reset();
  }

  onGestureTrigger(_anchor: EffectAnchor, _confidence: number): void {
    this.isRaining = true;

    // Initial burst across width
    for (let i = 0; i < 24; i++) {
      this.petals.push({
        x: Math.random() * this.width,
        y: -10 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 35,
        vy: 40 + Math.random() * 60,
        size: 9 + Math.random() * 12,
        alpha: 0.9,
        maxLife: 6.0,
        life: 0,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 2.0,
        color: Math.random() > 0.5 ? '#B85C70' : '#D79AA6',
      });
    }
  }

  update(dt: number, intensity: number, _anchor?: EffectAnchor): void {
    const intensityMult = intensity / 100;

    if (this.isRaining) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= Math.max(0.06, 0.15 / intensityMult)) {
        this.spawnTimer = 0;
        this.petals.push({
          x: Math.random() * this.width,
          y: -15,
          vx: (Math.random() - 0.5) * 35,
          vy: 45 + Math.random() * 55 * intensityMult,
          size: 9 + Math.random() * 11,
          alpha: 0.95,
          maxLife: 6.5,
          life: 0,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 2.0,
          color: Math.random() > 0.6 ? '#672F40' : Math.random() > 0.3 ? '#B85C70' : '#D79AA6',
        });
      }
    }

    this.petals = this.petals.filter((p) => {
      p.life += dt;
      p.x += p.vx * dt + Math.sin(p.life * 2.5 + p.y * 0.01) * 0.9;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      p.alpha = Math.max(0, 1 - p.y / (this.height * 1.1));
      return p.y < this.height + 20 && p.life < p.maxLife;
    });
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    this.width = width;
    this.height = height;

    if (this.petals.length === 0) return;

    ctx.save();

    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    this.petals.forEach((p) => {
      drawPetal(ctx, p.x, p.y, p.size, p.rotation, p.color, p.alpha);
    });

    ctx.restore();
  }

  setHolding(holding: boolean): void {
    this.isRaining = holding;
  }

  hasActiveParticles(): boolean {
    return this.petals.length > 0;
  }

  reset(): void {
    this.petals = [];
    this.isRaining = false;
    this.spawnTimer = 0;
  }

  destroy(): void {
    this.reset();
  }
}
