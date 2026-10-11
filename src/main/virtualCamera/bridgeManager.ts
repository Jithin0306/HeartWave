import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import { app } from 'electron';

export class VirtualCameraBridgeManager {
  private bridgeProcess: ChildProcess | null = null;
  private isBroadcasting: boolean = false;

  private getExecutablePath(): string {
    const isPackaged = app.isPackaged;
    if (isPackaged) {
      return path.join(process.resourcesPath, 'bin', 'HeartWaveBridge.exe');
    }
    return path.join(process.cwd(), 'resources', 'bin', 'HeartWaveBridge.exe');
  }

  /**
   * Start broadcasting frames to the Windows Virtual Camera DirectShow buffer.
   */
  startBroadcasting(width: number = 1280, height: number = 720, fps: number = 30): boolean {
    if (this.bridgeProcess && !this.bridgeProcess.killed) {
      this.isBroadcasting = true;
      return true;
    }

    const exePath = this.getExecutablePath();
    console.log(`[VirtualCamera] Launching native bridge: ${exePath}`);

    try {
      this.bridgeProcess = spawn(exePath, [width.toString(), height.toString(), fps.toString()], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.bridgeProcess.stdout?.on('data', (data) => {
        console.log(`[VirtualCamera Native] ${data.toString().trim()}`);
      });

      this.bridgeProcess.stderr?.on('data', (data) => {
        console.error(`[VirtualCamera Native Error] ${data.toString().trim()}`);
      });

      this.bridgeProcess.on('exit', (code) => {
        console.log(`[VirtualCamera] Native bridge process exited with code ${code}`);
        this.bridgeProcess = null;
        this.isBroadcasting = false;
      });

      this.isBroadcasting = true;
      return true;
    } catch (err) {
      console.error('[VirtualCamera] Failed to launch HeartWaveBridge.exe:', err);
      this.isBroadcasting = false;
      return false;
    }
  }

  /**
   * Stop broadcasting frames.
   */
  stopBroadcasting(): void {
    if (this.bridgeProcess) {
      console.log('[VirtualCamera] Stopping native bridge process...');
      this.bridgeProcess.kill();
      this.bridgeProcess = null;
    }
    this.isBroadcasting = false;
  }

  getStatus(): { isBroadcasting: boolean } {
    return { isBroadcasting: this.isBroadcasting };
  }
}

export const virtualCameraBridgeManager = new VirtualCameraBridgeManager();
