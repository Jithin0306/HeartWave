import { autoUpdater } from 'electron-updater';
import { BrowserWindow, ipcMain, app } from 'electron';

export type UpdateState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateStatus {
  state: UpdateState;
  version?: string;
  percent?: number;
  message?: string;
}

let currentStatus: UpdateStatus = { state: 'idle' };
let mainWindowRef: BrowserWindow | null = null;

function broadcastStatus(status: UpdateStatus): void {
  currentStatus = status;
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('updater:status', currentStatus);
  }
}

export function initAutoUpdater(window: BrowserWindow): void {
  mainWindowRef = window;

  // Configure autoUpdater
  autoUpdater.logger = console;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for updates...');
    broadcastStatus({ state: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version);
    broadcastStatus({
      state: 'available',
      version: info.version,
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[Updater] Update not available. Current version is latest:', info.version);
    broadcastStatus({
      state: 'not-available',
      version: info.version,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[Updater] Download progress: ${progress.percent.toFixed(1)}%`);
    broadcastStatus({
      state: 'downloading',
      percent: Math.round(progress.percent),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded:', info.version);
    broadcastStatus({
      state: 'downloaded',
      version: info.version,
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error checking/downloading update:', err);
    broadcastStatus({
      state: 'error',
      message: err?.message || 'Update check failed',
    });
  });

  // Handle IPC calls from renderer
  ipcMain.handle('updater:check', async () => {
    if (!app.isPackaged) {
      return {
        state: 'not-available',
        message: 'Auto-updates are only active in packaged builds.',
      };
    }
    try {
      broadcastStatus({ state: 'checking' });
      await autoUpdater.checkForUpdates();
      return currentStatus;
    } catch (err: any) {
      broadcastStatus({
        state: 'error',
        message: err?.message || 'Check failed',
      });
      return currentStatus;
    }
  });

  ipcMain.handle('updater:install', () => {
    if (currentStatus.state === 'downloaded') {
      autoUpdater.quitAndInstall();
      return true;
    }
    return false;
  });

  ipcMain.handle('updater:getStatus', () => {
    return currentStatus;
  });

  // Check on launch after 5 seconds if packaged
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.warn('[Updater] Initial update check error:', err.message);
      });
    }, 5000);
  }
}
