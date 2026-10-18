import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, Flame, Wind, Volume2, VolumeX, HandMetal, Play } from 'lucide-react';

interface GesturePreset {
  id: string;
  name: string;
  trigger: string;
  badge: string;
  soundName: string;
  desc: string;
  color: string;
}

const GESTURES: GesturePreset[] = [
  {
    id: 'heart',
    name: 'Finger Heart',
    trigger: 'Index & Thumb Crossed',
    badge: 'Ambient Drift',
    soundName: 'Crystal Chime (E5)',
    desc: 'Luminescent heart particles emit from fingertips and float with gentle ambient drift.',
    color: '#E05260',
  },
  {
    id: 'rose',
    name: 'Blossoming Rose',
    trigger: 'Fist Clench & Release',
    badge: 'Petal Physics',
    soundName: 'Warm Bloom (C5)',
    desc: 'Procedural geometric rose blossoms organically in 3D space with layered petal opening.',
    color: '#EC6472',
  },
  {
    id: 'cupid',
    name: 'Cupid Sparks',
    trigger: 'Finger Point / Spark',
    badge: 'Photon Rays',
    soundName: 'Cosmic Shimmer (A5)',
    desc: 'High-velocity romantic sparkles and luminous photon rays follow finger movement.',
    color: '#E2B77A',
  },
  {
    id: 'duo',
    name: 'Twin Palms Aura',
    trigger: 'Both Palms Mirrored',
    badge: 'Synchronized',
    soundName: 'Harmonic Cord (G5)',
    desc: 'Dual-palm tracking detects twin hands in proximity and emits a synchronized champagne aura.',
    color: '#F59E0B',
  },
  {
    id: 'petals',
    name: 'Floral Petal Rain',
    trigger: 'Open Hand Wave',
    badge: 'Atmospheric',
    soundName: 'Gentle Breeze',
    desc: 'Cascading floral petals gently drift across the frame with natural air resistance.',
    color: '#F472B6',
  },
];

export const GestureSandbox: React.FC = () => {
  const [activeGesture, setActiveGesture] = useState<GesturePreset>(GESTURES[0]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    decay: number;
    color: string;
    sway: number;
    swaySpeed: number;
  }>>([]);

  // Synthesize acoustic audio chime on gesture trigger
  const playChime = (freq: number) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.35, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Subtle burst on user interaction
  const spawnBurst = (g: GesturePreset, count: number = 6) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width * 0.52;
    const cy = canvas.height * 0.58;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 1.2 + 0.6;
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed * 0.8,
        vy: -Math.abs(Math.sin(angle) * speed) - 0.8,
        size: Math.random() * 5 + 3,
        alpha: 0.75,
        decay: Math.random() * 0.012 + 0.008,
        color: g.color,
        sway: Math.random() * Math.PI,
        swaySpeed: Math.random() * 0.04 + 0.02,
      });
    }
  };

  const triggerGesture = (g: GesturePreset) => {
    setActiveGesture(g);
    spawnBurst(g, 7);
    const freqs: Record<string, number> = {
      heart: 659.25, // E5
      rose: 523.25, // C5
      cupid: 880.0, // A5
      duo: 783.99, // G5
      petals: 587.33, // D5
    };
    playChime(freqs[g.id] || 600);
  };

  // Canvas particle loop with strictly limited intensity & delicate drift
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tick++;

      // Subtle ambient trickle: only 1 delicate particle every 18 frames if under cap
      if (tick % 18 === 0 && particlesRef.current.length < 16) {
        const cx = canvas.width * 0.52;
        const cy = canvas.height * 0.58;
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 50,
          y: cy + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -(Math.random() * 0.8 + 0.5),
          size: Math.random() * 4 + 3,
          alpha: 0.65,
          decay: Math.random() * 0.01 + 0.006,
          color: activeGesture.color,
          sway: Math.random() * Math.PI,
          swaySpeed: Math.random() * 0.03 + 0.02,
        });
      }

      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.sway += p.swaySpeed;
        p.x += p.vx + Math.sin(p.sway) * 0.35;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.size *= 0.995;

        if (p.alpha <= 0 || p.size < 1) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;

        if (activeGesture.id === 'heart') {
          ctx.beginPath();
          const s = p.size;
          ctx.moveTo(p.x, p.y);
          ctx.bezierCurveTo(p.x - s * 0.5, p.y - s * 0.5, p.x - s, p.y + s * 0.3, p.x, p.y + s);
          ctx.bezierCurveTo(p.x + s, p.y + s * 0.3, p.x + s * 0.5, p.y - s * 0.5, p.x, p.y);
          ctx.fill();
        } else if (activeGesture.id === 'petals') {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 0.6, p.size * 1.2, p.sway, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeGesture]);

  return (
    <section id="gestures" className="relative py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.08]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="editorial-eyebrow mb-3">Natural Interaction</span>
          <h2 className="font-serif text-4xl sm:text-5xl text-hw-sand mt-2">
            Reactions triggered by pure human expression.
          </h2>
        </div>
        <p className="text-sm text-hw-stone max-w-md leading-relaxed">
          Sub-millisecond 21-point 3D tracking detects hand formations naturally. 
          No hotkeys required during video calls or live streaming.
        </p>
      </div>

      {/* Main Interactive Stage: Horizontal Reel + Viewfinder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Gesture Selector (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-hw-muted">
              Select Gesture to Audition
            </span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-white/[0.03] border border-white/10 text-hw-stone hover:text-hw-sand transition-colors"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-hw-champagne" /> Acoustic Audio
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-hw-muted" /> Muted
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            {GESTURES.map((g) => {
              const isSelected = activeGesture.id === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => triggerGesture(g)}
                  className={`w-full p-4 rounded-xl text-left transition-all border flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-atelier-surface border-hw-rose/50 shadow-lg shadow-black/50'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/15'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border mt-0.5"
                    style={{
                      backgroundColor: `${g.color}15`,
                      borderColor: `${g.color}35`,
                      color: g.color,
                    }}
                  >
                    {g.id === 'heart' && <Heart className="w-4 h-4 fill-current" />}
                    {g.id === 'rose' && <Sparkles className="w-4 h-4" />}
                    {g.id === 'cupid' && <Flame className="w-4 h-4" />}
                    {g.id === 'duo' && <HandMetal className="w-4 h-4" />}
                    {g.id === 'petals' && <Wind className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-sans font-semibold text-sm text-hw-sand">{g.name}</span>
                      <span className="text-[10px] font-mono text-hw-champagne">
                        {g.soundName}
                      </span>
                    </div>
                    <p className="text-xs text-hw-stone leading-snug line-clamp-2">{g.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Camera Studio Viewport (7 cols) */}
        <div className="lg:col-span-7 atelier-card p-3 rounded-2xl flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-atelier-canvas border border-white/10 flex items-center justify-center cursor-pointer group"
            onClick={() => triggerGesture(activeGesture)}
          >
            {/* Corner Reticles */}
            <div className="viewfinder-corner-tl" />
            <div className="viewfinder-corner-tr" />
            <div className="viewfinder-corner-bl" />
            <div className="viewfinder-corner-br" />

            {/* Studio Artwork */}
            <img
              src="/assets/gesture-showcase.jpg"
              alt="Heartwave Hand Gesture Tracking"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            />

            {/* Subtle Gradient Shadow */}
            <div className="absolute inset-0 bg-gradient-to-t from-atelier-canvas/90 via-transparent to-black/30 pointer-events-none" />

            {/* Canvas Particle Overlay */}
            <canvas
              ref={canvasRef}
              width={640}
              height={400}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* Top Telemetry Tag */}
            <div className="absolute top-3 inset-x-4 flex items-center justify-between text-[11px] font-mono text-hw-sand z-20 pointer-events-none">
              <span className="bg-black/60 px-2.5 py-1 rounded backdrop-blur-sm border border-white/10">
                Active: <strong style={{ color: activeGesture.color }}>{activeGesture.name}</strong>
              </span>
              <span className="bg-black/60 px-2.5 py-1 rounded backdrop-blur-sm border border-white/10 text-hw-champagne">
                Kalman Landmark Filter Active
              </span>
            </div>

            {/* Bottom HUD Click Cue */}
            <div className="absolute bottom-3 inset-x-4 flex items-center justify-between text-[11px] font-mono text-hw-sand z-20 pointer-events-none">
              <span className="text-hw-stone">Trigger: {activeGesture.trigger}</span>
              <span className="flex items-center gap-1.5 text-hw-rose group-hover:underline">
                <Play className="w-3 h-3 fill-current" /> Audition Gesture
              </span>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-hw-stone">
            <span>Inference: <strong className="text-hw-sand">0.8ms local WASM</strong></span>
            <span>Acoustics: <strong className="text-hw-champagne">Synthesized Harmonics</strong></span>
            <span>Privacy: <strong className="text-hw-emerald">100% On-Device</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
};
