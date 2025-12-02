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
  
  // 豆包模型配置
  const [doubaoKey, setDoubaoKey] = useState<string>(() => {
    const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_DOBAO_API_KEY) || '';
    const stored = localStorage.getItem('DOUBAO_API_KEY') || '';
    return stored || envKey;
  });
  const [doubaoBase, setDoubaoBase] = useState<string>('https://api.doubao.com/v1');
  const [doubaoVariant, setDoubaoVariant] = useState<string>('doubao-pro-32k');
  
  // 文心一言模型配置
  const [wenxinKey, setWenxinKey] = useState<string>(() => {
    const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_WENXIN_API_KEY) || '';
    const stored = localStorage.getItem('WENXIN_API_KEY') || '';
    return stored || envKey;
  });
  const [wenxinBase, setWenxinBase] = useState<string>('https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions');
  const [wenxinVariant, setWenxinVariant] = useState<string>('ERNIE-Speed-8K');
  
  // 通义千问模型配置
  const [qwenKey, setQwenKey] = useState<string>(() => {
    const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_QWEN_API_KEY) || '';
    const stored = localStorage.getItem('QWEN_API_KEY') || '';
    return stored || envKey;
  });
  const [qwenBase, setQwenBase] = useState<string>('https://dashscope.aliyuncs.com/api/v1');
  const [qwenVariant, setQwenVariant] = useState<string>('qwen-plus');
  
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

  // 密钥格式验证函数
  const validateApiKey = (modelId: string, key: string): boolean => {
    if (!key) return true; // 允许空密钥（使用代理时）
    
    switch (modelId) {
      case 'kimi':
      case 'deepseek':
        return key.startsWith('sk-');
      case 'doubao':
        // 豆包密钥格式：通常是字母数字组合
        return /^[a-zA-Z0-9-_]+$/.test(key);
      case 'wenxinyiyan':
        // 文心一言密钥格式：通常是字母数字组合
        return /^[a-zA-Z0-9-_]+$/.test(key);
      case 'qwen':
        // 通义千问密钥格式：通常是sk-开头
        return key.startsWith('sk-');
      default:
        return true;
    }
  };
  
  // 简单的密钥加密存储函数
  const saveApiKey = (keyName: string, keyValue: string): void => {
    if (!keyValue) {
      localStorage.removeItem(keyName);
      return;
    }
    // 使用简单的Base64编码存储，实际生产环境建议使用更安全的加密方式
    const encodedKey = btoa(keyValue);
    localStorage.setItem(keyName, encodedKey);
  };
  
  // 简单的密钥解密函数
  const getApiKey = (keyName: string): string => {
    const encodedKey = localStorage.getItem(keyName) || '';
    if (!encodedKey) return '';
    try {
      return atob(encodedKey);
    } catch {
      return '';
    }
  };
  
  const handleSave = () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 模拟设置保存延迟
      setTimeout(() => {
        let keyValid = true;
        let errorMessage = '';
        
        // 验证并保存API密钥
        if (selectedModel.id === 'kimi') {
          if (kimiKey) {
            if (!validateApiKey('kimi', kimiKey)) {
              keyValid = false;
              errorMessage = 'Kimi 密钥格式不正确，应为 sk- 开头';
            } else {
              saveApiKey('KIMI_API_KEY', kimiKey);
            }
          } else {
            saveApiKey('KIMI_API_KEY', '');
          }
          setModelConfig(prev => ({ ...prev, kimi_base_url: kimiBase, kimi_model: kimiVariant }));
        } else if (selectedModel.id === 'deepseek') {
          if (deepseekKey) {
            if (!validateApiKey('deepseek', deepseekKey)) {
              keyValid = false;
              errorMessage = 'DeepSeek 密钥格式不正确，应为 sk- 开头';
            } else {
              saveApiKey('DEEPSEEK_API_KEY', deepseekKey);
            }
          } else {
            saveApiKey('DEEPSEEK_API_KEY', '');
          }
          setModelConfig(prev => ({ ...prev, deepseek_base_url: deepseekBase, deepseek_model: deepseekVariant }));
        } else if (selectedModel.id === 'doubao') {
          if (doubaoKey) {
            if (!validateApiKey('doubao', doubaoKey)) {
              keyValid = false;
              errorMessage = '豆包 密钥格式不正确';
            } else {
              saveApiKey('DOUBAO_API_KEY', doubaoKey);
            }
          } else {
            saveApiKey('DOUBAO_API_KEY', '');
          }
          setModelConfig(prev => ({ ...prev, doubao_base_url: doubaoBase, doubao_model: doubaoVariant }));
        } else if (selectedModel.id === 'wenxinyiyan') {
          if (wenxinKey) {
            if (!validateApiKey('wenxinyiyan', wenxinKey)) {
              keyValid = false;
              errorMessage = '文心一言 密钥格式不正确';
            } else {
              saveApiKey('WENXIN_API_KEY', wenxinKey);
            }
          } else {
            saveApiKey('WENXIN_API_KEY', '');
          }
          setModelConfig(prev => ({ ...prev, wenxin_base_url: wenxinBase, wenxin_model: wenxinVariant }));
        } else if (selectedModel.id === 'qwen') {
          if (qwenKey) {
            if (!validateApiKey('qwen', qwenKey)) {
              keyValid = false;
              errorMessage = '通义千问 密钥格式不正确，应为 sk- 开头';
            } else {
              saveApiKey('QWEN_API_KEY', qwenKey);
            }
          } else {
            saveApiKey('QWEN_API_KEY', '');
          }
          setModelConfig(prev => ({ ...prev, qwen_base_url: qwenBase, qwen_model: qwenVariant }));
        }
        
        if (!keyValid) {
          setError(errorMessage);
          setIsLoading(false);
          return;
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
                  className={`relative w-full text-left p-4 rounded-xl border transition-all ${selectedModel.id === model.id ? 'border-red-600 bg-red-100 dark:bg-red-900/20 ring-2 ring-red-500 shadow-md' : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`}
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
                    <div className={`w-5 h-5 rounded-full border-2 ${selectedModel.id === model.id ? 'border-red-600' : isDark ? 'border-gray-600' : 'border-gray-300'} flex items-center justify-center`}>
                      {selectedModel.id === model.id && (
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {model.strengths.map((strength, index) => (
                      <span
                        key={index}
                        className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
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
            <div className="mb-6" ref={configRef}>
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
          
          {selectedModel.id === 'doubao' && (
            <div className="mb-6" ref={configRef}>
              <h4 className="font-medium mb-2">豆包 API 密钥</h4>
              <input
                type="password"
                value={doubaoKey}
                onChange={(e) => setDoubaoKey(e.target.value)}
                placeholder="输入豆包 API 密钥"
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none`}
                disabled={isLoading}
              />
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>密钥保存在本地，仅用于本机调用。</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Base URL</label>
                  <select
                    value={doubaoBase}
                    onChange={(e) => setDoubaoBase(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    disabled={isLoading}
                  >
                    <option value="https://api.doubao.com/v1">https://api.doubao.com/v1</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">模型规格</label>
                  <select
                    value={doubaoVariant}
                    onChange={(e) => setDoubaoVariant(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    disabled={isLoading}
                  >
                    <option value="doubao-pro-32k">doubao-pro-32k</option>
                    <option value="doubao-pro">doubao-pro</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {selectedModel.id === 'wenxinyiyan' && (
            <div className="mb-6" ref={configRef}>
              <h4 className="font-medium mb-2">文心一言 API 密钥</h4>
              <input
                type="password"
                value={wenxinKey}
                onChange={(e) => setWenxinKey(e.target.value)}
                placeholder="输入文心一言 API 密钥"
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none`}
                disabled={isLoading}
              />
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>密钥保存在本地，仅用于本机调用。</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Base URL</label>
                  <select
                    value={wenxinBase}
                    onChange={(e) => setWenxinBase(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    disabled={isLoading}
                  >
                    <option value="https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions">https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">模型规格</label>
                  <select
                    value={wenxinVariant}
                    onChange={(e) => setWenxinVariant(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    disabled={isLoading}
                  >
                    <option value="ERNIE-Speed-8K">ERNIE-Speed-8K</option>
                    <option value="ERNIE-4.0-8K">ERNIE-4.0-8K</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {selectedModel.id === 'qwen' && (
            <div className="mb-6" ref={configRef}>
              <h4 className="font-medium mb-2">通义千问 API 密钥</h4>
              <input
                type="password"
                value={qwenKey}
                onChange={(e) => setQwenKey(e.target.value)}
                placeholder="输入通义千问 API 密钥"
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none`}
                disabled={isLoading}
              />
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>密钥保存在本地，仅用于本机调用。</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Base URL</label>
                  <select
                    value={qwenBase}
                    onChange={(e) => setQwenBase(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    disabled={isLoading}
                  >
                    <option value="https://dashscope.aliyuncs.com/api/v1">https://dashscope.aliyuncs.com/api/v1</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">模型规格</label>
                  <select
                    value={qwenVariant}
                    onChange={(e) => setQwenVariant(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    disabled={isLoading}
                  >
                    <option value="qwen-plus">qwen-plus</option>
                    <option value="qwen-turbo">qwen-turbo</option>
                    <option value="qwen-max">qwen-max</option>
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
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    控制模型输出的随机性和创造性。值越低，输出越严谨一致；值越高，输出越多样化和创造性。
                  </p>
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
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    控制模型输出的多样性。值越低，模型只考虑最可能的输出；值越高，模型会考虑更多可能的输出，增加多样性。
                  </p>
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
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    定义模型的角色和行为，指导模型在对话中的表现。系统提示词会影响模型的整体输出风格和内容方向。
                  </p>
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
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    控制模型在生成回复时参考的历史对话条数。值越大，模型能记住更多上下文，但可能增加响应时间和 token 消耗。
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">启用流式输出</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={modelConfig.stream}
                      onChange={(e) => handleConfigChange('stream', e.target.checked)}
                      disabled={isLoading}
                      className="mr-2"
                    />
                    <span className="text-sm">{modelConfig.stream ? '启用' : '禁用'}</span>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    启用后，模型会实时返回生成的内容，而不是等待完整生成后一次性返回，提供更好的交互体验。
                  </p>
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
                  <div className="flex justify-between text-xs mt-1">
                    <span>短</span>
                    <span>中</span>
                    <span>长</span>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    控制模型生成回复的最大长度，单位为 token。值越大，生成的内容可能越长，但响应时间也会增加。
                  </p>
                </div>

                {/* 响应超时 */}
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
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    设置模型生成回复的最大等待时间。值过小可能导致频繁超时，值过大可能让用户等待时间过长。
                  </p>
                </div>
                
                {/* Presence Penalty */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">新主题权重 (Presence Penalty)</label>
                    <span className="text-sm">{modelConfig.presence_penalty.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={modelConfig.presence_penalty}
                    onChange={(e) => handleConfigChange('presence_penalty', parseFloat(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                    disabled={isLoading}
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span>抑制新主题</span>
                    <span>平衡</span>
                    <span>鼓励新主题</span>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    控制模型引入新主题的倾向。正值鼓励模型讨论新主题，负值抑制模型引入新主题。
                  </p>
                </div>
                
                {/* Frequency Penalty */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">重复内容惩罚 (Frequency Penalty)</label>
                    <span className="text-sm">{modelConfig.frequency_penalty.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={modelConfig.frequency_penalty}
                    onChange={(e) => handleConfigChange('frequency_penalty', parseFloat(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                    disabled={isLoading}
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span>允许重复</span>
                    <span>平衡</span>
                    <span>抑制重复</span>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    控制模型重复使用相同词语的倾向。正值惩罚重复内容，负值鼓励重复内容。
                  </p>
                </div>
                
                {/* 重试次数 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">重试次数</label>
                    <span className="text-sm">{modelConfig.retry}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    value={modelConfig.retry}
                    onChange={(e) => handleConfigChange('retry', parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                    disabled={isLoading}
                  />
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    设置模型请求失败时的自动重试次数。值越大，重试机会越多，但总等待时间可能越长。
                  </p>
                </div>
                
                {/* 退避时间 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">退避时间 (ms)</label>
                    <span className="text-sm">{modelConfig.backoff_ms}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="100"
                    value={modelConfig.backoff_ms}
                    onChange={(e) => handleConfigChange('backoff_ms', parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                    disabled={isLoading}
                  />
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    设置重试之间的等待时间，采用指数退避策略。值越大，重试间隔越长，降低服务器压力。
                  </p>
                </div>
                
                {/* 对话记忆配置 */}
                <div className="border-t pt-4 mt-4 border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-medium mb-3">对话记忆配置</h5>
                  <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    控制模型如何记住和使用对话历史，影响模型的上下文理解能力。
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">启用对话记忆</label>
                    <input 
                      type="checkbox" 
                      checked={modelConfig.enable_memory} 
                      onChange={(e) => handleConfigChange('enable_memory', e.target.checked)} 
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">记忆窗口大小</label>
                      <span className="text-sm">{modelConfig.memory_window}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={modelConfig.memory_window}
                      onChange={(e) => handleConfigChange('memory_window', parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                      disabled={isLoading || !modelConfig.enable_memory}
                    />
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      控制模型保留的对话轮数，影响模型的长期记忆能力。
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">上下文窗口大小</label>
                      <span className="text-sm">{modelConfig.context_window}</span>
                    </div>
                    <input
                      type="range"
                      min="2048"
                      max="128000"
                      step="2048"
                      value={modelConfig.context_window}
                      onChange={(e) => handleConfigChange('context_window', parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                      disabled={isLoading}
                    />
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      控制模型能处理的最大上下文长度，单位为 token。值越大，模型能理解更长的对话内容。
                    </p>
                  </div>
                </div>
                
                {/* 多模态配置 */}
                <div className="border-t pt-4 mt-4 border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-medium mb-3">多模态配置</h5>
                  <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    配置模型处理图像等多媒体内容的能力，适用于支持多模态的模型。
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">启用多模态支持</label>
                    <input 
                      type="checkbox" 
                      checked={modelConfig.enable_multimodal} 
                      onChange={(e) => handleConfigChange('enable_multimodal', e.target.checked)} 
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">图像分辨率</label>
                      <span className="text-sm">{modelConfig.image_resolution}</span>
                    </div>
                    <select
                      value={modelConfig.image_resolution}
                      onChange={(e) => handleConfigChange('image_resolution', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      disabled={isLoading || !modelConfig.enable_multimodal}
                    >
                      <option value="512x512">512x512</option>
                      <option value="1024x1024">1024x1024</option>
                      <option value="2048x2048">2048x2048</option>
                    </select>
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      设置图像输入的分辨率，影响图像理解的细节和处理速度。
                    </p>
                  </div>
                </div>
                
                {/* 安全配置 */}
                <div className="border-t pt-4 mt-4 border-gray-200 dark:border-gray-700">
                  <h5 className="text-sm font-medium mb-3">安全配置</h5>
                  <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    配置模型的安全检查机制，过滤不安全或违规内容。
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">启用安全检查</label>
                    <input 
                      type="checkbox" 
                      checked={modelConfig.enable_safety_check} 
                      onChange={(e) => handleConfigChange('enable_safety_check', e.target.checked)} 
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">安全级别</label>
                      <span className="text-sm">{modelConfig.safety_level}</span>
                    </div>
                    <select
                      value={modelConfig.safety_level}
                      onChange={(e) => handleConfigChange('safety_level', e.target.value as 'low' | 'medium' | 'high')}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      disabled={isLoading || !modelConfig.enable_safety_check}
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                    </select>
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      设置安全检查的严格程度：
                      - 低：较少过滤，允许更多内容
                      - 中：平衡过滤，兼顾安全和自由表达
                      - 高：严格过滤，确保内容安全
                    </p>
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
                deepseek_base_url: 'https://api.deepseek.com',
                // 豆包默认配置
                doubao_model: 'doubao-pro-32k',
                doubao_base_url: 'https://api.doubao.com/v1',
                // 文心一言默认配置
                wenxin_model: 'ERNIE-Speed-8K',
                wenxin_base_url: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
                // 通义千问默认配置
                qwen_model: 'qwen-plus',
                qwen_base_url: 'https://dashscope.aliyuncs.com/api/v1'
              });
              // 重置各模型的配置状态
              setKimiBase('https://api.moonshot.cn/v1');
              setKimiVariant('moonshot-v1-32k');
              setDeepseekBase('https://api.deepseek.com');
              setDeepseekVariant('deepseek-chat');
              setDoubaoBase('https://api.doubao.com/v1');
              setDoubaoVariant('doubao-pro-32k');
              setWenxinBase('https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions');
              setWenxinVariant('ERNIE-Speed-8K');
              setQwenBase('https://dashscope.aliyuncs.com/api/v1');
              setQwenVariant('qwen-plus');
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