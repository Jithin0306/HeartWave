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
    } catch {}
  });
}

let cachedSendPacket: Uint8Array | null = null;
let cachedDataView: DataView | null = null;

let isFrameInFlight = false;
let lastFlightStartTime = 0;
let flightToken = 0;

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
    sendFrame: async (buffer: ArrayBuffer | Uint8Array | Uint8ClampedArray, width: number, height: number, isPrivacy?: boolean): Promise<boolean> => {
      // In-flight backpressure: guarantee previous invoke finishes before new frame dispatches
      // Guard against hung invoke: if an invoke has taken >1000ms, allow recovery
      if (isFrameInFlight && (performance.now() - lastFlightStartTime < 1000)) return false;

      let u8: Uint8Array;
      if (buffer instanceof Uint8Array) {
        u8 = buffer;
      } else if (buffer instanceof ArrayBuffer) {
        u8 = new Uint8Array(buffer);
      } else {
        u8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      }

      // Pre-allocated static packet with 16-byte HWAV binary header to guarantee ZERO JSON serialization overhead
      const neededLen = 16 + u8.byteLength;
      if (!cachedSendPacket || cachedSendPacket.byteLength !== neededLen) {
        cachedSendPacket = new Uint8Array(neededLen);
        cachedDataView = new DataView(cachedSendPacket.buffer);
      }

      if (cachedDataView && cachedSendPacket) {
        // [0..4] 'HWAV' magic LE = 0x48574156
        cachedDataView.setUint32(0, 0x48574156, true);
        cachedDataView.setUint32(4, width, true);
        cachedDataView.setUint32(8, height, true);
        cachedSendPacket[12] = isPrivacy ? 1 : 0;
        cachedSendPacket[13] = 0;
        cachedSendPacket[14] = 0;
        cachedSendPacket[15] = 0;
        cachedSendPacket.set(u8, 16);

        isFrameInFlight = true;
        lastFlightStartTime = performance.now();
        const currentToken = ++flightToken;
        try {
          // Direct zero-copy Tauri 2.0 raw binary IPC (< 0.2ms)
          await invoke('vcam_push_frame_raw', cachedSendPacket);
          return true;
        } catch (err) {
          if (Math.random() < 0.01) {
            console.warn('[TauriBridge] vcam_push_frame_raw error:', err);
          }
          return false;
        } finally {
          if (currentToken === flightToken) {
            isFrameInFlight = false;
          }
        }
      }
      return false;
    },
    triggerEffect: async (effectId: string, x: number, y: number, confidence: number = 1.0) => {
      if (!effectId || effectId === 'none' || effectId === 'all') {
        await invoke<void>('engine_release_effect', { effectId: 'all' }).catch(() => {});
        return;
      }
      await invoke<void>('engine_trigger_effect', { effectId, x, y, confidence }).catch(() => {});
    },
    updateEffectAnchor: async (effectId: string, x: number, y: number) => {
      if (!effectId || effectId === 'none') return;
      await invoke<void>('engine_update_anchor', { effectId, x, y }).catch(() => {});
    },
    releaseEffect: async (effectId: string) => {
      await invoke<void>('engine_release_effect', { effectId: effectId || 'all' }).catch(() => {});
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
            let currentVer = '1.3.2';
            try {
              const info = await invoke<{ version: string }>('get_app_info');
              if (info?.version) currentVer = info.version;
            } catch {}
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
    relaunchApp: () => invoke<void>('relaunch_app'),
    downloadDirectInstaller: () => {
      const version = currentStatus.version || '1.3.14';
      window.open(
        `https://github.com/Jithin0306/HeartWave/releases/download/v${version}/HeartWave_${version}_x64-setup.exe`,
        '_blank'
      );
    },
    installUpdate: async () => {
      if (currentStatus.state === 'downloaded') {
        try {
          await invoke('relaunch_app');
          return true;
        } catch (e) {
          console.error('[Updater] relaunch_app failed:', e);
          window.open('https://github.com/Jithin0306/HeartWave/releases/latest', '_blank');
          return false;
        }
      }

      if (!currentUpdate) {
        const ver = currentStatus.version || '1.3.14';
        window.open(
          `https://github.com/Jithin0306/HeartWave/releases/download/v${ver}/HeartWave_${ver}_x64-setup.exe`,
          '_blank'
        );
        return false;
      }

      try {
        notifyStatus({ state: 'downloading', percent: 0, version: currentUpdate.version });
        let total = 0;
        let downloaded = 0;
        await currentUpdate.downloadAndInstall((event) => {
          if (event.event === 'Started') {
            total = event.data.contentLength || 0;
            notifyStatus({ state: 'downloading', percent: 5, version: currentUpdate?.version });
          } else if (event.event === 'Progress') {
            downloaded += event.data.chunkLength;
            const percent = total > 0 ? Math.min(99, Math.round((downloaded / total) * 100)) : 50;
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
              message: 'Update downloaded! Ready to restart.',
            });
          }
        });
        notifyStatus({
          state: 'downloaded',
          percent: 100,
          version: currentUpdate.version,
          message: 'Update downloaded! Click Restart & Install to apply.',
        });
        return true;
      } catch (err: any) {
        console.error('[Updater] downloadAndInstall failed:', err);
        notifyStatus({
          state: 'error',
          message: err?.message || 'Download & install failed. You can download the setup installer directly.',
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
