import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In GitHub Actions, GITHUB_REPOSITORY is "owner/repo" — derive the sub-path
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];

export default defineConfig({
  plugins: [react()],
  base: repo ? `/${repo}/` : '/',
  server: {
    proxy: {
      '/api/football': {
        target: 'https://api.football-data.org/v4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/football/, ''),
      },
    },
  },
});
