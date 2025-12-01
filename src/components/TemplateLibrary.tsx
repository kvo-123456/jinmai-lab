import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

// 模板类型定义
interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail: string;
  previewImages: string[];
  isPremium: boolean;
  popularity: number;
  createdAt: Date;
  updatedAt: Date;
}

// 模拟数据
const templates: Template[] = [
  {
    id: '1',
    title: '天津特色海报模板',
    description: '适合宣传天津特色文化的海报模板',
    category: '海报',
    tags: ['天津', '海报', '文化'],
    thumbnail: 'https://images.unsplash.com/photo-1568702840618-4d2604190349?w=400&h=300&fit=crop',
    previewImages: [
      'https://images.unsplash.com/photo-1568702840618-4d2604190349?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop'
    ],
    isPremium: false,
    popularity: 95,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: '国潮风格宣传册模板',
    description: '适合国潮风格产品宣传的宣传册模板',
    category: '宣传册',
    tags: ['国潮', '宣传册', '产品'],
    thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    previewImages: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&h=600&fit=crop'
    ],
    isPremium: true,
    popularity: 88,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: '简约风格社交媒体模板',
    description: '适合社交媒体发布的简约风格模板',
    category: '社交媒体',
    tags: ['简约', '社交媒体', '帖子'],
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop',
    previewImages: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1568702840618-4d2604190349?w=800&h=600&fit=crop'
    ],
    isPremium: false,
    popularity: 92,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    title: '节日庆典海报模板',
    description: '适合各种节日庆典的海报模板',
    category: '海报',
    tags: ['节日', '庆典', '海报'],
    thumbnail: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    previewImages: [
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop'
    ],
    isPremium: false,
    popularity: 85,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    title: '企业宣传PPT模板',
    description: '适合企业宣传的PPT模板',
    category: 'PPT',
    tags: ['企业', '宣传', 'PPT'],
    thumbnail: 'https://images.unsplash.com/photo-1568702840618-4d2604190349?w=400&h=300&fit=crop',
    previewImages: [
      'https://images.unsplash.com/photo-1568702840618-4d2604190349?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'
    ],
    isPremium: true,
    popularity: 89,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '6',
    title: '产品展示模板',
    description: '适合产品展示的模板',
    category: '展示',
    tags: ['产品', '展示', '宣传'],
    thumbnail: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=400&h=300&fit=crop',
    previewImages: [
      'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop'
    ],
    isPremium: false,
    popularity: 91,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const TemplateLibrary: React.FC = () => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  // 分类列表
  const categories = ['all', '海报', '宣传册', '社交媒体', 'PPT', '展示'];

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 打开模板详情
  const openDetail = (template: Template) => {
    setSelectedTemplate(template);
    setShowDetail(true);
  };

  return (
    <div className={`min-h-screen p-4 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">模板库</h1>

        {/* 搜索和分类 */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索模板..."
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
          <button
            onClick={() => setIsCreatingTemplate(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
          >
            创建模板
          </button>
        </div>

        {/* 模板列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-lg overflow-hidden shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              onClick={() => openDetail(template)}
            >
              <div className="relative">
                <div className="h-48 overflow-hidden">
                  <img
                    src={template.thumbnail}
                    alt={template.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
                {template.isPremium && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                    会员专享
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs font-medium px-2 py-1 rounded-full">
                  {template.category}
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold">{template.title}</h3>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm">{template.popularity}</span>
                  </div>
                </div>
                <p className="text-sm opacity-70 mb-3">{template.description}</p>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map(tag => (
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
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">暂无模板</h3>
            <p className="opacity-70">请尝试调整搜索条件或分类</p>
          </div>
        )}

        {/* 模板详情模态框 */}
        {showDetail && selectedTemplate && (
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
              <div className="h-80 overflow-hidden">
                <img
                  src={selectedTemplate.previewImages[0]}
                  alt={selectedTemplate.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedTemplate.title}</h2>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {selectedTemplate.category}
                      </span>
                      {selectedTemplate.isPremium && (
                        <span className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                          会员专享
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm">{selectedTemplate.popularity}</span>
                      </div>
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
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedTemplate.tags.map(tag => (
                    <span
                      key={tag}
                      className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">模板描述</h3>
                  <p className="opacity-80">{selectedTemplate.description}</p>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">预览图</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTemplate.previewImages.map((image, index) => (
                      <div key={index} className="rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`${selectedTemplate.title} 预览图 ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
                  >
                    立即使用
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    收藏
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 创建模板模态框 */}
        {isCreatingTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setIsCreatingTemplate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`max-w-3xl w-full rounded-lg overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">创建模板</h2>
                  <button
                    onClick={() => setIsCreatingTemplate(false)}
                    className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                    aria-label="关闭"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">模板名称</label>
                  <input
                    type="text"
                    placeholder="输入模板名称"
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">模板描述</label>
                  <textarea
                    placeholder="输入模板描述"
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} resize-none`}
                    rows={3}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">模板分类</label>
                  <select
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                  >
                    {categories.filter(cat => cat !== 'all').map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">模板标签</label>
                  <input
                    type="text"
                    placeholder="输入标签，用逗号分隔"
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">模板缩略图</label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2">点击或拖拽文件到此处上传</p>
                    <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                      选择文件
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
                  >
                    创建模板
                  </button>
                  <button
                    onClick={() => setIsCreatingTemplate(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    取消
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

export default TemplateLibrary;