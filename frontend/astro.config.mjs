import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    // In `astro dev`, forward API calls to the Express backend (nginx does this in Docker).
    server: { proxy: { '/api': 'http://localhost:5000' } },
  },
});
