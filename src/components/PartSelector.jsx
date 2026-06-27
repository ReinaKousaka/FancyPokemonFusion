import React, { useState } from 'react';

const pokemonTypes = [
  'all', 'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 
  'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon'
];

function PartSelector({
  pokemonList,
  body,
  head,
  wings,
  tail,
  color,
  adjustments,
  colorIntensity,
  matchAllColors,
  onSelectPokemon,
  onAdjustmentChange,
  onColorIntensityChange,
  onMatchAllColorsChange
}) {
  const [activeTab, setActiveTab] = useState('body'); // body, head, color, wings, tail
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const tabs = [
    { id: 'body', name: 'Body', current: body, optional: false },
    { id: 'head', name: 'Head/Face', current: head, optional: true },
    { id: 'color', name: 'Color Theme', current: color, optional: false },
    { id: 'wings', name: 'Back/Wings', current: wings, optional: true },
    { id: 'tail', name: 'Tail/Extra', current: tail, optional: true }
  ];

  const handleResetAdjustments = (role) => {
    onAdjustmentChange(role, {
      x: 0,
      y: 0,
      scale: role === 'body' ? 1.0 : role === 'head' ? 0.7 : role === 'wings' ? 0.9 : 0.8,
      rotate: 0,
      flip: false,
      front: role === 'head'
    });
  };

  const filteredPokemon = pokemonList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || p.types.includes(selectedType);
    return matchesSearch && matchesType;
  });

  const getRoleLabel = (role) => {
    if (role === 'body') return 'Base Body';
    if (role === 'head') return 'Head / Face';
    if (role === 'color') return 'Color Palette';
    if (role === 'wings') return 'Back Attachment (Wings/Cannons)';
    if (role === 'tail') return 'Extra Attachment (Tail/Horns)';
    return '';
  };

  return (
    <div className="part-selector-panel">
      {/* Category Tabs */}
      <div className="selector-tabs scrollbar-thin">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery('');
              setSelectedType('all');
            }}
            className={`selector-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.name}
            {tab.current ? (
              <span className="selector-tab-sub">{tab.current.name}</span>
            ) : (
              <span className="selector-tab-sub empty">None</span>
            )}
          </button>
        ))}
      </div>

      {/* Main Tab Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <div className="panel-header-row">
            <h4 className="panel-title">
              Select {getRoleLabel(activeTab)}
            </h4>
            {tabs.find(t => t.id === activeTab)?.optional && tabs.find(t => t.id === activeTab)?.current && (
              <button
                type="button"
                onClick={() => onSelectPokemon(activeTab, null)}
                className="clear-btn"
              >
                Clear Attachment
              </button>
            )}
          </div>

          {/* Search & Filters */}
          <div className="filter-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search Pokemon for ${activeTab}...`}
              className="search-input"
            />
            
            {/* Type Pills */}
            <div className="type-filters scrollbar-thin">
              {pokemonTypes.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`type-btn ${selectedType === type ? 'active' : ''}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Pokemon Grid */}
          <div className="pokemon-grid scrollbar-thin">
            {filteredPokemon.length > 0 ? (
              filteredPokemon.map(p => {
                const isSelected = tabs.find(t => t.id === activeTab)?.current?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectPokemon(activeTab, p)}
                    className={`pokemon-card-btn ${isSelected ? 'active' : ''}`}
                  >
                    <img
                      src={p.localImageUrl}
                      alt={p.name}
                      loading="lazy"
                      className="pokemon-card-img"
                    />
                    <span className="pokemon-card-name">
                      {p.name}
                    </span>
                  </button>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No Pokemon matched search/filters
              </div>
            )}
          </div>
        </div>

        {/* Adjustments Panel */}
        {activeTab !== 'color' && tabs.find(t => t.id === activeTab)?.current && (
          <div className="adjustments-box">
            <div className="adjustments-header">
              <h5 className="adjustments-title">
                {tabs.find(t => t.id === activeTab)?.current?.name} Position & Size
              </h5>
              <button
                type="button"
                onClick={() => handleResetAdjustments(activeTab)}
                className="reset-link"
              >
                Reset Layout
              </button>
            </div>

            <div className="sliders-grid">
              {/* Offset X Slider */}
              <div className="slider-group">
                <div className="slider-label-row">
                  <span className="slider-label">Horizontal (X Offset)</span>
                  <span className="slider-value">{adjustments[activeTab].x}px</span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={adjustments[activeTab].x}
                  onChange={(e) => onAdjustmentChange(activeTab, { x: parseInt(e.target.value, 10) })}
                  className="slider-input"
                />
              </div>

              {/* Offset Y Slider */}
              <div className="slider-group">
                <div className="slider-label-row">
                  <span className="slider-label">Vertical (Y Offset)</span>
                  <span className="slider-value">{adjustments[activeTab].y}px</span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={adjustments[activeTab].y}
                  onChange={(e) => onAdjustmentChange(activeTab, { y: parseInt(e.target.value, 10) })}
                  className="slider-input"
                />
              </div>

              {/* Scale Slider */}
              <div className="slider-group">
                <div className="slider-label-row">
                  <span className="slider-label">Scale (Size)</span>
                  <span className="slider-value">{(adjustments[activeTab].scale || 1.0).toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  value={adjustments[activeTab].scale}
                  onChange={(e) => onAdjustmentChange(activeTab, { scale: parseFloat(e.target.value) })}
                  className="slider-input"
                />
              </div>

              {/* Rotation Slider */}
              <div className="slider-group">
                <div className="slider-label-row">
                  <span className="slider-label">Rotation (Angle)</span>
                  <span className="slider-value">{adjustments[activeTab].rotate}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={adjustments[activeTab].rotate}
                  onChange={(e) => onAdjustmentChange(activeTab, { rotate: parseInt(e.target.value, 10) })}
                  className="slider-input"
                />
              </div>
            </div>

            {/* Mirror / Flip and Depth Toggles */}
            <div className="toggles-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={adjustments[activeTab].flip || false}
                  onChange={(e) => onAdjustmentChange(activeTab, { flip: e.target.checked })}
                />
                Mirror Horizontally
              </label>

              {(activeTab === 'wings' || activeTab === 'tail') && (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={adjustments[activeTab].front || false}
                    onChange={(e) => onAdjustmentChange(activeTab, { front: e.target.checked })}
                  />
                  Render in Front of Body
                </label>
              )}
            </div>
          </div>
        )}

        {/* Global Color Settings Panel */}
        {activeTab === 'color' && (
          <div className="color-settings-box">
            <h5 className="color-settings-title">
              Color Transfer Settings
            </h5>

            {/* Blend Intensity Slider */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span className="slider-label">Color Shift Intensity</span>
                <span className="slider-value">{Math.round(colorIntensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={colorIntensity}
                onChange={(e) => onColorIntensityChange(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>

            {/* Match Colors Toggle */}
            <label className="checkbox-label" style={{ alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={matchAllColors}
                onChange={(e) => onMatchAllColorsChange(e.target.checked)}
                style={{ marginTop: '3px' }}
              />
              <div className="color-toggle-description">
                <div className="color-toggle-title">Unify Attached Parts Colors</div>
                <div className="color-toggle-subtitle">
                  Apply the Color Palette to the Head, Wings, and Tail attachments as well so they blend seamlessly together.
                </div>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default PartSelector;
