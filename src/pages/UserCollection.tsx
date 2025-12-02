import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { useContext } from 'react';

import postsApi from '@/services/postService';
import { Post } from '@/services/postService';

export default function UserCollection() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'likes'>('bookmarks');
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 检查是否已登录
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    } else {
      loadUserCollections();
    }
  }, [isAuthenticated, user, navigate]);

  // 加载用户收藏和点赞作品
  const loadUserCollections = () => {
    setIsLoading(true);
    try {
      const bookmarks = postsApi.getBookmarkedPosts();
      const likes = postsApi.getLikedPosts();
      setBookmarkedPosts(bookmarks);
      setLikedPosts(likes);
    } catch (error) {
      console.error('加载用户收藏失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取当前展示的作品
  const currentPosts = activeTab === 'bookmarks' ? bookmarkedPosts : likedPosts;

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="text-5xl text-gray-400 mb-4"><i className="fas fa-spinner fa-spin"></i></div>
          <h2 className="text-xl font-semibold mb-2">加载中...</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>正在获取您的收藏和点赞作品</p>
        </div>
      </main>
    );
  }

  return (
      <main className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">我的收藏</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            查看和管理您收藏与点赞的作品
          </p>
        </motion.div>

        {/* 标签切换 */}
        <motion.div 
          className={`mb-8 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all ${activeTab === 'bookmarks' ? 
                `${isDark ? 'bg-gray-700 text-white' : 'bg-white text-red-600 shadow-md'}` : 
                `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              <i className={`far fa-bookmark mr-2 ${activeTab === 'bookmarks' ? 'text-red-500' : ''}`}></i>
              我的收藏
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                {bookmarkedPosts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('likes')}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all ${activeTab === 'likes' ? 
                `${isDark ? 'bg-gray-700 text-white' : 'bg-white text-red-600 shadow-md'}` : 
                `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              <i className={`far fa-heart mr-2 ${activeTab === 'likes' ? 'text-red-500' : ''}`}></i>
              我的点赞
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                {likedPosts.length}
              </span>
            </button>
          </div>
        </motion.div>

        {/* 作品列表 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {currentPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentPosts.map((post) => (
                <motion.div
                  key={post.id}
                  className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} shadow-md transition-all hover:shadow-lg`}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/explore/${post.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/explore/${post.id}`);
                    }
                  }}
                >
                  <div className="relative">
                    <img 
                      src={post.thumbnail} 
                      alt={post.title} 
                      className="w-full h-48 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute top-2 right-2 flex space-x-2">
                      {post.isBookmarked && (
                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <i className="far fa-bookmark mr-1"></i>
                          已收藏
                        </div>
                      )}
                      {post.isLiked && (
                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <i className="far fa-heart mr-1"></i>
                          已点赞
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-2 line-clamp-2">{post.title}</h3>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {post.category}
                      </span>
                      <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {post.date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <i className="far fa-eye mr-1"></i>
                          {post.views}
                        </span>
                        <span className="flex items-center">
                          <i className="far fa-thumbs-up mr-1"></i>
                          {post.likes}
                        </span>
                        <span className="flex items-center">
                          <i className="far fa-comment mr-1"></i>
                          {post.comments.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`rounded-xl p-12 text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <div className="text-5xl text-gray-400 mb-4">
                {activeTab === 'bookmarks' ? (
                  <i className="far fa-bookmark"></i>
                ) : (
                  <i className="far fa-heart"></i>
                )}
              </div>
              <h2 className="text-xl font-semibold mb-2">暂无{activeTab === 'bookmarks' ? '收藏' : '点赞'}作品</h2>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                去探索页面{activeTab === 'bookmarks' ? '收藏' : '点赞'}一些作品吧
              </p>
              <button
                onClick={() => navigate('/explore')}
                className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                去探索
              </button>
            </div>
          )}
        </motion.div>
      </main>
  );
}
