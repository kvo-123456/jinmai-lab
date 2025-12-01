import { Pool } from 'pg'

// 获取PostgreSQL连接字符串
// 支持Vercel自动创建的环境变量和手动配置的环境变量
const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_URL || 'postgresql://localhost:5432/jinmai_lab'

// 创建连接池
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
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