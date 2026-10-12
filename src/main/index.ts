import { app, BrowserWindow, ipcMain, session, powerSaveBlocker, Tray, Menu, nativeImage, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { initAutoUpdater } from './updater';

// Configure Chromium to never throttle camera capture or video processing
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-media-suspend');
app.commandLine.appendSwitch('enable-features', 'BackgroundResourceFetch');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion,IntensiveWakeUpThrottling,ThrottleDisplayNoneAndVisibilityHiddenFrame');

// Prevent Windows 10/11 EcoQoS (Efficiency Mode) from downclocking Electron when minimized
try {
  os.setPriority(os.constants.priority.PRIORITY_ABOVE_NORMAL);
} catch {}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let currentTrayState = {
  isPrivacy: false,
  isBypass: false,
  isVirtualOutput: false,
};

function getIconPath(): string {
  if (app.isPackaged) {
    const resPath = path.join(process.resourcesPath, 'icon.png');
    if (fs.existsSync(resPath)) return resPath;
  }
  return path.join(__dirname, '../resources/icon.png');
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1060,
    minHeight: 680,
    backgroundColor: '#141211',
    frame: false,
    titleBarStyle: 'hidden',
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
    show: false,
  });

  mainWindow.webContents.setBackgroundThrottling(false);
  try {
    powerSaveBlocker.start('prevent-app-suspension');
  } catch {}

  initAutoUpdater(mainWindow);

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

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
      updateTrayMenu();
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

function updateTrayMenu(): void {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: mainWindow?.isVisible() ? 'Hide HeartWave Window' : 'Show HeartWave Window',
      click: () => {
        if (mainWindow?.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow?.show();
          mainWindow?.focus();
        }
        updateTrayMenu();
      },
    },
    { type: 'separator' },
    {
      label: 'Privacy Shutter (Ctrl+Shift+P)',
      type: 'checkbox',
      checked: currentTrayState.isPrivacy,
      click: () => {
        mainWindow?.webContents.send('hotkey:toggle-privacy');
      },
    },
    {
      label: 'Bypass Mode (Ctrl+Shift+B)',
      type: 'checkbox',
      checked: currentTrayState.isBypass,
      click: () => {
        mainWindow?.webContents.send('hotkey:toggle-bypass');
      },
    },
    {
      label: currentTrayState.isVirtualOutput
        ? 'Stop Virtual Output (Ctrl+Shift+V)'
        : 'Start Virtual Output (Ctrl+Shift+V)',
      click: () => {
        mainWindow?.webContents.send('hotkey:toggle-virtual-output');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit HeartWave',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function createTray(): void {
  const iconPath = getIconPath();
  let icon = nativeImage.createFromPath(iconPath);
  if (!icon.isEmpty()) {
    icon = icon.resize({ width: 16, height: 16 });
  }

  tray = new Tray(icon);
  tray.setToolTip('Heartwave - Gesture Virtual Camera');

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.focus();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
    updateTrayMenu();
  });

  tray.on('double-click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
    updateTrayMenu();
  });

  updateTrayMenu();
}

function registerGlobalShortcuts(): void {
  try {
    globalShortcut.register('CommandOrControl+Shift+P', () => {
      mainWindow?.webContents.send('hotkey:toggle-privacy');
    });

    globalShortcut.register('CommandOrControl+Shift+B', () => {
      mainWindow?.webContents.send('hotkey:toggle-bypass');
    });

    globalShortcut.register('CommandOrControl+Shift+V', () => {
      mainWindow?.webContents.send('hotkey:toggle-virtual-output');
    });

    globalShortcut.register('CommandOrControl+Shift+M', () => {
      mainWindow?.webContents.send('hotkey:toggle-mirror');
    });
  } catch (err) {
    console.warn('Failed to register global shortcuts:', err);
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
  if (!isQuitting) {
    mainWindow?.hide();
    updateTrayMenu();
  } else {
    mainWindow?.close();
  }
});

ipcMain.handle('app:quit', () => {
  isQuitting = true;
  app.quit();
});

ipcMain.on('tray:state-update', (_event, state) => {
  currentTrayState = state;
  updateTrayMenu();
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

ipcMain.on('vcam:frame', (_event, buffer: ArrayBuffer, width: number, height: number) => {
  virtualCameraBridgeManager.pushFrame(Buffer.from(buffer), width, height);
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
  createTray();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (isQuitting) {
      app.quit();
    }
  }
});
