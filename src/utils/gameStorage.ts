// 游戏数据持久化工具

interface StorageItem<T> {
  data: T;
  timestamp: number;
}

class GameStorage {
  private prefix: string;

  constructor(prefix = 'jinmai_game') {
    this.prefix = prefix;
  }

  /**
   * 保存数据到localStorage
   * @param key 存储键名
   * @param data 要存储的数据
   */
  save<T>(key: string, data: T): void {
    try {
      const item: StorageItem<T> = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`${this.prefix}_${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Failed to save game data:', error);
    }
  }

  /**
   * 从localStorage加载数据
   * @param key 存储键名
   * @param defaultValue 默认值
   */
  load<T>(key: string, defaultValue: T): T {
    try {
      const itemStr = localStorage.getItem(`${this.prefix}_${key}`);
      if (itemStr) {
        const item: StorageItem<T> = JSON.parse(itemStr);
        return item.data;
      }
    } catch (error) {
      console.error('Failed to load game data:', error);
    }
    return defaultValue;
  }

  /**
   * 清除指定键的数据
   * @param key 存储键名
   */
  clear(key: string): void {
    try {
      localStorage.removeItem(`${this.prefix}_${key}`);
    } catch (error) {
      console.error('Failed to clear game data:', error);
    }
  }

  /**
   * 清除所有游戏数据
   */
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear all game data:', error);
    }
  }

  /**
   * 获取所有存储的键名
   */
  getAllKeys(): string[] {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(`${this.prefix}_`, ''));
    } catch (error) {
      console.error('Failed to get all game keys:', error);
      return [];
    }
  }
}

// 创建单例实例
export const gameStorage = new GameStorage();

export default GameStorage;
