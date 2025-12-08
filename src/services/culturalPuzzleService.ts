// 文化拼图游戏服务

// 拼图碎片类型
export interface PuzzlePiece {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  correctX: number;
  correctY: number;
  isPlaced: boolean;
  imageUrl: string;
  pieceUrl?: string;
}

// 关卡类型
export interface PuzzleLevel {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pieceCount: number; // 碎片数量
  rows: number; // 行数
  cols: number; // 列数
  timeLimit: number; // 时间限制（秒）
  reward: string; // 奖励
  culturalTheme: string; // 文化主题
  unlockedHints: number; // 可用提示次数
}

// 游戏进度类型
export interface GameProgress {
  userId: string;
  completedLevels: string[];
  levelScores: Record<string, number>;
  totalScore: number;
  unlockedHints: number;
  lastPlayed: Date;
}

// 本地存储键名
const STORAGE_KEY = 'cultural_puzzle_game_progress';

// 游戏关卡数据
const levels: PuzzleLevel[] = [
  {
    id: 'level1',
    name: '天津之眼',
    description: '天津地标建筑，世界上唯一建在桥上的摩天轮',
    imageUrl: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1024&h=768&fit=crop',
    difficulty: 'easy',
    pieceCount: 16,
    rows: 4,
    cols: 4,
    timeLimit: 300,
    reward: '100积分 + 1个提示',
    culturalTheme: '天津地标',
    unlockedHints: 2
  },
  {
    id: 'level2',
    name: '古文化街',
    description: '天津最具代表性的古文化街区，展示天津民俗文化',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1024&h=768&fit=crop',
    difficulty: 'medium',
    pieceCount: 25,
    rows: 5,
    cols: 5,
    timeLimit: 480,
    reward: '150积分 + 2个提示',
    culturalTheme: '天津民俗',
    unlockedHints: 3
  },
  {
    id: 'level3',
    name: '泥人张彩塑',
    description: '天津传统民间艺术，国家级非物质文化遗产',
    imageUrl: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1024&h=768&fit=crop',
    difficulty: 'hard',
    pieceCount: 36,
    rows: 6,
    cols: 6,
    timeLimit: 600,
    reward: '200积分 + 3个提示',
    culturalTheme: '天津非遗',
    unlockedHints: 4
  }
];

// 生成拼图碎片
export const generatePuzzlePieces = (level: PuzzleLevel): PuzzlePiece[] => {
  const pieces: PuzzlePiece[] = [];
  const pieceWidth = 100 / level.cols;
  const pieceHeight = 100 / level.rows;
  
  let id = 0;
  for (let row = 0; row < level.rows; row++) {
    for (let col = 0; col < level.cols; col++) {
      pieces.push({
        id: id++,
        x: Math.random() * 100, // 随机初始位置
        y: Math.random() * 100, // 随机初始位置
        width: pieceWidth,
        height: pieceHeight,
        correctX: col * pieceWidth,
        correctY: row * pieceHeight,
        isPlaced: false,
        imageUrl: level.imageUrl,
        // 这里可以生成具体的碎片图片URL，实际项目中需要后端支持
        // pieceUrl: `${level.imageUrl}?piece=${row}_${col}`
      });
    }
  }
  
  // 打乱碎片顺序
  return shuffleArray(pieces);
};

// 检查碎片是否放置在正确位置
export const checkPiecePlacement = (piece: PuzzlePiece, x: number, y: number): boolean => {
  const tolerance = 5; // 容差范围（百分比）
  return Math.abs(x - piece.correctX) <= tolerance && Math.abs(y - piece.correctY) <= tolerance;
};

// 检查拼图是否完成
export const checkPuzzleComplete = (pieces: PuzzlePiece[]): boolean => {
  return pieces.every(piece => piece.isPlaced);
};

// 计算游戏得分
export const calculateScore = (
  level: PuzzleLevel,
  timeTaken: number,
  moves: number,
  hintsUsed: number
): number => {
  // 基础分数
  let baseScore = 1000;
  
  // 难度系数
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2
  };
  
  // 时间系数（越快完成分数越高）
  const timeRatio = Math.max(0, 1 - (timeTaken / level.timeLimit));
  const timeScore = baseScore * timeRatio;
  
  // 移动次数系数（越少移动分数越高）
  const movesRatio = Math.max(0, 1 - (moves / (level.pieceCount * 2)));
  const movesScore = baseScore * movesRatio;
  
  // 提示惩罚
  const hintPenalty = hintsUsed * 50;
  
  // 计算最终得分
  const finalScore = Math.round(
    (timeScore + movesScore) / 2 * difficultyMultiplier[level.difficulty] - hintPenalty
  );
  
  return Math.max(0, finalScore);
};

// 获取所有关卡
export const getLevels = (): PuzzleLevel[] => {
  return levels;
};

// 获取单个关卡
export const getLevel = (id: string): PuzzleLevel | undefined => {
  return levels.find(level => level.id === id);
};

// 检查关卡是否解锁
export const isLevelUnlocked = (userId: string, levelId: string): boolean => {
  const progress = getGameProgress(userId);
  
  // 第一关默认解锁
  if (levelId === 'level1') {
    return true;
  }
  
  // 检查前一关是否已完成
  const levelIndex = levels.findIndex(level => level.id === levelId);
  if (levelIndex > 0) {
    const previousLevelId = levels[levelIndex - 1].id;
    return progress.completedLevels.includes(previousLevelId);
  }
  
  return false;
};

// 获取游戏进度
export const getGameProgress = (userId: string): GameProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const progressMap: Record<string, GameProgress> = JSON.parse(stored);
      if (progressMap[userId]) {
        return {
          ...progressMap[userId],
          lastPlayed: new Date(progressMap[userId].lastPlayed)
        };
      }
    }
  } catch (error) {
    console.error('读取游戏进度失败:', error);
  }
  
  // 返回默认进度
  return {
    userId,
    completedLevels: [],
    levelScores: {},
    totalScore: 0,
    unlockedHints: 3,
    lastPlayed: new Date()
  };
};

// 保存游戏进度
export const saveGameProgress = (progress: GameProgress): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const progressMap: Record<string, GameProgress> = stored ? JSON.parse(stored) : {};
    
    progressMap[progress.userId] = {
      ...progress,
      lastPlayed: new Date()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressMap));
  } catch (error) {
    console.error('保存游戏进度失败:', error);
  }
};

// 完成关卡
export const completeLevel = (
  userId: string,
  levelId: string,
  score: number,
  timeTaken: number
): GameProgress => {
  const progress = getGameProgress(userId);
  
  // 如果关卡未完成，添加到已完成列表
  if (!progress.completedLevels.includes(levelId)) {
    progress.completedLevels.push(levelId);
  }
  
  // 更新关卡分数（如果新分数更高）
  if (!progress.levelScores[levelId] || score > progress.levelScores[levelId]) {
    progress.levelScores[levelId] = score;
    
    // 更新总分
    const totalScore = Object.values(progress.levelScores).reduce((sum, s) => sum + s, 0);
    progress.totalScore = totalScore;
  }
  
  // 保存进度
  saveGameProgress(progress);
  
  return progress;
};

// 使用提示
export const useHint = (userId: string): boolean => {
  const progress = getGameProgress(userId);
  
  if (progress.unlockedHints > 0) {
    progress.unlockedHints -= 1;
    saveGameProgress(progress);
    return true;
  }
  
  return false;
};

// 辅助函数：打乱数组
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// 文化拼图游戏服务对象
const culturalPuzzleGameService = {
  generatePuzzlePieces,
  checkPiecePlacement,
  checkPuzzleComplete,
  calculateScore,
  getLevels,
  getLevel,
  isLevelUnlocked,
  getGameProgress,
  saveGameProgress,
  completeLevel,
  useHint
};

export default culturalPuzzleGameService;
