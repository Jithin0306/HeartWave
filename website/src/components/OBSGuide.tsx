import React, { useState } from 'react';
import { Layers, Monitor, Radio, Laptop } from 'lucide-react';

export const OBSGuide: React.FC = () => {
  const [activeApp, setActiveApp] = useState<'obs' | 'discord' | 'zoom'>('obs');

  return (
    <section id="obs-guide" className="relative py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
      <div className="atelier-card p-6 sm:p-10 rounded-2xl shadow-2xl relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-6">
          <div>
            <span className="editorial-eyebrow mb-2">Stream Setup</span>
            <h3 className="font-serif text-3xl text-hw-sand mt-1">Broadcast integration in sixty seconds.</h3>
          </div>

          {/* App Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-atelier-canvas border border-white/10">
            <button
              onClick={() => setActiveApp('obs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeApp === 'obs'
                  ? 'bg-purple-600 text-white font-semibold shadow-md'
                  : 'text-hw-stone hover:text-hw-sand'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> OBS Studio
            </button>
            <button
              onClick={() => setActiveApp('discord')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeApp === 'discord'
                  ? 'bg-indigo-600 text-white font-semibold shadow-md'
                  : 'text-hw-stone hover:text-hw-sand'
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> Discord
            </button>
            <button
              onClick={() => setActiveApp('zoom')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeApp === 'zoom'
                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                  : 'text-hw-stone hover:text-hw-sand'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" /> Zoom & Meet
            </button>
          </div>
        </div>

        {/* Step Cards */}
        {activeApp === 'obs' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-atelier-canvas border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-hw-rose font-bold block mb-2">PHASE 01</span>
                <h4 className="font-sans text-sm font-bold text-hw-sand mb-1">Start Virtual Output</h4>
                <p className="text-xs text-hw-stone leading-relaxed">
                  Open Heartwave and click <strong>"Start Virtual Output"</strong> or press <kbd className="keycap text-[10px]">Ctrl+Shift+V</kbd>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-hw-emerald">
                DirectShow Filter Active
              </div>
            </div>

            <div className="p-5 rounded-xl bg-atelier-canvas border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-hw-champagne font-bold block mb-2">PHASE 02</span>
                <h4 className="font-sans text-sm font-bold text-hw-sand mb-1">Add Video Source</h4>
                <p className="text-xs text-hw-stone leading-relaxed">
                  In OBS Studio Sources dock, click <strong>+</strong> &rarr; select <strong>Video Capture Device</strong> &rarr; name it <em>Heartwave Camera</em>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-hw-stone">
                Type: Video Capture Device
              </div>
            </div>

            <div className="p-5 rounded-xl bg-atelier-canvas border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-purple-400 font-bold block mb-2">PHASE 03</span>
                <h4 className="font-sans text-sm font-bold text-hw-sand mb-1">Select Driver</h4>
                <p className="text-xs text-hw-stone leading-relaxed">
                  In Device dropdown, pick <strong>Heartwave Virtual Camera</strong>. Set Resolution to <strong>1920x1080</strong> and FPS to <strong>60</strong>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-hw-champagne">
                0ms Video Playout Delay
              </div>
            </div>
          </div>
        )}

        {activeApp === 'discord' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-atelier-canvas border border-white/10">
              <span className="text-xs font-mono text-indigo-400 font-bold block mb-2">PHASE 01</span>
              <h4 className="font-sans text-sm font-bold text-hw-sand mb-1">Open Voice & Video</h4>
              <p className="text-xs text-hw-stone leading-relaxed">
                Go to Discord <strong>User Settings</strong> &rarr; <strong>Voice & Video</strong>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-atelier-canvas border border-white/10">
              <span className="text-xs font-mono text-indigo-400 font-bold block mb-2">PHASE 02</span>
              <h4 className="font-sans text-sm font-bold text-hw-sand mb-1">Choose Camera</h4>
              <p className="text-xs text-hw-stone leading-relaxed">
                Under <strong>Video Settings &gt; Camera</strong> dropdown, select <strong>Heartwave Virtual Camera</strong>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-atelier-canvas border border-white/10">
              <span className="text-xs font-mono text-indigo-400 font-bold block mb-2">PHASE 03</span>
              <h4 className="font-sans text-sm font-bold text-hw-sand mb-1">Perfect Lip Sync</h4>
              <p className="text-xs text-hw-stone leading-relaxed">
                Heartwave's monotonic stream timestamps automatically collapse Discord's WebRTC playout buffer to 0ms!
              </p>
            </div>
          </div>
        )}

        {activeApp === 'zoom' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-atelier-canvas border border-white/10">
              <span className="text-xs font-mono text-blue-400 font-bold block mb-2">PHASE 01</span>
              <h4 className="font-sans text-sm font-bold text-hw-sand mb-1">Open Settings</h4>
              <p className="text-xs text-hw-stone leading-relaxed">
                Click your profile icon in Zoom &rarr; <strong>Settings</strong> &rarr; <strong>Video</strong>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-atelier-canvas border border-white/10">
              <span className="text-xs font-mono text-blue-400 font-bold block mb-2">PHASE 02</span>
              <h4 className="font-sans text-sm font-bold text-hw-sand mb-1">Select Heartwave</h4>
              <p className="text-xs text-hw-stone leading-relaxed">
                In Camera dropdown, select <strong>Heartwave Virtual Camera</strong> and check <strong>HD</strong>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-atelier-canvas border border-white/10">
              <span className="text-xs font-mono text-blue-400 font-bold block mb-2">PHASE 03</span>
              <h4 className="font-sans text-sm font-bold text-hw-sand mb-1">Studio Broadcast</h4>
              <p className="text-xs text-hw-stone leading-relaxed">
                Enjoy f/1.4 studio bokeh, natural lighting adjustments, and gesture reactions in every meeting!
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
