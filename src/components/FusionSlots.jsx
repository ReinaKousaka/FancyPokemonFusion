import React from 'react';

const SLOTS = [
  { role: 'body', label: 'Body', icon: '🧍', required: true },
  { role: 'head', label: 'Head', icon: '😀' },
  { role: 'wings', label: 'Wings / Back', icon: '🪽' },
  { role: 'tail', label: 'Tail / Extra', icon: '🌀' },
  { role: 'color', label: 'Color', icon: '🎨', required: true },
];

/**
 * Shows each selected Pokémon in its own clean slot (no overlapping).
 * Slots double as a picker: clicking one focuses that role in the selector.
 */
function FusionSlots({ body, head, wings, tail, color, activeRole, onSelectRole, onClear }) {
  const map = { body, head, wings, tail, color };

  return (
    <div className="fusion-slots">
      {SLOTS.map((slot) => {
        const p = map[slot.role];
        const isActive = activeRole === slot.role;
        return (
          <button
            type="button"
            key={slot.role}
            onClick={() => onSelectRole?.(slot.role)}
            className={`fusion-slot ${p ? 'filled' : 'empty'} ${isActive ? 'active' : ''}`}
          >
            <div className="fusion-slot-label">
              <span>{slot.icon}</span> {slot.label}
              {!slot.required && <span className="fusion-slot-opt">optional</span>}
            </div>

            <div className="fusion-slot-art">
              {p ? (
                <img src={p.localImageUrl} alt={p.name} className="fusion-slot-img" />
              ) : (
                <span className="fusion-slot-plus">+</span>
              )}
              {p && !slot.required && (
                <span
                  className="fusion-slot-clear"
                  role="button"
                  title="Remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear?.(slot.role);
                  }}
                >
                  ×
                </span>
              )}
            </div>

            <div className="fusion-slot-name">{p ? p.name : 'Empty'}</div>
          </button>
        );
      })}
    </div>
  );
}

export default FusionSlots;
