import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { scoreAuthenticity } from '@/services/authenticityService'
import SidebarLayout from '@/components/SidebarLayout'
import { useTheme } from '@/hooks/useTheme'
import llmService from '@/services/llmService'
import voiceService from '@/services/voiceService'
import { TianjinImage } from '@/components/TianjinStyleComponents'
import { toast } from 'sonner'
import errorService from '@/services/errorService'
import doubao from '@/services/doubao'
import { createVideoTask, pollVideoTask } from '@/services/doubao'
import type { DoubaoVideoContent } from '@/services/doubao'

const BRAND_STORIES: Record<string, string> = {
  mahua: '始于清末，以多褶形态与香酥口感著称，传统工艺要求条条分明，不含水分。',
  baozi: '创始于光绪年间，皮薄馅大、鲜香味美，传承天津传统小吃的经典风味。',
  niuren: '以细腻彩塑著称，人物生动传神，见证天津手艺与美学传承。',
  erduoyan: '创建于清光绪年间的耳朵眼炸糕，外酥里糯、香甜不腻，是天津特色小吃代表。',
  laomeihua: '老美华鞋店始于民国时期，保留传统手工缝制技艺与“舒适耐穿”的品牌口碑。',
  dafulai: '大福来锅巴菜以糊辣香浓著称，讲究火候与调和，口感层次丰富。',
  guorenzhang: '果仁张为百年坚果老字号，以糖炒栗子闻名，香甜适口、粒粒饱满。',
  chatangli: '茶汤李源自清末，茶汤细腻柔滑、甘香回甜，是老天津的温暖记忆。'
}

const TAGS = ['国潮', '杨柳青年画', '传统纹样', '红蓝配色']

// 获取自定义标签
const getCustomTags = (): string[] => {
  try {
    const raw = localStorage.getItem('NEO_CUSTOM_TAGS')
    const tags = raw ? JSON.parse(raw) : []
    return Array.isArray(tags) ? tags : []
  } catch {
    return []
  }
}

// 保存自定义标签
const saveCustomTags = (tags: string[]) => {
  try {
    localStorage.setItem('NEO_CUSTOM_TAGS', JSON.stringify(tags))
  } catch {}
}

export default function Neo() {
  const { isDark } = useTheme()
  const location = useLocation()
  const apiBase = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.trim() || (typeof window !== 'undefined' && /localhost:3000$/.test(window.location.host) ? 'http://localhost:3001' : '')
  const shortenUrl = (u: string) => {
    try {
      const o = new URL(u)
      const path = o.pathname.length > 24 ? o.pathname.slice(0, 24) + '…' : o.pathname
      return `${o.hostname}${path}`
    } catch {
      return u.length > 64 ? u.slice(0, 64) + '…' : u
    }
  }
  // 中文注释：历史记录类型定义
  type HistoryItem = {
    url: string;
    image: string;
    createdAt: number;
    duration?: number;
    width?: number;
    height?: number;
    thumb?: string;
    isFavorite?: boolean;
    type?: 'video' | 'image';
  }
  
  // 中文注释：视频元信息（时长、分辨率、生成时间）与历史列表
  const [videoMetaByIndex, setVideoMetaByIndex] = useState<Array<{ duration?: number; width?: number; height?: number; createdAt?: number; sizeBytes?: number; contentType?: string }>>([])
  const [videoHistory, setVideoHistory] = useState<HistoryItem[]>([])
  const [historyPreviewOpen, setHistoryPreviewOpen] = useState<Record<string, boolean>>({})
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'favorite' | 'video'>('all')
  const [historySort, setHistorySort] = useState<'latest' | 'oldest'>('latest')
  
  // 加载历史记录
  useEffect(() => {
    try {
      const raw = localStorage.getItem('NEO_VIDEO_HISTORY')
      const arr = raw ? JSON.parse(raw) : []
      if (Array.isArray(arr)) {
        // 确保每个历史项都有isFavorite和type字段
        const processed = arr.map(item => ({
          ...item,
          isFavorite: item.isFavorite || false,
          type: item.type || 'video'
        }))
        setVideoHistory(processed)
      }
    } catch {}
  }, [])
  
  // 保存历史记录
  const saveHistory = (entry: Omit<HistoryItem, 'isFavorite' | 'type'>) => {
    const newEntry: HistoryItem = {
      ...entry,
      isFavorite: false,
      type: 'video'
    }
    setVideoHistory(prev => {
      const next = [newEntry, ...prev].slice(0, 30) // 增加到30条历史记录
      try { localStorage.setItem('NEO_VIDEO_HISTORY', JSON.stringify(next)) } catch {}
      return next
    })
  }
  
  // 更新历史记录元数据
  const updateHistoryMeta = (url: string, meta: { duration?: number; width?: number; height?: number }) => {
    setVideoHistory(prev => {
      const next = prev.map(it => (it.url === url ? { ...it, ...meta } : it))
      try { localStorage.setItem('NEO_VIDEO_HISTORY', JSON.stringify(next)) } catch {}
      return next
    })
  }
  
  // 切换收藏状态
  const toggleFavorite = (url: string) => {
    setVideoHistory(prev => {
      const next = prev.map(it => {
        if (it.url === url) {
          return { ...it, isFavorite: !it.isFavorite }
        }
        return it
      })
      try { localStorage.setItem('NEO_VIDEO_HISTORY', JSON.stringify(next)) } catch {}
      return next
    })
  }
  
  // 过滤和排序历史记录
  const filteredHistory = videoHistory.filter(item => {
    // 搜索过滤
    const matchesSearch = historySearch === '' || 
      item.url.includes(historySearch) ||
      (item.width && item.height && `${item.width}×${item.height}`.includes(historySearch))
    
    // 类型过滤
    const matchesFilter = 
      historyFilter === 'all' || 
      (historyFilter === 'favorite' && item.isFavorite) ||
      (historyFilter === 'video' && item.type === 'video')
    
    return matchesSearch && matchesFilter
  }).sort((a, b) => {
    // 排序
    if (historySort === 'latest') {
      return b.createdAt - a.createdAt
    } else {
      return a.createdAt - b.createdAt
    }
  })
  
  // 用户反馈状态管理
  const [feedbacks, setFeedbacks] = useState<Record<string, { rating: number; comment: string }>>({})
  const [showFeedback, setShowFeedback] = useState<string | null>(null)
  
  // 加载反馈数据
  useEffect(() => {
    try {
      const raw = localStorage.getItem('NEO_FEEDBACKS')
      const data = raw ? JSON.parse(raw) : {}
      setFeedbacks(data)
    } catch {}
  }, [])
  
  // 保存反馈
  const saveFeedback = (id: string, rating: number, comment: string) => {
    const newFeedback = {
      rating,
      comment
    }
    setFeedbacks(prev => {
      const next = { ...prev, [id]: newFeedback }
      try { localStorage.setItem('NEO_FEEDBACKS', JSON.stringify(next)) } catch {}
      return next
    })
    setShowFeedback(null)
    toast.success('反馈已提交，感谢您的参与！')
  }
  const formatDuration = (d?: number) => {
    if (!d || !isFinite(d)) return ''
    const m = Math.floor(d / 60)
    const s = Math.floor(d % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }
  const formatResolution = (w?: number, h?: number) => (w && h ? `${w}×${h}` : '')
  const formatTime = (ts?: number) => {
    if (!ts) return ''
    const ms = ts > 10_000_000_000 ? ts : ts * 1000
    const d = new Date(ms)
    const y = d.getFullYear()
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const hh = d.getHours().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')
    return `${y}-${m}-${day} ${hh}:${mm}`
  }
  const [brand, setBrand] = useState('mahua')
  const [story, setStory] = useState(BRAND_STORIES['mahua'])
  const [tags, setTags] = useState<string[]>([])
  const [customTags, setCustomTags] = useState<string[]>(getCustomTags())
  const [newTag, setNewTag] = useState('')
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [progress, setProgress] = useState(0)
  const [showOutput, setShowOutput] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string[]>([])
  const [aiText, setAiText] = useState('')
  const [aiDirections, setAiDirections] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optStatus, setOptStatus] = useState<'idle'|'running'|'done'>('idle')
  const [optPreview, setOptPreview] = useState('')
  const [lastUserPrompt, setLastUserPrompt] = useState('')
  const [lastOptimizedPrompt, setLastOptimizedPrompt] = useState('')
  const [engine, setEngine] = useState<'sdxl' | 'doubao'>('sdxl')
  const [qaAnswer, setQaAnswer] = useState('')
  const [qaLoading, setQaLoading] = useState(false)
  const [videoByIndex, setVideoByIndex] = useState<string[]>([])
  const [ttsUrl, setTtsUrl] = useState('')
  const [useCustomBrand, setUseCustomBrand] = useState(false)
  const [customBrand, setCustomBrand] = useState('')
  const [textStyle, setTextStyle] = useState<'formal' | 'humorous' | 'creative' | 'poetic'>('creative')
  const [generationStatus, setGenerationStatus] = useState<string>('')
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({})
  const [videoStatus, setVideoStatus] = useState<Record<string, string>>({})
  // 视频参数自定义
  const [videoParams, setVideoParams] = useState({
    duration: 5,
    resolution: '720p' as '480p' | '720p' | '1080p',
    cameraFixed: false
  })
  const engineCardRef = useRef<HTMLDivElement | null>(null)
  const optTimerRef = useRef<any>(null)

  // 添加自定义标签
  const addCustomTag = () => {
    const trimmed = newTag.trim()
    if (trimmed && !customTags.includes(trimmed) && !TAGS.includes(trimmed)) {
      const updated = [...customTags, trimmed]
      setCustomTags(updated)
      saveCustomTags(updated)
      setNewTag('')
    }
  }

  // 删除自定义标签
  const removeCustomTag = (tagToRemove: string) => {
    const updated = customTags.filter(tag => tag !== tagToRemove)
    setCustomTags(updated)
    saveCustomTags(updated)
    // 从当前选中的标签中移除
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  // 编辑自定义标签
  const startEditTag = (tag: string) => {
    setEditingTag(tag)
    setNewTag(tag)
  }

  // 保存编辑后的标签
  const saveEditedTag = () => {
    if (editingTag) {
      const trimmed = newTag.trim()
      if (trimmed && trimmed !== editingTag) {
        const updated = customTags.map(tag => tag === editingTag ? trimmed : tag)
        setCustomTags(updated)
        saveCustomTags(updated)
        // 更新当前选中的标签
        setTags(prev => prev.map(tag => tag === editingTag ? trimmed : tag))
      }
      setEditingTag(null)
      setNewTag('')
    }
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingTag(null)
    setNewTag('')
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('query') || ''
    const from = params.get('from') || ''
    if (q) setPrompt(q)
    if (from === 'home') {
      engineCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.search])

  useEffect(() => {
    return () => { if (optTimerRef.current) clearTimeout(optTimerRef.current) }
  }, [])

  const updateStory = (val: string) => {
    setBrand(val)
    const s = BRAND_STORIES[val]
    if (s) setStory(s)
    else setStory(val ? `为 ${val} 创作的灵感简介，请结合品牌特色与天津文化。` : '')
  }

  const optimizePrompt = async () => {
    const base = prompt.trim()
    if (!base) { toast.warning('请输入提示词'); return }
    setOptimizing(true)
    setOptStatus('running')
    setOptPreview('')
    setLastUserPrompt(base)
    const prev = llmService.getCurrentModel().id
    const prevStream = llmService.getConfig().stream
    try {
      const chosen = await (llmService as any).ensureAvailableModel(['deepseek', 'kimi', 'qwen', 'wenxinyiyan'])
      if (chosen !== prev) llmService.setCurrentModel(chosen)
      llmService.updateConfig({ stream: true })
      const context = `${base} ${tags.join(' ')} ${brand}`.trim()
      const instruction = `请将以下提示词优化为更清晰、可直接用于AI绘图的单句提示，包含主体、风格、构图、细节、光影、材质、配色，避免解释：\n${context}`
      const final = await llmService.generateResponse(instruction, { onDelta: (chunk: string) => setOptPreview(chunk) })
      const text = (final || base).trim()
      setPrompt(text)
      setLastOptimizedPrompt(text)
      setOptStatus('done')
      if (final && !/未配置密钥|返回模拟响应/.test(final)) {
        toast.success('已用DeepSeek优化提示词')
      } else {
        toast.info('已使用模拟响应优化提示词')
      }
    } catch (e: any) {
      toast.error(e?.message || '优化失败')
    } finally {
      llmService.setCurrentModel(prev)
      llmService.updateConfig({ stream: prevStream })
      setOptimizing(false)
    }
  }

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  // 中文注释：应用AI建议到提示词，并快速生成简短中文文案（用于填充“AI文案”区域）
  const applyDirection = async (dir: string): Promise<void> => {
    const base = `${prompt} ${dir}`.trim()
    toggleTag(dir)
    setPrompt(base)
    try {
      setIsGenerating(true)
      setAiText('')
      const styleDesc: Record<string, string> = {
        formal: '正式、专业、严谨的风格',
        humorous: '幽默、轻松、有趣的风格',
        creative: '创意、独特、富有想象力的风格',
        poetic: '诗意、优美、富有文采的风格'
      }
      const instruction = `请基于以下方向输出一段不超过120字的中文文案，要求${styleDesc[textStyle]}，通俗易懂，便于朗读：\n方向：${dir}\n提示：${base || '天津文化设计灵感'}`
      const text = await llmService.generateResponse(instruction)
      setAiText((text || '').trim())
    } catch {
      toast.error('生成文案失败，请稍后重试')
    } finally {
      setIsGenerating(false)
    }
  }

  // 中文注释：重新生成AI建议（根据当前输入）
  const regenerateDirections = (): void => {
    try {
      const input = `${prompt} ${tags.join(' ')} ${brand}`.trim() || '天津文化设计灵感'
      const dirs = llmService.generateCreativeDirections(input)
      setAiDirections(dirs)
      toast.success('已刷新AI建议')
    } catch {
      toast.error('刷新建议失败，请稍后重试')
    }
  }

  const genImages = (extra: string = '') => {
    const base = `${prompt} ${tags.join(' ')} ${brand} ${extra}`.trim() || 'Tianjin cultural design'
    return [
      `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' variant A')}&image_size=square`,
      `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' variant B')}&image_size=square`,
      `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' variant C')}&image_size=square`,
    ]
  }

  const startGeneration = () => {
    setShowOutput(true)
    setImages([])
    setProgress(0)
    setAiText('')
    setIsGenerating(true)
    setGenerationStatus('正在分析输入...')
    const input = `${prompt} ${tags.join(' ')} ${brand}`.trim() || '天津文化设计灵感'
    
    // 平滑的进度条动画
    const progressSteps = [
      { status: '正在分析输入...', progress: 10 },
      { status: '正在生成创意方向...', progress: 30 },
      { status: '正在生成AI文案...', progress: 50 },
      { status: '正在生成图片...', progress: 70 },
      { status: '正在计算纯正性评分...', progress: 90 },
      { status: '生成完成', progress: 100 }
    ]
    
    let currentStep = 0
    const progressTimer = setInterval(() => {
      if (currentStep < progressSteps.length) {
        setGenerationStatus(progressSteps[currentStep].status)
        setProgress(progressSteps[currentStep].progress)
        currentStep++
      }
    }, 600)
    
    try {
      const dirs = llmService.generateCreativeDirections(input)
      setAiDirections(dirs)
    } catch {}
    
    llmService.generateResponse(input, {
      onDelta: (chunk: string) => setAiText(chunk)
    }).then(final => {
      clearInterval(progressTimer)
      setProgress(100)
      setGenerationStatus('正在生成图片...')
      
      if (engine === 'doubao') {
        // 中文注释：将返回格式改为 URL，确保后续图生视频使用公网可访问的首帧图片
        doubao.generateImage({ prompt: (final || input), size: '1024x1024', n: 3, response_format: 'url', watermark: true }).then(r => {
          const list = (r as any)?.data?.data || []
          const urls = list
            .map((d: any) => (d?.url ? String(d.url) : ''))
            .filter((u: string) => !!u)
          if (urls.length === 0) {
            toast.info('豆包未返回图片，已提供占位图')
            setImages(genImages(final))
            setVideoByIndex(new Array(3).fill(''))
          } else {
            setImages(urls)
            setVideoByIndex(new Array(urls.length).fill(''))
            toast.success('豆包生图完成')
          }
          setGenerationStatus('')
        }).catch((e) => {
          errorService.logError(e instanceof Error ? e : 'SERVER_ERROR', { scope: 'neo-doubao', prompt: final || input })
          toast.error('豆包生图失败，已回退为占位图')
          setImages(genImages(final))
          setVideoByIndex(new Array(3).fill(''))
          setGenerationStatus('')
        })
      } else {
        setImages(genImages(final))
        setGenerationStatus('')
      }
      const r = scoreAuthenticity(final || prompt, story)
      setScore(r.score)
      setFeedback(r.feedback)
    }).catch(() => {
      clearInterval(progressTimer)
      setProgress(100)
      const imgs = genImages()
      setImages(imgs)
      const r = scoreAuthenticity(prompt, story)
      setScore(r.score)
      setFeedback(r.feedback)
      setGenerationStatus('')
    }).finally(() => {
      setIsGenerating(false)
    })
  }

  // 构建视频生成文本
  const buildVideoText = (prompt: string, tags: string[], brand: string) => {
    const base = `${prompt} ${tags.join(' ')} ${brand}`.trim()
    return `${base || 'Tianjin cultural design'}  --resolution ${videoParams.resolution}  --duration ${videoParams.duration} --camerafixed ${videoParams.cameraFixed}`
  }

  const genVideoAt = async (idx: number) => {
    const src = images[idx] || ''
    const safeImage = src && src.startsWith('https://') && (src.includes('volces.com') || src.includes('tos-cn-beijing'))
    const text = buildVideoText(prompt, tags, brand)
    const taskId = `task-${idx}-${Date.now()}`
    
    // 初始化状态
    setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '生成中...' : v)))
    setVideoProgress(prev => ({ ...prev, [taskId]: 0 }))
    setVideoStatus(prev => ({ ...prev, [taskId]: '初始化视频生成任务...' }))
    
    // 模拟进度更新
    const progressInterval = setInterval(() => {
      setVideoProgress(prev => {
        const current = prev[taskId] || 0
        if (current < 90) {
          // 每10秒增加5%的进度，直到90%
          return { ...prev, [taskId]: current + 5 }
        }
        return prev
      })
    }, 10000)
    
    try {
      const content: DoubaoVideoContent[] = safeImage 
        ? [{ type: 'text' as const, text }, { type: 'image_url' as const, image_url: { url: src } }]
        : [{ type: 'text' as const, text }]
      const created = await createVideoTask({ model: 'doubao-seedance-1-0-pro-250528', content })
      if (!created.ok || !created.data?.id) {
        clearInterval(progressInterval)
        const msg = (created as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : '创建失败'
        toast.error(msg)
        setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
        return
      }
      const polled = await pollVideoTask(created.data.id, { intervalMs: 10000, timeoutMs: 600000 })
      if (!polled.ok) {
        clearInterval(progressInterval)
        const msg = (polled as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : (polled.error || '查询失败')
        toast.error(msg)
        setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
        return
      }
      const url = polled.data?.content?.video_url || ''
      const last = polled.data?.content?.last_frame_url || ''
      if (polled.data?.status === 'succeeded' && url) {
        clearInterval(progressInterval)
        setVideoProgress(prev => ({ ...prev, [taskId]: 100 }))
        setVideoStatus(prev => ({ ...prev, [taskId]: '视频生成完成' }))
        toast.success('视频生成完成')
        setVideoByIndex(prev => prev.map((v, i) => (i === idx ? url : v)))
        const createdAt = polled.data?.created_at || polled.data?.updated_at || Date.now()
        setVideoMetaByIndex(prev => prev.map((m, i) => (i === idx ? { ...m, createdAt: typeof createdAt === 'number' ? createdAt : Date.now() } : m)))
        saveHistory({ url, image: src, createdAt: typeof createdAt === 'number' ? createdAt : Date.now(), thumb: last || undefined })
        
        // 1秒后清除进度状态
        setTimeout(() => {
          setVideoProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[taskId]
            return newProgress
          })
          setVideoStatus(prev => {
            const newStatus = { ...prev }
            delete newStatus[taskId]
            return newStatus
          })
        }, 1000)
      } else {
        clearInterval(progressInterval)
        toast.error('视频生成失败')
        setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
      }
    } catch (e: any) {
      clearInterval(progressInterval)
      errorService.logError(e instanceof Error ? e : 'SERVER_ERROR', { scope: 'neo-video' })
      toast.error('视频生成异常')
      setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
    }
  }

  useEffect(() => {
    // 优化视频元数据获取，只处理新添加的视频URL
    videoByIndex.forEach((url, i) => {
      if (url && url.startsWith('http')) {
        const existingMeta = videoMetaByIndex[i]
        // 只在没有获取过元数据时发送请求
        if (!existingMeta?.sizeBytes) {
          const metaUrl = `${apiBase ? `${apiBase}` : ''}/api/proxy/video/meta?url=${encodeURIComponent(url)}`
          fetch(metaUrl)
            .then(r => r.json())
            .then(d => {
              if (d?.ok) {
                setVideoMetaByIndex(prev => {
                  const next = [...prev]
                  next[i] = { ...(next[i] || {}), sizeBytes: Number(d.content_length || 0), contentType: String(d.content_type || '') }
                  return next
                })
              }
            })
            .catch(() => {})
        }
      }
    })
  }, [videoByIndex, videoMetaByIndex])

  const testDoubaoVQA = async () => {
    setQaLoading(true)
    setQaAnswer('')
    try {
      const r = await doubao.chatCompletions({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: 'https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg' } },
              { type: 'text', text: '图片主要讲了什么?' }
            ]
          }
        ]
      })
      const content = (r as any)?.data?.choices?.[0]?.message?.content || ''
      setQaAnswer(content || '（无返回内容）')
    } catch {
      setQaAnswer('调用失败，请检查服务端环境变量或网络')
    } finally {
      setQaLoading(false)
    }
  }

  return (
    <>
      <main className="relative container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-br from-blue-500/20 via-red-500/20 to-yellow-500/20 blur-3xl rounded-full"></div>
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-56 h-56 sm:w-72 sm:h-72 bg-gradient-to-tr from-red-500/15 via-yellow-500/15 to-blue-500/15 blur-3xl rounded-full"></div>
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div ref={engineCardRef} className={`rounded-2xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 mb-6`}>
            <h1 className="text-2xl font-bold mb-2">津门 · 灵感引擎</h1>
            <div className="w-20 h-1 rounded-full bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500 mb-4"></div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm">生成引擎</span>
              <div className="flex gap-2">
                <button onClick={() => setEngine('sdxl')} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${engine==='sdxl' ? 'bg-red-600 hover:bg-red-700 text-white' : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')}`}>SDXL</button>
                <button onClick={() => setEngine('doubao')} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${engine==='doubao' ? 'bg-red-600 hover:bg-red-700 text-white' : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')}`}>Doubao</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm mb-2 block">选择品牌</label>
                <select
                  value={useCustomBrand ? 'custom' : brand}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === 'custom') {
                      setUseCustomBrand(true)
                      const val = customBrand.trim()
                      if (val) {
                        updateStory(val)
                      } else {
                        setBrand('')
                        setStory('请输入品牌名称进行创作')
                      }
                    } else {
                      setUseCustomBrand(false)
                      updateStory(v)
                    }
                  }}
                  className={`${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border focus:outline-none`}
                >
                  <option value="mahua">桂发祥十八街麻花</option>
                  <option value="baozi">狗不理包子</option>
                  <option value="niuren">泥人张彩塑</option>
                  <option value="erduoyan">耳朵眼炸糕</option>
                  <option value="laomeihua">老美华鞋店</option>
                  <option value="dafulai">大福来锅巴菜</option>
                  <option value="guorenzhang">果仁张糖炒栗子</option>
                  <option value="chatangli">茶汤李茶汤</option>
                  <option value="custom">自定义品牌</option>
                </select>
                {useCustomBrand && (
                  <input
                    value={customBrand}
                    onChange={(e) => {
                      const val = e.target.value
                      setCustomBrand(val)
                      updateStory(val)
                    }}
                    placeholder="输入品牌名称（支持自定义）"
                    className={`${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} w-full mt-2 px-3 py-2 rounded-lg border focus:outline-none`}
                  />
                )}
              </div>

              <div>
                <label className="text-sm mb-2 block">创作标签</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {/* 内置标签 */}
                  {TAGS.map(t => {
                    const active = tags.includes(t)
                    return (
                      <button
                        key={`built-in-${t}`}
                        onClick={() => toggleTag(t)}
                        className={`text-xs px-3 py-1 rounded-full border transition-all duration-200 ${
                          active
                            ? isDark
                              ? 'border-red-500 text-red-400 bg-red-900 bg-opacity-20 hover:bg-opacity-30'
                              : 'border-red-500 text-red-600 bg-red-50 hover:bg-red-100'
                            : isDark
                              ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  })}
                  {/* 自定义标签 */}
                  {customTags.map(t => {
                    const active = tags.includes(t)
                    return (
                      <div key={`custom-${t}`} className="relative group">
                        <button
                          onClick={() => toggleTag(t)}
                          className={`text-xs px-3 py-1 rounded-full border transition-all duration-200 ${
                            active
                              ? isDark
                                ? 'border-purple-500 text-purple-400 bg-purple-900 bg-opacity-20 hover:bg-opacity-30'
                                : 'border-purple-500 text-purple-600 bg-purple-50 hover:bg-purple-100'
                              : isDark
                                ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                                : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {t}
                        </button>
                        <div className="absolute right-0 -top-1 -translate-x-full group-hover:flex hidden flex-col gap-1 ml-1 bg-white dark:bg-gray-800 p-1 rounded-md shadow-lg border dark:border-gray-700">
                          <button
                            onClick={() => startEditTag(t)}
                            className="text-[10px] px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => removeCustomTag(t)}
                            className="text-[10px] px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* 添加/编辑自定义标签 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (editingTag ? saveEditedTag() : addCustomTag())}
                    placeholder={editingTag ? '编辑标签...' : '添加自定义标签...'}
                    className={`flex-1 text-sm px-3 py-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none`}
                  />
                  {editingTag ? (
                    <div className="flex gap-1">
                      <button
                        onClick={saveEditedTag}
                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-xs px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={addCustomTag}
                      className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      添加
                    </button>
                  )}
                </div>
              </div>
            </div>

          <div className={`text-sm p-3 rounded-lg mb-4 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
            {story}
          </div>

            <div className="relative mb-4">
              <textarea
                value={prompt}
                onChange={(e) => { const v = e.target.value; setPrompt(v); if (optTimerRef.current) clearTimeout(optTimerRef.current); optTimerRef.current = setTimeout(() => { if (v.trim() && !optimizing && v.trim() !== lastOptimizedPrompt.trim()) optimizePrompt() }, 2000) }}
                onBlur={() => { if (prompt.trim() && !optimizing) optimizePrompt() }}
                placeholder="[AI引导]：掌柜的，您想怎么改？(输入语音或文字)"
                className={`w-full h-32 px-3 py-3 rounded-lg border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500' : 'bg-white border-gray-300 focus:border-red-500'} resize-y`}
                autoCapitalize="none"
                autoCorrect="off"
                enterKeyHint="send"
                inputMode="text"
              />
              <button
                onClick={async () => {
                  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    const recognition = new SpeechRecognition();
                    recognition.lang = 'zh-CN';
                    recognition.interimResults = false;
                    
                    recognition.onstart = () => {
                      toast.info('开始语音输入...');
                    };
                    
                    recognition.onresult = (event: any) => {
                      const speechResult = event.results[0][0].transcript;
                      setPrompt(prev => prev + speechResult);
                      toast.success('语音输入完成');
                    };
                    
                    recognition.onerror = (event: any) => {
                      toast.error('语音输入失败: ' + event.error);
                    };
                    
                    recognition.start();
                  } else {
                    toast.error('您的浏览器不支持语音输入功能');
                  }
                }}
                className={`absolute right-3 bottom-3 p-2 rounded-full ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition-all duration-300 hover:scale-110`}
                aria-label="语音输入"
              >
                <i className="fas fa-microphone"></i>
              </button>
            </div>
            {(optimizing || optStatus !== 'idle') && (
              <div className={`text-xs mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} aria-live="polite">
                {optimizing ? '优化中…' : (optStatus === 'done' ? '已优化' : '准备优化')}
              </div>
            )}
            {optPreview && optimizing && (
              <div className={`text-xs rounded p-2 mb-2 ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{optPreview}</div>
            )}

            <button
              onClick={startGeneration}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 min-h-[44px] active:scale-98"
            >
              注入灵感
            </button>
            <div className="mt-3">
              <button
                onClick={optimizePrompt}
                disabled={optimizing || isGenerating}
                className={`w-full ${isDark ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98`}
              >
                {optimizing ? 'DeepSeek优化中…' : '优化提示词（DeepSeek）'}
              </button>
              {lastUserPrompt && lastOptimizedPrompt && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => { setPrompt(lastUserPrompt); setOptStatus('idle'); setOptPreview(''); toast.success('已撤销优化') }}
                    className={`text-xs px-3 py-1 rounded transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                  >撤销优化</button>
                </div>
              )}
            </div>
            {engine === 'doubao' && (
              <div className="mt-4">
                <button
                  onClick={testDoubaoVQA}
                  className={`w-full ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98`}
                  disabled={qaLoading}
                >
                  {qaLoading ? '豆包图文问答测试中…' : '豆包图文问答测试'}
                </button>
                {qaAnswer && (
                  <div className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{qaAnswer}</div>
                )}
              </div>
            )}
          </div>

          {showOutput && (
            <div className={`rounded-2xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'} p-6`}>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">生成进度</div>
                  {generationStatus && (
                    <div className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} animate-pulse`}>
                      {generationStatus}
                    </div>
                  )}
                </div>
                <div className="relative h-2 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-white opacity-30 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-end mt-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{progress}%</div>
                </div>
              </div>
              
              {/* 视频参数自定义 */}
              <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <h3 className="text-sm font-medium mb-3">视频参数设置</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">时长（秒）</label>
                    <input
                      type="number"
                      min="3"
                      max="30"
                      value={videoParams.duration}
                      onChange={(e) => setVideoParams(prev => ({ ...prev, duration: parseInt(e.target.value) || 5 }))}
                      className={`w-full text-sm px-3 py-2 rounded border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none`}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">分辨率</label>
                    <select
                      value={videoParams.resolution}
                      onChange={(e) => setVideoParams(prev => ({ ...prev, resolution: e.target.value as '480p' | '720p' | '1080p' }))}
                      className={`w-full text-sm px-3 py-2 rounded border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none`}
                    >
                      <option value="480p">480p</option>
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">相机模式</label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="cameraMode"
                          value="false"
                          checked={!videoParams.cameraFixed}
                          onChange={() => setVideoParams(prev => ({ ...prev, cameraFixed: false }))}
                          className="text-red-600"
                        />
                        <span className="text-sm">动态</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="cameraMode"
                          value="true"
                          checked={videoParams.cameraFixed}
                          onChange={() => setVideoParams(prev => ({ ...prev, cameraFixed: true }))}
                          className="text-red-600"
                        />
                        <span className="text-sm">固定</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {images.map((src, i) => {
                  const val = videoByIndex[i] || ''
                  const processing = val === '生成中...'
                  const hasUrl = val.startsWith('http')
                  return (
                    <div key={i} className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} transition-all duration-300 hover:shadow-lg`}>
                      <div className="relative">
                        <TianjinImage src={src} alt="result" ratio="square" rounded="xl" className="cursor-pointer transition-transform duration-300 hover:scale-105" onClick={() => (!processing ? genVideoAt(i) : undefined)} />
                        {processing && (
                          <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-blue-600 text-white shadow-md">生成中…</div>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => genVideoAt(i)} disabled={processing} className={`text-sm px-3 py-2 rounded-md transition-all duration-200 ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:opacity-60 disabled:cursor-not-allowed active:scale-98`}>{processing ? '生成中…' : '生成视频'}</button>
                          <button 
                            onClick={async () => {
                              try {
                                // 实现分享功能
                                if (navigator.share) {
                                  // 使用Web Share API
                                  await navigator.share({
                                    title: 'AI生成作品',
                                    text: '我使用津门·灵感引擎生成了一个作品，快来看看吧！',
                                    url: src.startsWith('http') ? src : window.location.href
                                  });
                                  toast.success('分享成功');
                                } else {
                                  // 回退方案：复制链接
                                  await navigator.clipboard.writeText(src.startsWith('http') ? src : window.location.href);
                                  toast.success('链接已复制，您可以手动分享');
                                }
                              } catch (error) {
                                console.error('分享失败:', error);
                                // 再次尝试复制链接作为最后的回退
                                try {
                                  await navigator.clipboard.writeText(src.startsWith('http') ? src : window.location.href);
                                  toast.success('链接已复制，您可以手动分享');
                                } catch (clipboardError) {
                                  toast.error('分享失败，请手动复制链接');
                                }
                              }
                            }}
                            className={`text-sm px-3 py-2 rounded-md transition-all duration-200 ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} active:scale-98 flex items-center justify-center gap-1`}
                          >
                            <i className="fas fa-share-alt"></i> 分享
                          </button>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <button
                            onClick={() => setShowFeedback(`result-${i}`)}
                            className={`text-xs px-3 py-1 rounded transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                          >
                            {feedbacks[`result-${i}`] ? '查看/修改反馈' : '提交反馈'}
                          </button>
                          
                          {/* 显示已提交的评分 */}
                          {feedbacks[`result-${i}`] && (
                            <div className="text-xs flex items-center gap-1">
                              <span className="text-yellow-500">{'★'.repeat(feedbacks[`result-${i}`]!.rating)}{'☆'.repeat(5 - feedbacks[`result-${i}`]!.rating)}</span>
                              <span className="text-gray-500">({feedbacks[`result-${i}`]!.rating}/5)</span>
                            </div>
                          )}
                        </div>
                        
                        {/* 反馈弹窗 */}
                        {showFeedback === `result-${i}` && (
                          <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                            <h4 className="text-sm font-medium mb-2">提交反馈</h4>
                            
                            {/* 评分 */}
                            <div className="mb-3">
                              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">评分：</label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    onClick={() => {
                                      const current = feedbacks[`result-${i}`] || { rating: 0, comment: '' }
                                      saveFeedback(`result-${i}`, star, current.comment)
                                    }}
                                    className={`text-xl transition-all duration-200 ${(feedbacks[`result-${i}`]?.rating || 0) >= star ? 'text-yellow-500 transform scale-110' : 'text-gray-400 hover:text-yellow-500'}`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* 文字反馈 */}
                            <div className="mb-3">
                              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">反馈意见：</label>
                              <textarea
                                value={feedbacks[`result-${i}`]?.comment || ''}
                                onChange={(e) => {
                                  const current = feedbacks[`result-${i}`] || { rating: 0, comment: '' }
                                  saveFeedback(`result-${i}`, current.rating, e.target.value)
                                }}
                                placeholder="请输入您的反馈意见..."
                                className={`w-full text-xs px-3 py-2 rounded border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none`}
                                rows={3}
                              />
                            </div>
                            
                            {/* 关闭按钮 */}
                            <div className="flex justify-end">
                              <button
                                onClick={() => setShowFeedback(null)}
                                className={`text-xs px-3 py-1 rounded transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'}`}
                              >
                                关闭
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="text-lg font-bold mb-2">纯正性评分：{score}</div>
              {feedback.length > 0 && (
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{feedback.join('；')}</div>
              )}
            </div>
          )}
          <div className={`rounded-2xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 mt-6`}>
            <div className="font-bold mb-3 flex items-center justify-between">
              <span>AI建议</span>
              <button onClick={regenerateDirections} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} transition-all duration-200 hover:scale-105`}>刷新建议</button>
            </div>
            {aiDirections.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {aiDirections.map((d, i) => (
                  <button key={i} onClick={() => applyDirection(d)} className={`text-xs sm:text-sm px-3 py-2 rounded-full border transition-all duration-200 ${isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-100'}`}>
                    {d}
                  </button>
                ))}
              </div>
            ) : (
              <div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4`}>
                <span>点击“注入灵感”以获取建议</span>
                <button onClick={startGeneration} className={`text-xs px-3 py-2 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} transition-all duration-200 hover:scale-105`}>快速注入灵感</button>
              </div>
            )}
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold">AI文案</div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 dark:text-gray-400">风格：</label>
                <select
                  value={textStyle}
                  onChange={(e) => setTextStyle(e.target.value as any)}
                  className={`text-xs px-2 py-1 rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none`}
                >
                  <option value="creative">创意</option>
                  <option value="formal">正式</option>
                  <option value="humorous">幽默</option>
                  <option value="poetic">诗意</option>
                </select>
              </div>
            </div>
            <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm whitespace-pre-wrap min-h-20 sm:min-h-24 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>{aiText}</div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button onClick={async () => { const base = aiText.trim() ? aiText : prompt.trim(); if (!base) { toast.warning('请先生成文案或填写提示'); return } try { const r = await voiceService.synthesize(base, { format: 'mp3' }); setTtsUrl(r.audioUrl) } catch (e: any) { toast.error(e?.message || '朗读失败') } }} className="text-sm px-3 py-2 rounded-md bg-green-600 text-white transition-all duration-200 hover:bg-green-700 active:scale-98 min-h-[36px]">朗读</button>
              <button onClick={() => { const text = aiText.trim(); if (!text) { toast.warning('暂无可复制的文案'); return } try { navigator.clipboard.writeText(text); toast.success('已复制文案'); } catch { toast.error('复制失败'); } }} className={`text-sm px-3 py-2 rounded-md ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} transition-all duration-200 hover:bg-opacity-80 active:scale-98 min-h-[36px]`}>复制文案</button>
              <button onClick={() => { const text = aiText.trim(); if (!text) { toast.warning('暂无文案可插入'); return } setPrompt(text); toast.success('已插入到输入框'); }} className={`text-sm px-3 py-2 rounded-md ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} transition-all duration-200 hover:bg-opacity-80 active:scale-98 min-h-[36px]`}>插入到输入框</button>
              <button onClick={() => { if (!aiText.trim()) { toast.warning('暂无文案可保存'); return } try { const raw = localStorage.getItem('NEO_COPY_HISTORY'); const arr = raw ? JSON.parse(raw) : []; const entry = { id: Date.now(), text: aiText.trim() }; const next = [entry, ...arr].slice(0, 50); localStorage.setItem('NEO_COPY_HISTORY', JSON.stringify(next)); toast.success('已保存到本地'); } catch { toast.error('保存失败'); } }} className={`text-sm px-3 py-2 rounded-md ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} transition-all duration-200 hover:bg-opacity-80 active:scale-98 min-h-[36px]`}>保存文案</button>
              <button onClick={() => { setAiText(''); toast.success('已清空文案'); }} className={`text-sm px-3 py-2 rounded-md ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} transition-all duration-200 hover:bg-opacity-80 active:scale-98 min-h-[36px]`}>清空文案</button>
            </div>
            {ttsUrl && (
              <div className="mt-3">
                <audio controls src={ttsUrl} className="w-full rounded-md" />
              </div>
            )}
            {isGenerating && (<div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs mt-2`}>生成中…</div>)}
          </div>
          {videoHistory.length > 0 && (
            <div className={`rounded-2xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 md:p-6`}>
              <div className="font-bold mb-4 flex flex-wrap items-center justify-between gap-2">
                <span>视频历史</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button className={`text-xs px-3 py-2 rounded transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} transition-all duration-200 hover:scale-105`} onClick={() => { setVideoHistory([]); try { localStorage.removeItem('NEO_VIDEO_HISTORY') } catch {} }}>清空历史</button>
                </div>
              </div>
              
              {/* 历史记录搜索和筛选 */}
              <div className="mb-4 space-y-3">
                {/* 搜索框 */}
                <div>
                  <input
                    type="text"
                    placeholder="搜索历史记录..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className={`w-full text-sm px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none`}
                  />
                </div>
                
                {/* 筛选和排序 */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* 筛选 */}
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">筛选：</label>
                    <select
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value as any)}
                      className={`text-xs px-2 py-1 rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none`}
                    >
                      <option value="all">全部</option>
                      <option value="favorite">收藏</option>
                      <option value="video">视频</option>
                    </select>
                  </div>
                  
                  {/* 排序 */}
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">排序：</label>
                    <select
                      value={historySort}
                      onChange={(e) => setHistorySort(e.target.value as any)}
                      className={`text-xs px-2 py-1 rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none`}
                    >
                      <option value="latest">最新</option>
                      <option value="oldest">最早</option>
                    </select>
                  </div>
                  
                  {/* 历史记录统计 */}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    共 {filteredHistory.length} 条记录
                  </div>
                </div>
              </div>
              
              {/* 历史记录列表 */}
              {filteredHistory.length > 0 ? (
                <div className="space-y-4">
                  {filteredHistory.map((h, idx) => (
                    <div key={idx} className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="w-14 h-14 rounded overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                          <img src={h.thumb || h.image} alt="thumb" className="w-full h-full object-cover transition-transform duration-300 hover:scale-110" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs break-all text-blue-600 flex-1">
                              <a href={h.url} target="_blank" rel="noreferrer" className="underline hover:text-blue-800 transition-colors" title={h.url}>{shortenUrl(h.url)}</a>
                            </div>
                            {/* 收藏按钮 */}
                            <button
                              onClick={() => toggleFavorite(h.url)}
                              className={`p-1 rounded-full transition-all duration-200 ${h.isFavorite ? 'text-yellow-500 transform scale-110' : 'text-gray-400 hover:text-yellow-500'}`}
                              title={h.isFavorite ? '取消收藏' : '收藏'}
                            >
                              {h.isFavorite ? '★' : '☆'}
                            </button>
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} flex flex-wrap gap-x-2 gap-y-1 mt-1`}>
                            {formatResolution(h.width, h.height) && <span>分辨率：{formatResolution(h.width, h.height)}</span>}
                            {formatDuration(h.duration) && <span>时长：{formatDuration(h.duration)}</span>}
                            {formatTime(h.createdAt) && <span>生成时间：{formatTime(h.createdAt)}</span>}
                            {h.isFavorite && <span className="text-yellow-500">已收藏</span>}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <button className={`px-2 py-1 rounded-md transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} active:scale-98`} onClick={() => { try { navigator.clipboard.writeText(h.url); toast.success('已复制链接') } catch {} }} aria-label="复制">
                            <i className="fas fa-copy text-xs"></i>
                          </button>
                          <button className={`px-2 py-1 rounded-md transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} active:scale-98`} onClick={() => { try { window.open(h.url, '_blank') } catch {} }} aria-label="打开">
                            <i className="fas fa-external-link-alt text-xs"></i>
                          </button>
                          <a className={`px-2 py-1 rounded-md transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`} href={`${apiBase ? `${apiBase}` : ''}/api/proxy/video?url=${encodeURIComponent(h.url)}`} download aria-label="下载">
                            <i className="fas fa-download text-xs"></i>
                          </a>
                          <button className={`px-2 py-1 rounded-md transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} active:scale-98`} onClick={() => setHistoryPreviewOpen(prev => ({ ...prev, [h.url]: !prev[h.url] }))} aria-label={historyPreviewOpen[h.url] ? '收起预览' : '预览'}>
                            <i className={`fas fa-${historyPreviewOpen[h.url] ? 'chevron-up' : 'chevron-down'} text-xs`}></i>
                          </button>
                        </div>
                      </div>
                      {historyPreviewOpen[h.url] && (
                        <div className="mt-2 w-full">
                          <video controls src={`${apiBase ? `${apiBase}` : ''}/api/proxy/video?url=${encodeURIComponent(h.url)}`} className="w-full rounded-lg shadow-md" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm text-center py-6`}>
                  {historySearch ? '没有找到匹配的历史记录' : '没有历史记录'}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4`}>
        <div className="container mx-auto flex justify-between items-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>© 2025 AI共创平台. 保留所有权利</p>
          <div className="flex space-x-6">
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>隐私政策</a>
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>服务条款</a>
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>帮助中心</a>
          </div>
        </div>
      </footer>
    </>
  )
}
