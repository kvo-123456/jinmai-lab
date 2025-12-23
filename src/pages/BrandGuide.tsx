import { useMemo, useState, useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { motion } from 'framer-motion'
import BRANDS from '@/lib/brands'
import ipService from '@/services/ipService'
// 可选：如需调用大模型生成灵感，可引入llmService（无密钥则走本地规则）
// import { llmService } from '@/services/llmService'

import { toast } from 'sonner'
import GradientHero from '@/components/GradientHero'

export default function BrandGuide() {
  const { isDark } = useTheme()
  const [brand, setBrand] = useState(BRANDS[0])
  const [brandSearch, setBrandSearch] = useState('') // 中文注释：品牌搜索关键字
  const [chat, setChat] = useState('想怎么创新麻花？') // 中文注释：灵感输入框
  const [contact, setContact] = useState('') // 中文注释：联系人姓名
  const [phone, setPhone] = useState('') // 中文注释：联系方式
  const [idea, setIdea] = useState('') // 中文注释：合作想法描述
  const [tips, setTips] = useState<string[]>([]) // 中文注释：灵感推荐结果
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'negotiating' | 'approved' | 'rejected'>('all')
  const [sortKey, setSortKey] = useState<'recent' | 'old' | 'status'>('recent') // 中文注释：排序方式
  const [reloadTick, setReloadTick] = useState(0) // 中文注释：用于触发列表刷新
  // 中文注释：从本地存储恢复上次填写的数据与选项，提升体验
  useEffect(() => {
    try {
      const raw = localStorage.getItem('BrandGuide.persist')
      if (raw) {
        const saved = JSON.parse(raw)
        const found = BRANDS.find(b => b.id === saved.brandId)
        if (found) setBrand(found)
        if (typeof saved.brandSearch === 'string') setBrandSearch(saved.brandSearch)
        if (typeof saved.chat === 'string') setChat(saved.chat)
        if (typeof saved.contact === 'string') setContact(saved.contact)
        if (typeof saved.phone === 'string') setPhone(saved.phone)
        if (typeof saved.idea === 'string') setIdea(saved.idea)
        if (['all','pending','negotiating','approved','rejected'].includes(saved.statusFilter)) setStatusFilter(saved.statusFilter)
        if (['recent','old','status'].includes(saved.sortKey)) setSortKey(saved.sortKey)
      }
    } catch {}
  }, [])
  // 中文注释：变更时持久化到本地存储，避免刷新丢失数据
  useEffect(() => {
    try {
      const payload = {
        brandId: brand.id,
        brandSearch,
        chat,
        contact,
        phone,
        idea,
        statusFilter,
        sortKey,
      }
      localStorage.setItem('BrandGuide.persist', JSON.stringify(payload))
    } catch {}
  }, [brand.id, brandSearch, chat, contact, phone, idea, statusFilter, sortKey])
  const brandAll = useMemo(() => ipService.getAllPartnerships().filter(p => p.brandName === brand.name), [brand, reloadTick])
  const statusCounts = useMemo(() => {
    const counts = { pending: 0, negotiating: 0, approved: 0, rejected: 0 } as Record<'pending'|'negotiating'|'approved'|'rejected', number>
    brandAll.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1 })
    return counts
  }, [brandAll])
  const partnerships = useMemo(() => {
    let all = brandAll
    if (statusFilter !== 'all') all = all.filter(p => p.status === statusFilter)
    const byRecent = (a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    const byOld = (a: any, b: any) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    const statusOrder: Record<string, number> = { pending: 0, negotiating: 1, approved: 2, rejected: 3 }
    const byStatus = (a: any, b: any) => statusOrder[a.status] - statusOrder[b.status]
    const sorter = sortKey === 'recent' ? byRecent : sortKey === 'old' ? byOld : byStatus
    return [...all].sort(sorter)
  }, [brandAll, statusFilter, sortKey])
  const exportBrandPartnerships = () => {
    // 中文注释：导出当前品牌申请为JSON文件
    const data = partnerships
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${brand.name}-合作申请.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  const exportCSV = () => {
    // 中文注释：导出CSV格式，便于Excel查看
    const header = ['品牌','说明','状态','奖励','更新时间']
    const rows = partnerships.map(p => [p.brandName, p.description.replace(/\n/g,' '), p.status, p.reward, new Date(p.updatedAt).toLocaleString()])
    const csv = [header, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${brand.name}-合作申请.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  // 中文注释：基础表单校验与可提交状态
  const formValidation = useMemo(() => {
    const nameOk = contact.trim().length > 0
    const ph = phone.trim()
    const isMobile = /^1[3-9]\d{9}$/.test(ph)
    const isWeChat = ph.length >= 5 && !/\s/.test(ph)
    const phoneOk = isMobile || isWeChat
    const ideaOk = idea.trim().length > 0
    return {
      nameOk,
      phoneOk,
      ideaOk,
      nameMsg: nameOk ? '' : '请输入联系人姓名',
      phoneMsg: phoneOk ? '' : '请输入有效的联系方式（手机或微信）',
      ideaMsg: ideaOk ? '' : `请输入合作想法（基于 ${brand.name} ）`,
    }
  }, [contact, phone, idea, brand.name])
  const canSubmit = formValidation.nameOk && formValidation.phoneOk && formValidation.ideaOk
  const updateStatus = (id: string, status: 'pending' | 'negotiating' | 'approved' | 'rejected') => {
    const ok = ipService.updatePartnershipStatus(id, status)
    if (ok) {
      setReloadTick(t => t + 1)
      toast.success('状态已更新') // 中文注释：状态更新提示
    } else {
      toast.error('更新失败')
    }
  }
  const suggest = async () => {
    // 中文注释：生成3条灵感建议（基础规则，不依赖外部API）
    const base = chat.trim() || `围绕${brand.name}做一次联名升级`
    const items = [
      `${brand.name} × 校园潮流：${base}，推出限定周边礼盒` ,
      `${brand.name} 城市记忆计划：${base}，设计主题海报与KV` ,
      `${brand.name} 数字文创：${base}，发布数字藏品或表情包`
    ]
    setTips(items)
    // 若需调用大模型：
    // try { const text = await llmService.generate(base); setTips(text.split(/\n+/).slice(0,3)) } catch {}
  }
  const apply = () => {
    // 中文注释：提交合作申请，基本校验
    if (!contact.trim()) { toast.warning('请输入联系人姓名'); return }
    // 中文注释：基础手机号/微信校验（简单规则）
    const ph = phone.trim()
    const isMobile = /^1[3-9]\d{9}$/.test(ph)
    const isWeChat = ph.length >= 5 && !/\s/.test(ph)
    if (!isMobile && !isWeChat) { toast.warning('请输入有效的联系方式（手机或微信）'); return }
    if (!idea.trim()) { toast.warning('请输入合作想法'); return }
    ipService.createPartnership({
      brandName: brand.name,
      brandLogo: brand.image,
      description: `${idea}（联系人：${contact}，电话：${phone}）`,
      reward: '待协商',
      status: 'pending',
      ipAssetId: 'ip-001'
    })
    setContact(''); setPhone(''); setIdea('')
    setReloadTick(t => t + 1)
    toast.success('已提交合作申请，我们会尽快联系您') // 中文注释：提交成功提示
  }
  // 中文注释：移除页面锚点导航后，不再需要可视区监测逻辑
  return (
      <main className="container mx-auto px-4 py-8 scroll-smooth" aria-label="主要内容">
        {/* 品牌合作渐变英雄区 */}
        <GradientHero 
          title="品牌合作"
          subtitle="面向老字号品牌的共创入口：选择品牌、生成灵感、提交合作与管理申请"
          theme="red"
          stats={[
            { label: '当前品牌', value: brand.name },
            { label: '申请数量', value: brandAll.length.toString() },
            { label: '状态', value: statusFilter },
            { label: '排序', value: sortKey === 'recent' ? '最新' : sortKey === 'old' ? '最早' : '状态' }
          ]}
          badgeText="Beta"
          pattern={true}
          size="lg"
        />
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={`${isDark ? 'bg-gray-800/80 ring-1 ring-gray-700' : 'bg-white/90 ring-1 ring-gray-200'} rounded-2xl shadow-xl p-6 backdrop-blur lg:sticky lg:top-6`} id="brand-section" aria-labelledby="brand-section-title">
            {/* 中文注释：移除页面锚点导航，左侧仅保留品牌选择 */}
            <h2 className="text-base font-semibold mb-3">选择老字号</h2>
            {/* 中文注释：品牌搜索 */}
            <label htmlFor="brand-search" className="sr-only">搜索品牌名称</label>
            <input
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              id="brand-search"
              className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 mb-2`}
              placeholder="搜索品牌名称"
            />
            <select
              value={brand.id}
              onChange={(e) => setBrand(BRANDS.find(b => b.id === e.target.value) || BRANDS[0])}
              className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
            >
              {BRANDS.filter(b => b.name.toLowerCase().includes(brandSearch.trim().toLowerCase())).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <div className="mt-4">
              <div className="relative">
                <img src={brand.image} alt={brand.name} className="w-full h-40 object-cover rounded-xl" loading="lazy" decoding="async" />
                <div className={`absolute inset-x-0 bottom-0 px-3 py-2 text-xs ${isDark ? 'bg-black/40 text-gray-200' : 'bg-white/50 text-gray-800'} rounded-b-xl backdrop-blur-sm`}>{brand.name}</div>
              </div>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-3 text-sm leading-relaxed`}>{brand.story}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }} className={`lg:col-span-2 ${isDark ? 'bg-gray-800/80 ring-1 ring-gray-700' : 'bg-white/90 ring-1 ring-gray-200'} rounded-2xl shadow-xl p-6 backdrop-blur`} id="ai-section" aria-labelledby="ai-section-title">
            <div className="mb-3">AI聊天引导</div>
            {/* 中文注释：快捷灵感按钮 */}
            <div className="flex flex-wrap gap-2 mb-2">
              {['赛博朋克风','校园潮流联名','数字文创表情包'].map((s, i) => (
                <button key={i} className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} text-xs px-3 py-1 rounded-full transition-colors`} onClick={() => setChat(`把${brand.name}做成${s}`)}>{s}</button>
              ))}
            </div>
          <label htmlFor="chat-input" className="sr-only">创作灵感输入框</label>
          <textarea
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); suggest() } }}
            id="chat-input"
            aria-describedby="chat-hint"
            className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full h-32 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="send"
            inputMode="text"
          />
            <div id="chat-hint" className="mt-3 text-sm opacity-70">示例：把麻花做成赛博朋克风</div>
            <motion.button whileHover={{ scale: 1.03 }} onClick={suggest} className="mt-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg shadow min-h-[44px]">生成灵感</motion.button>
            {/* 中文注释：灵感推荐结果 */}
            {tips.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm" aria-live="polite">
                {tips.map((t, i) => (
                  <li key={i} className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} px-3 py-2 rounded-lg flex items-center justify-between hover:bg-opacity-90 transition-colors`}>
                    <span className="mr-2">{t}</span>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIdea(t)}>填入合作想法</button>
                      <button className={`${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-900'} px-2 py-1 text-xs rounded`} onClick={async () => { try { await navigator.clipboard.writeText(t); toast.success('已复制到剪贴板') } catch { toast.error('复制失败') } }}>复制</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>
        {/* 中文注释：品牌合作申请表与当前申请列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }} className={`${isDark ? 'bg-gray-800/80 ring-1 ring-gray-700' : 'bg-white/90 ring-1 ring-gray-200'} rounded-2xl shadow-xl p-6 backdrop-blur`} id="apply-section" aria-labelledby="apply-section-title">
            <div className="font-medium mb-3">提交品牌合作申请</div>
            <label htmlFor="contact-input" className="sr-only">联系人姓名</label>
            <input id="contact-input" value={contact} onChange={e => setContact(e.target.value)} className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 mb-1 min-h-[44px]`} placeholder="联系人姓名" autoCapitalize="none" autoCorrect="off" />
            {!formValidation.nameOk && (<div className="mb-2 text-xs text-red-600">{formValidation.nameMsg}</div>)}
            <label htmlFor="phone-input" className="sr-only">联系方式（手机/微信）</label>
            <input id="phone-input" value={phone} onChange={e => setPhone(e.target.value)} className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 mb-1 min-h-[44px]`} placeholder="联系方式（手机/微信）" autoCapitalize="none" autoCorrect="off" inputMode="text" enterKeyHint="next" />
            {!formValidation.phoneOk && (<div className="mb-2 text-xs text-red-600">{formValidation.phoneMsg}</div>)}
            <label htmlFor="idea-input" className="sr-only">合作想法</label>
            <textarea id="idea-input" value={idea} onChange={e => setIdea(e.target.value)} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSubmit) { e.preventDefault(); apply() } }} className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} w-full h-24 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 mb-2`} placeholder={`合作想法（基于 ${brand.name} ）`} autoCapitalize="none" autoCorrect="off" enterKeyHint="send" />
            {!formValidation.ideaOk && (<div className="mb-3 text-xs text-red-600">{formValidation.ideaMsg}</div>)}
            <div className="flex gap-2">
              <button onClick={apply} disabled={!canSubmit} aria-disabled={!canSubmit} className={`bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg shadow min-h-[44px] ${!canSubmit ? 'opacity-50 cursor-not-allowed' : 'hover:from-red-700 hover:to-pink-700'}`}>提交申请</button>
              <button onClick={() => { setContact(''); setPhone(''); setIdea('') }} className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} px-4 py-2 rounded-lg min-h-[44px]`}>清空表单</button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }} className={`lg:col-span-2 ${isDark ? 'bg-gray-800/80 ring-1 ring-gray-700' : 'bg-white/90 ring-1 ring-gray-200'} rounded-2xl shadow-xl p-6 backdrop-blur`} id="list-section" aria-labelledby="list-section-title">
            <div className="font-medium mb-3">当前该品牌的合作申请</div>
            {/* 中文注释：状态统计与筛选 */}
            <div className="mb-3 flex flex-wrap gap-2 items-center" aria-live="polite">
              <button onClick={exportBrandPartnerships} className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} px-3 py-2 rounded-lg transition-colors`}>导出JSON</button>
              <button onClick={exportCSV} className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} px-3 py-2 rounded-lg transition-colors`}>导出CSV</button>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: '全部', count: brandAll.length },
                  { key: 'pending', label: '待处理', count: statusCounts.pending },
                  { key: 'negotiating', label: '洽谈中', count: statusCounts.negotiating },
                  { key: 'approved', label: '已通过', count: statusCounts.approved },
                  { key: 'rejected', label: '已拒绝', count: statusCounts.rejected },
                ].map((s: any) => (
                  <button
                    key={s.key}
                    onClick={() => setStatusFilter(s.key)}
                    className={`px-3 py-1 rounded-full text-sm ring-1 ${statusFilter === s.key ? 'bg-blue-600 text-white ring-blue-600' : (isDark ? 'bg-gray-800 text-gray-300 ring-gray-700' : 'bg-white text-gray-900 ring-gray-200')}`}
                  >{s.label}<span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs ${statusFilter === s.key ? 'bg-white text-blue-600' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}`}>{s.count}</span></button>
                ))}
              </div>
              <select value={sortKey} onChange={e => setSortKey(e.target.value as any)} className={`${isDark ? 'bg-gray-700 text-white focus:ring-offset-gray-800' : 'bg-gray-50 text-gray-900'} px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}>
                <option value="recent">按更新时间(新→旧)</option>
                <option value="old">按更新时间(旧→新)</option>
                <option value="status">按状态</option>
              </select>
            </div>
            {partnerships.length === 0 ? (
              <div className="text-sm opacity-70">暂无申请，欢迎成为第一个合作发起者～</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <th className="text-left px-3 py-2">品牌</th>
                      <th className="text-left px-3 py-2">说明</th>
                      <th className="text-left px-3 py-2">状态</th>
                      <th className="text-left px-3 py-2">奖励</th>
                      <th className="text-left px-3 py-2">更新时间</th>
                      <th className="text-left px-3 py-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnerships.map(p => (
                      <tr key={p.id} className={`${isDark ? 'border-gray-700 hover:bg-gray-800/60' : 'border-gray-200 hover:bg-gray-50'} border-t transition-colors`}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <img src={p.brandLogo} alt={p.brandName} className="w-8 h-8 rounded" loading="lazy" decoding="async" />
                            <span>{p.brandName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">{p.description}</td>
                        <td className="px-3 py-2">{p.status}</td>
                        <td className="px-3 py-2">{p.reward}</td>
                        <td className="px-3 py-2">{new Date(p.updatedAt).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button onClick={() => updateStatus(p.id, 'negotiating')} className={`${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} px-2 py-1 rounded transition-colors`}>标记洽谈</button>
                            <button onClick={() => updateStatus(p.id, 'approved')} className="px-2 py-1 rounded bg-green-500 hover:bg-green-600 text-white transition-colors">通过</button>
                            <button onClick={() => updateStatus(p.id, 'rejected')} className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white transition-colors">拒绝</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </main>
  )
}
