import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import culturalWordChainGameService, { GameProgress, Level } from '@/services/culturalWordChainGameService';
import LazyImage from './LazyImage';

interface CulturalWordChainGameProps {
  isOpen: boolean;
  onClose: () => void;
}

const CulturalWordChainGame: React.FC<CulturalWordChainGameProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  
  // 游戏状态
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [wordChain, setWordChain] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [lastWord, setLastWord] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [hintWord, setHintWord] = useState<string>('');
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  // 加载游戏数据 - 简化逻辑，避免不必要的延迟
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      // 直接获取数据，不添加延迟
      try {
        const allLevels = culturalWordChainGameService.getLevels();
        setLevels(allLevels);
        
        if (user) {
          const progress = culturalWordChainGameService.getGameProgress(user.id);
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
      // 随机选择一个起始词汇
      const startWord = selectedLevel.words[Math.floor(Math.random() * selectedLevel.words.length)].word;
      setWordChain([startWord]);
      setLastWord(startWord);
      setCurrentInput('');
      setShowHint(false);
      setHintWord('');
      setGameState('playing');
      setStartTime(new Date());
      setTimeTaken(null);
      setCurrentTime(0);
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
    
    const isUnlocked = culturalWordChainGameService.isLevelUnlocked(user.id, level.id);
    if (isUnlocked) {
      setSelectedLevel(level);
    } else {
      toast.error('该关卡尚未解锁！');
    }
  }, [user]);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentInput(e.target.value);
  }, []);

  // 处理提交词汇
  const handleSubmitWord = useCallback(() => {
    if (!selectedLevel || !currentInput.trim() || !lastWord) {
      return;
    }
    
    const inputWord = currentInput.trim();
    
    // 检查词汇是否在关卡词汇列表中
    if (!culturalWordChainGameService.isWordInLevel(inputWord, selectedLevel)) {
      toast.error('该词汇不在关卡词汇列表中！');
      return;
    }
    
    // 检查词汇接龙是否有效
    if (!culturalWordChainGameService.checkWordChain(lastWord, inputWord)) {
      toast.error('词汇接龙无效，请确保前一个词的最后一个字作为下一个词的第一个字！');
      return;
    }
    
    // 检查词汇是否已经使用过
    if (wordChain.includes(inputWord)) {
      toast.error('该词汇已经使用过，请换一个！');
      return;
    }
    
    // 更新词汇链
    const newChain = [...wordChain, inputWord];
    setWordChain(newChain);
    setLastWord(inputWord);
    setCurrentInput('');
    setShowHint(false);
    setHintWord('');
    
    // 检查是否完成关卡（词汇链长度达到关卡词汇数量的一半）
    if (newChain.length >= selectedLevel.words.length / 2) {
      handleCompleteLevel();
    }
    
    toast.success('词汇接龙成功！');
  }, [selectedLevel, currentInput, lastWord, wordChain]);

  // 处理键盘回车事件
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitWord();
    }
  }, [handleSubmitWord]);

  // 使用提示
  const handleUseHint = useCallback(() => {
    if (!user || !gameProgress || !selectedLevel || !lastWord) return;
    
    const success = culturalWordChainGameService.useHint(user.id);
    if (success) {
      // 找到合适的提示词汇
      const availableWords = selectedLevel.words
        .filter((word: { word: string }) => !wordChain.includes(word.word))
        .filter((word: { word: string }) => word.word.startsWith(lastWord.slice(-1)));
      
      if (availableWords.length > 0) {
        const hint = availableWords[Math.floor(Math.random() * availableWords.length)].word;
        setHintWord(hint);
        setShowHint(true);
      }
      
      const updatedProgress = culturalWordChainGameService.getGameProgress(user.id);
      setGameProgress(updatedProgress);
      toast.success('已显示提示');
    } else {
      toast.error('提示已用完');
    }
  }, [user, gameProgress, selectedLevel, lastWord, wordChain]);

  // 完成关卡
  const handleCompleteLevel = useCallback(() => {
    if (!user || !selectedLevel) return;
    
    const endTime = new Date();
    const timeDiff = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    setTimeTaken(timeDiff);
    
    // 计算得分
    const finalScore = culturalWordChainGameService.calculateLevelScore(
      wordChain.length,
      timeDiff,
      selectedLevel.difficulty
    );
    
    // 更新游戏进度
    const updatedProgress = culturalWordChainGameService.completeLevel(
      user.id,
      selectedLevel.id,
      finalScore,
      timeDiff
    );
    setGameProgress(updatedProgress);
    
    setGameState('completed');
    
    toast.success(`关卡完成！得分：${finalScore}`);
  }, [user, selectedLevel, wordChain, startTime]);

  // 返回主菜单
  const handleBackToMenu = useCallback(() => {
    setGameState('menu');
    setSelectedLevel(null);
    setWordChain([]);
    setLastWord('');
    setCurrentInput('');
    setShowHint(false);
    setHintWord('');
    setStartTime(null);
    setTimeTaken(null);
    setCurrentTime(0);
  }, []);

  // 重新开始关卡
  const handleRestartLevel = useCallback(() => {
    if (!selectedLevel) return;
    // 随机选择一个起始词汇
    const startWord = selectedLevel.words[Math.floor(Math.random() * selectedLevel.words.length)].word;
    setWordChain([startWord]);
    setLastWord(startWord);
    setCurrentInput('');
    setShowHint(false);
    setHintWord('');
    setGameState('playing');
    setStartTime(new Date());
    setTimeTaken(null);
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
          <h3 className="text-xl font-bold">文化词汇接龙</h3>
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
                  <h2 className="text-2xl font-bold mb-2">欢迎来到文化词汇接龙</h2>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    根据文化主题进行词汇接龙，前一个词的最后一个字作为下一个词的第一个字
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
                    const isUnlocked = !user || culturalWordChainGameService.isLevelUnlocked(user.id, level.id);

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
                            {level.words.length} 词汇
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
                      <span className="text-xs block mb-1">接龙长度</span>
                      <span className="font-medium">{wordChain.length}</span>
                    </div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className="text-xs block mb-1">已用时间</span>
                      <span className="font-medium">{formatTime(currentTime)}</span>
                    </div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className="text-xs block mb-1">剩余词汇</span>
                      <span className="font-medium">{selectedLevel.words.length - wordChain.length}</span>
                    </div>
                  </div>
                </div>

                {/* 词汇链展示 */}
                <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className="text-lg font-medium mb-3">词汇链</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {wordChain.map((word, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`px-3 py-2 rounded-full ${isDark ? 'bg-blue-600' : 'bg-blue-500'} text-white text-sm font-medium`}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </div>
                  
                  {/* 提示 */}
                  {showHint && hintWord && (
                    <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-100'} border ${isDark ? 'border-yellow-700' : 'border-yellow-200'}`}>
                      <div className="flex items-start">
                        <i className="fas fa-lightbulb text-yellow-500 mt-1 mr-2"></i>
                        <p className={`text-sm ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
                          提示：可以接「{hintWord}」
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 输入区域 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentInput}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder={`请输入以「${lastWord.slice(-1)}」开头的词汇`}
                      className={`flex-grow p-3 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      disabled={!lastWord}
                    />
                    <button
                      onClick={handleSubmitWord}
                      disabled={!currentInput.trim()}
                      className={`px-4 py-3 rounded-lg transition-colors ${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      提交
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
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>接龙长度</p>
                      <p className="text-xl font-bold">{wordChain.length}</p>
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

export default CulturalWordChainGame;