import React from 'react';
import { Github, ExternalLink } from 'lucide-react';
import { useGitHubRelease } from '../hooks/useGitHubRelease';

export const Footer: React.FC = () => {
  const { version, htmlUrl } = useGitHubRelease();

  return (
    <footer className="border-t border-white/[0.08] bg-atelier-canvas py-16 px-4 sm:px-8 text-xs text-hw-stone">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand identity */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-3">
            <img src="/assets/logo-icon.png" alt="Heartwave" className="w-5 h-5 object-contain" />
            <span className="font-serif text-2xl tracking-tight text-hw-sand">Heartwave</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-hw-champagne">
              {version}
            </span>
          </div>
          <p className="text-hw-muted text-center md:text-left max-w-sm text-xs leading-relaxed">
            Gesture-controlled virtual camera platform with studio DSLR optics, 3D hand tracking, and 0ms reference clock sync.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
          <a
            href="https://github.com/Jithin0306/HeartWave"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-hw-sand transition-colors flex items-center gap-1.5"
          >
            <Github className="w-3.5 h-3.5" /> Source
          </a>
          <a
            href={htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-hw-sand transition-colors flex items-center gap-1.5"
          >
            Releases <ExternalLink className="w-3 h-3 text-hw-muted" />
          </a>
          <a
            href="https://github.com/Jithin0306/HeartWave/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-hw-sand transition-colors"
          >
            MIT License
          </a>
          <a
            href="https://github.com/Jithin0306/HeartWave/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-hw-sand transition-colors text-hw-rose font-semibold"
          >
            Download {version}
          </a>
        </div>

        {/* Colophon */}
        <div className="flex flex-col items-center md:items-end gap-1.5 text-[11px] font-mono">
          <span className="text-hw-muted">Free & Open Source forever under MIT</span>
        </div>
      </div>
    </footer>
  );
};
