import { renderHook, act } from '@testing-library/react';
import { useGame } from '../useGame';

// Mock levels data
const mockLevels = [
  {
    id: 'level-1',
    name: 'Level 1',
    description: 'Test Level 1',
    difficulty: 'easy',
    reward: 'Reward 1'
  },
  {
    id: 'level-2',
    name: 'Level 2',
    description: 'Test Level 2',
    difficulty: 'medium',
    reward: 'Reward 2'
  }
];

// Enable fake timers
beforeEach(() => {
  jest.useFakeTimers();
});

// Clear fake timers after each test
afterEach(() => {
  jest.clearAllTimers();
});


describe('useGame', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useGame({
      userId: 'test-user',
      levels: mockLevels
    }));

    expect(result.current.gameState).toBe('menu');
    expect(result.current.selectedLevel).toBeNull();
    expect(result.current.startTime).toBeNull();
    expect(result.current.currentTime).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('should start game when selectLevel is called', () => {
    const { result } = renderHook(() => useGame({
      userId: 'test-user',
      levels: mockLevels
    }));

    act(() => {
      result.current.selectLevel(mockLevels[0]);
    });

    expect(result.current.gameState).toBe('playing');
    expect(result.current.selectedLevel).toEqual(mockLevels[0]);
    expect(result.current.startTime).not.toBeNull();
    expect(result.current.currentTime).toBe(0);
  });

  it('should return to menu when returnToMenu is called', () => {
    const { result } = renderHook(() => useGame({
      userId: 'test-user',
      levels: mockLevels
    }));

    // First start a game
    act(() => {
      result.current.selectLevel(mockLevels[0]);
    });

    expect(result.current.gameState).toBe('playing');

    // Then return to menu
    act(() => {
      result.current.returnToMenu();
    });

    expect(result.current.gameState).toBe('menu');
    expect(result.current.selectedLevel).toBeNull();
    expect(result.current.startTime).toBeNull();
    expect(result.current.currentTime).toBe(0);
  });

  it('should restart game when restartGame is called', () => {
    const { result } = renderHook(() => useGame({
      userId: 'test-user',
      levels: mockLevels
    }));

    // Start a game first
    act(() => {
      result.current.selectLevel(mockLevels[0]);
    });

    const initialStartTime = result.current.startTime;

    // Simulate some time passing
    act(() => {
      // Advance time by 1 second
      jest.advanceTimersByTime(1000);
    });

    // Check that time has passed
    expect(result.current.currentTime).toBeGreaterThan(0);

    // Restart the game
    act(() => {
      result.current.restartGame();
    });

    // Check that game is restarted
    expect(result.current.gameState).toBe('playing');
    expect(result.current.selectedLevel).toEqual(mockLevels[0]);
    expect(result.current.startTime).not.toBeNull();
    expect(result.current.startTime).not.toBe(initialStartTime);
    expect(result.current.currentTime).toBe(0);
  });

  it('should complete game and call onLevelComplete callback', () => {
    const mockOnLevelComplete = jest.fn();
    const { result } = renderHook(() => useGame({
      userId: 'test-user',
      levels: mockLevels,
      onLevelComplete: mockOnLevelComplete
    }));

    // Start a game
    act(() => {
      result.current.selectLevel(mockLevels[0]);
    });

    // Complete the game
    act(() => {
      result.current.completeGame(1000);
    });

    // Check that game state is completed
    expect(result.current.gameState).toBe('completed');
    // Check that onLevelComplete was called
    expect(mockOnLevelComplete).toHaveBeenCalled();
    expect(mockOnLevelComplete).toHaveBeenCalledWith(
      mockLevels[0].id,
      1000,
      expect.any(Number)
    );
  });

  it('should format time correctly', () => {
    const { result } = renderHook(() => useGame({
      userId: 'test-user',
      levels: mockLevels
    }));

    // Test formatting of different time values
    expect(result.current.formatTime(0)).toBe('00:00');
    expect(result.current.formatTime(5)).toBe('00:05');
    expect(result.current.formatTime(60)).toBe('01:00');
    expect(result.current.formatTime(65)).toBe('01:05');
    expect(result.current.formatTime(3600)).toBe('60:00');
  });

  it('should update currentTime correctly when game is playing', () => {
    const { result } = renderHook(() => useGame({
      userId: 'test-user',
      levels: mockLevels
    }));

    // Start a game
    act(() => {
      result.current.selectLevel(mockLevels[0]);
    });

    // Simulate 1 second passing
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.currentTime).toBe(1);

    // Simulate another 2 seconds passing
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.currentTime).toBe(3);
  });
});
