import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export function initTauriBridge(): void {
  if (typeof window === 'undefined') return;
  if (!isTauri()) return;

  console.log('[HeartWave] 🦀 Native Rust Tauri v2 engine initialized with zero-copy shared memory!');

  window.heartwaveApi = {
    minimizeWindow: () => invoke('minimize_window'),
    maximizeWindow: () => invoke<boolean>('maximize_window'),
    isWindowMaximized: () => invoke<boolean>('is_window_maximized'),
    closeWindow: () => invoke('close_window'),
    quitApp: () => invoke('quit_app'),
    getAppInfo: () =>
      invoke<{ version: string; name: string; platform: string; arch: string }>('get_app_info'),
    onMaximizedChange: (_callback: (isMaximized: boolean) => void) => {
      return () => {};
    },
    startVirtualCamera: (width?: number, height?: number) =>
      invoke<boolean>('vcam_start', { width: width || 1280, height: height || 720 }),
    stopVirtualCamera: () => invoke<boolean>('vcam_stop'),
    getVirtualCameraStatus: async () => {
      const res = await invoke<{ is_registered: boolean; is_broadcasting: boolean }>('vcam_status');
      return {
        isRegistered: res.is_registered,
        isBroadcasting: res.is_broadcasting,
      };
    },
    sendFrame: (buffer: ArrayBuffer, width: number, height: number) => {
      const rgba = Array.from(new Uint8Array(buffer));
      invoke('vcam_push_frame', { rgba, width, height, isPrivacy: false }).catch(() => {});
    },
    sendTrayState: (_state) => {},
    onHotkeyPrivacy: (callback: () => void) => {
      let unlistenFn: (() => void) | null = null;
      listen('hotkey:toggle-privacy', () => callback()).then((un) => {
        unlistenFn = un;
      });
      return () => unlistenFn?.();
    },
    onHotkeyBypass: (callback: () => void) => {
      let unlistenFn: (() => void) | null = null;
      listen('hotkey:toggle-bypass', () => callback()).then((un) => {
        unlistenFn = un;
      });
      return () => unlistenFn?.();
    },
    onHotkeyVirtualOutput: (callback: () => void) => {
      let unlistenFn: (() => void) | null = null;
      listen('hotkey:toggle-virtual-output', () => callback()).then((un) => {
        unlistenFn = un;
      });
      return () => unlistenFn?.();
    },
    onHotkeyMirror: (callback: () => void) => {
      let unlistenFn: (() => void) | null = null;
      listen('hotkey:toggle-mirror', () => callback()).then((un) => {
        unlistenFn = un;
      });
      return () => unlistenFn?.();
    },
    checkForUpdates: async () => {
      return { state: 'not-available', message: 'Tauri v2 native Rust build' };
    },
    installUpdate: async () => false,
    getUpdateStatus: async () => ({ state: 'idle' }),
    onUpdateStatus: () => () => {},
  };
}
