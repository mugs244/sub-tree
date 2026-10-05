import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'node:module'

// createRequire (not a static import): the plugin's ESM build can't dynamic-require
// medusa-config.ts, so it silently falls back to base "/" and 404s panel assets.
const require = createRequire(import.meta.url)
const { mercurDashboardPlugin } = require('@mercurjs/dashboard-sdk/vite')

// The Sub-tree rounded tree in a navy circle, inlined so it loads under any base path.
const SUB_SHOP_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiMxMTE4MjciLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMiAxMikgc2NhbGUoMC44NikgdHJhbnNsYXRlKC0xMiAtMTEuNSkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgNS4zIEwxMCA3LjkgTDEyIDcuMDUgTDE0IDcuOSBaIiBmaWxsPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjEuMjUiLz48cGF0aCBkPSJNOS4yIDExLjMgTDEyIDkuMTUgTDE0LjggMTEuMyIgc3Ryb2tlLXdpZHRoPSIxLjQ1Ii8+PHBhdGggZD0iTTguNiAxNC4yIEwxMiAxMS42NSBMMTUuNCAxNC4yIiBzdHJva2Utd2lkdGg9IjEuNDUiLz48cGF0aCBkPSJNMTIgMTQuNzUgVjE3LjciIHN0cm9rZS13aWR0aD0iMS40NSIvPjwvZz48L3N2Zz4='

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Baked into the panel at build time. For a backend-served production build
  // (e.g. Medusa Cloud) set it to the deployed backend origin so API calls are
  // same-origin; it defaults to http://localhost:9000 for development.
  const backendUrl = env.VITE_MERCUR_BACKEND_URL || env.MERCUR_BACKEND_URL

  return {
    plugins: [
      react(),
      mercurDashboardPlugin({
        medusaConfigPath: '../../packages/api/medusa-config.ts',
        // Sub-shop branding on the sign-in screen (falls back to Mercur's "M").
        name: 'Sub-shop',
        logo: SUB_SHOP_LOGO,
        ...(backendUrl ? { backendUrl } : {}),
      }),
    ],
  }
})
