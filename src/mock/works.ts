export type Work = {
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
  // 中文注释：作品描述
  description?: string;
  // 中文注释：可选视频地址（存在则视为视频作品）
  videoUrl?: string;
  // 中文注释：视频时长（可选，用于展示）
  duration?: string;
  // 中文注释：图片标签（可选，用于展示图片来源）
  imageTag?: string;
  // 中文注释：3D模型地址（可选，用于AR预览）
  modelUrl?: string;
};

// 中文注释：本页专注作品探索，社区相关内容已迁移到创作者社区页面
// 使用真实的可用图片URL，避免代理服务认证问题
export const mockWorks: Work[] = [
  {
    id: 1,
    title: '国潮新风尚',
    creator: '设计师小明',
    creatorAvatar: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=100&h=100&fit=crop&User%20avatar%20xiaoming',
    thumbnail: 'https://images.unsplash.com/photo-1614850526283-3a3560210a5a?w=800&h=600&fit=crop&q=80',
    likes: 245,
    comments: 32,
    views: 1240,
    category: '国潮设计',
    tags: ['国潮', '时尚', '现代'],
    featured: true,
    imageTag: 'unsplash',
    modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf',
  },
  {
    id: 2,
    title: '传统纹样创新',
    creator: '创意总监小李',
    creatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1614850526283-3a3560210a5a?w=800&h=600&fit=crop&q=80',
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
    creatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1614850526283-3a3560210a5a?w=800&h=600&fit=crop&q=80',
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
    creatorAvatar: 'https://images.unsplash.com/photo-1614850526283-3a3560210a5a?w=800&h=600&fit=crop&q=80