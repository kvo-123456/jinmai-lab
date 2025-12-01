/**
 * 错误服务模块 - 提供错误处理、日志记录和监控功能
 */

// 错误类型定义
export interface ErrorInfo {
  errorId: string;
  errorType: string;
  message: string;
  stackTrace?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  deviceInfo: {
    browser: string;
    browserVersion: string;
    os: string;
    device: string;
  };
  context?: Record<string, any>;
}

// 错误日志存储
class ErrorLogger {
  private errors: ErrorInfo[] = [];
  private MAX_ERRORS = 100; // 最大存储错误数量
  private storageKey = 'ai_creation_platform_errors';

  constructor() {
    // 从本地存储加载错误日志
    this.loadErrors();
  }

  // 加载错误日志
  private loadErrors(): void {
    try {
      const storedErrors = localStorage.getItem(this.storageKey);
      if (storedErrors) {
        this.errors = JSON.parse(storedErrors);
      }
    } catch (error) {
      console.error('Failed to load error logs:', error);
      this.errors = [];
    }
  }

  // 保存错误日志到本地存储
  private saveErrors(): void {
    try {
      // 限制错误数量
      if (this.errors.length > this.MAX_ERRORS) {
        this.errors = this.errors.slice(-this.MAX_ERRORS);
      }
      localStorage.setItem(this.storageKey, JSON.stringify(this.errors));
    } catch (error) {
      console.error('Failed to save error logs:', error);
    }
  }

  // 记录错误
  logError(error: ErrorInfo): void {
    this.errors.push(error);
    this.saveErrors();
    
    // 可以在这里添加发送到服务器的逻辑
    this.sendToServer(error);
  }

  // 发送错误到服务器（模拟）
  private sendToServer(error: ErrorInfo): void {
    // 模拟API调用延迟
    setTimeout(() => {
      console.log('Sending error to server:', error);
      // 实际项目中，这里会发送HTTP请求到错误监控服务器
    }, 0);
  }

  // 获取所有错误
  getAllErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  // 清除错误日志
  clearErrors(): void {
    this.errors = [];
    localStorage.removeItem(this.storageKey);
  }

  // 获取错误统计
  getErrorStats(recentCount: number = 8): {
    total: number;
    byType: Record<string, number>;
    recent: ErrorInfo[];
  } {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      recent: recentCount > 0 ? this.errors.slice(-recentCount) : []
    };

    // 按类型统计错误
    this.errors.forEach(error => {
      if (stats.byType[error.errorType]) {
        stats.byType[error.errorType]++;
      } else {
        stats.byType[error.errorType] = 1;
      }
    });

    return stats;
  }
}

// 错误代码映射 - 提供友好的错误提示
export const ERROR_MESSAGES: Record<string, string> = {
  // 网络相关错误
  'NETWORK_ERROR': '网络连接失败，请检查您的网络设置后重试。',
  'TIMEOUT_ERROR': '请求超时，请检查网络后重试，或切换至4G网络。',
  'SERVER_ERROR': '服务器暂时不可用，请稍后再试。',
  
  // 权限相关错误
  'PERMISSION_DENIED': '您没有权限执行此操作。',
  'AUTH_REQUIRED': '请先登录后再继续操作。',
  
  // 资源相关错误
  'RESOURCE_NOT_FOUND': '找不到请求的资源。',
  'RESOURCE_LOAD_FAILED': '资源加载失败，请检查网络后重试。',
  
  // 表单相关错误
  'VALIDATION_ERROR': '请检查您输入的信息是否正确。',
  'FIELD_REQUIRED': '{field} 不能为空。',
  
  // 协作相关错误
  'COLLABORATION_ERROR': '协作功能暂时不可用，请稍后再试。',
  'USER_NOT_FOUND': '找不到该用户。',
  'INVITE_ERROR': '邀请发送失败，请稍后再试。',
  
  // 模型相关错误
  'MODEL_SWITCH_ERROR': '模型切换失败，请稍后再试。',
  'MODEL_TIMEOUT': 'AI模型响应超时，请尝试切换其他模型。',
  'MODEL_ERROR': 'AI模型处理失败，请稍后再试。',
  
  // 天津素材相关错误
  'TIANJIN_ASSETS_ERROR': '天津素材库加载失败，请稍后再试。',
  '素材加载失败': '素材加载失败，请检查网络后重试，或切换至4G网络。',
  
  // 浏览器兼容性错误
  'BROWSER_COMPAT_ERROR': '您的浏览器版本过低，建议升级Chrome至90+版本以获得最佳体验。',
  
  // 默认错误
  'DEFAULT_ERROR': '操作失败，请稍后再试。'
};

// 错误修复建议
export const ERROR_FIX_SUGGESTIONS: Record<string, string[]> = {
  'NETWORK_ERROR': [
    '检查您的网络连接是否正常',
    '尝试刷新页面',
    '如果使用Wi-Fi，请尝试切换到移动数据',
    '清除浏览器缓存后重试'
  ],
  'BROWSER_COMPAT_ERROR': [
    '升级Chrome浏览器至90+版本',
    '使用其他现代浏览器如Firefox或Edge',
    '确保浏览器已启用JavaScript'
  ],
  'PERMISSION_DENIED': [
    '确认您有足够的权限执行此操作',
    '联系管理员获取帮助',
    '刷新页面并重试'
  ]
};

// 设备信息检测
const getDeviceInfo = (): {
  browser: string;
  browserVersion: string;
  os: string;
  device: string;
} => {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let browserVersion = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  // 检测浏览器
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    if (match) browserVersion = match[1];
  }

  // 检测操作系统
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Macintosh')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    device = 'Mobile';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
    device = 'Mobile';
  }

  return { browser, browserVersion, os, device };
};

// 生成错误ID
const generateErrorId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 错误服务类
class ErrorService {
  private logger = new ErrorLogger();

  /**
   * 获取友好的错误提示信息
   * @param errorCode 错误代码
   * @param params 替换参数（如字段名等）
   * @returns 格式化的错误信息
   */
  getFriendlyErrorMessage(errorCode: string, params: Record<string, string> = {}): string {
    let message = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['DEFAULT_ERROR'];
    
    // 替换占位符
    Object.keys(params).forEach(key => {
      const placeholder = `{${key}}`;
      if (message.includes(placeholder)) {
        message = message.replace(placeholder, params[key]);
      }
    });
    
    return message;
  }

  /**
   * 获取错误修复建议
   * @param errorCode 错误代码
   * @returns 修复建议数组
   */
  getErrorFixSuggestions(errorCode: string): string[] {
    return ERROR_FIX_SUGGESTIONS[errorCode] || ['请尝试刷新页面后重试', '如果问题持续，请联系客服获取帮助'];
  }

  /**
   * 记录错误
   * @param error 错误对象或错误代码
   * @param context 错误上下文信息
   */
  logError(error: Error | string, context: Record<string, any> = {}): ErrorInfo {
    let errorType = 'UNKNOWN_ERROR';
    let message = '未知错误';
    let stackTrace = '';

    if (error instanceof Error) {
      message = error.message;
      stackTrace = error.stack || '';
      
      // 尝试从错误消息中提取错误类型
      if (message.includes('NetworkError')) {
        errorType = 'NETWORK_ERROR';
      } else if (message.includes('timeout')) {
        errorType = 'TIMEOUT_ERROR';
      } else if (message.includes('Permission denied')) {
        errorType = 'PERMISSION_DENIED';
      }
    } else {
      errorType = error;
      message = this.getFriendlyErrorMessage(error);
    }

    const errorInfo: ErrorInfo = {
      errorId: generateErrorId(),
      errorType,
      message,
      stackTrace,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      deviceInfo: getDeviceInfo(),
      context
    };

    // 记录错误
    this.logger.logError(errorInfo);
    
    return errorInfo;
  }

  /**
   * 获取错误日志统计
   */
  getErrorStats(recentCount: number = 8) {
    return this.logger.getErrorStats(recentCount);
  }

  /**
   * 获取错误分类统计
   * @param timeRange 时间范围（毫秒），默认24小时
   */
  getErrorCategoryStats(timeRange: number = 24 * 60 * 60 * 1000) {
    const allErrors = this.logger.getAllErrors();
    const cutoffTime = Date.now() - timeRange;
    const recentErrors = allErrors.filter(error => error.timestamp >= cutoffTime);
    
    // 按错误类型分类
    const categoryStats = recentErrors.reduce((stats, error) => {
      if (stats[error.errorType]) {
        stats[error.errorType]++;
      } else {
        stats[error.errorType] = 1;
      }
      return stats;
    }, {} as Record<string, number>);
    
    // 按设备类型分类
    const deviceStats = recentErrors.reduce((stats, error) => {
      const deviceType = error.deviceInfo.device;
      if (stats[deviceType]) {
        stats[deviceType]++;
      } else {
        stats[deviceType] = 1;
      }
      return stats;
    }, {} as Record<string, number>);
    
    // 按浏览器分类
    const browserStats = recentErrors.reduce((stats, error) => {
      const browser = `${error.deviceInfo.browser} v${error.deviceInfo.browserVersion}`;
      if (stats[browser]) {
        stats[browser]++;
      } else {
        stats[browser] = 1;
      }
      return stats;
    }, {} as Record<string, number>);
    
    // 按操作系统分类
    const osStats = recentErrors.reduce((stats, error) => {
      const os = error.deviceInfo.os;
      if (stats[os]) {
        stats[os]++;
      } else {
        stats[os] = 1;
      }
      return stats;
    }, {} as Record<string, number>);
    
    return {
      total: recentErrors.length,
      byCategory: categoryStats,
      byDevice: deviceStats,
      byBrowser: browserStats,
      byOS: osStats,
      timeRange,
      cutoffTime
    };
  }

  /**
   * 获取错误趋势统计
   * @param interval 时间间隔（毫秒），默认1小时
   * @param timeRange 时间范围（毫秒），默认24小时
   */
  getErrorTrendStats(interval: number = 60 * 60 * 1000, timeRange: number = 24 * 60 * 60 * 1000) {
    const allErrors = this.logger.getAllErrors();
    const cutoffTime = Date.now() - timeRange;
    const recentErrors = allErrors.filter(error => error.timestamp >= cutoffTime);
    
    // 按时间间隔分组
    const trendStats = recentErrors.reduce((stats, error) => {
      const intervalKey = Math.floor(error.timestamp / interval) * interval;
      if (stats[intervalKey]) {
        stats[intervalKey]++;
      } else {
        stats[intervalKey] = 1;
      }
      return stats;
    }, {} as Record<number, number>);
    
    // 转换为数组格式，便于图表展示
    const trendArray = Object.entries(trendStats)
      .map(([timestamp, count]) => ({
        timestamp: parseInt(timestamp),
        count
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return {
      trend: trendArray,
      interval,
      timeRange,
      cutoffTime
    };
  }

  /**
   * 上报错误到远程服务器
   * @param errorInfo 错误信息
   * @returns Promise<boolean> 上报是否成功
   */
  async reportErrorToServer(errorInfo: ErrorInfo): Promise<boolean> {
    try {
      // 检查是否配置了错误上报URL
      const reportUrl = process.env.REACT_APP_ERROR_REPORT_URL || process.env.NEXT_PUBLIC_ERROR_REPORT_URL;
      if (!reportUrl) {
        console.warn('错误上报URL未配置，跳过上报');
        return false;
      }
      
      // 发送错误报告
      const response = await fetch(reportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorInfo),
        keepalive: true // 允许在页面卸载时继续发送请求
      });
      
      return response.ok;
    } catch (error) {
      console.error('错误上报失败:', error);
      return false;
    }
  }

  /**
   * 批量上报错误到远程服务器
   * @param limit 批量上报的最大数量
   * @returns Promise<number> 成功上报的错误数量
   */
  async batchReportErrors(limit: number = 10): Promise<number> {
    const stats = this.getErrorStats();
    const errorsToReport = stats.recent.slice(0, limit);
    
    let successCount = 0;
    for (const error of errorsToReport) {
      const success = await this.reportErrorToServer(error);
      if (success) {
        successCount++;
      }
    }
    
    return successCount;
  }

  clearErrors() {
    this.logger.clearErrors();
  }

  /**
   * 检查浏览器兼容性
   */
  checkBrowserCompatibility(): {
    isCompatible: boolean;
    message?: string;
  } {
    const deviceInfo = getDeviceInfo();
    
    // 检查浏览器版本
    if (deviceInfo.browser === 'Chrome' && parseInt(deviceInfo.browserVersion) < 90) {
      return {
        isCompatible: false,
        message: this.getFriendlyErrorMessage('BROWSER_COMPAT_ERROR')
      };
    }
    
    return { isCompatible: true };
  }
}

// 导出单例实例
export default new ErrorService();
