import { VisualEffect, EffectAnchor, Particle } from '../types';
import { drawBloomingRose, drawPetal } from '../proceduralShapes';

interface ActiveRose {
  x: number;
  y: number;
  size: number;
  bloomProgress: number; // 0.0 -> 1.0
  alpha: number;
  life: number;
  maxLife: number;
}

export class RoseBloomEffect implements VisualEffect {
  id = 'rose-bloom';
  name = 'Rose Bloom';

  private roses: ActiveRose[] = [];
  private petals: Particle[] = [];
  private width: number = 1280;
  private height: number = 720;
  private petalSpawnTimer: number = 0;
  private lastAnchor: EffectAnchor = { x: 0.5, y: 0.5 };
  private isHolding: boolean = false;

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number): void {
    this.lastAnchor = anchor;
    this.isHolding = true;

    // Spawn a new blooming rose hovering just above the palm
    this.roses.push({
      x: anchor.x,
      y: anchor.y,
      size: 55,
      bloomProgress: 0,
      alpha: 1.0,
      life: 0,
      maxLife: 3.5,
    });

    // Spawn initial shedding petals
    for (let i = 0; i < 6; i++) {
      this.petals.push({
        x: anchor.x * this.width + (Math.random() - 0.5) * 30,
        y: anchor.y * this.height + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 40,
        vy: 30 + Math.random() * 40,
        size: 10 + Math.random() * 8,
        alpha: 0.95,
        maxLife: 2.5 + Math.random() * 1.5,
        life: 0,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 2.0,
        color: i % 2 === 0 ? '#B85C70' : '#672F40',
      });
    }
  }

  update(dt: number, intensity: number, anchor?: EffectAnchor): void {
    if (anchor) this.lastAnchor = anchor;

    const intensityMult = intensity / 100;

    // Continuous shedding while holding palm
    if (this.isHolding) {
      this.petalSpawnTimer += dt;
      if (this.petalSpawnTimer >= Math.max(0.1, 0.25 / intensityMult)) {
        this.petalSpawnTimer = 0;
        this.petals.push({
          x: this.lastAnchor.x * this.width + (Math.random() - 0.5) * 40,
          y: this.lastAnchor.y * this.height + (Math.random() - 0.5) * 15,
          vx: (Math.random() - 0.5) * 30,
          vy: 25 + Math.random() * 45,
          size: 9 + Math.random() * 8,
          alpha: 0.9,
          maxLife: 2.8,
          life: 0,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 1.8,
          color: Math.random() > 0.4 ? '#B85C70' : '#D79AA6',
        });
      }
    }

    // Update roses
    this.roses = this.roses.filter((rose) => {
      rose.life += dt;
      if (rose.bloomProgress < 1.0) {
        rose.bloomProgress = Math.min(1.0, rose.bloomProgress + dt * 1.2);
      }
      rose.alpha = Math.max(0, 1 - rose.life / rose.maxLife);
      return rose.life < rose.maxLife;
    });

    // Update drifting petals
    this.petals = this.petals.filter((p) => {
      p.life += dt;
      // Fluttering sine wave horizontal sway
      p.x += p.vx * dt + Math.sin(p.life * 4) * 0.8;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      return p.life < p.maxLife;
    });
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    this.width = width;
    this.height = height;

    if (this.roses.length === 0 && this.petals.length === 0) return;

    ctx.save();

    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // 1. Render Blooming Roses
    this.roses.forEach((rose) => {
      const rx = rose.x * width;
      const ry = rose.y * height;

      ctx.save();
      ctx.shadowColor = 'rgba(103, 47, 64, 0.5)';
      ctx.shadowBlur = 20;

      drawBloomingRose(ctx, rx, ry, rose.size, rose.bloomProgress, rose.alpha);

      ctx.restore();
    });

    // 2. Render Falling Petals
    this.petals.forEach((p) => {
      drawPetal(ctx, p.x, p.y, p.size, p.rotation, p.color, p.alpha);
    });

    ctx.restore();
  }

  setHolding(holding: boolean): void {
    this.isHolding = holding;
  }

  hasActiveParticles(): boolean {
    return this.roses.length > 0 || this.petals.length > 0;
  }

  reset(): void {
    this.roses = [];
    this.petals = [];
    this.isHolding = false;
    this.petalSpawnTimer = 0;
  }

  destroy(): void {
    this.reset();
  }
}
