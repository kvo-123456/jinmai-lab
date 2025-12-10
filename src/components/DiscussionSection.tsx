import * as React from 'react';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { TianjinAvatar } from './TianjinStyleComponents';

// 类型定义
export type Thread = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  replies: Array<{ id: string; content: string; createdAt: number }>;
  pinned?: boolean;
  topic?: string;
  upvotes?: number;
};

export type ChatMessage = {
  id?: string;
  user: string;
  text: string;
  avatar: string;
  createdAt?: number;
  pinned?: boolean;
  time?: string;
};

interface DiscussionSectionProps {
  isDark: boolean;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  showModeration?: boolean;
  onDelete?: (id?: string) => void;
  onTogglePin?: (id?: string) => void;
}

interface CommunityDiscussionProps {
  isDark: boolean;
  threads: Thread[];
  onThreadsChange: (threads: Thread[]) => void;
  mode: 'style' | 'topic';
  selectedStyle: string;
  selectedTopic: string;
  newTitle: string;
  onNewTitleChange: (title: string) => void;
  newContent: string;
  onNewContentChange: (content: string) => void;
  threadSearch: string;
  onThreadSearchChange: (search: string) => void;
  threadSort: 'new' | 'reply' | 'hot';
  onThreadSortChange: (sort: 'new' | 'reply' | 'hot') => void;
  favOnly: boolean;
  onFavOnlyChange: (only: boolean) => void;
  favoriteThreads: string[];
  onFavoriteThreadsChange: (threads: string[]) => void;
  replyText: Record<string, string>;
  onReplyTextChange: (text: Record<string, string>) => void;
  threadDraft: { title?: string; content?: string; mode?: 'style' | 'topic'; selected?: string } | null;
  onThreadDraftChange: (draft: { title?: string; content?: string; mode?: 'style' | 'topic'; selected?: string } | null) => void;
  hotTopics: Array<[string, number]>;
  STYLE_LIST: string[];
  TOPIC_LIST: string[];
  onModeChange: (mode: 'style' | 'topic') => void;
  onSelectedStyleChange: (style: string) => void;
  onSelectedTopicChange: (topic: string) => void;
  onInsertRandomIdea: () => void;
  upvoteGuard: Record<string, boolean>;
  onUpvoteGuardChange: (guard: Record<string, boolean>) => void;
}

// 轻量消息流组件（用于社群讨论区）
export const DiscussionSection: React.FC<DiscussionSectionProps> = ({
  isDark,
  messages,
  onSend,
  showModeration,
  onDelete,
  onTogglePin
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      onSend(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div>
      <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="text-sm opacity-60 text-center py-4">暂无消息，快来发第一条消息吧！</div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <div className="flex items-start">
                <TianjinAvatar 
                  src={msg.avatar} 
                  alt={msg.user} 
                  size="sm" 
                  className="mr-3" 
                  variant="heritage" // 使用非遗风格变体
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{msg.user}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                    </div>
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{msg.text}</div>
                  {showModeration && (
                    <div className="mt-2 flex items-center gap-2">
                      <button 
                        onClick={() => onTogglePin?.(msg.id)} 
                        className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} px-2 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-300'} transition-colors`}
                      >
                        {msg.pinned ? '取消置顶' : '置顶'}
                      </button>
                      <button 
                        onClick={() => onDelete?.(msg.id)} 
                        className={`${isDark ? 'bg-red-700 text-white' : 'bg-red-500 text-white'} px-2 py-1 rounded-lg text-xs transition-colors`}
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex items-center gap-2">
        <input 
          value={inputText} 
          onChange={(e) => setInputText(e.target.value)} 
          onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
          placeholder="发表你的看法..." 
          className={`flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600 focus:ring-purple-500' : 'bg-white text-gray-900 ring-1 ring-gray-300 focus:ring-pink-300'}`} 
        />
        <button 
          onClick={handleSend} 
          className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white transition-colors hover:opacity-90"
        >
          发送
        </button>
      </div>
    </div>
  );
};

// 社区讨论区组件（发帖+置顶+回复）
export const CommunityDiscussion: React.FC<CommunityDiscussionProps> = ({
  isDark,
  threads,
  onThreadsChange,
  mode,
  selectedStyle,
  selectedTopic,
  newTitle,
  onNewTitleChange,
  newContent,
  onNewContentChange,
  threadSearch,
  onThreadSearchChange,
  threadSort,
  onThreadSortChange,
  favOnly,
  onFavOnlyChange,
  favoriteThreads,
  onFavoriteThreadsChange,
  replyText,
  onReplyTextChange,
  threadDraft,
  onThreadDraftChange,
  hotTopics,
  STYLE_LIST,
  TOPIC_LIST,
  onModeChange,
  onSelectedStyleChange,
  onSelectedTopicChange,
  onInsertRandomIdea,
  upvoteGuard,
  onUpvoteGuardChange
}) => {
  const [debouncedThreadSearch, setDebouncedThreadSearch] = useState('');

  // 搜索输入防抖
  React.useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedThreadSearch(threadSearch.trim());
    }, 300);
    return () => clearTimeout(h);
  }, [threadSearch]);

  // 提交新帖子
  const submitThread = () => {
    const t = newTitle.trim();
    const c = newContent.trim();
    const BANNED = ['广告', '违规'];
    
    if (!t || !c) return;
    if (BANNED.some(w => t.includes(w) || c.includes(w))) return;
    
    const thread: Thread = {
      id: `t-${Date.now()}`,
      title: t,
      content: c,
      createdAt: Date.now(),
      replies: [],
      topic: mode === 'style' ? selectedStyle : selectedTopic,
      upvotes: 0
    };
    
    const next = [thread, ...threads];
    onThreadsChange(next);
    localStorage.setItem('jmzf_threads', JSON.stringify(next));
    
    onNewTitleChange('');
    onNewContentChange('');
    toast.success('帖子已发布');
  };

  // 恢复草稿
  const restoreDraft = () => {
    if (!threadDraft) return;
    
    onNewTitleChange(threadDraft.title || '');
    onNewContentChange(threadDraft.content || '');
    
    if (threadDraft.mode) {
      onModeChange(threadDraft.mode);
      if (threadDraft.mode === 'style' && threadDraft.selected) {
        onSelectedStyleChange(threadDraft.selected);
      }
      if (threadDraft.mode === 'topic' && threadDraft.selected) {
        onSelectedTopicChange(threadDraft.selected);
      }
    }
  };

  // 清除草稿
  const clearDraft = () => {
    onThreadDraftChange(null);
    try {
      localStorage.removeItem('jmzf_thread_draft');
    } catch {}
  };

  // 添加回复
  const addReply = (id: string) => {
    const text = (replyText[id] || '').trim();
    if (!text) return;
    
    const next = threads.map(t => 
      t.id === id 
        ? { ...t, replies: [...t.replies, { id: `r-${Date.now()}`, content: text, createdAt: Date.now() }] }
        : t
    );
    
    onThreadsChange(next);
    localStorage.setItem('jmzf_threads', JSON.stringify(next));
    
    onReplyTextChange({ ...replyText, [id]: '' });
    toast.success('回复已添加');
  };

  // 点赞帖子
  const upvote = (id: string) => {
    if (upvoteGuard[id]) {
      toast.info('已点过赞');
      return;
    }
    
    const next = threads.map(t => 
      t.id === id 
        ? { ...t, upvotes: (t.upvotes || 0) + 1 }
        : t
    );
    
    onThreadsChange(next);
    localStorage.setItem('jmzf_threads', JSON.stringify(next));
    
    const guardNext = { ...upvoteGuard, [id]: true };
    onUpvoteGuardChange(guardNext);
    localStorage.setItem('jmzf_upvote_guard', JSON.stringify(guardNext));
  };

  // 切换收藏
  const toggleFavoriteThread = (id: string) => {
    const next = favoriteThreads.includes(id)
      ? favoriteThreads.filter(x => x !== id)
      : [id, ...favoriteThreads];
    
    onFavoriteThreadsChange(next);
  };

  // 切换置顶
  const togglePin = (id: string) => {
    const next = threads.map(t => 
      t.id === id 
        ? { ...t, pinned: !t.pinned }
        : t
    );
    
    onThreadsChange(next);
    localStorage.setItem('jmzf_threads', JSON.stringify(next));
    toast.success('置顶状态已更新');
  };

  // 删除帖子
  const removeThread = (id: string) => {
    const next = threads.filter(t => t.id !== id);
    
    onThreadsChange(next);
    localStorage.setItem('jmzf_threads', JSON.stringify(next));
    toast.success('帖子已删除');
  };

  // 删除回复
  const removeReply = (tid: string, rid: string) => {
    const next = threads.map(t => 
      t.id === tid 
        ? { ...t, replies: t.replies.filter(r => r.id !== rid) }
        : t
    );
    
    onThreadsChange(next);
    localStorage.setItem('jmzf_threads', JSON.stringify(next));
    toast.success('回复已删除');
  };

  // 过滤并排序帖子
  const filteredThreads = useMemo(() => {
    return threads
      .filter(t => (mode === 'style' ? t.topic === selectedStyle : t.topic === selectedTopic))
      .filter(t => favOnly ? favoriteThreads.includes(t.id) : true)
      .filter(t => debouncedThreadSearch ? (t.title.includes(debouncedThreadSearch) || t.content.includes(debouncedThreadSearch)) : true)
      .sort((a, b) => {
        const pinDiff = Number(b.pinned) - Number(a.pinned);
        if (pinDiff !== 0) return pinDiff;
        if (threadSort === 'new') return b.createdAt - a.createdAt;
        if (threadSort === 'reply') return (b.replies.length) - (a.replies.length);
        return ((b.upvotes || 0) + b.replies.length) - ((a.upvotes || 0) + a.replies.length);
      });
  }, [threads, mode, selectedStyle, selectedTopic, favOnly, favoriteThreads, debouncedThreadSearch, threadSort]);

  return (
    <>
      {/* 子社区切换与标签选择 */}
      <div className={`mb-6 rounded-2xl p-4 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 shadow-lg' : 'bg-white ring-1 ring-gray-200 shadow-lg'}`}>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-sm opacity-70">子社区：</span>
          <motion.button 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }} 
            onClick={() => onModeChange('style')} 
            className={`${mode === 'style' ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-3 py-1 rounded-full text-sm transition-colors hover:opacity-90`}
          >
            风格
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.97 }} 
            onClick={() => onModeChange('topic')} 
            className={`${mode === 'topic' ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-3 py-1 rounded-full text-sm transition-colors hover:opacity-90`}
          >
            题材
          </motion.button>
        </div>
        
        {mode === 'style' ? (
          <div className="flex flex-wrap gap-2">
            {STYLE_LIST.map(s => {
              const count = threads.filter(t => t.topic === s).length;
              return (
                <motion.button 
                  key={s}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectedStyleChange(s)}
                  className={`${selectedStyle === s ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-3 py-1 rounded-full text-sm flex items-center gap-2 transition-colors hover:opacity-90`}
                >
                  <span>{s}</span>
                  <span className={`${selectedStyle === s ? 'bg-white text-red-600 ring-1 ring-red-200' : (isDark ? 'bg-gray-600 text-white ring-1 ring-gray-700' : 'bg-gray-300 text-gray-900 ring-1 ring-gray-300')} text-xs px-2 py-0.5 rounded-full`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {TOPIC_LIST.map(s => {
              const count = threads.filter(t => t.topic === s).length;
              return (
                <motion.button 
                  key={s}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectedTopicChange(s)}
                  className={`${selectedTopic === s ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-3 py-1 rounded-full text-sm flex items-center gap-2 transition-colors hover:opacity-90`}
                >
                  <span>{s}</span>
                  <span className={`${selectedTopic === s ? 'bg-white text-red-600 ring-1 ring-red-200' : (isDark ? 'bg-gray-600 text-white ring-1 ring-gray-700' : 'bg-gray-300 text-gray-900 ring-1 ring-gray-300')} text-xs px-2 py-0.5 rounded-full`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* 话题热榜 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className={`rounded-2xl p-4 lg:col-span-1 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 shadow-lg' : 'bg-white ring-1 ring-gray-200 shadow-lg'}`}>
          <div className="font-medium mb-3">
            <span className="flex items-center gap-2">🔥 话题热榜</span>
          </div>
          <ul>
            {hotTopics.map(([t, score], i) => {
              const maxHeat = hotTopics.length ? hotTopics[0][1] : 1;
              const pct = Math.max(6, Math.round((score / Math.max(1, maxHeat)) * 100));
              return (
                <li key={t} className="py-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="mr-3">{i + 1}. {t}</span>
                    <span className="opacity-70">{score}</span>
                  </div>
                  <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} w-full h-2 rounded-full mt-1`}>
                    <div 
                      style={{ width: `${pct}%` }} 
                      className={`h-2 rounded-full ${isDark ? 'bg-red-500' : 'bg-red-600'} transition-all duration-300`}
                    ></div>
                  </div>
                </li>
              );
            })}
            {hotTopics.length === 0 && (
              <li className="text-sm opacity-60">暂无数据</li>
            )}
          </ul>
        </div>

        {/* 社区讨论区 */}
        <div className={`rounded-2xl p-4 lg:col-span-2 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 shadow-lg' : 'bg-white ring-1 ring-gray-200 shadow-lg'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">
              {mode === 'style' ? selectedStyle : selectedTopic} 子社区讨论
            </div>
            <div className="flex items-center gap-2">
              <input 
                value={threadSearch} 
                onChange={e => onThreadSearchChange(e.target.value)}
                className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} px-3 py-1 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
                placeholder="搜索讨论"
                aria-label="搜索讨论"
              />
              <select 
                value={threadSort}
                onChange={e => onThreadSortChange(e.target.value as 'new' | 'reply' | 'hot')}
                className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} px-3 py-1 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
              >
                <option value="new">最新</option>
                <option value="reply">最多回复</option>
                <option value="hot">热度</option>
              </select>
              <button 
                onClick={() => onFavOnlyChange(!favOnly)}
                className={`${favOnly ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')} px-3 py-1 rounded-lg text-sm transition-colors`}
              >
                {favOnly ? '只看收藏' : '全部'}
              </button>
              <button 
                onClick={onInsertRandomIdea}
                className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-3 py-1 rounded-lg text-sm transition-colors`}
              >
                随机灵感
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <input 
              value={newTitle}
              onChange={e => onNewTitleChange(e.target.value)}
              className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
              placeholder="帖子标题（如：京剧角色设计打磨建议）"
              aria-label="帖子标题"
            />
            <button 
              onClick={submitThread}
              disabled={!newTitle.trim() || !newContent.trim()}
              aria-disabled={!newTitle.trim() || !newContent.trim()}
              className={`px-3 py-2 rounded-lg transition-colors ${(!newTitle.trim() || !newContent.trim()) ? (isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600') : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'}`}
            >
              发布新帖
            </button>
          </div>
          
          {threadDraft && (threadDraft.title || threadDraft.content) && (
            <div className="flex items-center justify-between mb-2">
              <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>
                检测到草稿，可恢复上一编辑
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={restoreDraft}
                  className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-3 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}
                >
                  恢复草稿
                </button>
                <button 
                  onClick={clearDraft}
                  className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-3 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}
                >
                  清除草稿
                </button>
              </div>
            </div>
          )}
          
          <textarea 
            value={newContent}
            onChange={e => onNewContentChange(e.target.value)}
            className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} w-full h-24 px-3 py-2 rounded-lg border mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
            placeholder="详细内容"
          />
          
          <div className="space-y-3">
            {filteredThreads.map(t => (
              <motion.div 
                key={t.id} 
                whileHover={{ y: -2 }} 
                className={`${isDark ? 'bg-gray-700 ring-1 ring-gray-700' : 'bg-gray-50 ring-1 ring-gray-200'} rounded-xl p-4`}
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">
                    {t.title}
                    {t.pinned && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-600 text-white">置顶</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => upvote(t.id)}
                      aria-label="点赞帖子"
                      className="px-3 py-1 rounded-lg text-xs bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      点赞 {t.upvotes || 0}
                    </button>
                    <button 
                      onClick={() => toggleFavoriteThread(t.id)}
                      aria-label="收藏帖子"
                      className={`${favoriteThreads.includes(t.id) ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')} px-3 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} transition-colors`}
                    >
                      {favoriteThreads.includes(t.id) ? '已收藏' : '收藏'}
                    </button>
                    <button 
                      onClick={() => togglePin(t.id)}
                      aria-label={t.pinned ? '取消置顶' : '置顶'}
                      className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-3 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} transition-colors`}
                    >
                      {t.pinned ? '取消置顶' : '置顶'}
                    </button>
                    <button 
                      onClick={() => removeThread(t.id)}
                      aria-label="删除帖子"
                      className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-3 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} transition-colors`}
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div className={`text-sm opacity-80 mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.content}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input 
                    value={replyText[t.id] || ''}
                    onChange={e => onReplyTextChange({ ...replyText, [t.id]: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addReply(t.id);
                      }
                    }}
                    className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} flex-1 px-3 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
                    placeholder="回复内容"
                    aria-label="回复内容"
                  />
                  <button 
                    onClick={() => addReply(t.id)}
                    aria-label="添加回复"
                    className={`${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'} px-3 py-1 rounded-lg text-xs hover:opacity-90 transition-colors`}
                  >
                    回复
                  </button>
                </div>
                {t.replies.length > 0 && (
                  <div className="mt-3 text-sm">
                    {t.replies.map(r => (
                      <div 
                        key={r.id} 
                        className={`${isDark ? 'border-gray-700' : 'border-gray-200'} border-t py-2 flex items-center justify-between`}
                      >
                        <span>{r.content}</span>
                        <button 
                          onClick={() => removeReply(t.id, r.id)}
                          aria-label="删除回复"
                          className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-2 py-0.5 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} transition-colors`}
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
            {filteredThreads.length === 0 && (
              <div className="text-sm opacity-60">暂无讨论，发布第一条吧～</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};