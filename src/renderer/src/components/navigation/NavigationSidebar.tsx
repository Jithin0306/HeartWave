import React from 'react';
import {
  Home,
  Users,
  Heart,
  Radio,
  Star,
  Settings,
  Camera,
  Layers,
  Palette,
  LucideIcon,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'couples', label: 'Couples', icon: Users },
  { id: 'romantic', label: 'Romantic', icon: Heart },
  { id: 'streamer', label: 'Streamer', icon: Radio, badge: 'Soon' },
  { id: 'favorites', label: 'Favorites', icon: Star },
];

export const NavigationSidebar: React.FC = () => {
  const { activeNav, setActiveNav, setIsSettingsOpen, cameraStatus, virtualCameraStatus } = useAppStore();

  return (
    <aside
      style={{
        width: '64px',
        backgroundColor: 'var(--hw-bg-secondary)',
        borderRight: '1px solid var(--hw-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '16px',
        paddingBottom: '16px',
        gap: '8px',
        flexShrink: 0,
      }}
    >
      {/* Navigation Group */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              title={item.label}
              style={{
                position: 'relative',
                width: '44px',
                height: '44px',
                borderRadius: 'var(--hw-radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? 'var(--hw-surface-elevated)' : 'transparent',
                color: isActive ? 'var(--hw-text-primary)' : 'var(--hw-text-muted)',
                border: isActive ? '1px solid var(--hw-accent-burgundy)' : '1px solid transparent',
                transition: 'all var(--hw-transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--hw-surface-hover)';
                  e.currentTarget.style.color = 'var(--hw-text-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--hw-text-muted)';
                }
              }}
            >
              {/* Active Indicator Bar on left */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: '-8px',
                    top: '10px',
                    bottom: '10px',
                    width: '3px',
                    backgroundColor: 'var(--hw-accent-primary)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}

              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />

              {/* Badge for "Soon" */}
              {item.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    fontSize: '8px',
                    backgroundColor: 'var(--hw-accent-burgundy)',
                    color: 'var(--hw-accent-rose)',
                    padding: '1px 3px',
                    borderRadius: 'var(--hw-radius-xs)',
                    fontWeight: 600,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Hardware Status Indicators in Rail Footer */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--hw-border-subtle)',
          width: '36px',
        }}
      >
        {/* Camera indicator */}
        <div
          title={`Physical Camera: ${cameraStatus.toUpperCase()}`}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: cameraStatus === 'active' ? 'var(--hw-status-active)' : 'var(--hw-text-muted)',
          }}
        >
          <Camera size={16} strokeWidth={1.8} />
          <span
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: cameraStatus === 'active' ? 'var(--hw-status-active)' : 'var(--hw-status-idle)',
            }}
          />
        </div>

        {/* Virtual Camera driver indicator */}
        <div
          title={`Virtual Camera: ${virtualCameraStatus.toUpperCase()}`}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: virtualCameraStatus === 'active' ? 'var(--hw-status-active)' : 'var(--hw-text-muted)',
          }}
        >
          <Layers size={16} strokeWidth={1.8} />
          <span
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: virtualCameraStatus === 'active' ? 'var(--hw-status-active)' : 'var(--hw-status-idle)',
            }}
          />
        </div>
      </div>

      {/* Themes & Appearance Launcher Button */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        title="Themes & Appearance"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--hw-radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--hw-accent-rose)',
          transition: 'all var(--hw-transition-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--hw-surface-hover)';
          e.currentTarget.style.color = 'var(--hw-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--hw-accent-rose)';
        }}
      >
        <Palette size={18} strokeWidth={1.8} />
      </button>

      {/* Settings Action Button */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        title="Settings & Preferences"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--hw-radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--hw-text-muted)',
          transition: 'all var(--hw-transition-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--hw-surface-hover)';
          e.currentTarget.style.color = 'var(--hw-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--hw-text-muted)';
        }}
      >
        <Settings size={18} strokeWidth={1.8} />
      </button>
    </aside>
  );
};
