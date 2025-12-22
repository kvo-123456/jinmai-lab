import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import culturalPuzzleGameService, { PuzzleLevel, PuzzlePiece, GameProgress } from '@/services/culturalPuzzleGameService';
import LazyImage from './LazyImage';

interface CulturalPuzzleGameProps {
  isOpen: boolean;
  onClose: () => void;
}

const CulturalPuzzleGame: React.FC<CulturalPuzzleGameProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  
  // 游戏状态
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
  const [levels, setLevels] = useState<PuzzleLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<PuzzleLevel | null>(null);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [currentPiece, setCurrentPiece] = useState<PuzzlePiece | null>(null);
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  
  // 引用
  const gameAreaRef = useRef<HTMLDivElement>(null);
  
  // 加载游戏数据
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      try {
        const allLevels = culturalPuzzleGameService.getLevels();
        setLevels(allLevels);
        
        if (user) {
          const progress = culturalPuzzleGameService.getGameProgress(user.id);
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
      const generatedPieces = culturalPuzzleGameService.generatePuzzlePieces(selectedLevel);
      setPieces(generatedPieces);
      setGameState('playing');
      setStartTime(new Date());
      setTimeTaken(null);
      setCurrentTime(0);
      setMoves(0);
      setHintsUsed(0);
      setShowHint(false);
      setShowSolution(false);
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
  const handleSelectLevel = useCallback((level: PuzzleLevel) => {
    if (!user) {
      toast.error('请先登录！');
      return;
    }
    
    const isUnlocked = culturalPuzzleGameService.isLevelUnlocked(user.id, level.id);
    if (isUnlocked) {
      setSelectedLevel(level);
    } else {
      toast.error('该关卡尚未解锁！');
    }
  }, [user]);
  
  // 处理拖拽开始
  const handleDragStart = useCallback((e: MouseEvent | PointerEvent | TouchEvent, piece: PuzzlePiece) => {
  if (piece.isPlaced) return;
  
  setCurrentPiece(piece);
}, []);

const handleDragEnd = useCallback((e: MouseEvent | PointerEvent | TouchEvent) => {
  setCurrentPiece(null);
}, []);
  
  // 处理拖拽进入
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);
  
  // 处理拖拽放置
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!currentPiece || !gameAreaRef.current) return;
    
    const pieceId = parseInt(e.dataTransfer.getData('text/plain'));
    const piece = pieces.find(p => p.id === pieceId);
    
    if (!piece || piece.isPlaced) return;
    
    // 获取游戏区域的位置和尺寸
    const gameAreaRect = gameAreaRef.current.getBoundingClientRect();
    
    // 计算放置位置（相对于游戏区域的百分比）
    const x = ((e.clientX - gameAreaRect.left) / gameAreaRect.width) * 100;
    const y = ((e.clientY - gameAreaRect.top) / gameAreaRect.height) * 100;
    
    // 检查是否放置在正确位置
    const isCorrectPlacement = culturalPuzzleGameService.checkPiecePlacement(piece, x, y);
    
    // 更新碎片状态
    const updatedPieces = pieces.map(p => {
      if (p.id === piece.id) {
        return {
          ...p,
          x: isCorrectPlacement ? p.correctX : x,
          y: isCorrectPlacement ? p.correctY : y,
          isPlaced: isCorrectPlacement
        };
      }
      return p;
    });
    
    setPieces(updatedPieces);
    setMoves(prev => prev + 1);
    
    // 检查拼图是否完成
    const isComplete = culturalPuzzleGameService.checkPuzzleComplete(updatedPieces);
    if (isComplete) {
      handleCompletePuzzle();
    }
  }, [currentPiece, pieces]);
  
  // 处理拼图完成
  const handleCompletePuzzle = useCallback(() => {
    if (!user || !selectedLevel) return;
    
    const endTime = new Date();
    const timeDiff = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    setTimeTaken(timeDiff);
    
    // 计算得分
    const finalScore = culturalPuzzleGameService.calculateScore(
      selectedLevel,
      timeDiff,
      moves,
      hintsUsed
    );
    
    // 更新游戏进度
    const updatedProgress = culturalPuzzleGameService.completeLevel(
      user.id,
      selectedLevel.id,
      finalScore,
      timeDiff
    );
    setGameProgress(updatedProgress);
    
    setGameState('completed');
    
    toast.success(`拼图完成！得分：${finalScore}`);
  }, [user, selectedLevel, startTime, moves, hintsUsed]);
  
  // 使用提示
  const handleUseHint = useCallback(() => {
    if (!user || !gameProgress || !selectedLevel) return;
    
    const success = culturalPuzzleGameService.useHint(user.id);
    if (success) {
      setShowHint(true);
      setHintsUsed(prev => prev + 1);
      const updatedProgress = culturalPuzzleGameService.getGameProgress(user.id);
      setGameProgress(updatedProgress);
      toast.success('已显示提示');
      
      // 3秒后隐藏提示
      setTimeout(() => {
        setShowHint(false);
      }, 3000);
    } else {
      toast.error('提示已用完');
    }
  }, [user, gameProgress, selectedLevel]);
  
  // 显示解决方案
  const handleShowSolution = useCallback(() => {
    setShowSolution(prev => !prev);
  }, []);
  
  // 返回主菜单
  const handleBackToMenu = useCallback(() => {
    setGameState('menu');
    setSelectedLevel(null);
    setPieces([]);
    setCurrentPiece(null);
    setStartTime(null);
    setTimeTaken(null);
    setCurrentTime(0);
    setMoves(0);
    setHintsUsed(0);
    setShowHint(false);
    setShowSolution(false);
  }, []);
  
  // 重新开始游戏
  const handleRestartGame = useCallback(() => {
    if (!selectedLevel) return;
    
    const generatedPieces = culturalPuzzleGameService.generatePuzzlePieces(selectedLevel);
    setPieces(generatedPieces);
    setGameState('playing');
    setStartTime(new Date());
    setTimeTaken(null);
    setCurrentTime(0);
    setMoves(0);
    setHintsUsed(0);
    setShowHint(false);
    setShowSolution(false);
  }, [selectedLevel]);
  
  // 格式化时间
  const formatTime = useCallback((seconds: number | null) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // 计算剩余提示次数
  const remainingHints = gameProgress?.unlockedHints || 0;
  
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
          <h3 className="text-xl font-bold">文化拼图游戏</h3>
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
                  <h2 className="text-2xl font-bold mb-2">欢迎来到文化拼图游戏</h2>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    拼合文化图片，了解天津地方文化和中国传统文化
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
                    const isUnlocked = !user || culturalPuzzleGameService.isLevelUnlocked(user.id, level.id);
                    
                    return (
                      <motion.div
                        key={level.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${isDark ? 'border-gray-700' : 'border-gray-200'} ${isUnlocked ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'}`}
                        whileHover={isUnlocked ? { y: -4 } : {}}
                        onClick={() => isUnlocked && handleSelectLevel(level)}
                      >
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
                        <h4 className="font-medium mb-1">{level.name}</h4>
                        <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {level.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            {level.difficulty.toUpperCase()}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            {level.pieceCount} 片
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            {level.culturalTheme}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-yellow-900 bg-opacity-30 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`}>
                            限时: {formatTime(level.timeLimit)}
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
            {gameState === 'playing' && selectedLevel && pieces.length > 0 && !isLoading && (
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
                        onClick={handleShowSolution}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white`}
                      >
                        <i className="fas fa-eye mr-1"></i>{showSolution ? '隐藏' : '显示'}答案
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
                      <span className="text-xs block mb-1">时间</span>
                      <span className="font-medium">{formatTime(currentTime)}</span>
                    </div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className="text-xs block mb-1">移动次数</span>
                      <span className="font-medium">{moves}</span>
                    </div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <span className="text-xs block mb-1">已完成</span>
                      <span className="font-medium">{pieces.filter(p => p.isPlaced).length} / {selectedLevel.pieceCount}</span>
                    </div>
                  </div>
                </div>
                
                {/* 游戏区域 */}
                <div className="mb-6">
                  <div
                    ref={gameAreaRef}
                    className={`relative aspect-video rounded-lg overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-300'} bg-${isDark ? 'gray-800' : 'gray-100'}`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {/* 解决方案预览 */}
                    {showSolution && (
                      <div className="absolute inset-0 opacity-50 z-0">
                        <LazyImage
                          src={selectedLevel.imageUrl}
                          alt="Solution"
                          className="w-full h-full object-cover"
                          ratio="landscape"
                          fit="cover"
                          priority
                        />
                      </div>
                    )}
                    
                    {/* 拼图底板 */}
                    <div className="absolute inset-0 z-0">
                      {Array.from({ length: selectedLevel.rows }).map((_, rowIndex) => (
                        Array.from({ length: selectedLevel.cols }).map((_, colIndex) => {
                          const x = (colIndex / selectedLevel.cols) * 100;
                          const y = (rowIndex / selectedLevel.rows) * 100;
                          const width = 100 / selectedLevel.cols;
                          const height = 100 / selectedLevel.rows;
                          
                          return (
                            <div
                              key={`slot-${rowIndex}-${colIndex}`}
                              className={`absolute border border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'} bg-opacity-10`}
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                width: `${width}%`,
                                height: `${height}%`
                              }}
                            />
                          );
                        })
                      ))}
                    </div>
                    
                    {/* 拼图碎片 */}
                    {pieces.map((piece) => (
                      <motion.div
                        key={piece.id}
                        className={`absolute cursor-move z-20 shadow-md ${piece.isPlaced ? 'z-10 opacity-100' : 'opacity-80 hover:opacity-100'}`}
                        style={{
                          left: `${piece.x}%`,
                          top: `${piece.y}%`,
                          width: `${piece.width}%`,
                          height: `${piece.height}%`,
                          backgroundImage: `url(${piece.imageUrl})`,
                          backgroundPosition: `-${piece.correctX}% -${piece.correctY}%`,
                          backgroundSize: `${selectedLevel.cols * 100}% ${selectedLevel.rows * 100}%`,
                          backgroundRepeat: 'no-repeat',
                          border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
                          borderRadius: '4px',
                          opacity: piece.isPlaced ? 1 : 0.8
                        }}
                        draggable={!piece.isPlaced}
                        onDragStart={(e) => handleDragStart(e, piece)}
                        onDragEnd={handleDragEnd}
                        whileHover={!piece.isPlaced ? { scale: 1.05 } : {}}
                        whileTap={!piece.isPlaced ? { scale: 0.95 } : {}}
                        animate={piece.isPlaced ? {
                          scale: [1, 1.1, 1],
                          transition: { duration: 0.3 }
                        } : {}}
                      />
                    ))}
                  </div>
                </div>
                
                {/* 未放置的碎片 */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">未放置的碎片</h4>
                  <div className={`p-4 rounded-lg overflow-x-auto ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex gap-2 min-w-max">
                      {pieces.filter(p => !p.isPlaced).map((piece) => (
                        <motion.div
                          key={`piece-${piece.id}`}
                          className={`cursor-move flex-shrink-0 shadow-md ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                          style={{
                            width: '80px',
                            height: '80px',
                            backgroundImage: `url(${piece.imageUrl})`,
                            backgroundPosition: `-${piece.correctX}% -${piece.correctY}%`,
                            backgroundSize: `${selectedLevel.cols * 100}% ${selectedLevel.rows * 100}%`,
                            backgroundRepeat: 'no-repeat',
                            border: '1px solid',
                            borderRadius: '4px'
                          }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, piece)}
                          onDragEnd={handleDragEnd}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* 游戏控制 */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleRestartGame}
                    className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    重新开始
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 游戏完成界面 */}
          <AnimatePresence mode="wait">
            {gameState === 'completed' && selectedLevel && gameProgress && timeTaken !== null && !isLoading && (
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
                <h2 className="text-2xl font-bold mb-2">恭喜完成拼图！</h2>
                <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  你成功完成了「{selectedLevel.name}」拼图
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
                      <p className="text-xl font-bold">{formatTime(timeTaken)}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>移动次数</p>
                      <p className="text-xl font-bold">{moves}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>提示使用</p>
                      <p className="text-xl font-bold">{hintsUsed}</p>
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
                    onClick={handleRestartGame}
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

export default CulturalPuzzleGame;
