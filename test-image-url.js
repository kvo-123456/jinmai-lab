// 简化版的processImageUrl函数测试
function processImageUrl(url) {
  if (!url || url.trim() === '') {
    return 'placeholder';
  }
  
  try {
    let cleanedUrl = url.trim().replace(/[\s\t\n\r]+/g, '');
    
    if (cleanedUrl.startsWith('data:')) {
      return cleanedUrl;
    }
    
    if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
      console.log(`完整URL，直接返回: ${cleanedUrl}`);
      return cleanedUrl;
    }
    
    // 修复后的相对路径处理逻辑
    if (cleanedUrl.includes('/') && !cleanedUrl.startsWith('http://') && !cleanedUrl.startsWith('https://')) {
      console.log(`相对路径，转换为绝对路径: ${cleanedUrl}`);
      return `/${cleanedUrl}`;
    }
    
    return `/assets/${cleanedUrl}`;
  } catch (error) {
    console.error(`处理URL失败: ${url}`, error);
    return 'placeholder';
  }
}

// 测试不同类型的URL
const testUrls = [
  'https://images.unsplash.com/photo-1511245003488-178461620586?w=600&h=400&fit=crop',
  'http://images.unsplash.com/photo-1511245003488-178461620586?w=600&h=400&fit=crop',
  '/assets/image.jpg',
  'assets/image.jpg',
  'images/image.jpg',
  'image.jpg',
  ''
];

console.log('测试processImageUrl函数：');
console.log('=' .repeat(50));

testUrls.forEach(url => {
  const result = processImageUrl(url);
  console.log(`原始URL: ${url}`);
  console.log(`处理后: ${result}`);
  console.log('-' .repeat(50));
});
