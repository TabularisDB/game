import { defineConfig } from 'vite';

// The source is plain ESM and must stay runnable WITHOUT a build (the test
// suite serves it raw with any static server). Vite is the dev server and
// the production bundler for game.tabularis.dev.
export default defineConfig({
  base: '/',
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});
