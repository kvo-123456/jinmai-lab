// 直接生成300个作品的脚本
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 作品分类列表
const categories = ['国潮设计', '纹样设计', '品牌设计', '非遗传承', '插画设计', '工艺创新', '老字号品牌', 'IP设计', '包装设计'];

// 标签列表
const allTags = ['国潮', '时尚', '现代', '传统', '纹样', '品牌', '非遗', '插画', '工艺', '老字号', 'IP', '包装', '文创', '数字艺术', '3D设计', 'AR', 'VR', '联名', '创新', '传承', '设计', '创意', '文化', '艺术', '手工', '科技', '融合', '现代', '复古', '经典', '潮流', '趋势', '实验', '探索', '跨界', '合作', '共创', '共享', '开放', '包容', '多元', '个性', '特色', '独特', '唯一', '专属', '定制', '限量', '稀有', '珍贵', '收藏', '价值', '意义', '故事', '情感', '温度', '人文', '社会', '环保', '可持续', '绿色', '生态', '健康', '自然', '有机', '纯净', '简约', '极简', '复杂', '精致', '精美', '细腻', '粗犷', '豪放', '大气', '磅礴', '宏伟', '壮观', '震撼', '感动', '共鸣', '认同', '接受', '喜爱', '赞美', '欣赏', '尊重', '敬畏', '珍惜', '保护', '传承', '发展', '创新', '突破', '超越', '引领', '先锋', '前卫', '时尚', '流行', '经典', '永恒', '不朽', '传奇', '神话', '传说', '故事', '历史', '文化', '文明', '精神', '灵魂', '本质', '核心', '内涵', '外延', '形式', '内容', '结构', '功能', '价值', '意义', '目的', '目标', '方向', '路径', '方法', '策略', '计划', '执行', '落地', '实现', '完成', '成果', '效果', '影响', '作用', '价值', '意义'];

// 设计师名称前缀
const designerPrefixes = ['设计师', '创意总监', '插画师', '纹样设计师', '品牌设计师', '非遗传承人', '工艺师', 'IP设计师', '包装设计师', '数字艺术家', '3D设计师', 'AR设计师', 'VR设计师', '跨界设计师', '合作设计师', '共创设计师', '共享设计师', '开放设计师', '包容设计师', '多元设计师', '个性设计师', '特色设计师', '独特设计师', '唯一设计师', '专属设计师', '定制设计师', '限量设计师', '稀有设计师', '珍贵设计师', '收藏设计师', '价值设计师', '意义设计师', '故事设计师', '情感设计师', '温度设计师', '人文设计师', '社会设计师', '环保设计师', '可持续设计师', '绿色设计师', '生态设计师', '健康设计师', '自然设计师', '有机设计师', '纯净设计师', '简约设计师', '极简设计师', '复杂设计师', '精致设计师', '精美设计师', '细腻设计师', '粗犷设计师', '豪放设计师', '大气设计师', '磅礴设计师', '宏伟设计师', '壮观设计师', '震撼设计师', '感动设计师', '共鸣设计师', '认同设计师', '接受设计师', '喜爱设计师', '赞美设计师', '欣赏设计师', '尊重设计师', '敬畏设计师', '珍惜设计师', '保护设计师', '传承设计师', '发展设计师', '创新设计师', '突破设计师', '超越设计师', '引领设计师', '先锋设计师', '前卫设计师', '时尚设计师', '流行设计师', '经典设计师', '永恒设计师', '不朽设计师', '传奇设计师', '神话设计师', '传说设计师', '故事设计师', '历史设计师', '文化设计师', '文明设计师', '精神设计师', '灵魂设计师', '本质设计师', '核心设计师', '内涵设计师', '外延设计师', '形式设计师', '内容设计师', '结构设计师', '功能设计师', '价值设计师', '意义设计师', '目的设计师', '目标设计师', '方向设计师', '路径设计师', '方法设计师', '策略设计师', '计划设计师', '执行设计师', '落地设计师', '实现设计师', '完成设计师', '成果设计师', '效果设计师', '影响设计师', '作用设计师', '价值设计师', '意义设计师'];

// 设计师名称后缀
const designerSuffixes = ['小明', '小红', '小刚', '小丽', '小强', '小芳', '小华', '小美', '小帅', '小酷', '小潮', '小萌', '小清新', '小可爱', '小性感', '小优雅', '小气质', '小文艺', '小清新', '小可爱', '小性感', '小优雅', '小气质', '小文艺', '小清新', '小可爱', '小性感', '小优雅', '小气质', '小文艺'];

// 生成随机数
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成随机标签数组
function generateTags() {
  const tagCount = randomInt(2, 5);
  const tags = [];
  while (tags.length < tagCount) {
    const tag = allTags[randomInt(0, allTags.length - 1)];
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }
  return tags;
}

// 生成单个mock作品
function generateMockWork(id) {
  const category = categories[randomInt(0, categories.length - 1)];
  const designerName = `${designerPrefixes[randomInt(0, designerPrefixes.length - 1)]}${designerSuffixes[randomInt(0, designerSuffixes.length - 1)]}`;
  
  // 决定使用哪种图片源
  const useUnsplash = Math.random() > 0.3; // 70% 使用unsplash，30% 使用AI生成
  
  let thumbnail;
  let imageTag;
  
  if (useUnsplash) {
    // 使用unsplash图片
    thumbnail = `https://images.unsplash.com/photo-${randomInt(1600000000000, 1700000000000)}?w=600&h=400&fit=crop`;
    imageTag = 'unsplash';
  } else {
    // 使用AI生成图片
    thumbnail = `/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=SDXL%2C%20${encodeURIComponent(category)}%20creative%20work%2C%20high%20detail`;
    imageTag = 'ai-generated';
  }
  
  return {
    id,
    title: `${category}${randomInt(100, 999)}`,
    creator: designerName,
    creatorAvatar: `/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Designer%20avatar%20${encodeURIComponent(designerName)}`,
    thumbnail,
    likes: randomInt(50, 1000),
    comments: randomInt(5, 150),
    views: randomInt(100, 5000),
    category,
    tags: generateTags(),
    featured: Math.random() > 0.8, // 20% 概率成为精选作品
    imageTag
  };
}

// 主函数
async function main() {
  try {
    const mockWorksPath = path.join(__dirname, 'src', 'mock', 'works.ts');
    
    // 读取现有文件内容，保留类型定义
    const existingContent = await fs.readFile(mockWorksPath, 'utf8');
    
    // 找到类型定义的结束位置
    const typeDefEnd = existingContent.indexOf('export const mockWorks: Work[] = [');
    if (typeDefEnd === -1) {
      console.error('未找到mockWorks数组声明！');
      return;
    }
    
    // 保留类型定义部分
    const typeDefContent = existingContent.slice(0, typeDefEnd);
    
    // 生成300个作品
    const works = [];
    for (let i = 1; i <= 300; i++) {
      works.push(generateMockWork(i));
    }
    
    // 将作品转换为TypeScript格式
    const worksString = works.map(work => JSON.stringify(work, null, 2)).join(',\n');
    
    // 构建新的文件内容
    const newContent = `${typeDefContent}export const mockWorks: Work[] = [\n${worksString}\n];`;
    
    // 写入新的内容
    await fs.writeFile(mockWorksPath, newContent, 'utf8');
    
    console.log(`成功生成了${works.length}个mock作品！`);
  } catch (error) {
    console.error('发生错误:', error);
  }
}

main();
