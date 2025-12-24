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
  // 会员相关字段
  membershipLevel: 'free' | 'premium' | 'vip';
  membershipStart?: string;
  membershipEnd?: string;
  membershipStatus: 'active' | 'expired' | 'pending';
}

// AuthContext 类型定义
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, age?: string, tags?: string[]) => Promise<boolean>;
  logout: () => void;
  setIsAuthenticated: (value: boolean) => void;
  quickLogin: (provider: 'wechat' | 'phone' | 'alipay' | 'qq' | 'weibo') => Promise<boolean>;
  // 中文注释：更新用户信息（例如更换头像），会自动持久化
  updateUser: (partial: Partial<User>) => void;
  // 会员相关方法
  updateMembership: (membershipData: Partial<User>) => Promise<boolean>;
  checkMembershipStatus: () => boolean;
  getMembershipBenefits: () => string[];
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
  updateMembership: async () => false,
  checkMembershipStatus: () => false,
  getMembershipBenefits: () => [],
});

// AuthProvider 组件
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // 从本地存储获取用户认证状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('token') || localStorage.getItem('isAuthenticated') === 'true';
  });
  
  // 从本地存储获取用户信息
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      // 添加默认会员信息
      return {
        ...parsedUser,
        membershipLevel: parsedUser.membershipLevel || 'free',
        membershipStatus: parsedUser.membershipStatus || 'active',
        membershipStart: parsedUser.membershipStart || new Date().toISOString(),
      };
    }
    return null;
  });

  // 定义API响应类型
  interface AuthResponse {
    token: string;
    user: User;
  }

  // 检查用户认证状态
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token && !user) {
        try {
          const response = await apiClient.get<{ user: User }>('/api/auth/me');
          if (response.ok && response.data && response.data.user) {
            // 添加默认会员信息
            const userWithMembership = {
              ...response.data.user,
              membershipLevel: response.data.user.membershipLevel || 'free',
              membershipStatus: response.data.user.membershipStatus || 'active',
              membershipStart: response.data.user.membershipStart || new Date().toISOString(),
            };
            setUser(userWithMembership);
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
      const response = await apiClient.post<AuthResponse>('/api/auth/login', {
        email,
        password
      });
      
      if (response.ok && response.data && response.data.token && response.data.user) {
        // 添加默认会员信息
        const userWithMembership = {
          ...response.data.user,
          membershipLevel: response.data.user.membershipLevel || 'free',
          membershipStatus: response.data.user.membershipStatus || 'active',
          membershipStart: response.data.user.membershipStart || new Date().toISOString(),
        };
        
        // 存储令牌和用户信息
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userWithMembership));
        
        // 更新状态
        setIsAuthenticated(true);
        setUser(userWithMembership);
        
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
  const register = async (username: string, email: string, password: string, age?: string, tags?: string[]): Promise<boolean> => {
    try {
      // console.log('AuthContext.register: 1. Starting registration');
      // console.log('AuthContext.register: 2. Request data:', { username, email, password, age, tags });
      
      const response = await apiClient.post<AuthResponse>('/api/auth/register', {
        username,
        email,
        password,
        age: age ? parseInt(age) : null,
        tags
      });
      
      // console.log('AuthContext.register: 3. Response received:', { ok: response.ok, status: response.status, data: response.data, error: response.error });
      
      if (response.ok && response.data && response.data.token && response.data.user) {
        // 添加默认会员信息
        const userWithMembership = {
          ...response.data.user,
          membershipLevel: response.data.user.membershipLevel || 'free',
          membershipStatus: response.data.user.membershipStatus || 'active',
          membershipStart: response.data.user.membershipStart || new Date().toISOString(),
        };
        
        // 存储令牌和用户信息
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userWithMembership));
        
        // 更新状态
        setIsAuthenticated(true);
        setUser(userWithMembership);
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      // console.error('AuthContext.register: 4. Error occurred:', error);
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
          avatar: "https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=User%20avatar",
          tags: ['国潮爱好者'],
          // 初始会员信息
          membershipLevel: 'free',
          membershipStart: new Date().toISOString(),
          membershipStatus: 'active',
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

  // 更新会员信息
  const updateMembership = async (membershipData: Partial<User>): Promise<boolean> => {
    try {
      // 调用API更新会员信息
      const response = await apiClient.post<{ user: User }>('/api/membership/update', membershipData);
      
      if (response.ok && response.data && response.data.user) {
        // 更新本地用户信息
        updateUser(response.data.user);
        return true;
      } else {
        // 如果API调用失败，直接更新本地信息
        updateUser(membershipData);
        return true;
      }
    } catch (error) {
      console.error('更新会员信息失败:', error);
      // 即使API调用失败，也尝试更新本地信息
      updateUser(membershipData);
      return false;
    }
  };

  // 检查会员状态是否有效
  const checkMembershipStatus = (): boolean => {
    if (!user) return false;
    
    // 免费会员永远有效
    if (user.membershipLevel === 'free') return true;
    
    // 检查会员状态和过期时间
    if (user.membershipStatus !== 'active') return false;
    
    if (user.membershipEnd) {
      const now = new Date();
      const endDate = new Date(user.membershipEnd);
      return now <= endDate;
    }
    
    return true;
  };

  // 获取会员权益
  const getMembershipBenefits = (): string[] => {
    if (!user) return [];
    
    switch (user.membershipLevel) {
      case 'vip':
        return [
          '无限AI生成次数',
          '高级AI模型访问',
          '高清作品导出',
          '优先处理队列',
          '专属模板库',
          '去除水印',
          '专属AI训练模型',
          '一对一设计师服务',
          '商业授权',
          '专属活动邀请'
        ];
      case 'premium':
        return [
          '无限AI生成次数',
          '高级AI模型访问',
          '高清作品导出',
          '优先处理队列',
          '专属模板库',
          '去除水印'
        ];
      default:
        return [
          '基础AI创作功能',
          '每天限量生成次数',
          '基础社区功能',
          '基础作品存储'
        ];
    }
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
    updateUser,
    updateMembership,
    checkMembershipStatus,
    getMembershipBenefits
  };

  // 返回Provider组件
  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
};
