import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import GradientHero from '@/components/GradientHero';
import { preloadImage, cleanupCache } from '@/utils/imageLoader';

// 定义POI类型
interface POI {
  id: number;
  name: string;
  category: string;
  description: string;
  address: string;
  position: { x: number; y: number; lat?: number; lng?: number };
  year: number;
  image: string;
  openingHours?: string;
  phone?: string;
  importance?: number;
}

interface Category {
  name: string;
  icon: string;
  color: string;
}

interface POIData {
  version: string;
  lastUpdated: string;
  categories: Record<string, Category>;
  poi: POI[];
}

// 本地定义POI数据，避免JSON导入错误
const localPOIData: POIData = {
  "version": "1.0.0",
  "lastUpdated": "2025-12-23",
  "categories": {
    "food": {
      "name": "餐饮美食",
      "icon": "🍜",
      "color": "bg-yellow-500"
    },
    "retail": {
      "name": "零售百货",
      "icon": "🏪",
      "color": "bg-blue-500"
    },
    "craft": {
      "name": "手工艺",
      "icon": "🎨",
      "color": "bg-purple-500"
    },
    "landmark": {
      "name": "地标建筑",
      "icon": "🏰",
      "color": "bg-red-500"
    },
    "culture": {
      "name": "文化艺术",
      "icon": "📚",
      "color": "bg-green-500"
    }
  },
  "poi": [
    {
      "id": 1,
      "name": "狗不理包子",
      "category": "food",
      "description": "天津著名的传统小吃，以皮薄馅大、鲜香可口著称，有着悠久的历史和文化底蕴。",
      "address": "天津市和平区山东路77号",
      "position": { "x": 45, "y": 55 },
      "year": 1858,
      "image": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop",
      "openingHours": "08:00-22:00",
      "phone": "022-27306590",
      "importance": 5
    },
    {
      "id": 2,
      "name": "十八街麻花",
      "category": "food",
      "description": "天津传统名点，以酥脆香甜、久放不绵而闻名，是天津三绝之一。",
      "address": "天津市河西区大沽南路566号",
      "position": { "x": 50, "y": 60 },
      "year": 1912,
      "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop",
      "openingHours": "09:00-21:00",
      "phone": "022-28326900",
      "importance": 4
    },
    {
      "id": 3,
      "name": "耳朵眼炸糕",
      "category": "food",
      "description": "天津传统风味小吃，以皮酥脆、馅香甜、不腻口而著称，是天津三绝之一。",
      "address": "天津市红桥区北门外大街12号",
      "position": { "x": 48, "y": 52 },
      "year": 1900,
      "image": "https://images.unsplash.com/photo-1576827152400-24a02034b260?w=800&h=600&fit=crop",
      "openingHours": "08:30-20:30",
      "phone": "022-27275033",
      "importance": 4
    },
    {
      "id": 4,
      "name": "劝业场",
      "category": "retail",
      "description": "天津著名的百年老商场，是天津商业的标志性建筑，融合了多种建筑风格。",
      "address": "天津市和平区和平路290号",
      "position": { "x": 47, "y": 56 },
      "year": 1928,
      "image": "https://images.unsplash.com/photo-1560448204-e02f11bad21b?w=800&h=600&fit=crop",
      "openingHours": "10:00-22:00",
      "phone": "022-27211818",
      "importance": 5
    },
    {
      "id": 5,
      "name": "杨柳青年画",
      "category": "craft",
      "description": "中国四大木版年画之一，以色彩艳丽、题材丰富、构图饱满而著称，具有浓郁的民间艺术特色。",
      "address": "天津市西青区杨柳青镇估衣街23号",
      "position": { "x": 42, "y": 48 },
      "year": 1600,
      "image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop",
      "openingHours": "09:00-17:00",
      "phone": "022-27940617",
      "importance": 5
    },
    {
      "id": 6,
      "name": "泥人张彩塑",
      "category": "craft",
      "description": "天津传统民间艺术，以形神兼备、色彩鲜明、做工精细而闻名，是中国泥塑艺术的代表。",
      "address": "天津市南开区古文化街宫北大街通庆里4号",
      "position": { "x": 46, "y": 54 },
      "year": 1844,
      "image": "https://images.unsplash.com/photo-1511104491606-aa6905b541e4?w=800&h=600&fit=crop",
      "openingHours": "09:00-18:00",
      "phone": "022-27353157",
      "importance": 5
    },
    {
      "id": 7,
      "name": "天津之眼",
      "category": "landmark",
      "description": "世界上唯一建在桥上的摩天轮，是天津的标志性建筑之一，俯瞰天津市区全景。",
      "address": "天津市红桥区李公祠大街与五马路交口",
      "position": { "x": 44, "y": 50 },
      "year": 2008,
      "image": "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop",
      "openingHours": "09:30-21:30",
      "phone": "022-26288830",
      "importance": 5
    },
    {
      "id": 8,
      "name": "天津大剧院",
      "category": "culture",
      "description": "现代化的大型综合剧场，是天津文化艺术的重要阵地，举办各类高水平演出。",
      "address": "天津市河西区平江道58号",
      "position": { "x": 49, "y": 58 },
      "year": 2012,
      "image": "https://images.unsplash.com/photo-1578473349177-3985528a3b9c?w=800&h=600&fit=crop",
      "openingHours": "根据演出时间而定",
      "phone": "022-83882000",
      "importance": 4
    }
  ]
};

// 获取所有POI数据
const mapData = localPOIData.poi;

// 获取分类数据
const categories = localPOIData.categories;

export default function TianjinMap() {
  const { isDark, theme } = useTheme();
  const [zoom, setZoom] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState<POI | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<{[key: number]: boolean}>({});
  const [mapImageLoaded, setMapImageLoaded] = useState(false);
  const [mapImageUrl, setMapImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  
  // 地图拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  // 地图容器引用
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // 地图背景图片URL
  const mapBackgroundUrl = "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20historical%20map%20with%20traditional%20Chinese%20style%20detailed%20city%20layout%20accurate%20districts";
  
  // 预加载地图背景图片
  useEffect(() => {
    const loadMapImage = async () => {
      try {
        setIsLoading(true);
        const cachedImageUrl = await preloadImage(mapBackgroundUrl);
        setMapImageUrl(cachedImageUrl);
        setMapImageLoaded(true);
      } catch (error) {
        console.error('Failed to load map image:', error);
        // 使用默认地图图片
        setMapImageUrl(mapBackgroundUrl);
        setMapImageLoaded(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMapImage();
  }, []);
  
  // 预加载POI图片
  useEffect(() => {
    const preloadPOIImages = async () => {
      const imagePromises = mapData.map(poi => {
        return preloadImage(poi.image)
          .then(() => {
            setImageLoaded(prev => ({ ...prev, [poi.id]: true }));
          })
          .catch(error => {
            console.error(`Failed to preload image for ${poi.name}:`, error);
            setImageLoaded(prev => ({ ...prev, [poi.id]: true }));
          });
      });
      
      await Promise.all(imagePromises);
    };
    
    preloadPOIImages();
  }, []);
  
  // 检查标记点是否在视口中
  const isMarkerInViewport = useCallback((marker: POI) => {
    if (!mapContainerRef.current) return true;
    
    const container = mapContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // 计算标记点在屏幕上的位置
    const markerX = (marker.position.x / 100) * containerRect.width * zoom + offset.x;
    const markerY = (marker.position.y / 100) * containerRect.height * zoom + offset.y;
    
    // 检查标记点是否在视口内（添加一些缓冲区域）
    const buffer = 100;
    return (
      markerX > -buffer &&
      markerX < containerRect.width + buffer &&
      markerY > -buffer &&
      markerY < containerRect.height + buffer
    );
  }, [zoom, offset]);
  
  // 计算标记点大小（根据重要性和缩放级别）
  const getMarkerSize = useCallback((importance: number = 3) => {
    const baseSize = 8;
    const scaleByImportance = importance / 3;
    const scaleByZoom = Math.min(zoom, 2);
    return baseSize * scaleByImportance * scaleByZoom;
  }, [zoom]);

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePosition({ x: e.clientX, y: e.clientY });
  };

  // 处理鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMousePosition.x;
    const deltaY = e.clientY - lastMousePosition.y;
    
    setOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastMousePosition({ x: e.clientX, y: e.clientY });
  };

  // 处理鼠标释放事件
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 处理鼠标离开事件
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // 处理滚轮事件
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    // 计算缩放因子
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(2, zoom * scaleFactor));
    
    setZoom(newZoom);
  };

  // 筛选数据
  const filteredBrands = mapData.filter(brand => {
    const matchesCategory = selectedCategory === 'all' || brand.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
                         brand.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         brand.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // 根据视口可见性过滤标记点
  const visibleMarkers = filteredBrands.filter(isMarkerInViewport);

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    return categories[category]?.color || 'bg-gray-500';
  };

  // 获取分类图标
  const getCategoryIcon = (category: string) => {
    return categories[category]?.icon || '📍';
  };

  // 获取分类名称
  const getCategoryName = (category: string) => {
    return categories[category]?.name || '其他';
  };

  // 处理标记点击
  const handleMarkerClick = (brand: POI) => {
    setSelectedBrand(brand);
    setShowInfo(true);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>
      {/* 英雄区 */}
      <GradientHero 
        title="天津老字号历史地图" 
        subtitle="探索天津百年老字号的历史分布与文化传承" 
        theme="heritage"
        stats={[
          { label: '文化资源', value: mapData.length.toString() },
          { label: '文化分类', value: Object.keys(categoryNames).length.toString() },
          { label: '历史跨度', value: '近200年' },
          { label: '文化遗产', value: '国家级' }
        ]}
        pattern={true}
        size="lg"
      />

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        {/* 地图控制区 */}
        <div className={`p-6 rounded-2xl shadow-lg mb-6 ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'}`}>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* 分类筛选 */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button 
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${selectedCategory === 'all' ? (isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white') : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                onClick={() => setSelectedCategory('all')}
              >
                全部
              </button>
              {Object.entries(categories).map(([key, category]) => (
                <button 
                  key={key}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${selectedCategory === key ? (isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white') : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                  onClick={() => setSelectedCategory(key)}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>

            {/* 搜索和缩放控制 */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full md:w-auto">
              {/* 搜索输入框 */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="搜索老字号或地标..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300`}
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>

              {/* 缩放控制 */}
              <div className="flex gap-2">
                <button 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
                  disabled={zoom <= 0.5}
                >
                  <i className="fas fa-minus"></i>
                </button>
                <button 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  onClick={() => setZoom(Math.min(2, zoom + 0.2))}
                  disabled={zoom >= 2}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 地图展示区 */}
        <div 
          ref={mapContainerRef}
          className={`relative w-full h-[600px] rounded-2xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        >
          {/* 地图加载状态 */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 border-4 border-t-red-500 border-white rounded-full animate-spin"></div>
                <p className="text-white text-lg font-medium">加载地图中...</p>
              </div>
            </div>
          )}
          
          {/* 地图背景 */}
          <div className="absolute inset-0 bg-cover bg-center opacity-20 relative">
            {/* 使用预加载的图片 */}
            <img
              src={mapImageUrl}
              alt="天津历史地图"
              className={`absolute inset-0 w-full h-full object-cover opacity-100 transition-opacity duration-500 ${mapImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ 
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.3s ease-out'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // 使用内置SVG作为地图背景占位
                target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23${isDark ? '1f2937' : 'f3f4f6'}'/%3E%3Ctext x='600' y='400' font-family='Arial' font-size='48' fill='%23${isDark ? '9ca3af' : '6b7280'}' text-anchor='middle' dy='0.3em'%3ETianjin Historical Map%3C/text%3E%3C/svg%3E`;
                setMapImageLoaded(true);
                setIsLoading(false);
              }}
              onLoad={() => {
                setMapImageLoaded(true);
                setIsLoading(false);
              }}
            />
          </div>

          {/* 标记点 */}
          {visibleMarkers.map(brand => {
            const markerSize = getMarkerSize(brand.importance);
            return (
              <motion.div
                key={brand.id}
                className="absolute cursor-pointer"
                style={{ 
                  left: `${brand.position.x}%`, 
                  top: `${brand.position.y}%`,
                  transform: `translate(${offset.x}px, ${offset.y}px) translate(-50%, -50%) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                }}
                onClick={() => handleMarkerClick(brand)}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  ease: "easeOut",
                  delay: Math.random() * 0.3 // 随机延迟，使动画更自然
                }}
                whileHover={{ scale: 1.3 }}
              >
                <div className="relative">
                  {/* 脉冲动画背景 */}
                  <motion.div
                    className={`absolute inset-0 rounded-full ${getCategoryColor(brand.category)} opacity-30`}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* 主标记点 */}
                  <div className={`rounded-full ${getCategoryColor(brand.category)} border-2 border-white shadow-lg flex items-center justify-center text-white font-bold`}
                       style={{ width: `${markerSize}px`, height: `${markerSize}px`, fontSize: `${markerSize / 2}px` }}>
                    {getCategoryIcon(brand.category)}
                  </div>
                  
                  {/* 品牌名称提示 */}
                  <motion.div 
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none"
                    initial={{ opacity: 0, y: 5 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {brand.name}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}

          {/* 信息面板 */}
          {showInfo && selectedBrand && (
            <motion.div
              className={`absolute bottom-4 left-4 right-4 md:left-4 md:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden z-10`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
            >
              {/* 图片区域 */}
              <div className="relative h-52 overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10"></div>
                <img 
                  src={selectedBrand.image} 
                  alt={selectedBrand.name} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  onLoad={() => setImageLoaded(prev => ({ ...prev, [selectedBrand.id]: true }))}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // 使用内置占位图替代外部服务
                    target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23${isDark ? '374151' : 'e5e7eb'}'/%3E%3Ctext x='200' y='150' font-family='Arial' font-size='20' fill='%23${isDark ? '9ca3af' : '6b7280'}' text-anchor='middle' dy='0.3em'%3E${selectedBrand.name}%3C/text%3E%3Ctext x='200' y='180' font-family='Arial' font-size='14' fill='%23${isDark ? '9ca3af' : '6b7280'}' text-anchor='middle' dy='0.3em'%3E图片加载中...%3C/text%3E%3C/svg%3E`;
                    target.alt = `${selectedBrand.name} 图片`;
                    setImageLoaded(prev => ({ ...prev, [selectedBrand.id]: true }));
                  }}
                  style={{ display: imageLoaded[selectedBrand.id] ? 'block' : 'none' }}
                />
                {/* 图片加载占位 */}
                {!imageLoaded[selectedBrand.id] && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex flex-col items-center justify-center">
                    <i className="fas fa-image text-4xl text-gray-400 dark:text-gray-500 mb-2"></i>
                    <span className="text-sm text-gray-500 dark:text-gray-400">加载图片中...</span>
                  </div>
                )}
                
                {/* 年份徽章 */}
                <div className="absolute top-3 left-3 bg-black/80 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <i className="fas fa-calendar-alt text-xs"></i>
                  {selectedBrand.year} 年
                </div>
              </div>
              
              {/* 内容区域 */}
              <div className="p-5">
                <h3 className="text-2xl font-bold mb-2 dark:text-white">{selectedBrand.name}</h3>
                
                {/* 分类和地址 */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                    {getCategoryIcon(selectedBrand.category)} {getCategoryName(selectedBrand.category)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <i className="fas fa-map-marker-alt text-xs"></i>
                    {selectedBrand.address}
                  </span>
                </div>
                
                {/* 开放时间和联系电话 */}
                {selectedBrand.openingHours && (
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-clock text-gray-500 dark:text-gray-400 text-sm"></i>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{selectedBrand.openingHours}</span>
                  </div>
                )}
                
                {selectedBrand.phone && (
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-phone text-gray-500 dark:text-gray-400 text-sm"></i>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{selectedBrand.phone}</span>
                  </div>
                )}
                
                {/* 描述 */}
                <p className="text-sm dark:text-gray-300 mb-5 leading-relaxed">{selectedBrand.description}</p>
                
                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <button 
                    className={`flex-1 py-2 rounded-lg transition-all duration-300 ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} font-medium text-sm flex items-center justify-center gap-1 shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                    onClick={() => setShowInfo(false)}
                  >
                    <i className="fas fa-times"></i>
                    关闭
                  </button>
                  <button 
                    className={`flex-1 py-2 rounded-lg transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} font-medium text-sm flex items-center justify-center gap-1 shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                  >
                    <i className="fas fa-share-alt"></i>
                    分享
                  </button>
                </div>
                
                {/* AR体验按钮 */}
                <button 
                  className={`w-full mt-3 py-2 rounded-lg transition-all duration-300 ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} font-medium text-sm flex items-center justify-center gap-1 shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                  onClick={() => window.open('/AR', '_blank', 'width=1000,height=800')}
                >
                  <i className="fas fa-vr-cardboard"></i>
                  AR体验
                </button>
              </div>
            </motion.div>
          )}

          {/* 缩放控制按钮 */}
          <div className={`absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 space-y-2 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button 
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              onClick={() => setZoom(Math.min(2, zoom + 0.2))}
              disabled={zoom >= 2}
            >
              <i className="fas fa-plus"></i>
            </button>
            <button 
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
              disabled={zoom <= 0.5}
            >
              <i className="fas fa-minus"></i>
            </button>
          </div>
        </div>

        {/* 地图说明 */}
        <div className={`p-6 rounded-2xl shadow-lg mt-6 ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'}`}>
          <h3 className="text-xl font-bold mb-4">地图使用说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <i className="fas fa-mouse-pointer text-red-500 mt-1"></i>
              <div>
                <h4 className="font-semibold">点击标记</h4>
                <p className="text-sm dark:text-gray-400">点击地图上的标记点查看老字号详细信息</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-filter text-blue-500 mt-1"></i>
              <div>
                <h4 className="font-semibold">分类筛选</h4>
                <p className="text-sm dark:text-gray-400">使用顶部分类按钮筛选不同类型的老字号</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-search-plus text-green-500 mt-1"></i>
              <div>
                <h4 className="font-semibold">缩放控制</h4>
                <p className="text-sm dark:text-gray-400">使用右上角的缩放按钮调整地图大小</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-info-circle text-purple-500 mt-1"></i>
              <div>
                <h4 className="font-semibold">了解历史</h4>
                <p className="text-sm dark:text-gray-400">探索天津老字号的百年历史与文化传承</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}