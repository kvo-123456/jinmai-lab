import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { useTheme } from '@/hooks/useTheme'

interface SpeechInputProps {
  onTextRecognized: (text: string) => void
  onRecordingStatusChange?: (isRecording: boolean) => void
  language?: string
}

export default function SpeechInput({ onTextRecognized, onRecordingStatusChange, language = 'zh-CN' }: SpeechInputProps) {
  const { isDark } = useTheme()
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [recognizedText, setRecognizedText] = useState('')

  // 检查浏览器是否支持语音识别
  useState(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.lang = language
      recognition.continuous = true
      recognition.interimResults = true
      
      recognition.onstart = () => {
        setIsRecording(true)
        if (onRecordingStatusChange) {
          onRecordingStatusChange(true)
        }
      }
      
      recognition.onend = () => {
        setIsRecording(false)
        if (onRecordingStatusChange) {
          onRecordingStatusChange(false)
        }
      }
      
      recognition.onresult = (event) => {
        let finalText = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalText += result[0].transcript
          } else {
            setRecognizedText(result[0].transcript)
          }
        }
        
        if (finalText) {
          setRecognizedText('')
          onTextRecognized(finalText)
        }
      }
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        if (onRecordingStatusChange) {
          onRecordingStatusChange(false)
        }
        
        let errorMessage = '语音识别失败'
        switch (event.error) {
          case 'not-allowed':
            errorMessage = '请允许麦克风访问权限'
            break
          case 'no-speech':
            errorMessage = '未检测到语音'
            break
          case 'audio-capture':
            errorMessage = '未检测到麦克风'
            break
          case 'network':
            errorMessage = '网络错误'
            break
        }
        toast.error(errorMessage)
      }
      
      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
      toast.error('您的浏览器不支持语音识别功能')
    }
  })

  // 开始录音
  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.error('语音识别未初始化')
      return
    }
    
    try {
      recognitionRef.current.start()
      toast.success('开始录音，说话吧！')
    } catch (error) {
      console.error('Error starting recognition:', error)
      toast.error('无法开始录音')
    }
  }

  // 停止录音
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      if (recognizedText) {
        onTextRecognized(recognizedText)
        setRecognizedText('')
      }
      toast.success('录音已停止')
    }
  }

  // 切换录音状态
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  if (!isSupported) {
    return (
      <button
        disabled
        className={`p-2 rounded-full ${isDark ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        title="浏览器不支持语音识别"
      >
        <i className="fas fa-microphone-slash"></i>
      </button>
    )
  }

  return (
    <div className="relative">
      {/* 语音识别按钮 */}
      <button
        onClick={toggleRecording}
        className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${isRecording ? 'bg-red-600 text-white shadow-lg animate-pulse' : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900')}`}
        title={isRecording ? '停止录音' : '开始录音'}
      >
        {isRecording ? (
          <i className="fas fa-stop"></i>
        ) : (
          <i className="fas fa-microphone"></i>
        )}
      </button>
      
      {/* 实时识别结果 */}
      {isRecording && recognizedText && (
        <div className={`absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className="text-xs">{recognizedText}</p>
        </div>
      )}
    </div>
  )
}