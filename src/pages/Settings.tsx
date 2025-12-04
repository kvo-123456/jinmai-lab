import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'

import ModelSelector from '@/components/ModelSelector'

export default function Settings() {
  const { theme, isDark, toggleTheme } = useTheme()
  const [showModelSelector, setShowModelSelector] = useState(false)
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">设置</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">主题</h2>
            <div className="flex items-center justify-between">
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>当前主题：{isDark ? '深色' : '浅色'}</span>
              <button onClick={toggleTheme} className={`px-4 py-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>切换主题</button>
            </div>
          </div>
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">模型与API</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>配置 Kimi/DeepSeek 密钥与模型参数，仅保存在本机。</p>
            <button onClick={() => setShowModelSelector(true)} className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white">打开模型设置</button>
          </div>
        </div>
      </main>
      {showModelSelector && (
        <ModelSelector isOpen={showModelSelector} onClose={() => setShowModelSelector(false)} />
      )}
    </>
  )
}
