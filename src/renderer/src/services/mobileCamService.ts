import Peer, { MediaConnection, DataConnection } from 'peerjs';
import QRCode from 'qrcode';

export type MobileConnectionState = 'idle' | 'waiting' | 'connected' | 'error';
export type MobileConnectionMode = 'wifi' | 'usb';

export const PEER_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  {
    urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'],
    username: 'peerjs',
    credential: 'peerjsp',
  },
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
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  isTorchOn?: boolean;
  isTorchSupported?: boolean;
  facingMode?: 'user' | 'environment';
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
  private resolution: string = '1080p';
  private zoom: number = 1.0;
  private minZoom: number = 1.0;
  private maxZoom: number = 5.0;
  private isTorchOn: boolean = false;
  private isTorchSupported: boolean = false;
  private facingMode: 'user' | 'environment' = 'environment';
  private isDirect: boolean = false;
  private connectionType: string = 'Local Network';
  private errorMessage: string = '';
  private listeners = new Set<MobileCamListener>();
  private pingTimer: any = null;

  private onDisconnectCallback: (() => void) | null = null;

  constructor() {
    this.initRoomId();
  }

  public setOnDisconnect(cb: (() => void) | null) {
    this.onDisconnectCallback = cb;
  }

  private initRoomId() {
    let saved = '';
    try {
      saved = localStorage.getItem('hw_mobile_room_id') || '';
    } catch {}

    if (saved && saved.startsWith('hw-cam-') && saved !== 'hw-cam-main') {
      this.roomId = saved;
    } else {
      const chars = '23456789abcdefghjkmnpqrstuvwxyz';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      this.roomId = `hw-cam-${code}`;
      try {
        localStorage.setItem('hw_mobile_room_id', this.roomId);
      } catch {}
    }
    this.updatePortalUrls();
  }

  public async generateQrCodes(): Promise<void> {
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
  }

  public async generateNewRoomId(): Promise<void> {
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
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
    await this.generateQrCodes();
  }

  private updatePortalUrls() {
    this.wifiPortalUrl = `https://jithin0306.github.io/HeartWave/cam/?room=${this.roomId}&mode=wifi`;
    this.usbPortalUrl = `https://jithin0306.github.io/HeartWave/cam/?room=${this.roomId}&mode=usb`;
  }

  public setMode(mode: MobileConnectionMode) {
    this.activeMode = mode;
    this.notify();
  }

  public sendResolutionRequest(resolution: '720p' | '1080p'): void {
    this.resolution = resolution;
    if (this.currentDataConn && this.currentDataConn.open) {
      try {
        console.log('[MobileCam] Requesting mobile resolution change to:', resolution);
        this.currentDataConn.send({
          type: 'CHANGE_RESOLUTION',
          resolution,
        });
      } catch (err) {
        console.warn('Failed to send resolution request to phone:', err);
      }
    }
    this.notify();
  }

  public sendZoomRequest(zoom: number): void {
    this.zoom = zoom;
    if (this.currentDataConn && this.currentDataConn.open) {
      try {
        console.log('[MobileCam] Requesting mobile zoom:', zoom);
        this.currentDataConn.send({
          type: 'SET_ZOOM',
          zoom,
        });
      } catch (err) {
        console.warn('Failed to send zoom request to phone:', err);
      }
    }
    this.notify();
  }

  public sendTorchRequest(enabled: boolean): void {
    this.isTorchOn = enabled;
    if (this.currentDataConn && this.currentDataConn.open) {
      try {
        console.log('[MobileCam] Requesting mobile torch state:', enabled);
        this.currentDataConn.send({
          type: 'SET_TORCH',
          enabled,
        });
      } catch (err) {
        console.warn('Failed to send torch request to phone:', err);
      }
    }
    this.notify();
  }

  public sendLensRequest(lens: 'user' | 'environment'): void {
    this.facingMode = lens;
    if (this.currentDataConn && this.currentDataConn.open) {
      try {
        console.log('[MobileCam] Requesting mobile lens switch to:', lens);
        this.currentDataConn.send({
          type: 'SET_LENS',
          lens,
        });
      } catch (err) {
        console.warn('Failed to send lens request to phone:', err);
      }
    }
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
      zoom: this.zoom,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      isTorchOn: this.isTorchOn,
      isTorchSupported: this.isTorchSupported,
      facingMode: this.facingMode,
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
    if (this.peer && this.peer.open && !this.peer.destroyed && this.peer.id === this.roomId) {
      this.state = this.activeStream ? 'connected' : 'waiting';
      if (!this.wifiQrDataUrl || !this.usbQrDataUrl) {
        await this.generateQrCodes();
      }
      this.notify();
      return;
    }

    if (!this.roomId) {
      this.initRoomId();
    }
    this.state = 'waiting';
    this.errorMessage = '';

    await this.generateQrCodes();

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
        this.roomId = id;
        try {
          localStorage.setItem('hw_mobile_room_id', id);
        } catch {}
        this.updatePortalUrls();
        this.generateQrCodes();
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
          if (this.activeStream && this.activeStream.getVideoTracks().length > 0) {
            this.state = 'connected';
          }
          this.notify();
        });

        conn.on('data', (data: any) => {
          console.log('[MobileCam] Received data from phone:', data);
          if (data && typeof data === 'object') {
            if (data.device) this.deviceName = data.device;
            if (data.resolution) this.resolution = data.resolution;
            if (data.mode === 'usb') this.activeMode = 'usb';
            if (typeof data.zoom === 'number') this.zoom = data.zoom;
            if (typeof data.minZoom === 'number') this.minZoom = data.minZoom;
            if (typeof data.maxZoom === 'number') this.maxZoom = data.maxZoom;
            if (typeof data.isTorchOn === 'boolean') this.isTorchOn = data.isTorchOn;
            if (typeof data.isTorchSupported === 'boolean') this.isTorchSupported = data.isTorchSupported;
            if (data.facingMode === 'user' || data.facingMode === 'environment') this.facingMode = data.facingMode;
            if (this.activeStream && this.activeStream.getVideoTracks().length > 0) {
              this.state = 'connected';
            }
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
            if (!this.activeStream || this.activeStream.getVideoTracks().length === 0) {
              const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
              this.activeStream = stream;
              this.state = 'connected';
              this.notify();
            }

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
          console.log('[MobileCam] Room ID in use or colliding, generating fresh room code...');
          this.generateNewRoomId().then(() => {
            this.startServer();
          });
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
    if (this.onDisconnectCallback) {
      try {
        this.onDisconnectCallback();
      } catch {}
    }
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
