import React from 'react';
import { TitleBar } from './components/titlebar/TitleBar';
import { NavigationSidebar } from './components/navigation/NavigationSidebar';
import { CameraPreviewViewport } from './components/preview/CameraPreviewViewport';
import { EffectsLibrary } from './components/effects/EffectsLibrary';
import { SettingsModal } from './components/settings/SettingsModal';

export const App: React.FC = () => {
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

        {/* Right Curated Effects Library */}
        <EffectsLibrary />
      </main>

      {/* Settings & Privacy Modal */}
      <SettingsModal />
    </div>
  );
};

export default App;
