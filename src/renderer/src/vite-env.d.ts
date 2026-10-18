/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

interface Window {
  heartwaveApi?: {
    minimizeWindow?: () => Promise<void>;
    maximizeWindow?: () => Promise<boolean>;
    isWindowMaximized?: () => Promise<boolean>;
    closeWindow?: () => Promise<void>;
    quitApp?: () => Promise<void>;
    getAppInfo?: () => Promise<{ version: string; name: string; platform: string; arch: string }>;
    onMaximizedChange?: (callback: (isMaximized: boolean) => void) => () => void;
    startVirtualCamera?: (width?: number, height?: number, fps?: number) => Promise<boolean>;
    stopVirtualCamera?: () => Promise<boolean>;
    getVirtualCameraStatus?: () => Promise<{ isRegistered: boolean; isBroadcasting: boolean }>;
    sendFrame?: (buffer: ArrayBuffer | Uint8Array | Uint8ClampedArray, width: number, height: number, isPrivacy?: boolean) => Promise<any> | void | boolean;
    triggerEffect?: (effectId: string, x: number, y: number, confidence?: number) => Promise<void>;
    updateEffectAnchor?: (effectId: string, x: number, y: number, anchorIndex?: number) => Promise<void>;
    releaseEffect?: (effectId: string) => Promise<void>;
    sendTrayState?: (state: { isPrivacy: boolean; isBypass: boolean; isVirtualOutput: boolean }) => void;
    onHotkeyPrivacy?: (callback: () => void) => () => void;
    onHotkeyBypass?: (callback: () => void) => () => void;
    onHotkeyVirtualOutput?: (callback: () => void) => () => void;
    onHotkeyMirror?: (callback: () => void) => () => void;
    checkForUpdates?: () => Promise<{
      state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
      version?: string;
      percent?: number;
      message?: string;
    }>;
    installUpdate?: () => Promise<boolean>;
    getUpdateStatus?: () => Promise<{
      state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
      version?: string;
      percent?: number;
      message?: string;
    }>;
    relaunchApp?: () => Promise<void>;
    downloadDirectInstaller?: () => void;
    onUpdateStatus?: (
      callback: (status: {
        state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
        version?: string;
        percent?: number;
        message?: string;
      }) => void
    ) => () => void;
  };
}

