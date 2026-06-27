#!/bin/bash
# Double-click this file to run the Fancy Pokémon Fusion website locally.
# (macOS opens .command files in Terminal.)

# Always work from the folder this script lives in.
cd "$(dirname "$0")" || exit 1

echo "🎮  Fancy Pokémon Fusion — local launcher"
echo "----------------------------------------"

# 1. Check Node/npm is installed.
if ! command -v npm >/dev/null 2>&1; then
  echo "❌ Node.js / npm is not installed."
  echo "   Install it from https://nodejs.org (LTS), then double-click this again."
  echo ""
  read -r -p "Press Enter to close..."
  exit 1
fi

# 2. Install dependencies the first time.
if [ ! -d node_modules ]; then
  echo "📦 Installing dependencies (first run only, may take a minute)..."
  npm install || { echo "❌ npm install failed."; read -r -p "Press Enter to close..."; exit 1; }
fi

# 3. Warn if no API key yet (the page still loads; AI fusion needs a key).
if [ ! -f .env ] || ! grep -q "GEMINI_API_KEY=AIza" .env 2>/dev/null; then
  echo ""
  echo "⚠️  No Gemini API key detected in .env"
  echo "   The site will open, but 'Generate Fusion' won't work until you add a key."
  echo "   See README.md → Setup."
  echo ""
fi

# 4. Open the browser once the server is up, then run the dev server.
URL="http://localhost:5173"
(
  for _ in $(seq 1 30); do
    if curl -s "$URL" >/dev/null 2>&1; then
      open "$URL"
      break
    fi
    sleep 1
  done
) &

echo "🚀 Starting server... your browser will open at $URL"
echo "   (Keep this window open. Press Ctrl+C to stop.)"
echo ""

npm run dev
