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

export function drawBloomingRose(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  progress: number, // 0.0 to 1.0 bloom
  alpha: number
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  const currentSize = size * (0.4 + 0.6 * progress);

  // Outer petals layer (Deep burgundy)
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 + progress * 0.4;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, -currentSize * 0.45 * progress, currentSize * 0.38, currentSize * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? '#672F40' : '#7D374D';
    ctx.fill();
    ctx.restore();
  }

  // Mid petals layer (Romantic Crimson)
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI * 2) / 4 + Math.PI / 4 - progress * 0.3;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, -currentSize * 0.3 * progress, currentSize * 0.28, currentSize * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#B85C70';
    ctx.fill();
    ctx.restore();
  }

  // Core bud swirl (Muted Rose / Champagne tip)
  ctx.beginPath();
  ctx.arc(0, 0, currentSize * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = '#D79AA6';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, -currentSize * 0.05, currentSize * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#D6BD91';
  ctx.fill();

  ctx.restore();
}
