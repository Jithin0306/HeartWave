import React, { useEffect, useState } from 'react';
import {
  X,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  Shield,
  Wifi,
  Usb,
  Zap,
  BatteryCharging,
  Video,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import {
  mobileCamService,
  MobileCamTelemetry,
  MobileConnectionMode,
} from '../../services/mobileCamService';

export const MobileCamModal: React.FC = () => {
  const {
    isMobileCamModalOpen,
    setIsMobileCamModalOpen,
    attachMobileStream,
    detachMobileStream,
    isMobileConnected,
  } = useAppStore();

  const [telemetry, setTelemetry] = useState<MobileCamTelemetry>(mobileCamService.getTelemetry());
  const [activeTab, setActiveTab] = useState<MobileConnectionMode>('wifi');
  const [phoneOs, setPhoneOs] = useState<'android' | 'ios'>('android');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isMobileCamModalOpen) return;

    // Start peer server waiting for mobile connection
    mobileCamService.startServer();

    const unsub = mobileCamService.subscribe((data) => {
      setTelemetry(data);
      if (data.state === 'connected' && data.stream) {
        attachMobileStream(data.stream, data.deviceName || 'Wireless Phone');
      }
    });

    return () => {
      unsub();
    };
  }, [isMobileCamModalOpen, attachMobileStream]);

  if (!isMobileCamModalOpen) return null;

  const currentUrl = activeTab === 'usb' ? telemetry.usbPortalUrl : telemetry.wifiPortalUrl;
  const currentQr = activeTab === 'usb' ? telemetry.usbQrDataUrl : telemetry.wifiQrDataUrl;

  const handleCopyLink = () => {
    if (!currentUrl) return;
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabChange = (mode: MobileConnectionMode) => {
    setActiveTab(mode);
    mobileCamService.setMode(mode);
  };

  const handleDisconnect = () => {
    mobileCamService.stopSession();
    detachMobileStream();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={() => setIsMobileCamModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '680px',
          maxHeight: '92vh',
          backgroundColor: 'var(--hw-bg-secondary)',
          borderRadius: 'var(--hw-radius-lg)',
          border: '1px solid var(--hw-border-subtle)',
          boxShadow: 'var(--hw-shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--hw-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--hw-bg-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--hw-radius-sm)',
                backgroundColor:
                  activeTab === 'usb' ? 'rgba(10, 132, 255, 0.15)' : 'rgba(232, 44, 85, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeTab === 'usb' ? '#0A84FF' : 'var(--hw-accent-rose)',
                transition: 'all 0.2s ease',
              }}
            >
              <Smartphone size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                Use Mobile Phone as Webcam
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)' }}>
                Zero app installation • Fast Wireless (Wi-Fi) & Zero-Latency Wired (USB Cable)
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileCamModalOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--hw-text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--hw-radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            padding: '10px 20px 0',
            backgroundColor: 'var(--hw-bg-primary)',
            borderBottom: '1px solid var(--hw-border-subtle)',
            gap: '8px',
          }}
        >
          <button
            onClick={() => handleTabChange('wifi')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: activeTab === 'wifi' ? '2px solid var(--hw-accent-rose)' : '2px solid transparent',
              backgroundColor: activeTab === 'wifi' ? 'var(--hw-bg-secondary)' : 'transparent',
              color: activeTab === 'wifi' ? 'var(--hw-text-primary)' : 'var(--hw-text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Wifi size={15} color={activeTab === 'wifi' ? 'var(--hw-accent-rose)' : 'currentColor'} />
            <span>📶 Fast Wireless (Wi-Fi)</span>
          </button>

          <button
            onClick={() => handleTabChange('usb')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              borderBottom: activeTab === 'usb' ? '2px solid #0A84FF' : '2px solid transparent',
              backgroundColor: activeTab === 'usb' ? 'var(--hw-bg-secondary)' : 'transparent',
              color: activeTab === 'usb' ? 'var(--hw-text-primary)' : 'var(--hw-text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Usb size={15} color={activeTab === 'usb' ? '#0A84FF' : 'currentColor'} />
            <span>🔌 Ultra-Fast Wired (USB Cable)</span>
            <span
              style={{
                fontSize: '9px',
                padding: '1px 6px',
                borderRadius: '999px',
                backgroundColor: 'rgba(10, 132, 255, 0.2)',
                color: '#64D2FF',
                fontWeight: 700,
              }}
            >
              ZERO LAG
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', gap: '22px', alignItems: 'center' }}>
          {/* QR Code Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '210px',
                height: '210px',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--hw-radius-md)',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  activeTab === 'usb'
                    ? '0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(10, 132, 255, 0.25)'
                    : '0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(232, 44, 85, 0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              {currentQr ? (
                <img
                  src={currentQr}
                  alt="Scan with phone"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={24} className="spin" color="#141211" />
                  <span style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>Generating QR...</span>
                </div>
              )}
            </div>

            {/* Room Code Badge & Refresh */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                borderRadius: 'var(--hw-radius-sm)',
                backgroundColor: 'var(--hw-bg-primary)',
                border: '1px solid var(--hw-border-subtle)',
                fontSize: '11px',
              }}
            >
              <span style={{ color: 'var(--hw-text-muted)' }}>Room:</span>
              <span style={{ color: 'var(--hw-text-primary)', fontFamily: 'monospace', fontWeight: 700 }}>
                {telemetry.roomId || 'Connecting...'}
              </span>
              <button
                onClick={() => {
                  mobileCamService.generateNewRoomId();
                  mobileCamService.startServer();
                }}
                title="Generate new Room Code"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--hw-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                <RefreshCw size={12} />
              </button>
            </div>

            {/* Live Status Beacon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: 'var(--hw-radius-full)',
                backgroundColor:
                  telemetry.state === 'connected'
                    ? 'rgba(52, 199, 89, 0.15)'
                    : telemetry.state === 'error'
                    ? 'rgba(255, 69, 58, 0.15)'
                    : 'rgba(229, 168, 59, 0.15)',
                border: `1px solid ${
                  telemetry.state === 'connected'
                    ? '#34c759'
                    : telemetry.state === 'error'
                    ? '#ff453a'
                    : '#e5a83b'
                }`,
                fontSize: '11px',
                fontWeight: 600,
                color:
                  telemetry.state === 'connected'
                    ? '#34c759'
                    : telemetry.state === 'error'
                    ? '#ff453a'
                    : '#e5a83b',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor:
                    telemetry.state === 'connected'
                      ? '#34c759'
                      : telemetry.state === 'error'
                      ? '#ff453a'
                      : '#e5a83b',
                }}
              />
              {telemetry.state === 'connected'
                ? `Connected: ${telemetry.deviceName || 'Phone'} (${telemetry.connectionType || 'Live'})`
                : telemetry.state === 'error'
                ? 'Signaling notice'
                : 'Waiting for phone scan...'}
            </div>
          </div>

          {/* Right Column: Mode-Specific Guide */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {activeTab === 'wifi' ? (
              /* Wi-Fi Mode Instructions */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--hw-text-primary)', marginBottom: '4px' }}>
                    📶 Fast Wireless Setup:
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)', lineHeight: 1.4 }}>
                    Stream wirelessly using your phone's camera directly over your local network.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--hw-surface-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--hw-accent-rose)',
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--hw-text-secondary)', lineHeight: 1.4 }}>
                      Make sure your phone & PC are on the <strong style={{ color: 'var(--hw-text-primary)' }}>same Wi-Fi network</strong> (or phone connected to PC mobile hotspot).
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--hw-surface-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--hw-accent-rose)',
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--hw-text-secondary)', lineHeight: 1.4 }}>
                      <strong style={{ color: 'var(--hw-text-primary)' }}>Scan the QR code</strong> using your phone's default Camera app.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--hw-surface-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--hw-accent-rose)',
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--hw-text-secondary)', lineHeight: 1.4 }}>
                      Tap the Safari/Chrome prompt and hit <strong style={{ color: 'var(--hw-accent-champagne)' }}>"Connect Camera"</strong>.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* USB Wired Mode Instructions */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Pro Features Strip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(10, 132, 255, 0.1)',
                    border: '1px solid rgba(10, 132, 255, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64D2FF' }}>
                    <Zap size={13} color="#0A84FF" />
                    <span>&lt;2ms Latency</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64D2FF' }}>
                    <BatteryCharging size={13} color="#0A84FF" />
                    <span>Charges Phone</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64D2FF' }}>
                    <Shield size={13} color="#0A84FF" />
                    <span>No Wi-Fi Needed</span>
                  </div>
                </div>

                {/* Android vs iOS Toggle */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setPhoneOs('android')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: phoneOs === 'android' ? '#0A84FF' : 'var(--hw-border-subtle)',
                      backgroundColor: phoneOs === 'android' ? 'rgba(10, 132, 255, 0.2)' : 'transparent',
                      color: phoneOs === 'android' ? '#FFFFFF' : 'var(--hw-text-muted)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Android Phone
                  </button>
                  <button
                    onClick={() => setPhoneOs('ios')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: phoneOs === 'ios' ? '#0A84FF' : 'var(--hw-border-subtle)',
                      backgroundColor: phoneOs === 'ios' ? 'rgba(10, 132, 255, 0.2)' : 'transparent',
                      color: phoneOs === 'ios' ? '#FFFFFF' : 'var(--hw-text-muted)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    iPhone (Apple)
                  </button>
                </div>

                {/* Step by Step USB instructions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {phoneOs === 'android' ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: 'var(--hw-text-secondary)' }}>
                        <span style={{ fontWeight: 700, color: '#0A84FF' }}>1.</span>
                        <span>Plug phone into PC with USB charging cable.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: 'var(--hw-text-secondary)' }}>
                        <span style={{ fontWeight: 700, color: '#0A84FF' }}>2.</span>
                        <span>Open phone <strong>Settings &rarr; Connections (Network)</strong> &rarr; Enable <strong>USB Tethering</strong>.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: 'var(--hw-text-secondary)' }}>
                        <span style={{ fontWeight: 700, color: '#0A84FF' }}>3.</span>
                        <span>Scan the USB QR code or open the link below in Chrome. Instant wire speed!</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: 'var(--hw-text-secondary)' }}>
                        <span style={{ fontWeight: 700, color: '#0A84FF' }}>1.</span>
                        <span>Connect iPhone to PC with Lightning or USB-C cable.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: 'var(--hw-text-secondary)' }}>
                        <span style={{ fontWeight: 700, color: '#0A84FF' }}>2.</span>
                        <span>Open iPhone <strong>Settings &rarr; Personal Hotspot</strong> &rarr; Turn ON (select <strong>"USB Only"</strong>).</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', color: 'var(--hw-text-secondary)' }}>
                        <span style={{ fontWeight: 700, color: '#0A84FF' }}>3.</span>
                        <span>Scan the QR code with iPhone Camera & open in Safari. 0% lag!</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Direct Link Copy Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: 'var(--hw-radius-sm)',
                backgroundColor: 'var(--hw-bg-primary)',
                border: '1px solid var(--hw-border-subtle)',
              }}
            >
              <input
                type="text"
                readOnly
                value={currentUrl || ''}
                style={{
                  flex: 1,
                  fontSize: '11px',
                  color: 'var(--hw-text-muted)',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'monospace',
                }}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: 'var(--hw-radius-xs)',
                  backgroundColor: copied ? '#34c759' : 'var(--hw-surface-elevated)',
                  color: copied ? '#FFFFFF' : 'var(--hw-text-secondary)',
                  border: '1px solid var(--hw-border-subtle)',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--hw-transition-fast)',
                }}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--hw-border-subtle)',
            backgroundColor: 'var(--hw-bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--hw-text-muted)' }}>
            <Shield size={13} color={activeTab === 'usb' ? '#0A84FF' : 'var(--hw-accent-rose)'} />
            <span>Hardware H.264 WebRTC Stream • Zero Cloud Storage</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isMobileConnected && (
              <button
                onClick={handleDisconnect}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--hw-radius-sm)',
                  backgroundColor: 'rgba(255, 69, 58, 0.15)',
                  border: '1px solid #ff453a',
                  color: '#ff453a',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Disconnect Phone
              </button>
            )}

            <button
              onClick={() => setIsMobileCamModalOpen(false)}
              style={{
                padding: '6px 18px',
                borderRadius: 'var(--hw-radius-sm)',
                backgroundColor: activeTab === 'usb' ? '#0A84FF' : 'var(--hw-accent-rose)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isMobileConnected ? <Video size={13} /> : null}
              <span>{isMobileConnected ? 'Use Phone Camera' : 'Close'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
