import React, { useState, useEffect } from 'react';
import FusionSlots from './components/FusionSlots';
import AiFusionPanel from './components/AiFusionPanel';
import PromptSection from './components/PromptSection';
import PartSelector from './components/PartSelector';
import SavedGallery from './components/SavedGallery';
import './App.css';

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Pokemons for each role
  const [body, setBody] = useState(null);
  const [head, setHead] = useState(null);
  const [wings, setWings] = useState(null);
  const [tail, setTail] = useState(null);
  const [color, setColor] = useState(null);

  // Which role the part-selector is currently editing
  const [activeRole, setActiveRole] = useState('body');

  // Saved creations list
  const [gallery, setGallery] = useState([]);

  // Fetch Pokemon metadata on mount
  useEffect(() => {
    fetch('/pokemon.json')
      .then(res => res.json())
      .then(data => {
        setPokemonList(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading Pokemon data:', err);
        setLoading(false);
      });

    const saved = localStorage.getItem('pokemon_fusions');
    if (saved) {
      try {
        setGallery(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSelectPokemon = (role, pokemon) => {
    if (role === 'body') {
      setBody(pokemon);
      if (!color) setColor(pokemon);
    }
    else if (role === 'head') setHead(pokemon);
    else if (role === 'wings') setWings(pokemon);
    else if (role === 'tail') setTail(pokemon);
    else if (role === 'color') setColor(pokemon);
  };

  const handleFuseApplied = (config) => {
    if (config.body !== undefined) setBody(config.body);
    if (config.head !== undefined) setHead(config.head);
    if (config.wings !== undefined) setWings(config.wings);
    if (config.tail !== undefined) setTail(config.tail);
    if (config.color !== undefined) setColor(config.color);
  };

  const handleClearAll = () => {
    setBody(null);
    setHead(null);
    setWings(null);
    setTail(null);
    setColor(null);
  };

  const handleRandomize = () => {
    if (pokemonList.length === 0) return;
    const pick = () => pokemonList[Math.floor(Math.random() * pokemonList.length)];

    setBody(pick());
    setColor(pick());
    setHead(Math.random() < 0.85 ? pick() : null);
    setWings(Math.random() < 0.5 ? pick() : null);
    setTail(Math.random() < 0.5 ? pick() : null);
  };

  const handleSaveAiResult = (dataUrl) => {
    if (!dataUrl) return;

    const bodyPrefix = body ? body.name.slice(0, Math.ceil(body.name.length / 2)) : 'Fusion';
    const headSuffix = head ? head.name.slice(Math.floor(head.name.length / 2)) : '';
    const generatedName = (bodyPrefix + headSuffix) || 'AI Fusion';

    const customName = prompt('Name your AI creation:', generatedName);
    if (customName === null) return;
    const finalName = customName.trim() || generatedName;

    const newItem = {
      id: Date.now().toString(),
      name: finalName,
      thumbnail: dataUrl,
      ai: true,
      config: { body, head, wings, tail, color }
    };

    const updatedGallery = [newItem, ...gallery];
    setGallery(updatedGallery);
    localStorage.setItem('pokemon_fusions', JSON.stringify(updatedGallery));
  };

  const handleLoadFusion = (config) => {
    setBody(config.body || null);
    setHead(config.head || null);
    setWings(config.wings || null);
    setTail(config.tail || null);
    setColor(config.color || null);
  };

  const handleDeleteFusion = (id) => {
    const updatedGallery = gallery.filter(item => item.id !== id);
    setGallery(updatedGallery);
    localStorage.setItem('pokemon_fusions', JSON.stringify(updatedGallery));
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="pokeball-spinner"></div>
        <h2 className="page-loader-text">LOADING POKÉDEX DATA...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1>FANCY POKÉMON FUSION STUDIO</h1>
        <p>
          Pick up to 5 Pokémon parts, then fuse them into one brand-new creature
          with Gemini "Nano Banana".
        </p>
      </header>

      {/* Main Grid */}
      <main className="main-grid">
        {/* Left Column: Slots + AI fusion output */}
        <section className="canvas-panel">
          <h3 className="workspace-heading">🧪 Fusion Slots</h3>

          <FusionSlots
            body={body}
            head={head}
            wings={wings}
            tail={tail}
            color={color}
            activeRole={activeRole}
            onSelectRole={setActiveRole}
            onClear={(role) => handleSelectPokemon(role, null)}
          />

          {/* Action buttons */}
          <div className="canvas-actions">
            <button type="button" onClick={handleRandomize} className="action-btn" title="Pick random Pokemons">
              🎲 Randomize All
            </button>
            <button type="button" onClick={handleClearAll} className="action-btn" title="Clear all slots">
              🧹 Clear Slots
            </button>
          </div>

          {/* Real generative fusion via Gemini "Nano Banana" */}
          <AiFusionPanel
            body={body}
            head={head}
            wings={wings}
            tail={tail}
            color={color}
            onSaveResult={handleSaveAiResult}
          />
        </section>

        {/* Right Column: Customizers, Text Prompts, and Gallery */}
        <section className="controls-container">
          <PromptSection
            pokemonList={pokemonList}
            onFuseApplied={handleFuseApplied}
          />

          <PartSelector
            pokemonList={pokemonList}
            body={body}
            head={head}
            wings={wings}
            tail={tail}
            color={color}
            activeTab={activeRole}
            onTabChange={setActiveRole}
            onSelectPokemon={handleSelectPokemon}
          />

          <SavedGallery
            gallery={gallery}
            onLoadFusion={handleLoadFusion}
            onDeleteFusion={handleDeleteFusion}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          Fancy Pokémon Fusion Studio &bull; Built with React &amp; Gemini Nano Banana &bull; Sprites from{' '}
          <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">
            PokeAPI
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
