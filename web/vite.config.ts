import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr({include: "**/*.svg?react",})],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/ws': {
        target: 'ws://localhost:8080/lobbies/join',
        ws: true,
        changeOrigin: true,
        rewrite: path => path.replace(/^\/ws/, ''),
      }
    },
  },
})
