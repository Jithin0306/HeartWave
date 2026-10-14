export type BackgroundMode = 'off' | 'blur' | 'backdrop' | 'greenscreen';

export interface BackdropPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  previewGradient: string;
}

export interface GreenscreenPreset {
  id: string;
  name: string;
  hex: string;
  description: string;
}

export interface BackgroundOpticsConfig {
  mode: BackgroundMode;
  bokehIntensity: number; // 0 - 100
  selectedBackdropId: string;
  customBackdropUrl: string | null;
  greenscreenColor: string;
  edgeFeather: number; // 0.05 - 0.4
  temporalSmoothing: number; // 0.5 - 0.95
}
