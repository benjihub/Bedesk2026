import replace from '@rollup/plugin-replace';
import react from '@vitejs/plugin-react-swc';
import laravel from 'laravel-vite-plugin';
import {defineConfig, Plugin} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// override laravel plugin base option (from absolute to relative to html base tag)
function basePath(): Plugin {
  return {
    name: 'test',
    enforce: 'post',
    config: () => {
      return {
        base: '',
      };
    },
  };
}

export default defineConfig({
  server: {
    cors: true,
  },
  build: {
    sourcemap: true,
  },
  plugins: [
    tsconfigPaths(),
    react(),
    laravel({
      refresh: false,
      // On Windows without Laravel Herd/Valet, TLS auto-detection will fail.
      // Disable it so Vite runs over plain HTTP.
      detectTls: false,
      input: [
        'resources/client/main.tsx',
        'modules/livechat/resources/client/widget/widget-entry.tsx',
      ],
    }),
    basePath(),
    replace({
      preventAssignment: true,
      __SENTRY_DEBUG__: false,
      "import { URL } from 'url'": false,
    }),
  ],
});
