// 文化图片找茬游戏服务，用于管理游戏关卡和差异点数据

// 差异点类型定义
export interface Difference {
  id: string;           // 差异点唯一标识
  position: {
    x: number;          // x坐标（相对于图片宽度的百分比）
    y: number;          // y坐标（相对于图片高度的百分比）
    width: number;      // 宽度（相对于图片宽度的百分比）
    height: number;     // 高度（相对于图片高度的百分比）
  };
  description: string;  // 差异点描述
  hint?: string;        // 提示（可选）
}

// 游戏关卡类型定义
export interface Level {
  id: string;           // 关卡唯一标识
  name: string;         // 关卡名称
  description: string;  // 关卡描述
  originalImageUrl: string;  // 原始图片URL
  modifiedImageUrl: string;  // 修改后的图片URL
  differences: Difference[];  // 差异点列表
  difficulty: 'easy' | 'medium' | 'hard';  // 难度级别
  timeLimit?: number;   // 时间限制（秒，可选）
  unlockCondition?: {   // 解锁条件（可选）
    type: 'score' | 'level';  // 条件类型
    value: number;      // 条件值
  };
  reward: string;       // 通关奖励
  culturalTheme: string;  // 文化主题
  imageUrl?: string;    // 关卡封面图（可选）
}

// 游戏进度类型定义
export interface GameProgress {
  userId: string;       // 用户ID
  completedLevels: string[];  // 已完成关卡
  totalScore: number;   // 总得分
  levelScores: Record<string, number>;  // 各关卡得分
  bestTimes: Record<string, number>;  // 各关卡最佳时间（秒）
  unlockedHints: number;  // 可用提示次数
  lastPlayed: Date;     // 最后游戏时间
}

// 文化图片找茬游戏服务类
class CulturalSpotTheDifferenceGameService {
  private levels: Level[] = [];
  private gameProgress: Map<string, GameProgress> = new Map();
  private nextLevelId = 1;
  private nextDifferenceId = 1;

  constructor() {
    this.initLevels();
  }

  // 初始化关卡数据
  private initLevels(): void {
    // 为每个关卡分配差异点
    this.levels = [
      {
        id: `level-${this.nextLevelId++}`,
        name: '天津古文化街',
        description: '找出两张天津古文化街图片的不同之处',
        originalImageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Tianjin%20ancient%20culture%20street%20with%20traditional%20Chinese%20architecture',
        modifiedImageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Tianjin%20ancient%20culture%20street%20with%20traditional%20Chinese%20architecture%20and%20a%20red%20lantern%20missing',
        differences: [
          {
            id: `diff-${this.nextDifferenceId++}`,
            position: { x: 25, y: 30, width: 10, height: 15 },
            description: '缺少了一个红色灯笼',
            hint: '在左侧建筑的屋檐下'
          },
          {
            id: `diff-${this.nextDifferenceId++}`,
            position: { x: 75, y: 45, width: 8, height: 12 },
            description: '人物穿着不同',
            hint: '在右侧街道上'
          },
          {
            id: `diff-${this.nextDifferenceId++}`,
            position: { x: 45, y: 60, width: 12, height: 10 },
            description: '店铺招牌文字不同',
            hint: '在中间店铺的招牌上'
          }
        ],
        difficulty: 'easy',
        reward: '解锁天津古文化街素材包',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20ancient%20culture%20street%20spot%20the%20difference%20game'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '中国传统建筑',
        description: '找出两张中国传统建筑图片的不同之处',
        originalImageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Traditional%20Chinese%20architecture%20with%20a%20temple',
        modifiedImageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Traditional%20Chinese%20architecture%20with%20a%20temple%20and%20different%20roof%20design',
        differences: [
          {
            id: `diff-${this.nextDifferenceId++}`,
            position: { x: 45, y: 20, width: 15, height: 15 },
            description: '屋顶设计不同',
            hint: '在寺庙的屋顶上'
          },
          {
            id: `diff-${this.nextDifferenceId++}`,
            position: { x: 30, y: 50, width: 10, height: 12 },
            description: '缺少了一个石狮子',
            hint: '在寺庙的入口处'
          },
          {
            id: `diff-${this.nextDifferenceId++}`,
            position: { x: 65, y: 35, width: 8, height: 10 },
            description: '窗户设计不同',
            hint: '在右侧建筑的墙上'
          },
          {
            id: `diff-${this.nextDifferenceId++}`,
            position: { x: 75, y: 60, width: 12, height: 15 },
            description: '树木数量不同',
            hint: '在右侧背景中'
          }
        ],
        difficulty: 'medium',
        unlockCondition: { type: 'level', value: 1 },
        reward: '解锁中国传统建筑素材包',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20traditional%20architecture%20spot%20the%20difference%20game'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '天津民俗文化',
        description: '找出两张天津民俗文化图片的不同之处',
        originalImageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Tianjin%20folk%20culture%20performance',
        modifiedImageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Tianjin%20folk%20culture%20performance%20with%20different%20costumes%20and%20props',
        differences: [
          {
            id: `diff-${this.nextDifferenceId++}`,
            position: { x: 20, y: 40, width: 12, height: 18 },
            description: '表演者服装不同',
            hint: '在左侧表演者身上'
          },
          {
            id: `diff-${this.nextDifferenceId++}`,
            position: { x: 50, y: 55, width: 10, height: 15 },
            description: '道具不同',
            hint: '在中间表演者手中'
          },
          {
            id: `diff-${this.nextDifferenceId++}`,
            position: { x: 70, y: 30, width: 15, height: 12 },
            description: '背景装饰不同',
            hint: '在右侧背景中'
          },
          {
            id: `diff-${this.nextDifferenceId++}`,
            position: { x: 35, y: 25, width: 8, height: 10 },
            description: '头饰不同',
            hint: '在左侧表演者头上'
          },
          {
            id: `diff-${this.nextDifferenceId++}`,
            position: { x: 60, y: 65, width: 12, height: 10 },
            description: '地面图案不同',
            hint: '在右侧地面上'
          }
        ],
        difficulty: 'hard',
        unlockCondition: { type: 'level', value: 2 },
        timeLimit: 300,
        reward: '解锁天津民俗文化素材包',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20folk%20culture%20spot%20the%20difference%20game'
      }
    ];
  }

  // 获取所有关卡
  getLevels(): Level[] {
    return [...this.levels];
  }

  // 根据ID获取关卡
  getLevelById(levelId: string): Level | undefined {
    return this.levels.find(level => level.id === levelId);
  }

  // 获取用户游戏进度
  getGameProgress(userId: string): GameProgress {
    if (!this.gameProgress.has(userId)) {
      const progress: GameProgress = {
        userId,
        completedLevels: [],
        totalScore: 0,
        levelScores: {},
        bestTimes: {},
        unlockedHints: 3,
        lastPlayed: new Date()
      };
      this.gameProgress.set(userId, progress);
    }
    return this.gameProgress.get(userId)!;
  }

  // 更新用户游戏进度
  updateGameProgress(userId: string, progress: Partial<GameProgress>): GameProgress {
    const currentProgress = this.getGameProgress(userId);
    const updatedProgress: GameProgress = {
      ...currentProgress,
      ...progress,
      lastPlayed: new Date()
    };
    this.gameProgress.set(userId, updatedProgress);
    return updatedProgress;
  }

  // 检查点击位置是否接近差异点
  isDifferenceFound(clickPosition: { x: number; y: number }, difference: Difference, tolerance: number = 5): boolean {
    const { x, y } = difference.position;
    const { x: clickX, y: clickY } = clickPosition;
    
    // 计算点击位置与差异点中心的距离
    const distance = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2));
    return distance <= tolerance;
  }

  // 计算关卡得分
  calculateLevelScore(
    foundDifferences: number,
    totalDifferences: number,
    timeTaken: number,
    difficulty: string
  ): number {
    const accuracy = foundDifferences / totalDifferences;
    const baseScore = Math.round(100 * accuracy);
    
    // 时间奖励（根据难度调整）
    const timeBonusMultiplier = {
      easy: 0.3,
      medium: 0.5,
      hard: 0.8
    }[difficulty as 'easy' | 'medium' | 'hard'] || 0.5;
    
    // 假设关卡预期完成时间为每个差异点30秒
    const expectedTime = totalDifferences * 30;
    const timeBonus = Math.max(0, expectedTime - timeTaken) * timeBonusMultiplier;
    
    // 难度系数
    const difficultyMultiplier = {
      easy: 1.0,
      medium: 1.2,
      hard: 1.5
    }[difficulty as 'easy' | 'medium' | 'hard'] || 1.0;
    
    return Math.round((baseScore + timeBonus) * difficultyMultiplier);
  }

  // 完成关卡
  completeLevel(
    userId: string,
    levelId: string,
    score: number,
    timeTaken: number
  ): GameProgress {
    const progress = this.getGameProgress(userId);
    
    // 更新最佳时间
    const updatedBestTimes = {
      ...progress.bestTimes
    };
    
    if (!updatedBestTimes[levelId] || timeTaken < updatedBestTimes[levelId]) {
      updatedBestTimes[levelId] = timeTaken;
    }
    
    // 更新进度
    const updatedProgress: GameProgress = {
      ...progress,
      completedLevels: [...new Set([...progress.completedLevels, levelId])],
      totalScore: progress.totalScore + score,
      levelScores: {
        ...progress.levelScores,
        [levelId]: score
      },
      bestTimes: updatedBestTimes,
      lastPlayed: new Date()
    };
    
    this.gameProgress.set(userId, updatedProgress);
    return updatedProgress;
  }

  // 使用提示
  useHint(userId: string): boolean {
    const progress = this.getGameProgress(userId);
    if (progress.unlockedHints > 0) {
      this.updateGameProgress(userId, {
        unlockedHints: progress.unlockedHints - 1
      });
      return true;
    }
    return false;
  }

  // 解锁新提示
  unlockHint(userId: string): void {
    const progress = this.getGameProgress(userId);
    this.updateGameProgress(userId, {
      unlockedHints: progress.unlockedHints + 1
    });
  }

  // 检查关卡是否解锁
  isLevelUnlocked(userId: string, levelId: string): boolean {
    const level = this.getLevelById(levelId);
    if (!level || !level.unlockCondition) {
      return true;
    }
    
    const progress = this.getGameProgress(userId);
    const { unlockCondition } = level;
    
    if (unlockCondition.type === 'level') {
      return progress.completedLevels.length >= unlockCondition.value;
    } else if (unlockCondition.type === 'score') {
      return progress.totalScore >= unlockCondition.value;
    }
    
    return false;
  }
}

// 创建单例实例
const culturalSpotTheDifferenceGameService = new CulturalSpotTheDifferenceGameService();

export default culturalSpotTheDifferenceGameService;