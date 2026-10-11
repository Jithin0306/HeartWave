import React, { useEffect, useState } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const { virtualCameraStatus } = useAppStore();

  useEffect(() => {
    if (window.heartwaveApi?.isWindowMaximized) {
      window.heartwaveApi.isWindowMaximized().then(setIsMaximized);
      const unsubscribe = window.heartwaveApi.onMaximizedChange((maximized) => {
        setIsMaximized(maximized);
      });
      return unsubscribe;
    }
  }, []);

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
      {/* Brand & Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Heartwave Bespoke Wave-Heart Icon */}
        <div
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--hw-accent-burgundy), var(--hw-accent-primary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--hw-shadow-accent)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5EFE9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>

        <span
          style={{
            fontFamily: 'var(--hw-font-serif)',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'var(--hw-text-primary)',
            textTransform: 'uppercase',
          }}
        >
          Heartwave
        </span>

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
          }}
        >
          PHASE 6: WINDOWS VIRTUAL CAMERA
        </div>

        {/* Tagline */}
        <span
          style={{
            fontSize: '11px',
            color: 'var(--hw-text-muted)',
            fontStyle: 'italic',
            marginLeft: '8px',
          }}
        >
          "Make every gesture mean something"
        </span>
      </div>

      {/* Right Controls: Status & Window Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
