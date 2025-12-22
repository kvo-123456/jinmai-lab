import React, { useState } from 'react';
import { TianjinImage } from './TianjinStyleComponents';
import { motion } from 'framer-motion';

interface ImageTestItem {
  id: number;
  src: string;
  alt: string;
  isError: boolean;
}

export default function ImageLoaderTest() {
  const [images, setImages] = useState<ImageTestItem[]>([
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=600&fit=crop&q=80',
      alt: '有效图片',
      isError: false
    },
    {
      id: 2,
      src: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=SDXL%2C%20老字号品牌%20creative%20work%2C%20high%20detail&unique=133',
      alt: 'API代理图片',
      isError: false
    },
    {
      id: 3,
      src: 'https://invalid-url.example.com/nonexistent-image.jpg',
      alt: '无效图片URL',
      isError: false
    },
    {
      id: 4,
      src: '',
      alt: '空URL',
      isError: false
    },
    {
      id: 5,
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
      alt: '风景图片',
      isError: false
    }
  ]);

  const handleImageLoad = (id: number) => {
    console.log(`图片加载成功: ${id}`);
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, isError: false } : img
    ));
  };

  const handleImageError = (id: number) => {
    console.log(`图片加载失败: ${id}`);
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, isError: true } : img
    ));
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">图片加载测试</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <motion.div
            key={image.id}
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: image.id * 0.1 }}
          >
            <div className="mb-3">
              <TianjinImage
                src={image.src}
                alt={image.alt}
                className="w-full h-48 object-cover"
                ratio="landscape"
                withBorder={true}
                imageTag={image.isError ? 'error' : 'success'}
                onLoad={() => handleImageLoad(image.id)}
                onError={() => handleImageError(image.id)}
              />
            </div>
            
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">图片 {image.id}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{image.alt}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${image.isError ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
                  {image.isError ? '加载失败' : '加载成功'}
                </span>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{image.src}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">测试说明</h3>
        <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>图片1: 有效外部URL，应成功加载</li>
          <li>图片2: API代理URL，应成功加载</li>
          <li>图片3: 无效URL，应显示fallback图片</li>
          <li>图片4: 空URL，应显示fallback图片</li>
          <li>图片5: 有效外部URL，应成功加载</li>
        </ul>
      </div>
    </div>
  );
}
