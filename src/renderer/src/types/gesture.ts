export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type SemanticGesture =
  | 'none'
  | 'korean_finger_heart'
  | 'two_hand_heart'
  | 'fist'
  | 'open_palm'
  | 'index_point'
  | 'petal_rain_pose'
  | 'birthday_cake'
  | 'champagne_pop'
  | 'victory_fireworks'
  | 'flame_frost';

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
  anchors?: Array<{ x: number; y: number }>; // Multiple simultaneous hand anchors
  handsCount: number;
  rawHands: TrackedHand[];
}

export interface GestureEvent {
  gesture: SemanticGesture;
  label: string;
  confidence: number;
  anchor: { x: number; y: number };
  anchors?: Array<{ x: number; y: number }>; // Multiple simultaneous hand anchors
  holdProgress: number; // 0.0 to 1.0
  isTriggered: boolean;
  timestamp: number;
}

export const GESTURE_LABELS: Record<SemanticGesture, string> = {
  none: 'No Gesture',
  korean_finger_heart: 'Korean Finger Heart',
  two_hand_heart: 'Two-Hand Heart',
  fist: 'Closed Fist Rose',
  open_palm: 'Open Palm Floating Hearts',
  index_point: 'Index Point / Pinch',
  petal_rain_pose: 'Petal Rain Pose',
  birthday_cake: 'Birthday Cake & Candle Wish',
  champagne_pop: 'Champagne Pop & Bubbles',
  victory_fireworks: 'Victory Trophy & Fireworks',
  flame_frost: 'Elemental Flame & Frost',
};
