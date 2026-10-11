import { exec } from 'child_process';
import path from 'path';

export class VirtualCameraDriverManager {
  private isRegistered: boolean = false;

  constructor() {
    this.ensureRegistered();
  }

  /**
   * Ensures 'Heartwave Virtual Camera' is registered in DirectShow device enumeration (HKCU).
   */
  async ensureRegistered(): Promise<boolean> {
    const psScript = `
      $filterData = (Get-ItemProperty "HKLM:\\SOFTWARE\\Classes\\CLSID\\{860BB310-5D01-11d0-BD3B-00A0C911CE86}\\Instance\\{A3FCE0F5-3493-419F-958A-ABA1250EC20B}" -ErrorAction SilentlyContinue).FilterData
      if (!$filterData) {
        $filterData = [byte[]]@(2,0,0,0,0,0,32,0,1,0,0,0,0,0,0,0,48,112,105,51,8,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,48,116,121,51,0,0,0,0,56,0,0,0,72,0,0,0,118,105,100,115,0,0,16,0,128,0,0,170,0,56,155,113,78,86,49,50,0,0,16,0,128,0,0,170,0,56,155,113)
      }

      # Register 64-bit DirectShow Filter Instance
      $path64 = "HKCU:\\Software\\Classes\\CLSID\\{860BB310-5D01-11d0-BD3B-00A0C911CE86}\\Instance\\{71E47B01-4EA7-49A1-94AE-8A196191E0A1}"
      New-Item -Path $path64 -Force | Out-Null
      Set-ItemProperty -Path $path64 -Name "FriendlyName" -Value "Heartwave Virtual Camera"
      Set-ItemProperty -Path $path64 -Name "CLSID" -Value "{A3FCE0F5-3493-419F-958A-ABA1250EC20B}"
      Set-ItemProperty -Path $path64 -Name "FilterData" -Value $filterData -Type Binary

      # Register 32-bit DirectShow Filter Instance
      $path32 = "HKCU:\\Software\\Classes\\WOW6432Node\\CLSID\\{860BB310-5D01-11d0-BD3B-00A0C911CE86}\\Instance\\{71E47B01-4EA7-49A1-94AE-8A196191E0A1}"
      New-Item -Path $path32 -Force | Out-Null
      Set-ItemProperty -Path $path32 -Name "FriendlyName" -Value "Heartwave Virtual Camera"
      Set-ItemProperty -Path $path32 -Name "CLSID" -Value "{A3FCE0F5-3493-419F-958A-ABA1250EC20B}"
      Set-ItemProperty -Path $path32 -Name "FilterData" -Value $filterData -Type Binary
    `;

    return new Promise((resolve) => {
      exec(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, (err) => {
        if (!err) {
          this.isRegistered = true;
          console.log('[VirtualCamera] "Heartwave Virtual Camera" registered in DirectShow category.');
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
