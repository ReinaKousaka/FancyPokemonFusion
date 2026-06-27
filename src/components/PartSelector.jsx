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
  activeTab,
  onTabChange,
  onSelectPokemon
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const tabs = [
    { id: 'body', name: 'Body', current: body, optional: false },
    { id: 'head', name: 'Head/Face', current: head, optional: true },
    { id: 'color', name: 'Color Theme', current: color, optional: false },
    { id: 'wings', name: 'Back/Wings', current: wings, optional: true },
    { id: 'tail', name: 'Tail/Extra', current: tail, optional: true }
  ];

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

  const activeTabObj = tabs.find(t => t.id === activeTab);

  return (
    <div className="part-selector-panel">
      {/* Category Tabs */}
      <div className="selector-tabs scrollbar-thin">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              onTabChange(tab.id);
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
      <div>
        <div className="panel-header-row">
          <h4 className="panel-title">
            Select {getRoleLabel(activeTab)}
          </h4>
          {activeTabObj?.optional && activeTabObj?.current && (
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
              const isSelected = activeTabObj?.current?.id === p.id;
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
    </div>
  );
}

export default PartSelector;
