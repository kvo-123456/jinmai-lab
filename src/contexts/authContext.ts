import React from "react";
import { createContext, useState, ReactNode, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";

// 用户类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  phone?: string;
  interests?: string[];
  isAdmin?: boolean;
  age?: number;
  tags?: string[];
}

// AuthContext 类型定义
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setIsAuthenticated: (value: boolean) => void;
  quickLogin: (provider: 'wechat' | 'phone' | 'alipay' | 'qq' | 'weibo') => Promise<boolean>;
  // 中文注释：更新用户信息（例如更换头像），会自动持久化
  updateUser: (partial: Partial<User>) => void;
}

// AuthProvider 组件属性类型
interface AuthProviderProps {
  children: ReactNode;
}

// 创建Context
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  setIsAuthenticated: () => {},
  quickLogin: async () => false,
  updateUser: () => {},
});

// AuthProvider 组件
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // 从本地存储获取用户认证状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('token');
  });
  
  // 从本地存储获取用户信息
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  // 检查用户认证状态
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token && !user) {
        try {
          const response = await apiClient.get('/api/auth/me');
          if (response.ok && response.data && response.data.user) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            // 令牌无效，清除本地存储
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.error('检查认证状态失败:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    };
    
    checkAuth();
  }, [user]);

  // 登录方法
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password
      });
      
      if (response.ok && response.data && response.data.token && response.data.user) {
        // 存储令牌和用户信息
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // 更新状态
        setIsAuthenticated(true);
        setUser(response.data.user);
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  };

  // 注册方法
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.post('/api/auth/register', {
        username,
        email,
        password
      });
      
      if (response.ok && response.data && response.data.token && response.data.user) {
        // 存储令牌和用户信息
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // 更新状态
        setIsAuthenticated(true);
        setUser(response.data.user);
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('注册失败:', error);
      return false;
    }
  };

  const quickLogin = async (provider: 'wechat' | 'phone' | 'alipay' | 'qq' | 'weibo'): Promise<boolean> => {
    // 暂时保持模拟，后续可以扩展为真实的第三方登录
    return new Promise((resolve) => {
      setTimeout(() => {
        const baseUser: User = {
          id: `quick-${provider}-${Date.now()}`,
          username: provider === 'wechat' ? '微信用户' : provider === 'phone' ? '手机号用户' : '第三方用户',
          email: `${provider}-${Date.now()}@example.com`,
          avatar: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=User%20avatar",
          tags: ['国潮爱好者'],
        };
        setIsAuthenticated(true);
        setUser(baseUser);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(baseUser));
        resolve(true);
      }, 500);
    });
  };

  // 登出方法
  const logout = () => {
    // 重置状态
    setIsAuthenticated(false);
    setUser(null);
    
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  };

  // 中文注释：更新用户信息并写入本地存储
  const updateUser = (partial: Partial<User>) => {
    setUser(prev => {
      const next = { ...(prev || {} as User), ...partial } as User;
      try {
        localStorage.setItem('user', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // 提供Context值
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    setIsAuthenticated,
    quickLogin,
    updateUser
  };

  // 返回Provider组件
  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
};
