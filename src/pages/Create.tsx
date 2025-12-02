import { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import CollaborationPanel from '@/components/CollaborationPanel';
import AID点评 from '@/components/AID点评';
 
import LLMCommandPanel from '@/components/LLMCommandPanel';
import ModelSelector from '@/components/ModelSelector';
import { HaiheBoatTransition, TianjinImage } from '@/components/TianjinStyleComponents';
import SidebarLayout from '@/components/SidebarLayout'
import llmService from '../services/llmService';
import doubao, { createVideoTask, pollVideoTask } from '@/services/doubao'
import { promptTemplates } from '@/data/promptTemplates';

// 模拟AI生成结果
const aiGeneratedResults = [
  {
    id: 1,
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=AI%20generated%20traditional%20Chinese%20design%201',
    score: 85,
  },
  {
    id: 2,
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=AI%20generated%20traditional%20Chinese%20design%202',
    score: 78,
  },
  {
    id: 3,
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=AI%20generated%20traditional%20Chinese%20design%203',
    score: 92,
  },
  {
    id: 4,
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=AI%20generated%20traditional%20Chinese%20design%204',
    score: 75,
  },
];

// 传统纹样素材
const traditionalPatterns = [
  {
    id: 1,
    name: '云纹',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Traditional%20Chinese%20cloud%20pattern',
    description: '象征吉祥如意，常用于传统服饰和建筑',
  },
  {
    id: 2,
    name: '龙纹',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Traditional%20Chinese%20dragon%20pattern',
    description: '象征权力与尊贵，中国传统文化的重要象征',
  },
  {
    id: 3,
    name: '凤纹',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Traditional%20Chinese%20phoenix%20pattern',
    description: '象征美好与幸福，常与龙纹配合使用',
  },
  {
    id: 4,
    name: '回纹',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Traditional%20Chinese%20key%20pattern',
    description: '寓意吉祥绵延，是传统装饰中常见的纹样',
  },
  {
    id: 5,
    name: '花卉纹',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Traditional%20Chinese%20flower%20pattern',
    description: '象征自然与生机，常见牡丹、莲花等纹样',
  },
  {
    id: 6,
    name: '几何纹',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Traditional%20Chinese%20geometric%20pattern',
    description: '简洁明快，富有节奏感和韵律感',
  },
];

// 创作工具类型（新增更多玩法：重混、版式、Mockup、平铺）
type ToolType = 'sketch' | 'pattern' | 'filter' | 'trace' | 'remix' | 'layout' | 'mockup' | 'tile';

export default function Create() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTool, setActiveTool] = useState<ToolType>('sketch');
  const [prompt, setPrompt] = useState('');
  const [generatedResults, setGeneratedResults] = useState(aiGeneratedResults);
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCulturalInfo, setShowCulturalInfo] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const [showAID点评, setShowAID点评] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isPrecheckEnabled, setIsPrecheckEnabled] = useState(true);
  const [precheckResult, setPrecheckResult] = useState<{
    status: 'pending' | 'passed' | 'warning' | 'failed';
    issues: { type: string; severity: 'warning' | 'error'; message: string }[];
  } | null>(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [explainCollapsed, setExplainCollapsed] = useState(false);
  // 中文注释：默认选择豆包作为生图引擎，点击“生成”时直接调用豆包接口
  const [engine, setEngine] = useState<'sdxl' | 'doubao'>('doubao');
  const [fusionMode, setFusionMode] = useState<boolean>(false);
  // 中文注释：预览图点击触发豆包重新生成时的加载状态
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  // 中文注释：像生成引擎一样，一次生成三张方案图片的加载状态
  const [isEngineGenerating, setIsEngineGenerating] = useState<boolean>(false);
  // 中文注释：AI润色加载状态，用于控制“AI润色”按钮的禁用与动画
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  // 中文注释：风格预设与批量生成数量（最多6张）
  const [stylePreset, setStylePreset] = useState<string>('');
  const [generateCount, setGenerateCount] = useState<number>(3);
  // 中文注释：收藏夹与导出
  const [favorites, setFavorites] = useState<Array<{ id: number; thumbnail: string }>>([]);
  // 中文注释：为每个方案增加可选的视频链接字段
  const [videoGenerating, setVideoGenerating] = useState<boolean>(false);
  // 中文注释：文化识别说明文本
  const [culturalInfoText, setCulturalInfoText] = useState<string>('云纹是中国传统装饰纹样中常见的一种，象征着吉祥如意、高升和祥瑞。');
  // 中文注释：融合玩法第二提示词与混合生成加载状态
  const [promptB, setPromptB] = useState<string>('');
  const [isFusing, setIsFusing] = useState<boolean>(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const toolRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [selectedPatternId, setSelectedPatternId] = useState<number | null>(null);
  const [filterName, setFilterName] = useState<string>('复古胶片');
  const [filterIntensity, setFilterIntensity] = useState<number>(5);
  const [autoGenerate, setAutoGenerate] = useState<boolean>(true);
  const [showQuickActions, setShowQuickActions] = useState<boolean>(false);
  // 中文注释：用于“更多玩法”下拉的容器引用，以便检测外部点击关闭
  const quickActionsRef = useRef<HTMLDivElement | null>(null);
  // 中文注释：当展开时监听文档点击，点击下拉外部区域自动关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target as Node)) {
        setShowQuickActions(false);
      }
    };
    if (showQuickActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuickActions]);
  const [showEngineDetails, setShowEngineDetails] = useState<boolean>(false);
  const [recentPatterns, setRecentPatterns] = useState<number[]>([]);
  const [recentFilters, setRecentFilters] = useState<Array<{ name: string; intensity: number }>>([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [genError, setGenError] = useState('');
  const [curationTemplate, setCurationTemplate] = useState<string>('标准');
  const [customTemplates, setCustomTemplates] = useState<Record<string, string>>({});
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateGuide, setNewTemplateGuide] = useState('');
  const [savedPlans, setSavedPlans] = useState<Array<{ id: string; title: string; query: string; aiText: string; ts: number }>>(() => {
    try { return JSON.parse(localStorage.getItem('TOOLS_SAVED_PLANS') || '[]'); } catch { return []; }
  });
  const templateGuides: Record<string, string> = {
    '标准': '包含：1) 创作方向，2) 视觉风格，3) 配色建议（可引用传统色），4) 文化元素融合建议，5) 可落地物料清单（海报/包装/IP形象等），语言精炼、结构清晰、可执行',
    '商业合作': '面向品牌联合与商业落地：1) 品牌契合点与受众画像，2) 视觉与物料清单（KV/包装/周边），3) 预算与里程碑（简要），4) 风险与合规注意事项，语气专业',
    '校园活动': '适用于校园传播与比赛组织：1) 主题设计与互动玩法，2) 视觉风格与配色，3) 活动物料清单，4) 宣传渠道与执行建议',
    '文旅宣传': '面向文旅场景：1) 地域文化元素融入策略，2) 视觉风格与配色，3) 物料清单（海报/导览/纪念品），4) 场景落地建议',
    '社媒传播': '适用于社媒运营：1) 内容主题与排期，2) 视觉风格与模板，3) 互动话题与标签，4) KPI与复盘建议'
  };
  useEffect(() => {
    try {
      const saved = localStorage.getItem('TOOLS_CURATION_TEMPLATE');
      if (saved && templateGuides[saved]) setCurationTemplate(saved as any);
      const savedCustom = localStorage.getItem('TOOLS_CURATION_CUSTOM_TEMPLATES');
      if (savedCustom) setCustomTemplates(JSON.parse(savedCustom));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('TOOLS_CURATION_TEMPLATE', curationTemplate); } catch {}
  }, [curationTemplate]);
  useEffect(() => {
    try { localStorage.setItem('TOOLS_CURATION_CUSTOM_TEMPLATES', JSON.stringify(customTemplates)); } catch {}
  }, [customTemplates]);
  const allTemplateGuides = useMemo(() => ({ ...templateGuides, ...customTemplates }), [customTemplates]);
  const curationPromptPreview = useMemo(() => {
    const guide = allTemplateGuides[curationTemplate] || templateGuides['标准'];
    const desc = (prompt || '').trim();
    return `请基于以下输入生成一个“${curationTemplate}”风格的国潮与非遗策展方案：${guide}。\n\n创作提示：${desc || '无'}；工具：${activeTool}；风格预设：${stylePreset || '无'}`;
  }, [curationTemplate, allTemplateGuides, prompt, activeTool, stylePreset]);
  const handleGenerateCurationPlan = async () => {
    try {
      setGenError('');
      setGeneratingPlan(true);
      const aiText = await llmService.generateResponse(curationPromptPreview);
      const plan = {
        id: `curation-${Date.now()}`,
        title: `策展方案（${curationTemplate}）`,
        query: (prompt || `${activeTool}${stylePreset ? ' · ' + stylePreset : ''}`),
        aiText,
        ts: Date.now(),
      };
      const next = [plan, ...savedPlans].slice(0, 20);
      setSavedPlans(next);
      try { localStorage.setItem('TOOLS_SAVED_PLANS', JSON.stringify(next)); } catch {}
    } catch (e: any) {
      setGenError('生成失败：请检查密钥配置或稍后重试');
    } finally {
      setGeneratingPlan(false);
    }
  };
  const toolOptions: Array<{ id: ToolType; name: string; icon: string }> = [
    { id: 'sketch', name: '一键设计', icon: 'magic' },
    { id: 'pattern', name: '纹样嵌入', icon: 'th' },
    { id: 'filter', name: 'AI滤镜', icon: 'filter' },
    { id: 'trace', name: '文化溯源', icon: 'book-open' },
    // 中文注释：新增玩法入口按钮
    { id: 'remix', name: '风格重混', icon: 'random' },
    { id: 'layout', name: '版式生成', icon: 'th-large' },
    { id: 'mockup', name: 'Mockup预览', icon: 'box-open' },
    { id: 'tile', name: '图案平铺', icon: 'border-all' }
  ];

  const handleToolSelect = (id: ToolType) => {
    setActiveTool(id);
    const params = new URLSearchParams(location.search);
    params.set('tool', id);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };
  const [activeEditTool, setActiveEditTool] = useState<'resize' | 'filter' | 'color' | 'text' | 'layers' | 'history' | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturate, setSaturate] = useState<number>(100);
  const [hueRotate, setHueRotate] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);
  const [overlayText, setOverlayText] = useState<string>('');
  const [overlaySize, setOverlaySize] = useState<number>(20);
  const [overlayColor, setOverlayColor] = useState<string>('#111827');
  const [editToolsCollapsed, setEditToolsCollapsed] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ scale: number; brightness: number; contrast: number; saturate: number; hueRotate: number; blur: number; overlayText: string; overlaySize: number; overlayColor: string }>>([]);
  const [redoStack, setRedoStack] = useState<typeof history>([]);
  const pushHistory = () => {
    setHistory((h) => [...h.slice(-19), { scale, brightness, contrast, saturate, hueRotate, blur, overlayText, overlaySize, overlayColor }]);
    setRedoStack([]);
  };
  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setRedoStack((r) => [...r, { scale, brightness, contrast, saturate, hueRotate, blur, overlayText, overlaySize, overlayColor }]);
      setScale(prev.scale);
      setBrightness(prev.brightness);
      setContrast(prev.contrast);
      setSaturate(prev.saturate);
      setHueRotate(prev.hueRotate);
      setBlur(prev.blur);
      setOverlayText(prev.overlayText);
      setOverlaySize(prev.overlaySize);
      setOverlayColor(prev.overlayColor);
      return h.slice(0, -1);
    });
  };
  const redo = () => {
    setRedoStack((r) => {
      if (!r.length) return r;
      const next = r[r.length - 1];
      pushHistory();
      setScale(next.scale);
      setBrightness(next.brightness);
      setContrast(next.contrast);
      setSaturate(next.saturate);
      setHueRotate(next.hueRotate);
      setBlur(next.blur);
      setOverlayText(next.overlayText);
      setOverlaySize(next.overlaySize);
      setOverlayColor(next.overlayColor);
      return r.slice(0, -1);
    });
  };
  
  // 中文注释：自动保存设置（开关 + 间隔）与历史快照列表
  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('CREATE_AUTOSAVE_ENABLED') || 'true') } catch { return true }
  })
  const [autosaveIntervalSec, setAutosaveIntervalSec] = useState<number>(() => {
    try { return JSON.parse(localStorage.getItem('CREATE_AUTOSAVE_INTERVAL_SEC') || '30') } catch { return 30 }
  })
  interface CreateSnapshot {
    prompt: string;
    selectedResult: number | null;
    currentStep: number;
    aiExplanation: string;
    scale: number; brightness: number; contrast: number; saturate: number; hueRotate: number; blur: number;
    overlayText: string; overlaySize: number; overlayColor: string;
    updatedAt: number;
  }
  const [snapshots, setSnapshots] = useState<CreateSnapshot[]>(() => {
    try { return JSON.parse(localStorage.getItem('CREATE_HISTORY') || '[]') } catch { return [] }
  })
  useEffect(() => { try { localStorage.setItem('CREATE_HISTORY', JSON.stringify(snapshots.slice(0, 20))) } catch {} }, [snapshots])
  useEffect(() => { try { localStorage.setItem('CREATE_AUTOSAVE_ENABLED', JSON.stringify(autosaveEnabled)) } catch {} }, [autosaveEnabled])
  useEffect(() => { try { localStorage.setItem('CREATE_AUTOSAVE_INTERVAL_SEC', JSON.stringify(autosaveIntervalSec)) } catch {} }, [autosaveIntervalSec])

  // 中文注释：生成当前快照对象
  const buildSnapshot = (): CreateSnapshot => ({
    prompt,
    selectedResult,
    currentStep,
    aiExplanation,
    scale, brightness, contrast, saturate, hueRotate, blur,
    overlayText, overlaySize, overlayColor,
    updatedAt: Date.now(),
  })

  // 中文注释：执行保存（更新草稿 + 记录历史）
  const performSave = (reason: 'manual' | 'autosave' | 'beforeunload' = 'manual') => {
    try {
      const snap = buildSnapshot()
      localStorage.setItem('CREATE_DRAFT', JSON.stringify(snap))
      setLastUpdatedAt(snap.updatedAt)
      setSnapshots(prev => [snap, ...prev].slice(0, 20))
      if (reason === 'manual') toast.success('已保存到草稿与历史')
    } catch {
      if (reason === 'manual') toast.error('保存失败')
    }
  }

  // 中文注释：自动保存定时器
  useEffect(() => {
    if (!autosaveEnabled) return
    const ms = Math.max(autosaveIntervalSec, 5) * 1000
    const timer = setInterval(() => performSave('autosave'), ms)
    return () => clearInterval(timer)
  }, [autosaveEnabled, autosaveIntervalSec, prompt, selectedResult, currentStep, aiExplanation, scale, brightness, contrast, saturate, hueRotate, blur, overlayText, overlaySize, overlayColor])

  // 中文注释：页面关闭/刷新前的最后一次保存
  useEffect(() => {
    const handler = () => { try { performSave('beforeunload') } catch {} }
    window.addEventListener('beforeunload', handler)
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') handler() })
    return () => { window.removeEventListener('beforeunload', handler) }
  }, [])
  const filterCss = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hueRotate}deg) blur(${blur}px)`;
  useEffect(() => {
    if (selectedResult) setShowQuickActions(true);
  }, [selectedResult]);
  
  // 检查是否已登录
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    } else {
      setTimeout(() => {
        setIsLoading(false);
        try {
          const saved = localStorage.getItem('CREATE_DRAFT');
          if (saved) {
            const d = JSON.parse(saved);
            const params = new URLSearchParams(location.search);
            const qp = params.get('prompt');
            if (!qp && typeof d.prompt === 'string') setPrompt(d.prompt);
            if (typeof d.selectedResult === 'number' || d.selectedResult === null) setSelectedResult(d.selectedResult);
            if (typeof d.currentStep === 'number') setCurrentStep(d.currentStep);
            if (typeof d.aiExplanation === 'string') setAiExplanation(d.aiExplanation);
            if (typeof d.updatedAt === 'number') setLastUpdatedAt(d.updatedAt);
          }
        } catch {}
      }, 800);
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tool');
    if (t && ['sketch','pattern','filter','trace','remix','layout','mockup','tile'].includes(t)) {
      setActiveTool(t as ToolType);
    }
    const p = params.get('prompt');
    if (p) {
      setPrompt(p);
      setSelectedResult(null);
      setCurrentStep(1);
      setAiExplanation('');
    }
  }, [location.search]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('CREATE_RECENTS');
      if (raw) {
        const obj = JSON.parse(raw);
        if (Array.isArray(obj.patterns)) setRecentPatterns(obj.patterns.slice(0, 5));
        if (Array.isArray(obj.filters)) setRecentFilters(obj.filters.slice(0, 5));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const data = {
        prompt,
        selectedResult,
        currentStep,
        aiExplanation,
        updatedAt: Date.now()
      };
      localStorage.setItem('CREATE_DRAFT', JSON.stringify(data));
    } catch {}
  }, [prompt, selectedResult, currentStep, aiExplanation]);
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入创作提示');
      return;
    }
    setIsGenerating(true);
    setAiExplanation('');
    try {
      const cfg = llmService.getConfig();
      if (cfg.stream) {
        await llmService.generateResponse(prompt, {
          onDelta: (full) => {
            setAiExplanation(full);
          }
        });
      } else {
        const withStyle = stylePreset ? `${prompt}；风格：${stylePreset}` : prompt;
        const resp = await llmService.generateResponse(withStyle);
        setAiExplanation(resp);
      }
      setCurrentStep(2);
      toast.success('AI创作完成！请选择一个方案进行编辑');
      if (engine === 'doubao') {
        try {
          const input = stylePreset ? `${prompt}；风格：${stylePreset}` : prompt;
          const r = await doubao.generateImage({ prompt: input, size: '1024x1024', n: Math.min(Math.max(generateCount, 1), 6), response_format: 'url', watermark: true })
          const list = (r as any)?.data?.data || []
          const urls = list.map((d: any) => {
            if (d?.url) return d.url
            if (d?.b64_json) return `data:image/png;base64,${d.b64_json}`
            return ''
          }).filter((u: string) => !!u)
          if (urls.length) {
            const mapped = urls.map((u: string, idx: number) => ({ id: idx + 1, thumbnail: u, score: 80 }))
            setGeneratedResults(mapped)
          } else {
            setGeneratedResults(aiGeneratedResults)
          }
        } catch {
          setGeneratedResults(aiGeneratedResults)
        }
      }
    } catch {
      toast.error('生成失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const applySelectedPatternEmbed = () => {
    const base = (prompt || '').trim();
    const pat = traditionalPatterns.find(p => p.id === selectedPatternId);
    const name = pat?.name || '传统纹样';
    const next = `${base}，嵌入${name}纹样元素，强调协调与文化表达`;
    setPrompt(next);
    toast.success('已嵌入纹样到提示词');
    if (selectedPatternId) {
      setRecentPatterns(prev => {
        const nextArr = [selectedPatternId!, ...prev.filter(x => x !== selectedPatternId)].slice(0, 5);
        try { localStorage.setItem('CREATE_RECENTS', JSON.stringify({ patterns: nextArr, filters: recentFilters })); } catch {}
        return nextArr;
      });
    }
    if (autoGenerate) {
      generateThreeVariantsWithDoubao();
    }
  };

  const applyFilterToPrompt = () => {
    const base = (prompt || '').trim();
    const next = `${base}；滤镜：${filterName}；强度：${filterIntensity}/10`;
    setPrompt(next);
    toast.success('已应用AI滤镜到提示词');
    setRecentFilters(prev => {
      const key = `${filterName}:${filterIntensity}`;
      const nextArr = [{ name: filterName, intensity: filterIntensity }, ...prev.filter(f => `${f.name}:${f.intensity}` !== key)].slice(0, 5);
      try { localStorage.setItem('CREATE_RECENTS', JSON.stringify({ patterns: recentPatterns, filters: nextArr })); } catch {}
      return nextArr;
    });
    if (autoGenerate) {
      generateThreeVariantsWithDoubao();
    }
  };

  const renderToolSettingsPanel = () => {
    if (activeTool === 'sketch') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">一键设计</div>
          <div className="text-xs mb-3 text-gray-600 dark:text-gray-300">输入提示后点击生成即可获得方案</div>
          <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full text-sm px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 min-h-[44px]">立即生成</button>
        </div>
      );
    }
    if (activeTool === 'pattern') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">纹样嵌入</div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-600 dark:text-gray-300">应用后自动生成</span>
            <button onClick={() => setAutoGenerate(v => !v)} className={`${autoGenerate ? 'bg-green-600' : 'bg-gray-400'} text-white px-2 py-0.5 rounded-full`}>{autoGenerate ? '开启' : '关闭'}</button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {traditionalPatterns.slice(0,6).map(p => (
              <button key={p.id} onClick={() => setSelectedPatternId(p.id)} className={`rounded-lg overflow-hidden border ${selectedPatternId===p.id? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}>
                <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <button onClick={applySelectedPatternEmbed} disabled={!selectedPatternId} className="w-full text-sm px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">嵌入到提示词</button>
        </div>
      );
    }
    if (activeTool === 'filter') {
      const options = ['复古胶片','国画质感','霓虹赛博','黑白素描','水彩晕染'];
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">AI滤镜</div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-600 dark:text-gray-300">应用后自动生成</span>
            <button onClick={() => setAutoGenerate(v => !v)} className={`${autoGenerate ? 'bg-green-600' : 'bg-gray-400'} text-white px-2 py-0.5 rounded-full`}>{autoGenerate ? '开启' : '关闭'}</button>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <select value={filterName} onChange={(e) => setFilterName(e.target.value)} className="text-xs px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
              {options.map(o => (<option key={o} value={o}>{o}</option>))}
            </select>
            <input type="range" min={1} max={10} value={filterIntensity} onChange={(e) => setFilterIntensity(parseInt(e.target.value))} className="flex-1" />
            <span className="text-xs">{filterIntensity}/10</span>
          </div>
          <button onClick={applyFilterToPrompt} className="w-full text-sm px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">应用到提示词</button>
        </div>
      );
    }
    if (activeTool === 'trace') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">文化溯源</div>
          <div className="text-xs mb-3 text-gray-600 dark:text-gray-300">生成文化元素说明并在右侧显示</div>
          <button onClick={analyzeCulturalElements} className="w-full text-sm px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">生成说明</button>
        </div>
      );
    }
    if (activeTool === 'remix') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">风格重混</div>
          <textarea value={promptB} onChange={(e)=>setPromptB(e.target.value)} placeholder="输入第二提示词" className="w-full p-2 rounded-lg h-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 mb-3"></textarea>
          <button onClick={handleFusionGenerate} disabled={isFusing} className="w-full text-sm px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white disabled:opacity-50">混合生成</button>
        </div>
      );
    }
    if (activeTool === 'layout') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">版式生成</div>
          <button onClick={applyLayoutGuide} className="w-full text-sm px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">生成版式建议</button>
        </div>
      );
    }
    if (activeTool === 'mockup') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">Mockup预览</div>
          <button onClick={openMockupPreview} className="w-full text-sm px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">应用预览效果</button>
        </div>
      );
    }
    if (activeTool === 'tile') {
      return (
        <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
          <div className="font-medium mb-2">图案平铺</div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-600 dark:text-gray-300">切换后自动生成</span>
            <button onClick={() => setAutoGenerate(v => !v)} className={`${autoGenerate ? 'bg-green-600' : 'bg-gray-400'} text-white px-2 py-0.5 rounded-full`}>{autoGenerate ? '开启' : '关闭'}</button>
          </div>
          <button onClick={applyTilePattern} className="w-full text-sm px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">切换为平铺风格</button>
        </div>
      );
    }
    return null;
  };

  // 中文注释：调用大模型对用户输入的创作提示进行润色与结构化
  const handlePolishPrompt = async () => {
    if (!prompt.trim()) {
      toast.error('请输入创作提示');
      return;
    }
    setIsPolishing(true);
    try {
      // 中文注释：构造清晰的润色指令，强调保持原意与中文输出
      const instruction = `请将下面的创作提示优化为更清晰的中文指令，保留原意，突出关键元素（主题、风格、色彩、素材）。用1-3个短句表达，避免礼貌语或解释，只输出优化后的文本：\n\n${prompt}`;
      const result = await llmService.generateResponse(instruction);
      const polished = String(result || '').trim();
      if (polished) {
        setPrompt(polished);
        toast.success('润色完成');
      } else {
        toast.warning('未获得有效润色结果');
      }
    } catch (e) {
      toast.error('润色失败，请稍后重试');
    } finally {
      setIsPolishing(false);
    }
  };

  // 中文注释：随机灵感，一键填充一个模板提示以快速开局
  const handleRandomInspiration = () => {
    try {
      const pool = promptTemplates || [];
      if (!pool.length) {
        toast.info('暂未找到模板');
        return;
      }
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setPrompt(pick.text);
      toast.success('已填充随机灵感模板');
    } catch {
      toast.error('随机灵感失败');
    }
  };
  
  const handleSelectResult = (id: number) => {
    setSelectedResult(id);
    setCurrentStep(3);
  };

  // 中文注释：点击预览图时，使用当前提示词调用豆包重新生成，并替换选中方案的缩略图
  const regenerateSelectedWithDoubao = async () => {
    if (!selectedResult) {
      toast.error('请先在上一步选择一个方案');
      return;
    }
    const input = (prompt || '天津文化设计灵感').trim();
    setIsRegenerating(true);
    try {
      const r = await doubao.generateImage({ prompt: input, size: '1024x1024', n: 1, response_format: 'url', watermark: true })
      const list = (r as any)?.data?.data || []
      const url = list[0]?.url || (list[0]?.b64_json ? `data:image/png;base64,${list[0].b64_json}` : '')
      if (url) {
        setGeneratedResults(prev => prev.map(item => item.id === selectedResult ? { ...item, thumbnail: url } : item))
        toast.success('豆包已重新生成并更新预览')
      } else {
        toast.info('豆包未返回图片，保持原图不变')
      }
    } catch (e) {
      toast.error('豆包生成失败，请稍后重试')
    } finally {
      setIsRegenerating(false)
    }
  }

  // 中文注释：像生成引擎一样调用豆包，生成3张图片方案并替换当前方案列表
  const generateThreeVariantsWithDoubao = async () => {
    const inputBase = (prompt || '天津文化设计灵感').trim();
    const input = stylePreset ? `${inputBase}；风格：${stylePreset}` : inputBase;
    setIsEngineGenerating(true);
    try {
      const r = await doubao.generateImage({ prompt: input, size: '1024x1024', n: Math.min(Math.max(generateCount, 1), 6), response_format: 'url', watermark: true })
      const list = (r as any)?.data?.data || []
      const urls = list.map((d: any) => {
        if (d?.url) return d.url
        if (d?.b64_json) return `data:image/png;base64,${d.b64_json}`
        return ''
      }).filter((u: string) => !!u)
      if (urls.length) {
        const mapped = urls.map((u: string, idx: number) => ({ id: idx + 1, thumbnail: u, score: 80 }))
        setGeneratedResults(mapped)
        setSelectedResult(mapped[0]?.id ?? null)
        setCurrentStep(2)
        toast.success(`豆包已生成${urls.length}张方案`)
      } else {
        // 中文注释：豆包未返回内容时，回退占位图，保证界面可用
        const fallback = [
          { id: 1, thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20design%20A', score: 80 },
          { id: 2, thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20design%20B', score: 80 },
          { id: 3, thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20design%20C', score: 80 }
        ]
        setGeneratedResults(fallback)
        setSelectedResult(1)
        setCurrentStep(2)
        toast.info('豆包未返回图片，已提供占位图')
      }
    } catch (e) {
      toast.error('豆包生成失败，已保留现有方案')
    } finally {
      setIsEngineGenerating(false)
    }
  }

  // 中文注释：融合玩法——将两个提示词混合，输出一个更具创意的合成提示
  const handleFusionGenerate = async () => {
    const a = (prompt || '').trim();
    const b = (promptB || '').trim();
    if (!a || !b) {
      toast.error('请填写两个提示词进行融合');
      return;
    }
    setIsFusing(true);
    try {
      const instruction = `请将以下两个中文提示融合为一个更具创意且结构清晰的中文指令：保留核心主题，强调风格与版式要点；输出2-3句精炼描述，无多余解释：\n\n提示A：${a}\n提示B：${b}`;
      const merged = String(await llmService.generateResponse(instruction) || '').trim();
      const finalPrompt = merged || `${a} 与 ${b} 的融合设计`;
      setPrompt(finalPrompt);
      setFusionMode(true);
      await generateThreeVariantsWithDoubao();
      toast.success('融合生成完成，已更新三张方案');
      setCurrentStep(2);
    } catch {
      toast.error('融合生成失败，请稍后重试');
    } finally {
      setIsFusing(false);
    }
  };

  // 中文注释：为选中方案生成一个快速变体（基于当前提示词）
  const generateVariantForSelected = async () => {
    if (!selectedResult) {
      toast.error('请先选择一个方案');
      return;
    }
    const base = (prompt || '天津文化设计灵感').trim();
    setIsRegenerating(true);
    try {
      const r = await doubao.generateImage({ prompt: `${base} 的创意变体`, size: '1024x1024', n: 1, response_format: 'url', watermark: true });
      const list = (r as any)?.data?.data || [];
      const url = list[0]?.url || (list[0]?.b64_json ? `data:image/png;base64,${list[0].b64_json}` : '');
      if (url) {
        setGeneratedResults(prev => prev.map(item => item.id === selectedResult ? { ...item, thumbnail: url } : item));
        toast.success('已生成变体并更新预览');
      } else {
        toast.info('未获取到变体图片');
      }
    } catch {
      toast.error('变体生成失败');
    } finally {
      setIsRegenerating(false);
    }
  };

  // 中文注释：收藏与取消收藏当前方案
  const toggleFavorite = (id: number) => {
    const item = generatedResults.find(r => r.id === id);
    if (!item) return;
    setFavorites(prev => {
      const exists = prev.some(f => f.id === id);
      if (exists) return prev.filter(f => f.id !== id);
      return [...prev, { id, thumbnail: item.thumbnail }];
    });
  };

  // 中文注释：下载当前选中图片到本地
  const downloadSelected = async () => {
    if (!selectedResult) { toast.error('请先选择一个方案'); return; }
    const url = generatedResults.find(r => r.id === selectedResult)?.thumbnail || '';
    if (!url) { toast.error('未找到图片'); return; }
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `design_${selectedResult}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('已开始下载');
    } catch {
      toast.error('下载失败');
    }
  };

  // 中文注释：复制当前图片链接到剪贴板
  const copySelectedLink = async () => {
    if (!selectedResult) { toast.error('请先选择一个方案'); return; }
    const url = generatedResults.find(r => r.id === selectedResult)?.thumbnail || '';
    try {
      await navigator.clipboard.writeText(url);
      toast.success('已复制图片链接');
    } catch {
      toast.error('复制失败');
    }
  };

  // 中文注释：为当前选中方案生成预览视频（基于豆包视频模型）
  const generateVideoForSelected = async () => {
    let sel = selectedResult;
    if (!sel) {
      const first = generatedResults[0]?.id;
      if (first) {
        setSelectedResult(first);
        sel = first;
      } else {
        toast.error('请先选择一个方案');
        return;
      }
    }
    const item = generatedResults.find(r => r.id === sel);
    const imgUrl = item?.thumbnail || '';
    if (!imgUrl) { toast.error('未找到图片'); return; }
    if (imgUrl.startsWith('data:')) {
      toast.error('首帧为本地数据，需使用可公网访问的图片URL');
      return;
    }
    const text = `${prompt}  --resolution 720p  --duration 5 --camerafixed false`;
    setVideoGenerating(true);
    // 中文注释：在生成过程中，为选中项标记状态
    setGeneratedResults(arr => arr.map(it => it.id === sel ? { ...it, video: '生成中...' } as any : it));
    try {
      const created = await createVideoTask({ model: 'doubao-seedance-1-0-pro-250528', content: [{ type: 'text', text }, { type: 'image_url', image_url: { url: imgUrl } }] });
      if (!created.ok || !created.data?.id) {
        const code = (created as any)?.error || (created as any)?.data?.error?.code || 'UNKNOWN'
        const msg = (created as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : `创建视频任务失败：${code}`
        toast.error(msg);
        setGeneratedResults(arr => arr.map(it => it.id === sel ? { ...it, video: `视频生成失败：${code}` } as any : it));
        setVideoGenerating(false);
        return;
      }
      const taskId = created.data.id;
      const polled = await pollVideoTask(taskId, { intervalMs: 10000, timeoutMs: 600000 });
      if (!polled.ok) {
        const code = (polled as any)?.error || (polled as any)?.data?.error?.code || 'UNKNOWN'
        const msg = (polled as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : `查询视频任务失败：${code}`
        toast.error(msg);
        setGeneratedResults(arr => arr.map(it => it.id === sel ? { ...it, video: `视频生成失败：${code}` } as any : it));
        setVideoGenerating(false);
        return;
      }
      const status = polled.data?.status;
      const url = polled.data?.content?.video_url || '';
      if (status === 'succeeded' && url) {
        setGeneratedResults(arr => arr.map(it => it.id === sel ? { ...it, video: url } as any : it));
        toast.success('视频生成完成');
      } else {
        const code = polled.data?.error?.code || polled.data?.error?.message || polled.data?.status || 'UNKNOWN'
        toast.error(`视频生成失败：${code}`);
        setGeneratedResults(arr => arr.map(it => it.id === sel ? { ...it, video: `视频生成失败：${code}` } as any : it));
      }
    } catch (e) {
      toast.error('视频生成异常');
      setGeneratedResults(arr => arr.map(it => it.id === sel ? { ...it, video: '视频生成失败' } as any : it));
    } finally {
      setVideoGenerating(false);
    }
  };

  // 中文注释：AI文化识别，生成简短说明并展示在文化信息卡片
  const analyzeCulturalElements = async () => {
    const base = (prompt || '中国传统文化元素').trim();
    try {
      const instruction = `请用中文概括该创作提示涉及的文化元素（最多60字，通俗易懂）：\n\n${base}`;
      const text = String(await llmService.generateResponse(instruction) || '').trim();
      if (text) setCulturalInfoText(text);
      setShowCulturalInfo(true);
      toast.success('文化识别完成');
    } catch {
      setShowCulturalInfo(true);
      toast.error('文化识别失败，已显示默认说明');
    }
  };

  const parseSections = (text: string) => {
    const lines = String(text || '').split(/\r?\n/)
    const sections: Array<{ title: string; items: string[] }> = []
    let current: { title: string; items: string[] } | null = null
    for (const raw of lines) {
      let line = raw.trim()
      line = line.replace(/^#{1,6}\s*/, '')
      line = line.replace(/^```+\s*/, '')
      line = line.replace(/^>+\s*/, '')
      if (!line) continue
      const m = line.match(/^(\d+)\)\s*(.+?)：/) || line.match(/^([一二三四五六七八九十]+)\)\s*(.+?)：/)
      if (m) {
        if (current) sections.push(current)
        current = { title: m[2], items: [] }
        continue
      }
      if (!current) {
        current = { title: '说明', items: [] }
      }
      const bullet = line.replace(/^[-•]\s*/, '')
      current.items.push(bullet)
    }
    if (current) sections.push(current)
    return sections
  }

  const renderRichText = (text: string) => {
    const getIconForTitle = (t: string) => {
      const s = t || ''
      if (s.includes('诊断')) return 'search'
      if (s.includes('优化')) return 'magic'
      if (s.includes('步骤')) return 'list-check'
      if (s.includes('参考') || s.includes('风格')) return 'book-open'
      return 'pen-nib'
    }
    const sections = parseSections(text)
    if (sections.length === 0) {
      return (
        <pre className={`${isDark ? 'bg-gray-800/80 text-gray-100 ring-1 ring-gray-700' : 'bg-white/80 text-gray-800 ring-1 ring-gray-200'} whitespace-pre-wrap break-words rounded-2xl p-5 leading-relaxed shadow-md backdrop-blur-sm border border-white/40 dark:border-gray-700/40`}>{text}</pre>
      )
    }
    return (
      <div className="grid gap-4 md:gap-6">
        {sections.map((sec, idx) => (
          <div
            key={idx}
            className={`${isDark ? 'bg-gray-900/50 ring-1 ring-gray-700' : 'bg-white/60 ring-1 ring-gray-200'} rounded-2xl p-5 shadow-lg backdrop-blur-sm border border-white/40 dark:border-gray-700/40`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <i className={`fas fa-${getIconForTitle(sec.title)} mr-2 text-blue-600`}></i>
                <div className="font-semibold tracking-wide">{sec.title}</div>
              </div>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500 mb-3 opacity-60" />
            <ul className="grid md:grid-cols-2 gap-x-6 gap-y-2">
              {sec.items.map((raw, i) => {
                const it = String(raw || '')
                const isSubHead = /^#{1,6}\s*\d+\)\s*/.test(it) || /^#{1,6}\s*[一二三四五六七八九十]+\)\s*/.test(it)
                const cleanHead = it.replace(/^#{1,6}\s*\d+\)\s*/, '').replace(/^#{1,6}\s*[一二三四五六七八九十]+\)\s*/, '')
                const boldMatch = it.match(/^\*\*(.+?)\*\*：?(.*)$/)
                const hasBold = !!boldMatch
                const boldLabel = hasBold ? (boldMatch?.[1] || '') : ''
                const boldText = hasBold ? (boldMatch?.[2] || '') : ''
                const colonMatch = !hasBold && !isSubHead ? it.match(/^([^：:]+)[:：]\s*(.+)$/) : null
                const enumMatch = !hasBold && !isSubHead ? it.match(/^(\d+|[一二三四五六七八九十]+)[\.、]\s*(.+)$/) : null
                return (
                  <li key={i} className={isSubHead ? 'md:col-span-2 flex items-center py-1' : 'flex items-start py-1'}>
                    {isSubHead ? (
                      <>
                        <i className="fas fa-angle-right mr-2 text-blue-600" />
                        <span className={`${isDark ? 'text-gray-100' : 'text-gray-800'} text-sm font-semibold tracking-wide`}>{cleanHead}</span>
                      </>
                    ) : hasBold ? (
                      <>
                        <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200 mr-2 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">{boldLabel}</span>
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm md:text-base leading-relaxed md:leading-7 break-words max-w-[68ch]`}>{boldText}</span>
                      </>
                    ) : colonMatch ? (
                      <>
                        <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200 mr-2 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">{colonMatch[1]}</span>
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm md:text-base leading-relaxed md:leading-7 break-words max-w-[68ch]`}>{colonMatch[2]}</span>
                      </>
                    ) : enumMatch ? (
                      <>
                        <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-300 mr-2 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600">{enumMatch[1]}</span>
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm md:text-base leading-relaxed md:leading-7 break-words max-w-[68ch]`}>{enumMatch[2]}</span>
                      </>
                    ) : (
                      <>
                        <span className="mt-1 mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                        <span className={`${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm md:text-base leading-relaxed md:leading-7 break-words max-w-[68ch]`}>{it}</span>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    )
  }
  
  const handleSaveDraft = () => {
    performSave('manual')
  };

  // 中文注释：生成版式建议，帮助在编辑页获得结构化指导
  const applyLayoutGuide = async () => {
    try {
      const base = (prompt || '品牌视觉设计').trim();
      const instruction = `请针对“${base}”给出中文版式建议：使用1)2)3)编号列出模块（标题、主视觉、卖点、配色、字体、留白），每条尽量短句。只输出建议。`;
      const guide = String(await llmService.generateResponse(instruction) || '').trim();
      setAiExplanation(guide);
      toast.success('已生成版式建议');
    } catch {
      toast.error('版式建议生成失败');
    }
  };

  // 中文注释：打开Mockup预览（模拟效果，小白可快速感知成品视觉）
  const openMockupPreview = () => {
    setFusionMode(true);
    toast.info('已应用 Mockup 预览效果（示意）');
  };

  // 中文注释：将当前主题调整为可平铺的图案风格
  const applyTilePattern = () => {
    const base = (prompt || '').trim();
    const next = `${base}，重复平铺的图案纹样，适用于包装/壁纸`;
    setPrompt(next);
    toast.success('已切换为图案平铺风格');
    if (autoGenerate) {
      generateThreeVariantsWithDoubao();
    }
  };
  
  const handlePublish = () => {
    // 执行AI预审
    if (isPrecheckEnabled) {
      performPrecheck();
    } else {
      // 跳过预审直接发布
      completePublish();
    }
  };
  
  const performPrecheck = () => {
    setPrecheckResult({ status: 'pending', issues: [] });
    setTimeout(() => {
      const issuesText = llmService.diagnoseCreationIssues((aiExplanation || prompt || '').slice(0, 1000));
      const issues: { type: 'copyright' | 'content'; severity: 'warning' | 'error'; message: string }[] =
        issuesText.map(t => ({ type: /版权/.test(t) ? 'copyright' : 'content', severity: 'warning', message: t }));
      if (issues.length === 0) {
        setPrecheckResult({ status: 'passed', issues: [] });
      } else {
        setPrecheckResult({ status: 'warning', issues });
      }
    }, 800);
  };
  
  const completePublish = () => {
    toast.success('作品发布成功！正在进行版权存证...');
    
    // 模拟版权存证过程
    setTimeout(() => {
      toast.success('版权存证完成！');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }, 1500);
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/dashboard');
    }
  };
  
  const handleConfirmPrecheck = () => {
    if (precheckResult?.status === 'warning') {
      // 如果有警告但用户确认继续发布
      completePublish();
    }
  };
  
  const toggleCulturalInfo = () => {
    setShowCulturalInfo(!showCulturalInfo);
  };
  
  // 骨架屏加载状态
  if (isLoading) {
    return (
      <SidebarLayout>
        {/* 导航栏 */}
        <nav className={`sticky top-0 z-50 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} px-4 py-3`}>
        <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-1">
              <span className="text-xl font-bold text-red-600">AI</span>
              <span className="text-xl font-bold">共创</span>
            </div>
          </div>
        </nav>
        
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* 面包屑骨架屏 */}
            <div className={`h-8 w-1/3 rounded ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}></div>
            
            {/* 步骤指示器骨架屏 */}
            <div className={`h-10 rounded ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}></div>
            
            {/* 主要内容骨架屏 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`col-span-1 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 animate-pulse`}>
                <div className="space-y-6">
                  <div className={`h-12 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'} animate-pulse`}></div>
                  <div className={`h-32 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'} animate-pulse`}></div>
                  <div className={`h-12 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'} animate-pulse`}></div>
                </div>
              </div>
              
              <div className={`col-span-2 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 animate-pulse`}>
                <div className="space-y-6">
                  <div className={`h-6 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'} animate-pulse w-1/4`}></div>
                  <div className={`h-40 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'} animate-pulse`}></div>
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className={`h-12 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'} animate-pulse`}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </SidebarLayout>
    );
  }
  
  return (
    <SidebarLayout>
      {/* 顶部导航 */}
      <header className={`sticky top-0 z-50 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} px-4 py-3`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <span className="text-xl font-bold text-red-600">AI</span>
            <span className="text-xl font-bold">共创</span>
          </div>
          
      <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm">生成引擎</span>
              <button onClick={() => setEngine('sdxl')} className={`px-3 py-1.5 rounded-full text-sm ${engine==='sdxl' ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}`}>SDXL</button>
              <button onClick={() => setEngine('doubao')} className={`px-3 py-1.5 rounded-full text-sm ${engine==='doubao' ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}`}>Doubao</button>
            </div>
            <button 
              onClick={() => setShowCollaborationPanel(true)}
              className={`px-4 py-2 rounded-full transition-colors ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              协作
            </button>
            <button 
              onClick={() => setShowModelSelector(true)}
              className={`px-4 py-2 rounded-full transition-colors ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              选择模型
            </button>
            <button 
              onClick={() => setShowAID点评(true)}
              className={`px-4 py-2 rounded-full transition-colors ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              AI点评
            </button>

            {/* 中文注释：自动保存设置（开关与间隔） */}
            <div className="hidden md:flex items-center gap-2">
              <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>自动保存</label>
              <button onClick={() => setAutosaveEnabled(v => !v)} className={`px-3 py-1.5 rounded-full text-sm ${autosaveEnabled ? 'bg-green-600 text-white' : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}`}>{autosaveEnabled ? '开启' : '关闭'}</button>
              <select value={autosaveIntervalSec} onChange={(e) => setAutosaveIntervalSec(parseInt(e.target.value) || 30)} className={`px-2 py-1.5 rounded-full text-sm ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                <option value={15}>15秒</option>
                <option value={30}>30秒</option>
                <option value={60}>60秒</option>
              </select>
            </div>

            <button 
              onClick={handleSaveDraft}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} text-sm`}
            >
              保存
            </button>
            <button 
              onClick={handlePublish}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-colors ${fusionMode ? 'bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} text-sm`}
              disabled={currentStep < 3}
            >
              发布
            </button>
          </div>
        </div>
        <div className="container mx-auto mt-3 hidden">
          <div className="space-y-3" ref={quickActionsRef}>
            {/* 中文注释：顶部分为两列布局，左历史记录、右AI引擎 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} p-3 rounded-xl`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center"><i className="far fa-clock mr-2"></i>历史记录</h3>
                  <button onClick={handleSaveDraft} className={`${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} text-xs px-3 py-1 rounded-full hover:opacity-90`}>保存草稿</button>
                </div>
                <div className="text-sm opacity-80">
                  {lastUpdatedAt ? (
                    <>
                      <div>最近草稿时间：{new Date(lastUpdatedAt).toLocaleString()}</div>
                      <div className="mt-1">提示摘要：{(prompt || '').slice(0, 24) || '（无）'}</div>
                    </>
                  ) : (
                    <div>暂无创作历史</div>
                  )}
                </div>
              </div>
              <div className={`${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} p-3 rounded-xl`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center"><i className="fas fa-microchip mr-2"></i>AI生成引擎</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/generate?prompt=${encodeURIComponent(prompt || '')}`)}
                      className={`${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} text-xs px-3 py-1 rounded-full hover:opacity-90`}
                    >
                      前往生成引擎
                    </button>
                  </div>
                </div>
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-xs`}>文案优化、朗读与图片问答</div>
              </div>
            </div>
            <div className={`${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} p-3 rounded-2xl shadow-sm`}>
              <div className="mb-2 px-1 flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-xs font-medium`}>更多玩法</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <button onClick={() => { handleFusionGenerate(); }} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-2 rounded-xl text-sm flex items-center transition-colors transform hover:scale-105`}><i className="fas fa-random mr-2"></i>风格重混</button>
                <button onClick={() => { applyLayoutGuide(); }} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-2 rounded-xl text-sm flex items中心 transition-colors transform hover:scale-105`}><i className="fas fa-th-large mr-2"></i>版式生成</button>
                <button onClick={() => { openMockupPreview(); }} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-2 rounded-xl text-sm flex items-center transition-colors transform hover:scale-105`}><i className="fas fa-box-open mr-2"></i>Mockup预览</button>
                <button onClick={() => { applyTilePattern(); }} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-2 rounded-xl text-sm flex items-center transition-colors transform hover:scale-105`}><i className="fas fa-border-all mr-2"></i>图案平铺</button>
                <button onClick={() => { handleRandomInspiration(); }} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-2 rounded-xl text-sm flex items-center transition-colors transform hover:scale-105`}><i className="fas fa-lightbulb mr-2"></i>随机灵感</button>
                <button onClick={() => { analyzeCulturalElements(); }} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-2 rounded-xl text-sm flex items-center transition-colors transform hover:scale-105`}><i className="fas fa-book-open mr-2"></i>AI文化识别</button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* 主内容 */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* 中文注释：将顶部平面面板移入主内容，避免被全局粘性头部遮挡 */}
        <div className="space-y-3" ref={quickActionsRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={`${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} p-3 rounded-xl`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium flex items-center"><i className="far fa-clock mr-2"></i>历史记录</h3>
                <button onClick={handleSaveDraft} className={`${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} text-xs px-3 py-1 rounded-full hover:opacity-90`}>保存草稿</button>
              </div>
              <div className="text-sm opacity-80">
                {lastUpdatedAt ? (
                  <>
                    <div>最近草稿时间：{new Date(lastUpdatedAt).toLocaleString()}</div>
                    <div className="mt-1">提示摘要：{(prompt || '').slice(0, 24) || '（无）'}</div>
                  </>
                ) : (
                  <div>暂无创作历史</div>
                )}
              </div>
            </div>
            <div className={`${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} p-3 rounded-xl`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium flex items-center"><i className="fas fa-microchip mr-2"></i>AI生成引擎</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/generate?prompt=${encodeURIComponent(prompt || '')}`)}
                    className={`${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} text-xs px-3 py-1 rounded-full hover:opacity-90`}
                  >
                    前往生成引擎
                  </button>
                </div>
              </div>
              <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-xs`}>文案优化、朗读与图片问答</div>
            </div>
          </div>
          <div className={`${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} p-3 rounded-2xl shadow-sm`}>
            <div className="mb-2 px-1 flex items-center justify-between">
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-xs font-medium`}>更多玩法</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <button onClick={() => { handleFusionGenerate(); }} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-2 rounded-xl text-sm flex items-center transition-colors transform hover:scale-105`}><i className="fas fa-random mr-2"></i>风格重混</button>
              <button onClick={() => { applyLayoutGuide(); }} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-2 rounded-xl text-sm flex items-center transition-colors transform hover:scale-105`}><i className="fas fa-th-large mr-2"></i>版式生成</button>
              <button onClick={() => { openMockupPreview(); }} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-2 rounded-xl text-sm flex items-center transition-colors transform hover:scale-105`}><i className="fas fa-box-open mr-2"></i>Mockup预览</button>
              <button onClick={() => { applyTilePattern(); }} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-2 rounded-xl text-sm flex items-center transition-colors transform hover:scale-105`}><i className="fas fa-border-all mr-2"></i>图案平铺</button>
              <button onClick={() => { handleRandomInspiration(); }} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-2 rounded-xl text-sm flex items-center transition-colors transform hover:scale-105`}><i className="fas fa-lightbulb mr-2"></i>随机灵感</button>
              <button onClick={() => { analyzeCulturalElements(); }} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-2 rounded-xl text-sm flex items-center transition-colors transform hover:scale-105`}><i className="fas fa-book-open mr-2"></i>AI文化识别</button>
            </div>
          </div>
        </div>
        {/* 面包屑导航 */}
        <div className="mb-6">
          <nav className="flex items-center text-sm" aria-label="面包屑">
            <a href="/dashboard" className="hover:text-red-600 transition-colors">首页</a>
            <i className="fas fa-chevron-right text-xs mx-2 opacity-50"></i>
            <a href="#" className="hover:text-red-600 transition-colors">创作中心</a>
            <i className="fas fa-chevron-right text-xs mx-2 opacity-50"></i>
            <span className="opacity-70">AI创作</span>
          </nav>
        </div>
        
        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                    step < currentStep 
                      ? 'bg-green-500 text-white' 
                      : step === currentStep 
                        ? 'bg-red-600 text-white scale-110 shadow-md' 
                        : isDark 
                          ? 'bg-gray-700 text-gray-400' 
                          : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step < currentStep ? (
                    <i className="fas fa-check"></i>
                  ) : (
                    step
                  )}
                </div>
                <span 
                  className={`text-xs ${
                    step === currentStep 
                      ? 'font-medium' 
                      : isDark 
                        ? 'text-gray-400' 
                        : 'text-gray-500'
                  }`}
                >
                  {step === 1 && '输入提示词'}
                  {step === 2 && '选择方案'}
                  {step === 3 && '编辑优化'}
                </span>
              </div>
            ))}
          </div>
          
          {/* 进度条 */}
          <div className="relative h-1 mt-2">
            <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <div 
              className={`absolute left-0 top-0 h-full rounded-full transition-all ${fusionMode ? 'bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600' : 'bg-red-600'}`}
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
              role="progressbar"
              aria-label="创作进度"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(((currentStep - 1) / 2) * 100)}
            ></div>
          </div>
        </div>
        
        {/* 顶部策展工具栏 */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <motion.button type="button" whileHover={{ scale: 1.03 }} onClick={() => setFusionMode(v => !v)} className={`px-3 py-1.5 rounded-lg ${fusionMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : (isDark ? 'bg-gray-800 text-white hover:bg-gray-700 ring-1 ring-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50 ring-1 ring-gray-200')} focus:outline-none focus:ring-2 ${fusionMode ? 'focus:ring-indigo-500' : (isDark ? 'focus:ring-gray-600' : 'focus:ring-gray-300')} focus:ring-offset-2`}>{fusionMode ? '融合模式：开' : '融合模式：关'}</motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: generatingPlan ? 1.0 : 1.03 }}
            onClick={handleGenerateCurationPlan}
            disabled={generatingPlan}
            className={`px-3 py-1.5 rounded-lg ${generatingPlan ? 'opacity-70 cursor-not-allowed' : ''} ${isDark ? 'bg-purple-700 text-white hover:bg-purple-600' : 'bg-purple-600 text-white hover:bg-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
          >
            {generatingPlan ? '生成策展中…' : 'AI智能策展'}
          </motion.button>
          <select
            value={curationTemplate}
            onChange={(e) => setCurationTemplate(e.target.value)}
            className={`px-2 py-1.5 rounded-lg text-sm ${isDark ? 'bg-gray-800 text-white ring-1 ring-gray-700' : 'bg-white text-gray-900 ring-1 ring-gray-200'}`}
          >
            {Object.keys(allTemplateGuides).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowTemplateEditor(v => !v)}
            className={`${isDark ? 'bg-gray-800 text-white ring-1 ring-gray-700' : 'bg-white text-gray-900 ring-1 ring-gray-200'} px-3 py-1.5 rounded-lg text-sm`}
          >{showTemplateEditor ? '收起模板管理' : '自定义模板'}</button>
          {genError && (
            <span className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>{genError}</span>
          )}
        </div>

        {/* 顶部：模板管理与提示词预览 */}
        {showTemplateEditor && (
          <div className={`${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} rounded-2xl p-4 shadow-sm mb-4`}>
            <div className="font-medium mb-2">新增模板</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <input value={newTemplateName} onChange={e=>setNewTemplateName(e.target.value)} placeholder="模板名称（如：品牌活动方案）" className={`${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg`} />
              <input value={newTemplateGuide} onChange={e=>setNewTemplateGuide(e.target.value)} placeholder="模板指引（如：结构要点）" className={`${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg md:col-span-2`} />
            </div>
            <div className="flex gap-2 mb-4">
              <button
                className="px-3 py-1.5 rounded bg-purple-600 text-white"
                onClick={() => { const name = newTemplateName.trim(); const guide = newTemplateGuide.trim(); if (!name || !guide) return; setCustomTemplates(prev => ({ ...prev, [name]: guide })); setNewTemplateName(''); setNewTemplateGuide(''); }}
              >添加模板</button>
              <button
                className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-3 py-1.5 rounded`}
                onClick={() => { setNewTemplateName(''); setNewTemplateGuide(''); }}
              >清空</button>
            </div>
            <div className="font-medium mb-2">我的模板</div>
            <ul className="space-y-2">
              {Object.keys(customTemplates).length === 0 ? (
                <li className="text-sm opacity-60">暂无自定义模板</li>
              ) : (
                Object.entries(customTemplates).map(([name, guide]) => (
                  <li key={name} className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded p-2 text-xs`}>
                    <div className="font-medium mb-1">{name}</div>
                    <div className="opacity-80 mb-2">{guide}</div>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 rounded bg-blue-600 text-white" onClick={() => setCurationTemplate(name)}>设为当前</button>
                      <button className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-2 py-1 rounded`} onClick={async () => { try { await navigator.clipboard.writeText(guide); } catch {} }}>复制指引</button>
                      <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={() => setCustomTemplates(prev => { const next = { ...prev }; delete next[name]; return next; })}>删除</button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
        <motion.div
          className={`${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} rounded-2xl p-4 shadow-sm mb-6`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">提示词预览</div>
            <button
              onClick={async () => { try { await navigator.clipboard.writeText(curationPromptPreview); } catch {} }}
              className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-2 py-1 rounded text-xs`}
            >复制提示词</button>
          </div>
          <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-3 text-xs whitespace-pre-wrap`}>{curationPromptPreview}</div>
        </motion.div>

        {/* 创作工具区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧控制面板 */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-md lg:sticky lg:top-6`}>
            {/* 工具选择 */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4">创作工具</h3>
              <div className="grid grid-cols-2 gap-3" role="group" aria-label="创作工具">
                {toolOptions.map((tool, idx) => (
                  <motion.button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`p-3 rounded-xl flex flex-col items-center transition-all ${
                      activeTool === tool.id 
                        ? 'bg-red-50 text-red-600 border-red-200 border' 
                        : isDark 
                          ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    } focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    aria-pressed={activeTool === tool.id}
                    aria-label={tool.name}
                    tabIndex={0}
                    ref={(el) => { toolRefs.current[idx] = el; }}
                    onKeyDown={(e) => {
                      const cols = 2;
                      const i = idx;
                      if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        const ni = Math.min(i + 1, toolOptions.length - 1);
                        const next = toolOptions[ni];
                        if (next) {
                          handleToolSelect(next.id);
                          toolRefs.current[ni]?.focus();
                        }
                      } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        const ni = Math.max(i - 1, 0);
                        const next = toolOptions[ni];
                        if (next) {
                          handleToolSelect(next.id);
                          toolRefs.current[ni]?.focus();
                        }
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const ni = Math.min(i + cols, toolOptions.length - 1);
                        const next = toolOptions[ni];
                        if (next) {
                          handleToolSelect(next.id);
                          toolRefs.current[ni]?.focus();
                        }
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const ni = Math.max(i - cols, 0);
                        const next = toolOptions[ni];
                        if (next) {
                          handleToolSelect(next.id);
                          toolRefs.current[ni]?.focus();
                        }
                      }
                    }}
                  >
                    <i className={`fas fa-${tool.icon} text-xl mb-2`}></i>
                    <span className="text-sm font-medium">{tool.name}</span>
                  </motion.button>
                ))}
              </div>
          </div>
          {renderToolSettingsPanel()}
            
            {/* 提示词输入 */}
            <div className="mb-6">
          {/* 中文注释：标题与AI润色操作区域 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">创作提示</h3>
            <button
              onClick={handlePolishPrompt}
              disabled={isPolishing || !prompt.trim()}
              className={`text-sm px-3 py-1 rounded-full flex items-center transition-colors ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              } ${isPolishing ? 'opacity-70 cursor-not-allowed' : ''}`}
              aria-label="智能润色创作提示"
            >
              {isPolishing ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1"></i>
                  智能润色中...
                </>
              ) : (
                <>
                  <i className="fas fa-pen-fancy mr-1"></i>
                  智能润色
                </>
              )}
            </button>
            <button
              onClick={handleRandomInspiration}
              className={`text-sm px-3 py-1 rounded-full ml-2 ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <i className="fas fa-lightbulb mr-1"></i>
              随机灵感
            </button>
          </div>
          {/* 中文注释：风格预设与批量生成控制 */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <span className="text-xs mr-2">风格预设</span>
              <select
                value={stylePreset}
                onChange={(e) => setStylePreset(e.target.value)}
                className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-100 text-gray-900 border border-gray-200'}`}
                aria-label="风格预设"
              >
                <option value="">无</option>
                <option value="国潮">国潮</option>
                <option value="极简">极简</option>
                <option value="复古">复古</option>
                <option value="教育科普">教育科普</option>
              </select>
            </div>
            <div className="flex items-center justify-end">
              <span className="text-xs mr-2">批量生成</span>
              <input
                type="number"
                min={1}
                max={6}
                value={generateCount}
                onChange={(e) => setGenerateCount(Math.min(Math.max(parseInt(e.target.value || '3'), 1), 6))}
                className={`w-16 text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-100 text-gray-900 border border-gray-200'}`}
                aria-label="批量生成数量"
              />
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述您想要创作的内容，例如：具有中国传统元素的现代包装设计..."
            className={`w-full p-3 rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 border' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border'
            }`}
            aria-label="创作提示"
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="send"
          ></textarea>
          <div className="mt-3 flex flex-wrap gap-2">
            {promptTemplates.map((t) => (
              <motion.button
                key={t.id}
                onClick={() => setPrompt(t.text)}
                className={`text-xs px-3 py-1 rounded-full ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`填充模板：${t.name}`}
              >
                {t.name}
              </motion.button>
            ))}
          </div>
          
          
          {(recentPatterns.length > 0 || recentFilters.length > 0) && (
            <div className="mt-3">
              <div className="text-sm font-medium mb-2">最近使用</div>
              {recentPatterns.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs mb-1">纹样</div>
                  <div className="flex flex-wrap gap-2">
                    {recentPatterns.map((pid, i) => {
                      const pat = traditionalPatterns.find(p => p.id === pid);
                      const label = pat?.name || `纹样${pid}`;
                      return (
                        <button key={`${pid}-${i}`} onClick={() => { setSelectedPatternId(pid); applySelectedPatternEmbed(); }} className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {recentFilters.length > 0 && (
                <div>
                  <div className="text-xs mb-1">滤镜</div>
                  <div className="flex flex-wrap gap-2">
                    {recentFilters.map((f, i) => (
                      <button key={`${f.name}-${f.intensity}-${i}`} onClick={() => { setFilterName(f.name); setFilterIntensity(f.intensity); applyFilterToPrompt(); }} className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        {f.name} {f.intensity}/10
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* 中文注释：融合玩法面板仅在选择“风格重混”工具时显示 */}
          {activeTool === 'remix' && (
          <div className={`mt-4 p-3 rounded-xl ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <i className="fas fa-flask mr-2"></i>
                <span className="text-sm font-medium">融合玩法</span>
              </div>
              <button
                onClick={() => setFusionMode(f => !f)}
                className={`text-xs px-2 py-1 rounded-full ${fusionMode ? 'bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white' : (isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800')}`}
              >
                {fusionMode ? '已启用' : '未启用'}
              </button>
            </div>
            <textarea
              value={promptB}
              onChange={(e) => setPromptB(e.target.value)}
              placeholder="输入第二提示词，例如：东方美学配色与极简版式..."
              className={`w-full p-2 rounded-lg h-20 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-colors ${
                isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 border' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 border'
              }`}
            ></textarea>
            <div className="mt-2">
              <button
                onClick={handleFusionGenerate}
                disabled={isFusing}
                className={`w-full text-sm px-3 py-2 rounded-lg ${isFusing ? 'opacity-60 cursor-not-allowed' : ''} ${fusionMode ? 'bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {isFusing ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                    混合生成中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-bezier-curve mr-1"></i>
                    混合生成（三张）
                  </>
                )}
              </button>
          </div>
        </div>
        )}
        
        
            {activeTool === 'sketch' && (
              <div className="mt-4">
                <button 
                  onClick={handleGenerate}
                    disabled={isGenerating || currentStep > 1 || !prompt.trim()}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
                  >
                    {isGenerating ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        正在生成...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic mr-2"></i>
                        生成设计
                      </>
                    )}
                  </button>
                </div>
            )}
            </div>
          </div>
          
          {/* 右侧预览和编辑区 */}
          <div className={`lg:col-span-2 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-md`}>
            {/* 文化信息提示 */}
            {showCulturalInfo && (
              <motion.div 
                className={`mb-6 p-4 rounded-xl border ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-yellow-50 border-yellow-200'
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mr-3 flex-shrink-0">
                      <i className="fas fa-info"></i>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">文化元素：云纹</h4>
                      <p className="text-sm opacity-80">
                        {culturalInfoText}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleCulturalInfo}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </motion.div>
            )}
            
            {/* 步骤1：输入提示词 */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-12"
              >
                <div className="mb-6 text-6xl text-red-600">
                  <i className="fas fa-magic"></i>
                </div>
                <h2 className="text-2xl font-bold mb-4">开始您的AI创作之旅</h2>
                <p className="opacity-80 max-w-lg mx-auto mb-8">
                  在左侧输入创作提示，AI将根据您的描述生成独特的设计作品。
                  您可以添加传统元素、指定风格，让AI为您带来无限创意。
                </p>
                <img 
                  src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=AI%20design%20workflow%20illustration%2C%20creative%20process%20concept" 
                  alt="AI创作流程" 
                  className="rounded-xl mx-auto max-w-full h-auto"
                  loading="lazy" decoding="async"
                />
              </motion.div>
            )}
            
            {/* 步骤2：选择方案 */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {aiExplanation && !explainCollapsed && (
                  <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className="font-medium mb-2">AI生成说明</h3>
                    <div className={`text-sm`}>{renderRichText(aiExplanation)}</div>
                  </div>
                )}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">选择您喜欢的设计方案</h2>
                  {aiExplanation && (
                    <button
                      onClick={() => setExplainCollapsed(e => !e)}
                      className={`text-sm px-3 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      {explainCollapsed ? '展开说明' : '收起说明'}
                    </button>
                  )}
                </div>
                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {generatedResults.map((result, idx) => (
                      <motion.div
                        key={result.id}
                        role="radio"
                        aria-checked={selectedResult === result.id}
                        className={`text-left rounded-xl overflow-hidden border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                          selectedResult === result.id 
                            ? 'border-red-600 shadow-lg bg-red-50' 
                            : isDark 
                              ? 'border-gray-700' 
                              : 'border-gray-200'
                        }`}
                        whileHover={{ y: -5 }}
                        onClick={() => handleSelectResult(result.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectResult(result.id);
                          return;
                        }
                        const cols = 2;
                        if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          const ni = Math.min(idx + 1, generatedResults.length - 1);
                          const nid = generatedResults[ni]?.id;
                          if (nid) setSelectedResult(nid);
                          return;
                        }
                        if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          const ni = Math.max(idx - 1, 0);
                          const nid = generatedResults[ni]?.id;
                          if (nid) setSelectedResult(nid);
                          return;
                        }
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          const ni = Math.min(idx + cols, generatedResults.length - 1);
                          const nid = generatedResults[ni]?.id;
                          if (nid) setSelectedResult(nid);
                          return;
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          const ni = Math.max(idx - cols, 0);
                          const nid = generatedResults[ni]?.id;
                          if (nid) setSelectedResult(nid);
                          return;
                        }
                      }}
                      tabIndex={0}
                    >
                      <div className="relative">
                        <TianjinImage
                          src={result.thumbnail}
                          alt={`AI生成方案 ${result.id}`}
                          ratio="landscape"
                          rounded="xl"
                        />
                        <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                          匹配度 {result.score}%
                        </div
                        >
                        <button
                          className="absolute top-3 left-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(result.id); }}
                        >
                          {favorites.some(f => f.id === result.id) ? '已收藏' : '收藏'}
                        </button>
                        {selectedResult === result.id && (
                          <div className="absolute bottom-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <i className="fas fa-check-circle mr-1"></i>
                            已选择
                          </div>
                        )}
                      </div>
                      
                      <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">AI生成方案 {result.id}</h3>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCulturalInfo();
                            }}
                            className="text-sm text-red-600 hover:underline"
                          >
                            查看文化元素
                          </button>
                        </div>
                      </div>
                      {selectedResult === result.id && (
                        <span className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-red-600 text-white">已选择</span>
                      )}
                    </motion.div>
                  ))}
                </div>
                {selectedResult && (
                  <div className="mt-4 text-sm">
                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>当前已选择：方案 {selectedResult}</span>
                  </div>
                )}
                {favorites.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">我的收藏</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {favorites.map(f => (
                        <div key={f.id} className="relative">
                          <img src={f.thumbnail} alt={`收藏 ${f.id}`} className="w-full h-full object-cover rounded-lg" />
                          <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-800/70 text-gray-200' : 'bg-white/80 text-gray-700'}`}>方案 {f.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex flex-wrap justify-between gap-3">
                  <button 
                    onClick={handleBack}
                    className={`px-4 py-2 rounded-full transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} text-sm flex-1 md:flex-none`}
                  >
                    返回
                  </button>
                  <button 
                    onClick={analyzeCulturalElements}
                    className={`px-4 py-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} transition-colors text-sm flex-1 md:flex-none`}
                  >
                    AI文化识别
                  </button>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm flex-1 md:flex-none"
                  >
                    {isGenerating ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-1"></i>
                        重新生成
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sync-alt mr-1"></i>
                        重新生成
                      </>
                    )}
                  </button>
                  <button
                    onClick={generateVariantForSelected}
                    className={`px-4 py-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} transition-colors text-sm flex-1 md:flex-none`}
                  >
                    <i className="fas fa-clone mr-1"></i>
                    生成变体
                  </button>
                </div>
              </motion.div>
            )}
            
            {/* 步骤3：编辑优化 */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-xl font-bold mb-6">编辑您的设计作品</h2>
                {aiExplanation && (
                  <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className="font-medium mb-2">AI生成说明</h3>
                    <div className={`text-sm`}>{renderRichText(aiExplanation)}</div>
                  </div>
                )}
                
                {/* 预览区 */}
                <div className="mb-6">
                <div 
                  className={`relative rounded-xl overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}
                  role="button"
                  tabIndex={0}
                  aria-label="编辑预览"
                  onClick={() => { setActiveEditTool('resize'); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveEditTool('resize'); } }}
                >
                  {selectedResult ? (
                      <div className="relative w-full" style={{ transform: `scale(${scale})`, filter: filterCss }}>
                        <TianjinImage 
                          src={generatedResults.find(r => r.id === selectedResult)?.thumbnail || ''}
                          alt="选中的设计方案" 
                          ratio="square" 
                          rounded="xl" 
                          fit="contain"
                          onClick={regenerateSelectedWithDoubao}
                          className="cursor-pointer"
                        />
                        {overlayText && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span style={{ fontSize: `${overlaySize}px`, color: overlayColor }} className="font-semibold drop-shadow">
                              {overlayText}
                            </span>
                          </div>
                        )}
                        {showQuickActions && (
                          <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-2 items-center justify-center">
                            <button type="button" onClick={generateThreeVariantsWithDoubao} disabled={isEngineGenerating} className={`px-2.5 py-1.5 rounded-md text-xs ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white ring-1 ring-gray-700' : 'bg-white/90 hover:bg-white text-gray-900 ring-1 ring-gray-200'} ${isEngineGenerating ? 'opacity-60 cursor-not-allowed' : ''}`}>
                              {isEngineGenerating ? '生成中…' : '一键生成(3)'}
                            </button>
                            <button type="button" onClick={regenerateSelectedWithDoubao} className={`px-2.5 py-1.5 rounded-md text-xs ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white ring-1 ring-gray-700' : 'bg-white/90 hover:bg-white text-gray-900 ring-1 ring-gray-200'}`}>重新生成</button>
                            <button type="button" onClick={downloadSelected} className={`px-2.5 py-1.5 rounded-md text-xs ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white ring-1 ring-gray-700' : 'bg-white/90 hover:bg-white text-gray-900 ring-1 ring-gray-200'}`}>下载图片</button>
                            <button type="button" onClick={copySelectedLink} className={`px-2.5 py-1.5 rounded-md text-xs ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white ring-1 ring-gray-700' : 'bg-white/90 hover:bg-white text-gray-900 ring-1 ring-gray-200'}`}>复制链接</button>
                            <button type="button" onClick={generateVideoForSelected} disabled={videoGenerating} className={`px-2.5 py-1.5 rounded-md text-xs ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${videoGenerating ? 'opacity-60 cursor-not-allowed' : ''}`}>生成视频</button>
                          </div>
                        )}
                      </div>
                  ) : (
                      <>
                      {/* 中文注释：空状态下直接展示三张方案并可点击选择 */}
                      {/* 中文注释：以绝对定位铺满容器，三列展示缩略图 */}
                      <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
                        {generatedResults.slice(0, 3).map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => { setSelectedResult(r.id); setCurrentStep(3); }}
                            className="relative group"
                          >
                            <img
                              src={r.thumbnail}
                              alt={`AI生成方案 ${r.id}`}
                              className="w-full h-full object-cover rounded-lg"
                              loading="lazy"
                              decoding="async"
                            />
                            <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-800/70 ring-1 ring-gray-700 text-gray-200' : 'bg-white/80 ring-1 ring-gray-200 text-gray-700'}`}>方案 {r.id}</span>
                          </button>
                        ))}
                      </div>
                      </>
                    )}
                  </div>
                  {isRegenerating && (
                    <div className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>豆包生成中…</div>
                  )}
                  {/* 中文注释：如果已生成视频，展示打开链接与内嵌播放器 */}
                  {selectedResult && (generatedResults.find(r => r.id === selectedResult) as any)?.video && (
                    ((generatedResults.find(r => r.id === selectedResult) as any).video as string).startsWith('http') ? (
                      <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 text-sm mt-3`}>
                        <div className="flex items-center justify-between gap-2">
                          <a href={(generatedResults.find(r => r.id === selectedResult) as any).video} target="_blank" rel="noreferrer" className="text-blue-600">打开视频</a>
                          <button
                            className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-white' : 'bg-white ring-1 ring-gray-200'}`}
                            onClick={async () => { try { await navigator.clipboard.writeText((generatedResults.find(r => r.id === selectedResult) as any).video); toast.success('链接已复制'); } catch { toast.error('复制失败'); } }}
                          >复制链接</button>
                        </div>
                        <video controls src={`/api/proxy/video?url=${encodeURIComponent((generatedResults.find(r => r.id === selectedResult) as any).video)}`} className="w-full mt-2 rounded" />
                      </div>
                    ) : (
                      <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 text-sm mt-3 break-all`}>{(generatedResults.find(r => r.id === selectedResult) as any).video}</div>
                    )
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {/* 中文注释：主按钮样式，默认采用红色主色并在生成中禁用 */}
                    <button
                      type="button"
                      onClick={generateThreeVariantsWithDoubao}
                      disabled={isEngineGenerating}
                      className={`flex-1 px-3 py-1.5 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white transition-colors ${isEngineGenerating ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {isEngineGenerating ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-1"></i>
                          正在生成（三张）
                        </>
                      ) : (
                        <>一键生成（三张）</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={downloadSelected}
                      className={`flex-1 px-3 py-1.5 rounded-md text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} transition-colors`}
                    >
                      下载图片
                    </button>
                    <button
                      type="button"
                      onClick={copySelectedLink}
                      className={`flex-1 px-3 py-1.5 rounded-md text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} transition-colors`}
                    >
                      复制链接
                    </button>
                    <button
                      type="button"
                      onClick={generateVideoForSelected}
                      disabled={videoGenerating}
                      className={`flex-1 px-3 py-1.5 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors ${videoGenerating ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {videoGenerating ? (<><i className="fas fa-spinner fa-spin mr-1"></i>生成视频中...</>) : (<>生成视频</>)}
                    </button>
                  </div>
                </div>
                
                {/* 编辑工具 */}
                <div className="mb-6">
                  <h3 
                    className="font-medium mb-3 cursor-pointer select-none"
                    role="button"
                    tabIndex={0}
                    aria-expanded={!editToolsCollapsed}
                    onClick={() => setEditToolsCollapsed(!editToolsCollapsed)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditToolsCollapsed(!editToolsCollapsed); } }}
                  >调整工具</h3>
                  {!editToolsCollapsed && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: '调整大小', icon: 'arrows-alt' },
                      { name: '滤镜效果', icon: 'image' },
                      { name: '色彩调整', icon: 'palette' },
                      { name: '添加文字', icon: 'font' },
                      { name: '图层管理', icon: 'layers' },
                      { name: '撤销/重做', icon: 'undo' }
                    ].map((tool, index) => (
                      <button
                        key={index}
                        className={`p-2 rounded-lg flex flex-col items-center ${
                          isDark 
                            ? 'bg-gray-700 hover:bg-gray-600' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        } transition-colors`}
                        onClick={() => {
                          const map: Record<string, typeof activeEditTool> = {
                            '调整大小': 'resize',
                            '滤镜效果': 'filter',
                            '色彩调整': 'color',
                            '添加文字': 'text',
                            '图层管理': 'layers',
                            '撤销/重做': 'history',
                          };
                          const next = map[tool.name] || null;
                          setActiveEditTool(next);
                          if (tool.name === '添加文字' && !overlayText) {
                            setOverlayText('示例文字');
                          }
                        }}
                      >
                        <i className={`fas fa-${tool.icon} mb-1`}></i>
                        <span className="text-xs">{tool.name}</span>
                      </button>
                    ))}
                  </div>
                  )}
                  {activeEditTool === 'resize' && (
                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <label className="text-sm">缩放：{scale.toFixed(2)}
                        <input type="range" min={0.5} max={2} step={0.01} value={scale} onChange={(e) => { setScale(Number(e.target.value)); pushHistory(); }} className="w-full" />
                      </label>
                    </div>
                  )}
                  {activeEditTool === 'filter' && (
                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <label className="text-sm">模糊：{blur}px
                        <input type="range" min={0} max={10} step={1} value={blur} onChange={(e) => { setBlur(Number(e.target.value)); pushHistory(); }} className="w-full" />
                      </label>
                    </div>
                  )}
                  {activeEditTool === 'color' && (
                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <label className="text-sm">亮度：{brightness}%
                        <input type="range" min={50} max={150} step={1} value={brightness} onChange={(e) => { setBrightness(Number(e.target.value)); pushHistory(); }} className="w-full" />
                      </label>
                      <label className="text-sm">对比度：{contrast}%
                        <input type="range" min={50} max={150} step={1} value={contrast} onChange={(e) => { setContrast(Number(e.target.value)); pushHistory(); }} className="w-full" />
                      </label>
                      <label className="text-sm">饱和度：{saturate}%
                        <input type="range" min={50} max={150} step={1} value={saturate} onChange={(e) => { setSaturate(Number(e.target.value)); pushHistory(); }} className="w-full" />
                      </label>
                      <label className="text-sm">色相：{hueRotate}°
                        <input type="range" min={-180} max={180} step={1} value={hueRotate} onChange={(e) => { setHueRotate(Number(e.target.value)); pushHistory(); }} className="w-full" />
                      </label>
                    </div>
                  )}
                  {activeEditTool === 'text' && (
                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <input type="text" value={overlayText} onChange={(e) => { setOverlayText(e.target.value); pushHistory(); }} placeholder="输入叠加文字" className={`${isDark ? 'bg-gray-700 text-white' : 'bg-white'} px-3 py-2 rounded-md`} />
                      <label className="text-sm">文字大小：{overlaySize}px
                        <input type="range" min={12} max={64} step={1} value={overlaySize} onChange={(e) => { setOverlaySize(Number(e.target.value)); pushHistory(); }} className="w-full" />
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">颜色</span>
                        <input type="color" value={overlayColor} onChange={(e) => { setOverlayColor(e.target.value); pushHistory(); }} />
                      </div>
                    </div>
                  )}
                  {activeEditTool === 'history' && (
                    <div className="mt-4 flex items-center gap-3">
                      <button className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-1.5 rounded-md text-sm`} onClick={undo}>撤销</button>
                      <button className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} px-3 py-1.5 rounded-md text-sm`} onClick={redo}>重做</button>
                    </div>
                  )}
                </div>
                {/* 中文注释：玩法扩展——提供四个快捷玩法入口 */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3">玩法扩展</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={handleFusionGenerate}
                      className={`${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-lg text-sm`}
                    >
                      <i className="fas fa-random mr-1"></i>
                      风格重混
                    </button>
                    <button
                      onClick={applyLayoutGuide}
                      className={`${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-lg text-sm`}
                    >
                      <i className="fas fa-th-large mr-1"></i>
                      版式生成
                    </button>
                    <button
                      onClick={openMockupPreview}
                      className={`${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-lg text-sm`}
                    >
                      <i className="fas fa-box-open mr-1"></i>
                      Mockup预览
                    </button>
                    <button
                      onClick={applyTilePattern}
                      className={`${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-lg text-sm`}
                    >
                      <i className="fas fa-border-all mr-1"></i>
                      图案平铺
                    </button>
                  </div>
                </div>

                {/* AI指令面板 */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3">AI共创对话</h3>
                  <LLMCommandPanel />
                </div>

                {/* 素材库 */}
                    <div>
                      <h3 className="font-medium mb-3">传统纹样素材</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {traditionalPatterns.map((pattern) => (
                      <motion.div
                        key={pattern.id}
                        className={`rounded-lg overflow-hidden border ${
                          isDark ? 'border-gray-700' : 'border-gray-200'
                        } cursor-pointer`}
                        whileHover={{ scale: 1.05 }}
                        onClick={toggleCulturalInfo}
                      >
                        <TianjinImage 
                          src={pattern.thumbnail} 
                          alt={pattern.name} 
                          ratio="square"
                          rounded="lg"
                        />
                        <div className={`p-2 text-xs text-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          {pattern.name}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-8 flex justify-between">
                  <button 
                    onClick={handleBack}
                    className={`px-5 py-2.5 rounded-full transition-colors ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    返回
                  </button>
                  
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleSaveDraft}
                      className={`px-5 py-2.5 rounded-full transition-colors ${
                        isDark 
                          ? 'bg-gray-700 hover:bg-gray-600' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      保存草稿
                    </button>
                    
                    <button 
                      onClick={handlePublish}
                      className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                      发布作品
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
           </div>
         </main>
         
         {/* 协作面板 */}
         {showCollaborationPanel && (
           <CollaborationPanel 
             isOpen={showCollaborationPanel}
             onClose={() => setShowCollaborationPanel(false)}
           />
         )}
         
         {/* AI点评面板 */}
          {showAID点评 && (
            <HaiheBoatTransition>
              <AID点评 
                workId="123"
                onClose={() => setShowAID点评(false)}
              />
            </HaiheBoatTransition>
          )}

          {/* 模型选择弹窗 */}
          {showModelSelector && (
            <ModelSelector 
              isOpen={showModelSelector}
              onClose={() => setShowModelSelector(false)}
            />
          )}
          
          {/* 内容预审弹窗 */}
         {precheckResult && precheckResult.status !== 'pending' && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'} backdrop-blur-sm`}
           >
             <motion.div 
               className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-2xl w-full mx-4`}
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5 }}
             >
               <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                 <h3 className="text-xl font-bold">AI内容预审</h3>
                 <button 
                   onClick={() => setPrecheckResult(null)}
                   className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                   aria-label="关闭"
                 >
                   <i className="fas fa-times"></i>
                 </button>
               </div>
               
               <div className="p-6">
                 <div className="flex items-center mb-6">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                     precheckResult.status === 'passed' ? 'bg-green-100 text-green-600' : 
                     precheckResult.status === 'warning' ? 'bg-yellow-100 text-yellow-600' : 
                     'bg-red-100 text-red-600'
                   }`}>
                     {precheckResult.status === 'passed' ? (
                       <i className="fas fa-check"></i>
                     ) : precheckResult.status === 'warning' ? (
                       <i className="fas fa-exclamation-triangle"></i>
                     ) : (
                       <i className="fas fa-times"></i>
                     )}
                   </div>
                   <div>
                     <h4 className="font-bold text-lg">
                       {precheckResult.status === 'passed' ? '预审通过' : 
                        precheckResult.status === 'warning' ? '预审有警告' : '预审未通过'}
                     </h4>
                     <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                       {precheckResult.status === 'passed' ? '您的作品符合平台规范，可以发布。' : 
                        precheckResult.status === 'warning' ? '您的作品存在一些潜在问题，建议进行调整。' : 
                        '您的作品存在不符合平台规范的内容，请修改后重新提交。'}
                     </p>
                   </div>
                 </div>
                 
                 <div className="mb-6">
                   <h5 className="font-medium mb-3">预审详情</h5>
                   <div className="space-y-3">
                     {precheckResult.issues.map((issue, index) => (
                       <div 
                         key={index} 
                         className={`p-3 rounded-lg ${
                           issue.severity === 'error' 
                             ? isDark ? 'bg-red-900 bg-opacity-30' : 'bg-red-50' 
                             : isDark ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-50'
                         }`}
                       >
                         <div className="flex items-start">
                           <i className={`fas ${
                             issue.severity === 'error' ? 'fa-times-circle' : 'fa-exclamation-circle'
                           } mr-2 mt-0.5 text-${
                             issue.severity === 'error' ? 'red-500' : 'yellow-500'
                           }`}></i>
                           <div>
                             <p className="text-sm font-medium">{issue.type === 'content' ? '内容合规性' : '版权问题'}</p>
                             <p className="text-sm mt-1">{issue.message}</p>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 <div className="flex items-center mb-6">
                   <input
                     type="checkbox"
                     id="enable-precheck"
                     checked={isPrecheckEnabled}
                     onChange={(e) => setIsPrecheckEnabled(e.target.checked)}
                     className="mr-2 rounded text-red-600 focus:ring-red-500"
                   />
                   <label htmlFor="enable-precheck" className="text-sm">
                     启用AI内容预审（建议开启，帮助确保作品合规）
                   </label>
                 </div>
               </div>
               
               <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
                 {precheckResult.status === 'warning' && (
                   <>
                     <button 
                       onClick={() => setPrecheckResult(null)}
                       className={`px-4 py-2 rounded-lg ${
                         isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                       } transition-colors`}
                     >
                       返回修改
                     </button>
                     <button 
                       onClick={handleConfirmPrecheck}
                       className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                     >
                       确认发布
                     </button>
                   </>
                 )}
                 {precheckResult.status === 'passed' && (
                   <button 
                     onClick={completePublish}
                     className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                   >
                     继续发布
                   </button>
                 )}
                 {precheckResult.status === 'failed' && (
                   <button 
                     onClick={() => setPrecheckResult(null)}
                     className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                   >
                     返回修改
                   </button>
                 )}
               </div>
             </motion.div>
           </motion.div>
         )}
         
         {/* 页脚 */}
      <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4`}>
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            © 2025 AI共创平台. 保留所有权利
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>隐私政策</a>
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>服务条款</a>
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>帮助中心</a>
          </div>
        </div>
      </footer>
  );
}
