import React, { useEffect, useRef } from 'react';
import {
  Camera,
  FlipHorizontal,
  Layers,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  VideoOff,
} from 'lucide-react';
import { useAppStore, RESOLUTION_PRESETS } from '../../store/appStore';
import { cameraManager } from '../../services/cameraManager';

export const CameraPreviewViewport: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    cameraStatus,
    availableDevices,
    selectedDeviceId,
    selectedResolution,
    activeStream,
    cameraMetrics,
    cameraError,
    isMirrored,
    fetchDevices,
    startCamera,
    stopCamera,
    selectDevice,
    selectResolution,
    toggleMirror,
    clearCameraError,
    virtualCameraStatus,
    toggleVirtualCamera,
  } = useAppStore();

  // Initialize hardware enumeration and device change listeners
  useEffect(() => {
    fetchDevices();

    const cleanupDeviceListener = cameraManager.onDeviceChange(() => {
      fetchDevices();
    });

    cameraManager.setOnDisconnect(() => {
      stopCamera();
    });

    return () => {
      cleanupDeviceListener();
      cameraManager.setOnDisconnect(null);
    };
  }, [fetchDevices, stopCamera]);

  // Bind active media stream to the HTMLVideoElement
  useEffect(() => {
    if (videoRef.current) {
      if (activeStream) {
        videoRef.current.srcObject = activeStream;
        videoRef.current.play().catch((err) => {
          console.warn('Auto-play was interrupted:', err);
        });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [activeStream]);

  const handleToggleCamera = () => {
    if (cameraStatus === 'active') {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const selectedDevice = availableDevices.find((d) => d.id === selectedDeviceId);

  return (
    <section
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--hw-bg-primary)',
        padding: '16px 20px',
        overflow: 'hidden',
        minWidth: '500px',
      }}
    >
      {/* Top Preview Header: Title & Device Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--hw-text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Camera Preview
          </h2>

          {/* Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              borderRadius: 'var(--hw-radius-full)',
              backgroundColor:
                cameraStatus === 'active'
                  ? 'rgba(78, 170, 121, 0.15)'
                  : cameraStatus === 'error'
                  ? 'rgba(208, 93, 93, 0.15)'
                  : 'var(--hw-surface-elevated)',
              border: `1px solid ${
                cameraStatus === 'active'
                  ? 'rgba(78, 170, 121, 0.4)'
                  : cameraStatus === 'error'
                  ? 'rgba(208, 93, 93, 0.4)'
                  : 'var(--hw-border-subtle)'
              }`,
              fontSize: '11px',
              color:
                cameraStatus === 'active'
                  ? 'var(--hw-status-active)'
                  : cameraStatus === 'error'
                  ? 'var(--hw-status-error)'
                  : 'var(--hw-text-muted)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor:
                  cameraStatus === 'active'
                    ? 'var(--hw-status-active)'
                    : cameraStatus === 'error'
                    ? 'var(--hw-status-error)'
                    : 'var(--hw-status-idle)',
              }}
            />
            {cameraStatus === 'active'
              ? 'Live Webcam Active'
              : cameraStatus === 'connecting'
              ? 'Connecting...'
              : cameraStatus === 'error'
              ? 'Hardware Notice'
              : 'Standby Mode'}
          </div>
        </div>

        {/* Real Device Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor: 'var(--hw-bg-secondary)',
              border: '1px solid var(--hw-border-subtle)',
              fontSize: '11px',
              color: 'var(--hw-text-secondary)',
              maxWidth: '280px',
            }}
          >
            <Camera size={13} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            <select
              value={selectedDeviceId}
              onChange={(e) => selectDevice(e.target.value)}
              disabled={availableDevices.length === 0}
              style={{
                cursor: 'pointer',
                color: 'var(--hw-text-primary)',
                background: 'transparent',
                width: '100%',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {availableDevices.length > 0 ? (
                availableDevices.map((d) => (
                  <option key={d.id} value={d.id} style={{ background: '#1D1918' }}>
                    {d.label}
                  </option>
                ))
              ) : (
                <option value="" style={{ background: '#1D1918' }}>
                  No Cameras Detected
                </option>
              )}
            </select>
            <ChevronDown size={11} strokeWidth={2} style={{ color: 'var(--hw-text-muted)', flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* 16:9 Aspect Ratio Viewport Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          backgroundColor: '#0A0909',
          borderRadius: 'var(--hw-radius-lg)',
          border: '1px solid var(--hw-border-subtle)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--hw-shadow-md)',
        }}
      >
        {/* Real HTML5 Video Element for Live Camera Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: cameraStatus === 'active' ? 'block' : 'none',
            transform: isMirrored ? 'scaleX(-1)' : 'none',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {/* Framing Reticle Corners */}
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            width: '18px',
            height: '18px',
            borderTop: '2px solid rgba(214, 189, 145, 0.4)',
            borderLeft: '2px solid rgba(214, 189, 145, 0.4)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '18px',
            height: '18px',
            borderTop: '2px solid rgba(214, 189, 145, 0.4)',
            borderRight: '2px solid rgba(214, 189, 145, 0.4)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '14px',
            left: '14px',
            width: '18px',
            height: '18px',
            borderBottom: '2px solid rgba(214, 189, 145, 0.4)',
            borderLeft: '2px solid rgba(214, 189, 145, 0.4)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '14px',
            right: '14px',
            width: '18px',
            height: '18px',
            borderBottom: '2px solid rgba(214, 189, 145, 0.4)',
            borderRight: '2px solid rgba(214, 189, 145, 0.4)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />

        {/* Top-left Viewport Badges */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '36px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 20,
          }}
        >
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--hw-radius-xs)',
              backgroundColor: 'rgba(29, 25, 24, 0.85)',
              border: '1px solid var(--hw-border-subtle)',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--hw-text-secondary)',
              letterSpacing: '0.04em',
            }}
          >
            16:9
          </span>

          {cameraMetrics && (
            <span
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--hw-radius-xs)',
                backgroundColor: 'rgba(29, 25, 24, 0.85)',
                border: '1px solid var(--hw-border-subtle)',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--hw-status-active)',
              }}
            >
              {cameraMetrics.actualWidth}×{cameraMetrics.actualHeight} @ {cameraMetrics.actualFps}fps
            </span>
          )}

          {isMirrored && (
            <span
              style={{
                padding: '3px 8px',
                borderRadius: 'var(--hw-radius-xs)',
                backgroundColor: 'rgba(103, 47, 64, 0.4)',
                border: '1px solid var(--hw-accent-burgundy)',
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--hw-accent-rose)',
              }}
            >
              MIRRORED
            </span>
          )}
        </div>

        {/* Top-right Resolution Selector Badge */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '36px',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: 'var(--hw-radius-sm)',
            backgroundColor: 'rgba(29, 25, 24, 0.85)',
            border: '1px solid var(--hw-border-subtle)',
            fontSize: '11px',
            color: 'var(--hw-text-secondary)',
          }}
        >
          <select
            value={selectedResolution.id}
            onChange={(e) => {
              const found = RESOLUTION_PRESETS.find((r) => r.id === e.target.value);
              if (found) selectResolution(found);
            }}
            style={{
              cursor: 'pointer',
              color: 'var(--hw-text-primary)',
              background: 'transparent',
            }}
          >
            {RESOLUTION_PRESETS.map((res) => (
              <option key={res.id} value={res.id} style={{ background: '#1D1918' }}>
                {res.label}
              </option>
            ))}
          </select>
        </div>

        {/* Center Overlay: Standby State */}
        {cameraStatus === 'standby' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '24px',
              maxWidth: '440px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--hw-surface-elevated)',
                border: '1px solid var(--hw-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: 'var(--hw-accent-rose)',
              }}
            >
              <Camera size={26} strokeWidth={1.6} />
            </div>

            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--hw-text-primary)',
                marginBottom: '6px',
              }}
            >
              Ready to Stream Video
            </h3>

            <p
              style={{
                fontSize: '12px',
                color: 'var(--hw-text-muted)',
                lineHeight: 1.6,
                marginBottom: '20px',
              }}
            >
              {availableDevices.length > 0
                ? `Selected: ${selectedDevice?.label || 'Default Camera'}. Click below to start live hardware capture.`
                : 'No webcams detected yet. Connect a camera or check Windows device permissions.'}
            </p>

            <button
              onClick={handleToggleCamera}
              style={{
                padding: '9px 24px',
                borderRadius: 'var(--hw-radius-md)',
                backgroundColor: 'var(--hw-accent-primary)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--hw-shadow-accent)',
                transition: 'all var(--hw-transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hw-accent-primary-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--hw-accent-primary)')}
            >
              <Camera size={14} strokeWidth={2} />
              Start Live Camera
            </button>
          </div>
        )}

        {/* Center Overlay: Connecting State */}
        {cameraStatus === 'connecting' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '2px solid var(--hw-border-subtle)',
                borderTopColor: 'var(--hw-accent-rose)',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--hw-text-primary)' }}>
              Acquiring camera hardware stream...
            </span>
          </div>
        )}

        {/* Center Overlay: Hardware Error State */}
        {cameraStatus === 'error' && cameraError && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '28px',
              maxWidth: '460px',
              backgroundColor: 'rgba(29, 25, 24, 0.95)',
              borderRadius: 'var(--hw-radius-lg)',
              border: '1px solid rgba(208, 93, 93, 0.4)',
              zIndex: 30,
              boxShadow: 'var(--hw-shadow-lg)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(208, 93, 93, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                color: 'var(--hw-status-error)',
              }}
            >
              <AlertTriangle size={24} strokeWidth={1.8} />
            </div>

            <h4
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--hw-text-primary)',
                marginBottom: '6px',
              }}
            >
              {cameraError.message}
            </h4>

            <p
              style={{
                fontSize: '11px',
                color: 'var(--hw-text-muted)',
                lineHeight: 1.5,
                marginBottom: '18px',
              }}
            >
              {cameraError.recoveryHint}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleToggleCamera}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--hw-radius-sm)',
                  backgroundColor: 'var(--hw-accent-primary)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={12} strokeWidth={2} />
                Retry Connection
              </button>

              <button
                onClick={clearCameraError}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--hw-radius-sm)',
                  backgroundColor: 'var(--hw-surface-elevated)',
                  border: '1px solid var(--hw-border-subtle)',
                  color: 'var(--hw-text-secondary)',
                  fontSize: '11px',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Camera Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: 'var(--hw-bg-secondary)',
          borderRadius: 'var(--hw-radius-md)',
          border: '1px solid var(--hw-border-subtle)',
        }}
      >
        {/* Left: Mirror Video Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleMirror}
            title="Mirror Camera Feed horizontally"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor: isMirrored ? 'var(--hw-surface-elevated)' : 'transparent',
              border: `1px solid ${isMirrored ? 'var(--hw-accent-burgundy)' : 'var(--hw-border-subtle)'}`,
              color: isMirrored ? 'var(--hw-accent-rose)' : 'var(--hw-text-secondary)',
              fontSize: '11px',
              transition: 'all var(--hw-transition-fast)',
            }}
          >
            <FlipHorizontal size={13} strokeWidth={1.8} />
            Mirror Feed
          </button>
        </div>

        {/* Center Primary Action: Start / Stop Camera */}
        <button
          onClick={handleToggleCamera}
          style={{
            padding: '7px 24px',
            borderRadius: 'var(--hw-radius-md)',
            backgroundColor:
              cameraStatus === 'active'
                ? 'var(--hw-surface-elevated)'
                : 'var(--hw-accent-primary)',
            color: cameraStatus === 'active' ? 'var(--hw-text-primary)' : '#FFFFFF',
            border:
              cameraStatus === 'active'
                ? '1px solid var(--hw-border-subtle)'
                : 'none',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: cameraStatus === 'active' ? 'none' : 'var(--hw-shadow-accent)',
            transition: 'all var(--hw-transition-fast)',
          }}
        >
          {cameraStatus === 'active' ? (
            <>
              <VideoOff size={14} strokeWidth={2} />
              Stop Camera
            </>
          ) : (
            <>
              <Camera size={14} strokeWidth={2} />
              Start Camera
            </>
          )}
        </button>

        {/* Right Toggle: Virtual Camera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleVirtualCamera}
            title="Send composited feed to Windows Virtual Camera device"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor:
                virtualCameraStatus === 'offline'
                  ? 'var(--hw-surface-subtle)'
                  : 'rgba(214, 189, 145, 0.15)',
              border: `1px solid ${
                virtualCameraStatus === 'offline'
                  ? 'var(--hw-border-subtle)'
                  : 'var(--hw-accent-champagne)'
              }`,
              color:
                virtualCameraStatus === 'offline'
                  ? 'var(--hw-text-muted)'
                  : 'var(--hw-accent-champagne)',
              fontSize: '11px',
              fontWeight: 500,
              transition: 'all var(--hw-transition-fast)',
            }}
          >
            <Layers size={13} strokeWidth={1.8} />
            Virtual Camera: {virtualCameraStatus === 'offline' ? 'Off' : 'Driver Standby (Phase 6)'}
          </button>
        </div>
      </div>
    </section>
  );
};
