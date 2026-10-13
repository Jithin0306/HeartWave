import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { check, Update } from '@tauri-apps/plugin-updater';

let currentUpdate: Update | null = null;
let currentStatus: {
  state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  percent?: number;
  message?: string;
} = { state: 'idle' };

const updateListeners = new Set<(status: typeof currentStatus) => void>();

function notifyStatus(status: typeof currentStatus) {
  currentStatus = status;
  updateListeners.forEach((cb) => {
    try {
      cb(status);
    } catch (e) {
      console.error(e);
    }
  });
}

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
      notifyStatus({ state: 'checking' });
      try {
        const update = await check();
        if (update) {
          currentUpdate = update;
          const status = {
            state: 'available' as const,
            version: update.version,
            message: `New version v${update.version} available!`,
          };
          notifyStatus(status);
          return status;
        } else {
          currentUpdate = null;
          const status = {
            state: 'not-available' as const,
            message: 'You have the latest version installed.',
          };
          notifyStatus(status);
          return status;
        }
      } catch (err: any) {
        console.warn('[Updater] Tauri updater error, checking GitHub releases fallback:', err);
        // Fallback to GitHub releases API
        try {
          const res = await fetch('https://api.github.com/repos/Jithin0306/HeartWave/releases/latest');
          if (res.ok) {
            const data = await res.json();
            const latestTag = (data.tag_name || '').replace(/^v/, '');
            const currentVer = '1.0.1';
            if (latestTag && latestTag !== currentVer) {
              const status = {
                state: 'available' as const,
                version: latestTag,
                message: `Update v${latestTag} available on GitHub!`,
              };
              notifyStatus(status);
              return status;
            } else {
              const status = {
                state: 'not-available' as const,
                message: 'You have the latest version installed.',
              };
              notifyStatus(status);
              return status;
            }
          }
        } catch {}

        const status = {
          state: 'error' as const,
          message: err?.message || 'Unable to check for updates.',
        };
        notifyStatus(status);
        return status;
      }
    },
    installUpdate: async () => {
      if (!currentUpdate) {
        // Fallback: open release page
        window.open('https://github.com/Jithin0306/HeartWave/releases/latest', '_blank');
        return false;
      }
      try {
        notifyStatus({ state: 'downloading', percent: 0, version: currentUpdate.version });
        let total = 0;
        let downloaded = 0;
        await currentUpdate.downloadAndInstall((event) => {
          if (event.event === 'Started') {
            total = event.data.contentLength || 0;
          } else if (event.event === 'Progress') {
            downloaded += event.data.chunkLength;
            const percent = total > 0 ? Math.round((downloaded / total) * 100) : 50;
            notifyStatus({
              state: 'downloading',
              percent,
              version: currentUpdate?.version,
            });
          } else if (event.event === 'Finished') {
            notifyStatus({
              state: 'downloaded',
              percent: 100,
              version: currentUpdate?.version,
              message: 'Update downloaded! Restarting...',
            });
          }
        });
        notifyStatus({
          state: 'downloaded',
          percent: 100,
          version: currentUpdate.version,
          message: 'Update ready! Restarting...',
        });
        return true;
      } catch (err: any) {
        notifyStatus({
          state: 'error',
          message: err?.message || 'Download & install failed',
        });
        return false;
      }
    },
    getUpdateStatus: async () => currentStatus,
    onUpdateStatus: (callback: (status: any) => void) => {
      updateListeners.add(callback);
      callback(currentStatus);
      return () => {
        updateListeners.delete(callback);
      };
    },
  };

  // Background check on startup after 4 seconds
  setTimeout(() => {
    window.heartwaveApi?.checkForUpdates?.().catch(() => {});
  }, 4000);
}
