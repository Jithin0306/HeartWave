import { VisualEffect, EffectAnchor } from './types';
import { SemanticGesture, GestureEvent } from '../types/gesture';
import { GoldenFingerHeartEffect } from './romantic/goldenFingerHeart';
import { TwinHandsHeartEffect } from './romantic/twinHandsHeart';
import { RoseBloomEffect } from './romantic/roseBloom';
import { FloatingHeartsEffect } from './romantic/floatingHearts';
import { CupidSparkEffect } from './romantic/cupidSpark';
import { PetalRainEffect } from './romantic/petalRain';
import { BirthdayCakeEffect } from './celebration/birthdayCake';
import { ConfettiCelebrationEffect } from './celebration/confettiCelebration';
import { CelebrationCrackersEffect } from './celebration/celebrationCrackers';
import { FlameFrostEffect } from './celebration/flameFrost';

export class EffectManager {
  private effects: Map<string, VisualEffect> = new Map();
  private gestureToEffectMap: Map<SemanticGesture, string> = new Map([
    ['korean_finger_heart', 'golden-finger-heart'],
    ['two_hand_heart', 'big-heart'],
    ['fist', 'rose-bloom'],
    ['open_palm', 'floating-hearts'],
    ['index_point', 'cupid-spark'],
    ['petal_rain_pose', 'petal-rain'],
    ['birthday_cake', 'birthday-cake'],
    ['confetti_celebration', 'confetti-celebration'],
    ['celebration_crackers', 'celebration-crackers'],
    ['flame_frost', 'flame-frost'],
  ]);

  private activeEffectId: string = 'golden-finger-heart';
  private lastTime: number = performance.now();
  private wasActive: Set<string> = new Set();

  constructor() {
    this.registerEffect(new GoldenFingerHeartEffect());
    this.registerEffect(new TwinHandsHeartEffect());
    this.registerEffect(new RoseBloomEffect());
    this.registerEffect(new FloatingHeartsEffect());
    this.registerEffect(new CupidSparkEffect());
    this.registerEffect(new PetalRainEffect());
    this.registerEffect(new BirthdayCakeEffect());
    this.registerEffect(new ConfettiCelebrationEffect());
    this.registerEffect(new CelebrationCrackersEffect());
    this.registerEffect(new FlameFrostEffect());
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
    const anchor: EffectAnchor = { x: event.anchor.x, y: event.anchor.y };
    const anchors: EffectAnchor[] | undefined = event.anchors?.map((a) => ({ x: a.x, y: a.y }));

    this.effects.forEach((eff, id) => {
      if (id === matchedEffectId) {
        if ('setHolding' in eff) {
          (eff as any).setHolding(true);
        }
        eff.onGestureTrigger(anchor, event.confidence, anchors);
      } else {
        // Guarantee clean mutual exclusivity: release all non-matched effects
        if ('setHolding' in eff) {
          (eff as any).setHolding(false);
        }
      }
    });
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
   * High-performance gatekeeper: only updates active/holding effects or effects with live particles.
   */
  update(intensity: number, currentAnchor?: EffectAnchor, now: number = performance.now(), currentAnchors?: EffectAnchor[]): void {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.effects.forEach((effect, id) => {
      const isHolding = 'isHolding' in effect && (effect as any).isHolding;
      if (!isHolding && !effect.hasActiveParticles()) {
        if (this.wasActive.delete(id)) {
          effect.reset();
        }
        return;
      }
      this.wasActive.add(id);

      effect.update(dt, intensity, currentAnchor, currentAnchors);
    });
  }

  /**
   * Render active effect particles to canvas.
   * High-performance gatekeeper: only renders effects that actually have active particles.
   */
  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void {
    ctx.clearRect(0, 0, width, height);

    this.effects.forEach((effect) => {
      if (!effect.hasActiveParticles()) return;

      effect.render(ctx, width, height, isMirrored);
    });
  }

  /**
   * Reset all effects.
   */
  resetAll(): void {
    this.wasActive.clear();
    this.effects.forEach((effect) => effect.reset());
  }
}

export const effectManager = new EffectManager();
