// 移除控制台日志增强代码，减少可能的错误

// 导入three.js并添加到全局作用域，解决three-photo-dome.module.js中THREE is not defined的问题
import * as THREE from 'three';
// @ts-ignore
window.THREE = THREE;

// 导入国际化配置
import './i18n/i18n';

import { StrictMode } from "react";
import "./styles/tianjin.css";
import "./styles/neo.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import { AuthProvider } from './contexts/authContext';
import { WorkflowProvider } from './contexts/workflowContext.tsx';
import { LanguageProvider } from './contexts/LanguageContext';
import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './hooks/useTheme';
// Vercel Analytics and Speed Insights
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
// 性能监控
import { initPerformanceMonitor } from './utils/performanceMonitor';

// 初始化性能监控，根据环境动态调整监控级别
initPerformanceMonitor();

// 全局错误捕获
import errorService from './services/errorService';

// 1. 增强的全局JavaScript错误捕获
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error caught:', {
    message,
    source,
    lineno,
    colno,
    error
  });
  
  if (error) {
    errorService.logError(error, {
      type: 'global',
      source,
      lineno,
      colno
    });
  } else {
    const errorObj = new Error(message as string);
    errorService.logError(errorObj, {
      type: 'global',
      source,
      lineno,
      colno
    });
  }
  return false; // 允许浏览器继续显示错误
};

// 2. 捕获未处理的Promise拒绝
window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection caught:', {
    reason: event.reason,
    promise: event.promise
  });
  
  const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
  errorService.logError(error, {
    type: 'unhandledrejection',
    promise: event.promise
  });
  event.preventDefault();
};

// 3. 捕获资源加载错误
window.addEventListener('error', (event) => {
  if (event.target instanceof HTMLElement) {
    errorService.logError(new Error(`Resource failed to load: ${event.target.tagName}`), {
      type: 'resource',
      tagName: event.target.tagName,
      src: event.target instanceof HTMLImageElement ? event.target.src : 
           event.target instanceof HTMLLinkElement ? event.target.href : 
           event.target instanceof HTMLScriptElement ? event.target.src : 
           undefined,
      outerHTML: event.target.outerHTML
    });
  }
}, true);

// 全局对象已经在index.html中初始化和保护，这里不再重复
// 确保关键全局对象总是存在
(function() {
  console.log('Verifying global objects in main.tsx...');
  
  // 验证knowledge对象
  if (typeof window.knowledge === 'undefined') {
    console.error('window.knowledge is undefined in main.tsx! Initializing now...');
    window.knowledge = {};
  } else {
    console.log('✓ window.knowledge exists:', typeof window.knowledge);
  }
  
  // 验证lazilyLoaded对象
  if (typeof window.lazilyLoaded === 'undefined') {
    console.error('window.lazilyLoaded is undefined in main.tsx! Initializing now...');
    window.lazilyLoaded = {};
  } else {
    console.log('✓ window.lazilyLoaded exists:', typeof window.lazilyLoaded);
  }
})();

// 注销旧的Service Worker，确保没有遗留的Service Worker影响应用
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister().catch(error => {
          console.error('Failed to unregister service worker:', error);
        });
      }
    });
  });
}

// 使用try-catch包装整个应用渲染过程，防止任何错误导致应用崩溃
try {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary>
        <LanguageProvider>
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
        </LanguageProvider>
      </ErrorBoundary>
    </StrictMode>
  );
} catch (error) {
  console.error('Critical error during app rendering:', error);
  // 如果渲染失败，显示一个友好的错误页面
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #ff4444; margin-bottom: 20px;">应用加载失败</h1>
        <p style="color: #666; text-align: center; max-width: 600px;">很抱歉，应用在加载过程中遇到了一些问题。请刷新页面重试，或者稍后再试。</p>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background-color: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
          刷新页面
        </button>
      </div>
    `;
  }
}
