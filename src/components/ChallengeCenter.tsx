import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

// 挑战类型定义
interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  coverImage: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed';
  participants: number;
  submissions: number;
  isFeatured: boolean;
}

// 参赛作品类型定义
interface Submission {
  id: string;
  title: string;
  description: string;
  author: string;
  thumbnail: string;
  likes: number;
  views: number;
  comments: number;
  date: Date;
  isWinner: boolean;
  rank?: number;
}

// 模拟数据
const challenges: Challenge[] = [
  {
    id: '1',
    title: '天津文化创意设计大赛',
    description: '围绕天津文化特色，设计创意作品',
    category: '设计',
    tags: ['天津', '文化', '创意'],
    coverImage: 'https://images.unsplash.com/photo-1568702840618-4d2604190349?w=800&h=400&fit=crop',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'active',
    participants: 125,
    submissions: 89,
    isFeatured: true
  },
  {
    id: '2',
    title: '国潮风格插画大赛',
    description: '创作具有国潮风格的插画作品',
    category: '插画',
    tags: ['国潮', '插画', '创意'],
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    status: 'upcoming',
    participants: 0,
    submissions: 0,
    isFeatured: false
  },
  {
    id: '3',
    title: '数字艺术创作大赛',
    description: '使用数字技术创作艺术作品',
    category: '数字艺术',
    tags: ['数字艺术', '创作', '科技'],
    coverImage: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&h=400&fit=crop',
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    status: 'completed',
    participants: 256,
    submissions: 198,
    isFeatured: false
  }
];

// 模拟参赛作品数据
const submissions: Submission[] = [
  {
    id: '1',
    title: '天津之眼创意设计',
    description: '以天津之眼为主题的创意设计作品',
    author: '创意设计师',
    thumbnail: 'https://images.unsplash.com/photo-1568702840618-4d2604190349?w=400&h=300&fit=crop',
    likes: 125,
    views: 2048,
    comments: 36,
    date: new Date(),
    isWinner: true,
    rank: 1
  },
  {
    id: '2',
    title: '天津古文化街插画',
    description: '天津古文化街的插画作品',
    author: '插画师小王',
    thumbnail: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop',
    likes: 98,
    views: 1536,
    comments: 24,
    date: new Date(),
    isWinner: true,
    rank: 2
  },
  {
    id: '3',
    title: '天津美食海报',
    description: '天津特色美食的海报设计',
    author: '设计师小李',
    thumbnail: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    likes: 85,
    views: 1280,
    comments: 18,
    date: new Date(),
    isWinner: true,
    rank: 3
  }
];

const ChallengeCenter: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(challenges[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 分类列表
  const categories = ['all', '设计', '插画', '数字艺术', '摄影', '文学'];

  // 过滤挑战
  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        challenge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        challenge.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || challenge.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 处理点赞参赛作品
  const handleLikeSubmission = (challengeId: string, submissionId: string) => {
    // 这里可以添加点赞逻辑
    console.log('点赞参赛作品:', challengeId, submissionId);
  };

  return (
    <div className={`min-h-screen p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">挑战中心</h1>

        {/* 搜索和分类 */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索挑战..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? '全部分类' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 挑战列表 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 挑战详情 */}
          <div className="md:col-span-1">
            {selectedChallenge && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`rounded-lg overflow-hidden shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={selectedChallenge.coverImage}
                    alt={selectedChallenge.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-2xl font-bold mb-2">{selectedChallenge.title}</h2>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {selectedChallenge.category}
                    </span>
                    {selectedChallenge.isFeatured && (
                      <span className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                        精选
                      </span>
                    )}
                  </div>
                  <p className="mb-4 opacity-70">{selectedChallenge.description}</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm opacity-70">状态</div>
                      <div className={`font-medium ${selectedChallenge.status === 'active' ? 'text-green-600' : selectedChallenge.status === 'upcoming' ? 'text-blue-600' : 'text-gray-600'}`}>
                        {selectedChallenge.status === 'active' ? '进行中' : selectedChallenge.status === 'upcoming' ? '即将开始' : '已结束'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm opacity-70">参与人数</div>
                      <div className="font-medium">{selectedChallenge.participants}</div>
                    </div>
                    <div>
                      <div className="text-sm opacity-70">参赛作品</div>
                      <div className="font-medium">{selectedChallenge.submissions}</div>
                    </div>
                    <div>
                      <div className="text-sm opacity-70">截止日期</div>
                      <div className="font-medium">{selectedChallenge.endDate.toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedChallenge.tags.map(tag => (
                      <span
                        key={tag}
                        className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
                  >
                    立即参与
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* 参赛作品列表 */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">参赛作品</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-lg overflow-hidden shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-lg transition-shadow duration-200`}
                >
                  {/* 作品缩略图 */}
                  <div className="relative">
                    <img
                      src={submission.thumbnail}
                      alt={submission.title}
                      className="w-full h-48 object-cover"
                    />
                    {/* 获胜标记 */}
                    {submission.isWinner && (
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${submission.rank === 1 ? 'bg-yellow-500 text-white' : submission.rank === 2 ? 'bg-gray-400 text-white' : submission.rank === 3 ? 'bg-amber-700 text-white' : 'bg-blue-500 text-white'}`}>
                          {submission.rank === 1 ? '冠军' : submission.rank === 2 ? '亚军' : submission.rank === 3 ? '季军' : '优胜奖'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* 作品信息 */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-1 line-clamp-2">{submission.title}</h3>
                    <p className="text-sm opacity-70 mb-3 line-clamp-2">{submission.description}</p>
                    
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <span className="opacity-70">作者: </span>
                        <span className="font-medium">{submission.author}</span>
                      </div>
                      <span className="opacity-70">
                        {new Date(submission.date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleLikeSubmission(selectedChallenge!.id, submission.id)}
                          className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          {submission.likes}
                        </motion.button>
                        
                        <span className="flex items-center gap-1 opacity-70">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {submission.views}
                        </span>
                        
                        <span className="flex items-center gap-1 opacity-70">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.707 10.293a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L5.586 11H2a1 1 0 110-2h3.586l-1.293-1.293a1 1 0 111.414-1.414l3 3zM13 12a1 1 0 100-2h-3.586l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 13H13z" clipRule="evenodd" />
                          </svg>
                          {submission.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 其他挑战 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">其他挑战</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.filter(challenge => challenge.id !== selectedChallenge?.id).map(challenge => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`rounded-lg overflow-hidden shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'} hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
                onClick={() => setSelectedChallenge(challenge)}
              >
                <div className="h-32 overflow-hidden">
                  <img
                    src={challenge.coverImage}
                    alt={challenge.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1">{challenge.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {challenge.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${challenge.status === 'active' ? 'bg-green-600 text-white' : challenge.status === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'}`}>
                      {challenge.status === 'active' ? '进行中' : challenge.status === 'upcoming' ? '即将开始' : '已结束'}
                    </span>
                  </div>
                  <p className="text-sm opacity-70 mb-3 line-clamp-2">{challenge.description}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70">{challenge.participants} 人参与</span>
                    <button
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCenter;