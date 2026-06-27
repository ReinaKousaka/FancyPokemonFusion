/**
 * Turn the selected role->Pokémon mapping (+ optional free-text condition) into
 * a single instruction for the image model, plus the ordered list of sprite IDs
 * that must be sent alongside it. The text references the images by the SAME
 * order they are appended on the server ("Image 1", "Image 2", ...).
 */

const ROLE_INSTRUCTION = {
  body: 'its overall body, torso, limbs, posture and silhouette',
  head: 'its head and face',
  wings: 'its wings / back features',
  tail: 'its tail / rear features',
  color: 'its color palette and markings (use these colors, not its shape)',
};

// Order matters: body first so the model anchors on the base creature.
const ROLE_ORDER = ['body', 'head', 'wings', 'tail', 'color'];

export function buildFusionPrompt({ body, head, wings, tail, color }, condition = '') {
  const selected = { body, head, wings, tail, color };
  const active = ROLE_ORDER.filter((role) => selected[role]);

  if (active.length === 0) {
    return { prompt: '', imageIds: [], summary: [] };
  }

  const imageIds = [];
  const lines = [];
  const summary = [];

  active.forEach((role) => {
    const p = selected[role];
    const imageNum = imageIds.length + 1;
    imageIds.push(p.id);
    lines.push(
      `- Image ${imageNum} is ${p.name} (${(p.types || []).join('/') || 'unknown'} type). ` +
        `Take ${ROLE_INSTRUCTION[role]} from it.`
    );
    summary.push({ role, name: p.name, imageNum });
  });

  const names = active.map((r) => selected[r].name);
  const uniqueNames = [...new Set(names)];

  const prompt = [
    `Create ONE single, original Pokémon-style creature by fusing the ${uniqueNames.length} reference Pokémon below into a cohesive, believable design — not a collage or overlay of the originals.`,
    '',
    'Source references:',
    ...lines,
    '',
    'Requirements:',
    '- Blend the parts seamlessly so it reads as one creature, with consistent proportions, shading and outline.',
    '- Match the clean, high-resolution official Pokémon artwork style (smooth cel shading, bold outlines).',
    '- Center the creature on a plain solid white background. Full body in frame.',
    '- Do NOT include any text, labels, captions, borders, or multiple separate figures.',
    condition?.trim()
      ? `\nExtra direction from the user (follow this): ${condition.trim()}`
      : '',
  ]
    .filter((l) => l !== null && l !== undefined)
    .join('\n');

  return { prompt, imageIds, summary };
}
