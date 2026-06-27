# Fancy Pokémon Fusion Studio

Mix and match up to 5 Pokémon parts (body / head / wings / tail / color), then
generate a **real fused creature** with Google's Gemini image model
("Nano Banana") — not just a layered overlay.

There are two outputs side by side:

1. **Live reference preview** — the canvas compositor (offsets/scale/color
   transfer). Fast, fully client-side, good for blocking out the idea.
2. **AI Fusion** — sends the selected sprites + an auto-built prompt (plus your
   optional free-text direction) to Gemini and returns one coherent fused
   Pokémon.

## Setup

```bash
npm install
```

### Add your Gemini API key (required for AI Fusion)

1. Create a key at <https://aistudio.google.com/apikey>. Create it **inside a
   Google Cloud project linked to a billing account** so usage draws from your
   credits.
2. Copy `.env.example` to `.env` and paste the key:

   ```
   GEMINI_API_KEY=AIza...your_key...
   ```

   `.env` is gitignored — the key stays server-side and never reaches the
   browser.

### Run

```bash
npm run dev
```

> If you add or change `.env`, **restart `npm run dev`** — env vars are read
> when the dev server boots.

## Models

Default is **Nano Banana 2** (`gemini-3.1-flash-image`, fast/cheap). Toggle to
**Pro** (`gemini-3-pro-image`) per generation in the AI panel for higher
fidelity. Override the default with `GEMINI_IMAGE_MODEL` in `.env`.

## How it works

- `vite.config.js` registers a dev-server middleware exposing the API on the
  same port, so one command runs everything:
  - `GET  /api/status` → whether a key is configured + model names.
  - `POST /api/fuse` → `{ prompt, imageIds, model }` → `{ image, text, model }`.
- `server/fuseHandler.js` loads the local sprites in `public/pokemon/<id>.png`,
  forwards them with the prompt to Gemini via `@google/genai`, and returns the
  generated image as a data URL.
- `src/utils/buildFusionPrompt.js` turns the role→Pokémon selection into the
  instruction text and the ordered image list.

> **Production note:** the API lives in Vite dev middleware. For a real
> deployment, serve `server/fuseHandler.js` from a small Node/Express server or
> a serverless function and point the frontend at it.

## Refreshing sprites

`node download_pokemon_assets.js` re-downloads the first 151 Pokémon
(official artwork) and rebuilds `public/pokemon.json`.
