import { StrictMode } from "react";
import { Analytics } from "@vercel/analytics/react"; // 引入 Vercel Analytics 组件，用于网站访问量统计
import "./styles/tianjin.css";
import "./styles/neo.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import { AuthProvider } from './contexts/authContext';
import { WorkflowProvider } from './contexts/workflowContext.tsx';
import "./index.css";
import ErrorBoundary from './components/ErrorBoundary';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ThemeProvider } from './hooks/useTheme';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <WorkflowProvider>
              <App />
              <Toaster />
              {/* 挂载网站分析组件：仅在部署环境采集访问与页面浏览等数据 */}
              <Analytics />
              {/* 挂载速度洞察组件：采集 Web Vitals 性能指标用于优化 */}
              <SpeedInsights />
            </WorkflowProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
