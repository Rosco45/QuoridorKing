import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Écoute sur 0.0.0.0 pour être accessible depuis le réseau local (téléphone)
    port: 5173,
  },
})
