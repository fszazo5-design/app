import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // نترك المسار رئيسي '/' للويب، وعند بناء الديسكتوب يمكنك إعادته لـ './' مؤقتاً إذا لزم الأمر
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
