import React, { useState, useEffect, Suspense, lazy, useRef, useMemo, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Routes, Route, Outlet, useLocation, useNavigationType, Link, Navigate } from "react-router-dom";


// 核心页面保持同步加载，减少导航延迟
// 对于高频访问的页面，使用同步加载可以减少导航跳转时间
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Explore from "@/pages/Explore";
import WorkDetail from "@/pages/WorkDetail";
import About from "@/pages/About";
import Square from "@/pages/Square";
import Community from "@/pages/Community";
import Neo from "@/pages/Neo";
import NewsDetail from "@/pages/NewsDetail";
import EventDetail from "@/pages/EventDetail";
import TestBasic from "@/pages/TestBasic";

// 优化懒加载策略：根据页面访问频率和大小重新分类

// 2. 高频访问但较大的页面 - 懒加载，优先加载
const Create = lazy(() => import(/* webpackChunkName: "core-pages" */ "@/pages/Create"));
const Tools = lazy(() => import(/* webpackChunkName: "core-pages" */ "@/pages/Tools"));
const Settings = lazy(() => import(/* webpackChunkName: "core-pages" */ "@/pages/Settings"));

// 3. 中频访问页面 - 懒加载，按功能模块分组
// 创作和工具相关
const Generation = lazy(() => import(/* webpackChunkName: "creation-tools" */ "@/pages/Generation"));
const InputHub = lazy(() => import(/* webpackChunkName: "creation-tools" */ "@/pages/InputHub"));
const Drafts = lazy(() => import(/* webpackChunkName: "creation-tools" */ "@/pages/Drafts"));

// 文化和知识相关
const CulturalKnowledge = lazy(() => import(/* webpackChunkName: "cultural-content" */ "@/pages/CulturalKnowledge"));
const Tianjin = lazy(() => import(/* webpackChunkName: "cultural-content" */ "@/pages/Tianjin"));
const TianjinMap = lazy(() => import(/* webpackChunkName: "cultural-content" */ "@/pages/TianjinMap"));
const CulturalEvents = lazy(() => import(/* webpackChunkName: "cultural-content" */ "@/pages/CulturalEvents"));
const CulturalNewsPage = lazy(() => import(/* webpackChunkName: "cultural-content" */ "@/pages/CulturalNewsPage"));

// 4. 低频访问页面 - 懒加载，按功能分组
// 管理相关
const Admin = lazy(() => import(/* webpackChunkName: "admin-pages" */ "@/pages/admin/Admin"));
const AdminAnalytics = lazy(() => import(/* webpackChunkName: "admin-pages" */ "@/pages/AdminAnalytics"));
const ErrorMonitoringDashboard = lazy(() => import(/* webpackChunkName: "admin-pages" */ "@/components/ErrorMonitoringDashboard"));

// 会员和激励相关
const Membership = lazy(() => import(/* webpackChunkName: "membership" */ "@/pages/Membership"));
const MembershipPayment = lazy(() => import(/* webpackChunkName: "membership" */ "@/pages/MembershipPayment"));
const MembershipBenefits = lazy(() => import(/* webpackChunkName: "membership" */ "@/pages/MembershipBenefits"));
const Incentives = lazy(() => import(/* webpackChunkName: "membership" */ "@/pages/Incentives"));
const PointsMall = lazy(() => import(/* webpackChunkName: "membership" */ "@/pages/PointsMall"));

// 社区和互动相关
const Leaderboard = lazy(() => import(/* webpackChunkName: "community-features" */ "@/pages/Leaderboard"));
const DailyCheckin = lazy(() => import(/* webpackChunkName: "community-features" */ "@/components/DailyCheckin"));
const CreativeMatchmaking = lazy(() => import(/* webpackChunkName: "community-features" */ "@/components/CreativeMatchmaking"));
const AchievementMuseum = lazy(() => import(/* webpackChunkName: "community-features" */ "@/components/AchievementMuseum"));

// 实验和特色功能
const Lab = lazy(() => import(/* webpackChunkName: "experimental-features" */ "@/pages/Lab"));
const ParticleArt = lazy(() => import(/* webpackChunkName: "experimental-features" */ "@/pages/ParticleArt"));
const Games = lazy(() => import(/* webpackChunkName: "experimental-features" */ "@/pages/Games"));
const CollaborationDemo = lazy(() => import(/* webpackChunkName: "experimental-features" */ "@/pages/CollaborationDemo"));

// 辅助和测试页面
const TestPage = lazy(() => import(/* webpackChunkName: "auxiliary-pages" */ "@/pages/TestPage"));
const ImageTest = lazy(() => import(/* webpackChunkName: "auxiliary-pages" */ "@/pages/ImageTest"));
const GitHubImageTestPage = lazy(() => import(/* webpackChunkName: "auxiliary-pages" */ "@/pages/GitHubImageTestPage"));

// 其他低频页面
const Terms = lazy(() => import(/* webpackChunkName: "other-pages" */ "@/pages/Terms"));
const Help = lazy(() => import(/* webpackChunkName: "other-pages" */ "@/pages/Help"));
const BrandGuide = lazy(() => import(/* webpackChunkName: "other-pages" */ "@/pages/BrandGuide"));
const Authenticity = lazy(() => import(/* webpackChunkName: "other-pages" */ "@/pages/Authenticity"));
const Wizard = lazy(() => import(/* webpackChunkName: "other-pages" */ "@/pages/Wizard"));
const AnalyticsPage = lazy(() => import(/* webpackChunkName: "other-pages" */ "@/pages/Analytics"));
const UserCollection = lazy(() => import(/* webpackChunkName: "other-pages" */ "@/pages/UserCollection"));

// 特殊功能组件
const IPIncubationCenter = lazy(() => import(/* webpackChunkName: "special-features" */ "@/components/IPIncubationCenter"));
const CrossDeviceSync = lazy(() => import(/* webpackChunkName: "special-features" */ "@/components/CrossDeviceSync"));
const BlindBoxShop = lazy(() => import(/* webpackChunkName: "special-features" */ "@/components/BlindBoxShop"));

// 优化LazyComponent和LoadingSkeleton
// 改进LoadingSkeleton，添加更多视觉反馈
const SimpleLoadingSkeleton = React.memo(() => (
  <div className="min-h-[200px] p-6">
    <div className="space-y-6">
      {/* 标题骨架 */}
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
          <div className="h-3 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
        </div>
      </div>
      
      {/* 内容骨架 */}
      <div className="space-y-3">
        <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
        <div className="h-4 w-5/6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
        <div className="h-4 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
      </div>
      
      {/* 卡片骨架 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
        <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
      </div>
      
      {/* 行动按钮骨架 */}
      <div className="flex space-x-3">
        <div className="h-10 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
        <div className="h-10 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
      </div>
    </div>
  </div>
));

SimpleLoadingSkeleton.displayName = 'SimpleLoadingSkeleton';

// 优化LazyComponent，添加延迟加载和错误处理
const LazyComponent = React.memo(({ 
  children, 
  fallback = <SimpleLoadingSkeleton /> 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
});

LazyComponent.displayName = 'LazyComponent';



// 路由缓存组件
const RouteCache = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const cacheRef = useRef<Map<string, React.ReactNode>>(new Map());
  
  // 仅缓存核心页面
  const cacheableRoutes = ['/', '/dashboard', '/explore', '/tools', '/about'];
  
  // 检查当前路由是否可缓存
  const isCacheable = cacheableRoutes.includes(location.pathname);
  
  // 直接渲染子组件，不使用缓存机制，避免无限重渲染问题
  return <>{children}</>;
};

// 布局组件
import SidebarLayout from '@/components/SidebarLayout';
import MobileLayout from '@/components/MobileLayout';

// 路由守卫组件
import PrivateRoute from '@/components/PrivateRoute';
import AdminRoute from '@/components/AdminRoute';

// 创作者仪表盘组件
import CreatorDashboard from '@/components/CreatorDashboard';
// PWA 安装按钮组件
import PWAInstallButton from '@/components/PWAInstallButton';
// 首次启动引导组件
import FirstLaunchGuide from '@/components/FirstLaunchGuide';
// 悬浮AI助手组件
import FloatingAIAssistant from '@/components/FloatingAIAssistant';
// 用户反馈组件
import UserFeedback from '@/components/UserFeedback';
// 满意度调查组件
import SatisfactionSurvey from '@/components/SatisfactionSurvey';
// 满意度调查服务
import surveyService from '@/services/surveyService';
// 认证上下文
import { useContext } from 'react';
import { AuthContext } from './contexts/authContext.tsx';


export default function App() {
  const location = useLocation();
  // 添加响应式布局状态 - 服务器端和客户端初始状态必须一致
  const [isMobile, setIsMobile] = useState(false);
  // 添加用户反馈状态
  const [showFeedback, setShowFeedback] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 初始化检查
    checkIsMobile();
    
    // 添加 resize 事件监听
    window.addEventListener('resize', checkIsMobile);
    
    // 清理事件监听
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 移除智能预取逻辑，减少不必要的预加载请求
  // 预加载会增加初始加载时间和内存消耗，对于低性能设备来说可能会导致卡顿
  // 导航跳转速度的提升应该通过优化组件渲染和减少不必要的资源加载来实现

  // 暂时禁用全局console日志过滤，排查问题
  /*
  // 全局console日志过滤，用于过滤WebAssembly内存地址日志
  useEffect(() => {
    // 保存原始console方法
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;
    
    // 过滤内存地址日志的通用函数
    const filterMemoryAddressLog = (args: any[]) => {
      // 检查每个参数
      for (const arg of args) {
        // 如果参数是数组，检查是否包含多个内存地址
        if (Array.isArray(arg)) {
          // 检查数组中是否包含多个内存地址
          const memoryAddresses = arg.filter(item => {
            const str = String(item);
            return /0x[0-9a-fA-F]{8,}/i.test(str);
          });
          if (memoryAddresses.length >= 2) {
            return true;
          }
        } 
        // 如果参数是字符串，检查是否是内存地址数组
        else if (typeof arg === 'string') {
          // 检查是否包含多个内存地址
          const memoryAddressCount = (arg.match(/0x[0-9a-fA-F]{8,}/gi) || []).length;
          if (memoryAddressCount >= 2) {
            return true;
          }
          // 检查是否是括号包裹的内存地址数组
          if (/\[(\s*0x[0-9a-fA-F]{8,}\s*[,\s]*)+\]/i.test(arg)) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    // 替换全局console.log
    console.log = function(...args) {
      if (!filterMemoryAddressLog(args)) {
        originalLog.apply(console, args);
      }
    };
    
    // 替换全局console.warn
    console.warn = function(...args) {
      if (!filterMemoryAddressLog(args)) {
        originalWarn.apply(console, args);
      }
    };
    
    // 替换全局console.error
    console.error = function(...args) {
      if (!filterMemoryAddressLog(args)) {
        originalError.apply(console, args);
      }
    };
    
    // 替换全局console.info
    console.info = function(...args) {
      if (!filterMemoryAddressLog(args)) {
        originalInfo.apply(console, args);
      }
    };
    
    // 清理函数，恢复原始console方法
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, []);
  */

  // 右侧内容组件 - 使用memo优化，避免不必要的重新渲染
  const RightContent = React.memo(() => (
    <aside className="w-64 p-4 overflow-y-auto">
      <div className="space-y-4">
        {/* 用户信息卡片 */}
        <div className="rounded-xl p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2">欢迎使用</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">探索AI创作的无限可能</p>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">开始创作</button>
            <button className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">了解更多</button>
          </div>
        </div>
        
        {/* 快速链接 */}
        <div className="rounded-xl p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <h4 className="font-medium mb-2">快速链接</h4>
          <ul className="space-y-2">
            <li><a href="/explore" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">浏览作品</a></li>
            <li><a href="/create" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">创作中心</a></li>
            <li><a href="/tools" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">AI工具</a></li>
            <li><a href="/tianjin" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">天津特色</a></li>
          </ul>
        </div>
        
        {/* 通知区域 */}
        <div className="rounded-xl p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <h4 className="font-medium mb-2">最新通知</h4>
          <div className="space-y-3">
            <div className="text-xs p-2 bg-yellow-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium mb-1">系统更新</p>
              <p className="text-gray-600 dark:text-gray-400">平台已更新至最新版本，体验更多功能</p>
            </div>
            <div className="text-xs p-2 bg-green-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium mb-1">活动通知</p>
              <p className="text-gray-600 dark:text-gray-400">新一期创作活动即将开始，敬请期待</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  ));
  
  // 右侧内容组件的延迟加载版本 - 仅在需要时加载
  const LazyRightContent = lazy(() => Promise.resolve({ default: RightContent }));

  // 浮动按钮组件
  const FloatingButtons = () => {
    // 认证上下文
    const { user } = useContext(AuthContext);
    const { isDark } = useTheme(); // 获取当前主题状态
    // 使用外部App组件的isMobile状态，避免状态不一致
    // 内部状态管理
    const [showCommunityMessages, setShowCommunityMessages] = useState(false);
    const [showSurvey, setShowSurvey] = useState(false);
    const messagesRef = useRef<HTMLDivElement | null>(null);

    // 社群消息数据结构
    interface CommunityMessage {
      id: string;
      sender: string;
      content: string;
      time: string;
      read: boolean;
      avatar: string;
    }
    
    // 社群消息状态
    const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>(() => {
      // 在SSR期间返回默认值，不访问localStorage
      return [
        { id: 'm1', sender: '创意达人', content: '分享一个新的创作技巧...', time: '刚刚', read: false, avatar: '👤' },
        { id: 'm2', sender: '设计师小王', content: '大家觉得这个配色方案怎么样？', time: '1 小时前', read: false, avatar: '🎨' },
        { id: 'm3', sender: '系统通知', content: '新活动：创意挑战赛开始了！', time: '昨天', read: true, avatar: '📢' },
      ];
    });
    
    // 在客户端挂载后从localStorage加载消息
    useEffect(() => {
      try {
        const stored = localStorage.getItem('jmzf_community_messages');
        if (stored) {
          const parsed = JSON.parse(stored);
          // 确保返回的是数组
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCommunityMessages(parsed);
          }
        }
      } catch {}
    }, []);
    
    // 未读消息计数
    const unreadMessageCount = useMemo(() => 
      communityMessages.filter(m => !m.read).length,
      [communityMessages]
    );
    
    // 保存消息到本地存储
    useEffect(() => {
      try {
        localStorage.setItem('jmzf_community_messages', JSON.stringify(communityMessages));
      } catch {}
    }, [communityMessages]);
    
    // 点击外部关闭消息面板
    useEffect(() => {
      // 只在浏览器环境中添加事件监听
      if (typeof document === 'undefined') return;
      
      const handler = (e: MouseEvent) => {
        if (!messagesRef.current) return;
        if (!messagesRef.current.contains(e.target as Node)) {
          setShowCommunityMessages(false);
        }
      };
      if (showCommunityMessages) {
        document.addEventListener('mousedown', handler);
      }
      return () => document.removeEventListener('mousedown', handler);
    }, [showCommunityMessages]);

    return (
      <>
        {/* 底部浮动按钮组 */}
        <div className="fixed right-4 top-[80%] transform -translate-y-1/2 flex flex-col gap-2 z-30">
          {/* 社群消息提醒按钮 */}
          <div className="relative" ref={messagesRef}>
            <button
              onClick={() => setShowCommunityMessages(v => !v)}
              className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center relative"
              aria-label="社群消息"
              title="社群消息"
            >
              <i className="fas fa-comments text-base"></i>
              {/* 消息提示红点 */}
              {unreadMessageCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold px-1">
                  {unreadMessageCount}
                </span>
              )}
            </button>
            {/* 消息面板 */}
            {showCommunityMessages && (
              <div className="absolute right-0 bottom-full mb-2 w-80 rounded-xl shadow-lg ring-1 bg-white dark:bg-gray-800 ring-gray-200 dark:ring-gray-700 z-50">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">社群消息</span>
                  <div className="flex items-center space-x-2">
                    <button
                      className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => setCommunityMessages(prev => prev.map(m => ({ ...m, read: true })))}>
                      全部已读
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => {
                        setShowCommunityMessages(false);
                        window.location.href = '/community';
                      }}>
                      查看全部
                    </button>
                  </div>
                </div>
                <ul className="max-h-80 overflow-auto">
                  {communityMessages.length === 0 ? (
                    <li className="text-gray-500 dark:text-gray-400 px-4 py-6 text-sm">暂无消息</li>
                  ) : (
                    communityMessages.map(m => (
                      <li key={m.id}>
                        <button
                          className="w-full text-left px-4 py-3 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => {
                            setCommunityMessages(prev => prev.map(x => 
                              x.id === m.id ? { ...x, read: true } : x
                            ));
                          }}
                        >
                          <span className="text-2xl">{m.avatar}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{m.sender}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{m.time}</span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{m.content}</p>
                          </div>
                          {!m.read && (
                            <span className="mt-1 inline-flex items-center justify-center w-2 h-2 rounded-full bg-red-500"></span>
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
          
          {/* 满意度调查按钮 */}
          <button
              onClick={() => setShowSurvey(true)}
              className="bg-yellow-500 text-white p-2.5 rounded-full shadow-lg hover:bg-yellow-600 transition-all duration-300 flex items-center justify-center"
              aria-label="满意度调查"
              title="满意度调查"
            >
              <i className="fas fa-star text-base"></i>
            </button>
        </div>
        
        {/* 满意度调查组件 */}
        <SatisfactionSurvey 
          isOpen={showSurvey} 
          onClose={() => setShowSurvey(false)} 
          onSubmit={(data) => {
            // 使用调查服务提交数据
            surveyService.submitSurvey(
              data,
              user?.id || `anonymous-${Date.now()}`,
              user?.username || '匿名用户'
            );
          }} 
        />
      </>
    );
  }

  FloatingButtons.displayName = 'FloatingButtons';

  // 优化全局加载骨架屏，实现更美观的品牌化加载体验
  const GlobalLoadingSkeleton = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-8">
        {/* 品牌Logo骨架 */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse relative overflow-hidden">
              {/* 添加品牌元素的骨架 */}
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
            {/* 添加旋转动画效果 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-xl opacity-50 animate-spin-slow"></div>
          </div>
          {/* 品牌名称骨架 */}
          <div className="mt-6 space-y-2">
            <div className="h-8 w-40 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
            <div className="h-4 w-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
          </div>
        </div>
        
        {/* 进度指示器 */}
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse rounded-full" style={{ width: '70%' }}></div>
          </div>
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            加载中...
          </div>
        </div>
        
        {/* 内容骨架 */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
            <div className="h-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
            <div className="h-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
          </div>
          <div className="h-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
        </div>
        
        {/* 版权信息骨架 */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-500">
          <div className="h-3 w-40 mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
        </div>
      </div>
    </div>
  );

  // 简化的AnimatedPage组件，减少动画效果，提高性能
  const AnimatedPage = React.memo(({ children }: { children: React.ReactNode }) => {
    return <div>{children}</div>;
  });
  
  AnimatedPage.displayName = 'AnimatedPage';
  
  return (
    <div className="relative min-h-screen bg-white dark:bg-[var(--bg-primary)]">
      <Routes>
        {/* 核心页面直接渲染，无需懒加载，添加缓存和动画 */}
        {/* 确保根路径是第一个路由，提高匹配优先级 */}
        <Route path="/" element={
          <RouteCache>
            <AnimatedPage>
              {isMobile ? (
                <MobileLayout><Home /></MobileLayout>
              ) : (
                <SidebarLayout><Home /></SidebarLayout>
              )}
            </AnimatedPage>
          </RouteCache>
        } />
        
        {/* 不需要布局的页面 */}
        <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
        <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
        {/* 测试页面 */}
        <Route path="/test" element={<AnimatedPage><TestPage /></AnimatedPage>} />
        <Route path="/test-basic" element={<AnimatedPage><TestBasic /></AnimatedPage>} />
        
        {/* 使用布局的页面，为所有子路由添加动画 */}
        <Route element={
          <AnimatedPage>
            {isMobile ? (
              <MobileLayout>
                <Outlet />
              </MobileLayout>
            ) : (
              <SidebarLayout>
                <Outlet />
              </SidebarLayout>
            )}
          </AnimatedPage>
        }>
          <Route path="/explore" element={<RouteCache><Explore /></RouteCache>} />
          <Route path="/explore/:id" element={<WorkDetail />} />
          <Route path="/tools" element={<RouteCache><LazyComponent><Tools /></LazyComponent></RouteCache>} />
          <Route path="/about" element={<RouteCache><About /></RouteCache>} />
          <Route path="/neo" element={<Neo />} />
          <Route path="/square" element={<PrivateRoute><Square /></PrivateRoute>} />
          <Route path="/square/:id" element={<PrivateRoute><Square /></PrivateRoute>} />
          <Route path="/community" element={<PrivateRoute><Community /></PrivateRoute>} />
          <Route path="/dashboard" element={<RouteCache><PrivateRoute><Dashboard /></PrivateRoute></RouteCache>} />
          <Route path="/create" element={<LazyComponent><PrivateRoute><Create /></PrivateRoute></LazyComponent>} />
          
          {/* 大型组件和低频访问页面使用懒加载 */}
          <Route path="/particle-art" element={<LazyComponent><ParticleArt /></LazyComponent>} />
          <Route path="/collaboration" element={<LazyComponent><CollaborationDemo /></LazyComponent>} />
          <Route path="/terms" element={<LazyComponent><Terms /></LazyComponent>} />
          <Route path="/help" element={<LazyComponent><Help /></LazyComponent>} />
          <Route path="/leaderboard" element={<LazyComponent><Leaderboard /></LazyComponent>} />
          <Route path="/games" element={<LazyComponent><Games /></LazyComponent>} />
          <Route path="/lab" element={<LazyComponent><PrivateRoute><Lab /></PrivateRoute></LazyComponent>} />
          <Route path="/image-test" element={<LazyComponent><ImageTest /></LazyComponent>} />
          <Route path="/github-image-test" element={<LazyComponent><GitHubImageTestPage /></LazyComponent>} />
          <Route path="/wizard" element={<LazyComponent><PrivateRoute><Wizard /></PrivateRoute></LazyComponent>} />
          <Route path="/brand" element={<LazyComponent><PrivateRoute><BrandGuide /></PrivateRoute></LazyComponent>} />
          <Route path="/input" element={<LazyComponent><PrivateRoute><InputHub /></PrivateRoute></LazyComponent>} />
          <Route path="/generate" element={<LazyComponent><PrivateRoute><Generation /></PrivateRoute></LazyComponent>} />
          <Route path="/authenticity" element={<LazyComponent><PrivateRoute><Authenticity /></PrivateRoute></LazyComponent>} />
          <Route path="/incentives" element={<LazyComponent><PrivateRoute><Incentives /></PrivateRoute></LazyComponent>} />
          <Route path="/drafts" element={<LazyComponent><PrivateRoute><Drafts /></PrivateRoute></LazyComponent>} />
          <Route path="/settings" element={<LazyComponent><PrivateRoute><Settings /></PrivateRoute></LazyComponent>} />
          <Route path="/analytics" element={<LazyComponent><PrivateRoute><AnalyticsPage /></PrivateRoute></LazyComponent>} />
          <Route path="/collection" element={<LazyComponent><PrivateRoute><UserCollection /></PrivateRoute></LazyComponent>} />
          <Route path="/knowledge" element={<LazyComponent><PrivateRoute><CulturalKnowledge /></PrivateRoute></LazyComponent>} />
          <Route path="/knowledge/:type/:id" element={<LazyComponent><PrivateRoute><CulturalKnowledge /></PrivateRoute></LazyComponent>} />
          <Route path="/news" element={<LazyComponent><CulturalNewsPage /></LazyComponent>} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/tianjin" element={<LazyComponent><Tianjin /></LazyComponent>} />
          <Route path="/tianjin/map" element={<LazyComponent><TianjinMap /></LazyComponent>} />
          <Route path="/events" element={<LazyComponent><CulturalEvents /></LazyComponent>} />
          <Route path="/events/:id" element={<EventDetail />} />
          
          {/* 创新功能路由 - 懒加载 */}
          <Route path="/daily-checkin" element={<LazyComponent><PrivateRoute><DailyCheckin /></PrivateRoute></LazyComponent>} />
          <Route path="/creative-matchmaking" element={<LazyComponent><PrivateRoute><CreativeMatchmaking /></PrivateRoute></LazyComponent>} />
          <Route path="/ip-incubation" element={<LazyComponent><PrivateRoute><IPIncubationCenter /></PrivateRoute></LazyComponent>} />
          <Route path="/cross-device-sync" element={<LazyComponent><PrivateRoute><CrossDeviceSync /></PrivateRoute></LazyComponent>} />
          <Route path="/achievement-museum" element={<LazyComponent><PrivateRoute><AchievementMuseum /></PrivateRoute></LazyComponent>} />
          <Route path="/blind-box" element={<LazyComponent><PrivateRoute><BlindBoxShop /></PrivateRoute></LazyComponent>} />
          {/* 积分商城路由 */}
          <Route path="/points-mall" element={<LazyComponent><PrivateRoute><PointsMall /></PrivateRoute></LazyComponent>} />
          
          {/* 会员相关路由 - 懒加载 */}
          <Route path="/membership" element={<LazyComponent><Membership /></LazyComponent>} />
          <Route path="/membership/payment" element={<LazyComponent><PrivateRoute><MembershipPayment /></PrivateRoute></LazyComponent>} />
          <Route path="/membership/benefits" element={<LazyComponent><MembershipBenefits /></LazyComponent>} />
          <Route path="/membership/upgrade" element={<LazyComponent><PrivateRoute><Membership /></PrivateRoute></LazyComponent>} />
          
          {/* 管理员路由 - 懒加载 */}
          <Route path="/admin" element={<LazyComponent><AdminRoute component={Admin} /></LazyComponent>} />
          <Route path="/errors" element={<LazyComponent><AdminRoute component={ErrorMonitoringDashboard} /></LazyComponent>} />
          <Route path="/admin-analytics" element={<LazyComponent><AdminRoute component={AdminAnalytics} /></LazyComponent>} />
        </Route>
      </Routes>
      
      {/* PWA 安装按钮 */}
      <PWAInstallButton />
      {/* 恢复FirstLaunchGuide组件，优化首次启动体验 */}
      <LazyComponent>
        <FirstLaunchGuide />
      </LazyComponent>
      
      {/* 悬浮AI助手 */}
      <FloatingAIAssistant />
      
      {/* 用户反馈组件 */}
      <UserFeedback isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      
      {/* 优化：使用独立的FloatingButtons组件，避免不必要的全局重新渲染 */}
      <FloatingButtons />
      

    </div>
);
}
