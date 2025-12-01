import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

// 评论类型定义
interface Comment {
  id: string;
  content: string;
  author: string;
  avatar: string;
  likes: number;
  dislikes: number;
  replies: Comment[];
  createdAt: Date;
  updatedAt: Date;
  isLiked: boolean;
  isDisliked: boolean;
}

interface EnhancedCommentProps {
  comment: Comment;
  postId: string;
  onCommentUpdate?: (comment: Comment) => void;
  depth?: number;
  maxDepth?: number;
}

const EnhancedComment: React.FC<EnhancedCommentProps> = ({
  comment,
  postId,
  onCommentUpdate,
  depth = 0,
  maxDepth = 3
}) => {
  const { theme, isDark } = useTheme();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  // 处理点赞
  const handleLike = () => {
    const updatedComment = {
      ...comment,
      likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
      dislikes: comment.isDisliked ? comment.dislikes - 1 : comment.dislikes,
      isLiked: !comment.isLiked,
      isDisliked: false
    };
    if (onCommentUpdate) {
      onCommentUpdate(updatedComment);
    }
  };

  // 处理点踩
  const handleDislike = () => {
    const updatedComment = {
      ...comment,
      dislikes: comment.isDisliked ? comment.dislikes - 1 : comment.dislikes + 1,
      likes: comment.isLiked ? comment.likes - 1 : comment.likes,
      isDisliked: !comment.isDisliked,
      isLiked: false
    };
    if (onCommentUpdate) {
      onCommentUpdate(updatedComment);
    }
  };

  // 提交回复
  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      const newReply: Comment = {
        id: `reply-${Date.now()}`,
        content: replyContent.trim(),
        author: '当前用户',
        avatar: 'https://via.placeholder.com/40',
        likes: 0,
        dislikes: 0,
        replies: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isLiked: false,
        isDisliked: false
      };

      const updatedComment = {
        ...comment,
        replies: [...comment.replies, newReply]
      };

      if (onCommentUpdate) {
        onCommentUpdate(updatedComment);
      }

      setReplyContent('');
      setIsReplying(false);
    }
  };

  // 提交编辑
  const handleSubmitEdit = () => {
    if (editContent.trim()) {
      const updatedComment = {
        ...comment,
        content: editContent.trim(),
        updatedAt: new Date()
      };

      if (onCommentUpdate) {
        onCommentUpdate(updatedComment);
      }

      setIsEditing(false);
    }
  };

  return (
    <div className={`mb-4 ${depth > 0 ? 'ml-8 border-l-2 pl-4' : ''} ${isDark ? 'border-gray-700' : theme === 'pink' ? 'border-pink-200' : 'border-gray-200'}`}>
      <div className={`flex gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-800' : theme === 'pink' ? 'bg-pink-50' : 'bg-white'}`}>
        {/* 头像 */}
        <div className="flex-shrink-0">
          <img
            src={comment.avatar}
            alt={comment.author}
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>

        {/* 评论内容 */}
        <div className="flex-1">
          {/* 作者和时间 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{comment.author}</span>
            <span className="text-xs opacity-60">
              {comment.createdAt.toLocaleDateString()}
            </span>
          </div>

          {/* 评论正文 */}
          {isEditing ? (
            <div className="mb-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={`w-full p-2 rounded border ${isDark ? 'bg-gray-700 border-gray-600' : theme === 'pink' ? 'bg-pink-100 border-pink-300' : 'bg-gray-50 border-gray-300'} resize-none`}
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSubmitEdit}
                  className={`px-3 py-1 text-sm rounded ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                >
                  保存
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className={`px-3 py-1 text-sm rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : theme === 'pink' ? 'bg-pink-200 hover:bg-pink-300' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-2">{comment.content}</div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-4 text-sm">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${comment.isLiked ? 'text-blue-500' : 'opacity-60 hover:opacity-100'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {comment.likes}
            </button>

            <button
              onClick={handleDislike}
              className={`flex items-center gap-1 transition-colors ${comment.isDisliked ? 'text-red-500' : 'opacity-60 hover:opacity-100'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.333V3.9a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.2-1.866a4 4 0 00.8-2.4z" />
              </svg>
              {comment.dislikes}
            </button>

            <button
              onClick={() => setIsReplying(!isReplying)}
              className="opacity-60 hover:opacity-100 transition-colors"
            >
              回复
            </button>

            <button
              onClick={() => setIsEditing(true)}
              className="opacity-60 hover:opacity-100 transition-colors"
            >
              编辑
            </button>
          </div>

          {/* 回复输入框 */}
          {isReplying && (
            <div className="mt-3">
              <div className="flex gap-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="写下你的回复..."
                  className={`flex-1 p-2 rounded border ${isDark ? 'bg-gray-700 border-gray-600' : theme === 'pink' ? 'bg-pink-100 border-pink-300' : 'bg-gray-50 border-gray-300'} resize-none`}
                  rows={2}
                />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={handleSubmitReply}
                    className={`px-3 py-1 text-sm rounded ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                  >
                    发送
                  </button>
                  <button
                    onClick={() => setIsReplying(false)}
                    className={`px-3 py-1 text-sm rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : theme === 'pink' ? 'bg-pink-200 hover:bg-pink-300' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 回复列表 */}
      {comment.replies.length > 0 && depth < maxDepth && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <EnhancedComment
              key={reply.id}
              comment={reply}
              postId={postId}
              onCommentUpdate={onCommentUpdate}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedComment;