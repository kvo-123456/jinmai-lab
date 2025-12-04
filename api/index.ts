import type { VercelRequest, VercelResponse } from '@vercel/node'
import loginHandler from './auth/login'
import meHandler from './auth/me'
import registerHandler from './auth/register'
import categoriesIdHandler from './categories/[id]'
import categoriesHandler from './categories/index'
import commentsIdHandler from './comments/[id]'
import commentsHandler from './comments/index'
import likesHandler from './likes/index'
import postsIdHandler from './posts/[id]'
import postsHandler from './posts/index'
import tagsIdHandler from './tags/[id]'
import tagsHandler from './tags/index'

// 定义路由处理函数类型
type RouteHandler = (req: VercelRequest, res: VercelResponse) => Promise<any>

// 定义路由方法映射类型
type RouteMethods = {
  GET?: RouteHandler
  POST?: RouteHandler
  PUT?: RouteHandler
  DELETE?: RouteHandler
}

// 定义路由映射类型
type RouteMap = Record<string, RouteMethods>

// 创建路由映射
const routes: RouteMap = {
  '/api/auth/login': {
    POST: loginHandler
  },
  '/api/auth/me': {
    GET: meHandler
  },
  '/api/auth/register': {
    POST: registerHandler
  },
  '/api/categories/:id': {
    GET: categoriesIdHandler,
    PUT: categoriesIdHandler,
    DELETE: categoriesIdHandler
  },
  '/api/categories': {
    GET: categoriesHandler,
    POST: categoriesHandler
  },
  '/api/comments/:id': {
    GET: commentsIdHandler,
    PUT: commentsIdHandler,
    DELETE: commentsIdHandler
  },
  '/api/comments': {
    GET: commentsHandler,
    POST: commentsHandler
  },
  '/api/likes': {
    GET: likesHandler,
    POST: likesHandler,
    DELETE: likesHandler
  },
  '/api/posts/:id': {
    GET: postsIdHandler,
    PUT: postsIdHandler,
    DELETE: postsIdHandler
  },
  '/api/posts': {
    GET: postsHandler,
    POST: postsHandler
  },
  '/api/tags/:id': {
    GET: tagsIdHandler,
    PUT: tagsIdHandler,
    DELETE: tagsIdHandler
  },
  '/api/tags': {
    GET: tagsHandler,
    POST: tagsHandler
  }
}

// 路径匹配函数
function matchRoute(path: string, method: string): { handler: RouteHandler, params: Record<string, string> } | null {
  // 精确匹配
  if (routes[path] && routes[path][method as keyof RouteMethods]) {
    const handler = routes[path][method as keyof RouteMethods]
    if (handler) {
      return {
        handler,
        params: {}
      }
    }
  }

  // 模式匹配（处理带参数的路径）
  for (const routePattern in routes) {
    const handler = routes[routePattern][method as keyof RouteMethods]
    if (handler) {
      // 将路由模式转换为正则表达式
      const regexPattern = routePattern
        .replace(/\/:([^/]+)/g, '/([^/]+)')
        .replace(/\*/g, '.*')
      const regex = new RegExp(`^${regexPattern}$`)
      const match = path.match(regex)
      
      if (match) {
        // 提取参数名称
        const paramNames = routePattern.match(/\/:([^/]+)/g)?.map(p => p.slice(1)) || []
        const params: Record<string, string> = {}
        
        // 匹配参数值
        paramNames.forEach((name, index) => {
          params[name] = match![index + 1]
        })
        
        return {
          handler,
          params
        }
      }
    }
  }
  
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  const origin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  
  try {
    // 匹配路由
    const match = matchRoute(req.url || '', req.method || '')
    
    if (match) {
      // 将路径参数添加到req对象中，保持与Vercel路由一致
      ;(req as any).query = {
        ...req.query,
        ...match.params
      }
      
      // 调用对应的处理函数
      return await match.handler(req, res)
    } else {
      // 未找到路由
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'API路由不存在'
        }
      })
    }
  } catch (error: any) {
    console.error('API路由处理错误:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message
      }
    })
  }
}