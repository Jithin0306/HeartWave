import { VisualEffect, EffectAnchor } from '../types';

interface AuraRing {
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export class LoveAuraEffect implements VisualEffect {
  id = 'love-aura';
  name = 'Love Aura';

  private rings: AuraRing[] = [];
  private lastAnchor: EffectAnchor = { x: 0.5, y: 0.5 };
  private ringTimer: number = 0;
  private isHolding: boolean = false;
  private breatheTime: number = 0;

  init(_width: number, _height: number): void {
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number): void {
    this.lastAnchor = anchor;
    this.isHolding = true;

    this.rings.push({
      radius: 20,
      maxRadius: 180,
      alpha: 0.85,
      color: '#B85C70',
    });
  }

  update(dt: number, intensity: number, anchor?: EffectAnchor): void {
    if (anchor) this.lastAnchor = anchor;

    this.breatheTime += dt;
    const intensityMult = intensity / 100;

    if (this.isHolding) {
      this.ringTimer += dt;
      if (this.ringTimer >= Math.max(0.25, 0.6 / intensityMult)) {
        this.ringTimer = 0;
        this.rings.push({
          radius: 25,
          maxRadius: 140 + Math.random() * 60,
          alpha: 0.8,
          color: Math.random() > 0.5 ? '#B85C70' : '#D6BD91',
        });
      }
    }

    this.rings = this.rings.filter((r) => {
      r.radius += dt * 75 * intensityMult;
      r.alpha = Math.max(0, 1 - r.radius / r.maxRadius);
      return r.radius < r.maxRadius;
    });
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    if (this.rings.length === 0) return;

    ctx.save();

    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    const cx = this.lastAnchor.x * width;
    const cy = this.lastAnchor.y * height;

    // Center breathing core halo
    const breatheScale = 1 + Math.sin(this.breatheTime * 2.5) * 0.15;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 45 * breatheScale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(184, 92, 112, 0.2)';
    ctx.shadowColor = 'rgba(215, 154, 166, 0.5)';
    ctx.shadowBlur = 24;
    ctx.fill();
    ctx.restore();

    // Concentric expanding aura rings
    this.rings.forEach((r) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = r.alpha;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();
  }

  setHolding(holding: boolean): void {
    this.isHolding = holding;
  }

  hasActiveParticles(): boolean {
    return this.rings.length > 0;
  }

  reset(): void {
    this.rings = [];
    this.isHolding = false;
    this.ringTimer = 0;
  }

  destroy(): void {
    this.reset();
  }
}
