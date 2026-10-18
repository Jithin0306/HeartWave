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
  private minCandidateFrames: number = 1; // Snappy 1-frame trigger when gesture is detected

  private gestureStartTime: number = 0;
  private lastTriggerTime: number = 0;
  private holdDurationMs: number = 220; // 0.22s snappy trigger for modern responsive feel
  private cooldownMs: number = 800;
  private graceLostTimeout: number = 220; // 220ms grace window for micro-occlusions
  private lastSeenTime: number = 0;
  private isCurrentlyTriggered: boolean = false;
  private lastValidAnchor: { x: number; y: number } = { x: 0.5, y: 0.5 };
  private lastValidAnchors?: Array<{ x: number; y: number }>;

  constructor(holdDurationSeconds: number = 0.22, cooldownSeconds: number = 0.8) {
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

    // 3. Update valid anchors only when detected gesture matches currentGesture
    const detectionMatchesCurrent = detection.gesture === this.currentGesture && detection.confidence > 0.6;
    if (detectionMatchesCurrent) {
      this.lastValidAnchor = detection.anchor;
      this.lastValidAnchors = detection.anchors;
    }

    // 4. If currently in 'none' state
    if (this.currentGesture === 'none') {
      return {
        gesture: 'none',
        label: GESTURE_LABELS['none'],
        confidence: 0,
        anchor: this.lastValidAnchor,
        anchors: this.lastValidAnchors,
        holdProgress: 0,
        isTriggered: false,
        timestamp: now,
      };
    }

    // 5. Calculate hold progress & triggers
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
      anchor: detectionMatchesCurrent ? detection.anchor : this.lastValidAnchor,
      anchors: detectionMatchesCurrent ? detection.anchors : this.lastValidAnchors,
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
    this.lastValidAnchors = undefined;
  }
}
