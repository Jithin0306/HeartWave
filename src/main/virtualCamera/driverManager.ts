import { exec } from 'child_process';
import path from 'path';

export class VirtualCameraDriverManager {
  private isRegistered: boolean = false;

  constructor() {
    this.ensureRegistered();
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
