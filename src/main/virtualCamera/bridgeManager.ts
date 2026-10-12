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

  private framesReceived: number = 0;
  private framesDropped: number = 0;
  private framesWritten: number = 0;
  private lastLogTime: number = 0;

  /**
   * Write raw RGBA frame buffer with HWFR packet framing to bridge process stdin.
   */
  pushFrame(data: Buffer, width?: number, height?: number): void {
    if (this.bridgeProcess && this.bridgeProcess.stdin && !this.bridgeProcess.stdin.destroyed) {
      this.framesReceived++;
      const now = Date.now();
      if (now - this.lastLogTime >= 1000) {
        console.log(`[Bridge Telemetry] Recv: ${this.framesReceived} fps, Written: ${this.framesWritten} fps, Dropped: ${this.framesDropped} fps, PipeBuffer: ${this.bridgeProcess.stdin.writableLength} bytes`);
        this.framesReceived = 0;
        this.framesDropped = 0;
        this.framesWritten = 0;
        this.lastLogTime = now;
      }

      try {
        // Backpressure safeguard: if pipe buffer exceeds 2 frames, drop to keep latency at 0ms
        if (this.bridgeProcess.stdin.writableLength > data.length * 2) {
          this.framesDropped++;
          return;
        }

        const w = width || 1280;
        const h = height || 720;

        // Write 12-byte framing header: HWFR (0x52465748), width, height
        const header = Buffer.allocUnsafe(12);
        header.writeUInt32LE(0x52465748, 0); // 'HWFR'
        header.writeUInt32LE(w, 4);
        header.writeUInt32LE(h, 8);

        this.bridgeProcess.stdin.write(header);
        this.bridgeProcess.stdin.write(data);
        this.framesWritten++;
      } catch (err) {
        this.framesDropped++;
        console.warn('[BridgeManager] Pipe write error:', err);
      }
    }
  }

  getStatus(): { isBroadcasting: boolean } {
    return { isBroadcasting: this.isBroadcasting };
  }
}

export const virtualCameraBridgeManager = new VirtualCameraBridgeManager();
