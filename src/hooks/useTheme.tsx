import { useState, useEffect, createContext, ReactNode, useContext, useMemo, useCallback } from 'react';
import {
  Theme,
  themeConfig,
  defaultTheme,
  themeOrder,
  getAppliedTheme,
  initializeTheme,
  saveThemeToLocalStorage,
  getSystemTheme
} from '@/config/themeConfig';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  availableThemes: typeof themeConfig;
}

// 创建 ThemeContext
export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
  availableThemes: themeConfig
});

interface ThemeProviderProps {
  children: ReactNode;
}

// 创建 ThemeProvider 组件
export function ThemeProvider({ children }: ThemeProviderProps) {
  // 服务器端和客户端初始状态必须完全一致，避免hydration错误
  // 初始状态始终使用defaultTheme，在客户端挂载后再更新
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // 在客户端挂载后，从localStorage读取并更新主题
  useEffect(() => {
    const savedTheme = initializeTheme();
    setTheme(savedTheme);
  }, []);

  // 更新主题类到DOM
  const updateThemeClass = useCallback(() => {
    // 只在浏览器环境中执行DOM操作
    if (typeof document !== 'undefined') {
      const appliedTheme = getAppliedTheme(theme);
      
      // 清除所有主题类
      document.documentElement.classList.remove('light', 'dark', 'pink', 'blue', 'green');
      
      // 添加当前主题类（浅色主题不需要添加类，使用默认样式）
      if (appliedTheme !== 'light') {
        document.documentElement.classList.add(appliedTheme);
      }
    }
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    // 只在浏览器环境中添加事件监听
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = () => {
        if (theme === 'auto') {
          updateThemeClass();
        }
      };
      
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
    return undefined;
  }, [theme, updateThemeClass]);

  // 主题变化时更新类名和localStorage
  useEffect(() => {
    // 使用requestAnimationFrame优化DOM更新，减少卡顿
    const frameId = requestAnimationFrame(() => {
      updateThemeClass();
      saveThemeToLocalStorage(theme);
    });
    
    return () => cancelAnimationFrame(frameId);
  }, [theme, updateThemeClass]);

  // 优化toggleTheme函数，使用主题顺序数组
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const currentIndex = themeOrder.indexOf(prevTheme);
      return themeOrder[(currentIndex + 1) % themeOrder.length];
    });
  }, []);

  // 确定当前是否为深色模式
  // 确保服务器端和客户端初始状态一致，避免hydration不匹配
  const isDark = useMemo(() => {
    // 初始化时（主题为defaultTheme），始终返回false，与初始theme状态匹配
    if (theme === defaultTheme) {
      return false;
    }
    
    if (theme === 'auto') {
      return getSystemTheme() === 'dark';
    }
    return theme === 'dark';
  }, [theme]);

  // 优化上下文值，减少组件重新渲染
  const value = useMemo(() => ({
    theme,
    isDark,
    toggleTheme,
    setTheme,
    availableThemes: themeConfig
  }), [theme, isDark, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
