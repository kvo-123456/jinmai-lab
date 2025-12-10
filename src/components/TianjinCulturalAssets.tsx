import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { TianjinImage } from './TianjinStyleComponents';

// 天津非遗技艺类型定义
interface IntangibleHeritage {
  id: number;
  name: string;
  description: string;
  detailedDescription?: string;
  thumbnail: string;
  category: string;
  history?: string;
}

// 天津地域符号类型定义
interface TianjinSymbol {
  id: number;
  name: string;
  description: string;
  detailedDescription?: string;
  image: string;
  category: string;
  history?: string;
}

// 天津方言类型定义
interface TianjinDialect {
  id: number;
  phrase: string;
  pronunciation: string;
  meaning: string;
  usage: string;
  example?: string;
}

// 模态框数据类型
type ModalData = IntangibleHeritage | TianjinSymbol | TianjinDialect;

// 详情模态框组件
function DetailModal({
  isOpen,
  onClose,
  data,
  isDark,
  isFavorite,
  toggleFavorite
}: {
  isOpen: boolean;
  onClose: () => void;
  data: ModalData | null;
  isDark: boolean;
  isFavorite: (id: number) => boolean;
  toggleFavorite: (id: number) => void;
}) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={`relative w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
        >
          <i className="fas fa-times"></i>
        </button>

        {/* 模态框内容 */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* 左侧图片 */}
          {'thumbnail' in data || 'image' in data && (
            <div className="h-80 overflow-hidden">
              <TianjinImage
                src={('thumbnail' in data ? data.thumbnail : data.image) as string}
                alt={data.name}
                ratio="landscape"
                fit="cover"
                className="w-full h-full transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
            </div>
          )}

          {/* 右侧内容 */}
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">
              {('phrase' in data ? data.phrase : data.name)}
            </h2>
            
            {/* 分类/发音 */}
            <div className="mb-4">
              {('category' in data && (
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                  {data.category}
                </span>
              )) || ('pronunciation' in data && (
                <div className="text-sm text-gray-500">
                  发音：{data.pronunciation}
                </div>
              ))}
            </div>

            {/* 描述 */}
            <div className="mb-4">
              <h3 className="font-semibold mb-1">{isDark ? '简介' : 'Description'}:</h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {'phrase' in data ? data.meaning : data.description}
              </p>
            </div>

            {/* 详细描述/用法 */}
            {('detailedDescription' in data && data.detailedDescription) && (
              <div className="mb-4">
                <h3 className="font-semibold mb-1">详细描述:</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {data.detailedDescription}
                </p>
              </div>
            )}

            {/* 历史/示例 */}
            {('history' in data && data.history) && (
              <div className="mb-4">
                <h3 className="font-semibold mb-1">历史:</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {data.history}
                </p>
              </div>
            )}

            {('usage' in data && data.usage) && (
              <div className="mb-4">
                <h3 className="font-semibold mb-1">用法:</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {data.usage}
                </p>
              </div>
            )}

            {('example' in data && data.example) && (
              <div className="mb-4">
                <h3 className="font-semibold mb-1">示例:</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} italic`}>
                  {data.example}
                </p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 mt-6">
              <button 
                className={`flex-1 py-2 rounded-lg transition-colors ${isFavorite(data.id) ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                onClick={() => toggleFavorite(data.id)}
              >
                <i className={`fas ${isFavorite(data.id) ? 'fa-heart' : 'fa-heart'} mr-2`}></i>
                {isFavorite(data.id) ? '已收藏' : '收藏'}
              </button>
              <button className="flex-1 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors">
                <i className="fas fa-share-alt mr-2"></i> 分享
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// 非遗技艺卡片组件
function HeritageCard({ heritage, isDark, onOpenModal, isFavorite, toggleFavorite }: { heritage: IntangibleHeritage; isDark: boolean; onOpenModal: (data: ModalData) => void; isFavorite: (id: number) => boolean; toggleFavorite: (id: number) => void }) {
  return (
    <motion.div
      key={heritage.id}
      className={`rounded-xl overflow-hidden border cursor-pointer transition-all duration-300 ${isDark ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-500'}`}
      whileHover={{ y: -3, scale: 1.01, boxShadow: isDark ? '0 8px 25px -5px rgba(0, 0, 0, 0.4)' : '0 8px 25px -5px rgba(0, 0, 0, 0.08)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        <TianjinImage 
          src={heritage.thumbnail} 
          alt={heritage.name} 
          ratio="landscape"
          fit="cover"
          className="w-full h-48 transition-transform duration-500 hover:scale-105" 
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <span className={`text-xs px-2 py-1 rounded-full bg-blue-600 text-white`}>
            {heritage.category}
          </span>
        </div>
        {/* 收藏按钮 */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(heritage.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${isFavorite(heritage.id) ? 'bg-red-600/80 text-white shadow-lg' : 'bg-white/80 text-gray-800 hover:bg-white shadow-md'}`}
          whileHover={{ scale: 1.05 }}
        >
          <i className={`fas ${isFavorite(heritage.id) ? 'fa-heart' : 'fa-heart'}`}></i>
        </motion.button>
      </div>
      <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'}`} onClick={() => onOpenModal(heritage)}>
        <h4 className="font-bold mb-2">{heritage.name}</h4>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {heritage.description}
        </p>
        <button className="mt-4 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors">
          应用此素材
        </button>
      </div>
    </motion.div>
  );
}

// 地域符号卡片组件
function SymbolCard({ symbol, isDark, onOpenModal, isFavorite, toggleFavorite }: { symbol: TianjinSymbol; isDark: boolean; onOpenModal: (data: ModalData) => void; isFavorite: (id: number) => boolean; toggleFavorite: (id: number) => void }) {
  return (
    <motion.div
      key={symbol.id}
      className={`rounded-xl overflow-hidden border cursor-pointer transition-all duration-300 ${isDark ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-500'}`}
      whileHover={{ y: -3, scale: 1.01, boxShadow: isDark ? '0 8px 25px -5px rgba(0, 0, 0, 0.4)' : '0 8px 25px -5px rgba(0, 0, 0, 0.08)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        <TianjinImage 
          src={symbol.image} 
          alt={symbol.name} 
          ratio="landscape"
          fit="cover"
          className="w-full h-40 transition-transform duration-500 hover:scale-105" 
          loading="lazy"
        />
        {/* 收藏按钮 */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(symbol.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${isFavorite(symbol.id) ? 'bg-red-600/80 text-white shadow-lg' : 'bg-white/80 text-gray-800 hover:bg-white shadow-md'}`}
          whileHover={{ scale: 1.05 }}
        >
          <i className={`fas ${isFavorite(symbol.id) ? 'fa-heart' : 'fa-heart'}`}></i>
        </motion.button>
      </div>
      <div className={`p-3 ${isDark ? 'bg-gray-700' : 'bg-white'}`} onClick={() => onOpenModal(symbol)}>
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-medium">{symbol.name}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
            {symbol.category}
          </span>
        </div>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {symbol.description}
        </p>
      </div>
    </motion.div>
  );
}

// 天津方言卡片组件
function DialectCard({ dialect, isDark, onOpenModal, isFavorite, toggleFavorite }: { dialect: TianjinDialect; isDark: boolean; onOpenModal: (data: ModalData) => void; isFavorite: (id: number) => boolean; toggleFavorite: (id: number) => void }) {
  return (
    <motion.div
      key={dialect.id}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${isDark ? 'bg-gray-700 hover:bg-gray-650 hover:border-blue-500' : 'bg-gray-50 hover:bg-gray-100 hover:border-blue-500'} border`}
      whileHover={{ boxShadow: isDark ? '0 6px 20px -5px rgba(0, 0, 0, 0.3)' : '0 6px 20px -5px rgba(0, 0, 0, 0.06)' }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex justify-between items-start">
        <div onClick={() => onOpenModal(dialect)}>
          <h4 className="font-bold text-lg mb-1">{dialect.phrase}</h4>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            发音：{dialect.pronunciation}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 收藏按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(dialect.id);
            }}
            className={`p-2 rounded-full transition-all duration-300 ${isFavorite(dialect.id) ? 'bg-red-600 text-white shadow-lg' : isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            <i className={`fas ${isFavorite(dialect.id) ? 'fa-heart' : 'fa-heart'}`}></i>
          </button>
          <button 
            className={`p-2 rounded-full ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
            onClick={(e) => e.stopPropagation()}
          >
            <i className="fas fa-volume-up"></i>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" onClick={() => onOpenModal(dialect)}>
        <div>
          <h5 className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            含义
          </h5>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {dialect.meaning}
          </p>
        </div>
        <div>
          <h5 className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            用法
          </h5>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {dialect.usage}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function TianjinCulturalAssets() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'heritage' | 'symbols' | 'dialect'>('heritage');
  const [isLoading, setIsLoading] = useState(true);
  
  // 移除人为加载延迟，直接设置为加载完成
  useEffect(() => {
    setIsLoading(false);
  }, []);
  const [error, setError] = useState<string | null>(null);
  
  // 模态框状态管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  
  // 打开详情模态框
  const openModal = (data: ModalData) => {
    setModalData(data);
    setIsModalOpen(true);
  };
  
  // 关闭详情模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setModalData(null);
    }, 200);
  };
  
  // 收藏状态管理
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  
  // 初始化收藏状态
  useEffect(() => {
    // 从本地存储加载收藏数据
    const savedFavorites = localStorage.getItem('tianjinCulturalFavorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);
  
  // 保存收藏状态到本地存储 - 添加防抖逻辑
  useEffect(() => {
    // 使用setTimeout延迟写入，避免频繁IO操作
    const timer = setTimeout(() => {
      localStorage.setItem('tianjinCulturalFavorites', JSON.stringify(Array.from(favorites)));
    }, 300);
    
    // 清除定时器
    return () => clearTimeout(timer);
  }, [favorites]);
  
  // 切换收藏状态 - 使用useCallback优化
  const toggleFavorite = useCallback((id: number) => {
    setFavorites(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  }, []);
  
  // 检查是否已收藏
  const isFavorite = (id: number) => {
    return favorites.has(id);
  };
  
  // 模拟天津非遗技艺数据
  const intangibleHeritages: IntangibleHeritage[] = [
    {
      id: 1,
      name: '杨柳青年画',
      description: '中国著名的民间木版年画，始于明代崇祯年间，与苏州桃花坞年画并称"南桃北柳"。',
      detailedDescription: '杨柳青年画采用木版套印和手工彩绘相结合的方法，既有版味、木味，又有手绘的色彩斑斓与工艺性，形成了鲜明的艺术特色。题材广泛，包括历史故事、神话传说、戏曲人物、世俗生活等。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20New%20Year%20Painting%20traditional%20Chinese%20folk%20art',
      category: '传统绘画',
      history: '始于明代崇祯年间，清中叶达到鼎盛。2006年5月20日，杨柳青年画经国务院批准列入第一批国家级非物质文化遗产名录。'
    },
    {
      id: 2,
      name: '泥人张',
      description: '天津传统民间彩塑，创始于清代道光年间，以其形神兼备的艺术风格闻名中外。',
      detailedDescription: '泥人张彩塑以细腻的手法、逼真的形象、生动的表情著称，题材多为民间传说、历史人物、市井生活等。作品尺寸从几厘米到数米不等，既可作为案头陈设，也可作为大型雕塑。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Nirenzhang%20traditional%20clay%20sculpture%20art',
      category: '传统雕塑',
      history: '创始于清代道光年间，由张明山所创。2006年，泥人张彩塑入选第一批国家级非物质文化遗产名录。'
    },
    {
      id: 3,
      name: '风筝魏',
      description: '天津特色风筝制作技艺，创始于清代光绪年间，以其精巧的工艺和精美的画工著称。',
      detailedDescription: '风筝魏制作的风筝以造型美观、工艺精湛、放飞性能好而闻名。其特点是：骨架精细、彩绘逼真、飞行平稳、放飞高度高。作品种类繁多，包括硬翅风筝、软翅风筝、串式风筝等。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Weifeng%20traditional%20kite%20making%20art',
      category: '传统工艺',
      history: '创始于清代光绪年间，由魏元泰所创。2006年，风筝魏风筝制作技艺入选第一批国家级非物质文化遗产名录。'
    },
    {
      id: 4,
      name: '天津面塑',
      description: '天津传统民间工艺，以糯米面为主料，通过手工捏制成各种形象，造型生动，色彩鲜艳。',
      detailedDescription: '天津面塑以糯米面、澄面为主要原料，加入颜料、蜂蜜、甘油等成分，经过揉面、配色、塑形、晾干等工序制作而成。作品包括人物、动物、花卉等，造型生动，色彩鲜艳，具有较高的艺术价值。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20traditional%20dough%20sculpture%20art',
      category: '传统雕塑',
      history: '天津面塑历史悠久，可追溯到清代。其发展与天津的民俗文化密切相关，常用于节日庆典、婚丧嫁娶等场合。'
    },
    {
      id: 5,
      name: '天津刻砖刘',
      description: '天津传统砖雕技艺，创始于清代光绪年间，以其精湛的雕刻技艺和独特的艺术风格著称。',
      detailedDescription: '刻砖刘的砖雕作品以立体浮雕为主，题材包括花卉、人物、动物、吉祥图案等。作品线条流畅，造型生动，具有浓郁的民间艺术特色。常用于建筑装饰，如影壁、门楼、屋脊等。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Kezuanliu%20traditional%20brick%20carving%20art',
      category: '传统工艺',
      history: '创始于清代光绪年间，由刘凤鸣所创。2008年，刻砖刘砖雕技艺入选第二批国家级非物质文化遗产名录。'
    },
    {
      id: 6,
      name: '天津地毯织造技艺',
      description: '天津传统地毯织造工艺，历史悠久，以其精细的做工和精美的图案闻名于世。',
      detailedDescription: '天津地毯采用优质羊毛为原料，经过选毛、洗毛、梳毛、纺线、染色、织毯、剪花、洗毯、定型等多道工序制作而成。图案多为中国传统纹样，如牡丹、龙凤、云纹等，色彩鲜艳，层次分明。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20traditional%20carpet%20weaving%20art',
      category: '传统工艺',
      history: '天津地毯织造技艺始于清代，20世纪初达到鼎盛。2011年，天津地毯织造技艺入选第三批国家级非物质文化遗产名录。'
    },
    {
      id: 7,
      name: '天津宝坻评剧',
      description: '天津宝坻地区的传统戏曲剧种，具有浓郁的地方特色和独特的艺术风格。',
      detailedDescription: '宝坻评剧以其独特的唱腔、表演风格和剧目深受当地群众喜爱。其唱腔委婉动听，表演细腻逼真，剧目多反映民间生活和历史故事。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Baodi%20Pingju%20traditional%20opera',
      category: '传统戏曲',
      history: '宝坻评剧起源于清末民初，由莲花落演变而来。2008年，宝坻评剧入选第二批国家级非物质文化遗产名录。'
    },
    {
      id: 8,
      name: '天津时调',
      description: '天津传统民间曲艺形式，以其独特的唱腔和表演风格深受天津人民喜爱。',
      detailedDescription: '天津时调是天津特有的曲艺形式，以天津方言演唱，具有浓郁的地方特色。唱腔包括靠山调、鸳鸯调、喇哈调等，题材多反映天津的市井生活和民俗风情。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Shidiao%20traditional%20folk%20music',
      category: '传统音乐',
      history: '形成于清代末年，20世纪30年代达到鼎盛。2006年，天津时调入选第一批国家级非物质文化遗产名录。'
    },
    {
      id: 9,
      name: '天津京东大鼓',
      description: '天津传统曲艺形式，起源于河北，在天津得到发展和完善，具有独特的艺术魅力。',
      detailedDescription: '京东大鼓以其独特的唱腔、简洁的伴奏和生动的表演著称。唱腔流畅自然，伴奏以三弦为主，题材多反映民间生活和历史故事。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Jingdong%20Dagu%20traditional%20folk%20music',
      category: '传统音乐',
      history: '起源于河北三河、香河一带，20世纪初传入天津并得到发展。2006年，京东大鼓入选第一批国家级非物质文化遗产名录。'
    },
    {
      id: 10,
      name: '天津皇会',
      description: '天津传统的民间宗教庆典活动，始于明代，以其规模宏大、内容丰富著称。',
      detailedDescription: '天津皇会是为祭祀海神天后娘娘而举办的庆典活动，包括出会、巡行、表演等环节。活动内容包括舞龙、舞狮、高跷、旱船、秧歌等民间艺术表演，规模宏大，参与人数众多。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Imperial%20Procession%20traditional%20folk%20festival',
      category: '民俗活动',
      history: '始于明代永乐年间，清康乾时期达到鼎盛。2008年，天津皇会入选第二批国家级非物质文化遗产名录。'
    },
    {
      id: 11,
      name: '天津风筝',
      description: '天津传统民间工艺，以其精巧的设计和良好的放飞性能著称。',
      detailedDescription: '天津风筝种类繁多，包括硬翅风筝、软翅风筝、串式风筝、板子风筝等。制作工艺包括扎骨架、糊纸、绘画、拴线等环节，要求工艺精细，造型美观。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20traditional%20kite%20making%20art',
      category: '传统工艺',
      history: '天津风筝历史悠久，20世纪初形成了以"风筝魏"为代表的制作流派。2008年，天津风筝入选第二批国家级非物质文化遗产名录。'
    },
    {
      id: 12,
      name: '天津木雕',
      description: '天津传统雕刻工艺，以其精湛的技艺和独特的艺术风格著称。',
      detailedDescription: '天津木雕以硬木为原料，采用浮雕、透雕、圆雕等技法，题材包括花卉、人物、动物、吉祥图案等。作品常用于家具、建筑装饰、工艺品等。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20traditional%20wood%20carving%20art',
      category: '传统工艺',
      history: '天津木雕始于清代，20世纪初达到鼎盛。2014年，天津木雕入选第四批国家级非物质文化遗产名录。'
    },
    {
      id: 13,
      name: '天津糖画',
      description: '天津传统民间工艺，以糖为原料，通过手工绘制而成各种形象。',
      detailedDescription: '天津糖画以红糖、白糖、饴糖等为原料，在石板上加热融化后，用勺子舀起糖汁，在石板上快速绘制出各种形象，如花鸟鱼虫、飞禽走兽、神话人物等。作品既可观赏，又可食用。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20traditional%20sugar%20painting%20art',
      category: '传统工艺',
      history: '天津糖画起源于清代，由四川传入天津并得到发展。2011年，天津糖画入选第三批天津市非物质文化遗产名录。'
    },
    {
      id: 14,
      name: '天津剪纸',
      description: '天津传统民间工艺，以剪刀或刻刀在纸上剪刻出各种图案。',
      detailedDescription: '天津剪纸以其精细的刀法、丰富的题材、生动的造型著称。题材包括吉祥图案、花卉、人物、动物等，常用于节日装饰、婚丧嫁娶等场合。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20traditional%20paper%20cutting%20art',
      category: '传统工艺',
      history: '天津剪纸始于清代，20世纪初达到鼎盛。2008年，天津剪纸入选第二批国家级非物质文化遗产名录。'
    },
    {
      id: 15,
      name: '天津泥塑',
      description: '天津传统民间工艺，以泥土为原料，通过手工塑造而成各种形象。',
      detailedDescription: '天津泥塑包括泥人、泥玩具、泥哨等，以其生动的造型、鲜艳的色彩、浓郁的地方特色著称。题材多为民间传说、历史人物、市井生活等。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20traditional%20clay%20sculpture%20art',
      category: '传统雕塑',
      history: '天津泥塑历史悠久，可追溯到唐代。2014年，天津泥塑入选第四批国家级非物质文化遗产名录。'
    }
  ];
  
  // 模拟天津地域符号数据
  const tianjinSymbols: TianjinSymbol[] = [
    {
      id: 1,
      name: '五大道建筑',
      description: '天津著名历史文化街区，保留了大量欧洲风格建筑，被誉为"万国建筑博览馆"。',
      detailedDescription: '五大道地区拥有上世纪二、三十年代建成的英、法、意、德、西班牙不同国家建筑风格的花园式房屋2000多所，建筑面积达到100多万平方米。这些建筑不仅是天津历史文化的重要组成部分，也是中国近现代建筑史上的珍贵遗产。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Five%20Avenues%20historical%20buildings',
      category: '建筑景观',
      history: '五大道地区形成于19世纪末20世纪初，是天津租界文化的重要体现。2005年，五大道被建设部和国家文物局命名为"中国历史文化名街"。'
    },
    {
      id: 2,
      name: '海河桥梁',
      description: '海河上的桥梁是天津城市景观的重要组成部分，每座桥都有其独特的设计和历史。',
      detailedDescription: '海河是天津的母亲河，海河上的桥梁见证了天津的发展变迁。从最早的浮桥、铁桥到现代化的斜拉桥、悬索桥，海河桥梁不仅具有交通功能，更是天津城市景观的重要组成部分。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Haihe%20River%20bridges%20scenery',
      category: '城市地标',
      history: '海河上最早的桥梁是建于1404年的浮桥，随着城市的发展，先后建成了解放桥、金汤桥、北安桥等著名桥梁。目前，海河上共有30多座桥梁。'
    },
    {
      id: 3,
      name: '狗不理包子',
      description: '天津著名小吃，创始于清代光绪年间，以皮薄馅大、鲜香味美著称。',
      detailedDescription: '狗不理包子以猪肉和三鲜为主要馅料，采用"半发面"工艺制作，具有皮薄馅大、汤汁丰富、鲜香味美的特点。包子外形美观，褶子均匀，每个包子不少于15个褶。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Goubuli%20steamed%20buns%20local%20food',
      category: '地方美食',
      history: '创始于清代光绪年间（1858年），由高贵友所创。因其乳名"狗子"，且性格木讷，故得名"狗不理"。2011年，狗不理包子制作技艺入选第三批国家级非物质文化遗产名录。'
    },
    {
      id: 4,
      name: '桂发祥麻花',
      description: '天津传统特色小吃，酥脆香甜，风味独特，是天津的"三绝"之一。',
      detailedDescription: '桂发祥麻花以优质面粉、芝麻、花生油、白糖等为原料，采用传统工艺制作，具有酥脆香甜、久放不绵的特点。麻花外形美观，色泽金黄，香气浓郁。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Guifaxiang%20fried%20dough%20twists%20local%20food',
      category: '地方美食',
      history: '创始于清代光绪年间（1927年），由刘老八所创。2008年，桂发祥十八街麻花制作技艺入选第二批国家级非物质文化遗产名录。'
    },
    {
      id: 5,
      name: '耳朵眼炸糕',
      description: '天津传统特色小吃，外焦里嫩，香甜可口，是天津的"三绝"之一。',
      detailedDescription: '耳朵眼炸糕以糯米粉、红豆沙为主要原料，采用传统工艺制作，具有外焦里嫩、香甜可口的特点。炸糕外形呈圆形，色泽金黄，口感酥脆。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Erduoyan%20fried%20cake%20local%20food',
      category: '地方美食',
      history: '创始于清代光绪年间（1900年），由刘万春所创。因其店址位于天津耳朵眼胡同，故得名"耳朵眼炸糕"。2011年，耳朵眼炸糕制作技艺入选第三批国家级非物质文化遗产名录。'
    },
    {
      id: 6,
      name: '天津劝业场',
      description: '天津著名商业地标，始建于1928年，是天津商业文化的重要象征。',
      detailedDescription: '劝业场是天津历史最悠久、规模最大的综合性百货商场，也是天津商业文化的重要象征。商场建筑风格独特，融合了中西建筑元素，内部装饰精美。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Quanye%20Department%20Store%20historical%20building',
      category: '商业地标',
      history: '始建于1928年，由高星桥投资兴建。劝业场是天津租界时期的重要商业建筑，也是中国近现代商业史上的重要遗产。2001年，劝业场被国务院公布为第五批全国重点文物保护单位。'
    },
    {
      id: 7,
      name: '天津解放桥',
      description: '天津标志性桥梁，原名万国桥，建于1927年，是天津历史的重要见证。',
      detailedDescription: '解放桥原名万国桥，是一座全钢结构可开启的桥梁，也是天津的标志性建筑之一。桥梁设计精美，结构复杂，开启时可通过大型船只。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Jiefang%20Bridge%20historical%20bridge',
      category: '城市地标',
      history: '建于1927年，由法国工程师设计。1949年天津解放后，更名为解放桥。2005年，解放桥被建设部和国家文物局命名为"中国历史文化名桥"。'
    },
    {
      id: 8,
      name: '天津古文化街',
      description: '天津著名文化旅游景点，以传统民俗文化为特色，展现天津文化魅力。',
      detailedDescription: '古文化街是天津最具代表性的文化旅游景点之一，以传统民俗文化为特色，汇集了众多天津传统老字号和民间工艺。街道建筑风格独特，融合了明清建筑元素。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Ancient%20Culture%20Street%20tourist%20spot',
      category: '文化景点',
      history: '古文化街始建于1985年，位于天津南开区东门外，全长580米。2007年，古文化街被国家旅游局命名为"国家5A级旅游景区"。'
    },
    {
      id: 9,
      name: '天津之眼摩天轮',
      description: '天津标志性建筑，世界上唯一建在桥上的摩天轮，是天津的"城市名片"。',
      detailedDescription: '天津之眼摩天轮位于海河永乐桥上，是世界上唯一建在桥上的摩天轮。摩天轮高度为120米，共有48个座舱，每个座舱可乘坐8人。乘坐天津之眼可以俯瞰天津市区的美丽景色。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Eye%20Ferris%20Wheel%20landmark',
      category: '城市地标',
      history: '天津之眼摩天轮于2007年12月17日建成，2008年4月18日正式开放。它不仅是天津的标志性建筑，也是世界上唯一建在桥上的摩天轮。'
    },
    {
      id: 10,
      name: '天津南开大学',
      description: '中国著名高等学府，创建于1919年，是天津教育文化的重要象征。',
      detailedDescription: '南开大学是中国著名的综合性研究型大学，也是天津教育文化的重要象征。学校师资力量雄厚，学科门类齐全，在国内外享有盛誉。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Nankai%20University%20campus%20scenery',
      category: '教育地标',
      history: '南开大学创建于1919年，由爱国教育家张伯苓和严修创办。学校是中国最早的现代大学之一，也是中国高等教育史上的重要遗产。'
    },
    {
      id: 11,
      name: '天津相声',
      description: '天津传统曲艺形式，以幽默风趣的语言和独特的表演风格闻名全国。',
      detailedDescription: '天津相声是中国相声的重要流派之一，以幽默风趣的语言、独特的表演风格和浓郁的地方特色著称。相声表演通常由两人合作，通过对话、动作、表情等方式展现幽默效果。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20cross%20talk%20traditional%20comedy%20art',
      category: '民俗文化',
      history: '天津相声起源于清代末年，20世纪初达到鼎盛。天津是中国相声的重要发源地之一，也是中国相声演员的摇篮。'
    },
    {
      id: 12,
      name: '天津火车站',
      description: '天津重要交通枢纽，是天津城市发展的重要见证。',
      detailedDescription: '天津火车站是天津最大的铁路客运站，也是中国北方重要的交通枢纽之一。车站建筑风格独特，融合了中西建筑元素，内部设施先进。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Railway%20Station%20modern%20building',
      category: '交通枢纽',
      history: '天津火车站始建于1888年，是中国最早的火车站之一。经过多次扩建和改造，目前的天津火车站于2008年投入使用。'
    },
    {
      id: 13,
      name: '天津意式风情区',
      description: '天津著名历史文化街区，保留了大量意大利风格建筑。',
      detailedDescription: '意式风情区是天津租界时期的意大利租界，保留了大量意大利风格建筑。街区内建筑风格独特，环境优雅，是天津重要的旅游景点之一。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Italian%20Style%20Street%20historical%20buildings',
      category: '建筑景观',
      history: '意式风情区始建于1902年，是意大利在天津的租界。2002年，天津市政府对意式风情区进行了全面改造，使其成为天津重要的旅游景点。'
    },
    {
      id: 14,
      name: '天津博物馆',
      description: '天津最大的综合性博物馆，展示天津历史文化的重要窗口。',
      detailedDescription: '天津博物馆是天津最大的综合性博物馆，馆藏丰富，包括历史文物、艺术品、民俗文物等。博物馆建筑风格独特，是天津重要的文化地标之一。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Museum%20modern%20architecture',
      category: '文化景点',
      history: '天津博物馆始建于1918年，经过多次合并和扩建，目前的天津博物馆于2004年投入使用。2008年，天津博物馆被国家文物局评为"国家一级博物馆"。'
    },
    {
      id: 15,
      name: '天津水上公园',
      description: '天津最大的城市公园，是天津市民休闲娱乐的重要场所。',
      detailedDescription: '水上公园是天津最大的城市公园，占地面积164.6公顷，其中水域面积89.2公顷。公园内环境优美，景色宜人，是天津市民休闲娱乐的重要场所。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Water%20Park%20scenery',
      category: '城市公园',
      history: '水上公园始建于1950年，1951年正式开放。经过多次扩建和改造，目前的水上公园是天津重要的旅游景点之一。'
    },
    {
      id: 16,
      name: '天津天塔',
      description: '天津广播电视塔，是天津标志性建筑之一。',
      detailedDescription: '天津广播电视塔简称天塔，高度为415.2米，是亚洲第六、中国第三高塔。天塔集广播电视发射、旅游观光、餐饮娱乐等功能于一体，是天津重要的城市地标之一。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Tower%20landmark%20building',
      category: '城市地标',
      history: '天塔始建于1988年，1991年正式投入使用。2001年，天塔被国家旅游局评为"国家4A级旅游景区"。'
    },
    {
      id: 17,
      name: '天津鼓楼',
      description: '天津历史文化名城的重要标志，展现天津历史文化的重要窗口。',
      detailedDescription: '天津鼓楼是天津历史文化名城的重要标志，始建于明代永乐年间。鼓楼建筑风格独特，融合了明清建筑元素，是天津历史文化的重要载体。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Drum%20Tower%20historical%20building',
      category: '历史建筑',
      history: '天津鼓楼始建于明代永乐二年（1404年），1952年被拆除，2001年重建。重建后的鼓楼是天津重要的历史文化景点之一。'
    }
  ];
  
  // 模拟天津方言数据
  const tianjinDialects: TianjinDialect[] = [
    {
      id: 1,
      phrase: '嘛呀',
      pronunciation: 'má ya',
      meaning: '什么',
      usage: '用于询问对方在做什么或表达惊讶',
      example: '你手里拿的嘛呀？这么好看！'
    },
    {
      id: 2,
      phrase: '结界',
      pronunciation: 'jiē jie',
      meaning: '地方、区域',
      usage: '指某个特定的地方或范围',
      example: '你知道那个吃饭的结界在哪吗？'
    },
    {
      id: 3,
      phrase: '倍儿好',
      pronunciation: 'bèi er hǎo',
      meaning: '非常好、特别好',
      usage: '表示对某事物的高度评价',
      example: '这家饭馆的菜倍儿好，你一定要尝尝！'
    },
    {
      id: 4,
      phrase: '介似嘛',
      pronunciation: 'jiè shì má',
      meaning: '这是什么',
      usage: '用于询问不认识的事物',
      example: '介似嘛东西？我从来没见过！'
    },
    {
      id: 5,
      phrase: '逗你玩儿',
      pronunciation: 'dòu nǐ wán ér',
      meaning: '开玩笑、逗乐',
      usage: '表示不是认真的，只是开个玩笑',
      example: '别生气，我逗你玩儿呢！'
    },
    {
      id: 6,
      phrase: '恁么',
      pronunciation: 'nèn me',
      meaning: '怎么',
      usage: '用于询问方式、原因或状态',
      example: '你恁么才来啊？我们都等你半天了！'
    },
    {
      id: 7,
      phrase: '嘛玩意儿',
      pronunciation: 'má wán yì ér',
      meaning: '什么东西、什么事情',
      usage: '用于询问或表示不满',
      example: '你弄的嘛玩意儿？乱七八糟的！'
    },
    {
      id: 8,
      phrase: '葛',
      pronunciation: 'gě',
      meaning: '古怪、不好相处',
      usage: '形容人的性格或行为奇特',
      example: '这个人性格真葛，很难和他打交道。'
    },
    {
      id: 9,
      phrase: '捯饬',
      pronunciation: 'dáo chi',
      meaning: '打扮、整理',
      usage: '指精心打扮自己或整理物品',
      example: '她每天都捯饬得漂漂亮亮的才出门。'
    },
    {
      id: 10,
      phrase: '起腻',
      pronunciation: 'qǐ nì',
      meaning: '撒娇、纠缠',
      usage: '形容人撒娇或过度纠缠',
      example: '这孩子总爱跟妈妈起腻，离不开人。'
    },
    {
      id: 11,
      phrase: '褶子了',
      pronunciation: 'zhě zi le',
      meaning: '出问题了、麻烦了',
      usage: '表示事情遇到了困难或麻烦',
      example: '坏了，褶子了！我把钥匙忘在家里了。'
    },
    {
      id: 12,
      phrase: '嘛钱不钱的，乐呵乐呵得了',
      pronunciation: 'má qián bù qián de, lè hē lè hē dé le',
      meaning: '钱不重要，开心就好',
      usage: '表示对金钱的豁达态度',
      example: '朋友之间帮忙，嘛钱不钱的，乐呵乐呵得了！'
    },
    {
      id: 13,
      phrase: '愣子',
      pronunciation: 'lèng zi',
      meaning: '傻瓜、愣头青',
      usage: '形容人做事冲动或不考虑后果',
      example: '他就是个愣子，做事从来不想后果。'
    },
    {
      id: 14,
      phrase: '崴泥',
      pronunciation: 'wǎi ní',
      meaning: '麻烦了、糟糕了',
      usage: '表示事情变得严重或难以解决',
      example: '崴泥了！这次考试我肯定不及格。'
    },
    {
      id: 15,
      phrase: '耐人',
      pronunciation: 'nài rén',
      meaning: '可爱、讨人喜欢',
      usage: '形容人或事物让人喜爱',
      example: '这个小孩长得真耐人，我真想抱抱他！'
    },
    {
      id: 16,
      phrase: '鼻儿等',
      pronunciation: 'bí ér děng',
      meaning: '等等',
      usage: '表示列举未尽或稍作等待',
      example: '我还买了水果、零食，鼻儿等，你慢慢吃。'
    },
    {
      id: 17,
      phrase: '够戗',
      pronunciation: 'gòu qiàng',
      meaning: '够呛、难以承受',
      usage: '表示事情难度大或难以完成',
      example: '这么多工作，一天做完够戗！'
    },
    {
      id: 18,
      phrase: '干吗介',
      pronunciation: 'gàn má jiè',
      meaning: '干什么呢',
      usage: '用于询问对方的行为或意图',
      example: '你在这儿干吗介？是不是有什么事？'
    },
    {
      id: 19,
      phrase: '顺毛驴',
      pronunciation: 'shùn máo lǘ',
      meaning: '顺脾气、吃软不吃硬',
      usage: '形容人需要顺着性子来',
      example: '他就是个顺毛驴，你得顺着他说才行。'
    },
    {
      id: 20,
      phrase: '倍儿哏儿',
      pronunciation: 'bèi er gén ér',
      meaning: '非常有趣、特别好笑',
      usage: '形容事物或人很有趣',
      example: '昨天的相声表演倍儿哏儿，我笑了一晚上！'
    },
    {
      id: 21,
      phrase: '得楞',
      pronunciation: 'dé leng',
      meaning: '修理、整理',
      usage: '指修理物品或整理东西',
      example: '这个自行车坏了，你帮我得楞得楞！'
    },
    {
      id: 22,
      phrase: '打镲',
      pronunciation: 'dǎ chǎ',
      meaning: '开玩笑、起哄',
      usage: '指不认真对待某事，开玩笑',
      example: '别打镲了，说正经的！'
    },
    {
      id: 23,
      phrase: '掰扯',
      pronunciation: 'bāi che',
      meaning: '争论、辩解',
      usage: '指为了某事争论不休',
      example: '你们别掰扯了，这件事已经过去了。'
    },
    {
      id: 24,
      phrase: '坐地炮',
      pronunciation: 'zuò dì pào',
      meaning: '形容人脾气大，一不如意就发火',
      usage: '形容人脾气暴躁',
      example: '她可是个坐地炮，你可别惹她！'
    },
    {
      id: 25,
      phrase: '鬊(shùn)鸟',
      pronunciation: 'shùn niǎo',
      meaning: '傻瓜、笨蛋',
      usage: '形容人愚蠢或做事不考虑后果',
      example: '你这个鬊鸟，怎么能这么做事呢！'
    },
    {
      id: 26,
      phrase: '闷得儿密',
      pronunciation: 'mēn dé ér mì',
      meaning: '偷偷地、悄悄地',
      usage: '指不声张地做某事',
      example: '他闷得儿密就把这件事办好了，谁都不知道。'
    },
    {
      id: 27,
      phrase: '撒癔症',
      pronunciation: 'sā yì zhèng',
      meaning: '梦游、神志不清',
      usage: '指人在睡梦中或神志不清时做出的行为',
      example: '你大半夜不睡觉，在这儿撒癔症呢？'
    },
    {
      id: 28,
      phrase: '夜儿个',
      pronunciation: 'yè ér gè',
      meaning: '昨天',
      usage: '表示时间是昨天',
      example: '夜儿个我去了趟天津之眼，景色真不错！'
    },
    {
      id: 29,
      phrase: '今儿个',
      pronunciation: 'jīn ér gè',
      meaning: '今天',
      usage: '表示时间是今天',
      example: '今儿个天气真好，咱们出去走走吧！'
    },
    {
      id: 30,
      phrase: '明儿个',
      pronunciation: 'míng ér gè',
      meaning: '明天',
      usage: '表示时间是明天',
      example: '明儿个我要去北京，不能陪你了。'
    },
    {
      id: 31,
      phrase: '嘛都不懂',
      pronunciation: 'má dōu bù dǒng',
      meaning: '什么都不知道',
      usage: '形容人知识匮乏或对某事一无所知',
      example: '你别问他，他嘛都不懂！'
    },
    {
      id: 32,
      phrase: '二五眼',
      pronunciation: 'èr wǔ yǎn',
      meaning: '能力差、水平低',
      usage: '形容人做事不熟练或能力不足',
      example: '他开车技术二五眼，你可别坐他的车！'
    },
    {
      id: 33,
      phrase: '猫儿腻',
      pronunciation: 'māo ér nì',
      meaning: '秘密、猫腻',
      usage: '指背地里的秘密或不正当的事情',
      example: '这件事肯定有猫儿腻，你要小心！'
    }
  ];
  
  // 搜索和筛选状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // 获取非遗技艺分类列表 - 使用useMemo缓存
  const heritageCategories = useMemo(() => {
    return Array.from(new Set(intangibleHeritages.map(item => item.category)));
  }, []);
  
  // 获取地域符号分类列表 - 使用useMemo缓存
  const symbolCategories = useMemo(() => {
    return Array.from(new Set(tianjinSymbols.map(item => item.category)));
  }, []);
  
  // 过滤非遗技艺数据 - 使用useMemo缓存
  const filteredHeritages = useMemo(() => {
    return intangibleHeritages.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [intangibleHeritages, searchQuery, filterCategory]);
  
  // 过滤地域符号数据 - 使用useMemo缓存
  const filteredSymbols = useMemo(() => {
    return tianjinSymbols.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tianjinSymbols, searchQuery, filterCategory]);
  
  // 过滤方言数据 - 使用useMemo缓存
  const filteredDialects = useMemo(() => {
    return tianjinDialects.filter(item => {
      const matchesSearch = item.phrase.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.usage.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [tianjinDialects, searchQuery]);
  
  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="space-y-6">
          <div className={`h-8 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="flex space-x-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-10 w-24 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className={`h-40 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-4 w-3/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      <h3 className="text-xl font-bold mb-6 flex items-center">
        <i className="fas fa-landmark text-blue-600 mr-2"></i>
        天津特色文化资产
      </h3>
      
      {/* 标签页切换 */}
      <div className="flex space-x-3 mb-6 overflow-x-auto scrollbar-hide">
        {[
          { id: 'heritage', name: '非遗技艺' },
          { id: 'symbols', name: '地域符号' },
          { id: 'dialect', name: '天津方言' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as 'heritage' | 'symbols' | 'dialect');
              setFilterCategory('all'); // 切换标签时重置筛选
            }}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {tab.name}
          </button>
        ))}
      </div>
      
      {/* 搜索和筛选区域 */}
      <div className="mb-6">
        {/* 搜索输入框 */}
        <div className="mb-4">
          <div className={`relative rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <i className={`fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
            <input
              type="text"
              placeholder={`搜索${activeTab === 'heritage' ? '非遗技艺' : activeTab === 'symbols' ? '地域符号' : '天津方言'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
        
        {/* 分类筛选 */}
        {activeTab !== 'dialect' && (
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filterCategory === 'all' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              全部
            </button>
            {(activeTab === 'heritage' ? heritageCategories : symbolCategories).map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filterCategory === category ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* 非遗技艺内容 */}
      {activeTab === 'heritage' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredHeritages.length > 0 ? (
            filteredHeritages.map((heritage) => (
              <HeritageCard 
                key={heritage.id} 
                heritage={heritage} 
                isDark={isDark} 
                onOpenModal={openModal} 
                isFavorite={isFavorite} 
                toggleFavorite={toggleFavorite} 
              />
            ))
          ) : (
            <div className={`col-span-full text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <i className="fas fa-search text-4xl mb-4"></i>
              <p>未找到匹配的非遗技艺</p>
              <p className="text-sm mt-2">尝试调整搜索条件或筛选类别</p>
            </div>
          )}
        </div>
      )}
      
      {/* 地域符号内容 */}
      {activeTab === 'symbols' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSymbols.length > 0 ? (
            filteredSymbols.map((symbol) => (
              <SymbolCard 
                key={symbol.id} 
                symbol={symbol} 
                isDark={isDark} 
                onOpenModal={openModal} 
                isFavorite={isFavorite} 
                toggleFavorite={toggleFavorite} 
              />
            ))
          ) : (
            <div className={`col-span-full text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <i className="fas fa-search text-4xl mb-4"></i>
              <p>未找到匹配的地域符号</p>
              <p className="text-sm mt-2">尝试调整搜索条件或筛选类别</p>
            </div>
          )}
        </div>
      )}
      
      {/* 天津方言内容 */}
      {activeTab === 'dialect' && (
        <div className="grid grid-cols-1 gap-4">
          {filteredDialects.length > 0 ? (
            filteredDialects.map((dialect) => (
              <DialectCard 
                key={dialect.id} 
                dialect={dialect} 
                isDark={isDark} 
                onOpenModal={openModal} 
                isFavorite={isFavorite} 
                toggleFavorite={toggleFavorite} 
              />
            ))
          ) : (
            <div className={`col-span-full text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <i className="fas fa-search text-4xl mb-4"></i>
              <p>未找到匹配的天津方言</p>
              <p className="text-sm mt-2">尝试调整搜索条件</p>
            </div>
          )}
        </div>
      )}
      
      {/* 详情模态框 */}
      <DetailModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        data={modalData} 
        isDark={isDark} 
        isFavorite={isFavorite} 
        toggleFavorite={toggleFavorite} 
      />
    </motion.div>
  );
}
