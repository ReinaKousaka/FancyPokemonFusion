import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POKEMON_DIR = path.join(__dirname, 'public', 'pokemon');
const DATA_FILE = path.join(__dirname, 'public', 'pokemon.json');

// Ensure public and public/pokemon directories exist
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}
if (!fs.existsSync(POKEMON_DIR)) {
  fs.mkdirSync(POKEMON_DIR);
}

// List of the first 493 Pokemon IDs (Generation 1 to Generation 4)
const POKEMON_IDS = Array.from({ length: 493 }, (_, i) => i + 1);

async function downloadImage(url, filepath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.promises.writeFile(filepath, buffer);
}

async function fetchPokemonData(id) {
  const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch metadata for Pokemon #${id}`);
  const data = await response.json();
  
  // Format the name: capitalize first letter
  const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
  const types = data.types.map(t => t.type.name);
  
  // High-res official artwork
  const artworkUrl = data.sprites.other['official-artwork'].front_default;
  
  return {
    id,
    name,
    types,
    artworkUrl,
    localImageUrl: `/pokemon/${id}.png`
  };
}

async function run() {
  console.log('Starting Pokemon metadata and image download (493 Pokemons)...');
  const pokemonList = [];
  
  // We can fetch in chunks to avoid rate limiting or overwhelming network
  const CHUNK_SIZE = 10;
  for (let i = 0; i < POKEMON_IDS.length; i += CHUNK_SIZE) {
    const chunk = POKEMON_IDS.slice(i, i + CHUNK_SIZE);
    console.log(`Downloading metadata for Pokemons #${chunk[0]} to #${chunk[chunk.length - 1]}...`);
    
    const promises = chunk.map(async (id) => {
      try {
        const metadata = await fetchPokemonData(id);
        const imagePath = path.join(POKEMON_DIR, `${id}.png`);
        
        // Skip downloading if the high-res image already exists locally
        if (!fs.existsSync(imagePath)) {
          await downloadImage(metadata.artworkUrl, imagePath);
          console.log(`Successfully downloaded #${id} ${metadata.name}`);
        } else {
          console.log(`Skipped download for #${id} ${metadata.name} (already exists)`);
        }
        
        // Remove raw artworkUrl to keep local references
        delete metadata.artworkUrl;
        pokemonList.push(metadata);
      } catch (err) {
        console.error(`Error downloading Pokemon #${id}:`, err.message);
      }
    });
    
    await Promise.all(promises);
  }
  
  // Sort list by ID
  pokemonList.sort((a, b) => a.id - b.id);
  
  // Save metadata JSON
  fs.writeFileSync(DATA_FILE, JSON.stringify(pokemonList, null, 2));
  console.log(`Saved metadata for ${pokemonList.length} Pokemons to ${DATA_FILE}`);
  console.log('Download complete!');
}

run().catch(console.error);
