import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { useContext } from 'react';
import { toast } from 'sonner';
import { TianjinImage } from '@/components/TianjinStyleComponents';
import llmService from '@/services/llmService'
import voiceService from '@/services/voiceService'
import { markPrefetched, isPrefetched } from '@/services/prefetch'

export default function Home() {
  const { theme, isDark, toggleTheme } = useTheme();
  useContext(AuthContext);
  const navigate = useNavigate();
  
  // 添加响应式布局状态
  const [isMobile, setIsMobile] = useState(false);
  
  // 监听窗口大小变化
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 初始化检查
    checkIsMobile();
    
    // 添加 resize 事件监听
    window.addEventListener('resize', checkIsMobile);
    
    // 清理事件监听
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  const handleExplore = () => {
    navigate('/explore');
  };
  const [search, setSearch] = useState('');
  const [inspireOn, setInspireOn] = useState(false);
  const [creativeDirections] = useState<string[]>([]);
  const [generatedText] = useState('');
  const [isGenerating] = useState(false);
  const [diagnosedIssues, setDiagnosedIssues] = useState<string[]>([]);
  const [optimizationSummary, setOptimizationSummary] = useState(''); // AI优化说明（语言大模型流式生成）
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeAudioUrl, setOptimizeAudioUrl] = useState('');
  
  // 页面内功能区定位引用（用于平滑滚动到对应区域）
  const creativeRef = useRef<HTMLDivElement | null>(null); // 创意方向区
  const generatedRef = useRef<HTMLDivElement | null>(null); // AI生成区
  const optimizedRef = useRef<HTMLDivElement | null>(null); // 优化建议区
  const galleryRef = useRef<HTMLDivElement | null>(null); // 为你推荐作品区
  const tianjinRef = useRef<HTMLDivElement | null>(null); // 天津特色专区
  
  const ensurePrompt = (): string | null => {
    const base = search.trim();
    if (!base) {
      toast.warning('请输入关键词');
      return null;
    }
    return inspireOn ? `${base} 灵感加持` : base;
  };
  
  const handleInspireClick = () => {
    const p = ensurePrompt();
    if (!p) return;
    prefetchNeo();
    navigate(`/neo?from=home&query=${encodeURIComponent(p)}`);
  };
  
  const handleGenerateClick = () => {
    const p = ensurePrompt();
    if (!p) return;
    prefetchTools();
    navigate(`/tools?from=home&query=${encodeURIComponent(p)}`);
  };
  
  const handleOptimizeClick = async () => {
    const p = ensurePrompt();
    if (!p) return;
    setIsOptimizing(true);
    setOptimizeAudioUrl('');
    setOptimizationSummary('');
    try {
      // 使用 Kimi 作为默认优化模型（中文对话与创意更友好）
      llmService.setCurrentModel('kimi');
      // 代理模式下不启用流式，避免SSE被浏览器或代理拦截
      llmService.updateConfig({
        stream: false,
        system_prompt: '你是资深创作优化助手，请针对用户的创作问题进行结构化诊断与优化。输出格式包含：\n1) 问题诊断\n2) 优化方向\n3) 落地步骤\n4) 参考素材/风格\n语言简洁、可执行。'
      });
      const issues = llmService.diagnoseCreationIssues(p); // 规则诊断（同步）
      setDiagnosedIssues(issues);
      // 生成优化说明：流式关闭时直接使用最终结果填充
      const summary = await llmService.generateResponse(`${p}（请输出结构化的优化说明与下一步行动）`);
      if (summary && !/接口不可用|未返回内容/.test(summary)) {
        setOptimizationSummary(summary);
      }
      // 同步生成“优化后的提示词”并填充到输入框
      const optimized = await llmService.generateResponse(
        `请将以下创作问题提炼为可直接用于AI生成的中文提示词（不超过60字，包含核心意象与风格约束），只输出提示词本句，不要额外说明：\n${p}`
      );
      const oneLine = optimized.split(/\r?\n/).find(s => s.trim()) || optimized;
      const cleaned = oneLine
        .replace(/^"|"$/g, '')
        .replace(/^“|”$/g, '')
        .replace(/^【|】$/g, '')
        .replace(/^提示词[:：]\s*/, '')
        .trim();
      if (cleaned && !/接口不可用|未返回内容/.test(cleaned)) {
        setSearch(cleaned);
        toast.success('已生成优化提示词，并填入输入框');
      }
      toast.success(`发现${issues.length}条优化建议`);
    } finally {
      setIsOptimizing(false);
    }
  };
  
  const speakOptimizations = async () => {
    const text = optimizationSummary.trim() || diagnosedIssues.join('；'); // 优先朗读AI优化说明
    if (!text) { toast.warning('暂无建议可朗读'); return }
    try {
      const r = await voiceService.synthesize(text, { format: 'mp3' });
      setOptimizeAudioUrl(r.audioUrl);
    } catch (e: any) {
      toast.error(e?.message || '朗读失败');
    }
  };
  
  const copyOptimizations = async () => {
    const text = optimizationSummary.trim() || diagnosedIssues.join('\n'); // 优先复制AI优化说明
    if (!text) { toast.warning('暂无建议可复制'); return }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('建议已复制');
    } catch {
      toast.error('复制失败');
    }
  };
  
  const toggleInspire = () => {
    const next = !inspireOn;
    setInspireOn(next);
    try { localStorage.setItem('inspireOn', String(next)); } catch {}
    toast.info(next ? '灵感加持已开启' : '灵感加持已关闭');
  };
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inspireOn');
      if (saved) setInspireOn(saved === 'true');
    } catch {}
  }, []);
  
  // 将标签追加到搜索（避免重复）
  const appendTagToSearch = (s: string, tag: string) => {
    const has = s.includes(tag);
    return has ? s : (s ? `${s} ${tag}` : tag);
  };
  // 从搜索中移除标签（并清理多余空格）
  const removeTagFromSearch = (s: string, tag: string) => {
    const next = s.replace(new RegExp(tag, 'g'), '').replace(/\s+/g, ' ').trim();
    return next;
  };
  // 切换标签选中状态
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const exists = prev.includes(tag);
      const next = exists ? prev.filter(t => t !== tag) : [...prev, tag];
      // 同步更新搜索框内容
      setSearch((s) => exists ? removeTagFromSearch(s, tag) : appendTagToSearch(s, tag));
      return next;
    });
  };
  
  // 快速标签常量
  const quickTags = ['国潮风格','适用人群','文献灵感','科创思维','地域素材','非遗元素'];
  // 选中标签集合
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 英雄区变体
  const [heroVariant] = useState<'A' | 'B'>(() => {
    try {
      const v = localStorage.getItem('heroVariant')
      if (v === 'A' || v === 'B') return v as any
    } catch {}
    return Math.random() > 0.5 ? 'A' : 'B'
  })
  useEffect(() => { try { localStorage.setItem('heroVariant', heroVariant) } catch {} }, [heroVariant])
  
  // 推荐问题
  const recommended = [
    '国潮风格的品牌包装如何设计',
    '杨柳青年画如何现代化表达',
    '非遗元素适合哪些商业场景',
    '天津传统色彩的应用指南',
    '品牌与老字号共创的最佳实践'
  ];
  
  // 推荐作品
  const gallery = [
    { id: 1, title: '桂发祥麻花包装焕新', category: '老字号品牌', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guifaxiang%20mahua%20modern%20packaging%20design%2C%20cultural%20red%20and%20gold%2C%20studio%20lighting%2C%20high%20detail&image_size=landscape_4_3', likes: 256 },
    { id: 2, title: '狗不理联名海报', category: '视觉设计', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Goubuli%20steamed%20buns%20brand%20poster%20design', likes: 198 },
    { id: 3, title: '耳朵眼炸糕IP形象', category: 'IP设计', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Erduoyan%20fried%20cake%20brand%20mascot%20illustration%2C%20cute%20IP%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3', likes: 312 },
    { id: 4, title: '果仁张秋季礼盒', category: '包装设计', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guorenzhang%20candied%20chestnut%20autumn%20gift%20box%2C%20packaging%20design%2C%20warm%20tone%2C%20high%20detail&image_size=landscape_4_3', likes: 224 },
    { id: 5, title: '杨柳青年画主题插画', category: '插画', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Yangliuqing%20New%20Year%20Painting%20theme%20modern%20illustration', likes: 341 },
    { id: 6, title: '泥人张彩塑联名周边', category: '文创', thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Nirenzhang%20clay%20sculpture%20collaboration%20merch%20design', likes: 187 }
  ];
  

  
  // 预取首页常用页面的代码分片（在组件挂载后触发）
  useEffect(() => {
    const t = setTimeout(() => {
      prefetchExplore();
      prefetchTools();
      prefetchNeo();
    }, 800);
    return () => clearTimeout(t);
  }, []);
  
  // 预取函数：提前加载常用页面的代码分片
  const prefetchExplore = () => {
    if (!isPrefetched('Explore')) {
      import('@/pages/Explore').then(() => markPrefetched('Explore', 120000)).catch(() => {});
    }
  };
  const prefetchTools = () => {
    if (!isPrefetched('Tools')) {
      import('@/pages/Tools').then(() => markPrefetched('Tools', 120000)).catch(() => {});
    }
  };
  const prefetchNeo = () => {
    if (!isPrefetched('Neo')) {
      import('@/pages/Neo').then(() => markPrefetched('Neo', 120000)).catch(() => {});
    }
  };
  
  // 处理推荐问题点击
  const handleRecommendedClick = (text: string) => {
    const map: Record<string, { q?: string; tags?: string[]; tagMode?: 'AND' | 'OR' }> = {
      '国潮风格的品牌包装如何设计': { q: '国潮', tags: ['礼盒', '联名'], tagMode: 'OR' },
      '杨柳青年画如何现代化表达': { q: '杨柳青年画' },
      '非遗元素适合哪些商业场景': { q: '非遗' },
      '天津传统色彩的应用指南': { q: '传统色' },
      '品牌与老字号共创的最佳实践': { q: '品牌', tags: ['联名'], tagMode: 'OR' },
    };
    let cfg = map[text] || { q: text };
    if (!map[text]) {
      const s = text;
      const checks: Array<{ match: string[]; q?: string; tags?: string[]; tagMode?: 'AND' | 'OR' }> = [
        { match: ['国潮', '国潮风格'], q: '国潮', tags: ['联名', '礼盒'], tagMode: 'OR' },
        { match: ['杨柳青年画', '杨柳青'], q: '杨柳青年画' },
        { match: ['非遗'], q: '非遗' },
        { match: ['传统色', '传统色彩', '中国红'], q: '传统色' },
        { match: ['联名'], q: (cfg.q || '品牌'), tags: ['联名'], tagMode: 'OR' },
        { match: ['礼盒'], q: (cfg.q || '包装'), tags: ['礼盒'], tagMode: 'OR' },
        { match: ['京剧'], q: '京剧', tags: ['戏曲'] },
        { match: ['海河'], q: '海河' },
        { match: ['同仁堂'], q: '同仁堂' },
        { match: ['景德镇'], q: '景德镇' },
      ];
      let q = cfg.q;
      const tags: string[] = [];
      let mode: 'AND' | 'OR' | undefined = undefined;
      for (const rule of checks) {
        if (rule.match.some((m) => s.includes(m))) {
          if (rule.q) q = rule.q;
          if (rule.tags) tags.push(...rule.tags);
          if (rule.tagMode) mode = rule.tagMode;
        }
      }
      cfg = { q, tags: Array.from(new Set(tags)), tagMode: mode };
    }
    let params = new URLSearchParams();
    if (cfg.q) params.set('q', cfg.q);
    if (cfg.tags && cfg.tags.length) params.set('tags', cfg.tags.join(','));
    if (cfg.tagMode) params.set('tagMode', cfg.tagMode);
    setSearch(cfg.q || text);
    prefetchExplore();
    navigate(`/explore?${params.toString()}`);
  };
  
  // 简易Markdown渲染（仅支持 ### 标题、- 列表、数字序号、**加粗**）
  const renderOptimizationSummary = (text: string) => {
    if (!text.trim()) return null;
    const lines = text.split(/\r?\n/);
    const elements: JSX.Element[] = [];
    let ul: string[] = [];
    let ol: string[] = [];

    const flushLists = () => {
      if (ul.length) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1">
            {ul.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            ))}
          </ul>
        );
        ul = [];
      }
      if (ol.length) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-5 space-y-1">
            {ol.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            ))}
          </ol>
        );
        ol = [];
      }
    };

    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) { continue; }
      if (line.startsWith('###')) {
        flushLists();
        const title = line.replace(/^###\s*/, '');
        elements.push(<h3 key={`h-${elements.length}`} className="text-base font-semibold mb-2">{title}</h3>);
        continue;
      }
      if (/^\d+\./.test(line)) { ol.push(line.replace(/^\d+\.\s*/, '')); continue; }
      if (line.startsWith('- ')) { ul.push(line.replace(/^-\s*/, '')); continue; }
      flushLists();
      elements.push(
        <p key={`p-${elements.length}`} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      );
    }
    flushLists();

    return (
      <div className="space-y-2 leading-relaxed">
        {elements}
      </div>
    );
  };
  
  return (
    <section 
        className={`relative w-full ${isDark ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-b from-gray-50 via-white to-gray-50'} animate-fade-in`}
      >
      {/* 主题切换按钮 */}
      {!isMobile && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={toggleTheme}
            className={`px-3 py-2 rounded-lg shadow-sm ring-1 transition-all duration-300 flex items-center ${isDark ? 'bg-gray-800 hover:bg-gray-700 ring-gray-700 text-gray-100 hover:shadow-md hover:ring-gray-600' : theme === 'pink' ? 'bg-pink-50 hover:bg-pink-100 ring-pink-200 text-pink-800 hover:shadow-md hover:ring-pink-300' : 'bg-white hover:bg-gray-50 ring-gray-200 text-gray-900 hover:shadow-md hover:ring-gray-300'}`}
            aria-label="切换主题"
            title="切换主题（浅色/深色/粉色）"
          >
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'} mr-2 transition-transform duration-300 hover:scale-110`}></i>
            切换主题
          </button>
        </div>
      )}
      
      {/* 首页主标题区域 */}
      <div className="max-w-7xl mx-auto mb-8">
        {/* 首页主标题：采用清晰的实色文字，确保在所有背景下都有良好的可读性 */}
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-4 text-primary text-center">
          创作者，您好
        </h1>
        {/* 首页副标题：提升可读性（更大字号/行距），限制最大宽度，并根据主题切换不同灰度 */}
        <p className={`text-sm sm:text-base md:text-lg leading-relaxed opacity-85 max-w-2xl text-center mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
          {heroVariant === 'A' 
            ? '输入你的问题或灵感，我们帮你更快抵达答案与创作' 
            : '一句话描述创作目标，获得灵感、生成方案与优化建议'}
        </p>
        
        {/* 搜索与功能按钮区域 */}
        <div className={`rounded-3xl shadow-sm ring-1 ${isDark ? 'bg-gray-800 ring-gray-700 hover:shadow-md' : 'bg-white ring-gray-200 hover:shadow-md'} p-4 md:p-6 transition-all duration-300`}> 
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
            <div className="relative flex-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateClick(); }}
                placeholder="请输入创作问题或灵感关键词"
                className={`w-full px-4 py-3 rounded-lg ${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600 focus:ring-2 focus:ring-primary' : 'bg-white ring-1 ring-gray-300 focus:ring-2 focus:ring-primary'} focus:outline-none text-base transition-all duration-300 hover:ring-primary/50`}
                autoCapitalize="none"
                autoCorrect="off"
                enterKeyHint="search"
                inputMode="text"
              />
              {search && (
                <button
                  aria-label="清空输入"
                  title="清空"
                  onClick={() => { setSearch(''); setSelectedTags([]); }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all duration-200 hover:opacity-90 hover:shadow-sm`}
                >清空</button>
              )}
            </div>
            
            {/* 功能按钮组 */}
            <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
              <button onClick={handleInspireClick} className={`px-3 py-2 rounded-lg text-xs sm:text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-900'} ring-1 ${isDark ? 'ring-gray-600 hover:ring-primary' : 'ring-gray-200 hover:ring-primary'} transition-all duration-300 flex items-center hover:shadow-md hover:-translate-y-0.5 flex-1 sm:flex-none justify-center`}>
                <i className="fas fa-bolt mr-1 transition-transform duration-300 hover:scale-110"></i>
                灵感
              </button>
              <button onClick={handleGenerateClick} className={`px-3 py-2 rounded-lg text-xs sm:text-sm ${isDark ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-primary hover:bg-primary/90 text-white'} ring-1 ${isDark ? 'ring-primary/50 hover:ring-primary' : 'ring-primary/50 hover:ring-primary'} transition-all duration-300 flex items-center hover:shadow-md hover:-translate-y-0.5 flex-1 sm:flex-none justify-center`}>
                <i className="fas fa-wand-magic-sparkles mr-1 transition-transform duration-300 hover:scale-110"></i>
                生成
              </button>
              <button onClick={handleOptimizeClick} disabled={isOptimizing} className={`px-3 py-2 rounded-lg text-xs sm:text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-900'} ring-1 ${isDark ? 'ring-gray-600 hover:ring-primary' : 'ring-gray-200 hover:ring-primary'} transition-all duration-300 flex items-center hover:shadow-md hover:-translate-y-0.5 ${isOptimizing ? 'opacity-60 cursor-not-allowed hover:shadow-none hover:-translate-y-0' : ''} flex-1 sm:flex-none justify-center`}>
                <i className="fas fa-adjust mr-1 transition-transform duration-300 hover:scale-110"></i>
                {isOptimizing ? '优化中…' : '优化'}
              </button>
              <button onClick={toggleInspire} className={`px-3 py-2 rounded-lg text-xs sm:text-sm ${inspireOn ? 'bg-primary text-white' : isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} ring-1 ${inspireOn ? 'ring-primary hover:ring-primary/80' : isDark ? 'ring-gray-600 hover:ring-primary' : 'ring-gray-200 hover:ring-primary'} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex-1 sm:flex-none justify-center`}>
                灵感加持 {inspireOn ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
          
          {/* 快速标签 */}
          <div className="mt-4 flex flex-wrap gap-2 scroll-mt-24">
            {quickTags.map((t, i) => {
              const active = selectedTags.includes(t);
              const base = 'ring-1 text-xs px-3 py-1 rounded-full transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5';
              const activeCls = isDark ? 'bg-primary text-white ring-primary/50' : 'bg-primary/10 text-primary ring-primary';
              const normalCls = isDark ? 'bg-gray-800 text-gray-300 ring-gray-700 hover:bg-gray-700 hover:ring-primary/50' : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50 hover:ring-primary/50';
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleTag(t)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTag(t); } }}
                  className={`${base} ${active ? activeCls : normalCls}`}
                >{t}</button>
              )
            })}
          </div>
          
          {/* 社会证明与CTA按钮 */}
          <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full justify-center md:justify-start">
              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} transition-all duration-200 hover:shadow-sm`}>
                <i className="fas fa-users mr-1"></i> 12,536 人
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} transition-all duration-200 hover:shadow-sm`}>
                <i className="fas fa-image mr-1"></i> 2,148 项
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} transition-all duration-200 hover:shadow-sm`}>
                <i className="fas fa-handshake mr-1"></i> 36 次
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} transition-all duration-200 hover:shadow-sm`}>
                <i className="fas fa-star mr-1"></i> 96%
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
              <button
                onClick={handleGenerateClick}
                className={`px-4 py-2 rounded-full font-medium ${isDark ? 'bg-primary hover:bg-primary/90 text-white ring-primary/50' : 'bg-primary hover:bg-primary/90 text-white ring-primary/20'} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex-1 justify-center`}
              >
                立即开始创作
              </button>
              <button
                onClick={handleExplore}
                className={`px-4 py-2 rounded-full font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white ring-gray-600' : 'bg-white hover:bg-gray-50 text-gray-900 ring-gray-200'} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex-1 justify-center`}
              >
                浏览精选作品
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 推荐问题区域 */}
      <div className="max-w-7xl mx-auto mb-10 animate-slide-up">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommended.map((r, idx) => (
            <div key={idx} className={`p-4 rounded-xl ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 hover:bg-gray-750' : 'bg-white ring-1 ring-gray-200 hover:bg-gray-50'} flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm md:text-base`}>{r}</span>
              <button onClick={() => handleRecommendedClick(r)} className="text-primary text-sm md:text-base px-2 py-1 rounded hover:bg-primary/10 transition-all duration-300">查看</button>
            </div>
          ))}
        </div>
      </div>
      
      {/* 优化建议区域 */}
      {(creativeDirections.length > 0 || generatedText || diagnosedIssues.length > 0) && (
        <div className="max-w-7xl mx-auto mb-10 animate-slide-up">
          {creativeDirections.length > 0 && (
            <div ref={creativeRef} className={`p-4 rounded-xl scroll-mt-24 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} mb-3 transition-all duration-300 hover:shadow-md`}>
              <div className="font-medium mb-2 text-primary">创意方向</div>
              <div className="flex flex-wrap gap-2">
                {creativeDirections.map((d, i) => (
                  <span key={i} className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'} text-xs px-3 py-1 rounded-full transition-all duration-200 hover:bg-primary/10`}>{d}</span>
                ))}
              </div>
            </div>
          )}
          {generatedText && (
            <div ref={generatedRef} className={`p-4 rounded-xl scroll-mt-24 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} mb-3 transition-all duration-300 hover:shadow-md`}>
              <div className="font-medium mb-2 text-primary">AI生成</div>
              <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm whitespace-pre-wrap`}>{generatedText}</div>
              {isGenerating && (<div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs mt-2`}>生成中…</div>)}
            </div>
          )}
          {(diagnosedIssues.length > 0 || optimizationSummary) && (
            <div ref={optimizedRef} className={`p-4 rounded-xl scroll-mt-24 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} transition-all duration-300 hover:shadow-md`}>
              <div className="font-medium mb-2 text-primary">优化建议</div>
              {optimizationSummary && (
                <div className={`mb-3 p-4 rounded-lg ${isDark ? 'bg-gray-700 ring-1 ring-gray-600' : 'bg-gray-50 ring-1 ring-gray-200'} `}>
                  <div className="text-sm font-semibold mb-2 text-primary">AI优化说明</div>
                  <div aria-live="polite" className={`${isDark ? 'text-gray-200' : 'text-gray-800'} text-sm`}>
                    {renderOptimizationSummary(optimizationSummary)}
                  </div>
                </div>
              )}
              <ul className="list-disc pl-5 text-sm">
                {diagnosedIssues.map((d, i) => (
                  <li key={i} className={`${isDark ? 'text-gray-300' : 'text-gray-700'} transition-all duration-200 hover:text-primary`}>{d}</li>
                ))}
              </ul>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <button onClick={speakOptimizations} className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-accent hover:bg-accent/90 text-white' : 'bg-accent hover:bg-accent/90 text-white'} transition-all duration-300 hover:shadow-sm`}>朗读建议</button>
                <button onClick={copyOptimizations} className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 ring-1 ring-gray-300'} transition-all duration-300 hover:shadow-sm`}>复制建议</button>
                <button onClick={() => { prefetchTools(); navigate(`/tools?from=home&query=${encodeURIComponent(optimizationSummary || search)}`) }} className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-primary hover:bg-primary/90 text-white'} transition-all duration-300 hover:shadow-sm`}>应用到创作中心</button>
              </div>
              {optimizeAudioUrl && (<audio controls src={optimizeAudioUrl} className="mt-2 w-full rounded-lg ring-1 ring-gray-200" />)}
            </div>
          )}
        </div>
      )}
      
      {/* 为你推荐作品区域 */}
      <div className="max-w-7xl mx-auto mb-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-primary">为你推荐</h2>
          <button onMouseEnter={prefetchExplore} onFocus={prefetchExplore} onClick={handleExplore} className="text-sm text-primary hover:text-primary/80 transition-colors duration-200">去作品集</button>
        </div>
        <div ref={galleryRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 scroll-mt-24">
          {gallery.map(item => (
            <div 
              key={item.id} 
              className={`rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 hover:ring-primary/50' : 'bg-white ring-1 ring-gray-200 hover:ring-primary/50'} cursor-pointer`}
              role="button"
              tabIndex={0}
              onClick={() => {
                prefetchExplore();
                navigate(`/explore?q=${encodeURIComponent(item.title)}`)
              }}
              onMouseEnter={prefetchExplore}
              onFocus={prefetchExplore}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  prefetchExplore();
                  navigate(`/explore?q=${encodeURIComponent(item.title)}`)
                }
              }}
            >
              <div className="relative aspect-video overflow-hidden rounded-t-2xl">
                <TianjinImage src={item.thumbnail} alt={item.title} ratio="landscape" rounded="2xl" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="transition-transform duration-500 hover:scale-105" />
                <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full backdrop-blur ${isDark ? 'bg-gray-800/70 ring-1 ring-gray-700 text-gray-200' : 'bg-white/80 ring-1 ring-gray-200 text-gray-700'} transition-all duration-200 hover:shadow-sm`}>
                  <i className="far fa-heart mr-1"></i>{item.likes}
                </span>
              </div>
              <div className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} transition-all duration-300`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-sm md:text-base transition-all duration-200 hover:text-primary">{item.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} transition-all duration-200 hover:bg-primary/10`}>{item.category}</span>
                </div>
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>精选创作 · 高质量示例</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 天津特色区域 */}
      <div 
        ref={tianjinRef}
        className="container mx-auto w-full relative z-10 mb-12 scroll-mt-24 animate-slide-up"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center text-primary">
            <i className="fas fa-landmark text-primary mr-2"></i>
            天津特色专区
          </h3>
         <button 
           onClick={() => navigate('/tianjin')}
           className="flex items-center text-primary hover:text-primary/80 transition-colors text-sm"
         >
            查看更多
            <i className="fas fa-arrow-right ml-1"></i>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         <div
           className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700 hover:border-primary/50' : 'border-gray-200 hover:border-primary'} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer`}
           onClick={() => navigate('/tianjin')}
           role="button"
           tabIndex={0}
           onKeyDown={(e) => {
             if (e.key === 'Enter') {
               navigate('/tianjin')
             }
           }}
         >
           <div className="relative aspect-video overflow-hidden">
             <img
               src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Tianjin%20cultural%20heritage%20museum%20interior%2C%20warm%20premium%20lighting%2C%20modern%20minimal%20design%2C%20high%20detail"
               alt="天津文化知识库封面"
               className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
               loading="lazy" decoding="async"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent transition-opacity duration-300 hover:opacity-80"></div>
           </div>
           <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'} transition-all duration-300`}>
             <h4 className="font-bold mb-2 text-sm md:text-base transition-colors duration-200 hover:text-primary">天津文化知识库</h4>
             <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
               探索天津独特的历史文化、非遗技艺和地方特色
             </p>
           </div>
         </div>
         <div
           className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700 hover:border-primary/50' : 'border-gray-200 hover:border-primary'} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer`}
           onClick={() => navigate('/tianjin/activities')}
           role="button"
           tabIndex={0}
           onKeyDown={(e) => {
             if (e.key === 'Enter') {
               navigate('/tianjin/activities')
             }
           }}
         >
           <div className="relative aspect-video overflow-hidden">
             <img
               src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Creative%20co-creation%20workshop%2C%20premium%20studio%20lighting%2C%20designers%20collaborating%2C%20sleek%20minimal%20aesthetic%2C%20high%20detail"
               alt="津味共创活动封面"
               className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
               loading="lazy" decoding="async"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent transition-opacity duration-300 hover:opacity-80"></div>
           </div>
           <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'} transition-all duration-300`}>
             <h4 className="font-bold mb-2 text-sm md:text-base transition-colors duration-200 hover:text-primary">津味共创活动</h4>
             <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
               参与天津特色主题创作活动，展示津门文化魅力
             </p>
           </div>
         </div>
         <div
           className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700 hover:border-primary/50' : 'border-gray-200 hover:border-primary'} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer`}
           onClick={() => navigate('/create')}
           role="button"
           tabIndex={0}
           onKeyDown={(e) => {
             if (e.key === 'Enter') {
               navigate('/create')
             }
           }}
         >
           <div className="relative aspect-video overflow-hidden">
             <img
               src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Futuristic%20AI%20interface%20with%20Chinese%20calligraphy%20elements%2C%20premium%20neon%20glow%2C%20dark%20sleek%20UI%2C%20high%20detail"
               alt="方言指令创作封面"
               className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
               loading="lazy" decoding="async"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent transition-opacity duration-300 hover:opacity-80"></div>
           </div>
           <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'} transition-all duration-300`}>
             <h4 className="font-bold mb-2 text-sm md:text-base transition-colors duration-200 hover:text-primary">方言指令创作</h4>
             <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
               使用天津方言指令进行AI创作，体验独特的交互方式
             </p>
           </div>
         </div>
        </div>
      </div>
      
      {/* 移动端主题切换按钮 */}
      {isMobile && (
        <button
          aria-label="切换主题"
          title="切换主题（快捷键：T）"
          onClick={toggleTheme}
          className={`fixed right-4 bottom-20 z-40 p-3 rounded-full shadow-lg ring-1 transition-colors ${isDark ? 'bg-gray-800 text-yellow-300 ring-gray-700 hover:bg-gray-700' : 'bg-white text-gray-900 ring-gray-200 hover:bg-gray-50'}`}
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) / 2)' }}
        >
          <i className={`fas ${isDark ? 'fa-moon' : 'fa-sun'}`}></i>
        </button>
      )}
    </section>
  );
}