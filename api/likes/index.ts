import type { VercelRequest, VercelResponse } from '@vercel/node'
const { verifyToken } = require('../../server/jwt.mjs')
const { sendErrorResponse, sendSuccessResponse, API_ERRORS } = require('../../server/api-error-handler.mjs')

// 模拟点赞数据，后续会替换为数据库操作
const likes = [
  { user_id: 1, post_id: 1, created_at: Date.now() },
  { user_id: 2, post_id: 1, created_at: Date.now() },
  { user_id: 3, post_id: 2, created_at: Date.now() },
  { user_id: 1, post_id: 2, created_at: Date.now() }
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
    // GET请求 - 获取点赞列表
    if (req.method === 'GET') {
      const { post_id, user_id } = req.query
      let filteredLikes = likes
      
      // 如果提供了post_id，只返回该帖子的点赞
      if (post_id) {
        const postId = parseInt(post_id as string)
        filteredLikes = filteredLikes.filter(like => like.post_id === postId)
      }
      
      // 如果提供了user_id，只返回该用户的点赞
      if (user_id) {
        const userId = parseInt(user_id as string)
        filteredLikes = filteredLikes.filter(like => like.user_id === userId)
      }
      
      console.log(`获取点赞列表，post_id: ${post_id}, user_id: ${user_id}`)
      return sendSuccessResponse(res, filteredLikes)
    }
    
    // POST请求 - 创建或取消点赞
    if (req.method === 'POST') {
      // 验证身份
      const auth = verifyAuth(req)
      if (!auth) {
        return sendErrorResponse(res, API_ERRORS.UNAUTHORIZED, {
          message: '未授权访问'
        })
      }
      
      const { post_id } = req.body || {}
      
      // 验证必填字段
      if (!post_id) {
        return sendErrorResponse(res, API_ERRORS.MISSING_REQUIRED_FIELDS, {
          message: '帖子ID为必填字段'
        })
      }
      
      const userId = auth.userId
      const postId = parseInt(post_id)
      
      // 检查是否已经点赞
      const likeIndex = likes.findIndex(like => like.user_id === userId && like.post_id === postId)
      
      if (likeIndex !== -1) {
        // 已经点赞，取消点赞
        likes.splice(likeIndex, 1)
        console.log(`取消点赞成功: userId=${userId}, postId=${postId}`)
        return sendSuccessResponse(res, { liked: false, message: '取消点赞成功' })
      } else {
        // 未点赞，添加点赞
        const newLike = {
          user_id: userId,
          post_id: postId,
          created_at: Date.now()
        }
        likes.push(newLike)
        console.log(`点赞成功: userId=${userId}, postId=${postId}`)
        return sendSuccessResponse(res, { liked: true, message: '点赞成功' }, {
          statusCode: 201
        })
      }
    }
    
    // 方法不允许
    return sendErrorResponse(res, API_ERRORS.METHOD_NOT_ALLOWED)
  } catch (e: any) {
    console.error('点赞管理API错误:', e)
    return sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN'
    })
  }
}