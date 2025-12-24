import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '@/lib/apiClient';
import GradientHero from '@/components/GradientHero';
import LazyImage from '@/components/LazyImage';

interface Post {
  id: number;
  title: string;
  content: string;
  user_id: number;
  username?: string;
  avatar_url?: string;
  category_id: number;
  status: string;
  views: number;
  likes_count: number;
  comments_count: number;
  created_at: number;
  updated_at: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  posts_count?: number;
  total_likes?: number;
  total_views?: number;
  created_at: number;
  updated_at: number;
}

type LeaderboardType = 'posts' | 'users';
type TimeRange = 'day' | 'week' | 'month' | 'all';
type SortBy = 'likes_count' | 'views' | 'comments_count' | 'posts_count';

// Mock data for posts
const mockPosts: Post[] = [
  {
    id: 1,
    title: '国潮插画设计',
    content: '这是一个关于国潮风格的插画设计作品，融合了传统元素与现代设计理念。',
    user_id: 1,
    username: '设计师小明',
    avatar_url: 'https://via.placeholder.com/64?text=设计师小明',
    category_id: 1,
    status: 'published',
    views: 1234,
    likes_count: 456,
    comments_count: 78,
    created_at: Date.now() - 86400000,
    updated_at: Date.now() - 86400000
  },
  {
    id: 2,
    title: '赛博朋克风格海报',
    content: '赛博朋克风格的海报设计，展现了未来科技感与城市夜景的融合。',
    user_id: 2,
    username: '插画师小红',
    avatar_url: 'https://via.placeholder.com/64?text=插画师小红',
    category_id: 2,
    status: 'published',
    views: 987,
    likes_count: 321,
    comments_count: 56,
    created_at: Date.now() - 172800000,
    updated_at: Date.now() - 172800000
  },
  {
    id: 3,
    title: '传统纹样现代化设计',
    content: '将传统纹样重新设计，应用于现代产品包装，展现传统文化的新活力。',
    user_id: 3,
    username: '设计师小李',
    avatar_url: 'https://via.placeholder.com/64?text=设计师小李',
    category_id: 3,
    status: 'published',
    views: 765,
    likes_count: 234,
    comments_count: 45,
    created_at: Date.now() - 259200000,
    updated_at: Date.now() - 259200000
  },
  {
    id: 4,
    title: '水墨风格动画短片',
    content: '使用传统水墨技法制作的动画短片，讲述了一个关于自然与人文的故事。',
    user_id: 4,
    username: '动画师小王',
    avatar_url: 'https://via.placeholder.com/64?text=动画师小王',
    category_id: 4,
    status: 'published',
    views: 543,
    likes_count: 189,
    comments_count: 34,
    created_at: Date.now() - 345600000,
    updated_at: Date.now() - 345600000
  },
  {
    id: 5,
    title: '民俗文化主题摄影',
    content: '民俗文化主题的摄影作品，记录了各地的传统节日与习俗。',
    user_id: 5,
    username: '摄影师小张',
    avatar_url: 'https://via.placeholder.com/64?text=摄影师小张',
    category_id: 5,
    status: 'published',
    views: 321,
    likes_count: 123,
    comments_count: 23,
    created_at: Date.now() - 432000000,
    updated_at: Date.now() - 432000000
  }
];

// Mock data for users
const mockUsers: User[] = [
  {
    id: 1,
    username: '设计师小明',
    email: 'xiaoming@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=设计师小明',
    posts_count: 12,
    total_likes: 2345,
    total_views: 15678,
    created_at: Date.now() - 31536000000,
    updated_at: Date.now() - 86400000
  },
  {
    id: 2,
    username: '插画师小红',
    email: 'xiaohong@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=插画师小红',
    posts_count: 8,
    total_likes: 1890,
    total_views: 12345,
    created_at: Date.now() - 2592000000,
    updated_at: Date.now() - 172800000
  },
  {
    id: 3,
    username: '设计师小李',
    email: 'xiaoli@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=设计师小李',
    posts_count: 15,
    total_likes: 2100,
    total_views: 14567,
    created_at: Date.now() - 1814400000,
    updated_at: Date.now() - 259200000
  },
  {
    id: 4,
    username: '动画师小王',
    email: 'xiaowang@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=动画师小王',
    posts_count: 6,
    total_likes: 1567,
    total_views: 10987,
    created_at: Date.now() - 1209600000,
    updated_at: Date.now() - 345600000
  },
  {
    id: 5,
    username: '摄影师小张',
    email: 'xiaozhang@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=摄影师小张',
    posts_count: 20,
    total_likes: 2890,
    total_views: 18765,
    created_at: Date.now() - 907200000,
    updated_at: Date.now() - 432000000
  },
  {
    id: 6,
    username: 'UI设计师小刘',
    email: 'xiaoliu@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=UI设计师小刘',
    posts_count: 14,
    total_likes: 1987,
    total_views: 13456,
    created_at: Date.now() - 777600000,
    updated_at: Date.now() - 518400000
  },
  {
    id: 7,
    username: '平面设计师小陈',
    email: 'xiaochen@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=平面设计师小陈',
    posts_count: 11,
    total_likes: 1765,
    total_views: 11234,
    created_at: Date.now() - 691200000,
    updated_at: Date.now() - 604800000
  },
  {
    id: 8,
    username: '3D设计师小周',
    email: 'xiaozhou@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=3D设计师小周',
    posts_count: 9,
    total_likes: 2012,
    total_views: 16789,
    created_at: Date.now() - 604800000,
    updated_at: Date.now() - 691200000
  },
  {
    id: 9,
    username: '视频编辑小吴',
    email: 'xiaowu@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=视频编辑小吴',
    posts_count: 7,
    total_likes: 1654,
    total_views: 10987,
    created_at: Date.now() - 518400000,
    updated_at: Date.now() - 777600000
  },
  {
    id: 10,
    username: '动效设计师小郑',
    email: 'xiaozheng@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=动效设计师小郑',
    posts_count: 13,
    total_likes: 2234,
    total_views: 14567,
    created_at: Date.now() - 432000000,
    updated_at: Date.now() - 864000000
  },
  {
    id: 11,
    username: '游戏设计师小冯',
    email: 'xiaofeng@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=游戏设计师小冯',
    posts_count: 10,
    total_likes: 1987,
    total_views: 13456,
    created_at: Date.now() - 345600000,
    updated_at: Date.now() - 950400000
  },
  {
    id: 12,
    username: '交互设计师小沈',
    email: 'xishenshen@example.com',
    avatar_url: 'https://via.placeholder.com/64?text=交互设计师小沈',
    posts_count: 16,
    total_likes: 2456,
    total_views: 17890,
    created_at: Date.now() - 259200000,
    updated_at: Date.now() - 1036800000
  }
];

// Helper function to sort mock data by different criteria
const sortMockData = <T extends Post | User>(data: T[], sortBy: SortBy): T[] => {
  return [...data].sort((a, b) => {
    if (sortBy === 'likes_count') {
      return (b as any).likes_count - (a as any).likes_count;
    } else if (sortBy === 'views') {
      return (b as any).views - (a as any).views;
    } else if (sortBy === 'comments_count') {
      return (b as any).comments_count - (a as any).comments_count;
    } else if (sortBy === 'posts_count') {
      return (b as any).posts_count - (a as any).posts_count;
    }
    return 0;
  });
};

const Leaderboard: React.FC = () => {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('users');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [sortBy, setSortBy] = useState<SortBy>('likes_count');
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType, timeRange, sortBy]);

  // 键盘事件监听，支持Esc键关闭弹窗
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDetailOpen) {
        handleCloseDetail();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailOpen]);

  // 添加本地缓存机制
  const [cache, setCache] = useState<Record<string, { posts: Post[]; users: User[] }>>({});
  
  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    
    // 生成缓存键
    const cacheKey = `${leaderboardType}-${sortBy}-${timeRange}`;
    
    // 检查缓存
    if (cache[cacheKey]) {
      if (leaderboardType === 'posts') {
        setPosts(cache[cacheKey].posts);
      } else {
        setUsers(cache[cacheKey].users);
      }
      setLoading(false);
      return;
    }
    
    // 优化：立即使用mock数据作为初始加载，然后异步更新API数据
    const sortedMockPosts = sortMockData(mockPosts, sortBy);
    const sortedMockUsers = sortMockData(mockUsers, sortBy);
    
    if (leaderboardType === 'posts') {
      setPosts(sortedMockPosts);
    } else {
      setUsers(sortedMockUsers);
    }
    
    // 使用mock数据更新缓存
    setCache(prev => ({
      ...prev, 
      [cacheKey]: {
        ...prev[cacheKey] || { posts: [], users: [] },
        posts: sortedMockPosts,
        users: sortedMockUsers
      }
    }));
    
    try {
      // 优化API请求：减少超时时间，去除重试
      if (leaderboardType === 'posts') {
        const response = await apiClient.get(`/api/leaderboard/posts?sortBy=${sortBy}&timeRange=${timeRange}&limit=10`, {
          timeoutMs: 5000,
          retries: 0
        });
        const data = Array.isArray(response.data) && response.data.length > 0 ? response.data as Post[] : sortedMockPosts;
        setPosts(data);
        setCache(prev => ({ ...prev, [cacheKey]: { ...prev[cacheKey] || { posts: [], users: [] }, posts: data } }));
      } else {
        const response = await apiClient.get(`/api/leaderboard/users?sortBy=${sortBy}&timeRange=${timeRange}&limit=10`, {
          timeoutMs: 5000,
          retries: 0
        });
        const data = Array.isArray(response.data) && response.data.length > 0 ? response.data as User[] : sortedMockUsers;
        setUsers(data);
        setCache(prev => ({ ...prev, [cacheKey]: { ...prev[cacheKey] || { posts: [], users: [] }, users: data } }));
      }
    } catch (err: any) {
      // API请求失败时，继续使用mock数据，不显示错误
      console.log('API请求失败，使用mock数据:', err.message);
      // 不设置错误状态，保持使用mock数据
    } finally {
      // 使用requestAnimationFrame确保UI流畅更新
      requestAnimationFrame(() => {
        setLoading(false);
      });
    }
  };

  const handlePostClick = (postId: number) => {
    navigate(`/explore/${postId}`);
  };

  const handleUserClick = async (user: User) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    
    // 获取用户热门作品
    try {
      // 使用mock数据筛选用户的热门作品
      const sortedPosts = mockPosts.filter(post => post.user_id === user.id)
        .sort((a, b) => b.likes_count - a.likes_count)
        .slice(0, 3);
      setUserPosts(sortedPosts);
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
      setUserPosts([]);
    } finally {
      // 使用requestAnimationFrame确保UI流畅更新
      requestAnimationFrame(() => {
        setIsLoadingDetail(false);
      });
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => {
      setSelectedUser(null);
      setUserPosts([]);
    }, 300);
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'text-amber-600 dark:text-amber-400 font-bold';
    if (index === 1) return 'text-gray-600 dark:text-gray-300 font-bold';
    if (index === 2) return 'text-amber-700 dark:text-amber-500 font-bold';
    return 'text-gray-500 dark:text-gray-400 font-medium';
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {index + 1}
          </span>
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700">
          <span className="text-xl font-bold text-gray-600 dark:text-gray-300">
            {index + 1}
          </span>
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-800/30">
          <span className="text-xl font-bold text-amber-700 dark:text-amber-500">
            {index + 1}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800">
        <span className={`text-lg font-medium ${getRankColor(index)}`}>
          {index + 1}
        </span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">设计师排行榜</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">发现平台上最受欢迎的设计师和作品</p>
        
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="bg-gray-100 dark:bg-gray-700/50 px-3 py-1 rounded-full text-gray-700 dark:text-gray-300">
            <span className="font-medium">类型:</span> {leaderboardType === 'posts' ? '热门帖子' : '热门创作者'}
          </span>
          <span className="bg-gray-100 dark:bg-gray-700/50 px-3 py-1 rounded-full text-gray-700 dark:text-gray-300">
            <span className="font-medium">时间:</span> {timeRange === 'day' ? '今日' : timeRange === 'week' ? '本周' : timeRange === 'month' ? '本月' : '总榜'}
          </span>
          <span className="bg-gray-100 dark:bg-gray-700/50 px-3 py-1 rounded-full text-gray-700 dark:text-gray-300">
            <span className="font-medium">排序:</span> {sortBy === 'likes_count' ? '点赞数' : sortBy === 'views' ? '浏览量' : sortBy === 'comments_count' ? '评论数' : '作品数量'}
          </span>
          <span className="bg-gray-100 dark:bg-gray-700/50 px-3 py-1 rounded-full text-gray-700 dark:text-gray-300">
            <span className="font-medium">数据:</span> {(leaderboardType === 'posts' ? posts.length : users.length).toString()}
          </span>
        </div>
      </div>

      {/* 筛选选项 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-5 mb-8 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          {/* 排行榜类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">排行榜类型</label>
            <div className="flex space-x-2 flex-wrap">
              <button
                onClick={() => setLeaderboardType('posts')}
                className={`flex-1 min-w-[120px] px-3 py-2 text-sm rounded-lg font-medium transition-all ${leaderboardType === 'posts' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                热门帖子
              </button>
              <button
                onClick={() => setLeaderboardType('users')}
                className={`flex-1 min-w-[120px] px-3 py-2 text-sm rounded-lg font-medium transition-all ${leaderboardType === 'users' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                热门创作者
              </button>
            </div>
          </div>

          {/* 时间范围 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">时间范围</label>
            <div className="flex space-x-2 flex-wrap gap-y-2">
              {(['day', 'week', 'month', 'all'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`flex-1 min-w-[70px] px-3 py-1.5 rounded-full text-sm font-medium transition-all ${timeRange === range ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                  {range === 'day' && '今日'}
                  {range === 'week' && '本周'}
                  {range === 'month' && '本月'}
                  {range === 'all' && '总榜'}
                </button>
              ))}
            </div>
          </div>

          {/* 排序方式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">排序方式</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {leaderboardType === 'posts' ? (
                <>
                  <option value="likes_count">点赞数</option>
                  <option value="views">浏览量</option>
                  <option value="comments_count">评论数</option>
                </>
              ) : (
                <>
                  <option value="posts_count">作品数量</option>
                  <option value="likes_count">总点赞数</option>
                  <option value="views">总浏览量</option>
                </>
              )}
            </select>
          </div>
        </div>
      </motion.div>

      {/* 加载状态 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"
            ></motion.div>
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-400">正在加载排行榜数据...</p>
        </div>
      ) : error ? (
        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-700 dark:text-red-300 shadow-sm">
          <div className="flex items-center mb-3">
            <i className="fas fa-exclamation-circle text-xl mr-3"></i>
            <h3 className="text-lg font-medium">获取数据失败</h3>
          </div>
          <p>{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            重试
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {leaderboardType === 'posts' ? (
            posts.map((post, index) => (
              <motion.div 
              key={post.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                ease: "easeOut",
                delay: index * 0.02
              }}
              whileHover={{ 
                y: -2, 
                transition: { duration: 0.2 }
              }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
                onClick={() => handlePostClick(post.id)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="relative flex-shrink-0">
                      <div className="relative z-10">
                        {getRankBadge(index)}
                      </div>
                      {/* 移除复杂的脉冲动画背景 */}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {post.title}
                      </h3>
                      
                      <div className="flex items-center gap-3 mb-4">
                        {post.username && (
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(post.username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&size=32`}
                            alt={post.username}
                            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 object-cover"
                            width={32}
                            height={32}
                            loading="lazy"
                          />
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">{post.username || '未知用户'}</span>
                        <span className="text-gray-400 dark:text-gray-600">•</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                      
                      <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-5">
                          <span className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                            </svg>
                            {post.views}
                          </span>
                          
                          <span className="flex items-center text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors">
                            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                            </svg>
                            {post.likes_count}
                          </span>
                          
                          <span className="flex items-center text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 cursor-pointer transition-colors">
                            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                            </svg>
                            {post.comments_count}
                          </span>
                        </div>
                        
                        <div className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors">
                          <i className="fas fa-arrow-right text-sm"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            users.map((user, index) => (
              <motion.div 
                key={user.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  ease: "easeOut",
                  delay: index * 0.02
                }}
                whileHover={{ 
                  y: -2, 
                  transition: { duration: 0.2 }
                }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
                onClick={() => handleUserClick(user)}
              >
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="relative z-10">
                        {getRankBadge(index)}
                      </div>
                      {/* 移除复杂的脉冲动画背景 */}
                    </div>
                    
                    {/* 使用DiceBear生成美观的头像 */}
                    <div className="relative">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                        alt={user.username}
                        className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover"
                        width={64}
                        height={64}
                        loading="lazy"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{user.username}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 truncate">
                        <i className="fas fa-envelope text-xs opacity-70"></i>
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5">
                          <i className="fas fa-image text-xs opacity-80"></i>
                          作品数量
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.posts_count || 0}</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5">
                          <i className="fas fa-heart text-xs opacity-80"></i>
                          总点赞数
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.total_likes || 0}</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5">
                          <i className="fas fa-eye text-xs opacity-80"></i>
                          总浏览量
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.total_views || 0}</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5">
                          <i className="fas fa-calendar-alt text-xs opacity-80"></i>
                          加入时间
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* 创作者详情弹窗 */}
      {isDetailOpen && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleCloseDetail}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">创作者详情</h2>
              <button
                onClick={handleCloseDetail}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6">
              {/* 用户基本信息 */}
              <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                <div className="relative">
                  <img
                    src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedUser.username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                    alt={selectedUser.username}
                    className="w-24 h-24 rounded-full border-4 border-gray-200 dark:border-gray-600 object-cover"
                    width={96}
                    height={96}
                  />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedUser.username}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3 flex items-center justify-center md:justify-start gap-1">
                    <i className="fas fa-envelope text-sm opacity-70"></i>
                    {selectedUser.email}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center justify-center md:justify-start gap-1">
                    <i className="fas fa-calendar-alt text-sm opacity-70"></i>
                    加入时间：{new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* 作品统计 */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">作品数量</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.posts_count || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">总点赞数</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.total_likes || 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">总浏览量</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.total_views || 0}</p>
                </div>
              </div>

              {/* 热门作品 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">热门作品</h3>
                
                {isLoadingDetail ? (
                  /* 加载状态 */
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 max-w-md"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded max-w-xs"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userPosts.length > 0 ? (
                  /* 作品列表 */
                  <div className="space-y-4">
                    {userPosts.map((post) => (
                      <div 
                        key={post.id} 
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                        onClick={() => {
                          handleCloseDetail();
                          setTimeout(() => handlePostClick(post.id), 300);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-image text-blue-600 dark:text-blue-400"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate mb-1">{post.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                              <span className="flex items-center gap-1">
                                <i className="fas fa-eye"></i>
                                {post.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <i className="fas fa-heart"></i>
                                {post.likes_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <i className="fas fa-comment"></i>
                                {post.comments_count}
                              </span>
                            </div>
                          </div>
                          <div className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <i className="fas fa-arrow-right text-sm"></i>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* 无作品状态 */
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 text-center">
                    <i className="fas fa-images text-4xl text-gray-400 dark:text-gray-600 mb-3"></i>
                    <p className="text-gray-600 dark:text-gray-400">该用户暂无作品</p>
                  </div>
                )}
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={handleCloseDetail}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {loading && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center shadow-sm animate-pulse">
          <div className="w-20 h-20 mx-auto bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          </div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-3 max-w-xs mx-auto"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-6 max-w-md mx-auto"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-lg max-w-xs mx-auto"></div>
        </div>
      )}
      
      {(!posts.length && !users.length && !loading && !error) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3,
            ease: "easeOut"
          }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center shadow-sm"
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-6">
            <svg 
              className="w-10 h-10 text-gray-500 dark:text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">暂无数据</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {leaderboardType === 'posts' 
              ? '还没有足够的帖子数据，快来发布你的第一个作品吧！' 
              : '还没有足够的用户数据，邀请更多创作者加入吧！'}
          </p>
          {leaderboardType === 'posts' && (
            <button
              onClick={() => navigate('/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center mx-auto"
            >
              <i className="fas fa-plus mr-2"></i>
              发布作品
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Leaderboard;