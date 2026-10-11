import { VisualEffect, EffectAnchor, Particle } from '../types';
import { drawRefinedHeart } from '../proceduralShapes';

interface HeartPulse {
  x: number;
  y: number;
  size: number;
  maxSize: number;
  alpha: number;
  growthRate: number;
  life: number;
  maxLife: number;
}

export class HeartDrawEffect implements VisualEffect {
  id = 'heart-draw';
  name = 'Heart Draw';

  private mainHearts: HeartPulse[] = [];
  private miniParticles: Particle[] = [];
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

    // Spawn an expanding pulsing heart at the anchor
    this.mainHearts.push({
      x: anchor.x,
      y: anchor.y,
      size: 15,
      maxSize: 65,
      alpha: 1.0,
      growthRate: 40,
      life: 0,
      maxLife: 2.2, // seconds
    });

    // Spawn initial burst of floating mini hearts
    for (let i = 0; i < 8; i++) {
      const angle = (Math.random() * Math.PI) + Math.PI; // Upward arc
      const speed = 40 + Math.random() * 60;
      this.miniParticles.push({
        x: anchor.x * this.width + (Math.random() - 0.5) * 20,
        y: anchor.y * this.height + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        size: 8 + Math.random() * 10,
        alpha: 0.9,
        maxLife: 2.0 + Math.random() * 1.0,
        life: 0,
        rotation: (Math.random() - 0.5) * 0.4,
        vRot: (Math.random() - 0.5) * 0.5,
        color: i % 2 === 0 ? '#B85C70' : '#D79AA6',
      });
    }
  }

  update(dt: number, intensity: number, anchor?: EffectAnchor): void {
    if (anchor) {
      this.lastAnchor = anchor;
    }

    const intensityMultiplier = intensity / 100;

    // Continuous mini-heart emitter while holding
    if (this.isHolding) {
      this.spawnTimer += dt;
      const spawnInterval = Math.max(0.06, 0.18 / (intensityMultiplier || 1));

      if (this.spawnTimer >= spawnInterval) {
        this.spawnTimer = 0;
        this.miniParticles.push({
          x: this.lastAnchor.x * this.width + (Math.random() - 0.5) * 30,
          y: this.lastAnchor.y * this.height + (Math.random() - 0.5) * 15,
          vx: (Math.random() - 0.5) * 35,
          vy: -60 - Math.random() * 50 * intensityMultiplier,
          size: 7 + Math.random() * 9,
          alpha: 0.95,
          maxLife: 1.8 + Math.random() * 0.8,
          life: 0,
          rotation: (Math.random() - 0.5) * 0.3,
          vRot: (Math.random() - 0.5) * 0.6,
          color: Math.random() > 0.4 ? '#D79AA6' : '#D6BD91',
        });
      }
    }

    // Update main pulsing hearts
    this.mainHearts = this.mainHearts.filter((heart) => {
      heart.life += dt;
      if (heart.size < heart.maxSize) {
        heart.size += heart.growthRate * dt;
      }
      heart.alpha = Math.max(0, 1 - heart.life / heart.maxLife);
      return heart.life < heart.maxLife;
    });

    // Update floating mini-hearts
    this.miniParticles = this.miniParticles.filter((p) => {
      p.life += dt;
      p.x += p.vx * dt + Math.sin(p.life * 3) * 0.5;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      return p.life < p.maxLife;
    });
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    this.width = width;
    this.height = height;

    if (this.mainHearts.length === 0 && this.miniParticles.length === 0) return;

    ctx.save();

    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // 1. Render Main Pulsing Hearts
    this.mainHearts.forEach((heart) => {
      const px = heart.x * width;
      const py = heart.y * height;

      ctx.save();
      ctx.globalAlpha = heart.alpha;

      // Subtle warm outer glow
      ctx.shadowColor = 'rgba(184, 92, 112, 0.6)';
      ctx.shadowBlur = 18;

      // Draw primary vector heart
      drawRefinedHeart(
        ctx,
        px,
        py,
        heart.size,
        'rgba(184, 92, 112, 0.4)',
        '#F5EFE9',
        2.5
      );

      // Inner accent pulse ring
      drawRefinedHeart(
        ctx,
        px,
        py,
        heart.size * 0.75,
        undefined,
        '#D6BD91',
        1.5
      );

      ctx.restore();
    });

    // 2. Render Drifting Mini Hearts
    this.miniParticles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = 'rgba(215, 154, 166, 0.4)';
      ctx.shadowBlur = 8;

      drawRefinedHeart(ctx, p.x, p.y, p.size, p.color, '#FFFFFF', 1);

      ctx.restore();
    });

    ctx.restore();
  }

  setHolding(holding: boolean): void {
    this.isHolding = holding;
  }

  hasActiveParticles(): boolean {
    return this.mainHearts.length > 0 || this.miniParticles.length > 0;
  }

  reset(): void {
    this.mainHearts = [];
    this.miniParticles = [];
    this.isHolding = false;
    this.spawnTimer = 0;
  }

  destroy(): void {
    this.reset();
  }
}
