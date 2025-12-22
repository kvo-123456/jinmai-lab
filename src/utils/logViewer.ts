/**
 * 日志查看工具 - 用于查看和管理应用中的日志记录
 */

// 日志类型定义
export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  context?: Record<string, any>;
}

// 日志存储类
class LogStorage {
  private logs: LogEntry[] = [];
  private MAX_LOGS = 1000; // 最大存储日志数量
  private storageKey = 'ai_creation_platform_logs';

  constructor() {
    // 从本地存储加载日志
    this.loadLogs();
  }

  // 加载日志
  private loadLogs(): void {
    try {
      const storedLogs = localStorage.getItem(this.storageKey);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      this.logs = [];
    }
  }

  // 保存日志到本地存储
  private saveLogs(): void {
    try {
      // 限制日志数量
      if (this.logs.length > this.MAX_LOGS) {
        this.logs = this.logs.slice(-this.MAX_LOGS);
      }
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  // 记录日志
  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any, context?: Record<string, any>): void {
    const logEntry: LogEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: Date.now(),
      level,
      message,
      data,
      context
    };

    this.logs.push(logEntry);
    this.saveLogs();
  }

  // 记录信息日志
  info(message: string, data?: any, context?: Record<string, any>): void {
    this.log('info', message, data, context);
  }

  // 记录警告日志
  warn(message: string, data?: any, context?: Record<string, any>): void {
    this.log('warn', message, data, context);
  }

  // 记录错误日志
  error(message: string, data?: any, context?: Record<string, any>): void {
    this.log('error', message, data, context);
  }

  // 记录调试日志
  debug(message: string, data?: any, context?: Record<string, any>): void {
    this.log('debug', message, data, context);
  }

  // 获取所有日志
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  // 获取指定数量的最近日志
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(-count).reverse();
  }

  // 按级别获取日志
  getLogsByLevel(level: 'info' | 'warn' | 'error' | 'debug'): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // 清除所有日志
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem(this.storageKey);
  }

  // 搜索日志
  searchLogs(query: string): LogEntry[] {
    return this.logs.filter(log => 
      log.message.includes(query) || 
      (log.data && JSON.stringify(log.data).includes(query)) ||
      (log.context && JSON.stringify(log.context).includes(query))
    );
  }

  // 获取日志统计
  getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    recent: LogEntry[];
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        info: 0,
        warn: 0,
        error: 0,
        debug: 0
      },
      recent: this.getRecentLogs(5)
    };

    // 按级别统计日志
    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
    });

    return stats;
  }
}

// 导出单例实例
const logStorage = new LogStorage();
export default logStorage;

// 全局日志工具函数
export const logger = {
  info: (message: string, data?: any, context?: Record<string, any>) => logStorage.info(message, data, context),
  warn: (message: string, data?: any, context?: Record<string, any>) => logStorage.warn(message, data, context),
  error: (message: string, data?: any, context?: Record<string, any>) => logStorage.error(message, data, context),
  debug: (message: string, data?: any, context?: Record<string, any>) => logStorage.debug(message, data, context),
  getLogs: () => logStorage.getAllLogs(),
  getRecentLogs: (count?: number) => logStorage.getRecentLogs(count),
  clearLogs: () => logStorage.clearLogs(),
  searchLogs: (query: string) => logStorage.searchLogs(query),
  getStats: () => logStorage.getLogStats()
};
