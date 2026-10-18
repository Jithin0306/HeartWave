import { VisualEffect, EffectAnchor } from '../types';

interface CandleState {
  relX: number; // relative to cake center (-1 to 1)
  height: number;
  isLit: boolean;
  flameFlicker: number;
  flameTilt: number;
  smokeTimer: number;
}

interface SparklerParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  color: string;
  wobble: number;
  wobbleSpeed: number;
}

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  curl: number;
}

export class BirthdayCakeEffect implements VisualEffect {
  id = 'birthday-cake';
  name = 'Birthday Cake & Candle Wish';

  private static readonly TOP_TIER_SURFACE = 165;

  private width: number = 1280;
  private height: number = 720;
  private anchor: EffectAnchor = { x: 0.5, y: 0.65 };
  private isHolding: boolean = false;
  private cakeScale: number = 0;
  private ageTime: number = 0;

  // Blow-out state machine
  private state: 'idle' | 'lit' | 'blowing' | 'celebration' = 'idle';
  private wishTimer: number = 0;
  private blowProgress: number = 0;

  // Candles on top tier
  private candles: CandleState[] = [
    { relX: -0.4, height: 34, isLit: true, flameFlicker: 0, flameTilt: 0, smokeTimer: 0 },
    { relX: 0.0, height: 42, isLit: true, flameFlicker: 0.3, flameTilt: 0, smokeTimer: 0 },
    { relX: 0.4, height: 34, isLit: true, flameFlicker: 0.6, flameTilt: 0, smokeTimer: 0 },
  ];

  // Particle systems
  private confetti: ConfettiParticle[] = [];
  private smoke: SmokeParticle[] = [];
  private sparklers: SparklerParticle[] = [];

  // Hardware-accelerated cached canvas sprites (Zero per-frame allocation)
  private cakeSprite: HTMLCanvasElement | null = null;
  private flameGlowSprite: HTMLCanvasElement | null = null;
  private smokeSprite: HTMLCanvasElement | null = null;

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number): void {
    this.anchor = anchor;
    this.isHolding = true;

    if (this.state === 'idle') {
      this.state = 'lit';
      this.wishTimer = 0;
      this.candles.forEach((c) => (c.isLit = true));
    }
  }

  setHolding(holding: boolean): void {
    this.isHolding = holding;
  }

  hasActiveParticles(): boolean {
    return this.cakeScale > 0.02 || this.confetti.length > 0 || this.sparklers.length > 0 || this.smoke.length > 0;
  }

  destroy(): void {
    this.reset();
  }

  update(dt: number, intensity: number, currentAnchor?: EffectAnchor): void {
    // 0ms early return when completely idle to preserve 60 FPS
    if (
      !this.isHolding &&
      this.cakeScale < 0.02 &&
      this.confetti.length === 0 &&
      this.smoke.length === 0 &&
      this.sparklers.length === 0
    ) {
      if (this.state !== 'idle') this.reset();
      return;
    }

    if (currentAnchor && this.isHolding) {
      this.anchor.x += (currentAnchor.x - this.anchor.x) * Math.min(1.0, 14 * dt);
      this.anchor.y += (currentAnchor.y - this.anchor.y) * Math.min(1.0, 14 * dt);
    }

    this.ageTime += dt;
    const intensityMult = 0.8 + (intensity / 100) * 0.4;

    // Scale animation
    const target = this.isHolding ? 1.0 : 0.0;
    this.cakeScale += (target - this.cakeScale) * Math.min(1.0, 7 * dt);

    // State progression: wish hold auto-extinguishes
    if (this.state === 'lit') {
      this.wishTimer += dt;
      if (this.wishTimer > 2.5) {
        this.state = 'blowing';
      }
    }

    if (this.state === 'blowing') {
      this.blowProgress += dt * 3.5;
      this.candles.forEach((c) => {
        c.flameTilt = Math.sin(this.blowProgress * 8) * 0.4 + 0.35;
        c.flameFlicker += dt * 25;
      });

      if (this.blowProgress >= 1.0) {
        // Extinguish candles!
        this.candles.forEach((c) => (c.isLit = false));
        this.state = 'celebration';
        this.spawnConfettiBurst(intensityMult);
      }
    }

    // Update candles and smoke
    this.candles.forEach((candle) => {
      candle.flameFlicker += dt * 8;
      if (!candle.isLit) {
        candle.smokeTimer += dt;
        if (candle.smokeTimer < 2.5 && this.smoke.length < 6 && Math.random() < 0.4) {
          const s = this.cakeScale;
          const cx = this.anchor.x * this.width + candle.relX * (65 * s);
          const cy = this.anchor.y * this.height - (BirthdayCakeEffect.TOP_TIER_SURFACE + candle.height + 7) * s;
          this.smoke.push({
            x: cx + (Math.random() - 0.5) * 6,
            y: cy,
            vx: (Math.random() - 0.5) * 16,
            vy: -35 - Math.random() * 30,
            size: 6 + Math.random() * 6,
            alpha: 0.6,
            curl: (Math.random() - 0.5) * 2.0,
          });
        }
      }
    });

    // Update smoke physics
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const s = this.smoke[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx += s.curl * dt * 8;
      s.size += dt * 14;
      s.alpha -= dt * 0.4;
      if (s.alpha <= 0) {
        this.smoke.splice(i, 1);
      }
    }

    // Update sparkler embers while lit
    if (this.state === 'lit' && this.sparklers.length < 8 && Math.random() < 0.5) {
      const c = this.candles[Math.floor(Math.random() * this.candles.length)];
      if (c && c.isLit) {
        const cx = this.anchor.x * this.width + c.relX * (65 * this.cakeScale);
        const cy = this.anchor.y * this.height - (BirthdayCakeEffect.TOP_TIER_SURFACE + c.height + 12) * this.cakeScale;
        this.sparklers.push({
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 80,
          vy: -Math.random() * 60 - 20,
          size: 2 + Math.random() * 2,
          color: Math.random() > 0.4 ? '#FFE082' : '#FFF9C4',
          alpha: 1.0,
          decay: 2.2 + Math.random() * 2.0,
        });
      }
    }

    for (let i = this.sparklers.length - 1; i >= 0; i--) {
      const p = this.sparklers[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.sparklers.splice(i, 1);
      }
    }

    // Update celebratory confetti
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const p = this.confetti[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 95 * dt;
      p.vx *= 0.985;
      p.rotation += p.rotationSpeed * dt;
      p.wobble += p.wobbleSpeed * dt;
      p.x += Math.sin(p.wobble) * 1.5;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0 || p.y > this.height + 60) {
        this.confetti.splice(i, 1);
      }
    }
  }

  private spawnConfettiBurst(intensityMult: number = 1.0): void {
    const colors = [
      '#FFD700', // Metallic Gold
      '#FF69B4', // Hot Pink
      '#00E5FF', // Cyan Sparkle
      '#FF3D00', // Radiant Orange
      '#76FF03', // Lime Burst
      '#E040FB', // Violet Orchid
      '#FFFFFF', // Pearl White
    ];

    const originX = this.anchor.x * this.width;
    const originY = this.anchor.y * this.height - 110 * this.cakeScale;
    const count = Math.min(26, Math.floor(22 * intensityMult));

    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.35;
      const speed = (220 + Math.random() * 380) * intensityMult;
      this.confetti.push({
        x: originX + (Math.random() - 0.5) * 50,
        y: originY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 8,
        width: 7 + Math.random() * 8,
        height: 12 + Math.random() * 10,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 12,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.22 + Math.random() * 0.22,
      });
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    if (this.cakeScale < 0.02 && this.confetti.length === 0) return;

    ctx.save();
    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    const cx = this.anchor.x * width;
    const cy = this.anchor.y * height;
    const s = this.cakeScale;

    // 1. Draw The 3D Layered Birthday Cake
    if (s > 0.05) {
      this.renderCake(ctx, cx, cy, s);
    }

    // 2. Draw Smoke Wisps
    this.renderSmoke(ctx);

    // 3. Draw Candle Flames & Embers
    if (s > 0.05) {
      this.renderCandles(ctx, cx, cy, s);
    }

    // 4. Draw Confetti Ribbons
    this.renderConfetti(ctx);

    ctx.restore();
  }

  private getSmokeSprite(): HTMLCanvasElement {
    if (!this.smokeSprite) {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        const grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
        grad.addColorStop(0, 'rgba(230, 230, 235, 0.6)');
        grad.addColorStop(0.6, 'rgba(180, 180, 190, 0.25)');
        grad.addColorStop(1, 'rgba(150, 150, 160, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(16, 16, 15, 0, Math.PI * 2);
        ctx.fill();
      }
      this.smokeSprite = c;
    }
    return this.smokeSprite;
  }

  private getFlameGlowSprite(): HTMLCanvasElement {
    if (!this.flameGlowSprite) {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
        grad.addColorStop(0, 'rgba(255, 200, 50, 0.55)');
        grad.addColorStop(0.5, 'rgba(255, 120, 20, 0.2)');
        grad.addColorStop(1, 'rgba(255, 60, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fill();
      }
      this.flameGlowSprite = c;
    }
    return this.flameGlowSprite;
  }

  private getCakeSprite(): HTMLCanvasElement {
    if (!this.cakeSprite) {
      const c = document.createElement('canvas');
      c.width = 320;
      c.height = 240;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        const cx = 160;
        const cy = 210;

        // 1. Platter plate base
        const platterW = 150;
        const platterH = 24;
        const platterGrad = ctx.createLinearGradient(cx - platterW, cy + 10, cx + platterW, cy + 10);
        platterGrad.addColorStop(0, '#B8860B');
        platterGrad.addColorStop(0.3, '#FFF8DC');
        platterGrad.addColorStop(0.7, '#DAA520');
        platterGrad.addColorStop(1, '#8B6508');

        ctx.fillStyle = platterGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, platterW, platterH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFE082';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. Bottom Tier: Rich Vanilla & Gold Velvet
        const bW = 125;
        const bH = 65;
        const bY = cy - 10;

        const bGrad = ctx.createLinearGradient(cx - bW, 0, cx + bW, 0);
        bGrad.addColorStop(0, '#D4A373');
        bGrad.addColorStop(0.3, '#FAEDCD');
        bGrad.addColorStop(0.7, '#E9D8A6');
        bGrad.addColorStop(1, '#CCD5AE');

        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.roundRect(cx - bW, bY - bH, bW * 2, bH, [10, 10, 24, 24]);
        ctx.fill();

        // Bottom tier decorative dripping icing
        ctx.fillStyle = '#FFFDF0';
        ctx.beginPath();
        ctx.moveTo(cx - bW, bY - bH + 2);
        for (let x = -bW; x <= bW; x += 18) {
          const drip = Math.sin(x * 0.15) * 6 + 14;
          ctx.quadraticCurveTo(cx + x + 9, bY - bH + drip, cx + x + 18, bY - bH + 2);
        }
        ctx.lineTo(cx + bW, bY - bH);
        ctx.lineTo(cx - bW, bY - bH);
        ctx.closePath();
        ctx.fill();

        // 3. Middle Tier: Rose Gold Strawberry
        const mW = 95;
        const mH = 55;
        const mY = bY - bH + 6;

        const mGrad = ctx.createLinearGradient(cx - mW, 0, cx + mW, 0);
        mGrad.addColorStop(0, '#E07A5F');
        mGrad.addColorStop(0.4, '#F4A261');
        mGrad.addColorStop(0.8, '#E76F51');
        mGrad.addColorStop(1, '#D94E34');

        ctx.fillStyle = mGrad;
        ctx.beginPath();
        ctx.roundRect(cx - mW, mY - mH, mW * 2, mH, [8, 8, 16, 16]);
        ctx.fill();

        // Middle tier icing drip
        ctx.fillStyle = '#FFF5EB';
        ctx.beginPath();
        ctx.moveTo(cx - mW, mY - mH + 2);
        for (let x = -mW; x <= mW; x += 15) {
          const drip = Math.cos(x * 0.2) * 5 + 11;
          ctx.quadraticCurveTo(cx + x + 7.5, mY - mH + drip, cx + x + 15, mY - mH + 2);
        }
        ctx.lineTo(cx + mW, mY - mH);
        ctx.lineTo(cx - mW, mY - mH);
        ctx.closePath();
        ctx.fill();

        // 4. Top Tier: Pure Pearl White & Gold Ganache
        const tW = 65;
        const tH = 45;
        const tY = mY - mH + 4;

        const tGrad = ctx.createLinearGradient(cx - tW, 0, cx + tW, 0);
        tGrad.addColorStop(0, '#FAF0CA');
        tGrad.addColorStop(0.5, '#FFFFFF');
        tGrad.addColorStop(1, '#F4D35E');

        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.roundRect(cx - tW, tY - tH, tW * 2, tH, [6, 6, 12, 12]);
        ctx.fill();

        // Top tier rosettes
        ctx.fillStyle = '#FFB703';
        for (let rx = -tW + 8; rx <= tW - 8; rx += 14) {
          ctx.beginPath();
          ctx.arc(cx + rx, tY - tH, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      this.cakeSprite = c;
    }
    return this.cakeSprite;
  }

  private renderCake(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.drawImage(this.getCakeSprite(), -160, -210);
    ctx.restore();
  }

  private renderCandles(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
    const topTierY = cy - BirthdayCakeEffect.TOP_TIER_SURFACE * s;

    this.candles.forEach((candle) => {
      const candleX = cx + candle.relX * (65 * s);
      const candleW = 9 * s;
      const candleH = candle.height * s;
      const candleTopY = topTierY - candleH;

      ctx.save();

      // Wax candle body with festive spiral pattern
      const waxGrad = ctx.createLinearGradient(candleX - candleW / 2, 0, candleX + candleW / 2, 0);
      waxGrad.addColorStop(0, '#E63946');
      waxGrad.addColorStop(0.5, '#FFF1F2');
      waxGrad.addColorStop(1, '#D90429');

      ctx.fillStyle = waxGrad;
      ctx.beginPath();
      ctx.roundRect(candleX - candleW / 2, candleTopY, candleW, candleH, 2 * s);
      ctx.fill();

      // Black wick
      const wickH = 7 * s;
      const wickTopY = candleTopY - wickH;
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 1.8 * s;
      ctx.beginPath();
      ctx.moveTo(candleX, candleTopY);
      ctx.lineTo(candleX + candle.flameTilt * 4 * s, wickTopY);
      ctx.stroke();

      // Flame
      if (candle.isLit) {
        const flicker = Math.sin(candle.flameFlicker) * 2 * s;
        const flameW = (7 + flicker * 0.4) * s;
        const flameH = (22 + flicker) * s;
        const tiltX = candle.flameTilt * 12 * s;
        const flameCenterY = wickTopY - flameH * 0.55;

        // Radiant heat haze from pre-rendered sprite
        const glowSprite = this.getFlameGlowSprite();
        const glowRadius = 28 * s;
        ctx.drawImage(glowSprite, candleX + tiltX - glowRadius, flameCenterY - glowRadius, glowRadius * 2, glowRadius * 2);

        // Teardrop flame
        ctx.beginPath();
        ctx.moveTo(candleX, wickTopY);
        ctx.quadraticCurveTo(candleX - flameW + tiltX, flameCenterY, candleX + tiltX, wickTopY - flameH);
        ctx.quadraticCurveTo(candleX + flameW + tiltX, flameCenterY, candleX, wickTopY);
        ctx.closePath();

        const flameGrad = ctx.createLinearGradient(candleX, wickTopY, candleX + tiltX, wickTopY - flameH);
        flameGrad.addColorStop(0, '#29B6F6'); // Blue base
        flameGrad.addColorStop(0.2, '#FFCA28'); // Amber core
        flameGrad.addColorStop(0.7, '#FFFDE7'); // White-hot center
        flameGrad.addColorStop(1, '#FF7043'); // Orange tip
        ctx.fillStyle = flameGrad;
        ctx.fill();
      }

      ctx.restore();
    });

    // Render sparklers with batched draw
    if (this.sparklers.length > 0) {
      ctx.save();
      this.sparklers.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  }

  private renderSmoke(ctx: CanvasRenderingContext2D): void {
    if (this.smoke.length === 0) return;
    const sprite = this.getSmokeSprite();
    ctx.save();
    this.smoke.forEach((s) => {
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.drawImage(sprite, s.x - s.size, s.y - s.size, s.size * 2, s.size * 2);
    });
    ctx.restore();
  }

  private renderConfetti(ctx: CanvasRenderingContext2D): void {
    if (this.confetti.length === 0) return;
    ctx.save();
    this.confetti.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.cos(p.wobble), 1);

      ctx.fillStyle = p.color;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
    });
    ctx.restore();
  }

  reset(): void {
    this.cakeScale = 0;
    this.state = 'idle';
    this.wishTimer = 0;
    this.blowProgress = 0;
    this.candles.forEach((c) => {
      c.isLit = true;
      c.smokeTimer = 0;
      c.flameTilt = 0;
    });
    this.confetti = [];
    this.smoke = [];
    this.sparklers = [];
  }
}
