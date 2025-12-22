import React, { useState, useEffect } from 'react';
import LazyImage from '../components/LazyImage';
import imageService from '../services/imageService';

// 测试图片数据
const testImages = [
  { id: 1, url: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=600&h=600&fit=crop', alt: '测试图片 1' },
  { id: 2, url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&h=600&fit=crop', alt: '测试图片 2' },
  { id: 3, url: 'https://images.unsplash.com/photo-1520338395080-e0132be9dcd2?w=600&h=600&fit=crop', alt: '测试图片 3' },
  { id: 4, url: 'https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?w=600&h=600&fit=crop', alt: '测试图片 4' },
  { id: 5, url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=600&fit=crop', alt: '测试图片 5' },
  { id: 6, url: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&h=600&fit=crop', alt: '测试图片 6' },
  { id: 7, url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&h=600&fit=crop', alt: '测试图片 7' },
  { id: 8, url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=600&fit=crop', alt: '测试图片 8' },
  { id: 9, url: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=600&h=600&fit=crop', alt: '测试图片 9' },
  { id: 10, url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=600&fit=crop', alt: '测试图片 10' },
  { id: 11, url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=600&fit=crop', alt: '测试图片 11' },
  { id: 12, url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&h=600&fit=crop', alt: '测试图片 12' },
];

const ImageTest: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 获取图片服务统计信息
  useEffect(() => {
    const updateStats = () => {
      const performanceStats = imageService.getPerformanceStats();
      const cacheInfo = imageService.getCacheStats();
      setStats(performanceStats);
      setCacheStats(cacheInfo);
    };

    // 初始加载后更新统计信息
    const timer = setTimeout(() => {
      updateStats();
      setIsLoading(false);
    }, 2000);

    // 定期更新统计信息
    const interval = setInterval(updateStats, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // 预加载部分图片
  useEffect(() => {
    const preloadUrls = testImages.slice(0, 6).map(img => img.url);
    imageService.preloadImages(preloadUrls);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">图片加载测试页面</h1>

      {/* 统计信息 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">图片服务统计信息</h2>
        {isLoading ? (
          <div className="text-center text-gray-500">正在加载统计信息...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm text-gray-500">总请求数</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.totalRequests}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm text-gray-500">缓存命中率</h3>
              <p className="text-2xl font-bold text-green-600">{cacheStats.hitRate}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm text-gray-500">加载成功率</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.successRate}%</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm text-gray-500">平均加载时间</h3>
              <p className="text-2xl font-bold text-yellow-600">{(stats.averageLoadTime || 0).toFixed(0)}ms</p>
            </div>
          </div>
        )}
      </div>

      {/* 图片网格测试 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">LazyImage 组件测试</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {testImages.map((image, index) => (
            <div key={image.id} className="aspect-square">
              <LazyImage
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover rounded-lg"
                priority={index < 3} // 前3张图片优先加载
                quality={index < 6 ? 'high' : 'medium'} // 前6张图片使用高质量
                ratio="square"
                fit="cover"
                loading="lazy"
              />
              <div className="mt-2 text-sm text-gray-500 text-center">
                图片 {image.id} {index < 3 ? '(优先加载)' : index < 6 ? '(高质量)' : '(中等质量)'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 不同配置测试 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">不同配置测试</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">不同宽高比</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <LazyImage
                  src={testImages[0].url}
                  alt="方形"  
                  ratio="square"
                  className="rounded-lg"
                />
                <div className="mt-1 text-xs text-center text-gray-500">方形 (1:1)</div>
              </div>
              <div>
                <LazyImage
                  src={testImages[1].url}
                  alt="横向"  
                  ratio="landscape"
                  className="rounded-lg"
                />
                <div className="mt-1 text-xs text-center text-gray-500">横向 (16:9)</div>
              </div>
              <div>
                <LazyImage
                  src={testImages[2].url}
                  alt="纵向"  
                  ratio="portrait"
                  className="rounded-lg"
                />
                <div className="mt-1 text-xs text-center text-gray-500">纵向 (4:5)</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">不同填充方式</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <LazyImage
                  src={testImages[3].url}
                  alt="覆盖填充"
                  fit="cover"
                  className="rounded-lg"
                />
                <div className="mt-1 text-xs text-center text-gray-500">覆盖填充 (cover)</div>
              </div>
              <div>
                <LazyImage
                  src={testImages[4].url}
                  alt="包含填充"
                  fit="contain"
                  className="rounded-lg bg-gray-100"
                />
                <div className="mt-1 text-xs text-center text-gray-500">包含填充 (contain)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 代理URL测试 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">API代理URL测试</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">TRA API代理图片</h3>
            <LazyImage
              src="/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=China%20traditional%20craft%20revitalization%20plan%20implementation%20achievements"
              alt="TRA API代理图片"
              className="rounded-lg"
              ratio="landscape"
            />
            <div className="mt-2 text-xs text-gray-500">
              URL: /api/proxy/trae-api/api/ide/v1/text_to_image
            </div>
          </div>
        </div>
      </div>

      {/* 错误处理测试 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">错误处理测试</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">无效图片URL</h3>
            <LazyImage
              src="https://invalid-url.example.com/nonexistent-image.jpg"
              alt="无效图片"
              className="rounded-lg"
              ratio="square"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">空图片URL</h3>
            <LazyImage
              src=""
              alt="空图片"
              className="rounded-lg"
              ratio="square"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageTest;
