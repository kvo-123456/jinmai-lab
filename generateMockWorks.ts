// 生成更多模拟作品数据的脚本
import { Work } from './src/mock/works';

// 现有作品类别
const categories = ['国潮设计', '纹样设计', '品牌设计', '非遗传承', '插画设计', '工艺创新', '老字号品牌', 'IP设计', '包装设计'];

// 现有标签池
const allTags = ['国潮', '时尚', '现代', '传统', '纹样', '创新', '老字号', '品牌', '焕新', 'AI', '非遗', '传承', '东方', '美学', '插画', '传统工艺', '数字化', '桂发祥', '包装设计', '狗不理', '海报', '联名', '耳朵眼', 'IP形象', '果仁张', '礼盒', '秋季', '杨柳青年画', '民俗', '泥人张', 'IP', '品牌焕新', '海河', '视觉识别', '配色', '相声', '老美华', '研究', '视觉系统', '教程', '字体', '京剧', '合集', '中国红', '纪念', '同仁堂', '景德镇', '陶瓷', '文创', '系列', '科普', '快闪', 'VI', '周边', '端午', '家居', '儿童', '文创', '应用指南', '再设计', '指南', '视觉规范', '贴纸', '导视', '系统', '传统色', '技能教学', '案例集', '极简', '电商', '春季版', '跨界', '中药文化', '青花瓷', '礼品', '潮玩', '主题页', '茅台', '现代图形', '节庆', 'UI', '授权', '手册', '旧改', '餐具', '舞台', '标识', '街头服饰', '街头服饰', '云纹', '品牌策略', '剪纸', '东方神话', '神话', '运动鞋', '产品设计', '龙纹', '书法', '3D打印', '科技', '内联升', '布鞋', '博物馆', 'IP衍生', '茶叶'];

// 创作者名称池
const creators = ['设计师小明', '创意总监小李', '品牌设计师老王', '数字艺术家小张', '插画师小陈', '数字设计师小刘', '品牌设计师阿宁', '视觉设计师小谷', '插画师小禾', '创意总监阿川', '视觉设计师小苏', '包装设计师小羽', 'IP设计师小谷', '插画师阿宁', '视觉设计师小海', '包装设计师小岳', '工业设计师小贺', '设计研究员小白', '数字艺术家小唐', '字体设计师小冯', '视觉设计师小戏', '包装设计师小纹', '品牌设计师小红', '视觉设计师小河', '包装设计师小药', '工业设计师小瓷', '插画师小潮', '数字艺术家小科', '视觉设计师小闪', '视觉设计师小履', 'IP设计师小张', '包装设计师小节', '品牌设计师小回', '插画师小柳', 'IP设计师小津', '视觉设计师小配', '插画师小瓷', '工艺设计师小纹', 'IP设计师小海', '品牌设计师小堂', 'IP设计师小戏', '包装设计师小泥', '品牌设计师小导', '视觉设计师小仁', '字体设计师小彩', '数字艺术家小技', '品牌设计师小潮', '插画师小柳', '品牌设计师小回', '插画师阿宁', '字体设计师小狗', '插画师小草药', '包装设计师小青', 'IP设计师小脸谱', '品牌设计师小蓝', '视觉设计师小酱', '工艺设计师小非', '插画师小节庆', '视觉设计师小红', 'IP设计师小张', '视觉设计师小堂', '插画师小瓷', '视觉设计师小戏', '品牌设计师小导', '服装设计师小潮', '纹样设计师小云', '品牌策略师老周', '数字艺术家小李', '插画师小神', '工艺设计师小陶', '品牌设计师小德', 'IP设计师小节', '包装设计师小茶', '品牌设计师小美', '纹样设计师小回', '品牌顾问小王', '交互设计师小影', '插画师小市', '工艺师小染', '包装设计师小酱', 'IP设计师小卡', '包装设计师小月', '产品设计师小动', '纹样设计师小龙', 'VI设计师小视', '数字艺术家小书', '插画师小风', '工艺师小3D', '品牌设计师小鞋', 'IP设计师小博', '包装设计师小茶'];

// 生成随机作品数据
function generateMockWork(id: number): Work {
  // 随机选择类别
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  // 随机生成2-5个标签
  const tagCount = Math.floor(Math.random() * 4) + 2;
  const tags: string[] = [];
  const shuffledTags = [...allTags].sort(() => 0.5 - Math.random());
  for (let i = 0; i < tagCount; i++) {
    tags.push(shuffledTags[i]);
  }
  
  // 随机选择创作者
  const creator = creators[Math.floor(Math.random() * creators.length)];
  
  // 生成标题
  const titles = [
    `${category}新风尚`,
    `${category}创新设计`,
    `${category}传承与创新`,
    `${category}现代演绎`,
    `${category}经典重现`,
    `${category}创意系列`,
    `${category}跨界合作`,
    `${category}数字转型`,
    `${category}文化融合`,
    `${category}时尚表达`
  ];
  const title = titles[Math.floor(Math.random() * titles.length)];
  
  // 随机生成点赞、评论、浏览量
  const likes = Math.floor(Math.random() * 500) + 100;
  const comments = Math.floor(Math.random() * 80) + 10;
  const views = Math.floor(Math.random() * 3000) + 500;
  
  // 随机决定是否为精选作品
  const featured = Math.random() < 0.2; // 20%概率为精选作品
  
  return {
    id,
    title,
    creator,
    creatorAvatar: `/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Designer%20avatar%20${creator}`,
    thumbnail: `/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=SDXL%2C%20${category}%20creative%20work%2C%20high%20detail`,
    likes,
    comments,
    views,
    category,
    tags,
    featured
  };
}

// 生成指定数量的作品
function generateMockWorks(count: number): Work[] {
  const works: Work[] = [];
  // 从123开始生成新作品ID（假设现有作品最大ID为122）
  for (let i = 123; i <= 122 + count; i++) {
    works.push(generateMockWork(i));
  }
  return works;
}

// 生成100个新作品
const newWorks = generateMockWorks(100);

// 输出为可直接复制到mockWorks数组的格式
console.log('// 新增作品开始');
newWorks.forEach(work => {
  console.log(`  {`);
  console.log(`    id: ${work.id},`);
  console.log(`    title: '${work.title}',`);
  console.log(`    creator: '${work.creator}',`);
  console.log(`    creatorAvatar: '${work.creatorAvatar}',`);
  console.log(`    thumbnail: '${work.thumbnail}',`);
  console.log(`    likes: ${work.likes},`);
  console.log(`    comments: ${work.comments},`);
  console.log(`    views: ${work.views},`);
  console.log(`    category: '${work.category}',`);
  console.log(`    tags: ['${work.tags.join("', '")}'],`);
  console.log(`    featured: ${work.featured},`);
  console.log(`  },`);
});
console.log('// 新增作品结束');
