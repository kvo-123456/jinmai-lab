import React from 'react'
import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { motion } from 'framer-motion'
import BRANDS from '@/lib/brands'
import { useWorkflow } from '@/contexts/workflowContext.tsx'
import voiceService from '@/services/voiceService'
import UploadBox from '@/components/UploadBox'
import { scoreAuthenticity } from '@/services/authenticityService'
import postService from '@/services/postService'
import { useNavigate } from 'react-router-dom'
import { llmService } from '@/services/llmService'
import { TianjinImage } from '@/components/TianjinStyleComponents'
import { toast } from 'sonner'

export default function Wizard() {
  const { isDark } = useTheme()
  const { state, setState, reset } = useWorkflow()
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const [aiText, setAiText] = useState('')
  const [aiDirections, setAiDirections] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [ttsUrl, setTtsUrl] = useState('')
  const [culturalElements, setCulturalElements] = useState<string[]>([])
  // 中文注释：右侧预览比例设置，支持横版/方形/竖版
  const [previewRatio, setPreviewRatio] = useState<'landscape' | 'square' | 'portrait'>('landscape')

  const next = () => setStep(s => Math.min(4, s + 1))
  const prev = () => setStep(s => Math.max(1, s - 1))

  const savePost = () => {
    const title = `${state.brandName || '作品'} - 生成变体`
    // 中文注释：确保缩略图不为空，优先使用变体图片或上传图片，否则用标题生成占位图
    const baseThumb = state.variants?.[0]?.image || state.imageUrl || ''
    const thumb = baseThumb || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(title)}&image_size=1024x1024`
    const p = postService.addPost({
      title,
      thumbnail: thumb,
      category: 'design',
      tags: [],
      description: '',
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: []
    })
    reset()
    navigate('/square')
    return p
  }

  const runAIHelp = async () => {
    const base = (state.inputText?.trim()) || `${state.brandName || '品牌'} 创意方向与文案`
    setIsGenerating(true)
    try {
      const dirs = llmService.generateCreativeDirections(base)
      setAiDirections(dirs)
      const elems = llmService.recommendCulturalElements(base)
      setCulturalElements(elems)
      const zhPolicy = '请用中文分点回答，避免 Markdown 标题或装饰符（如###、####、** 等），每点精炼。'
      const enLetters = (base.match(/[A-Za-z]/g) || []).length
      const zhChars = (base.match(/[\u4e00-\u9fa5]/g) || []).length
      const isEnglish = enLetters > zhChars && enLetters > 0
      const promptWithPolicy = isEnglish ? base : `${zhPolicy}\n\n${base}`
      await llmService.generateResponse(promptWithPolicy, { onDelta: (chunk: string) => setAiText(chunk) })
    } catch {}
    setIsGenerating(false)
  }

  const applyAITextToInput = () => {
    if (aiText.trim()) setState({ inputText: aiText })
  }

  return (
      <main className="relative container mx-auto px-6 md:px-8 py-12">
        <div className="pointer-events-none absolute -top-10 -left-10 w-64 h-64 bg-gradient-to-br from-blue-500/20 via-red-500/20 to-yellow-500/20 blur-3xl rounded-full"></div>
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-72 h-72 bg-gradient-to-tr from-red-500/15 via-yellow-500/15 to-blue-500/15 blur-3xl rounded-full"></div>
        <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">共创向导</h1>
            <div className="w-20 h-1 rounded-full bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500"></div>
          </div>
          <div className="text-sm">步骤 {step} / 4</div>
        </div>
        {step === 1 && (
          <motion.div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* 中文注释：将下拉选择改为“可输入+智能建议”的组合，支持自定义品牌 */}
            <div className="mb-3">选择老字号</div>
            <label htmlFor="brand-input" className="sr-only">输入或选择品牌</label>
            <input
              id="brand-input"
              value={state.brandName || ''}
              onChange={(e) => {
                const name = e.target.value
                const match = BRANDS.find(b => b.name === name)
                if (match) setState({ brandId: match.id, brandName: match.name })
                else setState({ brandId: undefined, brandName: name })
              }}
              placeholder="输入品牌名称（如：桂发祥十八街麻花）"
              className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
            />
            {/* 中文注释：匹配建议（最多展示5条），点击可快速填充 */}
            {(() => {
              const q = (state.brandName || '').trim().toLowerCase()
              const list = q ? BRANDS.filter(b => b.name.toLowerCase().includes(q)).slice(0, 5) : BRANDS.slice(0, 5)
              return (
                <div className="mt-2 flex flex-wrap gap-2">
                  {list.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setState({ brandId: b.id, brandName: b.name })}
                      className={`text-xs px-3 py-1 rounded-full border ${isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                    >{b.name}</button>
                  ))}
                </div>
              )
            })()}
            {/* 中文注释：品牌预览图——已知品牌显示素材，未知品牌用品牌名生成占位图 */}
            <div className="mt-4">
              {(() => {
                const brand = BRANDS.find(b => b.id === state.brandId || b.name === (state.brandName || ''))
                const src = brand?.image || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`Tianjin ${state.brandName || 'brand'} product shot, cultural style`)}&image_size=1920x1080`
                return <TianjinImage src={src} alt="brand" ratio="landscape" rounded="lg" />
              })()}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={next} className="bg-red-600 text-white px-4 py-2 rounded-lg" disabled={!((state.brandName || '').trim())}>下一步</button>
            </div>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* 中文注释：顶部说明与引导，告诉用户该输入什么与如何输入 */}
            <div className="mb-3">用户输入</div>
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs mb-4`}>建议包含：品牌/产品、使用场景、风格与元素、目标受众。例如：桂发祥门店促销海报，国潮风，含回纹元素与天津地标。</div>
            {/* 中文注释：输入框与字数进度条 */}
            <textarea
              value={state.inputText || ''}
              onChange={(e) => { if (e.target.value.length <= 500) setState({ inputText: e.target.value }) }}
              placeholder="示例：为桂发祥十八街麻花设计一组节日KV，颜色中国红+金色，加入海河地标与回纹元素，调性喜庆、高端、国潮。"
              className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} w-full h-36 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800' : 'focus:ring-red-500 focus:ring-offset-2'}`}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="w-1/2 h-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-1 ${isDark ? 'bg-red-500' : 'bg-red-600'}`}
                  style={{ width: `${Math.min(100, Math.round(((state.inputText || '').length / 500) * 100))}%` }}
                />
              </div>
              <div className="text-xs opacity-60">{(state.inputText || '').length}/500</div>
            </div>

            {(() => {
              const add = (t: string) => setState({ inputText: `${(state.inputText || '').trim()} ${t}`.trim() })
              const styles = ['国潮', '极简', '复古', '现代', '黑金', '赛博']
              const scenes = ['门店', '展会', '线上活动', '校园联名', '节日档']
              const elements = ['回纹', '祥云', '京剧元素', '海河地标', '杨柳青年画']
              const tones = ['喜庆', '高端', '亲民', '科技感', '自然']

              const TagChip = ({ label, onClick }: { label: string; onClick: () => void }) => (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onClick}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600 hover:bg-gray-600' : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50'} shadow-sm`}
                >
                  {label}
                </motion.button>
              )

              const Section = ({ title, icon, tags }: { title: string; icon: string; tags: string[] }) => (
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-3 ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} shadow-sm`}> 
                  <div className="flex items-center mb-2">
                    <i className={`${icon} ${isDark ? 'text-gray-300' : 'text-gray-600'} mr-2`}></i>
                    <span className="text-xs opacity-80">{title}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(t => (
                      <TagChip key={t} label={t} onClick={() => add(t)} />
                    ))}
                  </div>
                </div>
              )

              return (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Section title="风格" icon="fas fa-palette" tags={styles} />
                  <Section title="场景" icon="fas fa-store" tags={scenes} />
                  <Section title="元素" icon="fas fa-shapes" tags={elements} />
                  <Section title="语气" icon="far fa-comment" tags={tones} />
                </div>
              )
            })()}

            {/* 中文注释：快捷模板，一键填充规范结构化的输入 */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setState({ inputText: `${(state.brandName || '品牌')} 节日KV设计；主色中国红+金色；包含海河地标与回纹元素；调性喜庆高端；输出短文案与视觉要点。` })}
                className={`text-xs px-3 py-1.5 rounded-lg ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-900 hover:bg-gray-50'} ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'}`}
              >KV海报模板</button>
              <button
                onClick={() => setState({ inputText: `${(state.brandName || '品牌')} 品牌故事短文；包含历史背景、核心价值、文化元素与现代演绎；语气温暖亲民；输出用于社交平台的文案。` })}
                className={`text-xs px-3 py-1.5 rounded-lg ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-900 hover:bg-gray-50'} ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'}`}
              >品牌故事模板</button>
              <button
                onClick={() => setState({ inputText: `${(state.brandName || '品牌')} × 高校联名企划；包含活动主题、视觉风格、渠道与时间安排、周边清单；调性年轻活力；输出企划纲要。` })}
                className={`text-xs px-3 py-1.5 rounded-lg ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-900 hover:bg-gray-50'} ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'}`}
              >联名企划模板</button>
              <button
                onClick={() => setState({ inputText: '' , imageUrl: undefined })}
                className={`text-xs px-3 py-1.5 rounded-lg ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-900 hover:bg-gray-50'} ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'}`}
              >清空输入</button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <UploadBox
                accept="audio/*"
                variant="audio"
                title="上传语音"
                description="支持拖拽与点击选择，自动转文字"
                onFile={async (file) => { const t = await voiceService.transcribeAudio(file); setState({ inputText: t }) }}
              />
              <UploadBox
                accept="image/*"
                variant="image"
                title="上传参考图片"
                description="支持拖拽与点击选择，自动显示预览"
                onFile={(file) => { const url = URL.createObjectURL(file); setState({ imageUrl: url }) }}
              />
            </div>
            {state.imageUrl && <TianjinImage src={state.imageUrl} alt="upload" ratio="landscape" rounded="lg" className="mt-4" />}

            {/* 中文注释：AI建议与文案区，生成/应用/朗读/复制 */}
            <div className={`mt-6 rounded-2xl p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">AI建议与文案</div>
                <div className="flex gap-2">
                  <button onClick={runAIHelp} disabled={!((state.inputText || '').trim())} className={`px-3 py-1.5 rounded-lg text-white text-sm ${((state.inputText || '').trim()) ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}>生成</button>
                  <button onClick={applyAITextToInput} className={`${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-white hover:bg-gray-50'} px-3 py-1.5 rounded-lg ring-1 ${isDark ? 'ring-gray-500' : 'ring-gray-200'} text-sm`}>应用到输入</button>
                  <button onClick={async () => { if (!aiText.trim()) { toast.warning('请先生成文案'); return } try { const r = await voiceService.synthesize(aiText, { format: 'mp3' }); setTtsUrl(r.audioUrl) } catch (e: any) { toast.error(e?.message || '朗读失败') } }} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm" disabled={!aiText.trim()}>朗读</button>
                  <button onClick={async () => { if (!aiText.trim()) { toast.warning('无可复制内容'); return } try { await navigator.clipboard.writeText(aiText); toast.success('已复制到剪贴板') } catch {} }} className={`${isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-700'} px-3 py-1.5 rounded-lg ring-1 ${isDark ? 'ring-gray-500 hover:bg-gray-500' : 'ring-gray-200 hover:bg-gray-50'} text-sm`}>复制</button>
                  <button onClick={() => { const base = `${(state.inputText || '').trim()} ${(aiText || '').trim()}`.trim() || 'Tianjin cultural design'; setState({ variants: [
                    { script: '方案A', image: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' variant A')}&image_size=1024x1024`, video: '视频占位A' },
                    { script: '方案B', image: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' variant B')}&image_size=1024x1024`, video: '视频占位B' },
                    { script: '方案C', image: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' variant C')}&image_size=1024x1024`, video: '视频占位C' },
                  ] }); setStep(3) }} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm">一键生成并进入下一步</button>
                </div>
              </div>
              {aiDirections.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {aiDirections.map((d, i) => (
                    <button key={i} onClick={() => setState({ inputText: `${(state.inputText || '').trim()} ${d}`.trim() })} className={`text-xs px-3 py-1 rounded-full border ${isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>{d}</button>
                  ))}
                </div>
              )}
              {culturalElements.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {culturalElements.map((d, i) => (
                    <button key={i} onClick={() => setState({ inputText: `${(state.inputText || '').trim()} ${d}`.trim() })} className={`text-xs px-3 py-1 rounded-full border ${isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>{d}</button>
                  ))}
                </div>
              )}
              <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm whitespace-pre-wrap min-h-20`}>{aiText}</div>
              {ttsUrl && (<audio controls src={ttsUrl} className="mt-2 w-full" />)}
              {isGenerating && (<div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs mt-2`}>生成中…</div>)}
            </div>
            {/* 中文注释：实时预览与摘要信息，让用户对输入形成直观反馈 */}
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 mt-6`}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">实时预览</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-300 ring-1 ring-gray-700' : 'bg-white text-gray-700 ring-1 ring-gray-200'}`}>Beta</span>
              </div>
              {(() => {
                const brand = (state.brandName || '').trim() || '品牌'
                const prompt = `${brand} ${(state.inputText || '').trim()}`.trim() || brand
                const sizeMap: Record<string, string> = { landscape: '1920x1080', square: '1024x1024', portrait: '1080x1920' }
                const src = `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${sizeMap[previewRatio]}`
                // 中文注释：使用相对容器，实现覆盖叠层信息标注
                return (
                  <div className="relative">
                    <TianjinImage src={src} alt="preview" ratio={previewRatio} rounded="lg" withBorder />
                    {/* 中文注释：品牌徽章动画 */}
                    <motion.span
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-800/70 ring-1 ring-gray-700 text-gray-200' : 'bg-white/80 ring-1 ring-gray-200 text-gray-700'}`}
                    >{brand}</motion.span>
                    {/* 中文注释：从输入中提取的风格/场景/语气，叠层标注 */}
                    {(() => {
                      const text = (state.inputText || '').toLowerCase()
                      const styles = ['国潮','极简','复古','现代','黑金','赛博']
                      const scenes = ['门店','展会','线上活动','校园联名','节日档']
                      const tones = ['喜庆','高端','亲民','科技感','自然']
                      const pick = (arr: string[]) => arr.filter(x => text.includes(x.toLowerCase()))
                      const s = pick(styles)
                      const c = pick(scenes)
                      const t = pick(tones)
                      const chips = [s[0], c[0], t[0]].filter(Boolean) as string[]
                      if (chips.length === 0) return null
                      return (
                        <div className="absolute top-3 right-3 flex gap-2">
                          {chips.map((x, i) => (
                            <span key={i} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-800/70 ring-1 ring-gray-700 text-gray-200' : 'bg-white/80 ring-1 ring-gray-200 text-gray-700'}`}>{x}</span>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                )
              })()}
              {/* 中文注释：预览比例切换 */}
              <div className="mt-3 flex gap-2">
                <button onClick={() => setPreviewRatio('landscape')} className={`text-xs px-2 py-1 rounded ${previewRatio==='landscape' ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700')} ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}>横版</button>
                <button onClick={() => setPreviewRatio('square')} className={`text-xs px-2 py-1 rounded ${previewRatio==='square' ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700')} ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}>方形</button>
                <button onClick={() => setPreviewRatio('portrait')} className={`text-xs px-2 py-1 rounded ${previewRatio==='portrait' ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700')} ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}>竖版</button>
              </div>
              {(() => {
                const text = (state.inputText || '').toLowerCase()
                const styles = ['国潮','极简','复古','现代','黑金','赛博']
                const scenes = ['门店','展会','线上活动','校园联名','节日档']
                const elements = ['回纹','祥云','京剧','京剧元素','海河','杨柳青年画']
                const tones = ['喜庆','高端','亲民','科技感','自然']
                const pick = (arr: string[]) => arr.filter(x => text.includes(x.toLowerCase()))
                const s = pick(styles)
                const c = pick(scenes)
                const e = pick(elements)
                const t = pick(tones)
                const missing: string[] = []
                if (s.length === 0) missing.push('风格')
                if (c.length === 0) missing.push('场景')
                if (e.length === 0) missing.push('元素')
                if (t.length === 0) missing.push('语气')
                return (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs opacity-60">摘要</div>
                    <div className="flex flex-wrap gap-2">
                      {[...(state.brandName ? [state.brandName] : []), ...s, ...c, ...e, ...t].slice(0,8).map((x, i) => (
                        <button
                          key={i}
                          onClick={() => setState({ inputText: `${(state.inputText || '').trim()} ${x}`.trim() })}
                          className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-900'} ring-1 ${isDark ? 'ring-gray-700 hover:bg-gray-700' : 'ring-gray-200 hover:bg-gray-50'}`}
                        >{x}</button>
                      ))}
                    </div>
                    {/* 中文注释：主色识别与展示 */}
                    {(() => {
                      const text = (state.inputText || '')
                      const palette = [
                        { key: '中国红', color: '#c40000' },
                        { key: '红', color: '#d32f2f' },
                        { key: '金色', color: '#d4af37' },
                        { key: '黑金', color: '#1f1f1f' },
                        { key: '蓝色', color: '#2563eb' },
                        { key: '绿色', color: '#16a34a' }
                      ]
                      const picked = palette.filter(p => text.includes(p.key)).slice(0,3)
                      if (picked.length === 0) return null
                      return (
                        <div className="mt-3">
                          <div className="text-xs opacity-60 mb-1">主色</div>
                          <div className="flex items-center gap-2">
                            {picked.map((p, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: p.color }}></span>
                                <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{p.key}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                    {missing.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>建议补充：{missing.join('、')}</span>
                        {/* 中文注释：一键补全缺失项（示例补齐） */}
                        <button
                          onClick={() => setState({ inputText: `${(state.inputText || '').trim()} 国潮 门店 回纹 喜庆`.trim() })}
                          className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                        >一键补全</button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
            {/* 中文注释：底部导航按钮，下一步需有输入内容才可点击 */}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={prev} className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-2 rounded-lg`}>上一步</button>
              <button onClick={next} disabled={!((state.inputText || '').trim())} className={`text-white px-4 py-2 rounded-lg ${((state.inputText || '').trim()) ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}>下一步</button>
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-3">生成三变体</div>
            <button onClick={() => {
              const base = `${(state.inputText || '').trim()} ${(aiText || '').trim()}`.trim() || 'Tianjin cultural design'
              setState({ variants: [
                { script: '方案A', image: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' variant A')}&image_size=1024x1024`, video: '视频占位A' },
                { script: '方案B', image: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' variant B')}&image_size=1024x1024`, video: '视频占位B' },
                { script: '方案C', image: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(base + ' variant C')}&image_size=1024x1024`, video: '视频占位C' },
              ] })
            }} className="bg-red-600 text-white px-4 py-2 rounded-lg">生成</button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {(state.variants || []).map((v, i) => (
                <div key={i} className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4`}>
                  <TianjinImage src={v.image} alt={`variant-${i}`} ratio="square" rounded="lg" className="mb-2" />
                  <div className="text-sm">{v.script}</div>
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-2 text-xs mt-2`}>{v.video}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={prev} className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-2 rounded-lg`}>上一步</button>
              <button onClick={next} className="bg-red-600 text-white px-4 py-2 rounded-lg">下一步</button>
            </div>
          </motion.div>
        )}
        {step === 4 && (
          <motion.div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-3">纯正性评分</div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4`}>
                <div className="text-sm mb-2">输入</div>
                <div className="text-sm">{state.inputText || ''}</div>
              </div>
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4`}>
                <div className="text-sm mb-2">知识库</div>
                <div className="text-sm">{(BRANDS.find(b => b.id === state.brandId || b.name === (state.brandName || '')) || BRANDS[0]).story}</div>
              </div>
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4`}>
                <div className="text-sm mb-2">评分</div>
                <div className="text-3xl font-bold">{(scoreAuthenticity(state.inputText || '', (BRANDS.find(b => b.id === state.brandId || b.name === (state.brandName || '')) || BRANDS[0]).story).score)}</div>
                <ul className="mt-3 text-sm">
                  {scoreAuthenticity(state.inputText || '', (BRANDS.find(b => b.id === state.brandId || b.name === (state.brandName || '')) || BRANDS[0]).story).feedback.map((f, i) => (
                    <li key={i} className="mb-1">{f}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={prev} className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-2 rounded-lg`}>上一步</button>
              <button onClick={savePost} className="bg-red-600 text-white px-4 py-2 rounded-lg">发布到广场</button>
            </div>
          </motion.div>
        )}
        </div>
      </main>
  )
}
