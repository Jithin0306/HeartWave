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

  private width: number = 1280;
  private height: number = 720;
  private anchor: EffectAnchor = { x: 0.5, y: 0.65 };
  private isHolding: boolean = false;
  private cakeScale: number = 0;
  private ageTime: number = 0;

  // Blow-out state machine
  private state: 'spawning' | 'lit' | 'blowing' | 'extinguished' | 'celebration' = 'spawning';
  private wishTimer: number = 0;
  private blowProgress: number = 0;
  private bannerAlpha: number = 0;
  private bannerText: string = '🎂 MAKE A WISH 🎂';

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

  init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.reset();
  }

  onGestureTrigger(anchor: EffectAnchor, _confidence: number): void {
    this.anchor = anchor;
    this.isHolding = true;

    if (this.state === 'spawning') {
      this.state = 'lit';
      this.wishTimer = 0;
      this.bannerText = '🎂 MAKE A WISH 🎂';
      this.candles.forEach((c) => (c.isLit = true));
    }
  }

  setHolding(holding: boolean): void {
    this.isHolding = holding;
  }

  hasActiveParticles(): boolean {
    return this.cakeScale > 0.02 || this.confetti.length > 0 || this.sparklers.length > 0;
  }

  destroy(): void {
    this.reset();
  }

  /**
   * Signal blowing action (can be triggered by mouth tracking or hold duration)
   */
  triggerBlow(): void {
    if (this.state === 'lit') {
      this.state = 'blowing';
    }
  }

  update(dt: number, intensity: number, currentAnchor?: EffectAnchor): void {
    if (currentAnchor && this.isHolding) {
      // Smoothly interpolate anchor
      this.anchor.x += (currentAnchor.x - this.anchor.x) * Math.min(1.0, 10 * dt);
      this.anchor.y += (currentAnchor.y - this.anchor.y) * Math.min(1.0, 10 * dt);
    }

    this.ageTime += dt;
    const intensityMult = 0.8 + (intensity / 100) * 0.4;

    // Scale animation
    const target = this.isHolding ? 1.0 : 0.0;
    this.cakeScale += (target - this.cakeScale) * Math.min(1.0, 7 * dt);

    // Fade banner in / out
    const targetBannerAlpha = this.isHolding && this.cakeScale > 0.4 ? 1.0 : 0.0;
    this.bannerAlpha += (targetBannerAlpha - this.bannerAlpha) * Math.min(1.0, 5 * dt);

    if (
      this.cakeScale < 0.02 &&
      !this.isHolding &&
      this.confetti.length === 0 &&
      this.smoke.length === 0 &&
      this.sparklers.length === 0
    ) {
      if (this.state !== 'spawning') this.reset();
      return;
    }

    // State progression
    if (this.state === 'lit') {
      this.wishTimer += dt;
      // Auto-trigger blow after holding wish for ~2.6 seconds if not already blown
      if (this.wishTimer > 2.6) {
        this.state = 'blowing';
      }
    }

    if (this.state === 'blowing') {
      this.blowProgress += dt * 3.5;
      // Tilt flames horizontally as wind hits them
      this.candles.forEach((c) => {
        c.flameTilt = Math.sin(this.blowProgress * 8) * 0.4 + 0.35;
        c.flameFlicker += dt * 25;
      });

      if (this.blowProgress >= 1.0) {
        // Extinguish candles!
        this.candles.forEach((c) => (c.isLit = false));
        this.state = 'celebration';
        this.bannerText = '✨ HAPPY BIRTHDAY! ✨';
        this.spawnConfettiBurst(intensityMult);
      }
    }

    // Update candles and smoke
    this.candles.forEach((candle) => {
      candle.flameFlicker += dt * 8;
      if (!candle.isLit && this.state === 'celebration') {
        candle.smokeTimer += dt;
        if (candle.smokeTimer < 3.0 && Math.random() < 0.6) {
          const cx = this.anchor.x * this.width + candle.relX * (65 * this.cakeScale);
          const cy = this.anchor.y * this.height - (65 + candle.height + 6) * this.cakeScale;
          this.smoke.push({
            x: cx + (Math.random() - 0.5) * 4,
            y: cy,
            vx: (Math.random() - 0.5) * 12 + 8,
            vy: -25 - Math.random() * 30,
            size: 4 + Math.random() * 4,
            alpha: 0.75,
            curl: (Math.random() - 0.5) * 3,
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
      s.alpha -= dt * 0.38;
      if (s.alpha <= 0) {
        this.smoke.splice(i, 1);
      }
    }

    // Update sparkler embers while lit
    if (this.state === 'lit' && Math.random() < 0.7) {
      const c = this.candles[Math.floor(Math.random() * this.candles.length)];
      if (c && c.isLit) {
        const cx = this.anchor.x * this.width + c.relX * (65 * this.cakeScale);
        const cy = this.anchor.y * this.height - (65 + c.height + 6) * this.cakeScale;
        this.sparklers.push({
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 90,
          vy: -Math.random() * 70 - 20,
          size: 2 + Math.random() * 2.5,
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
      p.vy += 60 * dt; // gravity
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
      p.vy += 95 * dt; // gravity
      p.vx *= 0.985; // air drag
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
    const count = Math.floor(160 * intensityMult);

    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.35;
      const speed = (240 + Math.random() * 420) * intensityMult;
      this.confetti.push({
        x: originX + (Math.random() - 0.5) * 60,
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
        decay: 0.18 + Math.random() * 0.22,
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

    // 1. Draw Celebration Head Party Hat / Crown
    this.renderPartyHat(ctx, width, height, s);

    // 2. Draw The 3D Layered Birthday Cake
    if (s > 0.05) {
      this.renderCake(ctx, cx, cy, s);
    }

    // 3. Draw Smoke Wisps
    this.renderSmoke(ctx);

    // 4. Draw Candle Flames & Embers
    if (s > 0.05) {
      this.renderCandles(ctx, cx, cy, s);
    }

    // 5. Draw Confetti Ribbons
    this.renderConfetti(ctx);

    ctx.restore();

    // 6. Draw Floating Celebration Banner (Rendered outside mirror transform so typography is not inverted)
    if (this.bannerAlpha > 0.05) {
      const screenX = isMirrored ? width - cx : cx;
      this.renderBanner(ctx, screenX, cy - 230 * s, this.bannerAlpha);
    }
  }

  private renderPartyHat(ctx: CanvasRenderingContext2D, width: number, height: number, s: number): void {
    // Position party hat slightly above user head center (top ~16% of frame)
    const hatX = width * 0.5;
    const hatY = height * 0.14;
    const hatScale = Math.min(1.0, s * 1.1);

    ctx.save();
    ctx.translate(hatX, hatY);
    ctx.scale(hatScale, hatScale);

    // Subtle breathing tilt
    ctx.rotate(Math.sin(this.ageTime * 2.5) * 0.06);

    // Party cone hat body
    const hatH = 85;
    const hatBaseW = 44;

    const hatGrad = ctx.createLinearGradient(-hatBaseW, hatH, hatBaseW, -hatH * 0.4);
    hatGrad.addColorStop(0, '#E5A83B'); // Champagne Gold
    hatGrad.addColorStop(0.5, '#FFF2D6'); // Pearl highlight
    hatGrad.addColorStop(1, '#C98B27'); // Deep Gold

    ctx.beginPath();
    ctx.moveTo(0, -hatH);
    ctx.lineTo(-hatBaseW, hatH * 0.2);
    ctx.quadraticCurveTo(0, hatH * 0.35, hatBaseW, hatH * 0.2);
    ctx.closePath();
    ctx.fillStyle = hatGrad;
    ctx.fill();

    // Spiral festive stripes
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(232, 44, 85, 0.75)'; // Rose accent
    ctx.lineWidth = 9;
    ctx.beginPath();
    for (let i = -hatH; i < hatH; i += 24) {
      ctx.moveTo(-hatBaseW * 1.5, i);
      ctx.lineTo(hatBaseW * 1.5, i + 35);
    }
    ctx.stroke();
    ctx.restore();

    // Shiny gold pompom on top
    const pompomGrad = ctx.createRadialGradient(0, -hatH - 4, 1, 0, -hatH - 4, 12);
    pompomGrad.addColorStop(0, '#FFF9C4');
    pompomGrad.addColorStop(0.7, '#FFD700');
    pompomGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = pompomGrad;
    ctx.beginPath();
    ctx.arc(0, -hatH - 4, 11, 0, Math.PI * 2);
    ctx.fill();

    // Ruffled trim at base
    ctx.fillStyle = '#FFF8E7';
    for (let bx = -hatBaseW; bx <= hatBaseW; bx += 9) {
      ctx.beginPath();
      ctx.arc(bx, hatH * 0.22, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderBanner(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number): void {
    ctx.save();
    ctx.globalAlpha = alpha;

    // Glowing pill backdrop
    ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
    const textMetrics = ctx.measureText(this.bannerText);
    const boxW = textMetrics.width + 48;
    const boxH = 40;

    const bgGrad = ctx.createLinearGradient(x - boxW / 2, y, x + boxW / 2, y);
    bgGrad.addColorStop(0, 'rgba(28, 24, 23, 0.88)');
    bgGrad.addColorStop(0.5, 'rgba(48, 39, 37, 0.94)');
    bgGrad.addColorStop(1, 'rgba(28, 24, 23, 0.88)');

    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(x - boxW / 2, y - boxH / 2, boxW, boxH, 20);
    ctx.fill();

    ctx.strokeStyle = 'rgba(229, 168, 59, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glowing gold typography
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(229, 168, 59, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#FFF4E0';
    ctx.fillText(this.bannerText, x, y);

    ctx.restore();
  }

  private renderCake(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);

    // 1. Platter plate base
    const platterW = 150;
    const platterH = 24;
    const platterGrad = ctx.createLinearGradient(-platterW, 10, platterW, 10);
    platterGrad.addColorStop(0, '#D4AF37');
    platterGrad.addColorStop(0.5, '#FFF9E6');
    platterGrad.addColorStop(1, '#AA8010');
    ctx.fillStyle = platterGrad;
    ctx.beginPath();
    ctx.ellipse(0, 10, platterW, platterH, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Bottom Tier (Large Vanilla Cream Tier)
    const bW = 120;
    const bH = 65;
    const bY = -15;

    // Tier cylinder body
    const bodyGrad = ctx.createLinearGradient(-bW, 0, bW, 0);
    bodyGrad.addColorStop(0, '#F5EDE0');
    bodyGrad.addColorStop(0.4, '#FFFDF9');
    bodyGrad.addColorStop(0.8, '#F0E4D2');
    bodyGrad.addColorStop(1, '#D9C8B0');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(-bW, bY);
    ctx.lineTo(-bW, bY + bH);
    ctx.ellipse(0, bY + bH, bW, 20, 0, Math.PI, 0, true);
    ctx.lineTo(bW, bY);
    ctx.closePath();
    ctx.fill();

    // Strawberry cream drip decoration
    ctx.fillStyle = '#FF6B8B';
    ctx.beginPath();
    ctx.ellipse(0, bY, bW, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Top Tier (Smaller Tier)
    const tW = 80;
    const tH = 50;
    const tY = -65;

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(-tW, tY);
    ctx.lineTo(-tW, tY + tH);
    ctx.ellipse(0, tY + tH, tW, 15, 0, Math.PI, 0, true);
    ctx.lineTo(tW, tY);
    ctx.closePath();
    ctx.fill();

    // Golden icing top surface
    const topIcing = ctx.createRadialGradient(0, tY, 5, 0, tY, tW);
    topIcing.addColorStop(0, '#FFFBF2');
    topIcing.addColorStop(0.85, '#FCE8C5');
    topIcing.addColorStop(1, '#E5A83B');
    ctx.fillStyle = topIcing;
    ctx.beginPath();
    ctx.ellipse(0, tY, tW, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderCandles(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
    const tY = cy - 65 * s;
    const spreadW = 65 * s;

    this.candles.forEach((candle) => {
      const candleX = cx + candle.relX * spreadW;
      const candleBaseY = tY;
      const candleH = candle.height * s;
      const candleW = 6 * s;

      ctx.save();

      // Candle body (gold/white striped cylinder)
      const cGrad = ctx.createLinearGradient(candleX - candleW, 0, candleX + candleW, 0);
      cGrad.addColorStop(0, '#FFE082');
      cGrad.addColorStop(0.5, '#FFFDE7');
      cGrad.addColorStop(1, '#FFB300');

      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.roundRect(candleX - candleW / 2, candleBaseY - candleH, candleW, candleH, 2 * s);
      ctx.fill();

      // Black wick
      const wickTopY = candleBaseY - candleH - 6 * s;
      ctx.strokeStyle = '#212121';
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(candleX, candleBaseY - candleH);
      ctx.lineTo(candleX, wickTopY);
      ctx.stroke();

      // Flame
      if (candle.isLit) {
        const flicker = Math.sin(candle.flameFlicker) * 2 * s;
        const tiltX = candle.flameTilt * 12 * s;
        const flameH = (16 + flicker) * s;
        const flameW = (7 + flicker * 0.4) * s;
        const flameCenterY = wickTopY - flameH * 0.7;

        // Outer warm ambient aura
        const auraGrad = ctx.createRadialGradient(candleX + tiltX, flameCenterY, 2 * s, candleX + tiltX, flameCenterY, 28 * s);
        auraGrad.addColorStop(0, 'rgba(255, 183, 77, 0.6)');
        auraGrad.addColorStop(0.6, 'rgba(255, 138, 101, 0.25)');
        auraGrad.addColorStop(1, 'rgba(255, 112, 67, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(candleX + tiltX, flameCenterY, 28 * s, 0, Math.PI * 2);
        ctx.fill();

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

    // Render sparklers
    this.sparklers.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private renderSmoke(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    this.smoke.forEach((s) => {
      ctx.globalAlpha = Math.max(0, s.alpha);
      const smokeGrad = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.size);
      smokeGrad.addColorStop(0, 'rgba(230, 230, 235, 0.5)');
      smokeGrad.addColorStop(0.7, 'rgba(180, 180, 190, 0.25)');
      smokeGrad.addColorStop(1, 'rgba(150, 150, 160, 0)');
      ctx.fillStyle = smokeGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  private renderConfetti(ctx: CanvasRenderingContext2D): void {
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
    this.state = 'spawning';
    this.wishTimer = 0;
    this.blowProgress = 0;
    this.bannerAlpha = 0;
    this.bannerText = '🎂 MAKE A WISH 🎂';
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
