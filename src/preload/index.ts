import { contextBridge, ipcRenderer } from 'electron';

export interface AppInfo {
  version: string;
  name: string;
  platform: string;
  arch: string;
}

export interface HeartwaveApi {
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<boolean>;
  isWindowMaximized: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  getAppInfo: () => Promise<AppInfo>;
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
}

const api: HeartwaveApi = {
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  isWindowMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
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
};

contextBridge.exposeInMainWorld('heartwaveApi', api);
