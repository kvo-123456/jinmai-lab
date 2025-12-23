import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { llmService, Message } from '@/services/llmService';

interface FloatingAIAssistantProps {
  // 可以添加一些自定义配置属性
  defaultOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({
  defaultOpen = false,
  position = 'bottom-right'
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [positionStyle, setPositionStyle] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 预设问题列表
  const presetQuestions = [
    '平台上如何创作',
    '如何使用AI生成功能',
    '如何分享我的作品',
    '如何查看创作数据',
    '如何参与社区活动'
  ];

  // 监听路由变化，更新当前页面信息
  useEffect(() => {
    // 解析当前路径，获取页面名称
    const path = location.pathname;
    setCurrentPath(path);
    
    // 简单的路径到页面名称映射
    const pathToPage: Record<string, string> = {
      '/': '首页',
      '/cultural-knowledge': '文化知识',
      '/creation-workshop': '创作工坊',
      '/marketplace': '文创市集',
      '/community': '社区',
      '/my-works': '我的作品'
    };
    
    setCurrentPage(pathToPage[path] || '未知页面');
  }, [location.pathname]);
  
  // 添加初始欢迎消息
  useEffect(() => {
    const initialMessage: Message = {
      role: 'assistant',
      content: `你好！我是你的AI助手，当前你正在浏览「${currentPage}」页面，有什么可以帮助你的吗？`,
      timestamp: Date.now()
    };
    setMessages([initialMessage]);
  }, [currentPage]);

  // 自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsGenerating(true);

    try {
      // 简单的数字映射回答和页面跳转
      let response = '';
      const message = inputMessage.trim();
      
      // 处理常见问候语
      const greetings = ['你好', '您好', 'hi', 'hello', '嗨', '早上好', '下午好', '晚上好'];
      let isGreeting = false;
      for (const greeting of greetings) {
        if (message.includes(greeting)) {
          isGreeting = true;
          response = `你好！我是你的AI助手，很高兴为你服务。你现在在「${currentPage}」页面，有什么可以帮助你的吗？你可以问我关于平台使用、创作技巧、文化知识等方面的问题，我会尽力为你解答。`;
          break;
        }
      }
      
      if (!isGreeting) {
        // 检查页面跳转关键词
        const navigationKeywords: Record<string, { path: string; name: string }> = {
          '首页': { path: '/', name: '首页' },
          '文化知识': { path: '/cultural-knowledge', name: '文化知识' },
          '创作工坊': { path: '/creation-workshop', name: '创作工坊' },
          '文创市集': { path: '/marketplace', name: '文创市集' },
          '社区': { path: '/community', name: '社区' },
          '我的作品': { path: '/my-works', name: '我的作品' }
        };
        
        let navigationTarget = null;
        for (const [keyword, target] of Object.entries(navigationKeywords)) {
          if (message.includes(keyword)) {
            navigationTarget = target;
            break;
          }
        }
        
        if (navigationTarget) {
          // 执行页面跳转
          response = `正在为你跳转到「${navigationTarget.name}」页面...`;
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: response,
            timestamp: Date.now()
          }]);
          setIsGenerating(false);
          
          // 延迟跳转，让用户看到反馈
          setTimeout(() => {
            navigate(navigationTarget.path);
          }, 1000);
          return;
        }
        
        // 检查是否为纯数字或数字相关问题
        const numericMatch = message.match(/^\s*([0-9]+)\s*$/);
        if (numericMatch) {
          const num = parseInt(numericMatch[1]);
          
          // 根据数字提供不同回答
          const numberResponses: Record<number, string> = {
            1: '1 代表了开始与创新，正如我们平台鼓励用户开启创作之旅。你可以在创作工坊中尝试各种非遗技艺的数字化创作，或者参与社区讨论分享你的创意灵感。',
            2: '2 象征着合作与平衡。在我们平台上，你可以与其他创作者合作完成作品，也可以在传承与创新之间找到平衡，将传统非遗文化以现代方式呈现。',
            3: '3 意味着多样性与丰富性。我们的平台涵盖了多种非遗技艺类型，包括陶瓷、刺绣、木雕等。你可以探索不同的文化元素，丰富你的创作素材库。',
            4: '4 代表着稳定与结构。创作需要坚实的基础，你可以通过平台的教程视频学习非遗基础知识，掌握创作技巧，构建自己的创作体系。',
            5: '5 象征着活力与探索。我们鼓励用户不断探索新的创作方式，尝试将AI生成技术与传统技艺结合，创造出既有文化底蕴又具现代美感的作品。',
            6: '6 代表着和谐与完美。在创作过程中，你可以注重作品的整体协调性，将各种元素有机结合，创造出和谐统一的视觉效果。',
            7: '7 象征着神秘与深度。非遗文化蕴含着深厚的历史底蕴和文化内涵，你可以深入挖掘其背后的故事，为你的作品增添深度和内涵。',
            8: '8 意味着发展与繁荣。我们希望通过平台的发展，推动非遗文化的繁荣传承，让更多人了解和喜爱传统技艺。',
            9: '9 代表着智慧与成就。通过不断学习和实践，你可以在非遗创作领域取得成就，成为传承和创新的使者。',
            10: '10 象征着圆满与开始。每一次创作都是一个新的开始，也是对传统文化的一次圆满传承。'          
          };
          
          response = numberResponses[num] || `你输入的数字是 ${num}。在我们的平台上，每个数字都可以成为创作的灵感来源。你可以尝试将数字元素融入你的作品中，创造出独特的视觉效果。`;
        } else {
          // 调用LLM服务生成响应
          response = await llmService.generateResponse(userMessage.content);
        }
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to generate response:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，我暂时无法回答你的问题。请稍后再试。',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理预设问题点击
  const handlePresetQuestionClick = (question: string) => {
    setInputMessage(question);
    handleSendMessage();
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 初始化位置
  useEffect(() => {
    // 根据预设位置设置初始坐标
    const buttonSize = 64; // w-16 = 64px
    const margin = 24; // 24px margin
    
    const initialPosition = {
      'bottom-right': { x: window.innerWidth - buttonSize - margin, y: window.innerHeight - buttonSize - margin },
      'bottom-left': { x: margin, y: window.innerHeight - buttonSize - margin },
      'top-right': { x: window.innerWidth - buttonSize - margin, y: margin },
      'top-left': { x: margin, y: margin }
    };
    setPositionStyle(initialPosition[position]);
  }, [position]);

  // 切换AI助手显示/隐藏
  const toggleAssistant = () => {
    setIsOpen(prev => !prev);
  };

  // 处理拖动开始
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
    }
  };

  // 处理拖动中
  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const buttonWidth = 64; // w-16 = 64px
    const buttonHeight = 64;
    
    // 计算新位置，确保按钮不会超出视窗
    let newX = clientX - dragOffset.x;
    let newY = clientY - dragOffset.y;
    
    // 边界检查
    newX = Math.max(0, Math.min(newX, window.innerWidth - buttonWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - buttonHeight));
    
    setPositionStyle({ x: newX, y: newY });
  };

  // 处理拖动结束
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 添加全局拖动事件监听
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDrag(e);
      const handleMouseUp = () => handleDragEnd();
      const handleTouchMove = (e: TouchEvent) => handleDrag(e);
      const handleTouchEnd = () => handleDragEnd();
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  // 位置类
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <div 
      ref={containerRef}
      className="fixed z-50"
      style={{
        left: `${positionStyle.x}px`,
        top: `${positionStyle.y}px`,
        transform: 'translate(0, 0)'
      }}
    >
      {/* 聊天界面 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`w-80 sm:w-96 h-[550px] rounded-2xl shadow-2xl flex flex-col ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} overflow-hidden`}
          >
            {/* 聊天头部 */}
            <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} flex justify-between items-center shadow-sm`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'} text-white shadow-md`}>
                  <i className="fas fa-robot text-xl"></i>
                </div>
                <h3 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI助手</h3>
              </div>
              <button
                onClick={toggleAssistant}
                className={`p-2 rounded-full transition-all ${isDark ? 'hover:bg-gray-700 hover:scale-110' : 'hover:bg-gray-100 hover:scale-110'} transform`}
                aria-label="关闭"
              >
                <i className={`fas fa-times ${isDark ? 'text-gray-300' : 'text-gray-600'}`}></i>
              </button>
            </div>

            {/* 聊天内容 */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: isDark ? '#4B5563 #1F2937' : '#9CA3AF #F3F4F6'
              }}
            >
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-xl ${message.role === 'user' ? 
                      (isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg') : 
                      (isDark ? 'bg-gray-700 text-gray-200 border border-gray-600' : 'bg-gray-100 text-gray-800 border border-gray-200')
                    } transition-all hover:shadow-xl`}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* 正在生成指示器 */}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className={`max-w-[85%] p-4 rounded-xl ${isDark ? 'bg-gray-700 text-gray-200 border border-gray-600' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-blue-500"
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                      ></motion.div>
                      <motion.div
                        className="w-2 h-2 rounded-full bg-purple-500"
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      ></motion.div>
                      <motion.div
                        className="w-2 h-2 rounded-full bg-pink-500"
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                      ></motion.div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 预设问题 */}
            {messages.length <= 1 && !isGenerating && (
              <div className={`px-4 pb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>快速提问</p>
                <div className="flex flex-wrap gap-2">
                  {presetQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handlePresetQuestionClick(question)}
                      className={`px-3 py-1.5 text-xs rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'} transition-all transform hover:scale-105`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* 输入区域 */}
            <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} shadow-inner`}>
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入你的问题..."
                  disabled={isGenerating}
                  className={`flex-1 px-4 py-3 rounded-full border ${isDark ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-500' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm`}
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={isGenerating || !inputMessage.trim()}
                  className={`p-3 rounded-full transition-all shadow-md ${isGenerating || !inputMessage.trim() ? 
                    (isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed') : 
                    (isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white')
                  }`}
                  whileHover={{ scale: isGenerating || !inputMessage.trim() ? 1 : 1.1 }}
                  whileTap={{ scale: isGenerating || !inputMessage.trim() ? 1 : 0.95 }}
                  aria-label="发送"
                >
                  <i className="fas fa-paper-plane"></i>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 悬浮按钮 */}
      <motion.button
        ref={buttonRef}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
        onClick={toggleAssistant}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl z-50 transition-all duration-300 transform hover:scale-125 ${isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'} text-white cursor-${isDragging ? 'grabbing' : 'grab'}`}
        aria-label="AI助手"
        whileHover={{ scale: 1.25, boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)' }}
        whileTap={{ scale: 1.1 }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0
        }}
      >
        <motion.i 
          className="fas fa-robot text-2xl" 
          animate={isOpen ? { rotate: 90 } : { rotate: 0 }}
          transition={{ duration: 0.3 }}
        ></motion.i>
        {/* 消息数量提示 */}
        {messages.length > 1 && (
          <motion.div
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            {messages.length - 1}
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};

export default FloatingAIAssistant;