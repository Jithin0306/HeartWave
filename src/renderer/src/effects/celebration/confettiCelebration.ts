import { VisualEffect, EffectAnchor } from '../types';

interface RibbonConfetti {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  color: string;
  alpha: number;
  decay: number;
}

interface SparkleStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export class ConfettiCelebrationEffect implements VisualEffect {
  id = 'confetti-celebration';
  name = 'Confetti Celebration';

  private width: number = 1280;
  private height: number = 720;
  private anchor: EffectAnchor = { x: 0.5, y: 0.7 };
  private isHolding: boolean = false;
  private spawnCooldown: number = 0;
  private hasTriggerBurst: boolean = false;

  private ribbons: RibbonConfetti[] = [];
  private sparkles: SparkleStar[] = [];

  private palette = [
    '#FFD700', // Metallic Gold
    '#FF1744', // Vivid Ruby
    '#00E5FF', // Electric Cyan
    '#76FF03', // Neon Lime
    '#E040FB', // Radiant Violet
    '#FF9100', // Sunset Amber
    '#FFFFFF', // Diamond White
    '#F50057', // Hot Pink
  ];

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number): void {
    this.anchor = anchor;
    this.isHolding = true;

    if (!this.hasTriggerBurst) {
      this.hasTriggerBurst = true;
      this.spawnGrandBurst(1.0);
    }
  }

  setHolding(holding: boolean): void {
    this.isHolding = holding;
  }

  hasActiveParticles(): boolean {
    return this.ribbons.length > 0 || this.sparkles.length > 0;
  }

  destroy(): void {
    this.reset();
  }

  private spawnGrandBurst(intensityMult: number = 1.0): void {
    const originX = this.anchor.x * this.width;
    const originY = Math.max(80, this.anchor.y * this.height - 20);
    const count = Math.floor(110 * intensityMult);

    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
      const speed = (220 + Math.random() * 380) * intensityMult;
      this.ribbons.push({
        x: originX + (Math.random() - 0.5) * 40,
        y: originY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        width: 6 + Math.random() * 8,
        height: 12 + Math.random() * 12,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 4 + Math.random() * 6,
        color: this.palette[Math.floor(Math.random() * this.palette.length)],
        alpha: 1.0,
        decay: 0.22 + Math.random() * 0.26,
      });
    }

    // Golden star sparkles at origin
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 200;
      this.sparkles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3,
        color: Math.random() > 0.4 ? '#FFE082' : '#FFFFFF',
        alpha: 1.0,
        decay: 1.5 + Math.random() * 1.8,
      });
    }
  }

  update(dt: number, intensity: number, currentAnchor?: EffectAnchor): void {
    // 0ms early return when idle
    if (!this.isHolding && this.ribbons.length === 0 && this.sparkles.length === 0) {
      if (this.hasTriggerBurst) this.hasTriggerBurst = false;
      return;
    }

    if (currentAnchor && this.isHolding) {
      this.anchor.x += (currentAnchor.x - this.anchor.x) * Math.min(1.0, 10 * dt);
      this.anchor.y += (currentAnchor.y - this.anchor.y) * Math.min(1.0, 10 * dt);
    }

    const intensityMult = 0.8 + (intensity / 100) * 0.4;

    // Continuous festive rain while holding
    if (this.isHolding) {
      this.spawnCooldown += dt;
      if (this.spawnCooldown > 0.16 / intensityMult) {
        this.spawnCooldown = 0;
        const originX = this.anchor.x * this.width + (Math.random() - 0.5) * 80;
        const originY = Math.max(60, this.anchor.y * this.height - 40);

        for (let i = 0; i < 6; i++) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
          const speed = 140 + Math.random() * 220;
          this.ribbons.push({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            width: 6 + Math.random() * 7,
            height: 10 + Math.random() * 10,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 8,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 4 + Math.random() * 5,
            color: this.palette[Math.floor(Math.random() * this.palette.length)],
            alpha: 1.0,
            decay: 0.28 + Math.random() * 0.25,
          });
        }
      }
    }

    // Update ribbons
    for (let i = this.ribbons.length - 1; i >= 0; i--) {
      const p = this.ribbons[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 85 * dt; // gravity
      p.vx *= 0.982; // air drag
      p.rotation += p.rotationSpeed * dt;
      p.wobble += p.wobbleSpeed * dt;
      p.x += Math.sin(p.wobble) * 1.6;
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0 || p.y > this.height + 40) {
        this.ribbons.splice(i, 1);
      }
    }

    // Update sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 60 * dt;
      s.alpha -= s.decay * dt;

      if (s.alpha <= 0) {
        this.sparkles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, _height: number, isMirrored: boolean): void {
    if (this.ribbons.length === 0 && this.sparkles.length === 0) return;

    ctx.save();
    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // Render confetti ribbons
    this.ribbons.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.cos(p.wobble), 1);

      ctx.fillStyle = p.color;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);

      // Shimmer highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width * 0.35, p.height);

      ctx.restore();
    });

    // Render sparkles
    this.sparkles.forEach((s) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  reset(): void {
    this.ribbons = [];
    this.sparkles = [];
    this.spawnCooldown = 0;
    this.hasTriggerBurst = false;
  }
}
