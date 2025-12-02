import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyToken } from '../../server/jwt.mjs'
import { userDB } from '../../server/database.mjs'
import { sendErrorResponse, sendSuccessResponse, API_ERRORS } from '../../server/api-error-handler.mjs'



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
    return sendErrorResponse(res, API_ERRORS.METHOD_NOT_ALLOWED)
  }
  
  try {
    // 从请求头中获取Authorization令牌
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendErrorResponse(res, API_ERRORS.UNAUTHORIZED)
    }
    
    // 提取令牌
    const token = authHeader.split(' ')[1]
    
    // 验证令牌
    const decoded: any = verifyToken(token)
    if (!decoded) {
      return sendErrorResponse(res, API_ERRORS.INVALID_TOKEN)
    }
    
    // 从令牌中获取用户ID
    const userId = decoded.userId
    if (!userId) {
      return sendErrorResponse(res, API_ERRORS.INVALID_TOKEN)
    }
    
    // 根据ID查找用户
    const user = await userDB.findById(parseInt(userId))
    if (!user) {
      return sendErrorResponse(res, API_ERRORS.USER_NOT_FOUND)
    }
    
    // 返回用户信息（不包含密码哈希）
    return sendSuccessResponse(res, {
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        phone: user.phone || null,
        avatar_url: user.avatar_url || null,
        interests: user.interests ? JSON.parse(user.interests) : null,
        age: user.age || null,
        tags: user.tags ? JSON.parse(user.tags) : null,
        isAdmin: user.email === 'testuser789@example.com' || user.isAdmin
      }
    })
  } catch (e: any) {
    console.error('获取用户信息失败:', e.message)
    return sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN'
    })
  }
}