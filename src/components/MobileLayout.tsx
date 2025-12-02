import { useState, useContext, useEffect, useMemo } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { AuthContext } from '@/contexts/authContext'
import { toast } from 'sonner'
import { markPrefetched, isPrefetched } from '@/services/prefetch'

interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { theme, isDark, toggleTheme } = useTheme()
  const { isAuthenticated, user, logout } = useContext(AuthContext)
  const location = useLocation()
  const navigate = useNavigate()
  
  const [showMobileNav, setShowMobileNav] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: '欢迎回来', description: '每日签到可领取奖励', time: '刚刚', read: false, type: 'success' },
    { id: 'n2', title: '系统更新', description: '创作中心新增AI文案优化', time: '1 小时前', read: false, type: 'info' },
    { id: 'n3', title: '新教程上线', description: '杨柳青年画入门视频', time: '昨天', read: true, type: 'info' },
  ])
  
  // 搜索历史和热门搜索
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  
  // 热门搜索关键词
  const hotSearches = ['杨柳青年画', '天津文化', 'AI创作', '国潮设计', '创意灵感', '传统文化', '数字艺术', '津门特色']
  
  // 加载搜索历史
  useEffect(() => {
    try {
      const raw = localStorage.getItem('SEARCH_HISTORY')
      const history = raw ? JSON.parse(raw) : []
      if (Array.isArray(history)) {
        setSearchHistory(history)
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }, [])
  
  // 保存搜索历史
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return
    
    try {
      const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10) // 最多保存10条
      setSearchHistory(newHistory)
      localStorage.setItem('SEARCH_HISTORY', JSON.stringify(newHistory))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }
  
  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('SEARCH_HISTORY')
  }
  
  // 搜索建议
  const updateSearchSuggestions = (query: string) => {
    if (!query.trim()) {
      setShowSearchSuggestions(false)
      setSearchSuggestions([])
      return
    }
    
    // 从热门搜索和历史记录中匹配建议
    const suggestions = [...hotSearches, ...searchHistory]
      .filter(item => item.toLowerCase().includes(query.toLowerCase()))
      .filter((item, index, self) => self.indexOf(item) === index) // 去重
      .slice(0, 6) // 最多显示6条
    
    setSearchSuggestions(suggestions)
    setShowSearchSuggestions(suggestions.length > 0)
  }
  
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])
  
  // 标记通知为已读
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }
  
  // 标记所有通知为已读
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }
  
  // 删除通知
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  // 添加新通知
  const addNotification = (title: string, description: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const newNotification = {
      id: `n${Date.now()}`,
      title,
      description,
      time: '刚刚',
      read: false,
      type
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 20)) // 最多保留20条通知
  }
  
  // 模拟实时通知
  useEffect(() => {
    const interval = setInterval(() => {
      const randomNotifications = [
        { title: '创作灵感', description: '为您推荐了新的创作主题', type: 'info' as const },
        { title: '任务完成', description: '您的AI生成任务已完成', type: 'success' as const },
        { title: '系统提示', description: '请及时更新您的创作素材', type: 'warning' as const }
      ]
      const randomNotification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)]
      addNotification(randomNotification.title, randomNotification.description, randomNotification.type)
    }, 30000) // 每30秒添加一条随机通知
    
    return () => clearInterval(interval)
  }, [])
  
  // 监听滚动方向，向下滚动时隐藏底部导航，向上滚动或靠近顶部时显示
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY
      lastY = y
      if (Math.abs(delta) < 6) return
      setShowMobileNav(delta <= 0 || y < 80)
      setShowBackToTop(y > 480)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  
  const title = useMemo(() => {
    const p = location.pathname
    if (p === '/') return '首页'
    if (p.startsWith('/explore')) return '探索作品'
    if (p.startsWith('/tools')) return '创作中心'
    if (p.startsWith('/about')) return '关于我们'
    if (p.startsWith('/knowledge')) return '文化知识库'
    if (p.startsWith('/tianjin')) return '天津特色专区'
    if (p.startsWith('/square')) return '共创广场'
    if (p.startsWith('/community')) return '创作者社区'
    if (p.startsWith('/brand')) return '品牌合作'
    if (p.startsWith('/dashboard')) return '个人中心'
    if (p.startsWith('/create')) return '创作中心'
    if (p.startsWith('/drafts')) return '草稿箱'
    if (p.startsWith('/generate')) return 'AI生成引擎'
    if (p.startsWith('/neo')) return '灵感引擎'
    if (p.startsWith('/lab')) return '新窗口实验室'
    if (p.startsWith('/wizard')) return '共创向导'
    return '津脉智坊'
  }, [location.pathname])
  
  const onSearchSubmit = () => {
    if (!search.trim()) return
    const q = search.trim()
    saveSearchHistory(q)
    navigate(`/explore?q=${encodeURIComponent(q)}`)
    setShowSearch(false)
    setShowSearchSuggestions(false)
  }
  
  const prefetchRoute = (path: string, ttlMs = 60000) => {
    const key = path.replace(/^\//, '') || 'home'
    if (isPrefetched(key)) return
    try {
      switch (path) {
        case '/': import('@/pages/Home').then(() => markPrefetched('home', ttlMs)); break
        case '/explore': import('@/pages/Explore').then(() => markPrefetched('explore', ttlMs)); break
        case '/tools': import('@/pages/Tools').then(() => markPrefetched('tools', ttlMs)); break
        case '/neo': import('@/pages/Neo').then(() => markPrefetched('neo', ttlMs)); break
        case '/wizard': import('@/pages/Wizard').then(() => markPrefetched('wizard', ttlMs)); break
        case '/square': import('@/pages/Square').then(() => markPrefetched('square', ttlMs)); break
        case '/community': import('@/pages/Community').then(() => markPrefetched('community', ttlMs)); break
        case '/dashboard': import('@/pages/Dashboard').then(() => markPrefetched('dashboard', ttlMs)); break
        default: break
      }
    } catch (error) {
      console.error(`Failed to prefetch ${path}:`, error)
    }
  }
  
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-[#0b0e13] via-[#0e1218] to-[#0b0e13] text-gray-100' : theme === 'pink' ? 'bg-gradient-to-br from-[#fff0f5] via-[#ffe4ec] to-[#fff0f5] text-gray-900' : 'bg-white text-gray-900'}`}>
      {/* 主内容区域 */}
      <div 
        className="flex-1 min-w-0"
        style={{ paddingBottom: showMobileNav ? 'calc(90px + env(safe-area-inset-bottom))' : 'env(safe-area-inset-bottom)' }}
      >
        {/* 搜索栏 */}
        {showSearch && (
          <div className={`fixed inset-x-0 top-0 z-50 md:hidden ${isDark ? 'bg-[#0b0e13]/95' : 'bg-white'} px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className={`rounded-lg ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'} px-3 py-2 flex items-center`}>
              <i className={`fas fa-search ${isDark ? 'text-gray-400' : 'text-gray-500'} mr-2`}></i>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  updateSearchSuggestions(e.target.value);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') onSearchSubmit(); }}
                placeholder="搜索作品、素材或用户"
                className={`flex-1 outline-none ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                autoFocus
              />
              <button
                onClick={onSearchSubmit}
                className="ml-2 px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white"
              >
                搜索
              </button>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setShowSearchSuggestions(false);
                }}
                className={`ml-2 p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                aria-label="关闭"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* 搜索建议 */}
            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <div className={`mt-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} shadow-lg max-h-60 overflow-y-auto`}>
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSearch(suggestion);
                      setShowSearchSuggestions(false);
                      onSearchSubmit();
                    }}
                    className={`px-4 py-3 cursor-pointer hover:bg-opacity-80 transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} flex items-center gap-2`}
                  >
                    <i className="fas fa-search text-sm text-gray-400"></i>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* 搜索历史 */}
            {!showSearchSuggestions && searchHistory.length > 0 && (
              <div className={`mt-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} shadow-lg`}>
                <div className="px-4 py-2 flex items-center justify-between border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>搜索历史</span>
                  <button
                    onClick={clearSearchHistory}
                    className={`text-xs ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    清空
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 p-3">
                  {searchHistory.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSearch(item);
                        setShowSearchSuggestions(false);
                        onSearchSubmit();
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 头部 */}
        <header className={`sticky top-0 z-40 ${isDark ? 'bg-[#0b0e13]/80 backdrop-blur-sm' : theme === 'pink' ? 'bg-white/80 backdrop-blur-sm' : 'bg-white'} border-b ${isDark ? 'border-gray-800' : theme === 'pink' ? 'border-pink-200' : 'border-gray-200'} px-4 py-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-bold">{title}</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                onClick={() => setShowSearch(true)}
                aria-label="搜索"
              >
                <i className="fas fa-search"></i>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                  aria-label="通知"
                >
                  <i className="fas fa-bell"></i>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-red-600 text-xs font-bold">{unreadCount}</span>
                  )}
                </button>
                
                {/* 通知面板 */}
                {showNotifications && (
                  <div className={`absolute right-0 top-full mt-2 w-80 max-h-[60vh] overflow-y-auto z-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl`}>
                    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                      <h3 className="font-semibold">通知</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className={`text-xs ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                        >
                          全部已读
                        </button>
                      )}
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}">
                        暂无通知
                      </div>
                    ) : (
                      <div className="divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}">
                        {notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-opacity-80 transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${!notification.read ? (isDark ? 'bg-gray-700/50' : 'bg-blue-50') : ''}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium truncate">{notification.title}</h4>
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : notification.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                    {notification.type === 'success' ? '成功' : notification.type === 'warning' ? '警告' : notification.type === 'error' ? '错误' : '信息'}
                                  </span>
                                </div>
                                <p className={`text-sm mt-1 truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {notification.description}
                                </p>
                                <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {notification.time}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className={`ml-2 p-1 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                                aria-label="删除通知"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {isAuthenticated ? (
                <NavLink 
                  to="/dashboard" 
                  className="relative"
                >
                  <img 
                    src={user?.avatar || 'https://via.placeholder.com/32'} 
                    alt={user?.username || '用户'} 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </NavLink>
              ) : (
                <NavLink 
                  to="/login" 
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                >
                  登录
                </NavLink>
              )}
            </div>
          </div>
        </header>
        
        {/* 主要内容 */}
        <main className="px-4 py-6">
          {children}
        </main>
        
        {/* 回到顶部按钮 */}
        {showBackToTop && (
          <button
            aria-label="回到顶部"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed right-4 ${showMobileNav ? 'bottom-[96px]' : 'bottom-6'} z-40 p-3 rounded-full shadow-lg ring-1 transition-colors ${isDark ? 'bg-gray-800 text-white ring-gray-700 hover:bg-gray-700' : theme === 'pink' ? 'bg-white text-gray-900 ring-pink-200 hover:bg-pink-50' : 'bg-white text-gray-900 ring-gray-200 hover:bg-gray-50'}`}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) / 2)' }}
          >
            <i className="fas fa-arrow-up"></i>
          </button>
        )}
      </div>
      
      {/* 底部导航 */}
      <nav className={`fixed bottom-0 inset-x-0 md:hidden ${isDark ? 'bg-[#0b0e13]/90 backdrop-blur-xl ring-1 ring-gray-800/70' : theme === 'pink' ? 'bg-white/90 backdrop-blur-xl ring-1 ring-pink-200/70' : 'bg-white/90 backdrop-blur-xl ring-1 ring-gray-200/70'} z-40 transform transition-all duration-300 ease-in-out shadow-2xl`} style={{ paddingBottom: 'env(safe-area-inset-bottom)', transform: showMobileNav ? 'translateY(0)' : 'translateY(100%)' }}>
        <ul className="grid grid-cols-5 text-xs px-2 py-1">
          <li className="flex items-center justify-center">
            <NavLink 
              to="/"
              onTouchStart={() => prefetchRoute('/')}
              className={`flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out ${isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900'}`}
              aria-label="首页"
            >
              <i className="fas fa-home text-lg"></i>
              <span className="mt-0.5 font-medium">首页</span>
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/explore"
              onTouchStart={() => prefetchRoute('/explore')}
              className={`flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out ${isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900'}`}
              aria-label="探索"
            >
              <i className="fas fa-compass text-lg"></i>
              <span className="mt-0.5 font-medium">探索</span>
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/create"
              onTouchStart={() => prefetchRoute('/create')}
              className={`flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out`}
              aria-label="创作"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center -mt-4 shadow-lg ${isDark ? 'bg-red-600 hover:bg-red-500' : theme === 'pink' ? 'bg-pink-600 hover:bg-pink-500' : 'bg-red-500 hover:bg-red-600'}`}>
                <i className="fas fa-plus text-xl text-white"></i>
              </div>
              <span className="mt-1 font-medium" style={{ color: isDark ? '#f87171' : theme === 'pink' ? '#db2777' : '#dc2626' }}>创作</span>
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/neo"
              onTouchStart={() => prefetchRoute('/neo')}
              className={`flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out ${isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900'}`}
              aria-label="灵感"
            >
              <i className="fas fa-bolt text-lg"></i>
              <span className="mt-0.5 font-medium">灵感</span>
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            {isAuthenticated ? (
              <NavLink 
                to="/dashboard"
                onTouchStart={() => prefetchRoute('/dashboard')}
                className={`relative flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out ${isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900'}`}
                aria-label="我的"
              >
                <i className="fas fa-user text-lg"></i>
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-4 inline-flex items-center justify-center w-3 h-3 rounded-full bg-red-500 text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800"></span>
                )}
                <span className="mt-0.5 font-medium">我的</span>
              </NavLink>
            ) : (
              <NavLink 
                to="/login"
                className={`flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out ${isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900'}`}
                aria-label="登录"
              >
                <i className="fas fa-sign-in-alt text-lg"></i>
                <span className="mt-0.5 font-medium">登录</span>
              </NavLink>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}