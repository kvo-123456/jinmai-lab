import { useTheme } from '@/hooks/useTheme'
import { motion } from 'framer-motion'
import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import postsApi, { Post } from '@/services/postService'
import SidebarLayout from '@/components/SidebarLayout'
import GradientHero from '@/components/GradientHero'
import { mockWorks } from '@/pages/Explore'
import apiClient from '@/lib/apiClient'

// 中文注释：广场初始示例作品（可作为冷启动内容）
const SEED: Post[] = [
  { id: 'seed-1', title: '国潮插画设计', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20cultural%20illustration%20design&image_size=square', likes: 324, comments: [], date: '2025-11-01', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-2', title: '麻花赛博朋克', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Tianjin%20mahua%20cyberpunk&image_size=square', likes: 512, comments: [], date: '2025-11-02', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-3', title: '杨柳青年画海报', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Yangliuqing%20New%20Year%20poster%2C%20vibrant%20colors&image_size=square', likes: 338, comments: [], date: '2025-11-03', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-4', title: '桂发祥联名插画海报', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Guifaxiang%20collab%20illustration%20poster%2C%20oriental%20style&image_size=square', likes: 256, comments: [], date: '2025-11-03', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-5', title: '同仁堂品牌视觉年鉴', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Tongrentang%20brand%20yearbook%2C%20red%20and%20gold&image_size=square', likes: 264, comments: [], date: '2025-11-04', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-6', title: '京剧舞台视觉系统', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Peking%20opera%20stage%20visual%20system&image_size=square', likes: 231, comments: [], date: '2025-11-04', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-7', title: '景德镇文创器皿插画', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Jingdezhen%20cultural%20ware%20illustration%2C%20blue%20and%20white&image_size=square', likes: 242, comments: [], date: '2025-11-05', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-8', title: '海河导视与标识', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Haihe%20wayfinding%20and%20signage%2C%20blue%20accent&image_size=square', likes: 244, comments: [], date: '2025-11-05', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-9', title: '东方美学字体集', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Oriental%20aesthetic%20typeface%20specimen&image_size=square', likes: 382, comments: [], date: '2025-11-06', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-10', title: '狗不理联名海报', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Goubuli%20brand%20collab%20poster%2C%20bold%20graphics&image_size=square', likes: 198, comments: [], date: '2025-11-06', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-11', title: '耳朵眼品牌IP形象', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Erduoyan%20brand%20mascot%20illustration%2C%20cute&image_size=square', likes: 312, comments: [], date: '2025-11-07', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
  { id: 'seed-12', title: '果仁张秋季礼盒', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Guorenzhang%20autumn%20gift%20box%20packaging&image_size=square', likes: 224, comments: [], date: '2025-11-07', category: 'design', tags: [], description: '', views: 0, shares: 0, isFeatured: false, isDraft: false, completionStatus: 'completed', creativeDirection: '', culturalElements: [], colorScheme: [], toolsUsed: [] },
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
// 中文注释：批量生成多期衍生作品（2~5期），标题带期数后缀，点赞数作轻微调整
const EXPANDED_EXPLORE_SEEDS: Post[] = [
  ...EXPLORE_SEEDS,
  ...[2, 3, 4, 5].flatMap((phase) => (
    mockWorks.map((w) => ({
      id: `ex${phase}-${w.id}`,
      title: `${w.title}·${phase}期`,
      thumbnail: `${w.thumbnail}${w.thumbnail.includes('?') ? '&' : '?'}phase=${phase}`,
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
      completionStatus: 'completed',
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: []
    })
  ))),
]

export default function Square() {
  const { isDark } = useTheme()
  const params = useParams()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  // 中文注释：热门话题标签（支持按点击热度排序）
  const DEFAULT_TAGS = ['国潮设计', '非遗传承', '品牌联名', '校园活动', '文旅推广']
  const TAG_KEY = 'jmzf_tag_clicks'
  const [tagClicks, setTagClicks] = useState<Record<string, number>>(() => {
    try { const raw = localStorage.getItem(TAG_KEY); return raw ? JSON.parse(raw) : {} } catch { return {} }
  })
  const [tags, setTags] = useState<string[]>(DEFAULT_TAGS)
  const [tagMeta, setTagMeta] = useState<Record<string, { weight?: number; group?: string; desc?: string }>>({})
  const [tagsLoading, setTagsLoading] = useState(false)
  const [tagsError, setTagsError] = useState<string | null>(null)
  const sortTagsByClicks = (list: string[], clicks: Record<string, number>) => {
    const orderMap = new Map<string, number>(list.map((t, i) => [t, i]))
    return [...list].sort((a,b) => {
      const wa = tagMeta[a]?.weight || 0
      const wb = tagMeta[b]?.weight || 0
      if (wb !== wa) return wb - wa
      const ca = clicks[a] || 0
      const cb = clicks[b] || 0
      if (cb !== ca) return cb - ca
      return (orderMap.get(a)! - orderMap.get(b)!)
    })
  }
  useEffect(() => {
    setTags(sortTagsByClicks(DEFAULT_TAGS, tagClicks))
  }, [])
  // 中文注释：从本地API加载话题标签（失败则回退默认）
  useEffect(() => {
    let mounted = true
    setTagsLoading(true)
    setTagsError(null)
    apiClient.get<{ ok: boolean; data: any[] }>('/api/community/tags')
      .then((resp) => {
        if (!mounted) return
        if (resp.ok && Array.isArray(resp.data?.data)) {
          const arr = resp.data!.data
          if (arr.length > 0 && typeof arr[0] === 'object') {
            const meta: Record<string, { weight?: number; group?: string; desc?: string }> = {}
            const labels: string[] = []
            arr.forEach((it: any) => {
              const label = String(it.label || '').trim()
              if (!label) return
              labels.push(label)
              meta[label] = { weight: Number(it.weight) || 0, group: it.group ? String(it.group) : undefined, desc: it.desc ? String(it.desc) : undefined }
            })
            setTagMeta(meta)
            setTags(sortTagsByClicks(labels, tagClicks))
          } else {
            const list = arr.map((x: any) => String(x))
            setTagMeta({})
            setTags(sortTagsByClicks(list, tagClicks))
          }
        } else {
          setTagMeta({})
          setTags(DEFAULT_TAGS)
          setTagsError(resp.error || '加载失败')
        }
      })
      .catch((e) => { if (!mounted) return; setTagMeta({}); setTags(DEFAULT_TAGS); setTagsError(e?.message || '网络错误') })
      .finally(() => { if (mounted) setTagsLoading(false) })
    return () => { mounted = false }
  }, [])
  const incTagClick = (tag: string) => {
    const next = { ...tagClicks, [tag]: (tagClicks[tag] || 0) + 1 }
    setTagClicks(next)
    try { localStorage.setItem(TAG_KEY, JSON.stringify(next)) } catch {}
    setTags(sortTagsByClicks(DEFAULT_TAGS, next))
  }
  const hotTagSet = useMemo(() => {
    // 中文注释：取点击次数前两名作为“热”标签（次数>0）
    const pairs = tags.map(t => ({ t, c: tagClicks[t] || 0 }))
    pairs.sort((a,b) => b.c - a.c)
    const top = pairs.filter(p => p.c > 0).slice(0,2).map(p => p.t)
    return new Set(top)
  }, [tags, tagClicks])
  // 中文注释：精选社群数据（从本地API加载；失败回退本地静态）
  type FeaturedCommunity = { name: string; members: number; path: string; official?: boolean; topic?: string; tags?: string[] }
  const DEFAULT_FEATURED: FeaturedCommunity[] = [
    { name: '国潮共创组', members: 128, path: '/community?group=guochao' },
    { name: '非遗研究社', members: 96, path: '/community?group=heritage' },
    { name: '品牌联名工坊', members: 73, path: '/community?group=brand' },
  ]
  const [featuredCommunities, setFeaturedCommunities] = useState<FeaturedCommunity[]>(DEFAULT_FEATURED)
  const [featLoading, setFeatLoading] = useState(false)
  const [featError, setFeatError] = useState<string | null>(null)
  useEffect(() => {
    let mounted = true
    setFeatLoading(true)
    setFeatError(null)
    apiClient.get<{ ok: boolean; data: any[] }>('/api/community/featured')
      .then((resp) => {
        if (!mounted) return
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
          setFeaturedCommunities(items)
        } else {
          setFeaturedCommunities(DEFAULT_FEATURED)
          setFeatError(resp.error || '加载失败')
        }
      })
      .catch((e) => { if (!mounted) return; setFeaturedCommunities(DEFAULT_FEATURED); setFeatError(e?.message || '网络错误') })
      .finally(() => { if (mounted) setFeatLoading(false) })
    return () => { mounted = false }
  }, [])
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
  const sentinelRef = useRef<HTMLDivElement | null>(null) // 中文注释：无限滚动观察器锚点
  const thumbFileRef = useRef<HTMLInputElement | null>(null) // 中文注释：封面本地上传文件引用
  useEffect(() => {
    const current = postsApi.getPosts()
    // 中文注释：初始化合并本地帖子与示例种子
    setPosts([...current, ...SEED])
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

  const merged = useMemo(() => {
    // 中文注释：合并本地帖子与种子帖子
    const list = [...posts]
    // 去重合并：如果本地存在同id则不重复添加
    SEED.forEach(s => { if (!list.find(p => p.id === s.id)) list.push(s) })
    // 中文注释：按需导入探索页策展作品
    if (importedExplore) {
      EXPANDED_EXPLORE_SEEDS.forEach(s => { if (!list.find(p => p.id === s.id)) list.push(s) })
    }
    // 过滤：按标题搜索
    const query = search.trim().toLowerCase()
    const advStyle = /^\s*(style|风格)\s*:\s*(.+)\s*$/.exec(query)
    const advTopic = /^\s*(topic|题材)\s*:\s*(.+)\s*$/.exec(query)
    const filtered = query
      ? list.filter(p => {
          if (advStyle) return pickStyle(p.title).toLowerCase() === advStyle[2].toLowerCase()
          if (advTopic) return pickTopic(p.title).toLowerCase() === advTopic[2].toLowerCase()
          const inTitle = p.title.toLowerCase().includes(query)
          const inComments = (p.comments || []).some(c => c.content.toLowerCase().includes(query))
          const inStyle = pickStyle(p.title).toLowerCase().includes(query)
          const inTopic = pickTopic(p.title).toLowerCase().includes(query)
          return inTitle || inComments || inStyle || inTopic
        })
      : list
    // 中文注释：根据社区模式与选项进行二次过滤
    const communityFiltered = filtered.filter(p => {
      if (communityMode === 'style' && selectedStyle !== '全部') return pickStyle(p.title) === selectedStyle
      if (communityMode === 'topic' && selectedTopic !== '全部') return pickTopic(p.title) === selectedTopic
      return true
    })
    // 中文注释：收藏筛选
    const favFiltered = favOnly ? communityFiltered.filter(p => favorites.includes(p.id)) : communityFiltered
    // 排序：hot按likes降序，new按date降序
    const sorted = [...favFiltered].sort((a, b) => {
      if (sortBy === 'hot') return (b.likes || 0) - (a.likes || 0)
      return (new Date(b.date).getTime()) - (new Date(a.date).getTime())
    })
    return sorted
  }, [posts, sortBy, search, communityMode, selectedStyle, selectedTopic, favOnly, favorites, importedExplore])
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
    // 中文注释：无限滚动—靠近底部自动加载下一页
    const el = sentinelRef.current
    if (!el) return
    const ob = new IntersectionObserver((entries) => {
      const e = entries[0]
      if (e && e.isIntersecting) {
        setPage(prev => prev + 1)
      }
    }, { root: null, rootMargin: '200px' })
    ob.observe(el)
    return () => ob.disconnect()
  }, [sentinelRef, merged])
  // 中文注释：统计热门风格/题材（取前6个）
  const topStyles = useMemo(() => {
    const map: Record<string, number> = {}
    merged.forEach(p => { const s = pickStyle(p.title); map[s] = (map[s] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [merged])
  const topTopics = useMemo(() => {
    const map: Record<string, number> = {}
    merged.forEach(p => { const s = pickTopic(p.title); map[s] = (map[s] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [merged])
  const suggestions = useMemo(() => {
    // 中文注释：根据输入生成联想（风格/题材优先）
    const q = search.trim().toLowerCase()
    if (!q) return [] as string[]
    const styleSug = topStyles.map(([name]) => `风格:${String(name)}`).filter(s => s.toLowerCase().includes(q))
    const topicSug = topTopics.map(([name]) => `题材:${String(name)}`).filter(s => s.toLowerCase().includes(q))
    return [...styleSug, ...topicSug].slice(0, 8)
  }, [search, topStyles, topTopics])

  // 中文注释：广场页内的“共创社群”模块（可展开/收起）与快捷跳转
  const [communityOpen, setCommunityOpen] = useState(true)
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
    const cover = u || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(t)}&image_size=square`
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
    const cover = `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(t)}&image_size=square`
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
  const getFallbackThumb = (p: Post) => `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(p.title)}&image_size=square`
  return (
    <SidebarLayout>
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
              className={`${isDark ? 'bg-gray-800/60 ring-1 ring-gray-700' : 'bg-white/60 ring-1 ring-gray-200'} px-4 pb-3 rounded-xl cursor-pointer`} 
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
              {/* 中文注释：话题标签改为更易点击的 Chip，增加描边与过渡动画 */}
              <div className="flex flex-wrap gap-2 mb-3">
                {tagsLoading && (
                  <div className="flex flex-wrap gap-2 w-full">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`animate-pulse h-7 px-8 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    ))}
                  </div>
                )}
                {!tagsLoading && tags.map((tag) => (
                  <motion.button
                    key={tag}
                    onClick={() => { incTagClick(tag); gotoCommunity(`?tag=${encodeURIComponent(tag)}`) }}
                    aria-label={`按话题 ${tag} 筛选社群`}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); incTagClick(tag); gotoCommunity(`?tag=${encodeURIComponent(tag)}`) } }}
                    whileTap={{ scale: 0.97 }}
                    className={`text-xs px-2.5 py-1.5 min-h-[28px] rounded-full transition focus:outline-none focus:ring-2 ${
                      isDark 
                        ? 'bg-gray-700 text-gray-200 ring-1 ring-gray-600 hover:bg-gray-600 focus:ring-blue-500' 
                        : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-200 focus:ring-blue-400'
                    }`}
                    title={tagMeta[tag]?.desc || tagMeta[tag]?.group || ''}
                  >
                    <i className="fas fa-hashtag mr-1"></i>
                    {tag}
                    {(tagClicks[tag] || 0) > 0 && (
                      <span className={`ml-1 inline-flex items-center px-1.5 py-[1px] rounded-full text-[10px] ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`} title="点击热度">{tagClicks[tag]}</span>
                    )}
                    {hotTagSet.has(tag) && (
                      <i className={`fas fa-fire ml-1 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} title="热度较高"></i>
                    )}
                  </motion.button>
                ))}
                {!tagsLoading && tagsError && (
                  <div className={`text-[11px] mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>标签加载失败，已使用默认列表</div>
                )}
              </div>
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
                      className={`w-full text-left px-3 py-2 flex items中心 justify-between transition focus:outline-none focus:ring-2 ${isDark ? 'hover:bg-gray-700 focus:ring-blue-500' : 'hover:bg-gray-50 focus:ring-blue-400'}`}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); gotoCommunity(g.path) } }}
                    >
                      <span className="text-xs font-medium flex items-center gap-2">
                        <i className={`fas fa-users ${isDark ? 'text-gray-300' : 'text-gray-500'} text-[11px]`}></i>
                        {g.name}
                        {g.official && (
                          <span className={`px-1.5 py-[1px] rounded text-[10px] ${isDark ? 'bg-blue-700 text-blue-100' : 'bg-blue-100 text-blue-700'}`}>官方</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{g.members} 人</span>
                        <i className={`fas fa-chevron-right ${isDark ? 'text-gray-400' : 'text-gray-400'} text-[10px]`}></i>
                      </span>
                    </motion.button>
                  </li>
                ))}
              </ul>
              {!featLoading && featError && (
                <div className={`text-[11px] mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>精选社群加载失败，已使用默认列表</div>
              )}
              {/* 中文注释：主行动按钮 —— 强化主次层级，提升转化 */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => gotoCommunity('?context=cocreation&tab=joined')}
                  aria-label="进入社群列表"
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg ${isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
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
          <button onClick={() => setFavOnly(v => !v)} className={`${favOnly ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-3 py-1 rounded-full text-sm`}>{favOnly ? '仅看收藏' : '全部作品'}</button>
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
            <a href="/community" className="text-xs px-3 py-1 rounded-full bg-blue-600 text-white">进入创作者社区（新版）</a>
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
              <img src={thumb} alt="封面预览" className="w-16 h-16 object-cover rounded" />
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <input value={search} onChange={e => { setSearch(e.target.value); setShowSuggest(true) }} onFocus={() => setShowSuggest(true)} onBlur={() => setTimeout(() => setShowSuggest(false), 150)} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} w-full px-3 py-2 rounded-lg border`} placeholder="搜索标题/评论/风格/题材（支持 style:国潮 / topic:京剧）" />
              {showSuggest && suggestions.length > 0 && (
                <div className={`${isDark ? 'bg-gray-800 text-white ring-gray-700' : 'bg-white text-gray-900 ring-gray-200'} absolute z-10 mt-1 w-full rounded-lg shadow ring-1 max-h-40 overflow-auto`}>{suggestions.map((s, i) => (
                  <div key={i} onMouseDown={() => { setSearch(s); setShowSuggest(false) }} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} px-3 py-2 text-sm cursor-pointer`}>{s}</div>
                ))}</div>
              )}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} px-3 py-2 rounded-lg border`}>
              <option value="hot">按点赞热度</option>
              <option value="new">按最新时间</option>
            </select>
            <button onClick={share} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-3 py-2 rounded-lg`}>复制广场链接</button>
          </div>
        </div>
        {/* 中文注释：广场卡片列表固定为三列布局 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {viewList.map(p => (
            <motion.div key={p.id} whileHover={{ y: -5 }} className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-4`}>
              <img onClick={() => setActive(p)} src={p.thumbnail || getFallbackThumb(p)} alt={p.title} className="w-full h-40 object-cover rounded-lg mb-3 cursor-pointer" loading="lazy" decoding="async" />
              <div className="font-medium mb-2">{p.title}</div>
              <div className="flex items-center text-sm mb-3">
                <span className="mr-3"><i className="far fa-thumbs-up mr-1"></i>{p.likes}</span>
                <span><i className="far fa-comment mr-1"></i>{p.comments.length}</span>
              </div>
              <div className="flex gap-2 mb-3">
                <button onClick={() => like(p.id)} className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} px-3 py-1 rounded-lg text-sm`}>点赞</button>
                <button onClick={share} className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm">分享</button>
                <button onClick={() => sharePost(p.id)} className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} px-3 py-1 rounded-lg text-sm`}>复制作品链接</button>
                <button onClick={() => toggleFavorite(p.id)} className={`${favorites.includes(p.id) ? 'bg-yellow-500 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-3 py-1 rounded-lg text-sm`}>{favorites.includes(p.id) ? '取消收藏' : '收藏'}</button>
              </div>
              <div className="flex gap-2">
                <input value={commentText[p.id] || ''} onChange={(e) => setCommentText(prev => ({ ...prev, [p.id]: e.target.value }))} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} flex-1 px-3 py-1 rounded-lg border`} placeholder="写下评论" />
                <button onClick={() => addComment(p.id)} className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} px-3 py-1 rounded-lg text-sm`}>发布</button>
              </div>
              {/* 中文注释：最近评论展示，最多显示2条 */}
              {p.comments?.length > 0 && (
                <div className="mt-3 text-sm opacity-80">
                  {p.comments.slice(-2).map(c => (
                    <div key={c.id} className="mt-1">
                      <span className="opacity-60">{new Date(c.date).toLocaleString()}：</span>
                      <span>{c.content}</span>
                    </div>
                  ))}
                  {p.comments.length > 2 && <div className="opacity-60 mt-1">…还有 {p.comments.length - 2} 条评论</div>}
                </div>
              )}
            </motion.div>
          ))}
        </div>
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
              <img src={active.thumbnail} alt={active.title} className="w-full h-64 object-cover rounded-lg mb-4" />
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
      </main>
    </SidebarLayout>
  )
}
