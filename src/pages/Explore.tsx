import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout'
import GradientHero from '@/components/GradientHero'
import { isPrefetched } from '@/services/prefetch'
import { TianjinImage } from '@/components/TianjinStyleComponents'
import llmService from '@/services/llmService'
 

type Work = {
  id: number;
  title: string;
  creator: string;
  creatorAvatar: string;
  thumbnail: string;
  likes: number;
  comments: number;
  views: number;
  category: string;
  tags: string[];
  featured: boolean;
};

// 中文注释：本页专注作品探索，社区相关内容已迁移到创作者社区页面

export const mockWorks: Work[] = [
  {
    id: 1,
    title: '国潮新风尚',
    creator: '设计师小明',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20xiaoming',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Modern%20Chinese%20style%20fashion%20design',
    likes: 245,
    comments: 32,
    views: 1240,
    category: '国潮设计',
    tags: ['国潮', '时尚', '现代'],
    featured: true,
  },
  {
    id: 2,
    title: '传统纹样创新',
    creator: '创意总监小李',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20xiaoli',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Traditional%20Chinese%20patterns%20with%20modern%20twist',
    likes: 189,
    comments: 21,
    views: 980,
    category: '纹样设计',
    tags: ['传统', '纹样', '创新'],
    featured: false,
  },
  {
    id: 3,
    title: '老字号品牌焕新',
    creator: '品牌设计师老王',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20laowang',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Traditional%20brand%20modernization%20design',
    likes: 324,
    comments: 45,
    views: 1870,
    category: '品牌设计',
    tags: ['老字号', '品牌', '焕新'],
    featured: true,
  },
  {
    id: 4,
    title: 'AI助力非遗传承',
    creator: '数字艺术家小张',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20xiaozhang',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=AI%20assisted%20intangible%20cultural%20heritage%20preservation',
    likes: 276,
    comments: 38,
    views: 1450,
    category: '非遗传承',
    tags: ['AI', '非遗', '传承'],
    featured: false,
  },
  {
    id: 5,
    title: '东方美学插画',
    creator: '插画师小陈',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20xiaochen',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Oriental%20aesthetics%20illustration',
    likes: 412,
    comments: 56,
    views: 2100,
    category: '插画设计',
    tags: ['东方', '美学', '插画'],
    featured: true,
  },
  {
    id: 6,
    title: '传统工艺数字化',
    creator: '数字设计师小刘',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar%20xiaoli',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Digitalization%20of%20traditional%20craftsmanship',
    likes: 198,
    comments: 24,
    views: 980,
    category: '工艺创新',
    tags: ['传统工艺', '数字化', '创新'],
    featured: false,
  },
  {
    id: 7,
    title: '十八街麻花包装焕新',
    creator: '品牌设计师阿宁',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20Aning',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guifaxiang%20mahua%20modern%20packaging%20design%2C%20cultural%20red%20and%20gold%2C%20studio%20lighting%2C%20high%20detail&image_size=landscape_4_3',
    likes: 256,
    comments: 28,
    views: 1320,
    category: '老字号品牌',
    tags: ['桂发祥', '包装设计', '焕新'],
    featured: true,
  },
  {
    id: 8,
    title: '狗不理联名海报',
    creator: '视觉设计师小谷',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaogu',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Goubuli%20steamed%20buns%20brand%20poster%20design',
    likes: 198,
    comments: 19,
    views: 980,
    category: '老字号品牌',
    tags: ['狗不理', '海报', '联名'],
    featured: false,
  },
  {
    id: 9,
    title: '耳朵眼炸糕IP形象',
    creator: '插画师小禾',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Illustrator%20avatar%20xiaohe',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Erduoyan%20fried%20cake%20brand%20mascot%20illustration%2C%20cute%20IP%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 312,
    comments: 41,
    views: 1760,
    category: 'IP设计',
    tags: ['耳朵眼', 'IP形象', '插画'],
    featured: true,
  },
  {
    id: 10,
    title: '果仁张秋季礼盒',
    creator: '创意总监阿川',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Creative%20director%20avatar%20achuan',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guorenzhang%20candied%20chestnut%20autumn%20gift%20box%2C%20packaging%20design%2C%20warm%20tone%2C%20high%20detail&image_size=landscape_4_3',
    likes: 224,
    comments: 27,
    views: 1128,
    category: '包装设计',
    tags: ['果仁张', '礼盒', '秋季'],
    featured: false,
  }
  ,
  {
    id: 11,
    title: '杨柳青年画主题海报',
    creator: '视觉设计师小苏',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaosu',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Yangliuqing%20New%20Year%20Painting%20poster%2C%20modern%20composition%2C%20vibrant%20colors%2C%20studio%20lighting&image_size=landscape_4_3',
    likes: 338,
    comments: 36,
    views: 1592,
    category: '插画设计',
    tags: ['杨柳青年画', '海报', '民俗'],
    featured: true,
  },
  {
    id: 12,
    title: '泥人张联名公仔包装',
    creator: '包装设计师小羽',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoyu',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Nirenzhang%20clay%20figure%20toy%20packaging%2C%20cultural%20red%20and%20gold%2C%20minimal%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 276,
    comments: 22,
    views: 1180,
    category: '包装设计',
    tags: ['泥人张', '联名', '包装'],
    featured: false,
  },
  {
    id: 13,
    title: '狗不理品牌吉祥物升级',
    creator: 'IP设计师小谷',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaogu',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Goubuli%20brand%20mascot%20upgrade%2C%20cute%20character%20design%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 301,
    comments: 29,
    views: 1406,
    category: 'IP设计',
    tags: ['狗不理', 'IP', '品牌焕新'],
    featured: true,
  },
  {
    id: 14,
    title: '桂发祥联名插画海报',
    creator: '插画师阿宁',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20Aning',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guifaxiang%20mahua%20illustration%20poster%2C%20oriental%20aesthetics%2C%20warm%20tone%2C%20high%20detail&image_size=landscape_4_3',
    likes: 225,
    comments: 18,
    views: 1043,
    category: '插画设计',
    tags: ['桂发祥', '插画', '联名'],
    featured: false,
  },
  {
    id: 15,
    title: '海河文化主题视觉',
    creator: '视觉设计师小海',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoha',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20culture%20visual%20identity%2C%20blue%20palette%2C%20waves%20motif%2C%20modern%20graphic%20design&image_size=landscape_4_3',
    likes: 264,
    comments: 31,
    views: 1311,
    category: '品牌设计',
    tags: ['海河', '视觉识别', '配色'],
    featured: true,
  },
  {
    id: 16,
    title: '相声文化礼盒',
    creator: '包装设计师小岳',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoyue',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20crosstalk%20culture%20gift%20box%20design%2C%20stage%20elements%2C%20red%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 212,
    comments: 17,
    views: 980,
    category: '包装设计',
    tags: ['相声', '礼盒', '文化'],
    featured: false,
  },
  {
    id: 17,
    title: '老美华联名鞋盒',
    creator: '工业设计师小贺',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaohe2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Laomeihua%20shoe%20brand%20shoebox%20design%2C%20craft%20texture%2C%20minimal%20graphic%2C%20high%20detail&image_size=landscape_4_3',
    likes: 178,
    comments: 14,
    views: 812,
    category: '老字号品牌',
    tags: ['老美华', '包装设计', '联名'],
    featured: false,
  },
  {
    id: 18,
    title: '津味配色研究集',
    creator: '设计研究员小白',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaobai',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tianjin%20color%20palette%20study%2C%20swatches%20grid%2C%20design%20system%2C%20high%20detail&image_size=landscape_4_3',
    likes: 295,
    comments: 33,
    views: 1503,
    category: '品牌设计',
    tags: ['配色', '研究', '视觉系统'],
    featured: true,
  },
  {
    id: 19,
    title: '非遗技艺数字教程海报',
    creator: '数字艺术家小唐',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaotang',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20intangible%20heritage%20digital%20tutorial%20poster%2C%20clean%20layout%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 206,
    comments: 16,
    views: 960,
    category: '非遗传承',
    tags: ['教程', '非遗', '海报'],
    featured: false,
  },
  {
    id: 20,
    title: '东方美学字体设计',
    creator: '字体设计师小冯',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaofeng',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Oriental%20aesthetics%20display%20typeface%2C%20specimen%20sheet%2C%20grid%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 342,
    comments: 40,
    views: 1821,
    category: '品牌设计',
    tags: ['字体', '东方美学', '视觉'],
    featured: true,
  }
  ,
  {
    id: 21,
    title: '京剧元素海报联名',
    creator: '视觉设计师小戏',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoxi',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20poster%20modern%20graphic%20design%2C%20bold%20colors%2C%20high%20detail&image_size=landscape_4_3',
    likes: 288,
    comments: 25,
    views: 1204,
    category: '插画设计',
    tags: ['京剧', '联名', '海报'],
    featured: false,
  },
  {
    id: 22,
    title: '中国传统纹样包装集',
    creator: '包装设计师小纹',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaowen',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Chinese%20traditional%20patterns%20packaging%20collection%2C%20grid%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 233,
    comments: 19,
    views: 1012,
    category: '包装设计',
    tags: ['纹样', '包装', '合集'],
    featured: false,
  },
  {
    id: 23,
    title: '中国红品牌视觉系统',
    creator: '品牌设计师小红',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaohong',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Chinese%20red%20brand%20identity%20system%2C%20guidelines%20spread%2C%20high%20detail&image_size=landscape_4_3',
    likes: 372,
    comments: 44,
    views: 1896,
    category: '品牌设计',
    tags: ['中国红', '视觉系统', '品牌'],
    featured: true,
  },
  {
    id: 24,
    title: '海河主题纪念海报',
    creator: '视觉设计师小河',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaohe3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20river%20commemorative%20poster%2C%20blue%20palette%2C%20wave%20motifs%2C%20high%20detail&image_size=landscape_4_3',
    likes: 246,
    comments: 21,
    views: 1103,
    category: '品牌设计',
    tags: ['海河', '纪念', '海报'],
    featured: false,
  },
  {
    id: 25,
    title: '同仁堂联名礼盒设计',
    creator: '包装设计师小药',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoyao',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20collaboration%20gift%20box%2C%20herbal%20elements%2C%20red%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 318,
    comments: 27,
    views: 1432,
    category: '老字号品牌',
    tags: ['同仁堂', '联名', '礼盒'],
    featured: true,
  },
  {
    id: 26,
    title: '景德镇文创陶瓷包装',
    creator: '工业设计师小瓷',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoci',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Jingdezhen%20ceramics%20cultural%20product%20packaging%2C%20blue%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 267,
    comments: 23,
    views: 1209,
    category: '包装设计',
    tags: ['景德镇', '陶瓷', '文创'],
    featured: false,
  },
  {
    id: 27,
    title: '国潮街头插画系列',
    creator: '插画师小潮',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaochao',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20guochao%20street%20illustration%20series%2C%20vibrant%20colors%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 356,
    comments: 39,
    views: 1750,
    category: '插画设计',
    tags: ['国潮', '插画', '系列'],
    featured: true,
  },
  {
    id: 28,
    title: '非遗技艺数字科普海报',
    creator: '数字艺术家小科',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoke',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20intangible%20heritage%20digital%20education%20poster%2C%20clean%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 214,
    comments: 16,
    views: 942,
    category: '非遗传承',
    tags: ['非遗', '科普', '海报'],
    featured: false,
  },
  {
    id: 29,
    title: '桂发祥品牌插画KV',
    creator: '插画师阿宁',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20Aning',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guifaxiang%20brand%20KV%20illustration%2C%20warm%20tone%2C%20high%20detail&image_size=landscape_4_3',
    likes: 241,
    comments: 20,
    views: 1064,
    category: '品牌设计',
    tags: ['桂发祥', 'KV', '插画'],
    featured: false,
  },
  {
    id: 30,
    title: '狗不理快闪店视觉',
    creator: '视觉设计师小闪',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoshan',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Goubuli%20pop-up%20store%20visual%20identity%2C%20red%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 298,
    comments: 28,
    views: 1398,
    category: '品牌设计',
    tags: ['狗不理', '快闪', 'VI'],
    featured: true,
  },
  {
    id: 31,
    title: '老美华鞋履广告海报',
    creator: '视觉设计师小履',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaolv',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Laomeihua%20shoe%20brand%20advertising%20poster%2C%20craft%20texture%2C%20high%20detail&image_size=landscape_4_3',
    likes: 207,
    comments: 15,
    views: 924,
    category: '老字号品牌',
    tags: ['老美华', '广告', '海报'],
    featured: false,
  },
  {
    id: 32,
    title: '泥人张IP周边视觉集',
    creator: 'IP设计师小张',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaozhang2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Nirenzhang%20IP%20merch%20visual%20collection%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 326,
    comments: 37,
    views: 1684,
    category: 'IP设计',
    tags: ['泥人张', '周边', 'IP'],
    featured: true,
  }
  ,
  {
    id: 33,
    title: '端午节传统纹样礼盒',
    creator: '包装设计师小节',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaojie',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Dragon%20boat%20festival%20pattern%20gift%20box%2C%20green%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 289,
    comments: 24,
    views: 1234,
    category: '包装设计',
    tags: ['端午', '纹样', '礼盒'],
    featured: false,
  },
  {
    id: 34,
    title: '回纹现代家居品牌视觉',
    creator: '品牌设计师小回',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaohui',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Hui%20pattern%20modern%20home%20brand%20identity%2C%20minimal%20grid%2C%20high%20detail&image_size=landscape_4_3',
    likes: 254,
    comments: 22,
    views: 1120,
    category: '品牌设计',
    tags: ['回纹', '视觉识别', '家居'],
    featured: false,
  },
  {
    id: 35,
    title: '杨柳青年画儿童插画系列',
    creator: '插画师小柳',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoliu',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Yangliuqing%20children%20illustration%20series%2C%20cute%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 315,
    comments: 34,
    views: 1605,
    category: '插画设计',
    tags: ['杨柳青年画', '儿童', '系列'],
    featured: true,
  },
  {
    id: 36,
    title: '津门非遗联名文创合集',
    creator: 'IP设计师小津',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaojin',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tianjin%20intangible%20heritage%20collab%20merch%20collection%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 333,
    comments: 31,
    views: 1712,
    category: 'IP设计',
    tags: ['非遗', '联名', '文创'],
    featured: true,
  },
  {
    id: 37,
    title: '东方配色应用指南海报',
    creator: '视觉设计师小配',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaopei',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Oriental%20color%20palette%20application%20poster%2C%20clean%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 219,
    comments: 18,
    views: 980,
    category: '品牌设计',
    tags: ['配色', '指南', '海报'],
    featured: false,
  },
  {
    id: 38,
    title: '景德镇现代餐具插画',
    creator: '插画师小瓷',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoci2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Jingdezhen%20modern%20tableware%20illustration%2C%20blue%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 241,
    comments: 20,
    views: 1060,
    category: '插画设计',
    tags: ['景德镇', '餐具', '插画'],
    featured: false,
  },
  {
    id: 39,
    title: '传统纹样再设计指南',
    creator: '工艺设计师小纹',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaowen2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Chinese%20pattern%20redesign%20guide%2C%20grid%20system%2C%20high%20detail&image_size=landscape_4_3',
    likes: 205,
    comments: 17,
    views: 904,
    category: '工艺创新',
    tags: ['纹样', '再设计', '指南'],
    featured: false,
  },
  {
    id: 40,
    title: '海河蓝品牌联名周边',
    creator: 'IP设计师小蓝',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaolan',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20blue%20collab%20merch%2C%20minimal%20blue%20palette%2C%20high%20detail&image_size=landscape_4_3',
    likes: 298,
    comments: 28,
    views: 1402,
    category: 'IP设计',
    tags: ['海河蓝', '联名', '周边'],
    featured: true,
  },
  {
    id: 41,
    title: '同仁堂品牌视觉规范页',
    creator: '品牌设计师小堂',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaotang',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20brand%20guidelines%20spread%2C%20red%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 352,
    comments: 41,
    views: 1804,
    category: '老字号品牌',
    tags: ['同仁堂', '视觉规范', '品牌'],
    featured: true,
  },
  {
    id: 42,
    title: '京剧脸谱IP贴纸集',
    creator: 'IP设计师小戏',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoxi2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20mask%20sticker%20pack%2C%20flat%20vector%2C%20high%20detail&image_size=landscape_4_3',
    likes: 262,
    comments: 23,
    views: 1140,
    category: 'IP设计',
    tags: ['京剧', '贴纸', 'IP'],
    featured: false,
  },
  {
    id: 43,
    title: '泥人张联名礼盒二期',
    creator: '包装设计师小泥',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoni',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Nirenzhang%20collaboration%20gift%20box%20phase%202%2C%20cultural%20elements%2C%20high%20detail&image_size=landscape_4_3',
    likes: 276,
    comments: 22,
    views: 1188,
    category: '包装设计',
    tags: ['泥人张', '礼盒', '二期'],
    featured: false,
  },
  {
    id: 44,
    title: '海河文化导视系统',
    creator: '品牌设计师小导',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaodao',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20culture%20wayfinding%20system%2C%20signage%20set%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 223,
    comments: 19,
    views: 1008,
    category: '品牌设计',
    tags: ['海河', '导视', '系统'],
    featured: false,
  },
  {
    id: 45,
    title: '果仁张秋冬礼盒KV',
    creator: '视觉设计师小仁',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoren',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guorenzhang%20autumn-winter%20gift%20box%20KV%2C%20warm%20tone%2C%20high%20detail&image_size=landscape_4_3',
    likes: 238,
    comments: 20,
    views: 1056,
    category: '老字号品牌',
    tags: ['果仁张', '礼盒', 'KV'],
    featured: false,
  },
  {
    id: 46,
    title: '传统色彩主题字体集',
    creator: '字体设计师小彩',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaocai',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Chinese%20traditional%20colors%20themed%20typeface%20specimen%2C%20grid%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 347,
    comments: 38,
    views: 1768,
    category: '品牌设计',
    tags: ['传统色', '字体', '视觉系统'],
    featured: true,
  },
  {
    id: 47,
    title: '非遗技能教学海报集',
    creator: '数字艺术家小技',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoji',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20intangible%20heritage%20skills%20teaching%20poster%20set%2C%20clean%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 226,
    comments: 19,
    views: 996,
    category: '非遗传承',
    tags: ['技能教学', '非遗', '海报'],
    featured: false,
  },
  {
    id: 48,
    title: '国潮年轻化品牌案例集',
    creator: '品牌设计师小潮',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaochao2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20guochao%20youth%20brand%20case%20collection%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 364,
    comments: 42,
    views: 1912,
    category: '国潮设计',
    tags: ['国潮', '年轻化', '案例集'],
    featured: true,
  }
  ,
  {
    id: 49,
    title: '杨柳青年画现代联名系列',
    creator: '插画师小柳2号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoLiuNo2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Yangliuqing%20modern%20collaboration%20series%2C%20vibrant%20colors%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 312,
    comments: 28,
    views: 1528,
    category: '插画设计',
    tags: ['杨柳青年画', '联名', '插画'],
    featured: true,
  },
  {
    id: 50,
    title: '回纹极简电商品牌视觉',
    creator: '品牌设计师小回2号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoHuiNo2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Hui%20pattern%20minimal%20ecommerce%20visual%20identity%2C%20grid%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 268,
    comments: 22,
    views: 1206,
    category: '品牌设计',
    tags: ['回纹', '极简', '电商'],
    featured: false,
  },
  {
    id: 51,
    title: '桂发祥礼盒插画·春季版',
    creator: '插画师阿宁2号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20AningNo2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guifaxiang%20spring%20gift%20box%20illustration%2C%20warm%20palette%2C%20high%20detail&image_size=landscape_4_3',
    likes: 256,
    comments: 20,
    views: 1104,
    category: '包装设计',
    tags: ['桂发祥', '礼盒', '插画'],
    featured: false,
  },
  {
    id: 52,
    title: '狗不理品牌跨界字体集',
    creator: '字体设计师小狗',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoGouType',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Goubuli%20brand%20collab%20typeface%20specimen%2C%20bold%20display%2C%20high%20detail&image_size=landscape_4_3',
    likes: 309,
    comments: 33,
    views: 1708,
    category: '品牌设计',
    tags: ['狗不理', '字体', '联名'],
    featured: true,
  },
  {
    id: 53,
    title: '同仁堂中药文化插画KV',
    creator: '插画师小草药',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoHerb',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20herbal%20culture%20KV%20illustration%2C%20red%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 275,
    comments: 24,
    views: 1283,
    category: '老字号品牌',
    tags: ['同仁堂', '插画', 'KV'],
    featured: false,
  },
  {
    id: 54,
    title: '景德镇·青花瓷礼品包装',
    creator: '包装设计师小青',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoQing',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Blue%20and%20white%20porcelain%20gift%20packaging%2C%20classic%20pattern%2C%20high%20detail&image_size=landscape_4_3',
    likes: 244,
    comments: 19,
    views: 1002,
    category: '包装设计',
    tags: ['青花瓷', '礼品', '包装'],
    featured: false,
  },
  {
    id: 55,
    title: '京剧脸谱潮玩IP海报',
    creator: 'IP设计师小脸谱',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoLianpu',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20toy%20IP%20poster%2C%20bold%20colors%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 286,
    comments: 26,
    views: 1321,
    category: 'IP设计',
    tags: ['京剧', '潮玩', '海报'],
    featured: true,
  },
  {
    id: 56,
    title: '海河蓝·城市视觉主题页',
    creator: '品牌设计师小蓝2号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoLanNo2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20blue%20city%20visual%20theme%20page%2C%20minimal%20blue%20palette%2C%20high%20detail&image_size=landscape_4_3',
    likes: 301,
    comments: 29,
    views: 1416,
    category: '品牌设计',
    tags: ['海河蓝', '主题页', '视觉'],
    featured: true,
  },
  {
    id: 57,
    title: '茅台联名礼品包装海报',
    creator: '视觉设计师小酱',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoJiang',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Moutai%20collaboration%20gift%20packaging%20poster%2C%20luxury%20look%2C%20high%20detail&image_size=landscape_4_3',
    likes: 273,
    comments: 23,
    views: 1240,
    category: '老字号品牌',
    tags: ['茅台', '联名', '海报'],
    featured: false,
  },
  {
    id: 58,
    title: '非遗纹样·现代图形再设计',
    creator: '工艺设计师小非',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoFei',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20intangible%20heritage%20patterns%20modern%20graphic%20redesign%2C%20grid%20system%2C%20high%20detail&image_size=landscape_4_3',
    likes: 232,
    comments: 18,
    views: 992,
    category: '工艺创新',
    tags: ['非遗纹样', '再设计', '图形'],
    featured: false,
  },
  {
    id: 59,
    title: '杨柳青年画·节庆KV合集',
    creator: '插画师小节庆',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoJieqing',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Yangliuqing%20festival%20KV%20collection%2C%20vibrant%20palette%2C%20high%20detail&image_size=landscape_4_3',
    likes: 319,
    comments: 30,
    views: 1556,
    category: '插画设计',
    tags: ['杨柳青年画', '节庆', 'KV'],
    featured: true,
  },
  {
    id: 60,
    title: '中国红·电商整套页面UI',
    creator: '视觉设计师小红2号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoHongNo2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Chinese%20red%20ecommerce%20UI%20pages%2C%20design%20system%2C%20high%20detail&image_size=landscape_4_3',
    likes: 347,
    comments: 38,
    views: 1764,
    category: '品牌设计',
    tags: ['中国红', '电商', 'UI'],
    featured: true,
  },
  {
    id: 61,
    title: '泥人张·IP授权手册封面',
    creator: 'IP设计师小张2号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoZhangNo2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Nirenzhang%20IP%20license%20manual%20cover%2C%20flat%20graphic%2C%20high%20detail&image_size=landscape_4_3',
    likes: 284,
    comments: 25,
    views: 1308,
    category: 'IP设计',
    tags: ['泥人张', '授权', '手册'],
    featured: true,
  },
  {
    id: 62,
    title: '同仁堂·品牌旧改海报集',
    creator: '视觉设计师小堂2号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoTangNo2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20brand%20renewal%20poster%20set%2C%20red%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 263,
    comments: 22,
    views: 1167,
    category: '老字号品牌',
    tags: ['同仁堂', '旧改', '海报'],
    featured: false,
  },
  {
    id: 63,
    title: '景德镇·餐具品牌KV合集',
    creator: '插画师小瓷3号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoCiNo3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Jingdezhen%20tableware%20brand%20KV%20collection%2C%20blue%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 248,
    comments: 20,
    views: 1048,
    category: '插画设计',
    tags: ['景德镇', '餐具', '品牌'],
    featured: false,
  },
  {
    id: 64,
    title: '京剧·舞台海报系统',
    creator: '视觉设计师小戏3号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoXiNo3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20stage%20poster%20system%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 231,
    comments: 19,
    views: 1006,
    category: '品牌设计',
    tags: ['京剧', '舞台', '海报'],
    featured: false,
  },
  {
    id: 65,
    title: '海河·导视与标识合集',
    creator: '品牌设计师小导2号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoDaoNo2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20wayfinding%20and%20signage%20set%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 244,
    comments: 20,
    views: 1022,
    category: '品牌设计',
    tags: ['海河', '导视', '标识'],
    featured: false,
  },
  {
    id: 66,
    title: '耳朵眼·品牌插画KV合集',
    creator: '插画师小耳朵',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoErduo',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Erduoyan%20brand%20KV%20illustration%20collection%2C%20warm%20palette%2C%20high%20detail&image_size=landscape_4_3',
    likes: 257,
    comments: 21,
    views: 1092,
    category: '品牌设计',
    tags: ['耳朵眼', 'KV', '插画'],
    featured: false,
  },
  {
    id: 67,
    title: '传统色·包装色彩系统',
    creator: '包装设计师小色',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoSe',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Chinese%20traditional%20color%20packaging%20system%2C%20swatches%20grid%2C%20high%20detail&image_size=landscape_4_3',
    likes: 263,
    comments: 22,
    views: 1146,
    category: '包装设计',
    tags: ['传统色', '包装', '系统'],
    featured: false,
  },
  {
    id: 68,
    title: '非遗·数字教育信息图集',
    creator: '数字艺术家小教',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoJiao',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20intangible%20heritage%20digital%20education%20infographics%2C%20clean%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 236,
    comments: 19,
    views: 1015,
    category: '非遗传承',
    tags: ['非遗', '教育', '信息图'],
    featured: false,
  },
  {
    id: 69,
    title: '国潮·高校联名企划KV集',
    creator: '品牌设计师小联',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoLian',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guochao%20college%20collaboration%20KV%20campaign%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 352,
    comments: 40,
    views: 1842,
    category: '国潮设计',
    tags: ['高校', '联名', '企划'],
    featured: true,
  },
  {
    id: 70,
    title: '景德镇·文创店铺导视',
    creator: '品牌设计师小导3号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoDaoNo3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Jingdezhen%20cultural%20store%20wayfinding%2C%20blue%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 229,
    comments: 18,
    views: 980,
    category: '品牌设计',
    tags: ['景德镇', '导视', '店铺'],
    featured: false,
  },
  {
    id: 71,
    title: '同仁堂·中药主题画册',
    creator: '视觉设计师小册',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoCe',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20herbal%20theme%20catalog%2C%20red%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 267,
    comments: 23,
    views: 1214,
    category: '老字号品牌',
    tags: ['同仁堂', '画册', '主题'],
    featured: false,
  },
  {
    id: 72,
    title: '京剧·教育科普插画集',
    creator: '插画师小科普',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoKepu',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20education%20illustration%20set%2C%20flat%20vector%2C%20high%20detail&image_size=landscape_4_3',
    likes: 246,
    comments: 21,
    views: 1096,
    category: '插画设计',
    tags: ['京剧', '科普', '插画'],
    featured: false,
  },
  {
    id: 73,
    title: '海河·文旅品牌子系统',
    creator: '品牌设计师小旅',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoLv',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20culture%20tourism%20sub-brand%20system%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 258,
    comments: 22,
    views: 1130,
    category: '品牌设计',
    tags: ['海河', '文旅', '子系统'],
    featured: false,
  },
  {
    id: 74,
    title: '果仁张·礼盒插画·秋季版',
    creator: '插画师小仁2号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoRenNo2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guorenzhang%20autumn%20gift%20box%20illustration%2C%20warm%20tone%2C%20high%20detail&image_size=landscape_4_3',
    likes: 234,
    comments: 19,
    views: 1038,
    category: '包装设计',
    tags: ['果仁张', '礼盒', '插画'],
    featured: false,
  },
  {
    id: 75,
    title: '传统色·品牌KV延展',
    creator: '品牌设计师小色2号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoSeNo2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Chinese%20traditional%20colors%20brand%20KV%20extension%2C%20swatches%20grid%2C%20high%20detail&image_size=landscape_4_3',
    likes: 318,
    comments: 30,
    views: 1540,
    category: '品牌设计',
    tags: ['传统色', 'KV', '延展'],
    featured: true,
  },
  {
    id: 76,
    title: '非遗IP·联名教育套件',
    creator: 'IP设计师小套件',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoTaojian',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20intangible%20heritage%20IP%20education%20kit%2C%20flat%20graphic%2C%20high%20detail&image_size=landscape_4_3',
    likes: 286,
    comments: 26,
    views: 1326,
    category: 'IP设计',
    tags: ['非遗', 'IP', '教育'],
    featured: true,
  },
  {
    id: 77,
    title: '国潮·节日主题系列海报',
    creator: '视觉设计师小节2号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoJieNo2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20guochao%20festival%20poster%20series%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 331,
    comments: 31,
    views: 1687,
    category: '国潮设计',
    tags: ['节日', '系列', '海报'],
    featured: true,
  },
  {
    id: 78,
    title: '景德镇·青花瓷图形再设计',
    creator: '工艺设计师小瓷4号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoCiNo4',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20blue%20and%20white%20porcelain%20graphic%20redesign%2C%20grid%20system%2C%20high%20detail&image_size=landscape_4_3',
    likes: 245,
    comments: 20,
    views: 1042,
    category: '工艺创新',
    tags: ['青花瓷', '图形', '再设计'],
    featured: false,
  },
  {
    id: 79,
    title: '海河·纪念周边·二期',
    creator: 'IP设计师小海2号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoHaiNo2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20commemorative%20merch%20phase%202%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 292,
    comments: 27,
    views: 1390,
    category: 'IP设计',
    tags: ['海河', '纪念', '周边'],
    featured: true,
  },
  {
    id: 80,
    title: '传统色·东方美学字体·二期',
    creator: '字体设计师小东方',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoDongfangType',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Oriental%20aesthetics%20typeface%20phase%202%2C%20specimen%20sheet%2C%20high%20detail&image_size=landscape_4_3',
    likes: 368,
    comments: 40,
    views: 1884,
    category: '品牌设计',
    tags: ['东方美学', '字体', '二期'],
    featured: true,
  }
  ,
  {
    id: 81,
    title: '杨柳青年画·联名文创礼盒三期',
    creator: '包装设计师小柳3号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoLiuNo3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Yangliuqing%20collab%20gift%20box%20phase%203%2C%20vibrant%20palette%2C%20high%20detail&image_size=landscape_4_3',
    likes: 296,
    comments: 26,
    views: 1362,
    category: '包装设计',
    tags: ['杨柳青年画', '联名', '礼盒'],
    featured: false,
  },
  {
    id: 82,
    title: '回纹·现代办公品牌视觉集',
    creator: '品牌设计师小回3号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoHuiNo3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Hui%20pattern%20modern%20office%20brand%20identity%2C%20grid%20system%2C%20high%20detail&image_size=landscape_4_3',
    likes: 258,
    comments: 22,
    views: 1140,
    category: '品牌设计',
    tags: ['回纹', '品牌', '办公'],
    featured: false,
  },
  {
    id: 83,
    title: '中国红·整套促销海报集',
    creator: '视觉设计师小红3号',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoHongNo3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Chinese%20red%20promotion%20poster%20set%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 334,
    comments: 36,
    views: 1701,
    category: '品牌设计',
    tags: ['中国红', '促销', '海报'],
    featured: true,
  },
  {
    id: 84,
    title: '京剧元素·教育插画卡片集',
    creator: '插画师小戏教育',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoXiEdu',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20education%20illustration%20cards%2C%20flat%20vector%2C%20high%20detail&image_size=landscape_4_3',
    likes: 246,
    comments: 21,
    views: 1062,
    category: '插画设计',
    tags: ['京剧', '教育', '插画'],
    featured: false,
  },
  {
    id: 85,
    title: '海河蓝·联名纪念徽章合集',
    creator: 'IP设计师小蓝徽章',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20xiaoLanBadge',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20blue%20commemorative%20pin%20collection%2C%20minimal%20blue%20palette%2C%20high%20detail&image_size=landscape_4_3',
    likes: 288,
    comments: 25,
    views: 1244,
    category: 'IP设计',
    tags: ['海河蓝', '徽章', '联名'],
    featured: true,
  },
  {
    id: 86,
    title: '同仁堂·中药材科普信息图',
    creator: '数字艺术家小堂科普',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20TongrentangInfo',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20herbal%20infographics%2C%20clean%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 259,
    comments: 22,
    views: 1168,
    category: '老字号品牌',
    tags: ['同仁堂', '科普', '信息图'],
    featured: false,
  },
  {
    id: 87,
    title: '景德镇·文创器皿插画集',
    creator: '插画师小瓷器皿',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20JingdezhenWare',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Jingdezhen%20cultural%20ware%20illustration%20set%2C%20blue%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 242,
    comments: 20,
    views: 1040,
    category: '插画设计',
    tags: ['景德镇', '器皿', '插画'],
    featured: false,
  },
  {
    id: 88,
    title: '桂发祥·传统纹样视觉延展',
    creator: '品牌设计师阿宁视觉',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20GuifaxiangVI',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guifaxiang%20traditional%20pattern%20visual%20extension%2C%20warm%20palette%2C%20high%20detail&image_size=landscape_4_3',
    likes: 236,
    comments: 19,
    views: 1026,
    category: '品牌设计',
    tags: ['桂发祥', '纹样', '视觉'],
    featured: false,
  },
  {
    id: 89,
    title: '狗不理·联名周边IP贴纸套组',
    creator: 'IP设计师小狗贴纸',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20GoubuliStickers',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Goubuli%20collab%20sticker%20pack%2C%20flat%20vector%2C%20high%20detail&image_size=landscape_4_3',
    likes: 268,
    comments: 22,
    views: 1186,
    category: 'IP设计',
    tags: ['狗不理', '贴纸', '联名'],
    featured: true,
  },
  {
    id: 90,
    title: '老美华·品牌广告KV再设计',
    creator: '视觉设计师小履再设计',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20LaomeihuaKV',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Laomeihua%20advertising%20KV%20redesign%2C%20craft%20texture%2C%20high%20detail&image_size=landscape_4_3',
    likes: 218,
    comments: 18,
    views: 980,
    category: '老字号品牌',
    tags: ['老美华', '广告', '再设计'],
    featured: false,
  },
  {
    id: 91,
    title: '耳朵眼·品牌插画KV·春季版',
    creator: '插画师小耳春',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20ErduoyanSpring',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Erduoyan%20spring%20brand%20KV%20illustration%2C%20warm%20tone%2C%20high%20detail&image_size=landscape_4_3',
    likes: 227,
    comments: 19,
    views: 1024,
    category: '品牌设计',
    tags: ['耳朵眼', 'KV', '春季'],
    featured: false,
  },
  {
    id: 92,
    title: '传统色·包装配色案例集',
    creator: '包装设计师小色案例',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20ColorPackagingCase',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Chinese%20traditional%20color%20packaging%20cases%2C%20swatches%20grid%2C%20high%20detail&image_size=landscape_4_3',
    likes: 235,
    comments: 20,
    views: 1046,
    category: '包装设计',
    tags: ['传统色', '配色', '案例'],
    featured: false,
  },
  {
    id: 93,
    title: '非遗·技艺流程海报集·二期',
    creator: '数字艺术家小技流程',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HeritageFlow',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20intangible%20heritage%20process%20poster%20set%2C%20clean%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 222,
    comments: 18,
    views: 992,
    category: '非遗传承',
    tags: ['流程', '非遗', '海报'],
    featured: false,
  },
  {
    id: 94,
    title: '国潮·高校社团联名周边集',
    creator: 'IP设计师小联社团',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20GuochaoClub',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guochao%20club%20collab%20merch%20collection%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 342,
    comments: 39,
    views: 1820,
    category: '国潮设计',
    tags: ['高校', '社团', '联名'],
    featured: true,
  },
  {
    id: 95,
    title: '景德镇·文化展馆导视系统',
    creator: '品牌设计师小馆导视',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20JdzMuseum',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Jingdezhen%20museum%20wayfinding%20system%2C%20blue%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 231,
    comments: 19,
    views: 998,
    category: '品牌设计',
    tags: ['景德镇', '展馆', '导视'],
    featured: false,
  },
  {
    id: 96,
    title: '同仁堂·品牌视觉年鉴页',
    creator: '视觉设计师小年鉴',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20TongrentangYearbook',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20brand%20yearbook%20page%2C%20red%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 264,
    comments: 22,
    views: 1196,
    category: '老字号品牌',
    tags: ['同仁堂', '年鉴', '视觉'],
    featured: false,
  },
  {
    id: 97,
    title: '京剧·少儿教育周边套装',
    creator: 'IP设计师小戏少儿',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20OperaKids',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20kids%20education%20kit%2C%20flat%20graphic%2C%20high%20detail&image_size=landscape_4_3',
    likes: 252,
    comments: 21,
    views: 1108,
    category: 'IP设计',
    tags: ['京剧', '少儿', '教育'],
    featured: false,
  },
  {
    id: 98,
    title: '海河·城市纪念海报三期',
    creator: '视觉设计师小河三期',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HaihePhase3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20commemorative%20poster%20phase%203%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 244,
    comments: 20,
    views: 1040,
    category: '品牌设计',
    tags: ['海河', '纪念', '海报'],
    featured: false,
  },
  {
    id: 99,
    title: '果仁张·冬季礼盒插画集',
    creator: '插画师小仁冬季',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20GuorenWinter',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guorenzhang%20winter%20gift%20box%20illustration%2C%20warm%20tone%2C%20high%20detail&image_size=landscape_4_3',
    likes: 238,
    comments: 19,
    views: 1032,
    category: '包装设计',
    tags: ['果仁张', '冬季', '插画'],
    featured: false,
  },
  {
    id: 100,
    title: '传统色·联名字体视觉页',
    creator: '字体设计师小色字',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20ColorType',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Traditional%20color%20collab%20typeface%20specimen%2C%20grid%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 311,
    comments: 28,
    views: 1520,
    category: '品牌设计',
    tags: ['传统色', '字体', '联名'],
    featured: true,
  },
  {
    id: 101,
    title: '非遗IP·联名亲子活动海报',
    creator: 'IP设计师小亲子',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HeritageFamily',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20intangible%20heritage%20IP%20family%20event%20poster%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 273,
    comments: 23,
    views: 1248,
    category: 'IP设计',
    tags: ['非遗', '亲子', '活动'],
    featured: true,
  },
  {
    id: 102,
    title: '国潮·毕业季联名海报集',
    creator: '视觉设计师小季联名',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20GuochaoGraduate',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guochao%20graduation%20collab%20poster%20set%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 356,
    comments: 39,
    views: 1764,
    category: '国潮设计',
    tags: ['毕业季', '联名', '海报'],
    featured: true,
  },
  {
    id: 103,
    title: '景德镇·茶具插画KV集',
    creator: '插画师小茶具',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20TeaWareIllustrator',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Jingdezhen%20tea%20ware%20KV%20illustration%2C%20blue%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 245,
    comments: 20,
    views: 1046,
    category: '插画设计',
    tags: ['景德镇', '茶具', '插画'],
    featured: false,
  },
  {
    id: 104,
    title: '京剧·舞台角色卡片集',
    creator: '插画师小角色卡片',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20OperaRoles',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20role%20cards%2C%20flat%20vector%2C%20high%20detail&image_size=landscape_4_3',
    likes: 226,
    comments: 19,
    views: 1016,
    category: '插画设计',
    tags: ['京剧', '角色', '卡片'],
    featured: false,
  },
  {
    id: 105,
    title: '海河·年度视觉主题周边',
    creator: 'IP设计师小海年度',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HaiheYear',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20annual%20visual%20theme%20merch%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 294,
    comments: 27,
    views: 1408,
    category: 'IP设计',
    tags: ['海河', '年度', '周边'],
    featured: true,
  },
  {
    id: 106,
    title: '同仁堂·品牌短视频封面集',
    creator: '视觉设计师小短视',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20TongrentangCover',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20short%20video%20cover%20set%2C%20red%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 263,
    comments: 22,
    views: 1180,
    category: '老字号品牌',
    tags: ['同仁堂', '视频封面', '品牌'],
    featured: false,
  },
  {
    id: 107,
    title: '京剧·IP贴纸·儿童版',
    creator: 'IP设计师小戏儿童',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20OperaStickerKids',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20kids%20sticker%20pack%2C%20flat%20vector%2C%20high%20detail&image_size=landscape_4_3',
    likes: 232,
    comments: 19,
    views: 1030,
    category: 'IP设计',
    tags: ['京剧', '贴纸', '儿童'],
    featured: false,
  },
  {
    id: 108,
    title: '海河·导视系统·升级版',
    creator: '品牌设计师小导升级',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HaiheWayfindingV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20wayfinding%20system%20upgrade%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 251,
    comments: 20,
    views: 1098,
    category: '品牌设计',
    tags: ['海河', '导视', '升级'],
    featured: false,
  },
  {
    id: 109,
    title: '耳朵眼·品牌插画KV·冬季版',
    creator: '插画师小耳冬',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20ErduoyanWinter',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Erduoyan%20winter%20brand%20KV%20illustration%2C%20warm%20tone%2C%20high%20detail&image_size=landscape_4_3',
    likes: 229,
    comments: 19,
    views: 1028,
    category: '品牌设计',
    tags: ['耳朵眼', 'KV', '冬季'],
    featured: false,
  },
  {
    id: 110,
    title: '传统色·品牌视觉·电商升级',
    creator: '视觉设计师小色升级',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20ColorEcomV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Traditional%20color%20ecommerce%20visual%20upgrade%2C%20swatches%20grid%2C%20high%20detail&image_size=landscape_4_3',
    likes: 318,
    comments: 30,
    views: 1542,
    category: '品牌设计',
    tags: ['传统色', '电商', '升级'],
    featured: true,
  },
  {
    id: 111,
    title: '非遗IP·跨界联名KV集',
    creator: '品牌设计师小跨界',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HeritageCrossover',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20intangible%20heritage%20crossover%20KV%20collection%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 292,
    comments: 27,
    views: 1412,
    category: 'IP设计',
    tags: ['非遗', '跨界', 'KV'],
    featured: true,
  },
  {
    id: 112,
    title: '国潮·高校演出主题海报集',
    creator: '视觉设计师小演出',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20GuochaoShow',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guochao%20college%20show%20poster%20set%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 337,
    comments: 36,
    views: 1726,
    category: '国潮设计',
    tags: ['高校', '演出', '海报'],
    featured: true,
  },
  {
    id: 113,
    title: '景德镇·手绘器物图鉴页',
    creator: '插画师小图鉴',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HandDrawCatalog',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Jingdezhen%20hand-drawn%20wares%20catalog%20page%2C%20blue%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 236,
    comments: 19,
    views: 1016,
    category: '插画设计',
    tags: ['景德镇', '手绘', '图鉴'],
    featured: false,
  },
  {
    id: 114,
    title: '京剧·教育海报·课堂版',
    creator: '视觉设计师小课堂',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20OperaClass',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20classroom%20poster%2C%20flat%20vector%2C%20high%20detail&image_size=landscape_4_3',
    likes: 229,
    comments: 19,
    views: 1008,
    category: '插画设计',
    tags: ['京剧', '课堂', '海报'],
    featured: false,
  },
  {
    id: 115,
    title: '海河·年度纪念·徽章与贴纸',
    creator: 'IP设计师小纪年套',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HaiheAnnualSet',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20annual%20commemorative%20pins%20and%20stickers%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 286,
    comments: 26,
    views: 1322,
    category: 'IP设计',
    tags: ['海河', '纪念', '贴纸'],
    featured: true,
  },
  {
    id: 116,
    title: '同仁堂·展陈视觉与导视',
    creator: '品牌设计师小展陈',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20TongrentangExpo',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20exhibition%20visual%20and%20wayfinding%2C%20red%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 241,
    comments: 20,
    views: 1060,
    category: '老字号品牌',
    tags: ['同仁堂', '展陈', '导视'],
    featured: false,
  },
  {
    id: 117,
    title: '京剧·联名教育海报·系列二',
    creator: '视觉设计师小戏系列二',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20OperaEduV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20education%20poster%20series%202%2C%20flat%20vector%2C%20high%20detail&image_size=landscape_4_3',
    likes: 236,
    comments: 19,
    views: 1020,
    category: '插画设计',
    tags: ['京剧', '教育', '系列'],
    featured: false,
  },
  {
    id: 118,
    title: '海河·文旅导视子系统二期',
    creator: '品牌设计师小旅二期',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HaiheTourV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20tourism%20wayfinding%20subsystem%20phase%202%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 248,
    comments: 20,
    views: 1072,
    category: '品牌设计',
    tags: ['海河', '文旅', '导视'],
    featured: false,
  },
  {
    id: 119,
    title: '国潮·新锐品牌KV·高校联创',
    creator: '品牌设计师小新锐',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20NeoBrandKV',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guochao%20neo%20brand%20KV%20college%20co-create%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 372,
    comments: 44,
    views: 1898,
    category: '国潮设计',
    tags: ['新锐', '高校', '联创'],
    featured: true,
  },
  {
    id: 120,
    title: '传统色·东方美学字体·三期',
    creator: '字体设计师小东方三期',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20DongfangTypeV3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Oriental%20aesthetics%20typeface%20phase%203%2C%20specimen%20sheet%2C%20high%20detail&image_size=landscape_4_3',
    likes: 382,
    comments: 46,
    views: 1954,
    category: '品牌设计',
    tags: ['东方美学', '字体', '三期'],
    featured: true,
  }
  ,
  {
    id: 121,
    title: '国潮·城市地标插画集',
    creator: '插画师小城地标',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20CityLandmarkIllustrator',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20guochao%20city%20landmark%20illustrations%2C%20bold%20colors%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 318,
    comments: 31,
    views: 1586,
    category: '插画设计',
    tags: ['国潮', '地标', '插画'],
    featured: true,
  },
  {
    id: 122,
    title: '景德镇·文创茶礼包装二期',
    creator: '包装设计师小茶礼二期',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20TeaGiftV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Jingdezhen%20tea%20gift%20packaging%20phase%202%2C%20blue%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 244,
    comments: 20,
    views: 1062,
    category: '包装设计',
    tags: ['景德镇', '茶礼', '包装'],
    featured: false,
  },
  {
    id: 123,
    title: '同仁堂·国潮联名KV·四季集',
    creator: '视觉设计师小四季堂',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20TongrentangSeasons',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20seasonal%20KV%20collection%2C%20red%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 269,
    comments: 24,
    views: 1224,
    category: '老字号品牌',
    tags: ['同仁堂', '联名', 'KV'],
    featured: false,
  },
  {
    id: 124,
    title: '京剧·少儿教育主题插画二期',
    creator: '插画师小戏二期',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20OperaKidsV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20kids%20education%20illustrations%20phase%202%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 238,
    comments: 19,
    views: 1036,
    category: '插画设计',
    tags: ['京剧', '教育', '插画'],
    featured: false,
  },
  {
    id: 125,
    title: '海河·联名纪念礼盒三期',
    creator: '包装设计师小海礼三期',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HaiheGiftV3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20commemorative%20gift%20box%20phase%203%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 286,
    comments: 26,
    views: 1368,
    category: '包装设计',
    tags: ['海河', '纪念', '礼盒'],
    featured: true,
  },
  {
    id: 126,
    title: '传统色·办公品牌视觉扩展',
    creator: '品牌设计师小色办公',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20ColorOfficeVI',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Traditional%20color%20office%20brand%20visual%20extension%2C%20swatches%20grid%2C%20high%20detail&image_size=landscape_4_3',
    likes: 327,
    comments: 34,
    views: 1624,
    category: '品牌设计',
    tags: ['传统色', '办公', '视觉'],
    featured: true,
  },
  {
    id: 127,
    title: '非遗·工艺流程图形再设计二期',
    creator: '工艺设计师小非流程2',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HeritageFlowV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20intangible%20heritage%20process%20graphics%20redesign%20phase%202%2C%20clean%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 224,
    comments: 18,
    views: 1004,
    category: '工艺创新',
    tags: ['非遗', '流程', '再设计'],
    featured: false,
  },
  {
    id: 128,
    title: '狗不理·IP表情与贴纸二期',
    creator: 'IP设计师小狗表情2',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20GoubuliEmojiV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Goubuli%20IP%20emoji%20and%20sticker%20phase%202%2C%20flat%20vector%2C%20high%20detail&image_size=landscape_4_3',
    likes: 276,
    comments: 24,
    views: 1288,
    category: 'IP设计',
    tags: ['狗不理', 'IP', '贴纸'],
    featured: true,
  },
  {
    id: 129,
    title: '桂发祥·国潮主题KV·夏季版',
    creator: '视觉设计师阿宁夏季',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20GuifaxiangSummer',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guifaxiang%20summer%20KV%20oriental%20aesthetics%2C%20warm%20palette%2C%20high%20detail&image_size=landscape_4_3',
    likes: 253,
    comments: 21,
    views: 1124,
    category: '品牌设计',
    tags: ['桂发祥', 'KV', '夏季'],
    featured: false,
  },
  {
    id: 130,
    title: '京剧·舞台服饰图鉴页',
    creator: '插画师小服饰图鉴',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20OperaCostumeCatalog',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20costume%20catalog%20page%2C%20flat%20vector%2C%20high%20detail&image_size=landscape_4_3',
    likes: 236,
    comments: 19,
    views: 1036,
    category: '插画设计',
    tags: ['京剧', '服饰', '图鉴'],
    featured: false,
  },
  {
    id: 131,
    title: '海河·纪念周边·三期',
    creator: 'IP设计师小海三期',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HaiheMerchV3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20commemorative%20merch%20phase%203%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 298,
    comments: 27,
    views: 1426,
    category: 'IP设计',
    tags: ['海河', '纪念', '周边'],
    featured: true,
  },
  {
    id: 132,
    title: '传统色·节庆主题视觉集',
    creator: '视觉设计师小节庆色',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20ColorFestival',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Traditional%20color%20festival%20visual%20set%2C%20swatches%20grid%2C%20high%20detail&image_size=landscape_4_3',
    likes: 322,
    comments: 33,
    views: 1648,
    category: '品牌设计',
    tags: ['传统色', '节庆', '视觉'],
    featured: true,
  },
  {
    id: 133,
    title: '非遗·技能教学信息图集',
    creator: '数字艺术家小技教图集',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HeritageTeachInfographic',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20intangible%20heritage%20skills%20teaching%20infographics%2C%20clean%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 228,
    comments: 18,
    views: 1012,
    category: '非遗传承',
    tags: ['非遗', '教学', '信息图'],
    featured: false,
  },
  {
    id: 134,
    title: '回纹·极简办公导视系统',
    creator: '品牌设计师小回导视',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HuiWayfinding',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Hui%20pattern%20minimal%20office%20wayfinding%20system%2C%20grid%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 241,
    comments: 20,
    views: 1056,
    category: '品牌设计',
    tags: ['回纹', '导视', '办公'],
    featured: false,
  },
  {
    id: 135,
    title: '中国红·促销KV·门店版',
    creator: '视觉设计师小红门店',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20ChineseRedStoreKV',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Chinese%20red%20promotion%20KV%20for%20retail%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 336,
    comments: 36,
    views: 1716,
    category: '品牌设计',
    tags: ['中国红', '促销', '门店'],
    featured: true,
  },
  {
    id: 136,
    title: '京剧·联名周边·亲子版',
    creator: 'IP设计师小戏亲子周边',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20OperaFamilyMerch',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20family%20merch%20collaboration%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 257,
    comments: 21,
    views: 1118,
    category: 'IP设计',
    tags: ['京剧', '亲子', '周边'],
    featured: false,
  },
  {
    id: 137,
    title: '景德镇·青花瓷餐具二期',
    creator: '插画师小餐具二期',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20BlueWhiteTablewareV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Blue%20and%20white%20porcelain%20tableware%20phase%202%2C%20blue%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 243,
    comments: 20,
    views: 1044,
    category: '插画设计',
    tags: ['景德镇', '青花瓷', '餐具'],
    featured: false,
  },
  {
    id: 138,
    title: '同仁堂·品牌升级·说明页',
    creator: '视觉设计师小堂升级页',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20TongrentangUpgradePage',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20brand%20upgrade%20guideline%20page%2C%20red%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 262,
    comments: 22,
    views: 1184,
    category: '老字号品牌',
    tags: ['同仁堂', '升级', '品牌'],
    featured: false,
  },
  {
    id: 139,
    title: '耳朵眼·品牌KV·秋季版',
    creator: '插画师小耳秋季',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20ErduoyanAutumn',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Erduoyan%20autumn%20brand%20KV%20illustration%2C%20warm%20tone%2C%20high%20detail&image_size=landscape_4_3',
    likes: 235,
    comments: 19,
    views: 1034,
    category: '品牌设计',
    tags: ['耳朵眼', 'KV', '秋季'],
    featured: false,
  },
  {
    id: 140,
    title: '国潮·高校艺术节海报集',
    creator: '视觉设计师小节海报集',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20CollegeFestivalPosters',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guochao%20college%20art%20festival%20poster%20set%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 358,
    comments: 40,
    views: 1782,
    category: '国潮设计',
    tags: ['高校', '艺术节', '海报'],
    featured: true,
  },
  {
    id: 141,
    title: '景德镇·器物线稿图鉴集',
    creator: '插画师小线稿图鉴',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20JdzLineCatalog',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Jingdezhen%20wares%20line%20art%20catalog%2C%20blue%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 233,
    comments: 19,
    views: 1022,
    category: '插画设计',
    tags: ['景德镇', '器物', '线稿'],
    featured: false,
  },
  {
    id: 142,
    title: '同仁堂·展陈信息图卡片',
    creator: '数字艺术家小展陈卡片',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20TongrentangExpoCards',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20exhibition%20infographic%20cards%2C%20red%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 246,
    comments: 21,
    views: 1104,
    category: '老字号品牌',
    tags: ['同仁堂', '展陈', '信息图'],
    featured: false,
  },
  {
    id: 143,
    title: '京剧·角色贴纸·戏迷版',
    creator: 'IP设计师小戏戏迷贴纸',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20OperaFansStickers',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20role%20stickers%20for%20fans%2C%20flat%20vector%2C%20high%20detail&image_size=landscape_4_3',
    likes: 268,
    comments: 22,
    views: 1192,
    category: 'IP设计',
    tags: ['京剧', '角色', '贴纸'],
    featured: true,
  },
  {
    id: 144,
    title: '海河·视觉系统·导视延展',
    creator: '品牌设计师小导视延展',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HaiheVIWayfinding',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20visual%20identity%20and%20wayfinding%20extension%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 254,
    comments: 21,
    views: 1118,
    category: '品牌设计',
    tags: ['海河', '视觉系统', '导视'],
    featured: false,
  },
  {
    id: 145,
    title: '传统纹样·现代品牌延展',
    creator: '品牌设计师小纹现代延展',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20PatternModernVI',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Chinese%20traditional%20pattern%20modern%20brand%20extension%2C%20grid%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 312,
    comments: 29,
    views: 1512,
    category: '品牌设计',
    tags: ['纹样', '品牌', '延展'],
    featured: true,
  },
  {
    id: 146,
    title: '国潮·毕业季·周边礼品集',
    creator: 'IP设计师小毕业礼',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20GraduateMerch',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guochao%20graduation%20merch%20collection%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 342,
    comments: 38,
    views: 1768,
    category: '国潮设计',
    tags: ['毕业季', '周边', '礼品'],
    featured: true,
  },
  {
    id: 147,
    title: '景德镇·文旅店铺导视二期',
    creator: '品牌设计师小店导视V2',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20JdzStoreWayfindingV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Jingdezhen%20cultural%20store%20wayfinding%20phase%202%2C%20blue%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 229,
    comments: 19,
    views: 1006,
    category: '品牌设计',
    tags: ['景德镇', '店铺', '导视'],
    featured: false,
  },
  {
    id: 148,
    title: '同仁堂·视觉年鉴·第二卷',
    creator: '视觉设计师小年鉴二卷',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20TongrentangYearbookV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20brand%20yearbook%20volume%202%2C%20red%20and%20gold%2C%20high%20detail&image_size=landscape_4_3',
    likes: 266,
    comments: 22,
    views: 1204,
    category: '老字号品牌',
    tags: ['同仁堂', '年鉴', '视觉'],
    featured: false,
  },
  {
    id: 149,
    title: '京剧·课堂教育海报·扩展版',
    creator: '视觉设计师小课堂扩展',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20OperaClassPlus',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20classroom%20poster%20extended%2C%20flat%20vector%2C%20high%20detail&image_size=landscape_4_3',
    likes: 238,
    comments: 19,
    views: 1028,
    category: '插画设计',
    tags: ['京剧', '课堂', '海报'],
    featured: false,
  },
  {
    id: 150,
    title: '海河·年度纪念·礼盒与徽章',
    creator: 'IP设计师小海年度礼徽',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HaiheAnnualPins',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20annual%20commemorative%20gift%20box%20and%20pins%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 292,
    comments: 26,
    views: 1388,
    category: 'IP设计',
    tags: ['海河', '年度', '徽章'],
    featured: true,
  },
  {
    id: 151,
    title: '传统色·电商视觉系统·三期',
    creator: '视觉设计师小色电商V3',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20ColorEcommerceV3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Traditional%20color%20ecommerce%20visual%20system%20phase%203%2C%20swatches%20grid%2C%20high%20detail&image_size=landscape_4_3',
    likes: 324,
    comments: 33,
    views: 1658,
    category: '品牌设计',
    tags: ['传统色', '电商', '系统'],
    featured: true,
  },
  {
    id: 152,
    title: '非遗IP·跨界联名·教育活动集',
    creator: 'IP设计师小跨教活集',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HeritageCrossoverEdu',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20intangible%20heritage%20crossover%20education%20events%20set%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 287,
    comments: 26,
    views: 1334,
    category: 'IP设计',
    tags: ['非遗', '跨界', '教育'],
    featured: true,
  },
  {
    id: 153,
    title: '国潮·高校演出KV·系列三',
    creator: '视觉设计师小演出系列三',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20CollegeShowV3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guochao%20college%20show%20KV%20series%203%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 346,
    comments: 37,
    views: 1746,
    category: '国潮设计',
    tags: ['高校', '演出', 'KV'],
    featured: true,
  },
  {
    id: 154,
    title: '景德镇·文创手绘图鉴·二卷',
    creator: '插画师小手绘二卷',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HandDrawCatalogV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Jingdezhen%20hand-drawn%20wares%20catalog%20volume%202%2C%20blue%20and%20white%2C%20high%20detail&image_size=landscape_4_3',
    likes: 239,
    comments: 19,
    views: 1040,
    category: '插画设计',
    tags: ['景德镇', '手绘', '图鉴'],
    featured: false,
  },
  {
    id: 155,
    title: '同仁堂·课堂教育插画·新版',
    creator: '插画师小堂课堂新版',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20TongrenClassNew',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tongrentang%20education%20illustration%20new%20edition%2C%20red%20and%20gold%2C%20flat%20style%2C%20high%20detail&image_size=landscape_4_3',
    likes: 226,
    comments: 18,
    views: 1008,
    category: '老字号品牌',
    tags: ['同仁堂', '教育', '插画'],
    featured: false,
  },
  {
    id: 156,
    title: '京剧·角色卡片·扩展包',
    creator: '插画师小角色扩展',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20OperaRolesPlus',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Peking%20opera%20role%20cards%20expansion%20pack%2C%20flat%20vector%2C%20high%20detail&image_size=landscape_4_3',
    likes: 231,
    comments: 19,
    views: 1016,
    category: '插画设计',
    tags: ['京剧', '角色', '卡片'],
    featured: false,
  },
  {
    id: 157,
    title: '海河·年度视觉主题·二期周边',
    creator: 'IP设计师小海年度二期',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HaiheYearV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Haihe%20annual%20visual%20theme%20merch%20phase%202%2C%20blue%20accent%2C%20high%20detail&image_size=landscape_4_3',
    likes: 296,
    comments: 27,
    views: 1414,
    category: 'IP设计',
    tags: ['海河', '年度', '周边'],
    featured: true,
  },
  {
    id: 158,
    title: '传统色·品牌KV·线下促销版',
    creator: '视觉设计师小色线下促',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20ColorKVOffline',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Traditional%20color%20brand%20KV%20offline%20promotion%2C%20swatches%20grid%2C%20high%20detail&image_size=landscape_4_3',
    likes: 318,
    comments: 30,
    views: 1552,
    category: '品牌设计',
    tags: ['传统色', 'KV', '促销'],
    featured: true,
  },
  {
    id: 159,
    title: '非遗·技艺流程海报·系列三',
    creator: '数字艺术家小流程三',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20HeritageFlowSeries3',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20intangible%20heritage%20process%20poster%20series%203%2C%20clean%20layout%2C%20high%20detail&image_size=landscape_4_3',
    likes: 229,
    comments: 19,
    views: 1018,
    category: '非遗传承',
    tags: ['流程', '非遗', '系列'],
    featured: false,
  },
  {
    id: 160,
    title: '国潮·高校社团·联名IP系列二',
    creator: 'IP设计师小社团系列二',
    creatorAvatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=Designer%20avatar%20GuochaoClubV2',
    thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Guochao%20college%20club%20IP%20collaboration%20series%202%2C%20bold%20graphics%2C%20high%20detail&image_size=landscape_4_3',
    likes: 362,
    comments: 41,
    views: 1882,
    category: '国潮设计',
    tags: ['高校', '社团', '联名'],
    featured: true,
  }
];

// 分类数据
const categories = [
  '全部', '国潮设计', '纹样设计', '品牌设计', '非遗传承', '插画设计', '工艺创新', '老字号品牌', 'IP设计', '包装设计'
];

export default function Explore() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredWorks, setFilteredWorks] = useState(mockWorks);
  const [isLoading, setIsLoading] = useState(true);
  const [fusionMode, setFusionMode] = useState(false);
  const [restored, setRestored] = useState(false);
  const [savedPlans, setSavedPlans] = useState<Array<{ id: string; title: string; query: string; aiText: string; ts: number }>>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagSortMode, setTagSortMode] = useState<'frequency' | 'alphabet'>('frequency');
  const [tagFilterMode, setTagFilterMode] = useState<'AND' | 'OR'>('AND');
  const [tagQuery, setTagQuery] = useState('');
  const [tagSuggestIndex, setTagSuggestIndex] = useState<number>(-1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [favoriteTags, setFavoriteTags] = useState<string[]>([]);
  const [favFirst, setFavFirst] = useState(false);
  const [showOnlyFavorite, setShowOnlyFavorite] = useState(false);
  const pageSize = 6;
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // 中文注释：精选作品横向滚动容器引用，用于左右箭头滚动
  const featuredScrollRef = useRef<HTMLDivElement | null>(null);
  const [featuredAtStart, setFeaturedAtStart] = useState(true);
  const [featuredAtEnd, setFeaturedAtEnd] = useState(false);
  // 中文注释：本地点赞状态（不影响真实数据，仅前端交互展示）
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [communityAnnouncement, setCommunityAnnouncement] = useState('');
  const [announcementSaved, setAnnouncementSaved] = useState(false);
  const [subCommunityGroup, setSubCommunityGroup] = useState<'style' | 'topic'>('style');
  const [activeSub, setActiveSub] = useState('');
  const [discussionTitle, setDiscussionTitle] = useState('');
  const [discussionContent, setDiscussionContent] = useState('');
  const [discussions, setDiscussions] = useState<Array<{ title: string; content: string; ts: number }>>([]);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleContent, setScheduleContent] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleGroup, setScheduleGroup] = useState<'style' | 'topic'>('style');
  const [scheduleSub, setScheduleSub] = useState('国潮');
  const [schedules, setSchedules] = useState<Array<{ title: string; content: string; time: string; group: string; sub: string }>>([]);
  
  // 模拟加载数据
  useEffect(() => {
    if (isPrefetched('explore')) {
      setIsLoading(false);
      return;
    }
    const t = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const updateFeaturedScrollState = () => {
      const el = featuredScrollRef.current;
      if (!el) return;
      setFeaturedAtStart(el.scrollLeft <= 0);
      setFeaturedAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };
    const el = featuredScrollRef.current;
    if (el) {
      updateFeaturedScrollState();
      el.addEventListener('scroll', updateFeaturedScrollState);
    }
    const onResize = () => updateFeaturedScrollState();
    window.addEventListener('resize', onResize);
    return () => {
      if (el) el.removeEventListener('scroll', updateFeaturedScrollState);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  
  // 筛选作品
  useEffect(() => {
    let result = mockWorks;
    if (selectedCategory !== '全部') {
      result = result.filter(work => work.category === selectedCategory);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(work => 
        work.title.toLowerCase().includes(term) || 
        work.creator.toLowerCase().includes(term) ||
        work.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    if (selectedTags.length > 0) {
      if (tagFilterMode === 'AND') {
        result = result.filter(work => selectedTags.every(t => work.tags.includes(t)));
      } else {
        result = result.filter(work => work.tags.some(t => selectedTags.includes(t)));
      }
    }
    setFilteredWorks(result);
    setPage(1);
  }, [selectedCategory, searchTerm, selectedTags, tagFilterMode]);

  // 解析查询参数同步到搜索框
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    if (q && q !== searchTerm) {
      setSearchTerm(q);
      setSelectedCategory('全部');
    }
    const tagsParam = params.get('tags');
    if (tagsParam) {
      const list = tagsParam.split(',').map(s => s.trim()).filter(Boolean);
      setSelectedTags(list);
    }
    const modeParam = params.get('tagMode');
    if (modeParam === 'OR' || modeParam === 'AND') {
      setTagFilterMode(modeParam as 'AND' | 'OR');
    }
    const favFirstParam = params.get('favFirst');
    if (favFirstParam === '1') setFavFirst(true);
    const favOnlyParam = params.get('favOnly');
    if (favOnlyParam === '1') setShowOnlyFavorite(true);
  }, [location.search]);

  useEffect(() => {
    if (!restored) {
      try {
        const plansRaw = localStorage.getItem('TOOLS_SAVED_PLANS');
        if (plansRaw) {
          const arr = JSON.parse(plansRaw);
          if (Array.isArray(arr)) setSavedPlans(arr);
        }
      } catch {}
      setRestored(true);
    }
  }, [restored]);

  // 路由查询变化时滚动到页面顶部，确保用户立即看到筛选结果
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (searchTerm) params.set('q', searchTerm); else params.delete('q');
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
      params.set('tagMode', tagFilterMode);
    } else {
      params.delete('tags');
      params.delete('tagMode');
    }
    if (favFirst) params.set('favFirst', '1'); else params.delete('favFirst');
    if (showOnlyFavorite) params.set('favOnly', '1'); else params.delete('favOnly');
    const next = params.toString();
    const current = new URLSearchParams(location.search).toString();
    if (next !== current) {
      navigate({ pathname: location.pathname, search: next }, { replace: true });
    }
  }, [searchTerm, selectedTags, tagFilterMode, favFirst, showOnlyFavorite]);
  
  const handleWorkClick = (workId: number) => {
    navigate(`/explore/${workId}`)
  };
  
  
  
  // 骨架屏加载状态在 JSX 内条件渲染，避免改变 Hook 调用顺序
  
  // 精选作品
  const featuredWorks = mockWorks.filter(work => work.featured);
  const sourceWorks = useMemo(() => (
    selectedCategory !== '全部'
      ? mockWorks.filter(w => w.category === selectedCategory)
      : mockWorks
  ), [selectedCategory]);
  const uniqueTags = useMemo(() => (
    Array.from(new Set(sourceWorks.flatMap(w => w.tags)))
  ), [sourceWorks]);
  const tagCounts: Record<string, number> = useMemo(() => (
    uniqueTags.reduce((acc, tag) => {
      acc[tag] = sourceWorks.reduce((sum, w) => sum + (w.tags.includes(tag) ? 1 : 0), 0);
      return acc;
    }, {} as Record<string, number>)
  ), [uniqueTags, sourceWorks]);
  const sortedTags = useMemo(() => (
    tagSortMode === 'frequency'
      ? [...uniqueTags].sort((a, b) => {
          const diff = (tagCounts[b] ?? 0) - (tagCounts[a] ?? 0);
          if (diff !== 0) return diff;
          return a.localeCompare(b, 'zh-Hans');
        })
      : [...uniqueTags].sort((a, b) => a.localeCompare(b, 'zh-Hans'))
  ), [uniqueTags, tagCounts, tagSortMode]);
  const popularTags = useMemo(() => sortedTags.slice(0, 24), [sortedTags]);
  const popularTagsDisplay = useMemo(() => (
    favFirst ? [...popularTags].sort((a, b) => Number(favoriteTags.includes(b)) - Number(favoriteTags.includes(a))) : popularTags
  ), [popularTags, favFirst, favoriteTags]);
  const otherTags = useMemo(() => (
    uniqueTags.filter(t => !popularTags.includes(t)).sort((a, b) => a.localeCompare(b, 'zh-Hans'))
  ), [uniqueTags, popularTags]);
  // 中文注释：AI标签推荐（命中已有标签与新标签）
  const aiTagRecommendations = useMemo(() => {
    const topic = `${selectedCategory !== '全部' ? selectedCategory : ''} ${searchTerm}`.trim();
    if (!topic) return { hits: [] as string[], novel: [] as string[] };
    const rec = llmService.recommendCulturalElements(topic);
    const hits = rec.filter(t => uniqueTags.includes(t));
    const novel = rec.filter(t => !uniqueTags.includes(t));
    return { hits, novel };
  }, [selectedCategory, searchTerm, uniqueTags]);
  
  const filteredTagList = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    const base = sortedTags;
    if (!q) return base;
    return base.filter(t => t.toLowerCase().includes(q));
  }, [tagQuery, sortedTags]);
  const displayTagList = useMemo(() => {
    let list = filteredTagList;
    if (showOnlyFavorite) list = list.filter(t => favoriteTags.includes(t));
    if (favFirst) list = [...list].sort((a, b) => Number(favoriteTags.includes(b)) - Number(favoriteTags.includes(a)));
    return list;
  }, [filteredTagList, favFirst, showOnlyFavorite, favoriteTags]);
  const renderHighlightedTag = (tag: string, q: string) => {
    const qq = q.trim();
    if (!qq) return tag;
    const lower = tag.toLowerCase();
    const idx = lower.indexOf(qq.toLowerCase());
    if (idx < 0) return tag;
    const pre = tag.slice(0, idx);
    const mid = tag.slice(idx, idx + qq.length);
    const suf = tag.slice(idx + qq.length);
    return (
      <span>
        <span>{pre}</span>
        <span className={`px-0.5 rounded ${isDark ? 'bg-purple-900 text-white' : 'bg-purple-100 text-purple-800'}`}>{mid}</span>
        <span>{suf}</span>
      </span>
    );
  };
  useEffect(() => {
    setTagSuggestIndex(filteredTagList.length > 0 ? 0 : -1);
  }, [tagQuery, filteredTagList]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('TOOLS_FAVORITE_TAGS');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setFavoriteTags(arr.filter(Boolean));
      }
      const ff = localStorage.getItem('TOOLS_FAV_FIRST');
      if (ff === '1') setFavFirst(true);
      const fo = localStorage.getItem('TOOLS_FAV_ONLY');
      if (fo === '1') setShowOnlyFavorite(true);
    } catch {}
  }, []);
  const toggleFavorite = (tag: string) => {
    setFavoriteTags(prev => {
      const next = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
      try { localStorage.setItem('TOOLS_FAVORITE_TAGS', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const moveFavorite = (tag: string, dir: -1 | 1) => {
    setFavoriteTags(prev => {
      const idx = prev.indexOf(tag);
      if (idx < 0) return prev;
      const to = idx + dir;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(to, 0, item);
      try { localStorage.setItem('TOOLS_FAVORITE_TAGS', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const addTagsFromQuery = (q: string) => {
    const tokens = Array.from(new Set(q.split(/[\,\s，、]+/).map(s => s.trim()).filter(Boolean)));
    if (tokens.length === 0) return;
    setSelectedTags(prev => {
      const set = new Set(prev);
      tokens.forEach(t => set.add(t));
      return Array.from(set);
    });
    setTagQuery('');
  };
  useEffect(() => {
    setTagsExpanded(false);
    setTagQuery('');
    setTagsOpen(false);
  }, [selectedCategory]);
  const pagedWorks = filteredWorks.slice(0, page * pageSize);

  

  // 中文注释：导出工具（下载为文件）
  // 中文注释：联名主题控制（老字号或“联名”标签时启用中国红+金色视觉）
  const isHeritage = selectedCategory === '老字号品牌' || selectedTags.includes('联名');
  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  // 中文注释：导出方案为 Markdown
  const exportPlanAsMarkdown = (p: { id: string; title: string; aiText: string }) => {
    const md = `# ${p.title}\n\n${p.aiText}\n`;
    downloadFile(`${p.title}.md`, md, 'text/markdown;charset=utf-8');
  };
  // 中文注释：导出方案为 JSON
  const exportPlanAsJSON = (p: { id: string; title: string; query: string; aiText: string; ts: number }) => {
    const json = JSON.stringify(p, null, 2);
    downloadFile(`${p.title}.json`, json, 'application/json;charset=utf-8');
  };

  useEffect(() => {
    if (isLoading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const maxPages = Math.ceil(filteredWorks.length / pageSize);
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        setPage((prev) => (prev < maxPages ? prev + 1 : prev));
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredWorks.length, pageSize, isLoading]);
  
  return (
    <SidebarLayout>
      <main className="relative container mx-auto px-4 py-8">
        <div className={`pointer-events-none absolute -top-10 -left-10 w-64 h-64 bg-gradient-to-br ${fusionMode ? 'from-indigo-500/20 via-fuchsia-500/20 to-amber-400/20' : 'from-blue-500/20 via-red-500/20 to-yellow-500/20'} blur-3xl rounded-full`}></div>
        <div className={`pointer-events-none absolute -bottom-10 -right-10 w-72 h-72 bg-gradient-to-tr ${fusionMode ? 'from-cyan-500/15 via-indigo-500/15 to-fuchsia-500/15' : 'from-red-500/15 via-yellow-500/15 to-blue-500/15'} blur-3xl rounded-full`}></div>
        {isLoading && (
          <div className="space-y-8">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} h-16 rounded-xl animate-pulse`}></div>
            <div className="flex space-x-3 overflow-x-auto pb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`${isDark ? 'bg-gray-800' : 'bg-white'} h-12 px-6 rounded-full animate-pulse`}></div>
              ))}
            </div>
            {/* 中文注释：加载状态下的主区域骨架改为三列布局 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} h-64 rounded-xl animate-pulse`}></div>
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} h-64 rounded-xl animate-pulse`}></div>
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} h-64 rounded-xl animate-pulse`}></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 中文注释：骨架屏保持三列布局 */}
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} h-56 rounded-xl animate-pulse`}></div>
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} h-4 w-3/4 rounded animate-pulse`}></div>
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} h-3 w-1/2 rounded animate-pulse`}></div>
                </div>
              ))}
            </div>
            </div>
          )}
        {!isLoading && (
          <div>
        {/* 中文注释：新增统一的渐变英雄区，让探索页更高级 */}
        <GradientHero
          title="探索作品"
          subtitle="发现国潮与非遗的高质内容，筛选你喜欢的风格与标签"
          badgeText="Beta"
          theme={isHeritage ? 'heritage' : (fusionMode ? 'indigo' : 'red')}
          variant={fusionMode ? 'split' : 'center'}
          size={fusionMode ? 'lg' : 'md'}
          pattern={fusionMode}
          stats={[
            { label: '频道', value: selectedCategory || '全部' },
            { label: '标签', value: String(selectedTags.length || 0) },
            { label: '特色', value: '策展' },
            { label: '更新', value: '实时' },
          ]}
        />
        <div className="mb-4 flex items-center gap-2">
          <motion.button type="button" whileHover={{ scale: 1.03 }} onClick={() => setFusionMode(v => !v)} className={`px-3 py-1.5 rounded-lg ${fusionMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : (isDark ? 'bg-gray-800 text-white hover:bg-gray-700 ring-1 ring-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50 ring-1 ring-gray-200')} focus:outline-none focus:ring-2 ${fusionMode ? 'focus:ring-indigo-500' : (isDark ? 'focus:ring-gray-600' : 'focus:ring-gray-300')} focus:ring-offset-2`}>{fusionMode ? '融合模式：开' : '融合模式：关'}</motion.button>
        </div>
        
        {/* 中文注释：社区介绍区已迁移至创作者社区页面 */}
        {/* 搜索框 */}
        <motion.div 
          className={`mb-8 p-4 rounded-2xl ${isDark ? 'bg-gray-800/80 ring-1 ring-gray-700 backdrop-blur' : 'bg-white/80 ring-1 ring-gray-200 backdrop-blur'} shadow-sm`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索作品、创作者或标签..."
              className={`w-full pl-12 pr-4 py-3 rounded-full focus:outline-none focus:ring-2 ${
                isDark 
                  ? (isHeritage ? 'bg-gray-700/70 ring-1 ring-gray-600 text-white placeholder-gray-400 focus:ring-amber-500' : 'bg-gray-700/70 ring-1 ring-gray-600 text-white placeholder-gray-400 focus:ring-purple-500') 
                  : (isHeritage ? 'bg-white/80 ring-1 ring-gray-300 text-gray-900 placeholder-gray-400 focus:ring-amber-300' : 'bg-white/80 ring-1 ring-gray-300 text-gray-900 placeholder-gray-400 focus:ring-pink-300')
              }`}
            />
            <i className={`fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
          </div>
        </motion.div>

        {savedPlans.length > 0 && (
          <motion.div
            className={`${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} rounded-2xl p-4 shadow-sm mb-8`}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold">我的方案</div>
              <button onClick={() => { setSavedPlans([]); try { localStorage.removeItem('TOOLS_SAVED_PLANS'); } catch {} }} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-2 py-1 rounded text-xs`}>清空</button>
            </div>
            <ul className="space-y-2">
              {savedPlans.map(p => (
                <li key={p.id} className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded p-2`}>
                  <div className="text-sm font-medium mb-1">{p.title}</div>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/create?from=explore&prompt=${encodeURIComponent(p.aiText || p.query)}`)} className="px-2 py-1 rounded text-xs bg-blue-600 text-white">应用到创作中心</button>
                    <button onClick={async () => { try { await navigator.clipboard.writeText(p.aiText || p.query); } catch {} }} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-2 py-1 rounded text-xs`}>复制</button>
                    {/* 中文注释：导出方案为 Markdown 文件 */}
                    <button onClick={() => exportPlanAsMarkdown(p)} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-2 py-1 rounded text-xs`}>导出MD</button>
                    {/* 中文注释：导出方案为 JSON 文件 */}
                    <button onClick={() => exportPlanAsJSON(p)} className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} px-2 py-1 rounded text-xs`}>导出JSON</button>
                    <button onClick={() => { const next = savedPlans.filter(x => x.id !== p.id); setSavedPlans(next); try { localStorage.setItem('TOOLS_SAVED_PLANS', JSON.stringify(next)); } catch {} }} className="px-2 py-1 rounded text-xs bg-red-600 text-white">删除</button>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* 分类筛选 */}
        {/* 分类筛选 */}
        <motion.div 
          className="mb-8 overflow-x-auto pb-4 scrollbar-hide"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex space-x-3 min-w-max">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ring-1 ${
                  selectedCategory === category 
                    ? (category === '老字号品牌' 
                        ? 'bg-gradient-to-r from-red-700 to-amber-500 text-white ring-amber-500 shadow-sm' 
                        : 'bg-gradient-to-r from-red-600 to-pink-600 text-white ring-pink-600 shadow-sm') 
                    : isDark 
                      ? 'bg-gray-800 ring-gray-700 hover:bg-gray-700' 
                      : 'bg-white ring-gray-200 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* 中文注释：社区模块已迁移至创作者社区页面，这里不再展示 */}

        {/* 标签筛选 */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm opacity-70">{selectedCategory === '全部' ? '标签筛选' : `${selectedCategory}标签筛选`}（{selectedTags.length} 已选）</div>
              <div className="flex items-center gap-2">
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}
                  >清空标签</button>
                )}
                <button
                  onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 1500); } catch {} }}
                  className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-800 text-gray-300 ring-1 ring-gray-700' : 'bg-white text-gray-700 ring-1 ring-gray-200'}`}
                >{copiedLink ? '已复制链接' : '复制筛选链接'}</button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setTagsOpen(v => !v)}
                  className={`text-xs px-3 py-1 rounded-full ring-1 ${tagsOpen ? (isHeritage ? 'bg-amber-600 text-white ring-amber-600' : 'bg-purple-600 text-white ring-purple-600') : (isDark ? 'bg-gray-800 text-gray-300 ring-gray-700' : 'bg-white text-gray-700 ring-gray-200')}`}
                >{tagsOpen ? '收起' : '选择标签'}</motion.button>
              </div>
            </div>
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTags.map(tag => (
                <button
                  key={`selected-${tag}`}
                  onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                  className={`text-xs px-3 py-1 rounded-full ${isDark ? (isHeritage ? 'bg-amber-700 text-white' : 'bg-purple-800 text-white') : (isHeritage ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700')}`}
                  aria-pressed={true}
                >{tag} ×</button>
              ))}
            </div>
          )}
          {tagsOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} rounded-2xl p-4 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-sm opacity-70">标签排序</div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTagSortMode('frequency')}
                      className={`text-xs px-3 py-1 rounded-full ring-1 ${tagSortMode === 'frequency' ? (isHeritage ? 'bg-amber-600 text-white ring-amber-600' : 'bg-purple-600 text-white ring-purple-600') : (isDark ? 'bg-gray-700 text-gray-200 ring-gray-600' : 'bg-white text-gray-700 ring-gray-200')}`}
                    >按频次</button>
                    <button
                      onClick={() => setTagSortMode('alphabet')}
                      className={`text-xs px-3 py-1 rounded-full ring-1 ${tagSortMode === 'alphabet' ? (isHeritage ? 'bg-amber-600 text-white ring-amber-600' : 'bg-purple-600 text-white ring-purple-600') : (isDark ? 'bg-gray-700 text-gray-200 ring-gray-600' : 'bg-white text-gray-700 ring-gray-200')}`}
                    >按字母</button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm opacity-70">匹配方式</div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTagFilterMode('AND')}
                      className={`text-xs px-3 py-1 rounded-full ring-1 ${tagFilterMode === 'AND' ? (isHeritage ? 'bg-amber-600 text-white ring-amber-600' : 'bg-purple-600 text-white ring-purple-600') : (isDark ? 'bg-gray-700 text-gray-200 ring-gray-600' : 'bg-white text-gray-700 ring-gray-200')}`}
                    >同时包含</button>
                    <button
                      onClick={() => setTagFilterMode('OR')}
                      className={`text-xs px-3 py-1 rounded-full ring-1 ${tagFilterMode === 'OR' ? (isHeritage ? 'bg-amber-600 text-white ring-amber-600' : 'bg-purple-600 text-white ring-purple-600') : (isDark ? 'bg-gray-700 text-gray-200 ring-gray-600' : 'bg-white text-gray-700 ring-gray-200')}`}
                    >任一包含</button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm opacity-70">收藏显示</div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFavFirst(v => { const nv = !v; try { localStorage.setItem('TOOLS_FAV_FIRST', nv ? '1' : '0'); } catch {} return nv; })}
                      className={`text-xs px-3 py-1 rounded-full ring-1 ${favFirst ? (isHeritage ? 'bg-amber-600 text-white ring-amber-600' : 'bg-purple-600 text-white ring-purple-600') : (isDark ? 'bg-gray-700 text-gray-200 ring-gray-600' : 'bg-white text-gray-700 ring-gray-200')}`}
                    >收藏优先</button>
                    <button
                      onClick={() => setShowOnlyFavorite(v => { const nv = !v; try { localStorage.setItem('TOOLS_FAV_ONLY', nv ? '1' : '0'); } catch {} return nv; })}
                      className={`text-xs px-3 py-1 rounded-full ring-1 ${showOnlyFavorite ? (isHeritage ? 'bg-amber-600 text-white ring-amber-600' : 'bg-purple-600 text-white ring-purple-600') : (isDark ? 'bg-gray-700 text-gray-200 ring-gray-600' : 'bg-white text-gray-700 ring-gray-200')}`}
                    >仅看收藏</button>
                  </div>
                </div>
              <div className={`relative`}> 
                  <input
                    type="text"
                    value={tagQuery}
                    onChange={(e) => setTagQuery(e.target.value)}
                    onKeyDown={(e) => {
                      const q = tagQuery.trim();
                      if (e.key === 'Backspace' && !q) {
                        setSelectedTags(prev => prev.slice(0, Math.max(0, prev.length - 1)));
                        return;
                      }
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setTagSuggestIndex(i => {
                          const next = i + 1;
                          const max = Math.min(filteredTagList.length, 8) - 1;
                          return Math.max(0, Math.min(next, max));
                        });
                        return;
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setTagSuggestIndex(i => Math.max(0, i - 1));
                        return;
                      }
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        if (!q && filteredTagList.length === 0) return;
                        const pick = tagSuggestIndex >= 0 ? filteredTagList[tagSuggestIndex] : filteredTagList[0];
                        if (pick) {
                          setSelectedTags(prev => prev.includes(pick) ? prev : [...prev, pick]);
                          setTagQuery('');
                        }
                        return;
                      }
                      if (e.ctrlKey && e.key === 'Enter') { setTagsOpen(false); return; }
                      if (e.key === 'Escape') { if (q) setTagQuery(''); else setTagsOpen(false); return; }
                      if (e.key !== 'Enter') return;
                      if (!q) return;
                      const tokens = q.split(/[\,\s，、]+/).map(s => s.trim()).filter(Boolean);
                      if (tokens.length > 1) {
                        addTagsFromQuery(q);
                        return;
                      }
                      const pick = tagSuggestIndex >= 0 ? filteredTagList[tagSuggestIndex] : filteredTagList[0];
                      if (pick) {
                        setSelectedTags(prev => prev.includes(pick) ? prev : [...prev, pick]);
                        setTagQuery('');
                      } else {
                        addTagsFromQuery(q);
                      }
                    }}
                    placeholder="搜索标签"
                    className={`text-xs px-3 py-1 pr-8 rounded-full focus:outline-none focus:ring-2 ${isDark ? (isHeritage ? 'bg-gray-700 text-gray-200 ring-1 ring-gray-600 focus:ring-amber-500' : 'bg-gray-700 text-gray-200 ring-1 ring-gray-600 focus:ring-purple-500') : (isHeritage ? 'bg-white text-gray-700 ring-1 ring-gray-200 focus:ring-amber-300' : 'bg-white text-gray-700 ring-1 ring-gray-200 focus:ring-purple-300')}`}
                  />
                  {tagQuery && (
                    <button
                      onClick={() => setTagQuery('')}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 text-xs px-1`}
                    >×</button>
                  )}
                  {tagQuery && filteredTagList.length > 0 && (
                    <ul className={`${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} absolute left-0 mt-1 w-full rounded-xl shadow-sm max-h-40 overflow-auto z-10`}>
                      {filteredTagList.slice(0, 8).map((tag, idx) => (
                        <li key={`sug-${tag}`}>
                          <button
                            onMouseEnter={() => setTagSuggestIndex(idx)}
                            onClick={() => { setSelectedTags(prev => prev.includes(tag) ? prev : [...prev, tag]); setTagQuery(''); }}
                            className={`flex items-center justify-between w-full text-left px-3 py-2 text-xs ${idx === tagSuggestIndex ? (isDark ? (isHeritage ? 'bg-amber-900 text-white' : 'bg-purple-900 text-white') : (isHeritage ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800')) : (isDark ? 'text-gray-200' : 'text-gray-700')}`}
                          >
                            <span>{renderHighlightedTag(tag, tagQuery)}</span>
                            <span className={`ml-2 text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>出现 {tagCounts[tag] ?? 0} 次</span>
                          </button>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(tag); }} className="px-2 py-1 text-[12px]">
                              <i className={`${favoriteTags.includes(tag) ? 'fas fa-star text-yellow-500' : 'far fa-star'} `}></i>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {favoriteTags.filter(t => uniqueTags.includes(t)).length > 0 && (
                  <div className="w-full">
                    <div className="text-xs opacity-70 mb-1">常用标签</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {favoriteTags.filter(t => uniqueTags.includes(t)).slice(0, 24).map(tag => (
                        <div key={`fav-${tag}`} className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                            className={`text-xs px-3 py-1 rounded-full transition-all ${selectedTags.includes(tag) ? (isHeritage ? 'bg-amber-600 text-white' : 'bg-purple-600 text-white') : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}`}
                          >{tag}<span className={`ml-1 text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>({tagCounts[tag] ?? 0})</span></button>
                          <button onClick={() => toggleFavorite(tag)} className={`text-[11px] px-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} aria-label="取消收藏">
                            <i className={`${favoriteTags.includes(tag) ? 'fas fa-star text-yellow-500' : 'far fa-star'}`}></i>
                          </button>
                          <button onClick={() => moveFavorite(tag, -1)} className={`text-[11px] px-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} aria-label="上移">▲</button>
                          <button onClick={() => moveFavorite(tag, 1)} className={`text-[11px] px-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} aria-label="下移">▼</button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { setFavoriteTags([]); try { localStorage.removeItem('TOOLS_FAVORITE_TAGS'); } catch {} }} className={`text-[11px] px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>清空收藏</button>
                  </div>
                )}
                {popularTagsDisplay.map(tag => (
                  <div key={`pop-${tag}`} className="inline-flex items-center gap-1">
                    <button
                      onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                      className={`text-xs px-3 py-1 rounded-full transition-all ${selectedTags.includes(tag) ? (isHeritage ? 'bg-amber-600 text-white' : 'bg-purple-600 text-white') : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}`}
                    >{tag}<span className={`ml-1 text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>({tagCounts[tag] ?? 0})</span></button>
                    <button onClick={() => toggleFavorite(tag)} className={`text-[11px] px-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} aria-label="收藏">
                      <i className={`${favoriteTags.includes(tag) ? 'fas fa-star text-yellow-500' : 'far fa-star'}`}></i>
                    </button>
                  </div>
                ))}
              </div>
              {/* 中文注释：AI标签推荐区（可一键添加） */}
              {(aiTagRecommendations.hits.length > 0 || aiTagRecommendations.novel.length > 0) && (
                <div className="mb-3">
                  {aiTagRecommendations.hits.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs opacity-70 mb-1">AI建议标签（命中已有）</div>
                      <div className="flex flex-wrap gap-2">
                        {aiTagRecommendations.hits.map(tag => (
                          <button key={`ai-hit-${tag}`} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev : [...prev, tag])} className={`text-xs px-3 py-1 rounded-full ${selectedTags.includes(tag) ? (isHeritage ? 'bg-amber-600 text-white' : 'bg-purple-600 text-white') : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}`}>{tag}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiTagRecommendations.novel.length > 0 && (
                    <div>
                      <div className="text-xs opacity-70 mb-1">AI新标签（可能暂无作品）</div>
                      <div className="flex flex-wrap gap-2">
                        {aiTagRecommendations.novel.map(tag => (
                          <button key={`ai-novel-${tag}`} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev : [...prev, tag])} className={`text-xs px-3 py-1 rounded-full ${selectedTags.includes(tag) ? (isHeritage ? 'bg-amber-600 text-white' : 'bg-purple-600 text-white') : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}`}>{tag}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="mb-2 text-sm opacity-70">全部标签</div>
              <div className="max-h-44 overflow-y-auto pr-1">
                <div className="flex flex-wrap gap-2">
                  {displayTagList.map(tag => (
                    <div key={`all-${tag}`} className="inline-flex items-center gap-1">
                      <button
                        onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={`text-xs px-3 py-1 rounded-full transition-all ${selectedTags.includes(tag) ? (isHeritage ? 'bg-amber-600 text-white' : 'bg-purple-600 text-white') : (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}`}
                      >{renderHighlightedTag(tag, tagQuery)}<span className={`ml-1 text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>({tagCounts[tag] ?? 0})</span></button>
                      <button onClick={() => toggleFavorite(tag)} className={`text-[11px] px-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} aria-label="收藏">
                        <i className={`${favoriteTags.includes(tag) ? 'fas fa-star text-yellow-500' : 'far fa-star'}`}></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setSelectedTags([])}
                  className={`text-xs px-3 py-1 rounded-lg ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}
                >清空</button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setTagsOpen(false)}
                  className={`text-xs px-3 py-1 rounded-lg ${isHeritage ? 'bg-amber-600 text-white' : 'bg-purple-600 text-white'}`}
                >完成</motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* 中文注释：社区侧栏已迁移至创作者社区页面 */}

        {/* 中文注释：讨论区已迁移至创作者社区页面 */}

        {/* 中文注释：创作者详情弹窗已迁移至创作者社区页面 */}

        {/* 中文注释：社群详情弹窗已迁移至创作者社区页面 */}
        
        {/* 精选作品 */}
        {featuredWorks.length > 0 && (
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <i className="fas fa-star text-yellow-500 mr-2"></i>
              精选作品
            </h2>
            
            <div className="relative">
              <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-10 ${isDark ? 'bg-gradient-to-r from-gray-900 to-transparent' : 'bg-gradient-to-r from-white to-transparent'} ${featuredAtStart ? 'opacity-0' : 'opacity-100'} transition-opacity`}></div>
              <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-10 ${isDark ? 'bg-gradient-to-l from-gray-900 to-transparent' : 'bg-gradient-to-l from-white to-transparent'} ${featuredAtEnd ? 'opacity-0' : 'opacity-100'} transition-opacity`}></div>
              <div className="overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory" ref={featuredScrollRef}>
                <div className="flex space-x-6 pb-4 min-w-max">
                  {featuredWorks.map((work) => (
                    <motion.div
                      key={work.id}
                      className={`w-80 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md snap-start`}
                      whileHover={{ y: -5 }}
                      onClick={() => handleWorkClick(work.id)}
                    >
                      <div className="relative">
                        <TianjinImage src={work.thumbnail} alt={work.title} ratio="landscape" rounded="2xl" withBorder />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          {/* 中文注释：精选徽章与“联名”徽章并排展示（联名时显示） */}
                          <span className={`text-xs px-2 py-1 rounded-full backdrop-blur ${isDark ? 'bg-gray-800/70 ring-1 ring-gray-700 text-gray-200' : 'bg-white/80 ring-1 ring-gray-200 text-gray-700'}`}>
                            精选
                          </span>
                          {work.tags.includes('联名') && (
                            <span className={`text-xs px-2 py-1 rounded-full backdrop-blur ${isHeritage ? 'bg-amber-600/80 ring-1 ring-amber-500 text-white' : (isDark ? 'bg-gray-800/70 ring-1 ring-gray-700 text-gray-200' : 'bg-white/80 ring-1 ring-gray-200 text-gray-700')}`}>
                              联名
                            </span>
                          )}
                        </div>
                        <div className="absolute top-3 right-3">
                          {/* 中文注释：点赞切换（本地状态），避免触发卡片点击 */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setLiked(prev => ({ ...prev, [work.id]: !prev[work.id] })); }}
                            aria-pressed={Boolean(liked[work.id])}
                            className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full transition-colors"
                          >
                            <i className={`${liked[work.id] ? 'fas' : 'far'} fa-heart`}></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold">{work.title}</h3>
                          <span className={`text-sm px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} text-gray-600`}>
                            {work.category}
                          </span>
                        </div>
                        
                        <div className="flex items-center mb-4">
                          <img 
                            src={work.creatorAvatar} 
                            alt={work.creator} 
                            className="w-6 h-6 rounded-full mr-2"
                            loading="lazy" decoding="async"
                          />
                          <span className="text-sm opacity-80">{work.creator}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center">
                            <i className="far fa-eye mr-1"></i>
                            <span>{work.views}</span>
                          </div>
                          <div className="flex items-center">
                            <i className="far fa-thumbs-up mr-1"></i>
                            <span>{work.likes + (liked[work.id] ? 1 : 0)}</span>
                          </div>
                          <div className="flex items-center">
                            <i className="far fa-comment mr-1"></i>
                            <span>{work.comments}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* 左右滚动箭头 */}
              <button
                aria-label="向左滚动精选作品"
                onClick={() => { const el = featuredScrollRef.current; if (el) el.scrollBy({ left: -320, behavior: 'smooth' }); }}
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 hidden md:block p-2 rounded-full shadow-md ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'} ${featuredAtStart ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button
                aria-label="向右滚动精选作品"
                onClick={() => { const el = featuredScrollRef.current; if (el) el.scrollBy({ left: 320, behavior: 'smooth' }); }}
                className={`absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 hidden md:block p-2 rounded-full shadow-md ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'} ${featuredAtEnd ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </motion.div>
        )}
        
        {/* 作品列表 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-6">探索作品</h2>
          
          {pagedWorks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 中文注释：作品列表固定三列布局 */}
              {pagedWorks.map((work) => (
                <motion.div
                  key={work.id}
                  className={`${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'} rounded-2xl overflow-hidden shadow-sm transition-transform hover:shadow-lg hover:-translate-y-1`}
                  whileHover={{ y: -5 }}
                  onClick={() => handleWorkClick(work.id)}
                >
                  <div className="relative">
                    <TianjinImage src={work.thumbnail} alt={work.title} ratio="landscape" rounded="2xl" />
                    {work.tags.includes('联名') && (
                      <div className="absolute top-3 left-3">
                        {/* 中文注释：联名徽章（普通卡片） */}
                        <span className={`text-xs px-2 py-1 rounded-full backdrop-blur ${isHeritage ? 'bg-amber-600/80 ring-1 ring-amber-500 text-white' : (isDark ? 'bg-gray-800/70 ring-1 ring-gray-700 text-gray-200' : 'bg-white/80 ring-1 ring-gray-200 text-gray-700')}`}>
                          联名
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <button className={`p-2 rounded-full transition-colors ${
                        isDark ? 'bg-gray-900/60 hover:bg-gray-900/80' : 'bg-white/70 hover:bg-white'
                      } ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'} shadow-sm` }>
                        <i className="far fa-heart"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold tracking-tight">{work.title}</h3>
                      <span className={`text-sm px-2 py-0.5 rounded-full ${
                        work.category === '老字号品牌' 
                          ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' 
                          : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
                      }`}>
                        {work.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <img 
                        src={work.creatorAvatar} 
                        alt={work.creator} 
                        className="w-6 h-6 rounded-full mr-2"
                        loading="lazy" decoding="async"
                      />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {work.creator}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {work.tags.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index} 
                          className={`text-xs px-2 py-1 rounded-full ${
                            isDark ? 'bg-gray-700' : 'bg-gray-100'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center">
                        <i className="far fa-eye mr-1"></i>
                        <span>{work.views}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="far fa-thumbs-up mr-1"></i>
                        <span>{work.likes}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="far fa-comment mr-1"></i>
                        <span>{work.comments}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button onClick={(e) => { e.stopPropagation(); const prompt = `${work.title} · ${work.category} · ${work.tags.join(' / ')}`; navigate(`/create?from=explore&prompt=${encodeURIComponent(prompt)}`) }} className="px-3 py-1.5 rounded text-xs bg-blue-600 text-white">应用到创作中心</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mb-4 text-5xl text-gray-400">
                <i className="fas fa-search"></i>
              </div>
              <h3 className="text-xl font-medium mb-2">未找到相关作品</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                请尝试其他关键词或分类
              </p>
            </div>
          )}
          
          {/* 无限滚动哨兵 */}
          <div className="text-center mt-10">
            {page * pageSize < filteredWorks.length ? (
              <div ref={sentinelRef} className="h-10"></div>
            ) : (
              <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>已加载全部</span>
            )}
          </div>
        </motion.div>
          </div>
        )}
      </main>
      <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4`}>
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            © 2025 AI共创平台. 保留所有权利
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/about" className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>隐私政策</Link>
            <Link to="/about" className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>服务条款</Link>
            <Link to="/about" className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>帮助中心</Link>
          </div>
        </div>
      </footer>
    </SidebarLayout>
  );
}
