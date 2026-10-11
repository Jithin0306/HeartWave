import {
  SemanticGesture,
  GestureDetectionResult,
  GestureEvent,
  GESTURE_LABELS,
} from '../types/gesture';

export class GestureStateMachine {
  private currentGesture: SemanticGesture = 'none';
  private candidateGesture: SemanticGesture = 'none';
  private candidateCount: number = 0;
  private minCandidateFrames: number = 3; // 3-frame debounce confirmation (~80-100ms)

  private gestureStartTime: number = 0;
  private lastTriggerTime: number = 0;
  private holdDurationMs: number = 550; // 0.55s sustained hold for snappy yet deliberate feel
  private cooldownMs: number = 1000;
  private graceLostTimeout: number = 220; // 220ms grace window for micro-occlusions
  private lastSeenTime: number = 0;
  private isCurrentlyTriggered: boolean = false;
  private lastValidAnchor: { x: number; y: number } = { x: 0.5, y: 0.5 };

  constructor(holdDurationSeconds: number = 0.55, cooldownSeconds: number = 1.0) {
    this.holdDurationMs = holdDurationSeconds * 1000;
    this.cooldownMs = cooldownSeconds * 1000;
  }

  setHoldDuration(seconds: number): void {
    this.holdDurationMs = Math.max(150, Math.min(2500, seconds * 1000));
  }

  setCooldown(seconds: number): void {
    this.cooldownMs = Math.max(300, Math.min(3000, seconds * 1000));
  }

  update(detection: GestureDetectionResult, now: number = performance.now()): GestureEvent {
    const rawDetected = detection.gesture;
    if (detection.confidence > 0.6) {
      this.lastValidAnchor = detection.anchor;
    }

    // 1. Debounce and filter candidate transitions
    if (rawDetected === this.currentGesture) {
      // Sustained match, reset candidate challenger
      this.candidateGesture = 'none';
      this.candidateCount = 0;
      if (rawDetected !== 'none') {
        this.lastSeenTime = now;
      }
    } else {
      // Challenger gesture detected
      if (rawDetected === this.candidateGesture) {
        this.candidateCount++;
        // If challenger persists for minCandidateFrames, commit the transition
        if (this.candidateCount >= this.minCandidateFrames) {
          this.currentGesture = rawDetected;
          this.gestureStartTime = now;
          this.isCurrentlyTriggered = false;
          this.candidateCount = 0;
          this.candidateGesture = 'none';
          if (rawDetected !== 'none') {
            this.lastSeenTime = now;
          }
        }
      } else {
        this.candidateGesture = rawDetected;
        this.candidateCount = 1;
      }
    }

    // 2. Handle grace period for temporary lost frames (occlusion buffer)
    if (this.currentGesture !== 'none' && rawDetected === 'none') {
      if (now - this.lastSeenTime < this.graceLostTimeout) {
        // Within grace window, keep active gesture alive
      } else {
        // Grace period expired, transition to none
        this.currentGesture = 'none';
        this.isCurrentlyTriggered = false;
        this.gestureStartTime = 0;
      }
    }

    // 3. If currently in 'none' state
    if (this.currentGesture === 'none') {
      return {
        gesture: 'none',
        label: GESTURE_LABELS['none'],
        confidence: 0,
        anchor: this.lastValidAnchor,
        holdProgress: 0,
        isTriggered: false,
        timestamp: now,
      };
    }

    // 4. Calculate hold progress & triggers
    const elapsed = now - this.gestureStartTime;
    const progress = Math.min(1.0, elapsed / this.holdDurationMs);
    const isCoolingDown = now - this.lastTriggerTime < this.cooldownMs;

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
      anchor: detection.confidence > 0.6 ? detection.anchor : this.lastValidAnchor,
      holdProgress: progress,
      isTriggered: triggeredThisFrame,
      timestamp: now,
    };
  }

  reset(): void {
    this.currentGesture = 'none';
    this.candidateGesture = 'none';
    this.candidateCount = 0;
    this.gestureStartTime = 0;
    this.isCurrentlyTriggered = false;
  }
}
