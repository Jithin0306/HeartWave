import React from 'react';
import { Radio, Eye, EyeOff, Sparkles, Activity } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export const VirtualOutputBar: React.FC = () => {
  const {
    virtualOutputStatus,
    toggleVirtualOutput,
    isPrivacyShutterActive,
    togglePrivacyShutter,
    isBypassActive,
    toggleBypass,
    compositorMetrics,
    cameraStatus,
  } = useAppStore();

  const isBroadcasting = virtualOutputStatus === 'broadcasting';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        marginTop: '12px',
        backgroundColor: 'var(--hw-bg-secondary)',
        border: '1px solid var(--hw-border-subtle)',
        borderRadius: 'var(--hw-radius-md)',
        boxShadow: 'var(--hw-shadow-sm)',
        gap: '12px',
      }}
    >
      {/* Left: Main Virtual Output Activation Button & Status Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <button
          onClick={toggleVirtualOutput}
          disabled={cameraStatus !== 'active'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '7px 16px',
            minWidth: '175px',
            flexShrink: 0,
            borderRadius: 'var(--hw-radius-sm)',
            backgroundColor: isBroadcasting ? 'var(--hw-status-active)' : 'var(--hw-accent-primary)',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            boxShadow: isBroadcasting
              ? '0 0 16px rgba(90, 168, 117, 0.4)'
              : 'var(--hw-shadow-accent)',
            cursor: cameraStatus === 'active' ? 'pointer' : 'not-allowed',
            opacity: cameraStatus === 'active' ? 1 : 0.45,
            transition: 'all var(--hw-transition-fast)',
          }}
          onMouseEnter={(e) => {
            if (cameraStatus === 'active' && !isBroadcasting) {
              e.currentTarget.style.backgroundColor = 'var(--hw-accent-primary-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isBroadcasting) {
              e.currentTarget.style.backgroundColor = 'var(--hw-accent-primary)';
            }
          }}
        >
          <Radio size={14} strokeWidth={2.2} />
          <span>{isBroadcasting ? 'Broadcasting Active' : 'Start Virtual Output'}</span>
        </button>

        {/* Status Pill Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '4px 10px',
            minWidth: '155px',
            flexShrink: 0,
            borderRadius: 'var(--hw-radius-xs)',
            backgroundColor: 'rgba(20, 18, 17, 0.75)',
            border: '1px solid var(--hw-border-subtle)',
            fontSize: '11px',
            color: isBroadcasting ? 'var(--hw-status-active)' : 'var(--hw-text-muted)',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isBroadcasting ? 'var(--hw-status-active)' : 'var(--hw-text-muted)',
              boxShadow: isBroadcasting ? '0 0 8px var(--hw-status-active)' : 'none',
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 500, letterSpacing: '0.04em' }}>
            {isBroadcasting ? 'PIPELINE LIVE (30 FPS)' : 'OUTPUT STANDBY'}
          </span>
        </div>
      </div>

      {/* Center / Right: Quick Controls (Privacy Shutter & Effect Bypass) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Privacy Shutter / Cover Camera Button */}
        <button
          onClick={togglePrivacyShutter}
          title="Cover camera with Heartwave privacy monogram slate"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '6px 12px',
            minWidth: '125px',
            flexShrink: 0,
            borderRadius: 'var(--hw-radius-xs)',
            backgroundColor: isPrivacyShutterActive
              ? 'rgba(184, 92, 112, 0.25)'
              : 'rgba(38, 32, 31, 0.7)',
            border: `1px solid ${
              isPrivacyShutterActive ? 'var(--hw-accent-primary)' : 'var(--hw-border-subtle)'
            }`,
            color: isPrivacyShutterActive ? 'var(--hw-accent-rose)' : 'var(--hw-text-secondary)',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--hw-transition-fast)',
          }}
        >
          {isPrivacyShutterActive ? (
            <>
              <EyeOff size={13} strokeWidth={2} />
              <span>Camera Muted</span>
            </>
          ) : (
            <>
              <Eye size={13} strokeWidth={2} />
              <span>Privacy Shutter</span>
            </>
          )}
        </button>

        {/* Bypass Effects Toggle */}
        <button
          onClick={toggleBypass}
          title="Transmit raw camera video with zero effects"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '6px 12px',
            minWidth: '108px',
            flexShrink: 0,
            borderRadius: 'var(--hw-radius-xs)',
            backgroundColor: isBypassActive
              ? 'rgba(214, 189, 145, 0.2)'
              : 'rgba(38, 32, 31, 0.7)',
            border: `1px solid ${
              isBypassActive ? 'var(--hw-accent-champagne)' : 'var(--hw-border-subtle)'
            }`,
            color: isBypassActive ? 'var(--hw-accent-champagne)' : 'var(--hw-text-secondary)',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--hw-transition-fast)',
          }}
        >
          <Sparkles size={13} strokeWidth={2} />
          <span>{isBypassActive ? 'Bypass: On' : 'Bypass: Off'}</span>
        </button>

        {/* Pipeline Telemetry Pill */}
        {compositorMetrics && cameraStatus === 'active' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '135px',
              flexShrink: 0,
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--hw-radius-xs)',
              backgroundColor: 'rgba(20, 18, 17, 0.9)',
              border: '1px solid var(--hw-border-subtle)',
              fontSize: '10px',
              fontFamily: 'monospace',
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--hw-text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            <Activity size={12} color="var(--hw-accent-champagne)" />
            <span>
              {compositorMetrics.compositeFps}fps • {compositorMetrics.renderTimeMs.toFixed(1)}ms
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
