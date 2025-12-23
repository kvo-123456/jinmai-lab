import { useState, useContext, useEffect, useMemo, useCallback, memo } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { AuthContext } from '@/contexts/authContext'
import { toast } from 'sonner'
import { markPrefetched, isPrefetched } from '@/services/prefetch'
import { throttle } from '@/utils/performance'
import clsx from 'clsx'
import { TianjinImage } from './TianjinStyleComponents'

interface MobileLayoutProps {
  children: React.ReactNode
}

const MobileLayout = memo(function MobileLayout({ children }: MobileLayoutProps) {
  const { theme = 'light', isDark = false, toggleTheme = () => {} } = useTheme()
  const { isAuthenticated, user, logout } = useContext(AuthContext)
  const location = useLocation()
  const navigate = useNavigate()
  
  const [showMobileNav, setShowMobileNav] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showSidebarDrawer, setShowSidebarDrawer] = useState(false)
  
  // 使用 useMemo 优化主题相关的样式计算
  const themeStyles = useMemo(() => {
    return {
      background: isDark ? 'bg-gray-900 text-white' : theme === 'pink' ? 'bg-pink-50 text-pink-900' : 'bg-gray-50 text-gray-900',
      logoBackground: isDark ? 'bg-blue-500' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500',
      logoText: isDark ? '津' : theme === 'pink' ? '智' : '坊',
      gradient: isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500'
    }
  }, [theme, isDark])

  // 使用节流优化滚动事件处理
  const handleScroll = useCallback(
    throttle(() => {
      setIsScrolled(window.scrollY > 100)
      // 计算滚动进度
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0
      setScrollProgress(progress)
    }, 100), // 100ms 内最多执行一次
    []
  )

  useEffect(() => {
    // 滚动监听
    window.addEventListener('scroll', handleScroll, { passive: true }) // 添加 passive 选项优化滚动性能
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 页面切换时隐藏搜索框
  useEffect(() => {
    setShowSearch(false)
  }, [location.pathname])

  // 处理语音搜索
  const handleVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('您的浏览器不支持语音搜索功能')
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsListening(true)

    recognition.onstart = () => {
      toast.info('正在倾听...')
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setSearch(transcript)
      setIsListening(false)
      toast.success(`识别结果: ${transcript}`)
    }

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      setIsListening(false)
      if (event.error !== 'no-speech') {
        toast.error('语音识别失败，请重试')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [])

  // 处理搜索
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) {
      toast.warning('请输入搜索关键词')
      return
    }
    const encodedSearch = encodeURIComponent(search.trim())
    navigate(`/explore?search=${encodedSearch}`)
    setSearch('')
    setShowSearch(false)
  }, [search, navigate])

  // 预取路由 - 使用防抖和空闲回调，避免阻塞点击事件
  const prefetchRoute = useCallback((path: string) => {
    // 仅预加载高频访问路由，减少预加载数量
    const highFrequencyRoutes = ['/', '/explore', '/tools', '/neo', '/wizard'];
    if (path === location.pathname || isPrefetched(path) || !highFrequencyRoutes.includes(path)) return
    
    // 只在浏览器空闲时进行预取，避免阻塞点击事件
    const idleCallback = (window as any).requestIdleCallback || ((fn: Function) => setTimeout(fn, 100))
    
    idleCallback(() => {
      markPrefetched(path)
    })
  }, [location.pathname])

  return (
    <div className={clsx(
      'min-h-screen flex flex-col',
      themeStyles.background
    )}>
      {/* 滚动进度指示器 */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none">
        <div 
          className={clsx(
            'h-full transition-all duration-100 ease-out rounded-full',
            `bg-gradient-to-r ${themeStyles.gradient}`
          )}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      
      {/* 顶部搜索栏 */}
      {showSearch ? (
        <div className={clsx(
          'sticky top-0 z-40 border-b py-3 px-4 shadow-md transition-all duration-300 ease-in-out',
          isDark ? 'bg-gray-900/90 backdrop-blur-xl border-gray-800' : 
          theme === 'pink' ? 'bg-pink-100/90 backdrop-blur-xl border-pink-200' : 
          'bg-white/90 backdrop-blur-xl border-gray-200'
        )}>
          <div className="relative flex items-center">
            <button
              onClick={() => setShowSearch(false)}
              className={clsx(
                'mr-3 p-2 rounded-full transition-colors duration-200',
                isDark ? 'text-gray-300 hover:bg-gray-800' : 
                theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                'text-gray-700 hover:bg-gray-200'
              )}
              aria-label="关闭搜索"
            >
              <i className="fas fa-times"></i>
            </button>
            <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={isDark ? '搜索...' : theme === 'pink' ? '搜索创意作品、素材或用户' : '搜索创意作品、素材或用户'}
                      className={clsx(
                        'w-full pl-10 pr-14 py-2 rounded-full focus:outline-none focus:ring-2 transition-all duration-300',
                        isDark ? 'bg-gray-800 text-white placeholder-gray-400 focus:ring-blue-500' : 
                        theme === 'pink' ? 'bg-pink-200 text-pink-900 placeholder-pink-700 focus:ring-pink-500' : 
                        'bg-gray-200 text-gray-900 placeholder-gray-700 focus:ring-orange-500'
                      )}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg">
                      <i className={clsx(
                        'fas fa-search',
                        isDark ? 'text-gray-400' : 
                        theme === 'pink' ? 'text-pink-500' : 
                        'text-orange-500'
                      )}></i>
                    </div>
                    {/* 语音搜索按钮 */}
                    <button
                      type="button"
                      onClick={handleVoiceSearch}
                      className={clsx(
                        'absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-200',
                        isListening 
                          ? (isDark ? 'bg-red-500 text-white' : theme === 'pink' ? 'bg-pink-500 text-white' : 'bg-orange-500 text-white')
                          : (isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 'text-gray-700 hover:bg-gray-200')
                      )}
                      aria-label="语音搜索"
                    >
                      <i className={`fas ${isListening ? 'fa-microphone-slash animate-pulse' : 'fa-microphone'}`}></i>
                    </button>
                  </div>
                </form>
          </div>
        </div>
      ) : (
        <div className={clsx(
          'sticky top-0 z-40 border-b py-3 px-4 shadow-md transition-all duration-300 ease-in-out',
          isDark ? 'bg-gray-900/90 backdrop-blur-xl border-gray-800' : 
          theme === 'pink' ? 'bg-pink-100/90 backdrop-blur-xl border-pink-200' : 
          'bg-white/90 backdrop-blur-xl border-gray-200'
        )}>
          <div className="flex items-center justify-between">
            {/* Logo 和菜单按钮 */}
            <div className="flex items-center space-x-3">
              {/* 菜单按钮 */}
              <button
                onClick={() => setShowSidebarDrawer(true)}
                className={clsx(
                  'p-2 rounded-full transition-colors duration-200',
                  isDark ? 'text-gray-300 hover:bg-gray-800' : 
                  theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                  'text-gray-700 hover:bg-gray-200'
                )}
                aria-label="打开侧边栏"
              >
                <i className="fas fa-bars"></i>
              </button>
              <NavLink
                to="/"
                onTouchStart={() => prefetchRoute('/')}
                className={clsx(
                  'flex items-center space-x-2',
                  isDark ? 'text-white' : 
                  theme === 'pink' ? 'text-pink-900' : 
                  'text-gray-900'
                )}
              >
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold',
                  themeStyles.logoBackground
                )}>
                  {themeStyles.logoText}
                </div>
                <span className="text-xl font-bold">津脉智坊</span>
              </NavLink>
            </div>
            
            {/* 右侧按钮组 */}
            <div className="flex items-center space-x-3">
              {/* 搜索按钮 */}
              <button
                onClick={() => setShowSearch(true)}
                className={clsx(
                  'p-2 rounded-full transition-colors duration-200',
                  isDark ? 'text-gray-300 hover:bg-gray-800' : 
                  theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                  'text-gray-700 hover:bg-gray-200'
                )}
                aria-label="搜索"
              >
                <i className="fas fa-search"></i>
              </button>
              
              {/* 通知按钮 */}
              <button
                className={clsx(
                  'p-2 rounded-full relative transition-colors duration-200',
                  isDark ? 'text-gray-300 hover:bg-gray-800' : 
                  theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                  'text-gray-700 hover:bg-gray-200'
                )}
                aria-label="通知"
              >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* 用户菜单 */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button
                    className={clsx(
                      'flex items-center space-x-2 p-2 rounded-full transition-colors duration-200',
                      isDark ? 'text-gray-300 hover:bg-gray-800' : 
                      theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                      'text-gray-700 hover:bg-gray-200'
                    )}
                    aria-label="用户菜单"
                  >
                    <div className={clsx(
                      'w-8 h-8 rounded-full overflow-hidden border-2',
                      isDark ? 'border-gray-700' : 
                      theme === 'pink' ? 'border-pink-300' : 
                      'border-gray-300'
                    )}>
                      {user?.avatar ? (
                        <TianjinImage
                          src={user.avatar}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={clsx(
                          'w-full h-full flex items-center justify-center text-white font-bold text-lg',
                          isDark ? 'bg-gray-800' : 
                          theme === 'pink' ? 'bg-pink-300' : 
                          'bg-gray-300'
                        )}>
                          {user?.username?.charAt(0) || '用'}
                        </div>
                      )}
                    </div>
                  </button>
                  
                  {/* 下拉菜单 */}
                  <div className={clsx(
                    'absolute right-0 mt-2 w-48 rounded-lg shadow-xl ring-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2',
                    isDark ? 'bg-gray-800 ring-gray-700' : 
                    theme === 'pink' ? 'bg-pink-100 ring-pink-200' : 
                    'bg-white ring-gray-200'
                  )}>
                    <div className="py-2">
                      <NavLink
                        to="/dashboard"
                        onTouchStart={() => prefetchRoute('/dashboard')}
                        className={clsx(
                          'block px-4 py-2 text-sm transition-colors duration-200',
                          isDark ? 'text-gray-300 hover:bg-gray-700' : 
                          theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                          'text-gray-900 hover:bg-gray-100'
                        )}
                      >
                        <i className="fas fa-user mr-2"></i>
                        个人中心
                      </NavLink>
                      <NavLink
                        to="/membership"
                        onTouchStart={() => prefetchRoute('/membership')}
                        className={clsx(
                          'block px-4 py-2 text-sm transition-colors duration-200',
                          isDark ? 'text-gray-300 hover:bg-gray-700' : 
                          theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                          'text-gray-900 hover:bg-gray-100'
                        )}
                      >
                        <i className="fas fa-crown mr-2"></i>
                        会员中心
                      </NavLink>
                      <NavLink
                        to="/create"
                        onTouchStart={() => prefetchRoute('/create')}
                        className={clsx(
                          'block px-4 py-2 text-sm transition-colors duration-200',
                          isDark ? 'text-gray-300 hover:bg-gray-700' : 
                          theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                          'text-gray-900 hover:bg-gray-100'
                        )}
                      >
                        <i className="fas fa-paint-brush mr-2"></i>
                        创作作品
                      </NavLink>
                      <NavLink
                        to="/settings"
                        onTouchStart={() => prefetchRoute('/settings')}
                        className={clsx(
                          'block px-4 py-2 text-sm transition-colors duration-200',
                          isDark ? 'text-gray-300 hover:bg-gray-700' : 
                          theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                          'text-gray-900 hover:bg-gray-100'
                        )}
                      >
                        <i className="fas fa-cog mr-2"></i>
                        设置
                      </NavLink>
                      <div className={clsx(
                        'border-t my-2',
                        isDark ? 'border-gray-700' : 
                        theme === 'pink' ? 'border-pink-200' : 
                        'border-gray-200'
                      )}></div>
                      <button
                        onClick={() => {
                          logout()
                          navigate('/login')
                          toast.success('退出登录成功')
                        }}
                        className={clsx(
                          'w-full text-left px-4 py-2 text-sm transition-colors duration-200',
                          isDark ? 'text-red-400 hover:bg-gray-700' : 
                          theme === 'pink' ? 'text-red-700 hover:bg-pink-200' : 
                          'text-red-700 hover:bg-gray-100'
                        )}
                      >
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* 未登录状态 */
                <NavLink
                  to="/login"
                  onTouchStart={() => prefetchRoute('/login')}
                  className={clsx(
                    'px-4 py-2 rounded-full font-medium transition-all duration-200',
                    isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 
                    theme === 'pink' ? 'bg-pink-500 text-white hover:bg-pink-600' : 
                    'bg-orange-500 text-white hover:bg-orange-600'
                  )}
                >
                  登录
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 侧边栏抽屉 */}
      <div className={`fixed inset-0 z-50 transform transition-all duration-300 ease-in-out ${showSidebarDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* 遮罩层 */}
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setShowSidebarDrawer(false)}
        />
        {/* 抽屉内容 */}
        <aside className={clsx(
          'absolute left-0 top-0 bottom-0 w-[85.71%] overflow-y-auto transform transition-transform duration-300 ease-in-out',
          showSidebarDrawer ? 'translate-x-0' : '-translate-x-full',
          isDark ? 'bg-[#0b0e13] text-white' : 
          theme === 'pink' ? 'bg-pink-50 text-pink-900' : 
          'bg-white text-gray-900'
        )}>
          {/* 抽屉头部 */}
          <div className={clsx(
            'p-4 flex items-center justify-between border-b',
            isDark ? 'border-gray-800' : 
            theme === 'pink' ? 'border-pink-200' : 
            'border-gray-200'
          )}>
            <div className="flex items-center">
              <div className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold',
                themeStyles.logoBackground
              )}>
                {themeStyles.logoText}
              </div>
              <span className="ml-2 text-xl font-bold">津脉智坊</span>
            </div>
            <button
              onClick={() => setShowSidebarDrawer(false)}
              className={clsx(
                'p-2 rounded-full transition-colors duration-200',
                isDark ? 'text-gray-300 hover:bg-gray-800' : 
                theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                'text-gray-700 hover:bg-gray-200'
              )}
              aria-label="关闭侧边栏"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          {/* 导航菜单 */}
          <nav className="p-2 space-y-1">
            <NavLink to="/" title="首页" onTouchStart={() => prefetchRoute('/')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-home mr-2"></i>
              首页
            </NavLink>
            <NavLink to="/explore" title="探索作品" onTouchStart={() => prefetchRoute('/explore')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-compass mr-2"></i>
              探索作品
            </NavLink>
            <NavLink to="/particle-art" title="粒子艺术" onTouchStart={() => prefetchRoute('/particle-art')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-palette mr-2"></i>
              粒子艺术
            </NavLink>
            <NavLink to="/tools" title="创作中心" onTouchStart={() => prefetchRoute('/tools')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-tools mr-2"></i>
              创作中心
            </NavLink>
            <NavLink to="/neo" title="灵感引擎" onTouchStart={() => prefetchRoute('/neo')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-bolt mr-2"></i>
              灵感引擎
            </NavLink>
            <NavLink to="/wizard" title="共创向导" onTouchStart={() => prefetchRoute('/wizard')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-hat-wizard mr-2"></i>
              共创向导
            </NavLink>
            <NavLink to="/square" title="共创广场" onTouchStart={() => prefetchRoute('/square')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-th-large mr-2"></i>
              共创广场
            </NavLink>
            <NavLink to="/community?context=cocreation&tab=joined" title="共创社群" onTouchStart={() => prefetchRoute('/community')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-user-friends mr-2"></i>
              共创社群
            </NavLink>
            <NavLink to="/community?context=creator" title="创作者社区" onTouchStart={() => prefetchRoute('/community')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-users mr-2"></i>
              创作者社区
            </NavLink>
            <NavLink to="/leaderboard" title="人气榜" onTouchStart={() => prefetchRoute('/leaderboard')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-chart-line mr-2"></i>
              人气榜
            </NavLink>
            <NavLink to="/games" title="趣味游戏" onTouchStart={() => prefetchRoute('/games')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-gamepad mr-2"></i>
              趣味游戏
            </NavLink>
            <NavLink to="/knowledge" title="文化知识库" onTouchStart={() => prefetchRoute('/knowledge')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-book mr-2"></i>
              文化知识库
            </NavLink>
            <NavLink to="/tianjin" title="天津特色专区" onTouchStart={() => prefetchRoute('/tianjin')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-landmark mr-2"></i>
              天津特色专区
            </NavLink>
            <NavLink to="/tianjin/map" title="天津地图" onTouchStart={() => prefetchRoute('/tianjin/map')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-map-marked-alt mr-2"></i>
              天津地图
            </NavLink>
            <NavLink to="/events" title="文化活动" onTouchStart={() => prefetchRoute('/events')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-calendar-alt mr-2"></i>
              文化活动
            </NavLink>
            <NavLink to="/lab" title="新窗口实验室" onTouchStart={() => prefetchRoute('/lab')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-window-restore mr-2"></i>
              新窗口实验室
            </NavLink>
            <NavLink to="/brand" title="品牌合作" onTouchStart={() => prefetchRoute('/brand')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-handshake mr-2"></i>
              品牌合作
            </NavLink>
            <NavLink to="/membership" title="会员中心" onTouchStart={() => prefetchRoute('/membership')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-crown mr-2"></i>
              会员中心
            </NavLink>
            <NavLink to="/about" title="关于我们" onTouchStart={() => prefetchRoute('/about')} className={({ isActive }) => `${isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 'text-gray-900 hover:bg-gray-200'} flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-200 font-semibold' : 'bg-gray-200 font-semibold') : ''}`} onClick={() => setShowSidebarDrawer(false)}>
              <i className="fas fa-info-circle mr-2"></i>
              关于我们
            </NavLink>
          </nav>
        </aside>
      </div>
      
      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      
      {/* 底部导航 */}
      <nav className={clsx(
        'fixed bottom-0 inset-x-0 md:hidden z-40 transform transition-all duration-300 ease-in-out shadow-2xl',
        isDark ? 'bg-[#0b0e13]/90 backdrop-blur-xl ring-1 ring-gray-800/70' : 
        theme === 'pink' ? 'bg-white/90 backdrop-blur-xl ring-1 ring-pink-200/70' : 
        'bg-white/90 backdrop-blur-xl ring-1 ring-gray-200/70'
      )} style={{ paddingBottom: 'env(safe-area-inset-bottom)', transform: showMobileNav ? 'translateY(0)' : 'translateY(100%)' }}>
        <ul className="grid grid-cols-5 text-xs px-2 py-1">
          <li className="flex items-center justify-center">
            <NavLink 
              to="/" 
              onTouchStart={() => prefetchRoute('/')}
              aria-label="首页"
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = 'flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out relative group transform-gpu';
                const activeColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900') : (isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900');
                const iconClass = isActive ? 'scale-125 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, activeColor)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-125')}>
                      <i className="fas fa-home text-lg"></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-0.5 font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)}>首页</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/explore"
              onTouchStart={() => prefetchRoute('/explore')}
              aria-label="探索"
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = 'flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out relative group transform-gpu';
                const activeColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900') : (isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900');
                const iconClass = isActive ? 'scale-125 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, activeColor)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-125')}>
                      <i className="fas fa-compass text-lg"></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-0.5 font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)}>探索</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/community?context=cocreation&tab=joined"
              onTouchStart={() => prefetchRoute('/community')}
              aria-label="社群"
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = 'flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out relative group transform-gpu';
                const activeColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900') : (isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900');
                const iconClass = isActive ? 'scale-125 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, activeColor)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-125')}>
                      <i className="fas fa-comments text-lg"></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-0.5 font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)}>社群</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/create"
              onTouchStart={() => prefetchRoute('/create')}
              aria-label="创作"
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = 'flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out relative group transform-gpu';
                const activeColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900') : (isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900');
                const iconClass = isActive ? 'scale-130 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, activeColor)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-130')}>
                      <i className="fas fa-plus text-xl font-bold"></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-0.5 font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)}>创作</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/neo"
              onTouchStart={() => prefetchRoute('/neo')}
              aria-label="灵感"
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = 'flex flex-col items-center justify-center py-2 transition-all duration-300 ease-in-out relative group transform-gpu';
                const activeColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900') : (isDark ? 'text-gray-300 hover:text-white' : theme === 'pink' ? 'text-pink-700 hover:text-pink-900' : 'text-gray-700 hover:text-gray-900');
                const iconClass = isActive ? 'scale-125 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, activeColor)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-125')}>
                      <i className="fas fa-bolt text-lg"></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-0.5 font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)}>灵感</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  )
})

export default MobileLayout