import Peer, { MediaConnection } from 'peerjs';
import QRCode from 'qrcode';

export type MobileConnectionState = 'idle' | 'waiting' | 'connected' | 'error';

export interface MobileCamTelemetry {
  state: MobileConnectionState;
  roomId: string;
  qrDataUrl: string;
  portalUrl: string;
  deviceName?: string;
  resolution?: string;
  stream: MediaStream | null;
  errorMessage?: string;
}

type MobileCamListener = (telemetry: MobileCamTelemetry) => void;

class MobileCamService {
  private peer: Peer | null = null;
  private currentCall: MediaConnection | null = null;
  private activeStream: MediaStream | null = null;
  private roomId: string = '';
  private qrDataUrl: string = '';
  private portalUrl: string = '';
  private state: MobileConnectionState = 'idle';
  private deviceName: string = '';
  private resolution: string = '';
  private errorMessage: string = '';
  private listeners = new Set<MobileCamListener>();

  constructor() {
    this.generateRoomId();
  }

  private generateRoomId() {
    const chars = '23456789abcdefghjkmnpqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.roomId = `hw-cam-${code}`;
    this.portalUrl = `https://jithin0306.github.io/HeartWave/cam/#room=${this.roomId}`;
  }

  public getTelemetry(): MobileCamTelemetry {
    return {
      state: this.state,
      roomId: this.roomId,
      qrDataUrl: this.qrDataUrl,
      portalUrl: this.portalUrl,
      deviceName: this.deviceName,
      resolution: this.resolution,
      stream: this.activeStream,
      errorMessage: this.errorMessage,
    };
  }

  public subscribe(listener: MobileCamListener): () => void {
    this.listeners.add(listener);
    listener(this.getTelemetry());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const t = this.getTelemetry();
    this.listeners.forEach((fn) => {
      try {
        fn(t);
      } catch (err) {
        console.error(err);
      }
    });
  }

  /**
   * Start waiting for mobile phone connection
   */
  public async startServer(): Promise<void> {
    if (this.peer && this.peer.open) {
      this.notify();
      return;
    }

    this.generateRoomId();
    this.state = 'waiting';
    this.errorMessage = '';
    this.notify();

    // Generate QR Code
    try {
      this.qrDataUrl = await QRCode.toDataURL(this.portalUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: '#141211',
          light: '#FFFFFF',
        },
      });
      this.notify();
    } catch (err: any) {
      console.error('Failed to generate QR Code:', err);
    }

    // Initialize PeerJS on desktop
    try {
      this.peer = new Peer(this.roomId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });

      this.peer.on('open', (id) => {
        console.log('[MobileCam] Desktop Peer waiting in room:', id);
        this.state = 'waiting';
        this.notify();
      });

      this.peer.on('call', (call: MediaConnection) => {
        console.log('[MobileCam] Received call from mobile device:', call.metadata);
        this.currentCall = call;

        // Extract metadata if sent by mobile
        if (call.metadata) {
          this.deviceName = call.metadata.device || 'Mobile Phone';
          this.resolution = call.metadata.resolution || '1080p';
        } else {
          this.deviceName = 'Wireless Phone';
        }

        // Answer call (empty stream or standard answer)
        call.answer();

        call.on('stream', (remoteStream: MediaStream) => {
          console.log('[MobileCam] Mobile video stream established!', remoteStream);
          this.activeStream = remoteStream;
          this.state = 'connected';
          this.notify();
        });

        call.on('close', () => {
          console.log('[MobileCam] Mobile phone disconnected');
          this.handleDisconnect();
        });

        call.on('error', (err) => {
          console.warn('[MobileCam] Call error:', err);
          this.handleDisconnect();
        });
      });

      this.peer.on('error', (err: any) => {
        console.warn('[MobileCam] Peer error:', err);
        // If room ID conflict, generate a new one
        if (err.type === 'unavailable-id') {
          this.generateRoomId();
          this.startServer();
          return;
        }
        this.state = 'error';
        this.errorMessage = err?.message || 'Failed to connect signaling server';
        this.notify();
      });

      this.peer.on('disconnected', () => {
        this.peer?.reconnect();
      });
    } catch (err: any) {
      this.state = 'error';
      this.errorMessage = err?.message || 'Failed to initialize peer';
      this.notify();
    }
  }

  private handleDisconnect() {
    this.state = 'waiting';
    this.activeStream = null;
    this.currentCall = null;
    this.notify();
  }

  /**
   * Stop session and disconnect mobile phone
   */
  public stopSession(): void {
    if (this.currentCall) {
      try {
        this.currentCall.close();
      } catch {}
      this.currentCall = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
    if (this.activeStream) {
      this.activeStream.getTracks().forEach((t) => t.stop());
      this.activeStream = null;
    }
    this.state = 'idle';
    this.notify();
  }
}

export const mobileCamService = new MobileCamService();
