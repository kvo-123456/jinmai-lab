import { useTheme } from '@/hooks/useTheme'
import { motion } from 'framer-motion'
import { TianjinImage } from '@/components/TianjinStyleComponents'
import { useEffect, useState, useMemo, useRef, useCallback, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import postsApi, { Post } from '@/services/postService'
import PerformanceTest from '@/utils/performanceTest'

import GradientHero from '@/components/GradientHero'
import { mockWorks } from '@/mock/works'
import apiClient from '@/lib/apiClient'

// 懒加载组件
const PostGrid = lazy(() => import('@/components/PostGrid'))
const SearchBar = lazy(() => import('@/components/SearchBar'))

// 性能监控工具
interface PerformanceMetrics {
  componentMountTime: number
  imageLoadTime: number
  tagLoadTime: number
  communityLoadTime: number
  renderCount: number
  averageRenderTime: number
  memoryUsage: number
  fps: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    componentMountTime: 0,
    imageLoadTime: 0,
    tagLoadTime: 0,
    communityLoadTime: 0,
    renderCount: 0,
    averageRenderTime: 0,
    memoryUsage: 0,
    fps: 0
  }
  
  private startTime: number = 0
  private renderTimes: number[] = []
  private frameCount: number = 0
  private lastFpsUpdate: number = 0
  
  startMonitoring() {
    this.startTime = performance.now()
    this.metrics.componentMountTime = this.startTime
    this.startFpsCounter()
  }
  
  markImageLoad() {
    this.metrics.imageLoadTime = performance.now() - this.startTime
  }
  
  markTagLoad() {
    this.metrics.tagLoadTime = performance.now() - this.startTime
  }
  
  markCommunityLoad() {
    this.metrics.communityLoadTime = performance.now() - this.startTime
  }
  
  markRender() {
    const renderTime = performance.now()
    this.renderTimes.push(renderTime)
    this.metrics.renderCount++
    
    // 计算平均渲染时间（只保留最近10次）
    if (this.renderTimes.length > 10) {
      this.renderTimes.shift()
    }
    
    if (this.renderTimes.length > 1) {
      const totalTime = this.renderTimes[this.renderTimes.length - 1] - this.renderTimes[0]
      this.metrics.averageRenderTime = totalTime / (this.renderTimes.length - 1)
    }
    
    this.updateMemoryUsage()
  }
  
  private startFpsCounter() {
    const updateFps = () => {
      this.frameCount++
      const now = performance.now()
      
      if (now - this.lastFpsUpdate >= 1000) {
        this.metrics.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate))
        this.frameCount = 0
        this.lastFpsUpdate = now
      }
      
      requestAnimationFrame(updateFps)
    }
    
    requestAnimationFrame(updateFps)
  }
  
  private updateMemoryUsage() {
    if ('memory' in performance) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
    }
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }
  
  logMetrics(componentName: string) {
    // 只在开发环境下输出性能日志
    if (process.env.NODE_ENV === 'development') {
      const metrics = this.getMetrics()
      console.group(`📊 ${componentName} 性能监控报告`)
      console.log(`🕒 组件挂载时间: ${metrics.componentMountTime.toFixed(2)}ms`)
      console.log(`🖼️ 图片加载时间: ${metrics.imageLoadTime.toFixed(2)}ms`)
      console.log(`🏷️ 标签加载时间: ${metrics.tagLoadTime.toFixed(2)}ms`)
      console.log(`👥 社群加载时间: ${metrics.communityLoadTime.toFixed(2)}ms`)
      console.log(`🔄 渲染次数: ${metrics.renderCount}`)
      console.log(`⏱️ 平均渲染时间: ${metrics.averageRenderTime.toFixed(2)}ms`)
      console.log(`💾 内存使用: ${metrics.memoryUsage.toFixed(2)}MB`)
      console.log(`🎯 帧率: ${metrics.fps}FPS`)
      console.groupEnd()
      
      // 开发环境下发送到性能监控服务
      this.sendMetricsToServer(metrics, componentName)
    }
  }
  
  private sendMetricsToServer(metrics: PerformanceMetrics, componentName: string) {
    // 在实际项目中可以发送到性能监控服务
    const performanceData = {
      component: componentName,
      timestamp: Date.now(),
      metrics: metrics,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    }
    
    // 这里可以发送到监控服务
    console.log('📡 发送性能数据到监控服务:', performanceData)
  }
}

// 优化：图片懒加载组件
// 使用统一的 LazyImage 组件，移除本地定义
import LazyImage from '@/components/LazyImage'

// 中文注释：广场初始示例作品（可作为冷启动内容）
// 优化：减少初始种子数据，按需加载
const SEED: Post[] = [
  { id: 'seed-1', title: '国潮插画设计', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20cultural%20illustration%20design&image_size=1024x1024', likes: 324, comments: [], date: '2025-11-01', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-2', title: '麻花赛博朋克', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Tianjin%20mahua%20cyberpunk&image_size=1024x1024', likes: 512, comments: [], date: '2025-11-02', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-3', title: '杨柳青年画海报', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Yangliuqing%20New%20Year%20poster%2C%20vibrant%20colors&image_size=1024x1024', likes: 338, comments: [], date: '2025-11-03', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-4', title: '桂发祥联名插画海报', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Guifaxiang%20collab%20illustration%20poster%2C%20oriental%20style&image_size=1024x1024', likes: 256, comments: [], date: '2025-11-03', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-5', title: '同仁堂品牌视觉年鉴', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Tongrentang%20brand%20yearbook%2C%20red%20and%20gold&image_size=1024x1024', likes: 264, comments: [], date: '2025-11-04', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
]

// 延迟加载的额外种子数据
const EXTRA_SEED: Post[] = [
  { id: 'seed-6', title: '京剧舞台视觉系统', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Peking%20opera%20stage%20visual%20system&image_size=1024x1024', likes: 231, comments: [], date: '2025-11-04', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-7', title: '景德镇文创器皿插画', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Jingdezhen%20cultural%20ware%20illustration%2C%20blue%20and%20white&image_size=1024x1024', likes: 242, comments: [], date: '2025-11-05', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-8', title: '海河导视与标识', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Haihe%20wayfinding%20and%20signage%2C%20blue%20accent&image_size=1024x1024', likes: 244, comments: [], date: '2025-11-05', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-9', title: '东方美学字体集', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Oriental%20aesthetic%20typeface%20specimen&image_size=1024x1024', likes: 382, comments: [], date: '2025-11-06', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-10', title: '狗不理联名海报', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Goubuli%20brand%20collab%20poster%2C%20bold%20graphics&image_size=1024x1024', likes: 198, comments: [], date: '2025-11-06', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-11', title: '耳朵眼品牌IP形象', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Erduoyan%20brand%20mascot%20illustration%2C%20cute&image_size=1024x1024', likes: 312, comments: [], date: '2025-11-07', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-12', title: '果仁张秋季礼盒', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Guorenzhang%20autumn%20gift%20box%20packaging&image_size=1024x1024', likes: 224, comments: [], date: '2025-11-07', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
]

// 中文注释：从探索页导入的策展作品（转换为广场帖子结构；导入全部）
const EXPLORE_SEEDS: Post[] = mockWorks.map((w) => ({
  id: `ex-${w.id}`,
  title: w.title,
  thumbnail: w.thumbnail,
  likes: w.likes,
  comments: [],
  date: new Date().toISOString().slice(0, 10),
  category: 'design',
  tags: [],
  description: '',
  views: 0,
  shares: 0,
  isFeatured: false,
  isDraft: false,
  completionStatus: 'completed',
  creativeDirection: '',
  culturalElements: [],
  colorScheme: [],
  toolsUsed: []
}))

// 中文注释：扩展策展作品—为每个作品生成二期/三期衍生，增加广场总体数量
// 中文注释：批量生成多期衍生作品（2~3期），标题带期数后缀，点赞数作轻微调整
// 优化：只生成前20个作品的衍生，减少初始数据量
const EXPANDED_EXPLORE_SEEDS: Post[] = [
  ...EXPLORE_SEEDS,
  ...[2, 3].flatMap((phase) => 
    mockWorks.slice(0, 20).map((w) => {
      // 直接使用原始URL，避免重新构建导致的问题
      // 这样可以确保使用已经生成好的图片，而不是重新请求生成
      const newThumbnail = w.thumbnail;
      
      return {
        id: `ex${phase}-${w.id}`,
        title: `${w.title}·${phase}期`,
        thumbnail: newThumbnail,
        likes: Math.max(0, w.likes + phase * 10 - 20),
        comments: [],
        date: new Date().toISOString().slice(0, 10),
        category: 'design' as const,
        tags: [],
        description: '',
        views: 0,
        shares: 0,
        isFeatured: false,
        isDraft: false,
        completionStatus: 'completed' as const,
        creativeDirection: '',
        culturalElements: [],
        colorScheme: [],
        toolsUsed: []
      };
    })
  ),
]

export default function Square() {
  const { isDark } = useTheme()
  const params = useParams()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  
  // 性能监控实例
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null)
  const performanceTestRef = useRef<PerformanceTest | null>(null)
  
  // 初始化性能监控和性能测试
  useEffect(() => {
    if (!performanceMonitorRef.current) {
      performanceMonitorRef.current = new PerformanceMonitor()
      performanceMonitorRef.current.startMonitoring()
    }
    
    // 初始化性能测试
    if (!performanceTestRef.current) {
      performanceTestRef.current = new PerformanceTest()
      performanceTestRef.current.startTest()
      
      // 标记Square组件开始渲染
      setTimeout(() => {
        performanceTestRef.current?.markComponentRender('Square')
      }, 100)
    }
    
    // 监听图片加载性能事件
    const handleImageLoadStart = (event: CustomEvent) => {
      // 记录图片开始加载
      if (event.detail && event.detail.url) {
        performanceTestRef.current?.markImageLoadStart(event.detail.url)
      }
    }
    
    const handleImageLoaded = (event: CustomEvent) => {
      performanceMonitorRef.current?.markImageLoad()
      // 记录图片加载性能
      if (event.detail && event.detail.url) {
        performanceTestRef.current?.markImageLoadComplete(event.detail.url)
      }
    }
    
    window.addEventListener('performance:imageLoadStart', handleImageLoadStart as EventListener)
    window.addEventListener('performance:imageLoaded', handleImageLoaded as EventListener)
    
    return () => {
      // 组件卸载时输出性能报告
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.logMetrics('Square组件')
      }
      if (performanceTestRef.current && process.env.NODE_ENV === 'development') {
        console.log('📊 Square组件性能测试报告:', performanceTestRef.current.getSummary())
      }
      window.removeEventListener('performance:imageLoadStart', handleImageLoadStart as EventListener)
      window.removeEventListener('performance:imageLoaded', handleImageLoaded as EventListener)
    }
  }, [])
  
  // 性能监控：标记每次渲染（优化：减少监控频率）
  useEffect(() => {
    // 只在开发环境下启用性能监控
    if (process.env.NODE_ENV === 'development') {
      performanceMonitorRef.current?.markRender()
    }
  })
  
  // 性能监控面板状态
  const [showPerformancePanel, setShowPerformancePanel] = useState(false)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  
  // 更新性能监控面板
  useEffect(() => {
    if (showPerformancePanel && performanceMonitorRef.current) {
      const interval = setInterval(() => {
        setPerformanceMetrics(performanceMonitorRef.current?.getMetrics() || null)
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [showPerformancePanel])
  
  // 中文注释：热门话题标签（支持按点击热度排序）
  const DEFAULT_TAGS = ['国潮设计', '非遗传承', '品牌联名', '校园活动', '文旅推广']
  const TAG_KEY = 'jmzf_tag_clicks'
  const TAGS_CACHE_KEY = 'jmzf_tags_cache'
  const TAGS_CACHE_TIMEOUT = 5 * 60 * 1000 // 5分钟缓存
  
  const [tagClicks, setTagClicks] = useState<Record<string, number>>(() => {
    try { const raw = localStorage.getItem(TAG_KEY); return raw ? JSON.parse(raw) : {} } catch { return {} }
  })
  const [tags, setTags] = useState<string[]>(DEFAULT_TAGS)
  const [tagMeta, setTagMeta] = useState<Record<string, { weight?: number; group?: string; desc?: string }>>({})
  const [tagsLoading, setTagsLoading] = useState(false)
  const [tagsError, setTagsError] = useState<string | null>(null)
  
  // 优化：缓存排序函数
  const sortTagsByClicks = (list: string[], clicks: Record<string, number>) => {
    const orderMap = new Map<string, number>(list.map((t, i) => [t, i]))
    return list.slice().sort((a, b) => {
      const ca = clicks[a] || 0
      const cb = clicks[b] || 0
      if (ca > 0 && cb > 0) return cb - ca
      if (ca > 0) return -1
      if (cb > 0) return 1
      return orderMap.get(a)! - orderMap.get(b)!
    })
  }
  
  // 优化：懒加载标签数据
  const loadTags = async () => {
    // 检查缓存
    try {
      const cached = localStorage.getItem(TAGS_CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < TAGS_CACHE_TIMEOUT) {
          setTags(sortTagsByClicks(data.tags, tagClicks))
          setTagMeta(data.meta)
          
          // 性能监控：标记标签加载完成（缓存命中）
          performanceMonitorRef.current?.markTagLoad()
          return
        }
      }
    } catch {}
    
    setTagsLoading(true)
    setTagsError(null)
    
    try {
      const resp = await apiClient.get<{ ok: boolean; data: any[] }>('/api/community/tags')
      if (resp.ok && Array.isArray(resp.data?.data)) {
        const arr = resp.data!.data
        const items = arr.map((x: any) => String(x.name || ''))
        const meta = arr.reduce((acc: any, x: any) => {
          acc[x.name] = { weight: x.weight, group: x.group, desc: x.desc }
          return acc
        }, {})
        
        // 缓存结果
        localStorage.setItem(TAGS_CACHE_KEY, JSON.stringify({
          data: { tags: items, meta },
          timestamp: Date.now()
        }))
        
        setTags(sortTagsByClicks(items, tagClicks))
        setTagMeta(meta)
        
        // 性能监控：标记标签加载完成
        performanceMonitorRef.current?.markTagLoad()
      } else {
        setTags(DEFAULT_TAGS)
        setTagsError(resp.error || '加载失败')
      }
    } catch (e) {
      setTags(DEFAULT_TAGS)
      setTagsError((e as Error)?.message || '网络错误')
    } finally {
      setTagsLoading(false)
    }
  }
  
  useEffect(() => {
    loadTags()
  }, [tagClicks])
  const incTagClick = (tag: string) => {
    const next = { ...tagClicks, [tag]: (tagClicks[tag] || 0) + 1 }
    setTagClicks(next)
    try { localStorage.setItem(TAG_KEY, JSON.stringify(next)) } catch {}
    setTags(sortTagsByClicks(DEFAULT_TAGS, next))
  }
  const hotTagSet = useMemo(() => {
    // 中文注释：所有标签都显示为“热”标签
    return new Set(tags)
  }, [tags])
  // 中文注释：精选社群数据（从本地API加载；失败回退本地静态）
  type FeaturedCommunity = { name: string; members: number; path: string; official?: boolean; topic?: string; tags?: string[] }
  const DEFAULT_FEATURED: FeaturedCommunity[] = [
    { name: '国潮共创组', members: 128, path: '/community?group=guochao' },
    { name: '非遗研究社', members: 96, path: '/community?group=heritage' },
    { name: '品牌联名工坊', members: 73, path: '/community?group=brand' },
  ]
  const FEATURED_CACHE_KEY = 'jmzf_featured_cache'
  const FEATURED_CACHE_TIMEOUT = 10 * 60 * 1000 // 10分钟缓存
  
  const [featuredCommunities, setFeaturedCommunities] = useState<FeaturedCommunity[]>(DEFAULT_FEATURED)
  const [featLoading, setFeatLoading] = useState(false)
  const [featError, setFeatError] = useState<string | null>(null)
  
  // 优化：懒加载精选社群数据
  const loadFeaturedCommunities = async () => {
    // 检查缓存
    try {
      const cached = localStorage.getItem(FEATURED_CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < FEATURED_CACHE_TIMEOUT) {
          setFeaturedCommunities(data)
          
          // 性能监控：标记社群加载完成（缓存命中）
          performanceMonitorRef.current?.markCommunityLoad()
          return
        }
      }
    } catch {}
    
    setFeatLoading(true)
    setFeatError(null)
    
    try {
      const resp = await apiClient.get<{ ok: boolean; data: any[] }>('/api/community/featured')
      if (resp.ok && Array.isArray(resp.data?.data)) {
        const arr = resp.data!.data
        const items = arr.map((x: any) => ({
          name: String(x.name || ''),
          members: Number(x.members) || 0,
          path: String(x.path || '/community'),
          official: Boolean(x.official),
          topic: x.topic ? String(x.topic) : undefined,
          tags: Array.isArray(x.tags) ? x.tags.map((t: any) => String(t)) : undefined,
        }))
        
        // 缓存结果
        localStorage.setItem(FEATURED_CACHE_KEY, JSON.stringify({
          data: items,
          timestamp: Date.now()
        }))
        
        setFeaturedCommunities(items)
        
        // 性能监控：标记社群加载完成
        performanceMonitorRef.current?.markCommunityLoad()
      } else {
        setFeaturedCommunities(DEFAULT_FEATURED)
        setFeatError(resp.error || '加载失败')
      }
    } catch (e) {
      setFeaturedCommunities(DEFAULT_FEATURED)
      setFeatError((e as Error)?.message || '网络错误')
    } finally {
      setFeatLoading(false)
    }
  }
  // 中文注释：社区模式与筛选（风格/题材）
  const [communityMode, setCommunityMode] = useState<'all' | 'style' | 'topic'>('all')
  const [selectedStyle, setSelectedStyle] = useState<string>('全部')
  const [selectedTopic, setSelectedTopic] = useState<string>('全部')
  const [title, setTitle] = useState('') // 新帖子标题（中文注释：用于创建新帖子）
  const [thumb, setThumb] = useState('') // 新帖子缩略图URL（中文注释：用于展示封面）
  const [sortBy, setSortBy] = useState<'hot' | 'new'>('hot') // 排序方式（中文注释：hot按点赞、new按日期）
  const [search, setSearch] = useState('') // 搜索关键词（中文注释：支持标题/评论/风格/题材）
  const [showSuggest, setShowSuggest] = useState(false) // 中文注释：是否显示搜索联想下拉
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1) // 中文注释：分页页码
  const pageSize = 18 // 中文注释：每页展示数量（适配3列×6行）
  const [active, setActive] = useState<Post | null>(null) // 中文注释：详情弹窗当前帖子
  const [favorites, setFavorites] = useState<string[]>(() => {
    // 中文注释：本地收藏列表（按帖子id存储）
    try { const raw = localStorage.getItem('jmzf_favs'); return raw ? JSON.parse(raw) : [] } catch { return [] }
  })
  const [favOnly, setFavOnly] = useState(false) // 中文注释：是否仅展示收藏作品
  const [importedExplore, setImportedExplore] = useState(true) // 中文注释：是否导入探索页作品（默认启用）
  const [isLoading, setIsLoading] = useState(true) // 中文注释：初始加载状态
  const sentinelRef = useRef<HTMLDivElement | null>(null) // 中文注释：无限滚动观察器锚点
  const thumbFileRef = useRef<HTMLInputElement | null>(null) // 中文注释：封面本地上传文件引用
  
  // 中文注释：本地缓存机制，减少重复计算
  const cachedDataRef = useRef<Map<string, Post[]>>(new Map())
  
  useEffect(() => {
    // 优化初始数据加载：使用requestAnimationFrame避免阻塞主线程
    requestAnimationFrame(() => {
      setIsLoading(true)
      // 获取缓存数据
      const cacheKey = 'initial-posts'
      const cached = cachedDataRef.current.get(cacheKey)
      
      if (cached) {
        setPosts(cached)
        setIsLoading(false)
        return
      }
      
      // 优化初始数据加载：只加载必要的数据
      const current = postsApi.getPosts()
      // 只加载前3个种子数据，其余数据按需加载
      const initialSeed = SEED.slice(0, 3)
      const merged = [...current, ...initialSeed]
      
      // 缓存数据
      cachedDataRef.current.set(cacheKey, merged)
      setPosts(merged)
      setIsLoading(false)
    })
  }, [])
  useEffect(() => {
    // 中文注释：支持通过路由参数直接打开详情
    const id = params.id
    if (id) {
      const list: Post[] = [...posts]
      SEED.forEach(s => { if (!list.find(p => p.id === s.id)) list.push(s) })
      const found = list.find(p => p.id === id)
      if (found) setActive(found)
    }
  }, [params.id, posts])
  // 中文注释：风格与题材词库（简单关键词匹配，用于社区分类）
  const STYLE_LIST = ['全部', '国潮', '极简', '复古', '赛博朋克', '手绘插画', '黑白线稿', '蓝白瓷']
  const TOPIC_LIST = ['全部', '老字号', '非遗', '京剧', '景德镇', '校园社团']
  const pickStyle = (title: string) => {
    const t = title.toLowerCase()
    if (/[国潮]/.test(title)) return '国潮'
    if (t.includes('cyberpunk') || /赛博/.test(title)) return '赛博朋克'
    if (/复古|vintage/i.test(title)) return '复古'
    if (/手绘|插画/.test(title)) return '手绘插画'
    if (/线稿|黑白/.test(title)) return '黑白线稿'
    if (/景德镇|青花瓷|蓝白/.test(title)) return '蓝白瓷'
    if (/极简|minimal/i.test(title)) return '极简'
    return '国潮'
  }
  const pickTopic = (title: string) => {
    if (/同仁堂|老字号/.test(title)) return '老字号'
    if (/非遗|技艺/.test(title)) return '非遗'
    if (/京剧|戏/.test(title)) return '京剧'
    if (/景德镇|瓷/.test(title)) return '景德镇'
    if (/高校|社团|校园/.test(title)) return '校园社团'
    return '老字号'
  }

  // 优化数据合并策略：只在必要时合并数据
  const baseData = useMemo(() => {
    const list = [...posts]
    // 合并所有种子数据，增加初始作品数量
    SEED.forEach(s => { if (!list.find(p => p.id === s.id)) list.push(s) })
    // 合并延迟加载的额外种子数据
    EXTRA_SEED.forEach(s => { if (!list.find(p => p.id === s.id)) list.push(s) })
    return list
  }, [posts])
  
  // 按需合并探索页数据
  const merged = useMemo(() => {
    // 初始数据只包含基本数据，探索页数据按需加载
    let list = [...baseData]
    
    // 只在需要时添加探索页数据，并且限制数量
    if (importedExplore) {
      // 根据页码动态加载探索页数据，每页最多添加20条（增加初始显示数量）
      const limit = page * 20
      const exploreData = EXPANDED_EXPLORE_SEEDS.slice(0, limit)
      exploreData.forEach(s => { if (!list.find(p => p.id === s.id)) list.push(s) })
    }
    
    // 优化过滤逻辑：减少计算量
    const query = search.trim().toLowerCase()
    let filtered = list
    
    if (query) {
      const advStyle = /^\s*(style|风格)\s*:\s*(.+)\s*$/.exec(query)
      const advTopic = /^\s*(topic|题材)\s*:\s*(.+)\s*$/.exec(query)
      
      filtered = list.filter(p => {
        if (advStyle) return pickStyle(p.title).toLowerCase() === advStyle[2].toLowerCase()
        if (advTopic) return pickTopic(p.title).toLowerCase() === advTopic[2].toLowerCase()
        
        // 只检查标题，减少计算量
        const inTitle = p.title.toLowerCase().includes(query)
        return inTitle
      })
    }
    
    // 优化社区过滤
    const communityFiltered = filtered.filter(p => {
      if (communityMode === 'style' && selectedStyle !== '全部') return pickStyle(p.title) === selectedStyle
      if (communityMode === 'topic' && selectedTopic !== '全部') return pickTopic(p.title) === selectedTopic
      return true
    })
    
    // 优化收藏过滤
    const favFiltered = favOnly ? communityFiltered.filter(p => favorites.includes(p.id)) : communityFiltered
    
    // 优化排序
    const sorted = [...favFiltered].sort((a, b) => {
      if (sortBy === 'hot') return (b.likes || 0) - (a.likes || 0)
      return (new Date(b.date).getTime()) - (new Date(a.date).getTime())
    })
    
    return sorted
  }, [baseData, sortBy, search, communityMode, selectedStyle, selectedTopic, favOnly, favorites, importedExplore, page])
  const viewList = useMemo(() => merged.slice(0, page * pageSize), [merged, page])
  const like = (id: string) => {
    postsApi.likePost(id)
    const current = postsApi.getPosts()
    const seedMerged = SEED.map(s => s.id === id ? { ...s, likes: s.likes + 1 } : s)
    setPosts([...current, ...seedMerged])
  }
  const addComment = (id: string) => {
    const txt = commentText[id]
    if (!txt) return
    postsApi.addComment(id, txt)
    setCommentText(prev => ({ ...prev, [id]: '' }))
    const current = postsApi.getPosts()
    setPosts([...current, ...SEED])
  }
  const share = () => {
    const url = location.origin + '/square'
    navigator.clipboard?.writeText(url)
    alert('链接已复制，可去小红书/抖音分享')
  }
  const sharePost = (id: string) => {
    const url = location.origin + `/square/${id}`
    navigator.clipboard?.writeText(url)
    alert('作品链接已复制')
  }
  const toggleFavorite = (id: string) => {
    // 中文注释：收藏/取消收藏
    setFavorites(prev => {
      const has = prev.includes(id)
      const next = has ? prev.filter(x => x !== id) : [...prev, id]
      try { localStorage.setItem('jmzf_favs', JSON.stringify(next)) } catch {}
      return next
    })
  }
  const importExploreWorks = () => {
    // 中文注释：导入探索页策展作品到广场视图
    setImportedExplore(true)
    alert(`已导入 ${EXPLORE_SEEDS.length} 条策展作品`)
  }
  useEffect(() => {
    // 中文注释：优化无限滚动—防抖加载和性能优化
    const el = sentinelRef.current
    if (!el) return
    
    let loading = false
    const ob = new IntersectionObserver((entries) => {
      const e = entries[0]
      if (e && e.isIntersecting && !loading && viewList.length < merged.length) {
        loading = true
        // 使用 requestAnimationFrame 避免阻塞主线程
        requestAnimationFrame(() => {
          // 如果是第一次加载更多，添加延迟加载的种子数据
          if (viewList.length <= 8 && page === 1) {
            // 延迟加载额外的种子数据
            setTimeout(() => {
              const delayedSeed = EXTRA_SEED.slice(0, 4)
              setPosts(prev => [...prev, ...delayedSeed])
              setPage(prev => prev + 1)
              loading = false
            }, 300)
          } else {
            setPage(prev => prev + 1)
            // 设置延迟重置 loading 状态
            setTimeout(() => {
              loading = false
            }, 500)
          }
        })
      }
    }, { 
      root: null, 
      rootMargin: '300px', // 增加预加载距离
      threshold: 0.1 
    })
    ob.observe(el)
    return () => ob.disconnect()
  }, [sentinelRef, merged, viewList.length, page])
  // 中文注释：统计热门风格/题材（取前6个）
  // 优化：只统计当前显示的内容，减少计算量
  const topStyles = useMemo(() => {
    const map: Record<string, number> = {}
    viewList.forEach(p => { const s = pickStyle(p.title); map[s] = (map[s] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [viewList])
  const topTopics = useMemo(() => {
    const map: Record<string, number> = {}
    viewList.forEach(p => { const s = pickTopic(p.title); map[s] = (map[s] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [viewList])
  const suggestions = useMemo(() => {
    // 中文注释：根据输入生成联想（风格/题材优先）
    const q = search.trim().toLowerCase()
    if (!q) return [] as string[]
    const styleSug = topStyles.map(([name]) => `风格:${String(name)}`).filter(s => s.toLowerCase().includes(q))
    const topicSug = topTopics.map(([name]) => `题材:${String(name)}`).filter(s => s.toLowerCase().includes(q))
    return [...styleSug, ...topicSug].slice(0, 8)
  }, [search, topStyles, topTopics])

  // 中文注释：广场页内的"共创社群"模块（可展开/收起）与快捷跳转
  const [communityOpen, setCommunityOpen] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false) // 懒加载状态
  
  // 优化：懒加载数据，只在展开时加载
  useEffect(() => {
    if (communityOpen && !dataLoaded) {
      loadTags()
      loadFeaturedCommunities()
      setDataLoaded(true)
    }
  }, [communityOpen, dataLoaded])
  
  // 优化：虚拟滚动状态管理
  const [visibleTags, setVisibleTags] = useState<string[]>([])
  const [visibleStartIndex, setVisibleStartIndex] = useState(0)
  const [visibleEndIndex, setVisibleEndIndex] = useState(5) // 初始显示5个标签
  const tagContainerRef = useRef<HTMLDivElement>(null)
  
  // 优化：计算可见标签
  useEffect(() => {
    if (tags.length > 0) {
      setVisibleTags(tags.slice(visibleStartIndex, visibleEndIndex))
    }
  }, [tags, visibleStartIndex, visibleEndIndex])
  
  // 优化：滚动时动态加载更多标签
  const handleTagScroll = useCallback(() => {
    if (!tagContainerRef.current) return
    
    const container = tagContainerRef.current
    const scrollLeft = container.scrollLeft
    const scrollWidth = container.scrollWidth
    const clientWidth = container.clientWidth
    
    // 当滚动到右侧80%时，加载更多标签
    if (scrollLeft + clientWidth > scrollWidth * 0.8) {
      const newEndIndex = Math.min(visibleEndIndex + 3, tags.length)
      if (newEndIndex > visibleEndIndex) {
        setVisibleEndIndex(newEndIndex)
      }
    }
  }, [tags.length, visibleEndIndex])
  
  const gotoCommunity = (path?: string) => {
    // 中文注释：健壮的社群跳转——兼容绝对路径与查询参数，避免出现 /community/community 双重前缀
    const p = (path || '').trim()
    let target = '/community'
    if (p) {
      if (p.startsWith('/')) {
        // 中文注释：传入绝对路径（含 /community 前缀），直接跳转
        target = p
      } else if (p.startsWith('?')) {
        // 中文注释：仅传入查询参数，拼接到 /community
        target = `/community${p}`
      } else {
        // 中文注释：传入相对子路径，规范化为 /community/子路径
        target = `/community/${p}`
      }
    }
    navigate(target)
  }
  const createPost = () => {
    // 中文注释：创建新帖子，基本校验
    const t = title.trim()
    const u = thumb.trim()
    if (!t) { alert('请输入标题'); return }
    const cover = u || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(t)}&image_size=1024x1024`
    postsApi.addPost({
      title: t,
      thumbnail: cover,
      category: 'design',
      tags: [],
      description: '',
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: []
    })
    setTitle('')
    setThumb('')
    const current = postsApi.getPosts()
    setPosts([...current, ...SEED])
  }
  const generateThumbFromTitle = () => {
    // 中文注释：根据标题自动生成封面URL
    const t = title.trim() || '创意封面'
    const cover = `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(t)}&image_size=1024x1024`
    setThumb(cover)
  }
  const onThumbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 中文注释：从本地上传图片作为封面，转换为DataURL
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result || '')
      if (url) setThumb(url)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }
  // 中文注释：空缩略图兜底（避免img出现src=""）
  const getFallbackThumb = (p: Post) => `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(p.title)}&image_size=1024x1024`
  return (

      <main className="container mx-auto px-4 py-10">
        {/* 中文注释：统一使用通用渐变英雄组件 */}
        <GradientHero
          title="共创广场"
          subtitle={`热榜每周更新 · 当前作品 ${merged.length} 条 · 收藏 ${favorites.length} 条`}
          badgeText="Beta"
          theme="blue"
          size="md"
          showDecor={false}
          stats={[
            { label: '模式', value: communityMode === 'all' ? '全部' : communityMode === 'style' ? '风格' : '题材' },
            { label: '筛选', value: favOnly ? '收藏' : '全部' },
            { label: '排序', value: sortBy === 'hot' ? '热度' : '最新' },
            { label: '联动', value: importedExplore ? '已导入' : '未导入' },
          ]}
        />
        <div className="mb-6">
          <div className={`px-4 py-2 flex items-center justify-between rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <i className={`fas fa-user-friends ${isDark ? 'text-gray-300' : 'text-gray-600'}`}></i>
              <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm font-medium`}>共创社群</span>
            </div>
            <button
              className={`p-2 rounded-lg ring-1 transition duration-200 ${isDark ? 'ring-gray-700/70 hover:bg-gray-700/60' : 'ring-gray-200/70 hover:bg-white/70'}`}
              onClick={() => setCommunityOpen(v => { const next = !v; try { localStorage.setItem('jmzf_community_open', JSON.stringify(next)) } catch {} return next })}
              aria-expanded={communityOpen}
              aria-label="展开/收起社群模块"
            >
              <i className={`fas ${communityOpen ? 'fa-chevron-up' : 'fa-chevron-down'} ${isDark ? 'text-gray-300' : 'text-gray-600'}`}></i>
            </button>
          </div>
          {communityOpen && (
            // 中文注释：社群模块内容卡片 —— 提升信息层级与可点击性；支持整体点击跳转
            <motion.div 
              initial={{ opacity: 0, y: 6 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`${isDark ? 'bg-gray-800/60 ring-1 ring-gray-700' : 'bg-white/60 ring-1 ring-gray-200'} px-4 pb-3 rounded-xl cursor-pointer`} 
              style={{ willChange: 'transform, opacity' }}
              role="button"
              tabIndex={0}
              aria-label="打开社群首页"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); gotoCommunity('?context=cocreation&tab=joined') } }}
              onClick={(e) => {
                const target = e.target as HTMLElement
                // 中文注释：如果点击的是内部交互元素（button/a/input/textarea），则不触发整体跳转
                if (target.closest('button, a, input, textarea')) return
                gotoCommunity('?context=cocreation&tab=joined')
              }}
            > 
              {/* 中文注释：分组标题 —— 强化信息结构，便于快速扫读 */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs opacity-70 flex items-center gap-1">
                  <i className={`fas fa-fire ${isDark ? 'text-orange-400' : 'text-orange-500'}`}></i>
                  <span>热门话题</span>
                </div>
                <button
                  onClick={() => gotoCommunity('')}
                  className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  aria-label="查看全部社群"
                >查看全部</button>
              </div>
              {/* 优化：虚拟滚动标签容器 */}
              <div 
                ref={tagContainerRef}
                className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide"
                onScroll={handleTagScroll}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {tagsLoading && (
                  <div className="flex gap-2 w-full">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`animate-pulse h-7 px-8 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    ))}
                  </div>
                )}
                {!tagsLoading && visibleTags.map((tag, index) => (
                  <motion.button
                    key={tag}
                    onClick={() => { incTagClick(tag); gotoCommunity(`?tag=${encodeURIComponent(tag)}`) }}
                    aria-label={`按话题 ${tag} 筛选社群`}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); incTagClick(tag); gotoCommunity(`?tag=${encodeURIComponent(tag)}`) } }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={`text-xs px-2.5 py-1.5 min-h-[28px] rounded-full transition-all duration-150 ease-out focus:outline-none focus:ring-2 flex-shrink-0 ${
                      isDark 
                        ? 'bg-gray-700 text-gray-200 ring-1 ring-gray-600 hover:bg-gray-600 focus:ring-blue-400' 
                        : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-200 focus:ring-blue-500'
                    }`}
                    style={{ willChange: 'transform' }}
                    title={tagMeta[tag]?.desc || tagMeta[tag]?.group || ''}
                  >
                    <i className="fas fa-hashtag mr-1"></i>
                    {tag}
                    <span className={`ml-1 inline-flex items-center px-1.5 py-[1px] rounded-full text-[10px] ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`} title="点击热度">3</span>
                    {hotTagSet.has(tag) && (
                      <i className={`fas fa-fire ml-1 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} title="热度较高"></i>
                    )}
                  </motion.button>
                ))}
                {!tagsLoading && tags.length > visibleEndIndex && (
                  <div className="flex items-center text-xs opacity-50 flex-shrink-0">
                    +{tags.length - visibleEndIndex} 更多
                  </div>
                )}
                {!tagsLoading && tagsError && (
                  <div className={`text-[11px] mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>标签加载失败，已使用默认列表</div>
                )}
              </div>
              <style>{`
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {/* 中文注释：精选社群 —— 提供更清晰的条目样式与分隔线 */}
              <div className="text-xs opacity-70 mb-1">精选社群</div>
              <div className="sr-only">精选社群列表</div>
              <ul className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'} rounded-lg ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} overflow-hidden`} role="list">
                {featLoading && (
                  <li>
                    <div className={`px-3 py-2 ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}>
                      <div className={`h-3 w-32 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    </div>
                  </li>
                )}
                {!featLoading && featuredCommunities.map((g) => (
                  <li key={g.name} role="listitem">
                    <motion.button
                      onClick={() => gotoCommunity(g.path)}
                      aria-label={`打开社群 ${g.name}`}
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-all duration-150 ease-out focus:outline-none focus:ring-2 ${isDark ? 'hover:bg-gray-700 focus:ring-blue-400' : 'hover:bg-gray-50 focus:ring-blue-500'}`}
                      style={{ willChange: 'transform' }}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); gotoCommunity(g.path) } }}
                    >
                      <span className="text-xs font-medium flex items-center gap-2">
                        <i className={`fas fa-users ${isDark ? 'text-gray-300' : 'text-gray-500'} text-[11px]`}></i>
                        {g.name}
                        {g.official && (
                          <span className={`px-1.5 py-[1px] rounded text-[10px] font-medium shadow-sm ${isDark ? 'bg-blue-600 text-white ring-1 ring-blue-500' : 'bg-blue-500 text-white ring-1 ring-blue-400'}`}>官方</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{g.members} 人</span>
                        <i className={`fas fa-chevron-right ${isDark ? 'text-gray-400' : 'text-gray-400'} text-[10px]`}></i>
                      </span>
                    </motion.button>
                  </li>
                ))}
                {!featLoading && featError && (
                  <li>
                    <div className={`px-3 py-2 text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>社群加载失败，已使用默认列表</div>
                  </li>
                )}
              </ul>
              {!featLoading && featError && (
                <div className={`text-[11px] mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>精选社群加载失败，已使用默认列表</div>
              )}
              {/* 中文注释：主行动按钮 —— 强化主次层级，提升转化 */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => gotoCommunity('?context=cocreation&tab=joined')}
                  aria-label="进入社群列表"
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg font-medium shadow-md transition-all duration-200 ${isDark ? 'bg-blue-500 text-white hover:bg-blue-400 active:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700'}`}
                >
                  进入社群
                  <i className="fas fa-arrow-right ml-1 text-[10px]"></i>
                </button>
                <button
                  onClick={() => gotoCommunity('?context=cocreation&tab=user')}
                  aria-label="创建社群"
                  className={`px-3 py-1.5 text-xs rounded-lg ${isDark ? 'bg-purple-700 text-white hover:bg-purple-600' : 'bg-purple-600 text-white hover:bg-purple-500'}`}
                >
                  创建社群
                  <i className="fas fa-plus ml-1 text-[10px]"></i>
                </button>
              </div>
              {/* 中文注释：补充承诺与证明（Promise/Prove）微文案，提升转化信心 */}
              <div className={`mt-2 text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                加入后可参与共创招募、线上活动与资源共享（每周精选推荐）。
              </div>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setFavOnly(v => !v)} className={`${favOnly ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-500' : (isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600' : 'bg-gray-100 text-gray-900 ring-1 ring-gray-200')} px-3 py-1 rounded-full text-sm font-medium transition-all duration-200`}>{favOnly ? '仅看收藏' : '全部作品'}</button>
          <button onClick={importExploreWorks} disabled={importedExplore} className={`${importedExplore ? 'bg-gray-400 text-white' : 'bg-green-600 text-white'} px-3 py-1 rounded-full text-sm`}>{importedExplore ? '已导入策展' : '导入策展作品'}</button>
        </div>
        {/* 中文注释：社区筛选区（风格/题材），与探索区的作品流区分开来 */}
        <div className={`mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-4`}>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-sm opacity-70">社区类型：</span>
            <button onClick={() => setCommunityMode('all')} className={`${communityMode==='all' ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-3 py-1 rounded-full text-sm`}>全部</button>
            <button onClick={() => setCommunityMode('style')} className={`${communityMode==='style' ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-3 py-1 rounded-full text-sm`}>风格社区</button>
            <button onClick={() => setCommunityMode('topic')} className={`${communityMode==='topic' ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-3 py-1 rounded-full text-sm`}>题材社区</button>
            <span className="ml-auto text-xs opacity-70">热门风格/题材 · 点击查看</span>
            <a href="/community" className="text-xs px-3 py-1 rounded-full bg-blue-600 text-white font-medium shadow-sm ring-1 ring-blue-500 hover:bg-blue-500 transition-all duration-200">进入创作者社区（新版）</a>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {topStyles.map(([name, count]) => (
              <button key={name} onClick={() => { setCommunityMode('style'); setSelectedStyle(String(name)) }} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-3 py-1 rounded-full text-sm`}>{name}（{count}）</button>
            ))}
            {topTopics.map(([name, count]) => (
              <button key={name} onClick={() => { setCommunityMode('topic'); setSelectedTopic(String(name)) }} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-3 py-1 rounded-full text-sm`}>{name}（{count}）</button>
            ))}
          </div>
          {communityMode === 'style' && (
            <div className="flex flex-wrap gap-2">
              {STYLE_LIST.map(s => (
                <button key={s} onClick={() => setSelectedStyle(s)} className={`${selectedStyle===s ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-3 py-1 rounded-full text-sm`}>{s}</button>
              ))}
            </div>
          )}
          {communityMode === 'topic' && (
            <div className="flex flex-wrap gap-2">
              {TOPIC_LIST.map(s => (
                <button key={s} onClick={() => setSelectedTopic(s)} className={`${selectedTopic===s ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-3 py-1 rounded-full text-sm`}>{s}</button>
              ))}
            </div>
          )}
        </div>
        {/* 中文注释：发布区域与工具栏 */}
        <div className={`mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-4`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') createPost() }} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} px-3 py-2 rounded-lg border`} placeholder="输入作品标题（如：麻花赛博朋克）" />
            <div className="relative">
              <input value={thumb} onChange={e => setThumb(e.target.value)} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} w-full px-3 py-2 rounded-lg border pr-28`} placeholder="封面图片URL（可留空自动生成）" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                <button onClick={generateThumbFromTitle} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-2 py-1 rounded text-xs`}>生成</button>
                <button onClick={() => thumbFileRef.current?.click()} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-2 py-1 rounded text-xs`}>上传</button>
                <button onClick={() => setThumb('')} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-2 py-1 rounded text-xs`}>清空</button>
              </div>
              <input ref={thumbFileRef} type="file" accept="image/*" className="hidden" onChange={onThumbFileChange} />
            </div>
            <button onClick={createPost} className="bg-red-600 text-white px-3 py-2 rounded-lg">发布到广场</button>
          </div>
          {thumb.trim() && (
            <div className="mt-3 flex items-center gap-3">
              <div className="text-xs opacity-70">封面预览：</div>
              <TianjinImage src={thumb} alt="封面预览" ratio="square" rounded="md" className="w-16 h-16" />
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Suspense fallback={
                <input 
                  className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} w-full px-3 py-2 rounded-lg border`} 
                  placeholder="加载搜索组件..." 
                  disabled
                />
              }>
                <SearchBar 
                  search={search}
                  setSearch={setSearch}
                  showSuggest={showSuggest}
                  setShowSuggest={setShowSuggest}
                  suggestions={suggestions}
                  isDark={isDark}
                />
              </Suspense>
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} px-3 py-2 rounded-lg border`}>
              <option value="hot">按点赞热度</option>
              <option value="new">按最新时间</option>
            </select>
            <button onClick={share} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-3 py-2 rounded-lg`}>复制广场链接</button>
          </div>
        </div>
        {/* 中文注释：广场卡片列表固定为三列布局 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-sm p-4 animate-pulse">
                <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : (
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-sm p-4 animate-pulse">
                  <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              ))}
            </div>
          }>
            <PostGrid 
              posts={viewList}
              onPostClick={setActive}
              onLike={like}
              onComment={addComment}
              isDark={isDark}
            />
          </Suspense>
        )}
        <div ref={sentinelRef} className="w-full h-8" />
        {viewList.length < merged.length && (
          <div className="flex justify-center mt-6">
            <button onClick={() => setPage(prev => prev + 1)} className="px-4 py-2 rounded-lg bg-gray-200">加载更多</button>
          </div>
        )}
        {active && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} w-full max-w-2xl rounded-2xl shadow-lg p-6`}>
              <div className="flex justify-between items-center mb-4">
                <div className="font-bold text-lg">{active.title}</div>
                <button onClick={() => { setActive(null); navigate('/square') }} className="px-3 py-1 rounded bg-gray-200">关闭</button>
              </div>
              <LazyImage 
                src={active.thumbnail} 
                alt={active.title} 
                className="w-full h-64 object-cover rounded-lg mb-4" 
              />
              <div className="flex items-center gap-4 text-sm mb-2">
                <span><i className="far fa-thumbs-up mr-1"></i>{active.likes}</span>
                <span>{new Date(active.date).toLocaleString()}</span>
              </div>
              <div className="text-sm opacity-80">全部评论（{active.comments.length}）</div>
              <div className="mt-2 max-h-48 overflow-y-auto">
                {active.comments.length === 0 ? (
                  <div className="text-sm opacity-60">暂无评论</div>
                ) : (
                  active.comments.map(c => (
                    <div key={c.id} className={`${isDark ? 'border-gray-700' : 'border-gray-200'} border-t py-2 text-sm`}>
                      <span className="opacity-60 mr-2">{new Date(c.date).toLocaleString()}</span>
                      <span>{c.content}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* 性能监控面板 */}
        <div className="fixed bottom-4 right-4 z-50">
          {/* 性能监控开关按钮 */}
          <button
            onClick={() => setShowPerformancePanel(!showPerformancePanel)}
            className={`p-2 rounded-full shadow-lg transition-all duration-200 ${
              isDark 
                ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
                : 'bg-white text-gray-800 hover:bg-gray-100'
            } ${showPerformancePanel ? 'ring-2 ring-blue-500' : ''}`}
            aria-label={showPerformancePanel ? '隐藏性能监控' : '显示性能监控'}
            title="性能监控面板"
          >
            <i className={`fas ${showPerformancePanel ? 'fa-chart-line' : 'fa-chart-bar'} text-sm`}></i>
          </button>
          
          {/* 性能监控面板内容 */}
          {showPerformancePanel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`mt-2 w-80 rounded-lg shadow-xl overflow-hidden ${
                isDark ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-900'
              }`}
              style={{ willChange: 'transform, opacity' }}
            >
              {/* 面板标题 */}
              <div className={`px-4 py-3 flex items-center justify-between ${
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <div className="flex items-center gap-2">
                  <i className="fas fa-chart-line text-blue-500"></i>
                  <span className="font-medium text-sm">性能监控</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => performanceMonitorRef.current?.logMetrics('Square组件')}
                    className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                    title="输出性能报告到控制台"
                  >
                    报告
                  </button>
                  <button
                    onClick={() => setShowPerformancePanel(false)}
                    className="text-xs px-2 py-1 rounded bg-gray-600 text-white hover:bg-gray-700"
                    title="关闭面板"
                  >
                    关闭
                  </button>
                </div>
              </div>
              
              {/* 性能指标内容 */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {performanceMetrics ? (
                  <div className="space-y-3 text-sm">
                    {/* 加载时间指标 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`p-2 rounded ${
                        isDark ? 'bg-gray-800' : 'bg-gray-50'
                      }`}>
                        <div className="text-xs opacity-70 mb-1">组件挂载</div>
                        <div className="font-mono text-sm">
                          {performanceMetrics.componentMountTime.toFixed(1)}ms
                        </div>
                      </div>
                      <div className={`p-2 rounded ${
                        isDark ? 'bg-gray-800' : 'bg-gray-50'
                      }`}>
                        <div className="text-xs opacity-70 mb-1">图片加载</div>
                        <div className="font-mono text-sm">
                          {performanceMetrics.imageLoadTime.toFixed(1)}ms
                        </div>
                      </div>
                      <div className={`p-2 rounded ${
                        isDark ? 'bg-gray-800' : 'bg-gray-50'
                      }`}>
                        <div className="text-xs opacity-70 mb-1">标签加载</div>
                        <div className="font-mono text-sm">
                          {performanceMetrics.tagLoadTime.toFixed(1)}ms
                        </div>
                      </div>
                      <div className={`p-2 rounded ${
                        isDark ? 'bg-gray-800' : 'bg-gray-50'
                      }`}>
                        <div className="text-xs opacity-70 mb-1">社群加载</div>
                        <div className="font-mono text-sm">
                          {performanceMetrics.communityLoadTime.toFixed(1)}ms
                        </div>
                      </div>
                    </div>
                    
                    {/* 渲染性能指标 */}
                    <div className={`p-3 rounded ${
                      isDark ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <div className="text-xs opacity-70 mb-2">渲染性能</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="text-xs opacity-70">渲染次数</div>
                          <div className="font-mono text-sm">{performanceMetrics.renderCount}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-70">平均时间</div>
                          <div className="font-mono text-sm">{performanceMetrics.averageRenderTime.toFixed(1)}ms</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-70">帧率</div>
                          <div className={`font-mono text-sm ${
                            performanceMetrics.fps >= 55 ? 'text-green-500' : 
                            performanceMetrics.fps >= 30 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {performanceMetrics.fps}FPS
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 内存使用指标 */}
                    <div className={`p-3 rounded ${
                      isDark ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <div className="text-xs opacity-70 mb-2">内存使用</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-600 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              performanceMetrics.memoryUsage < 50 ? 'bg-green-500' : 
                              performanceMetrics.memoryUsage < 100 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(performanceMetrics.memoryUsage / 2, 100)}%` }}
                          ></div>
                        </div>
                        <div className="font-mono text-sm">
                          {performanceMetrics.memoryUsage.toFixed(1)}MB
                        </div>
                      </div>
                    </div>
                    
                    {/* 性能状态指示器 */}
                    <div className={`p-3 rounded ${
                      isDark ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <div className="text-xs opacity-70 mb-2">性能状态</div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          performanceMetrics.fps >= 55 && performanceMetrics.memoryUsage < 50 ? 'bg-green-500' : 
                          performanceMetrics.fps >= 30 && performanceMetrics.memoryUsage < 100 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-xs">
                          {performanceMetrics.fps >= 55 && performanceMetrics.memoryUsage < 50 ? '优秀' : 
                           performanceMetrics.fps >= 30 && performanceMetrics.memoryUsage < 100 ? '良好' : '需要优化'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm opacity-70">
                    <i className="fas fa-spinner fa-spin text-lg mb-2"></i>
                    <div>正在收集性能数据...</div>
                  </div>
                )}
              </div>
              
              {/* 面板底部信息 */}
              <div className={`px-4 py-2 text-xs opacity-70 border-t ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'
              }`}>
                <div className="flex justify-between">
                  <span>实时监控</span>
                  <span>每秒更新</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
  )
}
