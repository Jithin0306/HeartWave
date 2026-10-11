import React, { useState } from 'react';
import { X, Camera, Hand, Layers, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore, RESOLUTION_PRESETS } from '../../store/appStore';

type SettingsTab = 'camera' | 'gesture' | 'virtualCam' | 'privacy';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    selectedResolution,
    setSelectedResolution,
    isMirrored,
    toggleMirror,
    virtualCameraStatus,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('camera');
  const [gestureConfidence, setGestureConfidence] = useState(75);
  const [holdDuration, setHoldDuration] = useState(0.8);
  const [showSkeletonDiagnostics, setShowSkeletonDiagnostics] = useState(false);

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
              Phase 1 Preview
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
              { id: 'camera' as SettingsTab, label: 'Physical Camera', icon: Camera },
              { id: 'gesture' as SettingsTab, label: 'Gesture Tracking', icon: Hand },
              { id: 'virtualCam' as SettingsTab, label: 'Virtual Camera', icon: Layers },
              { id: 'privacy' as SettingsTab, label: 'Privacy & Security', icon: Shield },
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
                    border: isSelected ? '1px solid var(--hw-accent-burgundy)' : '1px solid transparent',
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
            {activeTab === 'camera' && (
              <>
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
                      if (found) setSelectedResolution(found);
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
                      <option key={res.id} value={res.id} style={{ background: '#1D1918' }}>
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
                      {holdDuration}s
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
                    value={holdDuration}
                    onChange={(e) => setHoldDuration(Number(e.target.value))}
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
              </>
            )}

            {activeTab === 'virtualCam' && (
              <>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--hw-radius-md)',
                    backgroundColor: 'rgba(214, 189, 145, 0.1)',
                    border: '1px solid var(--hw-accent-champagne)',
                    display: 'flex',
                    gap: '10px',
                  }}
                >
                  <AlertCircle size={18} color="var(--hw-accent-champagne)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--hw-accent-champagne)', marginBottom: '2px' }}>
                      Native Windows Media Foundation Driver (Status: {virtualCameraStatus.toUpperCase()})
                    </h5>
                    <p style={{ fontSize: '11px', color: 'var(--hw-text-secondary)', lineHeight: 1.4 }}>
                      The virtual camera device will be registered as a native Windows video capture source in Phase Six using C++ and <code>MFCreateVirtualCamera</code>.
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
          </div>
        </div>
      </div>
    </div>
  );
};
