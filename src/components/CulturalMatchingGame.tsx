import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import culturalMatchingGameService, { MatchingLevel, MatchingCard, GameProgress } from '@/services/culturalMatchingGameService';
import LazyImage from './LazyImage';

interface CulturalMatchingGameProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CardState {
  card: Card;
  isFlipped: boolean;
  isMatched: boolean;
  isHinted: boolean;
}

const CulturalMatchingGame: React.FC<CulturalMatchingGameProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  
  // 游戏状态
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardState[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintedCards, setHintedCards] = useState<CardState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载游戏数据
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const allLevels = culturalMatchingGameService.getLevels();
      setLevels(allLevels);
      
      if (user) {
        const progress = culturalMatchingGameService.getGameProgress(user.id);
        setGameProgress(progress);
      }
      
      setIsLoading(false);
    }
  }, [isOpen, user]);

  // 开始游戏
  const startGame = useCallback((level: Level) => {
    setSelectedLevel(level);
    setGameState('playing');
    setMatchedCount(0);
    setScore(0);
    setStartTime(new Date());
    setTimeTaken(null);
    setIsGameStarted(true);
    setShowHint(false);
    setHintedCards([]);
    setSelectedCards([]);
    
    // 初始化卡片状态
    const shuffledCards = culturalMatchingGameService.shuffleCards(level.cards);
    const initialCardStates: CardState[] = shuffledCards.map(card => ({
      card,
      isFlipped: false,
      isMatched: false,
      isHinted: false
    }));
    
    setCardStates(initialCardStates);
  }, []);

  // 处理卡片点击
  const handleCardClick = useCallback((index: number) => {
    if (!isGameStarted || selectedCards.length >= 2) return;
    
    setCardStates(prev => {
      const newStates = [...prev];
      
      // 如果卡片已经翻转或匹配，不做任何操作
      if (newStates[index].isFlipped || newStates[index].isMatched) return newStates;
      
      // 翻转卡片
      newStates[index].isFlipped = true;
      return newStates;
    });
    
    // 更新选中的卡片
    setSelectedCards(prev => {
      const newSelected = [...prev, cardStates[index]];
      
      // 如果选中了两张卡片，检查匹配
      if (newSelected.length === 2) {
        setTimeout(() => checkMatch(newSelected), 1000);
      }
      
      return newSelected;
    });
  }, [isGameStarted, selectedCards, cardStates]);

  // 检查匹配
  const checkMatch = useCallback((cards: CardState[]) => {
    if (cards.length !== 2) return;
    
    const [card1, card2] = cards;
    const isMatch = culturalMatchingGameService.checkMatch(card1.card, card2.card);
    
    if (isMatch) {
      // 匹配成功
      setCardStates(prev => {
        const newStates = [...prev];
        const index1 = newStates.findIndex(s => s.card.id === card1.card.id);
        const index2 = newStates.findIndex(s => s.card.id === card2.card.id);
        
        if (index1 !== -1) {
          newStates[index1].isMatched = true;
          newStates[index1].isHinted = false;
        }
        if (index2 !== -1) {
          newStates[index2].isMatched = true;
          newStates[index2].isHinted = false;
        }
        
        return newStates;
      });
      
      setMatchedCount(prev => prev + 1);
      toast.success('匹配成功！');
    } else {
      // 匹配失败，翻回卡片
      setCardStates(prev => {
        const newStates = [...prev];
        const index1 = newStates.findIndex(s => s.card.id === card1.card.id);
        const index2 = newStates.findIndex(s => s.card.id === card2.card.id);
        
        if (index1 !== -1) {
          newStates[index1].isFlipped = false;
          newStates[index1].isHinted = false;
        }
        if (index2 !== -1) {
          newStates[index2].isFlipped = false;
          newStates[index2].isHinted = false;
        }
        
        return newStates;
      });
      
      toast.error('匹配失败，再试一次！');
    }
    
    // 重置选中的卡片
    setSelectedCards([]);
    setShowHint(false);
    setHintedCards([]);
  }, []);

  // 使用提示
  const handleUseHint = useCallback(() => {
    if (!user || !gameProgress) return;
    
    const success = culturalMatchingGameService.useHint(user.id);
    if (success) {
      // 查找一对未匹配的卡片
      const unmatchedCards = cardStates.filter(cardState => !cardState.isMatched && !cardState.isFlipped);
      
      if (unmatchedCards.length < 2) {
        toast.info('没有可提示的卡片了！');
        return;
      }
      
      // 找到一对匹配的卡片
      let hintCard1: CardState | null = null;
      let hintCard2: CardState | null = null;
      
      for (let i = 0; i < unmatchedCards.length; i++) {
        for (let j = i + 1; j < unmatchedCards.length; j++) {
          if (culturalMatchingGameService.checkMatch(unmatchedCards[i].card, unmatchedCards[j].card)) {
            hintCard1 = unmatchedCards[i];
            hintCard2 = unmatchedCards[j];
            break;
          }
        }
        if (hintCard1 && hintCard2) break;
      }
      
      if (hintCard1 && hintCard2) {
        // 高亮显示提示的卡片
        setCardStates(prev => {
          const newStates = [...prev];
          const index1 = newStates.findIndex(s => s.card.id === hintCard1?.card.id);
          const index2 = newStates.findIndex(s => s.card.id === hintCard2?.card.id);
          
          if (index1 !== -1) {
            newStates[index1].isHinted = true;
          }
          if (index2 !== -1) {
            newStates[index2].isHinted = true;
          }
          
          return newStates;
        });
        
        setShowHint(true);
        setHintedCards([hintCard1, hintCard2]);
        toast.success('已显示提示卡片！');
        
        // 更新游戏进度
        const updatedProgress = culturalMatchingGameService.getGameProgress(user.id);
        setGameProgress(updatedProgress);
      }
    } else {
      toast.error('提示次数已用完！');
    }
  }, [user, gameProgress, cardStates]);

  // 完成关卡
  const completeLevel = useCallback(() => {
    if (!user || !selectedLevel) return;
    
    const endTime = new Date();
    const timeDiff = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    setTimeTaken(timeDiff);
    
    // 计算得分
    const finalScore = culturalMatchingGameService.calculateScore(
      matchedCount,
      timeDiff,
      selectedLevel.difficulty
    );
    setScore(finalScore);
    
    // 更新游戏进度
    const updatedProgress = culturalMatchingGameService.completeLevel(
      user.id,
      selectedLevel.id,
      finalScore,
      timeDiff
    );
    setGameProgress(updatedProgress);
    
    setGameState('completed');
    setIsGameStarted(false);
    
    toast.success(`关卡完成！得分：${finalScore}`);
  }, [user, selectedLevel, matchedCount, startTime]);

  // 检查游戏是否完成
  useEffect(() => {
    if (selectedLevel && cardStates.length > 0) {
      const totalPairs = selectedLevel.cards.length / 2;
      if (matchedCount === totalPairs && isGameStarted) {
        completeLevel();
      }
    }
  }, [matchedCount, selectedLevel, cardStates.length, isGameStarted, completeLevel]);

  // 选择关卡
  const handleSelectLevel = useCallback((level: Level) => {
    if (!user) {
      toast.error('请先登录！');
      return;
    }
    
    const isUnlocked = culturalMatchingGameService.isLevelUnlocked(user.id, level.id);
    if (isUnlocked) {
      startGame(level);
    } else {
      toast.error('该关卡尚未解锁！');
    }
  }, [user, startGame]);

  // 返回菜单
  const handleBackToMenu = useCallback(() => {
    setGameState('menu');
    setSelectedLevel(null);
    setCardStates([]);
    setSelectedCards([]);
    setMatchedCount(0);
    setScore(0);
    setStartTime(null);
    setTimeTaken(null);
    setIsGameStarted(false);
    setShowHint(false);
    setHintedCards([]);
  }, []);

  // 重新开始
  const handleRestart = useCallback(() => {
    if (selectedLevel) {
      startGame(selectedLevel);
    }
  }, [selectedLevel, startGame]);

  // 格式化时间
  const formatTime = useCallback((seconds: number | null) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 获取当前时间
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (startTime && isGameStarted) {
      timer = setInterval(() => {
        const now = new Date();
        const diff = Math.round((now.getTime() - startTime.getTime()) / 1000);
        setCurrentTime(diff);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [startTime, isGameStarted]);

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
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`w-full max-w-6xl rounded-xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} text-${isDark ? 'white' : 'gray-900'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 游戏头部 */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">文化元素连连看</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="关闭"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 游戏内容 */}
        <div className="p-6">
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
                  <h2 className="text-2xl font-bold mb-2">欢迎来到文化元素连连看</h2>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    通过匹配相同的文化元素卡片，了解中国传统文化和天津地方特色
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
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>可用提示</p>
                        <p className="text-xl font-bold">{gameProgress.unlockedHints}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>关卡总数</p>
                        <p className="text-xl font-bold">{levels.length}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 关卡列表 */}
                <h3 className="text-lg font-medium mb-4">选择关卡</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {levels.map((level) => {
                    const isCompleted = gameProgress?.completedLevels.includes(level.id) || false;
                    const isUnlocked = !user || culturalMatchingGameService.isLevelUnlocked(user.id, level.id);

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
                            {level.culturalTheme}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium">
                            {level.cards.length / 2} 对卡片
                          </span>
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
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">{selectedLevel.name}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBackToMenu}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        返回菜单
                      </button>
                      <button
                        onClick={handleUseHint}
                        disabled={!gameProgress || gameProgress.unlockedHints <= 0}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <i className="fas fa-lightbulb mr-1"></i>提示 ({gameProgress?.unlockedHints || 0})
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className="text-xs block mb-1">匹配进度</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{matchedCount}</span>
                        <span className="text-xs">/ {selectedLevel.cards.length / 2} 对</span>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className="text-xs block mb-1">当前得分</span>
                      <span className="font-medium">{score}</span>
                    </div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className="text-xs block mb-1">用时</span>
                      <span className="font-medium">{formatTime(currentTime)}</span>
                    </div>
                  </div>
                </div>

                {/* 游戏棋盘 */}
                <div className="flex justify-center mb-6">
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${selectedLevel.gridSize.cols}, minmax(60px, 100px))`,
                      gridTemplateRows: `repeat(${selectedLevel.gridSize.rows}, minmax(60px, 100px))`
                    }}
                  >
                    {cardStates.map((cardState, index) => (
                      <motion.div
                        key={cardState.card.id}
                        className={`relative w-full h-full perspective`}
                        onClick={() => handleCardClick(index)}
                      >
                        <motion.div
                          className={`w-full h-full rounded-lg overflow-hidden cursor-pointer ${cardState.isMatched ? 'opacity-0' : 'opacity-100'}`}
                          animate={{
                            opacity: cardState.isMatched ? 0 : 1,
                            scale: cardState.isMatched ? 0.8 : 1
                          }}
                          transition={{
                            duration: 0.3
                          }}
                        >
                          <motion.div
                            className="relative w-full h-full transition-transform duration-500 transform-style-3d"
                            animate={{
                              rotateY: cardState.isFlipped ? 180 : 0
                            }}
                            style={{
                              transformStyle: 'preserve-3d'
                            }}
                          >
                            {/* 卡片背面 */}
                            <div
                              className={`absolute inset-0 backface-hidden flex items-center justify-center rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                              style={{
                                backfaceVisibility: 'hidden'
                              }}
                            >
                              <i className="fas fa-question text-2xl"></i>
                            </div>
                            
                            {/* 卡片正面 */}
                            <div
                              className={`absolute inset-0 backface-hidden flex flex-col items-center justify-center p-2 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} ${cardState.isHinted ? 'ring-2 ring-yellow-500' : ''}`}
                              style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)'
                              }}
                            >
                              <LazyImage
                                src={cardState.card.imageUrl}
                                alt={cardState.card.name}
                                className="w-full h-24 object-cover rounded mb-2"
                                ratio="auto"
                                fit="cover"
                                priority
                              />
                              <span className="text-xs font-medium text-center">{cardState.card.name}</span>
                            </div>
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
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
                      <p className="text-xl font-bold">{score}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>完成时间</p>
                      <p className="text-xl font-bold">{formatTime(timeTaken || 0)}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>匹配对数</p>
                      <p className="text-xl font-bold">{matchedCount} / {selectedLevel.cards.length / 2}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>历史最佳</p>
                      <p className="text-xl font-bold">
                        {gameProgress.bestTimes[selectedLevel.id] ? formatTime(gameProgress.bestTimes[selectedLevel.id]) : '-'}  
                      </p>
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
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleRestart}
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

export default CulturalMatchingGame;