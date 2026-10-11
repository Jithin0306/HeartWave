import React from 'react';
import {
  Camera,
  FlipHorizontal,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useAppStore, RESOLUTION_PRESETS, MOCK_DEVICES } from '../../store/appStore';

export const CameraPreviewViewport: React.FC = () => {
  const {
    cameraStatus,
    setCameraStatus,
    selectedDeviceId,
    setSelectedDeviceId,
    selectedResolution,
    setSelectedResolution,
    isMirrored,
    toggleMirror,
    virtualCameraStatus,
    toggleVirtualCamera,
  } = useAppStore();

  const handleToggleCamera = () => {
    // In Phase 1, toggling illustrates the interface state transition
    if (cameraStatus === 'standby') {
      setCameraStatus('connecting');
      setTimeout(() => {
        setCameraStatus('active');
      }, 400);
    } else {
      setCameraStatus('standby');
    }
  };

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
                  : 'var(--hw-surface-elevated)',
              border: `1px solid ${
                cameraStatus === 'active'
                  ? 'rgba(78, 170, 121, 0.4)'
                  : 'var(--hw-border-subtle)'
              }`,
              fontSize: '11px',
              color:
                cameraStatus === 'active'
                  ? 'var(--hw-status-active)'
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
                    : 'var(--hw-status-idle)',
              }}
            />
            {cameraStatus === 'active' ? 'Preview Active' : 'Standby Mode'}
          </div>
        </div>

        {/* Device Picker Selector */}
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
            }}
          >
            <Camera size={13} strokeWidth={1.8} />
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              style={{
                cursor: 'pointer',
                color: 'var(--hw-text-primary)',
                background: 'transparent',
              }}
            >
              {MOCK_DEVICES.map((d) => (
                <option key={d.id} value={d.id} style={{ background: '#1D1918' }}>
                  {d.label}
                </option>
              ))}
            </select>
            <ChevronDown size={11} strokeWidth={2} style={{ color: 'var(--hw-text-muted)' }} />
          </div>
        </div>
      </div>

      {/* 16:9 Aspect Ratio Viewport Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          backgroundColor: '#0E0D0C',
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
        {/* Subtle Framing Reticle Corners */}
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
            zIndex: 10,
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
            zIndex: 10,
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
              if (found) setSelectedResolution(found);
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

        {/* Center Viewport Content: Honest Standby State vs Active Mock */}
        {cameraStatus === 'standby' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '24px',
              maxWidth: '420px',
            }}
          >
            {/* Watermark Heart Glyph */}
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
              Camera Feed Inactive
            </h3>

            <p
              style={{
                fontSize: '12px',
                color: 'var(--hw-text-muted)',
                lineHeight: 1.6,
                marginBottom: '20px',
              }}
            >
              Hardware capture and live frame streaming will be integrated in <strong>Phase Two</strong>. Select a device or toggle preview to inspect workspace framing.
            </p>

            <button
              onClick={handleToggleCamera}
              style={{
                padding: '9px 22px',
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
              Connect Camera (Phase 2 Ready)
            </button>
          </div>
        ) : cameraStatus === 'connecting' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '2px solid var(--hw-border-subtle)',
                borderTopColor: 'var(--hw-accent-rose)',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span style={{ fontSize: '12px', color: 'var(--hw-text-secondary)' }}>
              Initializing capture pipeline...
            </span>
          </div>
        ) : (
          /* Active Camera Mock Viewport with Ambient Video Simulation */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              background: 'radial-gradient(ellipse at center, #261D1F 0%, #120F10 100%)',
              transform: isMirrored ? 'scaleX(-1)' : 'none',
              transition: 'transform 0.3s ease',
            }}
          >
            {/* Ambient Silhouette Mock Graphic */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: 0.85,
                transform: isMirrored ? 'scaleX(-1)' : 'none',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '2px solid var(--hw-accent-burgundy)',
                  backgroundColor: 'rgba(103, 47, 64, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                <Camera size={32} strokeWidth={1.5} color="var(--hw-accent-rose)" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--hw-text-primary)' }}>
                Live Feed Emulation Active
              </span>
              <span style={{ fontSize: '11px', color: 'var(--hw-text-muted)', marginTop: '4px' }}>
                Phase Two will bind real MediaStream frames directly to this surface.
              </span>
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
        {/* Left Toggles: Mirror & Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleMirror}
            title="Mirror Camera Feed"
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
          <Camera size={14} strokeWidth={2} />
          {cameraStatus === 'active' ? 'Stop Camera' : 'Start Camera'}
        </button>

        {/* Right Toggle: Virtual Camera (with honest warning tooltip) */}
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
