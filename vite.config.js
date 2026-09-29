import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT: change 'base' below to match your GitHub repo name exactly,
// e.g. if your repo is github.com/you/my-app, base should be '/my-app/'
export default defineConfig({
  plugins: [react()],
  base: '/secure-auth-v2/',
});
