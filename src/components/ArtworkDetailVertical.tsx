import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import LazyImage from './LazyImage';
import { Work } from '@/mock/works';

interface ArtworkDetailVerticalProps {
  work: Work;
  onLike?: () => void;
  liked?: boolean;
}

export const ArtworkDetailVertical: React.FC<ArtworkDetailVerticalProps> = ({
  work,
  onLike,
  liked = false
}) => {
  const { isDark = false } = useTheme() || {};

  return (
    <div className={`flex flex-col md:flex-row h-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 左侧垂直文字区域 */}
      <div className="md:w-1/6 w-full flex justify-center items-center p-6 bg-gradient-to-b from-indigo-900 to-purple-700">
        <div className="writing-vertical text-white font-bold">
          <div className="text-sm opacity-80 mb-8">{work.category || '插画设计'}</div>
          <div className="text-5xl font-extrabold mb-8">{work.title || '未命名作品'}</div>
          <div className="text-xl opacity-90">{work.creator || '插画师小陈'}</div>
        </div>
      </div>

      {/* 右侧作品展示区域 */}
      <div className="md:w-5/6 w-full relative flex flex-col">
        {/* 顶部信息栏 */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-4 z-10">
          <div className="text-4xl font-extrabold text-white opacity-90">XXL</div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLike}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${liked ? 'bg-red-500' : 'bg-white'}`}
            >
              <i className={`fas fa-heart text-xl ${liked ? 'text-white' : 'text-gray-600'}`}></i>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-white"
            >
              <i className="fas fa-bookmark text-xl text-gray-600"></i>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-white"
            >
              <i className="fas fa-share text-xl text-gray-600"></i>
            </motion.button>
          </div>
        </div>

        {/* 作品图片 */}
        <LazyImage
          src={work.thumbnail}
          alt={work.title || '作品缩略图'}
          className="w-full h-full object-contain p-12"
          priority={true}
          ratio="auto"
        />

        {/* 底部渐变遮罩 */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/70 to-transparent opacity-80"></div>

        {/* 作品详细信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* 作品描述 */}
          <div className="mb-4">
            <p className="text-white text-sm opacity-90 max-w-3xl">
              {work.description || '这是一幅精美的插画作品，融合了东方美学元素，展现了创作者独特的艺术视角和精湛的绘画技巧。'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-6">
            {/* 作品数据统计 */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <i className="fas fa-heart text-red-500 text-lg"></i>
                <span className="text-white font-medium">{work.likes || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-comment text-blue-500 text-lg"></i>
                <span className="text-white font-medium">{work.comments || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-eye text-green-500 text-lg"></i>
                <span className="text-white font-medium">{work.views || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-calendar-alt text-yellow-500 text-lg"></i>
                <span className="text-white font-medium">2024.05.15</span>
              </div>
            </div>

            {/* 作品标签 */}
            {work.tags && work.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {work.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* 创作工具和技术 */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2 text-white text-sm opacity-80">
              <i className="fas fa-paint-brush"></i>
              <span>Procreate</span>
            </div>
            <div className="flex items-center gap-2 text-white text-sm opacity-80">
              <i className="fas fa-clock"></i>
              <span>3天创作</span>
            </div>
            <div className="flex items-center gap-2 text-white text-sm opacity-80">
              <i className="fas fa-download"></i>
              <span>4K分辨率</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetailVertical;