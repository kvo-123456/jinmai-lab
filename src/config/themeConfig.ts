// src/config/themeConfig.ts

// 主题类型定义
export type Theme = 'light' | 'dark' | 'pink' | 'blue' | 'green' | 'auto';

// 主题配置项接口
interface ThemeConfig {
  value: Theme;
  label: string;
  icon: string;
}

// 主题配置列表
export const themeConfig: ThemeConfig[] = [
  { value: 'auto', label: '自动', icon: 'fas fa-circle-half-stroke' },
  { value: 'light', label: '浅色', icon: 'fas fa-sun' },
  { value: 'dark', label: '深色', icon: 'fas fa-moon' },
  { value: 'pink', label: '粉色', icon: 'fas fa-heart' },
  { value: 'blue', label: '蓝色', icon: 'fas fa-water' },
  { value: 'green', label: '绿色', icon: 'fas fa-leaf' }
];

// 默认主题配置
export const defaultTheme: Theme = 'light';

// 主题切换顺序
export const themeOrder: Theme[] = ['light', 'dark', 'pink', 'blue', 'green', 'auto'];

// 检测系统主题偏好
export const getSystemTheme = (): 'light' | 'dark' => {
  // 检查是否在浏览器环境中
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return 'light'; // 默认返回浅色主题
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// 获取实际应用的主题
export const getAppliedTheme = (theme: Theme): 'light' | 'dark' | 'pink' | 'blue' | 'green' => {
  if (theme === 'auto') {
    return getSystemTheme();
  }
  return theme;
};

// 保存主题到localStorage
export const saveThemeToLocalStorage = (theme: Theme): void => {
  // 检查是否在浏览器环境中
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return;
  }
  
  localStorage.setItem('theme', theme);
};

// 从localStorage读取主题
export const getThemeFromLocalStorage = (): Theme | null => {
  // 检查是否在浏览器环境中
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return null;
  }
  
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  return savedTheme;
};

// 初始化主题
export const initializeTheme = (): Theme => {
  // 检查是否在浏览器环境中
  const isBrowser = typeof window !== 'undefined';
  
  if (isBrowser) {
    const savedTheme = getThemeFromLocalStorage();
    if (savedTheme) {
      return savedTheme;
    }
    // 检测是否为移动端设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    // 移动端默认使用浅色主题，桌面端默认使用深色主题
    return isMobile ? 'light' : 'dark';
  }
  
  // 服务器端渲染时返回默认主题
  return defaultTheme;
};