import type { VercelRequest, VercelResponse } from 'vercel'
import bcryptjs from 'bcryptjs'
import { generateToken } from '../../server/jwt.mjs'
import { userDB } from '../../server/database.mjs'
import { sendErrorResponse, sendSuccessResponse, API_ERRORS } from '../../server/api-error-handler.mjs'



export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  const origin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  
  // 验证请求方法
  if (req.method !== 'POST') {
    return sendErrorResponse(res, API_ERRORS.METHOD_NOT_ALLOWED)
  }
  
  try {
    console.log('收到注册请求:', { method: req.method, path: req.url })
    
    const { username, email, password, age, tags } = req.body || {}
    
    console.log('注册请求参数:', { username, email, hasPassword: !!password })
    
    // 验证必填字段
    if (!username || !email || !password) {
      console.log('注册失败: 缺少必填字段')
      return sendErrorResponse(res, API_ERRORS.MISSING_REQUIRED_FIELDS, {
        message: '用户名、邮箱和密码为必填字段'
      })
    }
    
    // 验证用户名长度
    if (username.length < 2 || username.length > 20) {
      console.log('注册失败: 用户名长度无效')
      return sendErrorResponse(res, API_ERRORS.INVALID_PARAMETER, {
        message: '用户名长度必须在2-20个字符之间'
      })
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('注册失败: 邮箱格式无效')
      return sendErrorResponse(res, API_ERRORS.INVALID_PARAMETER, {
        message: '请输入有效的邮箱地址'
      })
    }
    
    // 验证密码强度（简化要求，至少8个字符，包含字母和数字）
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      console.log('注册失败: 密码强度不足')
      return sendErrorResponse(res, API_ERRORS.PASSWORD_STRENGTH_INVALID, {
        message: '密码至少8个字符，包含至少一个字母和一个数字'
      })
    }
    
    // 检查用户名是否已存在
    console.log('检查用户名是否已存在:', username)
    const existingUserByUsername = await userDB.findByUsername(username)
    if (existingUserByUsername) {
      console.log('注册失败: 用户名已存在')
      return sendErrorResponse(res, API_ERRORS.USERNAME_ALREADY_EXISTS, {
        message: '该用户名已被使用'
      })
    }
    
    // 检查邮箱是否已存在
    console.log('检查邮箱是否已存在:', email)
    const existingUserByEmail = await userDB.findByEmail(email)
    if (existingUserByEmail) {
      console.log('注册失败: 邮箱已存在')
      return sendErrorResponse(res, API_ERRORS.EMAIL_ALREADY_EXISTS, {
        message: '该邮箱已被注册'
      })
    }
    
    // 哈希密码
    console.log('哈希密码...')
    const saltRounds = 10
    const passwordHash = await bcryptjs.hash(password, saltRounds)
    
    // 创建用户
    console.log('创建用户...')
    const result = await userDB.createUser({
      username,
      email,
      password_hash: passwordHash,
      age: age ? parseInt(age) : null,
      tags: tags ? JSON.stringify(tags) : null
    })
    
    const userId = result.id.toString()
    console.log('用户创建成功:', { userId, username, email })
    
    // 生成JWT令牌
    console.log('生成JWT令牌...')
    const token = generateToken({
      userId, email, username
    })
    
    // 返回用户信息和令牌
    console.log('注册成功，返回响应...')
    return sendSuccessResponse(res, {
      token,
      user: {
        id: userId,
        username,
        email,
        age: age ? parseInt(age) : null,
        tags
      }
    }, {
      statusCode: 201,
      message: '注册成功'
    })
  } catch (e: any) {
    console.error('注册失败:', e)
    console.error('错误详情:', { message: e.message, stack: e.stack })
    return sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : e?.message || 'UNKNOWN'
    })
  }
}