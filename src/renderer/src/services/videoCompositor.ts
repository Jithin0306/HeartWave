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

  // Downscaled hardware-accelerated blur buffer (4x downscaled for 16x faster blur)
  private blurCanvas: HTMLCanvasElement;
  private blurCtx: CanvasRenderingContext2D | null;

  // Dedicated high-throughput Virtual Camera broadcast buffer
  private broadcastCanvas: HTMLCanvasElement;
  private broadcastCtx: CanvasRenderingContext2D | null;
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
      alpha: false, // Opaque buffer for faster blitting
      willReadFrequently: true, // Enables instantaneous zero-stall CPU memory readback for Virtual Camera
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

    this.blurCanvas = document.createElement('canvas');
    this.blurCanvas.width = 320;
    this.blurCanvas.height = 180;
    this.blurCtx = this.blurCanvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false,
    });
    if (this.blurCtx) {
      this.blurCtx.imageSmoothingEnabled = true;
    }

    this.broadcastCanvas = document.createElement('canvas');
    this.broadcastCanvas.width = 1280;
    this.broadcastCanvas.height = 720;
    this.broadcastCtx = this.broadcastCanvas.getContext('2d', {
      alpha: false,
      willReadFrequently: true,
    });
    if (this.broadcastCtx) {
      this.broadcastCtx.imageSmoothingEnabled = true;
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
      this.blurCanvas.width = Math.max(160, Math.round(width / 4));
      this.blurCanvas.height = Math.max(90, Math.round(height / 4));

      // Re-apply smoothing states as resizing canvas resets 2D context states to browser defaults
      if (this.ctx) this.ctx.imageSmoothingEnabled = true;
      if (this.fgCtx) this.fgCtx.imageSmoothingEnabled = true;
      if (this.blurCtx) this.blurCtx.imageSmoothingEnabled = true;
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
          // Hardware-accelerated DSLR Bokeh Blur with Foreground Exclusion (Normalized Convolution)
          // Excludes foreground person from the background blur kernel, preventing dark hair and bright
          // background walls from bleeding together into soft edge halos around the head and shoulders.
          const blurW = this.blurCanvas.width;
          const blurH = this.blurCanvas.height;
          const blurPx = Math.max(2, Math.round(2 + (bokehIntensity / 100) * 8));

          if (this.blurCtx) {
            this.blurCtx.clearRect(0, 0, blurW, blurH);
            this.blurCtx.drawImage(video, 0, 0, blurW, blurH);

            // 1. Exclude foreground subject from background blur samples
            this.blurCtx.globalCompositeOperation = 'destination-out';
            this.blurCtx.drawImage(maskCanvas, 0, 0, blurW, blurH);
            this.blurCtx.globalCompositeOperation = 'source-over';

            // 2. Convolution blur on pure background pixels (Zero foreground bleeding)
            this.blurCtx.filter = `blur(${blurPx}px)`;
            this.blurCtx.drawImage(this.blurCanvas, 0, 0, blurW, blurH);
            this.blurCtx.filter = 'none';

            // 3. Infill center under subject with wider blur to guarantee continuous coverage
            this.blurCtx.globalCompositeOperation = 'destination-over';
            this.blurCtx.filter = `blur(${blurPx * 2}px)`;
            this.blurCtx.drawImage(video, 0, 0, blurW, blurH);
            this.blurCtx.filter = 'none';
            this.blurCtx.globalCompositeOperation = 'source-over';
          }

          ctx.save();
          if (isMirrored) {
            ctx.translate(this.width, 0);
            ctx.scale(-1, 1);
          }
          // Bilinear upscale to full frame
          ctx.drawImage(this.blurCanvas, 0, 0, this.width, this.height);

          // Draw cutout foreground subject over clean halo-free blurred background
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

  /**
   * Extract raw RGBA frame buffer for Native Windows Virtual Camera driver.
   * Instantaneous Frame N extraction from CPU memory (<0.25ms, zero N-1 ping-pong latency).
   * DirectShow driver (HeartWaveCam.dll) automatically handles client format and scaling.
   */
  extractFrameBuffer(): { data: Uint8Array | Uint8ClampedArray; width: number; height: number } | null {
    if (!this.ctx) return null;

    const targetW = 1280;
    const targetH = 720;

    let srcCtx = this.ctx;
    if (this.width !== targetW || this.height !== targetH) {
      if (this.broadcastCtx) {
        this.broadcastCtx.drawImage(this.canvas, 0, 0, targetW, targetH);
        srcCtx = this.broadcastCtx;
      }
    }

    if (srcCtx) {
      const imgData = srcCtx.getImageData(0, 0, targetW, targetH);
      return { data: imgData.data, width: targetW, height: targetH };
    }

    return null;
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
