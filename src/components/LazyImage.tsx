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
  fit?: 'cover' | 'contain';
  // 默认图片URL，当原始图片加载失败时使用
  fallbackSrc?: string;
}

export default function LazyImage({ 
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
  ...rest 
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // 默认fallback图片 - 使用内联base64图片作为占位符，确保可靠加载
  const defaultFallbackSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSI1NzYiIGZpbGw9IiM3Nzc3NzciIGZpbGwtb3BhY2l0eT0iMC4yIiB2aWV3Qm94PSIwIDAgMTAyNCA1NzYiIG1pZGRsZT0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMjQiIGhlaWdodD0iNTc2IiBmaWxsPSIjMjIyMjIyIi8+CjxjaXJjbGUgY3g9IjUwMiIgY3k9IjI2MiIgcj0iMTAwIiBmaWxsPSIjQjFCOUIxIi8+CjxjaXJjbGUgY3g9IjUwMiIgY3k9IjI2MiIgcj0iNzAiIGZpbGw9IiNEMURFRDEiLz4KPHN2ZyB4PSI0NTIiIHk9IjIyMiIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9Im5vbmUiIGZpbGwtb3BhY2l0eT0iMC4zIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYSIgeDE9IjAiIHkxPSIwIiB4Mj0iMTIwIiB5Mj0iMTIwIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0I1QjViNSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNCMUJ5QjEiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0idXJsKCNhKSIgb3BhY2l0eT0iMC42Ii8+CiAgPC9kZWZzPgogIDwvc3ZnPgogPHN2ZyB4PSI1ODIiIHk9IjIwMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSJub25lIiBmaWxsLW9wYWNpdHk9IjAuNCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImIiIHgxPSIwIiB5MT0iMCIgeDI9IjUwIiB5Mj0iNTAiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjQjVCNUI1Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0IxQjViMSIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxyZWN0IHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgZmlsbD0idXJsKCNiKSIgb3BhY2l0eT0iMC42Ii8+CiAgPC9kZWZzPgogIDwvc3ZnPgogPC9zdmc+';
  
  // 使用useMemo确保currentSrc与src同步更新，避免异步更新问题
  const currentSrc = useMemo(() => {
    // 如果disableFallback为true，直接使用原始URL，不经过处理
    if (disableFallback) {
      console.log(`LazyImage: 直接使用原始URL: ${src}`);
      return src;
    }
    const processedSrc = processImageUrl(src);
    console.log(`LazyImage: 处理前URL: ${src}, 处理后URL: ${processedSrc}`);
    return processedSrc || (fallbackSrc || defaultFallbackSrc);
  }, [src, fallbackSrc, disableFallback]);
  
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
    console.error(`图片加载失败: ${currentSrc}`, event);
    setIsError(true);
    setIsLoaded(false);
    if (onError) {
      onError();
    }
  };
  
  // 当src变化时重置加载状态
  useEffect(() => {
    // 重置状态，确保新图片能正确显示加载过程
    setIsLoaded(false);
    setIsError(false);
  }, [src]);

  // 观察图片是否进入视口
  useEffect(() => {
    // 立即设置为可见，确保图片能够加载
    setIsVisible(true);
    
    // 优先级高的图片立即加载，不使用懒加载
    if (priority) {
      return;
    }
    
    // 如果浏览器不支持IntersectionObserver，则直接返回
    if (!('IntersectionObserver' in window)) {
      return;
    }
    
    // 创建IntersectionObserver实例 - 仅用于监控可见性，不影响初始加载
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          // 图片进入视口后，停止观察
          if (observerRef.current) {
            observerRef.current.unobserve(entry.target);
            observerRef.current.disconnect();
            observerRef.current = null;
          }
        }
      },
      {
        // 提前100px开始加载
        rootMargin: '100px 0px',
        // 当图片10%进入视口时触发
        threshold: 0.1
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
  
  // 自定义占位符
  const defaultPlaceholder = (
    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg flex items-center justify-center">
      <i className="fas fa-image text-gray-400 dark:text-gray-500 text-2xl"></i>
    </div>
  );
  
  return (
    <div className={`relative ${className}`}>
      {/* 图片容器，保持宽高比 */}
      <div 
        ref={containerRef}
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
        {/* 图片元素 - 始终显示，通过opacity控制加载效果 */}
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          className={`w-full h-full object-${fit} transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-100'}`}
          onLoad={handleLoad}
          onError={handleError}
          {...rest}
        />
        
        {/* 加载失败状态 - 显示fallback图片 */}
        {isError && (
          <img
            src={fallbackSrc || defaultFallbackSrc}
            alt={`${alt} 的占位图`}
            className="absolute inset-0 z-20 w-full h-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
