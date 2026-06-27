/**
 * Parses natural text to extract Pokemon names and map them to parts: Body, Head, Wings, Tail, Color.
 * @param {string} prompt The text prompt inputted by the user.
 * @param {Array} pokemonList List of available Pokemons from metadata.
 * @returns {Object|null} A mapping of roles to Pokemon objects, or null if no Pokemons found.
 */
export function parsePrompt(prompt, pokemonList) {
  if (!prompt || !pokemonList || pokemonList.length === 0) return null;

  // Normalize text: lowercase, remove punctuation, remove possessives ('s)
  const text = prompt.toLowerCase().replace(/['s]/g, '').trim();

  // Find all mentioned pokemons and their index positions
  const mentions = [];
  pokemonList.forEach(p => {
    const name = p.name.toLowerCase();
    // Handle specific exceptions or dash names if needed
    let idx = text.indexOf(name);
    while (idx !== -1) {
      // Check for word boundary to avoid partial matches (e.g., "mew" matching "mewtwo" incorrectly)
      const isWordStart = idx === 0 || !/[a-z0-9]/.test(text[idx - 1]);
      const isWordEnd = (idx + name.length) === text.length || !/[a-z0-9]/.test(text[idx + name.length]);

      if (isWordStart && isWordEnd) {
        mentions.push({ pokemon: p, index: idx });
      }
      idx = text.indexOf(name, idx + 1);
    }
  });

  // Sort mentions by their appearance order in the text
  mentions.sort((a, b) => a.index - b.index);

  if (mentions.length === 0) return null;

  const result = {
    body: null,
    head: null,
    wings: null,
    tail: null,
    color: null
  };

  // Define body part keywords and search around them
  const keywords = {
    body: ['body', 'base', 'torso', 'legs', 'feet', 'physique', 'form', 'main'],
    head: ['head', 'face', 'eyes', 'ears', 'nose', 'mouth', 'mask', 'crown'],
    wings: ['wing', 'wings', 'cannon', 'cannons', 'back', 'shell', 'shells', 'shoulder', 'shoulders'],
    tail: ['tail', 'horn', 'horns', 'butt', 'extra', 'accessory', 'accessories', 'weapon'],
    color: ['color', 'colors', 'palette', 'theme', 'skin', 'paint', 'shade', 'hue', 'tint']
  };

  // Keep track of which mentions are explicitly matched to a role
  const matchedMentions = new Set();

  // For each role, find if there's an explicit mention associated with it
  mentions.forEach(mention => {
    const name = mention.pokemon.name.toLowerCase();
    const nameLen = name.length;

    // Look for keyword within a window around the name (e.g., 20 characters before or after)
    let bestRole = null;
    let minDistance = 9999;

    Object.entries(keywords).forEach(([role, words]) => {
      words.forEach(word => {
        // Search for word before name
        const beforeIndex = text.lastIndexOf(word, mention.index);
        if (beforeIndex !== -1 && (mention.index - (beforeIndex + word.length)) < 20) {
          const dist = mention.index - beforeIndex;
          if (dist < minDistance) {
            minDistance = dist;
            bestRole = role;
          }
        }

        // Search for word after name
        const afterIndex = text.indexOf(word, mention.index + nameLen);
        if (afterIndex !== -1 && (afterIndex - (mention.index + nameLen)) < 20) {
          const dist = afterIndex - mention.index;
          if (dist < minDistance) {
            minDistance = dist;
            bestRole = role;
          }
        }
      });
    });

    if (bestRole && !result[bestRole]) {
      result[bestRole] = mention.pokemon;
      matchedMentions.add(mention.pokemon.id);
    }
  });

  // Filter mentions that haven't been explicitly matched
  const unassignedMentions = mentions.filter(m => !matchedMentions.has(m.pokemon.id));

  // Default fallbacks for unassigned mentions in sequential order:
  // If Body is empty, assign 1st mention
  if (!result.body && mentions.length > 0) {
    result.body = mentions[0].pokemon;
    matchedMentions.add(mentions[0].pokemon.id);
  }

  // If Color is empty, assign same as Body (or 1st mention)
  if (!result.color) {
    if (result.body) {
      result.color = result.body;
    } else if (mentions.length > 0) {
      result.color = mentions[0].pokemon;
    }
  }

  // Distribute remaining unassigned mentions to empty slots
  const remainingRoles = ['head', 'wings', 'tail'].filter(r => !result[r]);
  let roleIdx = 0;

  unassignedMentions.forEach(m => {
    // Avoid re-assigning if it's already used as body and we have other options
    if (m.pokemon.id === result.body?.id && unassignedMentions.length > 1) {
      return;
    }
    if (roleIdx < remainingRoles.length) {
      result[remainingRoles[roleIdx]] = m.pokemon;
      roleIdx++;
    }
  });

  // If we have sequential listing without keywords (e.g. "Charizard Pikachu Blastoise Mewtwo")
  // Let's do a direct positional mapping
  if (mentions.length > 1 && !result.head) {
    const available = mentions.filter(m => m.pokemon.id !== result.body?.id);
    if (available[0]) result.head = available[0].pokemon;
    if (available[1] && !result.wings) result.wings = available[1].pokemon;
    if (available[2] && !result.tail) result.tail = available[2].pokemon;
  }

  return result;
}
