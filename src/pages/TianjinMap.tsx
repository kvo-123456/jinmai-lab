import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import GradientHero from '@/components/GradientHero';
import AMapLoader from '@amap/amap-jsapi-loader';
import { 
  AMAP_KEY, 
  MAP_INIT_CONFIG, 
  MOCK_COORDINATES, 
  CATEGORY_ICONS, 
  CATEGORY_COLORS, 
  CATEGORY_NAMES 
} from '@/utils/mapUtils';

// 声明AMap全局变量
declare global {
  interface Window {
    AMap: any;
  }
}

// 定义POI类型
interface POI {
  id: number;
  name: string;
  category: string;
  description: string;
  address: string;
  position: { x: number; y: number; lat?: number; lng?: number };
  year: number;
  images: string[];
  openingHours?: string;
  phone?: string;
  importance?: number;
  tags?: string[];
  relatedPois?: number[];
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

// 本地定义POI数据，包含真实经纬度
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
      "position": { 
        "x": 45, 
        "y": 55, 
        "lng": MOCK_COORDINATES[1][0], 
        "lat": MOCK_COORDINATES[1][1] 
      },
      "year": 1858,
      "images": [
        "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1626084896955-33563b55b0ca?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop"
      ],
      "openingHours": "08:00-22:00",
      "phone": "022-27306590",
      "importance": 5,
      "tags": ["天津三绝", "传统小吃", "百年老店"],
      "relatedPois": [2, 3]
    },
    {
      "id": 2,
      "name": "十八街麻花",
      "category": "food",
      "description": "天津传统名点，以酥脆香甜、久放不绵而闻名，是天津三绝之一。",
      "address": "天津市河西区大沽南路566号",
      "position": { 
        "x": 50, 
        "y": 60, 
        "lng": MOCK_COORDINATES[2][0], 
        "lat": MOCK_COORDINATES[2][1] 
      },
      "year": 1912,
      "images": [
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop"
      ],
      "openingHours": "09:00-21:00",
      "phone": "022-28326900",
      "importance": 4,
      "tags": ["天津三绝", "传统名点", "百年老店"],
      "relatedPois": [1, 3]
    },
    {
      "id": 3,
      "name": "耳朵眼炸糕",
      "category": "food",
      "description": "天津传统风味小吃，以皮酥脆、馅香甜、不腻口而著称，是天津三绝之一。",
      "address": "天津市红桥区北门外大街12号",
      "position": { 
        "x": 48, 
        "y": 52, 
        "lng": MOCK_COORDINATES[3][0], 
        "lat": MOCK_COORDINATES[3][1] 
      },
      "year": 1900,
      "images": [
        "https://images.unsplash.com/photo-1576827152400-24a02034b260?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1628646345558-26a999e9b437?w=800&h=600&fit=crop"
      ],
      "openingHours": "08:30-20:30",
      "phone": "022-27275033",
      "importance": 4,
      "tags": ["天津三绝", "传统小吃", "百年老店"],
      "relatedPois": [1, 2]
    },
    {
      "id": 4,
      "name": "劝业场",
      "category": "retail",
      "description": "天津著名的百年老商场，是天津商业的标志性建筑，融合了多种建筑风格。",
      "address": "天津市和平区和平路290号",
      "position": { 
        "x": 47, 
        "y": 56, 
        "lng": MOCK_COORDINATES[4][0], 
        "lat": MOCK_COORDINATES[4][1] 
      },
      "year": 1928,
      "images": [
        "https://images.unsplash.com/photo-1560448204-e02f11bad21b?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1600081329455-ba9599a7e63c?w=800&h=600&fit=crop"
      ],
      "openingHours": "10:00-22:00",
      "phone": "022-27211818",
      "importance": 5,
      "tags": ["百年老店", "商业地标", "历史建筑"],
      "relatedPois": [7]
    },
    {
      "id": 5,
      "name": "杨柳青年画",
      "category": "craft",
      "description": "中国四大木版年画之一，以色彩艳丽、题材丰富、构图饱满而著称，具有浓郁的民间艺术特色。",
      "address": "天津市西青区杨柳青镇估衣街23号",
      "position": { 
        "x": 42, 
        "y": 48, 
        "lng": MOCK_COORDINATES[5][0], 
        "lat": MOCK_COORDINATES[5][1] 
      },
      "year": 1600,
      "images": [
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1616410626454-7a0b76a43ba8?w=800&h=600&fit=crop"
      ],
      "openingHours": "09:00-17:00",
      "phone": "022-27940617",
      "importance": 5,
      "tags": ["民间艺术", "国家级非遗", "传统工艺"],
      "relatedPois": [6]
    },
    {
      "id": 6,
      "name": "泥人张彩塑",
      "category": "craft",
      "description": "天津传统民间艺术，以形神兼备、色彩鲜明、做工精细而闻名，是中国泥塑艺术的代表。",
      "address": "天津市南开区古文化街宫北大街通庆里4号",
      "position": { 
        "x": 46, 
        "y": 54, 
        "lng": MOCK_COORDINATES[6][0], 
        "lat": MOCK_COORDINATES[6][1] 
      },
      "year": 1844,
      "images": [
        "https://images.unsplash.com/photo-1511104491606-aa6905b541e4?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1616410626454-7a0b76a43ba8?w=800&h=600&fit=crop"
      ],
      "openingHours": "09:00-18:00",
      "phone": "022-27353157",
      "importance": 5,
      "tags": ["民间艺术", "国家级非遗", "传统工艺"],
      "relatedPois": [5]
    },
    {
      "id": 7,
      "name": "天津之眼",
      "category": "landmark",
      "description": "世界上唯一建在桥上的摩天轮，是天津的标志性建筑之一，俯瞰天津市区全景。",
      "address": "天津市红桥区李公祠大街与五马路交口",
      "position": { 
        "x": 44, 
        "y": 50, 
        "lng": MOCK_COORDINATES[7][0], 
        "lat": MOCK_COORDINATES[7][1] 
      },
      "year": 2008,
      "images": [
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop"
      ],
      "openingHours": "09:30-21:30",
      "phone": "022-26288830",
      "importance": 5,
      "tags": ["现代地标", "旅游景点", "城市名片"],
      "relatedPois": [4]
    },
    {
      "id": 8,
      "name": "天津大剧院",
      "category": "culture",
      "description": "现代化的大型综合剧场，是天津文化艺术的重要阵地，举办各类高水平演出。",
      "address": "天津市河西区平江道58号",
      "position": { 
        "x": 49, 
        "y": 58, 
        "lng": MOCK_COORDINATES[8][0], 
        "lat": MOCK_COORDINATES[8][1] 
      },
      "year": 2012,
      "images": [
        "https://images.unsplash.com/photo-1578473349177-3985528a3b9c?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1590092084034-d01156383737?w=800&h=600&fit=crop"
      ],
      "openingHours": "根据演出时间而定",
      "phone": "022-83882000",
      "importance": 4,
      "tags": ["现代建筑", "文化设施", "艺术殿堂"],
      "relatedPois": [7]
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
  const [imageLoaded, setImageLoaded] = useState<{[key: number]: boolean[]}>({});
  const [isLoading, setIsLoading] = useState(true);
  // 图片轮播状态
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  
  // 地图相关状态
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  
  // 地图容器引用
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // 初始化高德地图
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    const initMap = async () => {
      try {
        setIsLoading(true);
        
        // 加载高德地图API
        await AMapLoader.load({
          key: AMAP_KEY,
          version: '2.0',
          plugins: ['AMap.Marker', 'AMap.InfoWindow', 'AMap.Scale', 'AMap.ToolBar'],
          AMapUI: {
            version: '1.1',
            plugins: []
          }
        });
        
        // 创建地图实例
        const map = new window.AMap.Map(mapContainerRef.current, {
          zoom: MAP_INIT_CONFIG.zoom,
          center: MAP_INIT_CONFIG.center,
          mapStyle: MAP_INIT_CONFIG.mapStyle,
          resizeEnable: true
        });
        
        // 添加地图控件
        map.addControl(new window.AMap.Scale());
        map.addControl(new window.AMap.ToolBar({
          position: 'RT'
        }));
        
        // 保存地图实例
        setMapInstance(map);
        mapRef.current = map;
        
        // 监听地图事件
        map.on('zoomend', () => {
          setZoom(map.getZoom());
        });
        
      } catch (error) {
        console.error('Failed to initialize AMap:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initMap();
    
    // 清理函数
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
      }
    };
  }, []);
  
  // 预加载POI图片
  useEffect(() => {
    const preloadPOIImages = async () => {
      const imagePromises = mapData.flatMap(poi => {
        return poi.images.map((imageUrl, index) => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              setImageLoaded(prev => {
                const existing = prev[poi.id] || Array(poi.images.length).fill(false);
                const updated = [...existing];
                updated[index] = true;
                return { ...prev, [poi.id]: updated };
              });
              resolve();
            };
            img.onerror = () => {
              setImageLoaded(prev => {
                const existing = prev[poi.id] || Array(poi.images.length).fill(false);
                const updated = [...existing];
                updated[index] = true;
                return { ...prev, [poi.id]: updated };
              });
              resolve();
            };
            img.src = imageUrl;
          });
        });
      });
      
      await Promise.all(imagePromises);
    };
    
    preloadPOIImages();
  }, []);

  // 重置图片轮播索引当选择新的POI时
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedBrand]);

  // 筛选数据
  const filteredBrands = mapData.filter(brand => {
    const matchesCategory = selectedCategory === 'all' || brand.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
                         brand.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         brand.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // 添加标记点到地图
  useEffect(() => {
    if (!mapInstance) return;
    
    // 清除旧标记
    markers.forEach(marker => marker.remove());
    
    // 创建新标记
    const newMarkers: any[] = [];
    
    filteredBrands.forEach(brand => {
      if (!brand.position.lat || !brand.position.lng) return;
      
      // 创建标记
      const marker = new window.AMap.Marker({
        position: [brand.position.lng, brand.position.lat],
        map: mapInstance,
        title: brand.name,
        icon: new window.AMap.Icon({
          size: new window.AMap.Size(30, 30),
          image: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3E%3Ccircle cx='15' cy='15' r='14' fill='%23${CATEGORY_COLORS[brand.category]?.replace('bg-', '') || 'gray-500'}' opacity='0.8'/%3E%3Ctext x='15' y='20' font-size='16' text-anchor='middle' fill='white'%3E${CATEGORY_ICONS[brand.category] || '📍'}%3C/text%3E%3C/svg%3E`,
          imageSize: new window.AMap.Size(30, 30)
        })
      });
      
      // 添加点击事件
      marker.on('click', () => {
        setSelectedBrand(brand);
        setShowInfo(true);
      });
      
      newMarkers.push(marker);
    });
    
    setMarkers(newMarkers);
    
    // 清理函数
    return () => {
      newMarkers.forEach(marker => marker.remove());
    };
  }, [mapInstance, filteredBrands, markers]);

  // 处理标记点击
  const handleMarkerClick = (brand: POI) => {
    setSelectedBrand(brand);
    setShowInfo(true);
    
    // 如果有经纬度，将地图中心定位到该标记点
    if (brand.position.lat && brand.position.lng && mapInstance) {
      mapInstance.setCenter([brand.position.lng, brand.position.lat]);
      mapInstance.setZoom(14);
    }
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
          { label: '文化分类', value: Object.keys(categories).length.toString() },
          { label: '历史跨度', value: '近200年' },
          { label: '文化遗产', value: '国家级' }
        ]}
        pattern={true}
        size="lg"
      />

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        {/* 地图控制区 */}
        <div className={`p-4 md:p-6 rounded-2xl shadow-lg mb-4 md:mb-6 ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'}`}>
          <div className="flex flex-col gap-4">
            {/* 搜索输入框 - 置顶显示在移动端 */}
            <div className="relative w-full md:w-64 lg:w-80">
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

            {/* 分类筛选和缩放控制 */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* 分类筛选 */}
              <div className="flex flex-wrap gap-2">
                <button 
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm transition-all duration-300 ${selectedCategory === 'all' ? (isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white') : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  全部
                </button>
                {Object.entries(categories).map(([key, category]) => (
                  <button 
                    key={key}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm transition-all duration-300 flex items-center gap-1 ${selectedCategory === key ? (isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white') : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                    onClick={() => setSelectedCategory(key)}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 地图展示区 */}
        <div 
          ref={mapContainerRef}
          className={`relative w-full rounded-2xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'}`}
          style={{ height: '600px', maxHeight: '80vh' }}
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
          
          {/* 信息面板 */}
          {showInfo && selectedBrand && (
            <motion.div
              className={`absolute bottom-4 left-4 right-4 md:left-4 md:w-96 lg:left-8 lg:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden z-10`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* 图片轮播区域 */}
              <div className="relative h-52 overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10"></div>
                
                {/* 图片轮播 */}
                {selectedBrand.images.map((image, index) => (
                  <img 
                    key={index}
                    src={image} 
                    alt={`${selectedBrand.name} - 图片 ${index + 1}`} 
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-110 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => {
                      setImageLoaded(prev => {
                        const existing = prev[selectedBrand.id] || Array(selectedBrand.images.length).fill(false);
                        const updated = [...existing];
                        updated[index] = true;
                        return { ...prev, [selectedBrand.id]: updated };
                      });
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // 使用内置占位图替代外部服务
                      target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23${isDark ? '374151' : 'e5e7eb'}'/%3E%3Ctext x='200' y='150' font-family='Arial' font-size='20' fill='%23${isDark ? '9ca3af' : '6b7280'}' text-anchor='middle' dy='0.3em'%3E${selectedBrand.name}%3C/text%3E%3Ctext x='200' y='180' font-family='Arial' font-size='14' fill='%23${isDark ? '9ca3af' : '6b7280'}' text-anchor='middle' dy='0.3em'%3E图片加载中...%3C/text%3E%3C/svg%3E`;
                      target.alt = `${selectedBrand.name} 图片`;
                      setImageLoaded(prev => {
                        const existing = prev[selectedBrand.id] || Array(selectedBrand.images.length).fill(false);
                        const updated = [...existing];
                        updated[index] = true;
                        return { ...prev, [selectedBrand.id]: updated };
                      });
                    }}
                    style={{ display: (imageLoaded[selectedBrand.id]?.[index] || false) ? 'block' : 'none' }}
                  />
                ))}
                
                {/* 图片加载占位 */}
                {!imageLoaded[selectedBrand.id]?.[currentImageIndex] && (
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
                
                {/* 图片轮播导航 */}
                {selectedBrand.images.length > 1 && (
                  <>
                    {/* 导航按钮 */}
                    <button 
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm z-20"
                      onClick={() => setCurrentImageIndex(prev => (prev - 1 + selectedBrand.images.length) % selectedBrand.images.length)}
                    >
                      <i className="fas fa-chevron-left text-sm"></i>
                    </button>
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm z-20"
                      onClick={() => setCurrentImageIndex(prev => (prev + 1) % selectedBrand.images.length)}
                    >
                      <i className="fas fa-chevron-right text-sm"></i>
                    </button>
                    
                    {/* 轮播指示器 */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-20">
                      {selectedBrand.images.map((_, index) => (
                        <button 
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'}`}
                          onClick={() => setCurrentImageIndex(index)}
                        ></button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* 内容区域 */}
              <div className="p-5">
                <h3 className="text-2xl font-bold mb-2 dark:text-white">{selectedBrand.name}</h3>
                
                {/* 分类和地址 */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                    {CATEGORY_ICONS[selectedBrand.category]} {localPOIData.categories[selectedBrand.category]?.name || '其他'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <i className="fas fa-map-marker-alt text-xs"></i>
                    {selectedBrand.address}
                  </span>
                </div>
                
                {/* 标签系统 */}
                {selectedBrand.tags && selectedBrand.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedBrand.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} hover:opacity-80 transition-opacity`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
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
                
                {/* 相关POI推荐 */}
                {selectedBrand.relatedPois && selectedBrand.relatedPois.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold mb-2 dark:text-white">相关推荐</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedBrand.relatedPois.map(poiId => {
                        const relatedPoi = mapData.find(p => p.id === poiId);
                        return relatedPoi ? (
                          <button 
                            key={relatedPoi.id}
                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition-all`}
                            onClick={() => handleMarkerClick(relatedPoi)}
                          >
                            {CATEGORY_ICONS[relatedPoi.category]} {relatedPoi.name}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                
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
                <p className="text-sm dark:text-gray-400">使用鼠标滚轮或地图控件调整地图大小</p>
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
