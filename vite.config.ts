import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: '/jinmai-lab/',
  build: {
    outDir: 'dist'
  },
  resolve: {
    // 为数据库相关的 Node.js 原生模块创建别名，避免在浏览器环境中打包
    alias: {
      'better-sqlite3': '@/utils/databaseStub',
      'mongodb': '@/utils/databaseStub',
      'pg': '@/utils/databaseStub',
      '@neondatabase/serverless': '@/utils/databaseStub',
      'ws': '@/utils/databaseStub',
    }
  }
})
