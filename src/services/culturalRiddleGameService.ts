// 文化猜谜游戏服务，用于管理游戏关卡和题目数据

// 谜语类型定义
export interface Riddle {
  id: string;           // 谜语唯一标识
  title: string;        // 谜语标题
  content: string;      // 谜语内容
  hints: string[];      // 提示列表（递进式）
  answer: string;       // 正确答案
  explanation: string;  // 答案解析
  culturalTheme: string;  // 文化主题
  category: string;     // 分类（如：天津文化、传统艺术等）
  difficulty: 'easy' | 'medium' | 'hard';  // 难度级别
  imageUrl?: string;    // 谜语图片（可选）
  audioUrl?: string;    // 谜语音频（可选）
}

// 游戏关卡类型定义
export interface RiddleLevel {
  id: string;           // 关卡唯一标识
  name: string;         // 关卡名称
  description: string;  // 关卡描述
  riddles: Riddle[];    // 关卡包含的谜语
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
export interface RiddleGameProgress {
  userId: string;       // 用户ID
  completedLevels: string[];  // 已完成关卡
  totalScore: number;   // 总得分
  levelScores: Record<string, number>;  // 各关卡得分
  unlockedHints: number;  // 可用提示次数
  bestTimes: Record<string, number>;  // 各关卡最佳时间（秒）
  lastPlayed: Date;     // 最后游戏时间
}

// 文化猜谜游戏服务类
class CulturalRiddleGameService {
  private riddles: Riddle[] = [];
  private levels: RiddleLevel[] = [];
  private gameProgress: Map<string, RiddleGameProgress> = new Map();
  private nextRiddleId = 1;
  private nextLevelId = 1;

  constructor() {
    this.initRiddles();
    this.initLevels();
  }

  // 初始化谜语数据
  private initRiddles(): void {
    this.riddles = [
      // 天津文化谜语
      {
        id: `riddle-${this.nextRiddleId++}`,
        title: '天津特产',
        content: '形如元宝，皮薄馅大，咬一口汤汁四溢，天津名吃人人夸。',
        hints: [
          '这是天津的传统名吃',
          '它的名字和狗有关',
          '它是一种包子'
        ],
        answer: '狗不理包子',
        explanation: '狗不理包子是天津的传统名吃，因其创始人高贵友乳名"狗子"而得名，以皮薄馅大、汤汁鲜美著称。',
        culturalTheme: '天津地方文化',
        category: '天津美食',
        difficulty: 'easy'
      },
      {
        id: `riddle-${this.nextRiddleId++}`,
        title: '天津地标',
        content: '一座铁桥横跨海河，百年历史见证天津变迁。',
        hints: [
          '这是天津的标志性桥梁',
          '它的名字与一个国家有关',
          '它建于1907年'
        ],
        answer: '解放桥',
        explanation: '解放桥原名万国桥，是天津的标志性桥梁，横跨海河，建于1907年，见证了天津的百年变迁。',
        culturalTheme: '天津地方文化',
        category: '天津建筑',
        difficulty: 'easy'
      },
      {
        id: `riddle-${this.nextRiddleId++}`,
        title: '天津民俗',
        content: '正月十五闹花灯，天津特色民俗活动。',
        hints: [
          '这是天津的传统民俗活动',
          '它在元宵节举行',
          '活动地点在天津的一个著名古文化街'
        ],
        answer: '杨柳青灯会',
        explanation: '杨柳青灯会是天津的传统民俗活动，每年元宵节在杨柳青古镇举行，展示精美的花灯和传统文化。',
        culturalTheme: '天津地方文化',
        category: '天津民俗',
        difficulty: 'medium'
      },
      
      // 中国传统文化谜语
      {
        id: `riddle-${this.nextRiddleId++}`,
        title: '传统节日',
        content: '嫦娥奔月的故事与之相关，家家户户吃月饼。',
        hints: [
          '这是中国的传统节日',
          '它在农历八月十五',
          '与月亮有关'
        ],
        answer: '中秋节',
        explanation: '中秋节是中国的传统节日，每年农历八月十五，人们会赏月、吃月饼，嫦娥奔月是与中秋节相关的传说故事。',
        culturalTheme: '中国传统文化',
        category: '传统节日',
        difficulty: 'easy'
      },
      {
        id: `riddle-${this.nextRiddleId++}`,
        title: '传统艺术',
        content: '一支毛笔，一张宣纸，挥洒自如，中国特色绘画。',
        hints: [
          '这是中国的传统绘画形式',
          '使用水墨作为主要颜料',
          '强调意境和神韵'
        ],
        answer: '国画',
        explanation: '国画是中国的传统绘画形式，使用毛笔、宣纸和水墨等工具，强调意境和神韵，是中国传统文化的重要组成部分。',
        culturalTheme: '中国传统文化',
        category: '传统艺术',
        difficulty: 'easy'
      },
      {
        id: `riddle-${this.nextRiddleId++}`,
        title: '历史人物',
        content: '儒家学派创始人，主张"仁"和"礼"。',
        hints: [
          '他是中国古代思想家',
          '他的弟子记录了他的言行',
          '他被尊称为"圣人"'
        ],
        answer: '孔子',
        explanation: '孔子是儒家学派的创始人，主张"仁"和"礼"，是中国古代伟大的思想家、教育家，被尊称为"圣人"。',
        culturalTheme: '中国传统文化',
        category: '历史人物',
        difficulty: 'medium'
      },
      {
        id: `riddle-${this.nextRiddleId++}`,
        title: '传统工艺',
        content: '以泥为原料，塑造栩栩如生的人物形象。',
        hints: [
          '这是中国的传统民间工艺',
          '天津有著名的"泥人张"',
          '使用泥土作为主要材料'
        ],
        answer: '泥人',
        explanation: '泥人是中国的传统民间工艺，以泥土为原料，塑造栩栩如生的人物形象，天津的"泥人张"是其中的代表。',
        culturalTheme: '中国传统文化',
        category: '传统工艺',
        difficulty: 'medium'
      },
      {
        id: `riddle-${this.nextRiddleId++}`,
        title: '传统节日',
        content: '屈原投江的故事与之相关，人们赛龙舟、吃粽子。',
        hints: [
          '这是中国的传统节日',
          '它在农历五月初五',
          '与一位爱国诗人有关'
        ],
        answer: '端午节',
        explanation: '端午节是中国的传统节日，每年农历五月初五，人们会赛龙舟、吃粽子，以纪念爱国诗人屈原。',
        culturalTheme: '中国传统文化',
        category: '传统节日',
        difficulty: 'easy'
      },
      
      // 高级谜语
      {
        id: `riddle-${this.nextRiddleId++}`,
        title: '天津历史',
        content: '天津古代的名称，意为"天子经过的渡口"。',
        hints: [
          '这是天津的古称',
          '与明朝皇帝朱棣有关',
          '意为天子经过的渡口'
        ],
        answer: '天津卫',
        explanation: '天津卫是天津的古称，意为"天子经过的渡口"，明朝永乐二年（1404年），朱棣为纪念自己在此渡过大运河南下争夺皇位，赐名"天津"。',
        culturalTheme: '天津地方文化',
        category: '天津历史',
        difficulty: 'hard'
      },
      {
        id: `riddle-${this.nextRiddleId++}`,
        title: '传统哲学',
        content: '老子的代表作，蕴含深刻的道家思想。',
        hints: [
          '这是中国古代哲学著作',
          '作者是老子',
          '全书共81章'
        ],
        answer: '道德经',
        explanation: '《道德经》是老子的代表作，蕴含深刻的道家思想，全书共81章，是中国古代哲学的重要经典。',
        culturalTheme: '中国传统文化',
        category: '传统哲学',
        difficulty: 'hard'
      }
    ];
  }

  // 初始化关卡数据
  private initLevels(): void {
    // 为每个关卡分配谜语
    this.levels = [
      {
        id: `level-${this.nextLevelId++}`,
        name: '天津文化入门',
        description: '了解天津的基本文化常识',
        riddles: this.riddles.filter(riddle => riddle.culturalTheme === '天津地方文化' && riddle.difficulty === 'easy'),
        gridSize: { rows: 4, cols: 4 },
        difficulty: 'easy',
        reward: '解锁天津文化素材包',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20cultural%20heritage'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '中国传统文化基础',
        description: '了解中国传统文化的基本常识',
        riddles: this.riddles.filter(riddle => riddle.culturalTheme === '中国传统文化' && riddle.difficulty === 'easy'),
        gridSize: { rows: 4, cols: 4 },
        difficulty: 'easy',
        reward: '解锁中国传统文化素材包',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20traditional%20culture%20collection'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '天津文化进阶',
        description: '深入了解天津的文化底蕴',
        riddles: this.riddles.filter(riddle => riddle.culturalTheme === '天津地方文化' && riddle.difficulty === 'medium'),
        gridSize: { rows: 4, cols: 4 },
        difficulty: 'medium',
        unlockCondition: { type: 'level', value: 1 },
        reward: '解锁天津文化高级素材包',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20traditional%20culture'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '中国传统文化进阶',
        description: '深入了解中国传统文化的丰富内涵',
        riddles: this.riddles.filter(riddle => riddle.culturalTheme === '中国传统文化' && riddle.difficulty === 'medium'),
        gridSize: { rows: 4, cols: 4 },
        difficulty: 'medium',
        unlockCondition: { type: 'level', value: 2 },
        reward: '解锁中国传统文化高级素材包',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20traditional%20art'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '文化知识挑战',
        description: '综合挑战天津文化和中国传统文化知识',
        riddles: this.riddles.filter(riddle => riddle.difficulty === 'hard'),
        gridSize: { rows: 4, cols: 4 },
        difficulty: 'hard',
        unlockCondition: { type: 'level', value: 4 },
        reward: '解锁高级文化素材包',
        culturalTheme: '综合文化知识',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20cultural%20knowledge%20challenge'
      }
    ];
  }

  // 获取所有关卡
  getLevels(): RiddleLevel[] {
    return [...this.levels];
  }

  // 根据ID获取关卡
  getLevelById(levelId: string): RiddleLevel | undefined {
    return this.levels.find(level => level.id === levelId);
  }

  // 获取所有谜语
  getRiddles(): Riddle[] {
    return [...this.riddles];
  }

  // 根据ID获取谜语
  getRiddleById(riddleId: string): Riddle | undefined {
    return this.riddles.find(riddle => riddle.id === riddleId);
  }

  // 获取用户游戏进度
  getGameProgress(userId: string): RiddleGameProgress {
    if (!this.gameProgress.has(userId)) {
      const progress: RiddleGameProgress = {
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
  updateGameProgress(userId: string, progress: Partial<RiddleGameProgress>): RiddleGameProgress {
    const currentProgress = this.getGameProgress(userId);
    const updatedProgress: RiddleGameProgress = {
      ...currentProgress,
      ...progress,
      lastPlayed: new Date()
    };
    this.gameProgress.set(userId, updatedProgress);
    return updatedProgress;
  }

  // 检查答案是否正确
  checkAnswer(riddle: Riddle, userAnswer: string): boolean {
    // 忽略大小写和空格
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedAnswer = riddle.answer.trim().toLowerCase();
    return normalizedUserAnswer === normalizedAnswer;
  }

  // 计算谜语得分
  calculateRiddleScore(riddle: Riddle, isCorrect: boolean, timeTaken?: number, hintsUsed?: number): number {
    const baseScore = {
      easy: 50,
      medium: 100,
      hard: 150
    }[riddle.difficulty];
    
    let score = 0;
    
    if (isCorrect) {
      score = baseScore;
      
      // 时间奖励
      if (timeTaken && timeTaken < 10) {
        score += 20;
      } else if (timeTaken && timeTaken < 30) {
        score += 10;
      }
      
      // 提示惩罚（每个提示扣10分）
      if (hintsUsed) {
        score = Math.max(0, score - hintsUsed * 10);
      }
    }
    
    return score;
  }

  // 计算关卡得分
  calculateLevelScore(
    correctCount: number, 
    totalCount: number, 
    timeTaken: number, 
    difficulty: string,
    hintsUsed: number
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
    
    // 提示惩罚（总提示数乘以5）
    const hintPenalty = hintsUsed * 5;
    
    return Math.round((baseScore + timeBonus - hintPenalty) * difficultyMultiplier);
  }

  // 完成关卡
  completeLevel(
    userId: string, 
    levelId: string, 
    score: number, 
    timeTaken: number
  ): RiddleGameProgress {
    const progress = this.getGameProgress(userId);
    
    // 更新最佳时间
    const updatedBestTimes = {
      ...progress.bestTimes
    };
    
    if (!updatedBestTimes[levelId] || timeTaken < updatedBestTimes[levelId]) {
      updatedBestTimes[levelId] = timeTaken;
    }
    
    // 更新进度
    const updatedProgress: RiddleGameProgress = {
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
const culturalRiddleGameService = new CulturalRiddleGameService();

export default culturalRiddleGameService;