/**
 * 创作模板服务模块
 * 提供模板的创建、读取、更新、删除等功能
 */

// 模板类型定义
export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  tags: string[];
  category: string;
  isOfficial: boolean;
  userId?: string;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  thumbnail?: string;
  // 新增模板元数据
  author?: string;
  version: string;
  rating?: number;
  downloadCount?: number;
  previewUrl?: string;
  isFeatured?: boolean;
  // 模板配置选项
  config?: {
    model?: string;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    style?: string;
    resolution?: string;
    aspect_ratio?: string;
    duration?: number;
    fps?: number;
  };
  // 模板适用场景
  useCases: string[];
  // 模板语言
  language: string;
}

// 模板分类
export const TEMPLATE_CATEGORIES = [
  '国潮设计',
  '天津特色',
  '节日主题',
  '品牌包装',
  '插画设计',
  'IP设计',
  '数字艺术',
  '其他'
] as const;

// 模板服务类
class TemplateService {
  private templates: Template[] = [];
  private readonly STORAGE_KEY = 'CREATIVE_TEMPLATES';

  constructor() {
    this.loadTemplates();
    this.initOfficialTemplates();
  }

  /**
   * 初始化官方模板
   */
  private initOfficialTemplates() {
    const officialTemplates: Template[] = [
      {
        id: 'official-1',
        name: '杨柳青年画风格模板',
        description: '融合杨柳青年画元素的现代设计模板',
        content: '【主题】杨柳青年画风格设计\n【色彩】传统中国红、金色、靛蓝\n【元素】娃娃、花卉、祥云纹\n【风格】工笔重彩+现代简约\n【应用场景】包装设计、海报、文创产品',
        tags: ['杨柳青', '国潮', '传统'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Yangliuqing%20New%20Year%20Painting%20style%20template%2C%20traditional%20Chinese%20red%20and%20gold%20colors%2C%20modern%20design',
        version: '1.0.0',
        useCases: ['包装设计', '海报设计', '文创产品'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'traditional'
        }
      },
      {
        id: 'official-2',
        name: '天津小吃IP设计模板',
        description: '天津特色小吃的IP形象设计模板',
        content: '【主题】天津小吃IP形象\n【元素】天津小吃（狗不理包子、耳朵眼炸糕、十八街麻花）\n【风格】卡通可爱+津味特色\n【色彩】鲜艳明快，符合小吃特点\n【应用场景】IP设计、文创产品、品牌推广',
        tags: ['天津小吃', 'IP设计', '卡通'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20snacks%20IP%20design%20template%2C%20cartoon%20style%2C%20colorful',
        version: '1.0.0',
        useCases: ['IP设计', '文创产品', '品牌推广'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.8,
          top_p: 0.95,
          max_tokens: 2000,
          style: 'cartoon'
        }
      },
      {
        id: 'official-3',
        name: '国潮品牌包装模板',
        description: '适合国潮品牌的包装设计模板',
        content: '【主题】国潮品牌包装\n【色彩】中国红、墨黑、金色\n【元素】传统纹样（云纹、回纹、龙纹）\n【风格】传统与现代结合\n【应用场景】产品包装、礼盒设计、品牌推广',
        tags: ['国潮', '包装设计', '品牌'],
        category: '国潮设计',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Guochao%20brand%20packaging%20template%2C%20traditional%20Chinese%20elements%2C%20modern%20design',
        version: '1.0.0',
        useCases: ['产品包装', '礼盒设计', '品牌推广'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'kimi',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'luxury'
        }
      },
      {
        id: 'official-4',
        name: '节日主题海报模板',
        description: '适合各种节日的海报设计模板',
        content: '【主题】节日主题海报\n【色彩】根据节日调整（春节：红金；中秋：金黄；端午：青绿）\n【元素】节日特色元素（春节：灯笼、春联；中秋：月饼、月亮；端午：粽子、龙舟）\n【风格】喜庆热闹+现代设计\n【应用场景】节日海报、社交媒体推广、活动宣传',
        tags: ['节日', '海报设计', '宣传'],
        category: '节日主题',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Festival%20theme%20poster%20template%2C%20colorful%2C%20festive%20atmosphere',
        version: '1.0.0',
        useCases: ['节日海报', '社交媒体推广', '活动宣传'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'deepseek',
          temperature: 0.8,
          top_p: 0.95,
          max_tokens: 2000,
          style: 'festive'
        }
      },
      {
        id: 'official-5',
        name: '现代插画设计模板',
        description: '适合现代插画创作的模板',
        content: '【主题】现代插画设计\n【色彩】明亮清新、渐变色彩\n【元素】几何图形、抽象元素、人物\n【风格】扁平化、简约现代\n【应用场景】插画创作、社交媒体、绘本',
        tags: ['插画', '现代', '扁平化'],
        category: '插画设计',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Modern%20illustration%20design%20template%2C%20flat%20style%2C%20bright%20colors',
        version: '1.0.0',
        useCases: ['插画创作', '社交媒体', '绘本'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.9,
          top_p: 0.95,
          max_tokens: 2000,
          style: 'modern'
        }
      },
      {
        id: 'official-6',
        name: 'IP角色设计模板',
        description: '适合IP角色创作的设计模板',
        content: '【主题】IP角色设计\n【色彩】鲜明独特、符合角色性格\n【元素】角色特征、服装、道具\n【风格】卡通、拟人化\n【应用场景】IP设计、游戏角色、动画角色',
        tags: ['IP设计', '角色设计', '卡通'],
        category: 'IP设计',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=IP%20character%20design%20template%2C%20cartoon%20style%2C%20unique%20character',
        version: '1.0.0',
        useCases: ['IP设计', '游戏角色', '动画角色'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'deepseek',
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'character'
        }
      },
      {
        id: 'official-7',
        name: '数字艺术创作模板',
        description: '适合数字艺术创作的模板',
        content: '【主题】数字艺术创作\n【色彩】大胆鲜明、对比强烈\n【元素】抽象图形、算法生成元素\n【风格】未来感、科技感\n【应用场景】数字艺术、NFT创作、新媒体艺术',
        tags: ['数字艺术', 'NFT', '科技感'],
        category: '数字艺术',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Digital%20art%20creation%20template%2C%20futuristic%20style%2C%20bold%20colors',
        version: '1.0.0',
        useCases: ['数字艺术', 'NFT创作', '新媒体艺术'],
        language: 'zh-CN',
        author: '官方模板',
        isFeatured: true,
        config: {
          model: 'kimi',
          temperature: 0.9,
          top_p: 0.95,
          max_tokens: 2000,
          style: 'futuristic'
        }
      },
      {
        id: 'official-8',
        name: '品牌包装设计模板',
        description: '适合品牌包装设计的模板',
        content: '【主题】品牌包装设计\n【色彩】品牌主色调、辅助色\n【元素】品牌Logo、产品信息、装饰元素\n【风格】简洁大气、品牌一致性\n【应用场景】产品包装、礼盒设计、品牌推广',
        tags: ['品牌包装', '设计', '商业'],
        category: '品牌包装',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Brand%20packaging%20design%20template%2C%20clean%20and%20professional%20style',
        version: '1.0.0',
        useCases: ['产品包装', '礼盒设计', '品牌推广'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'doubao-pro-32k',
          temperature: 0.6,
          top_p: 0.8,
          max_tokens: 2000,
          style: 'professional'
        }
      },
      {
        id: 'official-9',
        name: '天津建筑风格模板',
        description: '融合天津建筑元素的设计模板',
        content: '【主题】天津建筑风格设计\n【色彩】砖红色、灰色、米色\n【元素】天津租界建筑、海河、桥梁\n【风格】中西合璧、历史感\n【应用场景】旅游宣传、城市品牌、文创产品',
        tags: ['天津', '建筑', '历史'],
        category: '天津特色',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20architecture%20style%20template%2C%20western%20and%20chinese%20fusion%2C%20historical%20buildings',
        version: '1.0.0',
        useCases: ['旅游宣传', '城市品牌', '文创产品'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'deepseek',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000,
          style: 'historical'
        }
      },
      {
        id: 'official-10',
        name: '春节主题设计模板',
        description: '适合春节主题创作的模板',
        content: '【主题】春节主题设计\n【色彩】中国红、金色、黑色\n【元素】灯笼、春联、福字、鞭炮\n【风格】喜庆热闹、传统吉祥\n【应用场景】春节海报、红包设计、节日宣传',
        tags: ['春节', '节日', '传统'],
        category: '节日主题',
        isOfficial: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Chinese%20New%20Year%20theme%20design%20template%2C%20red%20and%20gold%20colors%2C%20festive%20atmosphere',
        version: '1.0.0',
        useCases: ['春节海报', '红包设计', '节日宣传'],
        language: 'zh-CN',
        author: '官方模板',
        config: {
          model: 'kimi',
          temperature: 0.8,
          top_p: 0.95,
          max_tokens: 2000,
          style: 'festive'
        }
      }
    ];

    // 检查并添加官方模板（如果不存在）
    officialTemplates.forEach(officialTemplate => {
      const exists = this.templates.some(t => t.id === officialTemplate.id);
      if (!exists) {
        this.templates.push(officialTemplate);
      }
    });

    this.saveTemplates();
  }

  /**
   * 从本地存储加载模板
   */
  private loadTemplates() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.templates = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      this.templates = [];
    }
  }

  /**
   * 保存模板到本地存储
   */
  private saveTemplates() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.templates));
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): Template[] {
    return [...this.templates];
  }

  /**
   * 根据ID获取模板
   */
  getTemplateById(id: string): Template | undefined {
    return this.templates.find(t => t.id === id);
  }

  /**
   * 根据分类获取模板
   */
  getTemplatesByCategory(category: string): Template[] {
    return this.templates.filter(t => t.category === category);
  }

  /**
   * 根据标签获取模板
   */
  getTemplatesByTag(tag: string): Template[] {
    return this.templates.filter(t => t.tags.includes(tag));
  }

  /**
   * 搜索模板
   */
  searchTemplates(query: string): Template[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 创建模板
   */
  createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'version' | 'useCases' | 'language'>): Template {
    const newTemplate: Template = {
      ...template,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
      version: '1.0.0',
      useCases: [],
      language: 'zh-CN',
      downloadCount: 0,
      rating: 0
    };

    this.templates.push(newTemplate);
    this.saveTemplates();
    return newTemplate;
  }

  /**
   * 更新模板
   */
  updateTemplate(id: string, updates: Partial<Template>): Template | undefined {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) {
      return undefined;
    }

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveTemplates();
    return this.templates[index];
  }

  /**
   * 删除模板
   */
  deleteTemplate(id: string): boolean {
    const initialLength = this.templates.length;
    this.templates = this.templates.filter(t => t.id !== id || t.isOfficial);
    const deleted = this.templates.length < initialLength;
    
    if (deleted) {
      this.saveTemplates();
    }
    
    return deleted;
  }

  /**
   * 增加模板使用次数
   */
  incrementUsage(id: string): void {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      template.usageCount++;
      this.saveTemplates();
    }
  }

  /**
   * 增加模板下载次数
   */
  incrementDownloadCount(id: string): void {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      template.downloadCount = (template.downloadCount || 0) + 1;
      this.saveTemplates();
    }
  }

  /**
   * 为模板评分
   */
  rateTemplate(id: string, rating: number): void {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      // 简单的平均评分计算，实际应用中可能需要更复杂的算法
      template.rating = rating;
      this.saveTemplates();
    }
  }

  /**
   * 获取模板下载次数
   */
  getDownloadCount(id: string): number {
    const template = this.templates.find(t => t.id === id);
    return template?.downloadCount || 0;
  }

  /**
   * 获取模板评分
   */
  getRating(id: string): number {
    const template = this.templates.find(t => t.id === id);
    return template?.rating || 0;
  }

  /**
   * 获取热门模板
   */
  getPopularTemplates(limit: number = 8): Template[] {
    return [...this.templates]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * 获取最新模板
   */
  getLatestTemplates(limit: number = 8): Template[] {
    return [...this.templates]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }
}

// 导出单例实例
const service = new TemplateService();
export default service;
