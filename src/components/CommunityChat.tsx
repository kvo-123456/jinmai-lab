import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { TianjinAvatar } from './TianjinStyleComponents';

// 类型定义
export type ChatMessage = { 
  id?: string; 
  user: string; 
  text: string; 
  avatar: string; 
  createdAt?: number; 
  pinned?: boolean; 
  time?: string;
  replyTo?: { id: string; user: string; text: string };
  reactions?: { [emoji: string]: string[] }; // 存储每个表情的用户列表
};

export type Community = {
  id: string;
  name: string;
  description: string;
  cover: string;
  tags: string[];
  members: number;
};

interface CommunityChatProps {
  isDark: boolean;
  joinedCommunities: string[];
  recommendedCommunities: Community[];
  userCommunities: Community[];
  activeChatCommunityId: string | null;
  onActiveChatCommunityChange: (id: string | null) => void;
  pinnedJoined: string[];
  onTogglePinJoined: (id: string) => void;
  mutedCommunities: string[];
  onToggleMuteCommunity: (id: string) => void;
  communityMessages: Record<string, ChatMessage[]>;
  onCommunityMessagesChange: (messages: Record<string, ChatMessage[]>) => void;
  mockCreators: { name: string; role: string; avatar: string; online: boolean }[];
}

const CommunityChat: React.FC<CommunityChatProps> = ({
  isDark,
  joinedCommunities,
  recommendedCommunities,
  userCommunities,
  activeChatCommunityId,
  onActiveChatCommunityChange,
  pinnedJoined,
  onTogglePinJoined,
  mutedCommunities,
  onToggleMuteCommunity,
  communityMessages,
  onCommunityMessagesChange,
  mockCreators
}) => {
  const [chatSearch, setChatSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState('');

  // 常用表情列表
  const emojis = ['👍', '❤️', '😂', '🎉', '😮', '😢', '😡', '🤔', '👀', '👏'];

  // 已加入社群列表
  const joinedList = useMemo(() => {
    const all = [...recommendedCommunities, ...userCommunities];
    return all.filter(c => joinedCommunities.includes(c.id));
  }, [joinedCommunities, userCommunities, recommendedCommunities]);

  // 聊天搜索过滤
  const chatJoinedList = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    const base = joinedList.filter(c => q ? `${c.name} ${c.description} ${c.tags.join(' ')}`.toLowerCase().includes(q) : true);
    const pinned = base.filter(c => pinnedJoined.includes(c.id));
    const others = base.filter(c => !pinnedJoined.includes(c.id));
    return [...pinned, ...others];
  }, [joinedList, chatSearch, pinnedJoined]);

  // 发送社群消息
  const sendCommunityMessage = (communityId: string, text: string) => {
    const t = text.trim();
    if (!t) return;

    const user = mockCreators.find(c => c.online) || mockCreators[0];
    const next: ChatMessage = { 
      id: `cm-${Date.now()}`, 
      user: user.name, 
      text: t, 
      avatar: user.avatar, 
      createdAt: Date.now(),
      replyTo: replyingTo ? { 
        id: replyingTo.id!, 
        user: replyingTo.user, 
        text: replyingTo.text 
      } : undefined,
      reactions: {},
      // editable: true // 允许编辑自己的消息
    };

    const updatedMessages = {
      ...communityMessages,
      [communityId]: [next, ...(communityMessages[communityId] || [])]
    };

    onCommunityMessagesChange(updatedMessages);
    localStorage.setItem('jmzf_community_messages', JSON.stringify(updatedMessages));
    toast.success('已发送到该社群');
    setNewMessage('');
    setReplyingTo(null);
  };

  // 编辑消息
  const editMessage = (communityId: string, messageId: string, newText: string) => {
    const updatedMessages = {
      ...communityMessages,
      [communityId]: (communityMessages[communityId] || []).map(msg => {
        if (msg.id !== messageId) return msg;
        return { ...msg, text: newText, edited: true };
      })
    };

    onCommunityMessagesChange(updatedMessages);
    localStorage.setItem('jmzf_community_messages', JSON.stringify(updatedMessages));
    toast.success('消息已编辑');
  };

  // 删除消息
  const deleteMessage = (communityId: string, messageId: string) => {
    const updatedMessages = {
      ...communityMessages,
      [communityId]: (communityMessages[communityId] || []).filter(msg => msg.id !== messageId)
    };

    onCommunityMessagesChange(updatedMessages);
    localStorage.setItem('jmzf_community_messages', JSON.stringify(updatedMessages));
    toast.success('消息已删除');
  };

  // 转发消息
  const forwardMessage = (communityId: string, message: ChatMessage) => {
    const user = mockCreators.find(c => c.online) || mockCreators[0];
    const forwardedMessage: ChatMessage = {
      id: `cm-${Date.now()}`,
      user: user.name,
      text: `转发：${message.text}`,
      avatar: user.avatar,
      createdAt: Date.now(),
      // forwardedFrom: { user: message.user, text: message.text },
      reactions: {}
    };

    const updatedMessages = {
      ...communityMessages,
      [communityId]: [forwardedMessage, ...(communityMessages[communityId] || [])]
    };

    onCommunityMessagesChange(updatedMessages);
    localStorage.setItem('jmzf_community_messages', JSON.stringify(updatedMessages));
    toast.success('消息已转发');
  };

  // 引用回复
  const quoteReply = (message: ChatMessage) => {
    setReplyingTo(message);
  };

  // 复制消息
  const copyMessage = (message: ChatMessage) => {
    navigator.clipboard.writeText(message.text);
    toast.success('消息已复制到剪贴板');
  };

  // 固定消息
  const togglePinMessage = (communityId: string, messageId: string) => {
    // 先获取当前消息
    const message = (communityMessages[communityId] || []).find(m => m.id === messageId);
    if (!message) return;
    
    const updatedMessages = {
      ...communityMessages,
      [communityId]: (communityMessages[communityId] || []).map(msg => {
        if (msg.id !== messageId) return msg;
        return { ...msg, pinned: !msg.pinned };
      }).sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      })
    };

    onCommunityMessagesChange(updatedMessages);
    localStorage.setItem('jmzf_community_messages', JSON.stringify(updatedMessages));
    toast.success(message.pinned ? '消息已取消固定' : '消息已固定');
  };

  // 添加表情反应
  const addReaction = (communityId: string, messageId: string, emoji: string) => {
    const user = mockCreators.find(c => c.online) || mockCreators[0];
    const userId = user.name;

    const updatedMessages = {
      ...communityMessages,
      [communityId]: (communityMessages[communityId] || []).map(msg => {
        if (msg.id !== messageId) return msg;

        const reactions = { ...(msg.reactions || {}) };
        const users = reactions[emoji] || [];

        if (users.includes(userId)) {
          // 移除反应
          reactions[emoji] = users.filter(u => u !== userId);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        } else {
          // 添加反应
          reactions[emoji] = [...users, userId];
        }

        return { ...msg, reactions };
      })
    };

    onCommunityMessagesChange(updatedMessages);
    localStorage.setItem('jmzf_community_messages', JSON.stringify(updatedMessages));
  };

  // 开始回复消息
  const startReply = (message: ChatMessage) => {
    setReplyingTo(message);
  };

  // 取消回复
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // 插入表情
  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // 删除社群消息
  const deleteCommunityMessage = (communityId: string, id: string) => {
    const updatedMessages = {
      ...communityMessages,
      [communityId]: (communityMessages[communityId] || []).filter(m => m.id !== id)
    };

    onCommunityMessagesChange(updatedMessages);
    localStorage.setItem('jmzf_community_messages', JSON.stringify(updatedMessages));
    toast.success('消息已删除');
  };

  // 置顶社群消息
  const togglePinCommunityMessage = (communityId: string, id: string) => {
    const updatedMessages = {
      ...communityMessages,
      [communityId]: (communityMessages[communityId] || []).map(m => 
        m.id === id ? { ...m, pinned: !m.pinned } : m
      )
    };

    onCommunityMessagesChange(updatedMessages);
    localStorage.setItem('jmzf_community_messages', JSON.stringify(updatedMessages));
    toast.success('置顶状态已更新');
  };

  // 获取当前活跃社群
  const activeCommunity = useMemo(() => {
    if (!activeChatCommunityId) return null;
    const all = [...recommendedCommunities, ...userCommunities];
    return all.find(c => c.id === activeChatCommunityId) || null;
  }, [activeChatCommunityId, recommendedCommunities, userCommunities]);

  // 获取当前社群消息
  const currentMessages = useMemo(() => {
    if (!activeChatCommunityId) return [];
    return communityMessages[activeChatCommunityId] || [];
  }, [activeChatCommunityId, communityMessages]);

  return (
    <motion.section
      className={`mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">社群列表与聊天</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>快速交流</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧社群列表 */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <input 
              value={chatSearch} 
              onChange={e => setChatSearch(e.target.value)} 
              placeholder="搜索已加入社群..." 
              className={`${isDark ? 'bg-gray-800 text-white ring-1 ring-gray-700' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg flex-1 focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`} 
            />
          </div>
          <ul className="space-y-2 max-h-[38vh] overflow-y-auto sm:max-h-[50vh]">
            {chatJoinedList.length === 0 ? (
              <li className="text-sm opacity-60">暂无已加入社群</li>
            ) : (
              chatJoinedList.map(c => (
                <li key={`chatlist-top-${c.id}`}>
                  <button 
                    onClick={() => onActiveChatCommunityChange(c.id)} 
                    className={`w-full text-left p-2 rounded-lg text-sm ring-1 transition-colors ${activeChatCommunityId === c.id ? (isDark ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-indigo-600 text-white ring-indigo-600') : (isDark ? 'bg-gray-700 text-white ring-gray-700' : 'bg-gray-100 text-gray-900 ring-gray-200')}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate mr-2">{c.name}</div>
                    </div>
                    <div className="text-xs opacity-70 mt-1 text-gray-300">{c.tags.slice(0, 2).join(' · ')}</div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* 右侧聊天区域 */}
        <div className="lg:col-span-2">
          {activeCommunity ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{activeCommunity.name}</div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onTogglePinJoined(activeCommunity.id)} 
                    className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'} text-xs px-3 py-1 rounded-full transition-colors`}
                  >
                    {pinnedJoined.includes(activeCommunity.id) ? '取消置顶' : '置顶'}
                  </button>
                  <button 
                    onClick={() => onToggleMuteCommunity(activeCommunity.id)} 
                    className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'} text-xs px-3 py-1 rounded-full transition-colors`}
                  >
                    {mutedCommunities.includes(activeCommunity.id) ? '取消静音' : '静音'}
                  </button>
                </div>
              </div>
              <div className="space-y-3 mb-4 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto pr-1">
                {currentMessages.length === 0 ? (
                  <div className="text-sm opacity-60 text-center py-4">暂无消息，快来发第一条消息吧！</div>
                ) : (
                  currentMessages.map((msg) => (
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
                        />
                        <div className="flex-1 min-w-0">
                          {/* 回复引用 */}
                          {msg.replyTo && (
                            <div className={`mb-2 p-2 rounded-lg text-xs ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                              <div className="font-medium">回复 {msg.replyTo.user}:</div>
                              <div className="text-xs opacity-80 line-clamp-2">{msg.replyTo.text}</div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium truncate">{msg.user}</div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'} mb-2 break-words`}>{msg.text}</div>
                          
                          {/* 表情反应 */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex items-center gap-1 mb-2 flex-wrap">
                              {Object.entries(msg.reactions).map(([emoji, users]) => (
                                <button 
                                  key={emoji} 
                                  onClick={() => msg.id && addReaction(activeCommunity.id, msg.id, emoji)} 
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-200'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-300'} transition-colors`}
                                >
                                  <span>{emoji}</span>
                                  <span>{users.length}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {/* 操作按钮 - 在移动端简化显示 */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <button 
                              onClick={() => msg.id && startReply(msg)} 
                              className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} px-2 py-0.5 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-300'} transition-colors`}
                            >
                              回复
                            </button>
                            <button 
                              onClick={() => msg.id && togglePinCommunityMessage(activeCommunity.id, msg.id)} 
                              className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} px-2 py-0.5 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-300'} transition-colors`}
                            >
                              {msg.pinned ? '取消置顶' : '置顶'}
                            </button>
                            <button 
                              onClick={() => msg.id && deleteCommunityMessage(activeCommunity.id, msg.id)} 
                              className={`${isDark ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800'} px-2 py-0.5 rounded-lg text-xs transition-colors`}
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* 回复指示器 */}
              {replyingTo && (
                <div className={`flex items-center gap-2 mb-2 p-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                  <div className="text-sm">回复 {replyingTo.user}:</div>
                  <button 
                    onClick={cancelReply} 
                    className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
                  >
                    取消
                  </button>
                </div>
              )}
              
              {/* 消息输入区域 */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && sendCommunityMessage(activeCommunity.id, newMessage)} 
                    placeholder={replyingTo ? `回复 ${replyingTo.user}...` : "发表你的看法..."} 
                    className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600 focus:ring-purple-500' : 'bg-white text-gray-900 ring-1 ring-gray-300 focus:ring-pink-300'}`} 
                  />
                  {/* 表情选择器 */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${isDark ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-200 text-gray-800'}`}
                    >
                      😊
                    </button>
                    
                    {showEmojiPicker && (
                      <div className={`absolute bottom-full right-0 mb-2 p-2 rounded-lg shadow-lg z-10 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-300'}`}>
                        <div className="grid grid-cols-5 gap-2">
                          {emojis.map((emoji) => (
                            <button 
                              key={emoji} 
                              onClick={() => insertEmoji(emoji)} 
                              className={`text-xl p-1 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => sendCommunityMessage(activeCommunity.id, newMessage)} 
                  className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white transition-colors hover:opacity-90"
                >
                  发送
                </button>
              </div>
            </div>
          ) : (
            <div className={`flex items-center justify-center h-72 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="text-sm opacity-60">请选择一个社群开始聊天</div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default CommunityChat