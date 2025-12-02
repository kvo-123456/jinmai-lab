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
  // 中文注释：视频元信息（时长、分辨率、生成时间）与历史列表
  const [videoMetaByIndex, setVideoMetaByIndex] = useState<Array<{ duration?: number; width?: number; height?: number; createdAt?: number; sizeBytes?: number; contentType?: string }>>([])
  const [videoHistory, setVideoHistory] = useState<Array<{ url: string; image: string; createdAt: number; duration?: number; width?: number; height?: number; thumb?: string }>>([])
  const [historyPreviewOpen, setHistoryPreviewOpen] = useState<Record<string, boolean>>({})
  useEffect(() => {
    try {
      const raw = localStorage.getItem('NEO_VIDEO_HISTORY')
      const arr = raw ? JSON.parse(raw) : []
      if (Array.isArray(arr)) setVideoHistory(arr)
    } catch {}
  }, [])
  const saveHistory = (entry: { url: string; image: string; createdAt: number; duration?: number; width?: number; height?: number; thumb?: string }) => {
    setVideoHistory(prev => {
      const next = [entry, ...prev].slice(0, 20)
      try { localStorage.setItem('NEO_VIDEO_HISTORY', JSON.stringify(next)) } catch {}
      return next
    })
  }
  const updateHistoryMeta = (url: string, meta: { duration?: number; width?: number; height?: number }) => {
    setVideoHistory(prev => {
      const next = prev.map(it => (it.url === url ? { ...it, ...meta } : it))
      try { localStorage.setItem('NEO_VIDEO_HISTORY', JSON.stringify(next)) } catch {}
      return next
    })
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
  const engineCardRef = useRef<HTMLDivElement | null>(null)
  const optTimerRef = useRef<any>(null)

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
      const instruction = `请基于以下方向输出一段不超过120字的中文文案，要求通俗易懂，便于朗读：\n方向：${dir}\n提示：${base || '天津文化设计灵感'}`
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
    const input = `${prompt} ${tags.join(' ')} ${brand}`.trim() || '天津文化设计灵感'
    try {
      const dirs = llmService.generateCreativeDirections(input)
      setAiDirections(dirs)
    } catch {}
    let timer: any = setInterval(() => {
      setProgress(p => Math.min(95, p + 4))
    }, 80)
    llmService.generateResponse(input, {
      onDelta: (chunk: string) => setAiText(chunk)
    }).then(final => {
      clearInterval(timer)
      setProgress(100)
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
        }).catch((e) => {
          errorService.logError(e instanceof Error ? e : 'SERVER_ERROR', { scope: 'neo-doubao', prompt: final || input })
          toast.error('豆包生图失败，已回退为占位图')
          setImages(genImages(final))
          setVideoByIndex(new Array(3).fill(''))
        })
      } else {
        setImages(genImages(final))
      }
      const r = scoreAuthenticity(final || prompt, story)
      setScore(r.score)
      setFeedback(r.feedback)
    }).catch(() => {
      clearInterval(timer)
      setProgress(100)
      const imgs = genImages()
      setImages(imgs)
      const r = scoreAuthenticity(prompt, story)
      setScore(r.score)
      setFeedback(r.feedback)
    }).finally(() => {
      setIsGenerating(false)
    })
  }

  // 构建视频生成文本
  const buildVideoText = (prompt: string, tags: string[], brand: string) => {
    const base = `${prompt} ${tags.join(' ')} ${brand}`.trim()
    return `${base || 'Tianjin cultural design'}  --resolution 720p  --duration 5 --camerafixed false`
  }

  const genVideoAt = async (idx: number) => {
    const src = images[idx] || ''
    const safeImage = src && src.startsWith('https://') && (src.includes('volces.com') || src.includes('tos-cn-beijing'))
    const text = buildVideoText(prompt, tags, brand)
    setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '生成中...' : v)))
    try {
      const content: DoubaoVideoContent[] = safeImage 
        ? [{ type: 'text' as const, text }, { type: 'image_url' as const, image_url: { url: src } }]
        : [{ type: 'text' as const, text }]
      const created = await createVideoTask({ model: 'doubao-seedance-1-0-pro-250528', content })
      if (!created.ok || !created.data?.id) {
        const msg = (created as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : '创建失败'
        toast.error(msg)
        setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
        return
      }
      const polled = await pollVideoTask(created.data.id, { intervalMs: 10000, timeoutMs: 600000 })
      if (!polled.ok) {
        const msg = (polled as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : (polled.error || '查询失败')
        toast.error(msg)
        setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
        return
      }
      const url = polled.data?.content?.video_url || ''
      const last = polled.data?.content?.last_frame_url || ''
      if (polled.data?.status === 'succeeded' && url) {
        toast.success('视频生成完成')
        setVideoByIndex(prev => prev.map((v, i) => (i === idx ? url : v)))
        const createdAt = polled.data?.created_at || polled.data?.updated_at || Date.now()
        setVideoMetaByIndex(prev => prev.map((m, i) => (i === idx ? { ...m, createdAt: typeof createdAt === 'number' ? createdAt : Date.now() } : m)))
        saveHistory({ url, image: src, createdAt: typeof createdAt === 'number' ? createdAt : Date.now(), thumb: last || undefined })
      } else {
        toast.error('视频生成失败')
        setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
      }
    } catch (e: any) {
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
      <main className="relative container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="pointer-events-none absolute -top-10 -left-10 w-64 h-64 bg-gradient-to-br from-blue-500/20 via-red-500/20 to-yellow-500/20 blur-3xl rounded-full"></div>
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-72 h-72 bg-gradient-to-tr from-red-500/15 via-yellow-500/15 to-blue-500/15 blur-3xl rounded-full"></div>
        <div className="max-w-7xl mx-auto space-y-8">
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
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(t => {
                    const active = tags.includes(t)
                    return (
                      <button
                        key={t}
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
                </div>
              </div>
            </div>

          <div className={`text-sm p-3 rounded-lg mb-4 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
            {story}
          </div>

            <textarea
              value={prompt}
              onChange={(e) => { const v = e.target.value; setPrompt(v); if (optTimerRef.current) clearTimeout(optTimerRef.current); optTimerRef.current = setTimeout(() => { if (v.trim() && !optimizing && v.trim() !== lastOptimizedPrompt.trim()) optimizePrompt() }, 2000) }}
              onBlur={() => { if (prompt.trim() && !optimizing) optimizePrompt() }}
              placeholder="[AI引导]：掌柜的，您想怎么改？(输入语音或文字)"
              className={`w-full h-28 px-3 py-2 rounded-lg border mb-4 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none`}
              autoCapitalize="none"
              autoCorrect="off"
              enterKeyHint="send"
              inputMode="text"
            />
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
              <div className="h-1 rounded bg-gray-300 overflow-hidden mb-4">
                <div className="h-full bg-red-600 transition-all" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {images.map((src, i) => {
                  const val = videoByIndex[i] || ''
                  const processing = val === '生成中...'
                  const hasUrl = val.startsWith('http')
                  return (
                    <div key={i} className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="relative">
                        <TianjinImage src={src} alt="result" ratio="square" rounded="xl" className="cursor-pointer" onClick={() => (!processing ? genVideoAt(i) : undefined)} />
                        {processing && (
                          <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-blue-600 text-white">生成中…</div>
                        )}
                      </div>
                      <div className="p-3">
                        <button onClick={() => genVideoAt(i)} disabled={processing} className={`text-sm px-3 py-1 rounded-md transition-all duration-200 ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:opacity-60 disabled:cursor-not-allowed active:scale-98`}>{processing ? '生成中…' : '生成视频'}</button>
                        {val && (
                          hasUrl ? (
                            <div className="mt-2">
                              <div className="text-xs break-all text-blue-600 flex flex-wrap items-center gap-2">
                                <a href={val} target="_blank" rel="noreferrer" className="underline hover:text-blue-800 transition-colors" title={val}>{shortenUrl(val)}</a>
                                <button className={`px-2 py-0.5 rounded transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`} onClick={() => { try { navigator.clipboard.writeText(val); toast.success('已复制链接') } catch { } }}>复制链接</button>
                                <button className={`px-2 py-0.5 rounded transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`} onClick={() => { try { window.open(val, '_blank') } catch {} }}>打开播放</button>
                                <a className={`px-2 py-0.5 rounded transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`} href={`${apiBase ? `${apiBase}` : ''}/api/proxy/video?url=${encodeURIComponent(val)}`} download>下载</a>
                              </div>
                              <video
                                controls
                                src={`${apiBase ? `${apiBase}` : ''}/api/proxy/video?url=${encodeURIComponent(val)}`}
                                className="w-full mt-2 rounded"
                                onLoadedMetadata={(e) => {
                                  const el = e.currentTarget
                                  const metaNew = { duration: el.duration, width: el.videoWidth, height: el.videoHeight }
                                  setVideoMetaByIndex(prev => {
                                    const next = [...prev]
                                    next[i] = { ...(next[i] || {}), ...metaNew }
                                    return next
                                  })
                                  updateHistoryMeta(val, metaNew)
                                }}
                              />
                              <div className={`mt-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {videoMetaByIndex[i]?.width && videoMetaByIndex[i]?.height ? (<span>分辨率：{videoMetaByIndex[i]!.width}×{videoMetaByIndex[i]!.height}；</span>) : null}
                                {videoMetaByIndex[i]?.duration ? (<span>时长：{formatDuration(videoMetaByIndex[i]!.duration)}；</span>) : null}
                                {videoMetaByIndex[i]?.createdAt ? (<span>生成时间：{formatTime(videoMetaByIndex[i]!.createdAt)}</span>) : null}
                                {videoMetaByIndex[i]?.sizeBytes ? (<span>；大小：{(videoMetaByIndex[i]!.sizeBytes!/1024/1024).toFixed(2)} MB</span>) : null}
                                {videoMetaByIndex[i]?.contentType ? (<span>；类型：{videoMetaByIndex[i]!.contentType}</span>) : null}
                              </div>
                            </div>
                          ) : (
                            <div className={`mt-2 text-xs break-all ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{val}</div>
                          )
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
          <div className={`rounded-2xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 mt-6`}>
            <div className="font-bold mb-3 flex items-center justify-between">
              <span>AI建议</span>
              <button onClick={regenerateDirections} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>刷新建议</button>
            </div>
            {aiDirections.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {aiDirections.map((d, i) => (
                  <button key={i} onClick={() => applyDirection(d)} className={`text-xs px-3 py-1 rounded-full border ${isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                    {d}
                  </button>
                ))}
              </div>
            ) : (
              <div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm flex items-center gap-2`}>
                <span>点击“注入灵感”以获取建议</span>
                <button onClick={startGeneration} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>快速注入灵感</button>
              </div>
            )}
            <div className="font-bold mb-2">AI文案</div>
            <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm whitespace-pre-wrap min-h-24`}>{aiText}</div>
            <div className="mt-2 flex gap-2 flex-wrap">
              <button onClick={async () => { const base = aiText.trim() ? aiText : prompt.trim(); if (!base) { toast.warning('请先生成文案或填写提示'); return } try { const r = await voiceService.synthesize(base, { format: 'mp3' }); setTtsUrl(r.audioUrl) } catch (e: any) { toast.error(e?.message || '朗读失败') } }} className="text-sm px-3 py-1 rounded-md bg-green-600 text-white min-h-[44px]">朗读</button>
              <button onClick={() => { const text = aiText.trim(); if (!text) { toast.warning('暂无可复制的文案'); return } try { navigator.clipboard.writeText(text); toast.success('已复制文案'); } catch { toast.error('复制失败'); } }} className={`text-sm px-3 py-1 rounded-md ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>复制文案</button>
              <button onClick={() => { const text = aiText.trim(); if (!text) { toast.warning('暂无文案可插入'); return } setPrompt(text); toast.success('已插入到输入框'); }} className={`text-sm px-3 py-1 rounded-md ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>插入到输入框</button>
              <button onClick={() => { if (!aiText.trim()) { toast.warning('暂无文案可保存'); return } try { const raw = localStorage.getItem('NEO_COPY_HISTORY'); const arr = raw ? JSON.parse(raw) : []; const entry = { id: Date.now(), text: aiText.trim() }; const next = [entry, ...arr].slice(0, 50); localStorage.setItem('NEO_COPY_HISTORY', JSON.stringify(next)); toast.success('已保存到本地'); } catch { toast.error('保存失败'); } }} className={`text-sm px-3 py-1 rounded-md ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>保存文案</button>
              <button onClick={() => { setAiText(''); toast.success('已清空文案'); }} className={`text-sm px-3 py-1 rounded-md ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>清空文案</button>
              {ttsUrl && (<audio controls src={ttsUrl} className="w-full" />)}
            </div>
            {isGenerating && (<div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs mt-2`}>生成中…</div>)}
          </div>
          {videoHistory.length > 0 && (
            <div className={`rounded-2xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 md:p-6`}>
              <div className="font-bold mb-3">视频历史</div>
              <div className="space-y-4">
                {videoHistory.slice(0, 10).map((h, idx) => (
                  <div key={idx} className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={h.thumb || h.image} alt="thumb" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs break-all text-blue-600">
                          <a href={h.url} target="_blank" rel="noreferrer" className="underline" title={h.url}>{shortenUrl(h.url)}</a>
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} flex flex-wrap gap-x-2 gap-y-1`}>
                          {formatResolution(h.width, h.height) && <span>分辨率：{formatResolution(h.width, h.height)}</span>}
                          {formatDuration(h.duration) && <span>时长：{formatDuration(h.duration)}</span>}
                          {formatTime(h.createdAt) && <span>生成时间：{formatTime(h.createdAt)}</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button className={`px-2 py-0.5 rounded transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`} onClick={() => { try { navigator.clipboard.writeText(h.url); toast.success('已复制链接') } catch {} }}>复制</button>
                        <button className={`px-2 py-0.5 rounded transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`} onClick={() => { try { window.open(h.url, '_blank') } catch {} }}>打开</button>
                        <a className={`px-2 py-0.5 rounded transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`} href={`${apiBase ? `${apiBase}` : ''}/api/proxy/video?url=${encodeURIComponent(h.url)}`} download>下载</a>
                        <button className={`px-2 py-0.5 rounded transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`} onClick={() => setHistoryPreviewOpen(prev => ({ ...prev, [h.url]: !prev[h.url] }))}>{historyPreviewOpen[h.url] ? '收起预览' : '预览'}</button>
                      </div>
                    </div>
                    {historyPreviewOpen[h.url] && (
                      <div className="mt-2 w-full">
                        <video controls src={`${apiBase ? `${apiBase}` : ''}/api/proxy/video?url=${encodeURIComponent(h.url)}`} className="w-full max-w-sm rounded" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <button className={`text-xs px-3 py-1 rounded transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`} onClick={() => { setVideoHistory([]); try { localStorage.removeItem('NEO_VIDEO_HISTORY') } catch {} }}>清空历史</button>
              </div>
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
