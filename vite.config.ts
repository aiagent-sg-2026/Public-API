import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { apiCatalog } from './src/apiCatalog'
import { buildMachineCatalog } from './src/machineCatalog'

const machineCatalogPlugin = (): Plugin => {
  let base = '/'
  const source = () => `${JSON.stringify(buildMachineCatalog(apiCatalog, base), null, 2)}\n`
  const catalogPath = () => `${new URL(base, 'http://localhost').pathname}api-catalog.json`.replace(/\/{2,}/g, '/')
  return {
    name: 'public-api-machine-catalog',
    configResolved(config) {
      base = config.base
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
        if (pathname !== catalogPath()) return next()
        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        response.end(source())
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'api-catalog.json',
        source: source(),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), machineCatalogPlugin()],
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // The full App contract renders the 196-row catalog. Running multiple jsdom
    // files concurrently creates CPU-contention timeouts without product failures.
    fileParallelism: false,
  },
})
