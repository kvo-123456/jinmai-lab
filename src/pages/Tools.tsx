import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'

import GradientHero from '../components/GradientHero'
import Footer from '@/components/Footer'
import { TianjinTag, TianjinDivider, TianjinButton } from '@/components/TianjinStyleComponents'
import { llmService } from '@/services/llmService'
import voiceService from '@/services/voiceService'
import { toast } from 'sonner'

export default function Tools() {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [aiDirections, setAiDirections] = useState<string[]>([])
  const [aiText, setAiText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [culturalElements, setCulturalElements] = useState<string[]>([])
  const [ttsUrl, setTtsUrl] = useState<string>('')
  const [ttsLoading, setTtsLoading] = useState<boolean>(false)
  const [fusionMode, setFusionMode] = useState<boolean>(false)
  const [restored, setRestored] = useState<boolean>(false)
  const abortRef = useRef<AbortController | null>(null)
  const [ttsOpts, setTtsOpts] = useState<{ voice: string; speed: number; pitch: number }>({ voice: 'female', speed: 1, pitch: 0 })
  const [savedPlans, setSavedPlans] = useState<Array<{ id: string; title: string; query: string; aiText: string; ts: number }>>([])

  const tools = [
    { id: 'sketch', title: '一键国潮设计', description: '自动生成国潮风格设计方案', icon: 'palette', color: 'purple' },
    { id: 'pattern', title: '文化资产嵌入', description: '智能嵌入传统文化元素与纹样', icon: 'gem', color: 'yellow' },
    { id: 'filter', title: 'AI滤镜', description: '增强作品表现力的独特滤镜', icon: 'filter', color: 'blue' },
    { id: 'trace', title: '文化溯源', description: '设计中文化元素来源的提示', icon: 'book', color: 'green' },
  ]
  const toolStats: Record<string, number> = {
    sketch: 1280,
    pattern: 940,
    filter: 1560,
    trace: 820,
  }
  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
  }
  const abVariant = new URLSearchParams(location.search).get('ab') || ''
  const displayTools = activeFilters.length === 0 ? tools : tools.filter(t => activeFilters.some(f => t.title.includes(f) || t.description.includes(f)))
  // 中文注释：工具优势与示例提示词（用于“了解详情”展开内容）
  const toolBenefits: Record<string, string[]> = {
    sketch: ['国潮配色智能推荐', '经典构图模板套用', '风格统一与对齐'],
    pattern: ['元素检索与智能嵌入', '纹样冲突检测提示', '一键生成应用位图'],
    filter: ['风格滤镜一键切换', '参数可控与批量应用', '快速预览省时省力'],
    trace: ['元素来源溯源提示', '文化语境辅注与解释', '版权风险友好提醒'],
  }
  const samplePrompts: Record<string, string> = {
    sketch: '杨柳青年画·包装焕新·国潮风格·红蓝主色·细腻纹理',
    pattern: '将回纹与祥云纹样嵌入现代海报·保留传统比例与间距',
    filter: '为插画应用“东方美学”滤镜·提升色彩层次与光影质感',
    trace: '说明海河主题海报里的文化元素来源，并给出参考链接',
  }
  // 中文注释：轻量事件埋点（通过浏览器事件分发，后续可被监听器消费）
  const track = (name: string, detail?: any) => { try { window.dispatchEvent(new CustomEvent(name, { detail })) } catch {} }
  // 中文注释：A/B 参数控制（如：cta_outline / details_open）
  const expandAll = abVariant === 'details_open'
  const [expandedTool, setExpandedTool] = useState<string | null>(expandAll ? 'all' : null)

  const generateSuggestions = async () => {
    const base = query.trim() || '天津传统文化 创意工具 推荐'
    setIsGenerating(true)
    try {
      const dirs = llmService.generateCreativeDirections(base)
      setAiDirections(dirs)
      const elems = llmService.recommendCulturalElements(base)
      setCulturalElements(elems)
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      await llmService.generateResponse(base, { onDelta: (chunk: string) => setAiText(chunk), signal: abortRef.current.signal })
      try {
        const payload = { query: base, dirs, elems, ts: Date.now() }
        localStorage.setItem('TOOLS_LAST_RECOMMEND', JSON.stringify(payload))
      } catch {}
    } catch {}
    setIsGenerating(false)
  }

  const toggleFilter = (f: string) => {
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  const clearFilters = () => {
    setActiveFilters([])
  }

  const helperRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const inspireTriggeredRef = useRef<boolean>(false) // 中文注释：避免在开发模式下重复触发灵感生成
  
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const paramQuery = params.get('query') || ''
    const mode = params.get('mode') || ''
    const from = params.get('from') || ''
    if (paramQuery) {
      setQuery(paramQuery)
    }
    if (from === 'home') {
      helperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (mode === 'inspire' && !inspireTriggeredRef.current) {
      inspireTriggeredRef.current = true
      generateSuggestions()
    }
    if (!restored) {
      try {
        const raw = localStorage.getItem('TOOLS_LAST_RECOMMEND')
        if (raw) {
          const obj = JSON.parse(raw)
          if (obj?.query) setQuery(obj.query)
          if (Array.isArray(obj?.dirs)) setAiDirections(obj.dirs)
          if (Array.isArray(obj?.elems)) setCulturalElements(obj.elems)
        }
        const ttsRaw = localStorage.getItem('TOOLS_TTS_OPTS')
        if (ttsRaw) {
          const o = JSON.parse(ttsRaw)
          if (o && typeof o === 'object') setTtsOpts({ voice: o.voice || 'female', speed: Number(o.speed) || 1, pitch: Number(o.pitch) || 0 })
        }
        const plansRaw = localStorage.getItem('TOOLS_SAVED_PLANS')
        if (plansRaw) {
          const arr = JSON.parse(plansRaw)
          if (Array.isArray(arr)) setSavedPlans(arr)
        }
      } catch {}
      setRestored(true)
    }
  }, [location.search])

  const randomInspiration = () => {
    const subjects = ['杨柳青年画', '景德镇瓷器', '同仁堂品牌', '回纹几何', '海河文化']
    const actions = ['包装焕新', '联名企划', '插画风格', '导视系统', 'KV设计']
    const styles = ['国潮', '极简', '东方美学', '现代主义', '复古潮']
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
    const q = `${pick(subjects)}·${pick(actions)}·${pick(styles)}`
    setQuery(q)
    generateSuggestions()
  }

  const restoreLast = () => {
    try {
      const raw = localStorage.getItem('TOOLS_LAST_RECOMMEND')
      if (!raw) return
      const obj = JSON.parse(raw)
      if (obj?.query) setQuery(obj.query)
      if (Array.isArray(obj?.dirs)) setAiDirections(obj.dirs)
      if (Array.isArray(obj?.elems)) setCulturalElements(obj.elems)
      toast.success('已恢复上次推荐')
    } catch (e: any) {
      toast.error(e?.message || '恢复失败')
    }
  }

  const sharePlan = async () => {
    const baseText = (query || aiText).trim()
    const url = new URL(window.location.href)
    url.searchParams.set('query', baseText || '创作灵感')
    url.searchParams.set('mode', 'inspire')
    const shareUrl = url.toString()
    try { await navigator.clipboard.writeText(shareUrl); toast.success('分享链接已复制') } catch { toast.info(shareUrl) }
  }

  const saveCurrentPlan = () => {
    const text = (aiText || '').trim()
    const q = (query || '').trim()
    if (!text && !q) { toast.warning('暂无可保存内容'); return }
    const title = text.split('\n')[0] || q || '未命名方案'
    const id = String(Date.now())
    const item = { id, title, query: q, aiText: text, ts: Date.now() }
    const next = [item, ...savedPlans].slice(0, 20)
    setSavedPlans(next)
    try { localStorage.setItem('TOOLS_SAVED_PLANS', JSON.stringify(next)); toast.success('已保存到“我的方案”') } catch {}
  }

  const applyPlanToCreate = (planId: string) => {
    const p = savedPlans.find(x => x.id === planId)
    if (!p) return
    const content = p.aiText || p.query
    const url = `/create?from=tools&prompt=${encodeURIComponent(content)}`
    navigate(url)
  }

  const removePlan = (planId: string) => {
    const next = savedPlans.filter(x => x.id !== planId)
    setSavedPlans(next)
    try { localStorage.setItem('TOOLS_SAVED_PLANS', JSON.stringify(next)) } catch {}
  }

  const clearPlans = () => {
    setSavedPlans([])
    try { localStorage.removeItem('TOOLS_SAVED_PLANS'); toast.success('已清空“我的方案”') } catch {}
  }

  return (
    <>
      <main className="relative container mx-auto px-6 md:px-8 py-12">
        <div className={`pointer-events-none absolute -top-10 -left-10 w-64 h-64 bg-gradient-to-br ${fusionMode ? 'from-indigo-500/20 via-fuchsia-500/20 to-amber-400/20' : 'from-blue-500/20 via-red-500/20 to-yellow-500/20'} blur-3xl rounded-full`}></div>
        <div className={`pointer-events-none absolute -bottom-10 -right-10 w-72 h-72 bg-gradient-to-tr ${fusionMode ? 'from-cyan-500/15 via-indigo-500/15 to-fuchsia-500/15' : 'from-red-500/15 via-yellow-500/15 to-blue-500/15'} blur-3xl rounded-full`}></div>
        {fusionMode && (
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          ></div>
        )}
        {/* 中文注释：统一使用通用渐变英雄组件，增强视觉一致性 */}
        <GradientHero
          title="创作工具"
          subtitle="面向传统文化创新的低门槛 AI 工具集"
          badgeText="Beta"
          theme={fusionMode ? 'indigo' : 'red'}
          variant={fusionMode ? 'split' : 'center'}
          size={fusionMode ? 'lg' : 'md'}
          pattern={fusionMode}
          stats={[
            { label: '精选', value: '优选' },
            { label: '风格', value: '融合' },
            { label: '效率', value: '提升' },
            { label: '协作', value: '共创' },
          ]}
        />

        <div className={`rounded-2xl p-[1px] bg-gradient-to-br ${fusionMode ? 'from-indigo-500/25 via-fuchsia-500/25 to-cyan-500/25' : 'from-blue-500/25 via-red-500/25 to-yellow-500/25'} mb-8`}>
          {/* 中文注释：将内部容器改为 <section>，增强语义与可访问性 */}
          <section
            ref={helperRef}
            aria-labelledby="tools-helper-title"
            aria-busy={isGenerating}
            onDragOver={(e) => { e.preventDefault() }}
            onDrop={async (e) => { e.preventDefault(); const files = Array.from(e.dataTransfer.files || []); const audio = files.find(f => f.type.startsWith('audio/')); if (!audio) return; try { const t = await voiceService.transcribeAudio(audio as File); setQuery(t); await generateSuggestions() } catch (err: any) { toast.error(err?.message || '语音识别失败') } }}
            className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm backdrop-blur-sm`}
          >
            <h2 id="tools-helper-title" className="font-bold mb-3 text-lg">AI工具助手</h2>
            {/* 中文注释：新增控制区，支持融合模式切换、随机灵感与恢复 */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <motion.button type="button" whileHover={{ scale: 1.03 }} onClick={() => setFusionMode(v => !v)} className={`px-3 py-1.5 rounded-lg ${fusionMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : (isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')} focus:outline-none focus:ring-2 ${fusionMode ? 'focus:ring-indigo-500' : (isDark ? 'focus:ring-gray-500' : 'focus:ring-gray-400')} focus:ring-offset-2`}>{fusionMode ? '融合模式：开' : '融合模式：关'}</motion.button>
              <motion.button type="button" whileHover={{ scale: 1.03 }} onClick={randomInspiration} className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} focus:ring-offset-2`}>随机灵感</motion.button>
              <motion.button type="button" whileHover={{ scale: 1.03 }} onClick={restoreLast} className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} focus:ring-offset-2`}>恢复上次推荐</motion.button>
            </div>
            {/* 中文注释：使用 form 以支持 Enter 提交并触发智能推荐 */}
            <form
              onSubmit={(e) => { e.preventDefault(); generateSuggestions() }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"
              aria-describedby="query-helper"
            >
              <label htmlFor="query-input" className="sr-only">创作需求或风格</label>
              <input
                id="query-input"
                name="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); generateSuggestions() } }}
                placeholder="输入创作需求或风格，智能推荐合适工具"
                aria-label="创作需求或风格"
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-offset-gray-800' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px] text-base`}
                autoCapitalize="none"
                autoCorrect="off"
                enterKeyHint="search"
                inputMode="text"
              />
              <p id="query-helper" className="sr-only">输入您的创作需求或风格以获得智能推荐</p>
              <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                {/* 中文注释：将按钮设为 submit，配合 form 支持键盘回车 */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  aria-controls="ai-output"
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex-1 md:flex-none"
                >
                  智能推荐
                </motion.button>
                {isGenerating && (
                  <motion.button type="button" whileHover={{ scale: 1.03 }} onClick={() => { abortRef.current?.abort(); setIsGenerating(false) }} className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} focus:ring-offset-2 min-h-[44px] flex-1 md:flex-none`}>停止生成</motion.button>
                )}
                {activeFilters.length > 0 && (
                  <motion.button type="button" whileHover={{ scale: 1.03 }} onClick={clearFilters} className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} focus:ring-offset-2 min-h-[44px] flex-1 md:flex-none`}>清除筛选</motion.button>
                )}
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} focus:ring-offset-2 min-h-[44px] flex-1 md:flex-none`}
                  aria-label="上传音频识别"
                >
                  上传音频识别
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const t = await voiceService.transcribeAudio(f); setQuery(t); await generateSuggestions() } catch (err: any) { toast.error(err?.message || '语音识别失败') } }}
                />
              </div>
            </form>
            {aiDirections.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {aiDirections.map((d, i) => (
                  <button key={i} onClick={() => toggleFilter(d)} className={`text-xs px-3 py-1 rounded-full border ${isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>{d}</button>
                ))}
              </div>
            ) : (
              <div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm`}>点击“智能推荐”获得建议与筛选词</div>
            )}
            {culturalElements.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {culturalElements.map((d, i) => (
                  <button key={i} onClick={() => toggleFilter(d)} className={`text-xs px-3 py-1 rounded-full border ${isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>{d}</button>
                ))}
              </div>
            )}
            <div className="font-bold mb-2">AI建议</div>
            {/* 中文注释：用 output + role=status，指定 id 以供按钮 aria-controls 关联 */}
            <output id="ai-output" role="status" aria-live="polite" className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm whitespace-pre-wrap min-h-[5rem]`}>{aiText || (isGenerating ? '' : '暂无AI建议，请点击“智能推荐”或输入您的创作需求')}</output>
            <div className="mt-2 flex items-center gap-2">
              {/* 中文注释：增加朗读控制选项，支持语音、语速、音调设置 */}
              <motion.button whileHover={{ scale: 1.03 }} disabled={ttsLoading || !aiText.trim()} onClick={async () => { if (!aiText.trim()) { toast.warning('暂无可朗读内容'); return } try { setTtsLoading(true); const r = await voiceService.synthesize(aiText, { voice: ttsOpts.voice, speed: ttsOpts.speed, pitch: ttsOpts.pitch, format: 'mp3' }); setTtsUrl(r.audioUrl) } catch (e: any) { toast.error(e?.message || '朗读失败') } finally { setTtsLoading(false) } }} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]">{ttsLoading ? '朗读中…' : '朗读建议'}</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} disabled={!aiText.trim()} onClick={async () => { try { await navigator.clipboard.writeText(aiText); toast.success('建议已复制') } catch { toast.error('复制失败') } }} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]`}>复制建议</motion.button>
              {/* 中文注释：清空建议与音频，便于重新生成 */}
              <motion.button whileHover={{ scale: 1.03 }} type="button" disabled={!aiText.trim() && !ttsUrl} onClick={() => { setAiText(''); setTtsUrl(''); toast.success('已清空建议') }} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]`}>清空建议</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} type="button" onClick={sharePlan} className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 min-h-[44px]">分享方案</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} type="button" onClick={saveCurrentPlan} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-gray-500' : 'focus:ring-gray-400'} focus:ring-offset-2 min-h-[44px]`}>保存为我的方案</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} onClick={() => navigate(`/create?from=tools&prompt=${encodeURIComponent(aiText || query)}`)} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]">应用到创作中心</motion.button>
            </div>
            {/* 中文注释：朗读控制面板，调节语音/语速/音调，并记住设置 */}
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <label className="flex items-center gap-2">语音
                <select value={ttsOpts.voice} onChange={(e) => { const v = e.target.value; const next = { ...ttsOpts, voice: v }; setTtsOpts(next); try { localStorage.setItem('TOOLS_TTS_OPTS', JSON.stringify(next)) } catch {} }} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border rounded px-2 py-1 flex-1`}>
                  <option value="female">女声</option>
                  <option value="male">男声</option>
                </select>
              </label>
              <label className="flex items-center gap-2">语速
                <input type="range" min={0.6} max={1.4} step={0.05} value={ttsOpts.speed} onChange={(e) => { const s = Number(e.target.value); const next = { ...ttsOpts, speed: s }; setTtsOpts(next); try { localStorage.setItem('TOOLS_TTS_OPTS', JSON.stringify(next)) } catch {} }} className="flex-1" />
                <span>{ttsOpts.speed.toFixed(2)}</span>
              </label>
              <label className="flex items-center gap-2">音调
                <input type="range" min={-4} max={4} step={1} value={ttsOpts.pitch} onChange={(e) => { const p = Number(e.target.value); const next = { ...ttsOpts, pitch: p }; setTtsOpts(next); try { localStorage.setItem('TOOLS_TTS_OPTS', JSON.stringify(next)) } catch {} }} className="flex-1" />
                <span>{ttsOpts.pitch}</span>
              </label>
            </div>
            {/* 中文注释：我的方案列表，支持应用、复制与删除管理 */}
            {savedPlans.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold">我的方案</div>
                  <button onClick={clearPlans} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-2 py-1 rounded text-xs`}>清空</button>
                </div>
                <ul className="space-y-2">
                  {savedPlans.map(p => (
                    <li key={p.id} className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded p-2`}> 
                      <div className="text-sm font-medium mb-1">{p.title}</div>
                      <div className="flex gap-2">
                        <button onClick={() => applyPlanToCreate(p.id)} className="px-2 py-1 rounded text-xs bg-blue-600 text-white">应用到创作中心</button>
                        <button onClick={async () => { try { await navigator.clipboard.writeText(p.aiText || p.query); toast.success('方案已复制') } catch { toast.error('复制失败') } }} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-2 py-1 rounded text-xs`}>复制</button>
                        <button onClick={() => removePlan(p.id)} className="px-2 py-1 rounded text-xs bg-red-600 text-white">删除</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ttsUrl && (<audio controls src={ttsUrl} className="mt-2 w-full" />)}
            {isGenerating && (<div role="status" aria-live="polite" className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs mt-2`}>生成中…</div>)}
          </section>
        </div>

        <h2 className="text-xl font-bold mb-6">推荐创作工具</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 will-change-transform">
          {displayTools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * index }}
              whileHover={{ y: -3, scale: 1.01 }}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/create?tool=${tool.id}`) } }}
              onClick={() => navigate(`/create?tool=${tool.id}`)}
              aria-label={`${tool.title} 卡片`}
              role="button"
              className="cursor-pointer"
            >
              <div className="rounded-2xl p-[1px] bg-gradient-to-br from-blue-500/25 via-red-500/25 to-yellow-500/25">
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm backdrop-blur-sm`}> 
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <motion.div 
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${tool.color === 'purple' ? 'bg-purple-100 text-purple-600' : tool.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' : tool.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}
                        whileHover={{ rotate: 5 }}
                      >
                        <i className={`fas fa-${tool.icon}`}></i>
                      </motion.div>
                      <TianjinTag color={tool.color as any}>{tool.title}</TianjinTag>
                    </div>
                    <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs`}>精选工具</span>
                  </div>
                  <h3 id={`tool-${tool.id}-title`} className="font-bold mb-2">{tool.title}</h3>
                  <p id={`tool-${tool.id}-desc`} className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tool.description}</p>
                  <div className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs mb-4 flex items-center gap-1`}>
                    <i className="far fa-user"></i>
                    <span>近7天使用 {formatCount(toolStats[tool.id])}+ </span>
                  </div>
                  {/* 中文注释：卡片详情展开区（验证“Prove/证明”与“减少认知负担”的假设） */}
                  {expandedTool === tool.id || expandedTool === 'all' ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4">
                      <ul className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm space-y-1`} aria-label="优势列表">
                        {(toolBenefits[tool.id] || []).map((b, i) => (
                          <li key={i} className="flex items-center"><i className="fas fa-check-circle text-green-500 mr-2"></i>{b}</li>
                        ))}
                      </ul>
                      <div className="mt-2 text-xs opacity-80">示例提示词：{samplePrompts[tool.id]}</div>
                      <div className="mt-2 flex gap-2">
                        <TianjinButton 
                          variant="ghost" 
                          size="sm"
                          onClick={async () => { try { await navigator.clipboard.writeText(samplePrompts[tool.id]); track('tools:copy_prompt', { tool: tool.id }); } catch {} }}
                        >
                          复制示例提示词
                        </TianjinButton>
                        <TianjinButton 
                          variant="secondary" 
                          size="sm"
                          onClick={() => { navigate(`/create?tool=${tool.id}&prompt=${encodeURIComponent(samplePrompts[tool.id])}`); track('tools:apply_prompt', { tool: tool.id }); }}
                        >
                          一键应用到创作
                        </TianjinButton>
                      </div>
                    </motion.div>
                  ) : null}
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <TianjinButton 
                      onClick={() => { track('tools:cta_click', { tool: tool.id }); navigate(`/create?tool=${tool.id}`) }} 
                      ariaLabel={`立即使用 ${tool.title}`}
                      variant={abVariant === 'cta_outline' ? 'secondary' : 'primary'}
                      rightIcon={<i className="fas fa-arrow-right text-xs"></i>}
                      fullWidth
                    >
                      立即使用
                    </TianjinButton>
                  </motion.div>
                  <div className="mt-2">
                    <TianjinButton 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setExpandedTool(prev => (prev === tool.id ? null : tool.id))}
                      aria-expanded={expandedTool === tool.id || expandedTool === 'all'}
                    >
                      {expandedTool === tool.id || expandedTool === 'all' ? '收起详情' : '了解详情'}
                    </TianjinButton>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <TianjinDivider />
      </main>
      <Footer variant="simple" simpleText="© 2025 AI共创平台" />
    </>
  )
}
