import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from 'rollup-plugin-visualizer';

function getPlugins() {
  const plugins = [
    react(), 
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [], // 移除不存在的资源引用
      manifest: {
        name: '津脉智坊 - 津门老字号共创平台',
        short_name: '津脉智坊',
        description: '津门老字号共创平台，传承与创新的桥梁',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [] // 移除不存在的图标引用
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-awesome-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ];
  return plugins;
}

export default defineConfig({
  plugins: getPlugins(),
  resolve: {
    // 为数据库相关的 Node.js 原生模块创建别名，避免在浏览器环境中打包
    alias: {
      'better-sqlite3': '@/utils/databaseStub',
      'mongodb': '@/utils/databaseStub',
      'pg': '@/utils/databaseStub',
      '@neondatabase/serverless': '@/utils/databaseStub',
    }
  },
  build: {
    // 优化构建输出
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.error'],
        passes: 2,
      },
      mangle: {
        toplevel: true,
        properties: {
          regex: /^_/, // 只混淆下划线开头的私有属性
        },
      },
      format: {
        comments: false,
        beautify: false,
      },
    },
    // 分割代码
    rollupOptions: {
      // 外部化 Node.js 原生模块，避免打包到浏览器代码中
      external: ['better-sqlite3', 'mongodb', 'pg', '@neondatabase/serverless'],
      output: {
        // 优化资产输出
        assetFileNames: 'assets/[name]-[hash:6][extname]',
        chunkFileNames: 'chunks/[name]-[hash:6].js',
        entryFileNames: 'entries/[name]-[hash:6].js',
        // 启用代码分割
        experimentalMinChunkSize: 10000, // 最小chunk大小10KB
        // 优化代码分割策略
        manualChunks(id) {
          // 优先使用手动 chunk 配置
          const manualChunkNames = {
            'react': 'vendor',
            'react-dom': 'vendor',
            'react-router-dom': 'vendor',
            'clsx': 'utils',
            'tailwind-merge': 'utils',
            'framer-motion': 'animation',
            'three': 'three',
            '@react-three/fiber': 'three',
            '@react-three/drei': 'three',
            'recharts': 'charts',
            'sonner': 'ui',
            'zod': 'helpers',
            'jsonwebtoken': 'helpers',
            'bcryptjs': 'helpers',
            '@mediapipe/hands': 'gesture',
            '@tensorflow/tfjs-core': 'gesture',
            '@tensorflow/tfjs-backend-webgl': 'gesture',
          };
          
          for (const [lib, chunkName] of Object.entries(manualChunkNames)) {
            if (id.includes(lib)) {
              return chunkName;
            }
          }
          
          // 自动分割大型node_modules依赖
          if (id.includes('node_modules') && !id.includes('.css') && !id.includes('@react-three')) {
            return 'vendor';
          }
          
          // 按页面分割代码
          if (id.includes('src/pages/')) {
            const pageName = id.split('src/pages/')[1].split('/')[0];
            return `page-${pageName}`;
          }
        },
        // 启用动态导入支持
        dynamicImportInCjs: true,
      },
      // 优化插件配置
      plugins: [
        // 构建分析插件 - rollup-plugin-visualizer
        process.env.ANALYZE === 'true' && visualizer({
          filename: 'bundle-visualizer.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap', // 可选: treemap, sunburst, network
          sourcemap: false,
        }),
        // 自定义构建分析插件
        process.env.ANALYZE === 'true' && {
          name: 'build-analyzer',
          generateBundle(outputOptions, bundle) {
            const fs = require('fs');
            const path = require('path');
            const bundleStats = {
              totalSize: 0,
              chunks: [],
              assets: []
            };
            
            for (const [name, chunk] of Object.entries(bundle)) {
              if (chunk.type === 'chunk') {
                const size = chunk.code.length;
                bundleStats.totalSize += size;
                bundleStats.chunks.push({
                  name,
                  size,
                  sizeFormatted: formatBytes(size),
                  modules: chunk.modules ? Object.keys(chunk.modules).length : 0
                });
              } else if (chunk.type === 'asset') {
                const size = chunk.source.length;
                bundleStats.totalSize += size;
                bundleStats.assets.push({
                  name,
                  size,
                  sizeFormatted: formatBytes(size)
                });
              }
            }
            
            bundleStats.chunks.sort((a, b) => b.size - a.size);
            bundleStats.assets.sort((a, b) => b.size - a.size);
            
            const outputPath = path.resolve(process.cwd(), 'bundle-stats.json');
            fs.writeFileSync(outputPath, JSON.stringify(bundleStats, null, 2));
            
            console.log('\n=== Bundle Analysis ===');
            console.log(`Total size: ${formatBytes(bundleStats.totalSize)}`);
            console.log('\nTop 10 chunks:');
            bundleStats.chunks.slice(0, 10).forEach((chunk, index) => {
              console.log(`${index + 1}. ${chunk.name}: ${chunk.sizeFormatted} (${chunk.modules} modules)`);
            });
            console.log('\nTop 10 assets:');
            bundleStats.assets.slice(0, 10).forEach((asset, index) => {
              console.log(`${index + 1}. ${asset.name}: ${asset.sizeFormatted}`);
            });
            console.log('\nFull stats saved to bundle-stats.json');
            console.log('Visualizer report generated at bundle-visualizer.html');
            console.log('======================\n');
          }
        },
        // 优化CSS输出
        {
          name: 'css-optimizer',
          transform(code, id) {
            // 优化CSS导入，移除重复导入
            if (id.endsWith('.css')) {
              // 简单的CSS去重（实际项目中可能需要更复杂的处理）
              return { code, map: null };
            }
            return null;
          },
        },
      ].filter(Boolean)
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 生成 sourcemap（生产环境可关闭）
    sourcemap: false,
    // 设置 chunk 大小警告阈值（单位：KB）
    chunkSizeWarningLimit: 150,
    // 启用资产预加载
    preloadAssets: true,
    // 优化 CSS 构建
    cssMinify: true,
    // 优化依赖分析
    analyze: process.env.ANALYZE === 'true',
    // 生成构建报告
    reportCompressedSize: true,
    // 启用资产内联限制
    assetsInlineLimit: 4096, // 4KB以下的资源内联
    // 启用动态导入 polyfill
    modulePreload: {
      polyfill: true
    },
  },
  // 优化开发体验
  optimizeDeps: {
    // 预构建依赖
    include: [
      'react', 'react-dom', 'react-router-dom', 
      'clsx', 'tailwind-merge', 
      'framer-motion',
      '@react-three/fiber', '@react-three/drei',
      '@/hooks/useTheme'
    ],
    // 禁用预构建的数据库依赖，它们仅用于服务器端
    exclude: [
      'better-sqlite3', 'mongodb', 'pg', '@neondatabase/serverless',
      '@mediapipe/hands', '@tensorflow/tfjs-core', '@tensorflow/tfjs-backend-webgl'
    ],
    // 优化依赖构建
    esbuildOptions: {
      target: 'es2020',
      // 优化大型依赖的构建
      treeShaking: true,
    },
  },
  // 服务器配置优化
  server: {
    // 启用 gzip 压缩
    compress: true,
    // 设置端口为3000
    port: 3000,
    // 优化热更新
    hmr: {
      timeout: 3000,
      overlay: true,
    },
  },
  // 预览服务器配置
  preview: {
    // 启用 gzip 压缩
    compress: true,
    // 设置端口为3000
    port: 3000,
  },
});

// 辅助函数：格式化字节大小
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
