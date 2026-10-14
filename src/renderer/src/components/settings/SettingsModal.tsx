import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Hand,
  Layers,
  Shield,
  CheckCircle2,
  Palette,
  Sparkles,
  Check,
  Volume2,
  VolumeX,
  Keyboard,
  RefreshCw,
  Download,
  ArrowUpCircle,
  AlertCircle,
  Smartphone,
  SwitchCamera,
  Zap,
  ZoomIn,
} from 'lucide-react';
import { useAppStore, RESOLUTION_PRESETS, THEMES, FONTS } from '../../store/appStore';
import { soundEngine } from '../../services/soundEngine';

type SettingsTab = 'appearance' | 'camera' | 'gesture' | 'virtualCam' | 'privacy' | 'updates';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    currentTheme,
    setTheme,
    currentFont,
    setFont,
    isSoundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
    availableDevices,
    selectedDeviceId,
    selectDevice,
    selectedResolution,
    selectResolution,
    isMirrored,
    toggleMirror,
    showSkeletonDiagnostics,
    setShowSkeletonDiagnostics,
    gestureHoldDuration,
    setGestureHoldDuration,
    gestureConfidence,
    setGestureConfidence,
    isMobileConnected,
    mobileDeviceName,
    mobileZoom,
    mobileTorch,
    mobileLens,
    mobileMaxZoom,
    mobileMinZoom,
    setMobileZoom,
    toggleMobileTorch,
    switchMobileLens,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [appVersion, setAppVersion] = useState<string>(
    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.3.4'
  );
  const [updateStatus, setUpdateStatus] = useState<{
    state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
    version?: string;
    percent?: number;
    message?: string;
  }>({ state: 'idle' });
  const [isCheckingManual, setIsCheckingManual] = useState<boolean>(false);

  useEffect(() => {
    if (window.heartwaveApi?.getAppInfo) {
      window.heartwaveApi.getAppInfo().then((info) => {
        if (info && info.version) {
          setAppVersion(info.version);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (window.heartwaveApi?.getUpdateStatus) {
      window.heartwaveApi.getUpdateStatus().then((status) => {
        if (status) setUpdateStatus(status);
      });
    }
    if (window.heartwaveApi?.onUpdateStatus) {
      const unsub = window.heartwaveApi.onUpdateStatus((status) => {
        setUpdateStatus(status);
        setIsCheckingManual(false);
      });
      return unsub;
    }
  }, []);

  const handleCheckUpdates = async () => {
    setIsCheckingManual(true);
    setUpdateStatus({ state: 'checking' });
    if (window.heartwaveApi?.checkForUpdates) {
      try {
        const res = await window.heartwaveApi.checkForUpdates();
        if (res) setUpdateStatus(res);
      } catch (err: any) {
        setUpdateStatus({ state: 'error', message: err?.message || 'Failed to check updates' });
      } finally {
        setIsCheckingManual(false);
      }
    } else {
      setTimeout(() => {
        setUpdateStatus({
          state: 'not-available',
          message: 'Development environment (packaged build required for auto-updates)',
        });
        setIsCheckingManual(false);
      }, 1000);
    }
  };

  const handleInstallUpdate = () => {
    window.heartwaveApi?.installUpdate?.();
  };

  if (!isSettingsOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={() => setIsSettingsOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '680px',
          height: '480px',
          backgroundColor: 'var(--hw-bg-secondary)',
          borderRadius: 'var(--hw-radius-lg)',
          border: '1px solid var(--hw-border-subtle)',
          boxShadow: 'var(--hw-shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            height: '50px',
            padding: '0 20px',
            borderBottom: '1px solid var(--hw-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--hw-bg-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
              Settings & Preferences
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: 'var(--hw-radius-full)',
                backgroundColor: 'var(--hw-surface-elevated)',
                color: 'var(--hw-accent-rose)',
              }}
            >
              v{appVersion} • Production
            </span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(false)}
            style={{
              padding: '6px',
              borderRadius: 'var(--hw-radius-sm)',
              color: 'var(--hw-text-muted)',
              transition: 'all var(--hw-transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hw-surface-subtle)';
              e.currentTarget.style.color = 'var(--hw-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--hw-text-muted)';
            }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Tabs Sidebar */}
          <div
            style={{
              width: '180px',
              backgroundColor: 'var(--hw-bg-primary)',
              borderRight: '1px solid var(--hw-border-subtle)',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {[
              { id: 'appearance' as SettingsTab, label: 'Appearance & Themes', icon: Palette },
              { id: 'camera' as SettingsTab, label: 'Physical Camera', icon: Camera },
              { id: 'gesture' as SettingsTab, label: 'Gesture Tracking', icon: Hand },
              { id: 'virtualCam' as SettingsTab, label: 'Virtual Camera', icon: Layers },
              { id: 'privacy' as SettingsTab, label: 'Privacy & Security', icon: Shield },
              { id: 'updates' as SettingsTab, label: 'Software Updates', icon: RefreshCw },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: 'var(--hw-radius-sm)',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isSelected ? 'var(--hw-surface-elevated)' : 'transparent',
                    color: isSelected ? 'var(--hw-text-primary)' : 'var(--hw-text-secondary)',
                    border: isSelected ? '1px solid var(--hw-border-focus)' : '1px solid transparent',
                    textAlign: 'left',
                    transition: 'all var(--hw-transition-fast)',
                  }}
                >
                  <Icon size={14} strokeWidth={isSelected ? 2 : 1.6} color={isSelected ? 'var(--hw-accent-rose)' : undefined} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content Pane */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {activeTab === 'appearance' && (
              <>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                      Workspace Aesthetic & Themes
                    </h4>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--hw-text-muted)',
                      }}
                    >
                      Instant Zero-Lag Switch
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)', marginBottom: '14px' }}>
                    Choose a tailored visual theme for your stream, gaming session, or professional workspace. Video and camera streams are uninterrupted during switching.
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                    }}
                  >
                    {THEMES.map((theme) => {
                      const isSelected = currentTheme === theme.id;
                      return (
                        <div
                          key={theme.id}
                          onClick={() => setTheme(theme.id)}
                          style={{
                            padding: '14px',
                            borderRadius: 'var(--hw-radius-md)',
                            backgroundColor: isSelected ? 'var(--hw-surface-elevated)' : 'var(--hw-bg-primary)',
                            border: isSelected
                              ? '1.5px solid var(--hw-accent-primary)'
                              : '1px solid var(--hw-border-subtle)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            transition: 'all var(--hw-transition-fast)',
                            boxShadow: isSelected ? 'var(--hw-shadow-accent)' : 'none',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = 'var(--hw-border-medium)';
                              e.currentTarget.style.backgroundColor = 'var(--hw-surface-subtle)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = 'var(--hw-border-subtle)';
                              e.currentTarget.style.backgroundColor = 'var(--hw-bg-primary)';
                            }
                          }}
                        >
                          {/* Top Row: Palette Swatches & Badges */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  backgroundColor: theme.previewColor,
                                  boxShadow: `0 0 8px ${theme.previewColor}66`,
                                  display: 'inline-block',
                                }}
                              />
                              <span
                                style={{
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  backgroundColor: theme.accentColor,
                                  display: 'inline-block',
                                }}
                              />
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: theme.bgPreview,
                                  border: '1px solid var(--hw-border-medium)',
                                  display: 'inline-block',
                                }}
                              />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {theme.badge && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                    borderRadius: 'var(--hw-radius-xs)',
                                    backgroundColor: 'var(--hw-surface-subtle)',
                                    color: 'var(--hw-text-secondary)',
                                  }}
                                >
                                  {theme.badge}
                                </span>
                              )}
                              {isSelected && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 'var(--hw-radius-full)',
                                    backgroundColor: 'var(--hw-accent-primary)',
                                    color: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  <Check size={10} strokeWidth={3} />
                                  Active
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Theme Title & Tagline */}
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--hw-text-primary)', marginBottom: '2px' }}>
                              {theme.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--hw-accent-rose)', fontWeight: 500 }}>
                              {theme.tagline}
                            </div>
                          </div>

                          {/* Description */}
                          <div style={{ fontSize: '11px', color: 'var(--hw-text-muted)', lineHeight: 1.4 }}>
                            {theme.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Typography Font Selector */}
                <div style={{ borderTop: '1px solid var(--hw-border-subtle)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                      Interface Typography & Font
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--hw-text-muted)' }}>
                      App-Wide Typography
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)', marginBottom: '12px' }}>
                    Applies cleanly across all menus, buttons, sliders, inspector panels, and HUD telemetry without altering the brand title.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {FONTS.map((font) => {
                      const isSelected = currentFont === font.id;
                      return (
                        <div
                          key={font.id}
                          onClick={() => setFont(font.id)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--hw-radius-sm)',
                            backgroundColor: isSelected ? 'var(--hw-surface-elevated)' : 'var(--hw-bg-primary)',
                            border: isSelected ? '1.5px solid var(--hw-accent-primary)' : '1px solid var(--hw-border-subtle)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            transition: 'all var(--hw-transition-fast)',
                            boxShadow: isSelected ? 'var(--hw-shadow-accent)' : 'none',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = 'var(--hw-border-medium)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = 'var(--hw-border-subtle)';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: font.family, fontSize: '13px', fontWeight: 700, color: 'var(--hw-text-primary)' }}>
                              {font.name}
                            </span>
                            {isSelected && (
                              <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: 'var(--hw-radius-full)', backgroundColor: 'var(--hw-accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Check size={9} strokeWidth={3} />
                                Active
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '10px', color: 'var(--hw-accent-rose)', fontWeight: 500 }}>
                            {font.category}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--hw-text-muted)', lineHeight: 1.3 }}>
                            {font.description}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Preview Accent Preview bar */}
                <div
                  style={{
                    borderTop: '1px solid var(--hw-border-subtle)',
                    paddingTop: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--hw-text-primary)', marginBottom: '2px' }}>
                      Current Active Theme: {THEMES.find((t) => t.id === currentTheme)?.name}
                    </h5>
                    <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)' }}>
                      Color tokens and UI styling update synchronously across all panels and HUD overlays.
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--hw-radius-sm)',
                      backgroundColor: 'var(--hw-surface-elevated)',
                      border: '1px solid var(--hw-border-subtle)',
                      fontSize: '11px',
                      color: 'var(--hw-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Sparkles size={12} color="var(--hw-accent-rose)" />
                    Hardware-Accelerated
                  </div>
                </div>
              </>
            )}

            {activeTab === 'camera' && (
              <>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)', marginBottom: '4px' }}>
                    Active Webcam Device
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)', marginBottom: '10px' }}>
                    Select the physical camera sensor to stream from.
                  </p>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => selectDevice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--hw-surface-elevated)',
                      border: '1px solid var(--hw-border-subtle)',
                      borderRadius: 'var(--hw-radius-sm)',
                      color: 'var(--hw-text-primary)',
                      fontSize: '12px',
                      marginBottom: '14px',
                    }}
                  >
                    {availableDevices.map((d) => (
                      <option key={d.id} value={d.id} style={{ backgroundColor: 'var(--hw-bg-secondary)', color: 'var(--hw-text-primary)' }}>
                        {d.label}
                      </option>
                    ))}
                    {availableDevices.length === 0 && (
                      <option value="" style={{ backgroundColor: 'var(--hw-bg-secondary)', color: 'var(--hw-text-primary)' }}>
                        No cameras detected
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)', marginBottom: '4px' }}>
                    Capture Resolution
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)', marginBottom: '10px' }}>
                    Select preferred capture stream resolution. Actual capability depends on connected webcam.
                  </p>
                  <select
                    value={selectedResolution.id}
                    onChange={(e) => {
                      const found = RESOLUTION_PRESETS.find((r) => r.id === e.target.value);
                      if (found) selectResolution(found);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--hw-surface-elevated)',
                      border: '1px solid var(--hw-border-subtle)',
                      borderRadius: 'var(--hw-radius-sm)',
                      color: 'var(--hw-text-primary)',
                      fontSize: '12px',
                    }}
                  >
                    {RESOLUTION_PRESETS.map((res) => (
                      <option key={res.id} value={res.id} style={{ backgroundColor: 'var(--hw-bg-secondary)', color: 'var(--hw-text-primary)' }}>
                        {res.label} ({res.width}x{res.height} @ {res.fps}fps)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ borderTop: '1px solid var(--hw-border-subtle)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                        Mirror Horizontal
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)' }}>
                        Flips preview feed horizontally for natural mirror behavior.
                      </p>
                    </div>
                    <button
                      onClick={toggleMirror}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--hw-radius-sm)',
                        backgroundColor: isMirrored ? 'var(--hw-accent-burgundy)' : 'var(--hw-surface-elevated)',
                        color: isMirrored ? 'var(--hw-accent-rose)' : 'var(--hw-text-secondary)',
                        border: '1px solid var(--hw-border-subtle)',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {isMirrored ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>

                {/* Smartphone Wireless Camera Remote Freedom Controls */}
                <div style={{ borderTop: '1px solid var(--hw-border-subtle)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Smartphone size={16} color="var(--hw-accent-rose)" />
                      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                        Smartphone Camera Controls
                      </h4>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: 'var(--hw-radius-full)',
                        backgroundColor: isMobileConnected ? 'rgba(52, 199, 89, 0.15)' : 'var(--hw-surface-elevated)',
                        color: isMobileConnected ? '#34c759' : 'var(--hw-text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {isMobileConnected ? `📱 ${mobileDeviceName || 'Phone Active'}` : 'Standby / QR Ready'}
                    </span>
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)', marginBottom: '12px' }}>
                    Control your phone camera hardware remotely: switch between rear & selfie lens, toggle the flash, and adjust zoom.
                  </p>

                  {/* Orientation Lock Warning Banner */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: 'var(--hw-radius-sm)',
                      backgroundColor: 'rgba(255, 149, 0, 0.1)',
                      border: '1px solid rgba(255, 149, 0, 0.25)',
                      marginBottom: '12px',
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>🔄</span>
                    <span style={{ fontSize: '11px', color: '#ffb340', lineHeight: 1.4 }}>
                      <strong>Landscape Tip:</strong> Turn <strong>OFF Auto-Rotate Lock</strong> on your phone and hold it horizontally to stream in widescreen 16:9 landscape!
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
                    {/* Camera Lens Switcher */}
                    <div
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--hw-radius-sm)',
                        backgroundColor: 'var(--hw-surface-elevated)',
                        border: '1px solid var(--hw-border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                          Camera Lens
                        </span>
                        <SwitchCamera size={13} color="var(--hw-accent-rose)" />
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => switchMobileLens('environment')}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            borderRadius: 'var(--hw-radius-xs)',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: mobileLens === 'environment' ? 'var(--hw-accent-rose)' : 'var(--hw-bg-primary)',
                            color: mobileLens === 'environment' ? '#fff' : 'var(--hw-text-secondary)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          📸 Rear
                        </button>
                        <button
                          onClick={() => switchMobileLens('user')}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            borderRadius: 'var(--hw-radius-xs)',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: mobileLens === 'user' ? 'var(--hw-accent-rose)' : 'var(--hw-bg-primary)',
                            color: mobileLens === 'user' ? '#fff' : 'var(--hw-text-secondary)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          🤳 Selfie
                        </button>
                      </div>
                    </div>

                    {/* Flashlight / Torch Toggle */}
                    <div
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--hw-radius-sm)',
                        backgroundColor: 'var(--hw-surface-elevated)',
                        border: '1px solid var(--hw-border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                          Flash / Torch
                        </span>
                        <Zap size={13} fill={mobileTorch ? '#FFCC00' : 'none'} color={mobileTorch ? '#FFCC00' : 'var(--hw-text-muted)'} />
                      </div>
                      <button
                        onClick={toggleMobileTorch}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--hw-radius-xs)',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: mobileTorch ? 'rgba(255, 204, 0, 0.25)' : 'var(--hw-bg-primary)',
                          color: mobileTorch ? '#FFCC00' : 'var(--hw-text-secondary)',
                          border: mobileTorch ? '1px solid #FFCC00' : '1px solid var(--hw-border-subtle)',
                          cursor: 'pointer',
                        }}
                      >
                        {mobileTorch ? '⚡ Flashlight ON' : 'Turn Flashlight ON'}
                      </button>
                    </div>
                  </div>

                  {/* Hardware Zoom Control */}
                  <div
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--hw-radius-sm)',
                      backgroundColor: 'var(--hw-surface-elevated)',
                      border: '1px solid var(--hw-border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ZoomIn size={13} color="var(--hw-accent-rose)" />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                          Camera Zoom: <strong style={{ color: 'var(--hw-accent-rose)' }}>{mobileZoom.toFixed(1)}x</strong>
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 1.5, 2, 3].map((z) => (
                          <button
                            key={z}
                            onClick={() => setMobileZoom(z)}
                            style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--hw-radius-xs)',
                              backgroundColor: Math.abs(mobileZoom - z) < 0.1 ? 'var(--hw-accent-rose)' : 'var(--hw-bg-primary)',
                              color: Math.abs(mobileZoom - z) < 0.1 ? '#fff' : 'var(--hw-text-secondary)',
                              border: 'none',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {z}x
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={mobileMinZoom || 1}
                      max={mobileMaxZoom || 5}
                      step={0.1}
                      value={mobileZoom}
                      onChange={(e) => setMobileZoom(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        accentColor: 'var(--hw-accent-rose)',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'gesture' && (
              <>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                      Detection Confidence Threshold
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--hw-accent-rose)', fontWeight: 600 }}>
                      {gestureConfidence}%
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)', marginBottom: '10px' }}>
                    Higher values reduce false triggers; lower values make recognition more sensitive.
                  </p>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={gestureConfidence}
                    onChange={(e) => setGestureConfidence(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--hw-accent-primary)' }}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--hw-border-subtle)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                      Gesture Hold Duration
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--hw-accent-champagne)', fontWeight: 600 }}>
                      {gestureHoldDuration}s
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)', marginBottom: '10px' }}>
                    Time in seconds a hand pose must be held steady before activating an effect.
                  </p>
                  <input
                    type="range"
                    min="0.3"
                    max="2.0"
                    step="0.1"
                    value={gestureHoldDuration}
                    onChange={(e) => setGestureHoldDuration(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--hw-accent-champagne)' }}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--hw-border-subtle)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                        Developer Diagnostics Mode
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)' }}>
                        Renders minimal MediaPipe landmark skeletons for debugging. Disabled in normal use.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSkeletonDiagnostics(!showSkeletonDiagnostics)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--hw-radius-sm)',
                        backgroundColor: showSkeletonDiagnostics ? 'var(--hw-accent-burgundy)' : 'var(--hw-surface-elevated)',
                        color: showSkeletonDiagnostics ? 'var(--hw-accent-rose)' : 'var(--hw-text-secondary)',
                        border: '1px solid var(--hw-border-subtle)',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {showSkeletonDiagnostics ? 'Active' : 'Off'}
                    </button>
                  </div>
                </div>

                {/* Phase 7: Procedural Audio Feedback Settings */}
                <div style={{ borderTop: '1px solid var(--hw-border-subtle)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isSoundEnabled ? <Volume2 size={14} color="var(--hw-accent-rose)" /> : <VolumeX size={14} color="var(--hw-text-muted)" />}
                        Gesture Sound Feedback
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)' }}>
                        Plays procedural harmonic chimes when gestures successfully trigger effects.
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => soundEngine.playHeartChime()}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--hw-radius-sm)',
                          backgroundColor: 'var(--hw-surface-elevated)',
                          border: '1px solid var(--hw-border-subtle)',
                          fontSize: '10px',
                          color: 'var(--hw-text-secondary)',
                        }}
                      >
                        Test Sound
                      </button>
                      <button
                        onClick={() => setSoundEnabled(!isSoundEnabled)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 'var(--hw-radius-sm)',
                          backgroundColor: isSoundEnabled ? 'var(--hw-accent-primary)' : 'var(--hw-surface-elevated)',
                          color: isSoundEnabled ? '#FFFFFF' : 'var(--hw-text-secondary)',
                          border: '1px solid var(--hw-border-subtle)',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {isSoundEnabled ? 'Enabled' : 'Muted'}
                      </button>
                    </div>
                  </div>

                  {isSoundEnabled && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--hw-text-muted)' }}>Chime Volume</span>
                        <span style={{ fontSize: '11px', color: 'var(--hw-accent-rose)', fontWeight: 600 }}>{soundVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        value={soundVolume}
                        onChange={(e) => setSoundVolume(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--hw-accent-primary)' }}
                      />
                    </div>
                  )}
                </div>

                {/* Phase 7: Global Windows Hotkeys Reference */}
                <div style={{ borderTop: '1px solid var(--hw-border-subtle)', paddingTop: '14px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Keyboard size={14} color="var(--hw-accent-rose)" />
                    Global Windows Shortcuts
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)', marginBottom: '10px' }}>
                    Control HeartWave from any window while gaming or streaming in OBS:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {[
                      { key: 'Ctrl + Shift + P', label: 'Privacy Shutter' },
                      { key: 'Ctrl + Shift + B', label: 'Bypass Effects' },
                      { key: 'Ctrl + Shift + V', label: 'Virtual Camera' },
                      { key: 'Ctrl + Shift + M', label: 'Mirror Horizontal' },
                    ].map((hk) => (
                      <div
                        key={hk.key}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 'var(--hw-radius-sm)',
                          backgroundColor: 'var(--hw-surface-elevated)',
                          border: '1px solid var(--hw-border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                        }}
                      >
                        <span style={{ color: 'var(--hw-text-secondary)' }}>{hk.label}</span>
                        <kbd
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            backgroundColor: 'var(--hw-bg-primary)',
                            padding: '2px 6px',
                            borderRadius: 'var(--hw-radius-xs)',
                            border: '1px solid var(--hw-border-subtle)',
                            color: 'var(--hw-accent-rose)',
                          }}
                        >
                          {hk.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'virtualCam' && (
              <>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--hw-radius-md)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid var(--hw-accent-primary)',
                    display: 'flex',
                    gap: '10px',
                  }}
                >
                  <CheckCircle2 size={18} color="var(--hw-accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--hw-accent-primary)', marginBottom: '2px' }}>
                      Standalone DirectShow Virtual Camera & System Tray Active
                    </h5>
                    <p style={{ fontSize: '11px', color: 'var(--hw-text-secondary)', lineHeight: 1.4 }}>
                      HeartWave broadcasts a high-speed shared memory video pipeline directly to Windows capture apps (OBS Studio, Discord, Chrome). When minimized, HeartWave runs in the background System Tray without dropping frames.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)', marginBottom: '8px' }}>
                    Target Application Compatibility
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['Discord Desktop', 'Google Meet / Chrome', 'OBS Studio', 'WhatsApp Desktop'].map((app) => (
                      <div
                        key={app}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 'var(--hw-radius-sm)',
                          backgroundColor: 'var(--hw-surface-elevated)',
                          border: '1px solid var(--hw-border-subtle)',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ color: 'var(--hw-text-primary)' }}>{app}</span>
                        <span style={{ fontSize: '11px', color: 'var(--hw-accent-rose)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> Target Ready
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'privacy' && (
              <>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--hw-radius-md)',
                    backgroundColor: 'var(--hw-surface-elevated)',
                    border: '1px solid var(--hw-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={18} color="var(--hw-accent-rose)" />
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                      100% On-Device Processing Guarantee
                    </h4>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--hw-text-secondary)', lineHeight: 1.6 }}>
                    Heartwave performs all video processing, hand landmark estimation, and effect compositing strictly within your local machine.
                  </p>
                  <ul style={{ fontSize: '11px', color: 'var(--hw-text-muted)', lineHeight: 1.8, paddingLeft: '18px' }}>
                    <li>No video frames or camera feeds are uploaded to cloud servers.</li>
                    <li>No biometric or hand landmark data is ever stored on disk or transmitted.</li>
                    <li>No user accounts, subscriptions, or telemetry trackers are required.</li>
                    <li>Camera resources are fully released the instant capture is stopped or Heartwave exits.</li>
                  </ul>
                </div>
              </>
            )}

            {activeTab === 'updates' && (
              <>
                {/* Software Version & Status Card */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--hw-radius-md)',
                    backgroundColor: 'var(--hw-surface-elevated)',
                    border: '1px solid var(--hw-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--hw-bg-primary)',
                          border: '1px solid var(--hw-border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <RefreshCw size={18} color="var(--hw-accent-rose)" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                          HeartWave Virtual Camera
                        </h4>
                        <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)' }}>
                          Installed: <strong style={{ color: 'var(--hw-text-primary)' }}>v{appVersion}</strong> • Windows 64-bit
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckUpdates}
                      disabled={isCheckingManual || updateStatus.state === 'downloading'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: 'var(--hw-radius-sm)',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: isCheckingManual ? 'var(--hw-surface-subtle)' : 'var(--hw-accent-rose)',
                        color: isCheckingManual ? 'var(--hw-text-muted)' : '#ffffff',
                        border: 'none',
                        cursor: isCheckingManual ? 'not-allowed' : 'pointer',
                        transition: 'all var(--hw-transition-fast)',
                      }}
                    >
                      <RefreshCw
                        size={12}
                        style={{
                          animation: isCheckingManual ? 'spin 1s linear infinite' : 'none',
                        }}
                      />
                      {isCheckingManual ? 'Checking...' : 'Check for Updates'}
                    </button>
                  </div>

                  {/* Status Indicator Box */}
                  {updateStatus.state === 'downloaded' && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--hw-radius-sm)',
                        backgroundColor: 'rgba(52, 199, 89, 0.12)',
                        border: '1px solid rgba(52, 199, 89, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} color="#34c759" />
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: '#34c759' }}>
                            Update Ready! (v{updateStatus.version})
                          </p>
                          <p style={{ fontSize: '11px', color: 'var(--hw-text-secondary)' }}>
                            Downloaded and verified. Restart to apply update immediately.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleInstallUpdate}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: 'var(--hw-radius-sm)',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#34c759',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Download size={12} /> Restart & Install
                      </button>
                    </div>
                  )}

                  {updateStatus.state === 'downloading' && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--hw-radius-sm)',
                        backgroundColor: 'var(--hw-bg-primary)',
                        border: '1px solid var(--hw-border-focus)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: 'var(--hw-text-primary)', fontWeight: 600 }}>
                          Downloading Update v{updateStatus.version || ''}...
                        </span>
                        <span style={{ color: 'var(--hw-accent-rose)' }}>{updateStatus.percent || 0}%</span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: 'var(--hw-surface-subtle)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${updateStatus.percent || 0}%`,
                            height: '100%',
                            backgroundColor: 'var(--hw-accent-rose)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {updateStatus.state === 'available' && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--hw-radius-sm)',
                        backgroundColor: 'var(--hw-surface-subtle)',
                        border: '1px solid var(--hw-border-subtle)',
                        fontSize: '11px',
                        color: 'var(--hw-accent-rose)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <ArrowUpCircle size={14} />
                      <span>New version found (v{updateStatus.version}). Starting background download...</span>
                    </div>
                  )}

                  {updateStatus.state === 'not-available' && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--hw-radius-sm)',
                        backgroundColor: 'rgba(52, 199, 89, 0.08)',
                        border: '1px solid rgba(52, 199, 89, 0.25)',
                        fontSize: '11px',
                        color: 'var(--hw-text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={14} color="#34c759" />
                      <span>{updateStatus.message || 'You have the latest version installed.'}</span>
                    </div>
                  )}

                  {updateStatus.state === 'error' && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--hw-radius-sm)',
                        backgroundColor: 'rgba(255, 69, 58, 0.08)',
                        border: '1px solid rgba(255, 69, 58, 0.25)',
                        fontSize: '11px',
                        color: 'var(--hw-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertCircle size={14} color="var(--hw-accent-rose)" />
                      <span>{updateStatus.message || 'Unable to reach update server.'}</span>
                    </div>
                  )}

                  {updateStatus.state === 'idle' && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--hw-text-muted)',
                        lineHeight: 1.5,
                      }}
                    >
                      HeartWave automatically checks for updates in the background on startup. When an update is ready, you will be notified to restart.
                    </div>
                  )}
                </div>

                {/* Over-The-Air Architecture Overview */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--hw-radius-md)',
                    backgroundColor: 'var(--hw-bg-primary)',
                    border: '1px solid var(--hw-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
                    Automatic Release Delivery
                  </h5>
                  <ul style={{ fontSize: '11px', color: 'var(--hw-text-muted)', lineHeight: 1.8, paddingLeft: '18px' }}>
                    <li>Updates are securely published via GitHub Releases with SHA-512 verification.</li>
                    <li>Zero-data loss: all theme preferences, device selections, and custom hotkeys remain preserved.</li>
                    <li>Differential delta downloads only fetch updated components to save bandwidth.</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
