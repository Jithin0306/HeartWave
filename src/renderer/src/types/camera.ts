export interface CameraDevice {
  id: string;
  label: string;
  isDefault?: boolean;
}

export interface ResolutionProfile {
  id: string;
  label: string;
  width: number;
  height: number;
  fps: number;
}

export type CameraStatus = 'standby' | 'connecting' | 'active' | 'error';
export type VirtualCameraStatus = 'offline' | 'starting' | 'active' | 'driver_unregistered';

export interface CameraState {
  status: CameraStatus;
  selectedDeviceId: string;
  availableDevices: CameraDevice[];
  selectedResolution: ResolutionProfile;
  availableResolutions: ResolutionProfile[];
  isMirrored: boolean;
  virtualCameraStatus: VirtualCameraStatus;
}
