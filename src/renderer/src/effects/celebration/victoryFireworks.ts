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

export class VictoryFireworksEffect implements VisualEffect {
  id = 'victory-fireworks';
  name = 'Victory Trophy & Fireworks';

  private width: number = 1280;
  private height: number = 720;
  private anchor: EffectAnchor = { x: 0.5, y: 0.6 };
  private isHolding: boolean = false;
  private trophyScale: number = 0;
  private ageTime: number = 0;

  private sparks: FireworkSpark[] = [];
  private fireworkTimer: number = 0;
  private hasBurst: boolean = false;

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
      this.spawnFireworkBurst(Math.random() * this.width, this.height * (0.2 + Math.random() * 0.25));
    }
  }

  setHolding(holding: boolean): void {
    this.isHolding = holding;
  }

  private spawnFireworkBurst(cx: number, cy: number): void {
    const palette = [
      '#FFD700', // Gold Willow
      '#00E5FF', // Electric Cyan
      '#FF4081', // Neon Pink
      '#76FF03', // Lime Spark
      '#FFF3E0', // Diamond White
    ];
    const burstColor = palette[Math.floor(Math.random() * palette.length)];

    for (let i = 0; i < 55; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 220;
      this.sparks.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 2.5,
        color: burstColor,
        alpha: 1.0,
        decay: 0.65 + Math.random() * 0.45,
        trail: [{ x: cx, y: cy }],
      });
    }
  }

  update(dt: number, intensity: number, currentAnchor?: EffectAnchor): void {
    if (currentAnchor && this.isHolding) {
      this.anchor.x += (currentAnchor.x - this.anchor.x) * Math.min(1.0, 10 * dt);
      this.anchor.y += (currentAnchor.y - this.anchor.y) * Math.min(1.0, 10 * dt);
    }

    this.ageTime += dt;
    const intensityMult = 0.8 + (intensity / 100) * 0.4;
    const targetScale = this.isHolding ? 1.0 : 0.0;
    this.trophyScale += (targetScale - this.trophyScale) * Math.min(1.0, 8 * dt);

    if (this.trophyScale < 0.02 && !this.isHolding && this.sparks.length === 0) {
      this.reset();
      return;
    }

    // Launch random background fireworks while holding
    if (this.isHolding) {
      this.fireworkTimer += dt;
      if (this.fireworkTimer > 0.45 / intensityMult) {
        this.fireworkTimer = 0;
        const fx = this.width * (0.15 + Math.random() * 0.7);
        const fy = this.height * (0.12 + Math.random() * 0.32);
        this.spawnFireworkBurst(fx, fy);
      }
    }

    // Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > 5) p.trail.pop();

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt; // gravity
      p.vx *= 0.97; // drag
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.sparks.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    if (this.trophyScale < 0.02 && this.sparks.length === 0) return;

    ctx.save();
    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // 1. Render Fireworks in background
    this.renderFireworks(ctx);

    // 2. Render 3D Gold Trophy at V-sign anchor
    const cx = this.anchor.x * width;
    const cy = this.anchor.y * height;
    const s = this.trophyScale;

    if (s > 0.05) {
      this.renderTrophy(ctx, cx, cy, s, isMirrored);
    }

    ctx.restore();
  }

  private renderFireworks(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    this.sparks.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.alpha);

      // Trailing tail
      if (p.trail.length > 1) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.7;
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        ctx.stroke();
      }

      // Bright spark head
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  private renderTrophy(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, isMirrored: boolean): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);

    // Rotating celestial orbital rings behind trophy
    ctx.save();
    ctx.rotate(this.ageTime * 1.5);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -60, 65, 22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 1. Trophy Base (Polished dark marble pedestal)
    const baseW = 50;
    const baseH = 24;
    ctx.fillStyle = '#1C1917';
    ctx.beginPath();
    ctx.roundRect(-baseW / 2, -12, baseW, baseH, 4);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Gold pedestal tier
    const pedGrad = ctx.createLinearGradient(-35, -22, 35, -12);
    pedGrad.addColorStop(0, '#AA8010');
    pedGrad.addColorStop(0.5, '#FFF2B2');
    pedGrad.addColorStop(1, '#AA8010');
    ctx.fillStyle = pedGrad;
    ctx.fillRect(-22, -24, 44, 12);

    // 2. Trophy Cup Body
    const cupGrad = ctx.createLinearGradient(-45, -95, 45, -24);
    cupGrad.addColorStop(0, '#B38728');
    cupGrad.addColorStop(0.3, '#FBF5B7');
    cupGrad.addColorStop(0.6, '#DAA520');
    cupGrad.addColorStop(1, '#AA771C');

    ctx.fillStyle = cupGrad;
    ctx.beginPath();
    ctx.moveTo(-15, -24);
    ctx.lineTo(15, -24);
    ctx.quadraticCurveTo(36, -45, 38, -95);
    ctx.lineTo(-38, -95);
    ctx.quadraticCurveTo(-36, -45, -15, -24);
    ctx.closePath();
    ctx.fill();

    // Cup Rim
    ctx.beginPath();
    ctx.ellipse(0, -95, 38, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Sculpted Handles
    ctx.strokeStyle = cupGrad;
    ctx.lineWidth = 6;
    ctx.beginPath();
    // Left handle
    ctx.moveTo(-35, -85);
    ctx.bezierCurveTo(-60, -75, -55, -45, -22, -45);
    // Right handle
    ctx.moveTo(35, -85);
    ctx.bezierCurveTo(60, -75, 55, -45, 22, -45);
    ctx.stroke();

    // 4. Center Star Emblem
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFE082';
    ctx.shadowBlur = 8;
    this.drawStar(ctx, 0, -62, 5, 11, 5);

    // 5. Floating "VICTORY" Text
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFE082';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.save();
    ctx.scale(isMirrored ? -1 : 1, 1);
    ctx.fillText('★ VICTORY ★', 0, -118);
    ctx.restore();

    ctx.restore();
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerR: number,
    innerR: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerR;
      let y = cy + Math.sin(rot) * outerR;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerR;
      y = cy + Math.sin(rot) * innerR;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    ctx.fill();
  }

  hasActiveParticles(): boolean {
    return this.trophyScale > 0.02 || this.sparks.length > 0;
  }

  destroy(): void {
    this.reset();
  }

  reset(): void {
    this.trophyScale = 0;
    this.fireworkTimer = 0;
    this.hasBurst = false;
    this.sparks = [];
  }
}
