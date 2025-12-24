import { useState, useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'

import ModelSelector from '@/components/ModelSelector'

export default function Settings() {
  const { theme, isDark, toggleTheme } = useTheme()
  const [showModelSelector, setShowModelSelector] = useState(false)
  
  // 通知设置
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('notificationsEnabled')
    return saved ? JSON.parse(saved) : true
  })
  const [notificationSound, setNotificationSound] = useState<boolean>(() => {
    const saved = localStorage.getItem('notificationSound')
    return saved ? JSON.parse(saved) : true
  })
  const [notificationFrequency, setNotificationFrequency] = useState<string>(() => {
    const saved = localStorage.getItem('notificationFrequency')
    return saved || 'immediate'
  })
  
  // 隐私设置
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('dataCollectionEnabled')
    return saved ? JSON.parse(saved) : true
  })
  
  // 界面设置
  const [language, setLanguage] = useState<string>(() => {
    const saved = localStorage.getItem('language')
    return saved || 'zh-CN'
  })
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('fontSize')
    return saved ? parseInt(saved) : 16
  })
  const [layoutCompactness, setLayoutCompactness] = useState<string>(() => {
    const saved = localStorage.getItem('layoutCompactness')
    return saved || 'standard'
  })
  
  // 高级设置
  const [developerMode, setDeveloperMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('developerMode')
    return saved ? JSON.parse(saved) : false
  })
  const [apiDebugging, setApiDebugging] = useState<boolean>(() => {
    const saved = localStorage.getItem('apiDebugging')
    return saved ? JSON.parse(saved) : false
  })
  const [performanceMonitoring, setPerformanceMonitoring] = useState<boolean>(() => {
    const saved = localStorage.getItem('performanceMonitoring')
    return saved ? JSON.parse(saved) : true
  })
  
  // 保存设置到localStorage
  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled))
  }, [notificationsEnabled])
  
  useEffect(() => {
    localStorage.setItem('notificationSound', JSON.stringify(notificationSound))
  }, [notificationSound])
  
  useEffect(() => {
    localStorage.setItem('notificationFrequency', notificationFrequency)
  }, [notificationFrequency])
  
  useEffect(() => {
    localStorage.setItem('dataCollectionEnabled', JSON.stringify(dataCollectionEnabled))
  }, [dataCollectionEnabled])
  
  useEffect(() => {
    localStorage.setItem('language', language)
    // 这里可以添加语言切换的逻辑
  }, [language])
  
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize.toString())
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])
  
  useEffect(() => {
    localStorage.setItem('layoutCompactness', layoutCompactness)
    // 这里可以添加布局紧凑度切换的逻辑
  }, [layoutCompactness])
  
  useEffect(() => {
    localStorage.setItem('developerMode', JSON.stringify(developerMode))
  }, [developerMode])
  
  useEffect(() => {
    localStorage.setItem('apiDebugging', JSON.stringify(apiDebugging))
  }, [apiDebugging])
  
  useEffect(() => {
    localStorage.setItem('performanceMonitoring', JSON.stringify(performanceMonitoring))
  }, [performanceMonitoring])
  
  // 清除缓存功能
  const handleClearCache = () => {
    localStorage.clear()
    // 保留主题设置
    localStorage.setItem('theme', theme)
    // 刷新页面
    window.location.reload()
  }
  
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">设置</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 主题设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">主题</h2>
            <div className="flex items-center justify-between">
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>当前主题：{isDark ? '深色' : '浅色'}</span>
              <button onClick={toggleTheme} className={`px-4 py-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>切换主题</button>
            </div>
          </div>
          
          {/* 模型与API设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">模型与API</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>配置 Kimi/DeepSeek 密钥与模型参数，仅保存在本机。</p>
            <button onClick={() => setShowModelSelector(true)} className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white">打开模型设置</button>
          </div>
          
          {/* 通知设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">通知</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>启用通知</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationsEnabled} 
                    onChange={(e) => setNotificationsEnabled(e.target.checked)} 
                    className={`sr-only peer`}
                  />
                  <div className={`w-11 h-6 rounded-full peer ${isDark ? 'bg-gray-700 peer-checked:bg-red-600' : 'bg-gray-200 peer-checked:bg-red-600'} peer-focus:outline-none transition-all duration-300`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>通知声音</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notificationSound} 
                    onChange={(e) => setNotificationSound(e.target.checked)} 
                    className={`sr-only peer`}
                    disabled={!notificationsEnabled}
                  />
                  <div className={`w-11 h-6 rounded-full peer ${isDark ? 'bg-gray-700 peer-checked:bg-red-600' : 'bg-gray-200 peer-checked:bg-red-600'} peer-focus:outline-none transition-all duration-300 ${!notificationsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>
              <div>
                <label className={`block mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>通知频率</label>
                <select 
                  value={notificationFrequency} 
                  onChange={(e) => setNotificationFrequency(e.target.value)} 
                  className={`w-full px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  disabled={!notificationsEnabled}
                >
                  <option value="immediate">立即</option>
                  <option value="daily">每日</option>
                  <option value="weekly">每周</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* 隐私设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">隐私</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>数据收集</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={dataCollectionEnabled} 
                    onChange={(e) => setDataCollectionEnabled(e.target.checked)} 
                    className={`sr-only peer`}
                  />
                  <div className={`w-11 h-6 rounded-full peer ${isDark ? 'bg-gray-700 peer-checked:bg-red-600' : 'bg-gray-200 peer-checked:bg-red-600'} peer-focus:outline-none transition-all duration-300`}></div>
                </label>
              </div>
              <div className="pt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                <button onClick={handleClearCache} className={`w-full text-left px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors`}>
                  清除缓存
                </button>
              </div>
            </div>
          </div>
          
          {/* 界面设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">界面</h2>
            <div className="space-y-4">
              <div>
                <label className={`block mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>语言</label>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)} 
                  className={`w-full px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="zh-CN">中文 (简体)</option>
                  <option value="en-US">English</option>
                </select>
              </div>
              <div>
                <label className={`block mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>字体大小: {fontSize}px</label>
                <input 
                  type="range" 
                  min="12" 
                  max="24" 
                  step="1" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(parseInt(e.target.value))} 
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                />
              </div>
              <div>
                <label className={`block mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>布局紧凑度</label>
                <select 
                  value={layoutCompactness} 
                  onChange={(e) => setLayoutCompactness(e.target.value)} 
                  className={`w-full px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="compact">紧凑</option>
                  <option value="standard">标准</option>
                  <option value="spacious">宽松</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* 账户设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">账户</h2>
            <div className="space-y-3">
              <button className={`w-full text-left px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors`}>
                编辑个人资料
              </button>
              <button className={`w-full text-left px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors`}>
                修改密码
              </button>
              <button className={`w-full text-left px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors`}>
                账号安全设置
              </button>
            </div>
          </div>
          
          {/* 高级设置 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <h2 className="font-medium mb-3">高级</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>开发者模式</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={developerMode} 
                    onChange={(e) => setDeveloperMode(e.target.checked)} 
                    className={`sr-only peer`}
                  />
                  <div className={`w-11 h-6 rounded-full peer ${isDark ? 'bg-gray-700 peer-checked:bg-red-600' : 'bg-gray-200 peer-checked:bg-red-600'} peer-focus:outline-none transition-all duration-300`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>API调试</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={apiDebugging} 
                    onChange={(e) => setApiDebugging(e.target.checked)} 
                    className={`sr-only peer`}
                    disabled={!developerMode}
                  />
                  <div className={`w-11 h-6 rounded-full peer ${isDark ? 'bg-gray-700 peer-checked:bg-red-600' : 'bg-gray-200 peer-checked:bg-red-600'} peer-focus:outline-none transition-all duration-300 ${!developerMode ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>性能监控</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={performanceMonitoring} 
                    onChange={(e) => setPerformanceMonitoring(e.target.checked)} 
                    className={`sr-only peer`}
                  />
                  <div className={`w-11 h-6 rounded-full peer ${isDark ? 'bg-gray-700 peer-checked:bg-red-600' : 'bg-gray-200 peer-checked:bg-red-600'} peer-focus:outline-none transition-all duration-300`}></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
      {showModelSelector && (
        <ModelSelector isOpen={showModelSelector} onClose={() => setShowModelSelector(false)} />
      )}
    </>
  )
}
