// 地图工具函数

// 高德地图API密钥
export const AMAP_KEY = import.meta.env.VITE_AMAP_KEY;

// 地图初始配置
export const MAP_INIT_CONFIG = {
  zoom: 12,
  center: [117.2008, 39.0842], // 天津市区中心经纬度
  mapStyle: 'amap://styles/whitesmoke', // 地图样式
};

// POI分类图标映射
export const CATEGORY_ICONS: Record<string, string> = {
  food: '🍜',
  retail: '🏪',
  craft: '🎨',
  landmark: '🏰',
  culture: '📚',
};

// POI分类颜色映射
export const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-yellow-500',
  retail: 'bg-blue-500',
  craft: 'bg-purple-500',
  landmark: 'bg-red-500',
  culture: 'bg-green-500',
};

// POI分类名称映射
export const CATEGORY_NAMES: Record<string, string> = {
  food: '餐饮美食',
  retail: '零售百货',
  craft: '手工艺',
  landmark: '地标建筑',
  culture: '文化艺术',
};

// 模拟经纬度数据 - 用于开发测试
export const MOCK_COORDINATES: Record<number, [number, number]> = {
  1: [117.1881, 39.1252], // 狗不理包子 - 山东路店
  2: [117.2315, 39.0923], // 十八街麻花 - 大沽南路店
  3: [117.1598, 39.1445], // 耳朵眼炸糕 - 北门外大街店
  4: [117.1955, 39.1278], // 劝业场
  5: [117.0538, 39.1402], // 杨柳青年画
  6: [117.1995, 39.1408], // 泥人张彩塑 - 古文化街
  7: [117.1468, 39.1425], // 天津之眼
  8: [117.2293, 39.0948], // 天津大剧院
};

/**
 * 将百分比坐标转换为真实经纬度
 * @param x 百分比X坐标
 * @param y 百分比Y坐标
 * @returns 经纬度数组 [lng, lat]
 */
export const percentageToCoordinates = (x: number, y: number): [number, number] => {
  // 基于天津市区范围的简单转换
  // 实际应用中应该使用更精确的转换算法
  const minLng = 117.0;
  const maxLng = 117.3;
  const minLat = 39.0;
  const maxLat = 39.2;
  
  const lng = minLng + (maxLng - minLng) * (x / 100);
  const lat = minLat + (maxLat - minLat) * (1 - y / 100); // 注意：y轴方向相反
  
  return [lng, lat];
};

/**
 * 格式化地图坐标，保留6位小数
 * @param coord 坐标值
 * @returns 格式化后的坐标
 */
export const formatCoordinate = (coord: number): number => {
  return Math.round(coord * 1000000) / 1000000;
};

/**
 * 获取POI标记点大小
 * @param importance 重要性级别（1-5）
 * @param zoom 当前缩放级别
 * @returns 标记点大小
 */
export const getMarkerSize = (importance: number = 3, zoom: number = 1): number => {
  const baseSize = 8;
  const scaleByImportance = importance / 3;
  const scaleByZoom = Math.min(zoom, 2);
  return baseSize * scaleByImportance * scaleByZoom;
};

/**
 * 检查标记点是否在视口中
 * @param marker POI数据
 * @param mapBounds 地图边界
 * @returns 是否在视口中
 */
export const isMarkerInViewport = (marker: any, mapBounds: any): boolean => {
  if (!marker.position?.lat || !marker.position?.lng) return false;
  if (!mapBounds) return true;
  
  return mapBounds.contains([marker.position.lng, marker.position.lat]);
};

/**
 * 生成唯一的地图标记ID
 * @param prefix 前缀
 * @returns 唯一ID
 */
export const generateMarkerId = (prefix: string = 'marker'): string => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};
