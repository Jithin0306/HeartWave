import React from 'react';
import { Sliders, Hand, ShieldCheck, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { effectManager } from '../../effects/effectManager';

export const EffectInspector: React.FC = () => {
  const {
    effects,
    selectedEffectId,
    activeIntensity,
    setActiveIntensity,
  } = useAppStore();

  const activeEffect = effects.find((e) => e.id === selectedEffectId) || effects[0];

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: 'var(--hw-bg-secondary)',
        borderTop: '1px solid var(--hw-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={14} color="var(--hw-accent-rose)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
            Effect Parameters: {activeEffect.name}
          </span>
        </div>

        <span
          style={{
            fontSize: '10px',
            color: 'var(--hw-accent-champagne)',
            backgroundColor: 'var(--hw-surface-elevated)',
            padding: '2px 6px',
            borderRadius: 'var(--hw-radius-xs)',
            border: '1px solid var(--hw-border-subtle)',
          }}
        >
          {activeEffect.category.toUpperCase()}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: '11px', color: 'var(--hw-text-secondary)', lineHeight: 1.5 }}>
        {activeEffect.description}
      </p>

      {/* Gesture Trigger Guide Card */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 'var(--hw-radius-sm)',
          backgroundColor: 'var(--hw-surface-elevated)',
          border: '1px solid var(--hw-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Hand size={13} color="var(--hw-accent-rose)" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--hw-text-primary)' }}>
            Trigger: {activeEffect.gestureName}
          </span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)' }}>
          {activeEffect.gestureDescription}
        </p>
      </div>

      {/* Sliders: Active Effect Intensity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--hw-text-secondary)' }}>
            Active Effect Intensity
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--hw-accent-rose)' }}>
            {activeIntensity}%
          </span>
        </div>

        <input
          type="range"
          min="10"
          max="100"
          value={activeIntensity}
          onChange={(e) => setActiveIntensity(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: 'var(--hw-accent-primary)',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Manual Trigger / Preview Button */}
      <button
        onClick={() => effectManager.manualTrigger(activeEffect.id)}
        style={{
          padding: '8px 14px',
          borderRadius: 'var(--hw-radius-sm)',
          backgroundColor: 'var(--hw-accent-primary)',
          color: '#FFFFFF',
          fontSize: '11px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxShadow: 'var(--hw-shadow-accent)',
          transition: 'all var(--hw-transition-fast)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hw-accent-primary-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--hw-accent-primary)')}
      >
        <Sparkles size={13} strokeWidth={2} />
        Preview Animation Now
      </button>

      {/* Engine Status Note */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 10px',
          borderRadius: 'var(--hw-radius-xs)',
          backgroundColor: 'var(--hw-bg-primary)',
          border: '1px solid var(--hw-border-subtle)',
          fontSize: '10px',
          color: 'var(--hw-text-muted)',
        }}
      >
        <ShieldCheck size={13} color="var(--hw-status-active)" />
        <span>Phase 4 Engine Active. Trigger hands-free via gesture or test above.</span>
      </div>
    </div>
  );
};
