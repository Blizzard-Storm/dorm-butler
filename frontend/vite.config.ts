import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 开发期前端跑在 5173，接口和 WebSocket 代理到后端 8000。
// host: true 让手机可以用 http://<PC 局域网IP>:5173 直接访问。
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/ws': { target: 'ws://127.0.0.1:8000', ws: true },
    },
  },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1200 },
})
