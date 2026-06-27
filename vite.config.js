import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-server middleware that exposes the fusion API on the same origin/port,
// so `npm run dev` runs the whole app with one command. The Gemini key stays
// server-side (loaded from .env into process.env) and never reaches the browser.
function fusionApiPlugin() {
  return {
    name: 'fusion-api',
    config(_config, { mode }) {
      // Load every var from .env (no VITE_ prefix filter) into process.env.
      const env = loadEnv(mode, process.cwd(), '')
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        // Import lazily so edits to the handler are picked up via Vite's SSR cache.
        const { handleStatus, handleFuse } = await server.ssrLoadModule(
          '/server/fuseHandler.js'
        )
        if (req.url.startsWith('/api/status') && req.method === 'GET') {
          return handleStatus(req, res)
        }
        if (req.url.startsWith('/api/fuse') && req.method === 'POST') {
          return handleFuse(req, res)
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fusionApiPlugin()],
})
