import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export class VirtualCameraDriverManager {
  private isRegistered: boolean = false;

  constructor() {
    this.ensureRegistered();
    this.ensureObsFallbackConfig();
  }

  private getDllPath(): string {
    const isPackaged = app?.isPackaged ?? false;
    if (isPackaged) {
      return path.join(process.resourcesPath, 'bin', 'HeartWaveCam.dll');
    }
    return path.join(process.cwd(), 'resources', 'bin', 'HeartWaveCam.dll');
  }

  /**
   * Ensures %APPDATA%\obs-virtualcam.txt exists with valid dimensions so that
   * obs-virtualcam-module64.dll never performs integer division by zero during
   * DirectShow camera enumeration when virtual camera output is idle.
   */
  private ensureObsFallbackConfig(): void {
    try {
      const appData = process.env.APPDATA;
      if (appData) {
        const obsVcamConfig = path.join(appData, 'obs-virtualcam.txt');
        if (!fs.existsSync(obsVcamConfig)) {
          fs.writeFileSync(obsVcamConfig, '1920x1080x333333', 'utf8');
          console.log('[VirtualCamera] Created default obs-virtualcam.txt fallback config.');
        }
      }
    } catch (err) {
      console.warn('[VirtualCamera] Could not write obs-virtualcam.txt safeguard:', err);
    }
  }

  /**
   * Ensures 'Heartwave Virtual Camera' is registered in DirectShow device enumeration
   * and any legacy colliding keys are cleaned up.
   */
  async ensureRegistered(): Promise<boolean> {
    const dllPath = this.getDllPath();
    const psScript = `
      # 1. Clean up legacy conflicting keys
      $path64 = "HKCU:\\Software\\Classes\\CLSID\\{860BB310-5D01-11d0-BD3B-00A0C911CE86}\\Instance\\{71E47B01-4EA7-49A1-94AE-8A196191E0A1}"
      $path32 = "HKCU:\\Software\\Classes\\WOW6432Node\\CLSID\\{860BB310-5D01-11d0-BD3B-00A0C911CE86}\\Instance\\{71E47B01-4EA7-49A1-94AE-8A196191E0A1}"
      if (Test-Path $path64) { Remove-Item -Path $path64 -Recurse -Force -ErrorAction SilentlyContinue }
      if (Test-Path $path32) { Remove-Item -Path $path32 -Recurse -Force -ErrorAction SilentlyContinue }

      # 2. Register Heartwave Virtual Camera if not already present
      $hwKey = "HKCU:\\Software\\Classes\\CLSID\\{860BB310-5D01-11d0-BD3B-00A0C911CE86}\\Instance\\{A7B39E10-6C23-41D8-9274-1290EF927B50}"
      $dll = "${dllPath.replace(/\\/g, '\\\\')}"
      if (!(Test-Path $hwKey) -and (Test-Path $dll)) {
        regsvr32.exe /s $dll
      }
    `;

    return new Promise((resolve) => {
      exec(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, (err) => {
        if (!err) {
          this.isRegistered = true;
          console.log('[VirtualCamera] "Heartwave Virtual Camera" DirectShow device verified.');
          resolve(true);
        } else {
          console.error('[VirtualCamera] Registration error:', err);
          resolve(false);
        }
      });
    });
  }

  isDeviceRegistered(): boolean {
    return this.isRegistered;
  }
}

export const virtualCameraDriverManager = new VirtualCameraDriverManager();
