import { Pool } from 'pg'
import dotenv from 'dotenv'

// 加载环境变量
// 支持.env.local、.env.development.local等文件
dotenv.config({ path: '.env.local' })
dotenv.config()

// 获取PostgreSQL连接字符串
// 支持Vercel自动创建的环境变量和手动配置的环境变量
console.log('正在获取PostgreSQL连接字符串...')
console.log('环境变量检查:', {
  DATABASE_URL: !!process.env.DATABASE_URL,
  NEON_URL: !!process.env.NEON_URL,
  NEON_DATABASE_URL: !!process.env.NEON_DATABASE_URL,
  NEON_POSTGRES_URL: !!process.env.NEON_POSTGRES_URL,
  NEON_DATABASE_URL_UNPOOLED: !!process.env.NEON_DATABASE_URL_UNPOOLED,
  NEON_POSTGRES_URL_NON_POOLING: !!process.env.NEON_POSTGRES_URL_NON_POOLING,
  NEON_PROJECT_ID: !!process.env.NEON_PROJECT_ID,
  NEON_POSTGRES_USER: !!process.env.NEON_POSTGRES_USER,
  NEON_POSTGRES_PASSWORD: !!process.env.NEON_POSTGRES_PASSWORD,
  NEON_POSTGRES_DATABASE: !!process.env.NEON_POSTGRES_DATABASE,
  NEON_PGHOST: !!process.env.NEON_PGHOST
})

const DATABASE_URL = process.env.DATABASE_URL || 
                    process.env.NEON_URL || 
                    process.env.NEON_DATABASE_URL || 
                    process.env.NEON_POSTGRES_URL || 
                    process.env.NEON_DATABASE_URL_UNPOOLED ||
                    process.env.NEON_POSTGRES_URL_NON_POOLING

console.log('最终使用的DATABASE_URL:', DATABASE_URL ? '已配置' : '未配置')

if (!DATABASE_URL) {
  console.error('ERROR: 未配置PostgreSQL连接环境变量')
  console.error('请在Vercel控制台中配置以下环境变量之一:')
  console.error('- DATABASE_URL')
  console.error('- NEON_URL')
  console.error('- NEON_DATABASE_URL')
  console.error('- NEON_POSTGRES_URL')
  console.error('- NEON_DATABASE_URL_UNPOOLED')
  console.error('- NEON_POSTGRES_URL_NON_POOLING')
  throw new Error('PostgreSQL连接环境变量未配置')
}

// 创建连接池
const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isLocalhost ? false : {
    rejectUnauthorized: false
  }
})

// 添加连接池事件监听
pool.on('connect', () => {
  console.log('PostgreSQL连接已建立')
})

pool.on('error', (err) => {
  console.error('PostgreSQL连接错误:', err.message)
})

/**
 * 初始化PostgreSQL数据库
 */
export async function initPostgreSQL() {
  try {
    const client = await pool.connect()
    console.log('PostgreSQL连接成功')

    // 创建用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `)

    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);')

    client.release()
    console.log('PostgreSQL表和索引初始化成功')
  } catch (error) {
    console.error('PostgreSQL初始化失败:', error.message)
    throw error
  }
}

/**
 * 获取PostgreSQL连接池
 */
export function getPostgreSQL() {
  return pool
}

/**
 * 关闭PostgreSQL连接池
 */
export async function closePostgreSQL() {
  await pool.end()
  console.log('PostgreSQL连接池已关闭')
}