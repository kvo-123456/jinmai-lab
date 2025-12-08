import { useEffect, useMemo, useState, useContext, lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TianjinImage, TianjinAvatar } from '@/components/TianjinStyleComponents'
import GradientHero from '@/components/GradientHero'
// 使用React.lazy实现子组件的延迟加载，优化初始加载速度
const CommunityChat = lazy(() => import('@/components/CommunityChat'))
const CommunityManagement = lazy(() => import('@/components/CommunityManagement'))
// 对于有命名导出的组件，需要使用正确的动态导入语法
const CommunityDiscussion = lazy(() => import('@/components/DiscussionSection').then(module => ({
  default: module.CommunityDiscussion
})))
const DiscussionSection = lazy(() => import('@/components/DiscussionSection').then(module => ({
  default: module.DiscussionSection
})))
const ScheduledPost = lazy(() => import('@/components/ScheduledPost'))
const VirtualList = lazy(() => import('@/components/VirtualList'))
const CulturalMatchingGame = lazy(() => import('@/components/CulturalMatchingGame'))


// 优化：添加Suspense fallback，提升用户体验
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-24">
    <div className="w-8 h-8 border-4 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
  </div>
)
import { useTheme } from '@/hooks/useTheme'
import postsApi, { Post } from '@/services/postService'
import { toast } from 'sonner'
import { AuthContext } from '@/contexts/authContext'

type Thread = {
  id: string
  title: string
  content: string
  createdAt: number
  replies: Array<{ id: string; content: string; createdAt: number }>
  pinned?: boolean
  topic?: string
  upvotes?: number
}

const THREAD_KEY = 'jmzf_threads'
const SCHEDULE_KEY = 'jmzf_scheduled'
const THREAD_DRAFT_KEY = 'jmzf_thread_draft'
const FOLLOW_KEY = 'jmzf_followed_creators'
const JOINED_KEY = 'jmzf_joined_communities'
const THREAD_FAV_KEY = 'jmzf_thread_favorites'

// 中文注释：创作者类型与示例数据（用于展示社区头像与在线状态）
type Creator = {
  name: string;
  role: string;
  avatar: string;
  online: boolean;
};
// 优化：使用本地默认头像，减少不必要的API请求
const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiI+PC9yZWN0PjxjaXJjbGUgY3g9IjUwIiBjeT0iNTUiIHI9IjI1IiBmaWxsPSIjN2E4NTg1Ii8+PHN2ZyB3aWR0aD0iNTAlIiBoZWlnaHQ9IjUwJSIgeD0iMjUlIiB5PSIyNSI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiNmN2Y3ZjciLz48L3N2Zz48L3N2Zz4=';
const mockCreators: Creator[] = [
  { name: '设计师小明', role: '视觉设计', avatar: defaultAvatar, online: true },
  { name: '插画师小陈', role: '插画设计', avatar: defaultAvatar, online: true },
  { name: '品牌设计师老王', role: '品牌策略', avatar: defaultAvatar, online: false },
  { name: '数字艺术家小张', role: '数字艺术', avatar: defaultAvatar, online: true },
];

// 中文注释：创作者徽章（用于在详情弹窗中展示）
type Badge = { id: string; name: string; color: string };
const creatorBadges: Record<string, Badge[]> = {
  '设计师小明': [
    { id: 'pro', name: '专业认证', color: 'bg-blue-600' },
    { id: 'mentor', name: '导师', color: 'bg-green-600' },
  ],
  '插画师小陈': [
    { id: 'featured', name: '精选作者', color: 'bg-purple-600' },
  ],
  '品牌设计师老王': [
    { id: 'brand', name: '品牌策略', color: 'bg-red-600' },
  ],
};

// 中文注释：社群类型与示例数据（推荐社群/官方社群）
type Community = {
  id: string;
  name: string;
  description: string;
  cover: string;
  tags: string[];
  members: number;
};
// 中文注释：社群交流消息（包含唯一ID、时间戳与置顶状态）
type ChatMessage = { id?: string; user: string; text: string; avatar: string; createdAt?: number; pinned?: boolean; time?: string };
const recommendedCommunities: Community[] = [
  {
    id: 'c-guochao',
    name: '国潮设计社群',
    description: '讨论国潮视觉、品牌联名与配色体系',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Guochao%20design%20community%20banner',
    tags: ['国潮', '联名', '品牌'],
    members: 1286,
  },
  {
    id: 'c-heritage',
    name: '非遗数字化社群',
    description: '分享非遗数字化案例与教育传播',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Intangible%20heritage%20digital%20community%20banner',
    tags: ['非遗', '教育', '海报'],
    members: 986,
  },
  {
    id: 'c-ip',
    name: 'IP联名与授权',
    description: '围绕IP设计与商业授权的合作讨论',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=IP%20collaboration%20and%20licensing%20community%20banner',
    tags: ['IP', '联名', '授权'],
    members: 742,
  },
  // 中文注释：以下为新增的推荐社群，用于扩充社群列表
  {
    id: 'c-peking-opera',
    name: '京剧视觉社群',
    description: '京剧元素的现代视觉化与海报设计讨论',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Peking%20opera%20visual%20community%20banner%2C%20bold%20graphics',
    tags: ['京剧', '戏曲', '海报'],
    members: 812,
  },
  {
    id: 'c-jingdezhen',
    name: '景德镇陶瓷文创社群',
    description: '蓝白瓷与陶瓷文创的设计分享与交流',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Jingdezhen%20ceramics%20community%20banner%2C%20blue%20and%20white',
    tags: ['景德镇', '陶瓷', '文创'],
    members: 654,
  },
  {
    id: 'c-laozihao',
    name: '老字号品牌策略社群',
    description: '围绕老字号品牌现代化策略与视觉系统建设',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Time-honored%20brand%20strategy%20community%20banner',
    tags: ['老字号', '品牌', '策略'],
    members: 932,
  },
  {
    id: 'c-college-club',
    name: '高校社团联名社群',
    description: '高校社团与品牌联名的企划与视觉讨论',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=College%20club%20collaboration%20community%20banner',
    tags: ['高校', '社团', '联名'],
    members: 1014,
  },
  {
    id: 'c-color-palette',
    name: '东方配色研究社群',
    description: '传统色体系与东方配色的应用研究',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Oriental%20color%20palette%20community%20banner',
    tags: ['传统色', '配色', '指南'],
    members: 723,
  },
  {
    id: 'c-ip-ops',
    name: 'IP运营与授权社群',
    description: 'IP商业授权、联名运营与案例拆解',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=IP%20operations%20and%20licensing%20community%20banner',
    tags: ['IP', '授权', '运营'],
    members: 845,
  },
  {
    id: 'c-illustration',
    name: '插画手绘与线稿社群',
    description: '手绘插画、线稿风格与数字化处理交流',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Hand-drawn%20illustration%20community%20banner%2C%20flat%20style',
    tags: ['插画', '手绘', '线稿'],
    members: 689,
  },
  {
    id: 'c-craft-innovation',
    name: '工艺创新与再设计社群',
    description: '传统工艺现代创新与再设计实践分享',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Craft%20innovation%20community%20banner',
    tags: ['工艺', '创新', '再设计'],
    members: 571,
  },
  {
    id: 'c-heritage-edu',
    name: '非遗教育传播社群',
    description: '非遗文化的教学传播与活动策划讨论',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Intangible%20heritage%20education%20community%20banner',
    tags: ['非遗', '教育', '传播'],
    members: 800,
  },
  // 中文注释：批量新增 20 个推荐社群
  {
    id: 'c-minimal-brand',
    name: '极简品牌视觉社群',
    description: '极简风格的品牌视觉系统与落地应用讨论',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Minimalist%20brand%20visual%20community%20banner',
    tags: ['极简', '品牌', '视觉'],
    members: 705,
  },
  {
    id: 'c-retro-poster',
    name: '复古海报设计社群',
    description: '复古风格的海报设计、字体与排版研究',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Retro%20poster%20design%20community%20banner',
    tags: ['复古', '海报', '字体'],
    members: 790,
  },
  {
    id: 'c-cyberpunk',
    name: '赛博朋克视觉社群',
    description: '赛博朋克风格的霓虹视觉与未来题材创作',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Cyberpunk%20visual%20community%20banner%2C%20neon',
    tags: ['赛博朋克', '霓虹', '未来'],
    members: 668,
  },
  {
    id: 'c-lineart',
    name: '黑白线稿插画社群',
    description: '线稿风格的创作分享与数字化处理技巧',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Lineart%20black%20and%20white%20illustration%20community%20banner',
    tags: ['线稿', '黑白', '插画'],
    members: 612,
  },
  {
    id: 'c-pattern-lab',
    name: '传统纹样研究社群',
    description: '传统纹样的图案提取、延展与现代应用',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20pattern%20research%20community%20banner',
    tags: ['纹样', '图案', '延展'],
    members: 874,
  },
  {
    id: 'c-typeface',
    name: '字体设计与应用社群',
    description: '中文字体设计、版式排版与品牌应用案例',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20typeface%20design%20community%20banner',
    tags: ['字体', '排版', '视觉'],
    members: 839,
  },
  {
    id: 'c-merch',
    name: '国潮周边产品社群',
    description: '国潮礼品、周边开发与供应链协作交流',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Guochao%20merch%20community%20banner',
    tags: ['国潮', '周边', '礼品'],
    members: 921,
  },
  {
    id: 'c-education-kv',
    name: '教育KV与信息图社群',
    description: '教育主题KV设计与信息图表现方法交流',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Education%20KV%20and%20infographic%20community%20banner',
    tags: ['教育', 'KV', '信息图'],
    members: 702,
  },
  {
    id: 'c-oldbrand-campaign',
    name: '老字号联名企划社群',
    description: '老字号品牌的联名企划与商业合作讨论',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Time-honored%20brand%20collaboration%20community%20banner',
    tags: ['老字号', '联名', '企划'],
    members: 965,
  },
  {
    id: 'c-ip-family',
    name: 'IP亲子活动社群',
    description: '亲子向IP活动的视觉与互动设计分享',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=IP%20family%20event%20community%20banner',
    tags: ['IP', '亲子', '活动'],
    members: 731,
  },
  {
    id: 'c-wayfinding',
    name: '导视系统与空间视觉社群',
    description: '空间导视系统、环境图形与人群动线设计',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Wayfinding%20system%20community%20banner',
    tags: ['导视', '空间', '品牌'],
    members: 644,
  },
  {
    id: 'c-packaging',
    name: '文创包装设计社群',
    description: '文创产品包装结构、材质与视觉系统交流',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Cultural%20product%20packaging%20design%20community%20banner',
    tags: ['包装', '文创', '纸品'],
    members: 858,
  },
  {
    id: 'c-festival',
    name: '节日主题视觉社群',
    description: '节日活动KV与主题视觉的创意与执行',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Festival%20theme%20visual%20community%20banner',
    tags: ['节日', 'KV', '海报'],
    members: 796,
  },
  {
    id: 'c-color-chinese-red',
    name: '中国红品牌KV社群',
    description: '中国红主题的品牌KV与整套物料表现',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20red%20brand%20KV%20community%20banner',
    tags: ['中国红', 'KV', '品牌'],
    members: 882,
  },
  {
    id: 'c-ip-campus',
    name: '校园社团IP联名社群',
    description: '校园社团IP与品牌的跨界联名合作交流',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Campus%20club%20IP%20collaboration%20community%20banner',
    tags: ['校园', 'IP', '联名'],
    members: 1002,
  },
  {
    id: 'c-bluewhite',
    name: '青花瓷图形再设计社群',
    description: '青花瓷元素的现代图形再设计与视觉化',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Blue%20and%20white%20porcelain%20graphic%20redesign%20community%20banner',
    tags: ['青花瓷', '图形', '再设计'],
    members: 648,
  },
  {
    id: 'c-heritage-process',
    name: '非遗技艺流程社群',
    description: '非遗技艺流程梳理、信息图与教学素材',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Intangible%20heritage%20process%20community%20banner',
    tags: ['非遗', '技艺', '流程'],
    members: 774,
  },
  {
    id: 'c-illustration-street',
    name: '国潮街头插画社群',
    description: '街头风格的国潮插画创作与风格研究',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Guochao%20street%20illustration%20community%20banner',
    tags: ['国潮', '插画', '街头'],
    members: 867,
  },
  {
    id: 'c-graphic-system',
    name: '视觉系统与延展社群',
    description: '品牌视觉系统化设计与多场景延展规范',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Brand%20visual%20system%20community%20banner',
    tags: ['视觉系统', '延展', '规范'],
    members: 733,
  },
  {
    id: 'c-colorsystem',
    name: '传统色与色彩系统社群',
    description: '传统色彩体系、配色方法与设计落地分享',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20colors%20and%20palette%20community%20banner',
    tags: ['传统色', '配色', '系统'],
    members: 711,
  },
  {
    id: 'c-ai-art',
    name: 'AI艺术生成社群',
    description: '分享AI生成艺术的提示词、风格与实战案例',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=AI%20art%20generation%20community%20banner%2C%20modern%20style',
    tags: ['AI', '提示词', '艺术'],
    members: 978,
  },
  {
    id: 'c-photography',
    name: '摄影与后期社群',
    description: '摄影构图、色彩校正与后期调色技巧交流',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Photography%20and%20post%20processing%20community%20banner',
    tags: ['摄影', '后期', '调色'],
    members: 812,
  },
  {
    id: 'c-3d-modeling',
    name: '3D建模与渲染社群',
    description: '3D建模、材质贴图与渲染表现方法讨论',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=3D%20modeling%20and%20rendering%20community%20banner',
    tags: ['3D', '建模', '渲染'],
    members: 895,
  },
  {
    id: 'c-game-art',
    name: '游戏美术社群',
    description: '游戏角色、场景与UI的美术风格与规范',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Game%20art%20community%20banner',
    tags: ['游戏', '角色', '场景'],
    members: 936,
  },
  {
    id: 'c-anime',
    name: '二次元插画社群',
    description: '动漫风插画的线稿、上色与风格化技巧',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Anime%20illustration%20community%20banner',
    tags: ['二次元', '插画', '上色'],
    members: 884,
  },
  {
    id: 'c-calligraphy',
    name: '书法与字形社群',
    description: '书法临摹、字形结构与现代化应用分享',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Calligraphy%20and%20letterform%20community%20banner',
    tags: ['书法', '字形', '应用'],
    members: 721,
  },
  {
    id: 'c-streetwear',
    name: '潮流服饰视觉社群',
    description: '潮流服饰图形、面料工艺与视觉企划交流',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Streetwear%20visual%20community%20banner',
    tags: ['潮流', '服饰', '企划'],
    members: 803,
  },
  {
    id: 'c-travel-culture',
    name: '旅行地文化视觉社群',
    description: '地方文化IP、旅游海报与城市品牌研究',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Travel%20culture%20visual%20community%20banner',
    tags: ['旅游', '城市', '文化'],
    members: 768,
  },
  {
    id: 'c-folk-music',
    name: '国风音乐视觉社群',
    description: '国风音乐的封面、舞台视觉与周边设计',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20folk%20music%20visual%20community%20banner',
    tags: ['国风', '音乐', '视觉'],
    members: 746,
  },
  {
    id: 'c-motion-graphics',
    name: '动效与视频包装社群',
    description: 'MG动效、片头包装与剪辑节奏方法交流',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Motion%20graphics%20community%20banner',
    tags: ['动效', '包装', '剪辑'],
    members: 829,
  },
  {
    id: 'c-ui-ux',
    name: 'UI/UX设计社群',
    description: '产品界面、交互策略与设计系统规范讨论',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=UI%20UX%20design%20community%20banner',
    tags: ['界面', '交互', '系统'],
    members: 914,
  },
  {
    id: 'c-data-viz',
    name: '数据可视化社群',
    description: '信息图、可视化叙事与数据图形表达方法',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Data%20visualization%20community%20banner',
    tags: ['信息图', '数据', '可视化'],
    members: 777,
  },
  {
    id: 'c-arch-visual',
    name: '建筑与空间视觉社群',
    description: '建筑摄影、空间导视与环境图形设计交流',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Architectural%20visual%20community%20banner',
    tags: ['建筑', '空间', '导视'],
    members: 732,
  },
  {
    id: 'c-product-design',
    name: '工业产品外观设计社群',
    description: '产品外观、结构细节与量产落地经验交流',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Industrial%20product%20design%20community%20banner',
    tags: ['工业', '外观', '量产'],
    members: 756,
  },
  {
    id: 'c-printmaking',
    name: '版画与手工印刷社群',
    description: '丝网印刷、油印木刻与手工印刷工艺交流',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Printmaking%20community%20banner',
    tags: ['版画', '手工', '印刷'],
    members: 669,
  },
  // 中文注释：新增多元主题社群，进一步丰富探索面
  {
    id: 'c-ar-vr',
    name: 'AR/VR互动设计社群',
    description: '增强现实与虚拟现实的交互体验与视觉表达',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=AR%20VR%20interaction%20design%20community%20banner',
    tags: ['AR', 'VR', '交互'],
    members: 802,
  },
  {
    id: 'c-metaverse',
    name: '元宇宙活动视觉社群',
    description: '虚拟活动与沉浸式场景的视觉企划与执行',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Metaverse%20event%20visual%20community%20banner',
    tags: ['元宇宙', '活动', '沉浸'],
    members: 735,
  },
  {
    id: 'c-creative-coding',
    name: '创意编程与生成设计社群',
    description: 'p5.js、Processing与生成式图形的美学探索',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Creative%20coding%20and%20generative%20design%20community%20banner',
    tags: ['编程', '生成', '图形'],
    members: 889,
  },
  {
    id: 'c-data-story',
    name: '数据叙事与信息架构社群',
    description: '数据故事、信息架构与可读性设计的实践方法',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Data%20storytelling%20and%20information%20architecture%20community%20banner',
    tags: ['数据', '叙事', '信息架构'],
    members: 718,
  },
  {
    id: 'c-product-photo',
    name: '产品摄影与布光社群',
    description: '电商产品摄影、布光与修图流程经验分享',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Product%20photography%20lighting%20community%20banner',
    tags: ['摄影', '布光', '修图'],
    members: 786,
  },
  {
    id: 'c-cosplay-design',
    name: 'Cosplay服饰与造型社群',
    description: '服饰打版、材质工艺与角色造型视觉表达',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Cosplay%20costume%20design%20community%20banner',
    tags: ['Cosplay', '服饰', '造型'],
    members: 741,
  },
  {
    id: 'c-exhibition',
    name: '博物馆与展陈设计社群',
    description: '展陈策展、展板信息与空间动线的视觉设计',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Museum%20exhibition%20design%20community%20banner',
    tags: ['展陈', '策展', '空间'],
    members: 728,
  },
  {
    id: 'c-children-book',
    name: '儿童绘本插画社群',
    description: '儿童向绘本的角色塑造与叙事图像表达',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Children%20book%20illustration%20community%20banner',
    tags: ['绘本', '儿童', '插画'],
    members: 764,
  },
  {
    id: 'c-indie-brand',
    name: '独立品牌孵化社群',
    description: '小众品牌定位、风格系统与启动物料实战',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Indie%20brand%20incubation%20community%20banner',
    tags: ['品牌', '定位', '物料'],
    members: 915,
  },
  {
    id: 'c-tea-ceremony-brand',
    name: '茶文化与仪式品牌社群',
    description: '茶文化视觉、礼仪器具与仪式体验品牌设计',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Tea%20culture%20brand%20community%20banner',
    tags: ['茶文化', '品牌', '仪式'],
    members: 679,
  },
  {
    id: 'c-festival-stage',
    name: '节庆舞台与灯光视觉社群',
    description: '舞台美术、灯光设计与活动视觉系统化落地',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Festival%20stage%20lighting%20visual%20community%20banner',
    tags: ['舞台', '灯光', '活动'],
    members: 801,
  },
  {
    id: 'c-nft-collectibles',
    name: '数字藏品与NFT视觉社群',
    description: '数字藏品的视觉风格、发行策略与合规讨论',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=NFT%20digital%20collectibles%20community%20banner',
    tags: ['数字藏品', 'NFT', '合规'],
    members: 688,
  },
  {
    id: 'c-retro-pixel',
    name: '像素复古艺术社群',
    description: '像素风图形创作与复古游戏视觉研究交流',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Retro%20pixel%20art%20community%20banner',
    tags: ['像素', '复古', '游戏'],
    members: 744,
  },
  {
    id: 'c-sci-fi-concept',
    name: '科幻概念设计社群',
    description: '硬核科幻风格的概念场景与载具设定分享',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Sci-fi%20concept%20design%20community%20banner',
    tags: ['科幻', '概念', '设定'],
    members: 873,
  },
  {
    id: 'c-storyboard-comic',
    name: '漫画分镜与叙事社群',
    description: '镜头语言、节奏把控与叙事分镜的实战技巧',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Storyboard%20comic%20community%20banner',
    tags: ['分镜', '叙事', '漫画'],
    members: 792,
  },
  {
    id: 'c-motion-capture',
    name: '动作捕捉与角色表现社群',
    description: '动作捕捉流程、绑定与角色表现的技术美术',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Motion%20capture%20and%20character%20performance%20community%20banner',
    tags: ['动捕', '绑定', '角色'],
    members: 709,
  },
  {
    id: 'c-wearable-design',
    name: '可穿戴与交互设备设计社群',
    description: '智能穿戴产品的交互体验与外观风格探索',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Wearable%20device%20design%20community%20banner',
    tags: ['穿戴', '交互', '产品'],
    members: 737,
  },
  {
    id: 'c-sustainable-packaging',
    name: '可持续包装与环保材质社群',
    description: '低碳包装结构、环保材质与循环设计方法',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Sustainable%20packaging%20community%20banner',
    tags: ['可持续', '环保', '包装'],
    members: 755,
  },
  {
    id: 'c-hackathon',
    name: '创意黑客松与协作社群',
    description: '跨学科协作、快速原型与创意竞赛活动分享',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Hackathon%20creative%20collaboration%20community%20banner',
    tags: ['协作', '原型', '竞赛'],
    members: 803,
  },
  {
    id: 'c-hand-lettering',
    name: '手写字与品牌字系社群',
    description: '手写字风格化、变体设计与品牌字系包装',
    cover: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Hand%20lettering%20brand%20typeface%20community%20banner',
    tags: ['手写字', '字系', '品牌'],
    members: 786,
  },
];

export default function Community() {
  const { isDark } = useTheme()
  const [posts, setPosts] = useState<Post[]>([])
  const [mode, setMode] = useState<'style' | 'topic'>('style') // 中文注释：子社区模式（风格/题材）
  const STYLE_LIST = ['国潮', '极简', '复古', '赛博朋克', '手绘插画', '黑白线稿', '蓝白瓷']
  const TOPIC_LIST = ['老字号', '非遗', '京剧', '景德镇', '校园社团']
  const [selectedStyle, setSelectedStyle] = useState('国潮')
  const [selectedTopic, setSelectedTopic] = useState('老字号')
  const [threads, setThreads] = useState<Thread[]>([])
  const [newTitle, setNewTitle] = useState('') // 中文注释：新帖标题
  const [newContent, setNewContent] = useState('') // 中文注释：新帖内容
  const [threadDraft, setThreadDraft] = useState<{ title?: string; content?: string; mode?: 'style' | 'topic'; selected?: string } | null>(null)
  const [threadSearch, setThreadSearch] = useState('') // 中文注释：讨论搜索（原始输入值）
  const [debouncedThreadSearch, setDebouncedThreadSearch] = useState('') // 中文注释：讨论搜索（防抖后的值）
  const [threadSort, setThreadSort] = useState<'new' | 'reply' | 'hot'>('new') // 中文注释：排序方式
  const [favOnly, setFavOnly] = useState(false) // 中文注释：只看收藏
  const [favoriteThreads, setFavoriteThreads] = useState<string[]>([]) // 中文注释：收藏的帖子ID
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [announcement, setAnnouncement] = useState('') // 中文注释：公告内容
  const [announceSaved, setAnnounceSaved] = useState(true) // 中文注释：公告是否已保存
  const [scheduledTitle, setScheduledTitle] = useState('')
  const [scheduledContent, setScheduledContent] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduled, setScheduled] = useState<Array<{ id: string; title: string; content: string; time: number; published: boolean, targetMode: 'style' | 'topic', targetValue: string }>>([])
  const [now, setNow] = useState<number>(Date.now())
  const [upvoteGuard, setUpvoteGuard] = useState<Record<string, boolean>>({})
  const UPVOTE_GUARD_KEY = 'jmzf_upvote_guard'
  // 中文注释：创作者关注与详情弹窗状态
  const [followedCreators, setFollowedCreators] = useState<string[]>([])
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeCreator, setActiveCreator] = useState<Creator | null>(null)
  // 中文注释：社群消息（简易讨论）与社群分栏
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'm-1', user: '设计师小明', text: '欢迎加入国潮社群，分享你的配色方案！', avatar: mockCreators[0].avatar, createdAt: Date.now() - 60_000 },
    { id: 'm-2', user: '插画师小陈', text: '杨柳青年画数字化插画风格讨论，欢迎交流～', avatar: mockCreators[1].avatar, createdAt: Date.now() - 120_000 },
  ])
  const [communityMessages, setCommunityMessages] = useState<Record<string, ChatMessage[]>>({})
  const COMMUNITY_MSG_KEY = 'jmzf_community_messages'
  // 中文注释：社群页标签状态，新增“进入的社群”用于展示用户已加入的社群
  const [communityTab, setCommunityTab] = useState<'recommended' | 'user' | 'joined'>('recommended')
  const [userCommunities, setUserCommunities] = useState<Community[]>([])
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([])
  const [newCommunityName, setNewCommunityName] = useState('')
  const [newCommunityDesc, setNewCommunityDesc] = useState('')
  const [newCommunityTags, setNewCommunityTags] = useState('')
  // 中文注释：进入的社群功能（置顶、静音、搜索）与创建社群编辑草稿
  const PIN_KEY = 'jmzf_pinned_joined'
  const MUTE_KEY = 'jmzf_muted_communities'
  const [pinnedJoined, setPinnedJoined] = useState<string[]>([])
  const [mutedCommunities, setMutedCommunities] = useState<string[]>([])
  const [gameOpen, setGameOpen] = useState(false)
  const [joinedSearch, setJoinedSearch] = useState('')
  const [preferPinned, setPreferPinned] = useState(true)
  const [hideMuted, setHideMuted] = useState(false)
  // 中文注释：社群列表 + 聊天的当前选中社群ID与搜索关键词
  const [activeChatCommunityId, setActiveChatCommunityId] = useState<string | null>(null)
  const [chatSearch, setChatSearch] = useState('')
  const [editDraft, setEditDraft] = useState<{ id: string; name: string; desc: string; tags: string } | null>(null)
  // 中文注释：我创建的社群的管理抽屉（成员、公告、隐私）状态
  const MEMBER_KEY = 'jmzf_community_members'
  const ANNOUNCE_KEY = 'jmzf_community_announce'
  const PRIVACY_KEY = 'jmzf_community_privacy'
  const ADMIN_KEY = 'jmzf_community_admins'
  const [manageCommunityId, setManageCommunityId] = useState<string | null>(null)
  const [memberStore, setMemberStore] = useState<Record<string, string[]>>({})
  const [announceStore, setAnnounceStore] = useState<Record<string, string>>({})
  const [privacyStore, setPrivacyStore] = useState<Record<string, 'public' | 'private'>>({})
  const [adminStore, setAdminStore] = useState<Record<string, string[]>>({})
  const [newMemberEmail, setNewMemberEmail] = useState('')
  // 中文注释：进入的社群卡片内成员列表展开的目标社群ID（只读）
  const [expandedMembersId, setExpandedMembersId] = useState<string | null>(null)
  // 中文注释：当前登录用户（用于权限判断）
  const { user } = useContext(AuthContext)
  const currentEmail = user?.email || ''
  // 中文注释：根据 URL 查询参数决定当前上下文（创作者/共创）与默认标签
  const location = useLocation()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const communityContext = (searchParams.get('context') as 'creator' | 'cocreation') || 'creator'
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (communityContext === 'creator') {
      setCommunityTab('recommended')
    } else {
      if (tab === 'joined') setCommunityTab('joined')
      else setCommunityTab('user')
    }
  }, [communityContext, searchParams])
  // 中文注释：支持通过 URL 参数 ?join=communityId 自动加入目标社群并选中聊天
  useEffect(() => {
    const joinId = searchParams.get('join')
    if (joinId) {
      setJoinedCommunities(prev => prev.includes(joinId) ? prev : [...prev, joinId])
      setActiveChatCommunityId(joinId)
    }
  }, [searchParams])
  const [communitySearch, setCommunitySearch] = useState('')
  const [communitySort, setCommunitySort] = useState<'members' | 'alphabet'>('members')
  const [communityOpen, setCommunityOpen] = useState(false)
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null)
  

  

  useEffect(() => {
    const current = postsApi.getPosts()
    setPosts(current)
    
    // 异步读取 localStorage 数据，避免阻塞页面加载
    const loadLocalStorageData = () => {
      // 使用 setTimeout 将 localStorage 读取放在事件循环的下一个周期执行
      setTimeout(() => {
    try {
      const raw = localStorage.getItem(THREAD_KEY)
      setThreads(raw ? JSON.parse(raw) : [])
    } catch { setThreads([]) }
    try {
      const ann = localStorage.getItem(ANNOUNCE_KEY)
      if (ann) {
        const parsed = JSON.parse(ann)
        setAnnouncement(typeof parsed === 'string' ? parsed : '')
      } else {
        setAnnouncement('')
      }
    } catch { setAnnouncement('') }
    try {
      const sch = localStorage.getItem(SCHEDULE_KEY)
      setScheduled(sch ? JSON.parse(sch) : [])
    } catch {}
    try {
      const guard = localStorage.getItem(UPVOTE_GUARD_KEY)
      setUpvoteGuard(guard ? JSON.parse(guard) : {})
    } catch {}
    try {
      const fd = localStorage.getItem(FOLLOW_KEY)
      setFollowedCreators(fd ? JSON.parse(fd) : [])
    } catch {}
    try {
      const jd = localStorage.getItem(JOINED_KEY)
      setJoinedCommunities(jd ? JSON.parse(jd) : [])
    } catch {}
    try {
      const td = localStorage.getItem(THREAD_DRAFT_KEY)
      setThreadDraft(td ? JSON.parse(td) : null)
    } catch {}
    try {
      const fav = localStorage.getItem(THREAD_FAV_KEY)
      setFavoriteThreads(fav ? JSON.parse(fav) : [])
    } catch {}
    try {
      const rawMsg = localStorage.getItem(COMMUNITY_MSG_KEY)
      const base: Record<string, ChatMessage[]> = rawMsg ? JSON.parse(rawMsg) : {}
      recommendedCommunities.forEach(c => { if (!base[c.id]) base[c.id] = [{ id: `sys-${c.id}`, user: '系统提示', text: `欢迎加入「${c.name}」`, avatar: mockCreators[0].avatar, createdAt: Date.now() }] })
      setCommunityMessages(base)
      localStorage.setItem(COMMUNITY_MSG_KEY, JSON.stringify(base))
    } catch {}
    try {
      const p = localStorage.getItem(PIN_KEY)
      setPinnedJoined(p ? JSON.parse(p) : [])
    } catch {}
    try {
      const m = localStorage.getItem(MUTE_KEY)
      setMutedCommunities(m ? JSON.parse(m) : [])
    } catch {}
    try {
      const mem = localStorage.getItem(MEMBER_KEY)
      setMemberStore(mem ? JSON.parse(mem) : {})
    } catch {}
    try {
      const ann = localStorage.getItem(ANNOUNCE_KEY)
      setAnnounceStore(ann ? JSON.parse(ann) : {})
    } catch {}
    try {
      const pri = localStorage.getItem(PRIVACY_KEY)
      setPrivacyStore(pri ? JSON.parse(pri) : {})
    } catch {}
    try {
      const adm = localStorage.getItem(ADMIN_KEY)
      setAdminStore(adm ? JSON.parse(adm) : {})
    } catch {}
        
        // 关闭 setTimeout
      }, 0)
    }
    
    // 调用异步加载函数
    loadLocalStorageData()
  }, [])

  // 优化：合并localStorage写入操作，减少频繁写入
  useEffect(() => {
    const saveToLocalStorage = () => {
      try {
        localStorage.setItem(PIN_KEY, JSON.stringify(pinnedJoined))
        localStorage.setItem(MUTE_KEY, JSON.stringify(mutedCommunities))
        localStorage.setItem(MEMBER_KEY, JSON.stringify(memberStore))
        localStorage.setItem(ANNOUNCE_KEY, JSON.stringify(announceStore))
        localStorage.setItem(PRIVACY_KEY, JSON.stringify(privacyStore))
        localStorage.setItem(ADMIN_KEY, JSON.stringify(adminStore))
        localStorage.setItem(FOLLOW_KEY, JSON.stringify(followedCreators))
        localStorage.setItem(JOINED_KEY, JSON.stringify(joinedCommunities))
      } catch (error) {
        console.error('保存到localStorage失败:', error)
      }
    }
    
    // 使用防抖函数，避免频繁写入
    const timeoutId = setTimeout(saveToLocalStorage, 500)
    return () => clearTimeout(timeoutId)
  }, [pinnedJoined, mutedCommunities, memberStore, announceStore, privacyStore, adminStore, followedCreators, joinedCommunities])
  // 中文注释：当加入社群变化时，自动选择一个社群用于右侧聊天（优先置顶）
  useEffect(() => {
    if (!joinedCommunities.length) { setActiveChatCommunityId(null); return }
    if (activeChatCommunityId && joinedCommunities.includes(activeChatCommunityId)) return
    const pinnedFirst = pinnedJoined.find(id => joinedCommunities.includes(id))
    setActiveChatCommunityId(pinnedFirst || joinedCommunities[0] || null)
  }, [joinedCommunities, pinnedJoined])
  useEffect(() => {
    const payload = { title: newTitle.trim(), content: newContent.trim(), mode, selected: mode === 'style' ? selectedStyle : selectedTopic }
    try { localStorage.setItem(THREAD_DRAFT_KEY, JSON.stringify(payload)) } catch {}
  }, [newTitle, newContent, mode, selectedStyle, selectedTopic])

  useEffect(() => { try { localStorage.setItem(THREAD_FAV_KEY, JSON.stringify(favoriteThreads)) } catch {} }, [favoriteThreads])

  // 中文注释：置顶/静音切换与创建社群编辑流程
  const togglePinJoined = (id: string) => {
    setPinnedJoined(prev => prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev])
  }
  const toggleMuteCommunity = (id: string) => {
    setMutedCommunities(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const copyInviteLink = async (id: string) => {
    const url = `${window.location.origin}/community?context=creator&join=${id}`
    try { await navigator.clipboard.writeText(url); toast.success('邀请链接已复制') } catch { toast.info('无法复制，请手动复制：' + url) }
  }
  const openManage = (id: string) => { setManageCommunityId(id) }
  const closeManage = () => { setManageCommunityId(null); setNewMemberEmail('') }
  const addMember = () => {
    if (!isAdmin(manageCommunityId!, currentEmail)) { toast.warning('仅管理员可添加成员'); return }
    const email = newMemberEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) { toast.warning('请输入有效邮箱'); return }
    setMemberStore(prev => ({ ...prev, [manageCommunityId!]: Array.from(new Set([...(prev[manageCommunityId!] || []), email])) }))
    setNewMemberEmail('')
    toast.success('已添加成员')
  }
  const removeMember = (email: string) => {
    if (!isAdmin(manageCommunityId!, currentEmail)) { toast.warning('仅管理员可移除成员'); return }
    setMemberStore(prev => ({ ...prev, [manageCommunityId!]: (prev[manageCommunityId!] || []).filter(e => e !== email) }))
  }
  const setAnnouncementForManaged = (text: string) => {
    if (!manageCommunityId) return
    if (!isAdmin(manageCommunityId, currentEmail)) { toast.warning('仅管理员可设置公告'); return }
    setAnnounceStore(prev => ({ ...prev, [manageCommunityId]: text }))
  }
  const togglePrivacyForManaged = () => {
    if (!manageCommunityId) return
    if (!isAdmin(manageCommunityId, currentEmail)) { toast.warning('仅管理员可切换隐私'); return }
    const cur = privacyStore[manageCommunityId] || 'public'
    setPrivacyStore(prev => ({ ...prev, [manageCommunityId]: cur === 'public' ? 'private' : 'public' }))
  }
  const isAdmin = (id: string, email: string) => (adminStore[id] || []).includes(email)
  const toggleAdminRole = (email: string) => {
    if (!manageCommunityId) return
    if (!isAdmin(manageCommunityId, currentEmail)) { toast.warning('仅管理员可更改角色'); return }
    setAdminStore(prev => {
      const list = prev[manageCommunityId!] || []
      const next = list.includes(email) ? list.filter(e => e !== email) : [...list, email]
      return { ...prev, [manageCommunityId!]: next }
    })
  }
  const startEditCommunity = (c: Community) => {
    setEditDraft({ id: c.id, name: c.name, desc: c.description, tags: c.tags.join(',') })
  }
  const cancelEditCommunity = () => setEditDraft(null)
  const saveEditCommunity = () => {
    if (!editDraft) return
    const name = editDraft.name.trim()
    const desc = editDraft.desc.trim()
    const tags = editDraft.tags.split(',').map(t => t.trim()).filter(Boolean)
    if (!name || !desc) { toast.warning('名称与简介不能为空'); return }
    setUserCommunities(prev => prev.map(c => c.id === editDraft.id ? { ...c, name, description: desc, tags } : c))
    toast.success('已保存社群信息')
    setEditDraft(null)
  }

  // 中文注释：搜索输入防抖，提升性能与体验
  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedThreadSearch(threadSearch.trim())
    }, 300)
    return () => clearTimeout(h)
  }, [threadSearch])

  // 中文注释：格式化倒计时文本（天/小时/分钟）
  const formatRemain = (ms: number) => {
    if (ms <= 0) return '已到期'
    const m = Math.floor(ms / 60000)
    const d = Math.floor(m / 1440)
    const h = Math.floor((m % 1440) / 60)
    const mm = m % 60
    if (d > 0) return `${d}天${h}小时${mm}分钟`
    if (h > 0) return `${h}小时${mm}分钟`
    return `${mm}分钟`
  }

  // 优化：降低定时任务的检查频率，从10秒改为30秒，减少不必要的计算和localStorage写入
  useEffect(() => {
    const timer = setInterval(() => {
      setScheduled(prev => {
        const now = Date.now()
        let hasChanges = false
        
        const next = prev.map(it => {
          if (it.time <= now && !it.published) {
            hasChanges = true
            // 中文注释：到点自动生成讨论帖并标记为已发布
            const thread: Thread = {
              id: `t-${Date.now()}`,
              title: it.title,
              content: it.content,
              createdAt: Date.now(),
              replies: [],
              topic: it.targetMode === 'style' ? it.targetValue : it.targetValue,
              upvotes: 0,
            }
            const nextThreads = [thread, ...threads]
            setThreads(nextThreads)
            localStorage.setItem(THREAD_KEY, JSON.stringify(nextThreads))
            return { ...it, published: true }
          }
          return it
        })
        
        // 只有在有变化时才写入localStorage
        if (hasChanges) {
          localStorage.setItem(SCHEDULE_KEY, JSON.stringify(next))
        }
        
        return next
      })
    }, 30000) // 中文注释：每30秒检查一次定时任务是否到期
    
    return () => clearInterval(timer)
  }, [])

  // 优化：降低时间更新的频率，从30秒改为60秒，减少不必要的状态更新
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(tick)
  }, [])

  const pickStyle = (title: string) => {
    const t = title.toLowerCase()
    if (/[国潮]/.test(title)) return '国潮'
    if (t.includes('cyberpunk') || /赛博/.test(title)) return '赛博朋克'
    if (/复古|vintage/i.test(title)) return '复古'
    if (/手绘|插画/.test(title)) return '手绘插画'
    if (/线稿|黑白/.test(title)) return '黑白线稿'
    if (/景德镇|青花瓷|蓝白/.test(title)) return '蓝白瓷'
    if (/极简|minimal/i.test(title)) return '极简'
    return '国潮'
  }
  const pickTopic = (title: string) => {
    if (/同仁堂|老字号/.test(title)) return '老字号'
    if (/非遗|技艺/.test(title)) return '非遗'
    if (/京剧|戏/.test(title)) return '京剧'
    if (/景德镇|瓷/.test(title)) return '景德镇'
    if (/高校|社团|校园/.test(title)) return '校园社团'
    return '老字号'
  }

  const insertRandomIdea = () => {
    const baseTitle = mode === 'style' ? `${selectedStyle}风格联名海报设计讨论` : `${selectedTopic}主题传播视觉讨论`
    const baseContent = mode === 'style'
      ? `围绕「${selectedStyle}」视觉风格，分享你的配色、版式与元素融合建议；欢迎附上参考图或草图。`
      : `围绕「${selectedTopic}」主题的传播视觉，讨论关键词选取、图文编排与落地物料。`
    setNewTitle(baseTitle)
    setNewContent(baseContent)
  }

  // 优化：使用useMemo缓存计算结果，减少不必要的计算
  const filteredPosts = useMemo(() => {
    if (!posts.length) return []
    return posts.filter(p => {
      if (mode === 'style') {
        return pickStyle(p.title) === selectedStyle
      } else {
        return pickTopic(p.title) === selectedTopic
      }
    })
  }, [posts, mode, selectedStyle, selectedTopic])

  // 优化：减少hotTopics的计算复杂度
  const hotTopics = useMemo(() => {
    if (!posts.length) return []
    const keywords = ['国潮', '非遗', '京剧', '景德镇', '老字号', '校园']
    const map: Record<string, number> = {}
    
    // 简化计算逻辑，减少嵌套循环的计算量
    for (const p of posts) {
      const title = p.title.toLowerCase()
      for (const k of keywords) {
        if (title.includes(k)) {
          map[k] = (map[k] || 0) + (p.likes || 0) + (p.comments?.length || 0)
        }
      }
    }
    
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [posts])

  const submitThread = () => {
    const t = newTitle.trim()
    const c = newContent.trim()
    // 中文注释：简单敏感词拦截，防广告/不当词
    const BANNED = ['广告', '违规']
    if (!t || !c) return
    if (BANNED.some(w => t.includes(w) || c.includes(w))) return
    const thread: Thread = { id: `t-${Date.now()}`, title: t, content: c, createdAt: Date.now(), replies: [], topic: mode === 'style' ? selectedStyle : selectedTopic, upvotes: 0 }
    const next = [thread, ...threads]
    setThreads(next)
    localStorage.setItem(THREAD_KEY, JSON.stringify(next))
    setNewTitle('')
    setNewContent('')
    toast.success('帖子已发布') // 中文注释：操作反馈
  }

  const addReply = (id: string) => {
    const text = (replyText[id] || '').trim()
    if (!text) return
    const next = threads.map(t => t.id === id ? { ...t, replies: [...t.replies, { id: `r-${Date.now()}`, content: text, createdAt: Date.now() }] } : t)
    setThreads(next)
    localStorage.setItem(THREAD_KEY, JSON.stringify(next))
    setReplyText(prev => ({ ...prev, [id]: '' }))
    toast.success('回复已添加') // 中文注释：操作反馈
  }

  const togglePin = (id: string) => {
    const next = threads.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t)
    setThreads(next)
    localStorage.setItem(THREAD_KEY, JSON.stringify(next))
    toast.success('置顶状态已更新')
  }

  const upvote = (id: string) => {
    if (upvoteGuard[id]) { toast.info('已点过赞'); return }
    const next = threads.map(t => t.id === id ? { ...t, upvotes: (t.upvotes || 0) + 1 } : t)
    setThreads(next)
    localStorage.setItem(THREAD_KEY, JSON.stringify(next))
    const guardNext = { ...upvoteGuard, [id]: true }
    setUpvoteGuard(guardNext)
    localStorage.setItem(UPVOTE_GUARD_KEY, JSON.stringify(guardNext))
  }

  const removeThread = (id: string) => {
    const next = threads.filter(t => t.id !== id)
    setThreads(next)
    localStorage.setItem(THREAD_KEY, JSON.stringify(next))
    toast.success('帖子已删除')
  }

  const removeReply = (tid: string, rid: string) => {
    const next = threads.map(t => t.id === tid ? { ...t, replies: t.replies.filter(r => r.id !== rid) } : t)
    setThreads(next)
    localStorage.setItem(THREAD_KEY, JSON.stringify(next))
    toast.success('回复已删除')
  }

  const toggleFavoriteThread = (id: string) => {
    setFavoriteThreads(prev => prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev])
  }

  const deleteMessage = (id?: string) => {
    if (!id) return
    setMessages(prev => prev.filter(m => m.id !== id))
  }
  const togglePinMessage = (id?: string) => {
    if (!id) return
    setMessages(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m))
  }

  const saveAnnouncement = () => {
    localStorage.setItem(ANNOUNCE_KEY, JSON.stringify(announcement || ''))
    setAnnounceSaved(true)
    toast.success('公告已保存')
  }

  const schedulePost = () => {
    const t = scheduledTitle.trim()
    const c = scheduledContent.trim()
    const time = Date.parse(scheduledTime)
    if (!t || !c || isNaN(time)) return
    const targetValue = mode === 'style' ? selectedStyle : selectedTopic
    const item = { id: `s-${Date.now()}`, title: t, content: c, time, published: false, targetMode: mode, targetValue }
    const next = [item, ...scheduled]
    setScheduled(next)
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(next))
    setScheduledTitle('')
    setScheduledContent('')
    setScheduledTime('')
    toast.success('已添加到定时任务')
  }

  const publishScheduled = (id: string) => {
    const it = scheduled.find(x => x.id === id)
    if (!it) return
    const thread: Thread = { id: `t-${Date.now()}`, title: it.title, content: it.content, createdAt: Date.now(), replies: [], topic: it.targetValue, upvotes: 0 }
    const nextThreads = [thread, ...threads]
    setThreads(nextThreads)
    localStorage.setItem(THREAD_KEY, JSON.stringify(nextThreads))
    const next = scheduled.map(x => x.id === id ? { ...x, published: true } : x)
    setScheduled(next)
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(next))
    toast.success('定时任务已发布')
  }

  const removeScheduled = (id: string) => {
    const next = scheduled.filter(s => s.id !== id)
    setScheduled(next)
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(next))
    toast.success('定时任务已删除')
  }

  const convertToSquarePost = (t: Thread) => {
    const title = t.title
    const thumb = `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(title)}&image_size=1024x1024`
    postsApi.addPost({
      title,
      thumbnail: thumb,
      category: 'design',
      tags: [],
      description: '',
      creativeDirection: '',
      culturalElements: [],
      colorScheme: [],
      toolsUsed: []
    })
    const current = postsApi.getPosts()
    setPosts(current)
  }

  // 中文注释：创作者与社群交互函数
  const toggleFollow = (name: string) => {
    setFollowedCreators(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }
  const openProfile = (creator: Creator) => { setActiveCreator(creator); setProfileOpen(true) }
  const closeProfile = () => setProfileOpen(false)
  const toggleJoinCommunity = (id: string) => {
    setJoinedCommunities(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const createCommunity = () => {
    const name = newCommunityName.trim()
    const desc = newCommunityDesc.trim()
    const tags = newCommunityTags.split(',').map(t => t.trim()).filter(Boolean)
    if (!name) { toast.warning('请输入社群名称'); return }
    if (!desc) { toast.warning('请输入社群简介'); return }
    const id = `uc-${Date.now()}`
    const cover = 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=User%20community%20banner%20minimal%20style'
    const c: Community = { id, name, description: desc, cover, tags, members: 1 }
    setUserCommunities(prev => [c, ...prev])
    setJoinedCommunities(prev => [...prev, id])
    if (currentEmail) setAdminStore(prev => ({ ...prev, [id]: [currentEmail] }))
    setNewCommunityName(''); setNewCommunityDesc(''); setNewCommunityTags('')
    setCommunityTab('user')
    toast.success('已创建社群')
  }
  const openCommunity = (c: Community) => { setActiveCommunity(c); setCommunityOpen(true) }
  const closeCommunity = () => setCommunityOpen(false)
  const sendCommunityMessage = (communityId: string, text: string) => {
    const t = text.trim(); if (!t) return
    if (!joinedCommunities.includes(communityId)) { toast.warning('请先加入该社群再发言'); return }
    const user = mockCreators.find(c => c.online) || mockCreators[0]
    const next: ChatMessage = { id: `cm-${Date.now()}`, user: user.name, text: t, avatar: user.avatar, createdAt: Date.now() }
    setCommunityMessages(prev => {
      const arr = prev[communityId] || []
      const nextArr = [next, ...arr]
      const nextMap = { ...prev, [communityId]: nextArr }
      localStorage.setItem(COMMUNITY_MSG_KEY, JSON.stringify(nextMap))
      return nextMap
    })
    toast.success('已发送到该社群')
  }
  const deleteCommunityMessage = (communityId: string, id: string) => {
    setCommunityMessages(prev => {
      const arr = prev[communityId] || []
      const nextArr = arr.filter(m => m.id !== id)
      const nextMap = { ...prev, [communityId]: nextArr }
      localStorage.setItem(COMMUNITY_MSG_KEY, JSON.stringify(nextMap))
      return nextMap
    })
    toast.success('消息已删除')
  }
  const togglePinCommunityMessage = (communityId: string, id: string) => {
    setCommunityMessages(prev => {
      const arr = prev[communityId] || []
      const nextArr = arr.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m)
      const nextMap = { ...prev, [communityId]: nextArr }
      localStorage.setItem(COMMUNITY_MSG_KEY, JSON.stringify(nextMap))
      return nextMap
    })
    toast.success('置顶状态已更新')
  }
  const deleteCommunity = (id: string) => {
    setUserCommunities(prev => prev.filter(c => c.id !== id))
    setJoinedCommunities(prev => prev.filter(x => x !== id))
    toast.success('已删除社群')
  }

  // 中文注释：推荐社群搜索与排序
  const displayRecommended = useMemo(() => {
    const q = communitySearch.trim().toLowerCase()
    let list = recommendedCommunities.filter(c => {
      const text = `${c.name} ${c.description} ${c.tags.join(' ')}`.toLowerCase()
      return q ? text.includes(q) : true
    })
    if (communitySort === 'members') {
      list = list.slice().sort((a, b) => b.members - a.members)
    } else {
      list = list.slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans'))
    }
    return list
  }, [communitySearch, communitySort])
  // 中文注释：已加入社群（包含官方推荐与用户自建两类）
  const joinedList = useMemo(() => {
    const all = [...recommendedCommunities, ...userCommunities]
    return all.filter(c => joinedCommunities.includes(c.id))
  }, [joinedCommunities, userCommunities])
  // 中文注释：用于左侧“社群列表”栏的搜索过滤（只作用于已加入社群）
  const chatJoinedList = useMemo(() => {
    const q = chatSearch.trim().toLowerCase()
    const base = joinedList.filter(c => q ? `${c.name} ${c.description} ${c.tags.join(' ')}`.toLowerCase().includes(q) : true)
    const pinned = base.filter(c => pinnedJoined.includes(c.id))
    const others = base.filter(c => !pinnedJoined.includes(c.id))
    return [...pinned, ...others]
  }, [joinedList, chatSearch, pinnedJoined])
  // 中文注释：进入的社群展示（置顶优先、支持搜索过滤）
  const displayJoined = useMemo(() => {
    const q = joinedSearch.trim().toLowerCase()
    let base = joinedList.filter(c => q ? `${c.name} ${c.description} ${c.tags.join(' ')}`.toLowerCase().includes(q) : true)
    if (hideMuted) base = base.filter(c => !mutedCommunities.includes(c.id))
    if (!preferPinned) return base
    const pinned = base.filter(c => pinnedJoined.includes(c.id))
    const others = base.filter(c => !pinnedJoined.includes(c.id))
    return [...pinned, ...others]
  }, [joinedList, joinedSearch, pinnedJoined, preferPinned, hideMuted, mutedCommunities])

  return (

      <main className="container mx-auto px-4 py-10">
        {/* 中文注释：统一使用通用渐变英雄组件 */}
        <GradientHero
          title={communityContext === 'cocreation' ? '共创社群' : '创作者社区'}
          subtitle={communityContext === 'cocreation' ? '管理我创建的社群，查看我加入的社群，一起共创。' : '发现国潮与非遗的高质内容，结识优秀创作者，参与共创。'}
          badgeText="Beta"
          theme={communityContext === 'cocreation' ? 'indigo' : 'blue'}
          variant="split"
          size="md"
          pattern={communityContext === 'cocreation'}
          stats={[
            { label: '在看', value: '热度' },
            { label: '精选', value: '优选' },
            { label: '创作者', value: '社区' },
            { label: '话题', value: '标签' },
          ]}
        />



        {/* 中文注释：横向社群列表条（置于聊天模块上方，便于快速切换社群） */}
        {communityContext === 'cocreation' && communityTab === 'joined' && (
          <div className={`sticky top-16 z-40 mb-4 ${isDark ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-md rounded-2xl p-3 ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} shadow-sm`}> 
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">我加入的社群</div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{joinedList.length} 个</div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 min-w-full">
                {joinedList.length === 0 ? (
                  <div className="text-sm opacity-60 px-2 py-1">暂无已加入社群</div>
                ) : (
                  joinedList.map(c => (
                    <button key={`strip-${c.id}`} onClick={() => setActiveChatCommunityId(c.id)} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs whitespace-nowrap ring-1 transition-colors ${activeChatCommunityId === c.id ? (isDark ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-indigo-600 text-white ring-indigo-600') : (isDark ? 'bg-gray-700 text-gray-200 ring-gray-700 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 ring-gray-200 hover:bg-gray-200')}`}>
                      <span className="font-medium">{c.name}</span>
                      {pinnedJoined.includes(c.id) && (<span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-indigo-100 text-indigo-700'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-indigo-200'}`}>置顶</span>)}
                      {mutedCommunities.includes(c.id) && (<span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}>静音</span>)}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        {/* 中文注释：社群列表 + 聊天双栏布局（仅在共创社群“进入的社群”标签显示；置于页面上方便于发现） */}
        {communityContext === 'cocreation' && communityTab === 'joined' && (
          <CommunityChat
            isDark={isDark}
            joinedCommunities={joinedCommunities}
            recommendedCommunities={recommendedCommunities}
            userCommunities={userCommunities}
            activeChatCommunityId={activeChatCommunityId}
            onActiveChatCommunityChange={setActiveChatCommunityId}
            pinnedJoined={pinnedJoined}
            onTogglePinJoined={togglePinJoined}
            mutedCommunities={mutedCommunities}
            onToggleMuteCommunity={toggleMuteCommunity}
            communityMessages={communityMessages}
            onCommunityMessagesChange={setCommunityMessages}
            mockCreators={mockCreators}
          />
        )}

        {/* 中文注释：社群板块（推荐社群 / 我创建的社群 / 进入的社群），上下文配色区分 */}
        <motion.section
          className={`mb-6 rounded-2xl shadow-md p-4 ${communityContext === 'cocreation' ? (isDark ? 'bg-gray-800' : 'bg-gradient-to-br from-rose-50 to-pink-50') : (isDark ? 'bg-gray-800' : 'bg-white')}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">社群</h3>
            {communityContext === 'creator' ? (
              <div className="flex gap-2">
                <button onClick={() => setCommunityTab('recommended')} className={`text-xs px-3 py-1 rounded-full ring-1 ${communityTab === 'recommended' ? 'bg-purple-600 text-white ring-purple-600' : (isDark ? 'bg-gray-800 text-gray-300 ring-gray-700' : 'bg-white text-gray-700 ring-gray-200')}`}>推荐社群</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setCommunityTab('user')} className={`text-xs px-3 py-1 rounded-full ring-1 ${communityTab === 'user' ? 'bg-purple-600 text-white ring-purple-600' : (isDark ? 'bg-gray-800 text-gray-300 ring-gray-700' : 'bg-white text-gray-700 ring-gray-200')}`}>我创建的社群</button>
                <button onClick={() => setCommunityTab('joined')} className={`text-xs px-3 py-1 rounded-full ring-1 ${communityTab === 'joined' ? 'bg-purple-600 text-white ring-purple-600' : (isDark ? 'bg-gray-800 text-gray-300 ring-gray-700' : 'bg-white text-gray-700 ring-gray-200')}`}>进入的社群</button>
              </div>
            )}
          </div>
          {communityTab === 'recommended' && communityContext === 'creator' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <input value={communitySearch} onChange={e => setCommunitySearch(e.target.value)} placeholder="搜索社群关键词..." className={`${isDark ? 'bg-gray-800 text-white ring-1 ring-gray-700' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg flex-1 focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`} />
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => setCommunitySort('members')} className={`text-xs px-3 py-2 rounded-lg ring-1 ${communitySort === 'members' ? 'bg-purple-600 text-white ring-purple-600' : (isDark ? 'bg-gray-800 text-gray-300 ring-gray-700' : 'bg-white text-gray-700 ring-gray-200')}`}>按人数</button>
                  <button onClick={() => setCommunitySort('alphabet')} className={`text-xs px-3 py-2 rounded-lg ring-1 ${communitySort === 'alphabet' ? 'bg-purple-600 text-white ring-purple-600' : (isDark ? 'bg-gray-800 text-gray-300 ring-gray-700' : 'bg-white text-gray-700 ring-gray-200')}`}>按名称</button>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden shadow-md">
                <VirtualList
                  items={displayRecommended}
                  renderItem={(item, index: number) => {
                    const c = item as Community;
                    return (
                    <div key={c.id} className={`${isDark ? 'bg-gray-800' : 'bg-white'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-lg`}>
                      <div className="relative">
                        <TianjinImage src={c.cover} alt={c.name} className="w-full object-cover transition-transform duration-500 hover:scale-105" ratio="landscape" />
                        <div className="absolute top-3 right-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-black/40 text-gray-200' : 'bg-white/70 text-gray-700'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}>官方</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="font-medium mb-1 line-clamp-1">{c.name}</div>
                        <div className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} line-clamp-2`}>{c.description}</div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {c.tags.map((t: string, i: number) => (
                            <button key={i} onClick={() => setSelectedStyle(t)} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} transition-colors hover:opacity-80`}>#{t}</button>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{c.members + (joinedCommunities.includes(c.id) ? 1 : 0)} 人加入</div>
                          <button onClick={() => toggleJoinCommunity(c.id)} className={`text-xs px-3 py-1 rounded-full transition-all ${joinedCommunities.includes(c.id) ? 'bg-blue-600 text-white hover:bg-blue-700' : (isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}`}>{joinedCommunities.includes(c.id) ? '已加入' : '加入'}</button>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button onClick={() => openCommunity(c)} className={`${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} text-xs px-3 py-1 rounded-lg transition-colors`}>查看详情</button>
                        </div>
                      </div>
                    </div>
                    );
                  }}
                  columns={3} // 根据屏幕尺寸动态调整列数（组件内部会自动响应式处理）
                  isDark={isDark}
                />
              </div>
            </div>
          )}
          {communityTab === 'user' && (
            <CommunityManagement
              isDark={isDark}
              userCommunities={userCommunities}
              onUserCommunitiesChange={setUserCommunities}
              joinedCommunities={joinedCommunities}
              onJoinedCommunitiesChange={setJoinedCommunities}
              adminStore={adminStore}
              onAdminStoreChange={setAdminStore}
              memberStore={memberStore}
              onMemberStoreChange={setMemberStore}
              announceStore={announceStore}
              onAnnounceStoreChange={setAnnounceStore}
              privacyStore={privacyStore}
              onPrivacyStoreChange={setPrivacyStore}
              currentEmail={currentEmail}
              communityTab={communityTab}
              onCommunityTabChange={setCommunityTab}
            />
          )}
          {communityTab === 'joined' && communityContext === 'cocreation' && (
            <div>
              <div className="text-sm opacity-70 mb-2">我已加入的社群</div>
              <div className="mb-3 flex items-center gap-2">
                <input value={joinedSearch} onChange={e => setJoinedSearch(e.target.value)} placeholder="搜索我加入的社群..." className={`${isDark ? 'bg-gray-800 text-white ring-1 ring-gray-700' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg flex-1 focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`} />
                <button onClick={() => setPreferPinned(p => !p)} className={`text-xs px-2 py-0.5 rounded-full ${preferPinned ? 'bg-indigo-600 text-white ring-1 ring-indigo-600' : (isDark ? 'bg-gray-700 text-white ring-1 ring-gray-700' : 'bg-gray-100 text-gray-900 ring-1 ring-gray-200')}`}>{preferPinned ? '置顶优先' : '默认排序'}</button>
                <button onClick={() => setHideMuted(h => !h)} className={`text-xs px-2 py-0.5 rounded-full ${(isDark ? 'bg-gray-700 text-white ring-1 ring-gray-700' : 'bg-gray-100 text-gray-900 ring-1 ring-gray-200')}`}>{hideMuted ? '隐藏静音: 开' : '隐藏静音: 关'}</button>
              </div>
              {joinedList.length === 0 ? (
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>暂无已加入社群，先在推荐社群里点击“加入”。</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {displayJoined.map(c => (
                    <div key={c.id} className={`${isDark ? 'bg-gray-800' : 'bg-white/80'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-indigo-200'} rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-4 hover:shadow-lg`}>
                      <TianjinImage src={c.cover} alt={c.name} className="w-full object-cover" ratio="landscape" />
                      <div className="p-4">
                        <div className="font-medium mb-1 flex items-center gap-2">
                          {c.name}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-indigo-100 text-indigo-700'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-indigo-200'}`}>已加入</span>
                          {pinnedJoined.includes(c.id) && (<span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-indigo-100 text-indigo-700'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-indigo-200'}`}>置顶</span>)}
                          {mutedCommunities.includes(c.id) && (<span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}>静音</span>)}
                        </div>
                        <div className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{c.description}</div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {c.tags.map((t, i) => (
                            <span key={i} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>#{t}</span>
                          ))}
                        </div>
                        {/* 中文注释：卡片信息条（成员数量与公告摘要；推荐社群兼容显示） */}
                        <div className={`text-xs opacity-70 mb-2 flex items-center gap-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {/* 中文注释：点击成员数展开只读成员列表 */}
                          <button onClick={() => setExpandedMembersId(expandedMembersId === c.id ? null : c.id)} className={`${isDark ? 'hover:text-white' : 'hover:text-gray-900'} flex items-center gap-1`}>
                            <span>成员 {c.id.startsWith('uc-') ? (memberStore[c.id]?.length || 0) + 1 : c.members + (joinedCommunities.includes(c.id) ? 1 : 0)}</span>
                            <span className={`inline-block w-4 h-4 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></span>
                          </button>
                          <span>公告 {(announceStore[c.id] && announceStore[c.id]!.slice(0, 18)) || '暂无公告'}</span>
                          {privacyStore[c.id] && (
                            <span className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{(privacyStore[c.id] || 'public') === 'private' ? '私密' : '公开'}</span>
                          )}
                        </div>
                        {expandedMembersId === c.id && (
                          <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-2 mb-2`}> 
                            {/* 中文注释：只读成员列表（推荐社群仅显示本人；自建社群显示创建者+成员） */}
                            <div className="text-xs opacity-70 mb-1">成员列表（只读）</div>
                            {(() => {
                              const base = c.id.startsWith('uc-') ? [currentEmail, ...(memberStore[c.id] || [])] : [currentEmail].filter(Boolean)
                              if (!base.length) return <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>暂无成员可显示</div>
                              return (
                                <ul className="text-xs space-y-1">
                                  {base.map((email, idx) => (
                                    <li key={`${c.id}-m-${idx}`} className="flex items-center gap-2">
                                      <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`}></span>
                                      <span>{email}</span>
                                      {idx === 0 && c.id.startsWith('uc-') && (
                                        <span className={`ml-1 px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-rose-100 text-rose-700'}`}>创建者</span>
                                      )}
                                      {adminStore[c.id]?.includes(email) && (
                                        <span className={`ml-1 px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-white' : 'bg-purple-100 text-purple-700'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-purple-200'}`}>管理员</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )
                            })()}
                            <div className="mt-2 flex justify-end">
                              <button onClick={() => setExpandedMembersId(null)} className={`${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'} text-xs px-2 py-1 rounded`}>收起</button>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{c.members + (joinedCommunities.includes(c.id) ? 1 : 0)} 人加入</div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => togglePinJoined(c.id)} className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 text-white' : 'bg-indigo-100 text-indigo-700'}`}>{pinnedJoined.includes(c.id) ? '取消置顶' : '置顶'}</button>
                            <button onClick={() => toggleMuteCommunity(c.id)} className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}>{mutedCommunities.includes(c.id) ? '取消静音' : '静音'}</button>
                            <button onClick={() => toggleJoinCommunity(c.id)} className={`text-xs px-3 py-1 rounded-full ${joinedCommunities.includes(c.id) ? 'bg-red-600 text-white' : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700')}`}>{joinedCommunities.includes(c.id) ? '退出' : '加入'}</button>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button onClick={() => openCommunity(c)} className={`${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'} text-xs px-3 py-1 rounded-lg`}>查看详情</button>
                          <button onClick={() => openManage(c.id)} className={`ml-2 text-xs px-3 py-1 rounded-lg ${isDark ? 'bg-gray-700 text-white' : 'bg-indigo-100 text-indigo-700'}`}>成员/公告</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.section>
        {manageCommunityId && (
          <div className="fixed inset-y-0 right-0 w-full max-w-md z-40">
            <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} h-full ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} shadow-xl p-4 flex flex-col`}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">社群管理</div>
                <button onClick={closeManage} className={`${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'} text-xs px-3 py-1 rounded-lg`}>关闭</button>
              </div>
              <div className="text-xs mb-3">
                <span className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-white' : 'bg-rose-100 text-rose-700'}`}>我创建的社群</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-white' : 'bg-indigo-100 text-indigo-700'}`}>{privacyStore[manageCommunityId] === 'private' ? '私密' : '公开'}</span>
              </div>
              <div className="mb-4">
                <div className="font-medium mb-2">成员管理</div>
                <div className="flex gap-2 mb-2">
                  <input value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} placeholder="成员邮箱" className={`${isDark ? 'bg-gray-800 text-white ring-1 ring-gray-700' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 rounded-lg flex-1 focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`} disabled={!isAdmin(manageCommunityId!, currentEmail)} />
                  <button onClick={addMember} className={`text-xs px-3 py-2 rounded-lg ${isDark ? 'bg-purple-700 text-white' : 'bg-purple-600 text-white'}`} disabled={!isAdmin(manageCommunityId!, currentEmail)}>添加</button>
                </div>
                <ul className="space-y-2 max-h-36 overflow-y-auto">
                  {(memberStore[manageCommunityId] || []).length === 0 ? (
                    <li className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>暂无成员</li>
                  ) : (
                    (memberStore[manageCommunityId] || []).map(email => (
                      <li key={email} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{email}</span>
                          {isAdmin(manageCommunityId!, email) && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-white' : 'bg-purple-100 text-purple-700'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-purple-200'}`}>管理员</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleAdminRole(email)} className={`text-xs px-2 py-1 rounded ${isAdmin(manageCommunityId!, email) ? (isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900') : (isDark ? 'bg-purple-700 text-white' : 'bg-purple-600 text-white')}`}>{isAdmin(manageCommunityId!, email) ? '取消管理员' : '设为管理员'}</button>
                          <button onClick={() => removeMember(email)} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'}`}>移除</button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="mb-4">
                <div className="font-medium mb-2">公告设置</div>
                <textarea value={announceStore[manageCommunityId] || ''} onChange={e => setAnnouncementForManaged(e.target.value)} className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} w-full h-24 px-3 py-2 rounded-lg border`} placeholder="输入公告内容" disabled={!isAdmin(manageCommunityId!, currentEmail)} />
              </div>
              <div className="mb-4">
                <div className="font-medium mb-2">隐私设置</div>
                <button onClick={togglePrivacyForManaged} className={`text-xs px-3 py-2 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}`} disabled={!isAdmin(manageCommunityId!, currentEmail)}>{privacyStore[manageCommunityId] === 'private' ? '改为公开' : '改为私密'}</button>
              </div>
              <div className="mt-auto text-xs opacity-70">设置将自动保存到本地，不影响其他用户；非管理员仅可查看</div>
            </div>
          </div>
        )}
        

        {/* 中文注释：活跃创作者（关注/详情） */}
        {communityContext === 'cocreation' && (
        <motion.section
          className={`mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-4`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">活跃创作者</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>实时</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {mockCreators.map((c) => (
              <div key={c.name} className="flex items-center p-2 rounded-xl">
                <TianjinAvatar src={c.avatar} alt={c.name} size="md" online={c.online} onClick={() => openProfile(c)} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{c.role}</div>
                </div>
                <button onClick={() => toggleFollow(c.name)} className={`text-xs px-3 py-1 rounded-full transition-colors ${followedCreators.includes(c.name) ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}`}>{followedCreators.includes(c.name) ? '已关注' : '关注'}</button>
              </div>
            ))}
          </div>
        </motion.section>
        )}

        {/* 中文注释：社群讨论区（轻量消息流 + 发言框） */}
        {communityContext === 'cocreation' && (
        <motion.section
          className={`mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-4`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h3 className="font-medium mb-3">社群讨论区</h3>
          <CommunityDiscussionSection isDark={isDark} messages={messages} onSend={(text: string) => {
            const user = mockCreators.find(c => c.online) || mockCreators[0]
            const next = { id: `m-${Date.now()}`, user: user.name, text, avatar: user.avatar, createdAt: Date.now(), pinned: false }
            setMessages(prev => [next, ...prev])
            toast.success('已发送到社群')
          }} showModeration onDelete={deleteMessage} onTogglePin={togglePinMessage} />
        </motion.section>
        )}
        {/* 中文注释：公告栏 */}
        {communityContext === 'cocreation' && (
        <div className={`mb-6 rounded-2xl p-4 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 shadow-lg' : 'bg-white ring-1 ring-gray-200 shadow-lg'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium flex items-center gap-2">
              <span className="flex items-center gap-2"><i className="fas fa-bullhorn text-red-600"></i>社区公告</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${announceSaved ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900') : 'bg-yellow-500 text-white'}`}>{announceSaved ? '已保存' : '未保存'}</span>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={saveAnnouncement} aria-label="保存公告" className="text-sm px-3 py-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm">保存公告</motion.button>
          </div>
          <textarea
            value={announcement}
            onChange={e => { setAnnouncement(e.target.value); setAnnounceSaved(false) }}
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveAnnouncement() } }}
            className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} w-full h-20 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors`}
            placeholder="输入公告内容"
            aria-label="社区公告内容"
          />
        </div>
        )}

        {/* 中文注释：社区讨论区（发帖+置顶+回复） */}
        {communityContext === 'cocreation' && (
          <CommunityDiscussion
            isDark={isDark}
            threads={threads}
            onThreadsChange={setThreads}
            mode={mode}
            selectedStyle={selectedStyle}
            selectedTopic={selectedTopic}
            newTitle={newTitle}
            onNewTitleChange={setNewTitle}
            newContent={newContent}
            onNewContentChange={setNewContent}
            threadSearch={threadSearch}
            onThreadSearchChange={setThreadSearch}
            threadSort={threadSort}
            onThreadSortChange={setThreadSort}
            favOnly={favOnly}
            onFavOnlyChange={setFavOnly}
            favoriteThreads={favoriteThreads}
            onFavoriteThreadsChange={setFavoriteThreads}
            replyText={replyText}
            onReplyTextChange={setReplyText}
            threadDraft={threadDraft}
            onThreadDraftChange={setThreadDraft}
            hotTopics={hotTopics}
            STYLE_LIST={STYLE_LIST}
            TOPIC_LIST={TOPIC_LIST}
            onModeChange={setMode}
            onSelectedStyleChange={setSelectedStyle}
            onSelectedTopicChange={setSelectedTopic}
            onInsertRandomIdea={insertRandomIdea}
            upvoteGuard={upvoteGuard}
            onUpvoteGuardChange={setUpvoteGuard}
          />
        )}

        {/* 中文注释：运营工具（公告、定时发布） */}
        {communityContext === 'cocreation' && (
          <ScheduledPost
            isDark={isDark}
            scheduled={scheduled}
            onScheduledChange={setScheduled}
            scheduledTitle={scheduledTitle}
            onScheduledTitleChange={setScheduledTitle}
            scheduledContent={scheduledContent}
            onScheduledContentChange={setScheduledContent}
            scheduledTime={scheduledTime}
            onScheduledTimeChange={setScheduledTime}
            mode={mode}
            onModeChange={setMode}
            selectedStyle={selectedStyle}
            onSelectedStyleChange={setSelectedStyle}
            selectedTopic={selectedTopic}
            onSelectedTopicChange={setSelectedTopic}
            STYLE_LIST={STYLE_LIST}
            TOPIC_LIST={TOPIC_LIST}
            now={now}
            threads={threads}
            onThreadsChange={setThreads}
          />
        )}

        {/* 中文注释：当前子社区相关作品（从本地帖子抽取） */}
        {communityContext === 'cocreation' && (
          <>
            <div className="mb-2 font-medium">相关作品（本地）</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredPosts.slice(0, 6).map(p => (
                <motion.div key={p.id} whileHover={{ y: -5 }} className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-4`}>
                  <TianjinImage src={p.thumbnail || `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(p.title)}&image_size=1024x1024`} alt={p.title} className="w-full h-40 object-cover rounded-lg mb-3" ratio="landscape" />
                  <div className="font-medium text-sm">{p.title}</div>
                  <div className="text-xs opacity-70">点赞 {p.likes} • 评论 {p.comments.length}</div>
                </motion.div>
              ))}
              {filteredPosts.length === 0 && (
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-4 text-sm opacity-60`}>暂无相关作品</div>
              )}
            </div>
          </>
        )}

        {/* 中文注释：创作者详情弹窗 */}
        {profileOpen && activeCreator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'} backdrop-blur-sm`}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-md w-full mx-4 overflow-hidden`}
            >
              <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <h3 className="text-lg font-bold">创作者详情</h3>
                <button onClick={closeProfile} className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`} aria-label="关闭">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <TianjinImage src={activeCreator.avatar} alt={activeCreator.name} className="w-12 h-12 rounded-full mr-3 ring-1 ring-gray-300" ratio="square" />
                  <div>
                    <div className="font-medium">{activeCreator.name}</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{activeCreator.role}</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-sm opacity-70 mb-1">徽章</div>
                  <div className="flex flex-wrap gap-2">
                    {(creatorBadges[activeCreator.name] || []).map(b => (
                      <span key={b.id} className={`text-xs px-2 py-1 rounded-full text-white ${b.color}`}>{b.name}</span>
                    ))}
                    {!(creatorBadges[activeCreator.name] || []).length && (
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>暂无徽章</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => toggleFollow(activeCreator.name)} className={`px-4 py-2 rounded-lg text-sm ${followedCreators.includes(activeCreator.name) ? 'bg-blue-600 text-white' : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}`}>{followedCreators.includes(activeCreator.name) ? '已关注' : '关注'}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 中文注释：社群详情弹窗 */}
        {communityOpen && activeCommunity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'} backdrop-blur-sm`}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-lg w-full mx-4 overflow-hidden`}
            >
              <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <h3 className="text-lg font-bold">社群详情</h3>
                <button onClick={closeCommunity} className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`} aria-label="关闭">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <TianjinImage src={activeCommunity.cover} alt={activeCommunity.name} className="w-full object-cover rounded-lg" ratio="landscape" />
                <div className="mt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-lg">{activeCommunity.name}</div>
                    <div className="flex flex-col items-end">
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>成员数</div>
                      <div className="text-lg font-semibold">{activeCommunity.members + (joinedCommunities.includes(activeCommunity.id) ? 1 : 0)}</div>
                    </div>
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{activeCommunity.description}</div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activeCommunity.tags.map((t, i) => (
                      <span key={i} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>#{t}</span>
                    ))}
                  </div>
                  <button onClick={() => toggleJoinCommunity(activeCommunity.id)} className={`w-full py-2 rounded-full ${joinedCommunities.includes(activeCommunity.id) ? 'bg-blue-600 text-white' : 'bg-gradient-to-r from-red-600 to-pink-600 text-white'} transition-colors hover:opacity-90`}>{joinedCommunities.includes(activeCommunity.id) ? '已加入' : '加入'}</button>
                </div>
                <div className="mt-4">
                  <div className="text-sm opacity-70 mb-2">近期讨论预览</div>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {[...(communityMessages[activeCommunity.id] || [])]
                      .sort((a,b) => (Number(b.pinned) - Number(a.pinned)) || ((b.createdAt ?? 0) - (a.createdAt ?? 0)))
                      .slice(0, 3)
                      .map((m, idx) => (
                        <div key={idx} className={`${isDark ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'}`}>
                          <div className="flex items-start">
                            <img src={m.avatar} alt={m.user} className="w-10 h-10 rounded-full mr-3 object-cover" loading="lazy" decoding="async" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium">{m.user}</div>
                                </div>
                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{/* 中文注释：相对时间展示 */}{(() => { const diff = Math.max(0, Date.now() - (m.createdAt || Date.now())); const min = Math.floor(diff/60000); if (min < 1) return '刚刚'; if (min < 60) return `${min} 分钟前`; const h = Math.floor(min/60); if (h < 24) return `${h} 小时前`; const d = Math.floor(h/24); return `${d} 天前`; })()}</div>
                              </div>
                              <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{m.text}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    {((communityMessages[activeCommunity.id] || []).length === 0) && (
                      <div className={`${isDark ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'} text-sm opacity-70`}>暂无交流</div>
                    )}
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">社群交流</div>
                      {!joinedCommunities.includes(activeCommunity.id) && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>加入后可发言</span>
                      )}
                    </div>
                    <CommunityDiscussionSection
                      isDark={isDark}
                      messages={communityMessages[activeCommunity.id] || []}
                      onSend={(t: string) => sendCommunityMessage(activeCommunity.id, t)}
                      canSend={joinedCommunities.includes(activeCommunity.id)}
                      showModeration={joinedCommunities.includes(activeCommunity.id)}
                      onDelete={(id: string) => deleteCommunityMessage(activeCommunity.id, id)}
                      onTogglePin={(id: string) => togglePinCommunityMessage(activeCommunity.id, id)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 文化元素连连看游戏 */}
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>}>
          <CulturalMatchingGame
            isOpen={gameOpen}
            onClose={() => setGameOpen(false)}
          />
        </Suspense>
      </main>
    )
}

// 中文注释：社群讨论区（轻量消息）组件
function CommunityDiscussionSection({ isDark, messages, onSend, canSend = true, onDelete, onTogglePin, showModeration = false }: { isDark: boolean; messages: ChatMessage[]; onSend: (text: string) => void; canSend?: boolean; onDelete?: (id: string) => void; onTogglePin?: (id: string) => void; showModeration?: boolean }) {
  const [text, setText] = useState('');
  return (
    <div>
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
        {[...messages].sort((a,b) => (Number(b.pinned) - Number(a.pinned)) || ((b.createdAt ?? 0) - (a.createdAt ?? 0))).map((m, idx) => (
          <motion.div key={m.id || idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`${isDark ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg ring-1 ${isDark ? 'ring-gray-600' : 'ring-gray-200'}`}>
            <div className="flex items-start">
              <img src={m.avatar} alt={m.user} className="w-10 h-10 rounded-full mr-3 object-cover" loading="lazy" decoding="async" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{m.user}</div>
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{(() => { const diff = Math.max(0, Date.now() - (m.createdAt || Date.now())); const min = Math.floor(diff/60000); if (min < 1) return '刚刚'; if (min < 60) return `${min} 分钟前`; const h = Math.floor(min/60); if (h < 24) return `${h} 小时前`; const d = Math.floor(h/24); return `${d} 天前`; })()}</div>
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{m.text}</div>
                {showModeration && (
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => onTogglePin && m.id && onTogglePin(m.id)} className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} px-2 py-1 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}>{m.pinned ? '取消置顶' : '置顶'}</button>
                    <button onClick={() => onDelete && m.id && onDelete(m.id)} className={`${isDark ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'} px-2 py-1 rounded-lg text-xs`}>删除</button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="发表你的看法..."
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const t = text.trim(); if (!t || !canSend) return; onSend(t); setText(''); } }}
          disabled={!canSend}
          className={`flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600 focus:ring-purple-500' : 'bg-white text-gray-900 ring-1 ring-gray-300 focus:ring-pink-300'} ${!canSend ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
        <button
          onClick={() => { const t = text.trim(); if (!t || !canSend) return; onSend(t); setText(''); }}
          disabled={!canSend}
          className="px-4 py-3 rounded-lg bg-red-600 text-white transition-colors hover:bg-red-700"
        >发送</button>
      </div>
    </div>
  )
}
