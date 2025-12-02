import type { VercelRequest, VercelResponse } from '@vercel/node'
const { sendErrorResponse, sendSuccessResponse, API_ERRORS } = require('../../server/api-error-handler.mjs')

// 点赞是基于user_id和post_id的组合操作，通常不需要单独操作某个点赞记录
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  const origin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  
  // 对于点赞操作，建议使用 /api/likes 端点
  return sendErrorResponse(res, API_ERRORS.METHOD_NOT_ALLOWED, {
    message: '点赞操作不支持单个点赞记录的操作，请使用 /api/likes 端点',
    hint: 'GET /api/likes?post_id=1 - 获取帖子1的点赞列表\nGET /api/likes?user_id=1 - 获取用户1的点赞列表\nPOST /api/likes - 创建或取消点赞'
  })
}