export type EffectCategory = 'all' | 'romantic' | 'couples' | 'streamer' | 'favorites';

export type GestureType =
  | 'korean_finger_heart'
  | 'two_hand_heart'
  | 'fist'
  | 'open_palm'
  | 'index_point'
  | 'petal_rain_pose';

export interface EffectItem {
  id: string;
  name: string;
  category: 'romantic' | 'couples' | 'streamer';
  gestureName: string;
  gestureDescription: string;
  description: string;
  accentColor: string;
  defaultIntensity: number;
  isFavorite: boolean;
  proceduralType: 'golden_finger_heart' | 'big_heart' | 'rose_bloom' | 'floating_hearts' | 'cupid_spark' | 'petal_rain';
  previewIcon: string;
  phaseAvailability: string;
}

export interface EffectState {
  selectedEffectId: string;
  activeIntensity: number;
  isTrackingActive: boolean;
  filterCategory: EffectCategory;
  searchQuery: string;
}
