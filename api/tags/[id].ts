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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  
  try {
    const { id } = req.query
    const tagId = parseInt(id as string)
    
    // 验证标签ID
    if (isNaN(tagId)) {
      return sendErrorResponse(res, API_ERRORS.INVALID_PARAMETER, {
        message: '无效的标签ID'
      })
    }
    
    // 查找标签
    const tagIndex = tags.findIndex(tag => tag.id === tagId)
    if (tagIndex === -1) {
      return sendErrorResponse(res, API_ERRORS.TAG_NOT_FOUND, {
        message: '标签不存在'
      })
    }
    
    // GET请求 - 获取单个标签
    if (req.method === 'GET') {
      console.log(`获取标签: ${tagId}`)
      return sendSuccessResponse(res, tags[tagIndex])
    }
    
    // PUT请求 - 更新标签
    if (req.method === 'PUT') {
      const { name, description } = req.body || {}
      
      // 验证必填字段
      if (!name) {
        return sendErrorResponse(res, API_ERRORS.MISSING_REQUIRED_FIELDS, {
          message: '标签名称为必填字段'
        })
      }
      
      // 更新标签
      const updatedTag = {
        ...tags[tagIndex],
        name,
        description: description || '',
        updated_at: Date.now()
      }
      
      tags[tagIndex] = updatedTag
      console.log(`更新标签成功: ${tagId}`, { name, description })
      return sendSuccessResponse(res, updatedTag, {
        message: '标签更新成功'
      })
    }
    
    // DELETE请求 - 删除标签
    if (req.method === 'DELETE') {
      tags.splice(tagIndex, 1)
      console.log(`删除标签成功: ${tagId}`)
      return sendSuccessResponse(res, {}, {
        message: '标签删除成功'
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