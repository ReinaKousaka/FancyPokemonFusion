import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POKEMON_DIR = path.join(__dirname, '..', 'public', 'pokemon');

const DEFAULT_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
const PRO_MODEL = 'gemini-3-pro-image';

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '';
}

// Lazily import the SDK so the dev server still boots without a key installed.
let _ai = null;
async function getClient() {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  if (!_ai) {
    const { GoogleGenAI } = await import('@google/genai');
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5_000_000) reject(new Error('Request body too large'));
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function loadSprite(id) {
  const file = path.join(POKEMON_DIR, `${id}.png`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file).toString('base64');
}

/** GET /api/status — lets the UI know whether a key is configured. */
export function handleStatus(_req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      hasKey: Boolean(getApiKey()),
      defaultModel: DEFAULT_MODEL,
      proModel: PRO_MODEL,
    })
  );
}

/**
 * POST /api/fuse
 * Body: { prompt: string, imageIds: number[], model?: string }
 * Returns: { image: "data:image/png;base64,...", text?: string }
 */
export async function handleFuse(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const fail = (status, message) => {
    res.statusCode = status;
    res.end(JSON.stringify({ error: message }));
  };

  try {
    const ai = await getClient();
    if (!ai) {
      return fail(
        503,
        'No Gemini API key configured. Add GEMINI_API_KEY to a .env file in the project root and restart the dev server.'
      );
    }

    const { prompt, imageIds, model } = await readBody(req);
    if (!prompt || typeof prompt !== 'string') {
      return fail(400, 'Missing "prompt".');
    }
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return fail(400, 'Missing "imageIds" (at least one Pokémon required).');
    }

    // Build the parts array: instruction text first, then each source sprite in order.
    const parts = [{ text: prompt }];
    for (const id of imageIds) {
      const data = loadSprite(id);
      if (!data) return fail(400, `Sprite not found for Pokémon #${id}.`);
      parts.push({ inlineData: { mimeType: 'image/png', data } });
    }

    // Map the UI choice ('flash' | 'pro') to real model IDs. A raw model ID
    // (e.g. "gemini-3.1-flash-image") is also accepted and passed through.
    let chosenModel;
    if (model === 'pro') chosenModel = PRO_MODEL;
    else if (model === 'flash' || !model) chosenModel = DEFAULT_MODEL;
    else chosenModel = model;

    const response = await ai.models.generateContent({
      model: chosenModel,
      contents: [{ role: 'user', parts }],
      config: { responseModalities: ['Text', 'Image'] },
    });

    const candidate = response?.candidates?.[0];
    const outParts = candidate?.content?.parts || [];
    let image = null;
    let text = '';
    for (const part of outParts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        image = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        text += part.text;
      }
    }

    if (!image) {
      return fail(
        502,
        text
          ? `Model returned no image. It said: ${text.slice(0, 300)}`
          : 'Model returned no image (it may have refused the request).'
      );
    }

    res.end(JSON.stringify({ image, text, model: chosenModel }));
  } catch (err) {
    console.error('[/api/fuse] error:', err);
    fail(500, err?.message || 'Fusion failed.');
  }
}
