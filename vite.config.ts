import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { generateArchitectureMap } from './scripts/generate-architecture-map.mjs'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function architectureMapGenerator() {
  let timer: ReturnType<typeof setTimeout> | null = null
  const regenerate = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      generateArchitectureMap()
      timer = null
    }, 80)
  }

  return {
    name: 'architecture-map-generator',
    buildStart() {
      generateArchitectureMap()
    },
    configureServer(server) {
      server.watcher.add([
        path.resolve(__dirname, 'src/**/*.{ts,tsx}'),
        path.resolve(__dirname, 'supabase/functions/**/*.ts'),
      ])

      server.watcher.on('change', (file) => {
        const normalized = file.split(path.sep).join('/')
        if (normalized.includes('/src/generated/architectureMap.json')) return
        if (normalized.includes('/src/') || normalized.includes('/supabase/functions/')) {
          regenerate()
        }
      })
    },
  }
}

export default defineConfig({
  define: {
    __GXP_BUILD_ID__: JSON.stringify(
      process.env.VITE_BUILD_ID ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      new Date().toISOString(),
    ),
  },
  plugins: [
    figmaAssetResolver(),
    architectureMapGenerator(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/react-quill/') || id.includes('/quill/')) return 'quill'
          if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-')) return 'charts'
          if (id.includes('/@supabase/')) return 'supabase'
          if (id.includes('/react-router')) return 'router'
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) return 'react-vendor'
          if (id.includes('/react-dnd') || id.includes('/dnd-core')) return 'dnd'
          if (id.includes('/react-slick') || id.includes('/slick-carousel')) return 'slick'
          if (id.includes('/pdfjs-dist/') || id.includes('/react-pdf/')) return 'pdf'
          if (id.includes('/swiper/')) return 'swiper'
          if (id.includes('/lucide-react/') || id.includes('/react-day-picker/') || id.includes('/react-hook-form/')) return 'ui'
          return 'vendor'
        },
      },
    },
  },
})
