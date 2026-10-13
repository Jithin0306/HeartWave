import React from 'react';
import {
  Radio,
  Shield,
  Eye,
  FlipHorizontal,
  CheckCircle2,
  Volume2,
  VolumeX,
  Cpu,
  Zap,
} from 'lucide-react';
import { useAppStore, RESOLUTION_PRESETS } from '../../store/appStore';

export const StreamerHub: React.FC = () => {
  const {
    virtualOutputStatus,
    toggleVirtualOutput,
    isPrivacyShutterActive,
    togglePrivacyShutter,
    isBypassActive,
    toggleBypass,
    isMirrored,
    toggleMirror,
    selectedResolution,
    selectResolution,
    isSoundEnabled,
    setSoundEnabled,
    soundVolume,
  } = useAppStore();

  const isVirtualOutputActive = virtualOutputStatus === 'broadcasting';
  const isPrivacyActive = isPrivacyShutterActive;

  return (
    <aside
      style={{
        width: '350px',
        backgroundColor: 'var(--hw-bg-secondary)',
        borderLeft: '1px solid var(--hw-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--hw-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          backgroundColor: 'var(--hw-bg-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'rgba(232, 44, 85, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Radio size={16} color="var(--hw-accent-rose)" />
            </div>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--hw-text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Streamer Broadcast Hub
            </h2>
          </div>

          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: 'var(--hw-radius-full)',
              backgroundColor: isVirtualOutputActive
                ? 'rgba(52, 199, 89, 0.15)'
                : 'var(--hw-surface-elevated)',
              color: isVirtualOutputActive ? '#34c759' : 'var(--hw-text-muted)',
              border: `1px solid ${isVirtualOutputActive ? 'rgba(52, 199, 89, 0.3)' : 'var(--hw-border-subtle)'}`,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isVirtualOutputActive ? '#34c759' : 'var(--hw-status-idle)',
              }}
            />
            {isVirtualOutputActive ? 'LIVE ON AIR' : 'STANDBY'}
          </span>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)', lineHeight: 1.4 }}>
          Native Rust DirectShow video pipeline broadcasting directly to OBS Studio, Discord, and streaming apps.
        </p>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Master Broadcast Action Card */}
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--hw-radius-md)',
            backgroundColor: 'var(--hw-surface-elevated)',
            border: isVirtualOutputActive
              ? '1px solid var(--hw-accent-rose)'
              : '1px solid var(--hw-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: isVirtualOutputActive ? 'var(--hw-shadow-accent)' : 'none',
            transition: 'all var(--hw-transition-fast)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                Virtual Camera Feed
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)' }}>
                DirectShow Filter: <strong style={{ color: 'var(--hw-text-secondary)' }}>Heartwave Virtual Camera</strong>
              </p>
            </div>
            <Zap size={16} color={isVirtualOutputActive ? 'var(--hw-accent-rose)' : 'var(--hw-text-muted)'} />
          </div>

          <button
            onClick={toggleVirtualOutput}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--hw-radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: isVirtualOutputActive ? '#ff3b30' : 'var(--hw-accent-rose)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all var(--hw-transition-fast)',
            }}
          >
            <Radio size={14} />
            {isVirtualOutputActive ? 'Stop Virtual Camera (Ctrl+Shift+V)' : 'Start Virtual Camera (Ctrl+Shift+V)'}
          </button>
        </div>

        {/* Live Controls Grid */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--hw-text-primary)', marginBottom: '8px' }}>
            Broadcast Stream Controls
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {/* Privacy Shutter */}
            <button
              onClick={togglePrivacyShutter}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--hw-radius-sm)',
                backgroundColor: isPrivacyActive ? 'rgba(255, 69, 58, 0.15)' : 'var(--hw-surface-elevated)',
                border: isPrivacyActive ? '1px solid #ff453a' : '1px solid var(--hw-border-subtle)',
                color: isPrivacyActive ? '#ff453a' : 'var(--hw-text-secondary)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'flex-start',
                transition: 'all var(--hw-transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} color={isPrivacyActive ? '#ff453a' : undefined} />
                <span>Privacy Shutter</span>
              </div>
              <span style={{ fontSize: '9px', color: 'var(--hw-text-muted)' }}>
                {isPrivacyActive ? 'Blackout Active' : 'Feed Visible'}
              </span>
            </button>

            {/* Clean Bypass */}
            <button
              onClick={toggleBypass}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--hw-radius-sm)',
                backgroundColor: isBypassActive ? 'rgba(229, 168, 59, 0.15)' : 'var(--hw-surface-elevated)',
                border: isBypassActive ? '1px solid #e5a83b' : '1px solid var(--hw-border-subtle)',
                color: isBypassActive ? '#e5a83b' : 'var(--hw-text-secondary)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'flex-start',
                transition: 'all var(--hw-transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={14} color={isBypassActive ? '#e5a83b' : undefined} />
                <span>Bypass Mode</span>
              </div>
              <span style={{ fontSize: '9px', color: 'var(--hw-text-muted)' }}>
                {isBypassActive ? 'Raw Video Feed' : 'Effects Enabled'}
              </span>
            </button>

            {/* Mirror Stream */}
            <button
              onClick={toggleMirror}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--hw-radius-sm)',
                backgroundColor: isMirrored ? 'rgba(16, 185, 129, 0.15)' : 'var(--hw-surface-elevated)',
                border: isMirrored ? '1px solid #10b981' : '1px solid var(--hw-border-subtle)',
                color: isMirrored ? '#10b981' : 'var(--hw-text-secondary)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'flex-start',
                transition: 'all var(--hw-transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FlipHorizontal size={14} color={isMirrored ? '#10b981' : undefined} />
                <span>Mirror Video</span>
              </div>
              <span style={{ fontSize: '9px', color: 'var(--hw-text-muted)' }}>
                {isMirrored ? 'Horizontal Flip' : 'Normal Feed'}
              </span>
            </button>

            {/* Audio Chime Trigger */}
            <button
              onClick={() => setSoundEnabled(!isSoundEnabled)}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--hw-radius-sm)',
                backgroundColor: isSoundEnabled ? 'rgba(232, 44, 85, 0.15)' : 'var(--hw-surface-elevated)',
                border: isSoundEnabled ? '1px solid var(--hw-accent-rose)' : '1px solid var(--hw-border-subtle)',
                color: isSoundEnabled ? 'var(--hw-accent-rose)' : 'var(--hw-text-secondary)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'flex-start',
                transition: 'all var(--hw-transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isSoundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span>Audio Chimes</span>
              </div>
              <span style={{ fontSize: '9px', color: 'var(--hw-text-muted)' }}>
                {isSoundEnabled ? `${soundVolume}% Volume` : 'Muted'}
              </span>
            </button>
          </div>
        </div>

        {/* Stream Resolution Presets */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--hw-text-primary)', marginBottom: '8px' }}>
            Output Stream Resolution & FPS
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {RESOLUTION_PRESETS.map((preset) => {
              const isSelected = selectedResolution.id === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => selectResolution(preset)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--hw-radius-sm)',
                    backgroundColor: isSelected ? 'var(--hw-surface-elevated)' : 'var(--hw-bg-primary)',
                    border: isSelected ? '1px solid var(--hw-accent-rose)' : '1px solid var(--hw-border-subtle)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    transition: 'all var(--hw-transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--hw-text-primary)', fontWeight: 500 }}>{preset.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--hw-text-muted)' }}>
                      {preset.width}×{preset.height} @ {preset.fps}fps
                    </span>
                  </div>
                  {isSelected && <CheckCircle2 size={14} color="var(--hw-accent-rose)" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Target App Quick Setup Cards */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--hw-text-primary)', marginBottom: '8px' }}>
            Target Application Setup
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              {
                name: 'OBS Studio',
                instructions: 'Add Source ➔ Video Capture Device ➔ "Heartwave Virtual Camera"',
              },
              {
                name: 'Discord Desktop',
                instructions: 'Settings ➔ Voice & Video ➔ Video Settings ➔ "Heartwave Virtual Camera"',
              },
              {
                name: 'Zoom / Google Meet',
                instructions: 'Video Settings ➔ Camera Dropdown ➔ "Heartwave Virtual Camera"',
              },
            ].map((app) => (
              <div
                key={app.name}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--hw-radius-sm)',
                  backgroundColor: 'var(--hw-surface-elevated)',
                  border: '1px solid var(--hw-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                    {app.name}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--hw-accent-rose)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={11} /> Ready
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: 'var(--hw-text-muted)', lineHeight: 1.4 }}>
                  {app.instructions}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Rust Zero-Copy Performance Spec */}
        <div
          style={{
            padding: '12px',
            borderRadius: 'var(--hw-radius-md)',
            backgroundColor: 'var(--hw-bg-primary)',
            border: '1px solid var(--hw-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color="var(--hw-accent-champagne)" />
            <h5 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--hw-accent-champagne)' }}>
              Rust Zero-Copy DirectShow Engine Active
            </h5>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--hw-text-muted)', lineHeight: 1.4 }}>
            Operating via <code style={{ color: 'var(--hw-text-secondary)' }}>Local\HeartWave_FrameBuffer</code>. Consumes ~56 MB RAM with uninterrupted background streaming when minimized to the System Tray.
          </p>
        </div>
      </div>
    </aside>
  );
};
