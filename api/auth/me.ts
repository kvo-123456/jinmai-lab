import type { VercelRequest, VercelResponse } from 'vercel'
import jwt from 'jsonwebtoken'
import { getPostgreSQL, initPostgreSQL } from '../../server/postgres.mjs'

// 获取JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  const origin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  
  // 验证请求方法
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
    return
  }
  
  try {
    // 从请求头中获取Authorization令牌
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'UNAUTHORIZED' })
      return
    }
    
    // 提取令牌
    const token = authHeader.split(' ')[1]
    
    // 验证令牌
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (e) {
      res.status(401).json({ error: 'INVALID_TOKEN' })
      return
    }
    
    // 从令牌中获取用户ID
    const userId = decoded.userId
    if (!userId) {
      res.status(401).json({ error: 'INVALID_TOKEN' })
      return
    }
    
    // 初始化PostgreSQL
    await initPostgreSQL()
    
    // 获取PostgreSQL连接池
    const pool = getPostgreSQL()
    
    // 根据ID查找用户
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [parseInt(userId)]
    )
    
    const user = result.rows[0]
    if (!user) {
      res.status(404).json({ error: 'USER_NOT_FOUND' })
      return
    }
    
    // 返回用户信息（不包含密码哈希）
    res.status(200).json({
      ok: true,
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email
      }
    })
  } catch (e: any) {
    console.error('获取用户信息失败:', e.message)
    res.status(500).json({ error: 'SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
}