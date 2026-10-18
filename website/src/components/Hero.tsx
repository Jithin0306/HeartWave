import React, { useState } from 'react';
import { Download, ChevronDown, Check, Shield, Cpu, Zap, Radio, Laptop, Smartphone, Monitor } from 'lucide-react';
import { useGitHubRelease } from '../hooks/useGitHubRelease';
import { useOSDetect } from '../hooks/useOSDetect';

export const Hero: React.FC = () => {
  const { version, recommendedAsset, assets } = useGitHubRelease();
  const { os, osName } = useOSDetect();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeOSKey = os === 'mobile' ? 'windows' : os;
  const primaryDownload = recommendedAsset[activeOSKey];
  const primaryUrl = primaryDownload?.fastMirrorUrl || primaryDownload?.downloadUrl;
  const isFastMirror = !!primaryDownload?.fastMirrorUrl;

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Subtle Studio Illumination (Soft Warm Bounce) */}
      <div className="absolute top-20 left-1/3 w-[600px] h-[300px] bg-hw-champagne/5 blur-[160px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-40 right-1/4 w-[500px] h-[300px] bg-hw-rose/5 blur-[160px] rounded-full pointer-events-none -z-10" />

      {/* Main Grid: Asymmetrical Editorial Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center mb-16">
        {/* Left Column: Editorial Brand Statement (6 cols) */}
        <div className="lg:col-span-6 flex flex-col items-start text-left">
          {/* Un-pillified Editorial Category */}
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-hw-rose" />
            <span className="font-mono text-xs text-hw-champagne tracking-widest uppercase">
              Optical Camera Platform • {version}
            </span>
          </div>

          {/* Headline in Instrument Serif */}
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-hw-sand mb-6">
            Studio optics & expressive gesture reactions for everyday video.
          </h1>

          {/* Subtitle in Manrope */}
          <p className="text-base sm:text-lg text-hw-stone leading-relaxed mb-8 max-w-xl font-normal">
            Transform any standard webcam or smartphone into an interactive broadcast camera. 
            Real-time DSLR bokeh blur, 21-point hand tracking with physical reactions, and 
            <span className="text-hw-sand font-medium"> zero playout delay</span> in Discord, OBS, Zoom, and Teams.
          </p>

          {/* Actions & Dynamic OS Download */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-8">
            <div className="relative flex items-stretch rounded-xl p-1 bg-atelier-surface border border-white/10 shadow-xl">
              <a
                href={primaryUrl}
                download={isFastMirror ? primaryDownload.name : undefined}
                className="flex items-center gap-3 px-6 py-3 text-xs font-semibold text-white bg-hw-rose hover:bg-hw-rose-hover rounded-lg shadow-md shadow-hw-rose/25 transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <div className="text-left">
                  <div className="leading-tight font-sans flex items-center gap-2">
                    <span>Download for {osName}</span>
                    {isFastMirror && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-normal leading-none">
                        ⚡ Fast CDN
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-white/80 font-normal mt-0.5">
                    {primaryDownload.sizeFormatted ? `${version} • ${primaryDownload.sizeFormatted}` : version}
                  </div>
                </div>
              </a>

              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="px-3 flex items-center justify-center text-hw-stone hover:text-white hover:bg-white/5 rounded-lg transition-colors border-l border-white/10"
                title="Choose platform or portable format"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* OS Format Menu */}
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 atelier-surface p-2 rounded-xl border-white/15 bg-atelier-surface/98 backdrop-blur-2xl z-40 text-left shadow-2xl">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-hw-stone tracking-wider border-b border-white/10 flex items-center justify-between">
                    <span>Target Formats</span>
                    <span className="text-hw-champagne text-[10px]">⚡ Direct Mirrors</span>
                  </div>
                  <div className="py-1 flex flex-col gap-0.5 max-h-72 overflow-y-auto">
                    {/* Fast CDN Direct Mirrors */}
                    <div className="px-3 pt-2 pb-1 text-[10px] font-mono text-hw-emerald font-semibold uppercase tracking-wider">
                      ⚡ Instant Edge CDN (High-Speed)
                    </div>
                    <a
                      href="/downloads/HeartWave-Setup.exe"
                      download="HeartWave-Setup.exe"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-hw-sand hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-hw-sand">Windows Setup (NSIS)</span>
                        <span className="text-[10px] text-hw-stone font-mono">HeartWave-Setup.exe</span>
                      </div>
                      <span className="text-[11px] font-mono text-hw-emerald font-semibold">22.8 MB</span>
                    </a>
                    <a
                      href="/downloads/HeartWave-Portable.exe"
                      download="HeartWave-Portable.exe"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-hw-sand hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-hw-sand">Windows Standalone</span>
                        <span className="text-[10px] text-hw-stone font-mono">HeartWave-Portable.exe</span>
                      </div>
                      <span className="text-[11px] font-mono text-hw-emerald font-semibold">31.9 MB</span>
                    </a>

                    {/* Official GitHub Release Binaries */}
                    <div className="px-3 pt-3 pb-1 text-[10px] font-mono text-hw-stone uppercase tracking-wider border-t border-white/10 mt-1">
                      Official GitHub Binaries ({version})
                    </div>
                    {assets.map((asset) => (
                      <a
                        key={asset.name}
                        href={asset.downloadUrl}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-hw-sand hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{asset.label}</span>
                          <span className="text-[10px] text-hw-stone font-mono">{asset.name}</span>
                        </div>
                        {asset.sizeFormatted && (
                          <span className="text-[11px] font-mono text-hw-champagne ml-2">{asset.sizeFormatted}</span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a
              href="https://github.com/Jithin0306/HeartWave"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-medium text-hw-stone hover:text-hw-sand bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-all"
            >
              <span>Source & Releases</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-hw-stone">MIT</span>
            </a>
          </div>

          {/* Quiet Trust Footnote */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-hw-stone">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-hw-emerald" /> 100% Free & Open Source
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-hw-champagne" /> Local AI (Zero Telemetry)
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-hw-rose" /> 56 MB Rust Core
            </span>
          </div>
        </div>

        {/* Right Column: Authentic Camera Viewfinder Viewport (6 cols) */}
        <div className="lg:col-span-6">
          <div className="relative rounded-2xl p-2 bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 shadow-2xl">
            <div className="relative rounded-xl overflow-hidden bg-atelier-canvas border border-white/10 aspect-[16/10]">
              {/* Corner Viewfinder Reticles */}
              <div className="viewfinder-corner-tl" />
              <div className="viewfinder-corner-tr" />
              <div className="viewfinder-corner-bl" />
              <div className="viewfinder-corner-br" />

              {/* Viewfinder Top HUD Bar */}
              <div className="absolute top-3 inset-x-4 flex items-center justify-between text-[11px] font-mono text-hw-sand z-20 pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-hw-rose font-bold">
                    <span className="w-2 h-2 rounded-full bg-hw-rose animate-pulse" /> REC
                  </span>
                  <span className="text-hw-muted">•</span>
                  <span className="text-hw-stone">1080p @ 60 FPS</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-hw-champagne font-medium">f/1.4 PRIME BOKEH</span>
                  <span className="text-hw-muted">•</span>
                  <span className="text-hw-stone">ISO 200</span>
                </div>
              </div>

              {/* Genuine Product Image */}
              <img
                src="/assets/hero-showcase.jpg"
                alt="Heartwave Studio Camera Viewport"
                className="w-full h-full object-cover"
              />

              {/* Bottom Viewfinder HUD Bar */}
              <div className="absolute bottom-3 inset-x-4 flex items-center justify-between text-[11px] font-mono text-hw-sand z-20 pointer-events-none">
                <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-sm border border-white/10">
                  <span className="text-hw-emerald font-bold">56.2 MB RAM</span>
                  <span className="text-hw-muted">|</span>
                  <span className="text-hw-sand">0.0ms WebRTC Delay</span>
                </div>

                <div className="flex items-center gap-2 bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-sm border border-white/10">
                  <span className="text-hw-rose">21 LANDMARKS LOCKED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Universal Broadcast Compatibility Strip */}
      <div className="pt-10 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="font-mono text-xs uppercase tracking-widest text-hw-muted">
          Broadcast Ready via "Heartwave Virtual Camera"
        </span>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-hw-stone text-xs font-medium">
          <span className="hover:text-hw-sand transition-colors flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-purple-400" /> OBS Studio
          </span>
          <span className="hover:text-hw-sand transition-colors flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-indigo-400" /> Discord Desktop
          </span>
          <span className="hover:text-hw-sand transition-colors flex items-center gap-2">
            <Laptop className="w-3.5 h-3.5 text-blue-400" /> Zoom & Meet
          </span>
          <span className="hover:text-hw-sand transition-colors flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-sky-400" /> Microsoft Teams
          </span>
          <span className="hover:text-hw-sand transition-colors flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-hw-rose" /> VRChat
          </span>
        </div>
      </div>
    </section>
  );
};
