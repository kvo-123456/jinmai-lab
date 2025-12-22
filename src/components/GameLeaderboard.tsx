import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

// 排行榜项类型
interface LeaderboardItem {
  userId: string;
  username: string;
  score: number;
  time: number;
  levelId?: string;
  completedAt: Date;
}

// 排行榜组件属性
interface GameLeaderboardProps {
  gameType: string;
  levelId?: string;
  title?: string;
  limit?: number;
  onClose?: () => void;
}

/**
 * 游戏排行榜组件，用于显示游戏的排行榜数据
 */
const GameLeaderboard: React.FC<GameLeaderboardProps> = ({
  gameType,
  levelId,
  title = '游戏排行榜',
  limit = 10,
  onClose
}) => {
  const { isDark } = useTheme();
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'time'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 模拟加载排行榜数据
  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      try {
        // 这里应该从API或localStorage加载真实数据
        // 目前使用模拟数据
        const mockData: LeaderboardItem[] = [
          { userId: '1', username: '玩家1', score: 980, time: 120, completedAt: new Date(Date.now() - 3600000) },
          { userId: '2', username: '玩家2', score: 950, time: 135, completedAt: new Date(Date.now() - 7200000) },
          { userId: '3', username: '玩家3', score: 920, time: 150, completedAt: new Date(Date.now() - 10800000) },
          { userId: '4', username: '玩家4', score: 890, time: 165, completedAt: new Date(Date.now() - 14400000) },
          { userId: '5', username: '玩家5', score: 860, time: 180, completedAt: new Date(Date.now() - 18000000) },
          { userId: '6', username: '玩家6', score: 830, time: 195, completedAt: new Date(Date.now() - 21600000) },
          { userId: '7', username: '玩家7', score: 800, time: 210, completedAt: new Date(Date.now() - 25200000) },
          { userId: '8', username: '玩家8', score: 770, time: 225, completedAt: new Date(Date.now() - 28800000) },
          { userId: '9', username: '玩家9', score: 740, time: 240, completedAt: new Date(Date.now() - 32400000) },
          { userId: '10', username: '玩家10', score: 710, time: 255, completedAt: new Date(Date.now() - 36000000) }
        ];

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 根据排序条件排序
        const sortedData = [...mockData].sort((a, b) => {
          const aValue = sortBy === 'score' ? a.score : a.time;
          const bValue = sortBy === 'score' ? b.score : b.time;
          
          if (sortOrder === 'asc') {
            return aValue - bValue;
          } else {
            return bValue - aValue;
          }
        });
        
        setLeaderboard(sortedData.slice(0, limit));
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [gameType, levelId, limit, sortBy, sortOrder]);

  // 切换排序方式
  const toggleSort = (newSortBy: 'score' | 'time') => {
    if (sortBy === newSortBy) {
      // 切换排序顺序
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 新的排序字段，默认降序
      setSortBy(newSortBy);
      setSortOrder(newSortBy === 'score' ? 'desc' : 'asc');
    }
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化日期
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`${onClose ? 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4' : ''}`}
      onClick={onClose ? (e) => e.target === e.currentTarget && onClose() : undefined}
    >
      <div className={`w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} text-${isDark ? 'white' : 'gray-900'}`}>
        {/* 标题栏 */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h2 className="text-xl font-bold">{title}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-full text-lg ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white transition-all shadow-md hover:shadow-lg`}
              aria-label="关闭"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {/* 排行榜内容 */}
        <div className="p-4">
          {/* 排序控制 */}
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() => toggleSort('score')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${sortBy === 'score' ? `${isDark ? 'bg-blue-600' : 'bg-blue-500'} text-white` : ''}`}
            >
              得分 {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('time')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${sortBy === 'time' ? `${isDark ? 'bg-blue-600' : 'bg-blue-500'} text-white` : ''}`}
            >
              时间 {sortBy === 'time' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          {/* 加载状态 */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
              <p className="text-lg">加载排行榜数据...</p>
            </div>
          ) : (
            /* 排行榜列表 */
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <th className="p-3 text-left border-b border-r ${isDark ? 'border-gray-600' : 'border-gray-200'} w-16">排名</th>
                    <th className="p-3 text-left border-b border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}">玩家</th>
                    <th className="p-3 text-left border-b border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}">得分</th>
                    <th className="p-3 text-left border-b border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}">用时</th>
                    <th className="p-3 text-left border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}">完成时间</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {leaderboard.map((item, index) => (
                      <motion.tr
                        key={item.userId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`${index % 2 === 0 ? isDark ? 'bg-gray-800' : 'bg-white' : isDark ? 'bg-gray-750' : 'bg-gray-50'} hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}
                      >
                        <td className={`p-3 border-b border-r ${isDark ? 'border-gray-600' : 'border-gray-200'} font-medium`}>
                          {index + 1}
                        </td>
                        <td className={`p-3 border-b border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                          {item.username}
                        </td>
                        <td className={`p-3 border-b border-r ${isDark ? 'border-gray-600' : 'border-gray-200'} font-medium`}>
                          {item.score}
                        </td>
                        <td className={`p-3 border-b border-r ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                          {formatTime(item.time)}
                        </td>
                        <td className={`p-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'} text-sm`}>
                          {formatDate(item.completedAt)}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* 空状态 */}
          {!isLoading && leaderboard.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <i className="fas fa-trophy text-6xl text-gray-400 mb-4"></i>
              <h3 className="text-xl font-medium mb-2">暂无排行榜数据</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                快来成为第一个上榜的玩家吧！
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default GameLeaderboard;
