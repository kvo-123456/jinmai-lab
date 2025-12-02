import { Routes, Route, Outlet } from "react-router-dom";
import { Suspense, lazy, useState, useEffect } from 'react'
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Explore = lazy(() => import("@/pages/Explore"));
const WorkDetail = lazy(() => import("@/pages/WorkDetail"));
const Create = lazy(() => import("@/pages/Create"));
const Admin = lazy(() => import("@/pages/admin/Admin"));
const ErrorMonitoringDashboard = lazy(() => import("@/components/ErrorMonitoringDashboard"));
const Tools = lazy(() => import("@/pages/Tools"));
const About = lazy(() => import("@/pages/About"));
const Terms = lazy(() => import("@/pages/Terms"));
const Help = lazy(() => import("@/pages/Help"));
const BrandGuide = lazy(() => import("@/pages/BrandGuide"));
const InputHub = lazy(() => import("@/pages/InputHub"));
const Generation = lazy(() => import("@/pages/Generation"));
const Authenticity = lazy(() => import("@/pages/Authenticity"));
const Square = lazy(() => import("@/pages/Square"));
const Community = lazy(() => import("@/pages/Community"));
const Incentives = lazy(() => import("@/pages/Incentives"));
const AdminAnalytics = lazy(() => import("@/pages/AdminAnalytics"));
const Wizard = lazy(() => import("@/pages/Wizard"));
const Neo = lazy(() => import("@/pages/Neo"));
const Settings = lazy(() => import("@/pages/Settings"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const UserCollection = lazy(() => import("@/pages/UserCollection"));
import PrivateRoute from "@/components/PrivateRoute";
import AdminRoute from "@/components/AdminRoute";
const CulturalKnowledge = lazy(() => import("@/pages/CulturalKnowledge"));
const TianjinCreativeActivities = lazy(() => import('@/components/TianjinCreativeActivities'))
const DailyCheckin = lazy(() => import("@/components/DailyCheckin"));
const CreativeMatchmaking = lazy(() => import("@/components/CreativeMatchmaking"));
const IPIncubationCenter = lazy(() => import("@/components/IPIncubationCenter"));
const CrossDeviceSync = lazy(() => import("@/components/CrossDeviceSync"));
const AchievementMuseum = lazy(() => import("@/components/AchievementMuseum"));
const Drafts = lazy(() => import("@/pages/Drafts"));
const Lab = lazy(() => import("@/pages/Lab"));
const BlindBoxShop = lazy(() => import("@/components/BlindBoxShop"));
import SidebarLayout from '@/components/SidebarLayout';
import MobileLayout from '@/components/MobileLayout';

export default function App() {
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

  // 布局组件包装器
  const LayoutWrapper = () => {
    return isMobile ? (
      <MobileLayout><Outlet /></MobileLayout>
    ) : (
      <SidebarLayout>
        <Outlet />
      </SidebarLayout>
    );
  };

  return (
    <Suspense fallback={<div className="p-4">加载中...</div>}>
      <Routes>
        {/* 不需要布局的页面 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 使用布局的页面 */}
        <Route element={<LayoutWrapper />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/explore/:id" element={<WorkDetail />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/help" element={<Help />} />
          <Route path="/neo" element={<Neo />} />
          <Route path="/lab" element={<PrivateRoute component={Lab} />} />
          <Route path="/wizard" element={<PrivateRoute component={Wizard} />} />
          <Route path="/brand" element={<PrivateRoute component={BrandGuide} />} />
          <Route path="/input" element={<PrivateRoute component={InputHub} />} />
          <Route path="/generate" element={<PrivateRoute component={Generation} />} />
          <Route path="/authenticity" element={<PrivateRoute component={Authenticity} />} />
          <Route path="/square" element={<PrivateRoute component={Square} />} />
          <Route path="/square/:id" element={<PrivateRoute component={Square} />} />
          <Route path="/community" element={<PrivateRoute component={Community} />} />
          <Route path="/incentives" element={<PrivateRoute component={Incentives} />} />
          
          {/* 需要登录的路由 */}
          <Route 
            path="/dashboard" 
            element={<PrivateRoute component={Dashboard} />} 
          />

          <Route 
            path="/create" 
            element={<PrivateRoute component={Create} />} 
          />

          <Route 
            path="/drafts" 
            element={<PrivateRoute component={Drafts} />} 
          />

          <Route 
            path="/settings" 
            element={<PrivateRoute component={Settings} />} 
          />
          
          <Route 
            path="/analytics" 
            element={<PrivateRoute component={Analytics} />} 
          />
          
          <Route 
            path="/collection" 
            element={<PrivateRoute component={UserCollection} />} 
          />
          
          <Route 
            path="/knowledge" 
            element={<PrivateRoute component={CulturalKnowledge} />} 
          />
          
          <Route 
            path="/knowledge/:type/:id" 
            element={<PrivateRoute component={CulturalKnowledge} />} 
          />
          
          {/* 天津特色专区路由 */}
          <Route 
            path="/tianjin" 
            element={<PrivateRoute component={TianjinCreativeActivities} />} 
          />
          
          {/* 创新功能路由 */}
          <Route 
            path="/daily-checkin" 
            element={<PrivateRoute component={DailyCheckin} />} 
          />
          
          <Route 
            path="/creative-matchmaking" 
            element={<PrivateRoute component={CreativeMatchmaking} />} 
          />
          
          <Route 
            path="/ip-incubation" 
            element={<PrivateRoute component={IPIncubationCenter} />} 
          />
          
          <Route 
            path="/cross-device-sync" 
            element={<PrivateRoute component={CrossDeviceSync} />} 
          />
          
          <Route 
            path="/achievement-museum" 
            element={<PrivateRoute component={AchievementMuseum} />} 
          />
          
          <Route 
            path="/blind-box" 
            element={<PrivateRoute component={BlindBoxShop} />} 
          />
          
          {/* 管理员路由 */}
          <Route 
            path="/admin" 
            element={<AdminRoute component={Admin} />} 
          />
          <Route 
            path="/errors" 
            element={<AdminRoute component={ErrorMonitoringDashboard} />} 
          />
          <Route 
            path="/admin-analytics" 
            element={<AdminRoute component={AdminAnalytics} />} 
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
