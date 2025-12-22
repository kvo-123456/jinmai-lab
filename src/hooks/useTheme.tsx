import { useState, useEffect, createContext, ReactNode, useContext, useMemo, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'pink' | 'auto';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  availableThemes: { value: Theme; label: string; icon: string }[];
}

// 创建 ThemeContext
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
  availableThemes: []
});

interface ThemeProviderProps {
  children: ReactNode;
}

// 创建 ThemeProvider 组件
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    return 'dark';
  });

  // 优化后的主题切换逻辑
  const updateThemeClass = useCallback(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = theme === 'auto' 
      ? mediaQuery.matches ? 'dark' : 'light'
      : theme;
    
    // 只在主题实际改变时才修改DOM
    let currentClass = 'light';
    if (document.documentElement.classList.contains('dark')) {
      currentClass = 'dark';
    } else if (document.documentElement.classList.contains('pink')) {
      currentClass = 'pink';
    }
    
    if (currentClass !== currentTheme) {
      document.documentElement.classList.remove('light', 'dark', 'pink');
      if (currentTheme !== 'light') {
        document.documentElement.classList.add(currentTheme);
      }
    }
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'auto') {
        updateThemeClass();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, updateThemeClass]);

  // 主题变化时更新类名和localStorage
  useEffect(() => {
    updateThemeClass();
    localStorage.setItem('theme', theme);
  }, [theme, updateThemeClass]);

  // 优化toggleTheme函数
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const themes: Theme[] = ['light', 'dark', 'pink', 'auto'];
      const currentIndex = themes.indexOf(prevTheme);
      return themes[(currentIndex + 1) % themes.length];
    });
  }, []);

  // 优化availableThemes，避免每次渲染都重新创建数组
  const availableThemes = useMemo<{ value: Theme; label: string; icon: string }[]>(() => [
    { value: 'auto', label: '自动', icon: 'fas fa-circle-half-stroke' },
    { value: 'light', label: '浅色', icon: 'fas fa-sun' },
    { value: 'dark', label: '深色', icon: 'fas fa-moon' },
    { value: 'pink', label: '粉色', icon: 'fas fa-heart' }
  ], []);

  // 确定当前是否为深色模式
  const isDark = useMemo(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  }, [theme]);

  // 优化上下文值，减少组件重新渲染
  const value = useMemo(() => ({
    theme,
    isDark,
    toggleTheme,
    setTheme,
    availableThemes
  }), [theme, isDark, toggleTheme, setTheme, availableThemes]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
