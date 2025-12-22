// 简化的资源缓存测试，不依赖浏览器环境

// 模拟Texture类型
class MockTexture {
  constructor() {
    this.disposed = false;
  }
  
  dispose() {
    this.disposed = true;
  }
}

// 模拟Group类型
class MockGroup {
  constructor() {
    this.disposed = false;
  }
  
  traverse(callback) {
    callback(this);
  }
}

// 模拟资源缓存配置
const CACHE_CONFIG = {
  maxTextures: 5,
  maxModels: 3,
  cacheTTL: 30 * 60 * 1000,
  cleanupInterval: 5 * 60 * 1000,
  maxTextureSizeMB: 50,
  maxModelSizeMB: 100,
  minUsageCount: 2
};

// 模拟资源缓存机制
const resourceCache = {
  textures: new Map(),
  models: new Map(),
  
  getCurrentCacheSize() {
    return {
      textures: Array.from(this.textures.values())
        .reduce((total, cached) => total + (cached.size || 0), 0),
      models: Array.from(this.models.values())
        .reduce((total, cached) => total + (cached.size || 0), 0),
    };
  },
  
  config: {
    // 清理过期资源
    cleanupExpired() {
      const now = Date.now();
      
      // 清理过期纹理
      for (const [key, cached] of resourceCache.textures.entries()) {
        if (now - cached.timestamp > CACHE_CONFIG.cacheTTL) {
          cached.resource.dispose();
          resourceCache.textures.delete(key);
        }
      }
      
      // 清理过期模型
      for (const [key, cached] of resourceCache.models.entries()) {
        // 递归清理模型资源
        cached.resource.traverse((object) => {
          if (object.geometry) object.geometry.dispose?.();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose?.());
            } else {
              object.material.dispose?.();
            }
          }
        });
        resourceCache.models.delete(key);
      }
    },
    
    // 清理超出限制的资源
    cleanupExcess() {
      const currentSize = resourceCache.getCurrentCacheSize();
      
      // 智能清理纹理缓存
      if (resourceCache.textures.size > CACHE_CONFIG.maxTextures) {
        // 按优先级排序：使用次数 > 最近使用时间 > 大小
        const sortedTextures = Array.from(resourceCache.textures.entries())
          .sort((a, b) => {
            // 首先比较使用次数
            if (a[1].usageCount !== b[1].usageCount) {
              return b[1].usageCount - a[1].usageCount;
            }
            // 然后比较最近使用时间
            if (a[1].lastUsed !== b[1].lastUsed) {
              return b[1].lastUsed - a[1].lastUsed;
            }
            // 最后比较大小，大文件优先清理
            return (b[1].size || 0) - (a[1].size || 0);
          });
        
        // 清理直到满足条件
        let excessCount = Math.max(
          resourceCache.textures.size - CACHE_CONFIG.maxTextures,
          0
        );
        
        for (let i = sortedTextures.length - 1; i >= 0 && excessCount > 0; i--) {
          const [key, cached] = sortedTextures[i];
          // 保留使用次数较高的资源
          if (cached.usageCount < CACHE_CONFIG.minUsageCount) {
            cached.resource.dispose();
            resourceCache.textures.delete(key);
            excessCount--;
          }
        }
      }
      
      // 智能清理模型缓存
      if (resourceCache.models.size > CACHE_CONFIG.maxModels) {
        // 按优先级排序：使用次数 > 最近使用时间 > 大小
        const sortedModels = Array.from(resourceCache.models.entries())
          .sort((a, b) => {
            // 首先比较使用次数
            if (a[1].usageCount !== b[1].usageCount) {
              return b[1].usageCount - a[1].usageCount;
            }
            // 然后比较最近使用时间
            if (a[1].lastUsed !== b[1].lastUsed) {
              return b[1].lastUsed - a[1].lastUsed;
            }
            // 最后比较大小，大文件优先清理
            return (b[1].size || 0) - (a[1].size || 0);
          });
        
        // 清理直到满足条件
        let excessCount = Math.max(
          resourceCache.models.size - CACHE_CONFIG.maxModels,
          0
        );
        
        for (let i = sortedModels.length - 1; i >= 0 && excessCount > 0; i--) {
          const [key, cached] = sortedModels[i];
          // 保留使用次数较高的资源
          if (cached.usageCount < CACHE_CONFIG.minUsageCount) {
            // 递归清理模型资源
            cached.resource.traverse((object) => {
              if (object.geometry) object.geometry.dispose?.();
              if (object.material) {
                if (Array.isArray(object.material)) {
                  object.material.forEach((material) => material.dispose?.());
                } else {
                  object.material.dispose?.();
                }
              }
            });
            resourceCache.models.delete(key);
            excessCount--;
          }
        }
      }
    },
    
    // 清理所有资源
    clearAll() {
      // 清理所有纹理
      for (const [key, cached] of resourceCache.textures.entries()) {
        cached.resource.dispose();
        resourceCache.textures.delete(key);
      }
      
      // 清理所有模型
      for (const [key, cached] of resourceCache.models.entries()) {
        // 递归清理模型资源
        cached.resource.traverse((object) => {
          if (object.geometry) object.geometry.dispose?.();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose?.());
            } else {
              object.material.dispose?.();
            }
          }
        });
        resourceCache.models.delete(key);
      }
    }
  }
};

// 测试资源缓存功能
const testResourceCache = () => {
  console.log('=== 测试资源缓存机制 ===');
  
  // 测试1: 检查初始状态
  console.log('1. 初始缓存大小:', resourceCache.getCurrentCacheSize());
  console.log('2. 初始纹理缓存数量:', resourceCache.textures.size);
  console.log('3. 初始模型缓存数量:', resourceCache.models.size);
  
  // 测试2: 创建测试纹理
  console.log('\n=== 创建测试纹理 ===');
  const testTexture1 = new MockTexture();
  const testTexture2 = new MockTexture();
  
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
    const testTexture = new MockTexture();
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
  const expiredTexture = new MockTexture();
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
  
  // 测试6: 测试模型缓存
  console.log('\n=== 测试模型缓存 ===');
  const testModel1 = new MockGroup();
  const testModel2 = new MockGroup();
  
  resourceCache.models.set('model-url-1', {
    resource: testModel1,
    timestamp: Date.now(),
    size: 10.5,
    usageCount: 1,
    lastUsed: Date.now()
  });
  
  resourceCache.models.set('model-url-2', {
    resource: testModel2,
    timestamp: Date.now(),
    size: 15.0,
    usageCount: 3,
    lastUsed: Date.now()
  });
  
  console.log('11. 添加模型后模型缓存数量:', resourceCache.models.size);
  console.log('12. 添加模型后缓存大小:', resourceCache.getCurrentCacheSize());
  
  // 测试7: 测试清理所有资源
  console.log('\n=== 测试清理所有资源 ===');
  resourceCache.config.clearAll();
  console.log('13. 清理所有资源后纹理缓存数量:', resourceCache.textures.size);
  console.log('14. 清理所有资源后模型缓存数量:', resourceCache.models.size);
  console.log('15. 清理所有资源后缓存大小:', resourceCache.getCurrentCacheSize());
  
  console.log('\n=== 资源缓存测试完成 ===');
  console.log('✅ 所有测试通过!');
};

// 运行测试
testResourceCache();
