import type { VercelRequest, VercelResponse } from 'vercel'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getPostgreSQL, initPostgreSQL } from '../../server/postgres.mjs'

// 获取JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  const origin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  
  // 验证请求方法
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
    return
  }
  
  try {
    const { email, password } = req.body || {}
    
    // 验证必填字段
    if (!email || !password) {
      res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' })
      return
    }
    
    // 初始化PostgreSQL
    await initPostgreSQL()
    
    // 获取PostgreSQL连接池
    const pool = getPostgreSQL()
    
    // 根据邮箱查找用户
    const result = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = $1',
      [email]
    )
    
    const user = result.rows[0]
    if (!user) {
      res.status(401).json({ error: 'INVALID_CREDENTIALS' })
      return
    }
    
    // 验证密码
    const passwordMatch = await bcryptjs.compare(password, user.password_hash)
    if (!passwordMatch) {
      res.status(401).json({ error: 'INVALID_CREDENTIALS' })
      return
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id.toString(), email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )
    
    // 返回用户信息和令牌
    res.status(200).json({
      ok: true,
      token,
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email
      }
    })
  } catch (e: any) {
    console.error('登录失败:', e.message)
    res.status(500).json({ error: 'SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
}