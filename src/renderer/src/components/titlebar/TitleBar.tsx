import React, { useEffect, useState } from 'react';
import { Minus, Square, Copy, X, Palette, Check, ChevronDown } from 'lucide-react';
import { useAppStore, THEMES, AppTheme } from '../../store/appStore';
import logoIconRomantic from '../../assets/logo-icon-romantic.png';
import logoIconStudio from '../../assets/logo-icon-studio.png';
import logoIconCyber from '../../assets/logo-icon-cyber.png';
import logoIconMidnight from '../../assets/logo-icon-midnight.png';

import wordmarkRomantic from '../../assets/wordmark-romantic.png';
import wordmarkStudio from '../../assets/wordmark-studio.png';
import wordmarkCyber from '../../assets/wordmark-cyber.png';
import wordmarkMidnight from '../../assets/wordmark-midnight.png';

const THEME_ICONS: Record<AppTheme, string> = {
  romantic: logoIconRomantic,
  studio: logoIconStudio,
  cyber: logoIconCyber,
  midnight: logoIconMidnight,
};

const THEME_WORDMARKS: Record<AppTheme, string> = {
  romantic: wordmarkRomantic,
  studio: wordmarkStudio,
  cyber: wordmarkCyber,
  midnight: wordmarkMidnight,
};

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const { virtualCameraStatus, currentTheme, setTheme } = useAppStore();

  const activeThemeConfig = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  useEffect(() => {
    if (window.heartwaveApi?.isWindowMaximized && window.heartwaveApi?.onMaximizedChange) {
      window.heartwaveApi.isWindowMaximized().then(setIsMaximized);
      const unsubscribe = window.heartwaveApi.onMaximizedChange((maximized) => {
        setIsMaximized(maximized);
      });
      return unsubscribe;
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.('[data-theme-picker]')) {
        setIsThemePickerOpen(false);
      }
    };
    if (isThemePickerOpen) {
      window.addEventListener('click', handleOutsideClick);
      return () => window.removeEventListener('click', handleOutsideClick);
    }
  }, [isThemePickerOpen]);

  const handleMinimize = () => {
    window.heartwaveApi?.minimizeWindow?.();
  };

  const handleMaximize = async () => {
    if (window.heartwaveApi?.maximizeWindow) {
      const maximized = await window.heartwaveApi.maximizeWindow();
      setIsMaximized(maximized);
    }
  };

  const handleClose = () => {
    window.heartwaveApi?.closeWindow?.();
  };

  return (
    <header
      style={
        {
          height: '38px',
          width: '100%',
          backgroundColor: 'var(--hw-bg-primary)',
          borderBottom: '1px solid var(--hw-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '12px',
          paddingRight: '0px',
          userSelect: 'none',
          WebkitAppRegion: 'drag',
          zIndex: 100,
          flexShrink: 0,
        } as React.CSSProperties
      }
    >
      {/* Brand & Wordmark matching active theme styling */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Heartwave Bespoke 3D Heart-Lens Icon (Theme Adaptive & Transparent) */}
        <div
          style={{
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            filter:
              currentTheme === 'romantic'
                ? 'drop-shadow(0 0 6px rgba(230, 42, 84, 0.45))'
                : currentTheme === 'studio'
                ? 'drop-shadow(0 0 6px rgba(229, 168, 59, 0.4))'
                : currentTheme === 'cyber'
                ? 'drop-shadow(0 0 6px rgba(0, 229, 255, 0.5))'
                : 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.45))',
          }}
        >
          <img
            src={THEME_ICONS[currentTheme] || logoIconRomantic}
            alt="Heartwave"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Master Stylized Wordmark: HEΛRT ♡-W ΛVE (Authentic Master Typography in every theme) */}
        <div
          style={{
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            userSelect: 'none',
          }}
        >
          <img
            src={THEME_WORDMARKS[currentTheme] || wordmarkRomantic}
            alt="HEΛRTWAVE"
            style={{
              height: '14px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
              filter:
                currentTheme === 'romantic'
                  ? 'drop-shadow(0 0 5px rgba(232, 44, 85, 0.35))'
                  : currentTheme === 'studio'
                  ? 'drop-shadow(0 0 5px rgba(229, 168, 59, 0.35))'
                  : currentTheme === 'cyber'
                  ? 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.45))'
                  : 'drop-shadow(0 0 5px rgba(16, 185, 129, 0.4))',
            }}
          />
        </div>

        {/* Phase Badge */}
        <div
          style={{
            padding: '2px 8px',
            borderRadius: 'var(--hw-radius-full)',
            backgroundColor: 'var(--hw-surface-elevated)',
            border: '1px solid var(--hw-border-subtle)',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.04em',
            color: 'var(--hw-accent-rose)',
            marginLeft: '4px',
          }}
        >
          PHASE 7: PRODUCTION RELEASE
        </div>

        {/* Dynamic Tagline based on active theme */}
        <span
          style={{
            fontSize: '11px',
            color: 'var(--hw-text-muted)',
            letterSpacing: '0.04em',
            fontFamily: 'var(--hw-font-sans)',
            fontStyle: 'italic',
            marginLeft: '6px',
          }}
        >
          "{activeThemeConfig.tagline}"
        </span>
      </div>

      {/* Right Controls: Theme Quick Switcher, Status & Window Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {/* Quick Theme Switcher Popover */}
        <div
          data-theme-picker="true"
          style={
            {
              position: 'relative',
              marginRight: '10px',
              WebkitAppRegion: 'no-drag',
            } as React.CSSProperties
          }
        >
          <button
            onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
            title={`Current Theme: ${activeThemeConfig.name} (${activeThemeConfig.category})`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor: isThemePickerOpen ? 'var(--hw-surface-active)' : 'var(--hw-bg-secondary)',
              border: `1px solid ${isThemePickerOpen ? 'var(--hw-border-focus)' : 'var(--hw-border-subtle)'}`,
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--hw-text-primary)',
              transition: 'all var(--hw-transition-fast)',
            }}
            onMouseEnter={(e) => {
              if (!isThemePickerOpen) e.currentTarget.style.backgroundColor = 'var(--hw-surface-hover)';
            }}
            onMouseLeave={(e) => {
              if (!isThemePickerOpen) e.currentTarget.style.backgroundColor = 'var(--hw-bg-secondary)';
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: activeThemeConfig.previewColor,
                boxShadow: `0 0 6px ${activeThemeConfig.previewColor}`,
              }}
            />
            <Palette size={13} strokeWidth={2} style={{ color: 'var(--hw-accent-rose)' }} />
            <span>{activeThemeConfig.name}</span>
            <ChevronDown size={11} strokeWidth={2} style={{ color: 'var(--hw-text-muted)' }} />
          </button>

          {/* Theme Dropdown Menu */}
          {isThemePickerOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '270px',
                backgroundColor: 'var(--hw-bg-secondary)',
                borderRadius: 'var(--hw-radius-md)',
                border: '1px solid var(--hw-border-subtle)',
                boxShadow: 'var(--hw-shadow-lg)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  padding: '6px 10px 4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--hw-text-muted)',
                }}
              >
                Select Interface Theme
              </div>

              {THEMES.map((theme) => {
                const isCurrent = theme.id === currentTheme;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setIsThemePickerOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--hw-radius-sm)',
                      backgroundColor: isCurrent ? 'var(--hw-surface-elevated)' : 'transparent',
                      border: `1px solid ${isCurrent ? 'var(--hw-border-focus)' : 'transparent'}`,
                      textAlign: 'left',
                      transition: 'all var(--hw-transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) e.currentTarget.style.backgroundColor = 'var(--hw-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: theme.previewColor,
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: `0 0 8px ${theme.previewColor}88`,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                            {theme.name}
                          </span>
                          {theme.badge && (
                            <span
                              style={{
                                fontSize: '9px',
                                padding: '1px 5px',
                                borderRadius: 'var(--hw-radius-full)',
                                backgroundColor: isCurrent ? 'var(--hw-accent-rose-soft)' : 'rgba(255, 255, 255, 0.06)',
                                color: isCurrent ? 'var(--hw-accent-rose)' : 'var(--hw-text-muted)',
                                fontWeight: 500,
                              }}
                            >
                              {theme.badge}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--hw-text-muted)', marginTop: '1px' }}>
                          {theme.category}
                        </span>
                      </div>
                    </div>

                    {isCurrent && (
                      <Check size={14} strokeWidth={2.5} style={{ color: 'var(--hw-accent-primary)', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Virtual Driver Status Indicator */}
        <div
          style={
            {
              WebkitAppRegion: 'no-drag',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              marginRight: '12px',
              borderRadius: 'var(--hw-radius-sm)',
              backgroundColor: 'var(--hw-bg-secondary)',
              border: '1px solid var(--hw-border-subtle)',
              fontSize: '11px',
              color: virtualCameraStatus === 'offline' ? 'var(--hw-text-muted)' : 'var(--hw-accent-champagne)',
            } as React.CSSProperties
          }
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: virtualCameraStatus === 'offline' ? 'var(--hw-status-idle)' : 'var(--hw-accent-champagne)',
            }}
          />
          Virtual Camera: {virtualCameraStatus === 'offline' ? 'Offline' : 'Phase 6 Integration'}
        </div>

        {/* Window action buttons (no-drag) */}
        <div
          style={
            {
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              WebkitAppRegion: 'no-drag',
            } as React.CSSProperties
          }
        >
          <button
            onClick={handleMinimize}
            title="Minimize"
            style={{
              width: '46px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--hw-text-secondary)',
              transition: 'background var(--hw-transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hw-surface-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Minus size={13} strokeWidth={2} />
          </button>

          <button
            onClick={handleMaximize}
            title={isMaximized ? 'Restore' : 'Maximize'}
            style={{
              width: '46px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--hw-text-secondary)',
              transition: 'background var(--hw-transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hw-surface-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {isMaximized ? <Copy size={11} strokeWidth={2} /> : <Square size={11} strokeWidth={2} />}
          </button>

          <button
            onClick={handleClose}
            title="Close"
            style={{
              width: '46px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--hw-text-secondary)',
              transition: 'background var(--hw-transition-fast), color var(--hw-transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E81123';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--hw-text-secondary)';
            }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
};
