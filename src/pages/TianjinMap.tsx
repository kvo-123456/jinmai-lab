import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import GradientHero from '@/components/GradientHero';

// 天津老字号数据
const oldBrands = [
  {
    id: 1,
    name: "狗不理包子",
    category: "food",
    description: "创建于1858年，天津传统美食代表，以皮薄馅大、十八褶著称。",
    address: "劝业场西街",
    position: { x: 50, y: 50 },
    year: 1858,
    image: "https://placehold.co/200x150/2c2c2c/d4af37?text=Goubuli"
  },
  {
    id: 2,
    name: "老边饺子",
    category: "food",
    description: "百年传承，皮薄馅大，汤汁浓郁，是天津著名的饺子品牌。",
    address: "劝业场东街",
    position: { x: 30, y: 60 },
    year: 1829,
    image: "https://placehold.co/200x150/2c2c2c/d4af37?text=Laobian"
  },
  {
    id: 3,
    name: "桂发祥",
    category: "food",
    description: "十八街麻花，酥脆香甜，是天津传统小吃的代表之一。",
    address: "劝业场南街",
    position: { x: 60, y: 40 },
    year: 1927,
    image: "https://placehold.co/200x150/2c2c2c/d4af37?text=Guifaxiang"
  },
  {
    id: 4,
    name: "劝业场",
    category: "retail",
    description: "天津商业地标，创建于1928年，是华北地区最大的综合性商场。",
    address: "和平路与滨江道交口",
    position: { x: 50, y: 50 },
    year: 1928,
    image: "https://placehold.co/200x150/2c2c2c/d4af37?text=Quanyechang"
  },
  {
    id: 5,
    name: "耳朵眼炸糕",
    category: "food",
    description: "创建于1900年，外酥里嫩，香甜可口，是天津三绝之一。",
    address: "大胡同",
    position: { x: 40, y: 70 },
    year: 1900,
    image: "https://placehold.co/200x150/2c2c2c/d4af37?text=Erduoyan"
  },
  {
    id: 6,
    name: "泥人张",
    category: "craft",
    description: "创建于1850年，以彩塑艺术闻名，是天津民间艺术的代表。",
    address: "古文化街",
    position: { x: 20, y: 50 },
    year: 1850,
    image: "https://placehold.co/200x150/2c2c2c/d4af37?text=Nirenzhang"
  }
];

export default function TianjinMap() {
  const { isDark, theme } = useTheme();
  const [zoom, setZoom] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [imageLoaded, setImageLoaded] = useState<{[key: number]: boolean}>({});

  // 筛选数据
  const filteredBrands = oldBrands.filter(brand => {
    return selectedCategory === 'all' || brand.category === selectedCategory;
  });

  // 分类颜色映射
  const categoryColors = {
    food: 'bg-yellow-500',
    retail: 'bg-blue-500',
    craft: 'bg-purple-500'
  };

  // 分类图标映射
  const categoryIcons = {
    food: '🍜',
    retail: '🏪',
    craft: '🎨'
  };

  // 分类名称映射
  const categoryNames = {
    food: '餐饮美食',
    retail: '零售百货',
    craft: '手工艺'
  };

  // 处理标记点击
  const handleMarkerClick = (brand: any) => {
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
          { label: '老字号品牌', value: oldBrands.length.toString() },
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
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* 分类筛选 */}
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${selectedCategory === 'all' ? (isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white') : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                onClick={() => setSelectedCategory('all')}
              >
                全部
              </button>
              {Object.entries(categoryNames).map(([key, name]) => (
                <button 
                  key={key}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${selectedCategory === key ? (isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white') : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                  onClick={() => setSelectedCategory(key)}
                >
                  {categoryIcons[key as keyof typeof categoryIcons]} {name}
                </button>
              ))}
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

        {/* 地图展示区 */}
        <div className={`relative w-full h-[600px] rounded-2xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'}`}>
          {/* 地图背景 */}
          <div className="absolute inset-0 bg-cover bg-center opacity-20 relative">
            {/* 使用img标签替代背景图，以便添加错误处理 */}
            <img
              src="https://placehold.co/1200x800/2c2c2c/d4af37?text=Tianjin+Historical+Map"
              alt="天津历史地图"
              className="absolute inset-0 w-full h-full object-cover opacity-100"
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center center'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // 使用内置SVG作为地图背景占位
                target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23${isDark ? '1f2937' : 'f3f4f6'}'/%3E%3Ctext x='600' y='400' font-family='Arial' font-size='48' fill='%23${isDark ? '9ca3af' : '6b7280'}' text-anchor='middle' dy='0.3em'%3ETianjin Historical Map%3C/text%3E%3C/svg%3E`;
              }}
            />
          </div>

          {/* 标记点 */}
          {filteredBrands.map(brand => (
            <motion.div
              key={brand.id}
              className={`absolute cursor-pointer transition-all duration-300 hover:scale-125`}
              style={{ 
                left: `${brand.position.x}%`, 
                top: `${brand.position.y}%`,
                transform: `translate(-50%, -50%) scale(${zoom})`
              }}
              onClick={() => handleMarkerClick(brand)}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className={`w-8 h-8 rounded-full ${categoryColors[brand.category as keyof typeof categoryColors]} border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm`}>
                  {categoryIcons[brand.category as keyof typeof categoryIcons]}
                </div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  {brand.name}
                </div>
              </div>
            </motion.div>
          ))}

          {/* 信息面板 */}
          {showInfo && selectedBrand && (
            <motion.div
              className={`absolute bottom-4 left-4 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                <img 
                  src={selectedBrand.image} 
                  alt={selectedBrand.name} 
                  className="w-full h-full object-cover"
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
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  创立于 {selectedBrand.year} 年
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold mb-1 dark:text-white">{selectedBrand.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    {categoryIcons[selectedBrand.category as keyof typeof categoryIcons]} {categoryNames[selectedBrand.category as keyof typeof categoryNames]}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{selectedBrand.address}</span>
                </div>
                <p className="text-sm dark:text-gray-300 mb-4">{selectedBrand.description}</p>
                <div className="flex gap-2 items-center">
                  <button 
                    className={`px-3 py-1 text-sm rounded ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                    onClick={() => setShowInfo(false)}
                  >
                    关闭
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    <i className="fas fa-share-alt mr-1"></i> 分享
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm rounded ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    onClick={() => window.open('/AR', '_blank', 'width=1000,height=800')}
                  >
                    <i className="fas fa-vr-cardboard mr-1"></i> AR体验
                  </button>
                </div>
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