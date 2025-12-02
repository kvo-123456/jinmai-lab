import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import llmService, { ModelPerformance, PerformanceRecord } from '../services/llmService';

const PerformanceMonitor: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<Record<string, ModelPerformance>>({});
  const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<number>(60); // 分钟
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // 更新性能数据
  const updatePerformanceData = () => {
    const data = llmService.getPerformanceData() as Record<string, ModelPerformance>;
    setPerformanceData(data);
    
    const records = llmService.getPerformanceRecords(selectedModel === 'all' ? undefined : selectedModel, 50);
    setPerformanceRecords(records);
  };

  // 定期更新性能数据
  useEffect(() => {
    updatePerformanceData();
    const interval = setInterval(updatePerformanceData, 5000); // 每5秒更新一次
    return () => clearInterval(interval);
  }, [selectedModel]);

  // 处理时间范围变化
  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(parseInt(e.target.value));
  };

  // 处理模型选择变化
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };

  // 获取模型名称
  const getModelName = (modelId: string) => {
    const model = llmService.getConfigTemplates().find(t => t.id === modelId);
    return model ? model.name : modelId;
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // 计算成功率
  const calculateSuccessRate = (performance: ModelPerformance) => {
    if (performance.requestCount === 0) return '0%';
    return `${Math.round((performance.successCount / performance.requestCount) * 100)}%`;
  };

  // 格式化响应时间
  const formatResponseTime = (time: number) => {
    return `${Math.round(time)}ms`;
  };

  return (
    <div className="relative">
      {/* 性能监控按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="fas fa-chart-line"></i>
        性能监控
      </motion.button>

      {/* 性能监控面板 */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">模型性能监控</h3>
            <button
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setIsOpen(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* 筛选选项 */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex gap-2">
              <label className="text-sm font-medium flex-1">
                模型:
                <select
                  value={selectedModel}
                  onChange={handleModelChange}
                  className="ml-2 p-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white flex-1"
                >
                  <option value="all">所有模型</option>
                  {Object.keys(performanceData).map(modelId => (
                    <option key={modelId} value={modelId}>
                      {modelId}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <label className="text-sm font-medium flex-1">
                时间范围:
                <select
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  className="ml-2 p-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white flex-1"
                >
                  <option value={15}>15分钟</option>
                  <option value={30}>30分钟</option>
                  <option value={60}>1小时</option>
                  <option value={120}>2小时</option>
                  <option value={240}>4小时</option>
                </select>
              </label>
            </div>
          </div>

          {/* 性能概览 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">性能概览</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(performanceData)
                .filter(modelId => selectedModel === 'all' || modelId === selectedModel)
                .map(modelId => {
                  const performance = performanceData[modelId];
                  return (
                    <motion.div
                      key={modelId}
                      whileHover={{ scale: 1.02 }}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{modelId}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${parseFloat(calculateSuccessRate(performance)) > 90 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                          {calculateSuccessRate(performance)} 成功率
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">请求数:</span> {performance.requestCount}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">平均响应:</span> {formatResponseTime(performance.averageResponseTime)}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">成功:</span> {performance.successCount}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">失败:</span> {performance.failureCount}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>

          {/* 最近请求记录 */}
          <div>
            <h4 className="text-sm font-medium mb-2">最近请求记录</h4>
            <div className="max-h-48 overflow-y-auto">
              {performanceRecords.map((record, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-2 mb-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{record.modelId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${record.success ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                      {record.success ? '成功' : '失败'}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500 dark:text-gray-400">时间:</span> {formatTime(record.timestamp)}
                    <span className="text-gray-500 dark:text-gray-400">响应时间:</span> {formatResponseTime(record.responseTime)}
                  </div>
                  {record.error && (
                    <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                      错误: {record.error}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PerformanceMonitor;