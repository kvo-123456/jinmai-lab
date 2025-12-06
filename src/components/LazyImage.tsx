import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import imageService from '../services/imageService';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean; // 优先级，true表示立即加载
  quality?: 'low' | 'medium' | 'high'; // 图片质量
  loading?: 'eager' | 'lazy'; // 加载方式
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
  priority = false,
  quality = 'medium',
  loading = 'lazy'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isPlaceholderLoaded, setIsPlaceholderLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [placeholderSrc, setPlaceholderSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const placeholderRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadStartTimeRef = useRef<number>(0);

  useEffect(() => {
    // 优化：检查浏览器是否支持WebP格式
    const supportsWebP = (() => {
      try {
        const canvas = document.createElement('canvas');
        if (canvas.getContext && canvas.getContext('2d')) {
          return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        }
      } catch (e) {}
      return false;
    })();
    
    // 处理占位符图片，直接返回原始URL，不进行额外处理
    if (src.includes('placeholder.com')) {
      setPlaceholderSrc(src);
      setCurrentSrc(src);
      return;
    }
    
    // 生成低质量占位符URL
    const lowQualityUrl = imageService.getLowQualityUrl(src);
    setPlaceholderSrc(lowQualityUrl);
    
    // 生成高质量图片URL - 直接使用imageService的响应式URL生成功能
    // 根据质量等级映射到响应式尺寸
    const sizeMap: Record<string, 'sm' | 'md' | 'lg' | 'xl'> = {
      low: 'sm',
      medium: 'md',
      high: 'lg'
    };
    const responsiveSize = sizeMap[quality] as 'sm' | 'md' | 'lg' | 'xl';
    
    // 优化：如果支持WebP，优先使用WebP格式
    let highQualityUrl = imageService.getResponsiveUrl(src, responsiveSize);
    // 只对实际的图片服务URL进行WebP转换，跳过占位符图片
    if (supportsWebP && !highQualityUrl.includes('format=webp') && 
        (highQualityUrl.includes('trae-api-sg.mchost.guru') || highQualityUrl.includes('/api/proxy/'))) {
      highQualityUrl += (highQualityUrl.includes('?') ? '&' : '?') + 'format=webp';
    }
    
    setCurrentSrc(highQualityUrl);
  }, [src, quality, width]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // 立即加载高优先级图片
    if (priority || loading === 'eager') {
      loadStartTimeRef.current = Date.now();
      img.src = currentSrc;
      return;
    }

    // 检查浏览器是否支持 Intersection Observer
    if ('IntersectionObserver' in window) {
      // 优化：根据设备性能调整预加载距离
      const devicePerformance = navigator.hardwareConcurrency || 4;
      const preloadDistance = devicePerformance > 4 ? '300px' : '150px';
      
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // 图片进入视口，开始加载
              loadStartTimeRef.current = Date.now();
              img.src = currentSrc;
              observerRef.current?.unobserve(img);
            }
          });
        },
        {
          // 优化：根据设备性能调整预加载距离
          rootMargin: `${preloadDistance} 0px`,
          // 优化：降低阈值，图片刚进入视口就开始加载
          threshold: 0.01
        }
      );

      observerRef.current.observe(img);
    } else {
      // 不支持 Intersection Observer，直接加载图片
      loadStartTimeRef.current = Date.now();
      img.src = currentSrc;
    }

    return () => {
      if (observerRef.current && img) {
        observerRef.current.unobserve(img);
      }
    };
  }, [currentSrc, priority, loading]);

  const handleLoad = () => {
    const loadTime = Date.now() - loadStartTimeRef.current;
    // console.log(`Image loaded in ${loadTime}ms: ${src}`);
    setIsLoaded(true);
    onLoad?.();
    
    // 获取图片实际尺寸
    const img = imgRef.current;
    const imageSize = img ? img.naturalWidth * img.naturalHeight : undefined;
    
    // 更新图片状态到缓存，包含加载时间和尺寸
    imageService.updateImageStatus(src, true, imageSize);
  };

  const handleError = () => {
    console.error(`Failed to load image: ${src}`);
    setIsError(true);
    onError?.();
    
    // 更新图片状态到缓存
    imageService.updateImageStatus(src, false);
  };

  const handlePlaceholderLoad = () => {
    setIsPlaceholderLoaded(true);
  };

  return (
    <div
      className={clsx(
        'relative overflow-hidden',
        isLoaded ? '' : 'bg-gray-100 dark:bg-gray-800',
        placeholderClassName
      )}
      style={{
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
      }}
    >
      {/* 低质量占位符图片 */}
      {!isLoaded && (
        <img
          ref={placeholderRef}
          src={placeholderSrc}
          alt={alt}
          className={clsx(
            'absolute inset-0 w-full h-full object-cover',
            isPlaceholderLoaded ? 'opacity-100' : 'opacity-0',
            'transition-opacity duration-300 ease-in-out blur-sm'
          )}
          width={width}
          height={height}
          onLoad={handlePlaceholderLoad}
          onError={() => setIsPlaceholderLoaded(true)}
          loading="eager"
        />
      )}
      
      {/* 加载动画 */}
      {!isLoaded && !isPlaceholderLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 高质量图片 */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={clsx(
          'w-full h-full object-cover transition-all duration-500 ease-in-out',
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
          isError ? 'hidden' : '',
          className
        )}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
      />
      
      {/* 加载错误占位符 */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <i className="fas fa-image text-4xl text-gray-300 dark:text-gray-600"></i>
        </div>
      )}
    </div>
  );
}