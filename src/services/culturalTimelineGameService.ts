// 文化时间轴游戏服务，用于管理游戏关卡和事件数据

// 时间轴事件类型定义
export interface TimelineEvent {
  id: string;           // 事件唯一标识
  title: string;        // 事件标题
  year: number;         // 年份
  description: string;  // 事件描述
  category: string;     // 分类（如：天津文化、历史事件等）
  imageUrl?: string;    // 事件图片（可选）
  culturalTheme: string;  // 文化主题
}

// 游戏关卡类型定义
export interface Level {
  id: string;           // 关卡唯一标识
  name: string;         // 关卡名称
  description: string;  // 关卡描述
  events: TimelineEvent[];  // 关卡包含的事件
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

// 文化时间轴游戏服务类
class CulturalTimelineGameService {
  private events: TimelineEvent[] = [];
  private levels: Level[] = [];
  private gameProgress: Map<string, GameProgress> = new Map();
  private nextEventId = 1;
  private nextLevelId = 1;

  constructor() {
    this.initEvents();
    this.initLevels();
  }

  // 初始化事件数据
  private initEvents(): void {
    this.events = [
      // 天津文化相关事件
      {
        id: `event-${this.nextEventId++}`,
        title: '天津开埠',
        year: 1860,
        description: '天津成为中国北方最早开放的通商口岸之一，设立了英、法、美等九国租界，对天津的经济、文化产生了深远影响。',
        category: '天津历史',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Tianjin%20treaty%20port%20in%201860'
      },
      {
        id: `event-${this.nextEventId++}`,
        title: '天津卫设立',
        year: 1404,
        description: '明成祖朱棣下令设立天津卫，意为"天子经过的渡口"，天津正式建城。',
        category: '天津历史',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Tianjin%20wei%20establishment%20in%201404'
      },
      {
        id: `event-${this.nextEventId++}`,
        title: '天津大学成立',
        year: 1895,
        description: '天津大学前身北洋大学成立，是中国第一所现代大学。',
        category: '天津教育',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Tianjin%20University%20founded%20in%201895'
      },
      {
        id: `event-${this.nextEventId++}`,
        title: '杨柳青年画兴起',
        year: 1726,
        description: '杨柳青年画在天津杨柳青镇兴起，成为中国著名的民间木版年画之一。',
        category: '天津民间艺术',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Yangliuqing%20New%20Year%20paintings'
      },
      {
        id: `event-${this.nextEventId++}`,
        title: '泥人张彩塑诞生',
        year: 1844,
        description: '天津泥人张彩塑艺术由张明山创立，成为中国著名的民间泥塑艺术。',
        category: '天津民间艺术',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Niren%20Zhang%20clay%20sculptures'
      },
      
      // 中国传统文化相关事件
      {
        id: `event-${this.nextEventId++}`,
        title: '四大发明完成',
        year: 1300,
        description: '中国古代四大发明（造纸术、印刷术、火药、指南针）在宋元时期基本完成，对世界文明发展产生了深远影响。',
        category: '中国科技',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Four%20Great%20Inventions%20of%20ancient%20China'
      },
      {
        id: `event-${this.nextEventId++}`,
        title: '孔子诞生',
        year: -551,
        description: '儒家学派创始人孔子诞生，其思想对中国乃至东亚文化产生了深远影响。',
        category: '中国哲学',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Confucius%20birth'
      },
      {
        id: `event-${this.nextEventId++}`,
        title: '京剧形成',
        year: 1790,
        description: '京剧在乾隆年间形成，融合了徽剧、汉剧等多种戏曲元素，成为中国的国粹。',
        category: '中国传统艺术',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Beijing%20Opera%20formation'
      },
      {
        id: `event-${this.nextEventId++}`,
        title: '敦煌莫高窟开凿',
        year: 366,
        description: '敦煌莫高窟开始开凿，历经多个朝代的修建，成为世界上现存规模最大、内容最丰富的佛教艺术地。',
        category: '中国佛教艺术',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Dunhuang%20Mogao%20Caves'
      },
      {
        id: `event-${this.nextEventId++}`,
        title: '《红楼梦》成书',
        year: 1791,
        description: '中国古典四大名著之一《红楼梦》正式出版，成为中国文学史上的巅峰之作。',
        category: '中国文学',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Dream%20of%20the%20Red%20Chamber'
      },
      {
        id: `event-${this.nextEventId++}`,
        title: '兵马俑发现',
        year: 1974,
        description: '秦始皇兵马俑在陕西西安被发现，被誉为"世界第八大奇迹"。',
        category: '中国考古',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Terracotta%20Army%20discovery'
      },
      {
        id: `event-${this.nextEventId++}`,
        title: '指南针应用于航海',
        year: 1100,
        description: '指南针开始广泛应用于航海，促进了中国古代航海事业的发展和海上丝绸之路的繁荣。',
        category: '中国科技',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x768&prompt=Compass%20used%20in%20navigation'
      }
    ];
  }

  // 初始化关卡数据
  private initLevels(): void {
    // 为每个关卡分配事件
    this.levels = [
      {
        id: `level-${this.nextLevelId++}`,
        name: '天津文化时间轴',
        description: '了解天津历史上的重要文化事件，按照时间顺序排列',
        events: this.events.slice(0, 5), // 天津文化相关事件
        difficulty: 'easy',
        reward: '解锁天津文化时间轴素材包',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20cultural%20timeline%20game'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '中国传统文化时间轴',
        description: '了解中国历史上的重要文化事件，按照时间顺序排列',
        events: this.events.slice(5, 10), // 中国传统文化相关事件
        difficulty: 'medium',
        unlockCondition: { type: 'level', value: 1 },
        reward: '解锁中国传统文化时间轴素材包',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20cultural%20timeline%20game'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '文化事件大挑战',
        description: '挑战更复杂的文化事件时间排序，涵盖天津和中国传统文化',
        events: this.events,
        difficulty: 'hard',
        unlockCondition: { type: 'level', value: 2 },
        timeLimit: 300,
        reward: '解锁高级文化时间轴素材包',
        culturalTheme: '综合文化知识',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Cultural%20events%20timeline%20challenge'
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

  // 获取所有事件
  getEvents(): TimelineEvent[] {
    return [...this.events];
  }

  // 根据ID获取事件
  getEventById(eventId: string): TimelineEvent | undefined {
    return this.events.find(event => event.id === eventId);
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

  // 检查时间轴顺序是否正确
  checkTimelineOrder(sortedEvents: TimelineEvent[], correctEvents: TimelineEvent[]): boolean {
    // 检查事件顺序是否与正确顺序一致
    for (let i = 0; i < sortedEvents.length; i++) {
      if (sortedEvents[i].id !== correctEvents[i].id) {
        return false;
      }
    }
    return true;
  }

  // 计算关卡得分
  calculateLevelScore(
    isCorrect: boolean,
    timeTaken: number,
    difficulty: string
  ): number {
    if (!isCorrect) {
      return 0;
    }
    
    const baseScore = 100;
    
    // 时间奖励（根据难度调整）
    const timeBonusMultiplier = {
      easy: 0.3,
      medium: 0.5,
      hard: 0.8
    }[difficulty as 'easy' | 'medium' | 'hard'] || 0.5;
    
    // 假设关卡预期完成时间为每个事件30秒
    const expectedTime = 30;
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
const culturalTimelineGameService = new CulturalTimelineGameService();

export default culturalTimelineGameService;