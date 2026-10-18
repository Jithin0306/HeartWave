import React from 'react';
import { Star, Sparkles, Heart, Flower2, Flame, CloudRain, Cake, PartyPopper, Zap } from 'lucide-react';
import { EffectItem } from '../../types/effect';

interface EffectCardProps {
  effect: EffectItem;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export const EffectCard: React.FC<EffectCardProps> = ({
  effect,
  isSelected,
  onSelect,
  onToggleFavorite,
}) => {
  // Render bespoke vector thumbnails for each romantic effect
  const renderThumbnail = () => {
    switch (effect.proceduralType) {
      case 'golden_finger_heart':
        return (
          <div
            style={{
              width: '100%',
              height: '76px',
              borderRadius: 'var(--hw-radius-sm)',
              background: 'radial-gradient(circle at center, rgba(214, 189, 145, 0.3) 0%, rgba(38, 32, 31, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--hw-accent-champagne)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <span style={{ position: 'absolute', bottom: '6px', right: '8px', fontSize: '9px', color: 'var(--hw-accent-champagne)' }}>
              ✦ Gold Finger
            </span>
          </div>
        );

      case 'big_heart':
        return (
          <div
            style={{
              width: '100%',
              height: '76px',
              borderRadius: 'var(--hw-radius-sm)',
              background: 'radial-gradient(circle at center, rgba(184, 92, 112, 0.35) 0%, rgba(38, 32, 31, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--hw-accent-rose)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <span style={{ position: 'absolute', bottom: '6px', right: '8px', fontSize: '9px', color: 'var(--hw-accent-rose)' }}>
              ✦ Twin Hands
            </span>
          </div>
        );

      case 'rose_bloom':
        return (
          <div
            style={{
              width: '100%',
              height: '76px',
              borderRadius: 'var(--hw-radius-sm)',
              background: 'radial-gradient(circle at center, rgba(103, 47, 64, 0.35) 0%, rgba(38, 32, 31, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Flower2 size={36} color="var(--hw-accent-primary)" strokeWidth={1.8} />
            <span style={{ position: 'absolute', bottom: '6px', right: '8px', fontSize: '9px', color: 'var(--hw-accent-rose)' }}>
              ✦ Petals
            </span>
          </div>
        );

      case 'floating_hearts':
        return (
          <div
            style={{
              width: '100%',
              height: '76px',
              borderRadius: 'var(--hw-radius-sm)',
              background: 'radial-gradient(circle at center, rgba(215, 154, 166, 0.2) 0%, rgba(38, 32, 31, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Sparkles size={34} color="var(--hw-accent-rose)" strokeWidth={1.8} />
          </div>
        );

      case 'cupid_spark':
        return (
          <div
            style={{
              width: '100%',
              height: '76px',
              borderRadius: 'var(--hw-radius-sm)',
              background: 'radial-gradient(circle at center, rgba(214, 189, 145, 0.25) 0%, rgba(38, 32, 31, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Flame size={34} color="var(--hw-accent-champagne)" strokeWidth={1.8} />
          </div>
        );


      case 'petal_rain':
        return (
          <div
            style={{
              width: '100%',
              height: '76px',
              borderRadius: 'var(--hw-radius-sm)',
              background: 'radial-gradient(circle at center, rgba(103, 47, 64, 0.25) 0%, rgba(38, 32, 31, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <CloudRain size={36} color="var(--hw-accent-rose)" strokeWidth={1.8} />
          </div>
        );

      case 'birthday_cake':
        return (
          <div
            style={{
              width: '100%',
              height: '76px',
              borderRadius: 'var(--hw-radius-sm)',
              background: 'radial-gradient(circle at center, rgba(229, 168, 59, 0.3) 0%, rgba(38, 32, 31, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Cake size={36} color="#E5A83B" strokeWidth={1.8} />
          </div>
        );

      case 'confetti_celebration':
        return (
          <div
            style={{
              width: '100%',
              height: '76px',
              borderRadius: 'var(--hw-radius-sm)',
              background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.3) 0%, rgba(38, 32, 31, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <PartyPopper size={36} color="#FFD700" strokeWidth={1.8} />
          </div>
        );

      case 'celebration_crackers':
        return (
          <div
            style={{
              width: '100%',
              height: '76px',
              borderRadius: 'var(--hw-radius-sm)',
              background: 'radial-gradient(circle at center, rgba(255, 179, 0, 0.3) 0%, rgba(38, 32, 31, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Sparkles size={36} color="#FFB300" strokeWidth={1.8} />
          </div>
        );

      case 'flame_frost':
        return (
          <div
            style={{
              width: '100%',
              height: '76px',
              borderRadius: 'var(--hw-radius-sm)',
              background: 'radial-gradient(circle at center, rgba(0, 229, 255, 0.3) 0%, rgba(38, 32, 31, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Zap size={36} color="#00E5FF" strokeWidth={1.8} />
          </div>
        );

      default:
        return <Heart size={32} color="var(--hw-accent-rose)" />;
    }
  };

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '10px',
        borderRadius: 'var(--hw-radius-md)',
        backgroundColor: isSelected ? 'var(--hw-surface-elevated)' : 'var(--hw-bg-secondary)',
        border: `1px solid ${
          isSelected ? 'var(--hw-accent-primary)' : 'var(--hw-border-subtle)'
        }`,
        cursor: 'pointer',
        transition: 'all var(--hw-transition-fast)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: isSelected ? 'var(--hw-shadow-accent)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--hw-border-medium)';
          e.currentTarget.style.backgroundColor = 'var(--hw-surface-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--hw-border-subtle)';
          e.currentTarget.style.backgroundColor = 'var(--hw-bg-secondary)';
        }
      }}
    >
      {/* Top Visual Preview */}
      {renderThumbnail()}

      {/* Title & Favorite Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--hw-text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {effect.name}
        </h4>

        <button
          onClick={onToggleFavorite}
          title={effect.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          style={{
            padding: '4px',
            borderRadius: '4px',
            color: effect.isFavorite ? 'var(--hw-accent-champagne)' : 'var(--hw-text-muted)',
            transition: 'color var(--hw-transition-fast)',
          }}
        >
          <Star
            size={13}
            fill={effect.isFavorite ? 'var(--hw-accent-champagne)' : 'none'}
            strokeWidth={1.8}
          />
        </button>
      </div>

      {/* Gesture Trigger Info Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 6px',
          borderRadius: 'var(--hw-radius-xs)',
          backgroundColor: 'var(--hw-bg-primary)',
          fontSize: '10px',
          color: 'var(--hw-text-secondary)',
        }}
      >
        <span style={{ color: 'var(--hw-accent-rose)', fontWeight: 500 }}>
          {effect.gestureName}
        </span>
        <span
          style={{
            fontSize: '9px',
            color: 'var(--hw-text-muted)',
            backgroundColor: 'var(--hw-surface-subtle)',
            padding: '1px 4px',
            borderRadius: '3px',
          }}
        >
          {effect.phaseAvailability}
        </span>
      </div>
    </div>
  );
};
