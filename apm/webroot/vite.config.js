import { defineConfig } from 'vite';

// KernelSU WebUI 从模块目录的本地文件加载，必须用相对路径。
// 产物全部内联，避免额外的资源请求路径问题。
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: Infinity,
    cssCodeSplit: false,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
