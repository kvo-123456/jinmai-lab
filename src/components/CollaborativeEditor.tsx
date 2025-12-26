import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import websocketService from '@/services/websocketService';

// 导入WebSocket消息类型
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface CollaborativeEditorProps {
  sessionId: string;
  userId: string;
  username: string;
  initialContent?: string;
  readOnly?: boolean;
  onContentChange?: (content: string) => void;
  className?: string;
}

interface CursorPosition {
  userId: string;
  username: string;
  position: number;
  color: string;
}

interface SelectionRange {
  userId: string;
  username: string;
  start: number;
  end: number;
  color: string;
}

interface TypingStatus {
  userId: string;
  username: string;
  isTyping: boolean;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = React.memo(({
  sessionId,
  userId,
  username,
  initialContent = '',
  readOnly = false,
  onContentChange,
  className = ''
}) => {
  const { theme, isDark } = useTheme();
  const [content, setContent] = useState(initialContent);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<CursorPosition[]>([]);
  const [selections, setSelections] = useState<SelectionRange[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastTypingTime, setLastTypingTime] = useState(0);
  
  // 撤销/重做功能
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const userColors = useRef<Map<string, string>>(new Map());
  const contentChangeTimeoutRef = useRef<NodeJS.Timeout>();

  // 生成用户颜色
  const getUserColor = useCallback((userId: string) => {
    if (!userColors.current.has(userId)) {
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
        '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
      ];
      const color = colors[userColors.current.size % colors.length];
      userColors.current.set(userId, color);
    }
    return userColors.current.get(userId)!;
  }, []);

  // WebSocket连接管理
  useEffect(() => {
    // 连接WebSocket
    websocketService.connect(sessionId, userId, username);
    
    // 设置消息处理器
    websocketService.onMessage((message: WebSocketMessage) => {
      handleWebSocketMessage(message);
    });
    
    websocketService.onOpen(() => {
      setIsConnected(true);
      toast.success('协作连接已建立');
    });
    
    websocketService.onClose(() => {
      setIsConnected(false);
      toast.error('协作连接已断开');
    });
    
    websocketService.onError((error) => {
      console.error('WebSocket错误:', error);
      toast.error('协作连接出现错误');
    });
    
    return () => {
      websocketService.disconnect();
    };
  }, [sessionId, userId, username]);

  // 处理WebSocket消息
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'text_edit':
        handleRemoteTextEdit(message);
        break;
      case 'cursor_move':
        handleRemoteCursorMove(message);
        break;
      case 'selection_change':
        handleRemoteSelectionChange(message);
        break;
      case 'user_joined':
        handleUserJoined(message);
        break;
      case 'user_left':
        handleUserLeft(message);
        break;
      case 'typing_start':
        handleTypingStart(message);
        break;
      case 'typing_stop':
        handleTypingStop(message);
        break;
    }
  }, []);

  // 处理远程文本编辑
  const handleRemoteTextEdit = useCallback((message: any) => {
    if (message.userId === userId) return; // 忽略自己的操作
    
    setContent(prevContent => {
      let newContent = prevContent;
      
      if (message.operation === 'insert') {
        newContent = 
          prevContent.slice(0, message.position) + 
          message.text + 
          prevContent.slice(message.position);
      } else if (message.operation === 'delete') {
        newContent = 
          prevContent.slice(0, message.position) + 
          prevContent.slice(message.position + message.length);
      }
      
      onContentChange?.(newContent);
      
      // 更新历史记录（远程编辑）
      if (newContent !== history[historyIndex]) {
        updateHistory(newContent);
      }
      
      return newContent;
    });
  }, [userId, onContentChange, history, historyIndex]);

  // 优化的光标位置计算
  const getCursorPosition = useCallback((position: number): number => {
    if (!editorRef.current) return position * 8;
    
    const editor = editorRef.current;
    const textContent = editor.textContent || '';
    
    if (position === 0) return 0;
    if (position >= textContent.length) {
      // 如果位置超出文本长度，使用最后一个字符的位置
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      const rect = range.getBoundingClientRect();
      const editorRect = editor.getBoundingClientRect();
      return rect.left - editorRect.left;
    }
    
    // 创建临时范围来测量位置
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.setStart(editor.firstChild || editor, 0);
    
    let currentPos = 0;
    let node: Node | null = editor.firstChild;
    
    while (node && currentPos < position) {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (currentPos + textLength >= position) {
          const offset = position - currentPos;
          range.setStart(node, offset);
          break;
        }
        currentPos += textLength;
      }
      node = node.nextSibling;
    }
    
    const rect = range.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    return rect.left - editorRect.left;
  }, []);

  // 处理远程光标移动
  const handleRemoteCursorMove = useCallback((message: any) => {
    if (message.userId === userId) return;
    
    setCollaborators(prev => {
      const existing = prev.filter(c => c.userId !== message.userId);
      return [...existing, {
        userId: message.userId,
        username: message.username,
        position: message.position,
        color: getUserColor(message.userId)
      }];
    });
  }, [userId, getUserColor]);

  // 处理远程选择变化
  const handleRemoteSelectionChange = useCallback((message: any) => {
    if (message.userId === userId) return;
    
    setSelections(prev => {
      const existing = prev.filter(s => s.userId !== message.userId);
      if (message.start !== message.end) {
        return [...existing, {
          userId: message.userId,
          username: message.username,
          start: message.start,
          end: message.end,
          color: getUserColor(message.userId)
        }];
      }
      return existing;
    });
  }, [userId, getUserColor]);

  // 处理用户加入
  const handleUserJoined = useCallback((message: any) => {
    toast.info(`${message.username} 加入了协作`);
  }, []);

  // 处理用户离开
  const handleUserLeft = useCallback((message: any) => {
    toast.info(`${message.username} 离开了协作`);
    setCollaborators(prev => prev.filter(c => c.userId !== message.userId));
    setSelections(prev => prev.filter(s => s.userId !== message.userId));
  }, []);

  // 处理开始输入
  const handleTypingStart = useCallback((message: any) => {
    if (message.userId !== userId) {
      setTypingUsers(prev => {
        const existing = prev.filter(u => u.userId !== message.userId);
        return [...existing, {
          userId: message.userId,
          username: message.username,
          isTyping: true
        }];
      });
    }
  }, [userId]);

  // 处理停止输入
  const handleTypingStop = useCallback((message: any) => {
    if (message.userId !== userId) {
      setTypingUsers(prev => prev.filter(u => u.userId !== message.userId));
    }
  }, [userId]);

  // 撤销操作
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setIsUndoing(true);
      const newIndex = historyIndex - 1;
      const newContent = history[newIndex];
      setContent(newContent);
      setHistoryIndex(newIndex);
      onContentChange?.(newContent);
      setTimeout(() => setIsUndoing(false), 0);
    }
  }, [history, historyIndex, onContentChange]);

  // 重做操作
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsRedoing(true);
      const newIndex = historyIndex + 1;
      const newContent = history[newIndex];
      setContent(newContent);
      setHistoryIndex(newIndex);
      onContentChange?.(newContent);
      setTimeout(() => setIsRedoing(false), 0);
    }
  }, [history, historyIndex, onContentChange]);

  // 键盘事件处理，添加撤销/重做快捷键
  const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
    if (readOnly) return;
    
    // Ctrl+Z 或 Cmd+Z 撤销
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault();
      handleUndo();
    }
    // Ctrl+Y 或 Cmd+Y 重做
    if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
      event.preventDefault();
      handleRedo();
    }
  }, [readOnly, handleUndo, handleRedo]);

  // 添加/移除全局键盘事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

  // 更新历史记录
  const updateHistory = useCallback((newContent: string) => {
    if (isUndoing || isRedoing) return;
    
    // 清除当前位置之后的历史记录
    const newHistory = history.slice(0, historyIndex + 1);
    // 限制历史记录长度
    const MAX_HISTORY = 50;
    if (newHistory.length >= MAX_HISTORY) {
      newHistory.shift();
      setHistoryIndex(historyIndex - 1);
    }
    // 添加新内容到历史记录
    setHistory([...newHistory, newContent]);
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [history, historyIndex, isUndoing, isRedoing]);

  // 本地文本编辑处理
  const handleTextInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    if (readOnly) return;
    
    const target = event.target as HTMLDivElement;
    const newContent = target.innerHTML || '';
    
    setContent(newContent);
    onContentChange?.(newContent);
    
    // 更新历史记录（节流处理，避免频繁更新）
    if (contentChangeTimeoutRef.current) {
      clearTimeout(contentChangeTimeoutRef.current);
    }
    contentChangeTimeoutRef.current = setTimeout(() => {
      if (newContent !== history[historyIndex]) {
        updateHistory(newContent);
      }
    }, 500);
    
    // 发送输入状态
    if (!isTyping) {
      setIsTyping(true);
      websocketService.sendTypingStart();
    }
    
    setLastTypingTime(Date.now());
    
    // 清除之前的定时器
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // 设置新的定时器
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      websocketService.sendTypingStop();
    }, 1000);
  }, [readOnly, onContentChange, isTyping, content, history, historyIndex, updateHistory]);

  // 处理键盘事件
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    
    const target = event.target as HTMLDivElement;
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const position = getCaretPosition(target, range);
    
    // 发送光标位置
    websocketService.sendCursorMove(position);
    
    // 发送选择范围
    if (!range.collapsed) {
      const startRange = range.cloneRange();
      startRange.collapse(true);
      const start = getCaretPosition(target, startRange);
      const endRange = range.cloneRange();
      endRange.collapse(false);
      const end = getCaretPosition(target, endRange);
      websocketService.sendSelectionChange(start, end);
    } else {
      websocketService.sendSelectionChange(position, position);
    }
  }, [readOnly]);

  // 获取光标位置
  const getCaretPosition = (element: HTMLElement, range: Range): number => {
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  // 处理鼠标事件
  const handleMouseUp = useCallback(() => {
    if (readOnly || !editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const start = getCaretPosition(editorRef.current, range.cloneRange());
    range.collapse(false);
    const end = getCaretPosition(editorRef.current, range);
    
    websocketService.sendSelectionChange(start, end);
  }, [readOnly]);

  // 渲染光标指示器
  const renderCursors = () => {
    return collaborators.map(cursor => {
      const cursorPos = getCursorPosition(cursor.position);
      
      return (
        <div
          key={cursor.userId}
          className="absolute flex flex-col items-center pointer-events-none"
          style={{ left: `${cursorPos}px`, top: '0px' }}
        >
          {/* 光标 */}
          <div
            className="w-0.5 h-5 animate-pulse"
            style={{ backgroundColor: cursor.color }}
          />
          {/* 用户名标签 */}
          <div
            className="mt-1 px-2 py-0.5 rounded text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.username}
          </div>
        </div>
      );
    });
  };

  // 渲染选择范围
  const renderSelections = () => {
    return selections.map(selection => {
      const startPos = getCursorPosition(selection.start);
      const endPos = getCursorPosition(selection.end);
      const width = Math.abs(endPos - startPos);
      
      return (
        <div
          key={selection.userId}
          className="absolute h-5 opacity-20"
          style={{
            left: `${Math.min(startPos, endPos)}px`,
            width: `${width}px`,
            backgroundColor: selection.color,
            top: '2px'
          }}
          title={`${selection.username}的选择`}
        />
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative ${className}`}
    >
      {/* 协作状态栏 */}
      <div className={`flex flex-col mb-3 p-2 rounded-lg text-sm ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span>{isConnected ? '协作已连接' : '协作已断开'}</span>
            <span className="text-gray-500">•</span>
            <span>{collaborators.length + 1} 人在线</span>
          </div>
          
          <div className="flex items-center space-x-1">
            {collaborators.map(collaborator => (
              <motion.div
                key={collaborator.userId}
                className="flex items-center space-x-1 px-2 py-1 rounded text-xs"
                style={{ backgroundColor: collaborator.color + '20' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: collaborator.color }}
                />
                <span>{collaborator.username}</span>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* 打字状态指示器 */}
        {typingUsers.length > 0 && (
          <motion.div 
            className="text-xs text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {typingUsers.map(user => (
              <span key={user.userId} className="mr-2">
                {user.username} 正在输入{typingUsers.length > 1 ? '...' : ''}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      {/* 编辑器区域 */}
      <div className="relative">
        {/* 光标和选择指示器 */}
        <div className="absolute inset-0 pointer-events-none">
          {renderCursors()}
          {renderSelections()}
        </div>
        
        {/* 编辑器 */}
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          className={`min-h-[200px] p-4 rounded-lg border-2 focus:outline-none focus:border-red-500 transition-colors ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
          dangerouslySetInnerHTML={{ __html: content }}
          onInput={handleTextInput}
          onKeyDown={handleKeyDown}
          onMouseUp={handleMouseUp}
          onBlur={() => {
            if (isTyping) {
              setIsTyping(false);
              websocketService.sendTypingStop();
            }
          }}
          aria-label="协作编辑器"
          aria-describedby={typingUsers.length > 0 ? 'typing-status' : undefined}
        />
      </div>

      {/* 操作提示 */}
      <div className="mt-2 text-xs text-gray-500">
        {!readOnly && (
          <span>
            使用 <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Z</kbd> 撤销，
            <kbd className="ml-1 px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Y</kbd> 重做
          </span>
        )}
      </div>
    </motion.div>
  );
});

export default CollaborativeEditor;