import { VisualEffect, EffectAnchor } from '../types';

interface FireworkSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  trail: Array<{ x: number; y: number }>;
}

export class CelebrationCrackersEffect implements VisualEffect {
  id = 'celebration-crackers';
  name = 'Celebration Crackers';

  private width: number = 1280;
  private height: number = 720;
  private anchor: EffectAnchor = { x: 0.5, y: 0.5 };
  private isHolding: boolean = false;
  private sparks: FireworkSpark[] = [];
  private fireworkTimer: number = 0;
  private hasBurst: boolean = false;

  private palette = [
    '#FFD700', // Gold Willow
    '#00E5FF', // Electric Cyan
    '#FF1744', // Crimson Burst
    '#76FF03', // Lime Spark
    '#E040FB', // Violet Orchid
    '#FF9100', // Amber Flare
    '#FFFFFF', // Diamond White
  ];

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number): void {
    this.anchor = anchor;
    this.isHolding = true;

    if (!this.hasBurst) {
      this.hasBurst = true;
      // Trigger instant multi-cracker detonation right at the hand anchor!
      const ax = this.anchor.x * this.width;
      const ay = this.anchor.y * this.height - 40;
      this.spawnCrackerBurst(ax, ay, 1.2);
    }
  }

  setHolding(holding: boolean): void {
    this.isHolding = holding;
  }

  hasActiveParticles(): boolean {
    return this.sparks.length > 0;
  }

  destroy(): void {
    this.reset();
  }

  private spawnCrackerBurst(cx: number, cy: number, intensityMult: number = 1.0): void {
    const burstColor = this.palette[Math.floor(Math.random() * this.palette.length)];
    const count = Math.floor(55 * intensityMult);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (90 + Math.random() * 260) * intensityMult;
      this.sparks.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 2.8,
        color: burstColor,
        alpha: 1.0,
        decay: 0.65 + Math.random() * 0.45,
        trail: [{ x: cx, y: cy }],
      });
    }
  }

  update(dt: number, intensity: number, currentAnchor?: EffectAnchor): void {
    // 0ms early return when idle to preserve 60 FPS
    if (!this.isHolding && this.sparks.length === 0) {
      if (this.hasBurst) this.hasBurst = false;
      return;
    }

    if (currentAnchor && this.isHolding) {
      this.anchor.x += (currentAnchor.x - this.anchor.x) * Math.min(1.0, 10 * dt);
      this.anchor.y += (currentAnchor.y - this.anchor.y) * Math.min(1.0, 10 * dt);
    }

    const intensityMult = 0.8 + (intensity / 100) * 0.4;

    // Launch celebratory background crackers while holding
    if (this.isHolding) {
      this.fireworkTimer += dt;
      if (this.fireworkTimer > 0.38 / intensityMult) {
        this.fireworkTimer = 0;
        const fx = this.width * (0.15 + Math.random() * 0.7);
        const fy = this.height * (0.12 + Math.random() * 0.4);
        this.spawnCrackerBurst(fx, fy, intensityMult);
      }
    }

    // Update cracker sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > 5) p.trail.pop();

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 85 * dt; // gravity
      p.vx *= 0.97; // drag
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.sparks.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, _height: number, isMirrored: boolean): void {
    if (this.sparks.length === 0) return;

    ctx.save();
    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.lineWidth = 1.6;
    this.sparks.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.alpha);

      // Trailing sparkling tail
      if (p.trail.length > 1) {
        ctx.strokeStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let t = 1; t < p.trail.length; t++) {
          ctx.lineTo(p.trail[t].x, p.trail[t].y);
        }
        ctx.stroke();
      }

      // Bright cracker head
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  reset(): void {
    this.fireworkTimer = 0;
    this.hasBurst = false;
    this.sparks = [];
  }
}
