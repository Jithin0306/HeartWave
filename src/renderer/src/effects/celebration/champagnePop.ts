import { VisualEffect, EffectAnchor } from '../types';

interface ChampagneBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  wobblePhase: number;
  wobbleSpeed: number;
}

interface FoamParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

interface GoldStreamer {
  points: Array<{ x: number; y: number }>;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export class ChampagnePopEffect implements VisualEffect {
  id = 'champagne-pop';
  name = 'Champagne Pop & Bubbles';

  private width: number = 1280;
  private height: number = 720;
  private anchor: EffectAnchor = { x: 0.5, y: 0.7 };
  private isHolding: boolean = false;
  private scale: number = 0;
  private ageTime: number = 0;

  // Cork physics
  private corkX: number = 0;
  private corkY: number = 0;
  private corkVx: number = 0;
  private corkVy: number = 0;
  private corkAngle: number = 0;
  private corkAlpha: number = 0;
  private hasPopped: boolean = false;

  private bubbles: ChampagneBubble[] = [];
  private foamParticles: FoamParticle[] = [];
  private streamers: GoldStreamer[] = [];

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number): void {
    this.anchor = anchor;
    this.isHolding = true;

    if (!this.hasPopped) {
      this.hasPopped = true;
      this.popCork();
    }
  }

  setHolding(holding: boolean): void {
    this.isHolding = holding;
  }

  private popCork(): void {
    const originX = this.anchor.x * this.width;
    const originY = this.anchor.y * this.height - 85;

    this.corkX = originX;
    this.corkY = originY;
    this.corkVx = (Math.random() - 0.5) * 80;
    this.corkVy = -380 - Math.random() * 120;
    this.corkAngle = 0;
    this.corkAlpha = 1.0;

    // Burst streamers
    const colors = ['#FFD700', '#FFF8DC', '#E5A83B', '#FFE4B5'];
    for (let i = 0; i < 18; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
      const speed = 180 + Math.random() * 220;
      const pts: Array<{ x: number; y: number }> = [];
      for (let p = 0; p < 8; p++) {
        pts.push({ x: originX, y: originY });
      }
      this.streamers.push({
        points: pts,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        color: colors[i % colors.length],
      });
    }

    // Burst initial foam
    for (let i = 0; i < 45; i++) {
      const spd = 60 + Math.random() * 190;
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      this.foamParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 3 + Math.random() * 5,
        color: '#FFF8E7',
        alpha: 0.9,
        decay: 1.2 + Math.random() * 1.5,
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
    this.scale += (targetScale - this.scale) * Math.min(1.0, 8 * dt);

    if (
      this.scale < 0.02 &&
      !this.isHolding &&
      this.bubbles.length === 0 &&
      this.foamParticles.length === 0 &&
      this.streamers.length === 0 &&
      this.corkAlpha <= 0.05
    ) {
      this.reset();
      return;
    }

    const bottleTopX = this.anchor.x * this.width;
    const bottleTopY = this.anchor.y * this.height - 85 * this.scale;

    // Continuous rising bubbles while holding
    if (this.isHolding && Math.random() < 0.75 * intensityMult) {
      this.bubbles.push({
        x: bottleTopX + (Math.random() - 0.5) * 18 * this.scale,
        y: bottleTopY,
        vx: (Math.random() - 0.5) * 20 * intensityMult,
        vy: (-70 - Math.random() * 120) * intensityMult,
        radius: (3 + Math.random() * 6.5) * Math.min(1.4, intensityMult),
        alpha: 0.85,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 3 + Math.random() * 4,
      });
    }

    // Update cork trajectory
    if (this.corkAlpha > 0.05) {
      this.corkX += this.corkVx * dt;
      this.corkY += this.corkVy * dt;
      this.corkVy += 380 * dt; // gravity
      this.corkAngle += dt * 6;
      if (this.corkY > this.height + 50) {
        this.corkAlpha = 0;
      }
    }

    // Update bubbles
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.x += b.vx * dt + Math.sin(b.wobblePhase) * 0.8;
      b.y += b.vy * dt;
      b.wobblePhase += b.wobbleSpeed * dt;
      b.alpha -= dt * 0.22;
      if (b.alpha <= 0 || b.y < -30) {
        this.bubbles.splice(i, 1);
      }
    }

    // Update foam
    for (let i = this.foamParticles.length - 1; i >= 0; i--) {
      const p = this.foamParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt; // gravity
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.foamParticles.splice(i, 1);
      }
    }

    // Update streamers
    for (let i = this.streamers.length - 1; i >= 0; i--) {
      const s = this.streamers[i];
      s.vy += 90 * dt;
      s.vx *= 0.98;
      const head = s.points[0];
      head.x += s.vx * dt;
      head.y += s.vy * dt;

      for (let p = s.points.length - 1; p > 0; p--) {
        s.points[p].x += (s.points[p - 1].x - s.points[p].x) * 0.28;
        s.points[p].y += (s.points[p - 1].y - s.points[p].y) * 0.28;
      }

      s.alpha -= dt * 0.35;
      if (s.alpha <= 0) {
        this.streamers.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    if (
      this.scale < 0.02 &&
      this.bubbles.length === 0 &&
      this.foamParticles.length === 0 &&
      this.streamers.length === 0 &&
      this.corkAlpha <= 0.05
    ) return;

    ctx.save();
    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    const cx = this.anchor.x * width;
    const cy = this.anchor.y * height;
    const s = this.scale;

    // 1. Draw Champagne Bottle
    if (s > 0.05) {
      this.renderBottle(ctx, cx, cy, s, isMirrored);
    }

    // 2. Draw Flying Cork
    if (this.corkAlpha > 0.05) {
      this.renderCork(ctx);
    }

    // 3. Draw Streamers
    this.renderStreamers(ctx);

    // 4. Draw Foam Particles
    this.renderFoam(ctx);

    // 5. Draw Rising Bubbles
    this.renderBubbles(ctx);

    ctx.restore();
  }

  private renderBottle(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, isMirrored: boolean): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);

    // Luxury Dark Emerald Glass Body
    const bodyW = 28;
    const bodyH = 85;

    const bottleGrad = ctx.createLinearGradient(-bodyW, 0, bodyW, 0);
    bottleGrad.addColorStop(0, '#102A18');
    bottleGrad.addColorStop(0.35, '#2D5E37');
    bottleGrad.addColorStop(0.7, '#1B3B22');
    bottleGrad.addColorStop(1, '#0C1F12');

    // Bottle body cylinder
    ctx.fillStyle = bottleGrad;
    ctx.beginPath();
    ctx.roundRect(-bodyW, -20, bodyW * 2, bodyH, 12);
    ctx.fill();

    // Neck taper
    ctx.beginPath();
    ctx.moveTo(-bodyW, -20);
    ctx.quadraticCurveTo(-bodyW * 0.8, -55, -9, -65);
    ctx.lineTo(-9, -85);
    ctx.lineTo(9, -85);
    ctx.lineTo(9, -65);
    ctx.quadraticCurveTo(bodyW * 0.8, -55, bodyW, -20);
    ctx.closePath();
    ctx.fill();

    // Gold Foil Neck Wrap
    const foilGrad = ctx.createLinearGradient(-10, -85, 10, -55);
    foilGrad.addColorStop(0, '#D4AF37');
    foilGrad.addColorStop(0.5, '#FFF2B2');
    foilGrad.addColorStop(1, '#AA8010');

    ctx.fillStyle = foilGrad;
    ctx.fillRect(-10, -85, 20, 26);

    // Gold Label on Bottle
    ctx.fillStyle = '#FFFBF0';
    ctx.beginPath();
    ctx.roundRect(-20, 0, 40, 36, 4);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#C98B27';
    ctx.font = 'bold 8px serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.scale(isMirrored ? -1 : 1, 1);
    ctx.fillText('CUVÉE', 0, 16);
    ctx.fillText('GOLD', 0, 26);
    ctx.restore();

    // Glass specular shine line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-bodyW + 6, -15);
    ctx.lineTo(-bodyW + 6, bodyH - 10);
    ctx.stroke();

    ctx.restore();
  }

  private renderCork(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.corkAlpha;
    ctx.translate(this.corkX, this.corkY);
    ctx.rotate(this.corkAngle);

    // Cork shape
    ctx.fillStyle = '#C29B63';
    ctx.beginPath();
    ctx.roundRect(-8, -12, 16, 24, 4);
    ctx.fill();

    // Texture lines
    ctx.strokeStyle = 'rgba(100, 65, 20, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-8, -6, 16, 12);

    ctx.restore();
  }

  private renderStreamers(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    this.streamers.forEach((s) => {
      if (s.points.length < 2) return;
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  private renderFoam(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    this.foamParticles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  private renderBubbles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    this.bubbles.forEach((b) => {
      ctx.globalAlpha = Math.max(0, b.alpha);

      // Shimmering bubble sphere with refraction gradient
      const bGrad = ctx.createRadialGradient(
        b.x - b.radius * 0.35,
        b.y - b.radius * 0.35,
        b.radius * 0.1,
        b.x,
        b.y,
        b.radius
      );
      bGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      bGrad.addColorStop(0.4, 'rgba(255, 248, 220, 0.4)');
      bGrad.addColorStop(0.85, 'rgba(229, 168, 59, 0.35)');
      bGrad.addColorStop(1, 'rgba(255, 215, 0, 0.7)');

      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Sharp specular glint
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.22, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  hasActiveParticles(): boolean {
    return this.scale > 0.02 || this.bubbles.length > 0 || this.corkAlpha > 0.05 || this.streamers.length > 0;
  }

  destroy(): void {
    this.reset();
  }

  reset(): void {
    this.scale = 0;
    this.corkAlpha = 0;
    this.hasPopped = false;
    this.bubbles = [];
    this.foamParticles = [];
    this.streamers = [];
  }
}
