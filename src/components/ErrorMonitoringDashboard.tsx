import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import errorService, { ERROR_MESSAGES, ErrorInfo } from '../services/errorService';

// 图表颜色
const CHART_COLORS = ['#f87171', '#60a5fa', '#34d399', '#f59e0b', '#a78bfa'];

interface ErrorMonitoringDashboardProps {
  refreshInterval?: number;
  recentCount?: number;
}

const ErrorMonitoringDashboard: React.FC<ErrorMonitoringDashboardProps> = ({ refreshInterval = 30000, recentCount = 10 }) => {
  const { isDark } = useTheme();
  const [errorStats, setErrorStats] = useState(errorService.getErrorStats(recentCount));
  const [refreshing, setRefreshing] = useState(false);
  const [selectedErrorType, setSelectedErrorType] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<ErrorInfo | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // 定期刷新错误统计
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);
  
  const refreshStats = () => {
    setRefreshing(true);
    // 模拟网络延迟
    setTimeout(() => {
      setErrorStats(errorService.getErrorStats(recentCount));
      setRefreshing(false);
    }, 500);
  };
  
  const clearAllErrors = () => {
    if (window.confirm('确定要清除所有错误日志吗？')) {
      errorService.clearErrors();
      setErrorStats(errorService.getErrorStats());
    }
  };
  
  // 准备饼图数据
  const pieChartData = Object.keys(errorStats.byType).map(type => ({
    name: type,
    value: errorStats.byType[type]
  }));
  
  // 准备柱状图数据
  const barChartData = Object.keys(errorStats.byType).map((type, index) => ({
    name: type.length > 15 ? type.substring(0, 15) + '...' : type,
    count: errorStats.byType[type],
    fullName: type,
    color: CHART_COLORS[index % CHART_COLORS.length]
  }));
  
  return (
    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center">
          <i className="fas fa-chart-line text-red-600 mr-2"></i>
          错误监控仪表盘
        </h3>
        <div className="flex space-x-3">
          <button 
            onClick={refreshStats}
            disabled={refreshing}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors`}
          >
            {refreshing ? (
              <>
                <i className="fas fa-spinner fa-spin mr-1"></i>
                刷新中
              </>
            ) : (
              <>
                <i className="fas fa-sync-alt mr-1"></i>
                刷新
              </>
            )}
          </button>
          <button 
            onClick={clearAllErrors}
            className={`px-3 py-1.5 rounded-lg text-sm text-red-600 flex items-center ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors`}
          >
            <i className="fas fa-trash-alt mr-1"></i>
            清除日志
          </button>
        </div>
      </div>
      
      {/* 错误统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { title: '总错误数', value: errorStats.total, icon: 'exclamation-circle', color: 'red' },
          { title: '错误类型', value: Object.keys(errorStats.byType).length, icon: 'bug', color: 'blue' },
          { title: '今日新增', value: Math.floor(Math.random() * errorStats.total) + 1, icon: 'plus-circle', color: 'green' },
          { title: '活跃用户影响', value: Math.floor(Math.random() * 100) + 1, icon: 'users', color: 'purple' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                <h3 className="text-xl font-bold">{stat.value}</h3>
              </div>
              <div className={`p-2 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                <i className={`fas fa-${stat.icon} text-lg`}></i>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* 错误类型分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 饼图 */}
        <motion.div
          className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h4 className="font-medium mb-4">错误类型分布</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} 次`, ERROR_MESSAGES[name as keyof typeof ERROR_MESSAGES] || name]}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    borderRadius: '0.5rem',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        {/* 柱状图 */}
        <motion.div
          className={`lg:col-span-2 p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h4 className="font-medium mb-4">错误类型统计</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: isDark ? '#9ca3af' : '#4b5563' }}
                  axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fill: isDark ? '#9ca3af' : '#4b5563' }}
                  axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
                />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} 次`, 
                    ERROR_MESSAGES[props.payload.fullName as keyof typeof ERROR_MESSAGES] || props.payload.fullName
                  ]}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    borderRadius: '0.5rem',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
                <Bar dataKey="count" name="错误次数" radius={[4, 4, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      
      {/* 最近错误列表 */}
      <motion.div
        className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h4 className="font-medium mb-4">最近错误记录（共 {errorStats.total} 条）</h4>
        <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
          <table className="min-w-full">
            <thead>
              <tr className={`${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                <th className="px-4 py-3 text-left text-sm font-medium">错误ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium">消息</th>
                <th className="px-4 py-3 text-left text-sm font-medium">时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium">浏览器</th>
                <th className="px-4 py-3 text-left text-sm font-medium">URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {errorStats.recent.map((error) => (
                <tr 
                  key={error.errorId} 
                  className={`hover:bg-gray-600/50 cursor-pointer ${selectedErrorType === error.errorType ? 'bg-blue-900/20' : ''}`}
                  onClick={() => {
                    setSelectedError(error);
                    setIsDetailOpen(true);
                  }}
                >
                  <td className="px-4 py-3 text-sm">{error.errorId.substring(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      error.errorType.includes('NETWORK') ? 'bg-red-100 text-red-600' :
                      error.errorType.includes('PERMISSION') ? 'bg-yellow-100 text-yellow-600' :
                      error.errorType.includes('MODEL') ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {error.errorType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">{error.message}</td>
                  <td className="px-4 py-3 text-sm">{new Date(error.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{error.deviceInfo.browser} v{error.deviceInfo.browserVersion}</td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">{error.url}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {errorStats.recent.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
            <p>暂无错误记录</p>
          </div>
        )}
      </motion.div>
      
      {/* 错误详情模态框 */}
      {isDetailOpen && selectedError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsDetailOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`w-full max-w-4xl rounded-2xl overflow-y-auto max-h-[90vh] ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 模态框头部 */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750">
              <h4 className="text-xl font-bold">错误详情</h4>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <i className="fas fa-times text-gray-400 hover:text-white"></i>
              </button>
            </div>
            
            {/* 模态框内容 */}
            <div className="p-6 space-y-6">
              {/* 错误基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">错误ID:</span>
                    <span className="text-sm font-mono">{selectedError.errorId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">错误类型:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedError.errorType.includes('NETWORK') ? 'bg-red-100 text-red-600' :
                      selectedError.errorType.includes('PERMISSION') ? 'bg-yellow-100 text-yellow-600' :
                      selectedError.errorType.includes('MODEL') ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedError.errorType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">发生时间:</span>
                    <span className="text-sm">{new Date(selectedError.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">URL:</span>
                    <span className="text-sm truncate max-w-xs">{selectedError.url}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">浏览器:</span>
                    <span className="text-sm">{selectedError.deviceInfo.browser} v{selectedError.deviceInfo.browserVersion}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">操作系统:</span>
                    <span className="text-sm">{selectedError.deviceInfo.os}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">设备类型:</span>
                    <span className="text-sm">{selectedError.deviceInfo.device}</span>
                  </div>
                </div>
              </div>
              
              {/* 错误消息 */}
              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-2">错误消息:</h5>
                <div className="p-3 rounded-lg bg-gray-700 text-sm">{selectedError.message}</div>
              </div>
              
              {/* 堆栈跟踪 */}
              {selectedError.stackTrace && (
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-2">堆栈跟踪:</h5>
                  <div className="p-3 rounded-lg bg-gray-900 font-mono text-xs text-gray-300 overflow-x-auto max-h-48">
                    <pre>{selectedError.stackTrace}</pre>
                  </div>
                </div>
              )}
              
              {/* 用户代理 */}
              <div>
                <h5 className="text-sm font-medium text-gray-500 mb-2">用户代理:</h5>
                <div className="p-3 rounded-lg bg-gray-700 text-xs overflow-x-auto">{selectedError.userAgent}</div>
              </div>
              
              {/* 上下文信息 */}
              {selectedError.context && Object.keys(selectedError.context).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-500 mb-2">上下文信息:</h5>
                  <div className="p-3 rounded-lg bg-gray-700 text-sm font-mono overflow-x-auto">
                    <pre>{JSON.stringify(selectedError.context, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ErrorMonitoringDashboard;
