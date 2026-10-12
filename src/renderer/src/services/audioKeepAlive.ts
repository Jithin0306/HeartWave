/**
 * AudioKeepAlive: Silent Web Audio API keep-alive anchor.
 *
 * Chromium power management (WebMediaPlayerImpl) automatically suspends
 * hardware video decoding and caps frame delivery for HTML5 <video> elements
 * down to 1-5 FPS when an Electron window is minimized or occluded, unless the
 * page is actively producing audible media.
 *
 * By creating a zero-gain (inaudible) audio node routed to the audio output,
 * Chromium classifies the window as an active media player and leaves the
 * video frame decoding pipeline completely unthrottled at the hardware level.
 */
export class AudioKeepAlive {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isRunning: boolean = false;

  public start(): void {
    if (this.isRunning) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();

      // Silent gain (essentially 0, but non-zero to keep the audio graph active)
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 0.00001;

      // Inaudible low oscillator
      this.oscillator = this.audioCtx.createOscillator();
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = 100; // 100 Hz at 0.00001 volume is imperceptible

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.oscillator.start();

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      this.isRunning = true;
    } catch (err) {
      console.warn('[AudioKeepAlive] Unable to start silent keep-alive context:', err);
    }
  }

  public stop(): void {
    if (!this.isRunning) return;

    try {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }

      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }

      if (this.audioCtx) {
        this.audioCtx.close().catch(() => {});
        this.audioCtx = null;
      }
    } catch {
      // Ignore cleanup error
    } finally {
      this.isRunning = false;
    }
  }

  public get active(): boolean {
    return this.isRunning;
  }
}
