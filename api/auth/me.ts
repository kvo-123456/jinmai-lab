import type { VercelRequest, VercelResponse } from 'vercel'
import jwt from 'jsonwebtoken'

// 获取JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

// 模拟数据库 - 在无服务器环境中使用内存存储（仅用于测试）
// 生产环境建议使用Vercel Postgres、Supabase或其他持久化数据库
// 注意：这里需要确保与register.ts使用相同的用户数据
// 在实际生产环境中，应该使用共享的数据库服务
let mockUsers = []

// 模拟findUserById函数
const findUserById = (id) => {
  return mockUsers.find(user => user.id === id) || null
}

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
    
    // 初始化数据库
    const db = initDb()
    
    // 根据ID查找用户
    const user = findUserById(db, parseInt(userId))
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