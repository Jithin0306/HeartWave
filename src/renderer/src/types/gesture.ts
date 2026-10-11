export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type SemanticGesture =
  | 'none'
  | 'heart_hands'
  | 'open_palm_up'
  | 'open_palm'
  | 'index_point'
  | 'two_hands_aura'
  | 'petal_rain_pose';

export interface TrackedHand {
  landmarks: Point3D[];
  worldLandmarks: Point3D[];
  handedness: 'Left' | 'Right';
  score: number;
}

export interface GestureDetectionResult {
  gesture: SemanticGesture;
  confidence: number;
  anchor: { x: number; y: number }; // Normalized 0..1 in video space
  handsCount: number;
  rawHands: TrackedHand[];
}

export interface GestureEvent {
  gesture: SemanticGesture;
  label: string;
  confidence: number;
  anchor: { x: number; y: number };
  holdProgress: number; // 0.0 to 1.0
  isTriggered: boolean;
  timestamp: number;
}

export const GESTURE_LABELS: Record<SemanticGesture, string> = {
  none: 'No Gesture',
  heart_hands: 'Heart Hand Pose',
  open_palm_up: 'Upward Palm',
  open_palm: 'Open Palm Float',
  index_point: 'Index Point / Pinch',
  two_hands_aura: 'Love Aura Pose',
  petal_rain_pose: 'Petal Rain Pose',
};
