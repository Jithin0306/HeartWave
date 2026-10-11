import {
  SemanticGesture,
  GestureDetectionResult,
  GestureEvent,
  GESTURE_LABELS,
} from '../types/gesture';

export class GestureStateMachine {
  private currentGesture: SemanticGesture = 'none';
  private gestureStartTime: number = 0;
  private lastTriggerTime: number = 0;
  private holdDurationMs: number = 700; // 0.7 seconds sustained hold
  private cooldownMs: number = 1200; // 1.2 seconds cooldown
  private graceLostTimeout: number = 250; // Grace period before resetting
  private lastSeenTime: number = 0;
  private isCurrentlyTriggered: boolean = false;

  constructor(holdDurationSeconds: number = 0.7, cooldownSeconds: number = 1.2) {
    this.holdDurationMs = holdDurationSeconds * 1000;
    this.cooldownMs = cooldownSeconds * 1000;
  }

  setHoldDuration(seconds: number): void {
    this.holdDurationMs = Math.max(200, Math.min(2500, seconds * 1000));
  }

  setCooldown(seconds: number): void {
    this.cooldownMs = Math.max(300, Math.min(3000, seconds * 1000));
  }

  update(detection: GestureDetectionResult, now: number = performance.now()): GestureEvent {
    const detected = detection.gesture;

    // Check if within cooldown
    const isCoolingDown = now - this.lastTriggerTime < this.cooldownMs;

    if (detected === 'none') {
      // If we recently saw a gesture, allow grace period before resetting
      if (now - this.lastSeenTime > this.graceLostTimeout) {
        this.currentGesture = 'none';
        this.isCurrentlyTriggered = false;
        this.gestureStartTime = 0;
      }

      return {
        gesture: 'none',
        label: GESTURE_LABELS['none'],
        confidence: 0,
        anchor: detection.anchor,
        holdProgress: 0,
        isTriggered: false,
        timestamp: now,
      };
    }

    this.lastSeenTime = now;

    // If gesture changed
    if (detected !== this.currentGesture) {
      this.currentGesture = detected;
      this.gestureStartTime = now;
      this.isCurrentlyTriggered = false;
    }

    // Calculate hold progress
    const elapsed = now - this.gestureStartTime;
    const progress = Math.min(1.0, elapsed / this.holdDurationMs);

    let triggeredThisFrame = false;
    if (progress >= 1.0 && !this.isCurrentlyTriggered && !isCoolingDown) {
      this.isCurrentlyTriggered = true;
      this.lastTriggerTime = now;
      triggeredThisFrame = true;
    }

    return {
      gesture: this.currentGesture,
      label: GESTURE_LABELS[this.currentGesture] || this.currentGesture,
      confidence: detection.confidence,
      anchor: detection.anchor,
      holdProgress: progress,
      isTriggered: triggeredThisFrame,
      timestamp: now,
    };
  }

  reset(): void {
    this.currentGesture = 'none';
    this.gestureStartTime = 0;
    this.isCurrentlyTriggered = false;
  }
}
