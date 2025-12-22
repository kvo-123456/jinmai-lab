import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import culturalMemoryGameService, { MemoryLevel, MemoryCard, GameProgress } from '@/services/culturalMemoryGameService';
import LazyImage from './LazyImage';

interface CulturalMemoryGameProps {
  isOpen: boolean;
  onClose: () => void;
}

const CulturalMemoryGame: React.FC<CulturalMemoryGameProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  
  // 游戏状态
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
  const [levels, setLevels] = useState<MemoryLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<MemoryLevel | null>(null);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [gameProgress, setGameProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 加载游戏数据 - 简化逻辑，避免不必要的延迟
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      // 直接获取数据，不添加延迟
      try {
        const allLevels = culturalMemoryGameService.getLevels();
        setLevels(allLevels);
        
        if (user) {
          const progress = culturalMemoryGameService.getGameProgress(user.id);
          setGameProgress(progress);
        }
      } catch (error) {
        console.error('加载游戏数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isOpen, user]);

  // 计时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (startTime && gameState === 'playing') {
      timer = setInterval(() => {
        const now = new Date();
        const diff = Math.round((now.getTime() - startTime.getTime()) / 1000);
        setCurrentTime(diff);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [startTime, gameState]);

  // 当选择关卡时，初始化游戏状态
  useEffect(() => {
    if (selectedLevel) {
      const levelCards = culturalMemoryGameService.getLevelCards(selectedLevel.id);
      if (levelCards) {
        setCards(levelCards);
        setFlippedCards([]);
        setMatchedPairs(0);
        setGameState('playing');
        setStartTime(new Date());
        setCurrentTime(0);
        setTimeTaken(null);
        setIsChecking(false);
      }
    }
  }, [selectedLevel]);

  // 检查游戏是否完成
  useEffect(() => {
    if (selectedLevel && gameState === 'playing') {
      const totalPairs = selectedLevel.cards.length / 2;
      if (matchedPairs >= totalPairs) {
        handleCompleteLevel();
      }
    }
  }, [matchedPairs, selectedLevel, gameState]);

  // 选择关卡
  const handleSelectLevel = useCallback((level: MemoryLevel) => {
    if (!user) {
      toast.error('请先登录！');
      return;
    }
    
    const isUnlocked = culturalMemoryGameService.isLevelUnlocked(user.id, level.id);
    if (isUnlocked) {
      setSelectedLevel(level);
    } else {
      toast.error('该关卡尚未解锁！');
    }
  }, [user]);

  // 处理卡片点击 - 优化性能
  const handleCardClick = useCallback((card: MemoryCard) => {
    if (
      gameState !== 'playing' ||
      isChecking ||
      card.isFlipped ||
      card.isMatched ||
      flippedCards.length >= 2
    ) {
      return;
    }

    // 使用函数式更新来避免闭包问题并提高性能
    setCards(prevCards => 
      prevCards.map(c => 
        c.id === card.id ? { ...c, isFlipped: true } : c
      )
    );

    const newFlippedCard = { ...card, isFlipped: true };
    setFlippedCards(prev => [...prev, newFlippedCard]);

    // 检查是否匹配
    setFlippedCards(prev => {
      const newFlippedCards = [...prev, newFlippedCard];
      
      if (newFlippedCards.length === 2) {
        setIsChecking(true);
        
        const [card1, card2] = newFlippedCards;
        const isMatch = card1.pairId === card2.pairId;

        // 使用setTimeout延迟处理，避免UI阻塞
        setTimeout(() => {
          setCards(prevCards => {
            if (isMatch) {
              // 匹配成功
              const matchedCards = prevCards.map(c => 
                c.pairId === card1.pairId ? { ...c, isMatched: true } : c
              );
              setMatchedPairs(prev => prev + 1);
              toast.success('配对成功！');
              return matchedCards;
            } else {
              // 匹配失败，翻转回去
              return prevCards.map(c => 
                (c.id === card1.id || c.id === card2.id) ? { ...c, isFlipped: false } : c
              );
            }
          });
          
          setFlippedCards([]);
          setIsChecking(false);
        }, 800); // 稍微减少延迟，提高响应速度
      }
      
      return newFlippedCards;
    });
  }, [gameState, isChecking]);

  // 完成关卡
  const handleCompleteLevel = useCallback(() => {
    if (!user || !selectedLevel) return;
    
    const endTime = new Date();
    const timeDiff = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    setTimeTaken(timeDiff);
    
    // 计算得分
    const totalPairs = selectedLevel.cards.length / 2;
    const finalScore = culturalMemoryGameService.calculateScore(
      matchedPairs,
      totalPairs,
      timeDiff,
      selectedLevel.difficulty
    );
    
    // 更新游戏进度
    const updatedProgress = culturalMemoryGameService.completeLevel(
      user.id,
      selectedLevel.id,
      finalScore,
      timeDiff
    );
    setGameProgress(updatedProgress);
    
    setGameState('completed');
    
    toast.success(`关卡完成！得分：${finalScore}`);
  }, [user, selectedLevel, matchedPairs, startTime]);

  // 返回主菜单
  const handleBackToMenu = useCallback(() => {
    setGameState('menu');
    setSelectedLevel(null);
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs(0);
    setStartTime(null);
    setCurrentTime(0);
    setTimeTaken(null);
    setIsChecking(false);
  }, []);

  // 重新开始关卡
  const handleRestartLevel = useCallback(() => {
    if (!selectedLevel) return;
    
    const levelCards = culturalMemoryGameService.getLevelCards(selectedLevel.id);
    if (levelCards) {
      setCards(levelCards);
      setFlippedCards([]);
      setMatchedPairs(0);
      setGameState('playing');
      setStartTime(new Date());
      setCurrentTime(0);
      setTimeTaken(null);
      setIsChecking(false);
    }
  }, [selectedLevel]);

  // 格式化时间
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`w-full max-w-4xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} text-${isDark ? 'white' : 'gray-900'} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 游戏头部 - 固定 */}
        <div className={`sticky top-0 z-10 p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">文化记忆游戏</h3>
          <button
            onClick={onClose}
            className={`p-3 rounded-full text-xl ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white transition-all shadow-md hover:shadow-lg`}
            aria-label="关闭"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 游戏内容 - 可滚动 */}
        <div className="p-6 overflow-y-auto flex-grow max-h-[calc(90vh-80px)]">
          {/* 加载状态 */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
              <p className="text-lg">加载游戏数据...</p>
            </div>
          )}

          {/* 主菜单 */}
          <AnimatePresence mode="wait">
            {gameState === 'menu' && !isLoading && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">欢迎来到文化记忆游戏</h2>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    翻牌匹配相同的文化元素，挑战你的记忆力和文化知识
                  </p>
                </div>

                {/* 游戏进度 */}
                {gameProgress && (
                  <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className="text-lg font-medium mb-2">游戏进度</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>已完成关卡</p>
                        <p className="text-xl font-bold">{gameProgress.completedLevels.length}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>总得分</p>
                        <p className="text-xl font-bold">{gameProgress.totalScore}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>关卡总数</p>
                        <p className="text-xl font-bold">{levels.length}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>最佳时间</p>
                        <p className="text-xl font-bold">
                          {gameProgress.bestTimes && Object.keys(gameProgress.bestTimes).length > 0 
                            ? formatTime(Math.min(...Object.values(gameProgress.bestTimes) as number[])) 
                            : '--:--'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 关卡列表 */}
                <h3 className="text-lg font-medium mb-4">选择关卡</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {levels.map((level) => {
                    const isCompleted = gameProgress?.completedLevels.includes(level.id) || false;
                    const isUnlocked = !user || culturalMemoryGameService.isLevelUnlocked(user.id, level.id);

                    return (
                      <motion.div
                        key={level.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${isDark ? 'border-gray-700' : 'border-gray-200'} ${isUnlocked ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'}`}
                        whileHover={isUnlocked ? { y: -4 } : {}}
                        onClick={() => isUnlocked && handleSelectLevel(level)}
                      >
                        {level.imageUrl && (
                          <div className="relative aspect-video overflow-hidden rounded-lg mb-3">
                            <LazyImage
                              src={level.imageUrl}
                              alt={level.name}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                              ratio="landscape"
                              fit="cover"
                            />
                            {isCompleted && (
                              <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                已完成
                              </div>
                            )}
                            {!isUnlocked && (
                              <div className="absolute top-2 right-2 bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                                未解锁
                              </div>
                            )}
                          </div>
                        )}
                        <h4 className="font-medium mb-1">{level.name}</h4>
                        <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {level.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            {level.difficulty.toUpperCase()}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            {level.gridSize.rows}x{level.gridSize.cols}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            {level.cards.length / 2} 对卡片
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          {level.timeLimit && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-yellow-900 bg-opacity-30 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`}>
                              限时: {formatTime(level.timeLimit)}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-yellow-900 bg-opacity-30 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`}>
                            奖励: {level.reward}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 游戏界面 */}
          <AnimatePresence mode="wait">
            {gameState === 'playing' && selectedLevel && !isLoading && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* 关卡信息 */}
                <div className="mb-4">
                  <div className="flex flex-wrap justify-between items-center mb-2">
                    <h3 className="text-lg font-medium mb-2 md:mb-0">{selectedLevel.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} min-w-[120px]`}>
                        <span className="text-xs block mb-1">时间</span>
                        <span className="font-medium">{formatTime(currentTime)}</span>
                      </div>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} min-w-[120px]`}>
                        <span className="text-xs block mb-1">已匹配</span>
                        <span className="font-medium">{matchedPairs} / {selectedLevel.cards.length / 2}</span>
                      </div>
                      <button
                        onClick={handleBackToMenu}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        返回菜单
                      </button>
                    </div>
                  </div>
                </div>

                {/* 游戏棋盘 */}
                <div 
                  className="grid gap-2 mb-6 mx-auto"
                  style={{
                    gridTemplateColumns: `repeat(${selectedLevel.gridSize.cols}, 1fr)`,
                    maxWidth: '600px'
                  }}
                >
                  {cards.map((card) => (
                    <motion.div
                      key={card.id}
                      className="aspect-square perspective-1000"
                      onClick={() => handleCardClick(card)}
                    >
                      <motion.div
                        className="relative w-full h-full cursor-pointer"
                        style={{
                          transformStyle: 'preserve-3d',
                          transition: 'transform 0.6s'
                        }}
                        animate={{
                          rotateY: card.isFlipped || card.isMatched ? 180 : 0
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {/* 卡片背面 */}
                        <motion.div
                          className={`absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center transition-all ${isDark ? 'bg-gradient-to-br from-red-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'} shadow-md`}
                          style={{ transform: "rotateY(180deg)", backfaceVisibility: 'hidden' }}
                        >
                          {card.isMatched ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            >
                              <i className="fas fa-check-circle text-4xl text-green-500"></i>
                            </motion.div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-2">
                              <LazyImage
                                src={card.imageUrl}
                                alt={card.name}
                                className="w-full h-full object-cover rounded-lg mb-2"
                                ratio="square"
                                fit="cover"
                              />
                              <p className="text-sm font-medium text-center">{card.name}</p>
                            </div>
                          )}
                        </motion.div>

                        {/* 卡片正面 */}
                        <motion.div
                          className={`absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} border ${isDark ? 'border-gray-600' : 'border-gray-300'} shadow-md transition-all`}
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <div className="text-2xl">
                            <i className="fas fa-question-circle"></i>
                          </div>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>

                {/* 文化元素提示 */}
                <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className="font-medium mb-2">游戏提示</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    点击卡片查看文化元素，记住它们的位置，然后找出所有配对的卡片。
                    配对成功后，你可以看到文化元素的详细信息。
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 游戏完成界面 */}
          <AnimatePresence mode="wait">
            {gameState === 'completed' && selectedLevel && gameProgress && !isLoading && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="mb-6"
                >
                  <i className="fas fa-trophy text-6xl text-yellow-500"></i>
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">恭喜完成关卡！</h2>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  你成功完成了「{selectedLevel.name}」关卡
                </p>

                {/* 得分统计 */}
                <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>最终得分</p>
                      <p className="text-xl font-bold">{gameProgress.levelScores[selectedLevel.id] || 0}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>完成时间</p>
                      <p className="text-xl font-bold">{formatTime(timeTaken || 0)}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>正确率</p>
                      <p className="text-xl font-bold">100%</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>总配对数</p>
                      <p className="text-xl font-bold">{selectedLevel.cards.length / 2}</p>
                    </div>
                  </div>
                </div>

                {/* 奖励信息 */}
                <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-100'} border ${isDark ? 'border-yellow-700' : 'border-yellow-200'}`}>
                  <h3 className="font-medium mb-2">获得奖励</h3>
                  <p className={isDark ? 'text-yellow-200' : 'text-yellow-800'}>
                    {selectedLevel.reward}
                  </p>
                </div>

                {/* 游戏控制 */}
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={handleRestartLevel}
                    className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    重新挑战
                  </button>
                  <button
                    onClick={handleBackToMenu}
                    className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                  >
                    返回关卡选择
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CulturalMemoryGame;