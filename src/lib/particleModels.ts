import * as THREE from 'three';

// 粒子模型类型
export type ParticleModelType = 'heart' | 'flower' | 'saturn' | 'buddha' | 'firework' | 'baozi';

// 粒子模型配置
export interface ParticleModelConfig {
  size: number;
  detail?: number;
  color?: THREE.Color;
}

// 粒子模型生成器类
export class ParticleModelGenerator {
  // 生成爱心形状
  static generateHeart(config: ParticleModelConfig): THREE.BufferGeometry {
    const { size } = config;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const segments = 32;

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      
      // 爱心数学公式
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      
      vertices.push(x * size * 0.05, y * size * 0.05, 0);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }

  // 生成花朵形状
  static generateFlower(config: ParticleModelConfig): THREE.BufferGeometry {
    const { size, detail = 2 } = config;
    const flowerGeometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    
    // 创建多个花瓣
    const petals = 8;
    const radius = size * 0.5;
    
    for (let p = 0; p < petals; p++) {
      const angle = (p / petals) * Math.PI * 2;
      const petalGeometry = new THREE.IcosahedronGeometry(radius, detail);
      
      // 缩放和旋转花瓣
      const matrix = new THREE.Matrix4();
      matrix.makeRotationY(angle);
      matrix.scale(new THREE.Vector3(1, 1.5, 0.5));
      
      // 应用变换并合并顶点
      const petalVertices = petalGeometry.attributes.position.array;
      for (let i = 0; i < petalVertices.length; i += 3) {
        const vertex = new THREE.Vector3(
          petalVertices[i],
          petalVertices[i + 1],
          petalVertices[i + 2]
        );
        vertex.applyMatrix4(matrix);
        vertices.push(vertex.x, vertex.y, vertex.z);
      }
    }
    
    flowerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    flowerGeometry.computeVertexNormals();
    return flowerGeometry;
  }

  // 生成土星形状（球体+光环）
  static generateSaturn(config: ParticleModelConfig): THREE.Group {
    const { size } = config;
    const saturnGroup = new THREE.Group();
    
    // 土星主体
    const sphereGeometry = new THREE.SphereGeometry(size * 0.6, 32, 32);
    const sphere = new THREE.Mesh(sphereGeometry);
    saturnGroup.add(sphere);
    
    // 土星环
    const ringGeometry = new THREE.TorusGeometry(size * 1.2, size * 0.25, 16, 100);
    const ring = new THREE.Mesh(ringGeometry);
    ring.rotation.x = Math.PI / 2;
    saturnGroup.add(ring);
    
    return saturnGroup;
  }

  // 生成佛像形状（简化）
  static generateBuddha(config: ParticleModelConfig): THREE.BufferGeometry {
    const { size } = config;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    
    // 简化的佛像轮廓 - 上半身坐像
    const segments = 16;
    const height = size * 1.5;
    const width = size * 1.0;
    
    // 身体轮廓
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI;
      const x = Math.cos(t) * width * 0.5;
      const y = (Math.sin(t) - 1) * height * 0.5;
      
      vertices.push(x, y, 0);
      vertices.push(x, y, width * 0.3);
    }
    
    // 头部
    const headRadius = size * 0.3;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = Math.cos(t) * headRadius;
      const z = Math.sin(t) * headRadius;
      
      vertices.push(x, height * 0.3, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }

  // 生成烟花形状
  static generateFirework(config: ParticleModelConfig): THREE.BufferGeometry {
    const { size } = config;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    
    // 爆炸式粒子效果
    const particles = 128;
    
    for (let i = 0; i < particles; i++) {
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI;
      const distance = Math.random() * size;
      
      // 球坐标系转笛卡尔坐标系
      const x = Math.sin(angle2) * Math.cos(angle1) * distance;
      const y = Math.sin(angle2) * Math.sin(angle1) * distance;
      const z = Math.cos(angle2) * distance;
      
      vertices.push(0, 0, 0); // 中心点
      vertices.push(x, y, z); // 粒子点
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }
  
  // 生成包子形状（优化版）
  static generateBaozi(config: ParticleModelConfig): THREE.BufferGeometry {
    const { size } = config;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    
    const segments = 48; // 增加段数，使形状更平滑
    const radius = size * 0.5;
    const height = size * 0.75; // 调整高度，使包子更圆润
    
    // 包子底部（圆形，更平滑）
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = Math.cos(t) * radius;
      const y = -height / 2;
      const z = Math.sin(t) * radius;
      vertices.push(x, y, z);
    }
    
    // 包子顶部（更圆润的曲线，模拟包子褶皱）
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      // 更自然的包子顶部曲线
      const topRadius = radius * (0.7 + 0.15 * Math.sin(t * 3)); // 添加细微褶皱
      const x = Math.cos(t) * topRadius;
      // 圆润的顶部轮廓
      const y = Math.pow(Math.sin(t * Math.PI), 3) * height / 3 + height / 4;
      const z = Math.sin(t) * topRadius;
      vertices.push(x, y, z);
    }
    
    // 包子侧面轮廓（更平滑的过渡）
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      // 底部边缘
      const x1 = Math.cos(t) * radius;
      const y1 = -height / 2;
      const z1 = Math.sin(t) * radius;
      // 顶部边缘
      const topRadius = radius * (0.7 + 0.15 * Math.sin(t * 3));
      const x2 = Math.cos(t) * topRadius;
      const y2 = Math.pow(Math.sin(t * Math.PI), 3) * height / 3 + height / 4;
      const z2 = Math.sin(t) * topRadius;
      
      vertices.push(x1, y1, z1);
      vertices.push(x2, y2, z2);
    }
    
    // 包子褶皱细节（增加表面细节）
    for (let i = 0; i <= segments; i += 2) {
      const t = (i / segments) * Math.PI * 2;
      const x = Math.cos(t) * radius * 0.85;
      const y = Math.cos(t * 2) * height / 8;
      const z = Math.sin(t) * radius * 0.85;
      vertices.push(x, y, z);
      
      const innerT = ((i + 0.5) / segments) * Math.PI * 2;
      const innerX = Math.cos(innerT) * radius * 0.8;
      const innerY = Math.cos(innerT * 2) * height / 8 - height / 16;
      const innerZ = Math.sin(innerT) * radius * 0.8;
      vertices.push(innerX, innerY, innerZ);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  // 根据类型获取模型
  static getModel(
    type: ParticleModelType,
    config: ParticleModelConfig
  ): THREE.BufferGeometry | THREE.Group {
    switch (type) {
      case 'heart':
        return this.generateHeart(config);
      case 'flower':
        return this.generateFlower(config);
      case 'saturn':
        return this.generateSaturn(config);
      case 'buddha':
        return this.generateBuddha(config);
      case 'firework':
        return this.generateFirework(config);
      case 'baozi':
        return this.generateBaozi(config);
      default:
        return new THREE.SphereGeometry(config.size, 16, 16);
    }
  }

  // 获取模型的默认材质（优化版）
  static getDefaultMaterial(color: string | THREE.Color): THREE.Material {
    const colorObj = typeof color === 'string' ? new THREE.Color(color) : color;
    
    // 为包子模型使用特殊的材质效果，增强真实感
    return new THREE.MeshStandardMaterial({
      color: colorObj,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.2,
      emissive: colorObj.multiplyScalar(0.2),
      emissiveIntensity: 0.5
    });
  }

  // 获取线框材质（优化版）
  static getWireframeMaterial(color: string | THREE.Color): THREE.Material {
    const colorObj = typeof color === 'string' ? new THREE.Color(color) : color;
    
    return new THREE.MeshBasicMaterial({
      color: colorObj,
      wireframe: true,
      transparent: true,
      opacity: 0.6
      // linewidth属性已被移除，使用MeshBasicMaterial的wireframeLinewidth替代或直接使用默认值
    });
  }
  
  // 获取包子模型专用材质，增强真实感
  static getBaoziMaterial(color: string | THREE.Color): THREE.Material {
    const colorObj = typeof color === 'string' ? new THREE.Color(color) : color;
    
    return new THREE.MeshStandardMaterial({
      color: colorObj,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      roughness: 0.6, // 调整粗糙度，控制表面光滑程度
      metalness: 0.2, // 调整金属度，控制反射强度
      emissive: colorObj.multiplyScalar(0.3),
      emissiveIntensity: 0.7
      // specular和shininess属性已被移除，使用roughness和metalness替代
    });
  }
}

// 粒子模型缓存，用于优化性能
const modelCache = new Map<string, THREE.BufferGeometry | THREE.Group>();

// 获取缓存的模型
export const getCachedModel = (
  type: ParticleModelType,
  config: ParticleModelConfig
): THREE.BufferGeometry | THREE.Group => {
  const cacheKey = `${type}-${config.size}-${config.detail || 0}-${config.color?.getHexString() || 'default'}`;
  
  if (!modelCache.has(cacheKey)) {
    const model = ParticleModelGenerator.getModel(type, config);
    modelCache.set(cacheKey, model);
  }
  
  return modelCache.get(cacheKey)!;
};

// 清空模型缓存
export const clearModelCache = () => {
  modelCache.clear();
};

// 预加载常用模型
export const preloadModels = (types: ParticleModelType[] = ['heart', 'flower', 'saturn', 'buddha', 'firework', 'baozi']) => {
  const sizes = [0.1, 0.5, 1.0];
  
  types.forEach(type => {
    sizes.forEach(size => {
      getCachedModel(type, { size });
    });
  });
};