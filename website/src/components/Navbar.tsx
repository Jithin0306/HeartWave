import React, { useState, useEffect } from 'react';
import { Download, Github, Menu, X, Camera, Sparkles, Layers, Cpu } from 'lucide-react';
import { useGitHubRelease } from '../hooks/useGitHubRelease';
import { useOSDetect } from '../hooks/useOSDetect';

export const Navbar: React.FC = () => {
  const { version, recommendedAsset } = useGitHubRelease();
  const { os } = useOSDetect();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeDownload = recommendedAsset[os === 'mobile' ? 'windows' : os];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-8 py-4 transition-all duration-300">
      <nav
        className={`w-full max-w-6xl flex items-center justify-between px-6 py-3.5 rounded-2xl transition-all duration-300 ${
          scrolled
            ? 'atelier-surface border-white/[0.08] shadow-2xl shadow-black/80'
            : 'bg-transparent border border-transparent'
        }`}
      >
        {/* Brand Identity */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-atelier-surface border border-white/10 overflow-hidden group-hover:border-hw-rose/50 transition-colors">
            <img src="/assets/logo-icon.png" alt="Heartwave" className="w-6 h-6 object-contain" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl tracking-tight text-hw-sand font-normal">
              Heartwave
            </span>
            <span className="text-[10px] font-mono tracking-widest text-hw-champagne/90 uppercase">
              {version}
            </span>
          </div>
        </a>

        {/* Editorial Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-xs tracking-wide">
          <a
            href="#optics"
            className="text-hw-stone hover:text-hw-sand transition-colors font-medium"
          >
            DSLR Optics
          </a>
          <a
            href="#gestures"
            className="text-hw-stone hover:text-hw-sand transition-colors font-medium flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-hw-rose" />
            Gestures
          </a>
          <a
            href="#architecture"
            className="text-hw-stone hover:text-hw-sand transition-colors font-medium flex items-center gap-1.5"
          >
            <Layers className="w-3 h-3 text-hw-champagne" />
            Architecture
          </a>
          <a
            href="#performance"
            className="text-hw-stone hover:text-hw-sand transition-colors font-medium"
          >
            56MB Rust Core
          </a>
          <a
            href="#obs-guide"
            className="text-hw-stone hover:text-hw-sand transition-colors font-medium"
          >
            OBS Setup
          </a>
          <a
            href="#downloads"
            className="text-hw-stone hover:text-hw-sand transition-colors font-medium"
          >
            Platforms
          </a>
        </div>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://github.com/Jithin0306/HeartWave"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-hw-stone hover:text-hw-sand bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-all"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Source</span>
          </a>

          <a
            href={activeDownload?.downloadUrl || '#downloads'}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-hw-rose hover:bg-hw-rose-hover rounded-xl shadow-lg shadow-hw-rose/20 transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-hw-stone hover:text-white bg-white/5 rounded-xl border border-white/10"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-4 top-20 atelier-surface p-6 rounded-2xl border-white/15 bg-atelier-surface/95 backdrop-blur-2xl flex flex-col gap-4 shadow-2xl">
          <a
            href="#optics"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm text-hw-sand hover:text-white py-1"
          >
            DSLR Optics
          </a>
          <a
            href="#gestures"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm text-hw-sand hover:text-white py-1 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-hw-rose" /> Gestures
          </a>
          <a
            href="#architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm text-hw-sand hover:text-white py-1 flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-hw-champagne" /> Architecture
          </a>
          <a
            href="#performance"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm text-hw-sand hover:text-white py-1"
          >
            56MB Rust Core
          </a>
          <a
            href="#downloads"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm text-hw-sand hover:text-white py-1"
          >
            All Platforms
          </a>
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <a
              href={activeDownload?.downloadUrl || '#downloads'}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-white bg-hw-rose rounded-xl"
            >
              <Download className="w-4 h-4" /> Download for Free ({version})
            </a>
            <a
              href="https://github.com/Jithin0306/HeartWave"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-hw-stone bg-white/5 rounded-xl border border-white/10"
            >
              <Github className="w-4 h-4" /> GitHub Repository
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
