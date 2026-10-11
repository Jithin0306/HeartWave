export interface EffectAnchor {
  x: number; // Normalized 0..1 in video coordinates
  y: number; // Normalized 0..1 in video coordinates
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  rotation: number;
  vRot: number;
  color: string;
  scale?: number;
}

export interface VisualEffect {
  id: string;
  name: string;
  init(width: number, height: number): void;
  onGestureTrigger(anchor: EffectAnchor, confidence: number): void;
  update(deltaTime: number, intensity: number, anchor?: EffectAnchor): void;
  render(ctx: CanvasRenderingContext2D, width: number, height: number, isMirrored: boolean): void;
  reset(): void;
  destroy(): void;
  hasActiveParticles(): boolean;
}
