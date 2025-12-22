import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CreatorProfile from '../components/CreatorProfile';
import achievementService from '../services/achievementService';


import OnboardingGuide from '@/components/OnboardingGuide'

// 模拟数据
const performanceData = [
  { name: '一月', views: 4000, likes: 2400, comments: 240 },
  { name: '二月', views: 3000, likes: 1398, comments: 221 },
  { name: '三月', views: 2000, likes: 9800, comments: 229 },
  { name: '四月', views: 2780, likes: 3908, comments: 200 },
  { name: '五月', views: 1890, likes: 4800, comments: 218 },
  { name: '六月', views: 2390, likes: 3800, comments: 250 },
];

const recentWorks = [
  {
    id: 1,
    title: '国潮插画设计',
    thumbnail: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=400&fit=crop',
    status: '已发布',
    views: 1245,
    likes: 324,
    date: '2025-11-10',
    copyrightCertified: true
  },
  {
    id: 2,
    title: '老字号包装设计',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20brand%20packaging%20design',
    status: '审核中',
    views: 0,
    likes: 0,
    date: '2025-11-09',
    copyrightCertified: false
  },
  {
    id: 3,
    title: '传统纹样AI创作',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=AI%20generated%20traditional%20Chinese%20patterns',
    status: '草稿',
    views: 0,
    likes: 0,
    date: '2025-11-08',
    copyrightCertified: false
  },
];



export default function Dashboard() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatorProfile, setShowCreatorProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [creatorLevelInfo, setCreatorLevelInfo] = useState(() => achievementService.getCreatorLevelInfo());
  const [achievements, setAchievements] = useState(() => achievementService.getUnlockedAchievements());
  const [pointsStats, setPointsStats] = useState(() => achievementService.getPointsStats());
  
  // 检查是否已登录
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    } else {
      // 模拟加载数据
      setTimeout(() => {
        setIsLoading(false);
        // 中文注释：首次登录展示新手引导（按用户维度持久化）
        try {
          const key = `onboarded-${user.id}`
          const done = localStorage.getItem(key) === 'true'
          if (!done) setShowOnboarding(true)
        } catch {}
      }, 800);
    }
  }, [isAuthenticated, user, navigate]);
  
  
  
  const handleCreateNew = () => {
    navigate('/create');
  };
  
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>加载中...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <OnboardingGuide
        isOpen={showOnboarding}
        onClose={(completed) => {
          if (completed && user) {
            try { localStorage.setItem(`onboarded-${user.id}`, 'true') } catch {}
          }
          setShowOnboarding(false)
        }}
      />
      <main className="container mx-auto px-4 py-8">
        {/* 欢迎区域 */}
        <motion.div 
          className={`mb-8 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2">欢迎回来，{user?.username}！</h1>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                今天是个创作的好日子，您有 <span className="text-red-600 font-medium">3</span> 个作品待完成
              </p>
            </div>
            
            <motion.button
              onClick={handleCreateNew}
              className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full flex items-center transition-colors min-h-[44px]"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label="开始创作"
            >
              <i className="fas fa-plus mr-2"></i>
              开始创作
            </motion.button>
          </div>
        </motion.div>
        
        {/* 创作者信息卡片 */}
        <motion.div 
          className={`mb-8 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row items-center md:items-start">
              <div className="relative mb-4 md:mb-0 md:mr-6">
                <img 
                  src={user?.avatar || 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=100&h=100&fit=crop'} 
                  alt={user?.username || '用户头像'} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-red-600"
                  loading="lazy" decoding="async"
                />
                <div className="absolute -bottom-2 -right-2 bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold">
                  {creatorLevelInfo.levelProgress}%
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-bold mb-1">{user?.username}</h2>
                    <div className="flex items-center">
                      <span className="bg-blue-100 text-blue-600 text-sm px-3 py-1 rounded-full mr-2">
                        {creatorLevelInfo.currentLevel.name} {creatorLevelInfo.currentLevel.icon}
                      </span>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {creatorLevelInfo.currentPoints} 积分
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    {/* 会员中心入口 */}
                    <Link 
                      to="/membership"
                      className={`mt-3 md:mt-0 px-4 py-2 rounded-lg min-h-[44px] bg-red-600 hover:bg-red-700 text-white transition-colors text-sm flex items-center justify-center`}
                    >
                      <i className="fas fa-crown mr-1.5"></i>
                      会员中心
                    </Link>
                    
                    {/* 中文注释：移动端优化——详情切换按钮触控区统一至少44px，并增加无障碍属性 */}
                    <button 
                      onClick={() => setShowCreatorProfile(!showCreatorProfile)}
                      className={`mt-3 md:mt-0 px-4 py-2 rounded-lg min-h-[44px] ${
                        isDark 
                          ? 'bg-gray-700 hover:bg-gray-600' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors text-sm`}
                      aria-expanded={showCreatorProfile}
                      aria-label={showCreatorProfile ? '收起创作者详情' : '查看创作者详情'}
                    >
                      {showCreatorProfile ? '收起详情' : '查看创作者详情'}
                    </button>
                  </div>
                </div>
              
              {/* 等级进度条 */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>{creatorLevelInfo.currentLevel.name}</span>
                  <span>{creatorLevelInfo.nextLevel ? `${creatorLevelInfo.nextLevel.name} (${creatorLevelInfo.nextLevel.requiredPoints}积分)` : '已达最高等级'}</span>
                </div>
                <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-red-600"
                    style={{ width: `${creatorLevelInfo.levelProgress}%` }}
                  ></div>
                </div>
              </div>
              
              {/* 成就徽章 */}
              <div className="flex flex-wrap gap-3">
                {achievements.slice(0, 4).map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`flex items-center px-3 py-1.5 rounded-full text-sm ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    <i className={`fas fa-${achievement.icon} mr-1.5 text-yellow-500`}></i>
                    <span>{achievement.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* 创作者详情展开区域 */}
          {showCreatorProfile && (
            <CreatorProfile 
              creatorData={{
                level: creatorLevelInfo.currentLevel.name,
                levelProgress: creatorLevelInfo.levelProgress,
                points: creatorLevelInfo.currentPoints,
                achievements: achievements.map(achievement => ({
                  id: achievement.id,
                  name: achievement.name,
                  description: achievement.description,
                  icon: achievement.icon
                })),
                availableRewards: [
                  { id: 1, name: '高级素材包', description: '解锁20个高级文化素材', requirement: '完成5篇作品' },
                  { id: 2, name: '优先审核权', description: '作品审核时间缩短50%', requirement: '完成10篇作品' },
                ],
                tasks: [
                  { id: 1, title: '完成新手引导', status: 'completed' as const, reward: '50积分' },
                  { id: 2, title: '发布第一篇作品', status: 'completed' as const, reward: '100积分 + 素材包' },
                  { id: 3, title: '邀请一位好友', status: 'pending' as const, reward: '150积分' },
                  { id: 4, title: '参与一次主题活动', status: 'pending' as const, reward: '200积分' },
                ],
                commercialApplications: [
                  { id: 1, title: '国潮插画设计', brand: '老字号品牌A', status: '洽谈中', date: '2025-11-11' },
                  { id: 2, title: '传统纹样创新', brand: '老字号品牌B', status: '已采纳', date: '2025-11-05', revenue: '¥1,200' },
                ],
                pointsStats: pointsStats
              }}
              isDark={isDark}
            />
          )}
        </motion.div>
        
        {/* 数据概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: '总浏览量', value: '12,458', icon: 'eye', color: 'blue' },
            { title: '获赞总数', value: '3,245', icon: 'thumbs-up', color: 'red' },
            { title: '作品总数', value: '28', icon: 'image', color: 'green' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                  <i className={`far fa-${stat.icon} text-xl`}></i>
                </div>
              </div>
              <div className="mt-4 text-sm">
                <span className="text-green-500 flex items-center">
                  <i className="fas fa-arrow-up mr-1"></i>12.5%
                </span>
                <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>较上月</span>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* 图表和最近作品 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 数据图表 */}
          <motion.div 
            className={`lg:col-span-2 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">作品表现趋势</h2>
              <div className="flex space-x-2">
                {['周', '月', '年'].map((period) => (
                  // 中文注释：时间范围切换按钮——增大触控高度到44px，并标注选中状态
                  <button 
                    key={period}
                    type="button"
                    className={`px-4 py-2 rounded-lg text-sm min-h-[44px] ${
                      period === '月' 
                        ? 'bg-red-600 text-white' 
                        : isDark 
                          ? 'bg-gray-700 hover:bg-gray-600' 
                          : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors`}
                    aria-pressed={period === '月'}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: isDark ? '#9ca3af' : '#4b5563' }}
                    axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: isDark ? '#9ca3af' : '#4b5563' }}
                    axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      borderRadius: '0.5rem',
                      color: isDark ? '#ffffff' : '#000000'
                    }} 
                  />
                  <Bar dataKey="views" name="浏览量" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="likes" name="点赞数" fill="#f87171" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="comments" name="评论数" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
          {/* 最近作品 */}
          <motion.div 
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">最近作品</h2>
              <Link to="#" className="text-red-600 hover:text-red-700 text-sm transition-colors">查看全部</Link>
            </div>
            
            <div className="space-y-4">
              {recentWorks.map((work) => (
                <div key={work.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-transform hover:scale-[1.02]`}>
                  <div className="flex items-start">
                    <div className="relative">
                      <img 
                        src={work.thumbnail} 
                        alt={work.title} 
                        className="w-16 h-16 rounded-lg object-cover mr-4"
                        loading="lazy" decoding="async"
                      />
                      {work.copyrightCertified && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          <i className="fas fa-shield-alt"></i>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{work.title}</h3>
                      <div className="flex items-center text-xs mb-2">
                        <span className={`px-2 py-0.5 rounded-full mr-2 ${
                          work.status === '已发布' 
                            ? 'bg-green-100 text-green-600' 
                            : work.status === '审核中'
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {work.status}
                        </span>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {work.date}
                        </span>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className="flex items-center mr-3">
                          <i className="far fa-eye mr-1"></i>
                          {work.views}
                        </span>
                        <span className="flex items-center">
                          <i className="far fa-thumbs-up mr-1"></i>{work.likes}
                        </span>
                      </div>
                    </div>
                    {/* 中文注释：列表更多操作按钮——统一触控尺寸到44px并提供语义化标签 */}
                    <button 
                      className="ml-2 text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full"
                      aria-label="更多操作"
                      type="button"
                    >
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* 创作工具推荐 */}
        <motion.div 
          className={`mt-8 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-xl font-bold mb-6">推荐创作工具</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: '一键国潮设计', 
                description: 'AI自动生成符合国潮风格的设计作品',
                icon: 'palette',
                color: 'purple'
              },
              { 
                title: '文化资产嵌入', 
                description: '智能嵌入传统文化元素和纹样',
                icon: 'gem',
                color: 'yellow'
              },
              { 
                title: 'AI滤镜', 
                description: '应用独特的AI滤镜，增强作品表现力',
                icon: 'filter',
                color: 'blue'
              },
              { 
                title: '文化溯源', 
                description: '了解并展示设计中文化元素的来源',
                icon: 'book',
                color: 'green'
              },
            ].map((tool, index) => (
              <motion.div 
                key={index}
                className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border border-gray-200 transition-all hover:shadow-lg cursor-pointer`}
                whileHover={{ y: -5 }}
                // 中文注释：整卡可点击，跳转到对应创作工具页
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' || e.key === ' ') { 
                    e.preventDefault(); 
                    const id = tool.icon === 'palette' ? 'sketch' : tool.icon === 'gem' ? 'pattern' : tool.icon === 'filter' ? 'filter' : 'trace'
                    navigate(`/create?tool=${id}`)
                  } 
                }}
                onClick={() => { const id = tool.icon === 'palette' ? 'sketch' : tool.icon === 'gem' ? 'pattern' : tool.icon === 'filter' ? 'filter' : 'trace'; navigate(`/create?tool=${id}`) }}
              >
                <div className={`w-12 h-12 rounded-full bg-${tool.color}-100 text-${tool.color}-600 flex items-center justify-center mb-4`}>
                  <i className={`fas fa-${tool.icon} text-xl`}></i>
                </div>
                <h3 className="font-bold mb-2">{tool.title}</h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tool.description}</p>
                {/* 中文注释：工具卡片CTA按钮——增大触控高度到44px并增加无障碍标签 */}
                <button 
                  className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors min-h-[44px]"
                  aria-label={`使用 ${tool.title}`}
                  onClick={(e) => { 
                    // 中文注释：按钮点击跳转；阻止事件冒泡避免与整卡点击冲突
                    e.stopPropagation(); 
                    const id = tool.icon === 'palette' ? 'sketch' : tool.icon === 'gem' ? 'pattern' : tool.icon === 'filter' ? 'filter' : 'trace'; 
                    navigate(`/create?tool=${id}`) 
                  }}
                >
                  立即使用
                  <i className="fas fa-arrow-right ml-1 text-xs"></i>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
      
      <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4 z-10 relative`}>
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            © 2025 津脉智坊. 保留所有权利
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>隐私政策</a>
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>服务条款</a>
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>帮助中心</a>
          </div>
        </div>
      </footer>
    </>
  );
}
