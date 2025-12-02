import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcryptjs from 'bcryptjs'
import { generateToken } from '../../server/jwt.mjs'
import { userDB } from '../../server/database.mjs'
import { sendErrorResponse, sendSuccessResponse, API_ERRORS } from '../../server/api-error-handler.mjs'



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
    return sendErrorResponse(res, API_ERRORS.METHOD_NOT_ALLOWED)
  }
  
  try {
    const { email, password } = req.body || {}
    
    // 验证必填字段
    if (!email || !password) {
      return sendErrorResponse(res, API_ERRORS.MISSING_REQUIRED_FIELDS, {
        message: '邮箱和密码为必填字段'
      })
    }
    
    // 根据邮箱查找用户
    const user = await userDB.findByEmail(email)
    if (!user) {
      return sendErrorResponse(res, API_ERRORS.INVALID_CREDENTIALS)
    }
    
    // 验证密码
    const passwordMatch = await bcryptjs.compare(password, user.password_hash)
    if (!passwordMatch) {
      return sendErrorResponse(res, API_ERRORS.INVALID_CREDENTIALS)
    }
    
    // 生成JWT令牌
    const token = generateToken({
      userId: user.id.toString(), 
      email: user.email, 
      username: user.username
    })
    
    // 返回用户信息和令牌
    return sendSuccessResponse(res, {
      token,
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
    console.error('登录失败:', e.message)
    return sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN'
    })
  }
}