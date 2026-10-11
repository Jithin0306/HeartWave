export interface CameraDevice {
  id: string;
  label: string;
  groupId?: string;
  isDefault?: boolean;
}

export interface ResolutionProfile {
  id: string;
  label: string;
  width: number;
  height: number;
  fps: number;
}

export type CameraStatus =
  | 'standby'
  | 'connecting'
  | 'active'
  | 'error'
  | 'permission_denied'
  | 'device_busy';

export type VirtualCameraStatus = 'offline' | 'starting' | 'active' | 'driver_unregistered';

export interface CameraErrorInfo {
  code: string;
  message: string;
  recoveryHint: string;
}

export interface LiveStreamMetrics {
  actualWidth: number;
  actualHeight: number;
  actualFps: number;
}
