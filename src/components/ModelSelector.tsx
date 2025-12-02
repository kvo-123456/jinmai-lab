import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import llmService, { AVAILABLE_MODELS, LLMModel, ModelConfig } from '../services/llmService';

interface ModelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const [selectedModel, setSelectedModel] = useState<LLMModel>(llmService.getCurrentModel());
  const [modelConfig, setModelConfig] = useState<ModelConfig>(llmService.getConfig());
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kimiKey, setKimiKey] = useState<string>(() => {
    const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_KIMI_API_KEY) || '';
    const stored = localStorage.getItem('KIMI_API_KEY') || '';
    return stored || envKey;
  });
  const [kimiBase, setKimiBase] = useState<string>('https://api.moonshot.cn/v1');
  const [kimiVariant, setKimiVariant] = useState<string>('moonshot-v1-32k');
  const [deepseekKey, setDeepseekKey] = useState<string>(() => {
    const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_DEEPSEEK_API_KEY) || '';
    const stored = localStorage.getItem('DEEPSEEK_API_KEY') || '';
    return stored || envKey;
  });
  const [deepseekBase, setDeepseekBase] = useState<string>('https://api.deepseek.com');
  const [deepseekVariant, setDeepseekVariant] = useState<string>('deepseek-chat');
  const configRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedModel(llmService.getCurrentModel());
      setModelConfig(llmService.getConfig());
    }
  }, [isOpen]);

  const handleModelChange = (modelId: string) => {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (model) {
      setSelectedModel(model);
      setTimeout(() => {
        if (configRef.current) {
          configRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  };

  const handleModelKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const ids = AVAILABLE_MODELS.map(m => m.id);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleModelChange(ids[idx]);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (idx + 1) % ids.length;
      handleModelChange(ids[next]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (idx - 1 + ids.length) % ids.length;
      handleModelChange(ids[prev]);
    }
  };

  const handleConfigChange = (field: keyof ModelConfig, value: any) => {
    setModelConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 模拟设置保存延迟
      setTimeout(() => {
        if (selectedModel.id === 'kimi') {
          if (kimiKey) {
            if (!kimiKey.startsWith('sk-')) {
              setError('Kimi 密钥格式不正确');
              setIsLoading(false);
              return;
            }
            localStorage.setItem('KIMI_API_KEY', kimiKey);
          }
          setModelConfig(prev => ({ ...prev, kimi_base_url: kimiBase, kimi_model: kimiVariant }));
        }
        if (selectedModel.id === 'deepseek') {
          if (deepseekKey) {
            if (!deepseekKey.startsWith('sk-')) {
              setError('DeepSeek 密钥格式不正确');
              setIsLoading(false);
              return;
            }
            localStorage.setItem('DEEPSEEK_API_KEY', deepseekKey);
          }
          setModelConfig(prev => ({ ...prev, deepseek_base_url: deepseekBase, deepseek_model: deepseekVariant }));
        }
        llmService.setCurrentModel(selectedModel.id);
        llmService.updateConfig(modelConfig);
        toast.success('模型设置已保存');
        onClose();
        setIsLoading(false);
      }, 500);
    } catch (err) {
      setError('保存模型设置失败，请稍后再试');
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);
      llmService.setCurrentModel(selectedModel.id);
      llmService.updateConfig({ stream: false });
      const resp = await llmService.generateResponse('ping');
      const text = String(resp || '');
      const isFail = (selectedModel.id === 'kimi' && text.includes('Kimi接口不可用')) || (selectedModel.id === 'deepseek' && text.includes('DeepSeek接口不可用'));
      if (isFail) {
        toast.error('连接失败，请检查密钥或网络');
      } else {
        toast.success('连接正常');
      }
    } catch (e) {
      toast.error('连接失败，请检查密钥或网络');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'
      } backdrop-blur-sm`}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-md w-full mx-4 overflow-hidden flex flex-col`}
      >
        {/* 面板头部 */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">模型选择</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="关闭"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 面板内容 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* 错误信息显示 */}
          {error && (
            <div className={`mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm flex items-center`}>
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}
          
          {/* 模型列表 */}
          <div className="mb-6">
            <h4 className="font-medium mb-4">选择大语言模型</h4>
            <div role="radiogroup" aria-label="模型列表" className="space-y-3">
              {AVAILABLE_MODELS.map((model, idx) => (
                <motion.button
                  key={model.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedModel.id === model.id}
                  tabIndex={0}
                  className={`relative w-full text-left p-4 rounded-xl border transition-all ${
                    selectedModel.id === model.id
                      ? 'border-red-600 bg-red-100 dark:bg-red-900/20 ring-2 ring-red-500 shadow-md'
                      : isDark
                      ? 'border-gray-700 hover:border-gray-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  whileHover={{ y: -2 }}
                  onClick={() => handleModelChange(model.id)}
                  onKeyDown={(e) => handleModelKeyDown(e, idx)}
                  aria-label={`选择模型 ${model.name}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className={`font-bold ${selectedModel.id === model.id ? 'text-red-600' : ''}`}>{model.name}</h5>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {model.description}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedModel.id === model.id
                        ? 'border-red-600'
                        : isDark
                        ? 'border-gray-600'
                        : 'border-gray-300'
                    } flex items-center justify-center`}>
                      {selectedModel.id === model.id && (
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {model.strengths.map((strength, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                  {selectedModel.id === model.id && (
                    <span className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-red-600 text-white">已选择</span>
                  )}
                </motion.button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}">
              <i className="fas fa-chevron-down mr-2"></i>
              向下查看更多设置
            </div>
          </div>

          {selectedModel.id === 'kimi' && (
            <div className="mb-6 hidden" ref={configRef}>
              <h4 className="font-medium mb-2">Kimi（月之暗面）API 密钥</h4>
              <input
                type="password"
                value={kimiKey}
                onChange={(e) => setKimiKey(e.target.value)}
                placeholder="输入以 sk- 开头的密钥"
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none`}
                disabled={isLoading}
              />
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>密钥仅保存在本地浏览器，用于本机直连或代理调用。</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Base URL（区域）</label>
                  <select
                    value={kimiBase}
                    onChange={(e) => setKimiBase(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    disabled={isLoading}
                  >
                    <option value="https://api.moonshot.cn/v1">中国区</option>
                    <option value="https://api.moonshot.ai/v1">全球区</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">模型规格（上下文长度）</label>
                  <select
                    value={kimiVariant}
                    onChange={(e) => setKimiVariant(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    disabled={isLoading}
                  >
                    <option value="moonshot-v1-8k">moonshot-v1-8k</option>
                    <option value="moonshot-v1-32k">moonshot-v1-32k</option>
                    <option value="moonshot-v1-128k">moonshot-v1-128k</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {selectedModel.id === 'deepseek' && (
            <div className="mb-6 hidden" ref={configRef}>
              <h4 className="font-medium mb-2">DeepSeek API 密钥</h4>
              <input
                type="password"
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                placeholder="输入以 sk- 开头的密钥"
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none`}
                disabled={isLoading}
              />
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>密钥保存在本地，仅用于本机调用。</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Base URL</label>
                  <select
                    value={deepseekBase}
                    onChange={(e) => setDeepseekBase(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    disabled={isLoading}
                  >
                    <option value="https://api.deepseek.com">https://api.deepseek.com</option>
                    <option value="https://api.deepseek.com/v1">https://api.deepseek.com/v1</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">模型规格</label>
                  <select
                    value={deepseekVariant}
                    onChange={(e) => setDeepseekVariant(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    disabled={isLoading}
                  >
                    <option value="deepseek-chat">deepseek-chat</option>
                    <option value="deepseek-reasoner">deepseek-reasoner</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 高级设置 */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className={`flex items-center justify-between w-full p-3 rounded-xl text-left ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}
              disabled={isLoading}
            >
              <span className="font-medium">高级设置</span>
              <i className={`fas fa-chevron-${showAdvancedSettings ? 'up' : 'down'}`}></i>
            </button>

            {showAdvancedSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-4"
              >
                {/* 温度设置 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">创作自由度 (Temperature)</label>
                    <span className="text-sm">{modelConfig.temperature.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={modelConfig.temperature}
                    onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                    disabled={isLoading}
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span>严谨</span>
                    <span>平衡</span>
                    <span>创意</span>
                  </div>
                </div>

                {/* Top P设置 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">多样性 (Top P)</label>
                    <span className="text-sm">{modelConfig.top_p.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={modelConfig.top_p}
                    onChange={(e) => handleConfigChange('top_p', parseFloat(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                    disabled={isLoading}
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span>集中</span>
                    <span>适中</span>
                    <span>多样</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">系统提示词</label>
                  </div>
                  <textarea
                    value={modelConfig.system_prompt}
                    onChange={(e) => handleConfigChange('system_prompt', e.target.value)}
                    className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    rows={3}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">上下文历史条数</label>
                    <span className="text-sm">{modelConfig.max_history}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={modelConfig.max_history}
                    onChange={(e) => handleConfigChange('max_history', parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">启用流式输出</label>
                  <input type="checkbox" checked={modelConfig.stream} onChange={(e) => handleConfigChange('stream', e.target.checked)} />
                </div>

                {/* 最大token设置 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">最大响应长度</label>
                    <span className="text-sm">{modelConfig.max_tokens}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="500"
                    value={modelConfig.max_tokens}
                    onChange={(e) => handleConfigChange('max_tokens', parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                    disabled={isLoading}
                  />
                  <div className="flex justify-between text-xs mt-1">285|                     <span>短</span>
                    <span>中</span>
                    <span>长</span>
                  </div>
                </div>

                {/* 超时设置 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">响应超时 (秒)</label>
                    <span className="text-sm">{Math.round(modelConfig.timeout / 1000)}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={Math.round(modelConfig.timeout / 1000)}
                    onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value) * 1000)}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                    disabled={isLoading}
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span>快</span>
                    <span>标准</span>
                    <span>慢</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* 面板底部 */}
        <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center space-x-3`}>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>当前模型：{selectedModel.name}</span>
          <button
            onClick={() => {
              // 使用当前配置作为基础，只更新需要的属性
              const currentConfig = llmService.getConfig();
              setModelConfig({
                ...currentConfig,
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 2000,
                timeout: 30000,
                system_prompt: '你是一个帮助创作者进行设计构思与文化融合的助手。',
                max_history: 10,
                stream: false,
                kimi_model: 'moonshot-v1-32k',
                kimi_base_url: 'https://api.moonshot.cn/v1',
                retry: 2,
                backoff_ms: 800,
                deepseek_model: 'deepseek-chat',
                deepseek_base_url: 'https://api.deepseek.com'
              });
            }}
            className={`px-5 py-2.5 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            disabled={isLoading}
          >
            恢复默认
          </button>
          <button
            onClick={handleTestConnection}
            className={`px-5 py-2.5 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            disabled={isLoading}
          >
            连接测试
          </button>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            disabled={isLoading}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-lg transition-colors ${
              isLoading
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                保存中...
              </>
            ) : (
              '保存设置'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModelSelector;
