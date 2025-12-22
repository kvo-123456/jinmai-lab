// 文化记忆游戏服务，用于管理游戏关卡和卡片数据
import { gameStorage } from '@/utils/gameStorage';

// 记忆卡片类型定义
export interface MemoryCard {
  id: string;           // 卡片唯一标识
  pairId: string;       // 配对ID，用于标识成对的卡片
  name: string;         // 文化元素名称
  description: string;  // 文化元素描述
  imageUrl: string;     // 卡片图片URL
  culturalTheme: string;  // 文化主题
  category: string;     // 分类
  isFlipped: boolean;   // 是否已翻转
  isMatched: boolean;   // 是否已配对成功
  isSelected: boolean;  // 是否被选中
}

// 记忆游戏关卡类型定义
export interface MemoryLevel {
  id: string;           // 关卡唯一标识
  name: string;         // 关卡名称
  description: string;  // 关卡描述
  cards: MemoryCard[];  // 关卡包含的卡片列表（成对）
  gridSize: {
    rows: number;       // 行数
    cols: number;       // 列数
  };
  difficulty: 'easy' | 'medium' | 'hard';  // 难度级别
  timeLimit?: number;   // 时间限制（秒，可选）
  unlockCondition?: {
    type: 'score' | 'level';  // 条件类型
    value: number;      // 条件值
  };
  reward: string;       // 通关奖励
  culturalTheme: string;  // 文化主题
  imageUrl?: string;    // 关卡封面图（可选）
}

// 记忆游戏进度类型定义
export interface MemoryGameProgress {
  userId: string;       // 用户ID
  completedLevels: string[];  // 已完成关卡
  totalScore: number;   // 总得分
  levelScores: Record<string, number>;  // 各关卡得分
  bestTimes: Record<string, number>;  // 各关卡最佳时间（秒）
  lastPlayed: Date;     // 最后游戏时间
}

// 文化记忆游戏服务类
class CulturalMemoryGameService {
  private cardDatabase: MemoryCard[] = [];
  private levels: MemoryLevel[] = [];
  private gameProgress: Map<string, MemoryGameProgress> = new Map();
  private nextCardId = 1;
  private nextLevelId = 1;

  constructor() {
    this.initCardDatabase();
    this.initLevels();
    this.loadGameProgress();
  }

  // 初始化卡片数据库
  private initCardDatabase(): void {
    const culturalElements = [
      // 天津文化元素
      {
        name: '天津之眼',
        description: '天津标志性建筑，是世界上唯一一个桥上瞰景摩天轮。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Tianjin%20Eye%20ferris%20wheel%20night%20view',
        culturalTheme: '天津地方文化',
        category: '地标建筑'
      },
      {
        name: '杨柳青年画',
        description: '中国著名的民间木版年画，源于天津杨柳青镇。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Yangliuqing%20New%20Year%20paintings%20traditional%20Chinese%20folk%20art',
        culturalTheme: '天津地方文化',
        category: '传统艺术'
      },
      {
        name: '泥人张彩塑',
        description: '天津传统民间艺术，以泥塑造各种人物形象。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Nirenzhang%20clay%20sculptures%20traditional%20Tianjin%20art',
        culturalTheme: '天津地方文化',
        category: '传统工艺'
      },
      {
        name: '狗不理包子',
        description: '天津传统名吃，以皮薄馅大、味道鲜美著称。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Goubuli%20steamed%20buns%20traditional%20Tianjin%20food',
        culturalTheme: '天津地方文化',
        category: '传统美食'
      },
      {
        name: '天津相声',
        description: '中国北方传统曲艺形式，天津是相声的重要发源地。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Tianjin%20cross-talk%20traditional%20Chinese%20comedy',
        culturalTheme: '天津地方文化',
        category: '传统曲艺'
      },
      {
        name: '瓷房子',
        description: '天津特色建筑，用数万件古董瓷器装饰而成。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Porcelain%20House%20Tianjin%20China%20unique%20architecture',
        culturalTheme: '天津地方文化',
        category: '特色建筑'
      },
      {
        name: '古文化街',
        description: '天津著名的文化旅游街区，展示传统民俗文化。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Tianjin%20Ancient%20Culture%20Street%20traditional%20architecture',
        culturalTheme: '天津地方文化',
        category: '文化街区'
      },
      {
        name: '麻花',
        description: '天津传统小吃，酥脆香甜，造型独特。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Tianjin%20twisted%20dough%20sticks%20traditional%20snack',
        culturalTheme: '天津地方文化',
        category: '传统美食'
      },
      // 中国传统文化元素
      {
        name: '京剧脸谱',
        description: '京剧艺术中的重要元素，通过不同颜色和图案表达人物性格。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Peking%20Opera%20facial%20makeup%20traditional%20Chinese%20art',
        culturalTheme: '中国传统文化',
        category: '传统艺术'
      },
      {
        name: '故宫',
        description: '中国明清两代的皇家宫殿，世界上现存规模最大、保存最为完整的木质结构古建筑之一。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Forbidden%20City%20Beijing%20China%20ancient%20palace',
        culturalTheme: '中国传统文化',
        category: '历史建筑'
      },
      {
        name: '长城',
        description: '中国古代的军事防御工程，是世界七大奇迹之一。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Great%20Wall%20of%20China%20mountain%20scenery',
        culturalTheme: '中国传统文化',
        category: '历史遗迹'
      },
      {
        name: '兵马俑',
        description: '秦始皇陵中的陶俑群，被誉为"世界第八大奇迹"。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Terracotta%20Army%20Xi%27an%20China%20ancient%20sculptures',
        culturalTheme: '中国传统文化',
        category: '历史文物'
      },
      {
        name: '青花瓷',
        description: '中国传统瓷器工艺，以白地蓝花为主要特征。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Blue%20and%20white%20porcelain%20traditional%20Chinese%20craft',
        culturalTheme: '中国传统文化',
        category: '传统工艺'
      },
      {
        name: '书法',
        description: '中国特有的传统艺术，通过汉字的书写表现美感。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Chinese%20calligraphy%20traditional%20art%20brush%20writing',
        culturalTheme: '中国传统文化',
        category: '传统艺术'
      },
      {
        name: '剪纸',
        description: '中国传统民间艺术，用剪刀或刻刀在纸上剪刻图案。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Chinese%20paper%20cutting%20traditional%20folk%20art',
        culturalTheme: '中国传统文化',
        category: '传统工艺'
      },
      {
        name: '中国结',
        description: '中国传统手工艺品，象征着团结、幸福和吉祥。',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Chinese%20knot%20traditional%20decoration%20red%20thread',
        culturalTheme: '中国传统文化',
        category: '传统工艺'
      }
    ];

    // 为每个文化元素创建成对的卡片
    culturalElements.forEach(element => {
      const pairId = `pair-${this.nextCardId}`;
      
      // 创建成对的卡片
      for (let i = 0; i < 2; i++) {
        this.cardDatabase.push({
          id: `card-${this.nextCardId}-${i + 1}`,
          pairId,
          name: element.name,
          description: element.description,
          imageUrl: element.imageUrl,
          culturalTheme: element.culturalTheme,
          category: element.category,
          isFlipped: false,
          isMatched: false,
          isSelected: false
        });
      }
      
      this.nextCardId++;
    });
  }

  // 初始化关卡数据
  private initLevels(): void {
    // 简单难度：4x4网格，8对卡片
    const easyCards = this.getShuffledCards(8);
    
    // 中等难度：6x6网格，12对卡片（减少到可用数量）
    const mediumCards = this.getShuffledCards(12);
    
    // 困难难度：8x8网格，16对卡片（减少到可用数量）
    const hardCards = this.getShuffledCards(16);

    this.levels = [
      {
        id: `memory-level-${this.nextLevelId++}`,
        name: '文化记忆入门',
        description: '了解天津和中国传统文化的基本元素',
        cards: easyCards,
        gridSize: { rows: 4, cols: 4 },
        difficulty: 'easy',
        timeLimit: 180, // 3分钟
        reward: '解锁文化记忆入门徽章',
        culturalTheme: '综合文化知识',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Memory%20game%20easy%20level%20cultural%20elements'
      },
      {
        id: `memory-level-${this.nextLevelId++}`,
        name: '文化记忆挑战',
        description: '挑战你的文化记忆能力，识别更多文化元素',
        cards: mediumCards,
        gridSize: { rows: 6, cols: 6 },
        difficulty: 'medium',
        unlockCondition: { type: 'level', value: 1 },
        timeLimit: 300, // 5分钟
        reward: '解锁文化记忆挑战徽章',
        culturalTheme: '综合文化知识',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Memory%20game%20medium%20level%20cultural%20elements'
      },
      {
        id: `memory-level-${this.nextLevelId++}`,
        name: '文化记忆大师',
        description: '成为文化记忆大师，挑战最难的记忆关卡',
        cards: hardCards,
        gridSize: { rows: 8, cols: 8 },
        difficulty: 'hard',
        unlockCondition: { type: 'level', value: 2 },
        timeLimit: 600, // 10分钟
        reward: '解锁文化记忆大师徽章',
        culturalTheme: '综合文化知识',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Memory%20game%20hard%20level%20cultural%20elements'
      }
    ];
  }

  // 获取随机打乱的卡片列表
  private getShuffledCards(pairCount: number): MemoryCard[] {
    // 计算可用的最大卡片对数量
    const availablePairs = this.nextCardId - 1;
    const actualPairCount = Math.min(pairCount, availablePairs);
    
    // 从数据库中选择指定数量的卡片对
    const allPairIds = Array.from({ length: availablePairs }, (_, i) => `pair-${i + 1}`);
    const shuffledPairIds = this.shuffleArray(allPairIds);
    const selectedPairs = new Set(shuffledPairIds.slice(0, actualPairCount));

    // 获取选中的卡片并打乱顺序
    const selectedCards = this.cardDatabase.filter(card => selectedPairs.has(card.pairId));
    const shuffledCards = this.shuffleArray([...selectedCards]);

    // 重置卡片状态
    return shuffledCards.map(card => ({
      ...card,
      isFlipped: false,
      isMatched: false,
      isSelected: false
    }));
  }

  // 打乱数组顺序
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 获取所有关卡
  getLevels(): MemoryLevel[] {
    return [...this.levels];
  }

  // 根据ID获取关卡
  getLevelById(levelId: string): MemoryLevel | undefined {
    return this.levels.find(level => level.id === levelId);
  }

  // 获取关卡的卡片（返回副本，避免直接修改原始数据）
  getLevelCards(levelId: string): MemoryCard[] | undefined {
    const level = this.getLevelById(levelId);
    if (!level) return undefined;
    return JSON.parse(JSON.stringify(level.cards));
  }

  // 加载游戏进度
  private loadGameProgress(): void {
    const savedProgress = gameStorage.load<Map<string, MemoryGameProgress>>("memory_game_progress", new Map());
    if (savedProgress instanceof Map) {
      this.gameProgress = savedProgress;
    } else {
      // 兼容旧格式
      this.gameProgress = new Map(Object.entries(savedProgress || {}));
    }
  }

  // 保存游戏进度
  private saveGameProgress(): void {
    // 转换Map为普通对象以便存储
    const progressObj = Object.fromEntries(this.gameProgress.entries());
    gameStorage.save("memory_game_progress", progressObj);
  }

  // 获取用户游戏进度
  getGameProgress(userId: string): MemoryGameProgress {
    if (!this.gameProgress.has(userId)) {
      const progress: MemoryGameProgress = {
        userId,
        completedLevels: [],
        totalScore: 0,
        levelScores: {},
        bestTimes: {},
        lastPlayed: new Date()
      };
      this.gameProgress.set(userId, progress);
      this.saveGameProgress();
    }
    return this.gameProgress.get(userId)!;
  }

  // 更新用户游戏进度
  updateGameProgress(userId: string, progress: Partial<MemoryGameProgress>): MemoryGameProgress {
    const currentProgress = this.getGameProgress(userId);
    const updatedProgress: MemoryGameProgress = {
      ...currentProgress,
      ...progress,
      lastPlayed: new Date()
    };
    this.gameProgress.set(userId, updatedProgress);
    this.saveGameProgress();
    return updatedProgress;
  }

  // 计算游戏得分
  calculateScore(
    pairsFound: number,
    totalPairs: number,
    timeTaken: number,
    difficulty: 'easy' | 'medium' | 'hard'
  ): number {
    // 基础得分基于配对成功率
    const accuracy = pairsFound / totalPairs;
    const baseScore = Math.round(1000 * accuracy);

    // 时间奖励（根据难度调整）
    const timeBonusMultiplier = {
      easy: 0.5,
      medium: 1.0,
      hard: 1.5
    }[difficulty];

    // 假设每个配对的理想时间（秒）
    const idealTimePerPair = {
      easy: 10,
      medium: 8,
      hard: 6
    }[difficulty];

    const idealTotalTime = totalPairs * idealTimePerPair;
    const timeBonus = Math.max(0, idealTotalTime - timeTaken) * timeBonusMultiplier;

    // 难度系数
    const difficultyMultiplier = {
      easy: 1.0,
      medium: 1.5,
      hard: 2.0
    }[difficulty];

    return Math.round((baseScore + timeBonus) * difficultyMultiplier);
  }

  // 完成关卡
  completeLevel(
    userId: string,
    levelId: string,
    score: number,
    timeTaken: number
  ): MemoryGameProgress {
    const progress = this.getGameProgress(userId);
    const level = this.getLevelById(levelId);
    if (!level) return progress;

    // 更新最佳时间
    const updatedBestTimes = {
      ...progress.bestTimes
    };

    if (!updatedBestTimes[levelId] || timeTaken < updatedBestTimes[levelId]) {
      updatedBestTimes[levelId] = timeTaken;
    }

    // 更新进度
    const updatedProgress: MemoryGameProgress = {
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
    this.saveGameProgress();
    return updatedProgress;
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
const culturalMemoryGameService = new CulturalMemoryGameService();

export default culturalMemoryGameService;