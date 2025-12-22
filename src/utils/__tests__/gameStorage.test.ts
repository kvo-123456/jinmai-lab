import { gameStorage } from '../gameStorage';

// 清除localStorage before each test
beforeEach(() => {
  localStorage.clear();
});

describe('GameStorage', () => {
  describe('save and load', () => {
    it('should save and load data correctly', () => {
      const testData = { key: 'value', number: 123, boolean: true };
      gameStorage.save('test_key', testData);
      
      const loadedData = gameStorage.load('test_key', null);
      expect(loadedData).toEqual(testData);
    });

    it('should return default value when key does not exist', () => {
      const defaultValue = { default: 'value' };
      const loadedData = gameStorage.load('non_existent_key', defaultValue);
      
      expect(loadedData).toEqual(defaultValue);
    });

    it('should handle different data types', () => {
      // Test string
      gameStorage.save('test_string', 'hello');
      expect(gameStorage.load('test_string', '')).toBe('hello');
      
      // Test number
      gameStorage.save('test_number', 123);
      expect(gameStorage.load('test_number', 0)).toBe(123);
      
      // Test boolean
      gameStorage.save('test_boolean', true);
      expect(gameStorage.load('test_boolean', false)).toBe(true);
      
      // Test array
      const testArray = [1, 2, 3, 4, 5];
      gameStorage.save('test_array', testArray);
      expect(gameStorage.load('test_array', [])).toEqual(testArray);
      
      // Test object
      const testObject = { nested: { key: 'value' } };
      gameStorage.save('test_object', testObject);
      expect(gameStorage.load('test_object', {})).toEqual(testObject);
    });
  });

  describe('clear', () => {
    it('should clear a specific key', () => {
      gameStorage.save('test_key1', 'value1');
      gameStorage.save('test_key2', 'value2');
      
      gameStorage.clear('test_key1');
      
      expect(gameStorage.load('test_key1', null)).toBeNull();
      expect(gameStorage.load('test_key2', null)).toBe('value2');
    });
  });

  describe('clearAll', () => {
    it('should clear all game storage keys', () => {
      gameStorage.save('test_key1', 'value1');
      gameStorage.save('test_key2', 'value2');
      // Save a non-game key to ensure it's not cleared
      localStorage.setItem('non_game_key', 'non_game_value');
      
      gameStorage.clearAll();
      
      expect(gameStorage.load('test_key1', null)).toBeNull();
      expect(gameStorage.load('test_key2', null)).toBeNull();
      expect(localStorage.getItem('non_game_key')).toBe('non_game_value');
    });
  });

  describe('getAllKeys', () => {
    it('should return all game storage keys', () => {
      gameStorage.save('test_key1', 'value1');
      gameStorage.save('test_key2', 'value2');
      // Save a non-game key to ensure it's not included
      localStorage.setItem('non_game_key', 'non_game_value');
      
      const keys = gameStorage.getAllKeys();
      
      expect(keys).toEqual(expect.arrayContaining(['test_key1', 'test_key2']));
      expect(keys).not.toContain('non_game_key');
      expect(keys).toHaveLength(2);
    });

    it('should return empty array when no keys exist', () => {
      const keys = gameStorage.getAllKeys();
      expect(keys).toEqual([]);
    });
  });
});
