// 文化词汇接龙游戏服务，用于管理游戏关卡和词汇数据

// 词汇类型定义
export interface Word {
  id: string;           // 词汇唯一标识
  word: string;         // 词汇
  pinyin: string;       // 拼音
  meaning: string;      // 释义
  culturalTheme: string;  // 文化主题
  category: string;     // 分类（如：天津文化、传统艺术等）
  example?: string;     // 例句（可选）
}

// 游戏关卡类型定义
export interface Level {
  id: string;           // 关卡唯一标识
  name: string;         // 关卡名称
  description: string;  // 关卡描述
  words: Word[];        // 关卡包含的词汇
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

// 文化词汇接龙游戏服务类
class CulturalWordChainGameService {
  private words: Word[] = [];
  private levels: Level[] = [];
  private gameProgress: Map<string, GameProgress> = new Map();
  private nextWordId = 1;
  private nextLevelId = 1;

  constructor() {
    this.initWords();
    this.initLevels();
  }

  // 初始化词汇数据
  private initWords(): void {
    this.words = [
      // 天津文化主题词汇
      {
        id: `word-${this.nextWordId++}`,
        word: '天津',
        pinyin: 'tiān jīn',
        meaning: '中国四大直辖市之一，位于华北平原东北部',
        culturalTheme: '天津地方文化',
        category: '地理'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '津门',
        pinyin: 'jīn mén',
        meaning: '天津的别称',
        culturalTheme: '天津地方文化',
        category: '地理'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '门脸',
        pinyin: 'mén liǎn',
        meaning: '天津方言，指店铺的门面',
        culturalTheme: '天津地方文化',
        category: '方言'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '脸谱',
        pinyin: 'liǎn pǔ',
        meaning: '戏曲演员面部化妆的谱式',
        culturalTheme: '中国传统文化',
        category: '传统艺术'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '谱曲',
        pinyin: 'pǔ qǔ',
        meaning: '为歌词配上曲子',
        culturalTheme: '中国传统文化',
        category: '传统艺术'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '曲艺',
        pinyin: 'qǔ yì',
        meaning: '中国传统的说唱艺术',
        culturalTheme: '中国传统文化',
        category: '传统艺术'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '艺术',
        pinyin: 'yì shù',
        meaning: '用形象来反映现实但比现实有典型性的社会意识形态',
        culturalTheme: '中国传统文化',
        category: '传统艺术'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '术语',
        pinyin: 'shù yǔ',
        meaning: '各门学科中用以表示严格规定的意义的专门用语',
        culturalTheme: '中国传统文化',
        category: '文化常识'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '语文',
        pinyin: 'yǔ wén',
        meaning: '语言和文学的简称',
        culturalTheme: '中国传统文化',
        category: '文化常识'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '文学',
        pinyin: 'wén xué',
        meaning: '以语言文字为工具形象化地反映客观现实的艺术',
        culturalTheme: '中国传统文化',
        category: '传统文学'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '学问',
        pinyin: 'xué wèn',
        meaning: '系统的知识',
        culturalTheme: '中国传统文化',
        category: '文化常识'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '问题',
        pinyin: 'wèn tí',
        meaning: '要求回答或解释的题目',
        culturalTheme: '中国传统文化',
        category: '文化常识'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '题材',
        pinyin: 'tí cái',
        meaning: '构成文学和艺术作品的材料',
        culturalTheme: '中国传统文化',
        category: '传统文学'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '才子',
        pinyin: 'cái zǐ',
        meaning: '指有才华的男子',
        culturalTheme: '中国传统文化',
        category: '历史人物'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '子孙',
        pinyin: 'zǐ sūn',
        meaning: '儿子和孙子，泛指后代',
        culturalTheme: '中国传统文化',
        category: '文化常识'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '孙女',
        pinyin: 'sūn nǚ',
        meaning: '儿子的女儿',
        culturalTheme: '中国传统文化',
        category: '文化常识'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '女儿',
        pinyin: 'nǚ ér',
        meaning: '女孩子',
        culturalTheme: '中国传统文化',
        category: '文化常识'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '儿歌',
        pinyin: 'ér gē',
        meaning: '为儿童创作的歌曲',
        culturalTheme: '中国传统文化',
        category: '传统艺术'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '歌唱',
        pinyin: 'gē chàng',
        meaning: '用唱歌、朗诵等形式颂扬',
        culturalTheme: '中国传统文化',
        category: '传统艺术'
      },
      {
        id: `word-${this.nextWordId++}`,
        word: '唱戏',
        pinyin: 'chàng xì',
        meaning: '表演戏曲',
        culturalTheme: '中国传统文化',
        category: '传统艺术'
      }
    ];
  }

  // 初始化关卡数据
  private initLevels(): void {
    // 为每个关卡分配词汇
    this.levels = [
      {
        id: `level-${this.nextLevelId++}`,
        name: '文化入门接龙',
        description: '了解基本的文化词汇，进行简单的接龙游戏',
        words: this.words.slice(0, 10),
        difficulty: 'easy',
        reward: '解锁文化词汇素材包',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20cultural%20word%20chain%20game'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '天津文化接龙',
        description: '学习天津文化相关词汇，进行接龙游戏',
        words: this.words.slice(0, 5).concat(this.words.slice(15, 20)),
        difficulty: 'medium',
        unlockCondition: { type: 'level', value: 1 },
        reward: '解锁天津文化词汇素材包',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20cultural%20word%20chain%20game'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '文化词汇挑战',
        description: '挑战更复杂的文化词汇接龙',
        words: this.words,
        difficulty: 'hard',
        unlockCondition: { type: 'level', value: 2 },
        timeLimit: 300,
        reward: '解锁高级文化词汇素材包',
        culturalTheme: '综合文化知识',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20cultural%20word%20chain%20challenge'
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

  // 获取所有词汇
  getWords(): Word[] {
    return [...this.words];
  }

  // 根据ID获取词汇
  getWordById(wordId: string): Word | undefined {
    return this.words.find(word => word.id === wordId);
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

  // 检查词汇接龙是否有效
  checkWordChain(previousWord: string, currentWord: string): boolean {
    if (!previousWord || !currentWord) {
      return false;
    }
    return previousWord.slice(-1) === currentWord.slice(0, 1);
  }

  // 检查词汇是否在关卡词汇列表中
  isWordInLevel(word: string, level: Level): boolean {
    return level.words.some(w => w.word === word);
  }

  // 计算关卡得分
  calculateLevelScore(
    chainLength: number, 
    timeTaken: number, 
    difficulty: string
  ): number {
    // 基础得分：根据接龙长度计算
    const baseScore = chainLength * 10;
    
    // 时间奖励（根据难度调整）
    const timeBonusMultiplier = {
      easy: 0.3,
      medium: 0.5,
      hard: 0.8
    }[difficulty as 'easy' | 'medium' | 'hard'] || 0.5;
    
    // 假设关卡预期完成时间为每题20秒
    const expectedTime = chainLength * 20;
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
const culturalWordChainGameService = new CulturalWordChainGameService();

export default culturalWordChainGameService;