import { useEffect, useMemo, useState } from 'react'
import SidebarLayout from '@/components/SidebarLayout'
import { useTheme } from '@/hooks/useTheme'

export default function Lab() {
  const { isDark } = useTheme()
  const [customUrl, setCustomUrl] = useState<string>('')
  // 中文注释：最近打开记录（最多10条），持久化到本地存储
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('LAB_RECENT')
      if (raw) return JSON.parse(raw)
    } catch {}
    return []
  })
  useEffect(() => {
    try { localStorage.setItem('LAB_RECENT', JSON.stringify(recent.slice(0, 10))) } catch {}
  }, [recent])

  // 中文注释：窗口管理清单（记录打开时间与来源），支持一键重开与清空
  interface OpenLogItem { url: string; source: string; openedAt: number }
  const [openedLog, setOpenedLog] = useState<OpenLogItem[]>(() => {
    try {
      const raw = localStorage.getItem('LAB_OPENED_LOG')
      if (raw) return JSON.parse(raw)
    } catch {}
    return []
  })
  useEffect(() => {
    try { localStorage.setItem('LAB_OPENED_LOG', JSON.stringify(openedLog.slice(0, 50))) } catch {}
  }, [openedLog])

  // 中文注释：是否携带上下文（从最近记录中匹配相同路由的查询参数并合并）
  const [carryContext, setCarryContext] = useState<boolean>(true)

  // 中文注释：合并查询参数的辅助函数（输入路径与参考URL，输出合并后的URL）
  const resolveUrlWithContext = (path: string): string => {
    if (/^https?:\/\//i.test(path)) return path
    const base = `${window.location.origin}`
    // 提取用户输入中的查询参数
    const [rawPath, rawQuery] = path.split('?')
    const inputQS = new URLSearchParams(rawQuery || '')
    if (!carryContext) return `${base}${rawPath}${inputQS.toString() ? `?${inputQS.toString()}` : ''}`
    // 找到最近记录中与 rawPath 匹配的条目，取其查询参数
    const match = recent.find((u) => {
      try {
        const url = new URL(u)
        return url.pathname === rawPath
      } catch { return false }
    })
    const ctxQS = new URLSearchParams((() => {
      if (!match) return ''
      try { return new URL(match).search } catch { return '' }
    })())
    // 合并：用户输入参数优先覆盖上下文参数
    inputQS.forEach((v, k) => ctxQS.set(k, v))
    const qs = ctxQS.toString()
    return `${base}${rawPath}${qs ? `?${qs}` : ''}`
  }

  // 中文注释：通用“在新窗口打开”方法，安全参数避免跨窗口脚本注入
  const openInNewWindow = (path: string, source: string = 'custom') => {
    try {
      const url = resolveUrlWithContext(path)
      window.open(url, '_blank', 'noopener,noreferrer')
      setRecent((prev) => [url, ...prev.filter(u => u !== url)].slice(0, 10))
      setOpenedLog((prev) => [{ url, source, openedAt: Date.now() }, ...prev].slice(0, 50))
    } catch {
      alert('打开新窗口失败，请检查URL')
    }
  }

  // 中文注释：批量打开多个页面（可能受浏览器弹窗策略限制）
  const openMany = (paths: string[], source: string = 'batch') => {
    paths.forEach((p, i) => {
      setTimeout(() => openInNewWindow(p, source), i * 50)
    })
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* 中文注释：页面标题与说明 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <i className="fas fa-window-restore text-red-600"></i>
          新窗口实验室
        </h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
          一键在新窗口中打开平台核心页面，便于多任务并行与对比查看。
        </p>
      </div>

      {/* 中文注释：常用页面的快捷打开按钮 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => openInNewWindow('/create', 'quick:create')}
          className={`w-full px-4 py-3 rounded-xl flex items-center justify-center gap-2 ring-1 ${isDark ? 'ring-gray-700 bg-gray-800 hover:bg-gray-700' : 'ring-gray-200 bg-white hover:bg-gray-50'} transition`}
        >
          <i className="fas fa-tools"></i>
          在新窗口打开：创作中心
        </button>

        <button
          onClick={() => openInNewWindow('/explore', 'quick:explore')}
          className={`w-full px-4 py-3 rounded-xl flex items-center justify-center gap-2 ring-1 ${isDark ? 'ring-gray-700 bg-gray-800 hover:bg-gray-700' : 'ring-gray-200 bg-white hover:bg-gray-50'} transition`}
        >
          <i className="fas fa-compass"></i>
          在新窗口打开：探索作品
        </button>

        <button
          onClick={() => openInNewWindow('/square', 'quick:square')}
          className={`w-full px-4 py-3 rounded-xl flex items-center justify-center gap-2 ring-1 ${isDark ? 'ring-gray-700 bg-gray-800 hover:bg-gray-700' : 'ring-gray-200 bg-white hover:bg-gray-50'} transition`}
        >
          <i className="fas fa-th-large"></i>
          在新窗口打开：共创广场
        </button>

        <button
          onClick={() => openInNewWindow('/knowledge', 'quick:knowledge')}
          className={`w-full px-4 py-3 rounded-xl flex items-center justify-center gap-2 ring-1 ${isDark ? 'ring-gray-700 bg-gray-800 hover:bg-gray-700' : 'ring-gray-200 bg-white hover:bg-gray-50'} transition`}
        >
          <i className="fas fa-book"></i>
          在新窗口打开：文化知识库
        </button>

        <button
          onClick={() => openInNewWindow('/neo', 'quick:neo')}
          className={`w-full px-4 py-3 rounded-xl flex items-center justify-center gap-2 ring-1 ${isDark ? 'ring-gray-700 bg-gray-800 hover:bg-gray-700' : 'ring-gray-200 bg-white hover:bg-gray-50'} transition`}
        >
          <i className="fas fa-bolt"></i>
          在新窗口打开：灵感引擎
        </button>

        <button
          onClick={() => openInNewWindow('/tools', 'quick:tools')}
          className={`w-full px-4 py-3 rounded-xl flex items-center justify-center gap-2 ring-1 ${isDark ? 'ring-gray-700 bg-gray-800 hover:bg-gray-700' : 'ring-gray-200 bg-white hover:bg-gray-50'} transition`}
        >
          <i className="fas fa-magic"></i>
          在新窗口打开：创作工具集
        </button>
      </div>

      {/* 中文注释：自定义URL输入—可打开任意页面或外部链接 */}
      <div className={`rounded-2xl p-4 ring-1 ${isDark ? 'ring-gray-700 bg-gray-900' : 'ring-gray-200 bg-white'}`}>
        <h2 className="font-bold mb-3">自定义链接</h2>
        <div className="mb-2 flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={carryContext} onChange={(e) => setCarryContext(e.target.checked)} />
            携带最近上下文参数（同一路由合并最近查询条件）
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && customUrl.trim()) openInNewWindow(customUrl.trim()) }}
            placeholder="例如 /create 或 https://example.com"
            className={`flex-1 px-3 py-2 rounded-xl ring-1 ${isDark ? 'bg-gray-800 ring-gray-700 text-white' : 'bg-white ring-gray-300 text-gray-900'}`}
          />
          <button
            onClick={() => { if (customUrl.trim()) openInNewWindow(customUrl.trim()) }}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
          >
            在新窗口打开
          </button>
        </div>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mt-2`}>
          支持站内路径与外部地址；为安全起见，已启用 `noopener,noreferrer`。
        </p>
        {/* 中文注释：批量打开与最近记录 */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => openMany(['/explore', '/create'], 'batch:explore+create')}
            className={`px-3 py-2 rounded-xl text-sm ring-1 ${isDark ? 'ring-gray-700 bg-gray-800 hover:bg-gray-700' : 'ring-gray-200 bg-white hover:bg-gray-50'}`}
          >
            对比打开：探索 + 创作
          </button>
          <button
            onClick={() => openMany(['/square', '/knowledge'], 'batch:square+knowledge')}
            className={`px-3 py-2 rounded-xl text-sm ring-1 ${isDark ? 'ring-gray-700 bg-gray-800 hover:bg-gray-700' : 'ring-gray-200 bg-white hover:bg-gray-50'}`}
          >
            对比打开：广场 + 知识库
          </button>
          <button
            onClick={() => openMany(openedLog.map(i => i.url), 'batch:reopen-all')}
            className={`px-3 py-2 rounded-xl text-sm ring-1 ${isDark ? 'ring-gray-700 bg-gray-800 hover:bg-gray-700' : 'ring-gray-200 bg-white hover:bg-gray-50'}`}
          >
            批量重开：全部历史
          </button>
          <button
            onClick={() => setOpenedLog([])}
            className="px-3 py-2 rounded-xl text-sm bg-red-600 hover:bg-red-700 text-white"
          >
            清空窗口清单
          </button>
        </div>
        <div className="mt-6">
          <h3 className="font-medium mb-2">最近打开</h3>
          {recent.length === 0 ? (
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>暂无记录</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((u) => (
                <li key={u} className="flex items-center justify-between">
                  <span className={`truncate mr-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{u}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openInNewWindow(u)}
                      className="px-2 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs"
                    >
                      打开
                    </button>
                    <button
                      onClick={() => setRecent(prev => prev.filter(x => x !== u))}
                      className={`px-2 py-1 rounded-md text-xs ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                    >
                      删除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6">
            <h3 className="font-medium mb-2">窗口管理清单</h3>
            {openedLog.length === 0 ? (
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>暂无记录</p>
            ) : (
              <ul className="space-y-2">
                {openedLog.map((item, idx) => (
                  <li key={`${item.url}-${item.openedAt}-${idx}`} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-3">
                      <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} truncate`}>{item.url}</div>
                      <div className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs`}>来源：{item.source} · 时间：{new Date(item.openedAt).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openInNewWindow(item.url, 'reopen:item')}
                        className="px-2 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs"
                      >
                        重开
                      </button>
                      <button
                        onClick={() => setOpenedLog(prev => prev.filter(x => !(x.url === item.url && x.openedAt === item.openedAt)))} 
                        className={`px-2 py-1 rounded-md text-xs ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                      >
                        删除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
