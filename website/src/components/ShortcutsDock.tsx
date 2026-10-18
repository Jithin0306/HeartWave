import React from 'react';
import { Camera, EyeOff, Radio, FlipHorizontal, Sliders } from 'lucide-react';

interface Shortcut {
  keys: string[];
  action: string;
  description: string;
  icon: React.ReactNode;
}

const SHORTCUTS: Shortcut[] = [
  {
    keys: ['Ctrl', 'Shift', 'K'],
    action: 'Toggle DSLR Blur',
    description: 'Instantly toggles cinematic background bokeh on/off',
    icon: <Camera className="w-4 h-4 text-hw-champagne" />,
  },
  {
    keys: ['Ctrl', 'Shift', 'P'],
    action: 'Privacy Shutter',
    description: 'Instantly blacks out camera feed with branded slate',
    icon: <EyeOff className="w-4 h-4 text-hw-rose" />,
  },
  {
    keys: ['Ctrl', 'Shift', 'B'],
    action: 'Bypass Mode',
    description: 'Sends clean, raw camera feed with zero effects',
    icon: <Sliders className="w-4 h-4 text-hw-sand" />,
  },
  {
    keys: ['Ctrl', 'Shift', 'V'],
    action: 'Toggle Virtual Output',
    description: 'Starts or stops the DirectShow video broadcast',
    icon: <Radio className="w-4 h-4 text-hw-emerald" />,
  },
  {
    keys: ['Ctrl', 'Shift', 'M'],
    action: 'Toggle Mirror',
    description: 'Horizontally flips camera preview and broadcast',
    icon: <FlipHorizontal className="w-4 h-4 text-purple-400" />,
  },
];

export const ShortcutsDock: React.FC = () => {
  return (
    <section className="relative py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
      <div className="atelier-card p-6 sm:p-10 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-6">
          <div>
            <span className="editorial-eyebrow mb-2">Tactile Hardware Controls</span>
            <h3 className="font-serif text-3xl text-hw-sand mt-1">Full control without alt-tabbing.</h3>
          </div>
          <p className="text-xs text-hw-stone max-w-md leading-relaxed">
            Heartwave hooks system-wide hotkeys so you can control your broadcast without losing focus from your game, code editor, or presentation.
          </p>
        </div>

        {/* Shortcuts List with 3D Keycaps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 flex items-center justify-between gap-4 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-atelier-canvas border border-white/10">
                  {s.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-hw-sand font-sans">{s.action}</div>
                  <div className="text-xs text-hw-stone leading-tight">{s.description}</div>
                </div>
              </div>

              {/* 3D Tactile Keycaps */}
              <div className="flex items-center gap-1 shrink-0">
                {s.keys.map((k, kIdx) => (
                  <span key={kIdx} className="keycap group-hover:border-hw-rose/40 transition-colors">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
