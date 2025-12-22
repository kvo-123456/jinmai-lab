// 测试资源缓存机制
import * as THREE from 'three';
import { resourceCache, CACHE_CONFIG } from './components/ARPreview';
import { processImageUrl } from './utils/imageUrlUtils';

// 测试资源缓存功能
const testResourceCache = async () => {
  console.log('=== 测试资源缓存机制 ===');
  
  // 测试1: 检查初始状态
  console.log('1. 初始缓存大小:', resourceCache.getCurrentCacheSize());
  console.log('2. 初始纹理缓存数量:', resourceCache.textures.size);
  console.log('3. 初始模型缓存数量:', resourceCache.models.size);
  
  // 测试2: 创建测试纹理
  console.log('\n=== 创建测试纹理 ===');
  const testTexture1 = new THREE.CanvasTexture(document.createElement('canvas'));
  const testTexture2 = new THREE.CanvasTexture(document.createElement('canvas'));
  
  // 测试3: 添加纹理到缓存
  console.log('\n=== 添加纹理到缓存 ===');
  resourceCache.textures.set('test-url-1', {
    resource: testTexture1,
    timestamp: Date.now(),
    size: 1.5,
    usageCount: 1,
    lastUsed: Date.now()
  });
  
  resourceCache.textures.set('test-url-2', {
    resource: testTexture2,
    timestamp: Date.now(),
    size: 2.0,
    usageCount: 2,
    lastUsed: Date.now()
  });
  
  console.log('4. 添加后纹理缓存数量:', resourceCache.textures.size);
  console.log('5. 添加后缓存大小:', resourceCache.getCurrentCacheSize());
  
  // 测试4: 测试缓存清理
  console.log('\n=== 测试缓存清理 ===');
  // 模拟超过最大数量限制
  for (let i = 3; i <= CACHE_CONFIG.maxTextures + 5; i++) {
    const testTexture = new THREE.CanvasTexture(document.createElement('canvas'));
    resourceCache.textures.set(`test-url-${i}`, {
      resource: testTexture,
      timestamp: Date.now(),
      size: Math.random() * 5,
      usageCount: Math.floor(Math.random() * 5),
      lastUsed: Date.now()
    });
  }
  
  console.log('6. 超过限制后纹理缓存数量:', resourceCache.textures.size);
  
  // 运行缓存清理
  resourceCache.config.cleanupExcess();
  console.log('7. 清理后纹理缓存数量:', resourceCache.textures.size);
  console.log('8. 清理后缓存大小:', resourceCache.getCurrentCacheSize());
  
  // 测试5: 测试过期清理
  console.log('\n=== 测试过期清理 ===');
  // 添加过期资源
  const expiredTexture = new THREE.CanvasTexture(document.createElement('canvas'));
  resourceCache.textures.set('expired-url', {
    resource: expiredTexture,
    timestamp: Date.now() - (CACHE_CONFIG.cacheTTL + 1000), // 过期1秒
    size: 1.0,
    usageCount: 1,
    lastUsed: Date.now() - (CACHE_CONFIG.cacheTTL + 1000)
  });
  
  console.log('9. 添加过期资源后纹理缓存数量:', resourceCache.textures.size);
  
  // 运行过期清理
  resourceCache.config.cleanupExpired();
  console.log('10. 清理过期资源后纹理缓存数量:', resourceCache.textures.size);
  
  // 测试6: 测试缓存统计
  console.log('\n=== 测试缓存统计 ===');
  console.log('11. 最终缓存大小:', resourceCache.getCurrentCacheSize());
  console.log('12. 最终纹理缓存数量:', resourceCache.textures.size);
  console.log('13. 最终模型缓存数量:', resourceCache.models.size);
  
  // 测试7: 测试processImageUrl函数
  console.log('\n=== 测试processImageUrl函数 ===');
  const testUrls = [
    '/api/proxy/test-url',
    '/images/test.jpg',
    'https://example.com/test.jpg',
    'invalid-url',
    ''
  ];
  
  testUrls.forEach(url => {
    console.log(`14. processImageUrl('${url}') = '${processImageUrl(url)}'`);
  });
  
  console.log('\n=== 资源缓存测试完成 ===');
};

// 运行测试
testResourceCache();
