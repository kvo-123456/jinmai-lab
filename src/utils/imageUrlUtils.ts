// 处理图片URL的工具函数

/**
 * 将Unsplash图片URL转换为使用代理的URL，避免ORB（Origin Restricted Blocking）错误
 * @param url 原始图片URL
 * @returns 处理后的图片URL
 */
export function processImageUrl(url: string): string {
  if (!url) return '';
  
  try {
    // 检查是否为base64编码的图片数据
    if (url.startsWith('data:')) {
      // 直接返回原始URL，不进行额外处理
      return url;
    }
    
    // 检查是否为相对路径
    if (url.startsWith('/')) {
      // 直接返回原始URL，不进行额外处理
      return url;
    }
    
    // 检查是否为有效的URL格式
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (error) {
      // 如果URL格式无效，直接返回原始URL，不进行额外处理
      console.warn('Invalid URL format, returning original:', url, error);
      return url;
    }
    
    // 检查是否为Unsplash图片URL
    if (urlObj.hostname.includes('unsplash.com') || urlObj.hostname.includes('images.unsplash.com')) {
      // 使用代理URL避免ORB错误
      return `/api/proxy/unsplash${urlObj.pathname}${urlObj.search}`;
    }
    
    // 检查是否为已知的代理URL
    if (url.includes('trae-api-sg.mchost.guru')) {
      // 直接返回原始URL，不进行额外处理
      return url;
    }
    
    // 对于其他代理URL，不进行处理，直接返回
    if (url.includes('/api/proxy/')) {
      return url;
    }
    
    // 处理 https://jinmalab.tech/proxy?url=... 格式的URL
    if (urlObj.hostname === 'jinmalab.tech' && urlObj.pathname === '/proxy') {
      // 提取查询参数中的真实图片URL
      const realUrl = urlObj.searchParams.get('url');
      if (realUrl) {
        try {
          const realUrlObj = new URL(realUrl);
          // 根据真实URL的主机名选择合适的代理路径
          if (realUrlObj.hostname.includes('unsplash.com') || realUrlObj.hostname.includes('images.unsplash.com')) {
            return `/api/proxy/unsplash${realUrlObj.pathname}${realUrlObj.search}`;
          }
          // 对于其他URL，直接返回真实URL
          return realUrl;
        } catch (error) {
          console.warn('Invalid real URL in proxy format, returning original:', realUrl, error);
          return realUrl || url;
        }
      }
    }
    
    // 其他URL保持不变
    return url;
  } catch (error) {
    console.warn('Unexpected error processing URL, returning original:', url, error);
    // 对于任何错误，返回原始URL，而不是空字符串，确保图片能够尝试加载
    return url;
  }
}

/**
 * 批量处理图片URL数组
 * @param urls 原始图片URL数组
 * @returns 处理后的图片URL数组
 */
export function processImageUrls(urls: string[]): string[] {
  return urls.map(processImageUrl);
}
