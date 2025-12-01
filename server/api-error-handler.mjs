/**
 * API错误处理工具 - 统一所有API端点的错误响应格式
 */

// 生成唯一请求ID
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 错误类型枚举
export const API_ERRORS = {
  // 通用错误
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFIG_MISSING: 'CONFIG_MISSING',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  
  // 请求相关错误
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  
  // 认证相关错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // 资源相关错误
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // 业务逻辑错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  OPERATION_FAILED: 'OPERATION_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // 第三方服务错误
  THIRD_PARTY_SERVICE_ERROR: 'THIRD_PARTY_SERVICE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  
  // 特定业务错误
  USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  PASSWORD_STRENGTH_INVALID: 'PASSWORD_STRENGTH_INVALID',
  
  // AI模型相关错误
  MODEL_SWITCH_ERROR: 'MODEL_SWITCH_ERROR',
  MODEL_TIMEOUT: 'MODEL_TIMEOUT',
  MODEL_ERROR: 'MODEL_ERROR',
  
  // 协作相关错误
  COLLABORATION_ERROR: 'COLLABORATION_ERROR',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVITE_ERROR: 'INVITE_ERROR',
  
  // 素材相关错误
  RESOURCE_LOAD_FAILED: 'RESOURCE_LOAD_FAILED',
  TIANJIN_ASSETS_ERROR: 'TIANJIN_ASSETS_ERROR',
  
  // 网络相关错误
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
};

// 错误状态码映射
export const ERROR_STATUS_CODES = {
  // 4xx 客户端错误
  [API_ERRORS.METHOD_NOT_ALLOWED]: 405,
  [API_ERRORS.INVALID_REQUEST]: 400,
  [API_ERRORS.MISSING_REQUIRED_FIELDS]: 400,
  [API_ERRORS.INVALID_PARAMETER]: 400,
  [API_ERRORS.UNAUTHORIZED]: 401,
  [API_ERRORS.INVALID_TOKEN]: 401,
  [API_ERRORS.TOKEN_EXPIRED]: 401,
  [API_ERRORS.PERMISSION_DENIED]: 403,
  [API_ERRORS.RESOURCE_NOT_FOUND]: 404,
  [API_ERRORS.RESOURCE_ALREADY_EXISTS]: 409,
  [API_ERRORS.RESOURCE_CONFLICT]: 409,
  [API_ERRORS.VALIDATION_ERROR]: 422,
  [API_ERRORS.RATE_LIMIT_EXCEEDED]: 429,
  
  // 5xx 服务器错误
  [API_ERRORS.SERVER_ERROR]: 500,
  [API_ERRORS.UNKNOWN_ERROR]: 500,
  [API_ERRORS.CONFIG_MISSING]: 500,
  [API_ERRORS.OPERATION_FAILED]: 500,
  [API_ERRORS.THIRD_PARTY_SERVICE_ERROR]: 502,
  [API_ERRORS.EXTERNAL_API_ERROR]: 502,
  [API_ERRORS.NETWORK_ERROR]: 503,
  [API_ERRORS.TIMEOUT_ERROR]: 504,
  
  // 特定业务错误状态码
  [API_ERRORS.USERNAME_ALREADY_EXISTS]: 409,
  [API_ERRORS.EMAIL_ALREADY_EXISTS]: 409,
  [API_ERRORS.INVALID_CREDENTIALS]: 401,
  [API_ERRORS.PASSWORD_STRENGTH_INVALID]: 400,
  [API_ERRORS.MODEL_SWITCH_ERROR]: 500,
  [API_ERRORS.MODEL_TIMEOUT]: 504,
  [API_ERRORS.MODEL_ERROR]: 500,
  [API_ERRORS.COLLABORATION_ERROR]: 500,
  [API_ERRORS.USER_NOT_FOUND]: 404,
  [API_ERRORS.INVITE_ERROR]: 500,
  [API_ERRORS.RESOURCE_LOAD_FAILED]: 500,
  [API_ERRORS.TIANJIN_ASSETS_ERROR]: 500
};

// 错误信息映射
export const ERROR_MESSAGES = {
  // 通用错误
  [API_ERRORS.METHOD_NOT_ALLOWED]: '不允许的请求方法',
  [API_ERRORS.CONFIG_MISSING]: '配置缺失',
  [API_ERRORS.SERVER_ERROR]: '服务器内部错误',
  [API_ERRORS.UNKNOWN_ERROR]: '未知错误',
  
  // 请求相关错误
  [API_ERRORS.INVALID_REQUEST]: '无效的请求',
  [API_ERRORS.MISSING_REQUIRED_FIELDS]: '缺少必填字段',
  [API_ERRORS.INVALID_PARAMETER]: '无效的参数',
  
  // 认证相关错误
  [API_ERRORS.UNAUTHORIZED]: '未授权访问',
  [API_ERRORS.INVALID_TOKEN]: '无效的令牌',
  [API_ERRORS.TOKEN_EXPIRED]: '令牌已过期',
  [API_ERRORS.PERMISSION_DENIED]: '没有权限执行此操作',
  
  // 资源相关错误
  [API_ERRORS.RESOURCE_NOT_FOUND]: '找不到请求的资源',
  [API_ERRORS.RESOURCE_ALREADY_EXISTS]: '资源已存在',
  [API_ERRORS.RESOURCE_CONFLICT]: '资源冲突',
  
  // 业务逻辑错误
  [API_ERRORS.VALIDATION_ERROR]: '验证失败',
  [API_ERRORS.OPERATION_FAILED]: '操作失败',
  [API_ERRORS.RATE_LIMIT_EXCEEDED]: '请求频率过高，请稍后再试',
  
  // 第三方服务错误
  [API_ERRORS.THIRD_PARTY_SERVICE_ERROR]: '第三方服务错误',
  [API_ERRORS.EXTERNAL_API_ERROR]: '外部API错误',
  
  // 特定业务错误
  [API_ERRORS.USERNAME_ALREADY_EXISTS]: '用户名已存在',
  [API_ERRORS.EMAIL_ALREADY_EXISTS]: '邮箱已存在',
  [API_ERRORS.INVALID_CREDENTIALS]: '邮箱或密码错误',
  [API_ERRORS.PASSWORD_STRENGTH_INVALID]: '密码强度不足',
  
  // AI模型相关错误
  [API_ERRORS.MODEL_SWITCH_ERROR]: '模型切换失败',
  [API_ERRORS.MODEL_TIMEOUT]: 'AI模型响应超时',
  [API_ERRORS.MODEL_ERROR]: 'AI模型处理失败',
  
  // 协作相关错误
  [API_ERRORS.COLLABORATION_ERROR]: '协作功能暂时不可用',
  [API_ERRORS.USER_NOT_FOUND]: '找不到该用户',
  [API_ERRORS.INVITE_ERROR]: '邀请发送失败',
  
  // 素材相关错误
  [API_ERRORS.RESOURCE_LOAD_FAILED]: '资源加载失败',
  [API_ERRORS.TIANJIN_ASSETS_ERROR]: '天津素材库加载失败',
  
  // 网络相关错误
  [API_ERRORS.NETWORK_ERROR]: '网络连接失败',
  [API_ERRORS.TIMEOUT_ERROR]: '请求超时'
};

/**
 * 统一的错误响应格式
 * @typedef {Object} ApiErrorResponse
 * @property {boolean} ok - 操作是否成功
 * @property {string} error - 错误代码
 * @property {string} message - 友好的错误提示
 * @property {any} [data] - 错误相关数据
 * @property {string} [requestId] - 请求ID，用于调试
 */

/**
 * 发送统一格式的错误响应
 * @param {import('vercel').VercelResponse} res - Vercel响应对象
 * @param {string} errorCode - 错误代码
 * @param {Object} [options] - 错误选项
 * @param {string} [options.message] - 自定义错误消息
 * @param {any} [options.data] - 错误相关数据
 * @param {number} [options.statusCode] - 自定义状态码
 * @param {string} [options.requestId] - 请求ID
 * @param {Object} [options.context] - 错误上下文信息
 * @returns {void}
 */
export function sendErrorResponse(res, errorCode, options = {}) {
  const { message, data, statusCode, requestId, context } = options;
  
  // 生成或使用提供的请求ID
  const finalRequestId = requestId || generateRequestId();
  
  // 确定状态码
  const finalStatusCode = statusCode || ERROR_STATUS_CODES[errorCode] || 500;
  
  // 确定错误消息
  const finalMessage = message || ERROR_MESSAGES[errorCode] || ERROR_MESSAGES[API_ERRORS.UNKNOWN_ERROR];
  
  // 构建错误响应
  const errorResponse = {
    ok: false,
    error: errorCode,
    message: finalMessage,
    ...(data && { data }),
    requestId: finalRequestId,
    ...(process.env.NODE_ENV === 'development' && context && { context })
  };
  
  // 发送响应
  res.status(finalStatusCode).json(errorResponse);
}

/**
 * 发送统一格式的成功响应
 * @param {import('vercel').VercelResponse} res - Vercel响应对象
 * @param {any} [data] - 响应数据
 * @param {Object} [options] - 响应选项
 * @param {number} [options.statusCode] - 自定义状态码
 * @param {string} [options.message] - 成功消息
 * @param {string} [options.requestId] - 请求ID
 * @returns {void}
 */
export function sendSuccessResponse(res, data = null, options = {}) {
  const { statusCode = 200, message, requestId } = options;
  
  // 生成或使用提供的请求ID
  const finalRequestId = requestId || generateRequestId();
  
  // 构建成功响应
  const successResponse = {
    ok: true,
    ...(message && { message }),
    ...(data !== null && { data }),
    requestId: finalRequestId
  };
  
  // 发送响应
  res.status(statusCode).json(successResponse);
}

/**
 * 处理API错误的中间件
 * @param {Function} handler - API处理函数
 * @returns {Function} 包装后的API处理函数
 */
export function withErrorHandling(handler) {
  return async (req, res) => {
    // 生成请求ID
    const requestId = generateRequestId();
    
    // 将请求ID添加到响应头
    res.setHeader('X-Request-ID', requestId);
    
    try {
      // 调用原始处理函数
      await handler(req, res);
    } catch (error) {
      // 收集错误上下文信息
      const errorContext = {
        request: {
          method: req.method,
          url: req.url,
          headers: {
            // 只包含安全的头信息
            'user-agent': req.headers['user-agent'],
            'accept-language': req.headers['accept-language'],
            'content-type': req.headers['content-type']
          },
          // 只在开发环境中包含请求体，避免敏感信息泄露
          ...(process.env.NODE_ENV === 'development' && req.body && { body: req.body })
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        }
      };
      
      // 记录详细的错误日志
      console.error('API错误:', {
        requestId,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        },
        context: errorContext
      });
      
      // 发送统一格式的错误响应
      sendErrorResponse(res, API_ERRORS.SERVER_ERROR, {
        message: process.env.NODE_ENV === 'production' ? ERROR_MESSAGES[API_ERRORS.SERVER_ERROR] : error.message,
        data: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          name: error.name,
          code: error.code
        } : undefined,
        requestId,
        context: process.env.NODE_ENV === 'development' ? errorContext : undefined
      });
    }
  };
}
