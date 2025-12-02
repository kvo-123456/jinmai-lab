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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  
  try {
    const { id } = req.query
    const commentId = parseInt(id as string)
    
    // 验证评论ID
    if (isNaN(commentId)) {
      return sendErrorResponse(res, API_ERRORS.INVALID_PARAMETER, {
        message: '无效的评论ID'
      })
    }
    
    // 查找评论
    const commentIndex = comments.findIndex(comment => comment.id === commentId)
    if (commentIndex === -1) {
      return sendErrorResponse(res, API_ERRORS.COMMENT_NOT_FOUND, {
        message: '评论不存在'
      })
    }
    
    const comment = comments[commentIndex]
    
    // GET请求 - 获取单个评论
    if (req.method === 'GET') {
      console.log(`获取评论: ${commentId}`)
      return sendSuccessResponse(res, comment)
    }
    
    // 验证身份
    const auth = verifyAuth(req)
    if (!auth) {
      return sendErrorResponse(res, API_ERRORS.UNAUTHORIZED, {
        message: '未授权访问'
      })
    }
    
    // 验证用户权限
    if (comment.user_id !== auth.userId) {
      return sendErrorResponse(res, API_ERRORS.FORBIDDEN, {
        message: '没有权限操作此评论'
      })
    }
    
    // PUT请求 - 更新评论
    if (req.method === 'PUT') {
      const { content } = req.body || {}
      
      // 验证必填字段
      if (!content) {
        return sendErrorResponse(res, API_ERRORS.MISSING_REQUIRED_FIELDS, {
          message: '评论内容为必填字段'
        })
      }
      
      // 更新评论
      const updatedComment = {
        ...comment,
        content,
        updated_at: Date.now()
      }
      
      comments[commentIndex] = updatedComment
      console.log(`更新评论成功: ${commentId}`)
      return sendSuccessResponse(res, updatedComment, {
        message: '评论更新成功'
      })
    }
    
    // DELETE请求 - 删除评论
    if (req.method === 'DELETE') {
      comments.splice(commentIndex, 1)
      console.log(`删除评论成功: ${commentId}`)
      return sendSuccessResponse(res, {}, {
        message: '评论删除成功'
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