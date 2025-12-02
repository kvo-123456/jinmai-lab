import type { VercelRequest, VercelResponse } from '@vercel/node'
const { sendErrorResponse, sendSuccessResponse, API_ERRORS } = require('../../server/api-error-handler.mjs')

// 模拟分类数据，后续会替换为数据库操作
const categories = [
  { id: 1, name: '国潮设计', description: '中国潮流设计相关内容', created_at: Date.now(), updated_at: Date.now() },
  { id: 2, name: '非遗传承', description: '非物质文化遗产传承相关内容', created_at: Date.now(), updated_at: Date.now() },
  { id: 3, name: '品牌联名', description: '品牌合作联名相关内容', created_at: Date.now(), updated_at: Date.now() }
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
    const categoryId = parseInt(id as string)
    
    // 验证分类ID
    if (isNaN(categoryId)) {
      return sendErrorResponse(res, API_ERRORS.INVALID_PARAMETER, {
        message: '无效的分类ID'
      })
    }
    
    // 查找分类
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId)
    if (categoryIndex === -1) {
      return sendErrorResponse(res, API_ERRORS.CATEGORY_NOT_FOUND, {
        message: '分类不存在'
      })
    }
    
    // GET请求 - 获取单个分类
    if (req.method === 'GET') {
      console.log(`获取分类: ${categoryId}`)
      return sendSuccessResponse(res, categories[categoryIndex])
    }
    
    // PUT请求 - 更新分类
    if (req.method === 'PUT') {
      const { name, description } = req.body || {}
      
      // 验证必填字段
      if (!name) {
        return sendErrorResponse(res, API_ERRORS.MISSING_REQUIRED_FIELDS, {
          message: '分类名称为必填字段'
        })
      }
      
      // 更新分类
      const updatedCategory = {
        ...categories[categoryIndex],
        name,
        description: description || '',
        updated_at: Date.now()
      }
      
      categories[categoryIndex] = updatedCategory
      console.log(`更新分类成功: ${categoryId}`, { name, description })
      return sendSuccessResponse(res, updatedCategory, {
        message: '分类更新成功'
      })
    }
    
    // DELETE请求 - 删除分类
    if (req.method === 'DELETE') {
      categories.splice(categoryIndex, 1)
      console.log(`删除分类成功: ${categoryId}`)
      return sendSuccessResponse(res, {}, {
        message: '分类删除成功'
      })
    }
    
    // 方法不允许
    return sendErrorResponse(res, API_ERRORS.METHOD_NOT_ALLOWED)
  } catch (e: any) {
    console.error('分类管理API错误:', e)
    return sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN'
    })
  }
}