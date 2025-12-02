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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  
  try {
    const { id } = req.query
    const postId = parseInt(id as string)
    
    // 验证帖子ID
    if (isNaN(postId)) {
      return sendErrorResponse(res, API_ERRORS.INVALID_PARAMETER, {
        message: '无效的帖子ID'
      })
    }
    
    // 查找帖子
    const postIndex = posts.findIndex(post => post.id === postId)
    if (postIndex === -1) {
      return sendErrorResponse(res, API_ERRORS.POST_NOT_FOUND, {
        message: '帖子不存在'
      })
    }
    
    const post = posts[postIndex]
    
    // GET请求 - 获取单个帖子
    if (req.method === 'GET') {
      console.log(`获取帖子: ${postId}`)
      // 增加浏览量
      post.views++
      return sendSuccessResponse(res, post)
    }
    
    // 验证身份
    const auth = verifyAuth(req)
    if (!auth) {
      return sendErrorResponse(res, API_ERRORS.UNAUTHORIZED, {
        message: '未授权访问'
      })
    }
    
    // 验证用户权限
    if (post.user_id !== auth.userId) {
      return sendErrorResponse(res, API_ERRORS.FORBIDDEN, {
        message: '没有权限操作此帖子'
      })
    }
    
    // PUT请求 - 更新帖子
    if (req.method === 'PUT') {
      const { title, content, category_id, status } = req.body || {}
      
      // 验证必填字段
      if (!title || !content) {
        return sendErrorResponse(res, API_ERRORS.MISSING_REQUIRED_FIELDS, {
          message: '帖子标题和内容为必填字段'
        })
      }
      
      // 更新帖子
      const updatedPost = {
        ...post,
        title,
        content,
        category_id: category_id || null,
        status: status || 'published',
        updated_at: Date.now()
      }
      
      posts[postIndex] = updatedPost
      console.log(`更新帖子成功: ${postId}`)
      return sendSuccessResponse(res, updatedPost, {
        message: '帖子更新成功'
      })
    }
    
    // DELETE请求 - 删除帖子
    if (req.method === 'DELETE') {
      posts.splice(postIndex, 1)
      console.log(`删除帖子成功: ${postId}`)
      return sendSuccessResponse(res, {}, {
        message: '帖子删除成功'
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