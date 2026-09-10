import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { apiCatalog } from './src/apiCatalog'
import { buildMachineCatalog } from './src/machineCatalog'

const pwaShellPlugin = (): Plugin => {
  let base = '/'
  let root = process.cwd()
  return {
    name: 'public-api-pwa-shell',
    configResolved(config) {
      base = config.base
      root = config.root
    },
    generateBundle(_options, bundle) {
      const initialAssets = Object.values(bundle)
        .filter((output) => (output.type === 'chunk' && output.isEntry) || (output.type === 'asset' && /^assets\/index-[^/]+\.css$/.test(output.fileName)))
        .map((output) => output.fileName)
        .sort()
      const precacheFiles = [
        '',
        'index.html',
        'api-catalog.json',
        'manifest.webmanifest',
        'favicon.svg',
        'icons/pwa-192.png',
        'icons/pwa-512.png',
        ...initialAssets,
      ]
      const precacheUrls = [...new Set(precacheFiles)]
        .filter((file) => file !== 'sw.js')
        .map((file) => file === '' ? './' : `./${file}`)
      const fixedPrecacheRevisions = Object.fromEntries([
        ['index.html', fs.readFileSync(path.resolve(root, 'index.html'))],
        ['api-catalog.json', `${JSON.stringify(buildMachineCatalog(apiCatalog, base), null, 2)}\n`],
        ['manifest.webmanifest', fs.readFileSync(path.resolve(root, 'public/manifest.webmanifest'))],
        ['favicon.svg', fs.readFileSync(path.resolve(root, 'public/favicon.svg'))],
        ['icons/pwa-192.png', fs.readFileSync(path.resolve(root, 'public/icons/pwa-192.png'))],
        ['icons/pwa-512.png', fs.readFileSync(path.resolve(root, 'public/icons/pwa-512.png'))],
      ].map(([fileName, content]) => [
        fileName,
        createHash('sha256').update(content as string | Buffer).digest('hex'),
      ]))
      const cacheVersion = createHash('sha256')
        .update(JSON.stringify({ base, precacheUrls, fixedPrecacheRevisions }))
        .digest('hex')
        .slice(0, 12)
      const source = `const CACHE_PREFIX = 'public-api-app-shell-';
const CACHE_NAME = CACHE_PREFIX + ${JSON.stringify(cacheVersion)};
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (requestUrl.origin !== scopeUrl.origin || !requestUrl.pathname.startsWith(scopeUrl.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match('./')) || caches.match('./index.html')),
    );
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
`
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

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
  plugins: [react(), machineCatalogPlugin(), pwaShellPlugin()],
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/testSetup.ts'],
    // The full App contract renders the 195-row catalog. Running multiple jsdom
    // files concurrently creates CPU-contention timeouts without product failures.
    fileParallelism: false,
  },
})
