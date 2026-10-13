import React, { useEffect, useState } from 'react';
import {
  X,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { mobileCamService, MobileCamTelemetry } from '../../services/mobileCamService';

export const MobileCamModal: React.FC = () => {
  const { isMobileCamModalOpen, setIsMobileCamModalOpen, attachMobileStream, detachMobileStream, isMobileConnected } =
    useAppStore();

  const [telemetry, setTelemetry] = useState<MobileCamTelemetry>(mobileCamService.getTelemetry());
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

  const handleCopyLink = () => {
    if (!telemetry.portalUrl) return;
    navigator.clipboard.writeText(telemetry.portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
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
          width: '640px',
          maxHeight: '90vh',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--hw-radius-sm)',
                backgroundColor: 'rgba(232, 44, 85, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--hw-accent-rose)',
              }}
            >
              <Smartphone size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                Wireless Phone as Webcam
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)' }}>
                No mobile app needed • Instant QR connection via Safari or Chrome
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

        {/* Content Body */}
        <div style={{ padding: '24px 20px', display: 'flex', gap: '24px', alignItems: 'center' }}>
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
                boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(232, 44, 85, 0.25)',
                position: 'relative',
              }}
            >
              {telemetry.qrDataUrl ? (
                <img
                  src={telemetry.qrDataUrl}
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

            {/* Status Beacon Chip */}
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
                ? `Connected: ${telemetry.deviceName || 'Phone'}`
                : telemetry.state === 'error'
                ? 'Signaling notice'
                : 'Waiting for phone scan...'}
            </div>
          </div>

          {/* Step-by-Step Instructions & Action Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--hw-text-primary)', marginBottom: '4px' }}>
                How to Connect (3 Seconds):
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)', lineHeight: 1.4 }}>
                Turn any modern smartphone (iPhone or Android) into an ultra-sharp webcam running through HeartWave's gesture engine.
              </p>
            </div>

            {/* Instruction Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                  <strong style={{ color: 'var(--hw-text-primary)' }}>Scan the QR Code</strong> with your phone's camera app.
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
                  <strong style={{ color: 'var(--hw-text-primary)' }}>Tap the link</strong> to open Safari or Chrome. <span style={{ color: 'var(--hw-accent-champagne)' }}>Zero downloads required.</span>
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
                  <strong style={{ color: 'var(--hw-text-primary)' }}>Tap "Connect Camera"</strong>. Your phone streams 1080p video directly into HeartWave!
                </div>
              </div>
            </div>

            {/* Direct Link Copy Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--hw-radius-sm)',
                backgroundColor: 'var(--hw-bg-primary)',
                border: '1px solid var(--hw-border-subtle)',
              }}
            >
              <input
                type="text"
                readOnly
                value={telemetry.portalUrl || 'https://jithin0306.github.io/HeartWave/cam/'}
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
            <Shield size={13} color="var(--hw-accent-rose)" />
            <span>P2P WebRTC Encrypted • Hardware H.264 Acceleration</span>
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
                backgroundColor: 'var(--hw-accent-rose)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isMobileConnected ? 'Use Phone Camera' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
