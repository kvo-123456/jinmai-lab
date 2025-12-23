import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { llmService } from '../services/llmService';

interface CulturalKnowledge {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  viewCount: number;
  likes: number;
  createdAt: string;
}

interface CulturalKnowledgeBaseProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CulturalKnowledgeBase({ isOpen = true, onClose }: CulturalKnowledgeBaseProps) {
  const { isDark } = useTheme();
  const [knowledgeList, setKnowledgeList] = useState<CulturalKnowledge[]>([]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<CulturalKnowledge | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [question, setQuestion] = useState('');
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [answer, setAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  // 模拟文化知识库数据
  useEffect(() => {
    const mockKnowledge: CulturalKnowledge[] = [
      {
        id: '1',
        title: '天津杨柳青年画',
        content: '天津杨柳青年画是中国著名的民间木版年画之一，始于明代崇祯年间，盛于清代，以色彩艳丽、线条细腻、构图饱满著称。',
        category: '传统艺术',
        tags: ['天津文化', '年画', '传统艺术'],
        viewCount: 1245,
        likes: 342,
        createdAt: '2024-10-15'
      },
      {
        id: '2',
        title: '京剧的起源与发展',
        content: '京剧起源于清朝乾隆年间，是中国的国剧，融合了徽剧、汉剧等多种戏曲艺术，以唱、念、做、打为主要表演形式。',
        category: '传统艺术',
        tags: ['京剧', '传统艺术', '戏曲'],
        viewCount: 2134,
        likes: 567,
        createdAt: '2024-10-20'
      },
      {
        id: '3',
        title: '中国传统色彩文化',
        content: '中国传统色彩文化历史悠久，包括五色系统（青、赤、黄、白、黑）等，色彩在传统建筑、服饰、绘画中有着重要的象征意义。',
        category: '传统文化',
        tags: ['色彩文化', '传统文化'],
        viewCount: 1876,
        likes: 432,
        createdAt: '2024-10-25'
      },
      {
        id: '4',
        title: '天津相声艺术',
        content: '天津是中国相声的发源地之一，相声艺术在天津有着深厚的群众基础，产生了许多著名的相声演员和作品。',
        category: '传统艺术',
        tags: ['天津文化', '相声', '传统艺术'],
        viewCount: 1567,
        likes: 389,
        createdAt: '2024-11-01'
      },
      {
        id: '5',
        title: '中国传统建筑之美',
        content: '中国传统建筑以木结构为主，注重天人合一的理念，包括宫殿、园林、寺庙等多种类型，体现了中国传统的哲学思想和审美观念。',
        category: '传统文化',
        tags: ['传统建筑', '传统文化', '建筑'],
        viewCount: 2345,
        likes: 678,
        createdAt: '2024-11-05'
      }
    ];
    setKnowledgeList(mockKnowledge);
  }, []);

  // 获取所有分类
  const categories = ['all', ...new Set(knowledgeList.map(item => item.category))];

  // 过滤文化知识
  const filteredKnowledge = knowledgeList.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // 提问AI
  const askAI = async () => {
    if (!question.trim()) {
      toast.warning('请输入问题');
      return;
    }

    setIsGeneratingAnswer(true);
    setShowAnswer(false);

    try {
      const aiQuestion = `请回答关于文化知识的问题：${question}`;
      const response = await llmService.generateResponse(aiQuestion);
      setAnswer(response);
      setShowAnswer(true);
    } catch (error) {
      toast.error('AI回答失败，请稍后重试');
      console.error('AI回答失败:', error);
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  // 查看知识详情
  const viewKnowledgeDetails = (knowledge: CulturalKnowledge) => {
    setSelectedKnowledge(knowledge);
    setShowDetails(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`${isOpen ? 'block' : 'hidden'}`}>
          {/* 模态框模式 */}
          {onClose && (
            <motion.div
              className="fixed inset-0 z-[1000] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
            </motion.div>
          )}

          <motion.div
            className={`${onClose ? 'relative w-full max-w-5xl max-h-[90vh] overflow-y-auto' : 'w-full'}`}
            initial={{ x: onClose ? '100%' : 0, opacity: onClose ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: onClose ? '100%' : 0, opacity: onClose ? 0 : 1 }}
            transition={{ duration: 0.5 }}
            style={{ borderLeft: onClose ? '1px solid' : 'none' }}
          >
            {/* 组件头部 */}
            <div className={`p-6 border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">文化知识库</h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    探索和学习中国传统文化知识
                  </p>
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                    aria-label="关闭"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>

            {/* 搜索和分类 */}
            <div className={`p-6 border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex flex-col md:flex-row gap-4">
                {/* 搜索框 */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="搜索文化知识..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-black'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"></i>
                </div>

                {/* 分类过滤 */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className={`px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-black'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? '全部分类' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 文化知识列表 */}
            <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">文化知识</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  共 {filteredKnowledge.length} 条知识
                </span>
              </div>

              {/* 文化知识卡片列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredKnowledge.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center h-64 text-center">
                    <i className="fas fa-search text-4xl text-gray-400 mb-2"></i>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      没有找到匹配的文化知识
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterCategory('all');
                      }}
                      className={`mt-4 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}
                    >
                      清除筛选
                    </button>
                  </div>
                ) : (
                  filteredKnowledge.map((knowledge) => (
                    <motion.div
                      key={knowledge.id}
                      className={`p-5 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} hover:shadow-xl transition-shadow`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.random() * 0.2 }}
                      whileHover={{ y: -5 }}
                    >
                      {/* 知识卡片头部 */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            {knowledge.category}
                          </span>
                          <h4 className="text-lg font-bold mb-1">{knowledge.title}</h4>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} line-clamp-2`}>
                            {knowledge.content}
                          </p>
                        </div>
                      </div>

                      {/* 知识卡片标签 */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {knowledge.tags.map((tag, index) => (
                          <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* 知识卡片底部 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <i className="fas fa-eye text-gray-400"></i>
                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {knowledge.viewCount}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <i className="fas fa-heart text-red-500"></i>
                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {knowledge.likes}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <i className="fas fa-calendar text-gray-400"></i>
                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {knowledge.createdAt}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => viewKnowledgeDetails(knowledge)}
                          className={`px-4 py-1 rounded-lg text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}
                        >
                          查看详情
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* 知识问答区域 */}
              <div className={`mt-10 p-6 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                <h3 className="text-xl font-bold mb-4">文化知识问答</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                  有关于文化知识的问题？可以向AI提问
                </p>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <textarea
                        placeholder="请输入你的文化知识问题..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        rows={3}
                        className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    <button
                      onClick={askAI}
                      disabled={isGeneratingAnswer || !question.trim()}
                      className={`px-6 py-2 rounded-lg ${isGeneratingAnswer || !question.trim() ? (isDark ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-gray-300 cursor-not-allowed text-gray-500') : (isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white')} transition-colors flex items-center gap-2`}
                    >
                      {isGeneratingAnswer ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>生成中...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-question-circle"></i>
                          <span>提问AI</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* AI回答显示 */}
                  <AnimatePresence>
                    {showAnswer && (
                      <motion.div
                        className={`p-4 rounded-lg ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white'}`}>
                            AI
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium mb-2">AI回答</h5>
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>
                              {answer}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 知识详情弹窗 */}
      <AnimatePresence>
        {showDetails && selectedKnowledge && (
          <motion.div
            className="fixed inset-0 z-[1001] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDetails(false)} />
            <motion.div
              className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-xl shadow-2xl ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 详情弹窗头部 */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">知识详情</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  aria-label="关闭"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* 详情内容 */}
              <div className="space-y-6">
                {/* 基本信息 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold">{selectedKnowledge.title}</h4>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {selectedKnowledge.category}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">内容</h5>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>
                      {selectedKnowledge.content}
                    </p>
                  </div>
                  
                  {/* 知识信息标签 */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">浏览量</div>
                      <div className="font-medium">{selectedKnowledge.viewCount}</div>
                    </div>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">点赞数</div>
                      <div className="font-medium text-red-500">{selectedKnowledge.likes}</div>
                    </div>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">发布时间</div>
                      <div className="font-medium">{selectedKnowledge.createdAt}</div>
                    </div>
                  </div>
                  
                  {/* 标签 */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">标签</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedKnowledge.tags.map((tag, index) => (
                        <span key={index} className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-800">
                  <button
                    onClick={() => setShowDetails(false)}
                    className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}
                  >
                    关闭
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
