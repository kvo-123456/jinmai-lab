import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from 'rollup-plugin-visualizer';

function getPlugins() {
  const plugins = [
    react(), 
    tsconfigPaths()
    // 暂时禁用PWA插件，排查Service Worker导致的问题
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   injectRegister: null, // 禁用自动注入registerSW.js
    //   includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.svg', 'fonts/*.ttf', 'fonts/*.woff2', 'images/*.png', 'images/*.jpg'],
    //   manifest: {
    //     name: '津脉智坊 - 津门老字号共创平台',
    //     short_name: '津脉智坊',
    //     description: '津门老字号共创平台，传承与创新的桥梁',
    //     theme_color: '#2563eb',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     icons: [
    //       {
    //         src: 'icons/icon-192x192.svg',
    //         sizes: '192x192',
    //         type: 'image/svg+xml',
    //         purpose: 'any maskable'
    //       },
    //       {
    //         src: 'icons/icon-512x512.svg',
    //         sizes: '512x512',
    //         type: 'image/svg+xml',
    //         purpose: 'any maskable'
    //       }
    //     ]
    //   },
    //   workbox: {
    //     // 增加最大缓存文件大小限制到8MB，解决大型文件无法缓存的问题
    //     maximumFileSizeToCacheInBytes: 8000000,
    //     // 预缓存所有生成的资源
    //     globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,gif,woff2,ttf}'],
    //     // 预缓存资源的缓存策略
    //     navigateFallback: '/index.html',
    //     navigateFallbackDenylist: [/^\/api\//],
    //     // 添加skipWaiting和clientsClaim选项
    //     skipWaiting: true,
    //     clientsClaim: true,
    //     // 忽略带有no-store头的请求
    //     globIgnores: ['**/*.map', '**/node_modules/**'],
    //     runtimeCaching: [
    //       // API请求缓存 - 使用NetworkFirst策略
    //       {
    //         urlPattern: /^https?:\/\/.*\/api\//,
    //         handler: 'NetworkFirst',
    //         options: {
    //           cacheName: 'api-cache',
    //           networkTimeoutSeconds: 5,
    //           expiration: {
    //             maxEntries: 50,
    //             maxAgeSeconds: 60 * 60 * 24 // 24 hours
    //           },
    //           cacheableResponse: {
    //             statuses: [0, 200]
    //           },
    //           // 跳过带有no-store头的请求
    //           matchOptions: {
    //             ignoreSearch: true,
    //             ignoreVary: true
    //           }
    //         }
    //       },
    //       // 字体资源缓存 - 长期缓存
    //       {
    //         urlPattern: /^https?:\/\/.*\.(woff2|woff|ttf|otf|eot)$/,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'font-cache',
    //           expiration: {
    //             maxEntries: 20,
    //             maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
    //           }
    //         }
    //       },
    //       // 图片资源缓存 - 增加缓存条目数量
    //       {
    //         urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|avif)$/,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'image-cache',
    //           expiration: {
    //             maxEntries: 100, // 增加到100个条目
    //             maxAgeSeconds: 60 * 60 * 24 * 60 // 60 days
    //           },
    //           rangeRequests: true // 支持范围请求，优化大图片加载
    //         }
    //       },
    //       // CSS和JS资源缓存 - 调整缓存策略
    //       {
    //         urlPattern: /^https?:\/\/.*\.(js|css)$/,
    //         handler: 'StaleWhileRevalidate',
    //         options: {
    //           cacheName: 'static-resources',
    //           expiration: {
    //             maxEntries: 50, // 增加到50个条目
    //             maxAgeSeconds: 60 * 60 * 24 * 14 // 14 days
    //           },
    //           cacheableResponse: {
    //             statuses: [0, 200]
    //           }
    //         }
    //       },
    //       // CDN资源缓存
    //       {
    //         urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\//,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'cdn-cache',
    //           expiration: {
    //             maxEntries: 30,
    //             maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
    //           }
    //         }
    //       },
    //       // 视频资源缓存
    //       {
    //         urlPattern: /^https?:\/\/.*\.(mp4|webm|ogg)$/,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'video-cache',
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
    //           },
    //           rangeRequests: true // 支持范围请求
    //         }
    //       }
    //     ]
    //   }
    // })
  ];
  return plugins;
}

export default defineConfig({
  base: '/',
  plugins: getPlugins(),
  // 确保正确处理中文编码
  esbuild: {
    charset: 'utf8',
    minifySyntax: true,
    // 解决React 18+与旧版库的兼容性问题
    jsx: 'automatic'
  },
  resolve: {
    // 为数据库相关的 Node.js 原生模块创建别名，避免在浏览器环境中打包
    alias: {
      'better-sqlite3': '@/utils/databaseStub',
      'mongodb': '@/utils/databaseStub',
      'pg': '@/utils/databaseStub',
      '@neondatabase/serverless': '@/utils/databaseStub',
      'ws': '@/utils/databaseStub',
    },
    // 自动解析的文件扩展名
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json']
  },
  build: {
    // 优化构建输出
    outDir: 'dist',
    minify: 'terser',
    // 启用更高效的压缩算法
    brotliSize: false, // 禁用brotli大小报告，减少构建时间
    // 优化 CSS 构建
    cssMinify: 'esbuild', // 使用默认的CSS压缩，确保构建成功
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 生成 sourcemap（生产环境可关闭）
    sourcemap: false,
    // 设置 chunk 大小警告阈值（单位：KB）
    chunkSizeWarningLimit: 500, // 调整为更合理的阈值，减少不必要的警告
    // 启用资产预加载
    preloadAssets: true,
    // 生成构建报告
    reportCompressedSize: false, // 禁用构建报告，减少构建时间
    // 调整资产内联限制，进一步减少HTTP请求
    assetsInlineLimit: 4096, // 4KB以下的资源内联
    // 禁用动态导入 polyfill，减少不必要的代码
    modulePreload: {
      polyfill: false
    },
    // 启用更严格的 tree-shaking
    ssr: false,
    // 优化构建目标，使用更现代的ES版本
    target: 'es2022',
    // 优化 terser 配置，减少压缩时间
    terserOptions: {
      compress: {
        drop_console: false, // 保留控制台日志，用于调试和错误捕获
        drop_debugger: true,
        pure_funcs: ['console.log'], // 只移除 console.log，保留其他日志函数用于调试
        pure_getters: true,
        passes: 3, // 减少压缩次数，加快构建速度
        // 更安全的压缩选项，减少构建时间
        collapse_vars: true,
        reduce_vars: true,
        dead_code: true,
        conditionals: true,
        booleans: true,
        unused: true,
        if_return: true,
        join_vars: true,
        side_effects: true,
        evaluate: true,
        // 禁用不安全的优化，减少构建时间
        unsafe: false,
        unsafe_comps: false,
        unsafe_math: false,
        unsafe_symbols: false,
        unsafe_undefined: false,
        keep_classnames: false,
        keep_fargs: false,
        keep_fnames: false,
        keep_infinity: false,
        sequences: true,
        properties: true,
        comparisons: true,
        computed_props: true,
        arrows: true,
        loops: true,
        toplevel: true,
        ie8: false
      },
      mangle: {
        toplevel: true,
        keep_classnames: false,
        keep_fnames: false,
        properties: {
          regex: /^_/, // 只混淆下划线开头的私有属性
          keep_quoted: false,
          reserved: [],
        },
      },
      format: {
        comments: false,
        beautify: false,
        // 优化输出格式
        ecma: 2022,
        wrap_func_args: false,
        wrap_iife: true,
        ascii_only: false,
        webkit: false,
        preamble: '',
        shebang: false,
        indent_level: 0,
        quote_style: 3,
        preserve_annotations: false
      },
    },
    // 分割代码和资源文件配置
    rollupOptions: {
      // 启用更严格的tree-shaking
      treeshake: {
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        // 新增tree-shake选项
        correctVarValueBeforeDeclaration: true,
        moduleSideEffects: (id) => {
          // 排除需要保留副作用的模块
          return id.includes('@fortawesome') || id.includes('sonner');
        }
      },
      // 移除了 external 配置，因为已使用 alias 将这些模块映射到 stub 文件
      // external: ['better-sqlite3', 'mongodb', 'pg', '@neondatabase/serverless', 'ws'],
      // 优化输入选项
      input: 'index.html',
      output: {
        // 优化资产输出
        assetFileNames: 'assets/[name]-[hash:8][extname]',
        chunkFileNames: 'chunks/[name]-[hash:8].js',
        entryFileNames: 'entries/[name]-[hash:8].js',
        // 启用代码分割，优化chunk大小
        experimentalMinChunkSize: 10000, // 增大最小chunk大小到10KB，减少小chunk数量
        // 启用动态导入支持
        dynamicImportInCjs: true,
        // 简化代码分割策略，减少构建时间
        manualChunks(id) {
          // 只分割大型库，减少chunk数量
          if (id.includes('node_modules')) {
            // React核心库 - 合并为一个chunk
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            
            // Three.js相关库 - 合并为更少的chunk
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-core';
            }
            
            // 动画库
            if (id.includes('framer-motion')) {
              return 'animation-framer';
            }
            
            // 图表库
            if (id.includes('recharts')) {
              return 'charts-recharts';
            }
            
            // UI库
            if (id.includes('sonner')) {
              return 'ui-sonner';
            }
            
            // 手势识别库 - 合并为一个chunk
            if (id.includes('@mediapipe') || id.includes('@tensorflow')) {
              return 'gesture-ml';
            }
            
            // 其他第三方库合并为一个chunk，减少构建时间
            return 'vendor-other';
          }
          
          // 按页面分割代码，只分割大型页面
          if (id.includes('src/pages/')) {
            return 'pages';
          }
          
          // 大型组件合并为一个chunk
          if (id.includes('src/components/') && id.includes('.tsx')) {
            return 'components';
          }
        },
      },
      // 优化插件配置
      plugins: [
        // 只在ANALYZE模式下启用构建分析插件
        process.env.ANALYZE === 'true' && visualizer({
          filename: 'bundle-visualizer.html',
          open: true,
          gzipSize: true,
          template: 'sunburst', // 更直观的可视化模板
          sourcemap: false,
        }),
      ].filter(Boolean)
    },
  },
  // 优化开发体验和构建速度
  optimizeDeps: {
    // 预构建依赖 - 只包含核心依赖，减少预构建时间
    include: [
      'react', 'react-dom', 'react-router-dom', 
      'clsx', 'tailwind-merge', 
      'framer-motion'
    ],
    // 禁用预构建的依赖，包括数据库依赖和可能存在兼容性问题的库
    exclude: [
      'better-sqlite3', 'mongodb', 'pg', '@neondatabase/serverless',
      '@mediapipe/hands', '@tensorflow/tfjs-core', '@tensorflow/tfjs-backend-webgl'
    ],
    // 优化依赖构建，增加并发数
    esbuildOptions: {
      target: 'es2022', // 使用更现代的ES版本
      // 优化大型依赖的构建
      treeShaking: true,
      // 优化 esbuild 配置
      minify: false, // 禁用预构建时的压缩，加快预构建速度
      minifySyntax: false,
      minifyIdentifiers: false,
      minifyWhitespace: false,
      // 启用更严格的 tree-shaking
      pure: process.env.NODE_ENV === 'production' ? ['console.log', 'console.warn', 'console.error'] : [],
    },
  },
  // 开发服务器配置
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
    // 添加开发服务器代理配置
    proxy: {
      '/api/proxy/trae-api': {
        target: 'https://trae-api-sg.mchost.guru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/trae-api/, ''),
        configure: (proxy, options) => {
          // 允许所有响应头通过
          options.onProxyRes = (proxyRes, req, res) => {
            // 确保响应头被正确设置，特别是对于图片请求
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
      '/api/proxy/unsplash': {
        target: 'https://images.unsplash.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/unsplash/, ''),
        configure: (proxy, options) => {
          // 允许所有响应头通过
          options.onProxyRes = (proxyRes, req, res) => {
            // 确保响应头被正确设置，特别是对于图片请求
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
    },
  },
  // 预览服务器配置
  preview: {
    // 启用 gzip 压缩
    compress: true,
    // 设置端口为3000
    port: 3000,
    // 添加预览服务器代理配置
    proxy: {
      '/api/proxy/trae-api': {
        target: 'https://trae-api-sg.mchost.guru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/trae-api/, ''),
        configure: (proxy, options) => {
          // 允许所有响应头通过
          options.onProxyRes = (proxyRes, req, res) => {
            // 确保响应头被正确设置，特别是对于图片请求
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
      '/api/proxy/unsplash': {
        target: 'https://images.unsplash.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/unsplash/, ''),
        configure: (proxy, options) => {
          // 允许所有响应头通过
          options.onProxyRes = (proxyRes, req, res) => {
            // 确保响应头被正确设置，特别是对于图片请求
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
    },
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
