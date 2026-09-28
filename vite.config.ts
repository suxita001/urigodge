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
})
