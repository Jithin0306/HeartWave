import { VisualEffect, EffectAnchor } from '../types';

interface ElementalParticle {
  element: 'fire' | 'frost';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  growth: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
}

export class FlameFrostEffect implements VisualEffect {
  id = 'flame-frost';
  name = 'Elemental Flame & Frost';

  private width: number = 1280;
  private height: number = 720;
  private anchors: EffectAnchor[] = [];
  private isHolding: boolean = false;
  private scale: number = 0;
  private ageTime: number = 0;

  private particles: ElementalParticle[] = [];

  // Hardware-accelerated cached canvas sprites (Zero per-frame allocation)
  private fireAuraSprite: HTMLCanvasElement | null = null;
  private frostAuraSprite: HTMLCanvasElement | null = null;
  private iceCrystalSprite: HTMLCanvasElement | null = null;

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number, anchors?: EffectAnchor[]): void {
    const rawList = anchors && anchors.length > 0 ? anchors : [anchor];
    this.anchors = rawList.map((a) => ({ x: a.x, y: a.y }));
    this.isHolding = true;
  }

  setHolding(holding: boolean): void {
    this.isHolding = holding;
  }

  update(dt: number, intensity: number, currentAnchor?: EffectAnchor, currentAnchors?: EffectAnchor[]): void {
    if (!this.isHolding && this.particles.length === 0 && this.scale < 0.02) {
      if (this.scale !== 0) this.reset();
      return;
    }

    const activeAnchors = currentAnchors && currentAnchors.length > 0
      ? currentAnchors
      : (currentAnchor ? [currentAnchor] : this.anchors);

    if (activeAnchors.length > 0 && this.isHolding) {
      if (this.anchors.length !== activeAnchors.length) {
        this.anchors = activeAnchors.map((a) => ({ ...a }));
      } else {
        const lerpFactor = Math.min(1.0, 16 * dt);
        for (let i = 0; i < this.anchors.length; i++) {
          this.anchors[i].x += (activeAnchors[i].x - this.anchors[i].x) * lerpFactor;
          this.anchors[i].y += (activeAnchors[i].y - this.anchors[i].y) * lerpFactor;
        }
      }
    }

    this.ageTime += dt;
    const targetScale = this.isHolding ? 1.0 : 0.0;
    this.scale += (targetScale - this.scale) * Math.min(1.0, 10 * dt);

    if (this.scale < 0.02 && !this.isHolding && this.particles.length === 0) {
      this.reset();
      return;
    }

    const intensityMult = 0.8 + (intensity / 100) * 0.4;

    // Emit elemental particles per anchor (hard capped to 24 particles max)
    if (this.isHolding && this.anchors.length > 0 && this.particles.length < 24) {
      const isDual = this.anchors.length >= 2;

      this.anchors.forEach((anc, idx) => {
        // In dual-mode: Anchor 0 is Fire, Anchor 1 is Frost. In single-mode, both elements spiral together!
        const element: 'fire' | 'frost' = isDual
          ? (idx === 0 ? 'fire' : 'frost')
          : (Math.random() > 0.5 ? 'fire' : 'frost');

        const ax = anc.x * this.width;
        const ay = anc.y * this.height;

        // Spawn particles (scales with intensity, capped at 2)
        const count = Math.min(2, Math.max(1, Math.round((intensity / 100) * 2)));
        for (let c = 0; c < count; c++) {
          if (element === 'fire') {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
            const speed = 40 + Math.random() * 110;
            const fireColors = ['#FFD54F', '#FFA726', '#FF5722', '#F4511E'];
            this.particles.push({
              element: 'fire',
              x: ax + (Math.random() - 0.5) * 35,
              y: ay + (Math.random() - 0.5) * 20,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 30, // upward thermal drift
              size: 5 + Math.random() * 8,
              growth: -4,
              color: fireColors[Math.floor(Math.random() * fireColors.length)],
              alpha: 0.95,
              decay: 1.5 + Math.random() * 1.8,
              rotation: Math.random() * Math.PI * 2,
              rotationSpeed: (Math.random() - 0.5) * 6,
            });
          } else {
            // Frost particle: glacial crystal with slow turbulent drift
            const angle = Math.random() * Math.PI * 2;
            const speed = 25 + Math.random() * 75;
            const frostColors = ['#E0F7FA', '#80DEEA', '#26C6DA', '#00E5FF'];
            this.particles.push({
              element: 'frost',
              x: ax + (Math.random() - 0.5) * 35,
              y: ay + (Math.random() - 0.5) * 20,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 15,
              size: 4 + Math.random() * 6,
              growth: 2,
              color: frostColors[Math.floor(Math.random() * frostColors.length)],
              alpha: 0.9,
              decay: 1.2 + Math.random() * 1.2,
              rotation: Math.random() * Math.PI * 2,
              rotationSpeed: (Math.random() - 0.5) * 4,
            });
          }
        }
      });
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size = Math.max(1, p.size + p.growth * dt);
      p.rotation += p.rotationSpeed * dt;
      p.alpha -= p.decay * dt;

      if (p.element === 'fire') {
        p.vy -= 40 * dt; // Fire accelerates upwards
        p.vx *= 0.96;
      } else {
        p.vy += 10 * dt; // Frost gently falls
        p.vx *= 0.97;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    if (this.scale < 0.02 && this.particles.length === 0) return;

    ctx.save();
    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // 1. Render ambient elemental auras at hand anchors
    const isDual = this.anchors.length >= 2;
    this.anchors.forEach((anc, idx) => {
      const ax = anc.x * width;
      const ay = anc.y * height;
      const element = isDual ? (idx === 0 ? 'fire' : 'frost') : 'both';
      this.renderAura(ctx, ax, ay, element, this.scale);
    });

    // 2. Render particles
    ctx.globalCompositeOperation = 'lighter'; // Additive glow
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.element === 'fire') {
        // Fiery teardrop spark
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Hexagonal ice crystal star from cached sprite
        const sprite = this.getIceCrystalSprite();
        const sz = p.size * 2;
        ctx.drawImage(sprite, -sz / 2, -sz / 2, sz, sz);
      }
      ctx.restore();
    });

    ctx.restore();
  }

  private getFireAuraSprite(): HTMLCanvasElement {
    if (!this.fireAuraSprite) {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
        grad.addColorStop(0, 'rgba(255, 179, 0, 0.45)');
        grad.addColorStop(0.5, 'rgba(244, 81, 30, 0.25)');
        grad.addColorStop(1, 'rgba(191, 54, 12, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(64, 64, 60, 0, Math.PI * 2);
        ctx.fill();
      }
      this.fireAuraSprite = c;
    }
    return this.fireAuraSprite;
  }

  private getFrostAuraSprite(): HTMLCanvasElement {
    if (!this.frostAuraSprite) {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
        grad.addColorStop(0, 'rgba(0, 229, 255, 0.45)');
        grad.addColorStop(0.5, 'rgba(2, 136, 209, 0.25)');
        grad.addColorStop(1, 'rgba(1, 87, 155, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(64, 64, 60, 0, Math.PI * 2);
        ctx.fill();
      }
      this.frostAuraSprite = c;
    }
    return this.frostAuraSprite;
  }

  private getIceCrystalSprite(): HTMLCanvasElement {
    if (!this.iceCrystalSprite) {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.translate(16, 16);
        ctx.strokeStyle = '#80DEEA';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        const size = 12;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = Math.cos(angle) * size;
          const y = Math.sin(angle) * size;
          ctx.moveTo(0, 0);
          ctx.lineTo(x, y);

          const bx = Math.cos(angle) * size * 0.6;
          const by = Math.sin(angle) * size * 0.6;
          const bAngle1 = angle + Math.PI / 6;
          const bAngle2 = angle - Math.PI / 6;
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(bAngle1) * size * 0.35, by + Math.sin(bAngle1) * size * 0.35);
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(bAngle2) * size * 0.35, by + Math.sin(bAngle2) * size * 0.35);
        }
        ctx.stroke();
      }
      this.iceCrystalSprite = c;
    }
    return this.iceCrystalSprite;
  }

  private renderAura(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    element: 'fire' | 'frost' | 'both',
    s: number
  ): void {
    const radius = 75 * s;
    if (element === 'fire' || element === 'both') {
      ctx.drawImage(this.getFireAuraSprite(), x - radius, y - radius, radius * 2, radius * 2);
    }
    if (element === 'frost' || element === 'both') {
      ctx.drawImage(this.getFrostAuraSprite(), x - radius, y - radius, radius * 2, radius * 2);
    }
  }

  hasActiveParticles(): boolean {
    return this.scale > 0.02 || this.particles.length > 0;
  }

  destroy(): void {
    this.reset();
  }

  reset(): void {
    this.scale = 0;
    this.particles = [];
    this.anchors = [];
  }
}
