/**
 * High-performance, art-directed procedural vector shapes for Heartwave effects.
 */

export function drawRefinedHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fillColor?: string,
  strokeColor?: string,
  lineWidth: number = 2
): void {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);

  // Top left curve
  ctx.bezierCurveTo(-size / 2, -size / 2, -size, topCurveHeight / 3, 0, size);

  // Top right curve
  ctx.bezierCurveTo(size, topCurveHeight / 3, size / 2, -size / 2, 0, topCurveHeight);

  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws a radiant, jewelry-like Golden Heart anchored directly on the finger.
 */
export function drawGoldenHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  alpha: number = 1.0,
  scale: number = 1.0
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  // 1. Soft Champagne Ambient Glow
  ctx.shadowColor = 'rgba(235, 205, 135, 0.65)';
  ctx.shadowBlur = 14;

  // 2. Main Gold Gradient Body
  const grad = ctx.createLinearGradient(-size * 0.5, -size * 0.5, size * 0.5, size);
  grad.addColorStop(0, '#FFF2D1'); // Luminous ivory highlight
  grad.addColorStop(0.25, '#ECC77E'); // Radiant gold
  grad.addColorStop(0.7, '#C89C46'); // Deep warm gold
  grad.addColorStop(1, '#946F28'); // Amber shadow base

  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);
  ctx.bezierCurveTo(-size / 2, -size / 2, -size, topCurveHeight / 3, 0, size);
  ctx.bezierCurveTo(size, topCurveHeight / 3, size / 2, -size / 2, 0, topCurveHeight);
  ctx.closePath();

  ctx.fillStyle = grad;
  ctx.fill();

  // 3. Delicate Luminous Rim Contour
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 245, 220, 0.85)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // 4. Subtle Specular Highlight Gleam on Top Left Lobe
  ctx.beginPath();
  ctx.ellipse(-size * 0.3, topCurveHeight * 0.4, size * 0.16, size * 0.08, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a majestic, deep velvet Big Heart centered between joined hands.
 */
export function drawBigVelvetHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  alpha: number = 1.0,
  scale: number = 1.0
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  // 1. Ambient Rose-Burgundy Glow
  ctx.shadowColor = 'rgba(184, 92, 112, 0.55)';
  ctx.shadowBlur = 24;

  // 2. Rich Dimensional Velvet Gradient Body
  const grad = ctx.createRadialGradient(0, size * 0.3, size * 0.1, 0, size * 0.4, size * 0.9);
  grad.addColorStop(0, '#B85C70'); // Vibrant romantic crimson core
  grad.addColorStop(0.55, '#7A2E44'); // Deep velvety burgundy
  grad.addColorStop(1, '#461523'); // Rich wine shadows

  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);
  ctx.bezierCurveTo(-size / 2, -size / 2, -size, topCurveHeight / 3, 0, size);
  ctx.bezierCurveTo(size, topCurveHeight / 3, size / 2, -size / 2, 0, topCurveHeight);
  ctx.closePath();

  ctx.fillStyle = grad;
  ctx.fill();

  // 3. Subtle Champagne & Muted Rose Outer Contour
  ctx.shadowBlur = 0;
  const strokeGrad = ctx.createLinearGradient(0, -size * 0.4, 0, size);
  strokeGrad.addColorStop(0, 'rgba(214, 189, 145, 0.7)'); // Champagne top highlight
  strokeGrad.addColorStop(0.6, 'rgba(215, 154, 166, 0.5)'); // Rose mid
  strokeGrad.addColorStop(1, 'rgba(103, 47, 64, 0.3)'); // Burgundy base

  ctx.strokeStyle = strokeGrad;
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // 4. Dimensional Top Specular Highlights
  ctx.beginPath();
  ctx.ellipse(-size * 0.32, topCurveHeight * 0.35, size * 0.18, size * 0.09, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 220, 230, 0.35)';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(size * 0.32, topCurveHeight * 0.35, size * 0.18, size * 0.09, Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 220, 230, 0.25)';
  ctx.fill();

  ctx.restore();
}

export function drawPetal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  fillColor: string,
  alpha: number
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  ctx.beginPath();
  ctx.moveTo(0, -size);
  // Organic asymmetric petal bezier curves
  ctx.bezierCurveTo(size * 0.7, -size * 0.7, size * 0.9, size * 0.5, 0, size);
  ctx.bezierCurveTo(-size * 0.9, size * 0.5, -size * 0.7, -size * 0.7, 0, -size);
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();

  ctx.restore();
}

export function drawSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  color: string,
  alpha: number
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  ctx.fillStyle = color;
  ctx.beginPath();

  // 4-pointed precision luxury sparkle
  const inner = size * 0.22;
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(0, 0, size, 0);
  ctx.quadraticCurveTo(0, 0, 0, size);
  ctx.quadraticCurveTo(0, 0, -size, 0);
  ctx.quadraticCurveTo(0, 0, 0, -size);
  ctx.closePath();
  ctx.fill();

  // Subtle center core glow
  ctx.beginPath();
  ctx.arc(0, 0, inner, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a dimensional, sculptural pseudo-3D Botanical Rose with organic curved stem and leaves.
 * Grows upwards from the user's palm anchor.
 */
export function drawBotanical3DRose(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  targetHeight: number,
  progress: number, // 0.0 to 1.0 growth & bloom
  sway: number = 0, // Natural organic sway
  alpha: number = 1.0
): void {
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  const currentHeight = targetHeight * Math.min(1.0, progress * 1.15);
  const headSize = 34 * Math.min(1.0, 0.4 + 0.6 * progress);

  // Sway control points for organic stem curve
  const midX = Math.sin(sway) * 14;
  const topX = Math.sin(sway * 1.2) * 22;
  const topY = -currentHeight;

  // 1. DIMENSIONAL CURVED BOTANICAL STEM
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(midX, -currentHeight * 0.5, topX, topY);

  const stemGrad = ctx.createLinearGradient(0, 0, topX, topY);
  stemGrad.addColorStop(0, '#24381F'); // Forest shaded base
  stemGrad.addColorStop(0.5, '#426639'); // Natural olive
  stemGrad.addColorStop(1, '#537C47'); // Fresh botanical top

  ctx.strokeStyle = stemGrad;
  ctx.lineWidth = Math.max(2, 4.2 * (1 - (currentHeight / (targetHeight * 1.5)) * 0.3));
  ctx.lineCap = 'round';
  ctx.stroke();

  // Stem highlight rim
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(midX - 1.2, -currentHeight * 0.5, topX - 1, topY);
  ctx.strokeStyle = 'rgba(125, 175, 110, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  // 2. BOTANICAL LEAVES SPROUTING FROM STEM
  if (progress > 0.3) {
    const leafProgress = Math.min(1, (progress - 0.3) / 0.6);

    // Leaf 1: Lower Left Node
    const l1Y = -currentHeight * 0.42;
    const l1X = midX * 0.8;
    drawSculptedLeaf(ctx, l1X, l1Y, 19 * leafProgress, -Math.PI * 0.68 + sway * 0.3, true);

    // Leaf 2: Upper Right Node
    if (progress > 0.45) {
      const l2Progress = Math.min(1, (progress - 0.45) / 0.55);
      const l2Y = -currentHeight * 0.72;
      const l2X = topX * 0.8;
      drawSculptedLeaf(ctx, l2X, l2Y, 16 * l2Progress, -Math.PI * 0.28 + sway * 0.3, false);
    }
  }

  // 3. SEPAL CALYX (Green base cradling the rose head)
  ctx.save();
  ctx.translate(topX, topY);

  if (progress > 0.2) {
    ctx.fillStyle = '#395730';
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 6 + sway * 0.2);
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.quadraticCurveTo(-2, headSize * 0.35, 0, headSize * 0.55);
      ctx.quadraticCurveTo(2, headSize * 0.35, 3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // 4. LAYERED 3D ROSE HEAD WITH DEPTH SHADING
  // Back outer petals (deep shadow layer)
  ctx.fillStyle = '#4A1724';
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 + progress * 0.25;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, -headSize * 0.42 * progress, headSize * 0.38, headSize * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Mid petals (Rich Romantic Crimson with top rim lighting)
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI * 2) / 4 + Math.PI / 4 - progress * 0.2;
    ctx.save();
    ctx.rotate(angle);

    const petalGrad = ctx.createLinearGradient(0, 0, 0, -headSize * 0.4);
    petalGrad.addColorStop(0, '#782338'); // Shadow fold
    petalGrad.addColorStop(0.7, '#B85C70'); // Vibrant rose
    petalGrad.addColorStop(1, '#D79AA6'); // Pale rim highlight

    ctx.beginPath();
    ctx.ellipse(0, -headSize * 0.28 * progress, headSize * 0.28, headSize * 0.34, 0, 0, Math.PI * 2);
    ctx.fillStyle = petalGrad;
    ctx.fill();

    // Subtle edge rim stroke
    ctx.strokeStyle = 'rgba(235, 185, 195, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // Inner spiral bud core (Sculptural 3D tight petals)
  ctx.save();
  const coreGrad = ctx.createRadialGradient(0, -headSize * 0.05, 2, 0, 0, headSize * 0.22);
  coreGrad.addColorStop(0, '#E6B8C2'); // Soft highlight core
  coreGrad.addColorStop(0.4, '#C26379'); // Rich pink mid
  coreGrad.addColorStop(1, '#5E1B2C'); // Deep crevice shadow

  ctx.beginPath();
  ctx.arc(0, 0, headSize * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = coreGrad;
  ctx.fill();

  // Fine swirl line in bud center
  ctx.beginPath();
  ctx.arc(0, -headSize * 0.04, headSize * 0.11, 0.4, Math.PI * 1.8);
  ctx.strokeStyle = 'rgba(255, 240, 245, 0.7)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  ctx.restore(); // Exit head
  ctx.restore(); // Exit base
}

/**
 * Helper to draw a beveled, sculptural leaf with natural venation.
 */
function drawSculptedLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  angle: number,
  flip: boolean
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (flip) ctx.scale(1, -1);

  // Upper illuminated leaf half
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.35, -size * 0.32, size * 0.7, -size * 0.25, size, 0);
  ctx.lineTo(0, 0);
  ctx.fillStyle = '#567D4F';
  ctx.fill();

  // Lower shaded leaf half
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.35, size * 0.28, size * 0.7, size * 0.22, size, 0);
  ctx.lineTo(0, 0);
  ctx.fillStyle = '#34522E';
  ctx.fill();

  // Central leaf vein
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.92, 0);
  ctx.strokeStyle = 'rgba(145, 195, 130, 0.65)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}
