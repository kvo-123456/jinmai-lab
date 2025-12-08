// 文化元素排序游戏服务，用于管理游戏关卡和题目数据

// 排序项类型定义
export interface SortItem {
  id: string;           // 排序项唯一标识
  name: string;         // 排序项名称
  content: string;      // 排序项内容
  sortValue: number;    // 排序值（用于确定正确顺序）
  description: string;  // 排序项描述
  imageUrl?: string;    // 排序项图片（可选）
  culturalTheme: string;  // 文化主题
  category: string;     // 分类（如：天津文化、传统艺术等）
}

// 排序题目类型定义
export interface SortQuestion {
  id: string;           // 题目唯一标识
  title: string;        // 题目标题
  description: string;  // 题目描述
  items: SortItem[];    // 排序项列表
  sortType: 'asc' | 'desc';  // 排序类型：升序或降序
  explanation: string;  // 答案解析
  culturalTheme: string;  // 文化主题
  category: string;     // 分类
}

// 游戏关卡类型定义
export interface SortLevel {
  id: string;           // 关卡唯一标识
  name: string;         // 关卡名称
  description: string;  // 关卡描述
  questions: SortQuestion[];  // 关卡包含的题目
  gridSize: {
    rows: number;
    cols: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';  // 难度级别
  timeLimit?: number;   // 时间限制（秒，可选）
  unlockCondition?: {
    type: 'score' | 'level';
    value: number;
  };
  reward: string;       // 通关奖励
  culturalTheme: string;  // 文化主题
  imageUrl?: string;    // 关卡封面图（可选）
}

// 游戏进度类型定义
export interface SortGameProgress {
  userId: string;       // 用户ID
  completedLevels: string[];  // 已完成关卡
  totalScore: number;   // 总得分
  levelScores: Record<string, number>;  // 各关卡得分
  unlockedHints: number;  // 可用提示次数
  bestTimes: Record<string, number>;  // 各关卡最佳时间（秒）
  lastPlayed: Date;     // 最后游戏时间
}

// 文化元素排序游戏服务类
class CulturalSortingGameService {
  private sortItems: SortItem[] = [];
  private questions: SortQuestion[] = [];
  private levels: SortLevel[] = [];
  private gameProgress: Map<string, SortGameProgress> = new Map();
  private nextItemId = 1;
  private nextQuestionId = 1;
  private nextLevelId = 1;

  constructor() {
    this.initSortItems();
    this.initQuestions();
    this.initLevels();
  }

  // 初始化排序项数据
  private initSortItems(): void {
    this.sortItems = [
      // 天津地标建筑（按建造时间排序）
      {
        id: `item-${this.nextItemId++}`,
        name: '天津鼓楼',
        content: '天津鼓楼',
        sortValue: 1420,
        description: '天津鼓楼是天津卫的发源地，始建于明永乐十八年（1420年）',
        culturalTheme: '天津地方文化',
        category: '天津建筑'
      },
      {
        id: `item-${this.nextItemId++}`,
        name: '石家大院',
        content: '石家大院',
        sortValue: 1875,
        description: '石家大院是清代津门八大家之一石万程第四子石元士的宅第，始建于1875年',
        culturalTheme: '天津地方文化',
        category: '天津建筑'
      },
      {
        id: `item-${this.nextItemId++}`,
        name: '天津劝业场',
        content: '天津劝业场',
        sortValue: 1928,
        description: '天津劝业场是天津商业的象征，始建于1928年',
        culturalTheme: '天津地方文化',
        category: '天津建筑'
      },
      {
        id: `item-${this.nextItemId++}`,
        name: '天津广播电视塔',
        content: '天津广播电视塔',
        sortValue: 1991,
        description: '天津广播电视塔又称天塔，建成于1991年，是天津的标志性建筑之一',
        culturalTheme: '天津地方文化',
        category: '天津建筑'
      },
      {
        id: `item-${this.nextItemId++}`,
        name: '天津环球金融中心',
        content: '天津环球金融中心',
        sortValue: 2010,
        description: '天津环球金融中心又称津塔，建成于2010年，是天津的摩天大楼',
        culturalTheme: '天津地方文化',
        category: '天津建筑'
      },
      {
        id: `item-${this.nextItemId++}`,
        name: '天津周大福金融中心',
        content: '天津周大福金融中心',
        sortValue: 2019,
        description: '天津周大福金融中心又称津沽棒，建成于2019年，是天津的新地标',
        culturalTheme: '天津地方文化',
        category: '天津建筑'
      },
      
      // 中国传统节日（按农历时间排序）
      {
        id: `item-${this.nextItemId++}`,
        name: '春节',
        content: '春节',
        sortValue: 1,
        description: '春节是中国最重要的传统节日，农历正月初一',
        culturalTheme: '中国传统文化',
        category: '传统节日'
      },
      {
        id: `item-${this.nextItemId++}`,
        name: '元宵节',
        content: '元宵节',
        sortValue: 15,
        description: '元宵节又称上元节，农历正月十五',
        culturalTheme: '中国传统文化',
        category: '传统节日'
      },
      {
        id: `item-${this.nextItemId++}`,
        name: '清明节',
        content: '清明节',
        sortValue: 105,
        description: '清明节是传统祭祖节日，农历三月初五前后',
        culturalTheme: '中国传统文化',
        category: '传统节日'
      },
      {
        id: `item-${this.nextItemId++}`,
        name: '端午节',
        content: '端午节',
        sortValue: 145,
        description: '端午节又称龙舟节，农历五月初五',
        culturalTheme: '中国传统文化',
        category: '传统节日'
      },
      {
        id: `item-${this.nextItemId++}`,
        name: '中秋节',
        content: '中秋节',
        sortValue: 225,
        description: '中秋节是传统团圆节日，农历八月十五',
        culturalTheme: '中国传统文化',
        category: '传统节日'
      },
      {
        id: `item-${this.nextItemId++}`,
        name: '重阳节',
        content: '重阳节',
        sortValue: 255,
        description: '重阳节又称老人节，农历九月初九',
        culturalTheme: '中国传统文化',
        category: '传统节日'
      },
      
      // 中国古代四大发明（按出现时间排序）
      {
        id: `item-${this.nextItemId++}`,
        name: '造纸术',
        content: '造纸术',
        sortValue: 105,
        description: '造纸术由东汉蔡伦改进，约公元105年',
        culturalTheme: '中国传统文化',
        category: '古代发明'
      },
      {
        id: `item-${this.nextItemId++}`,
        name: '印刷术',
        content: '印刷术',
        sortValue: 868,
        description: '雕版印刷术发明于唐朝，约公元868年',
        culturalTheme: '中国传统文化',
        category: '古代发明'
      },
      {
        id: `item-${this.nextItemId++}`,
        name: '火药',
        content: '火药',
        sortValue: 904,
        description: '火药发明于唐朝末年，约公元904年',
        culturalTheme: '中国传统文化',
        category: '古代发明'
      },
      {
        id: `item-${this.nextItemId++}`,
        name: '指南针',
        content: '指南针',
        sortValue: 1044,
        description: '指南针发明于北宋，约公元1044年',
        culturalTheme: '中国传统文化',
        category: '古代发明'
      }
    ];
  }

  // 初始化题目数据
  private initQuestions(): void {
    this.questions = [
      // 天津地标建筑排序
      {
        id: `question-${this.nextQuestionId++}`,
        title: '天津地标建筑时间排序',
        description: '请按照建造时间的先后顺序排列以下天津地标建筑',
        items: this.sortItems.filter(item => item.category === '天津建筑'),
        sortType: 'asc',
        explanation: '天津地标建筑的建造时间顺序反映了天津城市发展的历程，从古代的鼓楼到现代的摩天大楼，见证了天津的繁荣发展。',
        culturalTheme: '天津地方文化',
        category: '天津建筑'
      },
      
      // 中国传统节日排序
      {
        id: `question-${this.nextQuestionId++}`,
        title: '中国传统节日时间排序',
        description: '请按照农历时间的先后顺序排列以下中国传统节日',
        items: this.sortItems.filter(item => item.category === '传统节日'),
        sortType: 'asc',
        explanation: '中国传统节日按照农历时间顺序排列，反映了中国传统文化中对自然节律的观察和尊重。',
        culturalTheme: '中国传统文化',
        category: '传统节日'
      },
      
      // 中国古代四大发明排序
      {
        id: `question-${this.nextQuestionId++}`,
        title: '中国古代四大发明时间排序',
        description: '请按照发明时间的先后顺序排列以下中国古代四大发明',
        items: this.sortItems.filter(item => item.category === '古代发明'),
        sortType: 'asc',
        explanation: '中国古代四大发明的出现时间顺序，展示了中国古代科技发展的脉络和成就。',
        culturalTheme: '中国传统文化',
        category: '古代发明'
      }
    ];
  }

  // 初始化关卡数据
  private initLevels(): void {
    this.levels = [
      {
        id: `level-${this.nextLevelId++}`,
        name: '天津建筑时间线',
        description: '了解天津地标建筑的建造时间顺序',
        questions: [this.questions[0]],
        gridSize: { rows: 4, cols: 4 },
        difficulty: 'easy',
        reward: '解锁天津建筑素材包',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20landmark%20buildings%20skyline'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '中国传统节日',
        description: '了解中国传统节日的时间顺序',
        questions: [this.questions[1]],
        gridSize: { rows: 4, cols: 4 },
        difficulty: 'medium',
        unlockCondition: { type: 'level', value: 1 },
        reward: '解锁中国传统节日素材包',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20traditional%20festivals%20collection'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '中国古代发明',
        description: '了解中国古代四大发明的时间顺序',
        questions: [this.questions[2]],
        gridSize: { rows: 4, cols: 4 },
        difficulty: 'hard',
        unlockCondition: { type: 'level', value: 2 },
        reward: '解锁中国古代发明素材包',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20ancient%20inventions'
      }
    ];
  }

  // 获取所有关卡
  getLevels(): SortLevel[] {
    return [...this.levels];
  }

  // 根据ID获取关卡
  getLevelById(levelId: string): SortLevel | undefined {
    return this.levels.find(level => level.id === levelId);
  }

  // 获取所有题目
  getQuestions(): SortQuestion[] {
    return [...this.questions];
  }

  // 根据ID获取题目
  getQuestionById(questionId: string): SortQuestion | undefined {
    return this.questions.find(question => question.id === questionId);
  }

  // 获取用户游戏进度
  getGameProgress(userId: string): SortGameProgress {
    if (!this.gameProgress.has(userId)) {
      const progress: SortGameProgress = {
        userId,
        completedLevels: [],
        totalScore: 0,
        levelScores: {},
        unlockedHints: 3,
        bestTimes: {},
        lastPlayed: new Date()
      };
      this.gameProgress.set(userId, progress);
    }
    return this.gameProgress.get(userId)!;
  }

  // 更新用户游戏进度
  updateGameProgress(userId: string, progress: Partial<SortGameProgress>): SortGameProgress {
    const currentProgress = this.getGameProgress(userId);
    const updatedProgress: SortGameProgress = {
      ...currentProgress,
      ...progress,
      lastPlayed: new Date()
    };
    this.gameProgress.set(userId, updatedProgress);
    return updatedProgress;
  }

  // 检查排序是否正确
  checkSort(question: SortQuestion, sortedItems: SortItem[]): boolean {
    // 首先检查排序项数量是否正确
    if (sortedItems.length !== question.items.length) {
      return false;
    }

    // 检查排序顺序是否正确
    for (let i = 0; i < sortedItems.length - 1; i++) {
      const current = sortedItems[i];
      const next = sortedItems[i + 1];
      
      if (question.sortType === 'asc') {
        if (current.sortValue > next.sortValue) {
          return false;
        }
      } else {
        if (current.sortValue < next.sortValue) {
          return false;
        }
      }
    }

    return true;
  }

  // 计算题目得分
  calculateQuestionScore(question: SortQuestion, isCorrect: boolean, timeTaken?: number): number {
    const baseScore = 100;
    let score = 0;
    
    if (isCorrect) {
      score = baseScore;
      
      // 时间奖励
      if (timeTaken && timeTaken < 30) {
        score += 20;
      } else if (timeTaken && timeTaken < 60) {
        score += 10;
      }
    }
    
    return score;
  }

  // 计算关卡得分
  calculateLevelScore(
    correctCount: number, 
    totalCount: number, 
    timeTaken: number, 
    difficulty: string
  ): number {
    const accuracy = correctCount / totalCount;
    const baseScore = Math.round(100 * accuracy);
    
    // 时间奖励（根据难度调整）
    const timeBonusMultiplier = {
      easy: 0.3,
      medium: 0.5,
      hard: 0.8
    }[difficulty as 'easy' | 'medium' | 'hard'] || 0.5;
    
    // 假设关卡预期完成时间为每题60秒
    const expectedTime = totalCount * 60;
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
  ): SortGameProgress {
    const progress = this.getGameProgress(userId);
    
    // 更新最佳时间
    const updatedBestTimes = {
      ...progress.bestTimes
    };
    
    if (!updatedBestTimes[levelId] || timeTaken < updatedBestTimes[levelId]) {
      updatedBestTimes[levelId] = timeTaken;
    }
    
    // 更新进度
    const updatedProgress: SortGameProgress = {
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
const culturalSortingGameService = new CulturalSortingGameService();

export default culturalSortingGameService;