import { tmpdir } from 'node:os'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// The project lives on a virtualized/sandboxed mount on this machine, which breaks
// Vite's atomic rename-based dep cache (EXDEV: cross-device link). Point the cache
// at the real local filesystem instead.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  cacheDir: join(tmpdir(), 'urigod-vite-cache'),
  // GitHub Pages serves this site from a subpath (/urigodge/), so asset URLs need
  // that prefix there. Vercel (and any other host) serves it from the domain root,
  // so base must stay '/' everywhere else. The GitHub Actions workflow sets
  // GITHUB_PAGES=true only for that one build.
  base: process.env.GITHUB_PAGES ? '/urigodge/' : '/',
  // /api/* are Vercel functions; in local dev they are served by the deployed site.
  server: { proxy: { '/api': { target: 'https://www.urigod.ge', changeOrigin: true } } },
})
