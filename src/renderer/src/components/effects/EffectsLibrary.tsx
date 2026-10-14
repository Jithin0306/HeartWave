import React from 'react';
import { Search, Users, Heart, Star, Sparkles, PanelRightClose } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { EffectCard } from './EffectCard';
import { EffectInspector } from './EffectInspector';
import { EffectCategory } from '../../types/effect';

const CATEGORIES: { id: EffectCategory; label: string }[] = [
  { id: 'all', label: 'All Effects' },
  { id: 'couples', label: 'Couples & Duo' },
  { id: 'romantic', label: 'Romantic FX' },
  { id: 'favorites', label: 'Favorites' },
];

export const EffectsLibrary: React.FC = () => {
  const {
    effects,
    selectedEffectId,
    setSelectedEffectId,
    toggleFavorite,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    setActiveNav,
    toggleRightPanel,
  } = useAppStore();

  const handleCategorySelect = (catId: EffectCategory) => {
    setCategoryFilter(catId);
    if (catId === 'all') setActiveNav('home');
    else if (catId === 'couples') setActiveNav('couples');
    else if (catId === 'romantic') setActiveNav('romantic');
    else if (catId === 'favorites') setActiveNav('favorites');
  };

  const filteredEffects = effects.filter((effect) => {
    // Category match
    if (categoryFilter === 'romantic' && effect.category !== 'romantic') return false;
    if (categoryFilter === 'couples' && effect.category !== 'couples') return false;
    if (categoryFilter === 'favorites' && !effect.isFavorite) return false;

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        effect.name.toLowerCase().includes(q) ||
        effect.gestureName.toLowerCase().includes(q) ||
        effect.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getHeaderTitle = () => {
    switch (categoryFilter) {
      case 'couples':
        return 'Couples & Duo Mode';
      case 'romantic':
        return 'Romantic Visual Studio';
      case 'favorites':
        return 'Starred Favorites';
      default:
        return 'Effects Studio';
    }
  };

  return (
    <aside
      style={{
        width: '350px',
        backgroundColor: 'var(--hw-bg-secondary)',
        borderLeft: '1px solid var(--hw-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '16px 16px 12px 16px',
          borderBottom: '1px solid var(--hw-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {categoryFilter === 'couples' && <Users size={16} color="var(--hw-accent-rose)" />}
            {categoryFilter === 'romantic' && <Heart size={16} color="var(--hw-accent-champagne)" />}
            {categoryFilter === 'favorites' && <Star size={16} color="#e5a83b" />}
            {categoryFilter === 'all' && <Sparkles size={16} color="var(--hw-accent-rose)" />}
            <h2
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--hw-text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {getHeaderTitle()}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--hw-text-muted)',
                backgroundColor: 'var(--hw-surface-elevated)',
                padding: '2px 8px',
                borderRadius: 'var(--hw-radius-full)',
              }}
            >
              {filteredEffects.length} Effects
            </span>

            <button
              onClick={toggleRightPanel}
              title="Collapse Effects Studio"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: 'var(--hw-radius-sm)',
                backgroundColor: 'var(--hw-surface-elevated)',
                border: '1px solid var(--hw-border-subtle)',
                color: 'var(--hw-text-muted)',
                cursor: 'pointer',
                transition: 'all var(--hw-transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hw-surface-hover)';
                e.currentTarget.style.color = 'var(--hw-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hw-surface-elevated)';
                e.currentTarget.style.color = 'var(--hw-text-muted)';
              }}
            >
              <PanelRightClose size={14} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: 'var(--hw-radius-md)',
            backgroundColor: 'var(--hw-bg-primary)',
            border: '1px solid var(--hw-border-subtle)',
          }}
        >
          <Search size={13} color="var(--hw-text-muted)" />
          <input
            type="text"
            placeholder="Search effects or gestures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              fontSize: '12px',
              color: 'var(--hw-text-primary)',
            }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--hw-radius-full)',
                  fontSize: '11px',
                  fontWeight: 500,
                  backgroundColor: isSelected ? 'var(--hw-accent-burgundy)' : 'var(--hw-surface-elevated)',
                  color: isSelected ? 'var(--hw-text-primary)' : 'var(--hw-text-secondary)',
                  border: `1px solid ${isSelected ? 'var(--hw-accent-primary)' : 'var(--hw-border-subtle)'}`,
                  transition: 'all var(--hw-transition-fast)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Contextual Mode Guidance Banners */}
        {categoryFilter === 'couples' && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--hw-radius-md)',
              backgroundColor: 'rgba(232, 44, 85, 0.08)',
              border: '1px solid rgba(232, 44, 85, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={13} color="var(--hw-accent-rose)" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--hw-accent-rose)' }}>
                Couples & Duo Tracking
              </span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--hw-text-secondary)', lineHeight: 1.4, margin: 0 }}>
              Optimized for dual-hand detection and joint webcam poses. Form two-hand hearts or dual palms together with your partner.
            </p>
          </div>
        )}

        {categoryFilter === 'romantic' && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--hw-radius-md)',
              backgroundColor: 'rgba(214, 189, 145, 0.08)',
              border: '1px solid rgba(214, 189, 145, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Heart size={13} color="var(--hw-accent-champagne)" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--hw-accent-champagne)' }}>
                Romantic Particle Atmosphere
              </span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--hw-text-secondary)', lineHeight: 1.4, margin: 0 }}>
              Sculptural 3D roses, drifting petal flutter, and golden finger shimmers calibrated for emotional warmth.
            </p>
          </div>
        )}

        {categoryFilter === 'favorites' && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--hw-radius-md)',
              backgroundColor: 'rgba(229, 168, 59, 0.08)',
              border: '1px solid rgba(229, 168, 59, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={13} color="#e5a83b" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#e5a83b' }}>
                Your Starred Collection
              </span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--hw-text-secondary)', lineHeight: 1.4, margin: 0 }}>
              Pinned effects for fast one-click activation without searching.
            </p>
          </div>
        )}
      </div>

      {/* Scrollable Effect Cards Grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          alignContent: 'start',
        }}
      >
        {filteredEffects.map((effect) => (
          <EffectCard
            key={effect.id}
            effect={effect}
            isSelected={selectedEffectId === effect.id}
            onSelect={() => setSelectedEffectId(effect.id)}
            onToggleFavorite={(e) => {
              e.stopPropagation();
              toggleFavorite(effect.id);
            }}
          />
        ))}

        {filteredEffects.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '36px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Star size={24} color="var(--hw-text-muted)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--hw-text-secondary)' }}>
              {categoryFilter === 'favorites' ? 'No Starred Effects Yet' : 'No effects match your filter'}
            </span>
            <p style={{ fontSize: '11px', color: 'var(--hw-text-muted)', maxWidth: '240px', lineHeight: 1.4, margin: 0 }}>
              {categoryFilter === 'favorites'
                ? 'Click the star icon on any effect card to pin it here for instant access.'
                : 'Try adjusting your search query or switching categories.'}
            </p>
          </div>
        )}
      </div>

      {/* Selected Effect Inspector at Bottom */}
      <EffectInspector />
    </aside>
  );
};
