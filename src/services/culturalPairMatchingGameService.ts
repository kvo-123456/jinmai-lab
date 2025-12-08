// 文化配对游戏服务，用于管理游戏关卡和配对项数据

// 配对项类型定义
export interface PairItem {
  id: string;           // 配对项唯一标识
  text: string;         // 配对项文本
  imageUrl?: string;    // 配对项图片（可选）
  category: string;     // 分类（如：天津文化、历史人物等）
  culturalTheme: string;  // 文化主题
}

// 配对对类型定义
export interface Pair {
  id: string;           // 配对对唯一标识
  item1: PairItem;      // 配对项1
  item2: PairItem;      // 配对项2
  relationship: string;  // 配对关系描述
}

// 游戏关卡类型定义
export interface Level {
  id: string;           // 关卡唯一标识
  name: string;         // 关卡名称
  description: string;  // 关卡描述
  pairs: Pair[];        // 关卡包含的配对对
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

// 文化配对游戏服务类
class CulturalPairMatchingGameService {
  private pairs: Pair[] = [];
  private levels: Level[] = [];
  private gameProgress: Map<string, GameProgress> = new Map();
  private nextItemId = 1;
  private nextPairId = 1;
  private nextLevelId = 1;

  constructor() {
    this.initPairs();
    this.initLevels();
  }

  // 初始化配对对数据
  private initPairs(): void {
    // 创建配对项
    const items: PairItem[] = [
      // 天津文化相关配对项
      {
        id: `item-${this.nextItemId++}`,
        text: '狗不理包子',
        category: '天津美食',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Goubuli%20baozi%20Tianjin%20food'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '天津传统名吃，以皮薄馅大、味道鲜美著称',
        category: '天津美食',
        culturalTheme: '天津地方文化'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '杨柳青年画',
        category: '天津民间艺术',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Yangliuqing%20New%20Year%20paintings'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '天津传统木版年画，以色彩鲜艳、内容丰富著称',
        category: '天津民间艺术',
        culturalTheme: '天津地方文化'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '泥人张彩塑',
        category: '天津民间艺术',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Niren%20Zhang%20clay%20sculptures'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '天津传统泥塑艺术，以造型生动、工艺精湛著称',
        category: '天津民间艺术',
        culturalTheme: '天津地方文化'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '天津之眼',
        category: '天津地标',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Tianjin%20Eye%20ferris%20wheel'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '天津标志性建筑，世界上唯一建在桥上的摩天轮',
        category: '天津地标',
        culturalTheme: '天津地方文化'
      },
      
      // 中国传统文化相关配对项
      {
        id: `item-${this.nextItemId++}`,
        text: '春节',
        category: '传统节日',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Chinese%20Spring%20Festival%20celebration'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '中国最重要的传统节日，俗称"过年"',
        category: '传统节日',
        culturalTheme: '中国传统文化'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '孔子',
        category: '历史人物',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Confucius%20ancient%20Chinese%20philosopher'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '儒家学派创始人，中国古代伟大的思想家和教育家',
        category: '历史人物',
        culturalTheme: '中国传统文化'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '造纸术',
        category: '中国科技',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Papermaking%20ancient%20Chinese%20invention'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '中国古代四大发明之一，促进了文化传播',
        category: '中国科技',
        culturalTheme: '中国传统文化'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '京剧',
        category: '传统艺术',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Beijing%20Opera%20performance'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '中国国粹，融合了唱、念、做、打等多种艺术形式',
        category: '传统艺术',
        culturalTheme: '中国传统文化'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '中秋节',
        category: '传统节日',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Mid-Autumn%20Festival%20with%20mooncakes'
      },
      {
        id: `item-${this.nextItemId++}`,
        text: '中国传统节日，赏月、吃月饼是主要习俗',
        category: '传统节日',
        culturalTheme: '中国传统文化'
      }
    ];
    
    // 创建配对对
    this.pairs = [
      // 天津文化配对对
      {
        id: `pair-${this.nextPairId++}`,
        item1: items[0],
        item2: items[1],
        relationship: '是'
      },
      {
        id: `pair-${this.nextPairId++}`,
        item1: items[2],
        item2: items[3],
        relationship: '是'
      },
      {
        id: `pair-${this.nextPairId++}`,
        item1: items[4],
        item2: items[5],
        relationship: '是'
      },
      {
        id: `pair-${this.nextPairId++}`,
        item1: items[6],
        item2: items[7],
        relationship: '是'
      },
      
      // 中国传统文化配对对
      {
        id: `pair-${this.nextPairId++}`,
        item1: items[8],
        item2: items[9],
        relationship: '是'
      },
      {
        id: `pair-${this.nextPairId++}`,
        item1: items[10],
        item2: items[11],
        relationship: '是'
      },
      {
        id: `pair-${this.nextPairId++}`,
        item1: items[12],
        item2: items[13],
        relationship: '是'
      },
      {
        id: `pair-${this.nextPairId++}`,
        item1: items[14],
        item2: items[15],
        relationship: '是'
      },
      {
        id: `pair-${this.nextPairId++}`,
        item1: items[16],
        item2: items[17],
        relationship: '是'
      }
    ];
  }

  // 初始化关卡数据
  private initLevels(): void {
    // 为每个关卡分配配对对
    this.levels = [
      {
        id: `level-${this.nextLevelId++}`,
        name: '天津文化配对',
        description: '了解天津文化元素及其特点，将相关元素进行配对',
        pairs: this.pairs.slice(0, 4), // 天津文化相关配对对
        difficulty: 'easy',
        reward: '解锁天津文化配对素材包',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20cultural%20pair%20matching%20game'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '中国传统文化配对',
        description: '了解中国传统文化元素及其特点，将相关元素进行配对',
        pairs: this.pairs.slice(4, 9), // 中国传统文化相关配对对
        difficulty: 'medium',
        unlockCondition: { type: 'level', value: 1 },
        reward: '解锁中国传统文化配对素材包',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20cultural%20pair%20matching%20game'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '文化配对大挑战',
        description: '挑战更复杂的文化元素配对，涵盖天津和中国传统文化',
        pairs: this.pairs,
        difficulty: 'hard',
        unlockCondition: { type: 'level', value: 2 },
        timeLimit: 300,
        reward: '解锁高级文化配对素材包',
        culturalTheme: '综合文化知识',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Cultural%20pair%20matching%20challenge'
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

  // 获取所有配对对
  getPairs(): Pair[] {
    return [...this.pairs];
  }

  // 根据ID获取配对对
  getPairById(pairId: string): Pair | undefined {
    return this.pairs.find(pair => pair.id === pairId);
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

  // 检查配对是否正确
  checkPairMatch(item1Id: string, item2Id: string, pairs: Pair[]): boolean {
    // 查找是否存在这样的配对
    return pairs.some(pair => 
      (pair.item1.id === item1Id && pair.item2.id === item2Id) || 
      (pair.item1.id === item2Id && pair.item2.id === item1Id)
    );
  }

  // 计算关卡得分
  calculateLevelScore(
    matchedPairs: number,
    totalPairs: number,
    timeTaken: number,
    difficulty: string
  ): number {
    const accuracy = matchedPairs / totalPairs;
    const baseScore = Math.round(100 * accuracy);
    
    // 时间奖励（根据难度调整）
    const timeBonusMultiplier = {
      easy: 0.3,
      medium: 0.5,
      hard: 0.8
    }[difficulty as 'easy' | 'medium' | 'hard'] || 0.5;
    
    // 假设关卡预期完成时间为每个配对对30秒
    const expectedTime = totalPairs * 30;
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
const culturalPairMatchingGameService = new CulturalPairMatchingGameService();

export default culturalPairMatchingGameService;