import React, { useState } from 'react';
import { Download, Monitor, Laptop, Terminal, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useGitHubRelease, ReleaseAsset } from '../hooks/useGitHubRelease';
import { useOSDetect } from '../hooks/useOSDetect';

export const DownloadMatrix: React.FC = () => {
  const { version, publishedAt, htmlUrl, assets } = useGitHubRelease();
  const { os } = useOSDetect();
  const [selectedOS, setSelectedOS] = useState<'windows' | 'macos' | 'linux'>(
    os === 'mobile' ? 'windows' : os
  );

  return (
    <section id="downloads" className="relative py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="editorial-eyebrow mb-3">Universal Binaries</span>
          <h2 className="font-serif text-4xl sm:text-5xl text-hw-sand mt-2">
            Native releases for every desktop platform.
          </h2>
        </div>
        <p className="text-sm text-hw-stone max-w-md leading-relaxed">
          Compiled natively for Windows, macOS, and Linux. Automatically queried in real time from the latest official{' '}
          <a
            href={htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-hw-champagne hover:underline inline-flex items-center gap-1 font-mono"
          >
            GitHub Release ({version}) <ExternalLink className="w-3 h-3" />
          </a>.
        </p>
      </div>

      {/* OS Selector Tabs */}
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => setSelectedOS('windows')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            selectedOS === 'windows'
              ? 'bg-hw-rose text-white shadow-lg shadow-hw-rose/25'
              : 'text-hw-stone hover:text-hw-sand bg-white/[0.03] border border-white/10'
          }`}
        >
          <Monitor className="w-4 h-4" /> Windows 10 / 11
        </button>
        <button
          onClick={() => setSelectedOS('macos')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            selectedOS === 'macos'
              ? 'bg-hw-rose text-white shadow-lg shadow-hw-rose/25'
              : 'text-hw-stone hover:text-hw-sand bg-white/[0.03] border border-white/10'
          }`}
        >
          <Laptop className="w-4 h-4" /> macOS (Apple & Intel)
        </button>
        <button
          onClick={() => setSelectedOS('linux')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            selectedOS === 'linux'
              ? 'bg-hw-rose text-white shadow-lg shadow-hw-rose/25'
              : 'text-hw-stone hover:text-hw-sand bg-white/[0.03] border border-white/10'
          }`}
        >
          <Terminal className="w-4 h-4" /> Linux (AppImage & DEB)
        </button>
      </div>

      {/* OS Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {selectedOS === 'windows' && (
          <>
            {/* Windows NSIS Setup */}
            <div className="atelier-card p-6 rounded-2xl flex flex-col justify-between relative group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-hw-emerald px-2 py-0.5 rounded border border-hw-emerald/25">
                    Recommended
                  </span>
                  <span className="text-xs font-mono text-hw-muted">NSIS Setup</span>
                </div>
                <h3 className="font-serif text-2xl text-hw-sand mb-1">Standard Installer</h3>
                <p className="text-xs text-hw-stone leading-relaxed mb-4">
                  Full Windows setup installer with start menu integration, desktop shortcut, and auto-uninstaller.
                </p>
                <div className="text-[11px] font-mono text-hw-stone space-y-1 mb-6">
                  <div>Platform: Windows 10 / 11 (64-bit)</div>
                  <div>DirectShow: Native HeartWaveCam.dll</div>
                  <div>Size: ~22.8 MB</div>
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href="/downloads/HeartWave-Setup.exe"
                  download="HeartWave-Setup.exe"
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-white bg-hw-rose hover:bg-hw-rose-hover rounded-xl shadow-md shadow-hw-rose/25 transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" /> Download Setup (⚡ Fast CDN)
                </a>
                <a
                  href={
                    assets.find((a) => a.type === 'win-setup')?.downloadUrl ||
                    `https://github.com/Jithin0306/HeartWave/releases/download/${version}/HeartWave_1.3.30_x64-setup.exe`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 text-[11px] font-mono text-hw-stone hover:text-hw-sand hover:bg-white/5 rounded-lg transition-colors"
                >
                  <span>Official GitHub Binary ({version})</span>
                  <ExternalLink className="w-3 h-3 text-hw-muted" />
                </a>
              </div>
            </div>

            {/* Windows Portable */}
            <div className="atelier-card p-6 rounded-2xl flex flex-col justify-between relative group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-hw-champagne px-2 py-0.5 rounded border border-hw-champagne/25">
                    Zero Install
                  </span>
                  <span className="text-xs font-mono text-hw-muted">Portable EXE</span>
                </div>
                <h3 className="font-serif text-2xl text-hw-sand mb-1">Standalone Executable</h3>
                <p className="text-xs text-hw-stone leading-relaxed mb-4">
                  No installation required. Run directly from any folder or USB drive with zero system residue.
                </p>
                <div className="text-[11px] font-mono text-hw-stone space-y-1 mb-6">
                  <div>Platform: Windows 10 / 11 (64-bit)</div>
                  <div>Format: Single Portable Binary</div>
                  <div>Size: ~31.9 MB</div>
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href="/downloads/HeartWave-Portable.exe"
                  download="HeartWave-Portable.exe"
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-hw-sand bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 rounded-xl transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" /> Download Portable (⚡ Fast CDN)
                </a>
                <a
                  href={
                    assets.find((a) => a.type === 'win-portable')?.downloadUrl ||
                    `https://github.com/Jithin0306/HeartWave/releases/download/${version}/HeartWave-Portable.exe`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 text-[11px] font-mono text-hw-stone hover:text-hw-sand hover:bg-white/5 rounded-lg transition-colors"
                >
                  <span>Official GitHub Binary ({version})</span>
                  <ExternalLink className="w-3 h-3 text-hw-muted" />
                </a>
              </div>
            </div>

            {/* Windows MSI */}
            <div className="atelier-card p-6 rounded-2xl flex flex-col justify-between relative group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-purple-400 px-2 py-0.5 rounded border border-purple-500/25">
                    Enterprise
                  </span>
                  <span className="text-xs font-mono text-hw-muted">MSI Package</span>
                </div>
                <h3 className="font-serif text-2xl text-hw-sand mb-1">Windows MSI Package</h3>
                <p className="text-xs text-hw-stone leading-relaxed mb-4">
                  Silent installation package designed for sysadmins and automated corporate deployments.
                </p>
                <div className="text-[11px] font-mono text-hw-stone space-y-1 mb-6">
                  <div>Platform: Windows 10 / 11 (64-bit)</div>
                  <div>Flags: Supports /quiet /qn flags</div>
                  <div>Size: ~24.0 MB</div>
                </div>
              </div>

              <a
                href={
                  assets.find((a) => a.type === 'win-msi')?.downloadUrl ||
                  `https://github.com/Jithin0306/HeartWave/releases/download/${version}/HeartWave_1.3.30_x64_en-US.msi`
                }
                className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-hw-sand bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-all"
              >
                <Download className="w-4 h-4" /> Download MSI Package
              </a>
            </div>
          </>
        )}

        {selectedOS === 'macos' && (
          <>
            <div className="atelier-card p-6 rounded-2xl flex flex-col justify-between relative group md:col-span-2">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-hw-emerald px-2 py-0.5 rounded border border-hw-emerald/25">
                    Apple Silicon & Intel
                  </span>
                  <span className="text-xs font-mono text-hw-muted">Universal .dmg</span>
                </div>
                <h3 className="font-serif text-3xl text-hw-sand mb-2">macOS Universal Disk Image</h3>
                <p className="text-xs text-hw-stone leading-relaxed mb-4">
                  Drag-and-drop macOS disk image bundle. Optimized natively for M1/M2/M3/M4 Apple Silicon and Intel Macs with zero emulation overhead.
                </p>
                <div className="text-xs font-mono text-hw-stone space-y-1 mb-6">
                  <div>OS: macOS 11.0 Big Sur or later</div>
                  <div>Arch: Apple Silicon (aarch64) & Intel (x86_64)</div>
                  <div>Size: ~27.3 MB</div>
                </div>
              </div>

              <a
                href={
                  assets.find((a) => a.type === 'mac-dmg')?.downloadUrl ||
                  `https://github.com/Jithin0306/HeartWave/releases/download/${version}/HeartWave_1.3.30_aarch64.dmg`
                }
                className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-white bg-hw-rose hover:bg-hw-rose-hover rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" /> Download macOS Disk Image (.dmg)
              </a>
            </div>

            <div className="atelier-card p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="font-serif text-xl text-hw-sand mb-2">Quick macOS Setup</h4>
                <ol className="text-xs text-hw-stone space-y-2 list-decimal list-inside font-mono">
                  <li>Download the .dmg image</li>
                  <li>Drag Heartwave to Applications</li>
                  <li>Grant camera permission on first launch</li>
                  <li>Select "Heartwave Virtual Camera"</li>
                </ol>
              </div>
              <div className="mt-6 pt-3 border-t border-white/10 text-[11px] font-mono text-hw-muted">
                100% Native Metal & WebAssembly
              </div>
            </div>
          </>
        )}

        {selectedOS === 'linux' && (
          <>
            <div className="atelier-card p-6 rounded-2xl flex flex-col justify-between relative group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-hw-emerald px-2 py-0.5 rounded border border-hw-emerald/25">
                    Universal
                  </span>
                  <span className="text-xs font-mono text-hw-muted">.AppImage</span>
                </div>
                <h3 className="font-serif text-2xl text-hw-sand mb-1">Universal AppImage</h3>
                <p className="text-xs text-hw-stone leading-relaxed mb-4">
                  Runs directly on Ubuntu, Fedora, Debian, Arch, and Manjaro without any package dependencies.
                </p>
                <div className="text-[11px] font-mono text-hw-stone space-y-1 mb-6">
                  <div>Command: chmod +x HeartWave*.AppImage</div>
                  <div>Arch: x86_64</div>
                  <div>Size: ~102.6 MB</div>
                </div>
              </div>

              <a
                href={
                  assets.find((a) => a.type === 'linux-appimage')?.downloadUrl ||
                  `https://github.com/Jithin0306/HeartWave/releases/download/${version}/HeartWave_1.3.30_amd64.AppImage`
                }
                className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-white bg-hw-rose hover:bg-hw-rose-hover rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" /> Download .AppImage
              </a>
            </div>

            <div className="atelier-card p-6 rounded-2xl flex flex-col justify-between relative group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-hw-champagne px-2 py-0.5 rounded border border-hw-champagne/25">
                    Debian / Ubuntu
                  </span>
                  <span className="text-xs font-mono text-hw-muted">.deb Package</span>
                </div>
                <h3 className="font-serif text-2xl text-hw-sand mb-1">Debian Package</h3>
                <p className="text-xs text-hw-stone leading-relaxed mb-4">
                  Standard Debian package for Ubuntu, Linux Mint, Pop!_OS, and Debian.
                </p>
                <div className="text-[11px] font-mono text-hw-stone space-y-1 mb-6">
                  <div>Command: sudo dpkg -i heartwave_*.deb</div>
                  <div>Integrates with desktop application menu</div>
                  <div>Size: ~24.2 MB</div>
                </div>
              </div>

              <a
                href={
                  assets.find((a) => a.type === 'linux-deb')?.downloadUrl ||
                  `https://github.com/Jithin0306/HeartWave/releases/download/${version}/HeartWave_1.3.30_amd64.deb`
                }
                className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-hw-sand bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-all"
              >
                <Download className="w-4 h-4" /> Download .deb Package
              </a>
            </div>

            <div className="atelier-card p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="font-serif text-xl text-hw-sand mb-2">Kernel Module</h4>
                <p className="text-xs text-hw-stone leading-relaxed mb-4">
                  Heartwave utilizes standard <code className="text-hw-emerald font-mono">v4l2loopback</code> for zero latency on Linux.
                </p>
                <div className="p-3 rounded-lg bg-atelier-canvas border border-white/10 font-mono text-[11px] text-hw-champagne">
                  sudo modprobe v4l2loopback devices=1 video_nr=10 card_label="Heartwave"
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-hw-muted">
                100% Open Source (MIT)
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
