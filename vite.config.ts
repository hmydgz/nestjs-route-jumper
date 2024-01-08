import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: true,
    // lib: {
    //   entry: resolve(__dirname, 'web/main.tsx'),
    //   name: 'web',
    //   fileName: 'out',
    //   formats: ['umd'],
    // },
    outDir: 'media',
    rollupOptions: {
      output: {
        entryFileNames: 'out.js',
        assetFileNames: (obj) => {
          return obj.name.endsWith('.css') ? 'style.css' : obj.name
        }
      }
    },
  }
})
