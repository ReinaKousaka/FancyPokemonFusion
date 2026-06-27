import React, { useState, useEffect, useMemo } from 'react';
import { buildFusionPrompt } from '../utils/buildFusionPrompt';

function AiFusionPanel({ body, head, wings, tail, color, onSaveResult }) {
  const [status, setStatus] = useState(null); // { hasKey, defaultModel, proModel }
  const [modelChoice, setModelChoice] = useState('flash'); // 'flash' | 'pro'
  const [condition, setCondition] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { image, prompt, model }
  const [error, setError] = useState(null);

  // Check whether the server has an API key configured.
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ hasKey: false }));
  }, []);

  const { prompt, imageIds, summary } = useMemo(
    () => buildFusionPrompt({ body, head, wings, tail, color }, condition),
    [body, head, wings, tail, color, condition]
  );

  const canGenerate = imageIds.length > 0 && !loading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageIds, model: modelChoice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setResult({ image: data.image, prompt, model: data.model });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.image) return;
    const link = document.createElement('a');
    const namePart = (body?.name || 'fusion').toLowerCase();
    link.download = `${namePart}-ai-fusion.png`;
    link.href = result.image;
    link.click();
  };

  const handleSave = () => {
    if (!result?.image) return;
    onSaveResult?.(result.image);
  };

  return (
    <div className="ai-fusion-panel">
      <div className="ai-fusion-header">
        <h3 className="ai-fusion-title">✨ AI Fusion (Nano Banana)</h3>
        <div className="ai-model-toggle">
          <button
            type="button"
            className={`ai-model-btn ${modelChoice === 'flash' ? 'active' : ''}`}
            onClick={() => setModelChoice('flash')}
            title="Gemini Flash Image — fast & cheap"
          >
            Flash
          </button>
          <button
            type="button"
            className={`ai-model-btn ${modelChoice === 'pro' ? 'active' : ''}`}
            onClick={() => setModelChoice('pro')}
            title="Gemini Pro Image — higher fidelity, slower"
          >
            Pro
          </button>
        </div>
      </div>

      {/* No-key warning */}
      {status && !status.hasKey && (
        <div className="ai-warning">
          ⚠️ No Gemini API key found. Add <code>GEMINI_API_KEY</code> to a{' '}
          <code>.env</code> file in the project root and restart{' '}
          <code>npm run dev</code>.
        </div>
      )}

      {/* Part summary */}
      {summary.length > 0 ? (
        <div className="ai-summary">
          {summary.map((s) => (
            <span key={s.role} className="ai-summary-chip">
              <strong>{s.role}</strong>: {s.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="ai-hint">Select at least a Body to enable AI fusion.</p>
      )}

      {/* Extra text condition (requirement #4) */}
      <textarea
        className="ai-condition-input"
        value={condition}
        onChange={(e) => setCondition(e.target.value)}
        placeholder="Optional extra direction — e.g. 'make it look fierce, Charizard's tail becomes the flame, glowing eyes'"
        rows={2}
      />

      <button
        type="button"
        className="ai-generate-btn"
        onClick={handleGenerate}
        disabled={!canGenerate}
      >
        {loading ? '🧬 Fusing… (this can take a few seconds)' : '⚡ Generate Fusion'}
      </button>

      {error && <div className="ai-error">❌ {error}</div>}

      {/* Result */}
      {result?.image && (
        <div className="ai-result">
          <img src={result.image} alt="AI fused Pokémon" className="ai-result-img" />
          <div className="ai-result-actions">
            <button type="button" className="action-btn" onClick={handleDownload}>
              📥 Download
            </button>
            <button type="button" className="action-btn" onClick={handleSave}>
              💾 Save to Gallery
            </button>
            <button
              type="button"
              className="action-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              🔄 Regenerate
            </button>
          </div>
          <details className="ai-prompt-details">
            <summary>View prompt sent to {result.model}</summary>
            <pre className="ai-prompt-pre">{result.prompt}</pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default AiFusionPanel;
