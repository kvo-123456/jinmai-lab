import { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

import { isPrefetched } from '@/services/prefetch';
import { toast } from 'sonner';
import { TianjinImage, TianjinButton } from './TianjinStyleComponents';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { BRANDS } from '@/lib/brands';

// 活动类型定义
interface Activity {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  image: string;
  participants: number;
  status: 'active' | 'upcoming' | 'ended';
}

// 模板类型定义
interface Template {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  usageCount: number;
}

// 线下体验类型定义
interface OfflineExperience {
  id: number;
  name: string;
  description: string;
  location: string;
  price: string;
  image: string;
  availableSlots: number;
  rating: number;
  reviewCount: number;
}

// 老字号品牌类型定义
interface TraditionalBrand {
  id: number;
  name: string;
  logo: string;
  description: string;
  establishedYear: string;
  collaborationTools: number;
  popularity: number;
}

export default function TianjinCreativeActivities() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'activities' | 'templates' | 'offline' | 'brands'>('activities');
  const [isLoading, setIsLoading] = useState(true);
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const openActivityDetail = (a: Activity) => setSelectedActivity(a);
  const closeActivityDetail = () => setSelectedActivity(null);
  // 中文注释：地域模板详情弹层状态
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const openTemplateDetail = (t: Template) => setSelectedTemplate(t);
  const closeTemplateDetail = () => setSelectedTemplate(null);
  // 中文注释：线下体验详情弹层状态
  const [selectedExperience, setSelectedExperience] = useState<OfflineExperience | null>(null);
  const openExperienceDetail = (e: OfflineExperience) => setSelectedExperience(e);
  const closeExperienceDetail = () => setSelectedExperience(null);
  // 中文注释：老字号品牌详情弹层状态
  const [selectedBrand, setSelectedBrand] = useState<TraditionalBrand | null>(null);
  const openBrandDetail = (b: TraditionalBrand) => setSelectedBrand(b);
  const closeBrandDetail = () => setSelectedBrand(null);
  const brandSentinelRef = useRef<HTMLDivElement | null>(null); // 中文注释：品牌区无限滚动哨兵引用
  const [brandPage, setBrandPage] = useState<number>(1); // 中文注释：品牌区当前分页
  const brandPageSize = 36; // 中文注释：品牌区每页数量
  
  // 模拟数据加载
  useEffect(() => {
    if (isPrefetched('tianjin')) {
      setIsLoading(false);
      return;
    }
    const t = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const updateTabScrollState = () => {
      const el = tabListRef.current;
      if (!el) return;
      setAtStart(el.scrollLeft <= 0);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
      setHasOverflow(el.scrollWidth > el.clientWidth + 1);
    };

    const el = tabListRef.current;
    if (el) {
      updateTabScrollState();
      el.addEventListener('scroll', updateTabScrollState);
    }
    const onResize = () => updateTabScrollState();
    window.addEventListener('resize', onResize);
    return () => {
      if (el) el.removeEventListener('scroll', updateTabScrollState);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const scrollTabs = (dir: 'left' | 'right') => {
    const el = tabListRef.current;
    if (!el) return;
    const delta = Math.max(100, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({ left: dir === 'left' ? -delta : delta, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = tabListRef.current;
    if (!el) return;
    const activeEl = el.querySelector('[aria-selected="true"]') as HTMLElement | null;
    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activeTab]);
  
  // 模拟活动数据
  const activities: Activity[] = [
    {
      id: 1,
      title: '津沽文化节创意设计大赛',
      description: '围绕天津传统文化元素，创作具有现代感的设计作品，展示津门文化魅力。',
      startDate: '2025-12-01',
      endDate: '2026-01-15',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20cultural%20festival%20creative%20design%20competition',
      participants: 325,
      status: 'active'
    },
    {
      id: 2,
      title: '海河龙舟赛视觉设计征集',
      description: '为天津海河龙舟赛设计视觉形象，包括海报、标志和宣传物料。',
      startDate: '2026-03-01',
      endDate: '2026-04-30',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20Haihe%20Dragon%20Boat%20Race%20visual%20design',
      participants: 187,
      status: 'upcoming'
    },
    {
      id: 3,
      title: '杨柳青年画创新设计展',
      description: '以杨柳青年画为灵感，创作现代风格的设计作品，传承非物质文化遗产。',
      startDate: '2025-10-01',
      endDate: '2025-11-15',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Yangliuqing%20New%20Year%20Painting%20innovative%20design%20exhibition',
      participants: 452,
      status: 'ended'
    },
    // 海河夜游光影艺术节：夜游主题，光影互动
    {
      id: 4,
      title: '海河夜游光影艺术节',
      description: '以海河夜游为主题，联动灯光装置与互动艺术，打造城市夜间文化体验。',
      startDate: '2026-05-10',
      endDate: '2026-06-10',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20Haihe%20night%20tour%20light%20art%20festival%20interactive%20installation',
      participants: 268,
      status: 'upcoming'
    },
    // 相声文化海报创作赛：曲艺主题，平面设计
    {
      id: 5,
      title: '相声文化海报创作赛',
      description: '围绕天津相声文化进行视觉创作，征集海报与传播图形，弘扬曲艺精神。',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20crosstalk%20culture%20poster%20design%20competition%20graphic%20design',
      participants: 312,
      status: 'upcoming'
    },
    // 老字号包装重设计挑战：品牌升级，包装创意
    {
      id: 6,
      title: '老字号包装重设计挑战',
      description: '联合天津老字号开展包装升级设计，探索传统与现代的视觉融合。',
      startDate: '2025-11-25',
      endDate: '2025-12-20',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20traditional%20brand%20packaging%20redesign%20challenge%20modern%20vs%20heritage',
      participants: 198,
      status: 'active'
    },
    // 风筝艺术创作季：传统风物，图形延展
    {
      id: 7,
      title: '风筝艺术创作季',
      description: '以天津风筝为核心图形元素，进行IP延展与插画创作。',
      startDate: '2026-03-15',
      endDate: '2026-04-15',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20kite%20art%20creation%20season%20illustration%20design',
      participants: 141,
      status: 'upcoming'
    },
    // 泥人张IP形象征集：非遗IP形象设计
    {
      id: 8,
      title: '泥人张IP形象征集',
      description: '面向公众征集泥人张的IP形象与周边设计，提升非遗传播力。',
      startDate: '2025-09-01',
      endDate: '2025-10-01',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20Niren%20Zhang%20IP%20character%20design%20public%20submission',
      participants: 403,
      status: 'ended'
    },
    // 城市地标插画征集：地标场景，插画风格
    {
      id: 9,
      title: '城市地标插画征集',
      description: '以天津地标为主题进行插画创作，构建城市文化视觉资产库。',
      startDate: '2025-12-05',
      endDate: '2026-01-05',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20city%20landmark%20illustration%20collection%20creative%20art',
      participants: 256,
      status: 'active'
    },
    // 静海葡萄节视觉系统设计：节庆活动，品牌VI
    {
      id: 10,
      title: '静海葡萄节视觉系统设计',
      description: '为静海葡萄节打造完整视觉系统，涵盖主视觉、导视与物料。',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Jinghai%20grape%20festival%20visual%20identity%20system%20design',
      participants: 105,
      status: 'upcoming'
    },
    // 塘沽海风文创周边开发：海洋元素，产品设计
    {
      id: 11,
      title: '塘沽海风文创周边开发',
      description: '围绕滨海新区海风元素设计文创周边，探索跨场景产品化。',
      startDate: '2025-08-01',
      endDate: '2025-09-01',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Binhai%20Tanggu%20sea%20breeze%20cultural%20creative%20merchandise%20design',
      participants: 167,
      status: 'ended'
    },
    // 京津双城联动创意黑客松：跨城协作，快速创作
    {
      id: 12,
      title: '京津双城联动创意黑客松',
      description: '以京津双城为背景，48小时跨学科快速共创，产出落地方案。',
      startDate: '2026-01-20',
      endDate: '2026-01-22',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Beijing%20Tianjin%20dual-city%20creative%20hackathon%20collaboration%2048h',
      participants: 93,
      status: 'upcoming'
    }
    ,
    // 中文注释：新增活动——本地字体与视觉主题挑战
    {
      id: 13,
      title: '津味字体设计挑战',
      description: '以天津地标与方言为灵感，创作具有城市个性的字体与字形海报。',
      startDate: '2025-12-10',
      endDate: '2026-01-20',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20city%20typography%20challenge%20custom%20type%20poster',
      participants: 142,
      status: 'active'
    },
    // 中文注释：新增活动——海河冬季摄影主题赛
    {
      id: 14,
      title: '海河冬季摄影赛',
      description: '围绕海河冬季光影与城市生活，征集夜景与人文摄影作品。',
      startDate: '2025-12-01',
      endDate: '2026-01-10',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Haihe%20winter%20photography%20competition%20night%20city%20lights',
      participants: 189,
      status: 'active'
    },
    // 中文注释：新增活动——老城里市集视觉设计
    {
      id: 15,
      title: '老城里市集视觉设计',
      description: '为天津老城区周末市集创作视觉海报与导视系统，突出市井文化。',
      startDate: '2025-10-10',
      endDate: '2025-11-01',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20old%20town%20market%20visual%20identity%20poster',
      participants: 121,
      status: 'ended'
    },
    // 中文注释：新增活动——相声文化主题表情包征集
    {
      id: 16,
      title: '相声文化表情包征集',
      description: '结合相声经典桥段，设计数字表情包与贴纸周边，传播曲艺幽默。',
      startDate: '2026-02-15',
      endDate: '2026-03-01',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20crosstalk%20meme%20sticker%20design%20collection',
      participants: 98,
      status: 'upcoming'
    },
    // 中文注释：新增活动——天津小吃品牌IP化创作
    {
      id: 17,
      title: '天津小吃IP化创作',
      description: '围绕锅巴菜、耳朵眼等本地小吃进行IP角色与包装插画创作。',
      startDate: '2025-11-20',
      endDate: '2025-12-25',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20snack%20brand%20IP%20character%20and%20packaging%20illustration',
      participants: 204,
      status: 'active'
    },
    // 中文注释：新增活动——港口工业风海报赛
    {
      id: 18,
      title: '港口工业风海报赛',
      description: '以天津港口机械与航运元素为主，创作工业风格主题海报。',
      startDate: '2026-03-05',
      endDate: '2026-04-05',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20port%20industrial%20style%20poster%20design%20competition',
      participants: 76,
      status: 'upcoming'
    }
    ,
    // 中文注释：新增活动——海河音乐嘉年华（城市音乐节）
    {
      id: 19,
      title: '海河音乐嘉年华',
      description: '以海河为舞台，融合电音与民乐，打造城市音乐节品牌形象。',
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Haihe%20Music%20Carnival%20stage%20city%20festival%20electric%20and%20traditional%20music',
      participants: 512,
      status: 'upcoming'
    },
    // 中文注释：新增活动——津门街舞公开赛（青年街头文化）
    {
      id: 20,
      title: '津门街舞公开赛',
      description: '面向全国街舞团队的公开赛，倡导青年街头文化与积极生活方式。',
      startDate: '2026-05-10',
      endDate: '2026-05-12',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20street%20dance%20open%20competition%20urban%20youth%20culture',
      participants: 276,
      status: 'upcoming'
    },
    // 中文注释：新增活动——国潮服饰设计周（时尚设计）
    {
      id: 21,
      title: '国潮服饰设计周',
      description: '以国潮元素为灵感，发布服饰与配件设计，融合传统纹样与现代剪裁。',
      startDate: '2026-09-05',
      endDate: '2026-09-12',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Guochao%20fashion%20design%20week%20traditional%20pattern%20modern%20cutting',
      participants: 348,
      status: 'upcoming'
    },
    // 中文注释：新增活动——青年创客市集与创意展（创客文化）
    {
      id: 22,
      title: '青年创客市集与创意展',
      description: '聚合创客作品与工作坊演示，展示开源硬件、互动艺术与手作。',
      startDate: '2026-07-18',
      endDate: '2026-07-20',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20maker%20fair%20open%20hardware%20interactive%20art%20market',
      participants: 229,
      status: 'upcoming'
    },
    // 中文注释：新增活动——AI创意设计挑战赛（数字创意）
    {
      id: 23,
      title: 'AI创意设计挑战赛',
      description: '结合生成式模型，进行跨媒体视觉与叙事创作挑战，强调伦理与版权。',
      startDate: '2026-01-28',
      endDate: '2026-02-15',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=AI%20creative%20design%20challenge%20generative%20art%20ethical%20creation',
      participants: 317,
      status: 'active'
    },
    // 中文注释：新增活动——皮划艇运动摄影赛（运动与影像）
    {
      id: 24,
      title: '海河皮划艇运动摄影赛',
      description: '记录海河皮划艇赛事的速度与激情，征集运动美学摄影作品。',
      startDate: '2026-04-10',
      endDate: '2026-04-20',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Haihe%20kayak%20sports%20photography%20competition%20action%20and%20speed',
      participants: 165,
      status: 'upcoming'
    },
    // 中文注释：新增活动——津味美食影像节（美食文化）
    {
      id: 25,
      title: '津味美食影像节',
      description: '以纪录片与短视频形式讲述天津美食故事，搭建影像交流平台。',
      startDate: '2025-12-12',
      endDate: '2026-01-12',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20food%20film%20festival%20documentary%20and%20short%20video',
      participants: 241,
      status: 'active'
    },
    // 中文注释：新增活动——近现代建筑影像征集（城市记忆）
    {
      id: 26,
      title: '近现代建筑影像征集',
      description: '围绕五大道与意式风情区的建筑细节，征集影像作品与图像档案。',
      startDate: '2025-11-01',
      endDate: '2025-12-01',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20historic%20architecture%20visual%20archive%20collection',
      participants: 302,
      status: 'ended'
    },
    // 中文注释：新增活动——非遗工坊开放日（教育与传承）
    {
      id: 27,
      title: '非遗工坊开放日',
      description: '开放泥人张、风筝魏等非遗工坊，开展体验课程与讲座。',
      startDate: '2026-03-25',
      endDate: '2026-03-27',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20intangible%20heritage%20open%20day%20workshop%20education',
      participants: 158,
      status: 'upcoming'
    },
    // 中文注释：新增活动——海河夜游灯光装置竞赛（公共艺术）
    {
      id: 28,
      title: '海河夜游灯光装置竞赛',
      description: '征集沿海河的交互式灯光装置方案，打造夜游公共艺术体验。',
      startDate: '2026-08-10',
      endDate: '2026-08-24',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Haihe%20night%20interactive%20light%20installation%20competition%20public%20art',
      participants: 214,
      status: 'upcoming'
    },
    // 中文注释：新增活动——市民LOGO共创计划（城市品牌）
    {
      id: 29,
      title: '市民LOGO共创计划',
      description: '面向市民征集城市品牌LOGO提案，鼓励公众参与与共创。',
      startDate: '2026-02-01',
      endDate: '2026-03-01',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20citizen%20co-creation%20logo%20design%20city%20branding',
      participants: 427,
      status: 'active'
    },
    // 中文注释：新增活动——校园艺术联展巡展（教育与艺术）
    {
      id: 30,
      title: '校园艺术联展巡展',
      description: '联合高校开展艺术联展巡展，建立校地合作的青年创作平台。',
      startDate: '2026-04-01',
      endDate: '2026-05-01',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=University%20art%20joint%20exhibition%20tour%20Tianjin%20collaboration',
      participants: 196,
      status: 'upcoming'
    },
    // 中文注释：新增活动——电音与传统乐融合实验演出（音乐创新）
    {
      id: 31,
      title: '电音×传统乐融合演出',
      description: '将唢呐、笙等传统乐器与电子音乐融合，探索跨界现场。',
      startDate: '2025-12-22',
      endDate: '2025-12-22',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Electronic%20music%20meets%20traditional%20Chinese%20instruments%20live%20show%20Tianjin',
      participants: 388,
      status: 'active'
    },
    // 中文注释：新增活动——文旅联名创意方案赛（文旅融合）
    {
      id: 32,
      title: '文旅联名创意方案赛',
      description: '围绕天津文旅场景与品牌联名，征集整套创意方案与执行计划。',
      startDate: '2026-03-02',
      endDate: '2026-03-26',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20cultural%20tourism%20co-branding%20creative%20proposal%20competition',
      participants: 134,
      status: 'upcoming'
    },
    // 中文注释：新增活动——海洋环保海报设计赛（公共议题）
    {
      id: 33,
      title: '海洋环保海报设计赛',
      description: '倡导海洋环保意识，围绕渤海生态主题创作公益海报。',
      startDate: '2026-06-15',
      endDate: '2026-06-30',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Ocean%20environmental%20protection%20poster%20design%20Bohai%20Sea%20Tianjin',
      participants: 211,
      status: 'upcoming'
    },
    // 中文注释：新增活动——海河徒步摄影马拉松（社区参与）
    {
      id: 34,
      title: '海河徒步摄影马拉松',
      description: '以徒步形式完成沿海河的摄影创作打卡，提升公众参与度。',
      startDate: '2026-05-28',
      endDate: '2026-05-28',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Haihe%20walking%20photo%20marathon%20community%20participation%20Tianjin',
      participants: 322,
      status: 'upcoming'
    },
    // 中文注释：新增活动——城市IP吉祥物设计赛（品牌形象）
    {
      id: 35,
      title: '城市IP吉祥物设计赛',
      description: '征集代表天津气质的城市IP吉祥物形象，应用于文旅宣传。',
      startDate: '2026-02-05',
      endDate: '2026-02-28',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20city%20mascot%20IP%20design%20competition%20branding',
      participants: 403,
      status: 'active'
    },
    // 中文注释：新增活动——儿童绘本创作季（天津故事）
    {
      id: 36,
      title: '天津故事儿童绘本季',
      description: '以天津的历史、人文与风物为素材，创作儿童绘本与故事插图。',
      startDate: '2026-09-20',
      endDate: '2026-10-20',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20children%27s%20picture%20book%20season%20story%20illustration',
      participants: 147,
      status: 'upcoming'
    },
    // 中文注释：新增活动——运动生活方式视觉赛（骑行主题）
    {
      id: 37,
      title: '骑行生活方式视觉赛',
      description: '围绕城市骑行的健康生活方式，征集海报与短视频视觉作品。',
      startDate: '2026-04-02',
      endDate: '2026-04-16',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Urban%20cycling%20lifestyle%20visual%20competition%20poster%20video',
      participants: 188,
      status: 'upcoming'
    },
    // 中文注释：新增活动——社区公共空间改造提案赛（城市更新）
    {
      id: 38,
      title: '社区公共空间改造提案赛',
      description: '以社区公共空间为对象征集改造提案，强化设计与生活的连接。',
      startDate: '2026-03-12',
      endDate: '2026-03-31',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Community%20public%20space%20revitalization%20proposal%20competition%20Tianjin',
      participants: 115,
      status: 'active'
    },
    // 中文注释：新增活动——传统茶文化品牌焕新赛（品牌升级）
    {
      id: 39,
      title: '传统茶文化品牌焕新赛',
      description: '以津门茶文化为灵感，进行品牌识别与包装升级设计。',
      startDate: '2025-12-05',
      endDate: '2026-01-05',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20tea%20culture%20brand%20refresh%20identity%20and%20packaging',
      participants: 236,
      status: 'active'
    },
    // 中文注释：新增活动——海河帆船节视觉系统设计（VI系统）
    {
      id: 40,
      title: '海河帆船节视觉系统设计',
      description: '为海河帆船节打造完整视觉系统，涵盖徽标、旗帜与导视。',
      startDate: '2026-07-02',
      endDate: '2026-07-18',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Haihe%20Sailing%20Festival%20visual%20identity%20system%20design',
      participants: 128,
      status: 'upcoming'
    }
  ];

  const [joinedActivities, setJoinedActivities] = useState<number[]>([]);

  const handleParticipate = (a: Activity) => {
    if (!isAuthenticated) {
      toast.warning('请先登录后再参与活动');
      setTimeout(() => navigate('/login'), 800);
      return;
    }
    setJoinedActivities(prev => (prev.includes(a.id) ? prev : [...prev, a.id]));
    const params = new URLSearchParams();
    params.set('prompt', a.title);
    params.set('activity', String(a.id));
    toast.success('已为你创建活动草稿，进入创作页面');
    navigate(`/create?${params.toString()}`);
  };
  
  // 模拟模板数据
  const templates: Template[] = [
    {
      id: 1,
      name: '津沽文化节主题模板',
      description: '融合天津传统文化元素，适用于各类文化节活动宣传设计。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20cultural%20festival%20template%20design',
      category: '节日主题',
      usageCount: 235
    },
    {
      id: 2,
      name: '海河风光模板',
      description: '以海河风光为背景，适合城市宣传和旅游相关设计。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Haihe%20River%20scenery%20template',
      category: '城市风光',
      usageCount: 189
    },
    {
      id: 3,
      name: '杨柳青年画风格模板',
      description: '模仿杨柳青年画的线条和色彩风格，具有浓厚的传统韵味。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20painting%20style%20template',
      category: '传统风格',
      usageCount: 156
    },
    {
      id: 4,
      name: '天津小吃宣传模板',
      description: '为天津特色小吃设计的宣传模板，突出地方美食特色。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20local%20food%20promotion%20template',
      category: '美食宣传',
      usageCount: 123
    },
    // 城市地标插画模板：地标图形，插画风格
    {
      id: 5,
      name: '城市地标插画模板',
      description: '以天津之眼、解放桥等地标为核心图形的插画类模板。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20city%20landmark%20illustration%20template',
      category: '城市风光',
      usageCount: 144
    },
    // 非遗风物纹样模板：传统纹样，现代排版
    {
      id: 6,
      name: '非遗风物纹样模板',
      description: '提取泥人张、风筝魏等非遗元素纹样，适配现代版式。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20intangible%20heritage%20pattern%20design%20template',
      category: '非遗传承',
      usageCount: 117
    },
    // 夜游光影视觉模板：夜景色彩，光影氛围
    {
      id: 7,
      name: '夜游光影视觉模板',
      description: '以海河夜景的光影氛围为主视觉，适配品牌活动海报。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20night%20tour%20light%20and%20shadow%20visual%20template',
      category: '夜游光影',
      usageCount: 98
    },
    // 老字号联名模板：品牌识别，包装海报
    {
      id: 8,
      name: '老字号联名模板',
      description: '面向老字号品牌的联名海报与包装视觉模板。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20traditional%20brand%20co-branding%20visual%20template',
      category: '品牌联名',
      usageCount: 135
    },
    // 滨海蓝色旅游模板：海风元素，旅行主题
    {
      id: 9,
      name: '滨海蓝色旅游模板',
      description: '提取滨海新区的海风与蓝色主题，面向旅游宣传设计。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Binhai%20blue%20tourism%20poster%20template',
      category: '旅游主题',
      usageCount: 122
    },
    // 工业记忆影像模板：工业风格，粗粝质感
    {
      id: 10,
      name: '工业记忆影像模板',
      description: '以老厂房与工业质感为主，适合纪录片与影像项目。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20industrial%20memory%20visual%20template',
      category: '工业风',
      usageCount: 87
    },
    // 文博展陈主题模板：展览导视，文化主视觉
    {
      id: 11,
      name: '文博展陈主题模板',
      description: '适用于博物馆、美术馆展陈的主视觉与导视系统。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Museum%20exhibition%20visual%20identity%20template',
      category: '文博展陈',
      usageCount: 95
    },
    // 港口文化视觉模板：港口机械，城市脉络
    {
      id: 12,
      name: '港口文化视觉模板',
      description: '以港口机械与城市航运为元素，体现天津港口文化。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20port%20culture%20visual%20template',
      category: '港口文化',
      usageCount: 76
    }
    ,
    // 五大道历史风情模板：近代建筑群，历史氛围
    {
      id: 13,
      name: '五大道历史风情模板',
      description: '以五大道近代建筑群为视觉元素，突出天津的历史人文风貌。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Wudadao%20historical%20architecture%20poster%20template',
      category: '历史风情',
      usageCount: 142
    },
    // 意式风情区摄影模板：欧式街景，旅行打卡
    {
      id: 14,
      name: '意式风情区摄影模板',
      description: '以意式风情区的欧式街景为背景，适合城市旅行与摄影主题设计。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Italian%20Style%20Town%20photography%20template',
      category: '城市风光',
      usageCount: 168
    },
    // 鼓楼文化宣传模板：里巷市井，城市文化
    {
      id: 15,
      name: '鼓楼文化宣传模板',
      description: '围绕鼓楼与老城厢的市井生活，适合社区文化与城市宣传设计。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Gulou%20culture%20promotion%20template',
      category: '城市文化',
      usageCount: 121
    },
    // 北塘海鲜美食模板：渔港元素，美食海报
    {
      id: 16,
      name: '北塘海鲜美食模板',
      description: '以北塘渔港与海鲜元素为主，适合餐饮美食类宣传设计。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Beitang%20seafood%20promotion%20template%20Tianjin',
      category: '美食宣传',
      usageCount: 132
    },
    // 静海葡萄节活动模板：节庆主视觉，导视系统
    {
      id: 17,
      name: '静海葡萄节活动模板',
      description: '围绕静海葡萄节打造节庆主视觉，适配导视与物料延展。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Jinghai%20grape%20festival%20poster%20template',
      category: '节日主题',
      usageCount: 109
    },
    // 滨海新区科技主题模板：科技蓝，城市未来
    {
      id: 18,
      name: '滨海新区科技主题模板',
      description: '以科技蓝与未来感图形为核心，突出滨海新区产业形象。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Binhai%20New%20Area%20technology%20theme%20visual%20template',
      category: '科技主题',
      usageCount: 87
    },
    // 蓟州长城风光模板：自然风光，人文地标
    {
      id: 19,
      name: '蓟州长城风光模板',
      description: '以蓟州长城与山野风光为主视觉，适合文旅宣传类设计。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Jizhou%20Great%20Wall%20scenery%20poster%20template%20Tianjin',
      category: '自然风光',
      usageCount: 153
    },
    // 海河滨水休闲模板：生活方式，滨水场景
    {
      id: 20,
      name: '海河滨水休闲模板',
      description: '围绕海河滨水休闲的生活方式场景，适合社区活动与品牌海报。',
      thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20riverside%20leisure%20lifestyle%20visual%20template%20Tianjin',
      category: '城市休闲',
      usageCount: 174
    }
  ];
  
  // 模拟线下体验数据
  const offlineExperiences: OfflineExperience[] = [
    {
      id: 1,
      name: '杨柳青古镇年画体验',
      description: '亲手绘制杨柳青年画，体验传统木版年画的制作过程。',
      location: '天津市西青区杨柳青古镇',
      price: '¥128/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20ancient%20town%20New%20Year%20painting%20experience',
      availableSlots: 15,
      rating: 4.8,
      reviewCount: 126
    },
    {
      id: 2,
      name: '泥人张彩塑工坊',
      description: '跟随泥人张传承人学习彩塑技艺，制作属于自己的泥人作品。',
      location: '天津市南开区古文化街',
      price: '¥168/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Nirenzhang%20clay%20sculpture%20workshop%20experience',
      availableSlots: 8,
      rating: 4.9,
      reviewCount: 89
    },
    {
      id: 3,
      name: '风筝魏风筝制作体验',
      description: '学习传统风筝的制作技艺，亲手制作一只精美的天津风筝。',
      location: '天津市和平区劝业场',
      price: '¥98/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Weifeng%20kite%20making%20experience',
      availableSlots: 20,
      rating: 4.7,
      reviewCount: 76
    },
    // 相声社沉浸体验：曲艺特色，互动演出
    {
      id: 4,
      name: '相声社沉浸体验',
      description: '走进相声社，体验台前幕后，与演员互动学习基本“捧逗”。',
      location: '天津市河北区意式风情区',
      price: '¥158/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20crosstalk%20club%20immersive%20experience',
      availableSlots: 12,
      rating: 4.8,
      reviewCount: 64
    },
    // 古文化街导览打卡：人文历史，地道市井
    {
      id: 5,
      name: '古文化街导览打卡',
      description: '深度导览古文化街，打卡风物人文，体验天津老城味道。',
      location: '天津市南开区古文化街',
      price: '¥88/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Ancient%20Culture%20Street%20guided%20tour',
      availableSlots: 25,
      rating: 4.6,
      reviewCount: 142
    },
    // 瓷器绘彩手作：工艺美学，色彩实践
    {
      id: 6,
      name: '瓷器绘彩手作班',
      description: '在工坊学习瓷器绘彩，从草图到上色完成一件专属作品。',
      location: '天津市红桥区手作工坊',
      price: '¥198/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Ceramic%20painting%20workshop%20experience',
      availableSlots: 10,
      rating: 4.9,
      reviewCount: 58
    },
    // 津味美食烹饪：地方菜谱，家常风味
    {
      id: 7,
      name: '津味美食烹饪体验',
      description: '学习锅巴菜、煎饼果子等家常做法，掌握地道津味。',
      location: '天津市河西区共享厨房',
      price: '¥138/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20local%20cuisine%20cooking%20class%20experience',
      availableSlots: 18,
      rating: 4.7,
      reviewCount: 73
    },
    // 海河夜游船票：夜景游览，解说导览
    {
      id: 8,
      name: '海河夜游船',
      description: '乘坐游船欣赏海河夜景，配合讲解了解城市光影与故事。',
      location: '天津市河东区海河码头',
      price: '¥168/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20night%20cruise%20experience',
      availableSlots: 40,
      rating: 4.5,
      reviewCount: 211
    },
    // 摄影采风活动：地标构图，夜景拍摄
    {
      id: 9,
      name: '天津地标摄影采风',
      description: '跟随向导拍摄地标建筑，学习夜景与构图技巧。',
      location: '天津市河西区文化中心',
      price: '¥158/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20city%20landmark%20photography%20walk',
      availableSlots: 22,
      rating: 4.8,
      reviewCount: 96
    },
    {
      id: 10,
      name: '石头门坎素包制作课',
      description: '学习传统素包制作技法，从和面到包制完整体验。',
      location: '天津市南开区老城厢',
      price: '¥128/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Shitoumenkan%20vegetarian%20bun%20making%20workshop%20experience',
      availableSlots: 16,
      rating: 4.6,
      reviewCount: 54
    },
    {
      id: 11,
      name: '茶汤李手作茶汤体验',
      description: '跟随老师学习传统茶汤调制，体验细腻甘香的津门味道。',
      location: '天津市河东区小吃工坊',
      price: '¥88/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Chatangli%20sweet%20soup%20making%20workshop%20experience',
      availableSlots: 20,
      rating: 4.5,
      reviewCount: 67
    },
    {
      id: 12,
      name: '海河皮划艇城市漫游',
      description: '专业教练带领在海河进行皮划艇体验，欣赏城市水岸风光。',
      location: '天津市河西区海河沿线',
      price: '¥198/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20kayaking%20urban%20tour%20experience',
      availableSlots: 12,
      rating: 4.7,
      reviewCount: 82
    },
    {
      id: 13,
      name: '意式风情区历史徒步',
      description: '专业向导讲解近代建筑与城市史，深度漫步意式风情区。',
      location: '天津市河北区意式风情区',
      price: '¥68/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Italian%20Style%20Town%20heritage%20walking%20tour',
      availableSlots: 30,
      rating: 4.6,
      reviewCount: 134
    },
    {
      id: 14,
      name: '京剧基础脸谱绘制课',
      description: '学习京剧脸谱色彩与构图，完成一幅个人脸谱作品。',
      location: '天津市红桥区戏曲社',
      price: '¥128/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Peking%20opera%20face%20painting%20workshop%20experience',
      availableSlots: 14,
      rating: 4.8,
      reviewCount: 92
    },
    {
      id: 15,
      name: '传统皮影制作与表演',
      description: '体验皮影雕刻与拼装，学习基本操偶，现场小型演出。',
      location: '天津市津南区文化馆',
      price: '¥158/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Chinese%20shadow%20puppetry%20making%20and%20performance%20workshop%20experience',
      availableSlots: 10,
      rating: 4.7,
      reviewCount: 59
    },
    {
      id: 16,
      name: '老字号巡礼美食徒步',
      description: '串联多家天津老字号，边走边品，了解品牌故事与美味。',
      location: '天津市南开区古文化街',
      price: '¥98/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20time-honored%20brands%20food%20tour%20walking%20experience',
      availableSlots: 25,
      rating: 4.7,
      reviewCount: 105
    },
    {
      id: 17,
      name: '杨柳青木版水印工艺课',
      description: '学习木版水印工艺流程，完成一件传统水印作品。',
      location: '天津市西青区杨柳青古镇',
      price: '¥168/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20woodblock%20water%20printing%20craft%20workshop%20experience',
      availableSlots: 12,
      rating: 4.8,
      reviewCount: 64
    },
    // 中文注释：新增——非遗剪纸主题体验，适合亲子与入门学习
    {
      id: 18,
      name: '非遗剪纸工坊体验',
      description: '学习传统剪纸技法，完成节庆主题剪纸作品并装裱展示。',
      location: '天津市和平区文化馆',
      price: '¥88/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Chinese%20paper-cutting%20workshop%20experience%20festive%20designs',
      availableSlots: 24,
      rating: 4.6,
      reviewCount: 72
    },
    // 中文注释：新增——曲艺相关体验，聚焦京韵大鼓与节奏训练
    {
      id: 19,
      name: '京韵大鼓入门体验课',
      description: '在老师带领下体验击鼓与演唱的基本节奏与腔韵。',
      location: '天津市红桥区曲艺社',
      price: '¥128/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Peking%20drum%20music%20beginner%20workshop%20experience%20traditional%20stage',
      availableSlots: 16,
      rating: 4.7,
      reviewCount: 58
    },
    // 中文注释：新增——亲子向拓印课程，强化互动与文化体验
    {
      id: 20,
      name: '年画拓印亲子课',
      description: '亲子共同学习年画拓印流程，完成一幅纪念作品。',
      location: '天津市西青区杨柳青古镇',
      price: '¥98/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20New%20Year%20print%20rubbing%20parent-child%20workshop%20experience',
      availableSlots: 20,
      rating: 4.8,
      reviewCount: 88
    },
    // 中文注释：新增——古文化街夜游摄影，提升夜景构图与用光技巧
    {
      id: 21,
      name: '古文化街夜拍漫步',
      description: '沿古文化街夜游拍摄，学习夜景用光与构图技巧。',
      location: '天津市南开区古文化街',
      price: '¥88/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Ancient%20Culture%20Street%20night%20photography%20walk%20experience',
      availableSlots: 28,
      rating: 4.6,
      reviewCount: 119
    },
    // 中文注释：新增——港口工业遗址探访，兼具人文与工业美学
    {
      id: 22,
      name: '港口工业遗址探访',
      description: '探访天津港工业遗址，学习纪录摄影与城市工业美学。',
      location: '天津市滨海新区港区',
      price: '¥128/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20port%20industrial%20heritage%20photography%20tour%20experience',
      availableSlots: 18,
      rating: 4.7,
      reviewCount: 76
    },
    // 中文注释：新增——瓷器修复入门，体验修补与彩绘
    {
      id: 23,
      name: '瓷器修复体验课',
      description: '了解瓷器修复基础流程，体验简单修补与彩绘工序。',
      location: '天津市红桥区手作工坊',
      price: '¥168/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Ceramic%20restoration%20beginner%20workshop%20experience%20painting%20and%20repair',
      availableSlots: 12,
      rating: 4.7,
      reviewCount: 64
    },
    // 中文注释：新增——地道美食技法课程，面向烹饪爱好者
    {
      id: 24,
      name: '煎饼果子大师班',
      description: '学习面糊调配与摊制技巧，完成地道风味的煎饼果子。',
      location: '天津市河西区共享厨房',
      price: '¥118/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20jianbing%20guozi%20cooking%20masterclass%20workshop%20experience',
      availableSlots: 20,
      rating: 4.6,
      reviewCount: 91
    },
    // 中文注释：新增——海河沿线骑行体验，结合城市讲解
    {
      id: 25,
      name: '海河城市骑行漫游',
      description: '沿海河骑行漫游，结合导览讲解城市历史与地标。',
      location: '天津市河西区海河沿线',
      price: '¥88/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20riverfront%20city%20cycling%20tour%20experience',
      availableSlots: 30,
      rating: 4.5,
      reviewCount: 110
    },
    // 中文注释：新增——老字号品牌互动体验，传承技艺与故事
    {
      id: 26,
      name: '果仁张栗子手作演示',
      description: '观摩糖炒栗子工艺演示，了解配方与火候，现场试吃。',
      location: '天津市和平区老字号门店',
      price: '¥68/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Candied%20chestnut%20handcraft%20demonstration%20workshop%20experience',
      availableSlots: 26,
      rating: 4.6,
      reviewCount: 85
    },
    // 中文注释：新增——风筝放飞活动日，适合家庭参与
    {
      id: 27,
      name: '传统风筝放飞体验日',
      description: '学习风筝放飞技巧与保养，现场集体放飞与拍照打卡。',
      location: '天津市河西区文化中心绿地',
      price: '¥68/人',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Traditional%20kite%20flying%20family%20experience%20day%20Tianjin',
      availableSlots: 40,
      rating: 4.7,
      reviewCount: 120
    }
  ];
  
  // 模拟老字号品牌数据
  const traditionalBrands: TraditionalBrand[] = [
    {
      id: 1,
      name: '桂发祥',
      logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Guifaxiang%20traditional%20brand%20logo',
      description: '创建于1927年，以十八街麻花闻名，是天津食品行业的老字号品牌。',
      establishedYear: '1927',
      collaborationTools: 8,
      popularity: 96
    },
    {
      id: 2,
      name: '狗不理',
      logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Goubuli%20traditional%20brand%20logo',
      description: '创建于1858年，以特色包子闻名，是天津餐饮行业的代表性老字号。',
      establishedYear: '1858',
      collaborationTools: 12,
      popularity: 98
    },
    {
      id: 3,
      name: '耳朵眼',
      logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Erduoyan%20traditional%20brand%20logo',
      description: '创建于1900年，以炸糕和酒类产品闻名，是天津的传统老字号。',
      establishedYear: '1900',
      collaborationTools: 6,
      popularity: 92
    },
    {
      id: 4,
      name: '老美华',
      logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Laomeihua%20traditional%20shoe%20brand%20logo',
      description: '始于民国时期的传统鞋履品牌，以手工缝制与舒适耐穿著称。',
      establishedYear: '1911',
      collaborationTools: 5,
      popularity: 88
    },
    {
      id: 5,
      name: '大福来',
      logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Dafulai%20guobacai%20brand%20logo',
      description: '以锅巴菜闻名，糊辣香浓、层次丰富，是天津特色早点代表。',
      establishedYear: '1930',
      collaborationTools: 4,
      popularity: 85
    },
    {
      id: 6,
      name: '果仁张',
      logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Guorenzhang%20candied%20chestnut%20brand%20logo',
      description: '百年坚果品牌，以糖炒栗子香甜饱满闻名，老天津味道的代表。',
      establishedYear: '1906',
      collaborationTools: 6,
      popularity: 90
    },
    {
      id: 7,
      name: '茶汤李',
      logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Chatangli%20sweet%20soup%20brand%20logo',
      description: '源自清末的茶汤品牌，口感细腻柔滑、甘香回甜，承载城市记忆。',
      establishedYear: '1895',
      collaborationTools: 3,
      popularity: 83
    },
    // 利顺德：酒店文化，城市记忆
    {
      id: 8,
      name: '利顺德',
      logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Lishunde%20hotel%20heritage%20brand%20logo',
      description: '百年酒店品牌，承载天津近代史与文化记忆，适合文旅联名。',
      establishedYear: '1863',
      collaborationTools: 7,
      popularity: 91
    },
    // 亨得利：钟表店，精工匠艺
    {
      id: 9,
      name: '亨得利表行',
      logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Hengdeli%20watch%20store%20heritage%20brand%20logo',
      description: '老牌钟表行品牌，精工与匠艺象征，可开展工艺联名。',
      establishedYear: '1890',
      collaborationTools: 5,
      popularity: 86
    },
    // 正兴德：茶庄文化，津门茶韵
    {
      id: 10,
      name: '正兴德茶庄',
      logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Zhengxingde%20tea%20house%20traditional%20brand%20logo',
      description: '历史悠久的茶庄品牌，融合津门茶文化与现代设计。',
      establishedYear: '1908',
      collaborationTools: 4,
      popularity: 84
    },
    // 石头门坎：素包之源，传统技法
    {
      id: 11,
      name: '石头门坎素包',
      logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Shitoumenkan%20vegetarian%20bun%20heritage%20brand%20logo',
      description: '素包名店，传承传统素馅工艺，可做餐饮联名设计。',
      establishedYear: '1926',
      collaborationTools: 3,
      popularity: 82
    },
    // 孙记烧卖：街巷味道，家常点心
    {
      id: 12,
      name: '孙记烧卖',
      logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Sunji%20shaomai%20traditional%20brand%20logo',
      description: '街巷点心品牌，家常美味代表，适合集市活动联名。',
      establishedYear: '1935',
      collaborationTools: 2,
      popularity: 79
    }
  ];

  // 中文注释：扩充品牌数据（从 lib BRANDS 兼容映射）
  const extraBrands: TraditionalBrand[] = useMemo(() => BRANDS.map((b, i) => ({
    id: 1000 + i,
    name: b.name,
    logo: b.image,
    description: b.story,
    establishedYear: '—',
    collaborationTools: 3 + (i % 7),
    popularity: Math.min(99, 70 + (i % 30)),
  })), []);
  const allBrands: TraditionalBrand[] = useMemo(() => ([...traditionalBrands, ...extraBrands]), [traditionalBrands, extraBrands]);
  
  const handleApplyTemplate = (templateId: number) => {
    void templateId;
    toast.success('已应用模板到您的创作空间');
  };
  
  const handleBookExperience = (experienceId: number) => {
    void experienceId;
    toast.success('预约成功！我们会尽快与您联系确认详情');
  };
  
  const searchLower = search.trim().toLowerCase();
  const filteredActivities = searchLower
    ? activities.filter((a) => [a.title, a.description].some((s) => s.toLowerCase().includes(searchLower)))
    : activities;
  const filteredTemplates = searchLower
    ? templates.filter((t) => [t.name, t.description, t.category].some((s) => s.toLowerCase().includes(searchLower)))
    : templates;
  const filteredExperiences = searchLower
    ? offlineExperiences.filter((e) => [e.name, e.description, e.location].some((s) => s.toLowerCase().includes(searchLower)))
    : offlineExperiences;
  const filteredBrands = searchLower
    ? allBrands.filter((b) => [b.name, b.description, b.establishedYear].some((s) => s.toLowerCase().includes(searchLower)))
    : allBrands;
  const pagedBrands = useMemo(() => filteredBrands.slice(0, brandPage * brandPageSize), [filteredBrands, brandPage, brandPageSize]);

  // 中文注释：进入“老字号联名”或搜索变化时重置分页
  useEffect(() => { if (activeTab === 'brands') setBrandPage(1); }, [activeTab, search]);
  // 中文注释：品牌区无限滚动（IntersectionObserver）
  useEffect(() => {
    if (activeTab !== 'brands') return;
    const el = brandSentinelRef.current;
    if (!el) return;
    const maxPages = Math.ceil(filteredBrands.length / brandPageSize);
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        setBrandPage((prev) => (prev < maxPages ? prev + 1 : prev));
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab, filteredBrands.length, brandPageSize]);
  // 中文注释：品牌区无限滚动降级方案（滚动到页面底部触发）
  useEffect(() => {
    if (activeTab !== 'brands') return;
    const maxPages = Math.ceil(filteredBrands.length / brandPageSize);
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const doc = document.documentElement;
        const scrollBottom = (window.scrollY || doc.scrollTop) + window.innerHeight;
        const docHeight = Math.max(
          doc.scrollHeight,
          doc.offsetHeight,
          document.body ? document.body.scrollHeight : 0,
          document.body ? document.body.offsetHeight : 0
        );
        if (scrollBottom >= docHeight - 300) {
          setBrandPage((prev) => (prev < maxPages ? prev + 1 : prev));
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeTab, filteredBrands.length, brandPageSize]);
  
  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="space-y-6">
          <div className={`h-8 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="flex space-x-3">
            {[1, 2, 3, 4].map((i) => (
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
      className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md flex-1`}
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center">
          <i className="fas fa-calendar-alt text-red-600 mr-2"></i>
          津味共创活动
        </h3>
        <div className={`w-full sm:w-72 md:w-80 lg:w-96 rounded-lg ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'} px-3 py-2 flex items-center`}>
          <i className={`fas fa-search ${isDark ? 'text-gray-400' : 'text-gray-500'} mr-2`}></i>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索活动、模板、体验或品牌"
            className={`flex-1 outline-none ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="ml-2 px-2 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              清除
            </button>
          )}
        </div>
      </div>
      
      {/* 标签页切换 */}
      <div className="relative mb-6">
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 ${
            isDark ? 'bg-gradient-to-r from-gray-800 to-transparent' : 'bg-gradient-to-r from-white to-transparent'
          } ${atStart ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        ></div>
        <div
          role="tablist"
          aria-label="津味共创活动类别"
          ref={tabListRef}
          className="flex space-x-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory px-1"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') scrollTabs('right');
            if (e.key === 'ArrowLeft') scrollTabs('left');
          }}
        >
          {[
            { id: 'activities', name: '主题活动' },
            { id: 'templates', name: '地域模板' },
            { id: 'offline', name: '线下体验' },
            { id: 'brands', name: '老字号联名' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'activities' | 'templates' | 'offline' | 'brands')}
              role="tab"
              aria-selected={activeTab === tab.id}
              title={tab.name}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${
                activeTab === tab.id 
                  ? 'bg-red-600 text-white shadow-md' 
                  : isDark 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-100 hover:bg-gray-200'
              } ${isDark ? 'focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800' : 'focus-visible:ring-offset-2 focus-visible:ring-offset-white'}`}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 ${
            isDark ? 'bg-gradient-to-l from-gray-800 to-transparent' : 'bg-gradient-to-l from-white to-transparent'
          } ${!hasOverflow || atEnd ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        ></div>
        <button
          aria-label="向左滚动类别"
          onClick={() => scrollTabs('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} shadow-sm ${!hasOverflow || atStart ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <button
          aria-label="向右滚动类别"
          onClick={() => scrollTabs('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} shadow-sm ${!hasOverflow || atEnd ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
      
      {/* 主题活动内容 */}
      {activeTab === 'activities' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => (
            <motion.div
              key={activity.id}
              className={`rounded-xl overflow-hidden shadow-md border ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
              whileHover={{ y: -5 }}
            >
              <div className="relative">
                <img 
                  src={activity.image} 
                  alt={activity.title} 
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => openActivityDetail(activity)}
                />
                <div className="absolute top-3 left-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activity.status === 'active' 
                      ? 'bg-green-600 text-white' 
                      : activity.status === 'upcoming'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-white'
                  }`}>
                    {activity.status === 'active' ? '进行中' : 
                     activity.status === 'upcoming' ? '即将开始' : '已结束'}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="flex items-center">
                    <i className="fas fa-user-friends text-white mr-1"></i>
                    <span className="text-white text-xs">{activity.participants + (joinedActivities.includes(activity.id) ? 1 : 0)}人参与</span>
                  </div>
                </div>
              </div>
              <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                <h4 className="font-bold mb-2">{activity.title}</h4>
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {activity.description}
                </p>
                <div className="flex justify-between items-center text-sm mb-4">
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <i className="far fa-calendar-alt mr-1"></i>
                    {activity.startDate} - {activity.endDate}
                  </span>
                </div>
                <button
                  onClick={() => handleParticipate(activity)}
                  className={`w-full py-2 rounded-lg transition-colors ${
                    activity.status !== 'active'
                      ? (isDark ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed')
                      : joinedActivities.includes(activity.id)
                        ? 'bg-green-600 text-white cursor-default'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  disabled={activity.status !== 'active' || joinedActivities.includes(activity.id)}
                >
                  {activity.status !== 'active' ? '活动已结束' : joinedActivities.includes(activity.id) ? '已参与' : '立即参与'}
                </button>
                <button 
                  className={`mt-2 w-full py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                  onClick={() => openActivityDetail(activity)}
                >
                  查看详情
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* 地域模板内容 */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              className={`rounded-xl overflow-hidden shadow-md border ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
              whileHover={{ y: -5 }}
            >
              <img 
                src={template.thumbnail} 
                alt={template.name} 
                className="w-full h-40 object-cover cursor-pointer"
                onClick={() => openTemplateDetail(template)}
              />
              <div className={`p-3 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium">{template.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-gray-600' : 'bg-gray-100'
                  }`}>
                    {template.category}
                  </span>
                </div>
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {template.description}
                </p>
                <div className="flex justify-between items-center text-xs mb-3">
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} flex items-center`}>
                    <i className="fas fa-download mr-1"></i>
                    {template.usageCount}次使用
                  </span>
                </div>
                <button 
                  onClick={() => handleApplyTemplate(template.id)}
                  className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
                >
                  应用模板
                </button>
                <button 
                  onClick={() => openTemplateDetail(template)}
                  className={`mt-2 w-full py-1.5 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                  查看详情
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* 线下体验内容 */}
      {activeTab === 'offline' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredExperiences.map((experience) => (
            <motion.div
              key={experience.id}
              className={`rounded-xl overflow-hidden shadow-md border ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
              whileHover={{ y: -5 }}
            >
              <TianjinImage src={experience.image} alt={experience.name} ratio="landscape" rounded="xl" onClick={() => openExperienceDetail(experience)} />
              <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold">{experience.name}</h4>
                  <div className="flex items-center">
                    <i className="fas fa-star text-yellow-500 text-xs mr-1"></i>
                    <span className="text-sm">{experience.rating}</span>
                    <span className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      ({experience.reviewCount})
                    </span>
                  </div>
                </div>
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {experience.description}
                </p>
                <div className="mb-3">
                  <div className="flex items-center text-sm mb-1">
                    <i className="fas fa-map-marker-alt mr-1.5 text-red-600"></i>
                    <span className="truncate">{experience.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <i className="fas fa-tag mr-1.5 text-green-600"></i>
                    <span>{experience.price}</span>
                  </div>
                </div>
                <div className={`mb-3 p-2 rounded-lg ${
                  isDark ? 'bg-gray-600' : 'bg-gray-100'
                } text-sm flex justify-between items-center`}>
                  <span>可预约名额</span>
                  <span className="font-medium">{experience.availableSlots}人</span>
                </div>
                <button 
                  onClick={() => handleBookExperience(experience.id)}
                  className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  立即预约
                </button>
                <button 
                  onClick={() => openExperienceDetail(experience)}
                  className={`mt-2 w-full py-2 rounded-lg ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                  查看详情
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* 老字号联名内容 */}
      {activeTab === 'brands' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {pagedBrands.map((brand) => (
            <motion.div
              key={brand.id}
              className={`p-4 rounded-xl shadow-md border transition-shadow ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
              } group hover:shadow-lg`}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center mb-4">
                <div
                  className={`w-16 h-16 rounded-lg overflow-hidden p-2 mr-4 flex items-center justify-center border transition-colors ${
                    isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                  } group-hover:border-blue-400`}
                >
                  <div className="w-full h-full">
                    <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" loading="lazy" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold">{brand.name}</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    创立于 {brand.establishedYear}年
                  </p>
                </div>
              </div>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                {brand.description}
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-gray-600' : 'bg-gray-100'
                } text-center`}>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    定制工具
                  </p>
                  <p className="font-bold">{brand.collaborationTools}</p>
                </div>
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-gray-600' : 'bg-gray-100'
                } text-center`}>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    热度指数
                  </p>
                  <p className="font-bold">{brand.popularity}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* 中文注释：使用天津特色按钮，提供细腻的悬浮与点击反馈 */}
                <TianjinButton ariaLabel={`查看${brand.name}联名工具`} className="w-full" onClick={() => navigate(`/tools?from=tianjin&query=${encodeURIComponent(brand.name + ' 联名 工具')}&mode=inspire`)}>
                  <i className="fas fa-tools mr-2"></i>
                  查看联名工具
                </TianjinButton>
                <TianjinButton ariaLabel={`查看${brand.name}详情`} className="w-full" onClick={() => openBrandDetail(brand)}>
                  <i className="fas fa-info-circle mr-2"></i>
                  查看详情
                </TianjinButton>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {activeTab === 'brands' && (
        <div className="text-center mt-6">
          {brandPage * brandPageSize < filteredBrands.length ? (
            <div ref={brandSentinelRef} className="h-10"></div>
          ) : (
            <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>已加载全部</span>
          )}
        </div>
      )}
        {/* 活动详情弹层 */}
        {selectedActivity && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeActivityDetail}></div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              transition={{ duration: 0.2 }}
              className={`relative z-50 w-full max-w-5xl mx-4 rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className={`flex justify-between items-center px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h4 className="text-lg font-bold">{selectedActivity.title}</h4>
                <button 
                  onClick={closeActivityDetail}
                  className={`px-3 py-1 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  aria-label="关闭详情"
                >
                  关闭
                </button>
              </div>
              <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <img src={selectedActivity.image} alt={selectedActivity.title} className="w-full h-56 object-cover rounded-xl" />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${selectedActivity.status === 'active' ? 'bg-green-600 text-white' : selectedActivity.status === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'}`}>{selectedActivity.status === 'active' ? '进行中' : selectedActivity.status === 'upcoming' ? '即将开始' : '已结束'}</span>
                    <span className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded`}>参与 {selectedActivity.participants}</span>
                    <span className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded`}>{selectedActivity.startDate} - {selectedActivity.endDate}</span>
                  </div>
                </div>
                <div>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mb-3`}>{selectedActivity.description}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3`}>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>活动地点</p>
                      <p className="font-medium">{selectedActivity.title.includes('海河') ? '海河沿线' : selectedActivity.title.includes('静海') ? '静海区' : '天津市区'}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3`}>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>主办单位</p>
                      <p className="font-medium">天津市文化和旅游局（联合主办）</p>
                    </div>
                  </div>
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-3`}>
                    <p className="font-medium mb-2">参赛要求</p>
                    <ul className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm space-y-1 list-disc pl-5`}>
                      <li>围绕主题原创设计，保证作品版权归属清晰</li>
                      <li>提交源文件与展示稿，标注主要创意与元素来源</li>
                      <li>允许团队或个人参赛，跨学科协作加分</li>
                    </ul>
                  </div>
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-3`}>
                    <p className="font-medium mb-2">奖项设置</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className={`${isDark ? 'bg-gray-600' : 'bg-white'} rounded-lg p-2 shadow-sm`}>
                        <p className="text-xs">金奖</p>
                        <p className="font-bold">1</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600' : 'bg-white'} rounded-lg p-2 shadow-sm`}>
                        <p className="text-xs">银奖</p>
                        <p className="font-bold">2</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600' : 'bg-white'} rounded-lg p-2 shadow-sm`}>
                        <p className="text-xs">优秀奖</p>
                        <p className="font-bold">5</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => selectedActivity && handleParticipate(selectedActivity)}
                      className={`flex-1 py-2 rounded-lg ${selectedActivity.status !== 'active'
                        ? (isDark ? 'bg-gray-600 text-white cursor-not-allowed' : 'bg-gray-300 text-gray-700 cursor-not-allowed')
                        : joinedActivities.includes(selectedActivity.id)
                          ? 'bg-green-600 text-white cursor-default'
                          : 'bg-red-600 hover:bg-red-700 text-white'}`}
                      disabled={selectedActivity.status !== 'active' || joinedActivities.includes(selectedActivity.id)}
                    >
                      {selectedActivity.status !== 'active' ? '活动已结束' : joinedActivities.includes(selectedActivity.id) ? '已参与' : '立即参与'}
                    </button>
                    <button 
                      className={`flex-1 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                      onClick={closeActivityDetail}
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 中文注释：地域模板详情弹层 */}
        {selectedTemplate && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeTemplateDetail}></div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`relative z-50 w-full max-w-4xl mx-4 rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className={`flex justify-between items-center px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h4 className="text-lg font-bold">{selectedTemplate.name}</h4>
                <button onClick={closeTemplateDetail} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} px-3 py-1 rounded-lg`}>关闭</button>
              </div>
              <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <img src={selectedTemplate.thumbnail} alt={selectedTemplate.name} className="w-full h-56 object-cover rounded-xl" />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <span className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded`}>{selectedTemplate.category}</span>
                    <span className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded`}>使用 {selectedTemplate.usageCount}</span>
                    <span className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded`}>文件格式 PNG/SVG</span>
                  </div>
                </div>
                <div>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mb-3`}>{selectedTemplate.description}</p>
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-3`}>
                    <p className="font-medium mb-2">适用场景</p>
                    <ul className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm space-y-1 list-disc pl-5`}>
                      <li>活动海报、H5 页面主视觉</li>
                      <li>品牌联名周边与包装封面</li>
                      <li>社交媒体传播物料模板</li>
                    </ul>
                  </div>
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-3`}>
                    <p className="font-medium mb-2">授权说明</p>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>仅限平台内项目使用，商业化需另行授权；请遵守地方文化元素使用规范。</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleApplyTemplate(selectedTemplate.id)}>应用到创作空间</button>
                    <button className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} flex-1 py-2 rounded-lg`} onClick={closeTemplateDetail}>关闭</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 中文注释：线下体验详情弹层 */}
        {selectedExperience && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeExperienceDetail}></div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`relative z-50 w-full max-w-4xl mx-4 rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className={`flex justify-between items-center px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h4 className="text-lg font-bold">{selectedExperience.name}</h4>
                <button onClick={closeExperienceDetail} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} px-3 py-1 rounded-lg`}>关闭</button>
              </div>
              <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <img src={selectedExperience.image} alt={selectedExperience.name} className="w-full h-56 object-cover rounded-xl" />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <span className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded`}>评分 {selectedExperience.rating}</span>
                    <span className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded`}>点评 {selectedExperience.reviewCount}</span>
                    <span className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded`}>名额 {selectedExperience.availableSlots}</span>
                  </div>
                </div>
                <div>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mb-3`}>{selectedExperience.description}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3`}>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>体验地点</p>
                      <p className="font-medium">{selectedExperience.location}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3`}>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>费用说明</p>
                      <p className="font-medium">{selectedExperience.price}（含材料费/讲解）</p>
                    </div>
                  </div>
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-3`}>
                    <p className="font-medium mb-2">预约须知</p>
                    <ul className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm space-y-1 list-disc pl-5`}>
                      <li>确认预约后请准时到场，迟到可能需重新排队</li>
                      <li>如需取消，请提前 24 小时联系工作人员</li>
                      <li>体验中请遵守现场安全与文化保护规范</li>
                    </ul>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white">立即预约</button>
                    <button className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} flex-1 py-2 rounded-lg`} onClick={closeExperienceDetail}>关闭</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 中文注释：老字号品牌详情弹层 */}
        {selectedBrand && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeBrandDetail}></div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`relative z-50 w-full max-w-4xl mx-4 rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className={`flex justify-between items-center px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h4 className="text-lg font-bold">{selectedBrand.name}</h4>
                <button onClick={closeBrandDetail} className={`${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} px-3 py-1 rounded-lg`}>关闭</button>
              </div>
              <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="w-full h-56 bg-white rounded-xl flex items-center justify-center p-6">
                    <img src={selectedBrand.logo} alt={selectedBrand.name} className="max-h-full object-contain" />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <span className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded`}>创立 {selectedBrand.establishedYear}</span>
                    <span className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded`}>工具 {selectedBrand.collaborationTools}</span>
                    <span className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded`}>热度 {selectedBrand.popularity}</span>
                  </div>
                </div>
                <div>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mb-3`}>{selectedBrand.description}</p>
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-3`}>
                    <p className="font-medium mb-2">联名方向</p>
                    <ul className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm space-y-1 list-disc pl-5`}>
                      <li>联名包装与周边（限定款）</li>
                      <li>门店活动视觉与导视系统</li>
                      <li>跨界文化体验合作</li>
                    </ul>
                  </div>
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-3`}>
                    <p className="font-medium mb-2">合作流程</p>
                    <ol className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm space-y-1 list-decimal pl-5`}>
                      <li>提交联名创意与目标受众</li>
                      <li>品牌方评审与法务合规确认</li>
                      <li>打样测试与上线活动执行</li>
                    </ol>
                  </div>
                  <div className="flex gap-3">
                    {/* 中文注释：统一使用天津特色按钮样式，强化整体风格 */}
                    <TianjinButton className="flex-1">
                      <i className="fas fa-handshake mr-2"></i>
                      联系品牌方
                    </TianjinButton>
                    <button className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} flex-1 py-2 rounded-lg`} onClick={closeBrandDetail}>关闭</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

      </motion.div>
  );
}
