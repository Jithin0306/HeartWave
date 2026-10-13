import Peer, { MediaConnection } from 'peerjs';
import QRCode from 'qrcode';

export type MobileConnectionState = 'idle' | 'waiting' | 'connected' | 'error';
export type MobileConnectionMode = 'wifi' | 'usb';

export const PEER_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

export interface MobileCamTelemetry {
  state: MobileConnectionState;
  activeMode: MobileConnectionMode;
  roomId: string;
  wifiPortalUrl: string;
  usbPortalUrl: string;
  wifiQrDataUrl: string;
  usbQrDataUrl: string;
  portalUrl: string;
  qrDataUrl: string;
  deviceName?: string;
  resolution?: string;
  isDirect?: boolean;
  connectionType?: string;
  stream: MediaStream | null;
  errorMessage?: string;
}

type MobileCamListener = (telemetry: MobileCamTelemetry) => void;

class MobileCamService {
  private peer: Peer | null = null;
  private currentCall: MediaConnection | null = null;
  private activeStream: MediaStream | null = null;
  private roomId: string = '';
  private wifiPortalUrl: string = '';
  private usbPortalUrl: string = '';
  private wifiQrDataUrl: string = '';
  private usbQrDataUrl: string = '';
  private activeMode: MobileConnectionMode = 'wifi';
  private state: MobileConnectionState = 'idle';
  private deviceName: string = '';
  private resolution: string = '';
  private isDirect: boolean = false;
  private connectionType: string = 'Local Network';
  private errorMessage: string = '';
  private listeners = new Set<MobileCamListener>();

  constructor() {
    this.generateRoomId();
  }

  private generateRoomId() {
    // Generate clean alphanumeric 6-character room token
    const chars = '23456789abcdefghjkmnpqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.roomId = `hw-cam-${code}`;
    this.wifiPortalUrl = `https://jithin0306.github.io/HeartWave/cam/?mode=wifi#room=${this.roomId}`;
    this.usbPortalUrl = `https://jithin0306.github.io/HeartWave/cam/?mode=usb#room=${this.roomId}`;
  }

  public setMode(mode: MobileConnectionMode) {
    this.activeMode = mode;
    this.notify();
  }

  public getTelemetry(): MobileCamTelemetry {
    const isUsb = this.activeMode === 'usb';
    return {
      state: this.state,
      activeMode: this.activeMode,
      roomId: this.roomId,
      wifiPortalUrl: this.wifiPortalUrl,
      usbPortalUrl: this.usbPortalUrl,
      wifiQrDataUrl: this.wifiQrDataUrl,
      usbQrDataUrl: this.usbQrDataUrl,
      portalUrl: isUsb ? this.usbPortalUrl : this.wifiPortalUrl,
      qrDataUrl: isUsb ? this.usbQrDataUrl : this.wifiQrDataUrl,
      deviceName: this.deviceName,
      resolution: this.resolution,
      isDirect: this.isDirect,
      connectionType: this.connectionType,
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
    if (this.peer && this.peer.open && !this.peer.destroyed) {
      this.notify();
      return;
    }

    if (!this.roomId) {
      this.generateRoomId();
    }
    this.state = 'waiting';
    this.errorMessage = '';
    this.notify();

    // Generate high-resolution QR Codes for both Wi-Fi and USB
    try {
      const qrOpts: QRCode.QRCodeToDataURLOptions = {
        width: 340,
        margin: 1,
        color: {
          dark: '#141211',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      };

      const [wifiQr, usbQr] = await Promise.all([
        QRCode.toDataURL(this.wifiPortalUrl, qrOpts),
        QRCode.toDataURL(this.usbPortalUrl, qrOpts),
      ]);

      this.wifiQrDataUrl = wifiQr;
      this.usbQrDataUrl = usbQr;
      this.notify();
    } catch (err: any) {
      console.error('Failed to generate QR Codes:', err);
    }

    // Initialize Desktop Peer with comprehensive STUN + TURN relays
    try {
      this.peer = new Peer(this.roomId, {
        debug: 1,
        config: {
          iceServers: PEER_ICE_SERVERS,
          iceCandidatePoolSize: 10,
        },
      });

      this.peer.on('open', (id) => {
        console.log('[MobileCam] Desktop Peer waiting in room:', id);
        this.state = 'waiting';
        this.notify();
      });

      this.peer.on('call', (call: MediaConnection) => {
        console.log('[MobileCam] Incoming call from mobile device:', call.metadata);
        
        // Clean up previous call if any
        if (this.currentCall && this.currentCall !== call) {
          try {
            this.currentCall.close();
          } catch {}
        }
        this.currentCall = call;

        // Parse metadata sent by mobile client
        if (call.metadata) {
          this.deviceName = call.metadata.device || 'Mobile Camera';
          this.resolution = call.metadata.resolution || '1080p';
          if (call.metadata.mode === 'usb') {
            this.activeMode = 'usb';
          }
        } else {
          this.deviceName = 'Wireless Phone';
        }

        // Answer call with audio/video accept
        call.answer();

        call.on('stream', (remoteStream: MediaStream) => {
          console.log('[MobileCam] Mobile video stream established:', remoteStream.getTracks());
          this.activeStream = remoteStream;
          this.state = 'connected';
          this.notify();
        });

        // Inspect ICE connection to detect direct USB / LAN vs TURN relay
        if (call.peerConnection) {
          const pc = call.peerConnection;
          pc.oniceconnectionstatechange = () => {
            const iceState = pc.iceConnectionState;
            console.log('[MobileCam] ICE connection state:', iceState);
            if (iceState === 'connected' || iceState === 'completed') {
              this.state = 'connected';
              // Check stats to identify if connection is host/direct (USB/LAN) or relay
              pc.getStats().then((stats) => {
                stats.forEach((report) => {
                  if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    const localCand = stats.get(report.localCandidateId);
                    const remoteCand = stats.get(report.remoteCandidateId);
                    if (localCand?.candidateType === 'host' && remoteCand?.candidateType === 'host') {
                      this.isDirect = true;
                      this.connectionType = this.activeMode === 'usb' ? 'Direct USB Cable' : 'Direct Local Wi-Fi';
                    } else {
                      this.isDirect = false;
                      this.connectionType = 'Encrypted Relay';
                    }
                    this.notify();
                  }
                });
              }).catch(() => {});
            } else if (iceState === 'failed' || iceState === 'disconnected') {
              // Wait briefly before marking disconnected to allow transient recovery
              setTimeout(() => {
                if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                  this.handleDisconnect();
                }
              }, 2000);
            }
          };
        }

        call.on('close', () => {
          console.log('[MobileCam] Call closed by mobile client');
          this.handleDisconnect();
        });

        call.on('error', (err) => {
          console.warn('[MobileCam] Call error:', err);
          this.handleDisconnect();
        });
      });

      this.peer.on('error', (err: any) => {
        console.warn('[MobileCam] Peer error:', err);
        // If room ID conflict, generate new ID and restart
        if (err.type === 'unavailable-id') {
          this.generateRoomId();
          this.startServer();
          return;
        }
        // Do not immediately fail for temporary peer network errors
        if (err.type !== 'network') {
          this.state = 'error';
          this.errorMessage = err?.message || 'Failed to connect signaling server';
          this.notify();
        }
      });

      this.peer.on('disconnected', () => {
        console.log('[MobileCam] Desktop peer signaling disconnected, reconnecting...');
        if (this.peer && !this.peer.destroyed) {
          this.peer.reconnect();
        }
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
    this.isDirect = false;
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
    this.isDirect = false;
    this.notify();
  }
}

export const mobileCamService = new MobileCamService();
