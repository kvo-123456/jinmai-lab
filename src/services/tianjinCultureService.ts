/**
 * 天津历史文化知识库服务
 * 提供天津历史、文化、艺术等相关知识的查询和管理功能
 */

// 知识库条目类型定义
export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  content: string;
  imageUrl?: string;
  relatedItems?: string[];
  sources?: string[];
  createdAt: number;
  updatedAt: number;
}

// 知识库分类
export const KNOWLEDGE_CATEGORIES = [
  '历史人物',
  '历史事件',
  '文化遗产',
  '传统技艺',
  '民俗文化',
  '建筑风格',
  '地方小吃',
  '方言文化',
  '文学艺术',
  '宗教信仰'
] as const;

// 天津历史文化知识库数据
const tianjinKnowledgeBase: KnowledgeItem[] = [
  {
    id: 'tj-001',
    title: '杨柳青年画',
    category: '文化遗产',
    subcategory: '传统美术',
    content: '杨柳青年画是中国著名的民间木版年画之一，起源于天津市杨柳青镇，具有悠久的历史和独特的艺术风格。其特点是色彩鲜艳、线条流畅、形象生动，内容多以吉祥喜庆、历史故事、神话传说等为主题。杨柳青年画的制作工艺复杂，包括勾、刻、印、画、裱等多个环节，是中国民间艺术的瑰宝。',
    imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Yangliuqing%20New%20Year%20Painting%2C%20traditional%20Chinese%20art%2C%20vibrant%20colors%2C%20high%20detail',
    relatedItems: ['泥人张彩塑', '天津风筝魏'],
    sources: ['《中国民间美术史》', '《天津地方志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-002',
    title: '泥人张彩塑',
    category: '传统技艺',
    subcategory: '雕塑艺术',
    content: '泥人张彩塑是天津著名的民间传统手工艺品，创始于清代道光年间，以张明山为代表。其作品以细腻的手法、逼真的形象和丰富的色彩著称，题材广泛，包括历史人物、民间故事、神话传说等。泥人张彩塑的制作工艺精湛，从取土、和泥、塑造到彩绘，每一个环节都需要高超的技艺和丰富的经验。',
    imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Nirenzhang%20clay%20sculpture%2C%20traditional%20Chinese%20craft%2C%20detailed%20figures%2C%20vibrant%20colors',
    relatedItems: ['杨柳青年画', '天津风筝魏'],
    sources: ['《中国传统工艺全集》', '《天津民间艺术志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-003',
    title: '天津方言',
    category: '方言文化',
    subcategory: '地方语言',
    content: '天津方言是中国北方方言的一种，具有独特的语音、词汇和语法特点。天津方言的语音特点包括一声变调、轻声较多、儿化音丰富等；词汇方面有很多独特的方言词，如“嘛”（什么）、“哏儿”（有趣）、“倍儿”（非常）等；语法上也有一些特殊的表达方式。天津方言生动活泼，富有表现力，是天津地域文化的重要组成部分。',
    relatedItems: ['天津民俗', '天津曲艺'],
    sources: ['《天津方言词典》', '《汉语方言大词典》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-004',
    title: '天津之眼',
    category: '建筑风格',
    subcategory: '现代建筑',
    content: '天津之眼是世界上唯一建在桥上的摩天轮，位于天津市红桥区海河畔，是天津的标志性建筑之一。摩天轮直径110米，轮外装挂48个360度透明座舱，每个座舱可乘坐8人，旋转一周约需30分钟。天津之眼不仅是一个游乐设施，也是欣赏天津城市风光的绝佳地点，尤其是夜晚灯光亮起时，美轮美奂。',
    imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20Eye%20Ferris%20wheel%20at%20night%2C%20beautiful%20lights%2C%20Tianjin%20China%2C%20high%20detail',
    relatedItems: ['海河', '天津夜景'],
    sources: ['天津旅游局官方网站', '《天津城市规划志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-005',
    title: '狗不理包子',
    category: '地方小吃',
    subcategory: '传统美食',
    content: '狗不理包子是天津著名的传统小吃，始创于清代咸丰年间，以其皮薄、馅大、味道鲜美而闻名。其特点是选用优质面粉制作皮料，馅料讲究，制作工艺精细，每个包子有18个褶。狗不理包子的名称来源于创始人高贵有（乳名“狗子”），因其生意繁忙，顾不上搭理顾客，久而久之被称为“狗不理”。',
    imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Goubuli%20steamed%20buns%2C%20traditional%20Chinese%20food%2C%20delicious%20looking',
    relatedItems: ['十八街麻花', '耳朵眼炸糕'],
    sources: ['《天津小吃志》', '《中国名小吃大全》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-006',
    title: '五大道建筑群',
    category: '建筑风格',
    subcategory: '近代建筑',
    content: '五大道位于天津市和平区，是天津近代建筑的集中地，拥有英、法、意、德、西班牙等国各式建筑2000多栋，其中风貌建筑300余栋。这些建筑风格多样，包括哥特式、罗马式、巴洛克式、文艺复兴式等，被誉为“万国建筑博览馆”。五大道是天津历史文化的重要载体，反映了天津近代的发展历程和多元文化融合的特点。',
    imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Wudadao%20historical%20buildings%2C%20Tianjin%20China%2C%20European%20style%20architecture%2C%20tree-lined%20streets%2C%20high%20detail',
    relatedItems: ['意式风情区', '天津租界历史'],
    sources: ['《天津近代建筑志》', '《五大道历史文化街区保护规划》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-007',
    title: '天津时调',
    category: '文学艺术',
    subcategory: '曲艺',
    content: '天津时调是天津特有的曲艺形式，起源于清代，流行于天津及周边地区。它以天津方言演唱，曲调丰富，表现力强，内容多反映天津人民的生活和思想感情。天津时调的表演形式简单，通常由一人演唱，伴奏乐器主要有三弦、四胡等。其代表曲目有《放风筝》、《踢毽》、《大西厢》等。',
    relatedItems: ['京韵大鼓', '天津快板'],
    sources: ['《中国曲艺志·天津卷》', '《天津曲艺史》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-008',
    title: '天后宫',
    category: '宗教信仰',
    subcategory: '道教',
    content: '天津天后宫俗称“娘娘宫”，位于南开区古文化街中心，是天津市区最古老的建筑群之一，也是中国北方最大的妈祖庙。天后宫始建于元代，明永乐年间重建，是天津城市发展的历史见证。天后宫内供奉着海神妈祖，每年农历三月二十三日是妈祖诞辰，届时会举行盛大的庙会活动，吸引众多信徒和游客前来朝拜。',
    imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20Tianhou%20Palace%2C%20traditional%20Chinese%20architecture%2C%20red%20walls%20and%20yellow%20roofs%2C%20high%20detail',
    relatedItems: ['古文化街', '妈祖文化'],
    sources: ['《天津天后宫志》', '《中国道教宫观志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// 知识库服务类
class TianjinCultureService {
  private knowledgeBase: KnowledgeItem[] = tianjinKnowledgeBase;
  private readonly STORAGE_KEY = 'TIANJIN_CULTURE_KNOWLEDGE';

  constructor() {
    this.loadKnowledgeBase();
  }

  /**
   * 从本地存储加载知识库
   */
  private loadKnowledgeBase() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 合并本地存储和默认数据，去重
        const merged = [...this.knowledgeBase];
        parsed.forEach((item: KnowledgeItem) => {
          const exists = merged.some(existing => existing.id === item.id);
          if (!exists) {
            merged.push(item);
          }
        });
        this.knowledgeBase = merged;
      }
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    }
  }

  /**
   * 保存知识库到本地存储
   */
  private saveKnowledgeBase() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.knowledgeBase));
    } catch (error) {
      console.error('Failed to save knowledge base:', error);
    }
  }

  /**
   * 获取所有知识库条目
   */
  getAllKnowledge(): KnowledgeItem[] {
    return [...this.knowledgeBase];
  }

  /**
   * 根据ID获取知识库条目
   */
  getKnowledgeById(id: string): KnowledgeItem | undefined {
    return this.knowledgeBase.find(item => item.id === id);
  }

  /**
   * 根据分类获取知识库条目
   */
  getKnowledgeByCategory(category: string): KnowledgeItem[] {
    return this.knowledgeBase.filter(item => item.category === category);
  }

  /**
   * 根据子分类获取知识库条目
   */
  getKnowledgeBySubcategory(subcategory: string): KnowledgeItem[] {
    return this.knowledgeBase.filter(item => item.subcategory === subcategory);
  }

  /**
   * 搜索知识库条目
   */
  searchKnowledge(query: string): KnowledgeItem[] {
    const lowerQuery = query.toLowerCase();
    return this.knowledgeBase.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 添加知识库条目
   */
  addKnowledge(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeItem {
    const newItem: KnowledgeItem = {
      ...item,
      id: `tj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.knowledgeBase.push(newItem);
    this.saveKnowledgeBase();
    return newItem;
  }

  /**
   * 更新知识库条目
   */
  updateKnowledge(id: string, updates: Partial<KnowledgeItem>): KnowledgeItem | undefined {
    const index = this.knowledgeBase.findIndex(item => item.id === id);
    if (index === -1) {
      return undefined;
    }

    this.knowledgeBase[index] = {
      ...this.knowledgeBase[index],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveKnowledgeBase();
    return this.knowledgeBase[index];
  }

  /**
   * 删除知识库条目
   */
  deleteKnowledge(id: string): boolean {
    const initialLength = this.knowledgeBase.length;
    this.knowledgeBase = this.knowledgeBase.filter(item => item.id !== id);
    const deleted = this.knowledgeBase.length < initialLength;
    
    if (deleted) {
      this.saveKnowledgeBase();
    }
    
    return deleted;
  }

  /**
   * 获取相关条目
   */
  getRelatedItems(id: string): KnowledgeItem[] {
    const item = this.getKnowledgeById(id);
    if (!item || !item.relatedItems) {
      return [];
    }

    return item.relatedItems
      .map(relatedId => this.getKnowledgeById(relatedId))
      .filter((item): item is KnowledgeItem => item !== undefined);
  }
}

// 导出单例实例
const service = new TianjinCultureService();
export default service;
