import React from 'react';
import { Search } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { EffectCard } from './EffectCard';
import { EffectInspector } from './EffectInspector';
import { EffectCategory } from '../../types/effect';

const CATEGORIES: { id: EffectCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'couples', label: 'Couples' },
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
  } = useAppStore();

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
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--hw-text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Effects Library
          </h2>
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
                onClick={() => setCategoryFilter(cat.id)}
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
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
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
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--hw-text-muted)',
              fontSize: '12px',
            }}
          >
            No effects match your filter.
          </div>
        )}
      </div>

      {/* Selected Effect Inspector at Bottom */}
      <EffectInspector />
    </aside>
  );
};
