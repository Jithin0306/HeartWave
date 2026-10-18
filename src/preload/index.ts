import { contextBridge, ipcRenderer } from 'electron';

export interface AppInfo {
  version: string;
  name: string;
  platform: string;
  arch: string;
}

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  percent?: number;
  message?: string;
}

export interface HeartwaveApi {
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<boolean>;
  isWindowMaximized: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  quitApp: () => Promise<void>;
  getAppInfo: () => Promise<AppInfo>;
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
  startVirtualCamera: (width?: number, height?: number, fps?: number) => Promise<boolean>;
  stopVirtualCamera: () => Promise<boolean>;
  getVirtualCameraStatus: () => Promise<{ isRegistered: boolean; isBroadcasting: boolean }>;
  sendFrame: (buffer: ArrayBuffer | Uint8Array | Uint8ClampedArray, width: number, height: number, isPrivacy?: boolean) => Promise<any> | void | boolean;
  sendTrayState: (state: { isPrivacy: boolean; isBypass: boolean; isVirtualOutput: boolean }) => void;
  onHotkeyPrivacy: (callback: () => void) => () => void;
  onHotkeyBypass: (callback: () => void) => () => void;
  onHotkeyVirtualOutput: (callback: () => void) => () => void;
  onHotkeyMirror: (callback: () => void) => () => void;
  checkForUpdates: () => Promise<UpdateStatus>;
  installUpdate: () => Promise<boolean>;
  getUpdateStatus: () => Promise<UpdateStatus>;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void;
}

const api: HeartwaveApi = {
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  quitApp: () => ipcRenderer.invoke('app:quit'),
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, isMaximized: boolean) => {
      callback(isMaximized);
    };
    ipcRenderer.on('window:maximized-change', listener);
    return () => {
      ipcRenderer.removeListener('window:maximized-change', listener);
    };
  },
  startVirtualCamera: (width?: number, height?: number, fps?: number) =>
    ipcRenderer.invoke('vcam:start', width, height, fps),
  stopVirtualCamera: () => ipcRenderer.invoke('vcam:stop'),
  getVirtualCameraStatus: () => ipcRenderer.invoke('vcam:status'),
  sendFrame: (buffer: any, width: number, height: number, isPrivacy?: boolean) =>
    ipcRenderer.send('vcam:frame', buffer, width, height, isPrivacy),
  sendTrayState: (state) => ipcRenderer.send('tray:state-update', state),
  onHotkeyPrivacy: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('hotkey:toggle-privacy', listener);
    return () => ipcRenderer.removeListener('hotkey:toggle-privacy', listener);
  },
  onHotkeyBypass: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('hotkey:toggle-bypass', listener);
    return () => ipcRenderer.removeListener('hotkey:toggle-bypass', listener);
  },
  onHotkeyVirtualOutput: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('hotkey:toggle-virtual-output', listener);
    return () => ipcRenderer.removeListener('hotkey:toggle-virtual-output', listener);
  },
  onHotkeyMirror: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('hotkey:toggle-mirror', listener);
    return () => ipcRenderer.removeListener('hotkey:toggle-mirror', listener);
  },
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  getUpdateStatus: () => ipcRenderer.invoke('updater:getStatus'),
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: UpdateStatus) => {
      callback(status);
    };
    ipcRenderer.on('updater:status', listener);
    return () => ipcRenderer.removeListener('updater:status', listener);
  },
};

contextBridge.exposeInMainWorld('heartwaveApi', api);
