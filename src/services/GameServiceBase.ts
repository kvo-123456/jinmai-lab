// 游戏服务基类
import { gameStorage } from '@/utils/gameStorage';
import { GameLevel, GameProgress } from '@/hooks/useGame';

/**
 * 游戏服务基类，提供通用的游戏逻辑
 */
abstract class GameServiceBase<TLevel extends GameLevel, TGameProgress extends GameProgress> {
  protected levels: TLevel[] = [];
  protected gameProgress: Map<string, TGameProgress> = new Map();
  protected storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
    this.loadGameProgress();
  }

  /**
   * 初始化关卡数据
   */
  protected abstract initLevels(): void;

  /**
   * 创建默认游戏进度
   * @param userId 用户ID
   */
  protected abstract createDefaultProgress(userId: string): TGameProgress;

  /**
   * 加载游戏进度
   */
  protected loadGameProgress(): void {
    const savedProgress = gameStorage.load<Record<string, TGameProgress>>(this.storageKey, {});
    // 转换普通对象为Map
    this.gameProgress = new Map(Object.entries(savedProgress || {}));
  }

  /**
   * 保存游戏进度
   */
  protected saveGameProgress(): void {
    // 转换Map为普通对象以便存储
    const progressObj = Object.fromEntries(this.gameProgress.entries());
    gameStorage.save(this.storageKey, progressObj);
  }

  /**
   * 获取所有关卡
   */
  getLevels(): TLevel[] {
    return [...this.levels];
  }

  /**
   * 根据ID获取关卡
   * @param levelId 关卡ID
   */
  getLevelById(levelId: string): TLevel | undefined {
    return this.levels.find(level => level.id === levelId);
  }

  /**
   * 获取用户游戏进度
   * @param userId 用户ID
   */
  getGameProgress(userId: string): TGameProgress {
    if (!this.gameProgress.has(userId)) {
      const progress = this.createDefaultProgress(userId);
      this.gameProgress.set(userId, progress);
      this.saveGameProgress();
    }
    return this.gameProgress.get(userId)!;
  }

  /**
   * 更新用户游戏进度
   * @param userId 用户ID
   * @param progress 进度更新内容
   */
  updateGameProgress(userId: string, progress: Partial<TGameProgress>): TGameProgress {
    const currentProgress = this.getGameProgress(userId);
    const updatedProgress: TGameProgress = {
      ...currentProgress,
      ...progress,
      lastPlayed: new Date()
    } as TGameProgress;
    
    this.gameProgress.set(userId, updatedProgress);
    this.saveGameProgress();
    return updatedProgress;
  }

  /**
   * 检查关卡是否解锁
   * @param userId 用户ID
   * @param levelId 关卡ID
   */
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

  /**
   * 完成关卡
   * @param userId 用户ID
   * @param levelId 关卡ID
   * @param score 得分
   * @param timeTaken 用时（秒）
   */
  completeLevel(
    userId: string, 
    levelId: string, 
    score: number, 
    timeTaken: number
  ): TGameProgress {
    const progress = this.getGameProgress(userId);
    
    // 更新最佳时间
    const updatedBestTimes = {
      ...progress.bestTimes
    };
    
    if (!updatedBestTimes[levelId] || timeTaken < updatedBestTimes[levelId]) {
      updatedBestTimes[levelId] = timeTaken;
    }
    
    // 更新进度
    const updatedProgress: TGameProgress = {
      ...progress,
      completedLevels: [...new Set([...progress.completedLevels, levelId])],
      totalScore: progress.totalScore + score,
      levelScores: {
        ...progress.levelScores,
        [levelId]: score
      },
      bestTimes: updatedBestTimes,
      lastPlayed: new Date()
    } as TGameProgress;
    
    this.gameProgress.set(userId, updatedProgress);
    this.saveGameProgress();
    return updatedProgress;
  }

  /**
   * 计算关卡得分
   * @param correctCount 正确数量
   * @param totalCount 总数量
   * @param timeTaken 用时（秒）
   * @param difficulty 难度
   */
  calculateLevelScore(
    correctCount: number, 
    totalCount: number, 
    timeTaken: number, 
    difficulty: 'easy' | 'medium' | 'hard'
  ): number {
    const accuracy = correctCount / totalCount;
    const baseScore = Math.round(100 * accuracy);
    
    // 时间奖励（根据难度调整）
    const timeBonusMultiplier = {
      easy: 0.3,
      medium: 0.5,
      hard: 0.8
    }[difficulty] || 0.5;
    
    // 假设关卡预期完成时间为每题20秒
    const expectedTime = totalCount * 20;
    const timeBonus = Math.max(0, expectedTime - timeTaken) * timeBonusMultiplier;
    
    // 难度系数
    const difficultyMultiplier = {
      easy: 1.0,
      medium: 1.2,
      hard: 1.5
    }[difficulty] || 1.0;
    
    return Math.round((baseScore + timeBonus) * difficultyMultiplier);
  }
}

export default GameServiceBase;
