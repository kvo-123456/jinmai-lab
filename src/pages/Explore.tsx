import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import GradientHero from '@/components/GradientHero'
import { isPrefetched } from '@/services/prefetch'
import { TianjinImage, TianjinButton } from '@/components/TianjinStyleComponents'
import { llmService } from '@/services/llmService'
import { BRANDS } from '@/lib/brands'
import imageService from '@/services/imageService'
import { Work, mockWorks } from '@/mock/works'


// 中文注释：本页专注作品探索，社区相关内容已迁移到创作者社区页面

// 分类数据
const categories = [
  '全部', '国潮设计', '纹样设计', '品牌设计', '非遗传承', '插画设计', '工艺创新', '老字号品牌', 'IP设计', '包装设计'
];

// 移除视频作品追加，减少初始数据量，提高页面加载速度
// 视频作品数据将在后续通过异步方式加载，或者放在单独的页面中展示
// 这样可以减少初始加载时间，提高页面跳转速度

export default function Explore() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [filteredWorks, setFilteredWorks] = useState(mockWorks);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popularity' | 'newest' | 'mostViewed' | 'mostCommented' | 'originalOrder'>('originalOrder');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [relatedSearches, setRelatedSearches] = useState<string[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  // 标签筛选相关状态
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [favoriteTags, setFavoriteTags] = useState<string[]>([]);
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [featuredAtStart, setFeaturedAtStart] = useState(true);
  const [featuredAtEnd, setFeaturedAtEnd] = useState(false);
  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  // 分页和无限滚动
  const [page, setPage] = useState(1);
  // 优化分页大小，增加每次加载的作品数量，减少滚动时的加载频率
  const pageSize = 18; // 从12调整为18
  
  // 简化标签处理逻辑，减少计算复杂度
  // 移除复杂的标签计数和排序逻辑
  const popularTags = useMemo(() => {
    // 直接返回固定的热门标签，减少计算复杂度
    return ['老字号品牌', '国潮设计', '非遗传承', 'IP设计', '品牌设计', '插画设计', '工艺创新', '纹样设计', '包装设计', '共创'];
  }, []);
  
  // 简化AI标签推荐，直接返回固定数据
  const aiTagRecommendations = useMemo(() => {
    return {
      hits: ['老字号品牌', '国潮设计', '非遗传承'],
      novel: ['数字非遗', '文化创意', '传统工艺']
    };
  }, []);
  
  // 合并热门标签和所有标签的显示逻辑，减少重复计算
  const filteredTags = useMemo(() => {
    if (!tagQuery) return popularTags;
    const query = tagQuery.toLowerCase();
    return popularTags.filter(tag => tag.toLowerCase().includes(query));
  }, [popularTags, tagQuery]);
  
  // 加载收藏标签
  useEffect(() => {
    try {
      const saved = localStorage.getItem('TOOLS_FAVORITE_TAGS');
      if (saved) {
        setFavoriteTags(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load favorite tags:', error);
    }
  }, []);
  
  // 保存收藏标签
  useEffect(() => {
    try {
      localStorage.setItem('TOOLS_FAVORITE_TAGS', JSON.stringify(favoriteTags));
    } catch (error) {
      console.error('Failed to save favorite tags:', error);
    }
  }, [favoriteTags]);
  
  // 切换标签收藏
  const toggleFavorite = (tag: string) => {
    setFavoriteTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };
  
  // 移动收藏标签顺序
  const moveFavorite = (tag: string, direction: -1 | 1) => {
    setFavoriteTags(prev => {
      const index = prev.indexOf(tag);
      if (index === -1) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const newFavorites = [...prev];
      [newFavorites[index], newFavorites[newIndex]] = [newFavorites[newIndex], newFavorites[index]];
      return newFavorites;
    });
  };
  
  // 渲染高亮标签
  const renderHighlightedTag = (tag: string, query: string) => {
    if (!query) return tag;
    const parts = tag.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 text-black">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };
  
  // 监听精选作品滚动
  const handleFeaturedScroll = () => {
    if (!featuredScrollRef.current) return;
    const el = featuredScrollRef.current;
    setFeaturedAtStart(el.scrollLeft <= 10);
    setFeaturedAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 10);
  };

  // 滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 从URL中获取查询参数
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const search = params.get('search');
    
    // 只在URL参数与当前状态不一致时更新，避免重复渲染
    if (category && category !== selectedCategory) {
      setSelectedCategory(category);
    }
    if (search && search !== searchQuery) {
      setSearchQuery(search);
      setShowSearchBar(true);
    }
  }, [location.search, selectedCategory, searchQuery]);

  // 使用ref跟踪上一次的核心筛选条件
  const prevCoreFiltersRef = useRef({ 
    category: '全部', 
    search: '', 
    sortBy: 'originalOrder' 
  });

  // 筛选和排序作品
  useEffect(() => {
    let result = mockWorks;

    // 按分类筛选
    if (selectedCategory !== '全部') {
      result = result.filter(w => w.category === selectedCategory);
    }

    // 按标签筛选
    if (selectedTags.length > 0) {
      result = result.filter(w => 
        selectedTags.every(tag => w.tags.includes(tag))
      );
    }

    // 按搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(w => 
        w.title.toLowerCase().includes(query) ||
        w.creator.toLowerCase().includes(query) ||
        w.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 排序
    switch (sortBy) {
      case 'popularity':
        result.sort((a, b) => b.likes - a.likes);
        break;
      case 'newest':
        result.sort((a, b) => b.id - a.id);
        break;
      case 'mostViewed':
        result.sort((a, b) => b.views - a.views);
        break;
      case 'mostCommented':
        result.sort((a, b) => b.comments - a.comments);
        break;
      case 'originalOrder':
        // 不排序，保持作品在文件中的原始顺序
        break;
      default:
        break;
    }

    setFilteredWorks(result);
    
    // 检查核心筛选条件是否变化
    const prev = prevCoreFiltersRef.current;
    const hasCoreFilterChanged = prev.category !== selectedCategory || 
                                 prev.search !== searchQuery || 
                                 prev.sortBy !== sortBy;
    
    // 只有在核心筛选条件变化时才重置分页
    if (hasCoreFilterChanged) {
      setPage(1);
      // 更新ref值
      prevCoreFiltersRef.current = { 
        category: selectedCategory, 
        search: searchQuery, 
        sortBy: sortBy 
      };
    }
  }, [selectedCategory, searchQuery, sortBy, selectedTags]);

  // 获取热门作品（展示在推荐区）
  const featuredWorks = mockWorks
    .filter(work => work.featured);
  
  // 分页作品
  const pagedWorks = useMemo(() => {
    return filteredWorks.slice(0, page * pageSize);
  }, [filteredWorks, page]);

  // 处理分类选择
  const handleCategorySelect = (category: string) => {
    // 只更新状态，不触发导航，避免重复渲染
    setSelectedCategory(category);
    // 可选：如果需要更新URL，可以使用history.replaceState来避免触发路由变化
    const url = new URL(window.location.href);
    if (category === '全部') {
      url.searchParams.delete('category');
    } else {
      url.searchParams.set('category', category);
    }
    window.history.replaceState({}, '', url.toString());
  };

  // 移除空的滚动事件监听，减少不必要的事件绑定
  
  
  // 处理作品点击
  const handleWorkClick = (id: number) => {
    navigate(`/explore/${id}`);
  };
  
  // 实现无限滚动，优化阈值和根边距，让加载更及时
  useEffect(() => {
    // 添加防抖机制，避免频繁触发加载
    let timeoutId: NodeJS.Timeout;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagedWorks.length < filteredWorks.length) {
          // 使用防抖，避免快速滚动时频繁触发
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            setPage(prev => prev + 1);
          }, 200);
        }
      },
      { 
        threshold: 0.05, // 降低阈值，更灵敏地检测
        rootMargin: '0px 0px 300px 0px' // 增大根边距，提前更多触发加载
      }
    );
    
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    
    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
      clearTimeout(timeoutId);
    };
  }, [pagedWorks.length, filteredWorks.length]);
  
  // 优化：在标签页可见时才执行无限滚动逻辑
  useEffect(() => {
    let isVisible = true;
    
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 处理搜索
  const handleSearch = () => {
    setIsSearching(true);
    navigate(`/explore?search=${encodeURIComponent(searchQuery)}`, { replace: true });
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };

  // 处理AI推荐搜索
  const handleAIRecommendation = async (query: string) => {
    setIsAIThinking(true);
    setSearchQuery(query);
    try {
      // 使用模拟数据作为AI推荐搜索结果
      const mockResults = [
        `${query} 设计`,
        `${query} 创意`,
        `${query} 风格`,
        `${query} 灵感`,
        `${query} 案例`
      ];
      setRelatedSearches(mockResults);
    } catch (error) {
      console.error('Failed to get AI recommendations:', error);
    } finally {
      setIsAIThinking(false);
    }
  };

  // 聚焦搜索输入框
  useEffect(() => {
    if (showSearchBar && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchBar]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800">
      {/* 顶部红色框 - 优化版 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-pink-600 to-red-700 py-12 px-8 rounded-3xl mx-4 mt-4 shadow-2xl">
        {/* 静态装饰性背景元素 */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/15 rounded-full blur-3xl -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/15 rounded-full blur-3xl -ml-18 -mb-18"></div>
        {/* 中心装饰元素 */}
        <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] bg-gradient-to-r from-red-500/20 to-pink-500/20 blur-3xl -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
        
        <div className="container mx-auto relative z-10">
          {/* 标题和副标题 - 简化动画 */}
          <div className="mb-12 text-center md:text-left">
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg leading-tight"
            >
              探索中国传统品牌新创意
            </h1>
            <p 
              className="text-white/95 mt-4 text-base md:text-lg max-w-2xl mx-auto md:mx-0 leading-relaxed"
            >
              发现来自全国各地的品牌设计作品，感受传统与现代的完美融合
            </p>
          </div>
          
          {/* 标签区 - 简化动画 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { title: '精选', subtitle: '优选', category: '全部', icon: '✨' },
              { title: '风格', subtitle: '融合', category: '国潮设计', icon: '🎨' },
              { title: '效率', subtitle: '提升', category: '工艺创新', icon: '⚡' },
              { title: '协作', subtitle: '共创', category: 'IP设计', icon: '🤝' }
            ].map((item, index) => (
              <button
                key={index}
                className="px-6 py-5 bg-gradient-to-r from-red-700/95 to-red-800/95 text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-400 border border-red-900/30 hover:border-red-800/50 hover:bg-red-600/90 backdrop-blur-sm group"
                onClick={() => setSelectedCategory(item.category)}
                aria-label={`查看${item.category}作品`}
              >
                {/* 图标 */}
                <div className="text-xl mb-2">
                  {item.icon}
                </div>
                <div className="font-semibold text-lg">{item.title}</div>
                <div className="text-xs opacity-90 mt-1">{item.subtitle}</div>
                {/* 底部渐变光效 */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 搜索区 */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              {showSearchBar ? (
                <div className="flex">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="搜索作品、设计师或标签..."
                    className="flex-1 px-4 py-3 rounded-l-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-r-lg flex items-center gap-2"
                  >
                    {isSearching ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      '搜索'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowSearchBar(false);
                      setSearchQuery('');
                      navigate('/explore', { replace: true });
                    }}
                    className="ml-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-3 rounded-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearchBar(true)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-gray-500 dark:text-gray-400">搜索作品、设计师或标签...</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* 排序选项 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">排序:</span>
            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="originalOrder">原始顺序</option>
              <option value="popularity">热门作品</option>
              <option value="newest">最新发布</option>
              <option value="mostViewed">最多浏览</option>
              <option value="mostCommented">最多评论</option>
            </select>
          </div>
        </div>

        {/* AI相关搜索推荐 */}
        {relatedSearches.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">AI推荐搜索</h3>
            <div className="flex flex-wrap gap-2">
              {relatedSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(search);
                    handleSearch();
                  }}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 精选作品轮播 */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">精选作品</h2>
            <button
              onClick={() => setSelectedCategory('全部')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              查看全部
            </button>
          </div>
          
          {/* 轮播容器 */}
          <div className="relative overflow-hidden">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {featuredWorks.map((work, index) => (
                <div
                key={work.id}
                className="flex-shrink-0 w-full sm:w-96 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md dark:shadow-gray-700 hover:shadow-lg dark:hover:shadow-gray-600 transition-all cursor-pointer"
                onClick={() => navigate(`/explore/${work.id}`)}
              >
                  <div className="relative">
                    {work.videoUrl ? (
                      <div className="relative">
                        <TianjinImage
                          src={work.thumbnail}
                          alt={work.title}
                          className="w-full h-48 object-cover"
                          imageTag={work.imageTag}
                          priority={index < 3}
                          quality={index < 6 ? 'high' : 'medium'}
                          loading="lazy"
                          disableFallback={true}
                        />
                        {/* 视频播放按钮 */}
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <TianjinImage
                        src={work.thumbnail}
                        alt={work.title}
                        className="w-full h-48 object-cover"
                        imageTag={work.imageTag}
                        priority={index < 3}
                        quality={index < 6 ? 'high' : 'medium'}
                        loading="lazy"
                        disableFallback={true}
                      />
                    )}
                    
                    {/* 创作者信息悬浮 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black bg-opacity-70 to-transparent p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                          <TianjinImage
                          src={work.creatorAvatar}
                          alt={work.creator}
                          className="w-full h-full object-cover"
                          disableFallback={true}
                        />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{work.creator}</p>
                          <p className="text-white text-xs opacity-90">{work.category}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 line-clamp-1">{work.title}</h3>
                    
                    {/* 标签 */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {work.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* 统计信息 */}
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{work.likes + (liked[work.id] ? 1 : 0)}</span>
                    </div>
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{work.comments}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{work.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-3 min-w-max pb-2">
            {categories.map((category) => (
              <motion.button
                key={category}
                onClick={() => handleCategorySelect(category)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 font-medium ${selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-lg dark:shadow-blue-900/50'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* 标签筛选按钮 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">标签筛选</h3>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTagsOpen(!tagsOpen)}
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              {tagsOpen ? '收起标签' : '展开标签'}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${
                tagsOpen ? 'rotate-180' : ''
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.button>
          </div>
          
          {/* 已选择标签 */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTags.map((tag) => (
                <div key={tag} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                  <span>{tag}</span>
                  <button
                    onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                    className="text-blue-800 dark:text-blue-200 hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* 标签筛选面板 */}
          {tagsOpen && (
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-700 p-4 border border-gray-300 dark:border-gray-700"
              ref={tagsContainerRef}
            >
              {/* 标签搜索 */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="搜索标签..."
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* 收藏标签 */}
              {favoriteTags.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">收藏的标签</h4>
                    <button onClick={() => setFavoriteTags([])} className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors">
                      清空收藏
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {favoriteTags.map((tag) => (
                      <div key={tag} className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {tag}
                        </button>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveFavorite(tag, -1)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">▲</button>
                          <button onClick={() => moveFavorite(tag, 1)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">▼</button>
                          <button onClick={() => toggleFavorite(tag)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400">
                            <i className="fas fa-star"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 热门标签 */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">热门标签</h4>
                <div className="flex flex-wrap gap-2">
                  {filteredTags.map(tag => (
                    <div key={`pop-${tag}`} className="inline-flex items-center gap-1">
                      <button
                        onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {renderHighlightedTag(tag, tagQuery)}
                      </button>
                      <button onClick={() => toggleFavorite(tag)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400">
                        <i className="far fa-star"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* AI标签推荐 */}
              {(aiTagRecommendations.hits.length > 0 || aiTagRecommendations.novel.length > 0) && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">AI标签推荐</h4>
                  {aiTagRecommendations.hits.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">命中已有标签</div>
                      <div className="flex flex-wrap gap-2">
                        {aiTagRecommendations.hits.map(tag => (
                          <button key={`ai-hit-${tag}`} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev : [...prev, tag])} className={`px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors`}>
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiTagRecommendations.novel.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">推荐新标签</div>
                      <div className="flex flex-wrap gap-2">
                        {aiTagRecommendations.novel.map(tag => (
                          <button key={`ai-novel-${tag}`} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev : [...prev, tag])} className={`px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors`}>
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* 所有标签 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">所有标签</h4>
                <div className="max-h-48 overflow-y-auto pr-2">
                  <div className="flex flex-wrap gap-2">
                    {filteredTags.map(tag => (
                    <div key={`all-${tag}`} className="inline-flex items-center gap-1">
                      <button
                        onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {renderHighlightedTag(tag, tagQuery)}
                      </button>
                      <button onClick={() => toggleFavorite(tag)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400">
                        <i className="far fa-star"></i>
                      </button>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setSelectedTags([])}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  清空
                </button>
                <button
                  onClick={() => setTagsOpen(false)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  完成
                </button>
              </div>
              </div>
            )}
          </div>

        {/* 作品网格 */}
        <div id="works-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            // 加载状态
            Array.from({ length: 8 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md dark:shadow-gray-700 animate-pulse"
              >
                <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : pagedWorks.length === 0 ? (
            // 无结果状态
            <div className="col-span-full text-center py-16">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">未找到相关作品</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">尝试调整搜索条件或浏览其他分类</p>
              <button
                onClick={() => {
                  setSelectedCategory('全部');
                  setSearchQuery('');
                  navigate('/explore', { replace: true });
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                浏览全部作品
              </button>
            </div>
          ) : (
            // 作品列表
            pagedWorks.map((work, index) => (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md dark:shadow-gray-700 hover:shadow-xl dark:hover:shadow-gray-500 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/explore/${work.id}`)}
              >
                <div className="relative group">
                  {/* 作品缩略图 */}
                  {work.videoUrl ? (
                    // 视频作品
                    <div className="relative">
                      <TianjinImage
                        src={work.thumbnail}
                        alt={work.title}
                        className="w-full h-48 object-cover"
                        imageTag={work.imageTag}
                        disableFallback={true}
                      />
                      {/* 视频播放按钮 */}
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      {/* 视频时长 */}
                      {work.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {work.duration}
                        </div>
                      )}
                    </div>
                  ) : (
                    // 图片作品
                    <TianjinImage
                      src={work.thumbnail}
                      alt={work.title}
                      className="w-full h-48 object-cover"
                      imageTag={work.imageTag}
                      priority={index < 3}
                      quality={index < 6 ? 'high' : 'medium'}
                      loading="lazy"
                    />
                  )}
                  
                  {/* 联名徽章 */}
                  {work.tags.includes('联名') && (
                    <div className="absolute top-3 left-3">
                      <span className={`text-xs px-2 py-1 rounded-full backdrop-blur ${work.category === '老字号品牌' ? 'bg-amber-600/80 ring-1 ring-amber-500/50 text-white' : 'bg-blue-600/80 ring-1 ring-blue-500/50 text-white'}`}>
                        联名
                      </span>
                    </div>
                  )}
                  
                  {/* 悬停时显示的操作按钮 */}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setLiked(prev => ({ ...prev, [work.id]: !prev[work.id] })); }}
                        className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors shadow-md hover:shadow-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-all duration-300 ${liked[work.id] ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors shadow-md hover:shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                        </svg>
                      </motion.button>
                    </div>
                </div>

                {/* 作品信息 */}
                <div className="p-4">
                  {/* 创作者信息 */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <TianjinImage
                        src={work.creatorAvatar}
                        alt={work.creator}
                        className="w-full h-full object-cover"
                        disableFallback={true}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{work.creator}</p>
                    </div>
                  </div>

                  {/* 作品标题 */}
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2">{work.title}</h3>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {work.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                    {work.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                        +{work.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* 统计信息 */}
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{work.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{work.comments}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{work.views}</span>
                    </div>
                  </div>

                  {/* 作品分类标签 */}
                  <div className="mt-3 flex justify-between items-center">
                    <span className={`text-sm px-2 py-0.5 rounded-full ${work.category === '老字号品牌' ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {work.category}
                    </span>
                    <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/explore/${work.id}`); }}
                    className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    aria-label={`查看作品 ${work.title} 的详情`}
                  >
                    查看详情
                  </motion.button>
                  </div>

                  {/* 应用到创作中心按钮 */}
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const prompt = `${work.title} · ${work.category} · ${work.tags.join(' / ')}`;
                      navigate(`/create?from=explore&prompt=${encodeURIComponent(prompt)}`);
                    }}
                    className="w-full mt-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    应用到创作中心
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* 底部信息 */}
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>共找到 {filteredWorks.length} 个作品</p>
          <p className="mt-1">探索更多中国传统品牌创意设计</p>
        </div>
        
        {/* 无限滚动哨兵 */}
        <div className="text-center mt-10">
          {page * pageSize < filteredWorks.length ? (
            <div ref={sentinelRef} className="h-10">
              <div className="animate-pulse text-gray-500 dark:text-gray-400">加载更多...</div>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">已加载全部</span>
          )}
        </div>
        
        {/* 页脚 */}
        <footer className={`mt-16 border-t ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4`}>
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              © 2025 AI共创平台. 保留所有权利
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/about" className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}>关于我们</a>
              <a href="/privacy" className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}>隐私政策</a>
              <a href="/terms" className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}>服务条款</a>
              <a href="/help" className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors text-sm`}>帮助中心</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

