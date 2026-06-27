import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { applyColorTransfer } from '../utils/colorTransfer';

const backgroundThemes = {
  meadow: {
    name: 'Grass Meadow',
    gradient: ['#134e5e', '#71b280'],
    particles: '🍃',
    accentColor: '#10b981'
  },
  volcano: {
    name: 'Volcanic Crater',
    gradient: ['#0f0c20', '#c33764', '#f12711'],
    particles: '🔥',
    accentColor: '#ef4444'
  },
  ocean: {
    name: 'Deep Sea',
    gradient: ['#000428', '#004e92'],
    particles: '🫧',
    accentColor: '#3b82f6'
  },
  storm: {
    name: 'Electric Storm',
    gradient: ['#141e30', '#243b55', '#f7797d'],
    particles: '⚡',
    accentColor: '#f59e0b'
  },
  psychic: {
    name: 'Psychic Void',
    gradient: ['#0f0c20', '#5b2c6f', '#a569bd'],
    particles: '✨',
    accentColor: '#a855f7'
  },
  grid: {
    name: 'Retro Grid',
    gradient: ['#0d021f', '#0f0226'],
    particles: '👾',
    accentColor: '#ec4899',
    drawExtra: (ctx, width, height) => {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)';
      ctx.lineWidth = 1;
      // Draw grid lines
      const gridSize = 40;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }
  }
};

const FusionCanvas = forwardRef(({
  body,
  head,
  wings,
  tail,
  color,
  adjustments,
  colorIntensity,
  matchAllColors,
  theme = 'meadow',
  onProcessingChange
}, ref) => {
  const canvasRef = useRef(null);
  const [images, setImages] = useState({ body: null, head: null, wings: null, tail: null, color: null });
  const [processedLayers, setProcessedLayers] = useState({ body: null, head: null, wings: null, tail: null });
  const [loading, setLoading] = useState(false);

  // Expose download method to parent via ref
  useImperativeHandle(ref, () => ({
    download: (filename = 'pokemon-fusion.png') => {
      if (!canvasRef.current) return;
      const dataURL = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataURL;
      link.click();
    },
    getDataUrl: () => {
      return canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;
    }
  }));

  // Step 1: Load image elements when selections change
  useEffect(() => {
    let active = true;
    const loadImg = (url) => {
      return new Promise((resolve) => {
        if (!url) return resolve(null);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });
    };

    const loadAllImages = async () => {
      setLoading(true);
      onProcessingChange?.(true);
      
      const [bodyImg, headImg, wingsImg, tailImg, colorImg] = await Promise.all([
        loadImg(body?.localImageUrl),
        loadImg(head?.localImageUrl),
        loadImg(wings?.localImageUrl),
        loadImg(tail?.localImageUrl),
        loadImg(color?.localImageUrl)
      ]);

      if (active) {
        setImages({
          body: bodyImg,
          head: headImg,
          wings: wingsImg,
          tail: tailImg,
          color: colorImg
        });
      }
    };

    loadAllImages();

    return () => {
      active = false;
    };
  }, [body?.id, head?.id, wings?.id, tail?.id, color?.id]);

  // Step 2: Process color transfers whenever images, intensity or match options change
  useEffect(() => {
    if (!images.body) {
      setProcessedLayers({ body: null, head: null, wings: null, tail: null });
      setLoading(false);
      onProcessingChange?.(false);
      return;
    }

    const processLayers = () => {
      const helperCanvas = document.createElement('canvas');
      const helperCtx = helperCanvas.getContext('2d');
      const size = 475; // Native PokeAPI artwork resolution
      helperCanvas.width = size;
      helperCanvas.height = size;

      const getImgData = (img) => {
        helperCtx.clearRect(0, 0, size, size);
        helperCtx.drawImage(img, 0, 0, size, size);
        return helperCtx.getImageData(0, 0, size, size);
      };

      // Extract palette image data
      let paletteData = null;
      if (images.color) {
        paletteData = getImgData(images.color);
      }

      // Color swap base body
      let processedBody = null;
      if (images.body) {
        const bodyData = getImgData(images.body);
        if (paletteData && colorIntensity > 0) {
          const swapped = applyColorTransfer(helperCtx, bodyData, paletteData, colorIntensity);
          processedBody = document.createElement('canvas');
          processedBody.width = size;
          processedBody.height = size;
          processedBody.getContext('2d').putImageData(swapped, 0, 0);
        } else {
          processedBody = images.body;
        }
      }

      // Process other layers (swap if matchAllColors is true)
      const processOptionalLayer = (img) => {
        if (!img) return null;
        if (paletteData && matchAllColors && colorIntensity > 0) {
          const layerData = getImgData(img);
          const swapped = applyColorTransfer(helperCtx, layerData, paletteData, colorIntensity);
          const layerCanvas = document.createElement('canvas');
          layerCanvas.width = size;
          layerCanvas.height = size;
          layerCanvas.getContext('2d').putImageData(swapped, 0, 0);
          return layerCanvas;
        }
        return img;
      };

      const processedHead = processOptionalLayer(images.head);
      const processedWings = processOptionalLayer(images.wings);
      const processedTail = processOptionalLayer(images.tail);

      setProcessedLayers({
        body: processedBody,
        head: processedHead,
        wings: processedWings,
        tail: processedTail
      });

      setLoading(false);
      onProcessingChange?.(false);
    };

    // Run processing after a small delay to debounce quick slider actions
    const timer = setTimeout(processLayers, 50);
    return () => clearTimeout(timer);
  }, [images, colorIntensity, matchAllColors]);

  // Step 3: Draw on the visible canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set internal size to high-resolution
    const width = 800;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background
    const bg = backgroundThemes[theme] || backgroundThemes.meadow;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    bg.gradient.forEach((color, idx) => {
      gradient.addColorStop(idx / (bg.gradient.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (bg.drawExtra) {
      bg.drawExtra(ctx, width, height);
    }

    // Draw background particles (floating symbols)
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.textAlign = 'center';
    
    // Deterministic random particles based on theme
    const seedParticles = [
      { x: 100, y: 150, s: 30 },
      { x: 700, y: 200, s: 24 },
      { x: 150, y: 650, s: 28 },
      { x: 680, y: 600, s: 36 },
      { x: 400, y: 100, s: 20 },
      { x: 80, y: 450, s: 32 },
      { x: 720, y: 400, s: 26 },
    ];
    seedParticles.forEach((p, idx) => {
      ctx.font = `${p.s}px sans-serif`;
      ctx.fillText(bg.particles, p.x, p.y);
    });

    // Helper to draw a layer with transforms
    const drawLayer = (layerImg, adj, defaultScale = 1.0) => {
      if (!layerImg) return;
      ctx.save();

      // Move to center of canvas plus user offsets
      const cx = width / 2 + (adj.x || 0);
      const cy = height / 2 + (adj.y || 0);
      ctx.translate(cx, cy);

      // Apply scale
      let scaleX = (adj.scale || defaultScale);
      let scaleY = (adj.scale || defaultScale);
      if (adj.flip) scaleX = -scaleX;
      ctx.scale(scaleX, scaleY);

      // Apply rotation
      const rad = ((adj.rotate || 0) * Math.PI) / 180;
      ctx.rotate(rad);

      // Draw image centered at the origin
      const drawSize = 550; // Larger than native for visual richness
      ctx.drawImage(layerImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

      ctx.restore();
    };

    // Draw order logic
    // Default order: Wings (behind) -> Tail (behind/front) -> Body (middle) -> Head (front)
    
    // Wings: Render behind body (unless wingsFront is true)
    if (processedLayers.wings && !adjustments.wings.front) {
      drawLayer(processedLayers.wings, adjustments.wings, 0.9);
    }

    // Tail: Render behind body (unless tailFront is true)
    if (processedLayers.tail && !adjustments.tail.front) {
      drawLayer(processedLayers.tail, adjustments.tail, 0.8);
    }

    // Body
    if (processedLayers.body) {
      drawLayer(processedLayers.body, adjustments.body, 1.0);
    }

    // Wings: Render in front (if wingsFront is true)
    if (processedLayers.wings && adjustments.wings.front) {
      drawLayer(processedLayers.wings, adjustments.wings, 0.9);
    }

    // Tail: Render in front (if tailFront is true)
    if (processedLayers.tail && adjustments.tail.front) {
      drawLayer(processedLayers.tail, adjustments.tail, 0.8);
    }

    // Head: Always in front
    if (processedLayers.head) {
      drawLayer(processedLayers.head, adjustments.head, 0.7);
    }

    // Draw loading overlay if compiling
    if (loading) {
      ctx.fillStyle = 'rgba(10, 5, 20, 0.4)';
      ctx.fillRect(0, 0, width, height);
    }
  }, [processedLayers, adjustments, theme, loading]);

  const activeTheme = backgroundThemes[theme] || backgroundThemes.meadow;

  return (
    <div className="canvas-container"
         style={{ borderColor: activeTheme.accentColor, boxShadow: `0 0 25px ${activeTheme.accentColor}33` }}>
      <canvas
        ref={canvasRef}
        className="canvas-element"
      />
      
      {/* Loading Spinner overlay */}
      {loading && (
        <div className="canvas-overlay-loader">
          <div className="pokeball-spinner"></div>
          <span className="canvas-overlay-loader-text">FUSING PIXELS...</span>
        </div>
      )}

      {/* No body selected state */}
      {!body && !loading && (
        <div className="canvas-overlay-empty">
          <div className="canvas-overlay-empty-icon">🧬</div>
          <h3 className="canvas-overlay-empty-title">Create Your Fusion</h3>
          <p className="canvas-overlay-empty-desc">Type a prompt, click random, or select Pokemon parts to start fusing!</p>
        </div>
      )}
    </div>
  );
});

export default FusionCanvas;
export { backgroundThemes };
