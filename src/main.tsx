// 移除控制台日志增强代码，减少可能的错误

// 导入three.js并添加到全局作用域，解决three-photo-dome.module.js中THREE is not defined的问题
import * as THREE from 'three';
// 确保只在浏览器环境中执行
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.THREE = THREE;
}

// 导入国际化配置
import './i18n/i18n';

import { StrictMode } from "react";
import "./styles/tianjin.css";
import "./styles/neo.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import { AuthProvider } from './contexts/authContext.tsx';
import { WorkflowProvider } from './contexts/workflowContext.tsx';
import { LanguageProvider } from './contexts/LanguageContext';
import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './hooks/useTheme';

// 确保只在浏览器环境中执行渲染代码
if (typeof window !== 'undefined') {
  // 简化的全局对象初始化
  window.knowledge = window.knowledge || {};
  window.lazilyLoaded = window.lazilyLoaded || {};



  // 应用渲染
  const root = document.getElementById("root");
  if (root) {
    // 清空root内容，确保没有服务器渲染的HTML残留，完全跳过hydration
    root.innerHTML = '';
    // 使用createRoot直接渲染，不进行hydration
    createRoot(root).render(
      <ErrorBoundary>
        <LanguageProvider>
          <ThemeProvider>
            <BrowserRouter basename="/jinmai-lab">
                <AuthProvider>
                  <WorkflowProvider>
                    <App />
                    <Toaster />
                  </WorkflowProvider>
                </AuthProvider>
              </BrowserRouter>
          </ThemeProvider>
        </LanguageProvider>
      </ErrorBoundary>
    );
  }
}
