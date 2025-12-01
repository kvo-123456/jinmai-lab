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
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: '欢迎回来', description: '每日签到可领取奖励', time: '刚刚', read: false, type: 'success' },
    { id: 'n2', title: '系统更新', description: '创作中心新增AI文案优化', time: '1 小时前', read: false, type: 'info' },
    { id: 'n3', title: '新教程上线', description: '杨柳青年画入门视频', time: '昨天', read: true, type: 'info' },
  ])
  
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])
  
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
    navigate(`/explore?q=${encodeURIComponent(q)}`)
    setShowSearch(false)
  }
  
  const prefetchRoute = (path: string, ttlMs = 60000) => {
    const key = path.replace(/^\//, '') || 'home'
    if (isPrefetched(key)) return
    switch (path) {
      case '/': import('@/pages/Home'); markPrefetched('home', ttlMs); break
      case '/explore': import('@/pages/Explore'); markPrefetched('explore', ttlMs); break
      case '/tools': import('@/pages/Tools'); markPrefetched('tools', ttlMs); break
      case '/neo': import('@/pages/Neo'); markPrefetched('neo', ttlMs); break
      case '/wizard': import('@/pages/Wizard'); markPrefetched('wizard', ttlMs); break
      case '/square': import('@/pages/Square'); markPrefetched('square', ttlMs); break
      case '/community': import('@/pages/Community'); markPrefetched('community', ttlMs); break
      case '/dashboard': import('@/pages/Dashboard'); markPrefetched('dashboard', ttlMs); break
      default: break
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
                onChange={(e) => setSearch(e.target.value)}
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
                onClick={() => setShowSearch(false)}
                className={`ml-2 p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                aria-label="关闭"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
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
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                  aria-label="通知"
                >
                  <i className="fas fa-bell"></i>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  )}
                </button>
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
      <nav className={`fixed bottom-0 inset-x-0 md:hidden ${isDark ? 'bg-[#0b0e13]/90 backdrop-blur-xl ring-1 ring-gray-800/70' : theme === 'pink' ? 'bg-white/90 backdrop-blur-xl ring-1 ring-pink-200/70' : 'bg-white/90 backdrop-blur-xl ring-1 ring-gray-200/70'} z-40 transform transition-transform duration-200 shadow-2xl`} style={{ paddingBottom: 'env(safe-area-inset-bottom)', transform: showMobileNav ? 'translateY(0)' : 'translateY(100%)' }}>
        <ul className="grid grid-cols-5 text-xs px-2 py-1">
          <li>
            <NavLink 
              to="/"
              onTouchStart={() => prefetchRoute('/')}
              className={({ isActive }) => `flex flex-col items-center justify-center py-2.5 ${isActive ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-300' : 'text-gray-700')}`}
              aria-label="首页"
            >
              <i className="fas fa-home text-lg"></i>
              <span className="mt-0.5">首页</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/explore"
              onTouchStart={() => prefetchRoute('/explore')}
              className={({ isActive }) => `flex flex-col items-center justify-center py-2.5 ${isActive ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-300' : 'text-gray-700')}`}
              aria-label="探索"
            >
              <i className="fas fa-compass text-lg"></i>
              <span className="mt-0.5">探索</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/create"
              onTouchStart={() => prefetchRoute('/create')}
              className={({ isActive }) => `flex flex-col items-center justify-center py-2.5 ${isActive ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-300' : 'text-gray-700')}`}
              aria-label="创作"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${isActive ? (isDark ? 'bg-red-400/20' : 'bg-red-100') : (isDark ? 'bg-gray-800' : 'bg-gray-100')}`}>
                <i className="fas fa-plus text-xl" style={{ color: isActive ? (isDark ? '#fb7185' : '#dc2626') : (isDark ? '#9ca3af' : '#6b7280') }}></i>
              </div>
              <span>创作</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/neo"
              onTouchStart={() => prefetchRoute('/neo')}
              className={({ isActive }) => `flex flex-col items-center justify-center py-2.5 ${isActive ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-300' : 'text-gray-700')}`}
              aria-label="灵感"
            >
              <i className="fas fa-bolt text-lg"></i>
              <span className="mt-0.5">灵感</span>
            </NavLink>
          </li>
          <li>
            {isAuthenticated ? (
              <NavLink 
                to="/dashboard"
                onTouchStart={() => prefetchRoute('/dashboard')}
                className={({ isActive }) => `relative flex flex-col items-center justify-center py-2.5 ${isActive ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-300' : 'text-gray-700')}`}
                aria-label="我的"
              >
                <i className="fas fa-user text-lg"></i>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-6 inline-flex items-center justify-center w-2 h-2 rounded-full bg-red-500"></span>
                )}
                <span className="mt-0.5">我的</span>
              </NavLink>
            ) : (
              <NavLink 
                to="/login"
                className={({ isActive }) => `flex flex-col items-center justify-center py-2.5 ${isActive ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-300' : 'text-gray-700')}`}
                aria-label="登录"
              >
                <i className="fas fa-sign-in-alt text-lg"></i>
                <span className="mt-0.5">登录</span>
              </NavLink>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}