import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { generateImage, pollVideoTask, createVideoTask } from '@/services/doubao'
import doubao from '@/services/doubao'
import errorService from '@/services/errorService'
import voiceService from '@/services/voiceService'
import { llmService } from '@/services/llmService'

import { TianjinImage } from '@/components/TianjinStyleComponents'
// 中文注释：将页面包裹在统一的侧边栏布局组件中，获得顶部导航与搜索

export default function Generation() {
  const { isDark } = useTheme()
  const location = useLocation()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [variants, setVariants] = useState<Array<{ script: string; image: string; video: string }>>([])
  const [audioSrc, setAudioSrc] = useState<string>('')
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [aiText, setAiText] = useState('')
  const [aiDirections, setAiDirections] = useState<string[]>([])
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false)
  // 中文注释：新增多模态图片问答所需的图片URL与模型选择
  const [vqaUrl, setVqaUrl] = useState('https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg')
  const [modelId, setModelId] = useState<'kimi' | 'doubao'>(llmService.getCurrentModel().id as any)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const aiCopyRef = useRef<HTMLDivElement | null>(null)
  const variantsRef = useRef<HTMLDivElement | null>(null)
  const [saveToTutorialId, setSaveToTutorialId] = useState<number | null>(null)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search)
      const p = params.get('prompt') || ''
      const img = params.get('image') || ''
      const autostart = params.get('autostart') || ''
      const saveId = params.get('saveToTutorialId') || ''
      if (p) setPrompt(p)
      if (img) {
        setVariants([{ script: p ? `根据提示生成：${p}` : '教程封面生成视频', image: img, video: '' }])
        if (autostart) {
          setTimeout(() => genVideo(0), 100)
        }
      }
      if (saveId) {
        const n = Number(saveId)
        if (!Number.isNaN(n)) setSaveToTutorialId(n)
      }
    } catch {}
  }, [location.search])
  const genVideo = async (idx: number) => {
    const v = variants[idx]
    if (!v || !v.image) return
    if (v.image.startsWith('data:')) {
      toast.error('首帧为本地数据，需使用可公网访问的图片URL')
      return
    }
    const text = `${prompt}  --resolution 720p  --duration 5 --camerafixed false`
    setVariants((arr) => arr.map((it, i) => (i === idx ? { ...it, video: '生成中...' } : it)))
    try {
      const created = await createVideoTask({ model: 'doubao-seedance-1-0-pro-250528', content: [{ type: 'text', text }, { type: 'image_url', image_url: { url: v.image } }] })
      if (!created.ok || !created.data?.id) {
        const code = (created as any)?.error || (created as any)?.data?.error?.code || 'UNKNOWN'
        const msg = (created as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : `创建视频任务失败：${code}`
        toast.error(msg)
        setVariants((arr) => arr.map((it, i) => (i === idx ? { ...it, video: `视频生成失败：${code}` } : it)))
        return
      }
      const taskId = created.data.id
      const polled = await pollVideoTask(taskId, { intervalMs: 10000, timeoutMs: 600000 })
      if (!polled.ok) {
        const code = (polled as any)?.error || (polled as any)?.data?.error?.code || 'UNKNOWN'
        const msg = (polled as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : `查询视频任务失败：${code}`
        toast.error(msg)
        setVariants((arr) => arr.map((it, i) => (i === idx ? { ...it, video: `视频生成失败：${code}` } : it)))
        return
      }
      const status = polled.data?.status
      const url = polled.data?.content?.video_url || ''
      if (status === 'succeeded' && url) {
        setVariants((arr) => arr.map((it, i) => (i === idx ? { ...it, video: url } : it)))
        toast.success('视频生成完成')
        try {
          if (saveToTutorialId && url) {
            const raw = localStorage.getItem('TUTORIAL_VIDEO_OVERRIDES')
            const obj = raw ? JSON.parse(raw) : {}
            obj[saveToTutorialId] = url
            localStorage.setItem('TUTORIAL_VIDEO_OVERRIDES', JSON.stringify(obj))
            toast.success('已写入教程视频覆盖')
          }
        } catch {}
      } else {
        const code = polled.data?.error?.code || polled.data?.error?.message || polled.data?.status || 'UNKNOWN'
        toast.error(`视频生成失败：${code}`)
        setVariants((arr) => arr.map((it, i) => (i === idx ? { ...it, video: `视频生成失败：${code}` } : it)))
      }
    } catch (e: any) {
      errorService.logError(e instanceof Error ? e : 'SERVER_ERROR', { scope: 'generation-video', prompt })
      toast.error('视频生成异常')
      setVariants((arr) => arr.map((it, i) => (i === idx ? { ...it, video: '视频生成失败' } : it)))
    }
  }
  // 中文注释：生图函数支持传入文本；未传入时使用输入框中的提示词
  const gen = async (text?: string) => {
    const base = (text ?? prompt).trim()
    if (!base) {
      toast.warning('请输入提示词')
      return
    }
    setLoading(true)
    try {
      const resp = await generateImage({ prompt: base, n: 3, size: '1024x1024', response_format: 'url' })
      if (!resp.ok) {
        errorService.logError(resp.error || 'SERVER_ERROR', { scope: 'generation', prompt })
        toast.error('生成失败，已回退为占位图')
        setVariants([
          { script: '占位方案A', image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20design%20A', video: '方案A视频占位' },
          { script: '占位方案B', image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20design%20B', video: '方案B视频占位' },
          { script: '占位方案C', image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20design%20C', video: '方案C视频占位' }
        ])
        setLoading(false)
        return
      }
      const data: any = resp.data
      const items: any[] = (data && (data.data || data.images || [])) as any[]
      if (!items.length) {
        toast.info('接口无返回内容，已提供占位图')
        setVariants([
          { script: '占位方案A', image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20design%20A', video: '方案A视频占位' },
          { script: '占位方案B', image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20design%20B', video: '方案B视频占位' },
          { script: '占位方案C', image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20design%20C', video: '方案C视频占位' }
        ])
        setLoading(false)
        return
      }
      const imgs = items.map((it: any, idx: number) => {
        const url = it.url ? it.url : (it.b64_json ? `data:image/png;base64,${it.b64_json}` : '')
        return {
          script: `方案${String.fromCharCode(65 + idx)}脚本`,
          image: url,
          video: ''
        }
      })
      setVariants(imgs)
      toast.success('生成完成')
    } catch (e: any) {
      errorService.logError(e instanceof Error ? e : 'SERVER_ERROR', { scope: 'generation', prompt })
      toast.error('生成异常，已回退为占位图')
      setVariants([
        { script: '占位方案A', image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20design%20A', video: '方案A视频占位' },
        { script: '占位方案B', image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20design%20B', video: '方案B视频占位' },
        { script: '占位方案C', image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20design%20C', video: '方案C视频占位' }
      ])
    } finally {
      setLoading(false)
    }
  }
  // 中文注释：页面进入后自动生成三张方案，如无提示词则使用默认“天津文化设计灵感”
  useEffect(() => {
    if (variants.length === 0) {
      const defaultPrompt = prompt.trim() || '天津文化设计灵感'
      if (!prompt.trim()) setPrompt(defaultPrompt)
      gen(defaultPrompt)
      // 中文注释：自动生成AI文案与朗读，避免初次进入时“朗读”按钮不可点击
      setTimeout(() => optimizeAndRead(defaultPrompt), 300)
    }
    // 仅在首次进入执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const speakScript = async (idx: number) => {
    const v = variants[idx]
    if (!v?.script) { toast.warning('暂无脚本可朗读'); return }
    try {
      const r = await voiceService.synthesize(v.script, { format: 'mp3' })
      setAudioSrc(r.audioUrl)
      setPlayingIndex(idx)
    } catch (e: any) {
      toast.error(e?.message || '朗读失败')
    }
  }
  const optimizeAndRead = async (src?: string) => {
    const base = (src ?? prompt).trim()
    if (!base) { toast.warning('请输入提示词'); return }
    setIsGeneratingCopy(true)
    setAiText('')
    try {
      // 中文注释：根据用户输入生成创意方向，并调用当前模型（Kimi/豆包）生成文案
      llmService.setCurrentModel(modelId)
      const dirs = llmService.generateCreativeDirections(base)
      setAiDirections(dirs)
      const zhPolicy = '请用中文分点回答，去除所有 Markdown 标题或装饰符（如###、####、** 等），每点保持简短清晰。'
      const enLetters = (base.match(/[A-Za-z]/g) || []).length
      const zhChars = (base.match(/[\u4e00-\u9fa5]/g) || []).length
      const isEnglish = enLetters > zhChars && enLetters > 0
      const promptWithPolicy = isEnglish ? base : `${zhPolicy}\n\n${base}`
      const final = await llmService.generateResponse(promptWithPolicy, { onDelta: (chunk: string) => setAiText((prev) => prev + chunk) })
      setAiText((prev) => final || prev)
      const text = final || aiText || base
      const r = await voiceService.synthesize(text, { format: 'mp3' })
      setAudioSrc(r.audioUrl)
      setPlayingIndex(null)
    } catch (e: any) {
      toast.error(e?.message || '优化或朗读失败')
    } finally {
      setIsGeneratingCopy(false)
    }
  }
  const runDoubaoVqa = async () => {
    // 中文注释：调用豆包多模态对话接口，基于图片进行问答
    const url = String(vqaUrl || '').trim()
    if (!url) { toast.warning('请填写可公网访问的图片URL'); return }
    try {
      const r = await doubao.chatCompletions({
        messages: [
          { role: 'user', content: [
            { type: 'image_url', image_url: { url } },
            { type: 'text', text: '图片主要讲了什么?' }
          ]}
        ],
        max_tokens: 512
      })
      if (!(r as any)?.ok) {
        const err = (r as any)?.error || 'SERVER_ERROR'
        toast.error(`调用失败：${err}`)
        return
      }
      const content = (r as any)?.data?.choices?.[0]?.message?.content || ''
      setAiText(content || '（无返回内容）')
      aiCopyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      toast.success('豆包多模态问答完成')
    } catch (e: any) {
      toast.error(e?.message || '豆包调用失败，请检查服务端环境变量或网络')
    }
  }
  const parseSections = (text: string) => {
    const lines = String(text || '').split(/\r?\n/)
    const sections: Array<{ title: string; items: string[] }> = []
    let current: { title: string; items: string[] } | null = null
    for (const raw of lines) {
      let line = raw.trim()
      line = line.replace(/^#{1,6}\s*/, '')
      line = line.replace(/^```+\s*/, '')
      line = line.replace(/^>+\s*/, '')
      if (!line) continue
      const m = line.match(/^(\d+)\)\s*(.+?)：/) || line.match(/^([一二三四五六七八九十]+)\)\s*(.+?)：/)
      if (m) {
        if (current) sections.push(current)
        current = { title: m[2], items: [] }
        continue
      }
      if (!current) {
        current = { title: '说明', items: [] }
      }
      const bullet = line.replace(/^[-•]\s*/, '')
      current.items.push(bullet)
    }
    if (current) sections.push(current)
    return sections
  }

  const renderRichText = (text: string) => {
    const getIconForTitle = (t: string) => {
      const s = t || ''
      if (s.includes('诊断')) return 'search'
      if (s.includes('优化')) return 'magic'
      if (s.includes('步骤')) return 'list-check'
      if (s.includes('参考') || s.includes('风格')) return 'book-open'
      return 'pen-nib'
    }
    const sections = parseSections(text)
    if (sections.length === 0) {
      return (
        <pre className={`${isDark ? 'bg-gray-800/80 text-gray-100 ring-1 ring-gray-700' : 'bg-white/80 text-gray-800 ring-1 ring-gray-200'} whitespace-pre-wrap break-words rounded-2xl p-5 leading-relaxed shadow-md backdrop-blur-sm border border-white/40 dark:border-gray-700/40 min-h-24`}>{text}</pre>
      )
    }
    return (
      <div className="grid gap-4 md:gap-6">
        {sections.map((sec, idx) => (
          <div
            key={idx}
            className={`${isDark ? 'bg-gray-900/50 ring-1 ring-gray-700' : 'bg-white/60 ring-1 ring-gray-200'} rounded-2xl p-5 shadow-lg backdrop-blur-sm border border-white/40 dark:border-gray-700/40`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <i className={`fas fa-${getIconForTitle(sec.title)} mr-2 text-blue-600`}></i>
                <div className="font-semibold tracking-wide">{sec.title}</div>
              </div>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500 mb-3 opacity-60" />
            <ul className="grid md:grid-cols-2 gap-x-6 gap-y-2">
              {sec.items.map((raw, i) => {
                const it = String(raw || '')
                const isSubHead = /^#{1,6}\s*\d+\)\s*/.test(it) || /^#{1,6}\s*[一二三四五六七八九十]+\)\s*/.test(it)
                const cleanHead = it.replace(/^#{1,6}\s*\d+\)\s*/, '').replace(/^#{1,6}\s*[一二三四五六七八九十]+\)\s*/, '')
                const boldMatch = it.match(/^\*\*(.+?)\*\*：?(.*)$/)
                const hasBold = !!boldMatch
                const boldLabel = hasBold ? (boldMatch?.[1] || '') : ''
                const boldText = hasBold ? (boldMatch?.[2] || '') : ''
                const colonMatch = !hasBold && !isSubHead ? it.match(/^([^：:]+)[:：]\s*(.+)$/) : null
                const enumMatch = !hasBold && !isSubHead ? it.match(/^(\d+|[一二三四五六七八九十]+)[\.、]\s*(.+)$/) : null
                return (
                  <li key={i} className={isSubHead ? 'md:col-span-2 flex items-center py-1' : 'flex items-start py-1'}>
                    {isSubHead ? (
                      <>
                        <i className="fas fa-angle-right mr-2 text-blue-600" />
                        <span className={`${isDark ? 'text-gray-100' : 'text-gray-800'} text-sm font-semibold tracking-wide`}>{cleanHead}</span>
                      </>
                    ) : hasBold ? (
                      <>
                        <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200 mr-2 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">{boldLabel}</span>
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm md:text-base leading-relaxed md:leading-7 break-words max-w-[68ch]`}>{boldText}</span>
                      </>
                    ) : colonMatch ? (
                      <>
                        <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200 mr-2 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">{colonMatch[1]}</span>
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm md:text-base leading-relaxed md:leading-7 break-words max-w-[68ch]`}>{colonMatch[2]}</span>
                      </>
                    ) : enumMatch ? (
                      <>
                        <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-300 mr-2 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600">{enumMatch[1]}</span>
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm md:text-base leading-relaxed md:leading-7 break-words max-w-[68ch]`}>{enumMatch[2]}</span>
                      </>
                    ) : (
                      <>
                        <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm md:text-base leading-relaxed md:leading-7 break-words max-w-[68ch]`}>{it}</span>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    )
  }
  useEffect(() => {
    if (aiDirections.length > 0 || aiText) {
      aiCopyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [aiDirections.length, aiText])
  useEffect(() => {
    if (variants.length > 0) {
      variantsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [variants.length])
  return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">AI生成引擎</h1>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6 mb-6`}>
          <label htmlFor="prompt-input" className="mb-2 block">Midjourney风格提示</label>
          <input
            id="prompt-input"
            name="prompt"
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            aria-label="请输入提示词"
            className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
          />
          <div className="mt-4 flex gap-2">
            <motion.button whileHover={{ scale: 1.03 }} type="button" onClick={() => gen()} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>生成</motion.button>
            <motion.button whileHover={{ scale: 1.03 }} type="button" onClick={() => optimizeAndRead()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isGeneratingCopy}>优化并朗读</motion.button>
            {/* 中文注释：模型选择（Kimi/豆包），影响优化并朗读使用的后端模型 */}
            <select aria-label="选择模型" value={modelId} onChange={(e) => setModelId(e.target.value as any)} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} px-3 py-2 rounded-lg border`}>
              <option value="kimi">Kimi</option>
              <option value="doubao">豆包</option>
            </select>
          </div>
          {/* 中文注释：豆包图片问答输入与触发按钮 */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <input
              value={vqaUrl}
              onChange={(e) => setVqaUrl(e.target.value)}
              placeholder="填写可公网访问的图片URL（用于豆包图片问答）"
              className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} w-full px-4 py-2 rounded-lg border`}
            />
            <motion.button whileHover={{ scale: 1.03 }} type="button" onClick={runDoubaoVqa} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">豆包图片问答</motion.button>
          </div>
          {loading && <div role="status" aria-live="polite" className="mt-2 text-sm">生成中，预期小于30秒</div>}
          <div ref={aiCopyRef} role="region" aria-labelledby="ai-copy-title" className={`mt-4 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} ${aiText ? 'block' : 'block'}`}>
            <h2 id="ai-copy-title" className="font-medium mb-2">AI文案</h2>
            {aiDirections.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {aiDirections.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const np = (prompt ? `${prompt} ${d}` : d)
                      setPrompt(np)
                      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      optimizeAndRead(np)
                    }}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
            <div aria-live="polite" className={`text-sm`}>{renderRichText(aiText)}</div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                aria-label="朗读文案"
                onClick={async () => { const base = aiText.trim() ? aiText : prompt.trim(); if (!base) { toast.warning('请先生成文案或填写提示'); return } try { const r = await voiceService.synthesize(base, { format: 'mp3' }); setAudioSrc(r.audioUrl); setPlayingIndex(null) } catch (e: any) { toast.error(e?.message || '朗读失败') } }}
                className="text-sm px-3 py-1 rounded-md bg-green-600 text-white"
                disabled={!aiText.trim() && !prompt.trim()}
              >朗读</button>
              <button
                type="button"
                aria-label="复制文案"
                onClick={async () => { const base = aiText.trim() ? aiText : prompt.trim(); if (!base) { toast.warning('暂无可复制内容'); return } try { await navigator.clipboard.writeText(base); toast.success('文案已复制') } catch { toast.error('复制失败') } }}
                className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} text-sm px-3 py-1 rounded-md`}
              >复制文案</button>
              <button
                type="button"
                aria-label="应用到提示词"
                onClick={() => { const base = aiText.trim() ? aiText : prompt.trim(); if (!base) { toast.warning('暂无可应用内容'); return } setPrompt(base); inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}
                className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} text-sm px-3 py-1 rounded-md`}
              >应用到提示词</button>
            </div>
            {isGeneratingCopy && (<div role="status" aria-live="polite" className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs mt-2`}>生成中…</div>)}
            {audioSrc && (<audio controls src={audioSrc} className="mt-2 w-full" />)}
          </div>
        </div>
        <div ref={variantsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {variants.map((v, i) => (
            <div key={i} className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-4`}>
              <TianjinImage src={v.image} alt="variant" className="w-full h-40 object-cover rounded-lg mb-3" ratio="landscape" />
              <div className="text-sm mb-2">{v.script}</div>
              <div className="flex gap-2 mb-2">
                <motion.button whileHover={{ scale: 1.03 }} onClick={() => speakScript(i)} className="bg-green-600 text-white px-3 py-1 rounded-md">朗读脚本</motion.button>
                {playingIndex === i && audioSrc && (
                  <audio controls src={audioSrc} className="mt-1 w-full" />
                )}
              </div>
              {v.video && (
                v.video.startsWith('http') ? (
                  <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 text-sm`}>
                    <div className="flex items-center justify-between gap-2">
                      <a href={v.video} target="_blank" rel="noreferrer" className="text-blue-600">打开视频</a>
                      <button className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white' : 'bg-white ring-1 ring-gray-200'}`} onClick={async () => { try { await navigator.clipboard.writeText(v.video); toast.success('链接已复制') } catch { toast.error('复制失败') } }}>复制链接</button>
                    </div>
                    <video controls src={`/api/proxy/video?url=${encodeURIComponent(v.video)}`} className="w-full mt-2 rounded" />
                  </div>
                ) : (
                  <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 text-sm break-all`}>{v.video}</div>
                )
              )}
              <motion.button whileHover={{ scale: 1.03 }} onClick={() => genVideo(i)} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded-md">生成视频</motion.button>
            </div>
          ))}
        </div>
      </main>
  )
}
