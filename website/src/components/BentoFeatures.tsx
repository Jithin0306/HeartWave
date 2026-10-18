import React, { useState } from 'react';
import { Camera, Smartphone, Clock, Palette, CheckCircle2, Sliders } from 'lucide-react';

export const BentoFeatures: React.FC = () => {
  const [aperture, setAperture] = useState<'f1.4' | 'f2.8' | 'f4.0'>('f1.4');
  const [backdrop, setBackdrop] = useState<'bokeh' | 'green' | 'penthouse' | 'cyberpunk'>('bokeh');

  const blurValues = {
    'f1.4': 'Creamy f/1.4 Prime Bokeh',
    'f2.8': 'Natural f/2.8 Studio Portrait Depth',
    'f4.0': 'Subtle f/4.0 Soft-Focus Background',
  };

  return (
    <section id="optics" className="relative py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="editorial-eyebrow mb-3">Optics & Chroma</span>
          <h2 className="font-serif text-4xl sm:text-5xl text-hw-sand mt-2">
            Camera optics & studio craft without the price tag.
          </h2>
        </div>
        <p className="text-sm text-hw-stone max-w-md leading-relaxed">
          Engineered to give you high-end mirrorless camera aesthetics using standard webcams and smartphones you already own.
        </p>
      </div>

      {/* Asymmetrical Studio Bento Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* CARD 1: Physical Aperture Lens Dial (7 cols) */}
        <div className="md:col-span-7 atelier-card p-6 sm:p-8 rounded-2xl flex flex-col justify-between relative group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 rounded-lg bg-hw-champagne/10 text-hw-champagne border border-hw-champagne/20">
                <Camera className="w-4 h-4" />
              </span>

              {/* Tactile Aperture Barrel Dial */}
              <div className="flex items-center p-1 rounded-lg bg-atelier-canvas border border-white/10 font-mono text-xs">
                {(['f1.4', 'f2.8', 'f4.0'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAperture(preset)}
                    className={`px-3 py-1 rounded transition-all ${
                      aperture === preset
                        ? 'bg-hw-rose text-white font-bold shadow-md shadow-hw-rose/25'
                        : 'text-hw-stone hover:text-hw-sand'
                    }`}
                  >
                    {preset.replace('f', 'f/')}
                  </button>
                ))}
              </div>
            </div>

            <h3 className="font-serif text-2xl text-hw-sand mb-2">DSLR Optical Bokeh Apertures</h3>
            <p className="text-xs text-hw-stone leading-relaxed mb-4">
              Real-time dual-pass segmentation with authentic optical aperture emulation. 
              {blurValues[aperture]}.
            </p>
          </div>

          {/* Aperture Preview Viewport */}
          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-white/10 bg-atelier-canvas mt-2 shadow-xl">
            <div className="viewfinder-corner-tl" />
            <div className="viewfinder-corner-tr" />
            <div className="viewfinder-corner-bl" />
            <div className="viewfinder-corner-br" />

            <img
              src="/assets/dslr-bokeh-showcase.jpg"
              alt="DSLR Optical Bokeh Showcase"
              className="w-full h-full object-cover"
            />

            <div className="absolute bottom-3 left-3 bg-black/65 px-3 py-1 rounded backdrop-blur-sm border border-white/10 text-[11px] font-mono text-hw-sand flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-hw-emerald" />
              <span>Aperture: <strong>{aperture.replace('f', 'f/')}</strong> ({blurValues[aperture]})</span>
            </div>
          </div>
        </div>

        {/* CARD 2: Wireless Phone as 1080p Webcam (5 cols) */}
        <div className="md:col-span-5 atelier-card p-6 sm:p-8 rounded-2xl flex flex-col justify-between relative group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 rounded-lg bg-hw-rose/10 text-hw-rose border border-hw-rose/20">
                <Smartphone className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono tracking-wider uppercase text-hw-champagne px-2 py-0.5 rounded border border-hw-champagne/20">
                Zero App Install
              </span>
            </div>

            <h3 className="font-serif text-2xl text-hw-sand mb-2">Wireless Phone as Cam</h3>
            <p className="text-xs text-hw-stone leading-relaxed mb-4">
              Turn any iPhone or Android phone into an ultra-low-latency 1080p webcam. 
              Scan the on-screen QR code to connect instantly over local Wi-Fi or USB.
            </p>

            <ul className="space-y-2 mb-4 text-xs text-hw-stone font-sans">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-hw-emerald shrink-0" />
                <span>WebRTC direct P2P connection (no cloud relay)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-hw-emerald shrink-0" />
                <span>PC controls rear lens, flash torch & optical zoom</span>
              </li>
            </ul>
          </div>

          <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-white/10 bg-atelier-canvas shadow-xl">
            <img
              src="/assets/phone-cam-showcase.jpg"
              alt="Wireless Phone as Cam Showcase"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* CARD 3: 0ms Reference Clock (6 cols) */}
        <div className="md:col-span-6 atelier-card p-6 sm:p-8 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 rounded-lg bg-hw-emerald/10 text-hw-emerald border border-hw-emerald/20">
                <Clock className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono text-hw-emerald">0ms Jitter Buffer</span>
            </div>

            <h3 className="font-serif text-2xl text-hw-sand mb-2">DirectShow Clock Lip Sync</h3>
            <p className="text-xs text-hw-stone leading-relaxed mb-6">
              Standard virtual cameras suffer from 1–2 second delays in Discord or WebRTC because they lack hardware clock stamps. 
              Heartwave aligns every video sample with monotonic stream-time timestamps directly against the Windows reference clock, 
              collapsing playout delay to zero.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-atelier-canvas border border-white/10 font-mono text-xs text-hw-sand space-y-2">
            <div className="flex items-center justify-between text-hw-muted border-b border-white/5 pb-2">
              <span>REFERENCE CLOCK PARAMETER</span>
              <span>HEARTWAVE NATIVE</span>
            </div>
            <div className="flex items-center justify-between">
              <span>DirectShow Reference Alignment</span>
              <span className="text-hw-emerald font-bold">Synchronized (0ms Drift)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>WebRTC De-jitter Playout Delay</span>
              <span className="text-hw-champagne font-bold">0 ms (vs 2,000 ms)</span>
            </div>
          </div>
        </div>

        {/* CARD 4: Chroma Key & Studio Backdrops (6 cols) */}
        <div className="md:col-span-6 atelier-card p-6 sm:p-8 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Palette className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono text-hw-champagne">Integrated Keyer</span>
            </div>

            <h3 className="font-serif text-2xl text-hw-sand mb-2">Pixel Chroma Key & Environments</h3>
            <p className="text-xs text-hw-stone leading-relaxed mb-6">
              Toggle pure chroma key green (<code className="text-hw-emerald font-mono">#00FF00</code>) or blue (<code className="text-blue-400 font-mono">#0000FF</code>) 
              for seamless streamer overlays in OBS Studio without owning a physical green screen sheet. 
              Or swap in virtual backdrops (Penthouse, Modern Studio, Warm Cafe) instantly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-hw-emerald block font-bold mb-1">Pixel Chroma Key</span>
              <span className="text-hw-stone">Pure #00FF00 for OBS Studio overlays</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
              <span className="text-hw-champagne block font-bold mb-1">Custom Backdrop</span>
              <span className="text-hw-stone">Load your own high-res PNG/JPG environments</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
