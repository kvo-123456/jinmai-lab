import { useState, useEffect, useCallback } from 'react';

// 游戏状态类型
export type GameState = 'menu' | 'playing' | 'completed';

// 通用关卡类型
export interface GameLevel {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
  unlockCondition?: {
    type: 'score' | 'level';
    value: number;
  };
  reward: string;
  imageUrl?: string;
}

// 通用游戏进度类型
export interface GameProgress {
  userId: string;
  completedLevels: string[];
  totalScore: number;
  levelScores: Record<string, number>;
  bestTimes: Record<string, number>;
  lastPlayed: Date;
}

// 游戏钩子选项
interface UseGameOptions<T extends GameLevel> {
  userId: string;
  levels: T[];
  initialState?: GameState;
  onLevelComplete?: (levelId: string, score: number, timeTaken: number) => void;
}

/**
 * 通用游戏钩子，用于处理游戏的公共状态和功能
 * @param options 游戏钩子选项
 */
export const useGame = <T extends GameLevel>({
  userId,
  levels,
  initialState = 'menu',
  onLevelComplete
}: UseGameOptions<T>) => {
  // 游戏状态
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [selectedLevel, setSelectedLevel] = useState<T | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 计时器效果
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
      setGameState('playing');
      setStartTime(new Date());
      setCurrentTime(0);
    }
  }, [selectedLevel]);

  // 格式化时间为 MM:SS 格式
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 选择关卡
  const selectLevel = useCallback((level: T) => {
    setSelectedLevel(level);
  }, []);

  // 开始游戏
  const startGame = useCallback((level: T) => {
    setSelectedLevel(level);
    setGameState('playing');
    setStartTime(new Date());
    setCurrentTime(0);
  }, []);

  // 完成游戏
  const completeGame = useCallback((score: number) => {
    const endTime = new Date();
    const timeTaken = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;
    
    if (selectedLevel && onLevelComplete) {
      onLevelComplete(selectedLevel.id, score, timeTaken);
    }
    
    setGameState('completed');
  }, [selectedLevel, startTime, onLevelComplete]);

  // 返回主菜单
  const returnToMenu = useCallback(() => {
    setGameState('menu');
    setSelectedLevel(null);
    setStartTime(null);
    setCurrentTime(0);
  }, []);

  // 重新开始游戏
  const restartGame = useCallback(() => {
    if (selectedLevel) {
      setGameState('playing');
      setStartTime(new Date());
      setCurrentTime(0);
    }
  }, [selectedLevel]);

  return {
    // 状态
    gameState,
    selectedLevel,
    startTime,
    currentTime,
    isLoading,
    
    // 方法
    formatTime,
    selectLevel,
    startGame,
    completeGame,
    returnToMenu,
    restartGame,
    
    // 辅助方法
    setIsLoading,
    setGameState
  };
};

export default useGame;
