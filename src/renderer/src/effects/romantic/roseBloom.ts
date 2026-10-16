import { VisualEffect, EffectAnchor, Particle } from '../types';
import { drawBotanical3DRose, drawPetal } from '../proceduralShapes';

interface Active3DRose {
  x: number; // Normalized 0..1 in video space (palm anchor)
  y: number;
  stemHeight: number; // in pixels
  bloomProgress: number; // 0.0 -> 1.0
  swayTime: number;
  alpha: number;
}

export class RoseBloomEffect implements VisualEffect {
  id = 'rose-bloom';
  name = 'Rose Bloom';

  private rose: Active3DRose | null = null;
  private petals: Particle[] = [];
  private width: number = 1280;
  private height: number = 720;
  private petalTimer: number = 0;
  private targetAnchor: EffectAnchor = { x: 0.5, y: 0.6 };
  private isHolding: boolean = false;

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number): void {
    this.targetAnchor = anchor;
    this.isHolding = true;

    if (!this.rose) {
      // Create single persistent 3D rose rooted at the fist
      this.rose = {
        x: anchor.x,
        y: anchor.y,
        stemHeight: 210,
        bloomProgress: 0.05,
        swayTime: 0,
        alpha: 1.0,
      };
    }
  }

  update(dt: number, intensity: number, anchor?: EffectAnchor): void {
    if (anchor && this.isHolding) {
      this.targetAnchor = anchor;
    }

    if (!this.rose && this.petals.length === 0) return;

    const intensityMult = 0.8 + (intensity / 100) * 0.4;

    if (this.rose) {
      if (this.isHolding) {
        // 1. Smoothly follow fist position
        const followSpeed = 12;
        this.rose.x += (this.targetAnchor.x - this.rose.x) * Math.min(1.0, followSpeed * dt);
        this.rose.y += (this.targetAnchor.y - this.rose.y) * Math.min(1.0, followSpeed * dt);

        // 2. Bloom & growth progression
        if (this.rose.bloomProgress < 1.0) {
          this.rose.bloomProgress = Math.min(1.0, this.rose.bloomProgress + dt * 1.4);
        }

        // 3. Organic sway
        this.rose.swayTime += dt * 2.2;
        this.rose.alpha = 1.0;

        // 4. Occasional single petal shedding (zero spam, restrained & elegant)
        if (this.rose.bloomProgress > 0.6 && this.petals.length < 3) {
          this.petalTimer += dt;
          if (this.petalTimer >= 1.8 / intensityMult) {
            this.petalTimer = 0;
            const topY = this.rose.y * this.height - this.rose.stemHeight;
            this.petals.push({
              x: this.rose.x * this.width + (Math.random() - 0.5) * 20,
              y: topY + 10,
              vx: (Math.random() - 0.5) * 20,
              vy: 30 + Math.random() * 30,
              size: 16 + Math.random() * 8,
              alpha: 0.9,
              maxLife: 2.8,
              life: 0,
              rotation: Math.random() * Math.PI * 2,
              vRot: (Math.random() - 0.5) * 1.5,
              color: Math.random() > 0.4 ? '#B85C70' : '#672F40',
            });
          }
        }
      } else {
        // Smoothly fade rose when palm is withdrawn
        this.rose.alpha -= dt * 3.0;
        if (this.rose.alpha <= 0.02) {
          this.rose = null;
        }
      }
    }

    // Update shedding petals
    this.petals = this.petals.filter((p) => {
      p.life += dt;
      p.x += p.vx * dt + Math.sin(p.life * 3) * 0.7;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      return p.life < p.maxLife;
    });
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    this.width = width;
    this.height = height;

    if (!this.rose && this.petals.length === 0) return;

    ctx.save();

    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // 1. Render 3D Botanical Rose with Stem and Leaves
    if (this.rose) {
      const rx = this.rose.x * width;
      const ry = this.rose.y * height;
      const swayOffset = Math.sin(this.rose.swayTime) * 0.08;

      drawBotanical3DRose(
        ctx,
        rx,
        ry,
        this.rose.stemHeight,
        this.rose.bloomProgress,
        swayOffset,
        this.rose.alpha
      );
    }

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
    return this.rose !== null || this.petals.length > 0;
  }

  reset(): void {
    this.rose = null;
    this.petals = [];
    this.isHolding = false;
    this.petalTimer = 0;
  }

  destroy(): void {
    this.reset();
  }
}
