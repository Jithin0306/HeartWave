import { CameraDevice, ResolutionProfile, CameraErrorInfo, LiveStreamMetrics } from '../types/camera';

class CameraManager {
  private currentStream: MediaStream | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  /**
   * Enumerate all connected physical video input devices.
   */
  async enumerateDevices(): Promise<CameraDevice[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      throw new Error('MediaDevices API is not supported in this runtime.');
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');

      // If labels are empty (happens prior to initial getUserMedia permission on some Chromium environments),
      // prompt for a brief permission probe to expose genuine device labels.
      if (videoDevices.length > 0 && !videoDevices[0].label) {
        try {
          const probeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          probeStream.getTracks().forEach((track) => track.stop());
          const recheckedDevices = await navigator.mediaDevices.enumerateDevices();
          return recheckedDevices
            .filter((d) => d.kind === 'videoinput')
            .map((d, index) => ({
              id: d.deviceId,
              label: d.label || `Camera ${index + 1}`,
              groupId: d.groupId,
              isDefault: index === 0,
            }));
        } catch {
          // Fall through to default naming if probe was rejected
        }
      }

      return videoDevices.map((d, index) => ({
        id: d.deviceId,
        label: d.label || `Camera ${index + 1}`,
        groupId: d.groupId,
        isDefault: index === 0,
      }));
    } catch (err) {
      console.error('Failed to enumerate video devices:', err);
      return [];
    }
  }

  /**
   * Start streaming from the specified device with resolution constraints.
   */
  async startStream(
    deviceId?: string,
    resolution?: ResolutionProfile
  ): Promise<{ stream: MediaStream; metrics: LiveStreamMetrics }> {
    // Release any currently active camera resources first
    this.stopStream();

    const videoConstraints: MediaTrackConstraints = {};

    if (deviceId && deviceId !== 'default') {
      videoConstraints.deviceId = { ideal: deviceId };
    }

    if (resolution) {
      videoConstraints.width = { ideal: resolution.width };
      videoConstraints.height = { ideal: resolution.height };
      videoConstraints.frameRate = { ideal: resolution.fps, max: resolution.fps };
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });
    } catch (primaryErr) {
      // If overconstrained (e.g. resolution not supported by hardware), attempt fallback without resolution locks
      if (primaryErr instanceof OverconstrainedError || (primaryErr as Error).name === 'OverconstrainedError') {
        console.warn('Resolution overconstrained. Attempting standard fallback stream.');
        stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { ideal: deviceId } } : true,
          audio: false,
        });
      } else {
        throw primaryErr;
      }
    }

    this.currentStream = stream;

    // Attach disconnection listener to the active video track
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        console.warn('Physical camera track ended unexpectedly (device disconnect).');
        if (this.onDisconnectCallback) {
          this.onDisconnectCallback();
        }
      };
    }

    // Extract live stream settings
    const settings = videoTrack?.getSettings() || {};
    const metrics: LiveStreamMetrics = {
      actualWidth: settings.width || resolution?.width || 1280,
      actualHeight: settings.height || resolution?.height || 720,
      actualFps: Math.round(settings.frameRate || resolution?.fps || 30),
    };

    return { stream, metrics };
  }

  /**
   * Immediately stops all active media tracks and frees hardware locks.
   */
  stopStream(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.error('Error stopping track:', e);
        }
      });
      this.currentStream = null;
    }
  }

  /**
   * Returns current active MediaStream if running.
   */
  getCurrentStream(): MediaStream | null {
    return this.currentStream;
  }

  /**
   * Set callback for unexpected track termination (e.g., USB unplug).
   */
  setOnDisconnect(callback: (() => void) | null): void {
    this.onDisconnectCallback = callback;
  }

  /**
   * Listen for hardware device addition/removal.
   */
  onDeviceChange(callback: () => void): () => void {
    if (!navigator.mediaDevices || !navigator.mediaDevices.addEventListener) {
      return () => {};
    }

    const handler = () => {
      callback();
    };

    navigator.mediaDevices.addEventListener('devicechange', handler);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handler);
    };
  }

  /**
   * Translate WebRTC MediaStream errors into actionable user diagnostics.
   */
  parseError(err: unknown): CameraErrorInfo {
    const errorName = (err as Error)?.name || '';
    const errorMsg = (err as Error)?.message || '';

    switch (errorName) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return {
          code: 'PERMISSION_DENIED',
          message: 'Camera permission was denied.',
          recoveryHint: 'Enable camera access in Windows Settings > Privacy & Security > Camera.',
        };

      case 'NotReadableError':
      case 'TrackStartError':
        return {
          code: 'DEVICE_BUSY',
          message: 'Camera is currently in use by another application.',
          recoveryHint: 'Close other applications (Zoom, Teams, OBS Studio, Browser) that might be locking the webcam.',
        };

      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return {
          code: 'DEVICE_NOT_FOUND',
          message: 'No physical camera device was detected.',
          recoveryHint: 'Check that your webcam is securely connected and recognized in Windows Device Manager.',
        };

      case 'OverconstrainedError':
        return {
          code: 'OVERCONSTRAINED',
          message: 'The requested resolution or framerate is not supported by this camera.',
          recoveryHint: 'Switch to 720p 30fps in Camera Settings.',
        };

      default:
        return {
          code: 'UNKNOWN_ERROR',
          message: errorMsg || 'An unknown error occurred while initializing the camera.',
          recoveryHint: 'Restart Heartwave or reconnect your camera.',
        };
    }
  }
}

export const cameraManager = new CameraManager();
