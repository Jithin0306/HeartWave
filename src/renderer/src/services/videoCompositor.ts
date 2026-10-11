import { CompositorMetrics } from '../types/compositor';

export class VideoCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private width: number = 1280;
  private height: number = 720;

  // Performance telemetry
  private frameCount: number = 0;
  private lastFpsUpdateTime: number = performance.now();
  private currentFps: number = 0;
  private lastRenderDurationMs: number = 0;
  private droppedFrames: number = 0;

  // Output stream
  private outputStream: MediaStream | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d', {
      alpha: false, // Opaque buffer for faster GPU blitting
      desynchronized: true, // Low-latency pipeline hint
    });
  }

  /**
   * Resize offscreen composition buffer to match active video resolution.
   */
  setResolution(width: number, height: number): void {
    if (this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  /**
   * Render composite video frame with physical camera, effects overlay, or privacy slate.
   */
  compositeFrame(
    video: HTMLVideoElement,
    effectsCanvas: HTMLCanvasElement | null,
    isMirrored: boolean,
    bypassEffects: boolean,
    isPrivacyShutterActive: boolean
  ): CompositorMetrics {
    const startTime = performance.now();
    const ctx = this.ctx;

    if (!ctx) {
      return {
        compositeFps: 0,
        renderTimeMs: 0,
        droppedFrames: ++this.droppedFrames,
        width: this.width,
        height: this.height,
      };
    }

    // 1. If Privacy Shutter is active, render luxury Heartwave branded slate
    if (isPrivacyShutterActive) {
      this.renderPrivacySlate(ctx);
    } else {
      // 2. Draw physical webcam video
      ctx.save();
      if (isMirrored) {
        ctx.translate(this.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, this.width, this.height);
      ctx.restore();

      // 3. Overlay procedural effects canvas (unless user activated bypass)
      if (!bypassEffects && effectsCanvas && effectsCanvas.width > 0 && effectsCanvas.height > 0) {
        // Effects canvas already has internal mirror orientation applied
        ctx.drawImage(effectsCanvas, 0, 0, this.width, this.height);
      }
    }

    // 4. Performance Telemetry Calculation
    const endTime = performance.now();
    this.lastRenderDurationMs = Math.round((endTime - startTime) * 100) / 100;
    this.frameCount++;

    if (endTime - this.lastFpsUpdateTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (endTime - this.lastFpsUpdateTime));
      this.frameCount = 0;
      this.lastFpsUpdateTime = endTime;
    }

    return {
      compositeFps: this.currentFps,
      renderTimeMs: this.lastRenderDurationMs,
      droppedFrames: this.droppedFrames,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Renders bespoke Heartwave luxury branded privacy slate when camera is shuttered.
   */
  private renderPrivacySlate(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;

    // Deep luxury dark background
    ctx.fillStyle = '#141211';
    ctx.fillRect(0, 0, w, h);

    // Warm Burgundy Radial Aura in center
    const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, h * 0.45);
    grad.addColorStop(0, 'rgba(103, 47, 64, 0.45)');
    grad.addColorStop(0.5, 'rgba(103, 47, 64, 0.15)');
    grad.addColorStop(1, 'rgba(20, 18, 17, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Monogram Crest Box
    const boxSize = 80;
    const cx = w / 2;
    const cy = h / 2 - 20;

    ctx.save();
    ctx.strokeStyle = 'rgba(214, 189, 145, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - boxSize / 2, cy - boxSize / 2, boxSize, boxSize);

    // Monogram ✦
    ctx.fillStyle = '#D6BD91'; // Champagne
    ctx.font = '600 24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HW', cx, cy - 2);

    // Tiny 4-point gold star above monogram
    ctx.fillStyle = 'rgba(214, 189, 145, 0.8)';
    ctx.font = '14px sans-serif';
    ctx.fillText('✦', cx, cy - boxSize / 2 - 12);

    // Editorial Typography
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '0.12em';
    ctx.fillStyle = '#F5EFE9';
    ctx.fillText('CAMERA MUTED', cx, cy + boxSize / 2 + 30);

    ctx.font = '400 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#857873';
    ctx.fillText('Heartwave privacy shutter is active', cx, cy + boxSize / 2 + 50);

    ctx.restore();
  }

  /**
   * Capture real-time MediaStream from offscreen composite canvas for virtual broadcasting.
   */
  captureStream(fps: number = 30): MediaStream {
    if (!this.outputStream) {
      this.outputStream = this.canvas.captureStream(fps);
    }
    return this.outputStream;
  }

  /**
   * Extract raw RGBA frame buffer for Phase 6 Native Windows Virtual Camera driver.
   */
  extractFrameBuffer(): ImageData | null {
    if (!this.ctx) return null;
    return this.ctx.getImageData(0, 0, this.width, this.height);
  }

  /**
   * Get reference to the raw HTMLCanvasElement.
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}

export const videoCompositor = new VideoCompositor();
