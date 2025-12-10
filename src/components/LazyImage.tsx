import { useState, useRef, useMemo } from 'react';
import { clsx } from 'clsx';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  quality?: 'low' | 'medium' | 'high';
  loading?: 'eager' | 'lazy';
  sizes?: string;
  ratio?: 'auto' | 'square' | 'landscape' | 'portrait';
  fit?: 'cover' | 'contain';
}

export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholderClassName = '', 
  width,
  height,
  onLoad,
  onError,
  loading = 'lazy',
  sizes = '100vw',
  ratio = 'auto',
  fit = 'cover'
}: LazyImageProps) {
  const [isError, setIsError] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState<string | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);

  // 移除复杂的比例样式，直接使用容器尺寸
  // 处理比例样式
  const ratioStyle = useMemo(() => {
    switch (ratio) {
      case 'square':
        return { aspectRatio: '1/1' };
      case 'landscape':
        return { aspectRatio: '4/3' };
      case 'portrait':
        return { aspectRatio: '3/4' };
      default:
        return undefined;
    }
  }, [ratio]);

  // 生成备用图像
  const generateFallbackImage = () => {
    // 创建一个默认的紫色纹理作为备用
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // 绘制一个紫色背景的默认图像
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('图像加载失败', canvas.width / 2, canvas.height / 2);
      ctx.fillText('使用默认图像', canvas.width / 2, canvas.height / 2 + 40);
    }
    // 将canvas转换为data URL
    return canvas.toDataURL('image/png');
  };

  return (
    <div
      className={clsx(
        'relative overflow-hidden',
        placeholderClassName
      )}
      style={{
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
        ...ratioStyle
      }}
    >
      {/* 简化的图片实现，确保总是显示 */}
      <img
        ref={imgRef}
        src={isError ? fallbackSrc : src}
        alt={alt}
        className={clsx(
          'w-full h-full object-cover',
          className
        )}
        width={width}
        height={height}
        sizes={sizes}
        onLoad={onLoad}
        onError={() => {
          if (!isError) {
            // 生成备用图像并设置
            const fallbackImage = generateFallbackImage();
            setFallbackSrc(fallbackImage);
            setIsError(true);
            onError?.();
          }
        }}
        loading={loading}
        decoding="async"
        style={{
          objectFit: fit,
          display: 'block',
          opacity: 1
        }}
      />
      
      {/* 简化的错误提示 */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="text-center p-4 bg-black bg-opacity-70 rounded-lg text-white">
            <div className="text-white mb-2">图片加载失败</div>
            <button 
              onClick={() => {
                setIsError(false);
                if (imgRef.current) {
                  imgRef.current.src = src;
                }
              }}
              className="text-sm text-blue-400 hover:underline"
            >
              重试
            </button>
          </div>
        </div>
      )}
    </div>
  );
}