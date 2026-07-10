import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // هذا السطر هو مفتاح الحل للشاشة البيضاء، يضمن قراءة الروابط بشكل صحيح على السيرفر
  base: '/', 
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
