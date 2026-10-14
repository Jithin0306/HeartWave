import { CompositorMetrics } from '../types/compositor';
import { BackgroundMode } from '../types/background';
import { BACKDROP_PRESETS } from '../data/initialBackdrops';
import logoFullUrl from '../assets/logo-full.jpg';
import logoIconUrl from '../assets/logo-icon.png';

export class VideoCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private width: number = 1280;
  private height: number = 720;
  private logoFullImg: HTMLImageElement | null = null;
  private logoIconImg: HTMLImageElement | null = null;

  // Dual-pass segmentation foreground buffer
  private foregroundCanvas: HTMLCanvasElement;
  private fgCtx: CanvasRenderingContext2D | null;

  // Cached Backdrop Image Elements
  private backdropCache: Map<string, HTMLImageElement> = new Map();
  private customBackdropImg: HTMLImageElement | null = null;
  private lastCustomUrl: string | null = null;

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
      willReadFrequently: true, // Eliminates synchronous GPU readback stalls
    });
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = true;
    }

    this.foregroundCanvas = document.createElement('canvas');
    this.foregroundCanvas.width = this.width;
    this.foregroundCanvas.height = this.height;
    this.fgCtx = this.foregroundCanvas.getContext('2d', {
      willReadFrequently: false,
    });
    if (this.fgCtx) {
      this.fgCtx.imageSmoothingEnabled = true;
    }

    try {
      this.logoFullImg = new Image();
      this.logoFullImg.src = logoFullUrl;
      this.logoIconImg = new Image();
      this.logoIconImg.src = logoIconUrl;
    } catch {}

    // Pre-cache built-in studio backdrop SVGs
    this.preloadBackdrops();

    try {
      this.outputStream = this.canvas.captureStream(30);
    } catch {}
  }

  private preloadBackdrops(): void {
    BACKDROP_PRESETS.forEach((preset) => {
      const img = new Image();
      img.src = preset.imageUrl;
      this.backdropCache.set(preset.id, img);
    });
  }

  /**
   * Resize offscreen composition buffers to match active video resolution.
   */
  setResolution(width: number, height: number): void {
    if (this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;
      this.canvas.width = width;
      this.canvas.height = height;
      this.foregroundCanvas.width = width;
      this.foregroundCanvas.height = height;
    }
  }

  /**
   * Render composite video frame with physical camera, background optics (DSLR blur,
   * virtual backdrops, chroma green screen), effects overlay, or privacy slate.
   */
  compositeFrame(
    video: CanvasImageSource,
    effectsCanvas: HTMLCanvasElement | null,
    isMirrored: boolean,
    bypassEffects: boolean,
    isPrivacyShutterActive: boolean,
    backgroundMode: BackgroundMode = 'off',
    bokehIntensity: number = 50,
    maskCanvas: HTMLCanvasElement | null = null,
    selectedBackdropId: string = 'penthouse',
    customBackdropUrl: string | null = null,
    greenscreenColor: string = '#00FF00'
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
      const isOpticsActive = backgroundMode !== 'off' && maskCanvas !== null;

      if (!isOpticsActive) {
        // Standard single-pass rendering when background optics are off or initializing
        ctx.save();
        if (isMirrored) {
          ctx.translate(this.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, this.width, this.height);
        ctx.restore();
      } else {
        // Dual-pass compositing:
        // Pass 1: Prepare foreground subject cutout in offscreen buffer
        if (this.fgCtx) {
          this.fgCtx.imageSmoothingEnabled = true;
          this.fgCtx.clearRect(0, 0, this.width, this.height);
          this.fgCtx.drawImage(video, 0, 0, this.width, this.height);
          this.fgCtx.globalCompositeOperation = 'destination-in';
          this.fgCtx.drawImage(maskCanvas, 0, 0, this.width, this.height);
          this.fgCtx.globalCompositeOperation = 'source-over';
        }

        // Pass 2: Render background layer based on active mode
        if (backgroundMode === 'blur') {
          // Mode A: Cinematic DSLR Bokeh Blur (5px to 35px)
          const blurPx = Math.max(4, Math.round(5 + (bokehIntensity / 100) * 30));
          const pad = blurPx * 1.5; // Bleed padding prevents dark canvas edges

          ctx.save();
          if (isMirrored) {
            ctx.translate(this.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.filter = `blur(${blurPx}px)`;
          ctx.drawImage(video, -pad, -pad, this.width + pad * 2, this.height + pad * 2);
          ctx.filter = 'none';

          // Draw cutout foreground subject over blurred background
          ctx.drawImage(this.foregroundCanvas, 0, 0, this.width, this.height);
          ctx.restore();
        } else if (backgroundMode === 'backdrop') {
          // Mode B: Virtual Studio Backdrop
          // Draw backdrop unmirrored so environment details/text remain natural
          this.renderBackdrop(ctx, selectedBackdropId, customBackdropUrl);

          // Draw foreground subject mirrored to match camera perspective
          ctx.save();
          if (isMirrored) {
            ctx.translate(this.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(this.foregroundCanvas, 0, 0, this.width, this.height);
          ctx.restore();
        } else if (backgroundMode === 'greenscreen') {
          // Mode C: Virtual Green Screen Chroma Key
          ctx.fillStyle = greenscreenColor || '#00FF00';
          ctx.fillRect(0, 0, this.width, this.height);

          // Draw foreground subject mirrored
          ctx.save();
          if (isMirrored) {
            ctx.translate(this.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(this.foregroundCanvas, 0, 0, this.width, this.height);
          ctx.restore();
        }
      }

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
   * Renders the selected backdrop (cached preset or custom upload) onto target context.
   */
  private renderBackdrop(
    ctx: CanvasRenderingContext2D,
    backdropId: string,
    customUrl: string | null
  ): void {
    const w = this.width;
    const h = this.height;

    if (backdropId === 'custom' && customUrl) {
      if (this.lastCustomUrl !== customUrl || !this.customBackdropImg) {
        this.lastCustomUrl = customUrl;
        this.customBackdropImg = new Image();
        this.customBackdropImg.src = customUrl;
      }

      if (this.customBackdropImg.complete && this.customBackdropImg.naturalWidth > 0) {
        ctx.drawImage(this.customBackdropImg, 0, 0, w, h);
        return;
      }
    }

    // Check cached presets
    const cached = this.backdropCache.get(backdropId) || this.backdropCache.get('penthouse');
    if (cached && cached.complete && cached.naturalWidth > 0) {
      ctx.drawImage(cached, 0, 0, w, h);
    } else {
      // Fallback dark studio gradient if image is still loading
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1a1817');
      grad.addColorStop(1, '#0e0d0c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
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

    const cx = w / 2;
    const cy = h / 2 - 25;

    ctx.save();

    // Render Heartwave 3D Emblem if available
    const iconSize = 96;
    if (this.logoIconImg && this.logoIconImg.complete && this.logoIconImg.naturalWidth > 0) {
      // Draw rounded crest border
      ctx.strokeStyle = 'rgba(214, 189, 145, 0.35)';
      ctx.lineWidth = 1.5;
      const pad = 6;
      ctx.strokeRect(cx - iconSize / 2 - pad, cy - iconSize / 2 - pad, iconSize + pad * 2, iconSize + pad * 2);
      ctx.drawImage(this.logoIconImg, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);
    } else {
      // Fallback Monogram Crest Box
      const boxSize = 80;
      ctx.strokeStyle = 'rgba(214, 189, 145, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - boxSize / 2, cy - boxSize / 2, boxSize, boxSize);

      ctx.fillStyle = '#D6BD91';
      ctx.font = '600 24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HW', cx, cy - 2);
    }

    // Editorial Typography
    ctx.textAlign = 'center';
    ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '0.12em';
    ctx.fillStyle = '#F5EFE9';
    ctx.fillText('CAMERA MUTED', cx, cy + iconSize / 2 + 28);

    ctx.font = '400 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '0.04em';
    ctx.fillStyle = '#D6BD91';
    ctx.fillText('Heartwave • Make every gesture mean something', cx, cy + iconSize / 2 + 48);

    ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#857873';
    ctx.fillText('Privacy shutter is active', cx, cy + iconSize / 2 + 66);

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

  private vcamCanvas: HTMLCanvasElement | null = null;
  private vcamCtx: CanvasRenderingContext2D | null = null;

  /**
   * Extract raw RGBA frame buffer for Phase 6 Native Windows Virtual Camera driver.
   * If targetWidth/targetHeight are passed (e.g. 1280x720 standard broadcast),
   * scales on GPU to guarantee maximum performance and zero CPU bottleneck.
   */
  extractFrameBuffer(targetWidth?: number, targetHeight?: number): { data: Uint8ClampedArray; width: number; height: number } | null {
    if (!this.ctx) return null;

    if (targetWidth && targetHeight && (targetWidth !== this.width || targetHeight !== this.height)) {
      if (!this.vcamCanvas) {
        this.vcamCanvas = document.createElement('canvas');
        this.vcamCanvas.width = targetWidth;
        this.vcamCanvas.height = targetHeight;
        this.vcamCtx = this.vcamCanvas.getContext('2d', {
          alpha: false,
          willReadFrequently: true,
        });
      }
      if (this.vcamCanvas.width !== targetWidth || this.vcamCanvas.height !== targetHeight) {
        this.vcamCanvas.width = targetWidth;
        this.vcamCanvas.height = targetHeight;
      }
      if (this.vcamCtx) {
        this.vcamCtx.drawImage(this.canvas, 0, 0, targetWidth, targetHeight);
        const imgData = this.vcamCtx.getImageData(0, 0, targetWidth, targetHeight);
        return { data: imgData.data, width: targetWidth, height: targetHeight };
      }
    }

    const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    return { data: imgData.data, width: this.width, height: this.height };
  }

  /**
   * Get reference to the raw HTMLCanvasElement.
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }
}

export const videoCompositor = new VideoCompositor();
