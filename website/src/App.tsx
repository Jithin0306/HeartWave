import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ArchitectureVideo } from './components/ArchitectureVideo';
import { GestureSandbox } from './components/GestureSandbox';
import { BentoFeatures } from './components/BentoFeatures';
import { PerformanceCompare } from './components/PerformanceCompare';
import { ShortcutsDock } from './components/ShortcutsDock';
import { OBSGuide } from './components/OBSGuide';
import { DownloadMatrix } from './components/DownloadMatrix';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-atelier-canvas text-hw-sand flex flex-col justify-between selection:bg-hw-rose selection:text-white font-sans">
      {/* Warm Ambient Canvas */}
      <div className="fixed inset-0 pointer-events-none -z-20 bg-[#0A0A0C]" />

      {/* Atelier Navigation Header */}
      <Navbar />

      {/* Main Sections */}
      <main className="flex-1">
        {/* 1. Hero with Asymmetrical Viewfinder Studio */}
        <Hero />

        {/* 2. Interactive Gesture Engine & Synthesized Acoustic Chimes */}
        <GestureSandbox />

        {/* 3. DSLR Optics, Lens Dial & Wireless Phone as Cam */}
        <BentoFeatures />

        {/* 4. System Architecture Blueprint */}
        <ArchitectureVideo />

        {/* 5. 56 MB Rust Core Hardware Benchmarks */}
        <PerformanceCompare />

        {/* 6. Tactile Hardware Shortcuts Dock */}
        <ShortcutsDock />

        {/* 7. OBS Studio, Discord & Zoom Integration Guide */}
        <OBSGuide />

        {/* 8. Multi-Platform Releases Matrix (Live GitHub API Sync) */}
        <DownloadMatrix />
      </main>

      {/* Colophon Footer */}
      <Footer />
    </div>
  );
};

export default App;
