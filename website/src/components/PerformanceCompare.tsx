import React from 'react';
import { Cpu, Zap, Shield, HardDrive } from 'lucide-react';

export const PerformanceCompare: React.FC = () => {
  return (
    <section id="performance" className="relative py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="editorial-eyebrow mb-3">Hardware Efficiency</span>
          <h2 className="font-serif text-4xl sm:text-5xl text-hw-sand mt-2">
            Built in Rust to keep your encoder free.
          </h2>
        </div>
        <p className="text-sm text-hw-stone max-w-md leading-relaxed">
          While gaming or broadcasting at high bitrates, your CPU and GPU belong to your stream and game — not your camera software.
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left: Benchmarks Card */}
        <div className="atelier-card p-6 sm:p-8 rounded-2xl flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-hw-stone">
                Active Broadcast Resource Footprint
              </span>
              <span className="text-xs font-mono text-hw-emerald font-bold">10x LIGHTER</span>
            </div>

            {/* Metric 1: RAM Footprint */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span className="text-hw-sand font-medium">RAM Footprint (Working Set)</span>
                <span className="text-hw-muted">Lower is better</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs font-mono text-hw-emerald font-bold">Heartwave</span>
                  <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden p-0.5 border border-white/10">
                    <div className="bg-gradient-to-r from-hw-emerald to-emerald-400 h-full rounded-full w-[11%] flex items-center justify-end pr-2 text-[10px] font-mono text-black font-bold">
                      56 MB
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs font-mono text-hw-stone">Electron Cams</span>
                  <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden p-0.5 border border-white/10">
                    <div className="bg-gradient-to-r from-hw-rose/80 to-hw-rose h-full rounded-full w-[95%] flex items-center justify-end pr-2 text-[10px] font-mono text-white font-bold">
                      520 MB+
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metric 2: CPU Overhead */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span className="text-hw-sand font-medium">CPU Overhead (1080p @ 60 FPS)</span>
                <span className="text-hw-muted">Quad-Core Test</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs font-mono text-hw-champagne font-bold">Heartwave</span>
                  <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden p-0.5 border border-white/10">
                    <div className="bg-gradient-to-r from-hw-champagne to-amber-400 h-full rounded-full w-[12%] flex items-center justify-end pr-2 text-[10px] font-mono text-black font-bold">
                      2.4%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs font-mono text-hw-stone">Generic Virtual</span>
                  <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden p-0.5 border border-white/10">
                    <div className="bg-gradient-to-r from-hw-muted to-stone-500 h-full rounded-full w-[70%] flex items-center justify-end pr-2 text-[10px] font-mono text-white font-bold">
                      24.8%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metric 3: Cold Start */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span className="text-hw-sand font-medium">Cold Start Launch Time</span>
                <span className="text-hw-muted">Instant Boot</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs font-mono text-hw-sand font-bold">Heartwave</span>
                  <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden p-0.5 border border-white/10">
                    <div className="bg-white/80 h-full rounded-full w-[15%] flex items-center justify-end pr-2 text-[10px] font-mono text-black font-bold">
                      0.4s
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs font-mono text-hw-stone">Electron Cams</span>
                  <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden p-0.5 border border-white/10">
                    <div className="bg-hw-muted h-full rounded-full w-[85%] flex items-center justify-end pr-2 text-[10px] font-mono text-white font-bold">
                      4.2s
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-hw-stone">
            <span>Engine Core: <strong className="text-hw-sand">Tauri v2 + Rust 2024</strong></span>
            <span>Zero-Copy: <strong className="text-hw-emerald">Active</strong></span>
          </div>
        </div>

        {/* Right: Technical Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="atelier-card p-6 rounded-xl flex flex-col justify-between">
            <span className="p-2.5 w-fit rounded-lg bg-hw-emerald/10 text-hw-emerald border border-hw-emerald/20 mb-4">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-serif text-xl text-hw-sand mb-1.5">DirectShow IPC Bridge</h4>
              <p className="text-xs text-hw-stone leading-relaxed">
                Raw binary frames are pushed directly across Windows memory-mapped ring buffers without intermediate disk I/O.
              </p>
            </div>
          </div>

          <div className="atelier-card p-6 rounded-xl flex flex-col justify-between">
            <span className="p-2.5 w-fit rounded-lg bg-hw-champagne/10 text-hw-champagne border border-hw-champagne/20 mb-4">
              <Shield className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-serif text-xl text-hw-sand mb-1.5">100% Offline AI Vision</h4>
              <p className="text-xs text-hw-stone leading-relaxed">
                MediaPipe WASM executes locally in sandboxed threads. No video frames, telemetry, or facial data ever leave your machine.
              </p>
            </div>
          </div>

          <div className="atelier-card p-6 rounded-xl flex flex-col justify-between">
            <span className="p-2.5 w-fit rounded-lg bg-hw-rose/10 text-hw-rose border border-hw-rose/20 mb-4">
              <Cpu className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-serif text-xl text-hw-sand mb-1.5">Background Tray Worker</h4>
              <p className="text-xs text-hw-stone leading-relaxed">
                Minimizes to the Windows notification tray with an ultra-lightweight worker thread, continuing 60 FPS output while invisible.
              </p>
            </div>
          </div>

          <div className="atelier-card p-6 rounded-xl flex flex-col justify-between">
            <span className="p-2.5 w-fit rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-4">
              <HardDrive className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-serif text-xl text-hw-sand mb-1.5">Standalone Portable</h4>
              <p className="text-xs text-hw-stone leading-relaxed">
                Available as a single self-contained portable executable. Run it instantly from any folder or USB drive with zero system residue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
