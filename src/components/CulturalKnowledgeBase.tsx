import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

// 知识条目类型定义
interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
  coverImage: string;
}

// 模拟数据
const knowledgeItems: KnowledgeItem[] = [
  {
    id: '1',
    title: '天津杨柳青年画',
    description: '天津杨柳青年画是中国著名的民间木版年画之一，起源于明代崇祯年间，具有鲜明的地方特色和艺术风格。',
    category: '民间艺术',
    tags: ['年画', '民间艺术', '天津特色'],
    content: '天津杨柳青年画是中国著名的民间木版年画之一，起源于明代崇祯年间，具有鲜明的地方特色和艺术风格。杨柳青年画以其精湛的工艺、丰富的题材和生动的形象而闻名于世，是中国民间艺术的瑰宝。',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'
  },
  {
    id: '2',
    title: '泥人张彩塑',
    description: '泥人张彩塑是天津的传统民间艺术，以其栩栩如生的形象和精湛的技艺而闻名。',
    category: '民间艺术',
    tags: ['彩塑', '民间艺术', '天津特色'],
    content: '泥人张彩塑是天津的传统民间艺术，以其栩栩如生的形象和精湛的技艺而闻名。泥人张彩塑的历史可以追溯到清代道光年间，至今已有近200年的历史。',
    coverImage: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=400&h=300&fit=crop'
  },
  {
    id: '3',
    title: '天津狗不理包子',
    description: '狗不理包子是天津的传统名吃，以其皮薄馅大、鲜香可口而闻名。',
    category: '传统美食',
    tags: ['美食', '天津特色', '传统小吃'],
    content: '狗不理包子是天津的传统名吃，以其皮薄馅大、鲜香可口而闻名。狗不理包子的历史可以追溯到清代咸丰年间，至今已有160多年的历史。',
    coverImage: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop'
  },
  {
    id: '4',
    title: '天津相声',
    description: '天津是相声的发源地之一，天津相声以其幽默风趣、贴近生活而深受观众喜爱。',
    category: '传统曲艺',
    tags: ['相声', '曲艺', '天津特色'],
    content: '天津是相声的发源地之一，天津相声以其幽默风趣、贴近生活而深受观众喜爱。天津相声的历史可以追溯到清代末年，至今已有100多年的历史。',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop'
  },
  {
    id: '5',
    title: '天津古文化街',
    description: '天津古文化街是天津的著名旅游景点，以其浓厚的历史文化氛围和传统建筑而闻名。',
    category: '历史遗迹',
    tags: ['旅游', '历史遗迹', '天津特色'],
    content: '天津古文化街是天津的著名旅游景点，以其浓厚的历史文化氛围和传统建筑而闻名。古文化街位于天津市南开区东北角东门外，海河西岸，是一条以天后宫为中心，集旅游观光、购物、餐饮于一体的商业步行街。',
    coverImage: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop'
  },
  {
    id: '6',
    title: '天津大沽口炮台',
    description: '天津大沽口炮台是中国近代史上的重要历史遗迹，见证了中国人民反抗外国侵略的英勇斗争。',
    category: '历史遗迹',
    tags: ['历史遗迹', '爱国主义教育', '天津特色'],
    content: '天津大沽口炮台是中国近代史上的重要历史遗迹，见证了中国人民反抗外国侵略的英勇斗争。大沽口炮台位于天津市滨海新区，是明清时期的海防要塞，也是第二次鸦片战争和八国联军侵华战争的重要战场。',
    coverImage: 'https://images.unsplash.com/photo-1568702840618-4d2604190349?w=400&h=300&fit=crop'
  }
];

const CulturalKnowledgeBase: React.FC = () => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

  // 分类列表
  const categories = ['all', '民间艺术', '传统美食', '传统曲艺', '历史遗迹'];

  // 过滤知识条目
  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 打开详情
  const openDetail = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  return (
    <div className={`min-h-screen p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">天津文化知识库</h1>

        {/* 搜索和分类 */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索知识库..."
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

        {/* 知识条目列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-lg overflow-hidden shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              onClick={() => openDetail(item)}
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    {item.category}
                  </span>
                </div>
                <p className="text-sm opacity-70 mb-3">{item.description}</p>
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
            <h3 className="text-lg font-medium mb-2">暂无相关知识</h3>
            <p className="opacity-70">请尝试调整搜索条件或分类</p>
          </div>
        )}

        {/* 详情模态框 */}
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
              className={`max-w-3xl w-full rounded-lg overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-64 overflow-hidden">
                <img
                  src={selectedItem.coverImage}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {selectedItem.category}
                    </span>
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
                  <h3 className="text-lg font-semibold mb-2">描述</h3>
                  <p className="opacity-80">{selectedItem.description}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">详细内容</h3>
                  <p className="opacity-80 whitespace-pre-line">{selectedItem.content}</p>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetail(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    关闭
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

export default CulturalKnowledgeBase;