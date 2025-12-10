import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { TianjinImage } from './TianjinStyleComponents';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reward: number;
  participants: number;
  deadline: string;
  imageUrl?: string;
  tags: string[];
}

interface ChallengeCenterProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ChallengeCenter({ isOpen = true, onClose }: ChallengeCenterProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 模拟挑战数据
  useEffect(() => {
    const mockChallenges: Challenge[] = [
      {
        id: '1',
        title: '天津文化元素创意设计',
        description: '设计一个融合天津文化元素的创意作品，可以是海报、插画或产品设计。',
        category: '设计',
        difficulty: 'medium',
        reward: 100,
        participants: 125,
        deadline: '2024-12-31',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Creative%20design%20incorporating%20Tianjin%20cultural%20elements',
        tags: ['天津文化', '创意设计', '插画']
      },
      {
        id: '2',
        title: 'AI辅助创意写作',
        description: '使用AI工具创作一篇关于未来城市的科幻故事，要求包含至少3个创新科技元素。',
        category: '写作',
        difficulty: 'hard',
        reward: 150,
        participants: 89,
        deadline: '2024-12-25',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=AI-assisted%20creative%20writing%20about%20future%20cities',
        tags: ['AI写作', '科幻', '创意故事']
      },
      {
        id: '3',
        title: '传统文化创新表达',
        description: '将传统中国文化元素以现代方式重新诠释，创作一个创意作品。',
        category: '综合',
        difficulty: 'medium',
        reward: 120,
        participants: 156,
        deadline: '2025-01-15',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Modern%20interpretation%20of%20traditional%20Chinese%20cultural%20elements',
        tags: ['传统文化', '创新', '设计']
      },
      {
        id: '4',
        title: 'AR互动创意设计',
        description: '设计一个AR互动体验，主题不限，要求具有创新性和趣味性。',
        category: '技术',
        difficulty: 'hard',
        reward: 200,
        participants: 56,
        deadline: '2025-01-10',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=AR%20interactive%20creative%20design',
        tags: ['AR', '互动设计', '技术创意']
      },
      {
        id: '5',
        title: '创意摄影挑战',
        description: '拍摄一组以"光与影"为主题的创意照片，至少5张。',
        category: '摄影',
        difficulty: 'easy',
        reward: 80,
        participants: 203,
        deadline: '2024-12-20',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Creative%20photography%20with%20light%20and%20shadow',
        tags: ['摄影', '创意', '光影']
      },
      {
        id: '6',
        title: '数字插画创作',
        description: '创作一幅以"未来生活"为主题的数字插画作品。',
        category: '设计',
        difficulty: 'medium',
        reward: 100,
        participants: 189,
        deadline: '2025-01-20',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Digital%20illustration%20of%20future%20life',
        tags: ['数字插画', '未来', '创意设计']
      },
      {
        id: '7',
        title: '短视频创意挑战',
        description: '制作一段不超过60秒的创意短视频，主题不限。',
        category: '综合',
        difficulty: 'easy',
        reward: 90,
        participants: 256,
        deadline: '2025-01-05',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Creative%20short%20video%20challenge',
        tags: ['短视频', '创意', '视频制作']
      },
      {
        id: '8',
        title: 'UI/UX设计大赛',
        description: '设计一个具有创新性的移动应用UI/UX界面。',
        category: '技术',
        difficulty: 'hard',
        reward: 250,
        participants: 78,
        deadline: '2025-02-10',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=UI%2FUX%20design%20competition%20mobile%20app%20interface',
        tags: ['UI设计', 'UX设计', '移动应用']
      }
    ];
    setChallenges(mockChallenges);
  }, []);

  // 过滤挑战
  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filter === 'all' || challenge.category === filter;
    return matchesSearch && matchesFilter;
  });

  // 获取难度标签样式
  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // 参与挑战
  const participateChallenge = (challenge: Challenge) => {
    setIsParticipating(true);
    setTimeout(() => {
      setIsParticipating(false);
      toast.success(`成功参与挑战：${challenge.title}`);
      navigate('/create', { state: { challenge: challenge.id } });
      if (onClose) onClose();
    }, 1500);
  };

  // 查看挑战详情
  const viewChallengeDetails = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
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
            <div className={`p-4 sm:p-6 border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">创意挑战中心</h2>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    参与创意挑战，赢取积分奖励
                  </p>
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'} transition-colors`}
                    aria-label="关闭"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>

            {/* 搜索和过滤 */}
            <div className={`p-4 sm:p-6 border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* 搜索框 */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="搜索挑战..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full p-3 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-black'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm text-gray-500 dark:text-gray-400"></i>
                </div>

                {/* 分类过滤 */}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-black'} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                >
                  <option value="all">全部分类</option>
                  <option value="设计">设计</option>
                  <option value="写作">写作</option>
                  <option value="摄影">摄影</option>
                  <option value="技术">技术</option>
                  <option value="综合">综合</option>
                </select>
              </div>
            </div>

            {/* 挑战列表 */}
            <div className={`p-4 sm:p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold">当前挑战</h3>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  共 {filteredChallenges.length} 个挑战
                </span>
              </div>

              {/* 挑战卡片列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {filteredChallenges.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center h-48 sm:h-64 text-center p-4">
                    <i className="fas fa-search text-3xl sm:text-4xl text-gray-400 mb-2"></i>
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                      没有找到匹配的挑战
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilter('all');
                      }}
                      className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}
                    >
                      清除筛选
                    </button>
                  </div>
                ) : (
                  filteredChallenges.map((challenge) => (
                    <motion.div
                      key={challenge.id}
                      className={`p-0 sm:p-0 rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} hover:shadow-xl transition-all duration-300`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.random() * 0.2 }}
                      whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                    >
                      {/* 挑战卡片图片 */}
                      {challenge.imageUrl && (
                        <div className="relative overflow-hidden aspect-video">
                          <TianjinImage 
                            src={challenge.imageUrl} 
                            alt={challenge.title} 
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                          />
                          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${isDark ? 'bg-black/70 text-white' : 'bg-white/80 text-gray-800'}`}>
                              {challenge.category}
                            </span>
                            <span className={`px-2 py-1 rounded text-[10px] font-medium ${getDifficultyBadgeClass(challenge.difficulty)}`}>
                              {challenge.difficulty === 'easy' ? '简单' : challenge.difficulty === 'medium' ? '中等' : '困难'}
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4">
                            <h4 className="text-white font-bold text-lg sm:text-xl line-clamp-1">{challenge.title}</h4>
                          </div>
                        </div>
                      )}

                      {/* 挑战卡片内容 */}
                      <div className="p-4 sm:p-5">
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4 line-clamp-2`}>
                          {challenge.description}
                        </p>

                        {/* 挑战卡片标签 */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                          {challenge.tags.map((tag, index) => (
                            <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* 挑战卡片底部 */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t dark:border-gray-700">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm w-full sm:w-auto">
                            <div className="flex items-center gap-1.5">
                              <i className="fas fa-gift text-yellow-500 text-sm"></i>
                              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
                                {challenge.reward} 积分
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <i className="fas fa-users text-blue-500 text-sm"></i>
                              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {challenge.participants} 人参与
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <i className="fas fa-calendar text-red-500 text-sm"></i>
                              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {challenge.deadline}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => viewChallengeDetails(challenge)}
                              className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'} flex-1 sm:flex-none text-center`}
                            >
                              详情
                            </button>
                            <button
                              onClick={() => participateChallenge(challenge)}
                              className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white transition-colors flex-1 sm:flex-none text-center"
                            >
                              参与
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 挑战详情弹窗 */}
      <AnimatePresence>
        {showDetails && selectedChallenge && (
          <motion.div
            className="fixed inset-0 z-[1001] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDetails(false)} />
            <motion.div
              className={`relative w-full max-w-md sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 详情弹窗头部 - 图片区域 */}
              {selectedChallenge.imageUrl && (
                <div className="relative overflow-hidden aspect-video">
                  <TianjinImage 
                    src={selectedChallenge.imageUrl} 
                    alt={selectedChallenge.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-black/70 text-white' : 'bg-white/80 text-gray-800'}`}>
                      {selectedChallenge.category}
                    </span>
                    <span className={`px-3 py-1.5 rounded text-xs font-medium ${getDifficultyBadgeClass(selectedChallenge.difficulty)}`}>
                      {selectedChallenge.difficulty === 'easy' ? '简单' : selectedChallenge.difficulty === 'medium' ? '中等' : '困难'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className={`absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors`}
                    aria-label="关闭"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}

              {/* 详情弹窗内容 */}
              <div className="p-5 sm:p-6">
                {/* 标题和描述 */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-3">{selectedChallenge.title}</h3>
                  <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedChallenge.description}
                  </p>
                </div>
                
                {/* 挑战信息卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-gift text-yellow-500 text-xl"></i>
                      <h4 className="font-medium">奖励</h4>
                    </div>
                    <div className="text-2xl font-bold text-yellow-500">{selectedChallenge.reward} 积分</div>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-users text-blue-500 text-xl"></i>
                      <h4 className="font-medium">参与人数</h4>
                    </div>
                    <div className="text-2xl font-bold">{selectedChallenge.participants} 人</div>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-calendar text-red-500 text-xl"></i>
                      <h4 className="font-medium">截止日期</h4>
                    </div>
                    <div className="text-2xl font-bold">{selectedChallenge.deadline}</div>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fas fa-tag text-purple-500 text-xl"></i>
                      <h4 className="font-medium">分类</h4>
                    </div>
                    <div className="text-2xl font-bold">{selectedChallenge.category}</div>
                  </div>
                </div>
                
                {/* 标签 */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">相关标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedChallenge.tags.map((tag, index) => (
                      <span key={index} className={`px-3 py-1.5 rounded-full text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} transition-colors cursor-pointer hover:scale-105`}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* 参与按钮 */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t dark:border-gray-700">
                  <button
                    onClick={() => setShowDetails(false)}
                    className={`px-6 py-3 rounded-lg text-base font-medium w-full sm:w-auto ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} transition-colors`}
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      participateChallenge(selectedChallenge);
                    }}
                    className="px-8 py-3 rounded-lg text-base font-medium bg-red-600 hover:bg-red-700 text-white transition-colors w-full sm:w-auto shadow-lg hover:shadow-xl"
                    disabled={isParticipating}
                  >
                    {isParticipating ? (
                      <div className="flex items-center justify-center gap-2">
                        <i className="fas fa-spinner fa-spin text-sm"></i>
                        <span>参与中...</span>
                      </div>
                    ) : (
                      '立即参与挑战'
                    )}
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
