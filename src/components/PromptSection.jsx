import React, { useState } from 'react';
import { parsePrompt } from '../utils/promptParser';

const presetPrompts = [
  "Pikachu head on Charizard body with Mewtwo colors",
  "A Blastoise body with Caterpie head and Pikachu tail",
  "Gengar body, Mewtwo head, in Jolteon color with Zapdos wings",
  "Bulbasaur body, Eevee head, Dragonite wings",
  "Snorlax body with Butterfree wings in Arcanine color"
];

function PromptSection({ pokemonList, onFuseApplied }) {
  const [prompt, setPrompt] = useState('');
  const [parsed, setParsed] = useState(null);

  const handleTextChange = (text) => {
    setPrompt(text);
    const parsedResult = parsePrompt(text, pokemonList);
    setParsed(parsedResult);
  };

  const handleApply = (e) => {
    e.preventDefault();
    if (!parsed) return;
    onFuseApplied(parsed);
  };

  const handlePresetClick = (preset) => {
    setPrompt(preset);
    const parsedResult = parsePrompt(preset, pokemonList);
    setParsed(parsedResult);
    if (parsedResult) {
      onFuseApplied(parsedResult);
    }
  };

  return (
    <div className="prompt-section">
      <h3 className="prompt-title">
        <span>🔮</span> Text-Conditioned Fusion
      </h3>
      <p className="prompt-desc">
        Type a natural description specifying which Pokemon makes which part of the body.
      </p>

      <form onSubmit={handleApply} className="prompt-form">
        <input
          type="text"
          value={prompt}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="e.g. Pikachu head on Charizard body with Mewtwo colors..."
          className="prompt-input"
        />
        <button
          type="submit"
          disabled={!parsed}
          className="prompt-submit"
        >
          Fuse
        </button>
      </form>

      {/* Parsed Badges */}
      {parsed && (
        <div className="parsed-box">
          <div className="parsed-header">Parsed Configuration:</div>
          <div className="parsed-list">
            {parsed.body && (
              <span className="parsed-badge">
                <span className="parsed-badge-label">Body:</span>
                <span className="parsed-badge-value">{parsed.body.name}</span>
              </span>
            )}
            {parsed.head && (
              <span className="parsed-badge">
                <span className="parsed-badge-label">Head:</span>
                <span className="parsed-badge-value">{parsed.head.name}</span>
              </span>
            )}
            {parsed.color && (
              <span className="parsed-badge">
                <span className="parsed-badge-label">Color:</span>
                <span className="parsed-badge-value">{parsed.color.name}</span>
              </span>
            )}
            {parsed.wings && (
              <span className="parsed-badge">
                <span className="parsed-badge-label">Wings:</span>
                <span className="parsed-badge-value">{parsed.wings.name}</span>
              </span>
            )}
            {parsed.tail && (
              <span className="parsed-badge">
                <span className="parsed-badge-label">Tail:</span>
                <span className="parsed-badge-value">{parsed.tail.name}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Preset Suggestions */}
      <div>
        <div className="presets-label">Try these ideas:</div>
        <div className="presets-list">
          {presetPrompts.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="preset-btn"
            >
              "{preset}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PromptSection;
