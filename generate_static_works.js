// 生成静态作品的脚本
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取__dirname的ES模块版本
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取原始文件
const worksPath = path.join(__dirname, 'src', 'mock', 'works.ts');
let content = fs.readFileSync(worksPath, 'utf8', {
  encoding: 'utf8'
});

// 提取generateNewWorks函数
const generateNewWorks = (startId, count) => {
  const categories = [
    '国潮设计', '纹样设计', '品牌设计', '非遗传承', '插画设计',
    '工艺创新', '老字号品牌', 'IP设计', '包装设计', '字体设计'
  ];
  
  const tags = [
    ['国潮', '时尚', '现代'], ['传统', '纹样', '创新'], ['品牌', '焕新', '设计'],
    ['AI', '非遗', '传承'], ['东方', '美学', '插画'], ['传统工艺', '数字化', '创新'],
    ['老字号', '包装', '焕新'], ['IP', '形象', '设计'], ['礼盒', '包装', '设计'],
    ['字体', '设计', '创新'], ['传统文化', '现代应用', '设计'], ['潮流', '时尚', '设计'],
    ['工艺', '创新', '设计'], ['数字', '艺术', '设计'], ['插画', '系列', '设计']
  ];
  
  const creators = [
    '设计师小明', '创意总监小李', '品牌设计师老王', '数字艺术家小张', '插画师小陈',
    '数字设计师小刘', '品牌设计师阿宁', '视觉设计师小谷', '插画师小禾', '创意总监阿川',
    '视觉设计师小苏', '包装设计师小羽', 'IP设计师小谷', '插画师阿宁', '视觉设计师小海',
    '包装设计师小岳', '工业设计师小贺', '设计研究员小白', '数字艺术家小唐', '字体设计师小冯',
    '视觉设计师小戏', '包装设计师小纹', '品牌设计师小红', '视觉设计师小河', '包装设计师小药',
    '工业设计师小瓷', '插画师小潮', '数字艺术家小科', '视觉设计师小闪', '视觉设计师小履',
    'IP设计师小张', '包装设计师小节', '品牌设计师小回', '插画师小柳', 'IP设计师小津',
    '视觉设计师小配', '插画师小瓷', '工艺设计师小纹', 'IP设计师小海', '品牌设计师小堂',
    'IP设计师小戏', '包装设计师小泥', '品牌设计师小导', '视觉设计师小仁', '字体设计师小彩',
    '数字艺术家小技', '品牌设计师小潮', '插画师小柳', '品牌设计师小回', '插画师阿宁',
    '字体设计师小狗', '插画师小草药', '包装设计师小青', 'IP设计师小脸谱', '品牌设计师小蓝',
    '视觉设计师小酱', '工艺设计师小非', '插画师小节庆', '视觉设计师小红', 'IP设计师小张',
    '视觉设计师小堂', '插画师小瓷', '视觉设计师小戏', '品牌设计师小导', '服装设计师小潮',
    '纹样设计师小云', '品牌策略师老周', '数字艺术家小李', '插画师小神', '工艺设计师小陶',
    '品牌设计师小德', 'IP设计师小节', '包装设计师小茶', '品牌设计师小美', '纹样设计师小回',
    '品牌顾问小王', '交互设计师小影', '插画师小市', '工艺师小染', '包装设计师小酱',
    'IP设计师小卡', '包装设计师小月', '产品设计师小动', '纹样设计师小龙', 'VI设计师小视',
    '数字艺术家小书', '工艺师小3D', '品牌设计师小鞋', 'IP设计师小博', '包装设计师小茶',
    '产品设计师小科', '插画师小宇', '工艺师小漆', '工艺师小纸', '插画师小美',
    '工艺师小金', '包装设计师小吴', 'IP设计师小文创', '包装设计师小巧', '玩具设计师小玩'
  ];
  
  // 更具体生动的标题生成，参考前120个作品的标题风格
  const titleTemplates = {
    '国潮设计': [
      '国潮服装系列KV', '东方美学珠宝海报', '国潮文创产品设计', '传统纹样数码印花', 
      '国潮玩具包装设计', '东方元素家具设计', '国潮插画系列', '传统色彩现代应用'
    ],
    '纹样设计': [
      '传统祥云纹样创新', '青花瓷纹样现代设计', '敦煌壁画元素应用', '中国结纹样再生',
      '龙纹图案新演绎', '传统花卉纹样数字化', '剪纸艺术现代应用', '刺绣纹样创新设计'
    ],
    '品牌设计': [
      '新中式品牌VI设计', '东方风格logo设计', '传统文化品牌升级', '国潮品牌视觉系统',
      '传统企业品牌焕新', '东方美学品牌形象', '文化创意品牌设计', '传统工艺品牌策略'
    ],
    '非遗传承': [
      '非遗剪纸数字化', '传统陶艺创新设计', '刺绣艺术现代应用', '木雕工艺新表达',
      '竹编技艺创新', '传统染织工艺再生', '非遗文化插画', '传统戏曲元素设计'
    ],
    '插画设计': [
      '东方神话插画系列', '传统节日主题插画', '中国风绘本插画', '茶文化主题插画',
      '传统建筑插画', '古典文学插画', '民俗文化插画', '传统工艺插画'
    ],
    '工艺创新': [
      '传统陶瓷3D打印', '数字刺绣工艺', '古法造纸现代设计', '传统漆器创新',
      '竹编工艺数字化', '传统金属工艺再生', '木雕工艺新技法', '传统印染现代应用'
    ],
    '老字号品牌': [
      '同仁堂中药文化插画KV', '茅台联名礼品包装海报', '全聚德品牌视觉升级', '六必居酱菜包装焕新',
      '果仁张秋冬礼盒KV', '狗不理联名海报', '耳朵眼炸糕IP形象', '泥人张联名公仔包装',
      '老美华鞋品牌视觉', '桂发祥十八街麻花包装', '天津杨柳青年画创新', '风筝魏风筝设计'
    ],
    'IP设计': [
      '传统神话IP形象设计', '民俗文化IP开发', '老字号品牌IP升级', '传统节日IP设计',
      '东方美学IP系列', '非遗文化IP打造', '中国风动漫IP设计', '传统工艺IP形象'
    ],
    '包装设计': [
      '传统食品包装创新', '中药礼盒包装设计', '茶叶包装文化表达', '老字号产品包装焕新',
      '节日礼品包装设计', '文化创意产品包装', '传统酒类包装设计', '土特产包装升级'
    ],
    '字体设计': [
      '传统书法字体创新', '东方美学字体设计', '老字号品牌字体', '节日主题字体设计',
      '传统纹样字体', '民俗文化字体', '中国风数字字体', '传统印章字体再生'
    ]
  };
  
  const works = [];
  
  // 分类对应的标签池
  const categoryTagsMap = {
    '国潮设计': [['国潮', '时尚', '现代'], ['传统文化', '现代应用', '设计'], ['潮流', '时尚', '设计']],
    '纹样设计': [['传统', '纹样', '创新'], ['纹样', '设计', '文化']],
    '品牌设计': [['品牌', '焕新', '设计'], ['品牌', '形象', '设计'], ['品牌', '策略', '设计']],
    '非遗传承': [['AI', '非遗', '传承'], ['传统工艺', '数字化', '创新']],
    '插画设计': [['东方', '美学', '插画'], ['插画', '系列', '设计'], ['数字', '艺术', '设计']],
    '工艺创新': [['传统工艺', '数字化', '创新'], ['工艺', '创新', '设计']],
    '老字号品牌': [['老字号', '包装', '焕新'], ['老字号', '品牌', '设计'], ['传统', '品牌', '焕新']],
    'IP设计': [['IP', '形象', '设计'], ['IP', '开发', '设计']],
    '包装设计': [['礼盒', '包装', '设计'], ['包装', '创新', '设计']],
    '字体设计': [['字体', '设计', '创新'], ['字体', '文化', '设计']]
  };
  
  for (let i = 0; i < count; i++) {
    const id = startId + i;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const creator = creators[Math.floor(Math.random() * creators.length)];
    
    // 为每个分类选择匹配的标签
    const availableTags = categoryTagsMap[category] || tags;
    const tagSet = availableTags[Math.floor(Math.random() * availableTags.length)];
    
    // 生成更有意义的标题，参考前120个作品的风格
    const titleTemplate = titleTemplates[category] || ['创意作品'];
    const title = titleTemplate[Math.floor(Math.random() * titleTemplate.length)];
    
    // 为每个作品生成唯一的图片URL，基于作品ID和分类
    // 使用分类名称作为seed前缀，确保图片与主题相关
    // 使用作品ID作为seed后缀，确保每个作品都有唯一的图片
    let imageSeed;
    if (category === '国潮设计' || category === '国潮创意') {
      // 国潮相关分类使用东方风格的seed
      imageSeed = `guochao${id}`;
    } else if (category === '工艺创新' || category === '工艺设计') {
      // 工艺创新使用传统工艺相关seed
      imageSeed = `gongyi${id}`;
    } else if (category === '老字号品牌') {
      // 老字号品牌使用特定的seed
      imageSeed = `laozihua${id}`;
    } else if (category === '纹样设计') {
      // 纹样设计使用传统纹样相关seed
      imageSeed = `wenyang${id}`;
    } else if (category === '非遗传承') {
      // 非遗传承使用非遗相关seed
      imageSeed = `feiyi${id}`;
    } else if (category === '插画设计') {
      // 插画设计使用插画相关seed
      imageSeed = `chahua${id}`;
    } else if (category === '品牌设计') {
      // 品牌设计使用品牌相关seed
      imageSeed = `pinpai${id}`;
    } else if (category === 'IP设计') {
      // IP设计使用IP相关seed
      imageSeed = `ip${id}`;
    } else if (category === '包装设计') {
      // 包装设计使用包装相关seed
      imageSeed = `baozhuang${id}`;
    } else if (category === '字体设计') {
      // 字体设计使用字体相关seed
      imageSeed = `ziti${id}`;
    } else {
      // 其他分类使用分类名称作为seed前缀
      imageSeed = `${category.replace(/\s+/g, '')}${id}`;
    }
    
    // 使用可靠的picsum.photos，为每个作品生成唯一的图片URL
    const thumbnailUrl = `https://picsum.photos/seed/${imageSeed}/800/600`;
    
    works.push({
      id,
      title: title,
      creator,
      creatorAvatar: `https://picsum.photos/seed/creator${id}/100/100`,
      thumbnail: thumbnailUrl,
      likes: Math.floor(Math.random() * 500) + 100,
      comments: Math.floor(Math.random() * 100) + 10,
      views: Math.floor(Math.random() * 3000) + 500,
      category,
      tags: tagSet,
      featured: Math.random() > 0.8,
      modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf',
      description: `${title} - 这是一个高质量的设计作品，融合了传统与现代元素，展现了独特的设计风格。`
    });
  }
  
  return works;
};

// 生成180个新作品
const newWorks = generateNewWorks(121, 180);

// 转换为TypeScript数组项格式
const newWorksString = newWorks.map(work => {
  return `  {
    id: ${work.id},
    title: '${work.title}',
    creator: '${work.creator}',
    creatorAvatar: '${work.creatorAvatar}',
    thumbnail: '${work.thumbnail}',
    likes: ${work.likes},
    comments: ${work.comments},
    views: ${work.views},
    category: '${work.category}',
    tags: ['${work.tags.join("', '")}'],
    featured: ${work.featured},
    modelUrl: '${work.modelUrl}',
    description: '${work.description}'
  }`;
}).join(',\n');


// 找到originalWorks数组的开头和结尾
const originalWorksRegex = /const originalWorks: Work\[\] = \[([\s\S]*?)\];/;
const match = content.match(originalWorksRegex);
if (!match) {
  console.error('Could not find originalWorks array');
  process.exit(1);
}

// 提取原始内容
let originalWorksContent = match[1];

// 只保留前120个作品（ID 1-120）
// 找到第120个作品的结束位置
const id120EndRegex = /(\s*\{[^}]*id: 120[^}]*\},?\s*)/;
const id120Match = originalWorksContent.match(id120EndRegex);
if (id120Match) {
  // 只保留第120个作品之前的内容（包括第120个作品）
  const id120EndIndex = originalWorksContent.indexOf(id120Match[0]) + id120Match[0].length;
  originalWorksContent = originalWorksContent.substring(0, id120EndIndex);
}

// 替换originalWorks数组，添加新作品
const updatedOriginalWorks = `${originalWorksContent},
${newWorksString}`;
content = content.replace(originalWorksRegex, `const originalWorks: Work[] = [${updatedOriginalWorks}
];`);

// 删除动态生成代码
content = content.replace(/\/\/ 生成180个新作品\nconst newWorks = generateNewWorks\(121, 180\);\n\n\/\/ 合并原始作品和新作品\nexport const mockWorks: Work\[\] = \[\.\.\.originalWorks, \.\.\.newWorks\];/g, 'export const mockWorks: Work[] = originalWorks;');

// 写入更新后的内容
fs.writeFileSync(worksPath, content, 'utf8');

console.log('Generated 180 static works and updated works.ts file');
