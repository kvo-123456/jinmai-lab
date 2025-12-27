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

// 4. 保护全局对象不被意外修改
Object.defineProperty(window, 'knowledge', {
  configurable: false,
  writable: false,
  value: undefined,
  enumerable: false
});

// 5. 监控对象属性设置
const originalDefineProperty = Object.defineProperty;
Object.defineProperty = function(obj, prop, descriptor) {
  if (prop === 'knowledge' && obj === window) {
    console.warn('Attempting to set knowledge property on window object:', descriptor);
  }
  return originalDefineProperty.call(this, obj, prop, descriptor);
};

const originalSet = Object.prototype.__defineSetter__;
if (originalSet) {
  Object.prototype.__defineSetter__ = function(prop, setter) {
    if (prop === 'knowledge') {
      console.warn('Attempting to define setter for knowledge property:', setter);
    }
    return originalSet.call(this, prop, setter);
  };
}

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
