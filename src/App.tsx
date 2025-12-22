import { Routes, Route, Outlet, useLocation, useNavigationType, Link, Navigate } from "react-router-dom";
import { useState, useEffect, Suspense, lazy, useRef, useMemo } from 'react'

// 核心页面保持同步加载，减少导航延迟
// 对于高频访问的页面，使用同步加载可以减少导航跳转时间
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Explore from "@/pages/Explore";
import WorkDetail from "@/pages/WorkDetail";
import Create from "@/pages/Create";
import Tools from "@/pages/Tools";
import About from "@/pages/About";
import Square from "@/pages/Square";
import Community from "@/pages/Community";
import Neo from "@/pages/Neo";
import NewsDetail from "@/pages/NewsDetail";
import EventDetail from "@/pages/EventDetail";

// 大型组件和低频访问页面使用懒加载
// 对于大型组件和低频访问的页面，使用懒加载可以减少初始加载时间
const LazyComponent = ({ children }: { children: React.ReactNode }) => {
  // 优化的加载骨架屏，提升用户体验
  const SimpleLoadingSkeleton = () => (
    <div className="min-h-[200px] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg transition-all duration-300"></div>
  );
  
  return (
    <Suspense fallback={<SimpleLoadingSkeleton />}>
      {children}
    </Suspense>
  );
};

// 使用lazy实现组件懒加载
const Admin = lazy(() => import("@/pages/admin/Admin"));
const ErrorMonitoringDashboard = lazy(() => import("@/components/ErrorMonitoringDashboard"));
const Terms = lazy(() => import("@/pages/Terms"));
const Help = lazy(() => import("@/pages/Help"));
const BrandGuide = lazy(() => import("@/pages/BrandGuide"));
const InputHub = lazy(() => import("@/pages/InputHub"));
const Generation = lazy(() => import("@/pages/Generation"));
const Authenticity = lazy(() => import("@/pages/Authenticity"));
const Incentives = lazy(() => import("@/pages/Incentives"));
const AdminAnalytics = lazy(() => import("@/pages/AdminAnalytics"));
const Wizard = lazy(() => import("@/pages/Wizard"));
const Settings = lazy(() => import("@/pages/Settings"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const UserCollection = lazy(() => import("@/pages/UserCollection"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const CulturalKnowledge = lazy(() => import("@/pages/CulturalKnowledge"));
const Tianjin = lazy(() => import("@/pages/Tianjin"));
const TianjinMap = lazy(() => import("@/pages/TianjinMap"));
const CulturalEvents = lazy(() => import("@/pages/CulturalEvents"));
const DailyCheckin = lazy(() => import("@/components/DailyCheckin"));
const CreativeMatchmaking = lazy(() => import("@/components/CreativeMatchmaking"));
const IPIncubationCenter = lazy(() => import("@/components/IPIncubationCenter"));
const CrossDeviceSync = lazy(() => import("@/components/CrossDeviceSync"));
const AchievementMuseum = lazy(() => import("@/components/AchievementMuseum"));
const Drafts = lazy(() => import("@/pages/Drafts"));
const Lab = lazy(() => import("@/pages/Lab"));
const BlindBoxShop = lazy(() => import("@/components/BlindBoxShop"));
const ParticleArt = lazy(() => import("@/pages/ParticleArt"));
const Games = lazy(() => import("@/pages/Games"));
const CollaborationDemo = lazy(() => import("@/pages/CollaborationDemo"));
const ImageTest = lazy(() => import("@/pages/ImageTest"));
const CulturalNewsPage = lazy(() => import("@/pages/CulturalNewsPage"));
const GitHubImageTestPage = lazy(() => import("@/pages/GitHubImageTestPage"));
// 会员相关页面
const Membership = lazy(() => import("@/pages/Membership"));
const MembershipPayment = lazy(() => import("@/pages/MembershipPayment"));
const MembershipBenefits = lazy(() => import("@/pages/MembershipBenefits"));



// 路由缓存组件
const RouteCache = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const cacheRef = useRef<Map<string, React.ReactNode>>(new Map());
  
  // 仅缓存核心页面
  const cacheableRoutes = ['/', '/dashboard', '/explore', '/tools', '/about'];
  
  // 检查当前路由是否可缓存
  const isCacheable = cacheableRoutes.includes(location.pathname);
  
  // 如果可缓存且已存在缓存，则使用缓存
  if (isCacheable && cacheRef.current.has(location.pathname)) {
    return cacheRef.current.get(location.pathname) as React.ReactNode;
  }
  
  // 否则渲染新内容并缓存
  const childrenNode = <>{children}</>;
  if (isCacheable) {
    cacheRef.current.set(location.pathname, childrenNode);
  }
  
  return childrenNode;
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

export default function App() {
  const location = useLocation();
  // 添加响应式布局状态
  const [isMobile, setIsMobile] = useState(false);
  
  // 监听窗口大小变化
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

  // 右侧内容组件
  const RightContent = () => (
    <aside className="w-64 p-4 overflow-y-auto">
      <div className="space-y-4">
        {/* 用户信息卡片 */}
        <div className="rounded-xl p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2">欢迎使用</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">探索AI创作的无限可能</p>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700">开始创作</button>
            <button className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">了解更多</button>
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
  );

  // 全局加载骨架屏
  const GlobalLoadingSkeleton = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  // 带有页面切换动画的组件
  const AnimatedPage = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    return (
      <div 
        key={location.pathname} 
        className="animate-page-transition transition-all duration-300 ease-in-out"
        style={{
          opacity: 0,
          transform: 'translateY(10px)',
          animation: 'fadeInUp 0.3s ease-out forwards'
        }}
      >
        {children}
      </div>
    );
  };
  
  // 全局CSS动画
  useEffect(() => {
    // 添加全局动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fadeOutDown {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(10px);
        }
      }
      
      .animate-page-transition {
        animation-duration: 0.3s;
        animation-fill-mode: both;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div className="relative">
      <Routes>
        {/* 不需要布局的页面 */}
        <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
        <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
        
        {/* 使用布局的页面 */}
        <Route element={
          isMobile ? (
            <MobileLayout>
              <Outlet />
            </MobileLayout>
          ) : (
            <SidebarLayout>
              <Outlet />
            </SidebarLayout>
          )
        }>
          {/* 核心页面直接渲染，无需懒加载，添加缓存和动画 */}
          <Route path="/" element={<RouteCache><AnimatedPage><Home /></AnimatedPage></RouteCache>} />
          <Route path="/explore" element={<RouteCache><AnimatedPage><Explore /></AnimatedPage></RouteCache>} />
          <Route path="/explore/:id" element={<AnimatedPage><WorkDetail /></AnimatedPage>} />
          <Route path="/tools" element={<RouteCache><AnimatedPage><Tools /></AnimatedPage></RouteCache>} />
          <Route path="/about" element={<RouteCache><AnimatedPage><About /></AnimatedPage></RouteCache>} />
          <Route path="/neo" element={<AnimatedPage><Neo /></AnimatedPage>} />
          <Route path="/square" element={<AnimatedPage><PrivateRoute component={Square} /></AnimatedPage>} />
          <Route path="/square/:id" element={<AnimatedPage><PrivateRoute component={Square} /></AnimatedPage>} />
          <Route path="/community" element={<AnimatedPage><PrivateRoute component={Community} /></AnimatedPage>} />
          <Route path="/dashboard" element={<RouteCache><AnimatedPage><PrivateRoute component={Dashboard} /></AnimatedPage></RouteCache>} />
          <Route path="/create" element={<AnimatedPage><PrivateRoute component={Create} /></AnimatedPage>} />
          
          {/* 大型组件和低频访问页面使用懒加载，添加动画 */}
          <Route path="/particle-art" element={<AnimatedPage><LazyComponent><ParticleArt /></LazyComponent></AnimatedPage>} />
          <Route path="/collaboration" element={<AnimatedPage><LazyComponent><CollaborationDemo /></LazyComponent></AnimatedPage>} />
          <Route path="/terms" element={<AnimatedPage><LazyComponent><Terms /></LazyComponent></AnimatedPage>} />
          <Route path="/help" element={<AnimatedPage><LazyComponent><Help /></LazyComponent></AnimatedPage>} />
          <Route path="/leaderboard" element={<AnimatedPage><LazyComponent><Leaderboard /></LazyComponent></AnimatedPage>} />
          <Route path="/games" element={<AnimatedPage><LazyComponent><Games /></LazyComponent></AnimatedPage>} />
          <Route path="/lab" element={<AnimatedPage><LazyComponent><PrivateRoute component={Lab} /></LazyComponent></AnimatedPage>} />
          <Route path="/image-test" element={<AnimatedPage><LazyComponent><ImageTest /></LazyComponent></AnimatedPage>} />
          <Route path="/github-image-test" element={<AnimatedPage><LazyComponent><GitHubImageTestPage /></LazyComponent></AnimatedPage>} />
          <Route path="/wizard" element={<AnimatedPage><LazyComponent><PrivateRoute component={Wizard} /></LazyComponent></AnimatedPage>} />
          <Route path="/brand" element={<AnimatedPage><LazyComponent><PrivateRoute component={BrandGuide} /></LazyComponent></AnimatedPage>} />
          <Route path="/input" element={<AnimatedPage><LazyComponent><PrivateRoute component={InputHub} /></LazyComponent></AnimatedPage>} />
          <Route path="/generate" element={<AnimatedPage><LazyComponent><PrivateRoute component={Generation} /></LazyComponent></AnimatedPage>} />
          <Route path="/authenticity" element={<AnimatedPage><LazyComponent><PrivateRoute component={Authenticity} /></LazyComponent></AnimatedPage>} />
          <Route path="/incentives" element={<AnimatedPage><LazyComponent><PrivateRoute component={Incentives} /></LazyComponent></AnimatedPage>} />
          <Route path="/drafts" element={<AnimatedPage><LazyComponent><PrivateRoute component={Drafts} /></LazyComponent></AnimatedPage>} />
          <Route path="/settings" element={<AnimatedPage><LazyComponent><PrivateRoute component={Settings} /></LazyComponent></AnimatedPage>} />
          <Route path="/analytics" element={<AnimatedPage><LazyComponent><PrivateRoute component={Analytics} /></LazyComponent></AnimatedPage>} />
          <Route path="/collection" element={<AnimatedPage><LazyComponent><PrivateRoute component={UserCollection} /></LazyComponent></AnimatedPage>} />
          <Route path="/knowledge" element={<AnimatedPage><LazyComponent><PrivateRoute component={CulturalKnowledge} /></LazyComponent></AnimatedPage>} />
          <Route path="/news" element={<AnimatedPage><LazyComponent><CulturalNewsPage /></LazyComponent></AnimatedPage>} />
          <Route path="/news/:id" element={<AnimatedPage><NewsDetail /></AnimatedPage>} />
          <Route path="/tianjin" element={<AnimatedPage><LazyComponent><Tianjin /></LazyComponent></AnimatedPage>} />
          <Route path="/tianjin/map" element={<AnimatedPage><LazyComponent><TianjinMap /></LazyComponent></AnimatedPage>} />
          <Route path="/events" element={<AnimatedPage><LazyComponent><CulturalEvents /></LazyComponent></AnimatedPage>} />
          <Route path="/events/:id" element={<AnimatedPage><EventDetail /></AnimatedPage>} />
          <Route path="/knowledge/:type/:id" element={<AnimatedPage><LazyComponent><PrivateRoute component={CulturalKnowledge} /></LazyComponent></AnimatedPage>} />
          
          {/* 创新功能路由 - 懒加载，添加动画 */}
          <Route path="/daily-checkin" element={<AnimatedPage><LazyComponent><PrivateRoute component={DailyCheckin} /></LazyComponent></AnimatedPage>} />
          <Route path="/creative-matchmaking" element={<AnimatedPage><LazyComponent><PrivateRoute component={CreativeMatchmaking} /></LazyComponent></AnimatedPage>} />
          <Route path="/ip-incubation" element={<AnimatedPage><LazyComponent><PrivateRoute component={IPIncubationCenter} /></LazyComponent></AnimatedPage>} />
          <Route path="/cross-device-sync" element={<AnimatedPage><LazyComponent><PrivateRoute component={CrossDeviceSync} /></LazyComponent></AnimatedPage>} />
          <Route path="/achievement-museum" element={<AnimatedPage><LazyComponent><PrivateRoute component={AchievementMuseum} /></LazyComponent></AnimatedPage>} />
          <Route path="/blind-box" element={<AnimatedPage><LazyComponent><PrivateRoute component={BlindBoxShop} /></LazyComponent></AnimatedPage>} />
          
          {/* 会员相关路由 - 懒加载，添加动画 */}
          <Route path="/membership" element={<AnimatedPage><LazyComponent><Membership /></LazyComponent></AnimatedPage>} />
          <Route path="/membership/payment" element={<AnimatedPage><LazyComponent><PrivateRoute component={MembershipPayment} /></LazyComponent></AnimatedPage>} />
          <Route path="/membership/benefits" element={<AnimatedPage><LazyComponent><MembershipBenefits /></LazyComponent></AnimatedPage>} />
          <Route path="/membership/upgrade" element={<AnimatedPage><LazyComponent><PrivateRoute component={Membership} /></LazyComponent></AnimatedPage>} />
          
          {/* 管理员路由 - 懒加载，添加动画 */}
          <Route path="/admin" element={<AnimatedPage><LazyComponent><AdminRoute component={Admin} /></LazyComponent></AnimatedPage>} />
          <Route path="/errors" element={<AnimatedPage><LazyComponent><AdminRoute component={ErrorMonitoringDashboard} /></LazyComponent></AnimatedPage>} />
          <Route path="/admin-analytics" element={<AnimatedPage><LazyComponent><AdminRoute component={AdminAnalytics} /></LazyComponent></AnimatedPage>} />
        </Route>
      </Routes>
      
      {/* PWA 安装按钮 */}
      <PWAInstallButton />
      {/* 移除FirstLaunchGuide组件，减少不必要的渲染 */}
      {/* <FirstLaunchGuide /> */}
      
      {/* 悬浮AI助手 */}
      <FloatingAIAssistant />
    </div>
);
}
