// 图片加载和缓存工具

interface CachedImage {
  url: string;
  data: string;
  timestamp: number;
  expires: number;
}

// 缓存有效期（7天）
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

// 检查浏览器是否支持localStorage
const isLocalStorageSupported = (): boolean => {
  try {
    const testKey = '__image_cache_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// 获取缓存图片
const getCachedImage = (url: string): string | null => {
  if (!isLocalStorageSupported()) return null;
  
  try {
    const cacheKey = `image_cache_${url}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const cachedImage: CachedImage = JSON.parse(cachedData);
    const now = Date.now();
    
    // 检查缓存是否过期
    if (now > cachedImage.expires) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return cachedImage.data;
  } catch {
    return null;
  }
};

// 设置缓存图片
const setCachedImage = (url: string, data: string): void => {
  if (!isLocalStorageSupported()) return;
  
  try {
    const cacheKey = `image_cache_${url}`;
    const now = Date.now();
    
    const cachedImage: CachedImage = {
      url,
      data,
      timestamp: now,
      expires: now + CACHE_EXPIRY
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cachedImage));
  } catch {
    // 忽略存储错误
  }
};

// 预加载图片并缓存
const preloadImage = async (url: string): Promise<string> => {
  // 检查缓存
  const cachedData = getCachedImage(url);
  if (cachedData) {
    return cachedData;
  }
  
  // 加载图片
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load image: ${url}`);
  }
  
  // 转换为Data URL
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  
  // 缓存图片
  setCachedImage(url, dataUrl);
  
  return dataUrl;
};

// 批量预加载图片
const preloadImages = async (urls: string[]): Promise<string[]> => {
  return Promise.all(urls.map(preloadImage));
};

// 清理过期缓存
const cleanupCache = (): void => {
  if (!isLocalStorageSupported()) return;
  
  try {
    const now = Date.now();
    
    // 遍历所有缓存项
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('image_cache_')) continue;
      
      const cachedData = localStorage.getItem(key);
      if (!cachedData) continue;
      
      try {
        const cachedImage: CachedImage = JSON.parse(cachedData);
        if (now > cachedImage.expires) {
          localStorage.removeItem(key);
        }
      } catch {
        // 清理无效缓存
        localStorage.removeItem(key);
      }
    }
  } catch {
    // 忽略清理错误
  }
};

export {
  preloadImage,
  preloadImages,
  cleanupCache,
  getCachedImage,
  setCachedImage
};
