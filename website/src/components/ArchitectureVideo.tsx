import React, { useState } from 'react';
import { Cpu, Zap, Layers, Sparkles, Smartphone, Shield, Clock, Maximize2 } from 'lucide-react';

export const ArchitectureVideo: React.FC = () => {
  const [activeDiagram, setActiveDiagram] = useState<'neon' | 'gold'>('neon');
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <section id="architecture" className="relative py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="editorial-eyebrow mb-3">System Blueprint</span>
          <h2 className="font-serif text-4xl sm:text-5xl text-hw-sand mt-2">
            The ultra-low-latency native pipeline.
          </h2>
        </div>
        <p className="text-sm text-hw-stone max-w-md leading-relaxed">
          How Heartwave fuses local WebAssembly AI, zero-copy Rust shared memory, and a custom DirectShow driver
          to achieve <span className="text-hw-sand font-medium">zero audio/video delay</span> with only 56 MB of RAM.
        </p>
      </div>

      {/* Style Switcher */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveDiagram('neon')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all ${
            activeDiagram === 'neon'
              ? 'bg-hw-rose text-white shadow-lg shadow-hw-rose/25'
              : 'text-hw-stone hover:text-hw-sand bg-white/[0.03] border border-white/10'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Cyber Studio Pipeline
        </button>
        <button
          onClick={() => setActiveDiagram('gold')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all ${
            activeDiagram === 'gold'
              ? 'bg-hw-champagne text-black font-bold shadow-lg shadow-hw-champagne/25'
              : 'text-hw-stone hover:text-hw-sand bg-white/[0.03] border border-white/10'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> 3D Isometric Blueprint
        </button>
      </div>

      {/* High-Resolution Diagram Frame */}
      <div className="relative rounded-2xl p-2 bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 shadow-2xl mb-8">
        <div className="relative rounded-xl overflow-hidden bg-atelier-canvas border border-white/10">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-atelier-surface/90 border-b border-white/10">
            <div className="flex items-center gap-2 font-mono text-xs text-hw-sand">
              <span className="w-2 h-2 rounded-full bg-hw-rose animate-pulse" />
              <span>
                {activeDiagram === 'neon'
                  ? 'Real-Time Video Enhancement & Sound Synthesis Pipeline'
                  : 'Heartwave System Architecture — 3D Hardware Spec'}
              </span>
            </div>

            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-1 rounded text-hw-stone hover:text-hw-sand transition-colors"
              title="Toggle Zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Diagram Display */}
          <div className="relative w-full overflow-hidden bg-atelier-canvas flex items-center justify-center p-2 sm:p-4">
            <img
              src={activeDiagram === 'neon' ? '/assets/pipeline-diagram.jpg' : '/assets/architecture-infographic.jpg'}
              alt="Heartwave System Architecture Diagram"
              className={`w-full h-auto object-contain rounded-lg transition-all duration-500 ${
                isZoomed ? 'scale-105 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            />
          </div>

          {/* Bottom Breadcrumbs */}
          <div className="px-4 py-2.5 bg-atelier-surface/95 border-t border-white/10 flex flex-wrap items-center justify-between text-xs font-mono text-hw-stone">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-hw-sand">1. Input Ingestion</span>
              <span>&rarr;</span>
              <span className="text-hw-rose">2. MediaPipe WASM</span>
              <span>&rarr;</span>
              <span className="text-hw-champagne">3. 3D Compositor</span>
              <span>&rarr;</span>
              <span className="text-purple-400">4. Rust Ring Buffer</span>
              <span>&rarr;</span>
              <span className="text-hw-emerald">5. DirectShow Virtual Cam</span>
              <span>&rarr;</span>
              <span className="text-hw-sand font-bold">6. OBS & Discord</span>
            </div>

            <div className="text-[11px] text-hw-muted">
              Click image to {isZoomed ? 'reset view' : 'zoom'}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Architectural Spec Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="atelier-card p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-hw-emerald/10 text-hw-emerald border border-hw-emerald/20">
                <Clock className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono text-hw-emerald">0ms Playout Delay</span>
            </div>
            <h4 className="font-serif text-xl text-hw-sand mb-1">DirectShow Clock Sync</h4>
            <p className="text-xs text-hw-stone leading-relaxed">
              Every video sample is stamped directly against the Windows reference clock, collapsing WebRTC de-jitter buffers to 0ms.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-white/5 text-[11px] font-mono text-hw-emerald">
            Lip-Sync Guaranteed
          </div>
        </div>

        <div className="atelier-card p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Cpu className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono text-purple-400">56 MB RAM</span>
            </div>
            <h4 className="font-serif text-xl text-hw-sand mb-1">Native Rust 2024 Core</h4>
            <p className="text-xs text-hw-stone leading-relaxed">
              Triple-buffered memory mapped file (MMF) IPC bridge. Uses under 3% CPU and leaves your encoder free for high-bitrate streaming.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-white/5 text-[11px] font-mono text-purple-400">
            10x Lighter than Electron
          </div>
        </div>

        <div className="atelier-card p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-hw-rose/10 text-hw-rose border border-hw-rose/20">
                <Shield className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono text-hw-rose">100% Offline</span>
            </div>
            <h4 className="font-serif text-xl text-hw-sand mb-1">Local MediaPipe Vision</h4>
            <p className="text-xs text-hw-stone leading-relaxed">
              MediaPipe runs in local WebAssembly threads. 21-point hand tracking and portrait bokeh execute with zero cloud telemetry.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-white/5 text-[11px] font-mono text-hw-rose">
            0.8ms Inference Latency
          </div>
        </div>

        <div className="atelier-card p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-lg bg-hw-champagne/10 text-hw-champagne border border-hw-champagne/20">
                <Smartphone className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono text-hw-champagne">Zero Install</span>
            </div>
            <h4 className="font-serif text-xl text-hw-sand mb-1">Wireless Mobile Cam</h4>
            <p className="text-xs text-hw-stone leading-relaxed">
              Scan the on-screen QR code to pair your smartphone over local Wi-Fi with front/rear lens switching and optical zoom controls.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-white/5 text-[11px] font-mono text-hw-champagne">
            1080p60 WebRTC Stream
          </div>
        </div>
      </div>
    </section>
  );
};
