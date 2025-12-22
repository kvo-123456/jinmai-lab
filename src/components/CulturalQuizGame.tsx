import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import culturalQuizGameService, { QuizLevel, QuizQuestion, GameProgress } from '@/services/culturalQuizGameService';
import LazyImage from './LazyImage';

interface CulturalQuizGameProps {
  isOpen: boolean;
  onClose: () => void;
}

const CulturalQuizGame: React.FC<CulturalQuizGameProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  
  // 游戏状态
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  // 加载游戏数据 - 简化逻辑，避免不必要的延迟
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      // 直接获取数据，不添加延迟
      try {
        const allLevels = culturalQuizGameService.getLevels();
        setLevels(allLevels);
        
        if (user) {
          const progress = culturalQuizGameService.getGameProgress(user.id);
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
      setSelectedAnswers([]);
      setShowAnswer(false);
      setIsCorrect(false);
      setCorrectAnswers(0);
      setGameState('playing');
      setStartTime(new Date());
      setTimeTaken(null);
      setShowHint(false);
      setCurrentTime(0);
    }
  }, [selectedLevel]);

  // 当当前题目索引变化时，更新当前题目
  useEffect(() => {
    if (selectedLevel && selectedLevel.questions[currentQuestionIndex]) {
      setCurrentQuestion(selectedLevel.questions[currentQuestionIndex]);
      setSelectedAnswers([]);
      setShowAnswer(false);
      setIsCorrect(false);
      setShowHint(false);
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

  // 选择关卡
  const handleSelectLevel = useCallback((level: Level) => {
    if (!user) {
      toast.error('请先登录！');
      return;
    }
    
    const isUnlocked = culturalQuizGameService.isLevelUnlocked(user.id, level.id);
    if (isUnlocked) {
      setSelectedLevel(level);
    } else {
      toast.error('该关卡尚未解锁！');
    }
  }, [user]);

  // 处理选项选择
  const handleOptionSelect = useCallback((optionIndex: number) => {
    if (showAnswer) return;
    
    if (!currentQuestion) return;
    
    if (currentQuestion.type === 'single') {
      // 单选题，只能选择一个答案
      setSelectedAnswers([optionIndex]);
    } else {
      // 多选题，可选择多个答案
      setSelectedAnswers(prev => {
        if (prev.includes(optionIndex)) {
          // 取消选择
          return prev.filter(index => index !== optionIndex);
        } else {
          // 添加选择
          return [...prev, optionIndex];
        }
      });
    }
  }, [currentQuestion, showAnswer]);

  // 提交答案
  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion || selectedAnswers.length === 0) {
      toast.error('请选择答案！');
      return;
    }
    
    const result = culturalQuizGameService.checkAnswer(currentQuestion, selectedAnswers);
    setShowAnswer(true);
    setIsCorrect(result);
    
    if (result) {
      setCorrectAnswers(prev => prev + 1);
      toast.success('回答正确！');
    } else {
      toast.error('回答错误');
    }
  }, [currentQuestion, selectedAnswers]);

  // 进入下一题
  const handleNextQuestion = useCallback(() => {
    if (!selectedLevel) return;
    
    if (currentQuestionIndex < selectedLevel.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // 完成关卡
      handleCompleteLevel();
    }
  }, [currentQuestionIndex, selectedLevel]);

  // 完成关卡
  const handleCompleteLevel = useCallback(() => {
    if (!user || !selectedLevel) return;
    
    const endTime = new Date();
    const timeDiff = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    setTimeTaken(timeDiff);
    
    // 计算得分
    const finalScore = culturalQuizGameService.calculateLevelScore(
      correctAnswers,
      selectedLevel.questions.length,
      timeDiff,
      selectedLevel.difficulty
    );
    
    // 更新游戏进度
    const updatedProgress = culturalQuizGameService.completeLevel(
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
    
    const success = culturalQuizGameService.useHint(user.id);
    if (success) {
      setShowHint(true);
      const updatedProgress = culturalQuizGameService.getGameProgress(user.id);
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
    setSelectedAnswers([]);
    setShowAnswer(false);
    setIsCorrect(false);
    setCorrectAnswers(0);
    setStartTime(null);
    setTimeTaken(null);
    setShowHint(false);
    setCurrentTime(0);
  }, []);

  // 重新开始关卡
  const handleRestartLevel = useCallback(() => {
    if (!selectedLevel) return;
    setCurrentQuestionIndex(0);
    setCurrentQuestion(selectedLevel.questions[0]);
    setSelectedAnswers([]);
    setShowAnswer(false);
    setIsCorrect(false);
    setCorrectAnswers(0);
    setGameState('playing');
    setStartTime(new Date());
    setTimeTaken(null);
    setShowHint(false);
    setCurrentTime(0);
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
        className={`w-full max-w-2xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} text-${isDark ? 'white' : 'gray-900'} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 游戏头部 - 固定 */}
        <div className={`sticky top-0 z-10 p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">文化知识挑战</h3>
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
                  <h2 className="text-2xl font-bold mb-2">欢迎来到文化知识挑战</h2>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    测试你对天津地方文化和中国传统文化的了解
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
                    const isUnlocked = !user || culturalQuizGameService.isLevelUnlocked(user.id, level.id);

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
                      <span className="text-xs block mb-1">题目进度</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{currentQuestionIndex + 1}</span>
                        <span className="text-xs">/ {selectedLevel.questions.length}</span>
                      </div>
                    </div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className="text-xs block mb-1">正确题数</span>
                      <span className="font-medium">{correctAnswers}</span>
                    </div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className="text-xs block mb-1">用时</span>
                      <span className="font-medium">{formatTime(currentTime)}</span>
                    </div>
                  </div>
                </div>

                {/* 题目内容 */}
                <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className="text-lg font-medium mb-2">{currentQuestion.title}</h4>
                  <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {currentQuestion.content}
                  </p>

                  {/* 提示 */}
                  {showHint && currentQuestion.hint && (
                    <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-100'} border ${isDark ? 'border-yellow-700' : 'border-yellow-200'}`}>
                      <div className="flex items-start">
                        <i className="fas fa-lightbulb text-yellow-500 mt-1 mr-2"></i>
                        <p className={`text-sm ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
                          {currentQuestion.hint}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 答案选项 */}
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, index) => (
                      <motion.button
                        key={index}
                        className={`w-full p-3 rounded-lg text-left transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} ${selectedAnswers.includes(index) ? (showAnswer ? (isCorrect ? 'border-green-500 bg-green-500 bg-opacity-10' : 'border-red-500 bg-red-500 bg-opacity-10') : 'border-blue-500 bg-blue-500 bg-opacity-10') : ''} ${showAnswer && currentQuestion.correctAnswers.includes(index) ? 'border-green-500 bg-green-500 bg-opacity-10' : ''}`}
                        whileHover={selectedAnswers.length === 0 ? { scale: 1.02 } : {}}
                        onClick={() => handleOptionSelect(index)}
                        disabled={showAnswer}
                      >
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 border ${selectedAnswers.includes(index) ? (showAnswer ? (isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-red-500 bg-red-500 text-white') : 'border-blue-500 bg-blue-500 text-white') : (showAnswer && currentQuestion.correctAnswers.includes(index) ? 'border-green-500 bg-green-500 text-white' : (isDark ? 'border-gray-600' : 'border-gray-300'))}`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span>{option}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* 答案解析 */}
                  {showAnswer && (
                    <div className={`mt-4 p-3 rounded-lg ${isCorrect ? (isDark ? 'bg-green-900 bg-opacity-30' : 'bg-green-100') : (isDark ? 'bg-red-900 bg-opacity-30' : 'bg-red-100')} border ${isCorrect ? (isDark ? 'border-green-700' : 'border-green-200') : (isDark ? 'border-red-700' : 'border-red-200')}`}>
                      <h5 className="font-medium mb-2">答案解析</h5>
                      <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}
                </div>

                {/* 游戏控制 */}
                <div className="flex justify-end gap-3">
                  {!showAnswer ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswers.length === 0}
                      className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      提交答案
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                    >
                      {currentQuestionIndex < selectedLevel.questions.length - 1 ? '下一题' : '完成关卡'}
                    </button>
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
                      <p className="text-xl font-bold">{Math.round((correctAnswers / selectedLevel.questions.length) * 100)}%</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>正确题数</p>
                      <p className="text-xl font-bold">{correctAnswers} / {selectedLevel.questions.length}</p>
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

export default CulturalQuizGame;