import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';
import eventCalendarService, { CulturalEvent } from '@/services/eventCalendarService';

// 活动详情页面
export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [event, setEvent] = useState<CulturalEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // 加载活动数据
  useEffect(() => {
    setIsLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      const eventData = eventCalendarService.getEventById(id!);
      setEvent(eventData || null);
      setIsLoading(false);
    }, 500);
  }, [id]);

  const handleRegister = () => {
    // 模拟注册过程
    setIsRegistering(true);
    setTimeout(() => {
      setIsRegistering(false);
      // 注册成功后导航到创作页面
      navigate('/create', {
        state: {
          event: event?.id,
          prompt: `为活动 "${event?.title}" 创建作品`
        }
      });
    }, 1500);
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4">活动不存在</h2>
          <p className="mb-6">您访问的活动可能已经结束或被删除</p>
          <button
            onClick={() => navigate('/events')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${isDark 
              ? 'bg-primary hover:bg-primary/90 text-white' 
              : 'bg-primary hover:bg-primary/90 text-white'}`}
          >
            返回活动列表
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <main className="container mx-auto px-4 py-8">
        {/* 活动封面和基本信息 */}
        <div className="mb-12">
          <div className={`rounded-2xl overflow-hidden shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* 活动图片 */}
            <div className="relative">
              <img 
                src={event.image} 
                alt={event.title} 
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${event.status === 'upcoming' ? 'bg-green-500' : event.status === 'ongoing' ? 'bg-yellow-500' : 'bg-gray-500'}`}>
                    {event.status === 'upcoming' ? '即将开始' : event.status === 'ongoing' ? '进行中' : '已结束'}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{event.title}</h1>
                  <p className="text-sm md:text-base opacity-90">{event.description}</p>
                </div>
              </div>
            </div>

            {/* 活动基本信息 */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <i className="fas fa-calendar-alt text-primary text-xl"></i>
                  <div>
                    <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>活动时间</h3>
                    <p className={isDark ? 'text-gray-100' : 'text-gray-900'}>
                      {event.startDate} {event.startTime && `(${event.startTime})`} - {event.endDate} {event.endTime && `(${event.endTime})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-map-marker-alt text-primary text-xl"></i>
                  <div>
                    <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>活动地点</h3>
                    <p className={isDark ? 'text-gray-100' : 'text-gray-900'}>
                      {event.location || (event.onlineLink ? '线上活动' : '未指定')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-users text-primary text-xl"></i>
                  <div>
                    <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>参与人数</h3>
                    <p className={isDark ? 'text-gray-100' : 'text-gray-900'}>
                      {event.participantCount} 人已参与{event.maxParticipants && ` / 最多 ${event.maxParticipants} 人`}
                    </p>
                  </div>
                </div>
              </div>

              {/* 活动标签 */}
              <div className="flex flex-wrap gap-2 mb-6">
                {event.tags.map((tag, idx) => (
                  <span key={idx} className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* 活动操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-3">
                {event.status !== 'completed' && (
                  <button
                    onClick={handleRegister}
                    disabled={isRegistering || Boolean(event.maxParticipants && event.participantCount >= event.maxParticipants)}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${isDark 
                      ? 'bg-primary hover:bg-primary/90 text-white' 
                      : 'bg-primary hover:bg-primary/90 text-white'}`}
                  >
                    {isRegistering ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        正在注册...
                      </>
                    ) : event.maxParticipants && event.participantCount >= event.maxParticipants ? (
                      '活动已满'
                    ) : (
                      <>
                        <i className="fas fa-user-plus"></i>
                        立即参与
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => navigate('/create')}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'}`}
                >
                  <i className="fas fa-paint-brush"></i>
                  开始创作
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 活动详情 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* 左侧内容 */}
          <div className="lg:col-span-2">
            {/* 活动详情 */}
            <div className={`p-6 rounded-2xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className="text-xl font-bold mb-4">活动详情</h2>
              <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{event.description}</p>

              {/* 文化元素 */}
              {event.culturalElements.length > 0 && (
                <div className="mb-6">
                  <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>相关文化元素</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.culturalElements.map((element, idx) => (
                      <span key={idx} className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                        {element}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧边栏 */}
          <div className="lg:col-span-1">
            {/* 活动信息卡片 */}
            <div className={`p-6 rounded-2xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-6`}>
              <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>活动信息</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <i className="fas fa-calendar-alt text-primary text-lg mt-1"></i>
                  <div>
                    <h4 className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>活动时间</h4>
                    <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>
                      {event.startDate} {event.startTime && `(${event.startTime})`}
                      <br />
                      至
                      <br />
                      {event.endDate} {event.endTime && `(${event.endTime})`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 相关推荐 */}
            <div className={`p-6 rounded-2xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>相关推荐</h3>
              <div className="space-y-4">
                {/* 这里可以添加相关活动推荐逻辑 */}
                <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors" onClick={() => navigate('/events')}>
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=128x128&prompt=Traditional%20culture%20event%20thumbnail" alt="相关活动" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>更多文化活动</h4>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>探索其他精彩活动</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
