import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import GradientHero from '@/components/GradientHero';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

// 数据分析页面
export default function Analytics() {
  const { isDark } = useTheme();

  return (
      {/* 渐变英雄区 */}
      <GradientHero 
        title="数据分析与洞察" 
        subtitle="深入了解作品表现、用户活动和主题趋势"
        theme="indigo"
        stats={[
          { label: '总数据点数', value: '10,000+' },
          { label: '分析维度', value: '7+' },
          { label: '实时更新', value: 'Yes' }
        ]}
        pattern={true}
        size="md"
      />

      <main className="container mx-auto px-4 py-8">
        {/* 数据分析仪表盘 */}
        <AnalyticsDashboard />
      </main>

      {/* 页脚 */}
      <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-4 px-4 mt-8`}>
        <div className="container mx-auto flex flex-col items-center justify-center text-center">
          <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            © 2025 津脉智坊. 保留所有权利
          </p>
          <div className="flex flex-wrap justify-center space-x-4">
            <a href="#" className={`text-xs sm:text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>隐私政策</a>
            <a href="#" className={`text-xs sm:text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>服务条款</a>
            <a href="#" className={`text-xs sm:text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>帮助中心</a>
          </div>
        </div>
      </footer>
  );
}