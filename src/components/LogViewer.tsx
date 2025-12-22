import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { logger } from '../utils/logViewer';

interface LogViewerProps {
  maxVisibleLogs?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const LogViewer: React.FC<LogViewerProps> = ({
  maxVisibleLogs = 50,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const { isDark } = useTheme();
  const [logs, setLogs] = useState(logger.getRecentLogs(maxVisibleLogs));
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState(logger.getStats());

  // 定期刷新日志
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshLogs();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // 刷新日志
  const refreshLogs = () => {
    setRefreshing(true);
    // 模拟延迟
    setTimeout(() => {
      let updatedLogs = logger.getRecentLogs(maxVisibleLogs);
      
      // 应用筛选
      if (filter !== 'all') {
        updatedLogs = updatedLogs.filter(log => log.level === filter);
      }
      
      // 应用搜索
      if (searchQuery) {
        updatedLogs = updatedLogs.filter(log => 
          log.message.includes(searchQuery) ||
          (log.data && JSON.stringify(log.data).includes(searchQuery)) ||
          (log.context && JSON.stringify(log.context).includes(searchQuery))
        );
      }
      
      setLogs(updatedLogs);
      setStats(logger.getStats());
      setRefreshing(false);
    }, 100);
  };

  // 清除所有日志
  const clearAllLogs = () => {
    if (window.confirm('确定要清除所有日志吗？')) {
      logger.clearLogs();
      refreshLogs();
    }
  };

  // 获取日志级别对应的样式
  const getLogLevelStyles = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'debug':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取日志级别对应的图标
  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return 'fas fa-info-circle';
      case 'warn':
        return 'fas fa-exclamation-triangle';
      case 'error':
        return 'fas fa-times-circle';
      case 'debug':
        return 'fas fa-bug';
      default:
        return 'fas fa-question-circle';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-2xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* 日志查看器头部 */}
      <div 
        className={`flex items-center justify-between p-3 cursor-pointer ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors rounded-t-lg`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <i className="fas fa-list-alt text-blue-500"></i>
            <span className="font-semibold">日志查看器</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{stats.total} 条</span>
            {stats.byLevel.error > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">{stats.byLevel.error} 错误</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              refreshLogs();
            }}
            className={`p-1 rounded-full ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
            title="刷新日志"
          >
            {refreshing ? (
              <i className="fas fa-spinner fa-spin text-gray-500"></i>
            ) : (
              <i className="fas fa-sync-alt text-gray-500"></i>
            )}
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              clearAllLogs();
            }}
            className={`p-1 rounded-full ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
            title="清除日志"
          >
            <i className="fas fa-trash-alt text-gray-500"></i>
          </button>
          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-gray-500`}></i>
        </div>
      </div>

      {/* 日志查看器内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-[400px] max-w-[95vw]"
          >
            {/* 筛选和搜索 */}
            <div className={`p-3 border-y ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex flex-col gap-2">
                {/* 搜索框 */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜索日志..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full px-3 py-1.5 text-sm rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>
                
                {/* 筛选选项 */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {[
                    { value: 'all', label: '全部', count: stats.total },
                    { value: 'info', label: '信息', count: stats.byLevel.info },
                    { value: 'warn', label: '警告', count: stats.byLevel.warn },
                    { value: 'error', label: '错误', count: stats.byLevel.error },
                    { value: 'debug', label: '调试', count: stats.byLevel.debug }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilter(option.value as any);
                      }}
                      className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${filter === option.value ? 'bg-blue-500 text-white' : isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                    >
                      {option.label} ({option.count})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 日志列表 */}
            <div className="max-h-[300px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className={`p-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <i className="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
                  <p>暂无日志记录</p>
                </div>
              ) : (
                <ul className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {logs.map((log) => (
                    <li 
                      key={log.id} 
                      className={`p-3 text-sm hover:bg-opacity-50 transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-start gap-2">
                        {/* 日志级别和时间 */}
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getLogLevelStyles(log.level)}`}>
                            <i className={`${getLogLevelIcon(log.level)} mr-1`}></i>
                            {log.level.toUpperCase()}
                          </span>
                        </div>
                        
                        {/* 日志内容 */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{log.message}</span>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          {/* 日志数据 */}
                          {(log.data || log.context) && (
                            <div className={`pl-4 border-l-2 border-gray-300 ${isDark ? 'border-gray-600' : 'border-gray-300'} space-y-1`}>
                              {log.data && (
                                <div>
                                  <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>数据:</span>
                                  <pre className={`mt-1 p-2 rounded bg-gray-100 text-xs overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                    {JSON.stringify(log.data, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.context && (
                                <div>
                                  <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>上下文:</span>
                                  <pre className={`mt-1 p-2 rounded bg-gray-100 text-xs overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                    {JSON.stringify(log.context, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LogViewer;
