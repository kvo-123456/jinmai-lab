import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import culturalRiddleGameService, { RiddleLevel, Riddle } from '@/services/culturalRiddleGameService';

interface CulturalRiddleGameProps {
  isOpen: boolean;
  onClose: () => void;
}

const CulturalRiddleGame: React.FC<CulturalRiddleGameProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  
  // 游戏状态
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
  const [levels, setLevels] = useState<RiddleLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<RiddleLevel | null>(null);
  const [currentRiddleIndex, setCurrentRiddleIndex] = useState(0);
  const [currentRiddle, setCurrentRiddle] = useState<Riddle | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameProgress, setGameProgress] = useState<any>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  // 加载游戏数据
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      try {
        const allLevels = culturalRiddleGameService.getLevels();
        setLevels(allLevels);
        
        if (user) {
          const progress = culturalRiddleGameService.getGameProgress(user.id);
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
      setCurrentRiddleIndex(0);
      setCurrentRiddle(selectedLevel.riddles[0]);
      setUserAnswer('');
      setIsChecking(false);
      setIsCorrect(false);
      setCorrectAnswers(0);
      setGameState('playing');
      setStartTime(new Date());
      setTimeTaken(null);
      setCurrentHintIndex(0);
      setShowHint(false);
      setCurrentTime(0);
      setHintsUsed(0);
    }
  }, [selectedLevel]);

  // 当当前谜语索引变化时，更新当前谜语
  useEffect(() => {
    if (selectedLevel && selectedLevel.riddles[currentRiddleIndex]) {
      setCurrentRiddle(selectedLevel.riddles[currentRiddleIndex]);
      setUserAnswer('');
      setIsChecking(false);
      setIsCorrect(false);
      setCurrentHintIndex(0);
      setShowHint(false);
    }
  }, [selectedLevel, currentRiddleIndex]);

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
      if (correctAnswers >= selectedLevel.riddles.length) {
        handleCompleteLevel();
      }
    }
  }, [correctAnswers, selectedLevel, gameState]);

  // 选择关卡
  const handleSelectLevel = useCallback((level: RiddleLevel) => {
    if (!user) {
      toast.error('请先登录！');
      return;
    }
    
    const isUnlocked = culturalRiddleGameService.isLevelUnlocked(user.id, level.id);
    if (isUnlocked) {
      setSelectedLevel(level);
    } else {
      toast.error('该关卡尚未解锁！');
    }
  }, [user]);

  // 提交答案
  const handleSubmitAnswer = useCallback(() => {
    if (!currentRiddle || userAnswer.trim() === '') {
      toast.error('请输入答案！');
      return;
    }
    
    setIsChecking(true);
    
    const result = culturalRiddleGameService.checkAnswer(currentRiddle, userAnswer);
    setIsCorrect(result);
    
    if (result) {
      setCorrectAnswers(prev => prev + 1);
      toast.success('回答正确！');
      
      // 延迟进入下一题或完成关卡
      setTimeout(() => {
        if (currentRiddleIndex < (selectedLevel?.riddles.length || 0) - 1) {
          setCurrentRiddleIndex(prev => prev + 1);
        } else {
          handleCompleteLevel();
        }
        setIsChecking(false);
      }, 1500);
    } else {
      toast.error('回答错误，请重新尝试！');
      setIsChecking(false);
    }
  }, [currentRiddle, userAnswer, currentRiddleIndex, selectedLevel]);

  // 完成关卡
  const handleCompleteLevel = useCallback(() => {
    if (!user || !selectedLevel) return;
    
    const endTime = new Date();
    const timeDiff = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    setTimeTaken(timeDiff);
    
    // 计算得分
    const finalScore = culturalRiddleGameService.calculateLevelScore(
      correctAnswers,
      selectedLevel.riddles.length,
      timeDiff,
      selectedLevel.difficulty,
      hintsUsed
    );
    
    // 更新游戏进度
    const updatedProgress = culturalRiddleGameService.completeLevel(
      user.id,
      selectedLevel.id,
      finalScore,
      timeDiff
    );
    setGameProgress(updatedProgress);
    
    setGameState('completed');
    
    toast.success(`关卡完成！得分：${finalScore}`);
  }, [user, selectedLevel, correctAnswers, startTime, hintsUsed]);

  // 使用提示
  const handleUseHint = useCallback(() => {
    if (!user || !gameProgress || !currentRiddle) return;
    
    if (currentHintIndex >= currentRiddle.hints.length) {
      toast.error('提示已用完');
      return;
    }
    
    const success = culturalRiddleGameService.useHint(user.id);
    if (success) {
      setShowHint(true);
      setHintsUsed(prev => prev + 1);
      const updatedProgress = culturalRiddleGameService.getGameProgress(user.id);
      setGameProgress(updatedProgress);
      toast.success('已显示提示');
    } else {
      toast.error('提示已用完');
    }
  }, [user, gameProgress, currentRiddle, currentHintIndex]);

  // 获取下一个提示
  const handleNextHint = useCallback(() => {
    if (!user || !currentRiddle || currentHintIndex >= currentRiddle.hints.length - 1) return;
    
    const success = culturalRiddleGameService.useHint(user.id);
    if (success) {
      setCurrentHintIndex(prev => prev + 1);
      setHintsUsed(prev => prev + 1);
      const updatedProgress = culturalRiddleGameService.getGameProgress(user.id);
      setGameProgress(updatedProgress);
      toast.success('已显示下一个提示');
    } else {
      toast.error('提示已用完');
    }
  }, [user, currentRiddle, currentHintIndex]);

  // 返回主菜单
  const handleBackToMenu = useCallback(() => {
    setGameState('menu');
    setSelectedLevel(null);
    setCurrentRiddle(null);
    setCurrentRiddleIndex(0);
    setUserAnswer('');
    setIsCorrect(false);
    setCorrectAnswers(0);
    setStartTime(null);
    setTimeTaken(null);
    setCurrentHintIndex(0);
    setShowHint(false);
    setIsChecking(false);
    setCurrentTime(0);
    setHintsUsed(0);
  }, []);

  // 重新开始关卡
  const handleRestartLevel = useCallback(() => {
    if (!selectedLevel) return;
    setCurrentRiddleIndex(0);
    setCurrentRiddle(selectedLevel.riddles[0]);
    setUserAnswer('');
    setIsCorrect(false);
    setCorrectAnswers(0);
    setGameState('playing');
    setStartTime(new Date());
    setTimeTaken(null);
    setCurrentHintIndex(0);
    setShowHint(false);
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
        className={`w-full max-w-2xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} text-${isDark ? 'white' : 'gray-900'} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 游戏头部 */}
        <div className={`sticky top-0 z-10 p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">文化猜谜游戏</h3>
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
                  <h2 className="text-2xl font-bold mb-2">欢迎来到文化猜谜游戏</h2>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    根据提示猜文化元素、成语或历史人物，了解天津地方文化和中国传统文化
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
                    const isUnlocked = !user || culturalRiddleGameService.isLevelUnlocked(user.id, level.id);

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
                            {level.riddles.length} 题
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
            {gameState === 'playing' && selectedLevel && currentRiddle && !isLoading && (
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
                        <span className="font-medium">{currentRiddleIndex + 1} / {selectedLevel.riddles.length}</span>
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

                {/* 谜语内容 */}
                <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className="text-lg font-medium mb-2">第 {currentRiddleIndex + 1} 题：{currentRiddle.title}</h4>
                  <p className={`mb-6 text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {currentRiddle.content}
                  </p>

                  {/* 提示 */}
                  {showHint && currentRiddle.hints[currentHintIndex] && (
                    <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-100'} border ${isDark ? 'border-yellow-700' : 'border-yellow-200'}`}>
                      <div className="flex flex-col">
                        <div className="flex items-center mb-2">
                          <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                          <span className={`font-medium ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
                            提示 {currentHintIndex + 1}/{currentRiddle.hints.length}
                          </span>
                        </div>
                        <p className={`text-sm ${isDark ? 'text-yellow-200' : 'text-yellow-800'} mb-2`}>
                          {currentRiddle.hints[currentHintIndex]}
                        </p>
                        {currentHintIndex < currentRiddle.hints.length - 1 && (
                          <button
                            onClick={handleNextHint}
                            className={`text-xs self-start px-2 py-1 rounded-lg ${isDark ? 'bg-yellow-800 hover:bg-yellow-700 text-yellow-200' : 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800'}`}
                          >
                            获取下一个提示
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 答案输入区域 */}
                  <div className="mb-6">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="请输入答案..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                        className={`flex-1 px-4 py-3 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        disabled={isChecking}
                      />
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={isChecking || userAnswer.trim() === ''}
                        className={`px-4 py-3 rounded-lg transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isChecking ? '检查中...' : '提交'}
                      </button>
                    </div>
                    <div className="mt-2 text-right">
                      <button
                        onClick={handleUseHint}
                        disabled={showHint && currentHintIndex >= currentRiddle.hints.length - 1}
                        className={`text-sm px-3 py-1 rounded-lg transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <i className="fas fa-lightbulb mr-1"></i>获取提示 ({gameProgress?.unlockedHints || 0})
                      </button>
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
                            {currentRiddle.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                      <p className="text-xl font-bold">{Math.round((correctAnswers / selectedLevel.riddles.length) * 100)}%</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>总题数</p>
                      <p className="text-xl font-bold">{selectedLevel.riddles.length}</p>
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

export default CulturalRiddleGame;