import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import GradientHero from '@/components/GradientHero';
import EventCalendar from '@/components/EventCalendar';
import eventCalendarService, { CulturalEvent } from '@/services/eventCalendarService';

// 文化活动页面
export default function CulturalEvents() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<CulturalEvent[]>([]);
  const [ongoingEvents, setOngoingEvents] = useState<CulturalEvent[]>([]);

  // 加载数据
  useEffect(() => {
    setIsLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      const allEvents = eventCalendarService.getAllEvents();
      setUpcomingEvents(eventCalendarService.getUpcomingEvents(3));
      setOngoingEvents(eventCalendarService.getEventsByStatus('ongoing'));
      setIsLoading(false);
    }, 800);
  }, []);

  const handleCreateEvent = () => {
    navigate('/create');
  };

  return (
    <>
      {/* 渐变英雄区 */}
      <GradientHero 
        title="文化主题活动日历"
        subtitle="参与文化主题活动，探索传统文化魅力"
        theme="heritage"
        stats={[
          { label: '总活动数', value: `${eventCalendarService.getAllEvents().length}` },
          { label: '参与人数', value: '12,345' },
          { label: '即将开始', value: `${eventCalendarService.getEventsByStatus('upcoming').length}` }
        ]}
        pattern={true}
      />

      <main className="container mx-auto px-4 py-8">
        {/* 活动统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            className={`p-4 sm:p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md transition-all hover:shadow-lg`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs sm:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>全部活动</p>
                <h3 className="text-xl sm:text-2xl font-bold">{eventCalendarService.getAllEvents().length}</h3>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-red-100 text-red-600">
                <i className="fas fa-calendar-alt text-base sm:text-lg"></i>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={`p-4 sm:p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md transition-all hover:shadow-lg`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs sm:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>即将开始</p>
                <h3 className="text-xl sm:text-2xl font-bold">{eventCalendarService.getEventsByStatus('upcoming').length}</h3>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-100 text-green-600">
                <i className="fas fa-clock text-base sm:text-lg"></i>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={`p-4 sm:p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md transition-all hover:shadow-lg`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs sm:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>进行中</p>
                <h3 className="text-xl sm:text-2xl font-bold">{eventCalendarService.getEventsByStatus('ongoing').length}</h3>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-yellow-100 text-yellow-600">
                <i className="fas fa-play-circle text-base sm:text-lg"></i>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 即将开始的活动 */}
        {upcomingEvents.length > 0 && (
          <motion.section
            className="mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">即将开始的活动</h2>
              <button 
                onClick={() => {}}
                className={`text-xs sm:text-sm font-medium transition-colors ${isDark ? 'text-red-500 hover:text-red-400' : 'text-red-600 hover:text-red-500'}`}
              >
                查看全部 <i className="fas fa-arrow-right ml-1"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-all hover:shadow-lg cursor-pointer`}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/events/${event.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                >
                  <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-32 sm:h-40 object-cover"
                  />
                  <div className={`p-3 sm:p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] sm:text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                        即将开始
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-500">
                        {event.startDate}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold mb-2 line-clamp-2">{event.title}</h3>
                    <p className={`text-xs sm:text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-sm text-gray-500 flex items-center gap-1">
                        <i className="fas fa-users text-xs"></i>
                        {event.participantCount}人已参与
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // 处理报名逻辑
                        }}
                        className="text-[10px] sm:text-xs font-medium text-red-600 hover:underline px-2 py-1 rounded transition-colors hover:text-red-500"
                      >
                        报名
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* 活动日历组件 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-6">活动日历</h2>
          <EventCalendar />
        </motion.section>

        {/* 快速参与区 */}
        <motion.section
          className={`mt-8 sm:mt-12 p-5 sm:p-8 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gradient-to-r from-red-50 to-pink-50'} text-center`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-3">准备好参与文化活动了吗？</h2>
          <p className={`text-sm sm:text-base mb-4 sm:mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            选择一个主题，创作你的作品，展示传统文化魅力
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button 
              onClick={handleCreateEvent}
              className="px-6 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <i className="fas fa-paint-brush"></i>
              开始创作
            </button>
            <button 
              onClick={() => navigate('/explore')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto ${isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-white hover:bg-gray-100 shadow-md'}`}
            >
              <i className="fas fa-eye"></i>
              探索作品
            </button>
          </div>
        </motion.section>
      </main>

      {/* 页脚 */}
      <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-4 px-4 mt-8 sm:mt-12`}>
        <div className="container mx-auto flex flex-col items-center justify-center text-center">
          <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            © 2025 津脉智坊. 保留所有权利
          </p>
          <div className="flex flex-wrap justify-center space-x-4 sm:space-x-6">
            <a href="#" className={`text-xs sm:text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>隐私政策</a>
            <a href="#" className={`text-xs sm:text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>服务条款</a>
            <a href="#" className={`text-xs sm:text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>帮助中心</a>
          </div>
        </div>
      </footer>
    </>
  );
}