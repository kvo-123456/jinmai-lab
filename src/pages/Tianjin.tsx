import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import GradientHero from '@/components/GradientHero';

// 动态导入，实现代码分割
const TianjinCreativeActivities = lazy(() => import('@/components/TianjinCreativeActivities'));

// 主题类型定义
type ThemeType = 'light' | 'dark';

export default function Tianjin() {
  const { isDark, theme } = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>

      
      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        {/* 天津特色专区渐变英雄区 */}
        <GradientHero 
          title="天津特色专区"
          subtitle="探索天津特色文化、老字号与非遗传承"
          theme="heritage"
          stats={[
            { label: '津门老字号', value: '精选' },
            { label: '天津元素', value: '资产' },
            { label: '非遗传承', value: '导览' },
            { label: '津味应用', value: '共创' }
          ]}
          pattern={true}
          size="lg"
        />
        
        {/* 津味共创活动 */}
        <section className="mt-8 mb-12">
          <div className={`p-6 rounded-2xl shadow-lg ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              
              {/* 搜索框 */}
              <motion.div 
                className="relative w-full md:w-80"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <input
                  type="text"
                  placeholder="搜索活动、模板、体验或品牌"
                  className={`w-full px-5 py-2.5 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-red-500 focus:ring-offset-gray-800 hover:bg-gray-650' : 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-red-500 focus:ring-offset-white hover:bg-gray-150'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <i className={`fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-400'}`}></i>
              </motion.div>
            </div>
            
            {/* 天津地图入口 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <div className={`p-6 rounded-2xl shadow-lg ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'}`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold mb-2">探索天津老字号历史地图</h2>
                    <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>通过交互式地图了解天津老字号的历史分布与文化传承</p>
                  </div>
                  <button
                    onClick={() => navigate('/tianjin/map')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} flex items-center gap-2`}
                  >
                    <i className="fas fa-map-marked-alt"></i>
                    查看天津地图
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 活动内容 */}
            <Suspense fallback={
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-red-600 border-gray-700"></div>
              </div>
            }>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <TianjinCreativeActivities />
              </motion.div>
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}