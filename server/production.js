import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleStatus, handleFuse } from './fuseHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

const app = express();

// 1. API status route
app.get('/api/status', (req, res) => {
  handleStatus(req, res);
});

// 2. API fuse route (do not use body-parser middleware, handleFuse reads raw req)
app.post('/api/fuse', (req, res) => {
  handleFuse(req, res);
});

// 3. Serve static files from the build output directory (dist)
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// 4. Fallback to index.html for Single Page Application (SPA) routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});
