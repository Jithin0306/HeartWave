export type EffectCategory = 'all' | 'romantic' | 'couples' | 'streamer' | 'favorites';

export type GestureType =
  | 'heart_hands'
  | 'open_palm_up'
  | 'open_palm'
  | 'index_point'
  | 'two_hands_aura'
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
  proceduralType: 'heart_draw' | 'rose_bloom' | 'floating_hearts' | 'cupid_spark' | 'love_aura' | 'petal_rain';
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
