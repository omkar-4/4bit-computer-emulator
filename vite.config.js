import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  test: {
    environment: 'jsdom', // For UI tests if needed, or node for logic
    include: ['tests/**/*.test.js'],
  },
});
