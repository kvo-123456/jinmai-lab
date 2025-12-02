import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';

// 模拟数据
const userActivityData = [
  { name: '周一', 新增用户: 400, 活跃用户: 240, 创作数量: 180 },
  { name: '周二', 新增用户: 300, 活跃用户: 221, 创作数量: 150 },
  { name: '周三', 新增用户: 200, 活跃用户: 180, 创作数量: 120 },
  { name: '周四', 新增用户: 278, 活跃用户: 250, 创作数量: 190 },
  { name: '周五', 新增用户: 189, 活跃用户: 210, 创作数量: 160 },
  { name: '周六', 新增用户: 239, 活跃用户: 280, 创作数量: 220 },
  { name: '周日', 新增用户: 349, 活跃用户: 320, 创作数量: 260 },
];

const contentAuditData = [
  { name: '待审核', value: 28 },
  { name: '已通过', value: 156 },
  { name: '已拒绝', value: 16 },
];

const COLORS = ['#f59e0b', '#34d399', '#f87171'];

const recentSubmissions = [
  {
    id: 1,
    title: '国潮插画设计',
    creator: '设计师小明',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Chinese%20traditional%20cultural%20illustration%20design',
    submitTime: '2025-11-11 09:25',
    status: '待审核',
  },
  {
    id: 2,
    title: '老字号包装设计',
    creator: '创意总监小李',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Traditional%20Chinese%20brand%20packaging%20design',
    submitTime: '2025-11-11 08:40',
    status: '待审核',
  },
  {
    id: 3,
    title: '传统纹样AI创作',
    creator: '数字艺术家小张',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=AI%20generated%20traditional%20Chinese%20patterns',
    submitTime: '2025-11-11 07:15',
    status: '待审核',
  },
];

const commercialApplications = [
  {
    id: 1,
    title: '国潮新风尚',
    creator: '设计师小明',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Modern%20Chinese%20style%20fashion%20design',
    brand: '老字号品牌A',
    status: '洽谈中',
    applyTime: '2025-11-10',
  },
  {
    id: 2,
    title: '传统纹样创新',
    creator: '创意总监小李',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Traditional%20Chinese%20patterns%20with%20modern%20twist',
    brand: '老字号品牌B',
    status: '已采纳',
    applyTime: '2025-11-09',
  },
  {
    id: 3,
    title: '老字号品牌焕新',
    creator: '品牌设计师老王',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Traditional%20brand%20modernization%20design',
    brand: '老字号品牌C',
    status: '已拒绝',
    applyTime: '2025-11-08',
  },
];

type TabType = 'dashboard' | 'audit' | 'analytics' | 'adoption' | 'users' | 'settings' | 'campaigns' | 'creators';

export default function Admin() {
  const { theme, isDark } = useTheme();
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // 检查是否已登录且为管理员
  useEffect(() => {
    if (!isAuthenticated || !user || !user.isAdmin) {
      navigate('/login');
    } else {
      // 模拟加载数据
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    }
  }, [isAuthenticated, user, navigate]);
  
  // 获取用户数据
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        toast.error('获取用户数据失败');
      }
    } catch (error) {
      console.error('获取用户数据失败:', error);
      toast.error('获取用户数据失败');
    } finally {
      setUsersLoading(false);
    }
  };
  
  // 当切换到用户管理标签时获取用户数据
  useEffect(() => {
    if (activeTab === 'users' && !isLoading) {
      fetchUsers();
    }
  }, [activeTab, isLoading]);
  
  const handleLogout = () => {
    logout();
    toast.success('已成功登出');
    navigate('/login');
  };
  
  const handleApprove = (id: number) => {
    toast.success('已通过审核');
  };
  
  const handleReject = (id: number) => {
    toast.success('已拒绝审核');
  };
  
  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} text-white`}>
        <div className="flex">
          {/* 侧边栏骨架屏 */}
          <div className={`w-64 h-screen ${isDark ? 'bg-gray-800' : 'bg-white'} fixed`}>
            <div className="p-6">
              <div className={`h-8 w-32 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse mb-8`}></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={`h-10 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* 主内容骨架屏 */}
          <div className="ml-64 flex-1 p-8">
            <div className="space-y-8">
              <div className="flex justify-between">
                <div className={`h-8 w-40 rounded ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}></div>
                <div className={`h-10 w-10 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}></div>
              </div>
              
              {/* 数据概览骨架屏 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-32 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}></div>
                ))}
              </div>
              
              {/* 图表骨架屏 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 h-80 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}></div>
                <div className={`h-80 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}></div>
              </div>
              
              {/* 列表骨架屏 */}
              <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 animate-pulse`}>
                <div className={`h-6 w-1/4 rounded mb-6 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center">
                      <div className={`h-12 w-12 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} mr-4`}></div>
                      <div className="flex-1">
                        <div className={`h-4 w-1/3 rounded mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                        <div className={`h-3 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                      </div>
                      <div className={`h-10 w-24 rounded ml-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* 侧边栏 */}
      <aside className={`w-64 h-screen ${isDark ? 'bg-gray-800' : 'bg-white'} border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} fixed z-30`}>
        <div className="p-6">
          <div className="flex items-center space-x-1 mb-10">
            <span className="text-xl font-bold text-red-600">AI</span>
            <span className="text-xl font-bold">共创</span>
            <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">管理端</span>
          </div><nav>
            <ul className="space-y-1">
               {[
                  { id: 'dashboard', name: '控制台', icon: 'tachometer-alt' },
                  { id: 'audit', name: '内容审核', icon: 'check-circle' },
                  { id: 'analytics', name: '数据分析', icon: 'chart-bar' },
                  { id: 'adoption', name: '战略采纳', icon: 'star' },
                  { id: 'users', name: '用户管理', icon: 'users' },
                  { id: 'campaigns', name: '活动管理', icon: 'calendar-alt' },
                  { id: 'creators', name: '创作者管理', icon: 'trophy' },
                  { id: 'settings', name: '系统设置', icon: 'cog' },
                ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id as TabType)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                      activeTab === item.id
                        ? 'bg-red-600 text-white'
                        : isDark
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                    }`}
                  >
                    <i className={`fas fa-${item.icon} mr-3`}></i>
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        {/* 用户信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="flex items-center">
            <img 
              src={user?.avatar || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Admin%20avatar'} 
              alt={user?.username || '管理员'} 
              className="h-10 w-10 rounded-full mr-3"
            />
            <div className="flex-1">
              <p className="font-medium">{user?.username}</p>
              <p className="text-xs opacity-70">管理员</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 transition-colors"
              aria-label="退出登录"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>
      
      {/* 主内容区 */}
      <main className="ml-64 flex-1 p-8">
        {/* 顶部导航 */}
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-2xl font-bold">
             {activeTab === 'dashboard' && '管理控制台'}
             {activeTab === 'audit' && '内容审核'}
             {activeTab === 'analytics' && '数据分析'}
             {activeTab === 'adoption' && '战略采纳'}
             {activeTab === 'users' && '用户管理'}
             {activeTab === 'campaigns' && '活动管理'}
             {activeTab === 'creators' && '创作者管理'}
             {activeTab === 'settings' && '系统设置'}
           </h1>
          
          <div className="flex items-center space-x-4">
            <div className={`relative ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-full px-4 py-2`}>
              <input
                type="text"
                placeholder="搜索..."
                className="bg-transparent border-none outline-none w-40 text-sm"
              />
              <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
            
            <div className="relative">
              <button className={`p-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'} transition-colors`}>
                <i className="far fa-bell"></i>
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
        
        {/* 控制台内容 */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* 数据概览 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                { title: '总用户数', value: '3,842', icon: 'users', color: 'blue', trend: '+12.5%' },
                { title: '作品总数', value: '1,256', icon: 'image', color: 'green', trend: '+8.3%' },
                { title: '待审核', value: '28', icon: 'clock', color: 'yellow', trend: '+2' },
                { title: '已采纳', value: '45', icon: 'check-circle', color: 'purple', trend: '+15' },
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
                      <i className={`fas fa-${stat.icon} text-xl`}></i>
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <span className={stat.title === '待审核' ? 'text-yellow-500' : 'text-green-500'}>
                      {stat.trend}
                    </span>
                    <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stat.title === '待审核' ? '较昨日' : '较上月'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* 用户活跃度图表 */}
              <motion.div 
                className={`lg:col-span-2 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">用户活跃度与创作趋势</h2>
                  <div className="flex space-x-2">
                    {['周', '月', '年'].map((period) => (
                      <button 
                        key={period}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          period === '周' 
                            ? 'bg-red-600 text-white' 
                            : isDark 
                              ? 'bg-gray-700 hover:bg-gray-600' 
                              : 'bg-gray-100 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={userActivityData}
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
                      <Legend />
                      <Line type="monotone" dataKey="新增用户" stroke="#60a5fa" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="活跃用户" stroke="#34d399" />
                      <Line type="monotone" dataKey="创作数量" stroke="#f87171" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
              
              {/* 内容审核统计 */}
              <motion.div 
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-xl font-bold mb-6">内容审核统计</h2>
                
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contentAuditData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {contentAuditData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderRadius: '0.5rem',
                          color: isDark ? '#ffffff' : '#000000'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 space-y-2">
                  {contentAuditData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span>{item.name}</span>
                      </div>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
            
            {/* 待处理事项 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 待审核作品 */}
              <motion.div 
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">待审核作品</h2>
                  <button 
                    onClick={() => setActiveTab('audit')}
                    className="text-red-600 hover:text-red-700 text-sm transition-colors"
                  >
                    查看全部
                  </button>
                </div>
                
                <div className="space-y-4">
                  {recentSubmissions.map((submission) => (
                    <div key={submission.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-transform hover:scale-[1.02]`}>
                      <div className="flex items-start">
                        <img 
                          src={submission.thumbnail} 
                          alt={submission.title} 
                          className="w-16 h-16 rounded-lg object-cover mr-4"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{submission.title}</h3>
                          <div className="flex items-center text-xs mb-2">
                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mr-4`}>
                              创作者：{submission.creator}
                            </span>
                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              提交时间：{submission.submitTime}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleReject(submission.id)}
                            className={`p-2 rounded-lg ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                            aria-label="拒绝"
                          >
                            <i className="fas fa-times text-red-500"></i>
                          </button>
                          <button 
                            onClick={() => handleApprove(submission.id)}
                            className={`p-2 rounded-lg ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                            aria-label="通过"
                          >
                            <i className="fas fa-check text-green-500"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              {/* 商业化申请 */}
              <motion.div 
                className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">商业化申请</h2>
                  <button 
                    onClick={() => setActiveTab('adoption')}
                    className="text-red-600 hover:text-red-700 text-sm transition-colors"
                  >
                    查看全部
                  </button>
                </div>
                
                <div className="space-y-4">
                   {commercialApplications.map((app) => (
                    <div key={app.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-transform hover:scale-[1.02]`}>
                      <div className="flex items-start">
                        <img 
                          src={app.thumbnail} 
                          alt={app.title} 
                          className="w-16 h-16 rounded-lg object-cover mr-4"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{app.title}</h3>
                          <div className="flex items-center text-xs mb-2">
                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mr-4`}>
                              创作者：{app.creator}
                            </span>
                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              品牌：{app.brand}
                            </span>
                          </div>
                          <div className="flex items-center text-xs">
                            <span className={`${
                              app.status === '已采纳' 
                                ? 'bg-green-100 text-green-600' 
                                : app.status === '洽谈中'
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : 'bg-red-100 text-red-600'
                            } px-2 py-0.5 rounded-full`}>
                              {app.status}
                            </span>
                          </div>
                        </div>
                        <button className={`p-2 rounded-lg ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}>
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
        
        {/* 内容审核页面 */}
        {activeTab === 'audit' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <h2 className="text-xl font-bold mb-6">内容审核</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {recentSubmissions.map((submission) => (
                <div key={submission.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} transition-transform hover:scale-[1.02]`}>
                  <div className="flex flex-col md:flex-row">
                    <img 
                      src={submission.thumbnail} 
                      alt={submission.title} 
                      className="w-full md:w-48 h-48 object-cover rounded-lg mb-4 md:mb-0 md:mr-6"
                    />
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg">{submission.title}</h3>
                        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-600 text-sm">
                          待审核
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="mb-2">
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mr-2`}>创作者：</span>
                          {submission.creator}
                        </p>
                        <p>
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mr-2`}>提交时间：</span>
                          {submission.submitTime}
                        </p>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">文化元素分析</h4>
                        <div className="flex flex-wrap gap-2">
                          {['云纹', '传统色彩', '书法元素'].map((element, index) => (
                            <span key={index} className={`px-2 py-1 rounded-full text-xs ${
                              isDark ? 'bg-gray-600' : 'bg-gray-200'
                            }`}>
                              {element}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="flex items-center text-sm mb-2">
                            <input 
                              type="checkbox" 
                              className="mr-2 rounded text-red-600 focus:ring-red-500" 
                            />
                            标记为需修改
                          </label>
                          <textarea
                            placeholder="审核意见（可选）"
                            className={`w-full p-2 rounded-lg text-sm h-16 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                              isDark 
                                ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400 border' 
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border'
                            }`}
                          ></textarea>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          <button 
                            onClick={() => handleReject(submission.id)}
                            className={`px-4 py-2 rounded-lg ${
                              isDark 
                                ? 'bg-gray-600 hover:bg-gray-500' 
                                : 'bg-gray-200 hover:bg-gray-300'
                            } transition-colors text-sm`}
                          >
                            拒绝
                          </button>
                          <button 
                            onClick={() => handleApprove(submission.id)}
                            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors text-sm"
                          >
                            通过
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 分页 */}
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((page) => (
                  <button 
                    key={page}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      page === 1 
                        ? 'bg-red-600 text-white' 
                        : isDark 
                          ? 'bg-gray-700 hover:bg-gray-600' 
                          : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
         {/* 用户管理页面 */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">用户管理</h2>
              <div className="flex space-x-2">
                <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-1.5`}>
                  <input
                    type="text"
                    placeholder="搜索用户..."
                    className="bg-transparent border-none outline-none w-40 text-sm"
                  />
                  <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                </div>
                <select className={`px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}>
                  <option value="all">全部状态</option>
                  <option value="active">活跃</option>
                  <option value="inactive">不活跃</option>
                </select>
              </div>
            </div>
            
            {/* 用户数据概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { title: '总用户数', value: '3,842', icon: 'users', color: 'blue' },
                { title: '活跃用户', value: '2,560', icon: 'user-check', color: 'green' },
                { title: '新增用户', value: '128', icon: 'user-plus', color: 'yellow' },
                { title: '管理员', value: '15', icon: 'shield-alt', color: 'purple' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                      <h3 className="text-xl font-bold">{stat.value}</h3>
                    </div>
                    <div className={`p-2 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                      <i className={`fas fa-${stat.icon} text-lg`}></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 用户列表 */}
            <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <table className="min-w-full">
                <thead>
                  <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">用户名</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">邮箱</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">年龄</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">兴趣标签</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">注册时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {usersLoading ? (
                    // 加载状态
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center">
                        <div className="flex items-center justify-center">
                          <i className="fas fa-spinner fa-spin text-xl mr-2"></i>
                          <span>加载用户数据中...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    // 无数据状态
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center">
                        <div className="text-gray-400">
                          <i className="fas fa-users text-4xl mb-2"></i>
                          <p>暂无用户数据</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // 真实用户数据
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm">{user.id}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center">
                            <img 
                              src={user.avatar_url || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20${user.username}`} 
                              alt={user.username} 
                              className="w-8 h-8 rounded-full mr-3" 
                            />
                            <span>{user.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{user.email}</td>
                        <td className="px-4 py-3 text-sm">{user.age || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {user.tags && user.tags.length > 0 ? (
                              user.tags.map((tag, index) => (
                                <span key={index} className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">暂无标签</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs bg-green-100 text-green-600`}>
                            活跃
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex space-x-2">
                            <button className={`p-1.5 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}>
                              <i className="fas fa-eye text-blue-500"></i>
                            </button>
                            <button className={`p-1.5 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}>
                              <i className="fas fa-edit text-green-500"></i>
                            </button>
                            <button className={`p-1.5 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}>
                              <i className="fas fa-trash text-red-500"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* 分页 */}
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((page) => (
                  <button 
                    key={page}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${page === 1 ? 'bg-red-600 text-white' : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* 其他标签页的内容可以按照类似的方式实现 */}
        {(activeTab === 'analytics' || activeTab === 'adoption' || activeTab === 'settings') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="mb-6 text-6xl text-gray-400">
              <i className="fas fa-tools"></i>
            </div>
            <h2 className="text-2xl font-bold mb-4">功能开发中</h2>
            <p className={`max-w-lg mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              该功能模块正在紧张开发中，敬请期待！
            </p>
          </motion.div>
        )}
        
        {/* 活动管理页面 */}
        {activeTab === 'campaigns' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">活动管理</h2>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                <i className="fas fa-plus mr-2"></i>
                创建活动
              </button>
            </div>
            
            {/* 活动数据概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { title: '活跃活动', value: '12', icon: 'activity', color: 'blue' },
                { title: '参与用户', value: '1,284', icon: 'user-friends', color: 'green' },
                { title: '提交作品', value: '562', icon: 'image', color: 'yellow' },
                { title: '总浏览量', value: '12,540', icon: 'eye', color: 'purple' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                      <h3 className="text-xl font-bold">{stat.value}</h3>
                    </div>
                    <div className={`p-2 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                      <i className={`fas fa-${stat.icon} text-lg`}></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 活动列表 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">进行中活动</h3>
                <div className="flex space-x-2">
                  <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-1.5`}>
                    <input
                      type="text"
                      placeholder="搜索活动..."
                      className="bg-transparent border-none outline-none w-40 text-sm"
                    />
                    <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                  </div>
                  <select className={`px-3 py-1.5 rounded-lg text-sm ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                  } border`}>
                    <option value="all">全部状态</option>
                    <option value="active">进行中</option>
                    <option value="upcoming">即将开始</option>
                    <option value="ended">已结束</option>
                  </select>
                </div>
              </div>
              
              <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <table className="min-w-full">
                  <thead>
                    <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <th className="px-4 py-3 text-left text-sm font-medium">活动名称</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">开始日期</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">结束日期</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">参与人数</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">提交作品</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {[
                      { id: 1, name: '国潮创新设计大赛', start: '2025-11-01', end: '2025-12-31', participants: 486, submissions: 230, status: 'active' },
                      { id: 2, name: '传统纹样再创造', start: '2025-11-15', end: '2026-01-15', participants: 320, submissions: 145, status: 'active' },
                      { id: 3, name: '老字号包装焕新', start: '2025-12-01', end: '2026-02-28', participants: 478, submissions: 187, status: 'upcoming' },
                    ].map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm">{campaign.name}</td>
                        <td className="px-4 py-3 text-sm">{campaign.start}</td>
                        <td className="px-4 py-3 text-sm">{campaign.end}</td>
                        <td className="px-4 py-3 text-sm">{campaign.participants}</td>
                        <td className="px-4 py-3 text-sm">{campaign.submissions}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            campaign.status === 'active' 
                              ? 'bg-green-100 text-green-600' 
                              : campaign.status === 'upcoming'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {campaign.status === 'active' ? '进行中' : 
                             campaign.status === 'upcoming' ? '即将开始' : '已结束'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex space-x-2">
                            <button className={`p-1.5 rounded ${
                              isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                            }`}>
                              <i className="fas fa-eye text-blue-500"></i>
                            </button>
                            <button className={`p-1.5 rounded ${
                              isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                            }`}>
                              <i className="fas fa-edit text-green-500"></i>
                            </button>
                            <button className={`p-1.5 rounded ${
                              isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                            }`}>
                              <i className="fas fa-chart-bar text-purple-500"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* 活动模板 */}
            <div>
              <h3 className="font-medium mb-4">活动模板</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { 
                    id: 1, 
                    title: '节日主题活动', 
                    description: '快速创建春节、中秋等节日主题活动',
                    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Chinese%20New%20Year%20event%20template%20design'
                  },
                  { 
                    id: 2, 
                    title: '品牌联名活动', 
                    description: '为老字号品牌定制联名创作活动',
                    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Brand%20collaboration%20event%20template'
                  },
                  { 
                    id: 3, 
                    title: '文化元素专项', 
                    description: '围绕特定文化元素开展创作征集',
                    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Traditional%20Chinese%20elements%20design%20template'
                  },
                ].map((template) => (
                  <div key={template.id} className={`rounded-xl overflow-hidden border ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <img 
                      src={template.thumbnail} 
                      alt={template.title} 
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-4">
                      <h4 className="font-medium mb-1">{template.title}</h4>
                      <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {template.description}
                      </p>
                      <button className={`w-full py-2 rounded-lg text-sm ${
                        isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors`}>
                        使用模板
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* 创作者管理页面 */}
        {activeTab === 'creators' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">创作者管理</h2>
              <div className="flex space-x-2">
                <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-1.5`}>
                  <input
                    type="text"
                    placeholder="搜索创作者..."
                    className="bg-transparent border-none outline-none w-40 text-sm"
                  />
                  <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                </div>
                <select className={`px-3 py-1.5 rounded-lg text-sm ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                } border`}>
                  <option value="all">全部等级</option>
                  <option value="beginner">新锐创作者</option>
                  <option value="advanced">资深创作者</option>
                  <option value="master">大师级创作者</option>
                </select>
              </div>
            </div>
            
            {/* 创作者等级分布 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { title: '新锐创作者', value: '2,345', icon: 'star', color: 'blue' },
                { title: '资深创作者', value: '876', icon: 'award', color: 'purple' },
                { title: '大师级创作者', value: '123', icon: 'trophy', color: 'yellow' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                      <h3 className="text-xl font-bold">{stat.value}</h3>
                    </div>
                    <div className={`p-2 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                      <i className={`fas fa-${stat.icon} text-lg`}></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 创作者列表 */}
            <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
              <table className="min-w-full">
                <thead>
                  <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <th className="px-4 py-3 text-left text-sm font-medium">创作者</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">等级</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">作品数</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">获赞数</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">采纳数</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {[
                    { id: 1, name: '设计师小明', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20xiaoming', level: 'master', works: 45, likes: 1245, adopted: 12, status: 'active' },
                    { id: 2, name: '创意总监小李', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20xiaoli', level: 'advanced', works: 32, likes: 876, adopted: 8, status: 'active' },
                    { id: 3, name: '品牌设计师老王', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20laowang', level: 'beginner', works: 12, likes: 342, adopted: 2, status: 'active' },
                    { id: 4, name: '插画师小陈', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20xiaochen', level: 'master', works: 56, likes: 1890, adopted: 15, status: 'active' },
                    { id: 5, name: '数字艺术家小张', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20xiaozhang', level: 'advanced', works: 28, likes: 765, adopted: 7, status: 'inactive' },
                  ].map((creator) => (
                    <tr key={creator.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          <img 
                            src={creator.avatar} 
                            alt={creator.name} 
                            className="w-8 h-8 rounded-full mr-3"
                          />
                          <span>{creator.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          creator.level === 'master' 
                            ? 'bg-yellow-100 text-yellow-600' 
                            : creator.level === 'advanced'
                              ? 'bg-purple-100 text-purple-600'
                              : 'bg-blue-100 text-blue-600'
                        }`}>
                          {creator.level === 'master' ? '大师级创作者' : 
                           creator.level === 'advanced' ? '资深创作者' : '新锐创作者'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{creator.works}</td>
                      <td className="px-4 py-3 text-sm">{creator.likes}</td>
                      <td className="px-4 py-3 text-sm">{creator.adopted}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          creator.status === 'active' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {creator.status === 'active' ? '活跃' : '不活跃'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-2">
                          <button className={`p-1.5 rounded ${
                            isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                          }`}>
                            <i className="fas fa-eye text-blue-500"></i>
                          </button>
                          <button className={`p-1.5 rounded ${
                            isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                          }`}>
                            <i className="fas fa-edit text-green-500"></i>
                          </button>
                          <button className={`p-1.5 rounded ${
                            isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                          }`}>
                            <i className="fas fa-trophy text-yellow-500"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 创作者激励管理 */}
            <div>
              <h3 className="font-medium mb-4">激励体系管理</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h4 className="font-medium mb-3">等级设置</h4>
                  <div className="space-y-4">
                    {[
                      { name: '新锐创作者', threshold: '0积分', benefits: ['基础素材库', '社区互动权限'] },
                      { name: '资深创作者', threshold: '1500积分', benefits: ['高级素材库', '优先审核权', '专属客服'] },{ name: '大师级创作者', threshold: '5000积分', benefits: ['独家AI模型', '线下活动邀请', '品牌对接优先'] },
                    ].map((level, index) => (
                      <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{level.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isDark ? 'bg-gray-600' : 'bg-gray-200'
                          }`}>
                            {level.threshold}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {level.benefits.map((benefit, i) => (
                            <span key={i} className={`text-xs px-2 py-1 rounded-full ${
                              isDark ? 'bg-gray-600' : 'bg-gray-200'
                            }`}>
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h4 className="font-medium mb-3">任务与奖励</h4>
                  <div className="space-y-3">
                    {[
                      { name: '完成首篇创作', reward: '100积分 + 素材包' },
                      { name: '连续登录7天', reward: '50积分' },
                      { name: '作品获赞100次', reward: '200积分' },
                      { name: '作品被采纳', reward: '500积分 + 分成资格' },
                    ].map((task, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>{task.name}</span>
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          isDark ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          {task.reward}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-colors">
                    添加新任务
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
