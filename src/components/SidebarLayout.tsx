import { useEffect, useMemo, useRef, useState, useContext, memo, useCallback } from 'react'
import { TianjinImage } from '@/components/TianjinStyleComponents'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { AuthContext } from '@/contexts/authContext'
import { markPrefetched, isPrefetched } from '@/services/prefetch'
import ErrorFeedback from '@/components/ErrorFeedback'
import { toast } from 'sonner'
import CreatorDashboard from './CreatorDashboard'

interface SidebarLayoutProps {
  children: React.ReactNode
}

export default memo(function SidebarLayout({ children }: SidebarLayoutProps) {
  const { theme = 'light', isDark = false, toggleTheme = () => {} } = useTheme()
  const { isAuthenticated, user, logout, updateUser } = useContext(AuthContext)
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    // 从localStorage读取保存的折叠状态，默认展开
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })
  const [hovered, setHovered] = useState<boolean>(false)
  const [width, setWidth] = useState<number>(() => {
    const saved = localStorage.getItem('sidebarWidth')
    // 中文注释：默认侧边栏更窄（180px），并将可拖拽的最小宽度下调到 180px
    return saved ? Math.min(Math.max(parseInt(saved), 180), 320) : 180
  })
  const dragging = useRef(false)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [search, setSearch] = useState('')
  
  // 保存折叠状态到localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed))
  }, [collapsed])
  // 中文注释：搜索建议与最近搜索（用于提高搜索功能的使用率与转化）
  const suggestions = useMemo(() => (
    ['品牌设计', '国潮设计', '老字号品牌', 'IP设计', '插画设计', '工艺创新', '非遗传承', '共创向导']
  ), [])
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('recentSearches')
      if (s) return JSON.parse(s)
    } catch {}
    return []
  })
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  
  // 中文注释：搜索建议列表
  const searchSuggestions = useMemo(() => {
    if (!search.trim()) return []
    return suggestions.filter(s => s.toLowerCase().includes(search.toLowerCase()))
  }, [search, suggestions])
  
  // 中文注释：处理搜索框聚焦和失焦事件
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const searchContainer = document.querySelector('.search-container')
      if (searchContainer && !searchContainer.contains(e.target as Node)) {
        setShowSearchDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  // 中文注释：通知数据类型与状态管理
  interface Notification {
    id: string
    title: string
    description?: string
    time: string
    read: boolean
    type?: 'info' | 'success' | 'warning'
  }
  const [showNotifications, setShowNotifications] = useState(false)
  // 中文注释：滚动超过一定距离后显示“回到顶部”悬浮按钮，提升长页可用性
  const [showBackToTop, setShowBackToTop] = useState(false)
  // 中文注释：快捷键提示弹层（提高功能可发现性）
  const [showShortcuts, setShowShortcuts] = useState(false)
  const shortcutsRef = useRef<HTMLDivElement | null>(null)
  // 中文注释：问题反馈弹层显示状态
  const [showFeedback, setShowFeedback] = useState(false)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!shortcutsRef.current) return
      if (!shortcutsRef.current.contains(e.target as Node)) {
        setShowShortcuts(false)
      }
    }
    if (showShortcuts) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showShortcuts])
  const notifRef = useRef<HTMLDivElement | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem('notifications')
      if (stored) return JSON.parse(stored)
    } catch {}
    return [
      { id: 'n1', title: '欢迎回来', description: '每日签到可领取奖励', time: '刚刚', read: false, type: 'success' },
      { id: 'n2', title: '系统更新', description: '创作中心新增AI文案优化', time: '1 小时前', read: false, type: 'info' },
      { id: 'n3', title: '新教程上线', description: '杨柳青年画入门视频', time: '昨天', read: true, type: 'info' },
    ]
  })
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications))
    } catch {}
  }, [notifications])
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!notifRef.current) return
      if (!notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handler)
    }
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifications])

  // 中文注释：用户头像菜单相关状态与引用
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  // 中文注释：点击外部关闭用户菜单
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showUserMenu])
  // 中文注释：处理更换头像文件上传
  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result || '')
      if (url) {
        updateUser({ avatar: url })
      }
    }
    reader.readAsDataURL(file)
    setShowUserMenu(false)
    e.target.value = ''
  }

  // 中文注释：侧边栏最小宽度从 200px 调整为 180px，使默认更紧凑
  const minW = 180
  const maxW = 320

  const onMouseDown = () => {
    dragging.current = true
    document.body.style.cursor = 'col-resize'
  }

  // 移除路由预加载逻辑，减少不必要的资源加载
  // 预加载会增加内存消耗和网络请求，对于低性能设备来说可能会导致卡顿
  // 导航跳转速度的提升应该通过优化组件渲染和减少不必要的资源加载来实现
  const prefetchRoute = useCallback((path: string, ttlMs = 60000) => {
    // 直接返回，不执行任何预加载逻辑
    return;
  }, [])

  // 移除空闲时预加载逻辑，减少不必要的资源加载
  // useEffect(() => {
  //   const idle = (window as any).requestIdleCallback || ((fn: Function) => setTimeout(fn, 500))
  //   idle(() => prefetchRoute('/wizard', 300000))
  //   return () => {
  //     // 中文注释：兼容不同idle实现，简单清理
  //   }
  // }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || collapsed) return
      const next = Math.min(Math.max(width + e.movementX, minW), maxW)
      setWidth(next)
      localStorage.setItem('sidebarWidth', String(next))
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = 'default'
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [width, collapsed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement && (document.activeElement as HTMLElement).tagName) || ''
      const isTyping = ['INPUT', 'TEXTAREA'].includes(tag)
      if (e.key === 't') {
        toggleTheme()
      }
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'b') {
        setCollapsed((c) => !c)
      }
      if (!isTyping) {
        const map: Record<string, string> = {
          '1': '/',
          '2': '/explore',
          '3': '/tools',
          '4': '/neo',
          '5': '/wizard',
          '6': '/square',
          '7': '/knowledge',
          '8': '/tianjin',
          '9': '/leaderboard',
          '0': '/about',
        }
        const dest = map[e.key]
        if (dest) {
          prefetchRoute(dest)
          navigate(dest)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleTheme])

  // 中文注释：当滚动距离超过 480px 时展示“回到顶部”按钮
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setShowBackToTop(y > 480)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 防抖函数
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // 中文注释：暗色主题下的导航项采用白色文字，提升对比度和可读性
  // 统一导航项高度和内边距，避免激活时布局变化
  const navItemClass = useMemo(() => (
    `${isDark ? 'text-white hover:bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'} flex items-center px-3 py-2 rounded-lg transition-all duration-200`
  ), [isDark])

  // 中文注释：主题激活态使用CSS变量，确保主题变化时样式同步更新
  // 优化激活状态样式，确保不影响整体布局
  const activeClass = useMemo(() => (
    `${isDark ? 'bg-[var(--bg-tertiary)] text-white ring-1 ring-[var(--accent-red)] shadow-[var(--shadow-md)]' : 'bg-gradient-to-r from-red-50 to-red-100 text-[var(--text-primary)] border-b-2 border-red-600 font-semibold shadow-sm relative overflow-hidden group active-nav-item'} border-t border-transparent`
  ), [isDark])

  const title = useMemo(() => {
    const p = location.pathname
    if (p === '/') return '首页'
    if (p.startsWith('/explore')) return '探索作品'
    if (p.startsWith('/tools')) return '创作中心'
    if (p.startsWith('/about')) return '关于我们'
    if (p.startsWith('/knowledge')) return '文化知识库'
    if (p.startsWith('/tianjin/map')) return '天津地图'
    if (p.startsWith('/tianjin')) return '天津特色专区'
    if (p.startsWith('/square')) return '共创广场'
    if (p.startsWith('/community')) {
      const sp = new URLSearchParams(location.search)
      const ctx = sp.get('context')
      return ctx === 'cocreation' ? '共创社群' : '创作者社区'
    }
    if (p.startsWith('/brand')) return '品牌合作'
    if (p.startsWith('/dashboard')) return '控制台'
    if (p.startsWith('/create')) return '创作中心'
    if (p.startsWith('/drafts')) return '草稿箱'
    // 中文注释：为生成页提供明确的顶部标题显示
    if (p.startsWith('/generate')) return 'AI生成引擎'
    if (p.startsWith('/neo')) return '灵感引擎'
    if (p.startsWith('/lab')) return '新窗口实验室'
    if (p.startsWith('/wizard')) return '共创向导'
    if (p.startsWith('/admin')) return '管理控制台'
    return '津脉智坊'
  }, [location.pathname, location.search])

  const onSearchSubmit = useCallback(() => {
    if (!search.trim()) return
    const q = search.trim()
    // 中文注释：跳转到探索页并记录最近搜索（去重、限6条）
    navigate(`/explore?q=${encodeURIComponent(q)}`)
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, 6)
      try { localStorage.setItem('recentSearches', JSON.stringify(next)) } catch {}
      return next
    })
  }, [search, navigate, setRecentSearches])

  // 防抖的预加载函数
  const debouncedPrefetch = useCallback(debounce((path: string) => {
    prefetchRoute(path)
  }, 200), [prefetchRoute])

  // 中文注释：共创社群模块展开状态与快捷导航方法

  // 中文注释：根据查询参数精确判断当前激活的社群类型，避免两个导航同时高亮
  const isCommunityActive = (ctx: 'cocreation' | 'creator') => {
    const sp = new URLSearchParams(location.search)
    return location.pathname.startsWith('/community') && sp.get('context') === ctx
  }

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-gradient-to-br from-[#0b0e13] via-[#0e1218] to-[#0b0e13] text-gray-100' : theme === 'pink' ? 'bg-gradient-to-br from-[#fff0f5] via-[#ffe4ec] to-[#fff0f5] text-gray-900' : 'bg-white text-gray-900'}`}>
      {/* 仅在桌面端显示侧边栏 */}
      <aside 
        className={`${isDark ? 'bg-[#10151d]/95 backdrop-blur-sm border-gray-800' : theme === 'pink' ? 'bg-white/90 backdrop-blur-sm border-pink-200' : 'bg-white border-gray-200'} border-r relative ring-1 z-10 ${isDark ? 'ring-gray-800' : theme === 'pink' ? 'ring-pink-200' : 'ring-gray-200'}`} 
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ width: (collapsed && !hovered) ? 72 : width, transition: 'width 0.2s ease-in-out' }}
      >
        <div className={`px-4 py-3 flex items-center justify-between rounded-lg transition-colors group ${isDark ? 'hover:bg-gray-800/60' : theme === 'pink' ? 'hover:bg-pink-50' : 'hover:bg-gray-50'}`}>
          <div className="flex items-center space-x-2">
            <span className={`font-extrabold bg-gradient-to-r ${isDark ? 'from-red-400 to-rose-500' : 'from-red-600 to-rose-500'} bg-clip-text text-transparent tracking-tight`}>津脉</span>
            {(!collapsed || hovered) && <span className={`font-bold ${isDark ? 'text-white' : ''}`}>智坊</span>}
          </div>
          <button
            className={`p-2 rounded-lg ring-1 transition-all ${isDark ? 'hover:bg-gray-800/70 ring-gray-800 hover:ring-2' : 'hover:bg-gray-100 ring-gray-200 hover:ring-2'} hover:shadow-sm`}
            onClick={() => setCollapsed(!collapsed)}
            aria-label="折叠侧边栏"
            title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'} ${isDark ? 'text-white' : 'text-gray-500'} transition-transform group-hover:translate-x-0.5`}></i>
          </button>
        </div>

        <nav className="px-2 space-y-1">
          <NavLink to="/" title={collapsed ? '首页' : undefined} onMouseEnter={() => debouncedPrefetch('/') } className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
              <i className="fas fa-home mr-2"></i>
              {(!collapsed || hovered) && '首页'}
            </NavLink>
          <NavLink to="/explore" title={collapsed ? '探索作品' : undefined} onMouseEnter={() => debouncedPrefetch('/explore')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-compass mr-2"></i>
            {(!collapsed || hovered) && '探索作品'}
          </NavLink>
          <NavLink to="/particle-art" title={collapsed ? '粒子艺术' : undefined} onMouseEnter={() => debouncedPrefetch('/particle-art')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-palette mr-2"></i>
            {(!collapsed || hovered) && '粒子艺术'}
          </NavLink>
          <NavLink to="/tools" title={collapsed ? '创作中心' : undefined} onMouseEnter={() => debouncedPrefetch('/tools')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-tools mr-2"></i>
            {(!collapsed || hovered) && '创作中心'}
          </NavLink>
          <NavLink to="/neo" title={collapsed ? '灵感引擎' : undefined} onMouseEnter={() => debouncedPrefetch('/neo')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-bolt mr-2"></i>
            {(!collapsed || hovered) && '灵感引擎'}
          </NavLink>
          {/* 中文注释：为“共创向导”导航项补充辅助功能与预加载触发，提升可访问性与响应速度 */}
          <NavLink 
            to="/wizard" 
            title={collapsed ? '共创向导' : undefined} 
            aria-label={collapsed ? '共创向导' : undefined}
            data-discover="true"
            onMouseEnter={() => debouncedPrefetch('/wizard')} 
            onFocus={() => debouncedPrefetch('/wizard')}
            onTouchStart={() => debouncedPrefetch('/wizard')}
            className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}
          > 
            <i className="fas fa-hat-wizard mr-2"></i>
            {(!collapsed || hovered) && '共创向导'}
          </NavLink>
          <NavLink to="/square" title={collapsed ? '共创广场' : undefined} onMouseEnter={() => debouncedPrefetch('/square')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-th-large mr-2"></i>
            {(!collapsed || hovered) && '共创广场'}
          </NavLink>
          {/* 中文注释：共创社群在折叠时也显示图标，便于快速进入 */}
          <NavLink 
            to="/community?context=cocreation&tab=joined" 
            title={collapsed ? '共创社群' : undefined} 
            data-discover="true"
            onMouseEnter={() => debouncedPrefetch('/community')} 
            className={() => `${navItemClass} ${isCommunityActive('cocreation') ? activeClass : ''}`}
          >
            <i className="fas fa-user-friends mr-2"></i>
            {(!collapsed || hovered) && '共创社群'}
          </NavLink>
          <NavLink to="/community?context=creator" title={collapsed ? '创作者社区' : undefined} onMouseEnter={() => debouncedPrefetch('/community')} className={() => `${navItemClass} mt-2 ${isCommunityActive('creator') ? activeClass : ''}`}> 
            <i className="fas fa-users mr-2"></i>
            {(!collapsed || hovered) && '创作者社区'}
          </NavLink>
          <NavLink to="/leaderboard" title={collapsed ? '排行榜' : undefined} onMouseEnter={() => debouncedPrefetch('/leaderboard')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-chart-line mr-2"></i>
            {(!collapsed || hovered) && '人气榜'}
          </NavLink>
          <NavLink to="/games" title={collapsed ? '小游戏' : undefined} onMouseEnter={() => debouncedPrefetch('/games')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-gamepad mr-2"></i>
            {(!collapsed || hovered) && '趣味游戏'}
          </NavLink>
          <NavLink to="/knowledge" title={collapsed ? '文化知识库' : undefined} onMouseEnter={() => debouncedPrefetch('/knowledge')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-book mr-2"></i>
            {(!collapsed || hovered) && '文化知识库'}
          </NavLink>
          <NavLink to="/tianjin" end title={collapsed ? '天津特色专区' : undefined} onMouseEnter={() => debouncedPrefetch('/tianjin')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-landmark mr-2"></i>
            {(!collapsed || hovered) && '天津特色专区'}
          </NavLink>
          <NavLink to="/tianjin/map" title={collapsed ? '天津地图' : undefined} onMouseEnter={() => debouncedPrefetch('/tianjin/map')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-map-marked-alt mr-2"></i>
            {(!collapsed || hovered) && '天津地图'}
          </NavLink>
          <NavLink to="/events" title={collapsed ? '文化活动' : undefined} onMouseEnter={() => debouncedPrefetch('/events')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-calendar-alt mr-2"></i>
            {(!collapsed || hovered) && '文化活动'}
          </NavLink>
          <NavLink to="/news" title={collapsed ? '文化资讯' : undefined} onMouseEnter={() => debouncedPrefetch('/news')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-newspaper mr-2"></i>
            {(!collapsed || hovered) && '文化资讯'}
          </NavLink>
          <NavLink to="/lab" title={collapsed ? '新窗口实验室' : undefined} onMouseEnter={() => debouncedPrefetch('/lab')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-window-restore mr-2"></i>
            {(!collapsed || hovered) && '新窗口实验室'}
          </NavLink>
          <NavLink to="/brand" title={collapsed ? '品牌合作' : undefined} onMouseEnter={() => debouncedPrefetch('/brand')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-handshake mr-2"></i>
            {(!collapsed || hovered) && '品牌合作'}
          </NavLink>
          <NavLink to="/about" title={collapsed ? '关于我们' : undefined} onMouseEnter={() => debouncedPrefetch('/about')} className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''}`}> 
            <i className="fas fa-info-circle mr-2"></i>
            {(!collapsed || hovered) && '关于我们'}
          </NavLink>
        </nav>

        {/* 中文注释：侧栏保留预留的社群模块占位，后续再完善 */}

        {/* 中文注释：原侧边栏底部“主题切换”入口移除，改在首页右下角提供统一入口 */}

        {!collapsed && (
          <div
            onMouseDown={onMouseDown}
            className={`absolute top-0 right-0 h-full w-1 cursor-col-resize ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
          />
        )}
      </aside>
      {/* 中文注释：恢复点击自动收起功能，但优化实现方式避免跳动 */}
      <div 
        className="flex-1 min-w-0 md:pb-0 pt-0 flex flex-col overflow-y-auto relative z-10"
        onClick={(e) => {
          // 确保点击的不是内部的可交互元素
          const target = e.target as HTMLElement;
          // 只在点击主内容区域时收起侧边栏，不拦截导航链接等可交互元素
          if (!collapsed && !target.closest('button, input, a, [role="menu"], [role="dialog"], nav, [data-discover="true"]')) {
            setCollapsed(true);
          }
        }}
      >
        {/* 中文注释：暗色头部采用半透明背景与毛玻璃，弱化硬边 */}
        <header className={`sticky top-0 z-40 ${isDark ? 'bg-[#0b0e13]/80 backdrop-blur-sm' : theme === 'pink' ? 'bg-white/80 backdrop-blur-sm' : 'bg-white'} border-b ${isDark ? 'border-gray-800' : theme === 'pink' ? 'border-pink-200' : 'border-gray-200'} px-4 py-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                onClick={() => setCollapsed(!collapsed)}
                aria-label="切换侧边栏"
              >
                <i className="fas fa-bars"></i>
              </button>
              <h2 className="text-lg font-bold">{title}</h2>
            </div>
            <div className="flex items-center space-x-3">
              {/* 中文注释：搜索框 */}
              <div className="relative search-container">
                <div className={`flex items-center rounded-lg ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'} px-3 py-2`}>
                  <i className={`fas fa-search ${isDark ? 'text-gray-400' : 'text-gray-500'} mr-2`}></i>
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSearchSubmit(); }}
                    onFocus={() => setShowSearchDropdown(true)}
                    onBlur={() => {
                      // 延迟关闭，以便点击建议项
                      setTimeout(() => setShowSearchDropdown(false), 200)
                    }}
                    placeholder="搜索作品、素材或用户"
                    className={`flex-1 outline-none ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className={`ml-2 p-1 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                      aria-label="清除搜索"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                  <button
                    onClick={onSearchSubmit}
                    className={`ml-2 px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm`}
                    aria-label="搜索"
                  >
                    搜索
                  </button>
                </div>
                {/* 搜索建议和最近搜索 */}
                {showSearchDropdown && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-lg ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'} z-50`}>
                    {search && searchSuggestions.length > 0 && (
                      <div className="px-4 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                        <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>搜索建议</span>
                        <ul className="mt-2 space-y-1">
                          {searchSuggestions.map((suggestion, index) => (
                            <li key={index}>
                              <button
                                onClick={() => {
                                  setSearch(suggestion);
                                  onSearchSubmit();
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-900'}`}
                              >
                                <i className="fas fa-search mr-2 text-xs text-gray-400"></i>
                                {suggestion}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {recentSearches.length > 0 && (
                      <div className="px-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>最近搜索</span>
                          <button
                            onClick={() => {
                              setRecentSearches([]);
                              localStorage.removeItem('recentSearches');
                            }}
                            className={`text-xs ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                          >
                            清空
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((item, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setSearch(item);
                                onSearchSubmit();
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* 主题切换按钮 */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-300 flex items-center ${isDark ? 'bg-gray-800 hover:bg-gray-700 ring-1 ring-gray-700 text-gray-100 hover:ring-gray-600' : theme === 'pink' ? 'bg-pink-50 hover:bg-pink-100 ring-1 ring-pink-200 text-pink-800 hover:ring-pink-300' : 'bg-white hover:bg-gray-50 ring-1 ring-gray-200 text-gray-900 hover:ring-gray-300'}`}
                aria-label="切换主题"
                title="切换主题（浅色/深色/粉色/自动）"
              >
                <i className={`fas ${theme === 'dark' ? 'fa-sun' : theme === 'light' ? 'fa-moon' : theme === 'pink' ? 'fa-heart' : 'fa-circle-half-stroke'} transition-transform duration-300 hover:scale-110`}></i>
              </button>
              
              {/* 中文注释：快捷键提示入口 */}
              <div className="relative" ref={shortcutsRef}>
                <button
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                  aria-label="查看快捷键"
                  aria-expanded={showShortcuts}
                  onClick={() => setShowShortcuts(v => !v)}
                  title="快捷键提示"
                >
                  <i className="fas fa-keyboard"></i>
                </button>
                {showShortcuts && (
                  <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-lg ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'}`} role="dialog" aria-label="快捷键列表">
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                      <span className="font-medium">快捷键</span>
                      <button className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`} onClick={() => setShowShortcuts(false)}>关闭</button>
                    </div>
                    <ul className="px-4 py-2 text-sm space-y-1">
                      <li className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>/ 聚焦搜索</li>
                      <li className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>T 切换主题</li>
                      <li className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>B 折叠侧边栏</li>
                      <li className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>1–0 快速导航（首页至关于）</li>
                      <li className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>移动端：下滑隐藏底部导航</li>
                    </ul>
                  </div>
                )}
              </div>
              {/* 中文注释：问题反馈入口 */}
              <button
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                aria-label="问题反馈"
                title="问题反馈"
                onClick={() => setShowFeedback(true)}
              >
                <i className="fas fa-bug"></i>
              </button>

              <button
                title="分享"
                aria-label="分享当前页面"
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                onClick={() => {
                  try {
                    const url = window.location.href
                    if (navigator.share && window.isSecureContext) {
                      navigator.share({
                        title: document.title,
                        url: url
                      })
                    } else {
                      navigator.clipboard.writeText(url)
                      toast.success('分享链接已复制到剪贴板')
                    }
                  } catch {
                    toast.error('分享失败，请重试')
                  }
                }}
              >
                <i className="fas fa-share-nodes"></i>
              </button>
              <div className="relative" ref={notifRef}>
                <button
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                  aria-label="通知"
                  aria-expanded={showNotifications}
                  onClick={() => setShowNotifications(v => !v)}
                >
                  <i className="fas fa-bell"></i>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-lg ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'}`} role="dialog" aria-label="通知列表">
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                      <span className="font-medium">通知</span>
                      <div className="flex items-center space-x-2">
                        <button
                          className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                          onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
                          全部已读
                        </button>
                        <button
                          className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                          onClick={() => setNotifications([])}>
                          清空
                        </button>
                      </div>
                    </div>
                    <ul className="max-h-80 overflow-auto">
                      {notifications.length === 0 ? (
                        <li className={`${isDark ? 'text-gray-400' : 'text-gray-600'} px-4 py-6 text-sm`}>暂无通知</li>
                      ) : (
                        notifications.map(n => (
                          <li key={n.id}>
                            <button
                              className={`w-full text-left px-4 py-3 flex items-start space-x-3 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                              onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                            >
                              <span className={`mt-0.5 inline-flex items-center justify-center w-2 h-2 rounded-full ${n.read ? 'bg-gray-300' : 'bg-red-500'}`}></span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{n.title}</span>
                                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{n.time}</span>
                                </div>
                                {n.description && (
                                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{n.description}</p>
                                )}
                              </div>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                    <div className={`px-4 py-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} text-right`}>
                      <button
                        className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                        onClick={() => setShowNotifications(false)}>
                        关闭
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 创作者仪表盘 */}
              <CreatorDashboard />
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    className="flex items-center space-x-2"
                    aria-label="用户菜单"
                    aria-expanded={showUserMenu}
                    onClick={() => setShowUserMenu(v => !v)}
                  >
                    <TianjinImage src={user?.avatar || ''} alt={user?.username || '用户头像'} className="h-8 w-8" ratio="square" rounded="full" />
                  </button>
                  {showUserMenu && (
                    <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'}`} role="menu" aria-label="用户菜单">
                      <div className="px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                        <p className="text-sm">{user?.username}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                      </div>
                      <ul className="py-1">
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/dashboard') }}>个人中心</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/membership') }}>会员中心</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/collection') }}>我的收藏</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/drafts') }}>草稿箱</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/settings') }}>设置</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/analytics') }}>数据分析</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => fileRef.current?.click()}>更换头像</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={async () => { if (!user?.avatar) return; try { await navigator.clipboard.writeText(user.avatar) } catch {} setShowUserMenu(false) }}>复制头像链接</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={async () => { if (!user?.avatar) return; try { const a = document.createElement('a'); a.href = user.avatar; a.download = 'avatar'; document.body.appendChild(a); a.click(); document.body.removeChild(a); } catch {} setShowUserMenu(false) }}>下载头像</button>
                        </li>
                        <li className="border-t border-gray-200">
                          <button className={`w-full text-left px-4 py-2 text-red-600 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); logout() }}>退出登录</button>
                        </li>
                      </ul>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFileChange} />
                    </div>
                  )}
                </div>
              ) : (
                <NavLink to="/login" className={`px-3 py-1 rounded-md ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'}`}>
                  登录
                </NavLink>
              )}
            </div>
          </div>
        </header>
        {children}
        {/* 中文注释：全局“回到顶部”悬浮按钮（自适应暗色/浅色主题） */}
        {showBackToTop && (
          <button
            aria-label="回到顶部"
            title="回到顶部"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed right-4 bottom-6 z-40 p-3 rounded-full shadow-lg ring-1 transition-colors ${isDark ? 'bg-gray-800 text-white ring-gray-700 hover:bg-gray-700' : theme === 'pink' ? 'bg-white text-gray-900 ring-pink-200 hover:bg-pink-50' : 'bg-white text-gray-900 ring-gray-200 hover:bg-gray-50'}`}
          >
            <i className="fas fa-arrow-up"></i>
          </button>
        )}

        {showFeedback && (
          <ErrorFeedback onClose={() => setShowFeedback(false)} autoShow={true} />
        )}
      </div>
    </div>
  )
})
