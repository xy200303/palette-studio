import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // 相对路径产物，兼容 GitHub Pages 子路径与任意静态托管
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/]pnpm[\\/][^/]*(react|scheduler)/.test(id) || /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return 'react';
          }
          if (id.includes('tdesign')) return 'tdesign';
          if (id.includes('culori')) return 'culori';
          if (
            id.includes('tvision-color') ||
            id.includes('chroma-js') ||
            id.includes('material-color-utilities') ||
            id.includes('@babel') ||
            id.includes('core-js') ||
            id.includes('bezier-easing')
          ) {
            return 'tvision';
          }
          return undefined;
        },
      },
    },
  },
});
