import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';

// 资讯类型定义
interface NewsItem {
  id: number;
  title: string;
  description: string;
  image: string;
  date: string;
  category: string;
  source: string;
  views: number;
  content: string;
}

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 模拟数据加载
  useEffect(() => {
    setIsLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      // 模拟新闻详情数据
      const newsDetail: NewsItem = {
        id: parseInt(id || '1'),
        title: '全国非物质文化遗产保护工作会议在京召开',
        description: '会议总结了近年来非遗保护工作成果，部署了下一阶段重点任务，强调要加强非遗的活态传承和创新发展。',
        image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=National%20intangible%20cultural%20heritage%20protection%20work%20conference%20Beijing',
        date: '2025-12-03',
        category: '政策动态',
        source: '文化和旅游部',
        views: 12563,
        content: `12月3日，全国非物质文化遗产保护工作会议在北京召开。文化和旅游部部长胡和平出席会议并讲话，副部长李群主持会议。

会议总结了近年来我国非物质文化遗产保护工作取得的显著成效。截至目前，我国已建立了国家、省、市、县四级非物质文化遗产保护体系，认定了国家级非物质文化遗产代表性项目1557项，国家级非物质文化遗产代表性传承人3068名，设立了23个国家级文化生态保护区。

会议强调，要深入学习贯彻习近平总书记关于非物质文化遗产保护的重要指示精神，坚持以社会主义核心价值观为引领，坚持创造性转化、创新性发展，加强非遗的活态传承和创新发展。

下一阶段，我国将重点推进以下工作：一是加强非遗保护立法和政策体系建设；二是完善非遗代表性项目和代表性传承人管理制度；三是加强非遗传承人群培养；四是推进非遗与旅游融合发展；五是加强非遗数字化保护和传播；六是推动非遗走向世界。

会议还表彰了全国非物质文化遗产保护工作先进集体和先进个人，并对2026年重点工作进行了部署。

来自全国各省、自治区、直辖市文化和旅游厅（局）主要负责同志，以及有关专家学者、非遗代表性传承人代表等共300余人参加了会议。`
      };
      
      setNews(newsDetail);
      setIsLoading(false);
    }, 500);
  }, [id]);
  
  if (isLoading) {
    return (
      <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen py-12 px-4 sm:px-6 lg:px-8`}>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 shadow-md max-w-4xl mx-auto`}>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="flex justify-between items-center mb-6">
              <div className="h-4 bg-gray-700 rounded w-24"></div>
              <div className="h-4 bg-gray-700 rounded w-32"></div>
            </div>
            <div className="w-full h-64 bg-gray-700 rounded mb-6"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-700 rounded w-4/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!news) {
    return (
      <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen py-12 px-4 sm:px-6 lg:px-8`}>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 shadow-md max-w-4xl mx-auto text-center`}>
          <h2 className="text-2xl font-bold mb-4">资讯不存在</h2>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>您访问的资讯不存在或已被删除。</p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen py-12 px-4 sm:px-6 lg:px-8`}>
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 shadow-md max-w-4xl mx-auto`}>
        {/* 返回按钮 */}
        <motion.button
          onClick={() => navigate('/news')}
          className={`mb-6 flex items-center ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          whileHover={{ x: -5 }}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          返回资讯列表
        </motion.button>
        
        {/* 分类标签 */}
        <div className="mb-4">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {news.category}
          </span>
        </div>
        
        {/* 标题 */}
        <motion.h1 
          className="text-3xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {news.title}
        </motion.h1>
        
        {/* 元信息 */}
        <div className={`flex justify-between items-center mb-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <span>{news.date}</span>
          <span className="flex items-center">
            <i className="far fa-eye mr-1"></i>
            {news.views.toLocaleString()}
          </span>
          <span>{news.source}</span>
        </div>
        
        {/* 主图 */}
        <motion.div 
          className="mb-8 overflow-hidden rounded-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img 
            src={news.image} 
            alt={news.title} 
            className="w-full h-80 object-cover transition-transform duration-500 hover:scale-105"
          />
        </motion.div>
        
        {/* 描述 */}
        <motion.div 
          className={`mb-8 text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {news.description}
        </motion.div>
        
        {/* 内容 */}
        <motion.div 
          className={`${isDark ? 'text-gray-300' : 'text-gray-700'} space-y-4`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {news.content.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </motion.div>
        
        {/* 分享按钮 */}
        <div className="mt-12 pt-6 border-t border-gray-700/30">
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>分享资讯</h3>
          <div className="flex space-x-4">
            <motion.button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <i className="fab fa-weixin mr-2"></i> 微信
            </motion.button>
            <motion.button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <i className="fab fa-weibo mr-2"></i> 微博
            </motion.button>
            <motion.button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <i className="fas fa-link mr-2"></i> 复制链接
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
