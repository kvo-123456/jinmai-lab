import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { llmService, AVAILABLE_MODELS, LLMModel } from '../services/llmService';

interface ModelPerformance {
  requestCount: number;
  successCount: number;
  averageResponseTime: number;
}

interface ModelComparisonProps {
  models?: string[];
}

const ModelComparison: React.FC<ModelComparisonProps> = ({ models = [] }) => {
  const { isDark } = useTheme();
  const [selectedModels, setSelectedModels] = useState<string[]>(models.length > 0 ? models : []);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  
  // 切换模型选择状态
  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else {
        return [...prev, modelId];
      }
    });
  };
  
  // 切换模型详情展开状态
  const toggleExpand = (modelId: string) => {
    setExpandedModel(expandedModel === modelId ? null : modelId);
  };
  
  // 获取模型性能数据
  const getPerformanceData = (modelId: string) => {
    return llmService.getPerformanceData(modelId);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
    >
      <h3 className="text-xl font-bold mb-6">AI模型比较</h3>
      
      {/* 模型选择器 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">选择要比较的模型</h4>
        <div className="flex flex-wrap gap-3">
          {AVAILABLE_MODELS.map(model => (
            <motion.button
              key={model.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleModel(model.id)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${selectedModels.includes(model.id)
                ? 'bg-blue-600 text-white shadow-md'
                : isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              {model.name}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* 比较表格 */}
      {selectedModels.length > 0 && (
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  指标
                </th>
                {selectedModels.map(modelId => {
                  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
                  return (
                    <th key={modelId} scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      <div className="flex items-center">
                        <span>{model?.name}</span>
                        <button
                          onClick={() => toggleExpand(modelId)}
                          className={`ml-2 text-xs ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          <i className={`fas fa-chevron-${expandedModel === modelId ? 'up' : 'down'}`}></i>
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className={`${isDark ? 'bg-gray-800' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {/* 模型描述 */}
              <tr>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  描述
                </td>
                {selectedModels.map(modelId => {
                  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
                  return (
                    <td key={modelId} className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {model?.description}
                    </td>
                  );
                })}
              </tr>
              
              {/* 擅长领域 */}
              <tr>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  擅长领域
                </td>
                {selectedModels.map(modelId => {
                  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
                  return (
                    <td key={modelId} className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex flex-wrap gap-1">
                        {model?.strengths.map((strength, idx) => (
                          <span key={idx} className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            {strength}
                          </span>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
              
              {/* 请求成功率 */}
              <tr>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  请求成功率
                </td>
                {selectedModels.map(modelId => {
                  const performance = getPerformanceData(modelId) as ModelPerformance;
                  const successRate = performance.requestCount > 0 
                    ? `${((performance.successCount / performance.requestCount) * 100).toFixed(1)}%`
                    : 'N/A';
                  return (
                    <td key={modelId} className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {successRate}
                    </td>
                  );
                })}
              </tr>
              
              {/* 平均响应时间 */}
              <tr>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  平均响应时间
                </td>
                {selectedModels.map(modelId => {
                  const performance = getPerformanceData(modelId) as ModelPerformance;
                  const avgTime = performance.requestCount > 0 
                    ? `${performance.averageResponseTime.toFixed(0)}ms`
                    : 'N/A';
                  return (
                    <td key={modelId} className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {avgTime}
                    </td>
                  );
                })}
              </tr>
              
              {/* 总请求数 */}
              <tr>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  总请求数
                </td>
                {selectedModels.map(modelId => {
                  const performance = getPerformanceData(modelId) as ModelPerformance;
                  return (
                    <td key={modelId} className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {performance.requestCount}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      {/* 无模型选择时的提示 */}
      {selectedModels.length === 0 && (
        <div className={`py-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <i className="fas fa-chart-bar text-4xl mb-4 opacity-50"></i>
          <p>请选择要比较的模型</p>
        </div>
      )}
    </motion.div>
  );
};

export default ModelComparison;