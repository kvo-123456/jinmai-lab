// 文化知识问答游戏服务，用于管理游戏关卡和题目数据
import { gameStorage } from '@/utils/gameStorage';

// 题目类型定义
export interface Question {
  id: string;           // 题目唯一标识
  type: 'single' | 'multiple' | 'judgment';  // 题目类型：单选题、多选题、判断题
  title: string;        // 题目标题
  content: string;      // 题目内容
  options?: string[];   // 选项列表
  correctAnswers: number[];  // 正确答案索引
  explanation: string;  // 答案解析
  hint?: string;        // 提示（可选）
  culturalTheme: string;  // 文化主题
  category: string;     // 分类（如：天津文化、传统艺术等）
}

// 游戏关卡类型定义
export interface Level {
  id: string;           // 关卡唯一标识
  name: string;         // 关卡名称
  description: string;  // 关卡描述
  questions: Question[];  // 关卡包含的题目
  gridSize: {           // 关卡网格尺寸（用于布局）
    rows: number;       // 行数
    cols: number;       // 列数
  };
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
  unlockedHints: number;  // 可用提示次数
  bestTimes: Record<string, number>;  // 各关卡最佳时间（秒）
  lastPlayed: Date;     // 最后游戏时间
}

// 文化知识问答游戏服务类
class CulturalQuizGameService {
  private questions: Question[] = [];
  private levels: Level[] = [];
  private gameProgress: Map<string, GameProgress> = new Map();
  private nextQuestionId = 1;
  private nextLevelId = 1;

  constructor() {
    this.initQuestions();
    this.initLevels();
    this.loadGameProgress();
  }

  // 初始化题目数据
  private initQuestions(): void {
    this.questions = [
      // 天津文化主题题目
      {
        id: `question-${this.nextQuestionId++}`,
        type: 'single',
        title: '天津文化常识',
        content: '天津的市花是什么？',
        options: ['梅花', '月季', '菊花', '牡丹'],
        correctAnswers: [1],
        explanation: '天津的市花是月季，象征着天津人民的热情和活力。',
        hint: '天津的市花是一种四季常开的花卉。',
        culturalTheme: '天津地方文化',
        category: '天津文化'
      },
      {
        id: `question-${this.nextQuestionId++}`,
        type: 'single',
        title: '天津传统小吃',
        content: '天津的传统名吃"狗不理包子"的创始人是谁？',
        options: ['张三', '李四', '王五', '高贵友'],
        correctAnswers: [3],
        explanation: '狗不理包子的创始人是高贵友，因其乳名"狗子"，且卖包子时忙于生意不与人说话，被顾客戏称为"狗不理"。',
        hint: '创始人的乳名是"狗子"。',
        culturalTheme: '天津地方文化',
        category: '天津美食'
      },
      {
        id: `question-${this.nextQuestionId++}`,
        type: 'multiple',
        title: '天津文化遗产',
        content: '以下哪些是天津的国家级非物质文化遗产？',
        options: ['杨柳青年画', '泥人张彩塑', '天津相声', '狗不理包子制作技艺'],
        correctAnswers: [0, 1, 2, 3],
        explanation: '杨柳青年画、泥人张彩塑、天津相声和狗不理包子制作技艺均为天津的国家级非物质文化遗产。',
        hint: '这些都是天津的传统特色文化。',
        culturalTheme: '天津地方文化',
        category: '天津文化遗产'
      },
      {
        id: `question-${this.nextQuestionId++}`,
        type: 'judgment',
        title: '天津历史',
        content: '天津是中国北方最早开放的通商口岸之一。',
        correctAnswers: [0],
        explanation: '天津是中国北方最早开放的通商口岸之一，自1860年开埠以来，逐渐发展成为重要的工商业城市。',
        hint: '天津开埠时间较早。',
        culturalTheme: '天津地方文化',
        category: '天津历史'
      },
      {
        id: `question-${this.nextQuestionId++}`,
        type: 'single',
        title: '天津方言',
        content: '天津方言中"嘛意思"是什么意思？',
        options: ['什么意思', '没关系', '不用谢', '再见'],
        correctAnswers: [0],
        explanation: '"嘛意思"是天津方言中"什么意思"的常用表达。',
        hint: '"嘛"是天津方言中的疑问词。',
        culturalTheme: '天津地方文化',
        category: '天津方言'
      },
      
      // 中国传统文化主题题目
      {
        id: `question-${this.nextQuestionId++}`,
        type: 'single',
        title: '中国传统节日',
        content: '以下哪个节日是中国的传统节日？',
        options: ['情人节', '圣诞节', '中秋节', '感恩节'],
        correctAnswers: [2],
        explanation: '中秋节是中国的传统节日，每年农历八月十五，人们会赏月、吃月饼。',
        hint: '这个节日与月亮有关。',
        culturalTheme: '中国传统文化',
        category: '传统节日'
      },
      {
        id: `question-${this.nextQuestionId++}`,
        type: 'multiple',
        title: '中国传统绘画',
        content: '以下哪些是中国传统绘画的主要形式？',
        options: ['国画', '油画', '水彩画', '工笔画'],
        correctAnswers: [0, 3],
        explanation: '国画和工笔画是中国传统绘画的主要形式，油画和水彩画是西方绘画形式。',
        hint: '这些是中国本土的绘画形式。',
        culturalTheme: '中国传统文化',
        category: '传统艺术'
      },
      {
        id: `question-${this.nextQuestionId++}`,
        type: 'judgment',
        title: '中国传统哲学',
        content: '儒家思想的核心是"仁、义、礼、智、信"。',
        correctAnswers: [0],
        explanation: '儒家思想的核心是"仁、义、礼、智、信"，这是中国传统文化的重要组成部分。',
        hint: '这是孔子思想的核心。',
        culturalTheme: '中国传统文化',
        category: '传统哲学'
      },
      {
        id: `question-${this.nextQuestionId++}`,
        type: 'single',
        title: '中国传统工艺',
        content: '青花瓷是中国哪个朝代的代表性瓷器？',
        options: ['唐朝', '宋朝', '元朝', '明朝'],
        correctAnswers: [2],
        explanation: '青花瓷起源于唐朝，但在元朝达到鼎盛，成为中国瓷器的代表品种之一。',
        hint: '这个朝代是蒙古族建立的。',
        culturalTheme: '中国传统文化',
        category: '传统工艺'
      },
      {
        id: `question-${this.nextQuestionId++}`,
        type: 'single',
        title: '中国传统医学',
        content: '中医理论中的"五脏六腑"不包括以下哪个器官？',
        options: ['心脏', '肝脏', '脾脏', '胰腺'],
        correctAnswers: [3],
        explanation: '中医理论中的"五脏"指心、肝、脾、肺、肾，"六腑"指胆、胃、小肠、大肠、膀胱、三焦，不包括胰腺。',
        hint: '这个器官在西医中很重要，但中医理论中没有单独列出。',
        culturalTheme: '中国传统文化',
        category: '传统医学'
      }
    ];
  }

  // 初始化关卡数据
  private initLevels(): void {
    // 为每个关卡分配题目
    this.levels = [
      {
        id: `level-${this.nextLevelId++}`,
        name: '天津文化入门',
        description: '了解天津的基本文化常识',
        questions: this.questions.slice(0, 5), // 天津文化主题题目
        gridSize: { rows: 4, cols: 4 },
        difficulty: 'easy',
        reward: '解锁天津文化素材包',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20cultural%20heritage%20tourism'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '中国传统文化基础',
        description: '了解中国传统文化的基本常识',
        questions: this.questions.slice(5, 10), // 中国传统文化主题题目
        gridSize: { rows: 4, cols: 4 },
        difficulty: 'medium',
        unlockCondition: { type: 'level', value: 1 },
        reward: '解锁中国传统文化素材包',
        culturalTheme: '中国传统文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20traditional%20culture%20collection'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '文化知识挑战',
        description: '综合挑战天津文化和中国传统文化知识',
        questions: [...this.questions.slice(0, 3), ...this.questions.slice(5, 8)], // 混合题目
        gridSize: { rows: 4, cols: 5 },
        difficulty: 'hard',
        unlockCondition: { type: 'level', value: 2 },
        reward: '解锁高级文化素材包',
        culturalTheme: '综合文化知识',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20cultural%20knowledge%20challenge'
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

  // 获取所有题目
  getQuestions(): Question[] {
    return [...this.questions];
  }

  // 根据ID获取题目
  getQuestionById(questionId: string): Question | undefined {
    return this.questions.find(question => question.id === questionId);
  }

  // 加载游戏进度
  private loadGameProgress(): void {
    const savedProgress = gameStorage.load<Map<string, GameProgress>>("quiz_game_progress", new Map());
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
    gameStorage.save("quiz_game_progress", progressObj);
  }

  // 获取用户游戏进度
  getGameProgress(userId: string): GameProgress {
    if (!this.gameProgress.has(userId)) {
      const progress: GameProgress = {
        userId,
        completedLevels: [],
        totalScore: 0,
        levelScores: {},
        unlockedHints: 3,
        bestTimes: {},
        lastPlayed: new Date()
      };
      this.gameProgress.set(userId, progress);
      this.saveGameProgress();
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
    this.saveGameProgress();
    return updatedProgress;
  }

  // 检查答案是否正确
  checkAnswer(question: Question, selectedAnswers: number[]): boolean {
    // 排序后比较
    const sortedCorrect = [...question.correctAnswers].sort();
    const sortedSelected = [...selectedAnswers].sort();
    
    if (sortedCorrect.length !== sortedSelected.length) {
      return false;
    }
    
    for (let i = 0; i < sortedCorrect.length; i++) {
      if (sortedCorrect[i] !== sortedSelected[i]) {
        return false;
      }
    }
    
    return true;
  }

  // 计算题目得分
  calculateQuestionScore(question: Question, isCorrect: boolean, timeTaken?: number): number {
    const baseScore = 10;
    let score = 0;
    
    if (isCorrect) {
      score = baseScore;
      
      // 时间奖励（如果提供了时间）
      if (timeTaken && timeTaken < 10) {
        score += 5;
      } else if (timeTaken && timeTaken < 20) {
        score += 3;
      }
      
      // 题目类型难度奖励
      if (question.type === 'multiple') {
        score += 5;
      } else if (question.type === 'judgment') {
        score += 2;
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
    
    // 假设关卡预期完成时间为每题20秒
    const expectedTime = totalCount * 20;
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
    this.saveGameProgress();
    return updatedProgress;
  }

  // 使用提示
  useHint(userId: string): boolean {
    const progress = this.getGameProgress(userId);
    if (progress.unlockedHints > 0) {
      this.updateGameProgress(userId, {
        unlockedHints: progress.unlockedHints - 1
      });
      this.saveGameProgress();
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
    this.saveGameProgress();
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
const culturalQuizGameService = new CulturalQuizGameService();

export default culturalQuizGameService;