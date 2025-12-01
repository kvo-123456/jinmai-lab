/**
 * 创作者数据分析服务
 * 提供作品表现和用户互动数据分析
 */

import { MultimodalContent } from './multimodalService';
import { getAllContent } from './multimodalService';
import { getPosts } from './postService';

// 定义数据类型
export interface CreatorAnalytics {
  // 作品统计
  totalWorks: number;
  worksByType: Record<string, number>;
  worksByMonth: Array<{ month: string; count: number }>;
  
  // 互动统计
  totalLikes: number;
  totalViews: number;
  totalShares: number;
  totalComments: number;
  
  // 趋势数据
  monthlyEngagement: Array<{ month: string; likes: number; views: number; shares: number; comments: number }>;
  
  // 热门作品
  topWorks: Array<{
    id: string;
    title: string;
    type: string;
    likes: number;
    views: number;
    shares: number;
    comments: number;
    engagement: number;
  }>;
  
  // 平均数据
  avgLikesPerWork: number;
  avgViewsPerWork: number;
  avgSharesPerWork: number;
  avgCommentsPerWork: number;
  
  // 增长数据
  growthRate: {
    works: number;
    likes: number;
    views: number;
  };
}

// 常量定义
const ANALYTICS_KEY = 'jmzf_creator_analytics';

/**
 * 获取创作者数据分析
 */
export function getCreatorAnalytics(): CreatorAnalytics {
  // 获取所有内容
  const allContent = getAllContent();
  const allPosts = getPosts();
  
  // 合并所有作品
  const allWorks = [...allContent, ...allPosts];
  
  // 计算作品统计
  const totalWorks = allWorks.length;
  
  // 按类型统计作品
  const worksByType = allWorks.reduce((acc, work) => {
    const type = 'type' in work ? work.type || 'text' : 'post';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // 按月份统计作品
  const worksByMonth = calculateWorksByMonth(allWorks);
  
  // 计算互动统计
  const totalLikes = allWorks.reduce((acc, work) => acc + (work.likes || 0), 0);
  const totalViews = allWorks.reduce((acc, work) => acc + (work.views || 0), 0);
  const totalShares = allWorks.reduce((acc, work) => acc + (work.shares || 0), 0);
  const totalComments = allWorks.reduce((acc, work) => {
    const commentsCount = Array.isArray(work.comments) ? work.comments.length : (work.comments || 0);
    return acc + commentsCount;
  }, 0);
  
  // 计算月度互动数据
  const monthlyEngagement = calculateMonthlyEngagement(allWorks);
  
  // 计算热门作品
  const topWorks = calculateTopWorks(allWorks);
  
  // 计算平均数据
  const avgLikesPerWork = totalWorks > 0 ? totalLikes / totalWorks : 0;
  const avgViewsPerWork = totalWorks > 0 ? totalViews / totalWorks : 0;
  const avgSharesPerWork = totalWorks > 0 ? totalShares / totalWorks : 0;
  const avgCommentsPerWork = totalWorks > 0 ? totalComments / totalWorks : 0;
  
  // 计算增长数据
  const growthRate = calculateGrowthRate(allWorks);
  
  return {
    totalWorks,
    worksByType,
    worksByMonth,
    totalLikes,
    totalViews,
    totalShares,
    totalComments,
    monthlyEngagement,
    topWorks,
    avgLikesPerWork,
    avgViewsPerWork,
    avgSharesPerWork,
    avgCommentsPerWork,
    growthRate
  };
}

/**
 * 计算作品按月份分布
 */
function calculateWorksByMonth(works: Array<any>): Array<{ month: string; count: number }> {
  const monthlyData: Record<string, number> = {};
  
  // 生成过去6个月的月份标签
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
    months.push(monthKey);
    monthlyData[monthKey] = 0;
  }
  
  // 统计每个月的作品数量
  works.forEach(work => {
    const createdAt = new Date(work.createdAt);
    const monthKey = createdAt.toISOString().slice(0, 7);
    if (monthlyData[monthKey] !== undefined) {
      monthlyData[monthKey]++;
    }
  });
  
  // 转换为数组格式
  return months.map(month => ({
    month,
    count: monthlyData[month]
  }));
}

/**
 * 计算月度互动数据
 */
function calculateMonthlyEngagement(works: Array<any>): Array<{ month: string; likes: number; views: number; shares: number; comments: number }> {
  const monthlyData: Record<string, { likes: number; views: number; shares: number; comments: number }> = {};
  
  // 生成过去6个月的月份标签
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
    months.push(monthKey);
    monthlyData[monthKey] = { likes: 0, views: 0, shares: 0, comments: 0 };
  }
  
  // 统计每个月的互动数据
  works.forEach(work => {
    const createdAt = new Date(work.createdAt);
    const monthKey = createdAt.toISOString().slice(0, 7);
    if (monthlyData[monthKey] !== undefined) {
      monthlyData[monthKey].likes += work.likes || 0;
      monthlyData[monthKey].views += work.views || 0;
      monthlyData[monthKey].shares += work.shares || 0;
      monthlyData[monthKey].comments += work.comments || 0;
    }
  });
  
  // 转换为数组格式
  return months.map(month => ({
    month,
    ...monthlyData[month]
  }));
}

/**
 * 计算热门作品
 */
function calculateTopWorks(works: Array<any>, limit: number = 5): Array<{
  id: string;
  title: string;
  type: string;
  likes: number;
  views: number;
  shares: number;
  comments: number;
  engagement: number;
}> {
  return works
    .map(work => ({
      id: work.id,
      title: work.title,
      type: work.type || 'text',
      likes: work.likes || 0,
      views: work.views || 0,
      shares: work.shares || 0,
      comments: work.comments || 0,
      engagement: (work.likes || 0) + (work.views || 0) + (work.shares || 0) + (work.comments || 0)
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, limit);
}

/**
 * 计算增长率
 */
function calculateGrowthRate(works: Array<any>): {
  works: number;
  likes: number;
  views: number;
} {
  // 计算过去30天和前30天的数据
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  // 统计过去30天的数据
  const recentWorks = works.filter(work => {
    const createdAt = new Date(work.createdAt);
    return createdAt >= thirtyDaysAgo;
  });
  
  // 统计前30天的数据
  const previousWorks = works.filter(work => {
    const createdAt = new Date(work.createdAt);
    return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
  });
  
  // 计算各项增长率
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  const recentLikes = recentWorks.reduce((acc, work) => acc + (work.likes || 0), 0);
  const previousLikes = previousWorks.reduce((acc, work) => acc + (work.likes || 0), 0);
  
  const recentViews = recentWorks.reduce((acc, work) => acc + (work.views || 0), 0);
  const previousViews = previousWorks.reduce((acc, work) => acc + (work.views || 0), 0);
  
  return {
    works: calculateGrowth(recentWorks.length, previousWorks.length),
    likes: calculateGrowth(recentLikes, previousLikes),
    views: calculateGrowth(recentViews, previousViews)
  };
}

/**
 * 获取作品详细分析
 */
export function getWorkAnalytics(workId: string): any {
  const allWorks = [...getAllContent(), ...getPosts()];
  const work = allWorks.find(w => w.id === workId);
  
  if (!work) {
    return null;
  }
  
  // 计算作品的各项指标
  const views = work.views || 0;
  const likes = work.likes || 0;
  const commentsCount = Array.isArray(work.comments) ? work.comments.length : (work.comments || 0);
  const shares = work.shares || 0;
  
  const engagementRate = views > 0 ? (likes + commentsCount + shares) / views : 0;
  const likeRate = views > 0 ? likes / views : 0;
  const commentRate = views > 0 ? commentsCount / views : 0;
  const shareRate = views > 0 ? shares / views : 0;
  
  return {
    ...work,
    engagementRate,
    likeRate,
    commentRate,
    shareRate
  };
}

/**
 * 导出数据分析为CSV
 */
export function exportAnalyticsToCSV(analytics: CreatorAnalytics): string {
  // 作品按类型统计
  const typeCSV = ['作品类型,数量'];
  Object.entries(analytics.worksByType).forEach(([type, count]) => {
    typeCSV.push(`${type},${count}`);
  });
  
  // 月度作品统计
  const monthlyWorksCSV = ['月份,作品数量'];
  analytics.worksByMonth.forEach(item => {
    monthlyWorksCSV.push(`${item.month},${item.count}`);
  });
  
  // 月度互动统计
  const monthlyEngagementCSV = ['月份,点赞数,浏览量,分享数,评论数'];
  analytics.monthlyEngagement.forEach(item => {
    monthlyEngagementCSV.push(`${item.month},${item.likes},${item.views},${item.shares},${item.comments}`);
  });
  
  // 热门作品
  const topWorksCSV = ['作品ID,标题,类型,点赞数,浏览量,分享数,评论数,总互动量'];
  analytics.topWorks.forEach(item => {
    topWorksCSV.push(`${item.id},${item.title},${item.type},${item.likes},${item.views},${item.shares},${item.comments},${item.engagement}`);
  });
  
  // 合并所有CSV数据
  const csvContent = [
    '创作者数据分析报告',
    '',
    '作品统计',
    `总作品数: ${analytics.totalWorks}`,
    `平均每作品点赞: ${analytics.avgLikesPerWork.toFixed(1)}`,
    `平均每作品浏览: ${analytics.avgViewsPerWork.toFixed(1)}`,
    `平均每作品分享: ${analytics.avgSharesPerWork.toFixed(1)}`,
    `平均每作品评论: ${analytics.avgCommentsPerWork.toFixed(1)}`,
    '',
    '作品增长趋势',
    `作品增长率: ${analytics.growthRate.works.toFixed(1)}%`,
    `点赞增长率: ${analytics.growthRate.likes.toFixed(1)}%`,
    `浏览增长率: ${analytics.growthRate.views.toFixed(1)}%`,
    '',
    '作品类型分布',
    ...typeCSV,
    '',
    '月度作品数量',
    ...monthlyWorksCSV,
    '',
    '月度互动数据',
    ...monthlyEngagementCSV,
    '',
    '热门作品',
    ...topWorksCSV
  ].join('\n');
  
  return csvContent;
}

/**
 * 保存数据分析到本地存储
 */
export function saveAnalytics(analytics: CreatorAnalytics): void {
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
}

/**
 * 从本地存储获取数据分析
 */
export function loadAnalytics(): CreatorAnalytics | null {
  const raw = localStorage.getItem(ANALYTICS_KEY);
  return raw ? JSON.parse(raw) : null;
}

// 导出服务对象
export default {
  getCreatorAnalytics,
  getWorkAnalytics,
  exportAnalyticsToCSV,
  saveAnalytics,
  loadAnalytics
};
