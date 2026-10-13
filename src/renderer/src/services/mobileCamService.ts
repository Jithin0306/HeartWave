import Peer, { MediaConnection, DataConnection } from 'peerjs';
import QRCode from 'qrcode';

export type MobileConnectionState = 'idle' | 'waiting' | 'connected' | 'error';
export type MobileConnectionMode = 'wifi' | 'usb';

export const PEER_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
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
  private currentDataConn: DataConnection | null = null;
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
  private pingTimer: any = null;

  constructor() {
    this.initRoomId();
  }

  private initRoomId() {
    let saved = '';
    try {
      saved = localStorage.getItem('hw_mobile_room_id') || '';
    } catch {}

    if (saved && saved.startsWith('hw-cam-')) {
      this.roomId = saved;
    } else {
      this.generateNewRoomId();
    }
    this.updatePortalUrls();
  }

  public generateNewRoomId() {
    const chars = '23456789abcdefghjkmnpqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.roomId = `hw-cam-${code}`;
    try {
      localStorage.setItem('hw_mobile_room_id', this.roomId);
    } catch {}
    this.updatePortalUrls();
  }

  private updatePortalUrls() {
    this.wifiPortalUrl = `https://jithin0306.github.io/HeartWave/cam/?room=${this.roomId}&mode=wifi`;
    this.usbPortalUrl = `https://jithin0306.github.io/HeartWave/cam/?room=${this.roomId}&mode=usb`;
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

  private startKeepAlive() {
    this.stopKeepAlive();
    this.pingTimer = setInterval(() => {
      if (this.peer && this.peer.open && !this.peer.destroyed) {
        try {
          const socket = (this.peer as any).socket;
          if (socket && socket._ws && socket._ws.readyState === 1) {
            socket._ws.send(JSON.stringify({ type: 'HEARTBEAT' }));
          }
        } catch {}
      }
    }, 7500);
  }

  private stopKeepAlive() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Start waiting for mobile phone connection
   */
  public async startServer(): Promise<void> {
    if (this.peer && this.peer.open && !this.peer.destroyed) {
      this.state = this.activeStream ? 'connected' : 'waiting';
      this.notify();
      return;
    }

    if (!this.roomId) {
      this.initRoomId();
    }
    this.state = 'waiting';
    this.errorMessage = '';
    this.notify();

    // Generate high-resolution QR Codes
    try {
      const qrOpts: QRCode.QRCodeToDataURLOptions = {
        width: 360,
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

    // Clean up previous dead peer if any
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }

    // Initialize Desktop Peer
    try {
      this.peer = new Peer(this.roomId, {
        debug: 1,
        config: {
          iceServers: PEER_ICE_SERVERS,
          iceCandidatePoolSize: 2,
        },
      });

      this.peer.on('open', (id) => {
        console.log('[MobileCam] Desktop Peer waiting in room:', id);
        this.state = 'waiting';
        this.startKeepAlive();
        this.notify();
      });

      // 1. Dual-Channel: Fast Data Connection listener from mobile
      this.peer.on('connection', (conn: DataConnection) => {
        console.log('[MobileCam] Data connection initiated by phone:', conn.peer);
        if (this.currentDataConn && this.currentDataConn !== conn) {
          try {
            this.currentDataConn.close();
          } catch {}
        }
        this.currentDataConn = conn;

        conn.on('open', () => {
          console.log('[MobileCam] Data channel open with phone');
          try {
            conn.send({ type: 'HANDSHAKE_ACK', timestamp: Date.now() });
          } catch {}
          this.state = 'connected';
          this.notify();
        });

        conn.on('data', (data: any) => {
          console.log('[MobileCam] Received data from phone:', data);
          if (data && typeof data === 'object') {
            if (data.device) this.deviceName = data.device;
            if (data.resolution) this.resolution = data.resolution;
            if (data.mode === 'usb') this.activeMode = 'usb';
            this.state = 'connected';
            this.notify();
          }
        });

        conn.on('close', () => {
          console.log('[MobileCam] Data channel closed by phone');
        });
      });

      // 2. Media Call listener from mobile
      this.peer.on('call', (call: MediaConnection) => {
        console.log('[MobileCam] Incoming call from mobile device:', call.metadata);
        
        if (this.currentCall && this.currentCall !== call) {
          try {
            this.currentCall.close();
          } catch {}
        }
        this.currentCall = call;

        if (call.metadata) {
          this.deviceName = call.metadata.device || 'Mobile Camera';
          this.resolution = call.metadata.resolution || '1080p';
          if (call.metadata.mode === 'usb') {
            this.activeMode = 'usb';
          }
        } else {
          this.deviceName = 'Wireless Phone';
        }

        // Answer incoming media call immediately
        call.answer();

        // High-level PeerJS stream event
        call.on('stream', (remoteStream: MediaStream) => {
          if (remoteStream && remoteStream.getVideoTracks().length > 0) {
            console.log('[MobileCam] Mobile stream attached via call.on("stream"):', remoteStream.id);
            this.activeStream = remoteStream;
            this.state = 'connected';
            this.notify();

            if (this.currentDataConn && this.currentDataConn.open) {
              try {
                this.currentDataConn.send({ type: 'STREAM_RECEIVED' });
              } catch {}
            }
          }
        });

        // Direct WebRTC ontrack fallback
        if (call.peerConnection) {
          const pc = call.peerConnection;

          pc.ontrack = (event) => {
            console.log('[MobileCam] Direct ontrack event received:', event.track.kind);
            const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
            this.activeStream = stream;
            this.state = 'connected';
            this.notify();

            if (this.currentDataConn && this.currentDataConn.open) {
              try {
                this.currentDataConn.send({ type: 'STREAM_RECEIVED' });
              } catch {}
            }
          };

          pc.onconnectionstatechange = () => {
            console.log('[MobileCam] PeerConnection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
              this.state = 'connected';
              this.notify();
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
              setTimeout(() => {
                if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                  this.handleDisconnect();
                }
              }, 3000);
            }
          };

          pc.oniceconnectionstatechange = () => {
            console.log('[MobileCam] ICE state:', pc.iceConnectionState);
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
              this.state = 'connected';
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
                      this.connectionType = 'High-Speed Stream';
                    }
                    this.notify();
                  }
                });
              }).catch(() => {});
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
        if (err.type === 'unavailable-id') {
          console.log('[MobileCam] Room ID in use or socket lingering, retrying with same stable room ID in 1.5s...');
          setTimeout(() => {
            this.startServer();
          }, 1500);
          return;
        }
        if (err.type !== 'network') {
          this.state = 'error';
          this.errorMessage = err?.message || 'Signaling error';
          this.notify();
        }
      });

      this.peer.on('disconnected', () => {
        console.log('[MobileCam] Peer signaling disconnected, reconnecting...');
        if (this.peer && !this.peer.destroyed) {
          try {
            this.peer.reconnect();
          } catch {}
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
    this.stopKeepAlive();
    if (this.currentDataConn) {
      try {
        this.currentDataConn.close();
      } catch {}
      this.currentDataConn = null;
    }
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
