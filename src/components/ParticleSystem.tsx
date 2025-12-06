import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import useHandTracking from '../hooks/useHandTracking';
import { ParticleModelType } from '../lib/particleModels';

// 粒子行为模式类型
type ParticleBehavior = 'default' | 'spiral' | 'explosion' | 'wave' | 'orbit' | 'chaos';

// 粒子配置类型
interface ParticleConfig {
  model: 'heart' | 'flower' | 'saturn' | 'buddha' | 'firework';
  color: string;
  particleCount: number;
  scale: number;
  spread: number;
  size: number; // 粒子大小
  animationSpeed: number; // 动画速度
  gestureSensitivity: number; // 手势灵敏度
  showTrails: boolean; // 是否显示拖尾效果
  rotationSpeed: number; // 旋转速度
  colorVariation: number; // 颜色变化幅度
  emissionRate: number; // 发射速率
  behavior: ParticleBehavior; // 粒子行为模式
}



// 缓存项类型，包含使用频率和创建时间
interface CacheItem<T> {
  item: T;
  usageCount: number;
  lastUsed: number;
  createdAt: number;
}

// 全局缓存管理器
class CacheManager<T> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private maxSize: number;
  private cleanupInterval: number;
  private itemDisposer: (item: T) => void;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 10, cleanupInterval: number = 60000, itemDisposer: (item: T) => void) {
    this.maxSize = maxSize;
    this.cleanupInterval = cleanupInterval;
    this.itemDisposer = itemDisposer;

    // 设置定期清理定时器
    this.intervalId = setInterval(() => this.cleanup(), this.cleanupInterval);
  }
  
  // 清理定时器，防止内存泄漏
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.clear();
  }

  // 获取缓存项
  get(key: string): T | undefined {
    const cacheItem = this.cache.get(key);
    if (cacheItem) {
      // 更新使用频率和最后使用时间
      cacheItem.usageCount++;
      cacheItem.lastUsed = Date.now();
      return cacheItem.item;
    }
    return undefined;
  }

  // 设置缓存项
  set(key: string, item: T): void {
    // 如果缓存已满，清理最少使用的项
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    // 添加新项
    this.cache.set(key, {
      item,
      usageCount: 1,
      lastUsed: Date.now(),
      createdAt: Date.now()
    });
  }

  // 清理最少使用的项
  private evictLeastUsed(): void {
    if (this.cache.size === 0) return;

    // 找到最少使用的项
    let leastUsedKey: string | null = null;
    let leastUsageCount = Infinity;
    let oldestLastUsed = Infinity;

    for (const [key, cacheItem] of this.cache.entries()) {
      if (cacheItem.usageCount < leastUsageCount ||
          (cacheItem.usageCount === leastUsageCount && cacheItem.lastUsed < oldestLastUsed)) {
        leastUsedKey = key;
        leastUsageCount = cacheItem.usageCount;
        oldestLastUsed = cacheItem.lastUsed;
      }
    }

    // 移除并释放最少使用的项
    if (leastUsedKey) {
      const cacheItem = this.cache.get(leastUsedKey);
      if (cacheItem) {
        this.itemDisposer(cacheItem.item);
        this.cache.delete(leastUsedKey);
      }
    }
  }

  // 手动清理缓存
  cleanup(): void {
    // 清理创建时间超过1分钟且使用频率低的项
    const now = Date.now();
    for (const [key, cacheItem] of this.cache.entries()) {
      if (now - cacheItem.createdAt > 60000 && cacheItem.usageCount < 3) {
        this.itemDisposer(cacheItem.item);
        this.cache.delete(key);
      }
    }
  }

  // 清理所有缓存
  clear(): void {
    for (const cacheItem of this.cache.values()) {
      this.itemDisposer(cacheItem.item);
    }
    this.cache.clear();
  }
}

// 几何体和材质的释放函数
const disposeGeometry = (geometry: THREE.BufferGeometry) => geometry.dispose();
const disposeMaterial = (material: THREE.Material) => material.dispose();

// 全局几何体缓存，避免重复创建，限制10个
const geometryCache = new CacheManager<THREE.BufferGeometry>(10, 60000, disposeGeometry);
const materialCache = new CacheManager<THREE.Material>(10, 60000, disposeMaterial);

// 粒子池管理
class ParticlePool {
  private pool: any[] = [];
  private maxSize: number = 1000;
  private minSize: number = 100;
  private particleFactory: (index: number) => any;
  private usageStats: {
    peakUsage: number;
    averageUsage: number;
    usageHistory: number[];
    lastAdjustment: number;
  };
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor(factory: (index: number) => any, maxSize: number = 1000, minSize: number = 100) {
    this.particleFactory = factory;
    this.maxSize = maxSize;
    this.minSize = minSize;
    
    // 初始化使用统计
    this.usageStats = {
      peakUsage: 0,
      averageUsage: 0,
      usageHistory: [],
      lastAdjustment: Date.now()
    };
    
    // 设置定期调整池大小的定时器
    this.intervalId = setInterval(() => this.adjustPoolSize(), 5000); // 每5秒调整一次
  }
  
  // 销毁粒子池，清理定时器
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.pool = [];
  }
  
  // 从池中获取粒子
  getParticle(index: number): any {
    if (this.pool.length > 0) {
      const particle = this.pool.pop()!;
      // 重置粒子属性
      this.resetParticle(particle, index);
      return particle;
    } else {
      // 创建新粒子
      return this.particleFactory(index);
    }
  }
  
  // 重置粒子属性
  private resetParticle(particle: any, index: number): void {
    // 重置位置和速度
    const speedFactor = Math.random() * 0.02 + 0.005;
    const angle = (index / 100) * Math.PI * 2; // 使用固定值避免依赖外部配置
    const radius = Math.random() * 2.5; // 使用固定值避免依赖外部配置
    
    // 重置基本属性 - 适配新的粒子数据结构
    particle.position = [0, 0, 0];
    particle.prevPosition = [0, 0, 0]; // 直接赋值，无需copy
    particle.rotation = [
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    ];
    particle.scale = Math.random() * 0.8 + 0.2;
    particle.targetScale = Math.random() * 1.5 + 0.5;
    particle.opacity = 0;
    particle.maxOpacity = Math.random() * 0.5 + 0.3;
    particle.life = 0;
    particle.speed = [0, 0, 0];
    particle.birthTime = Date.now();
    particle.index = index;
    particle.angle = angle;
    
    // 根据粒子行为重置速度 - 适配新的粒子数据结构
    const randomX = (Math.random() - 0.5) * speedFactor;
    const randomY = (Math.random() - 0.5) * speedFactor;
    const randomZ = (Math.random() - 0.5) * speedFactor;
    particle.speed = [randomX, randomY, randomZ];
    
    // 重置加速度（如果存在）
    if (particle.acceleration) {
      particle.acceleration = [
        (Math.random() - 0.5) * 0.0001,
        (Math.random() - 0.5) * 0.0001,
        (Math.random() - 0.5) * 0.0001
      ];
    }
  }
  
  // 回收粒子到池中
  recycleParticle(particle: any): void {
    // 更新使用统计
    this.updateUsageStats();
    
    if (this.pool.length < this.maxSize) {
      this.pool.push(particle);
    }
  }
  
  // 更新使用统计
  private updateUsageStats(): void {
    // 更新峰值使用量
    this.usageStats.peakUsage = Math.max(this.usageStats.peakUsage, this.pool.length);
    
    // 添加当前使用量到历史记录
    this.usageStats.usageHistory.push(this.pool.length);
    
    // 只保留最近50个记录
    if (this.usageStats.usageHistory.length > 50) {
      this.usageStats.usageHistory.shift();
    }
    
    // 计算平均使用量
    const sum = this.usageStats.usageHistory.reduce((acc, val) => acc + val, 0);
    this.usageStats.averageUsage = sum / this.usageStats.usageHistory.length;
  }
  
  // 动态调整池大小
  private adjustPoolSize(): void {
    const now = Date.now();
    // 至少间隔3秒才调整一次
    if (now - this.usageStats.lastAdjustment < 3000) return;
    
    this.usageStats.lastAdjustment = now;
    
    // 基于峰值使用量和平均使用量调整池大小
    const targetSize = Math.max(
      this.minSize,
      Math.min(
        this.maxSize,
        Math.round(this.usageStats.peakUsage * 1.2) // 峰值使用量的1.2倍作为目标大小
      )
    );
    
    if (targetSize !== this.maxSize) {
      this.maxSize = targetSize;
      // 粒子池大小调整日志已移除
      
      // 如果当前池大小超过新的maxSize，清理多余的粒子
      if (this.pool.length > this.maxSize) {
        this.pool = this.pool.slice(0, this.maxSize);
      }
    }
  }
  
  // 获取当前池状态
  getPoolStatus(): { currentSize: number; maxSize: number; peakUsage: number; averageUsage: number } {
    return {
      currentSize: this.pool.length,
      maxSize: this.maxSize,
      peakUsage: this.usageStats.peakUsage,
      averageUsage: this.usageStats.averageUsage
    };
  }
}

// 实例化粒子系统组件
const InstancedParticleSystem: React.FC<{
  config: ParticleConfig;
  gestureData?: {
    scale: number;
    spread: number;
  };
}> = ({ config, gestureData }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());
  const particlesRef = useRef<any[]>([]);
  const baseColorRef = useRef(new THREE.Color(config.color));
  const lastUpdateTimeRef = useRef(Date.now());
  const isUpdatingRef = useRef(false);
  
  // 粒子池引用
  const particlePoolRef = useRef<ParticlePool | null>(null);
  
  // 分批更新相关引用
  const batchIndexRef = useRef(0); // 当前处理的批索引
  const particlesPerBatchRef = useRef(200); // 每帧处理的粒子数量，动态调整
  const lastFpsRef = useRef(60); // 记录最近的帧率
  const fpsHistoryRef = useRef<number[]>([]); // 帧率历史记录
  
  // 动态调整批处理大小的参数
  const maxParticlesPerBatch = 300; // 最大每帧处理粒子数
  const minParticlesPerBatch = 50; // 最小每帧处理粒子数
  const targetFps = 60; // 目标帧率
  const adjustmentFactor = 0.05; // 调整因子，值越小调整越平滑
  
  // 拖尾效果相关引用
  const trailRef = useRef<{
    geometry: THREE.BufferGeometry;
    material: THREE.LineBasicMaterial;
    mesh: THREE.LineSegments;
    points: Float32Array;
    lastUpdateTime: number; // 最后更新时间，用于控制更新频率
  } | null>(null);
  
  // 获取相机对象，用于视锥体剔除
  const { camera } = useThree();
  // 视锥体引用，用于缓存视锥体信息
  const frustumRef = useRef(new THREE.Frustum());
  // 投影矩阵引用，用于缓存投影矩阵
  const projMatrixRef = useRef(new THREE.Matrix4());
  // 视图矩阵引用，用于缓存视图矩阵
  const viewMatrixRef = useRef(new THREE.Matrix4());
  // 复合矩阵引用，用于缓存复合矩阵
  const combinedMatrixRef = useRef(new THREE.Matrix4());
  
  // 初始化拖尾效果 - 优化：减少拖尾点数量，提高性能
  React.useEffect(() => {
    if (config.showTrails) {
      // 创建拖尾几何体
      const geometry = new THREE.BufferGeometry();
      // 优化：每个粒子只需要2个点（前一位置和当前位置），但减少总粒子的拖尾数量
      const points = new Float32Array(config.particleCount * 2 * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
      
      // 创建拖尾材质 - 优化：使用更高效的材质设置
      const material = new THREE.LineBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.2, // 降低透明度，减少视觉复杂度
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        linewidth: 1, // 固定线宽，减少计算
        vertexColors: false // 关闭顶点颜色，使用统一颜色
      });
      
      // 创建拖尾线段
      const mesh = new THREE.LineSegments(geometry, material);
      
      // 添加到场景
      const parent = meshRef.current?.parent;
      if (parent) {
        parent.add(mesh);
      }
      
      trailRef.current = {
        geometry,
        material,
        mesh,
        points,
        lastUpdateTime: Date.now() // 添加最后更新时间
      };
    }
    
    return () => {
      // 清理拖尾效果
      if (trailRef.current) {
        trailRef.current.geometry.dispose();
        trailRef.current.material.dispose();
        const parent = trailRef.current.mesh.parent;
        if (parent) {
          parent.remove(trailRef.current.mesh);
        }
        trailRef.current = null;
      }
    };
  }, [config.showTrails, config.particleCount, config.color]);

  // 粒子行为模式函数 - 螺旋行为
  const createSpiralParticle = (angle: number, radius: number, speedFactor: number): { position: THREE.Vector3; speed: THREE.Vector3 } => {
    // 螺旋行为：初始位置在螺旋线上
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      Math.random() * config.spread - config.spread / 2
    );
    const speed = new THREE.Vector3(
      Math.sin(angle) * speedFactor * 0.5,
      -Math.cos(angle) * speedFactor * 0.5,
      (Math.random() - 0.5) * speedFactor
    );
    return { position, speed };
  };

  // 粒子行为模式函数 - 爆炸行为
  const createExplosionParticle = (speedFactor: number): { position: THREE.Vector3; speed: THREE.Vector3 } => {
    // 爆炸行为：初始位置集中，速度向外
    const position = new THREE.Vector3(
      Math.random() * 0.5 - 0.25,
      Math.random() * 0.5 - 0.25,
      Math.random() * 0.5 - 0.25
    );
    const speed = new THREE.Vector3(
      (Math.random() - 0.5) * speedFactor * 3,
      (Math.random() - 0.5) * speedFactor * 3,
      (Math.random() - 0.5) * speedFactor * 3
    );
    return { position, speed };
  };

  // 粒子行为模式函数 - 波浪行为
  const createWaveParticle = (angle: number, radius: number, speedFactor: number): { position: THREE.Vector3; speed: THREE.Vector3 } => {
    // 波浪行为：初始位置在平面上，形成波浪
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * config.spread,
      Math.sin(angle * 3) * radius / 2,
      (Math.random() - 0.5) * config.spread
    );
    const speed = new THREE.Vector3(
      (Math.random() - 0.5) * speedFactor,
      Math.cos(angle * 3) * speedFactor * 0.5,
      (Math.random() - 0.5) * speedFactor
    );
    return { position, speed };
  };

  // 粒子行为模式函数 - 轨道行为
  const createOrbitParticle = (angle: number, radius: number, speedFactor: number): { position: THREE.Vector3; speed: THREE.Vector3 } => {
    // 轨道行为：围绕中心点旋转
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );
    const speed = new THREE.Vector3(
      Math.sin(angle) * speedFactor * 0.3,
      (Math.random() - 0.5) * speedFactor * 0.1,
      -Math.cos(angle) * speedFactor * 0.3
    );
    return { position, speed };
  };

  // 粒子行为模式函数 - 混沌行为
  const createChaosParticle = (speedFactor: number): { position: THREE.Vector3; speed: THREE.Vector3 } => {
    // 混沌行为：随机运动，无规则
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * config.spread,
      (Math.random() - 0.5) * config.spread,
      (Math.random() - 0.5) * config.spread
    );
    const speed = new THREE.Vector3(
      (Math.random() - 0.5) * speedFactor * 2,
      (Math.random() - 0.5) * speedFactor * 2,
      (Math.random() - 0.5) * speedFactor * 2
    );
    return { position, speed };
  };

  // 粒子行为模式函数 - 默认行为
  const createDefaultParticle = (speedFactor: number): { position: THREE.Vector3; speed: THREE.Vector3 } => {
    // 默认行为：随机分布
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * config.spread,
      (Math.random() - 0.5) * config.spread,
      (Math.random() - 0.5) * config.spread
    );
    const speed = new THREE.Vector3(
      (Math.random() - 0.5) * speedFactor,
      (Math.random() - 0.5) * speedFactor,
      (Math.random() - 0.5) * speedFactor
    );
    return { position, speed };
  };

  // 粒子数据结构类型定义 - 使用类型化数组存储，提高内存效率
  interface Particle {
    // 使用数字数组代替THREE.Vector3，减少内存占用
    position: [number, number, number];
    prevPosition: [number, number, number];
    // 使用数字数组代替THREE.Euler，减少内存占用
    rotation: [number, number, number];
    scale: number;
    targetScale: number;
    opacity: number;
    maxOpacity: number;
    life: number;
    // 使用数字数组代替THREE.Vector3，减少内存占用
    speed: [number, number, number];
    // 只在默认行为中使用加速度，其他行为设为null
    acceleration: [number, number, number] | null;
    // 使用数字数组代替THREE.Color，减少内存占用
    color: [number, number, number];
    colorVariation: number;
    birthTime: number;
    // 使用数字对象代替单独的对象，减少内存占用
    rotationSpeed: { x: number; y: number; z: number };
    index: number;
    angle: number;
  }
  
  // 创建单个粒子 - 使用更高效的数据结构，减少内存占用
  const createParticle = (index: number) => {
    // 随机大小，增加多样性
    const baseScale = Math.random() * 0.8 + 0.2;
    // 随机速度，使粒子运动更自然
    const speedFactor = Math.random() * 0.02 + 0.005;
    
    // 根据行为模式调整初始位置和速度
    let position: THREE.Vector3;
    let speed: THREE.Vector3;
    const angle = (index / config.particleCount) * Math.PI * 2;
    const radius = Math.random() * config.spread / 2;
    
    switch (config.behavior) {
      case 'spiral':
        ({ position, speed } = createSpiralParticle(angle, radius, speedFactor));
        break;
      case 'explosion':
        ({ position, speed } = createExplosionParticle(speedFactor));
        break;
      case 'wave':
        ({ position, speed } = createWaveParticle(angle, radius, speedFactor));
        break;
      case 'orbit':
        ({ position, speed } = createOrbitParticle(angle, radius, speedFactor));
        break;
      case 'chaos':
        ({ position, speed } = createChaosParticle(speedFactor));
        break;
      default:
        ({ position, speed } = createDefaultParticle(speedFactor));
        break;
    }
    
    // 优化：使用更高效的数据结构，减少内存占用
    const particle: Particle = {
      // 使用数字数组代替THREE.Vector3
      position: [position.x, position.y, position.z],
      prevPosition: [position.x, position.y, position.z], // 用于拖尾效果
      // 使用数字数组代替THREE.Euler
      rotation: [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      ],
      scale: baseScale,
      targetScale: Math.random() * 1.5 + 0.5,
      opacity: 0,
      maxOpacity: Math.random() * 0.5 + 0.3,
      life: 0,
      // 使用数字数组代替THREE.Vector3
      speed: [speed.x, speed.y, speed.z],
      // 只在默认行为中使用加速度，其他行为设为null
      acceleration: config.behavior === 'default' ? [
        (Math.random() - 0.5) * 0.0001,
        (Math.random() - 0.5) * 0.0001,
        (Math.random() - 0.5) * 0.0001
      ] : null,
      // 使用数字数组代替THREE.Color
      color: [
        baseColorRef.current.r + (Math.random() - 0.5) * config.colorVariation,
        baseColorRef.current.g + (Math.random() - 0.5) * config.colorVariation,
        baseColorRef.current.b + (Math.random() - 0.5) * config.colorVariation
      ],
      colorVariation: Math.random() * 0.0005 + 0.0001,
      birthTime: Date.now(),
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.02 * config.rotationSpeed,
        y: (Math.random() - 0.5) * 0.02 * config.rotationSpeed,
        z: (Math.random() - 0.5) * 0.02 * config.rotationSpeed
      },
      index,
      angle
    };
    
    return particle;
  };

  // 初始化粒子池
  useEffect(() => {
    // 初始化粒子池
    particlePoolRef.current = new ParticlePool((index: number) => createParticle(index), 1000);
    
    // 清理函数：销毁粒子池，清理定时器
    return () => {
      if (particlePoolRef.current) {
        particlePoolRef.current.destroy();
        particlePoolRef.current = null;
      }
    };
  }, [config.behavior]);

  // 初始化粒子数据 - 优化：使用粒子池，只在必要时重新生成
  useEffect(() => {
    // 更新基础颜色
    baseColorRef.current.set(config.color);
    
    // 只有粒子数量变化时才重新生成粒子数据
    if (particlesRef.current.length !== config.particleCount) {
      // 生成粒子数据，使用粒子池
      const newParticles: any[] = [];
      for (let i = 0; i < config.particleCount; i++) {
        if (particlePoolRef.current) {
          newParticles.push(particlePoolRef.current.getParticle(i));
        } else {
          newParticles.push(createParticle(i));
        }
      }
      particlesRef.current = newParticles;
    }
  }, [config.color, config.particleCount, config.spread]);

  // 获取几何体 - 简化实现，使用内置几何体
  const geometry = React.useMemo(() => {
    let geom: THREE.BufferGeometry;
    
    // 使用简单的几何体，减少性能开销
    switch (config.model) {
      case 'heart':
        geom = new THREE.SphereGeometry(0.1 * config.scale, 16, 16);
        break;
      case 'flower':
        geom = new THREE.IcosahedronGeometry(0.1 * config.scale, 1);
        break;
      case 'saturn':
        geom = new THREE.TorusGeometry(0.15 * config.scale, 0.03 * config.scale, 16, 64);
        break;
      case 'buddha':
        geom = new THREE.OctahedronGeometry(0.1 * config.scale, 1);
        break;
      case 'firework':
        geom = new THREE.TetrahedronGeometry(0.1 * config.scale, 1);
        break;
      default:
        geom = new THREE.SphereGeometry(0.1 * config.scale, 16, 16);
        break;
    }
    
    return geom;
  }, [config.model, config.scale]);

  // 使用简单的内置材质，避免自定义着色器问题
  const material = React.useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.8,
      metalness: 0.1,
      roughness: 0.9
    });
  }, [config.color]);
  
  // 移除不再使用的着色器uniforms更新hook

  // 动态调整批处理大小
  const adjustBatchSize = (currentFps: number) => {
    // 更新帧率历史
    fpsHistoryRef.current.push(currentFps);
    if (fpsHistoryRef.current.length > 10) {
      fpsHistoryRef.current.shift();
    }
    
    // 计算平均帧率
    const averageFps = fpsHistoryRef.current.reduce((sum, fps) => sum + fps, 0) / fpsHistoryRef.current.length;
    
    // 根据平均帧率调整批处理大小
    if (averageFps < targetFps * 0.8) {
      // 帧率低于目标的80%，减少每帧处理的粒子数
      particlesPerBatchRef.current = Math.max(
        minParticlesPerBatch,
        particlesPerBatchRef.current - Math.floor(particlesPerBatchRef.current * adjustmentFactor)
      );
    } else if (averageFps > targetFps * 0.95) {
      // 帧率接近目标，增加每帧处理的粒子数
      particlesPerBatchRef.current = Math.min(
        maxParticlesPerBatch,
        particlesPerBatchRef.current + Math.floor(particlesPerBatchRef.current * adjustmentFactor)
      );
    }
    
    lastFpsRef.current = averageFps;
  };
  
  // 优化的粒子更新函数
  const updateParticles = (currentFps: number) => {
    if (!meshRef.current || isUpdatingRef.current) return;
    
    // 动态调整批处理大小
    adjustBatchSize(currentFps);
    
    isUpdatingRef.current = true;
    
    try {
      // 开始性能监控
      const updateStartTime = performance.now();
      
      const currentTime = Date.now();
      const deltaTime = Math.min((currentTime - lastUpdateTimeRef.current) / 1000, 0.1); // 限制最大时间步
      lastUpdateTimeRef.current = currentTime;
      
      const overallScale = gestureData?.scale || 1;
      const spreadFactor = gestureData?.spread || 5;
      
      // 平滑的整体缩放更新
      meshRef.current.scale.lerp(new THREE.Vector3(overallScale, overallScale, overallScale), 0.15);

      // 更新视锥体信息，用于视锥体剔除
      camera.updateMatrixWorld();
      projMatrixRef.current.copy(camera.projectionMatrix);
      viewMatrixRef.current.copy(camera.matrixWorldInverse);
      combinedMatrixRef.current.multiplyMatrices(projMatrixRef.current, viewMatrixRef.current);
      frustumRef.current.setFromProjectionMatrix(combinedMatrixRef.current);

      // 更新每个实例 - 分批处理优化
      const particles = particlesRef.current;
      const particleCount = particles.length;
      let visibleCount = 0;
      
      // 辅助向量，避免重复创建
      const tempVec3 = new THREE.Vector3();
      
      // 分批处理粒子更新，每帧只处理一部分粒子
      const startIndex = batchIndexRef.current;
      const endIndex = Math.min(startIndex + particlesPerBatchRef.current, particleCount);
      
      // 只更新当前批次的粒子
      for (let i = startIndex; i < endIndex; i++) {
        const particle = particles[i];
        
        // 视锥体剔除：跳过视锥体之外的粒子 - 适配新的数据结构
        tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
        if (!frustumRef.current.containsPoint(tempVec3)) {
          continue; // 跳过视锥体之外的粒子
        }
        
        // 优化的生命周期管理 - 更平滑的出生、成长、衰减和死亡
        const totalLifetime = 7000; // 总生命周期
        const age = (currentTime - particle.birthTime) / totalLifetime;
        
        if (age < 0.1) {
          // 出生阶段：0-10% - 快速增长
          const birthProgress = age / 0.1;
          particle.life = easeOutElastic(birthProgress);
          particle.opacity = particle.life * particle.maxOpacity;
          // 出生时大小从0增长到目标大小
          particle.scale = particle.targetScale * particle.life;
        } else if (age < 0.7) {
          // 成长阶段：10-70% - 稳定增长
          const growthProgress = (age - 0.1) / 0.6;
          particle.life = 0.8 + 0.2 * easeOutCubic(growthProgress);
          // 平滑的呼吸效果
          particle.opacity = particle.maxOpacity * (0.85 + 0.15 * Math.sin(currentTime * 0.01 + i * 0.2));
          // 成长阶段大小缓慢变化
          particle.scale = particle.targetScale * (0.9 + 0.1 * Math.sin(currentTime * 0.005 + i * 0.1));
        } else if (age < 0.9) {
          // 成熟阶段：70-90% - 稳定状态
          particle.life = 1;
          // 稳定的透明度
          particle.opacity = particle.maxOpacity;
          // 成熟阶段大小稳定
          particle.scale = particle.targetScale;
        } else if (age < 1) {
          // 衰减阶段：90-100% - 快速衰减
          const decayProgress = 1 - (age - 0.9) / 0.1;
          particle.life = easeOutExpo(decayProgress);
          particle.opacity = particle.life * particle.maxOpacity;
          // 衰减阶段大小逐渐减小
          particle.scale = particle.targetScale * particle.life;
        } else {
          // 死亡阶段：100%+ - 准备重生
          const rebirthDelay = Math.random() * 2000;
          if (Date.now() - particle.birthTime > totalLifetime + rebirthDelay) {
            if (particlePoolRef.current) {
              // 回收旧粒子到池中
              particlePoolRef.current.recycleParticle(particle);
              // 从池中获取新粒子
              particles[i] = particlePoolRef.current.getParticle(i);
            } else {
              // 粒子池未初始化时的回退方案
              particles[i] = createParticle(i);
            }
          }
          continue;
        }
        
        // 位置和速度更新 - 根据行为模式应用不同规则
        const speedFactor = 0.02;
        tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
        const radius = tempVec3.length();
        
        switch (config.behavior) {
          case 'spiral':
            // 螺旋行为：螺旋式运动
            particle.position[0] += Math.sin(particle.angle) * speedFactor * deltaTime * 60 * 0.5;
            particle.position[1] += -Math.cos(particle.angle) * speedFactor * deltaTime * 60 * 0.5;
            particle.position[2] += (Math.random() - 0.5) * speedFactor * deltaTime * 60 * 0.2;
            // 更新角度
            particle.angle += deltaTime * 60 * 0.01 * config.animationSpeed;
            break;
            
          case 'explosion':
            // 爆炸行为：持续向外运动，逐渐减速
            particle.speed[0] *= 0.985;
            particle.speed[1] *= 0.985;
            particle.speed[2] *= 0.985;
            // 更新位置
            particle.position[0] += particle.speed[0] * deltaTime * 60;
            particle.position[1] += particle.speed[1] * deltaTime * 60;
            particle.position[2] += particle.speed[2] * deltaTime * 60;
            break;
            
          case 'wave':
            // 波浪行为：上下波动
            const waveOffset = Math.sin(particle.angle * 3 + currentTime * 0.01 * config.animationSpeed) * 0.5;
            particle.position[1] = waveOffset * radius;
            // 更新位置
            particle.position[0] += particle.speed[0] * deltaTime * 60;
            particle.position[2] += particle.speed[2] * deltaTime * 60;
            
            // 向中心的弱吸引力
            tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
            const attractionX = (-tempVec3.x) * 0.0001 * deltaTime * 60;
            const attractionY = (-tempVec3.y) * 0.0001 * deltaTime * 60;
            const attractionZ = (-tempVec3.z) * 0.0001 * deltaTime * 60;
            particle.position[0] += attractionX;
            particle.position[1] += attractionY;
            particle.position[2] += attractionZ;
            break;
            
          case 'orbit':
            // 轨道行为：围绕中心旋转
            particle.angle += deltaTime * 60 * 0.005 * config.animationSpeed;
            const orbitRadius = radius;
            particle.position[0] = Math.cos(particle.angle) * orbitRadius;
            particle.position[2] = Math.sin(particle.angle) * orbitRadius;
            // 轻微的上下浮动
            particle.position[1] = Math.sin(currentTime * 0.005 + particle.index) * 0.5;
            break;
            
          case 'chaos':
            // 混沌行为：随机运动，无规则
            // 随机改变速度方向和大小
            particle.speed[0] += (Math.random() - 0.5) * 0.001 * deltaTime * 60 * config.animationSpeed;
            particle.speed[1] += (Math.random() - 0.5) * 0.001 * deltaTime * 60 * config.animationSpeed;
            particle.speed[2] += (Math.random() - 0.5) * 0.001 * deltaTime * 60 * config.animationSpeed;
            
            // 限制最大速度
            tempVec3.set(particle.speed[0], particle.speed[1], particle.speed[2]);
            const maxSpeed = 0.1 * config.animationSpeed;
            if (tempVec3.length() > maxSpeed) {
              tempVec3.normalize().multiplyScalar(maxSpeed);
              particle.speed[0] = tempVec3.x;
              particle.speed[1] = tempVec3.y;
              particle.speed[2] = tempVec3.z;
            }
            
            // 更新位置
            particle.position[0] += particle.speed[0] * deltaTime * 60;
            particle.position[1] += particle.speed[1] * deltaTime * 60;
            particle.position[2] += particle.speed[2] * deltaTime * 60;
            
            // 弱中心吸引力，防止粒子完全飞散
            tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
            const chaosAttractionX = (-tempVec3.x) * 0.0001 * deltaTime * 60;
            const chaosAttractionY = (-tempVec3.y) * 0.0001 * deltaTime * 60;
            const chaosAttractionZ = (-tempVec3.z) * 0.0001 * deltaTime * 60;
            particle.position[0] += chaosAttractionX;
            particle.position[1] += chaosAttractionY;
            particle.position[2] += chaosAttractionZ;
            break;
            
          default:
            // 默认行为：自然漂移
            if (particle.acceleration) {
              // 更新速度
              particle.speed[0] += particle.acceleration[0] * deltaTime * 60;
              particle.speed[1] += particle.acceleration[1] * deltaTime * 60;
              particle.speed[2] += particle.acceleration[2] * deltaTime * 60;
            }
            // 阻尼效果
            particle.speed[0] *= 0.995;
            particle.speed[1] *= 0.995;
            particle.speed[2] *= 0.995;
            
            // 更新位置
            particle.position[0] += particle.speed[0] * deltaTime * 60;
            particle.position[1] += particle.speed[1] * deltaTime * 60;
            particle.position[2] += particle.speed[2] * deltaTime * 60;
            
            // 向中心的吸引力，使粒子更集中
            tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
            const centerAttractionX = (-tempVec3.x) * 0.0003 * deltaTime * 60;
            const centerAttractionY = (-tempVec3.y) * 0.0003 * deltaTime * 60;
            const centerAttractionZ = (-tempVec3.z) * 0.0003 * deltaTime * 60;
            particle.position[0] += centerAttractionX;
            particle.position[1] += centerAttractionY;
            particle.position[2] += centerAttractionZ;
            break;
        }
        
        // 保存之前的位置用于拖尾效果 - 适配新的数据结构
        particle.prevPosition[0] = particle.position[0];
        particle.prevPosition[1] = particle.position[1];
        particle.prevPosition[2] = particle.position[2];
        
        // 旋转动画 - 适配rotationSpeed为普通对象的变化
        particle.rotation[0] += particle.rotationSpeed.x * deltaTime * 60 * config.rotationSpeed;
        particle.rotation[1] += particle.rotationSpeed.y * deltaTime * 60 * config.rotationSpeed;
        particle.rotation[2] += particle.rotationSpeed.z * deltaTime * 60 * config.rotationSpeed;
        
        // 缩放动画
        const scaleVariation = Math.sin(currentTime * 0.01 + i * 0.4) * 0.4;
        const baseScale = particle.targetScale * (0.7 + 0.3 * particle.life);
        particle.scale = baseScale + scaleVariation;
        
        // 边界检查
        tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
        if (tempVec3.length() > spreadFactor * 2) {
          // 计算目标位置
          tempVec3.normalize().multiplyScalar(spreadFactor * 1.8);
          // 平滑过渡
          particle.position[0] = particle.position[0] * 0.95 + tempVec3.x * 0.05;
          particle.position[1] = particle.position[1] * 0.95 + tempVec3.y * 0.05;
          particle.position[2] = particle.position[2] * 0.95 + tempVec3.z * 0.05;
          // 速度反转
          particle.speed[0] *= -0.3;
          particle.speed[1] *= -0.3;
          particle.speed[2] *= -0.3;
        }
        
        // 可见性检查：只更新在视锥体内部或附近的粒子
        tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
        if (tempVec3.length() < spreadFactor * 3) {
          // 更新实例矩阵 - 适配新的数据结构
          dummyRef.current.position.set(particle.position[0], particle.position[1], particle.position[2]);
          dummyRef.current.rotation.set(particle.rotation[0], particle.rotation[1], particle.rotation[2]);
          dummyRef.current.scale.setScalar(particle.scale);
          dummyRef.current.updateMatrix();
          meshRef.current.setMatrixAt(i, dummyRef.current.matrix);
          visibleCount++;
        }
      }
      
      // 更新拖尾效果 - 优化：降低更新频率，只更新部分粒子的拖尾
      if (config.showTrails && trailRef.current && currentTime - trailRef.current.lastUpdateTime > 50) { // 每50ms更新一次拖尾
        const { points, geometry } = trailRef.current;
        let trailsUpdated = false;
        
        // 优化：只更新当前批次粒子的拖尾，减少计算量
        for (let i = startIndex; i < endIndex; i += 2) { // 只更新奇数索引的粒子拖尾，减少一半计算量
          const particle = particles[i];
          // 只更新可见粒子的拖尾（距离中心较近的粒子）
          tempVec3.set(particle.position[0], particle.position[1], particle.position[2]);
          if (tempVec3.length() < spreadFactor * 3) {
            const offset = i * 2 * 3;
            
            // 设置前一位置
            points[offset] = particle.prevPosition[0];
            points[offset + 1] = particle.prevPosition[1];
            points[offset + 2] = particle.prevPosition[2];
            
            // 设置当前位置
            points[offset + 3] = particle.position[0];
            points[offset + 4] = particle.position[1];
            points[offset + 5] = particle.position[2];
            
            trailsUpdated = true;
          }
        }
        
        // 只在有更新时才标记需要更新
        if (trailsUpdated) {
          geometry.attributes.position.needsUpdate = true;
          trailRef.current.lastUpdateTime = currentTime; // 更新最后更新时间
        }
      }
      
      // 更新批次索引，循环处理所有粒子
      batchIndexRef.current = endIndex >= particleCount ? 0 : endIndex;
      
      // 只有当有可见粒子更新时，才更新实例矩阵
      if (visibleCount > 0) {
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
      
      // 结束性能监控，记录粒子更新时间
      const updateEndTime = performance.now();
      const updateDuration = updateEndTime - updateStartTime;
    } catch (error) {
      console.error('Error updating particles:', error);
    } finally {
      // 确保标志被重置为false，无论是否发生错误
      isUpdatingRef.current = false;
    }
  };

  // 根据手势数据更新粒子 - 修复帧率计算和性能监控
  useFrame((state) => {
    // 计算当前帧率
    const now = performance.now();
    const deltaTime = now - lastUpdateTimeRef.current;
    const fps = deltaTime > 0 ? Math.round(1000 / deltaTime) : 60;
    
    // 调用粒子更新函数，传递当前帧率
    updateParticles(fps);
    
    // 更新最后更新时间
    lastUpdateTimeRef.current = now;
  });

  // 缓动函数 - 缓出弹性
  const easeOutElastic = (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  };

  // 缓动函数 - 缓出指数
  const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };

  // 缓动函数 - 缓出立方
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };

  // 缓动函数 - 缓入立方
  const easeInCubic = (t: number): number => {
    return Math.pow(t, 3);
  };

  // 缓动函数 - 缓入缓出
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, config.particleCount]}
    />
  );
};

// 主粒子系统容器组件
const ParticleSystemContainer: React.FC<{
  model?: ParticleModelType;
  color?: string;
  onModelChange?: (model: ParticleModelType) => void;
  onColorChange?: (color: string) => void;
  onFullscreen?: () => void;
  behavior?: ParticleBehavior;
  particleCount?: number;
  particleSize?: number;
  animationSpeed?: number;
  rotationSpeed?: number;
  colorVariation?: number;
  showTrails?: boolean;
  gestureSensitivity?: number;
}> = ({ 
  model = 'heart',
  color = '#ff6b6b',
  onModelChange,
  onColorChange,
  onFullscreen,
  behavior = 'default',
  particleCount = 200,
  particleSize = 1.2,
  animationSpeed = 1.0,
  rotationSpeed = 1.0,
  colorVariation = 0.4,
  showTrails = true,
  gestureSensitivity = 1.2
}) => {
  // 平滑的手势数据，添加缓动效果
  const [smoothedGestureData, setSmoothedGestureData] = useState({ scale: 1, spread: 5 });
  // 原始手势数据
  const [rawGestureData, setRawGestureData] = useState({ scale: 1, spread: 5 });
  
  // 粒子配置状态
  const [localParticleCount, setLocalParticleCount] = useState(particleCount); // 增加默认粒子数量，提升视觉效果
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [localParticleSize, setLocalParticleSize] = useState(particleSize); // 调整默认粒子大小
  const [localAnimationSpeed, setLocalAnimationSpeed] = useState(animationSpeed);
  const [localGestureSensitivity, setLocalGestureSensitivity] = useState(gestureSensitivity); // 增加默认灵敏度
  const [localShowTrails, setLocalShowTrails] = useState(showTrails); // 拖尾效果
  const [localRotationSpeed, setLocalRotationSpeed] = useState(rotationSpeed); // 旋转速度
  const [localColorVariation, setLocalColorVariation] = useState(colorVariation); // 颜色变化幅度
  const [emissionRate, setEmissionRate] = useState(1.0); // 发射速率
  const [currentBehavior, setCurrentBehavior] = useState<ParticleBehavior>(behavior); // 粒子行为模式，使用传入的prop作为初始值
  
  // 当props变化时更新本地状态
  useEffect(() => {
    setLocalParticleCount(particleCount);
  }, [particleCount]);

  useEffect(() => {
    setLocalParticleSize(particleSize);
  }, [particleSize]);

  useEffect(() => {
    setLocalAnimationSpeed(animationSpeed);
  }, [animationSpeed]);

  useEffect(() => {
    setLocalRotationSpeed(rotationSpeed);
  }, [rotationSpeed]);

  useEffect(() => {
    setLocalColorVariation(colorVariation);
  }, [colorVariation]);

  useEffect(() => {
    setLocalShowTrails(showTrails);
  }, [showTrails]);

  useEffect(() => {
    setLocalGestureSensitivity(gestureSensitivity);
  }, [gestureSensitivity]);

  useEffect(() => {
    setCurrentBehavior(behavior);
  }, [behavior]);
  
  // 引用
  const containerRef = useRef<HTMLDivElement>(null);
  const gestureSmoothingFactor = 0.15; // 平滑因子，值越小越平滑

  // 粒子系统配置
  const particleConfig: ParticleConfig = {
    model,
    color,
    particleCount: localParticleCount,
    scale: localParticleSize,
    spread: 5,
    size: localParticleSize,
    animationSpeed: localAnimationSpeed,
    gestureSensitivity: localGestureSensitivity,
    showTrails: localShowTrails,
    rotationSpeed: localRotationSpeed,
    colorVariation: localColorVariation,
    emissionRate: emissionRate,
    behavior: currentBehavior
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* 主Canvas区域 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Canvas
          shadows
          className="w-full h-full"
          camera={{
            position: [0, 0, 10],
            fov: 75
          }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: true
          }}
        >
          {/* 环境光 */}
          <ambientLight intensity={0.5} color="#ffffff" />
          {/* 定向光 */}
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            color="#ffffff"
            castShadow
          />
          {/* 点光源 */}
          <pointLight
            position={[-10, -10, -5]}
            intensity={0.3}
            color="#ff6b6b"
          />
          {/* 粒子系统 */}
          <InstancedParticleSystem
            config={particleConfig}
            gestureData={smoothedGestureData}
          />
          {/* 相机控制 */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
          />
        </Canvas>
      </div>
    </div>
  );
};

export default ParticleSystemContainer;