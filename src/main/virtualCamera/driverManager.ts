import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export class VirtualCameraDriverManager {
  private isRegistered: boolean = false;

  constructor() {
    this.ensureRegistered();
    this.ensureObsFallbackConfig();
  }

  /**
   * Ensures %APPDATA%\\obs-virtualcam.txt exists with valid dimensions so that
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
   * Ensures rogue/conflicting DirectShow registry keys are completely removed
   * so OBS and third-party apps never experience COM/DirectShow enum crashes.
   */
  async ensureRegistered(): Promise<boolean> {
    const psScript = `
      $path64 = "HKCU:\\Software\\Classes\\CLSID\\{860BB310-5D01-11d0-BD3B-00A0C911CE86}\\Instance\\{71E47B01-4EA7-49A1-94AE-8A196191E0A1}"
      $path32 = "HKCU:\\Software\\Classes\\WOW6432Node\\CLSID\\{860BB310-5D01-11d0-BD3B-00A0C911CE86}\\Instance\\{71E47B01-4EA7-49A1-94AE-8A196191E0A1}"
      if (Test-Path $path64) { Remove-Item -Path $path64 -Recurse -Force -ErrorAction SilentlyContinue }
      if (Test-Path $path32) { Remove-Item -Path $path32 -Recurse -Force -ErrorAction SilentlyContinue }
    `;

    return new Promise((resolve) => {
      exec(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, (err) => {
        if (!err) {
          this.isRegistered = false;
          console.log('[VirtualCamera] Cleaned up legacy DirectShow registry keys to ensure OBS stability.');
          resolve(true);
        } else {
          console.error('[VirtualCamera] Cleanup error:', err);
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
