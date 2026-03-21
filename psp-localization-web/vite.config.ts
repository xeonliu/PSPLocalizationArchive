import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const projectRoot = path.resolve(__dirname)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@data': path.resolve(projectRoot, '../content/games'),
      '@entities': path.resolve(projectRoot, '../entities'),
    },
  },
  server: {
    fs: {
      allow: [
        path.resolve(projectRoot, '../content/games'),
        path.resolve(projectRoot, '../entities'),
        projectRoot,
      ],
    },
  },
})