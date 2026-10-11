export type VirtualOutputStatus = 'standby' | 'broadcasting' | 'paused';

export interface CompositorMetrics {
  compositeFps: number;
  renderTimeMs: number;
  droppedFrames: number;
  width: number;
  height: number;
}

export type PrivacyMode = 'slate' | 'freeze' | 'black';

export interface VideoCompositorOptions {
  targetWidth: number;
  targetHeight: number;
  targetFps: number;
}
