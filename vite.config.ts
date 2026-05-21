import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // react-day-picker v8 ships dist/index.esm.js; Vite's optimizer can look for a v9-style dist/esm path.
      'react-day-picker': resolve(__dirname, 'node_modules/react-day-picker/dist/index.esm.js'),
    },
  },
  optimizeDeps: {
    include: ['react-day-picker'],
  },
  base: './',
  root: 'src/renderer',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        pet: resolve(__dirname, 'src/renderer/pet.html'),
        'pet-context-menu': resolve(__dirname, 'src/renderer/pet-context-menu.html'),
        'pet-chat': resolve(__dirname, 'src/renderer/pet-chat.html'),
        'pomodoro-timer': resolve(__dirname, 'src/renderer/pomodoro-timer.html'),
        assistant: resolve(__dirname, 'src/renderer/assistant.html'),
        'workspace-browser': resolve(__dirname, 'src/renderer/workspace-browser.html'),
        onboarding: resolve(__dirname, 'src/renderer/onboarding.html'),
      },
    },
  },
  server: {
    port: 5173,
  },
});
