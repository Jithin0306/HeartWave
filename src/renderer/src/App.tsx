import React, { useEffect } from 'react';
import { TitleBar } from './components/titlebar/TitleBar';
import { NavigationSidebar } from './components/navigation/NavigationSidebar';
import { CameraPreviewViewport } from './components/preview/CameraPreviewViewport';
import { EffectsLibrary } from './components/effects/EffectsLibrary';
import { StreamerHub } from './components/streamer/StreamerHub';
import { SettingsModal } from './components/settings/SettingsModal';
import { MobileCamModal } from './components/mobile/MobileCamModal';
import { useAppStore } from './store/appStore';

export const App: React.FC = () => {
  const { activeNav, togglePrivacyShutter, toggleBypass, toggleVirtualOutput, toggleMirror } = useAppStore();

  useEffect(() => {
    if (!window.heartwaveApi) return;

    const unsubs = [
      window.heartwaveApi.onHotkeyPrivacy?.(() => togglePrivacyShutter()),
      window.heartwaveApi.onHotkeyBypass?.(() => toggleBypass()),
      window.heartwaveApi.onHotkeyVirtualOutput?.(() => toggleVirtualOutput()),
      window.heartwaveApi.onHotkeyMirror?.(() => toggleMirror()),
    ].filter(Boolean) as (() => void)[];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [togglePrivacyShutter, toggleBypass, toggleVirtualOutput, toggleMirror]);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--hw-bg-primary)',
      }}
    >
      {/* Seamless Window Title Bar */}
      <TitleBar />

      {/* Main Workspace */}
      <main
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Left Navigation Rail */}
        <NavigationSidebar />

        {/* Central Camera Viewport */}
        <CameraPreviewViewport />

        {/* Right Panel: Curated Effects Library or Dedicated Streamer Hub */}
        {activeNav === 'streamer' ? <StreamerHub /> : <EffectsLibrary />}
      </main>

      {/* Settings & Privacy Modal */}
      <SettingsModal />

      {/* Wireless Mobile Camera QR Modal */}
      <MobileCamModal />
    </div>
  );
};

export default App;
