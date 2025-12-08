import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import culturalTimelineGameService, { Level, TimelineEvent, GameProgress } from '@/services/culturalTimelineGameService';

interface CulturalTimelineGameProps {
  isOpen: boolean;
  onClose: () => void;
}

const CulturalTimelineGame: React.FC<CulturalTimelineGameProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  
  // 游戏状态
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [shuffledEvents, setShuffledEvents] = useState<TimelineEvent[]>([]);
  const [sortedEvents, setSortedEvents] = useState<TimelineEvent[]>([]);
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [draggedItem, setDraggedItem] = useState<TimelineEvent | null>(null);
  
  // 加载游戏数据
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      try {
        const allLevels = culturalTimelineGameService.getLevels();
        setLevels(allLevels);
        
        if (user) {
          const progress = culturalTimelineGameService.getGameProgress(user.id);
          setGameProgress(progress);
        }
      } catch (error) {
        console.error('加载游戏数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isOpen, user]);

  // 当选择关卡时，初始化游戏状态
  useEffect(() => {
    if (selectedLevel) {
      // 打乱事件顺序
      const shuffled = [...selectedLevel.events].sort(() => Math.random() - 0.5);
      setShuffledEvents(shuffled);
      setSortedEvents([]);
      setGameState('playing');
      setStartTime(new Date());
      setTimeTaken(null);
      setCurrentTime(0);
      setShowHint(false);
      setDraggedItem(null);
    }
  }, [selectedLevel]);

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

  // 选择关卡
  const handleSelectLevel = useCallback((level: Level) => {
    if (!user) {
      toast.error('请先登录！');
      return;
    }
    
    const isUnlocked = culturalTimelineGameService.isLevelUnlocked(user.id, level.id);
    if (isUnlocked) {
      setSelectedLevel(level);
    } else {
      toast.error('该关卡尚未解锁！');
    }
  }, [user]);

  // 拖拽开始
  const handleDragStart = useCallback((e: React.DragEvent | MouseEvent | PointerEvent | TouchEvent, event: TimelineEvent) => {
    setDraggedItem(event);
    // 只有在React.DragEvent类型时才访问dataTransfer
    if ('dataTransfer' in e) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }, []);

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  // 拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // 拖拽放置
  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    // 从打乱列表中移除拖拽的事件
    const updatedShuffled = shuffledEvents.filter(event => event.id !== draggedItem.id);
    
    // 将拖拽的事件插入到排序列表的指定位置
    const updatedSorted = [...sortedEvents];
    updatedSorted.splice(targetIndex, 0, draggedItem);
    
    setShuffledEvents(updatedShuffled);
    setSortedEvents(updatedSorted);
    setDraggedItem(null);
    
    // 检查是否完成排序
    if (updatedShuffled.length === 0) {
      handleCheckOrder();
    }
  }, [draggedItem, shuffledEvents, sortedEvents]);

  // 放置到排序列表末尾
  const handleDropToSorted = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    // 从打乱列表中移除拖拽的事件
    const updatedShuffled = shuffledEvents.filter(event => event.id !== draggedItem.id);
    
    // 将拖拽的事件添加到排序列表末尾
    const updatedSorted = [...sortedEvents, draggedItem];
    
    setShuffledEvents(updatedShuffled);
    setSortedEvents(updatedSorted);
    setDraggedItem(null);
    
    // 检查是否完成排序
    if (updatedShuffled.length === 0) {
      handleCheckOrder();
    }
  }, [draggedItem, shuffledEvents, sortedEvents]);

  // 从排序列表中移除事件，放回打乱列表
  const handleRemoveFromSorted = useCallback((event: TimelineEvent) => {
    const updatedSorted = sortedEvents.filter(e => e.id !== event.id);
    const updatedShuffled = [...shuffledEvents, event];
    
    setSortedEvents(updatedSorted);
    setShuffledEvents(updatedShuffled);
  }, [sortedEvents, shuffledEvents]);

  // 检查排序顺序是否正确
  const handleCheckOrder = useCallback(() => {
    if (!selectedLevel) return;
    
    // 获取正确排序的事件
    const correctOrder = [...selectedLevel.events].sort((a, b) => a.year - b.year);
    
    // 检查排序是否正确
    const isCorrect = culturalTimelineGameService.checkTimelineOrder(sortedEvents, correctOrder);
    
    if (isCorrect) {
      // 排序正确，完成关卡
      handleCompleteLevel();
    } else {
      // 排序错误，提示用户
      toast.error('时间顺序不正确，请重新排列！');
    }
  }, [selectedLevel, sortedEvents]);

  // 使用提示
  const handleUseHint = useCallback(() => {
    if (!user || !gameProgress || !selectedLevel) return;
    
    const success = culturalTimelineGameService.useHint(user.id);
    if (success) {
      // 找到正确顺序中的下一个事件
      const correctOrder = [...selectedLevel.events].sort((a, b) => a.year - b.year);
      const nextCorrectEvent = correctOrder[sortedEvents.length];
      
      if (nextCorrectEvent) {
        // 将下一个正确事件从打乱列表移到排序列表末尾
        const updatedShuffled = shuffledEvents.filter(event => event.id !== nextCorrectEvent.id);
        const updatedSorted = [...sortedEvents, nextCorrectEvent];
        
        setShuffledEvents(updatedShuffled);
        setSortedEvents(updatedSorted);
        
        toast.success(`提示：下一个事件是「${nextCorrectEvent.title}」`);
      }
      
      const updatedProgress = culturalTimelineGameService.getGameProgress(user.id);
      setGameProgress(updatedProgress);
    } else {
      toast.error('提示已用完');
    }
  }, [user, gameProgress, selectedLevel, shuffledEvents, sortedEvents]);

  // 完成关卡
  const handleCompleteLevel = useCallback(() => {
    if (!user || !selectedLevel) return;
    
    const endTime = new Date();
    const timeDiff = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    setTimeTaken(timeDiff);
    
    // 计算得分
    const finalScore = culturalTimelineGameService.calculateLevelScore(
      true,
      timeDiff,
      selectedLevel.difficulty
    );
    
    // 更新游戏进度
    const updatedProgress = culturalTimelineGameService.completeLevel(
      user.id,
      selectedLevel.id,
      finalScore,
      timeDiff
    );
    setGameProgress(updatedProgress);
    
    setGameState('completed');
    
    toast.success(`关卡完成！得分：${finalScore}`);
  }, [user, selectedLevel, startTime]);

  // 返回主菜单
  const handleBackToMenu = useCallback(() => {
    setGameState('menu');
    setSelectedLevel(null);
    setShuffledEvents([]);
    setSortedEvents([]);
    setStartTime(null);
    setTimeTaken(null);
    setCurrentTime(0);
    setShowHint(false);
    setDraggedItem(null);
  }, []);

  // 重新开始关卡
  const handleRestartLevel = useCallback(() => {
    if (!selectedLevel) return;
    // 打乱事件顺序
    const shuffled = [...selectedLevel.events].sort(() => Math.random() - 0.5);
    setShuffledEvents(shuffled);
    setSortedEvents([]);
    setGameState('playing');
    setStartTime(new Date());
    setTimeTaken(null);
    setCurrentTime(0);
    setShowHint(false);
    setDraggedItem(null);
  }, [selectedLevel]);

  // 格式化时间
  const formatTime = useCallback((seconds: number | null) => {
    if (!seconds) return '00:00';
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
          <h3 className="text-xl font-bold">文化时间轴</h3>
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
                  <h2 className="text-2xl font-bold mb-2">欢迎来到文化时间轴</h2>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    将文化事件按照时间顺序排列，了解天津地方文化和中国传统文化的发展脉络
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {levels.map((level) => {
                    const isCompleted = gameProgress?.completedLevels.includes(level.id) || false;
                    const isUnlocked = !user || culturalTimelineGameService.isLevelUnlocked(user.id, level.id);

                    return (
                      <motion.div
                        key={level.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${isDark ? 'border-gray-700' : 'border-gray-200'} ${isUnlocked ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'}`}
                        whileHover={isUnlocked ? { y: -4 } : {}}
                        onClick={() => isUnlocked && handleSelectLevel(level)}
                      >
                        {level.imageUrl && (
                          <div className="relative aspect-video overflow-hidden rounded-lg mb-3">
                            <img
                              src={level.imageUrl}
                              alt={level.name}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
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
                            {level.events.length} 个事件
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            {level.culturalTheme}
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
                      <span className="text-xs block mb-1">已排序事件</span>
                      <span className="font-medium">{sortedEvents.length} / {selectedLevel.events.length}</span>
                    </div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className="text-xs block mb-1">已用时间</span>
                      <span className="font-medium">{formatTime(currentTime)}</span>
                    </div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className="text-xs block mb-1">剩余事件</span>
                      <span className="font-medium">{selectedLevel.events.length - sortedEvents.length}</span>
                    </div>
                  </div>
                </div>

                {/* 游戏区域 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 打乱的事件列表 */}
                  <div>
                    <h4 className="text-lg font-medium mb-3">待排序事件</h4>
                    <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} min-h-[300px]`}>
                      {shuffledEvents.length === 0 ? (
                        <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          所有事件已排序完成！
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {shuffledEvents.map((event) => (
                            <motion.div
                              key={event.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, event)}
                              onDragEnd={handleDragEnd}
                              className={`p-3 rounded-lg cursor-move ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} transition-all shadow-sm hover:shadow-md`}
                              whileHover={{ scale: 1.02 }}
                              whileDrag={{ opacity: 0.7 }}
                            >
                              <h5 className="font-medium">{event.title}</h5>
                              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {event.description}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 已排序的事件列表 */}
                  <div>
                    <h4 className="text-lg font-medium mb-3">已排序事件</h4>
                    <div 
                      className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} min-h-[300px]`}
                      onDragOver={handleDragOver}
                      onDrop={handleDropToSorted}
                    >
                      {sortedEvents.length === 0 ? (
                        <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          将事件从左侧拖拽到这里进行排序
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {sortedEvents.map((event, index) => (
                            <div 
                              key={event.id}
                              className={`p-3 rounded-lg ${isDark ? 'bg-blue-900 bg-opacity-50' : 'bg-blue-50'} border ${isDark ? 'border-blue-700' : 'border-blue-200'} relative`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, index)}
                            >
                              {/* 移除按钮 */}
                              <button
                                onClick={() => handleRemoveFromSorted(event)}
                                className={`absolute top-2 right-2 p-1 rounded-full ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white text-xs transition-colors`}
                                aria-label="移除"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                              
                              {/* 时间轴标记 */}
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} rounded-l-lg`}></div>
                              
                              {/* 事件内容 */}
                              <div className="ml-4">
                                <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${isDark ? 'bg-blue-700 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                  {event.year > 0 ? `${event.year}年` : `${Math.abs(event.year)} BCE`}
                                </div>
                                <h5 className="font-medium">{event.title}</h5>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {event.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 检查按钮 */}
                {shuffledEvents.length === 0 && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={handleCheckOrder}
                      className={`px-6 py-3 rounded-lg text-lg font-medium transition-all ${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white shadow-md hover:shadow-lg`}
                    >
                      检查排序顺序
                    </button>
                  </div>
                )}
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
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>事件数量</p>
                      <p className="text-xl font-bold">{selectedLevel.events.length}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>正确率</p>
                      <p className="text-xl font-bold">100%</p>
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

export default CulturalTimelineGame;