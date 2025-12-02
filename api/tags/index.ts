import type { VercelRequest, VercelResponse } from '@vercel/node'
const { sendErrorResponse, sendSuccessResponse, API_ERRORS } = require('../../server/api-error-handler.mjs')

// 模拟标签数据，后续会替换为数据库操作
const tags = [
  { id: 1, name: '国潮', description: '中国潮流风格', created_at: Date.now(), updated_at: Date.now() },
  { id: 2, name: '非遗', description: '非物质文化遗产', created_at: Date.now(), updated_at: Date.now() },
  { id: 3, name: '传统工艺', description: '传统手工工艺', created_at: Date.now(), updated_at: Date.now() },
  { id: 4, name: '创新设计', description: '创新设计理念', created_at: Date.now(), updated_at: Date.now() },
  { id: 5, name: '文化创意', description: '文化创意产业', created_at: Date.now(), updated_at: Date.now() }
]

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
    // GET请求 - 获取标签列表
    if (req.method === 'GET') {
      console.log('获取标签列表')
      return sendSuccessResponse(res, tags)
    }
    
    // POST请求 - 创建标签
    if (req.method === 'POST') {
      const { name, description } = req.body || {}
      
      // 验证必填字段
      if (!name) {
        return sendErrorResponse(res, API_ERRORS.MISSING_REQUIRED_FIELDS, {
          message: '标签名称为必填字段'
        })
      }
      
      // 检查标签名称是否已存在
      if (tags.some(tag => tag.name === name)) {
        return sendErrorResponse(res, API_ERRORS.TAG_ALREADY_EXISTS, {
          message: '标签名称已存在'
        })
      }
      
      // 创建新标签
      const newTag = {
        id: tags.length + 1,
        name,
        description: description || '',
        created_at: Date.now(),
        updated_at: Date.now()
      }
      
      tags.push(newTag)
      console.log('创建标签成功:', { name, description })
      return sendSuccessResponse(res, newTag, {
        statusCode: 201,
        message: '标签创建成功'
      })
    }
    
    // 方法不允许
    return sendErrorResponse(res, API_ERRORS.METHOD_NOT_ALLOWED)
  } catch (e: any) {
    console.error('标签管理API错误:', e)
    return sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN'
    })
  }
}