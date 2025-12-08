import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import culturalSortingGameService, { SortLevel, SortItem, SortQuestion } from '@/services/culturalSortingGameService';

interface CulturalSortingGameProps {
  isOpen: boolean;
  onClose: () => void;
}

const CulturalSortingGame: React.FC<CulturalSortingGameProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  
  // 游戏状态
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
  const [levels, setLevels] = useState<SortLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<SortLevel | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<SortQuestion | null>(null);
  const [sourceItems, setSourceItems] = useState<SortItem[]>([]);
  const [targetItems, setTargetItems] = useState<SortItem[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameProgress, setGameProgress] = useState<any>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  // 加载游戏数据
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      try {
        const allLevels = culturalSortingGameService.getLevels();
        setLevels(allLevels);
        
        if (user) {
          const progress = culturalSortingGameService.getGameProgress(user.id);
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
      setCurrentQuestionIndex(0);
      setCurrentQuestion(selectedLevel.questions[0]);
      setSourceItems(selectedLevel.questions[0].items);
      setTargetItems([]);
      setShowHint(false);
      setIsCorrect(false);
      setCorrectAnswers(0);
      setGameState('playing');
      setStartTime(new Date());
      setTimeTaken(null);
      setCurrentTime(0);
      setHintsUsed(0);
      setIsChecking(false);
    }
  }, [selectedLevel]);

  // 当当前题目索引变化时，更新当前题目
  useEffect(() => {
    if (selectedLevel && selectedLevel.questions[currentQuestionIndex]) {
      setCurrentQuestion(selectedLevel.questions[currentQuestionIndex]);
      setSourceItems(selectedLevel.questions[currentQuestionIndex].items);
      setTargetItems([]);
      setShowHint(false);
      setIsCorrect(false);
      setIsChecking(false);
    }
  }, [selectedLevel, currentQuestionIndex]);

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

  // 检查游戏是否完成
  useEffect(() => {
    if (selectedLevel && gameState === 'playing') {
      if (correctAnswers >= selectedLevel.questions.length) {
        handleCompleteLevel();
      }
    }
  }, [correctAnswers, selectedLevel, gameState]);

  // 选择关卡
  const handleSelectLevel = useCallback((level: SortLevel) => {
    if (!user) {
      toast.error('请先登录！');
      return;
    }
    
    const isUnlocked = culturalSortingGameService.isLevelUnlocked(user.id, level.id);
    if (isUnlocked) {
      setSelectedLevel(level);
    } else {
      toast.error('该关卡尚未解锁！');
    }
  }, [user]);

  // 处理拖拽开始
  const handleDragStart = useCallback((e: React.DragEvent, item: SortItem) => {
    e.dataTransfer.setData('itemId', item.id);
  }, []);

  // 处理拖拽结束
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.dataTransfer.clearData('itemId');
  }, []);

  // 处理拖拽进入
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // 处理拖拽覆盖
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // 处理拖拽放置
  const handleDrop = useCallback((e: React.DragEvent, targetIndex?: number) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    
    if (!itemId) return;
    
    // 从源列表中找到被拖拽的项
    const draggedItem = sourceItems.find(item => item.id === itemId);
    if (!draggedItem) return;
    
    // 如果是拖到目标列表
    if (targetIndex !== undefined) {
      // 从源列表中移除该项
      setSourceItems(prev => prev.filter(item => item.id !== itemId));
      // 将该项插入到目标列表的指定位置
      setTargetItems(prev => {
        const newTarget = [...prev];
        newTarget.splice(targetIndex, 0, draggedItem);
        return newTarget;
      });
    } else {
      // 如果是拖回源列表
      // 从目标列表中移除该项
      setTargetItems(prev => prev.filter(item => item.id !== itemId));
      // 将该项添加回源列表
      setSourceItems(prev => [...prev, draggedItem]);
    }
  }, [sourceItems]);

  // 处理项点击（用于非拖拽操作）
  const handleItemClick = useCallback((item: SortItem) => {
    if (sourceItems.includes(item)) {
      // 从源列表添加到目标列表末尾
      setSourceItems(prev => prev.filter(i => i.id !== item.id));
      setTargetItems(prev => [...prev, item]);
    } else {
      // 从目标列表移除回源列表
      setTargetItems(prev => prev.filter(i => i.id !== item.id));
      setSourceItems(prev => [...prev, item]);
    }
  }, [sourceItems]);

  // 提交排序结果
  const handleSubmitSort = useCallback(() => {
    if (!currentQuestion || targetItems.length !== currentQuestion.items.length) {
      toast.error('请将所有项排序完成！');
      return;
    }
    
    setIsChecking(true);
    
    const isCorrect = culturalSortingGameService.checkSort(currentQuestion, targetItems);
    setIsCorrect(isCorrect);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      toast.success('排序正确！');
      
      // 延迟进入下一题或完成关卡
      setTimeout(() => {
        if (currentQuestionIndex < (selectedLevel?.questions.length || 0) - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          handleCompleteLevel();
        }
        setIsChecking(false);
      }, 1500);
    } else {
      toast.error('排序错误，请重新尝试！');
      setIsChecking(false);
    }
  }, [currentQuestion, targetItems, currentQuestionIndex, selectedLevel]);

  // 完成关卡
  const handleCompleteLevel = useCallback(() => {
    if (!user || !selectedLevel) return;
    
    const endTime = new Date();
    const timeDiff = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    setTimeTaken(timeDiff);
    
    // 计算得分
    const finalScore = culturalSortingGameService.calculateLevelScore(
      correctAnswers,
      selectedLevel.questions.length,
      timeDiff,
      selectedLevel.difficulty
    );
    
    // 更新游戏进度
    const updatedProgress = culturalSortingGameService.completeLevel(
      user.id,
      selectedLevel.id,
      finalScore,
      timeDiff
    );
    setGameProgress(updatedProgress);
    
    setGameState('completed');
    
    toast.success(`关卡完成！得分：${finalScore}`);
  }, [user, selectedLevel, correctAnswers, startTime]);

  // 使用提示
  const handleUseHint = useCallback(() => {
    if (!user || !gameProgress || !currentQuestion) return;
    
    const success = culturalSortingGameService.useHint(user.id);
    if (success) {
      setShowHint(true);
      setHintsUsed(prev => prev + 1);
      const updatedProgress = culturalSortingGameService.getGameProgress(user.id);
      setGameProgress(updatedProgress);
      toast.success('已显示提示');
    } else {
      toast.error('提示已用完');
    }
  }, [user, gameProgress, currentQuestion]);

  // 返回主菜单
  const handleBackToMenu = useCallback(() => {
    setGameState('menu');
    setSelectedLevel(null);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(0);
    setSourceItems([]);
    setTargetItems([]);
    setIsCorrect(false);
    setCorrectAnswers(0);
    setStartTime(null);
    setTimeTaken(null);
    setShowHint(false);
    setIsChecking(false);
    setCurrentTime(0);
    setHintsUsed(0);
  }, []);

  // 重新开始关卡
  const handleRestartLevel = useCallback(() => {
    if (!selectedLevel) return;
    setCurrentQuestionIndex(0);
    setCurrentQuestion(selectedLevel.questions[0]);
    setSourceItems(selectedLevel.questions[0].items);
    setTargetItems([]);
    setShowHint(false);
    setIsCorrect(false);
    setCorrectAnswers(0);
    setGameState('playing');
    setStartTime(new Date());
    setTimeTaken(null);
    setCurrentTime(0);
    setHintsUsed(0);
    setIsChecking(false);
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
        {/* 游戏头部 */}
        <div className={`sticky top-0 z-10 p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">文化元素排序游戏</h3>
          <button
            onClick={onClose}
            className={`p-3 rounded-full text-xl ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white transition-all shadow-md hover:shadow-lg`}
            aria-label="关闭"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 游戏内容 */}
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
                  <h2 className="text-2xl font-bold mb-2">欢迎来到文化元素排序游戏</h2>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    按照时间顺序或逻辑顺序排列文化元素，了解天津地方文化和中国传统文化
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
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>可用提示</p>
                        <p className="text-xl font-bold">{gameProgress.unlockedHints}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 关卡列表 */}
                <h3 className="text-lg font-medium mb-4">选择关卡</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {levels.map((level) => {
                    const isCompleted = gameProgress?.completedLevels.includes(level.id) || false;
                    const isUnlocked = !user || culturalSortingGameService.isLevelUnlocked(user.id, level.id);

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
                            {level.questions.length} 题
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
            {gameState === 'playing' && selectedLevel && currentQuestion && !isLoading && (
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
                        <span className="text-xs block mb-1">进度</span>
                        <span className="font-medium">{currentQuestionIndex + 1} / {selectedLevel.questions.length}</span>
                      </div>
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
                </div>

                {/* 题目内容 */}
                <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className="text-lg font-medium mb-2">{currentQuestion.title}</h4>
                  <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {currentQuestion.description}
                  </p>

                  {/* 提示 */}
                  {showHint && (
                    <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-100'} border ${isDark ? 'border-yellow-700' : 'border-yellow-200'}`}>
                      <div className="flex items-start">
                        <i className="fas fa-lightbulb text-yellow-500 mt-1 mr-2"></i>
                        <p className={`text-sm ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
                          提示：请按照{currentQuestion.sortType === 'asc' ? '升序' : '降序'}排列
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 排序区域 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* 源列表（待排序项） */}
                    <div>
                      <h5 className="text-md font-medium mb-3">待排序项</h5>
                      <div 
                        className={`min-h-[200px] p-4 rounded-lg border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'} transition-all hover:border-blue-500`}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDrop={(e) => handleDrop(e)}
                      >
                        {sourceItems.length === 0 ? (
                          <p className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            所有项已排序
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {sourceItems.map((item) => (
                              <div
                                key={item.id}
                                className={`p-3 rounded-lg cursor-move transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} hover:shadow-md`}
                                draggable
                                onClick={() => handleItemClick(item)}
                                onDragStart={(e) => handleDragStart(e, item)}
                                onDragEnd={handleDragEnd}
                              >
                                <h6 className="font-medium">{item.name}</h6>
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {item.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 目标列表（已排序项） */}
                    <div>
                      <h5 className="text-md font-medium mb-3">已排序项</h5>
                      <div className={`min-h-[200px] p-4 rounded-lg border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'} transition-all hover:border-blue-500`}>
                        {targetItems.length === 0 ? (
                          <p className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            拖拽或点击项到此处进行排序
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {targetItems.map((item, index) => (
                              <div
                                key={item.id}
                                className={`p-3 rounded-lg cursor-move transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} hover:shadow-md`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item)}
                                onDragEnd={handleDragEnd}
                                onDragOver={handleDragOver}
                                onDragEnter={handleDragEnter}
                                onDrop={(e) => handleDrop(e, index)}
                                onClick={() => handleItemClick(item)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h6 className="font-medium">{item.name}</h6>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {item.content}
                                    </p>
                                  </div>
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                    {index + 1}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 答案解析 */}
                  {isChecking && isCorrect && (
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-green-900 bg-opacity-30' : 'bg-green-100'} border ${isDark ? 'border-green-700' : 'border-green-200'}`}>
                      <div className="flex items-start">
                        <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                        <div>
                          <h5 className="font-medium mb-1">回答正确！</h5>
                          <p className={`text-sm ${isDark ? 'text-green-200' : 'text-green-800'}`}>
                            {currentQuestion.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 游戏控制 */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleSubmitSort}
                      disabled={isChecking || targetItems.length !== currentQuestion.items.length}
                      className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isChecking ? '检查中...' : '提交排序'}
                    </button>
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
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>总题数</p>
                      <p className="text-xl font-bold">{selectedLevel.questions.length}</p>
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

export default CulturalSortingGame;