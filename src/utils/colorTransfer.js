// Reinhard color transfer in Lab color space

function rgb2xyz(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100;
  g *= 100;
  b *= 100;

  // Observer = 2°, Illuminant = D65
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  return [x, y, z];
}

function xyz2lab(x, y, z) {
  const ref_X = 95.047;
  const ref_Y = 100.000;
  const ref_Z = 108.883;

  x /= ref_X;
  y /= ref_Y;
  z /= ref_Z;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);
  return [l, a, b];
}

function lab2xyz(l, a, b) {
  let y = (l + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;

  const y3 = Math.pow(y, 3);
  const x3 = Math.pow(x, 3);
  const z3 = Math.pow(z, 3);

  y = y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787;
  x = x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787;
  z = z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787;

  const ref_X = 95.047;
  const ref_Y = 100.000;
  const ref_Z = 108.883;

  x *= ref_X;
  y *= ref_Y;
  z *= ref_Z;
  return [x, y, z];
}

function xyz2rgb(x, y, z) {
  x /= 100;
  y /= 100;
  z /= 100;

  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b = x * 0.0557 + y * -0.2040 + z * 1.0570;

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

  r = Math.min(255, Math.max(0, Math.round(r * 255)));
  g = Math.min(255, Math.max(0, Math.round(g * 255)));
  b = Math.min(255, Math.max(0, Math.round(b * 255)));
  return [r, g, b];
}

function getImageLabStats(imageData) {
  const pixels = imageData.data;
  let lSum = 0, aSum = 0, bSum = 0;
  let count = 0;
  const labs = [];

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const alpha = pixels[i + 3];

    // Only collect non-transparent pixels
    if (alpha > 15) {
      const xyz = rgb2xyz(r, g, b);
      const lab = xyz2lab(xyz[0], xyz[1], xyz[2]);
      lSum += lab[0];
      aSum += lab[1];
      bSum += lab[2];
      labs.push(lab);
      count++;
    } else {
      labs.push(null);
    }
  }

  if (count === 0) {
    return { mean: [50, 0, 0], std: [15, 15, 15], labs };
  }

  const lMean = lSum / count;
  const aMean = aSum / count;
  const bMean = bSum / count;

  let lVar = 0, aVar = 0, bVar = 0;
  for (let i = 0; i < labs.length; i++) {
    const lab = labs[i];
    if (lab !== null) {
      lVar += Math.pow(lab[0] - lMean, 2);
      aVar += Math.pow(lab[1] - aMean, 2);
      bVar += Math.pow(lab[2] - bMean, 2);
    }
  }

  const lStd = Math.sqrt(lVar / count) || 1;
  const aStd = Math.sqrt(aVar / count) || 1;
  const bStd = Math.sqrt(bVar / count) || 1;

  return {
    mean: [lMean, aMean, bMean],
    std: [lStd, aStd, bStd],
    labs
  };
}

/**
 * Transfers colors from a palette image data to a base image data.
 * @param {ImageData} baseImgData ImageData of the base Pokemon.
 * @param {ImageData} paletteImgData ImageData of the color theme Pokemon.
 * @param {number} intensity Blend factor between original and transferred color (0 to 1).
 * @returns {ImageData} A new ImageData with the transferred colors.
 */
export function applyColorTransfer(ctx, baseImgData, paletteImgData, intensity = 1.0) {
  if (intensity <= 0.001) {
    // Return a copy of baseImgData
    const copy = ctx.createImageData(baseImgData.width, baseImgData.height);
    copy.data.set(baseImgData.data);
    return copy;
  }

  const baseStats = getImageLabStats(baseImgData);
  const paletteStats = getImageLabStats(paletteImgData);

  const resultImgData = ctx.createImageData(baseImgData.width, baseImgData.height);
  const basePixels = baseImgData.data;
  const resultPixels = resultImgData.data;

  const [lMeanB, aMeanB, bMeanB] = baseStats.mean;
  const [lStdB, aStdB, bStdB] = baseStats.std;

  const [lMeanP, aMeanP, bMeanP] = paletteStats.mean;
  const [lStdP, aStdP, bStdP] = paletteStats.std;

  for (let i = 0; i < basePixels.length; i += 4) {
    const r = basePixels[i];
    const g = basePixels[i + 1];
    const b = basePixels[i + 2];
    const alpha = basePixels[i + 3];

    // Maintain transparency
    resultPixels[i + 3] = alpha;

    if (alpha <= 15) {
      resultPixels[i] = r;
      resultPixels[i + 1] = g;
      resultPixels[i + 2] = b;
      continue;
    }

    const labB = baseStats.labs[i / 4];
    if (!labB) {
      resultPixels[i] = r;
      resultPixels[i + 1] = g;
      resultPixels[i + 2] = b;
      continue;
    }

    // Shift in Lab space
    let lNew = ((labB[0] - lMeanB) * (lStdP / lStdB)) + lMeanP;
    let aNew = ((labB[1] - aMeanB) * (aStdP / aStdB)) + aMeanP;
    let bNew = ((labB[2] - bMeanB) * (bStdP / bStdB)) + bMeanP;

    // Boundary check for L (0 to 100)
    lNew = Math.min(100, Math.max(0, lNew));

    // Convert back to RGB
    const xyz = lab2xyz(lNew, aNew, bNew);
    const rgb = xyz2rgb(xyz[0], xyz[1], xyz[2]);

    if (intensity >= 0.999) {
      resultPixels[i] = rgb[0];
      resultPixels[i + 1] = rgb[1];
      resultPixels[i + 2] = rgb[2];
    } else {
      // Linear blend between original and transferred color
      resultPixels[i] = Math.round(r * (1 - intensity) + rgb[0] * intensity);
      resultPixels[i + 1] = Math.round(g * (1 - intensity) + rgb[1] * intensity);
      resultPixels[i + 2] = Math.round(b * (1 - intensity) + rgb[2] * intensity);
    }
  }

  return resultImgData;
}
