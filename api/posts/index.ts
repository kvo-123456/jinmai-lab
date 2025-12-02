import type { VercelRequest, VercelResponse } from '@vercel/node'
const { verifyToken } = require('../../server/jwt.mjs')
const { sendErrorResponse, sendSuccessResponse, API_ERRORS } = require('../../server/api-error-handler.mjs')

// 模拟帖子数据，后续会替换为数据库操作
const posts = [
  {
    id: 1,
    title: '国潮设计的崛起与发展',
    content: '国潮设计正在成为当代设计领域的重要力量...',
    user_id: 1,
    category_id: 1,
    status: 'published',
    views: 120,
    likes_count: 25,
    comments_count: 10,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: 2,
    title: '非遗传承的现代创新',
    content: '非物质文化遗产如何在现代社会中焕发新生...',
    user_id: 2,
    category_id: 2,
    status: 'published',
    views: 95,
    likes_count: 18,
    comments_count: 7,
    created_at: Date.now(),
    updated_at: Date.now()
  }
]

// 验证JWT令牌
function verifyAuth(req: VercelRequest): { userId: number } | null {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  
  const token = authHeader.split(' ')[1]
  if (!token) return null
  
  try {
    const decoded = verifyToken(token)
    return { userId: decoded.userId }
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  const origin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  
  try {
    // GET请求 - 获取帖子列表
    if (req.method === 'GET') {
      console.log('获取帖子列表')
      return sendSuccessResponse(res, posts)
    }
    
    // POST请求 - 创建帖子
    if (req.method === 'POST') {
      // 验证身份
      const auth = verifyAuth(req)
      if (!auth) {
        return sendErrorResponse(res, API_ERRORS.UNAUTHORIZED, {
          message: '未授权访问'
        })
      }
      
      const { title, content, category_id } = req.body || {}
      
      // 验证必填字段
      if (!title || !content) {
        return sendErrorResponse(res, API_ERRORS.MISSING_REQUIRED_FIELDS, {
          message: '帖子标题和内容为必填字段'
        })
      }
      
      // 创建新帖子
      const newPost = {
        id: posts.length + 1,
        title,
        content,
        user_id: auth.userId,
        category_id: category_id || null,
        status: 'published',
        views: 0,
        likes_count: 0,
        comments_count: 0,
        created_at: Date.now(),
        updated_at: Date.now()
      }
      
      posts.push(newPost)
      console.log('创建帖子成功:', { title, userId: auth.userId })
      return sendSuccessResponse(res, newPost, {
        statusCode: 201,
        message: '帖子创建成功'
      })
    }
    
    // 方法不允许
    return sendErrorResponse(res, API_ERRORS.METHOD_NOT_ALLOWED)
  } catch (e: any) {
    console.error('帖子管理API错误:', e)
    return sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN'
    })
  }
}