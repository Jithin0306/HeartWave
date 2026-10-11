import { VisualEffect, EffectAnchor } from './types';
import { SemanticGesture, GestureEvent } from '../types/gesture';
import { GoldenFingerHeartEffect } from './romantic/goldenFingerHeart';
import { TwinHandsHeartEffect } from './romantic/twinHandsHeart';
import { RoseBloomEffect } from './romantic/roseBloom';
import { FloatingHeartsEffect } from './romantic/floatingHearts';
import { CupidSparkEffect } from './romantic/cupidSpark';
import { PetalRainEffect } from './romantic/petalRain';

export class EffectManager {
  private effects: Map<string, VisualEffect> = new Map();
  private gestureToEffectMap: Map<SemanticGesture, string> = new Map([
    ['korean_finger_heart', 'golden-finger-heart'],
    ['two_hand_heart', 'big-heart'],
    ['open_palm_up', 'rose-bloom'],
    ['open_palm', 'floating-hearts'],
    ['index_point', 'cupid-spark'],
    ['petal_rain_pose', 'petal-rain'],
  ]);

  private activeEffectId: string = 'golden-finger-heart';
  private lastTime: number = performance.now();

  constructor() {
    this.registerEffect(new GoldenFingerHeartEffect());
    this.registerEffect(new TwinHandsHeartEffect());
    this.registerEffect(new RoseBloomEffect());
    this.registerEffect(new FloatingHeartsEffect());
    this.registerEffect(new CupidSparkEffect());
    this.registerEffect(new PetalRainEffect());
  }

  private registerEffect(effect: VisualEffect): void {
    this.effects.set(effect.id, effect);
  }

  setActiveEffect(id: string): void {
    this.activeEffectId = id;
  }

  getActiveEffect(): VisualEffect | undefined {
    return this.effects.get(this.activeEffectId);
  }

  /**
   * Handle incoming gesture event from Phase 3 Gesture Engine.
   */
  handleGestureEvent(event: GestureEvent | null): void {
    if (!event || event.gesture === 'none') {
      // Release holding on all effects
      this.effects.forEach((eff) => {
        if ('setHolding' in eff) {
          (eff as any).setHolding(false);
        }
      });
      return;
    }

    const matchedEffectId = this.gestureToEffectMap.get(event.gesture);
    const targetEffect = matchedEffectId ? this.effects.get(matchedEffectId) : undefined;

    if (targetEffect) {
      const anchor: EffectAnchor = { x: event.anchor.x, y: event.anchor.y };

      // Set holding true while gesture is detected
      if ('setHolding' in targetEffect) {
        (targetEffect as any).setHolding(true);
      }

      targetEffect.onGestureTrigger(anchor, event.confidence);
    }
  }

  /**
   * Manually trigger an effect (e.g. from the UI button).
   */
  manualTrigger(effectId?: string, anchor: EffectAnchor = { x: 0.5, y: 0.5 }): void {
    const id = effectId || this.activeEffectId;
    const eff = this.effects.get(id);
    if (eff) {
      if ('setHolding' in eff) {
        (eff as any).setHolding(true);
      }
      eff.onGestureTrigger(anchor, 1.0);
    }
  }

  /**
   * Advance animations and physics.
   */
  update(intensity: number, currentAnchor?: EffectAnchor, now: number = performance.now()): void {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.effects.forEach((effect) => {
      effect.update(dt, intensity, currentAnchor);
    });
  }

  /**
   * Render active effect particles to canvas.
   */
  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    ctx.clearRect(0, 0, width, height);

    this.effects.forEach((effect) => {
      effect.render(ctx, width, height, isMirrored);
    });
  }

  /**
   * Reset all effects.
   */
  resetAll(): void {
    this.effects.forEach((effect) => effect.reset());
  }
}

export const effectManager = new EffectManager();
