import React from 'react';
import {
  Users,
  Heart,
  Radio,
  Smartphone,
  Sparkles,
  ArrowRight,
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
    isMobileConnected,
    setIsMobileCamModalOpen,
  } = useAppStore();

  // Curated top 6 effects for 1-click testing
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
        gap: '8px',
        marginTop: '8px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* 1. Slim Quick-Fire Effects Rail (Compact 1-Click Trigger) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: 'var(--hw-radius-md)',
          backgroundColor: 'var(--hw-bg-secondary)',
          border: '1px solid var(--hw-border-subtle)',
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            flexShrink: 0,
            paddingRight: '6px',
            borderRight: '1px solid var(--hw-border-subtle)',
          }}
        >
          <Sparkles size={12} color="var(--hw-accent-rose)" />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--hw-text-primary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Quick FX
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flex: 1,
            overflowX: 'auto',
          }}
        >
          {quickFireEffects.map((eff) => {
            const isSelected = selectedEffectId === eff.id;
            return (
              <button
                key={eff.id}
                onClick={() => handleSelectQuickEffect(eff.id)}
                title={`Select ${eff.name} (${eff.gestureName})`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--hw-radius-full)',
                  backgroundColor: isSelected
                    ? 'var(--hw-surface-active)'
                    : 'var(--hw-surface-elevated)',
                  border: isSelected
                    ? '1px solid var(--hw-accent-rose)'
                    : '1px solid var(--hw-border-subtle)',
                  color: isSelected ? 'var(--hw-text-primary)' : 'var(--hw-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: isSelected ? 600 : 500,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all var(--hw-transition-fast)',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isSelected
                      ? 'var(--hw-accent-rose)'
                      : 'var(--hw-border-medium)',
                  }}
                />
                <span>{eff.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Low-Profile Studio Launchpad Cards (Single Slim Row) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
        }}
      >
        {/* Card 1: Couples Duo */}
        <div
          onClick={() => handleLaunchMode('couples', 'couples')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: 'var(--hw-radius-md)',
            backgroundColor: 'var(--hw-bg-secondary)',
            border: '1px solid var(--hw-border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--hw-accent-rose)';
            e.currentTarget.style.backgroundColor = 'var(--hw-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--hw-border-subtle)';
            e.currentTarget.style.backgroundColor = 'var(--hw-bg-secondary)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <Users size={14} color="var(--hw-accent-rose)" style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--hw-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Couples & Duo
              </span>
              <span style={{ fontSize: '9px', color: 'var(--hw-text-muted)', whiteSpace: 'nowrap' }}>
                Dual-Cam Sync
              </span>
            </div>
          </div>
          <ArrowRight size={11} color="var(--hw-text-muted)" style={{ flexShrink: 0 }} />
        </div>

        {/* Card 2: Romantic FX */}
        <div
          onClick={() => handleLaunchMode('romantic', 'romantic')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: 'var(--hw-radius-md)',
            backgroundColor: 'var(--hw-bg-secondary)',
            border: '1px solid var(--hw-border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--hw-accent-champagne)';
            e.currentTarget.style.backgroundColor = 'var(--hw-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--hw-border-subtle)';
            e.currentTarget.style.backgroundColor = 'var(--hw-bg-secondary)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <Heart size={14} color="var(--hw-accent-champagne)" style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--hw-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Romantic Visual FX
              </span>
              <span style={{ fontSize: '9px', color: 'var(--hw-text-muted)', whiteSpace: 'nowrap' }}>
                Cinematic Atmosphere
              </span>
            </div>
          </div>
          <ArrowRight size={11} color="var(--hw-text-muted)" style={{ flexShrink: 0 }} />
        </div>

        {/* Card 3: Streamer Hub */}
        <div
          onClick={() => handleLaunchMode('streamer')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: 'var(--hw-radius-md)',
            backgroundColor: 'var(--hw-bg-secondary)',
            border: '1px solid var(--hw-border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#34c759';
            e.currentTarget.style.backgroundColor = 'var(--hw-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--hw-border-subtle)';
            e.currentTarget.style.backgroundColor = 'var(--hw-bg-secondary)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <Radio size={14} color="#34c759" style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--hw-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Streamer Hub
              </span>
              <span style={{ fontSize: '9px', color: 'var(--hw-text-muted)', whiteSpace: 'nowrap' }}>
                OBS & Discord Output
              </span>
            </div>
          </div>
          <ArrowRight size={11} color="var(--hw-text-muted)" style={{ flexShrink: 0 }} />
        </div>

        {/* Card 4: Wireless Phone Cam */}
        <div
          onClick={() => {
            soundEngine.playHeartChime();
            setIsMobileCamModalOpen(true);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: 'var(--hw-radius-md)',
            backgroundColor: 'var(--hw-bg-secondary)',
            border: '1px solid var(--hw-border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#818cf8';
            e.currentTarget.style.backgroundColor = 'var(--hw-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--hw-border-subtle)';
            e.currentTarget.style.backgroundColor = 'var(--hw-bg-secondary)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <Smartphone
              size={14}
              color={isMobileConnected ? '#34c759' : '#818cf8'}
              style={{ flexShrink: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isMobileConnected ? '#34c759' : 'var(--hw-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {isMobileConnected ? 'Phone Active' : 'Phone as Webcam'}
              </span>
              <span style={{ fontSize: '9px', color: 'var(--hw-text-muted)', whiteSpace: 'nowrap' }}>
                {isMobileConnected ? 'Tap to Manage' : 'QR Scan Ready'}
              </span>
            </div>
          </div>
          <ArrowRight size={11} color="var(--hw-text-muted)" style={{ flexShrink: 0 }} />
        </div>
      </div>
    </div>
  );
};
