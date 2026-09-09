import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Necesario para que el hot-reload funcione de forma confiable dentro de
      // Docker en Windows (el bind mount no propaga eventos inotify nativos).
      usePolling: true,
    },
  },
})
