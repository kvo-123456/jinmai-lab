// 控制台日志增强，过滤内存地址日志
const consoleMethods = ['log', 'warn', 'error', 'info', 'debug'] as const;
const originalMethods = {} as Record<typeof consoleMethods[number], typeof console.log>;

consoleMethods.forEach(method => {
  originalMethods[method] = console[method];
});

const filterAndLog = (method: typeof consoleMethods[number], ...args: any[]) => {
    let shouldFilter = false;
    
    // 辅助函数：计算字符串中内存地址的数量
    const countMemoryAddresses = (str: string): number => {
      const matches = str.match(/0x[0-9a-f]{8,}/gi) || [];
      return matches.length;
    };
    
    // 辅助函数：检查是否为内存地址
    const isMemoryAddress = (item: any): boolean => {
      const itemStr = String(item);
      return /^0x[0-9a-f]{8,}$/i.test(itemStr);
    };
    
    // 检查是否所有参数都是内存地址
    const allAreMemoryAddresses = args.every(isMemoryAddress);
    
    // 处理多个内存地址作为独立参数传递的情况
    if (allAreMemoryAddresses) {
      // 过滤包含5个以上内存地址的情况，允许4个内存地址的日志通过
      shouldFilter = args.length >= 5;
    } else {
      // 处理单个参数（可能是字符串、数组或对象）
      for (const arg of args) {
        const argStr = String(arg);
        
        // 检查字符串形式的内存地址数组，比如 "[0xc0098230c0 0xc0098230f0 0xc009823120 0xc009823150]"
        if (typeof arg === 'string' && (arg.startsWith('[') || arg.includes('0x'))) {
          const memoryAddressCount = countMemoryAddresses(arg);
          if (memoryAddressCount >= 5) {
            shouldFilter = true;
            break;
          }
        } 
        // 处理实际的数组
        else if (Array.isArray(arg)) {
          // 检查数组中是否全是内存地址
          const allArrayItemsAreMemoryAddresses = arg.every(isMemoryAddress);
          if (allArrayItemsAreMemoryAddresses && arg.length >= 5) {
            shouldFilter = true;
            break;
          }
          
          // 检查数组中包含的内存地址数量
          const memoryAddressCount = arg.filter(isMemoryAddress).length;
          if (memoryAddressCount >= 5) {
            shouldFilter = true;
            break;
          }
        }
        // 处理对象
        else if (typeof arg === 'object' && arg !== null) {
          const objStr = JSON.stringify(arg);
          const memoryAddressCount = countMemoryAddresses(objStr);
          if (memoryAddressCount >= 5) {
            shouldFilter = true;
            break;
          }
        }
        // 处理单个内存地址
        else if (isMemoryAddress(arg)) {
          // 单个内存地址不过滤，可能是有用的调试信息
          continue;
        }
      }
    }
    
    // 最终检查：计算总内存地址数量
    const totalMemoryAddresses = args.reduce((count, arg) => {
      const argStr = String(arg);
      return count + countMemoryAddresses(argStr);
    }, 0);
    
    // 只过滤包含5个以上内存地址的情况
    shouldFilter = totalMemoryAddresses >= 5;
  
  if (!shouldFilter) {
    originalMethods[method].apply(console, args);
  }
};

consoleMethods.forEach(method => {
  console[method] = (...args: any[]) => filterAndLog(method, ...args);
});

// 过滤内存地址日志，减少控制台噪音


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

// 注册Service Worker
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
            </WorkflowProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
