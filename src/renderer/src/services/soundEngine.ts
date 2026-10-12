/**
 * HeartWave Procedural Audio Feedback Engine (Web Audio API)
 * Generates lightweight, tactile harmonic sound cues when gestures trigger effects.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.5; // 0.0 to 1.0
  private lastTriggerTime: number = 0;
  private readonly TRIGGER_COOLDOWN_MS = 1200;

  constructor() {
    // Lazily initialized on first user interaction or trigger
  }

  private getAudioContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Warm acoustic heart chime for Korean Finger Heart & Twin Hands Heart
   */
  public playHeartChime(): void {
    if (!this.canPlay()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.45, now);
    masterGain.connect(ctx.destination);

    // Fundamental frequencies: C5 (523.25 Hz) and G5 (783.99 Hz) with gentle octave shimmer
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.05 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.7);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.75);
    });

    this.lastTriggerTime = Date.now();
  }

  /**
   * Ascending botanical chime for 3D Rose Bloom
   */
  public playBloomChime(): void {
    if (!this.canPlay()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.4, now);
    masterGain.connect(ctx.destination);

    // Warm pentatonic arpeggio
    const arpeggio = [440, 554.37, 659.25, 880, 1108.73];
    arpeggio.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.22, now + i * 0.06 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.5);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.55);
    });

    this.lastTriggerTime = Date.now();
  }

  /**
   * High crystalline shimmer for Cupid Spark
   */
  public playSparkle(): void {
    if (!this.canPlay()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.35, now);
    masterGain.connect(ctx.destination);

    const freqs = [1046.5, 1318.51, 1567.98, 2093.0];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.08, now + idx * 0.04 + 0.25);

      gain.gain.setValueAtTime(0, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.4);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.45);
    });

    this.lastTriggerTime = Date.now();
  }

  /**
   * Gentle cascading flutter for Petal Rain / Floating Hearts
   */
  public playDriftChime(): void {
    if (!this.canPlay()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.3, now);
    masterGain.connect(ctx.destination);

    const freqs = [784, 659, 587, 523];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });

    this.lastTriggerTime = Date.now();
  }

  /**
   * Dispatch appropriate sound based on active effect/gesture
   */
  public playForEffect(effectId: string): void {
    if (effectId.includes('heart')) {
      this.playHeartChime();
    } else if (effectId.includes('rose') || effectId.includes('bloom')) {
      this.playBloomChime();
    } else if (effectId.includes('spark')) {
      this.playSparkle();
    } else {
      this.playDriftChime();
    }
  }

  private canPlay(): boolean {
    if (!this.isEnabled || this.volume <= 0.01) return false;
    return Date.now() - this.lastTriggerTime >= this.TRIGGER_COOLDOWN_MS;
  }
}

export const soundEngine = new SoundEngine();
