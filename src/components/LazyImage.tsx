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
        src={src}
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
          setIsError(true);
          onError?.();
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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
          <div className="text-center p-4">
            <div className="text-gray-500 mb-2">图片加载失败</div>
            <button 
              onClick={() => {
                setIsError(false);
                if (imgRef.current) {
                  imgRef.current.src = src;
                }
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              重试
            </button>
          </div>
        </div>
      )}
    </div>
  );
}