// serviceWorker.ts - 处理Service Worker的注册和更新

// 检查浏览器是否支持Service Worker
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// 注册Service Worker
export const registerServiceWorker = async (): Promise<void> => {
  // 只在生产环境注册Service Worker，开发环境不生成service-worker.js
  if (import.meta.env.DEV) {
    console.log('Service Worker registration skipped in development mode.');
    return;
  }
  
  if (!isServiceWorkerSupported()) {
    console.log('Service Worker is not supported in this browser.');
    return;
  }

  try {
    // Vite PWA插件会自动生成service-worker.js文件
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      // 添加更新策略配置
      updateViaCache: 'none',
      // 添加作用域配置
      scope: '/'
    });
    
    console.log('Service Worker registered with scope:', registration.scope);
    
    // 监听Service Worker的更新
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        // 监听安装错误
        newWorker.addEventListener('error', (error) => {
          console.error('Service Worker installation error:', error);
        });
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 新的Service Worker已安装，但需要用户刷新页面才能激活
            console.log('New Service Worker available. Please refresh the page.');
            // 可以在这里显示一个更新提示，让用户刷新页面
            showUpdateNotification();
          }
        });
      }
    });
    
    // 监听控制变更事件
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed.');
      // 可以在这里处理控制变更，比如重新加载数据
    });
    
    // 监听消息事件，处理来自Service Worker的消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_ERROR') {
        console.warn('Service Worker cache error:', event.data.error);
      }
    });
    
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
};

// 显示更新通知
const showUpdateNotification = (): void => {
  // 创建一个更新通知元素
  const updateNotification = document.createElement('div');
  updateNotification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 transition-all duration-300';
  updateNotification.innerHTML = `
    <i class="fas fa-info-circle"></i>
    <span>应用有新版本可用</span>
    <button id="refreshBtn" class="ml-3 bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors">刷新</button>
    <button id="dismissBtn" class="ml-2 text-white/80 hover:text-white">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // 添加到页面
  document.body.appendChild(updateNotification);
  
  // 添加事件监听
  const refreshBtn = updateNotification.querySelector('#refreshBtn');
  const dismissBtn = updateNotification.querySelector('#dismissBtn');
  
  refreshBtn?.addEventListener('click', () => {
    window.location.reload();
  });
  
  dismissBtn?.addEventListener('click', () => {
    updateNotification.remove();
  });
  
  // 30秒后自动隐藏
  setTimeout(() => {
    if (updateNotification.parentNode) {
      updateNotification.remove();
    }
  }, 30000);
};

// 检查是否有等待激活的Service Worker
export const checkForUpdates = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.waiting) {
      // 有等待激活的Service Worker，可以直接激活它
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
};

// 检查当前是否处于离线状态
export const isOffline = (): boolean => {
  return !navigator.onLine;
};

// 监听网络状态变化
export const listenForNetworkChanges = (callback: (isOnline: boolean) => void): (() => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// 获取当前的Service Worker注册状态
export const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) {
    return null;
  }
  
  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('Error getting Service Worker registration:', error);
    return null;
  }
};

// 清理旧的Service Worker缓存
export const cleanupOldCaches = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return;
  }
  
  try {
    const cacheNames = await caches.keys();
    const currentCacheNames = ['api-cache', 'font-cache', 'image-cache', 'static-resources', 'cdn-cache', 'video-cache'];
    
    for (const cacheName of cacheNames) {
      // 删除旧的缓存
      if (!cacheName.startsWith('workbox-') && !currentCacheNames.includes(cacheName)) {
        await caches.delete(cacheName);
        console.log('Deleted old cache:', cacheName);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old caches:', error);
  }
};
