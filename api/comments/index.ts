import type { VercelRequest, VercelResponse } from '@vercel/node'
const { verifyToken } = require('../../server/jwt.mjs')
const { sendErrorResponse, sendSuccessResponse, API_ERRORS } = require('../../server/api-error-handler.mjs')

// 模拟评论数据，后续会替换为数据库操作
const comments = [
  {
    id: 1,
    content: '这篇文章写得非常好！',
    user_id: 1,
    post_id: 1,
    parent_id: null,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: 2,
    content: '感谢分享，很有启发。',
    user_id: 2,
    post_id: 1,
    parent_id: null,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    id: 3,
    content: '我也有类似的想法。',
    user_id: 3,
    post_id: 2,
    parent_id: null,
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
    // GET请求 - 获取评论列表
    if (req.method === 'GET') {
      const { post_id } = req.query
      let filteredComments = comments
      
      // 如果提供了post_id，只返回该帖子的评论
      if (post_id) {
        const postId = parseInt(post_id as string)
        filteredComments = comments.filter(comment => comment.post_id === postId)
      }
      
      console.log(`获取评论列表，post_id: ${post_id}`)
      return sendSuccessResponse(res, filteredComments)
    }
    
    // POST请求 - 创建评论
    if (req.method === 'POST') {
      // 验证身份
      const auth = verifyAuth(req)
      if (!auth) {
        return sendErrorResponse(res, API_ERRORS.UNAUTHORIZED, {
          message: '未授权访问'
        })
      }
      
      const { content, post_id, parent_id } = req.body || {}
      
      // 验证必填字段
      if (!content || !post_id) {
        return sendErrorResponse(res, API_ERRORS.MISSING_REQUIRED_FIELDS, {
          message: '评论内容和帖子ID为必填字段'
        })
      }
      
      // 创建新评论
      const newComment = {
        id: comments.length + 1,
        content,
        user_id: auth.userId,
        post_id: parseInt(post_id),
        parent_id: parent_id ? parseInt(parent_id) : null,
        created_at: Date.now(),
        updated_at: Date.now()
      }
      
      comments.push(newComment)
      console.log('创建评论成功:', { content, post_id, userId: auth.userId })
      return sendSuccessResponse(res, newComment, {
        statusCode: 201,
        message: '评论创建成功'
      })
    }
    
    // 方法不允许
    return sendErrorResponse(res, API_ERRORS.METHOD_NOT_ALLOWED)
  } catch (e: any) {
    console.error('评论管理API错误:', e)
    return sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN'
    })
  }
}