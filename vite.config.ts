import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' 讓 build 出來的 dist 可放在任何子路徑（GitHub Pages、NAS…）
export default defineConfig({
  base: './',
  plugins: [react()],
});
