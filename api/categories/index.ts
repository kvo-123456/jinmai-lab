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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  
  try {
    // GET请求 - 获取分类列表
    if (req.method === 'GET') {
      console.log('获取分类列表')
      return sendSuccessResponse(res, categories)
    }
    
    // POST请求 - 创建分类
    if (req.method === 'POST') {
      const { name, description } = req.body || {}
      
      // 验证必填字段
      if (!name) {
        return sendErrorResponse(res, API_ERRORS.MISSING_REQUIRED_FIELDS, {
          message: '分类名称为必填字段'
        })
      }
      
      // 检查分类名称是否已存在
      if (categories.some(cat => cat.name === name)) {
        return sendErrorResponse(res, API_ERRORS.CATEGORY_ALREADY_EXISTS, {
          message: '分类名称已存在'
        })
      }
      
      // 创建新分类
      const newCategory = {
        id: categories.length + 1,
        name,
        description: description || '',
        created_at: Date.now(),
        updated_at: Date.now()
      }
      
      categories.push(newCategory)
      console.log('创建分类成功:', { name, description })
      return sendSuccessResponse(res, newCategory, {
        statusCode: 201,
        message: '分类创建成功'
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