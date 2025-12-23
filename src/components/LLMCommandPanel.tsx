import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { llmService } from '../services/llmService';

interface LLMCommandPanelProps {
  onCommandExecuted?: (response: string) => void;
}

const LLMCommandPanel: React.FC<LLMCommandPanelProps> = ({ onCommandExecuted }) => {
  const { isDark } = useTheme();
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamEnabled, setStreamEnabled] = useState(() => llmService.getConfig().stream);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedModel, setSelectedModel] = useState(llmService.getCurrentModel().id);

  // 预设的快速指令，按分类组织
  const quickCommands = {
    设计风格: [
      '生成融合青花瓷纹样的中秋海报',
      '创建国潮风格的产品包装设计',
      '设计简约现代的传统元素logo',
      '制作复古风格的节日宣传图'
    ],
    色彩调整: [
      '把红色调改为靛蓝色',
      '将整体色调调整为暖色系',
      '增加色彩对比度',
      '使用传统中国色彩搭配'
    ],
    元素添加: [
      '添加传统云纹元素',
      '融入中国结图案',
      '添加书法字体标题',
      '加入传统纹样边框'
    ],
    布局优化: [
      '优化整体布局使其更加平衡',
      '调整元素间距和对齐方式',
      '增加留白空间',
      '优化视觉层次结构'
    ],
    文化融合: [
      '增加文化元素的识别度',
      '融合天津地方特色元素',
      '加入非遗文化元素',
      '结合传统与现代设计语言'
    ]
  };

  // 创意方向建议
  const [creativeDirections, setCreativeDirections] = useState<string[]>([]);
  const [culturalElements, setCulturalElements] = useState<string[]>([]);
  const [creationIssues, setCreationIssues] = useState<string[]>([]);

  // 自动滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // 模型列表
  const models = [
    { id: 'kimi', name: 'Kimi', icon: 'fa-robot' },
    { id: 'deepseek', name: 'DeepSeek', icon: 'fa-brain' },
    { id: 'doubao', name: '豆包', icon: 'fa-comment-dots' },
    { id: 'wenxinyiyan', name: '文心一言', icon: 'fa-lightbulb' },
    { id: 'qwen', name: '通义千问', icon: 'fa-star' }
  ];

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    llmService.setCurrentModel(modelId);
    toast.success(`已切换到 ${models.find(m => m.id === modelId)?.name}`);
  };

  const handleSendCommand = async () => {
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    
    // 添加用户消息到对话历史
    const newUserMessage = { role: 'user' as const, content: command };
    setConversation(prev => [...prev, newUserMessage]);
    
    try {
      const cfg = llmService.getConfig();
      if (cfg.stream) {
        let last = '';
        await llmService.generateResponse(command, {
          onDelta: (full) => {
            last = full;
            setConversation(prev => {
              const copy = [...prev];
              const lastMsg = copy[copy.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                copy[copy.length - 1] = { role: 'assistant', content: full };
              } else {
                copy.push({ role: 'assistant', content: full });
              }
              return copy;
            });
          }
        });
        if (onCommandExecuted) onCommandExecuted(last);
      } else {
        const response = await llmService.generateResponse(command);
        const newAiMessage = { role: 'assistant' as const, content: response };
        setConversation(prev => [...prev, newAiMessage]);
        if (onCommandExecuted) onCommandExecuted(response);
      }
      generateRecommendations(command);
    } catch (error) {
      toast.error('生成响应失败，请重试');
    } finally {
      setCommand('');
      setIsProcessing(false);
    }
  };

  const handleQuickCommandClick = (quickCommand: string) => {
    setCommand(quickCommand);
    setSelectedCommand(quickCommand);
  };

  const handleCreativeDirectionClick = (direction: string) => {
    setCommand(`按照"${direction}"的方向优化设计`);
  };

  const handleCulturalElementClick = (element: string) => {
    setCommand(`在设计中添加${element}元素`);
  };

  const generateRecommendations = (prompt: string) => {
    // 获取创意方向建议
    const directions = llmService.generateCreativeDirections(prompt);
    setCreativeDirections(directions);
    
    // 获取文化元素推荐
    const elements = llmService.recommendCulturalElements(prompt);
    setCulturalElements(elements);
    
    // 获取创作问题诊断
    const issues = llmService.diagnoseCreationIssues(prompt);
    setCreationIssues(issues);
  };

  const clearConversation = () => {
    setConversation([]);
    llmService.clearHistory();
    toast.success('对话历史已清空');
  };

  const exportConversation = () => {
    try {
      const data = JSON.stringify(conversation, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'conversation.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('已导出对话为 conversation.json');
    } catch {
      toast.error('导出失败');
    }
  };

  const importConversation = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const arr = JSON.parse(text) as Array<{ role: 'user' | 'assistant'; content: string }>;
        const valid = Array.isArray(arr) ? arr.filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') : [];
        setConversation(valid);
        const msgs = valid.map(v => ({ role: v.role, content: v.content, timestamp: Date.now() }));
        llmService.importHistory(msgs);
        toast.success('已导入对话');
      } catch {
        toast.error('导入失败，文件格式不正确');
      }
    };
    reader.readAsText(file);
  };

  const toggleStream = () => {
    const next = !streamEnabled;
    setStreamEnabled(next);
    llmService.updateConfig({ stream: next });
    toast.success(next ? '已开启流式输出' : '已关闭流式输出');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand();
    }
  };

  return (
    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md border ${isDark ? 'border-gray-700' : 'border-gray-200'} min-h-[600px]`}>
      {/* 顶部标题栏 */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold flex items-center text-red-600">
          <i className="fas fa-magic mr-3"></i>
          AI文案创作助手
        </h2>
        
        {/* 模型切换 */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className={`appearance-none bg-transparent border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-white'}`}
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  <i className={`fas ${model.icon} mr-2`}></i>
                  {model.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <i className="fas fa-chevron-down text-gray-500"></i>
            </div>
          </div>
          
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            当前模型: {llmService.getCurrentModel().name}
          </span>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importConversation(f); }} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：对话历史与管理 */}
        <div className="lg:col-span-1 space-y-4">
          {/* 对话历史 */}
          <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 shadow-sm border border-gray-200 dark:border-gray-600`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg flex items-center">
                <i className="fas fa-history text-blue-500 mr-2"></i>
                对话历史
              </h3>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-1.5 rounded-full ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                aria-label={showHistory ? "隐藏对话历史" : "显示对话历史"}
              >
                <i className={`fas ${showHistory ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </button>
            </div>
            
            {showHistory && conversation.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="max-h-80 overflow-y-auto space-y-4"
              >
                {conversation.map((message, index) => (
                  <div key={index} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-start w-full">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${message.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                        <i className={`fas ${message.role === 'user' ? 'fa-user' : 'fa-robot'}`}></i>
                      </div>
                      <div className={`flex-1 rounded-lg p-3 ${message.role === 'user' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                        <p className="text-sm break-words">{message.content}</p>
                      </div>
                    </div>
                    
                    {/* AI生成结果的操作按钮 */}
                    {message.role === 'assistant' && (
                      <div className="flex space-x-2 mt-1 ml-11 text-xs">
                        <button
                          className={`px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                          onClick={() => {
                            setCommand(message.content);
                            toast.success('已将生成结果复制到输入框，可继续编辑');
                          }}
                          title="编辑结果"
                        >
                          <i className="fas fa-edit mr-1"></i>
                          编辑
                        </button>
                        <button
                          className={`px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                          onClick={() => {
                            if (onCommandExecuted) {
                              onCommandExecuted(message.content);
                              toast.success('已应用到设计中');
                            }
                          }}
                          title="应用到设计"
                        >
                          <i className="fas fa-magic mr-1"></i>
                          应用
                        </button>
                        <button
                          className={`px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                          onClick={() => {
                            navigator.clipboard.writeText(message.content);
                            toast.success('已复制到剪贴板');
                          }}
                          title="复制结果"
                        >
                          <i className="fas fa-copy mr-1"></i>
                          复制
                        </button>
                        <button
                          className={`px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                          onClick={() => {
                            // 导出为文本文件
                            const blob = new Blob([message.content], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `ai-copy-${Date.now()}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            toast.success('已导出为文本文件');
                          }}
                          title="导出结果"
                        >
                          <i className="fas fa-download mr-1"></i>
                          导出
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </motion.div>
            ) : showHistory ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <i className="fas fa-comments text-2xl mb-2"></i>
                <p>暂无对话历史</p>
                <p className="text-xs mt-1">开始输入创作指令，生成您的第一条对话</p>
              </div>
            ) : null}
          </div>
          
          {/* 对话管理 */}
          <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 shadow-sm border border-gray-200 dark:border-gray-600`}>
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <i className="fas fa-cog text-purple-500 mr-2"></i>
              对话管理
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={clearConversation}
                className={`flex items-center justify-center px-3 py-2 rounded-lg ${isDark ? 'bg-gray-600 hover:bg-red-600' : 'bg-gray-200 hover:bg-red-100'} transition-all text-sm font-medium`}
              >
                <i className="fas fa-trash-alt mr-2 text-red-500"></i>
                清空历史
              </button>
              <button
                onClick={exportConversation}
                className={`flex items-center justify-center px-3 py-2 rounded-lg ${isDark ? 'bg-gray-600 hover:bg-blue-600' : 'bg-gray-200 hover:bg-blue-100'} transition-all text-sm font-medium`}
              >
                <i className="fas fa-download mr-2 text-blue-500"></i>
                导出对话
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center px-3 py-2 rounded-lg ${isDark ? 'bg-gray-600 hover:bg-green-600' : 'bg-gray-200 hover:bg-green-100'} transition-all text-sm font-medium col-span-2`}
              >
                <i className="fas fa-upload mr-2 text-green-500"></i>
                导入对话
              </button>
            </div>
            
            {/* 流式输出切换 */}
            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={streamEnabled}
                  onChange={toggleStream}
                  className="sr-only peer"
                />
                <div className={`relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600`}></div>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">流式输出</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* 中间：创作区域 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 输入区域 */}
          <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} p-5 shadow-sm border border-gray-200 dark:border-gray-600`}>
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <i className="fas fa-edit text-green-500 mr-2"></i>
              创作指令
            </h3>
            
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的创作指令，例如：生成融合青花瓷纹样的中秋海报...\n\n支持多行输入，您可以详细描述您的设计需求、风格偏好和文化元素要求。"
              className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none min-h-[120px] transition-colors ${isDark ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400 border' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border'} shadow-sm`}
            />
            
            <div className="flex justify-between items-center mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{command.length} 字</span>
              <span>按 Enter 发送，Shift+Enter 换行</span>
            </div>
            
            {/* 发送按钮 */}
            <button
              onClick={handleSendCommand}
              disabled={isProcessing || !command.trim()}
              className={`w-full mt-4 py-3 rounded-lg transition-all flex items-center justify-center font-semibold text-lg ${isProcessing ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 hover:shadow-lg text-white'} shadow-md`}
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-3 text-xl"></i>
                  创作中...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-3 text-xl"></i>
                  生成文案
                </>
              )}
            </button>
          </div>
          
          {/* 快速指令 */}
          <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} p-5 shadow-sm border border-gray-200 dark:border-gray-600`}>
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <i className="fas fa-bolt text-yellow-500 mr-2"></i>
              快速指令
            </h3>
            
            <div className="space-y-4">
              {Object.entries(quickCommands).map(([category, commands]) => (
                <div key={category}>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    {category}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {commands.map((quickCommand, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleQuickCommandClick(quickCommand)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCommand === quickCommand ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}
                        whileHover={{ scale: 1.05, translateY: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {quickCommand}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 创意助手 */}
          {(creativeDirections.length > 0 || culturalElements.length > 0 || creationIssues.length > 0) && (
            <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} p-5 shadow-sm border border-gray-200 dark:border-gray-600`}>
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                创意助手
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 创意方向建议 */}
                {creativeDirections.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`${isDark ? 'bg-gray-600' : 'bg-blue-50'} p-4 rounded-lg border border-blue-200 dark:border-blue-800`}
                  >
                    <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-3 flex items-center">
                      <i className="fas fa-compass mr-2"></i>
                      创意方向
                    </h4>
                    <div className="space-y-2">
                      {creativeDirections.map((direction, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleCreativeDirectionClick(direction)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${isDark ? 'hover:bg-blue-800' : 'hover:bg-blue-100'} transition-colors`}
                          whileHover={{ translateX: 5 }}
                        >
                          <i className="fas fa-arrow-right text-blue-500 mr-2"></i>
                          {direction}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
                
                {/* 文化元素推荐 */}
                {culturalElements.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`${isDark ? 'bg-gray-600' : 'bg-purple-50'} p-4 rounded-lg border border-purple-200 dark:border-purple-800`}
                  >
                    <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-3 flex items-center">
                      <i className="fas fa-gem mr-2"></i>
                      文化元素
                    </h4>
                    <div className="space-y-2">
                      {culturalElements.map((element, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleCulturalElementClick(element)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${isDark ? 'hover:bg-purple-800' : 'hover:bg-purple-100'} transition-colors`}
                          whileHover={{ translateX: 5 }}
                        >
                          <i className="fas fa-plus text-purple-500 mr-2"></i>
                          {element}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
                
                {/* 创作问题诊断 */}
                {creationIssues.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={`${isDark ? 'bg-gray-600' : 'bg-yellow-50'} p-4 rounded-lg border border-yellow-200 dark:border-yellow-800`}
                  >
                    <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-3 flex items-center">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      创作建议
                    </h4>
                    <div className="space-y-3">
                      {creationIssues.map((issue, index) => (
                        <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                          <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                          {issue}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LLMCommandPanel;
