import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { useContext } from 'react';
import { toast } from 'sonner';
import { TianjinImage } from '@/components/TianjinStyleComponents';
import llmService from '@/services/llmService'
import voiceService from '@/services/voiceService'
import { markPrefetched, isPrefetched } from '@/services/prefetch'
import { mockWorks } from '@/mock/works'

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
  
  // 推荐作品 - 从mockWorks中获取，展示更多作品
  const gallery = mockWorks.slice(0, 12); // 展示前12个作品
  
  // 热门创作者 - 基于作品的likes来推荐创作者（去重并排序）
  const popularCreators = Array.from(
    mockWorks
      .reduce((acc, work) => {
        const creator = acc.get(work.creator) || { name: work.creator, avatar: work.creatorAvatar, likes: 0, works: [] };
        creator.likes += work.likes;
        creator.works.push(work);
        acc.set(work.creator, creator);
        return acc;
      }, new Map<string, { name: string; avatar: string; likes: number; works: typeof mockWorks }>())
      .values()
  )
  .sort((a, b) => b.likes - a.likes)
  .slice(0, 6);
  
  // 最新作品 - 基于id排序，假设id越大越新
  // 为每个作品添加唯一参数，确保图片API返回不同的图片
  const latestWorks = [...mockWorks]
    .sort((a, b) => b.id - a.id)
    .slice(0, 8)
    .map(work => ({
      ...work,
      thumbnail: `${work.thumbnail}&unique=${work.id}`
    }));
  
  // 热门标签 - 统计标签出现次数并排序
  const tagCounts = mockWorks
    .flatMap(work => work.tags)
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
  const popularTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([tag]) => tag);
  

  
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
      import('@/pages/Explore').then(() => markPrefetched('Explore', { ttlMs: 120000 })).catch(() => {});
    }
  };
  const prefetchTools = () => {
    if (!isPrefetched('Tools')) {
      import('@/pages/Tools').then(() => markPrefetched('Tools', { ttlMs: 120000 })).catch(() => {});
    }
  };
  const prefetchNeo = () => {
    if (!isPrefetched('Neo')) {
      import('@/pages/Neo').then(() => markPrefetched('Neo', { ttlMs: 120000 })).catch(() => {});
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
  
  // 骨架屏组件
  const Skeleton = ({ className }: { className?: string }) => (
    <div className={`w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ${className}`}></div>
  );

  return (
    <section 
        className={`relative w-full pt-12 ${isDark ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-b from-gray-50 via-white to-gray-50'} animate-fade-in`}
      >

      
      {/* 首页主标题区域 */}
      <Suspense fallback={
        <div className="max-w-7xl mx-auto mb-8">
          <Skeleton className="h-12 md:h-16 mb-4" />
          <Skeleton className="h-4 md:h-6 mb-8" />
          <div className="h-64 rounded-3xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        </div>
      }>
        <div className="max-w-7xl mx-auto mb-8">
          {/* 首页主标题：采用渐变文字与阴影效果，提升视觉吸引力 */}
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent text-center drop-shadow-md animate-gradient-text">
            创作者，您好
          </h1>
          {/* 首页副标题：提升可读性，限制最大宽度，并根据主题切换不同灰度 */}
          <p className={`text-sm sm:text-base md:text-lg leading-relaxed opacity-90 max-w-2xl text-center mx-auto ${isDark ? 'text-gray-200' : 'text-gray-600'} mb-8`}>
            {heroVariant === 'A' 
              ? '输入你的问题或灵感，我们帮你更快抵达答案与创作' 
              : '一句话描述创作目标，获得灵感、生成方案与优化建议'}
          </p>
        
        {/* 搜索与功能按钮区域 */}
        <div className={`rounded-3xl shadow-lg ring-1 ${isDark ? 'bg-gray-800/80 backdrop-blur-sm ring-gray-700 hover:shadow-xl' : 'bg-white/80 backdrop-blur-sm ring-gray-200 hover:shadow-xl'} p-4 md:p-6 transition-all duration-300`}> 
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div className="relative flex-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateClick(); }}
                placeholder="请输入创作问题或灵感关键词"
                className={`w-full px-4 py-3 rounded-lg ${isDark ? 'bg-gray-700/90 text-white ring-2 ring-gray-600 focus:ring-primary' : 'bg-white/90 ring-2 ring-gray-300 focus:ring-primary'} focus:outline-none text-base transition-all duration-300 hover:ring-primary/50`}
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
                  className={`absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded-full ${isDark ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all duration-200 hover:opacity-90 hover:shadow-md`}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            
            {/* 功能按钮组 */}
            <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
              <button onClick={handleInspireClick} className={`px-4 py-2.5 rounded-lg text-sm sm:text-base font-semibold ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-md shadow-gray-500/20' : 'bg-white hover:bg-gray-50 text-gray-900 shadow-md shadow-gray-200'} ring-2 ${isDark ? 'ring-gray-600 hover:ring-primary' : 'ring-gray-300 hover:ring-primary'} transition-all duration-300 flex items-center justify-center gap-1.5 hover:shadow-lg hover:-translate-y-0.5 flex-1 sm:flex-none`}>
                <i className="fas fa-bolt mr-1 transition-transform duration-300 hover:scale-110"></i>
                灵感
              </button>
              <button onClick={handleGenerateClick} className={`px-4 py-2.5 rounded-lg text-sm sm:text-base font-semibold ${isDark ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20' : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10'} ring-2 ${isDark ? 'ring-primary/50 hover:ring-primary' : 'ring-primary/50 hover:ring-primary'} transition-all duration-300 flex items-center justify-center gap-1.5 hover:shadow-xl hover:-translate-y-0.5 flex-1 sm:flex-none`}>
                <i className="fas fa-wand-magic-sparkles mr-1 transition-transform duration-300 hover:scale-110"></i>
                生成
              </button>
            </div>
          </div>
          
          {/* 功能按钮组 - 第二行 */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full">
            <button onClick={handleOptimizeClick} disabled={isOptimizing} className={`px-4 py-2.5 rounded-lg text-sm sm:text-base font-semibold ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-md shadow-gray-500/20' : 'bg-white hover:bg-gray-50 text-gray-900 shadow-md shadow-gray-200'} ring-2 ${isDark ? 'ring-gray-600 hover:ring-primary' : 'ring-gray-300 hover:ring-primary'} transition-all duration-300 flex items-center justify-center gap-1.5 hover:shadow-lg hover:-translate-y-0.5 ${isOptimizing ? 'opacity-60 cursor-not-allowed hover:shadow-none hover:-translate-y-0' : ''} flex-1 sm:flex-none`}>
              <i className="fas fa-adjust mr-1 transition-transform duration-300 hover:scale-110"></i>
              {isOptimizing ? '优化中…' : '优化'}
            </button>
            <button onClick={toggleInspire} className={`px-4 py-2.5 rounded-lg text-sm sm:text-base font-semibold ${inspireOn ? 'bg-primary text-white shadow-lg shadow-primary/20' : isDark ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-md shadow-gray-500/20' : 'bg-white hover:bg-gray-50 text-gray-900 shadow-md shadow-gray-200'} ring-2 ${inspireOn ? 'ring-primary hover:ring-primary/80' : isDark ? 'ring-gray-600 hover:ring-primary' : 'ring-gray-300 hover:ring-primary'} transition-all duration-300 flex items-center justify-center gap-1.5 hover:shadow-lg hover:-translate-y-0.5 flex-1 sm:flex-none`}>
              灵感加持 {inspireOn ? 'ON' : 'OFF'}
            </button>
          </div>
          
          {/* 快速标签 */}
          <div className="mt-5 flex flex-wrap gap-3 scroll-mt-24">
            {quickTags.map((t, i) => {
              const active = selectedTags.includes(t);
              const base = 'ring-2 text-sm px-3 py-1 rounded-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5';
              const activeCls = isDark ? 'bg-primary text-white ring-primary/50' : 'bg-primary/10 text-primary ring-primary font-medium';
              const normalCls = isDark ? 'bg-gray-800 text-gray-200 ring-gray-700 hover:bg-gray-700 hover:ring-primary/50 font-medium' : 'bg-white text-gray-800 ring-gray-300 hover:bg-gray-50 hover:ring-primary/50 font-medium';
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
          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full justify-center md:justify-start">
              <span className={`text-xs px-3 py-1.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
                <i className="fas fa-users mr-1"></i> 12,536 人
              </span>
              <span className={`text-xs px-3 py-1.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
                <i className="fas fa-image mr-1"></i> 2,148 项
              </span>
              <span className={`text-xs px-3 py-1.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
                <i className="fas fa-handshake mr-1"></i> 36 次
              </span>
              <span className={`text-xs px-3 py-1.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
                <i className="fas fa-star mr-1"></i> 96%
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                onClick={handleGenerateClick}
                className={`px-8 py-3.5 rounded-full font-semibold ${isDark ? 'bg-primary hover:bg-primary/90 text-white ring-2 ring-primary/50 shadow-xl shadow-primary/20' : 'bg-primary hover:bg-primary/90 text-white ring-2 ring-primary/20 shadow-xl shadow-primary/10'} transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex-1 justify-center text-center`}
              >
                立即开始创作
              </button>
              <button
                onClick={handleExplore}
                className={`px-6 py-2.5 rounded-full font-semibold ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white ring-gray-600 shadow-lg shadow-gray-500/20' : 'bg-white hover:bg-gray-50 text-gray-900 ring-gray-300 shadow-lg shadow-gray-200'} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex-1 justify-center text-center`}
              >
                浏览精选作品
              </button>
            </div>
          </div>
        </div>
      </div>
      </Suspense>
      
      {/* 推荐问题区域 */}
      <Suspense fallback={
        <div className="max-w-7xl mx-auto mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array(5).fill(0).map((_, idx) => (
              <div key={idx} className={`p-4 rounded-xl ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} flex items-center justify-between`}>
                <Skeleton className="w-3/4" />
                <Skeleton className="w-16" />
              </div>
            ))}
          </div>
        </div>
      }>
        <div className="max-w-7xl mx-auto mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommended.map((r, idx) => (
              <div key={idx} className={`p-4 rounded-xl ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 hover:bg-gray-750' : 'bg-white ring-1 ring-gray-200 hover:bg-gray-50'} flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-slide-up-${idx + 1}`}>
                <span className={`${isDark ? 'text-gray-100' : 'text-gray-700'} text-sm md:text-base`}>{r}</span>
                <button onClick={() => handleRecommendedClick(r)} className="text-primary text-sm md:text-base px-2 py-1 rounded hover:bg-primary/10 transition-all duration-300">查看</button>
              </div>
            ))}
          </div>
        </div>
      </Suspense>
      
      {/* 优化建议区域 */}
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
        {(diagnosedIssues.length > 0 || optimizationSummary || isOptimizing) && (
          <div ref={optimizedRef} className={`p-4 rounded-xl scroll-mt-24 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} transition-all duration-300 hover:shadow-md`}>
            <div className="font-medium mb-2 text-primary">优化建议</div>
            {isOptimizing && (
              <div className={`mb-3 p-4 rounded-lg ${isDark ? 'bg-gray-700 ring-1 ring-gray-600' : 'bg-gray-50 ring-1 ring-gray-200'} `}>
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                  <div className="text-sm font-semibold text-primary">正在生成优化建议...</div>
                </div>
              </div>
            )}
            {optimizationSummary && (
              <div className={`mb-3 p-4 rounded-lg ${isDark ? 'bg-gray-700 ring-1 ring-gray-600' : 'bg-gray-50 ring-1 ring-gray-200'} `}>
                <div className="text-sm font-semibold mb-2 text-primary">AI优化说明</div>
                <div aria-live="polite" className={`${isDark ? 'text-gray-200' : 'text-gray-800'} text-sm`}>
                  {renderOptimizationSummary(optimizationSummary)}
                </div>
              </div>
            )}
            {diagnosedIssues.length > 0 && (
              <ul className="list-disc pl-5 text-sm">
                {diagnosedIssues.map((d, i) => (
                  <li key={i} className={`${isDark ? 'text-gray-300' : 'text-gray-700'} transition-all duration-200 hover:text-primary`}>{d}</li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <button onClick={speakOptimizations} className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-accent hover:bg-accent/90 text-white' : 'bg-accent hover:bg-accent/90 text-white'} transition-all duration-300 hover:shadow-sm`}>朗读建议</button>
              <button onClick={copyOptimizations} className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 ring-1 ring-gray-300'} transition-all duration-300 hover:shadow-sm`}>复制建议</button>
              <button onClick={() => { prefetchTools(); navigate(`/tools?from=home&query=${encodeURIComponent(optimizationSummary || search)}`) }} className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-primary hover:bg-primary/90 text-white'} transition-all duration-300 hover:shadow-sm`}>应用到创作中心</button>
            </div>
            {optimizeAudioUrl && (<audio controls src={optimizeAudioUrl} className={`mt-2 w-full rounded-lg ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`} />)}
          </div>
        )}
      </div>
      
      {/* 为你推荐作品区域 */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <h2 className="text-xl font-bold text-primary">为你推荐</h2>
          <button onMouseEnter={prefetchExplore} onFocus={prefetchExplore} onClick={handleExplore} className="text-sm text-primary hover:text-primary/80 transition-colors duration-200">去作品集</button>
        </div>
        <div ref={galleryRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 scroll-mt-24">
          {gallery.map((item, idx) => (
            <div 
              key={item.id} 
              className={`rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 hover:ring-primary/50' : 'bg-white ring-1 ring-gray-200 hover:ring-primary/50'} cursor-pointer animate-slide-up-${idx + 1}`}
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
                <TianjinImage src={item.thumbnail} alt={item.title} ratio="landscape" rounded="2xl" className="transition-transform duration-500 hover:scale-105" />
                <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full backdrop-blur ${isDark ? 'bg-gray-800/70 ring-1 ring-gray-700 text-gray-200' : 'bg-white/80 ring-1 ring-gray-200 text-gray-700'} transition-all duration-200 hover:shadow-sm`}>
                  <i className="far fa-heart mr-1"></i>{item.likes}
                </span>
              </div>
              <div className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} transition-all duration-300`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-medium text-sm md:text-base transition-all duration-200 hover:text-primary ${isDark ? 'text-gray-100' : ''}`}>{item.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'} transition-all duration-200 hover:bg-primary/10`}>{item.category}</span>
                </div>
                <div className={`${isDark ? 'text-gray-200' : 'text-gray-500'} text-xs`}>精选创作 · 高质量示例</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 天津特色区域 */}
      <div 
        ref={tianjinRef}
        className="container mx-auto w-full relative z-10 mb-12 scroll-mt-24"
      >
        <div className="flex justify-between items-center mb-6 animate-slide-up">
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
           className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700 hover:border-primary/50' : 'border-gray-200 hover:border-primary'} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer animate-slide-up-1`}
           onClick={() => navigate('/tianjin')}
           role="button"
           tabIndex={0}
           onKeyDown={(e) => {
             if (e.key === 'Enter') {
               navigate('/tianjin')
             }
           }}
         >
           <div className="relative overflow-hidden">
             <TianjinImage
                src="/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Tianjin%20cultural%20heritage%20museum%20interior%2C%20warm%20premium%20lighting%2C%20modern%20minimal%20design%2C%20high%20detail"
                alt="天津文化知识库封面"
                ratio="landscape"
                fit="cover"
                className="transition-transform duration-500 hover:scale-105"
              />
             <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent transition-opacity duration-300 hover:opacity-80"></div>
           </div>
           <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'} transition-all duration-300`}>
             <h4 className={`font-bold mb-2 text-sm md:text-base transition-colors duration-200 hover:text-primary ${isDark ? 'text-gray-100' : ''}`}>天津文化知识库</h4>
             <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>
                探索天津独特的历史文化、非遗技艺和地方特色
              </p>
           </div>
         </div>
         <div
           className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700 hover:border-primary/50' : 'border-gray-200 hover:border-primary'} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer animate-slide-up-2`}
           onClick={() => navigate('/tianjin/activities')}
           role="button"
           tabIndex={0}
           onKeyDown={(e) => {
             if (e.key === 'Enter') {
               navigate('/tianjin/activities')
             }
           }}
         >
           <div className="relative overflow-hidden">
             <TianjinImage
                src="/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Creative%20co-creation%20workshop%2C%20premium%20studio%20lighting%2C%20designers%20collaborating%2C%20sleek%20minimal%20aesthetic%2C%20high%20detail"
                alt="津味共创活动封面"
                ratio="landscape"
                fit="cover"
                className="transition-transform duration-500 hover:scale-105"
              />
             <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent transition-opacity duration-300 hover:opacity-80"></div>
           </div>
           <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'} transition-all duration-300`}>
             <h4 className={`font-bold mb-2 text-sm md:text-base transition-colors duration-200 hover:text-primary ${isDark ? 'text-gray-100' : ''}`}>津味共创活动</h4>
             <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>
                参与天津特色主题创作活动，展示津门文化魅力
              </p>
           </div>
         </div>
         <div
           className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700 hover:border-primary/50' : 'border-gray-200 hover:border-primary'} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer animate-slide-up-3`}
           onClick={() => navigate('/create')}
           role="button"
           tabIndex={0}
           onKeyDown={(e) => {
             if (e.key === 'Enter') {
               navigate('/create')
             }
           }}
         >
           <div className="relative overflow-hidden">
             <TianjinImage
                src="/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Futuristic%20AI%20interface%20with%20Chinese%20calligraphy%20elements%2C%20premium%20neon%20glow%2C%20dark%20sleek%20UI%2C%20high%20detail"
                alt="方言指令创作封面"
                ratio="landscape"
                fit="cover"
                className="transition-transform duration-500 hover:scale-105"
              />
             <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent transition-opacity duration-300 hover:opacity-80"></div>
           </div>
           <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'} transition-all duration-300`}>
             <h4 className={`font-bold mb-2 text-sm md:text-base transition-colors duration-200 hover:text-primary ${isDark ? 'text-gray-100' : ''}`}>方言指令创作</h4>
             <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>
                使用天津方言指令进行AI创作，体验独特的交互方式
              </p>
           </div>
         </div>
        </div>
      </div>
      
      {/* 热门创作者推荐 */}
      <div className="max-w-7xl mx-auto mb-12 scroll-mt-24">
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <h2 className="text-xl font-bold text-primary">热门创作者</h2>
          <button onMouseEnter={prefetchExplore} onFocus={prefetchExplore} onClick={handleExplore} className="text-sm text-primary hover:text-primary/80 transition-colors duration-200">查看全部创作者</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularCreators.map((creator, idx) => (
            <div 
              key={idx}
              className={`flex flex-col items-center p-4 rounded-xl ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 hover:ring-primary/50' : 'bg-white ring-1 ring-gray-200 hover:ring-primary/50'} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer animate-slide-up-${idx + 1}`}
              role="button"
              tabIndex={0}
              onClick={() => {
                prefetchExplore();
                navigate(`/explore?creator=${encodeURIComponent(creator.name)}`)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  prefetchExplore();
                  navigate(`/explore?creator=${encodeURIComponent(creator.name)}`)
                }
              }}
            >
              <div className="relative w-20 h-20 mb-3">
                <TianjinImage 
                  src={creator.avatar} 
                  alt={creator.name} 
                  rounded="full" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className={`font-medium text-sm text-center ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{creator.name}</h3>
              <div className="text-xs text-primary mt-1">
                <i className="far fa-heart mr-1"></i>{creator.likes.toLocaleString()} 获赞
              </div>
              <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {creator.works.length} 件作品
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 最新作品展示 */}
      <div className="max-w-7xl mx-auto mb-12 scroll-mt-24">
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <h2 className="text-xl font-bold text-primary">最新作品</h2>
          <button onMouseEnter={prefetchExplore} onFocus={prefetchExplore} onClick={handleExplore} className="text-sm text-primary hover:text-primary/80 transition-colors duration-200">查看全部作品</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {latestWorks.map((work, idx) => (
            <div 
              key={work.id}
              className={`rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 hover:ring-primary/50' : 'bg-white ring-1 ring-gray-200 hover:ring-primary/50'} cursor-pointer animate-slide-up-${idx + 1}`}
              role="button"
              tabIndex={0}
              onClick={() => {
                prefetchExplore();
                navigate(`/explore?q=${encodeURIComponent(work.title)}`)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  prefetchExplore();
                  navigate(`/explore?q=${encodeURIComponent(work.title)}`)
                }
              }}
            >
              <div className="relative aspect-video overflow-hidden">
                <TianjinImage 
                  src={work.thumbnail} 
                  alt={work.title} 
                  ratio="landscape" 
                  className="transition-transform duration-500 hover:scale-105"
                />
                <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full backdrop-blur ${isDark ? 'bg-gray-800/70 ring-1 ring-gray-700 text-gray-200' : 'bg-white/80 ring-1 ring-gray-200 text-gray-700'} transition-all duration-200 hover:shadow-sm`}>
                  <i className="far fa-heart mr-1"></i>{work.likes}
                </span>
              </div>
              <div className={`p-3 ${isDark ? 'bg-gray-800' : 'bg-white'} transition-all duration-300`}>
                <h3 className={`font-medium text-xs md:text-sm transition-all duration-200 hover:text-primary ${isDark ? 'text-gray-100' : 'text-gray-800'} line-clamp-1`}>{work.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>{work.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 热门标签云 */}
      <div className="max-w-7xl mx-auto mb-12 scroll-mt-24">
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <h2 className="text-xl font-bold text-primary">热门标签</h2>
          <button onMouseEnter={prefetchExplore} onFocus={prefetchExplore} onClick={handleExplore} className="text-sm text-primary hover:text-primary/80 transition-colors duration-200">查看全部标签</button>
        </div>
        <div className="flex flex-wrap gap-2 p-6 rounded-xl ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'}">
          {popularTags.map((tag, idx) => (
            <button
              key={idx}
              type="button"
              className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-primary hover:text-white' : 'bg-gray-100 text-gray-800 hover:bg-primary hover:text-white'}`}
              onClick={() => {
                prefetchExplore();
                navigate(`/explore?tags=${encodeURIComponent(tag)}`)
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      

    </section>
  );
}