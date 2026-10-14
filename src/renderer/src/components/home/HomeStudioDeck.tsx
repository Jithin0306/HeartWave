import React from 'react';
import {
  Users,
  Heart,
  Radio,
  Smartphone,
  Sparkles,
  Hand,
  ArrowRight,
  Camera,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { soundEngine } from '../../services/soundEngine';

export const HomeStudioDeck: React.FC = () => {
  const {
    setActiveNav,
    setCategoryFilter,
    effects,
    selectedEffectId,
    setSelectedEffectId,
    cameraStatus,
    availableDevices,
    selectedDeviceId,
    cameraMetrics,
    isTrackingActive,
    toggleTracking,
    virtualOutputStatus,
    isMobileConnected,
    mobileDeviceName,
    setIsMobileCamModalOpen,
  } = useAppStore();

  const selectedDevice = availableDevices.find((d) => d.id === selectedDeviceId);

  // Curated Quick-Fire Effects for 1-click live testing directly on Home
  const quickFireEffects = effects.slice(0, 6);

  const handleLaunchMode = (mode: string, filter?: any) => {
    soundEngine.playHeartChime();
    setActiveNav(mode);
    if (filter) {
      setCategoryFilter(filter);
    }
  };

  const handleSelectQuickEffect = (id: string) => {
    soundEngine.playSparkle();
    setSelectedEffectId(id);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        marginTop: '14px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      {/* 1. System Readiness & Hardware Status Telemetry Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
        }}
      >
        {/* Metric 1: Camera Hardware */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: 'var(--hw-radius-md)',
            backgroundColor: 'var(--hw-bg-secondary)',
            border: '1px solid var(--hw-border-subtle)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor:
                cameraStatus === 'active'
                  ? 'rgba(78, 170, 121, 0.15)'
                  : 'var(--hw-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color:
                cameraStatus === 'active'
                  ? 'var(--hw-status-active)'
                  : 'var(--hw-text-muted)',
              flexShrink: 0,
            }}
          >
            <Camera size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--hw-text-muted)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Camera Feed
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--hw-text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={selectedDevice?.label || 'Ready'}
            >
              {cameraStatus === 'active'
                ? cameraMetrics
                  ? `${cameraMetrics.actualWidth}×${cameraMetrics.actualHeight} @ ${cameraMetrics.actualFps}fps`
                  : 'Feed Active'
                : 'Camera Standby'}
            </span>
          </div>
        </div>

        {/* Metric 2: AI Hand Tracking Engine */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 'var(--hw-radius-md)',
            backgroundColor: 'var(--hw-bg-secondary)',
            border: '1px solid var(--hw-border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--hw-radius-sm)',
                backgroundColor: isTrackingActive
                  ? 'rgba(214, 189, 145, 0.15)'
                  : 'var(--hw-surface-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isTrackingActive
                  ? 'var(--hw-accent-champagne)'
                  : 'var(--hw-text-muted)',
                flexShrink: 0,
              }}
            >
              <Hand size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--hw-text-muted)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                AI Gesture Engine
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isTrackingActive
                    ? 'var(--hw-accent-champagne)'
                    : 'var(--hw-text-secondary)',
                }}
              >
                {isTrackingActive ? 'MediaPipe 21-3D On' : 'Tracking Inactive'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleTracking}
            title={isTrackingActive ? 'Disable tracking' : 'Enable 21-point tracking'}
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--hw-radius-xs)',
              backgroundColor: isTrackingActive
                ? 'var(--hw-surface-elevated)'
                : 'var(--hw-accent-champagne)',
              color: isTrackingActive ? 'var(--hw-text-secondary)' : '#0A0A0D',
              border: 'none',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all var(--hw-transition-fast)',
            }}
          >
            {isTrackingActive ? 'Pause' : 'Activate'}
          </button>
        </div>

        {/* Metric 3: DirectShow Broadcast */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: 'var(--hw-radius-md)',
            backgroundColor: 'var(--hw-bg-secondary)',
            border: '1px solid var(--hw-border-subtle)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor:
                virtualOutputStatus === 'broadcasting'
                  ? 'rgba(52, 199, 89, 0.15)'
                  : 'var(--hw-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color:
                virtualOutputStatus === 'broadcasting'
                  ? '#34c759'
                  : 'var(--hw-text-muted)',
              flexShrink: 0,
            }}
          >
            <Radio size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--hw-text-muted)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              DirectShow Pipe
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color:
                  virtualOutputStatus === 'broadcasting'
                    ? '#34c759'
                    : 'var(--hw-text-secondary)',
              }}
            >
              {virtualOutputStatus === 'broadcasting' ? 'Broadcasting 60FPS' : 'Ready for OBS'}
            </span>
          </div>
        </div>

        {/* Metric 4: Wireless Mobile Cam */}
        <div
          onClick={() => setIsMobileCamModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 'var(--hw-radius-md)',
            backgroundColor: isMobileConnected
              ? 'rgba(52, 199, 89, 0.08)'
              : 'var(--hw-bg-secondary)',
            border: `1px solid ${
              isMobileConnected ? 'rgba(52, 199, 89, 0.3)' : 'var(--hw-border-subtle)'
            }`,
            cursor: 'pointer',
            transition: 'all var(--hw-transition-fast)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--hw-radius-sm)',
                backgroundColor: isMobileConnected
                  ? 'rgba(52, 199, 89, 0.2)'
                  : 'var(--hw-surface-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isMobileConnected ? '#34c759' : 'var(--hw-accent-rose)',
                flexShrink: 0,
              }}
            >
              <Smartphone size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--hw-text-muted)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Wireless Phone Cam
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isMobileConnected ? '#34c759' : 'var(--hw-text-primary)',
                }}
              >
                {isMobileConnected ? mobileDeviceName || 'Connected' : 'Click to Pair QR'}
              </span>
            </div>
          </div>
          <ArrowRight size={13} color="var(--hw-text-muted)" />
        </div>
      </div>

      {/* 2. Quick-Fire Effect Shelf (1-Click Instant Trigger Directly on Home) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px 14px',
          borderRadius: 'var(--hw-radius-md)',
          backgroundColor: 'var(--hw-bg-secondary)',
          border: '1px solid var(--hw-border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="var(--hw-accent-rose)" />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--hw-text-primary)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              Quick-Fire Effects Shelf
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--hw-text-muted)' }}>
            Instant 1-Click Trigger
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px',
          }}
        >
          {quickFireEffects.map((eff) => {
            const isSelected = selectedEffectId === eff.id;
            return (
              <button
                key={eff.id}
                onClick={() => handleSelectQuickEffect(eff.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: 'var(--hw-radius-sm)',
                  backgroundColor: isSelected
                    ? 'var(--hw-surface-active)'
                    : 'var(--hw-surface-elevated)',
                  border: isSelected
                    ? '1px solid var(--hw-accent-primary)'
                    : '1px solid var(--hw-border-subtle)',
                  color: isSelected ? 'var(--hw-text-primary)' : 'var(--hw-text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--hw-transition-fast)',
                  boxShadow: isSelected ? '0 0 10px rgba(184, 92, 112, 0.25)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isSelected
                      ? 'var(--hw-accent-rose)'
                      : 'var(--hw-border-medium)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: isSelected ? 700 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {eff.name}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      color: 'var(--hw-text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {eff.gestureName}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. The 4 Studio Hub Launchpad Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Card 1: Couples & Duo Mode */}
        <div
          onClick={() => handleLaunchMode('couples', 'couples')}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '14px',
            borderRadius: 'var(--hw-radius-lg)',
            backgroundColor: 'var(--hw-bg-secondary)',
            border: '1px solid var(--hw-border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'var(--hw-accent-rose)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(215, 154, 166, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = 'var(--hw-border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--hw-radius-md)',
                  backgroundColor: 'rgba(215, 154, 166, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--hw-accent-rose)',
                }}
              >
                <Users size={18} />
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding: '2px 7px',
                  borderRadius: 'var(--hw-radius-full)',
                  backgroundColor: 'rgba(215, 154, 166, 0.1)',
                  color: 'var(--hw-accent-rose)',
                  border: '1px solid rgba(215, 154, 166, 0.2)',
                }}
              >
                Dual-Cam Sync
              </span>
            </div>

            <h3
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--hw-text-primary)',
                marginBottom: '4px',
              }}
            >
              Couples & Duo Mode
            </h3>
            <p
              style={{
                fontSize: '11px',
                color: 'var(--hw-text-secondary)',
                lineHeight: '1.4',
                margin: 0,
              }}
            >
              Dual-palm heart detection and co-stream tracking. Perfect for couples, friends, and co-hosts.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '12px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--hw-accent-rose)',
            }}
          >
            <span>Launch Duo Studio</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Card 2: Romantic FX Studio */}
        <div
          onClick={() => handleLaunchMode('romantic', 'romantic')}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '14px',
            borderRadius: 'var(--hw-radius-lg)',
            backgroundColor: 'var(--hw-bg-secondary)',
            border: '1px solid var(--hw-border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'var(--hw-accent-champagne)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(214, 189, 145, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = 'var(--hw-border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--hw-radius-md)',
                  backgroundColor: 'rgba(214, 189, 145, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--hw-accent-champagne)',
                }}
              >
                <Heart size={18} />
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding: '2px 7px',
                  borderRadius: 'var(--hw-radius-full)',
                  backgroundColor: 'rgba(214, 189, 145, 0.1)',
                  color: 'var(--hw-accent-champagne)',
                  border: '1px solid rgba(214, 189, 145, 0.2)',
                }}
              >
                Cinematic FX
              </span>
            </div>

            <h3
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--hw-text-primary)',
                marginBottom: '4px',
              }}
            >
              Romantic Visual FX
            </h3>
            <p
              style={{
                fontSize: '11px',
                color: 'var(--hw-text-secondary)',
                lineHeight: '1.4',
                margin: 0,
              }}
            >
              Floating rose petals, celestial particle rings, ethereal golden glow, and cupid's arrow.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '12px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--hw-accent-champagne)',
            }}
          >
            <span>Explore Romantic VFX</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Card 3: Streamer Broadcast Deck */}
        <div
          onClick={() => handleLaunchMode('streamer')}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '14px',
            borderRadius: 'var(--hw-radius-lg)',
            backgroundColor: 'var(--hw-bg-secondary)',
            border: '1px solid var(--hw-border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'var(--hw-accent-primary)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(184, 92, 112, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = 'var(--hw-border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--hw-radius-md)',
                  backgroundColor: 'rgba(52, 199, 89, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34c759',
                }}
              >
                <Radio size={18} />
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding: '2px 7px',
                  borderRadius: 'var(--hw-radius-full)',
                  backgroundColor: 'rgba(52, 199, 89, 0.1)',
                  color: '#34c759',
                  border: '1px solid rgba(52, 199, 89, 0.2)',
                }}
              >
                DirectShow 60FPS
              </span>
            </div>

            <h3
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--hw-text-primary)',
                marginBottom: '4px',
              }}
            >
              Streamer Broadcast Hub
            </h3>
            <p
              style={{
                fontSize: '11px',
                color: 'var(--hw-text-secondary)',
                lineHeight: '1.4',
                margin: 0,
              }}
            >
              Output composited video to OBS Studio, Discord, Twitch, and Zoom with one-click privacy shutter.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '12px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#34c759',
            }}
          >
            <span>Open Broadcast Deck</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Card 4: Wireless Mobile Camera */}
        <div
          onClick={() => {
            soundEngine.playHeartChime();
            setIsMobileCamModalOpen(true);
          }}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '14px',
            borderRadius: 'var(--hw-radius-lg)',
            backgroundColor: 'var(--hw-bg-secondary)',
            border: '1px solid var(--hw-border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'var(--hw-accent-rose)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(215, 154, 166, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = 'var(--hw-border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--hw-radius-md)',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                }}
              >
                <Smartphone size={18} />
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding: '2px 7px',
                  borderRadius: 'var(--hw-radius-full)',
                  backgroundColor: isMobileConnected
                    ? 'rgba(52, 199, 89, 0.1)'
                    : 'rgba(99, 102, 241, 0.1)',
                  color: isMobileConnected ? '#34c759' : '#818cf8',
                  border: `1px solid ${
                    isMobileConnected ? 'rgba(52, 199, 89, 0.2)' : 'rgba(99, 102, 241, 0.2)'
                  }`,
                }}
              >
                {isMobileConnected ? 'Connected' : 'QR Scan Ready'}
              </span>
            </div>

            <h3
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--hw-text-primary)',
                marginBottom: '4px',
              }}
            >
              Wireless Phone Cam
            </h3>
            <p
              style={{
                fontSize: '11px',
                color: 'var(--hw-text-secondary)',
                lineHeight: '1.4',
                margin: 0,
              }}
            >
              Use your iPhone or Android phone as an HD webcam. Features remote zoom, flashlight, and lens switcher.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '12px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#818cf8',
            }}
          >
            <span>{isMobileConnected ? 'Manage Mobile Cam' : 'Scan QR Code'}</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
};
