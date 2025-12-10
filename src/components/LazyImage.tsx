import { useState, useRef, useMemo, useEffect } from 'react';
import { clsx } from 'clsx';
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
  priority,
  loading = 'lazy',
  sizes = '100vw',
  ratio = 'auto',
  fit = 'cover'
}: LazyImageProps) {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackSrc, setFallbackSrc] = useState<string | undefined>(undefined);
  const [retryCount, setRetryCount] = useState(0);
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
    // 创建一个默认的灰色背景作为备用，更符合整体设计风格
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // 绘制一个浅灰色背景
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 绘制一个简洁的图片图标
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.arc(256, 200, 40, 0, Math.PI * 2);
      ctx.fill();
      
      // 绘制相机镜头
      ctx.fillStyle = '#6b7280';
      ctx.beginPath();
      ctx.arc(256, 200, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // 绘制相机机身
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(180, 240, 152, 80);
      
      // 绘制相机手柄
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(240, 320, 32, 20);
      
      // 绘制文字
      ctx.fillStyle = '#6b7280';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('图片加载失败', canvas.width / 2, 380);
      ctx.font = '14px Arial';
      ctx.fillText('点击重试', canvas.width / 2, 410);
    }
    // 将canvas转换为data URL
    return canvas.toDataURL('image/png');
  };

  // 使用imageService获取可靠的图片URL
  const [finalSrc, setFinalSrc] = useState<string>(src);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true);

  // 初始化时获取可靠的图片URL
  useEffect(() => {
    const getReliableUrl = async () => {
      try {
        const reliableUrl = await imageService.getReliableImageUrl(src, alt, {
          priority: priority,
          size: 'md',
          validate: false // 快速返回，不进行验证
        });
        setFinalSrc(reliableUrl);
      } catch (error) {
        console.error('Failed to get reliable image URL:', error);
      }
    };

    getReliableUrl();
  }, [src, alt, priority]);

  const handleLoad = () => {
    setIsLoading(false);
    setIsError(false);
    setIsLoadingImage(false);
    // 更新图片服务的缓存状态
    imageService.updateImageStatus(src, true);
    onLoad?.();
  };

  const handleError = () => {
    // 更新图片服务的缓存状态
    imageService.updateImageStatus(src, false);
    
    if (retryCount < 2) {
      // 生成备用图像并设置
      const fallbackImage = generateFallbackImage();
      setFallbackSrc(fallbackImage);
      setIsError(true);
      setIsLoading(false);
      setIsLoadingImage(false);
      onError?.();
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    setIsError(false);
    setRetryCount(prev => prev + 1);
    setIsLoadingImage(true);
    
    // 清除旧的缓存条目，强制重新加载
    imageService.clearCache(src);
    
    // 获取新的图片URL并重新加载
    const getNewUrl = async () => {
      try {
        const newUrl = await imageService.getReliableImageUrl(src, alt, {
          priority: priority,
          size: 'md',
          validate: false
        });
        setFinalSrc(newUrl);
        if (imgRef.current) {
          imgRef.current.src = newUrl;
        }
      } catch (error) {
        console.error('Failed to get new image URL:', error);
      }
    };

    getNewUrl();
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
      {/* 图片元素 */}
      <img
        ref={imgRef}
        src={isError ? fallbackSrc : finalSrc}
        alt={alt}
        className={clsx(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        width={width}
        height={height}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        decoding="async"
        style={{
          objectFit: fit,
          display: 'block'
        }}
      />
      
      {/* 加载状态指示器 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100 dark:bg-gray-800">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* 错误提示 - 始终可见，方便用户操作 */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100 dark:bg-gray-800">
          <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
            <div className="mb-4 text-gray-600 dark:text-gray-300">图片加载失败</div>
            <button 
              onClick={handleRetry}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-300"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重试
            </button>
          </div>
        </div>
      )}
    </div>
  );
}