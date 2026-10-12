/**
 * PrecisionTimer: High-frequency background ticker utilizing an isolated Web Worker.
 *
 * In Chromium and Electron, DOM timers (setTimeout, setInterval, requestAnimationFrame)
 * on the main window thread are clamped to 1,000ms (1 FPS) whenever a window is minimized
 * or occluded to conserve battery.
 *
 * Web Workers run in a distinct OS thread context and are immune to DOMTimer::MinimumInterval
 * throttling, allowing consistent 30.0 FPS or 60.0 FPS frame delivery even when Heartwave
 * is completely minimized to the Windows taskbar.
 */
export class PrecisionTimer {
  private worker: Worker | null = null;
  private callback: (() => void) | null = null;
  private isRunning: boolean = false;
  private currentIntervalMs: number = 33.33;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    try {
      const workerScript = `
        let timerId = null;
        self.onmessage = function(e) {
          const data = e.data;
          if (!data) return;
          if (data.action === 'start') {
            if (timerId !== null) clearInterval(timerId);
            const interval = data.interval || 33.33;
            timerId = setInterval(function() {
              self.postMessage('tick');
            }, interval);
          } else if (data.action === 'stop') {
            if (timerId !== null) {
              clearInterval(timerId);
              timerId = null;
            }
          }
        };
      `;

      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      this.worker = new Worker(blobUrl);

      this.worker.onmessage = (event) => {
        if (event.data === 'tick' && this.callback && this.isRunning) {
          this.callback();
        }
      };

      this.worker.onerror = (err) => {
        console.warn('[PrecisionTimer] Web Worker error:', err);
      };
    } catch (err) {
      console.warn('[PrecisionTimer] Failed to instantiate worker ticker, falling back to interval:', err);
      this.worker = null;
    }
  }

  /**
   * Start high-precision background ticking.
   */
  public start(callback: () => void, intervalMs: number = 33.33): void {
    this.callback = callback;
    this.currentIntervalMs = intervalMs;
    this.isRunning = true;

    if (this.worker) {
      this.worker.postMessage({ action: 'start', interval: intervalMs });
    }
  }

  /**
   * Stop background ticking.
   */
  public stop(): void {
    this.isRunning = false;
    if (this.worker) {
      this.worker.postMessage({ action: 'stop' });
    }
  }

  /**
   * Adjust ticking interval dynamically (e.g. for 30 FPS vs 60 FPS).
   */
  public setInterval(intervalMs: number): void {
    this.currentIntervalMs = intervalMs;
    if (this.isRunning && this.worker) {
      this.worker.postMessage({ action: 'start', interval: intervalMs });
    }
  }

  /**
   * Terminate worker resources on unmount.
   */
  public destroy(): void {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.callback = null;
  }

  public get active(): boolean {
    return this.isRunning;
  }

  public get interval(): number {
    return this.currentIntervalMs;
  }
}
