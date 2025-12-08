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
      <div className="md:w-5/6 w-full relative">
        <div className="absolute top-6 right-6 flex flex-col items-end gap-4 z-10">
          <div className="text-4xl font-extrabold text-white opacity-90">XXL</div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLike}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${liked ? 'bg-red-500' : 'bg-white'}`}
          >
            <i className={`fas fa-heart text-xl ${liked ? 'text-white' : 'text-gray-600'}`}></i>
          </motion.button>
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
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>

        {/* 作品详细信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
            </div>

            {/* 作品标签 */}
            {work.tags && work.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {work.tags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
                {work.tags.length > 3 && (
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
                    +{work.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetailVertical;