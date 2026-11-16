import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // `npm run dev` serves the page only; run `npm run preview` for the API + D1.
    proxy: { '/api': 'http://127.0.0.1:8788' },
  },
});
