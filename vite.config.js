import { defineConfig } from 'vite';

/* public/assets/ is served as is (content paths in src/data.js point there), so built bundles go to dist/bundle/ to keep the two apart */
export default defineConfig({
  build: { assetsDir: 'bundle', target: 'es2019', chunkSizeWarningLimit: 650 } /* three.js r149 is one ~600 kB lazy chunk */
});
