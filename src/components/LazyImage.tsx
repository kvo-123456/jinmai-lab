import React, { useState, useEffect, useRef, useMemo } from 'react';
import { processImageUrl } from '../utils/imageUrlUtils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: React.ReactNode;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  // 支持的宽高比
  ratio?: 'auto' | 'square' | 'landscape' | 'portrait';
  // 图片优先级
  priority?: boolean;
  // 图片质量
  quality?: 'high' | 'low' | 'medium';
  // 图片填充方式
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  // 默认图片URL，当原始图片加载失败时使用
  fallbackSrc?: string;
  // 是否禁用fallback机制
  disableFallback?: boolean;
  // 是否启用渐进式加载
  progressive?: boolean;
  // 模糊占位符尺寸
  blurSize?: number;
  // 加载动画类型
  loadingAnimation?: 'fade' | 'scale' | 'blur';
}

const LazyImage: React.FC<LazyImageProps> = React.memo(({ 
  src, 
  alt, 
  placeholder, 
  className, 
  onLoad,
  onError,
  ratio = 'auto',
  fit = 'cover',
  priority = false,
  quality,
  fallbackSrc,
  disableFallback = false,
  progressive = true,
  blurSize = 10,
  loadingAnimation = 'fade',
  ...rest 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // 默认fallback图片 - 使用内联base64图片作为占位符，确保可靠加载
  const defaultFallbackSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSI1NzYiIGZpbGw9IiM3Nzc3NzciIGZpbGwtb3BhY2l0eT0iMC4yIiB2aWV3Qm94PSIwIDAgMTAyNCA1NzYiIG1pZGRsZT0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMjQiIGhlaWdodD0iNTc2IiBmaWxsPSIjMjIyMjIyIi8+CjxjaXJjbGUgY3g9IjUwMiIgY3k9IjI2MiIgcj0iMTAwIiBmaWxsPSIjQjFCOUIxIi8+CjxjaXJjbGUgY3g9IjUwMiIgY3k9IjI2MiIgcj0iNzAiIGZpbGw9IiNEMURFRDEiLz4KPHN2ZyB4PSI0NTIiIHk9IjIyMiIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9Im5vbmUiIGZpbGwtb3BhY2l0eT0iMC4zIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYSIgeDE9IjAiIHkxPSIwIiB4Mj0iMTIwIiB5Mj0iMTIwIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0I1QjViNSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNCMUJ5QjEiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNhKSIgb3BhY2l0eT0iMC42Ii8+CiAgPC9kZWZzPgogIDwvc3ZnPgogPHN2ZyB4PSI1ODIiIHk9IjIwMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSJub25lIiBmaWxsLW9wYWNpdHk9IjAuNCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImIiIHgxPSIwIiB5MT0iMCIgeDI9IjUwIiB5Mj0iNTAiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjQjVCNUI1Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0IxQjViMSIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxyZWN0IHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgZmlsbD0idXJsKCNiKSIgb3BhY2l0eT0iMC42Ii8+CiAgPC9kZWZzPgogIDwvc3ZnPgogPC9zdmc+';
  
  // 使用useMemo确保currentSrc与src同步更新，避免异步更新问题
  const currentSrc = useMemo(() => {
    // 如果disableFallback为true，直接使用原始URL，不经过处理
    if (disableFallback) {
      return src;
    }
    const processedSrc = processImageUrl(src);
    return processedSrc || (fallbackSrc || defaultFallbackSrc);
  }, [src, fallbackSrc, disableFallback]);
  
  // 对于SVG数据URL，立即设置为已加载，因为它们是内联的，会立即加载
  const isSvgDataUrl = useMemo(() => {
    return src.startsWith('data:image/svg+xml');
  }, [src]);
  
  // 图片加载完成处理
  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
    if (onLoad) {
      onLoad();
    }
  };
  
  // 图片加载失败处理
  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsError(true);
    setIsLoaded(false);
    if (onError) {
      onError();
    }
    event.preventDefault();
  };
  
  // 当src变化时重置加载状态
  useEffect(() => {
    // 重置状态，确保新图片能正确显示加载过程
    setIsLoaded(isSvgDataUrl); // SVG数据URL立即设置为已加载
    setIsError(false);
  }, [src, isSvgDataUrl]);

  // 观察图片是否进入视口
  useEffect(() => {
    // 优先级高的图片立即加载，不使用懒加载
    if (priority) {
      setIsVisible(true);
      return;
    }
    
    // 如果浏览器不支持IntersectionObserver，则直接返回
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }
    
    // 创建IntersectionObserver实例
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          // 图片进入视口后，停止观察
          if (observerRef.current) {
            observerRef.current.unobserve(entry.target);
            observerRef.current.disconnect();
            observerRef.current = null;
          }
        }
      },
      {
        // 提前150px开始加载，给浏览器更多时间预加载
        rootMargin: '150px 0px',
        // 当图片5%进入视口时触发，更早开始加载
        threshold: 0.05
      }
    );
    
    // 开始观察图片容器元素
    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }
    
    // 清理函数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [priority]);
  
  // 加载动画样式
  const getLoadingAnimationClasses = () => {
    if (loadingAnimation === 'fade') {
      return 'transition-opacity duration-500 ease-in-out';
    } else if (loadingAnimation === 'scale') {
      return 'transition-all duration-500 ease-in-out transform';
    } else if (loadingAnimation === 'blur') {
      return 'transition-all duration-700 ease-in-out';
    }
    return 'transition-opacity duration-500 ease-in-out';
  };
  
  // 图片容器样式
  const getImageClasses = () => {
    const baseClasses = `w-full h-full object-${fit} ${getLoadingAnimationClasses()}`;
    
    if (isLoaded) {
      if (loadingAnimation === 'fade') {
        return `${baseClasses} opacity-100`;
      } else if (loadingAnimation === 'scale') {
        return `${baseClasses} opacity-100 scale-100`;
      } else if (loadingAnimation === 'blur') {
        return `${baseClasses} opacity-100 blur-0`;
      }
      return `${baseClasses} opacity-100`;
    } else if (isError) {
      return `${baseClasses} opacity-0`;
    } else {
      if (loadingAnimation === 'fade') {
        return `${baseClasses} opacity-0`;
      } else if (loadingAnimation === 'scale') {
        return `${baseClasses} opacity-0 scale-95`;
      } else if (loadingAnimation === 'blur') {
        return `${baseClasses} opacity-0 blur-${blurSize}`;
      }
      return `${baseClasses} opacity-0`;
    }
  };
  
  // 自定义占位符
  const defaultPlaceholder = (
    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded-lg flex items-center justify-center">
      <i className="fas fa-image text-gray-400 dark:text-gray-500 text-2xl"></i>
    </div>
  );
  
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* 图片容器，保持宽高比 */}
      <div 
        className="relative overflow-hidden"
        style={{
          width: '100%',
          height: '100%',
          // 只有当没有父级固定宽高时才使用aspectRatio
          ...(!rest.width && !rest.height && {
            aspectRatio: ratio === 'square' 
              ? '1 / 1' 
              : ratio === 'landscape' 
                ? '16 / 9' 
                : ratio === 'portrait' 
                  ? '4 / 5' 
                  : '16 / 9' // 默认使用16:9宽高比，确保容器有高度
          })
        }}
      >
        {/* 图片元素 - 只有在可见时才加载 */}
        {isVisible && (
          <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            className={getImageClasses()}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            {...rest}
          />
        )}
        
        {/* 加载状态 - 显示默认占位符或自定义占位符 */}
        {!isLoaded && !isError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
            {placeholder || defaultPlaceholder}
          </div>
        )}
        
        {/* 加载失败状态 - 显示自定义错误界面，允许重试 */}
        {isError && (
          <div className="absolute inset-0 z-20 w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="text-center p-4">
              <i className="fas fa-exclamation-circle text-4xl text-red-500 mb-2"></i>
              <p className="text-gray-800 dark:text-gray-200 mb-1">图片加载失败</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">请检查网络连接或稍后重试</p>
              <button 
                onClick={() => {
                  setIsLoaded(false);
                  setIsError(false);
                  const img = imgRef.current;
                  if (img) {
                    // 重置图片src，触发重新加载
                    img.src = '';
                    setTimeout(() => {
                      img.src = currentSrc;
                    }, 0);
                  }
                }} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                重试
              </button>
              {/* 添加调试信息，便于开发人员排查问题 */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  <p>URL: {currentSrc}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;