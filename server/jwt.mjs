import jwt from 'jsonwebtoken'

/**
 * JWT配置和管理模块
 * 支持从环境变量中读取多个密钥，实现动态密钥轮换
 */

// 默认配置
const DEFAULT_SECRET = 'your-secret-key-change-this-in-production'
const DEFAULT_EXPIRES_IN = '7d'

/**
 * 获取JWT密钥列表
 * 支持从环境变量中读取多个密钥，格式为 JWT_SECRET_1, JWT_SECRET_2, ...
 * 同时支持单个JWT_SECRET环境变量
 * @returns {Array<string>} 密钥列表
 */
function getJwtSecrets() {
  const secrets = []
  
  // 检查单个密钥
  if (process.env.JWT_SECRET) {
    secrets.push(process.env.JWT_SECRET)
  }
  
  // 检查多个密钥
  let index = 1
  while (process.env[`JWT_SECRET_${index}`]) {
    secrets.push(process.env[`JWT_SECRET_${index}`])
    index++
  }
  
  // 如果没有配置密钥，使用默认密钥（仅用于开发环境）
  if (secrets.length === 0) {
    console.warn('警告: 未配置JWT_SECRET环境变量，使用默认密钥（仅用于开发环境）')
    secrets.push(DEFAULT_SECRET)
  }
  
  return secrets
}

/**
 * 获取当前活跃的JWT密钥（用于签名）
 * @returns {string} 当前活跃的密钥
 */
export function getActiveJwtSecret() {
  const secrets = getJwtSecrets()
  // 使用第一个密钥作为活跃密钥
  return secrets[0]
}

/**
 * 获取所有JWT密钥（用于验证）
 * @returns {Array<string>} 所有密钥
 */
export function getAllJwtSecrets() {
  return getJwtSecrets()
}

/**
 * 获取JWT过期时间
 * @returns {string} 过期时间
 */
export function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN
}

/**
 * 生成JWT令牌
 * @param {Object} payload - 令牌载荷
 * @param {Object} options - 选项
 * @returns {string} JWT令牌
 */
export function generateToken(payload, options = {}) {
  const secret = getActiveJwtSecret()
  
  // 直接使用字符串形式的expiresIn参数
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

/**
 * 验证JWT令牌
 * @param {string} token - JWT令牌
 * @returns {Object|null} 解码后的载荷，如果验证失败则返回null
 */
export function verifyToken(token) {
  const secrets = getAllJwtSecrets()
  
  // 尝试使用每个密钥验证令牌
  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(token, secret)
      return decoded
    } catch (error) {
      // 继续尝试下一个密钥
      continue
    }
  }
  
  // 所有密钥都验证失败
  return null
}

/**
 * 解码JWT令牌（不验证签名）
 * @param {string} token - JWT令牌
 * @returns {Object|null} 解码后的载荷，如果解码失败则返回null
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token)
  } catch (error) {
    return null
  }
}

/**
 * 获取JWT配置信息
 * @returns {Object} 配置信息
 */
export function getJwtConfig() {
  return {
    secrets: getAllJwtSecrets().length,
    expiresIn: getJwtExpiresIn(),
    hasMultipleSecrets: getAllJwtSecrets().length > 1
  }
}
