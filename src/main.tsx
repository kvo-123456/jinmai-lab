// 移除控制台日志增强代码，减少可能的错误

// 导入three.js并添加到全局作用域，解决three-photo-dome.module.js中THREE is not defined的问题
import * as THREE from 'three';
// @ts-ignore
window.THREE = THREE;

import { StrictMode } from "react";
import "./styles/tianjin.css";
import "./styles/neo.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import { AuthProvider } from './contexts/authContext';
import { WorkflowProvider } from './contexts/workflowContext.tsx';
import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './hooks/useTheme';
// 性能监控
import { initPerformanceMonitor } from './utils/performanceMonitor';

// 初始化性能监控
initPerformanceMonitor();

// 启用Service Worker注册，PWA插件已重新启用
import { registerServiceWorker } from './utils/serviceWorker';
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <WorkflowProvider>
              <App />
              <Toaster />
              {/* Vercel Analytics and Speed Insights */}
              <Analytics />
              <SpeedInsights />
            </WorkflowProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
