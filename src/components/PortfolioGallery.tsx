import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

// 作品类型定义
interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  images: string[];
  likes: number;
  views: number;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    name: string;
    avatar: string;
  };
  isFeatured: boolean;
}

// 模拟数据
const portfolioItems: PortfolioItem[] = [
  {
    id: '1',
    title: '天津之眼创意设计',
    description: '以天津之眼为主题的创意设计作品',
    category: '设计',
    tags: ['天津', '设计', '创意'],
    images: [
      'https://images.unsplash.com/photo-1568702840618-4d2604190349?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop'
    ],
    likes: 125,
    views: 2048,
    shares: 36,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      name: '创意设计师',
      avatar: 'https://via.placeholder.com/40'
    },
    isFeatured: true
  },
  {
    id: '2',
    title: '天津古文化街插画',
    description: '天津古文化街的插画作品',
    category: '插画',
    tags: ['天津', '插画', '文化'],
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&h=600&fit=crop'
    ],
    likes: 98,
    views: 1536,
    shares: 24,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      name: '插画师小王',
      avatar: 'https://via.placeholder.com/40'
    },
    isFeatured: false
  },
  {
    id: '3',
    title: '天津美食海报',
    description: '天津特色美食的海报设计',
    category: '海报',
    tags: ['天津', '美食', '海报'],
    images: [
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1568702840618-4d2604190349?w=800&h=600&fit=crop'
    ],
    likes: 85,
    views: 1280,
    shares: 18,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      name: '设计师小李',
      avatar: 'https://via.placeholder.com/40'
    },
    isFeatured: false
  },
  {
    id: '4',
    title: '天津建筑摄影',
    description: '天津特色建筑的摄影作品',
    category: '摄影',
    tags: ['天津', '建筑', '摄影'],
    images: [
      'https://images.unsplash.com/photo-1568702840618-4d2604190349?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop'
    ],
    likes: 112,
    views: 1856,
    shares: 32,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      name: '摄影师小张',
      avatar: 'https://via.placeholder.com/40'
    },
    isFeatured: true
  }
];

const PortfolioGallery: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDetail, setShowDetail] = useState(false);

  // 分类列表
  const categories = ['all', '设计', '插画', '海报', '摄影', '数字艺术'];

  // 过滤作品
  const filteredItems = portfolioItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 打开作品详情
  const openDetail = (item: PortfolioItem) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  return (
    <div className={`min-h-screen p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">作品画廊</h1>

        {/* 搜索和分类 */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索作品..."
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

        {/* 作品列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-lg overflow-hidden shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} cursor-pointer`}
              onClick={() => openDetail(item)}
            >
              <div className="relative">
                <div className="h-48 overflow-hidden">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
                {item.isFeatured && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                    精选
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs font-medium px-2 py-1 rounded-full">
                  {item.category}
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm">{item.likes}</span>
                  </div>
                </div>
                <p className="text-sm opacity-70 mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <img
                    src={item.author.avatar}
                    alt={item.author.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium">{item.author.name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span
                      key={tag}
                      className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 text-sm opacity-70">
                  <span>{item.views} 次浏览</span>
                  <span>{item.shares} 次分享</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 无结果提示 */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">暂无作品</h3>
            <p className="opacity-70">请尝试调整搜索条件或分类</p>
          </div>
        )}

        {/* 作品详情模态框 */}
        {showDetail && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`max-w-5xl w-full rounded-lg overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-96 overflow-hidden">
                <img
                  src={selectedItem.images[0]}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {selectedItem.category}
                      </span>
                      {selectedItem.isFeatured && (
                        <span className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                          精选
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetail(false)}
                    className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                    aria-label="关闭"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <img
                    src={selectedItem.author.avatar}
                    alt={selectedItem.author.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-medium">{selectedItem.author.name}</span>
                    <span className="ml-2 text-sm opacity-70">{selectedItem.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedItem.tags.map(tag => (
                    <span
                      key={tag}
                      className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">作品描述</h3>
                  <p className="opacity-80">{selectedItem.description}</p>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">作品图片</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedItem.images.map((image, index) => (
                      <div key={index} className="rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`${selectedItem.title} 图片 ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <button className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      <span>{selectedItem.likes} 点赞</span>
                    </button>
                    <button className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      <span>{selectedItem.views} 浏览</span>
                    </button>
                    <button className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.707 10.293a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L5.586 11H2a1 1 0 110-2h3.586l-1.293-1.293a1 1 0 111.414-1.414l3 3zM13 12a1 1 0 100-2h-3.586l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 13H13z" clipRule="evenodd" />
                      </svg>
                      <span>{selectedItem.shares} 分享</span>
                    </button>
                  </div>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
                  >
                    收藏作品
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PortfolioGallery;