import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1060,
    minHeight: 680,
    backgroundColor: '#141211',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Window state notification for custom titlebar
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-change', false);
  });

  // Forward console messages to terminal for instant debugging
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[Renderer Level ${level}] ${message} (${sourceId}:${line})`);
  });

  // Enable F12 toggle for DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow?.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // In development without built files, load dev server; otherwise load built dist/index.html
  const distHtmlPath = path.join(__dirname, '../dist/index.html');
  const isDev = process.env.NODE_ENV === 'development' || (!app.isPackaged && !fs.existsSync(distHtmlPath));

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(distHtmlPath);
  }
}

// Window control IPC handlers
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow?.maximize();
    return true;
  }
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

import { virtualCameraDriverManager } from './virtualCamera/driverManager';
import { virtualCameraBridgeManager } from './virtualCamera/bridgeManager';

ipcMain.handle('app:getInfo', () => {
  return {
    version: app.getVersion(),
    name: 'Heartwave',
    platform: process.platform,
    arch: process.arch,
  };
});

// Phase 6 Windows Virtual Camera IPC Handlers
ipcMain.handle('vcam:start', (_event, width?: number, height?: number, fps?: number) => {
  return virtualCameraBridgeManager.startBroadcasting(width || 1280, height || 720, fps || 30);
});

ipcMain.handle('vcam:stop', () => {
  virtualCameraBridgeManager.stopBroadcasting();
  return true;
});

ipcMain.handle('vcam:status', () => {
  return {
    isRegistered: virtualCameraDriverManager.isDeviceRegistered(),
    isBroadcasting: virtualCameraBridgeManager.getStatus().isBroadcasting,
  };
});

app.whenReady().then(() => {
  // Allow camera media permissions in the Electron shell
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'media') return true;
    return false;
  });

  session.defaultSession.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'camera') return true;
    return false;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
