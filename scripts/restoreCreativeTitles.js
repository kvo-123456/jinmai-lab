import fs from 'fs';

// 读取 mock 数据文件
const worksPath = './src/mock/works.ts';
let content = fs.readFileSync(worksPath, 'utf8');

// 标题模板，按照分类划分
const titleTemplates = {
  '国潮设计': [
    '国潮新风尚',
    '国潮美学设计',
    '现代国潮创意',
    '国潮文化设计',
    '国潮风格设计',
    '国潮元素创作',
    '国潮视觉设计',
    '国潮创意设计',
    '国潮品牌设计',
    '国潮艺术创作'
  ],
  '纹样设计': [
    '传统纹样创新',
    '纹样设计精选',
    '现代纹样创作',
    '传统纹样设计',
    '创新纹样设计',
    '纹样艺术设计',
    '纹样创意设计',
    '传统纹样现代化',
    '纹样视觉设计',
    '纹样设计案例'
  ],
  '品牌设计': [
    '品牌设计精选',
    '品牌视觉设计',
    '品牌创意设计',
    '品牌形象设计',
    '品牌设计案例',
    '品牌设计创作',
    '品牌设计展示',
    '品牌设计作品',
    '品牌设计实例',
    '品牌设计范例'
  ],
  '非遗传承': [
    'AI助力非遗传承',
    '非遗传承精选',
    '非遗创意设计',
    '非遗元素设计',
    '非遗传承创作',
    '非遗数字化设计',
    '非遗传承案例',
    '非遗艺术设计',
    '非遗传承作品',
    '非遗创新设计'
  ],
  '插画设计': [
    '东方美学插画',
    '插画设计精选',
    '创意插画设计',
    '插画艺术创作',
    '插画设计案例',
    '插画设计作品',
    '插画创意设计',
    '插画视觉设计',
    '插画设计展示',
    '插画设计实例'
  ],
  '工艺创新': [
    '传统工艺数字化',
    '工艺创新精选',
    '传统工艺设计',
    '工艺创新创作',
    '工艺设计案例',
    '工艺创新作品',
    '工艺创意设计',
    '传统工艺创新',
    '工艺设计展示',
    '工艺设计实例'
  ],
  '老字号品牌': [
    '老字号品牌焕新',
    '老字号品牌设计',
    '老字号创意设计',
    '老字号品牌案例',
    '老字号品牌作品',
    '老字号品牌精选',
    '老字号品牌创作',
    '老字号品牌展示',
    '老字号品牌实例',
    '老字号品牌范例'
  ],
  'IP设计': [
    'IP设计精选',
    'IP创意设计',
    'IP形象设计',
    'IP设计案例',
    'IP设计作品',
    'IP设计创作',
    'IP设计展示',
    'IP设计实例',
    'IP设计范例',
    'IP视觉设计'
  ],
  '包装设计': [
    '包装设计精选',
    '包装创意设计',
    '包装视觉设计',
    '包装设计案例',
    '包装设计作品',
    '包装设计创作',
    '包装设计展示',
    '包装设计实例',
    '包装设计范例',
    '包装创新设计'
  ]
};

// 特殊标题，针对特定作品使用
const specialTitles = {
  '包装设计': {
    '188': '十八街麻花包装焕新',
    '190': '狗不理联名海报',
    '194': '耳朵眼炸糕IP形象',
    '198': '果仁张秋季礼盒',
    '202': '杨柳青年画主题海报',
    '206': '泥人张联名公仔包装'
  }
};

// 使用正则表达式匹配并替换标题
const updatedContent = content.replace(/("id":\s*(\d+),\s*"title":\s*")([^"]*)(")/g, (match, prefix1, id, currentTitle, suffix) => {
  // 查找作品分类
  const categoryMatch = content.match(new RegExp(`"id":\s*${id},.*?"category":\s*"([^"]+)"`, 's'));
  if (!categoryMatch) return match;
  
  const category = categoryMatch[1];
  let newTitle;
  
  // 检查是否有特殊标题
  if (specialTitles[category] && specialTitles[category][id]) {
    newTitle = specialTitles[category][id];
  } else {
    // 随机选择一个模板标题
    const templates = titleTemplates[category] || [category];
    newTitle = templates[Math.floor(Math.random() * templates.length)];
  }
  
  return `${prefix1}${newTitle}${suffix}`;
});

// 写入修改后的内容
fs.writeFileSync(worksPath, updatedContent, 'utf8');

console.log('已恢复创意标题格式！');
