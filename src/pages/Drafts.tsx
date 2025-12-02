import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarLayout from '@/components/SidebarLayout'
import { useTheme } from '@/hooks/useTheme'
import { toast } from 'sonner'

interface CreateDraftData {
  prompt: string
  selectedResult: number | null
  currentStep: number
  aiExplanation: string
  updatedAt: number
}
interface CreateSnapshot extends CreateDraftData {
  scale: number; brightness: number; contrast: number; saturate: number; hueRotate: number; blur: number;
  overlayText: string; overlaySize: number; overlayColor: string;
}

export default function Drafts() {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<CreateDraftData | null>(null)
  const [history, setHistory] = useState<CreateSnapshot[]>([])

  // 中文注释：组件初始化时从本地存储读取草稿数据
  useEffect(() => {
    try {
      const raw = localStorage.getItem('CREATE_DRAFT')
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CreateDraftData>
        // 中文注释：基本字段校验，确保渲染安全
        const safe: CreateDraftData = {
          prompt: String(parsed.prompt || ''),
          selectedResult: typeof parsed.selectedResult === 'number' ? parsed.selectedResult : null,
          currentStep: typeof parsed.currentStep === 'number' ? parsed.currentStep : 1,
          aiExplanation: String(parsed.aiExplanation || ''),
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
        }
        setDraft(safe)
      } else {
        setDraft(null)
      }
      const histRaw = localStorage.getItem('CREATE_HISTORY')
      if (histRaw) {
        const list = JSON.parse(histRaw) as CreateSnapshot[]
        if (Array.isArray(list)) setHistory(list)
      }
    } catch {
      setDraft(null)
    }
  }, [])

  // 中文注释：格式化更新时间展示为本地可读字符串
  const updatedLabel = useMemo(() => {
    if (!draft) return ''
    try { return new Date(draft.updatedAt).toLocaleString() } catch { return '' }
  }, [draft])

  // 中文注释：跳转回创作中心继续编辑
  const resumeDraft = () => {
    navigate('/create')
  }

  // 中文注释：删除本地草稿并清空页面状态
  const deleteDraft = () => {
    try {
      localStorage.removeItem('CREATE_DRAFT')
      setDraft(null)
      toast.success('草稿已删除')
    } catch {
      toast.error('删除草稿失败')
    }
  }

  // 中文注释：恢复历史快照为当前草稿并跳转创作中心
  const restoreSnapshot = (snap: CreateSnapshot) => {
    try {
      localStorage.setItem('CREATE_DRAFT', JSON.stringify(snap))
      toast.success('已恢复到当前草稿')
      navigate('/create')
    } catch {
      toast.error('恢复失败')
    }
  }

  // 中文注释：清空历史记录
  const clearHistory = () => {
    try {
      localStorage.removeItem('CREATE_HISTORY')
      setHistory([])
      toast.success('历史记录已清空')
    } catch {
      toast.error('清空失败')
    }
  }

  return (

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">草稿箱</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2 text-sm`}>管理你在创作中心保存的本地草稿</p>
        </div>

        {!draft ? (
          <div className={`${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} rounded-2xl p-8 text-center`}> 
            <i className="fas fa-inbox text-3xl mb-3"></i>
            <div className="font-medium mb-1">暂无草稿</div>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>去创作中心开始创作并点击“保存草稿”</p>
            <div className="mt-4">
              <button 
                onClick={() => navigate('/create')}
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white"
              >前往创作中心</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} rounded-2xl p-6`}> 
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold">AI创作草稿</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>步骤 {draft.currentStep}/3</span>
                </div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>更新于 {updatedLabel}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">提示词</div>
                  <p className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 text-sm`}>{draft.prompt || '（无）'}</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">AI说明</div>
                  <p className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 text-sm max-h-40 overflow-auto`}>{draft.aiExplanation || '（暂无说明）'}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center space-x-3">
                <button 
                  onClick={resumeDraft}
                  className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text白"
                >继续编辑</button>
                <button 
                  onClick={deleteDraft}
                  className={`${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} px-4 py-2 rounded-full`}
                >删除草稿</button>
              </div>
            </div>

            <div className={`${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} rounded-2xl p-6`}> 
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold">历史记录</span>
                <button onClick={clearHistory} className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm">清空</button>
              </div>
              {history.length === 0 ? (
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>暂无历史快照</div>
              ) : (
                <ul className="space-y-3 max-h-80 overflow-auto">
                  {history.map((h, idx) => (
                    <li key={`${h.updatedAt}-${idx}`} className="flex items-center justify-between">
                      <div className="min-w-0 mr-3">
                        <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm truncate`}>{h.prompt || '（无提示）'}</div>
                        <div className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs`}>步骤 {h.currentStep}/3 · {new Date(h.updatedAt).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => restoreSnapshot(h)} className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs">恢复</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
  )
}
