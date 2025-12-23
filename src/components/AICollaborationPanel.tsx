import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { llmService, Message, ConversationSession } from '@/services/llmService'
import { toast } from 'sonner'
import SpeechInput from './SpeechInput'

interface AICollaborationPanelProps {
  isOpen: boolean
  onClose: () => void
  onContentGenerated?: (content: string) => void
}

export default function AICollaborationPanel({ isOpen, onClose, onContentGenerated }: AICollaborationPanelProps) {
  const { isDark } = useTheme()
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [isEditingSessionName, setIsEditingSessionName] = useState(false)
  const [editingSessionName, setEditingSessionName] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 对话模板
  const conversationTemplates = [
    {
      id: 'creative-writing',
      name: '创意写作',
      description: '帮助你完善创意写作内容',
      prompt: '我需要写一篇关于[主题]的创意内容，请帮我完善这个创意。'
    },
    {
      id: 'design-concept',
      name: '设计概念',
      description: '帮助你细化设计概念',
      prompt: '我有一个设计概念：[概念描述]，请帮我细化这个概念，包括设计原则、色彩方案和实现思路。'
    },
    {
      id: 'story-development',
      name: '故事发展',
      description: '帮助你发展故事情节',
      prompt: '我正在写一个故事，主题是[主题]，请帮我扩展故事情节，包括角色、冲突和高潮。'
    },
    {
      id: 'problem-solving',
      name: '问题解决',
      description: '帮助你解决创意过程中的问题',
      prompt: '我在创作过程中遇到了一个问题：[问题描述]，请帮我分析并提供解决方案。'
    },
    {
      id: 'marketing-idea',
      name: '营销创意',
      description: '帮助你生成营销创意',
      prompt: '我需要为[产品/服务]生成营销创意，请帮我想出几个创新的营销方案。'
    }
  ]

  // 加载会话列表
  useEffect(() => {
    const loadedSessions = llmService.getSessions()
    setSessions(loadedSessions)
    
    // 设置当前会话
    const activeSession = loadedSessions.find(session => session.isActive) || loadedSessions[0]
    if (activeSession) {
      setCurrentSession(activeSession)
      setMessages(activeSession.messages)
    }
  }, [isOpen])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 创建新会话
  const createNewSession = () => {
    if (!newSessionName.trim()) {
      toast.warning('请输入会话名称')
      return
    }
    
    const newSession = llmService.createSession(newSessionName.trim())
    setSessions([newSession, ...sessions.filter(s => !s.isActive)])
    setCurrentSession(newSession)
    setMessages(newSession.messages)
    setNewSessionName('')
    setShowNewSessionModal(false)
  }

  // 切换会话
  const switchSession = (sessionId: string) => {
    llmService.switchSession(sessionId)
    const updatedSessions = llmService.getSessions()
    setSessions(updatedSessions)
    const activeSession = updatedSessions.find(session => session.isActive) || updatedSessions[0]
    if (activeSession) {
      setCurrentSession(activeSession)
      setMessages(activeSession.messages)
    }
  }

  // 删除会话
  const deleteSession = (sessionId: string) => {
    llmService.deleteSession(sessionId)
    const updatedSessions = llmService.getSessions()
    setSessions(updatedSessions)
    const activeSession = updatedSessions.find(session => session.isActive) || updatedSessions[0]
    if (activeSession) {
      setCurrentSession(activeSession)
      setMessages(activeSession.messages)
    }
  }

  // 重命名会话
  const renameSession = () => {
    if (!editingSessionName.trim() || !currentSession) return
    
    llmService.renameSession(currentSession.id, editingSessionName.trim())
    const updatedSessions = llmService.getSessions()
    setSessions(updatedSessions)
    const updatedSession = updatedSessions.find(s => s.id === currentSession.id)
    if (updatedSession) {
      setCurrentSession(updatedSession)
    }
    setIsEditingSessionName(false)
  }

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || !currentSession) return
    
    setIsGenerating(true)
    setIsTyping(true)
    const userInput = input.trim()
    setInput('')
    
    // 添加用户消息到本地状态
    const userMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, userMessage])
    
    try {
      // 调用LLM服务生成响应
      const response = await llmService.generateResponse(userInput, {
        onDelta: (chunk) => {
          // 这里可以实现流式响应的实时更新
        }
      })
      
      // 更新消息列表
      const updatedSessions = llmService.getSessions()
      const activeSession = updatedSessions.find(s => s.isActive)
      if (activeSession) {
        setMessages(activeSession.messages)
        setCurrentSession(activeSession)
        setSessions(updatedSessions)
      }
      
      // 通知父组件内容已生成
      if (onContentGenerated) {
        onContentGenerated(response)
      }
    } catch (error) {
      toast.error('AI响应生成失败，请稍后重试')
      console.error('Error generating AI response:', error)
    } finally {
      setIsGenerating(false)
      setIsTyping(false)
    }
  }

  // 清除当前会话历史
  const clearCurrentSession = () => {
    llmService.clearHistory()
    const updatedSessions = llmService.getSessions()
    const activeSession = updatedSessions.find(s => s.isActive)
    if (activeSession) {
      setMessages([])
      setCurrentSession(activeSession)
      setSessions(updatedSessions)
    }
    toast.success('对话历史已清除')
  }
  
  // 使用对话模板
  const useTemplate = (template: any) => {
    setInput(template.prompt)
    setShowTemplates(false)
  }
  
  // 导出会话
  const exportSession = (format: 'text' | 'json' | 'markdown') => {
    if (!currentSession) return
    
    let content = ''
    let filename = `${currentSession.name}.${format}`
    
    switch (format) {
      case 'text':
        content = currentSession.messages.map(msg => {
          return `${msg.role === 'user' ? '我' : 'AI'}: ${msg.content}`
        }).join('\n\n')
        break
      case 'json':
        content = JSON.stringify(currentSession, null, 2)
        break
      case 'markdown':
        content = `# ${currentSession.name}\n\n`
        content += currentSession.messages.map(msg => {
          return `## ${msg.role === 'user' ? '我' : 'AI'}\n\n${msg.content}`
        }).join('\n\n')
        break
    }
    
    // 创建下载链接
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`会话已导出为 ${format} 格式`)
    setShowExportOptions(false)
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 背景遮罩 */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* 主面板 */}
          <motion.div
            className={`relative w-full max-w-5xl h-full flex flex-col bg-white dark:bg-gray-900 shadow-2xl transition-all duration-300 transform ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            style={{ borderLeft: '1px solid', maxWidth: '100%' }}
          >
            {/* 面板头部 */}
            <div className="p-4 border-b dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">AI 协作模式</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    与 AI 进行多轮对话，完善你的创意
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  aria-label="关闭"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            {/* 面板内容 */}
            <div className="flex flex-1 overflow-hidden">
              {/* 左侧会话列表 */}
              <div className="w-64 border-r dark:border-gray-800 flex flex-col">
                {/* 会话列表头部 */}
                <div className="p-3 border-b dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">会话</h3>
                    <button
                      onClick={() => setShowNewSessionModal(true)}
                      className={`p-1.5 rounded-full ${isDark ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      aria-label="新建会话"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
                
                {/* 会话列表 */}
                <div className="flex-1 overflow-y-auto">
                  {sessions.map(session => (
                    <motion.div
                      key={session.id}
                      className={`p-3 cursor-pointer border-b dark:border-gray-800 transition-colors ${currentSession?.id === session.id ? (isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-black') : (isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-50 text-gray-700')}`}
                      whileHover={{ x: 5 }}
                      onClick={() => switchSession(session.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{session.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {session.messages.length} 条消息
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSession(session.id)
                            }}
                            className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="删除会话"
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* 左侧底部操作 */}
                <div className="p-3 border-t dark:border-gray-800">
                  <button
                    onClick={clearCurrentSession}
                    className={`w-full text-xs py-2 rounded ${isDark ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                    清除当前会话历史
                  </button>
                </div>
              </div>
              
              {/* 右侧对话区域 */}
              <div className="flex-1 flex flex-col">
                {/* 对话头部 */}
                <div className="p-3 border-b dark:border-gray-800">
                  {isEditingSessionName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingSessionName}
                        onChange={(e) => setEditingSessionName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && renameSession()}
                        onBlur={renameSession}
                        className={`flex-1 text-sm p-1 border rounded ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        autoFocus
                      />
                      <button
                        onClick={renameSession}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingSessionName(false)
                          setEditingSessionName(currentSession?.name || '')
                        }}
                        className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        {currentSession?.name}
                        <button
                          onClick={() => {
                            setIsEditingSessionName(true)
                            setEditingSessionName(currentSession?.name || '')
                          }}
                          className="ml-2 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* 使用模板按钮 */}
                        <button
                          onClick={() => setShowTemplates(!showTemplates)}
                          className={`p-1.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          aria-label="使用模板"
                        >
                          <i className="fas fa-file-alt"></i>
                        </button>
                        
                        {/* 导出会话按钮 */}
                        <button
                          onClick={() => setShowExportOptions(!showExportOptions)}
                          className={`p-1.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          aria-label="导出会话"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(Date.now())}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* 对话模板弹窗 */}
                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowTemplates(false)}
                      >
                        <motion.div
                          className={`p-5 rounded-xl shadow-2xl ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'} max-w-md w-full`}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h3 className="text-lg font-bold mb-3">选择对话模板</h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {conversationTemplates.map(template => (
                              <div
                                key={template.id}
                                className={`p-3 rounded-lg border ${isDark ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-500'} cursor-pointer transition-colors`}
                                onClick={() => useTemplate(template)}
                              >
                                <h4 className="font-medium">{template.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{template.description}</p>
                                <p className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                  {template.prompt}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => setShowTemplates(false)}
                              className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'}`}
                            >
                              取消
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* 导出选项弹窗 */}
                  <AnimatePresence>
                    {showExportOptions && (
                      <motion.div
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowExportOptions(false)}
                      >
                        <motion.div
                          className={`p-5 rounded-xl shadow-2xl ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'} max-w-md w-full`}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h3 className="text-lg font-bold mb-3">导出会话</h3>
                          <div className="space-y-3">
                            <button
                              onClick={() => exportSession('text')}
                              className={`w-full p-3 rounded-lg transition-colors ${isDark ? 'bg-blue-900/30 hover:bg-blue-900/50 text-white' : 'bg-blue-100 hover:bg-blue-200 text-black'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>纯文本格式 (.txt)</span>
                                <i className="fas fa-file-alt"></i>
                              </div>
                            </button>
                            <button
                              onClick={() => exportSession('markdown')}
                              className={`w-full p-3 rounded-lg transition-colors ${isDark ? 'bg-blue-900/30 hover:bg-blue-900/50 text-white' : 'bg-blue-100 hover:bg-blue-200 text-black'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>Markdown格式 (.md)</span>
                                <i className="fab fa-markdown"></i>
                              </div>
                            </button>
                            <button
                              onClick={() => exportSession('json')}
                              className={`w-full p-3 rounded-lg transition-colors ${isDark ? 'bg-blue-900/30 hover:bg-blue-900/50 text-white' : 'bg-blue-100 hover:bg-blue-200 text-black'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>JSON格式 (.json)</span>
                                <i className="fas fa-code"></i>
                              </div>
                            </button>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => setShowExportOptions(false)}
                              className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'}`}
                            >
                              取消
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* 消息内容 */}
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <i className="fas fa-comments text-4xl text-gray-400 mb-2"></i>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        开始与 AI 对话，完善你的创意
                      </p>
                      <button
                        onClick={() => setShowTemplates(true)}
                        className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-blue-900/30 hover:bg-blue-900/50 text-white' : 'bg-blue-100 hover:bg-blue-200 text-black'}`}
                      >
                        <i className="fas fa-file-alt mr-2"></i>
                        使用对话模板
                      </button>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <motion.div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={`max-w-[75%] p-3 rounded-lg ${message.role === 'user' ? (isDark ? 'bg-blue-900/30 text-white' : 'bg-blue-100 text-black') : (isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black')}`}>
                          <div className="flex items-start gap-2">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${message.role === 'user' ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-500 text-white')}`}>
                              {message.role === 'user' ? '我' : 'AI'}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatTime(message.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* 输入区域 */}
                <div className="p-4 border-t dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="输入你的创意想法，与AI进行多轮对话..."
                        className={`w-full min-h-[80px] p-3 rounded-lg border resize-none ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                        disabled={isGenerating}
                      />
                      <div className="absolute right-3 bottom-3">
                        <SpeechInput 
                          onTextRecognized={(text) => setInput(prev => prev + text)} 
                          language="zh-CN"
                        />
                      </div>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={isGenerating || !input.trim()}
                      className={`px-4 py-2 rounded-lg transition-colors ${isGenerating || !input.trim() ? (isDark ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed') : (isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white')}`}
                    >
                      {isGenerating ? (
                        <div className="flex items-center gap-1">
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>生成中...</span>
                        </div>
                      ) : (
                        <span>发送</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 新建会话模态框 */}
            <AnimatePresence>
              {showNewSessionModal && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className={`p-5 rounded-xl shadow-2xl ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                  >
                    <h3 className="text-lg font-bold mb-3">新建会话</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">会话名称</label>
                        <input
                          type="text"
                          value={newSessionName}
                          onChange={(e) => setNewSessionName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && createNewSession()}
                          placeholder="输入会话名称..."
                          className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setShowNewSessionModal(false)}
                          className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'}`}
                        >
                          取消
                        </button>
                        <button
                          onClick={createNewSession}
                          className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                          创建
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}