import React, { useState, useEffect, useRef } from 'react';
import FusionCanvas, { backgroundThemes } from './components/FusionCanvas';
import PromptSection from './components/PromptSection';
import PartSelector from './components/PartSelector';
import SavedGallery from './components/SavedGallery';
import './App.css';

const defaultAdjustments = {
  body: { x: 0, y: 30, scale: 1.0, rotate: 0, flip: false },
  head: { x: 0, y: -70, scale: 0.65, rotate: 0, flip: false, front: true },
  wings: { x: 0, y: -20, scale: 0.9, rotate: 0, flip: false, front: false },
  tail: { x: -90, y: 70, scale: 0.75, rotate: 20, flip: false, front: false }
};

function App() {
  const canvasRef = useRef(null);
  const [pokemonList, setPokemonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Selected Pokemons for each role
  const [body, setBody] = useState(null);
  const [head, setHead] = useState(null);
  const [wings, setWings] = useState(null);
  const [tail, setTail] = useState(null);
  const [color, setColor] = useState(null);

  // Layer adjustments
  const [adjustments, setAdjustments] = useState(defaultAdjustments);

  // Global settings
  const [colorIntensity, setColorIntensity] = useState(0.85);
  const [matchAllColors, setMatchAllColors] = useState(true);
  const [theme, setTheme] = useState('meadow');

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

    // Load gallery from localStorage
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

    // If we select a part that was previously empty, apply defaults
    if (pokemon) {
      const currentVal = {
        body,
        head,
        wings,
        tail,
        color
      }[role];

      if (!currentVal) {
        setAdjustments(prev => ({
          ...prev,
          [role]: { ...defaultAdjustments[role] }
        }));
      }
    }
  };

  const handleAdjustmentChange = (role, newFields) => {
    setAdjustments(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        ...newFields
      }
    }));
  };

  const handleFuseApplied = (config) => {
    if (config.body !== undefined) setBody(config.body);
    if (config.head !== undefined) setHead(config.head);
    if (config.wings !== undefined) setWings(config.wings);
    if (config.tail !== undefined) setTail(config.tail);
    if (config.color !== undefined) setColor(config.color);
    
    // Apply reset to positions to avoid weird layouts when parsing new Pokemons
    setAdjustments(defaultAdjustments);
  };

  const handleClearAll = () => {
    setBody(null);
    setHead(null);
    setWings(null);
    setTail(null);
    setColor(null);
    setAdjustments(defaultAdjustments);
    setColorIntensity(0.85);
    setMatchAllColors(true);
    setTheme('meadow');
  };

  const handleRandomize = () => {
    if (pokemonList.length === 0) return;

    const getRandomPokemon = () => pokemonList[Math.floor(Math.random() * pokemonList.length)];

    const rBody = getRandomPokemon();
    const rColor = getRandomPokemon();
    
    // 85% chance of head, 60% chance of wings, 60% chance of tail
    const rHead = Math.random() < 0.85 ? getRandomPokemon() : null;
    const rWings = Math.random() < 0.60 ? getRandomPokemon() : null;
    const rTail = Math.random() < 0.60 ? getRandomPokemon() : null;

    setBody(rBody);
    setColor(rColor);
    setHead(rHead);
    setWings(rWings);
    setTail(rTail);

    // Randomize offsets slightly for uniqueness
    setAdjustments({
      body: { 
        x: Math.round((Math.random() - 0.5) * 40), 
        y: Math.round(30 + (Math.random() - 0.5) * 30), 
        scale: parseFloat((0.9 + Math.random() * 0.2).toFixed(2)), 
        rotate: Math.round((Math.random() - 0.5) * 15), 
        flip: Math.random() < 0.5 
      },
      head: { 
        x: Math.round((Math.random() - 0.5) * 50), 
        y: Math.round(-80 + (Math.random() - 0.5) * 40), 
        scale: parseFloat((0.55 + Math.random() * 0.2).toFixed(2)), 
        rotate: Math.round((Math.random() - 0.5) * 30), 
        flip: Math.random() < 0.5,
        front: true
      },
      wings: { 
        x: Math.round((Math.random() - 0.5) * 40), 
        y: Math.round(-20 + (Math.random() - 0.5) * 30), 
        scale: parseFloat((0.75 + Math.random() * 0.3).toFixed(2)), 
        rotate: Math.round((Math.random() - 0.5) * 20), 
        flip: Math.random() < 0.5,
        front: Math.random() < 0.2 // mostly behind
      },
      tail: { 
        x: Math.round(-90 + (Math.random() - 0.5) * 40), 
        y: Math.round(60 + (Math.random() - 0.5) * 40), 
        scale: parseFloat((0.65 + Math.random() * 0.3).toFixed(2)), 
        rotate: Math.round((Math.random() - 0.5) * 40), 
        flip: Math.random() < 0.5,
        front: Math.random() < 0.3 // mostly behind
      }
    });

    // Randomize background theme
    const themes = Object.keys(backgroundThemes);
    setTheme(themes[Math.floor(Math.random() * themes.length)]);
  };

  const handleSaveGallery = () => {
    if (!body || !canvasRef.current) return;

    // Generate name based on parts
    const bodyPrefix = body.name.slice(0, Math.ceil(body.name.length / 2));
    const headSuffix = head ? head.name.slice(Math.floor(head.name.length / 2)) : '';
    let fusionName = bodyPrefix + headSuffix;
    
    if (wings && Math.random() < 0.5) {
      fusionName += wings.name.slice(0, 3);
    }
    if (tail && Math.random() < 0.5) {
      fusionName = fusionName.slice(0, -2) + tail.name.slice(-3);
    }
    fusionName = fusionName.charAt(0).toUpperCase() + fusionName.slice(1).toLowerCase();

    // Ask user for a custom name, otherwise use generated
    const customName = prompt("Name your creation:", fusionName);
    if (customName === null) return; // cancel
    const finalName = customName.trim() || fusionName;

    const dataUrl = canvasRef.current.getDataUrl();
    if (!dataUrl) return;

    const newItem = {
      id: Date.now().toString(),
      name: finalName,
      thumbnail: dataUrl,
      config: {
        body,
        head,
        wings,
        tail,
        color,
        adjustments,
        colorIntensity,
        matchAllColors,
        theme
      }
    };

    const updatedGallery = [newItem, ...gallery];
    setGallery(updatedGallery);
    localStorage.setItem('pokemon_fusions', JSON.stringify(updatedGallery));
  };

  const handleLoadFusion = (config) => {
    setBody(config.body);
    setHead(config.head);
    setWings(config.wings);
    setTail(config.tail);
    setColor(config.color);
    setAdjustments(config.adjustments);
    setColorIntensity(config.colorIntensity);
    setMatchAllColors(config.matchAllColors);
    setTheme(config.theme || 'meadow');
  };

  const handleDeleteFusion = (id) => {
    const updatedGallery = gallery.filter(item => item.id !== id);
    setGallery(updatedGallery);
    localStorage.setItem('pokemon_fusions', JSON.stringify(updatedGallery));
  };

  const handleDownload = () => {
    if (canvasRef.current && body) {
      const bodyPrefix = body.name.slice(0, Math.ceil(body.name.length / 2));
      const headSuffix = head ? head.name.slice(Math.floor(head.name.length / 2)) : '';
      const filename = `${bodyPrefix}${headSuffix}-fusion.png`.toLowerCase();
      canvasRef.current.download(filename);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="pokeball-spinner"></div>
        <h2 className="page-loader-text">LOADING POKÉDEX DATA...</h2>
      </div>
    );
  }

  const activeThemeObj = backgroundThemes[theme] || backgroundThemes.meadow;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1>FANCY POKÉMON FUSION STUDIO</h1>
        <p>
          Mix and match up to 5 Pokémon parts. Adjust scales, offsets, color themes, 
          and generate custom mashups using our canvas color-blending engine or NLP text prompts.
        </p>
      </header>

      {/* Main Grid */}
      <main className="main-grid">
        {/* Left Column: Visual Canvas Workspace */}
        <section className="canvas-panel">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 0', textAlign: 'center' }}>
            🧪 Workspace Arena
          </h3>

          <FusionCanvas
            ref={canvasRef}
            body={body}
            head={head}
            wings={wings}
            tail={tail}
            color={color}
            adjustments={adjustments}
            colorIntensity={colorIntensity}
            matchAllColors={matchAllColors}
            theme={theme}
            onProcessingChange={setIsProcessing}
          />

          {/* Action buttons */}
          <div className="canvas-actions">
            <button
              type="button"
              onClick={handleRandomize}
              className="action-btn"
              title="Fuse completely random Pokemons"
            >
              🎲 Randomize All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="action-btn"
              title="Clear all selected Pokemons"
            >
              🧹 Clear Arena
            </button>
            <button
              type="button"
              onClick={handleSaveGallery}
              disabled={!body || isProcessing}
              className="action-btn"
              title="Save to local collection"
            >
              💾 Save Creation
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!body || isProcessing}
              className="action-btn primary"
              title="Download fusion image"
            >
              📥 Download PNG
            </button>
          </div>

          {/* Arena Background Theme Selector */}
          <div className="theme-selector">
            <label className="theme-selector-label">
              🏟️ Battle Arena Background
            </label>
            <div className="theme-selector-grid">
              {Object.entries(backgroundThemes).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  className={`theme-btn ${theme === key ? 'active' : ''}`}
                >
                  <span className="text-lg">{value.particles}</span>
                  <span>{value.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: Customizers, Text Prompts, and Gallery */}
        <section className="controls-container">
          {/* Prompt Parsing Section */}
          <PromptSection
            pokemonList={pokemonList}
            onFuseApplied={handleFuseApplied}
          />

          {/* Parts Selection & Control Panel */}
          <PartSelector
            pokemonList={pokemonList}
            body={body}
            head={head}
            wings={wings}
            tail={tail}
            color={color}
            adjustments={adjustments}
            colorIntensity={colorIntensity}
            matchAllColors={matchAllColors}
            onSelectPokemon={handleSelectPokemon}
            onAdjustmentChange={handleAdjustmentChange}
            onColorIntensityChange={setColorIntensity}
            onMatchAllColorsChange={setMatchAllColors}
          />

          {/* Gallery Grid */}
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
          Fancy Pokémon Fusion Studio &bull; Built with React &amp; HTML5 Canvas &bull; High Resolution resources powered by{' '}
          <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">
            PokeAPI
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
