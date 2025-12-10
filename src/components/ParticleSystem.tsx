import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

// 定义粒子行为类型
type ParticleBehavior = 'spiral' | 'explosion' | 'wave' | 'orbit' | 'chaos' | 'default';

// 定义粒子系统属性接口
export interface ParticleSystemProps {
  model?: 'heart' | 'flower' | 'saturn' | 'buddha' | 'firework' | 'baozi';
  color?: string;
  behavior?: ParticleBehavior;
  particleCount?: number;
  particleSize?: number;
  animationSpeed?: number;
  rotationSpeed?: number;
  colorVariation?: number;
  showTrails?: boolean;
  shapeIntensity?: number;
}

// 设备性能检测工具
const getDevicePerformance = () => {
  // 缓存性能检测结果，避免重复检测
  if ((window as any).__particleSystemDevicePerformance) {
    return (window as any).__particleSystemDevicePerformance;
  }
  
  // 检测设备性能的多种指标
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  const cpuCores = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  
  // 更精确的性能分级
  const isLowEndDevice = 
    isMobile ||
    cpuCores < 4 ||
    deviceMemory < 4 ||
    // 检测GPU性能（通过WebGL特性检测）
    (() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return true; // 不支持WebGL，认为是低性能设备
        
        // 检测GPU扩展支持
        const extensions = gl.getSupportedExtensions();
        return extensions === null || extensions.length < 20;
      } catch (e) {
        return true;
      }
    })();
  
  const isMediumEndDevice = 
    !isLowEndDevice && 
    (cpuCores < 8 || 
     deviceMemory < 8 ||
     isTablet);
  
  const isHighEndDevice = !isLowEndDevice && !isMediumEndDevice;
  
  const result = {
    isLowEndDevice,
    isMediumEndDevice,
    isHighEndDevice,
    isMobile,
    isTablet,
    hasTouch,
    performanceLevel: isLowEndDevice ? 'low' : isMediumEndDevice ? 'medium' : 'high',
    cpuCores,
    deviceMemory
  };
  
  // 缓存结果
  (window as any).__particleSystemDevicePerformance = result;
  
  return result;
};

// 粒子系统组件
const ParticleSystem: React.FC<ParticleSystemProps> = ({
  model = 'heart',
  color = '#ff6b6b',
  behavior = 'default',
  particleCount = 300,
  particleSize = 0.03,
  animationSpeed = 1.0,
  rotationSpeed = 0.5,
  colorVariation = 0.2,
  showTrails = true,
  shapeIntensity = 1.0
}) => {
  // 设备性能检测
  const devicePerformance = getDevicePerformance();
  
  // 根据设备性能动态调整粒子数量，仅在AR场景中限制粒子数量
  const optimizedParticleCount = React.useMemo(() => {
    // 检查当前上下文是否为AR场景，通过检查是否有AR相关配置
    // 对于粒子艺术页面，允许使用完整的粒子数量
    if (window.location.pathname.includes('/particle-art') || window.location.pathname.includes('/ParticleArt')) {
      // 粒子艺术页面，优化粒子数量以提高性能
      if (devicePerformance.isLowEndDevice) {
        return Math.min(particleCount, 150); // 低性能设备减少粒子数量
      } else if (devicePerformance.isMediumEndDevice) {
        return Math.min(particleCount, 300); // 中等性能设备适量粒子数量
      }
      return Math.min(particleCount, 400); // 高性能设备最多400个粒子，减少卡顿
    } else {
      // AR场景或其他场景，限制粒子数量以保证性能
      if (devicePerformance.isLowEndDevice) {
        return Math.min(particleCount, 15); // 进一步减少低性能设备的粒子数量
      } else if (devicePerformance.isMediumEndDevice) {
        return Math.min(particleCount, 30); // 减少中等性能设备的粒子数量
      }
      return Math.min(particleCount, 80); // 限制高性能设备的粒子数量上限
    }
  }, [particleCount, devicePerformance]);
  
  // 粒子生命周期参数
  const [particleLifespans, setParticleLifespans] = useState<Float32Array>(new Float32Array(optimizedParticleCount));
  const [particleAges, setParticleAges] = useState<Float32Array>(new Float32Array(optimizedParticleCount));
  const [particleSizes, setParticleSizes] = useState<Float32Array>(new Float32Array(optimizedParticleCount));
  // 粒子位置和颜色状态
  const [positions, setPositions] = useState<Float32Array>(new Float32Array(optimizedParticleCount * 3));
  const [colors, setColors] = useState<Float32Array>(new Float32Array(optimizedParticleCount * 3));
  const [angles, setAngles] = useState<Float32Array>(new Float32Array(optimizedParticleCount));
  const originalPositionsRef = useRef<Float32Array>(new Float32Array(optimizedParticleCount * 3)); // 保存原始位置
  
  // 基础颜色
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  
  // 鼠标交互相关状态
  const { camera, gl } = useThree();
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [mouse3DPosition, setMouse3DPosition] = useState(new THREE.Vector3());
  const [bloomScale, setBloomScale] = useState(1.0); // 绽放收缩缩放比例
  const particlesRef = useRef<THREE.Points>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const bloomSpeed = 0.05; // 绽放收缩速度
  const mouseVelocityRef = useRef(new THREE.Vector3()); // 鼠标速度
  const prevMouse3DPositionRef = useRef(new THREE.Vector3()); // 上一帧鼠标位置
  const particleVelocitiesRef = useRef<Float32Array>(new Float32Array(particleCount * 3)); // 粒子速度
  const animationFrameRef = useRef<number>(0); // 动画帧ID引用
  const performanceStatsRef = useRef({
    fps: 60,
    frameTime: 16.67,
    particleCount: 0,
    lastUpdate: Date.now()
  }); // 性能统计
  
  // 统一的指针位置处理函数
  const updatePointerPosition = (clientX: number, clientY: number) => {
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    mouseRef.current.x = x;
    mouseRef.current.y = y;
    
    // 将鼠标/触摸位置转换为3D空间中的点
    raycaster.current.setFromCamera(mouseRef.current, camera);
    // 创建一个平面（Z=0）用于交点计算
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    
    if (raycaster.current.ray.intersectPlane(plane, intersectPoint)) {
      setMouse3DPosition(intersectPoint);
    }
  };
  
  // 鼠标和触摸交互逻辑
  useEffect(() => {
    // 鼠标事件处理
    const handleMouseDown = (event: MouseEvent) => {
      setIsMouseDown(true);
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      updatePointerPosition(event.clientX, event.clientY);
    };
    
    const handleMouseUp = () => {
      setIsMouseDown(false);
    };
    
    // 触摸事件处理
    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      if (event.touches.length > 0) {
        setIsTouching(true);
        setIsMouseDown(true);
        updatePointerPosition(event.touches[0].clientX, event.touches[0].clientY);
      }
    };
    
    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      if (event.touches.length > 0) {
        updatePointerPosition(event.touches[0].clientX, event.touches[0].clientY);
      }
    };
    
    const handleTouchEnd = () => {
      setIsTouching(false);
      setIsMouseDown(false);
    };
    
    // 鼠标滚动事件 - 实现粒子绽放收缩效果
    const handleWheel = (event: WheelEvent) => {
      // 只在粒子艺术页面启用滚动缩放
      if (!window.location.pathname.includes('/particle-art') && !window.location.pathname.includes('/ParticleArt')) {
        return;
      }
      
      event.preventDefault();
      
      // 优化滚动速度，添加平滑效果
      const scrollDelta = event.deltaY * 0.001;
      const newBloomScale = Math.max(0.5, Math.min(2.0, bloomScale - scrollDelta));
      setBloomScale(newBloomScale);
    };
    
    // 添加事件监听器
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    // 清理事件监听器
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheel);
      
      // 清理动画帧
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [camera, gl, bloomScale]);
  
  // 生成粒子初始位置和颜色
  useEffect(() => {
    const newPositions = new Float32Array(optimizedParticleCount * 3);
    const newColors = new Float32Array(optimizedParticleCount * 3);
    const newAngles = new Float32Array(optimizedParticleCount);
    const newLifespans = new Float32Array(optimizedParticleCount);
    const newAges = new Float32Array(optimizedParticleCount);
    const newSizes = new Float32Array(optimizedParticleCount);
    
    // 初始化粒子位置和颜色
    for (let i = 0; i < optimizedParticleCount; i++) {
      const index = i * 3;
      let x = 0, y = 0, z = 0;
      
      // 根据模型设置不同的初始位置分布
      switch (model) {
        case 'heart':
          // 心形分布
          const t = (i / optimizedParticleCount) * Math.PI * 2;
          const s = Math.sin(t);
          const c = Math.cos(t);
          x = 16 * s * s * s * shapeIntensity;
          y = (13 * c - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * shapeIntensity;
          z = (Math.random() - 0.5) * 2;
          break;
          
        case 'baozi':
          // 包子形状分布（简化为椭圆体）
          const radius = 2 + Math.random() * 0.5;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          x = radius * Math.sin(phi) * Math.cos(theta) * shapeIntensity;
          y = radius * Math.sin(phi) * Math.sin(theta) * shapeIntensity * 1.2; // 包子更圆润
          z = radius * Math.cos(phi) * shapeIntensity;
          break;
          
        case 'flower':
          // 花朵形状分布
          const petalCount = 8;
          const petalIndex = i % petalCount;
          const petalAngle = (petalIndex / petalCount) * Math.PI * 2;
          const petalRadius = 2 + Math.random() * 0.5;
          x = Math.cos(petalAngle) * petalRadius * shapeIntensity;
          y = (Math.random() - 0.5) * 2 * shapeIntensity;
          z = Math.sin(petalAngle) * petalRadius * shapeIntensity;
          break;
          
        case 'firework':
          // 烟花形状分布
          const fireworkRadius = 3 + Math.random() * 1;
          const fireworkAngle = Math.random() * Math.PI * 2;
          const fireworkHeight = (Math.random() - 0.5) * 2;
          x = Math.cos(fireworkAngle) * fireworkRadius * shapeIntensity;
          y = fireworkHeight * shapeIntensity;
          z = Math.sin(fireworkAngle) * fireworkRadius * shapeIntensity;
          break;
          
        default:
          // 默认球体分布
          const r = (Math.random() - 0.5) * 5 * shapeIntensity;
          const theta2 = Math.random() * Math.PI * 2;
          const phi2 = Math.random() * Math.PI;
          x = r * Math.sin(phi2) * Math.cos(theta2);
          y = r * Math.sin(phi2) * Math.sin(theta2);
          z = r * Math.cos(phi2);
          break;
      }
      
      // 添加一些随机偏移
      newPositions[index] = x + (Math.random() - 0.5) * 0.5;
      newPositions[index + 1] = y + (Math.random() - 0.5) * 0.5;
      newPositions[index + 2] = z + (Math.random() - 0.5) * 0.5;
      
      // 添加颜色变化
      const colorVariationFactor = (Math.random() - 0.5) * colorVariation;
      newColors[index] = Math.max(0, Math.min(1, baseColor.r + colorVariationFactor));
      newColors[index + 1] = Math.max(0, Math.min(1, baseColor.g + colorVariationFactor));
      newColors[index + 2] = Math.max(0, Math.min(1, baseColor.b + colorVariationFactor));
      
      // 初始化角度
      newAngles[i] = Math.random() * Math.PI * 2;
      
      // 初始化粒子生命周期（1-5秒）
      newLifespans[i] = 1 + Math.random() * 4;
      newAges[i] = Math.random() * newLifespans[i];
      
      // 初始化粒子大小（0.8-1.2倍基础大小）
      newSizes[i] = 0.8 + Math.random() * 0.4;
    }
    
    setPositions(newPositions);
    setColors(newColors);
    setAngles(newAngles);
    setParticleLifespans(newLifespans);
    setParticleAges(newAges);
    setParticleSizes(newSizes);
    
    // 保存原始位置
    originalPositionsRef.current = newPositions.slice();
    
    // 重新初始化粒子速度数组
    particleVelocitiesRef.current = new Float32Array(optimizedParticleCount * 3);
  }, [model, color, optimizedParticleCount, shapeIntensity, colorVariation, baseColor]);
  
  // 粒子几何体
  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // 添加粒子大小属性，支持每个粒子独立大小
    const sizes = new Float32Array(optimizedParticleCount);
    for (let i = 0; i < optimizedParticleCount; i++) {
      sizes[i] = 0.8 + Math.random() * 0.4; // 0.8-1.2倍基础大小
    }
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geometry;
  }, [positions, colors, optimizedParticleCount]);
  
  // 粒子材质 - 进一步优化以减少闪烁和提高性能
  const particlesMaterial = useMemo(() => {
    // 降低所有设备的材质复杂度，减少闪烁
    const isLowPerformance = devicePerformance.isLowEndDevice || devicePerformance.isMediumEndDevice;
    
    // 优化粒子大小映射，确保粒子明显可见
    const mappedSize = window.location.pathname.includes('/particle-art') || window.location.pathname.includes('/ParticleArt') 
      ? 0.05 + (particleSize - 0.5) * (0.2 / 2.5) // 粒子艺术页面使用更大的粒子
      : 0.01 + (particleSize - 0.5) * (0.1 / 2.5); // 其他场景保持较小粒子
    
    // 性能优先的材质设置
    const material = new THREE.PointsMaterial({
      size: mappedSize,
      vertexColors: true,
      transparent: true,
      opacity: window.location.pathname.includes('/particle-art') || window.location.pathname.includes('/ParticleArt') 
        ? 0.8 // 降低不透明度以提高性能
        : 0.7, // 其他场景保持适中不透明度
      sizeAttenuation: true, // 启用大小衰减，增强3D效果
      depthTest: false, // 禁用深度测试，减少深度冲突导致的闪烁
      depthWrite: false, // 禁用深度写入，提高性能
      blending: isLowPerformance ? THREE.NormalBlending : THREE.AdditiveBlending, // 低性能设备使用普通混合，高性能设备使用加法混合
      // 优化渲染
      premultipliedAlpha: true, // 启用预乘alpha，提高渲染质量
      alphaTest: 0.2, // 提高alpha测试阈值，减少需要渲染的像素
      // 关闭所有不必要的特性
      fog: false,
      clippingPlanes: null,
      clipIntersection: false
    });
    
    return material;
  }, [particleSize, devicePerformance]);
  
  // 粒子系统引用已经在鼠标交互逻辑中声明
  
  // 添加帧率控制变量
  const frameCountRef = React.useRef(0);
  
  // 性能监控和自适应调整
  const updatePerformanceStats = (delta: number) => {
    const now = Date.now();
    const stats = performanceStatsRef.current;
    
    // 更新性能统计
    stats.frameTime = delta * 1000;
    stats.fps = Math.round(1 / delta);
    stats.particleCount = optimizedParticleCount;
    
    // 每秒更新一次性能统计
    if (now - stats.lastUpdate > 1000) {
      // 根据性能动态调整粒子数量（仅在运行时）
      if (stats.fps < 30 && stats.particleCount > 50) {
        // 性能不佳，考虑减少粒子数量（实际实现需要通过状态管理）
        console.log(`Performance warning: Low FPS (${stats.fps}), reducing particle count from ${stats.particleCount}`);
      }
      
      stats.lastUpdate = now;
    }
  };
  
  // 粒子动画
  useFrame((state, delta) => {
    // 更新性能统计
    updatePerformanceStats(delta);
    
    // 根据场景和设备性能调整帧率限制
    frameCountRef.current++;
    const isParticleArtPage = window.location.pathname.includes('/particle-art') || window.location.pathname.includes('/ParticleArt');
    
    // 动态帧率调整：根据当前帧率自动调整跳过的帧数
    const stats = performanceStatsRef.current;
    let frameSkip = 0;
    
    if (devicePerformance.isLowEndDevice) {
      frameSkip = 2; // 低性能设备每3帧渲染1次
    } else if (isParticleArtPage) {
      frameSkip = stats.fps < 45 ? 1 : 0; // 粒子艺术页面根据FPS调整
    } else {
      frameSkip = 1; // 其他页面每2帧渲染1次
    }
    
    if (frameCountRef.current % (frameSkip + 1) !== 0) return;
    
    if (!particlesRef.current) return;
    
    const particleSystem = particlesRef.current;
    const geometry = particleSystem.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;
    const positions = positionAttribute.array as Float32Array;
    const time = state.clock.elapsedTime;
    
    // 调整旋转速度，根据性能动态调整
    const rotationFactor = stats.fps < 40 ? 0.001 : (isParticleArtPage ? 0.005 : 0.002);
    particleSystem.rotation.y += rotationSpeed * rotationFactor;
    
    // 获取相机位置，用于距离剔除
    const cameraPosition = state.camera.position;
    
    // 只在鼠标按下或触摸时更新鼠标速度，减少计算量
    const isInteracting = isMouseDown || isTouching;
    if (isInteracting) {
      mouseVelocityRef.current.subVectors(mouse3DPosition, prevMouse3DPositionRef.current).divideScalar(delta);
      prevMouse3DPositionRef.current.copy(mouse3DPosition);
    }
    
    // 预计算鼠标相关向量，避免在循环中重复创建对象
    const mouseVector = mouse3DPosition.clone();
    const mouseVelocity = mouseVelocityRef.current.clone();
    const mouseInfluenceDistance = devicePerformance.isLowEndDevice ? 2 : 3; // 低性能设备减小影响距离
    const mouseInfluenceDistanceSquared = mouseInfluenceDistance * mouseInfluenceDistance;
    
    // 更新所有粒子位置，但简化计算
    for (let i = 0; i < optimizedParticleCount; i++) {
      const index = i * 3;
      let x = positions[index];
      let y = positions[index + 1];
      let z = positions[index + 2];
      
      // 1. 距离剔除 - 只在非粒子艺术页面和低性能设备上使用
      if (!isParticleArtPage || devicePerformance.isLowEndDevice) {
        const dx = x - cameraPosition.x;
        const dy = y - cameraPosition.y;
        const dz = z - cameraPosition.z;
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        
        // 动态调整可见距离
        const maxVisibleDistanceSquared = devicePerformance.isLowEndDevice ? 81 : 121; // 9或11的平方
        if (distanceSquared > maxVisibleDistanceSquared) {
          continue;
        }
      }
      
      // 2. 粒子绽放收缩效果
      const originalIndex = i * 3;
      const baseX = originalPositionsRef.current[originalIndex];
      const baseY = originalPositionsRef.current[originalIndex + 1];
      const baseZ = originalPositionsRef.current[originalIndex + 2];
      
      // 计算缩放后的位置
      const scaledX = baseX * bloomScale;
      const scaledY = baseY * bloomScale;
      const scaledZ = baseZ * bloomScale;
      
      // 简化的平滑过渡，减少计算量
      const scaleSmoothness = devicePerformance.isLowEndDevice ? 0.2 : 0.15; // 低性能设备使用更快的过渡
      positions[index] += (scaledX - x) * scaleSmoothness;
      positions[index + 1] += (scaledY - y) * scaleSmoothness;
      positions[index + 2] += (scaledZ - z) * scaleSmoothness;
      
      // 3. 鼠标/触摸交互效果 - 优化计算
      if (isInteracting) {
        // 计算粒子到鼠标位置的距离平方（避免开方运算）
        const dx = x - mouseVector.x;
        const dy = y - mouseVector.y;
        const dz = z - mouseVector.z;
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        
        // 鼠标引力效果 - 粒子被鼠标吸引
        if (distanceSquared < mouseInfluenceDistanceSquared) {
          // 简化的引力计算，避免使用向量对象
          const distance = Math.sqrt(distanceSquared);
          const normalizedX = dx / distance;
          const normalizedY = dy / distance;
          const normalizedZ = dz / distance;
          
          const attractionForce = devicePerformance.isLowEndDevice ? 0.02 : 0.03; // 低性能设备减小引力
          const forceX = -normalizedX * attractionForce * animationSpeed * delta * 60;
          const forceY = -normalizedY * attractionForce * animationSpeed * delta * 60;
          const forceZ = -normalizedZ * attractionForce * animationSpeed * delta * 60;
          
          positions[index] += forceX;
          positions[index + 1] += forceY;
          positions[index + 2] += forceZ;
        }
      }
      
      // 4. 鼠标速度惯性效果 - 根据性能调整
      if (!devicePerformance.isLowEndDevice && mouseVelocity.length() > 0.15) { // 提高阈值，减少计算量
        const inertiaForce = 0.012 * animationSpeed; // 减小惯性力
        positions[index] += mouseVelocity.x * inertiaForce * delta * 60;
        positions[index + 1] += mouseVelocity.y * inertiaForce * delta * 60;
        positions[index + 2] += mouseVelocity.z * inertiaForce * delta * 60;
      }
      
      // 5. 粒子生命周期管理 - 优化计算频率
      if (Math.random() < (devicePerformance.isLowEndDevice ? 0.005 : 0.01)) { // 低性能设备更低频率更新
        particleAges[i] += delta;
        if (particleAges[i] >= particleLifespans[i]) {
          // 粒子生命周期结束，重置粒子
          const resetIndex = i * 3;
          const jitter = 0.1;
          positions[resetIndex] = originalPositionsRef.current[resetIndex] + (Math.random() - 0.5) * jitter;
          positions[resetIndex + 1] = originalPositionsRef.current[resetIndex + 1] + (Math.random() - 0.5) * jitter;
          positions[resetIndex + 2] = originalPositionsRef.current[resetIndex + 2] + (Math.random() - 0.5) * jitter;
          particleAges[i] = 0;
          particleLifespans[i] = 2 + Math.random() * 3; // 延长生命周期，减少重置频率
        }
      }
      
      // 6. 简化的粒子行为，减少动画复杂度
      switch (behavior) {
        case 'spiral':
          // 简化的螺旋运动
          const spiralAngle = angles[i] + time * animationSpeed * 0.04;
          positions[index] += Math.cos(spiralAngle) * 0.0015 * animationSpeed;
          positions[index + 1] += Math.sin(spiralAngle) * 0.0015 * animationSpeed;
          angles[i] = spiralAngle;
          break;
          
        case 'explosion':
          // 简化的爆炸运动
          const explosionSpeed = 0.0025 * animationSpeed;
          positions[index] += (Math.random() - 0.5) * explosionSpeed;
          positions[index + 1] += (Math.random() - 0.5) * explosionSpeed;
          positions[index + 2] += (Math.random() - 0.5) * explosionSpeed;
          break;
          
        case 'wave':
          // 简化的波浪运动
          positions[index + 1] += Math.sin(time * animationSpeed + x * 0.2) * 0.015 * animationSpeed;
          break;
          
        case 'orbit':
          // 简化的轨道运动
          const orbitAngle = angles[i] + time * animationSpeed * 0.04;
          const orbitRadius = Math.sqrt(x * x + z * z);
          positions[index] = Math.cos(orbitAngle) * orbitRadius;
          positions[index + 2] = Math.sin(orbitAngle) * orbitRadius;
          angles[i] = orbitAngle;
          break;
          
        case 'chaos':
          // 简化的混沌运动
          const chaosSpeed = 0.0025 * animationSpeed;
          positions[index] += (Math.random() - 0.5) * chaosSpeed;
          positions[index + 1] += (Math.random() - 0.5) * chaosSpeed;
          positions[index + 2] += (Math.random() - 0.5) * chaosSpeed;
          break;
          
        default:
          // 简化的默认浮动
          const floatSpeed = 0.0015 * animationSpeed;
          positions[index] += (Math.random() - 0.5) * floatSpeed;
          positions[index + 1] += (Math.random() - 0.5) * floatSpeed;
          break;
      }
    }
    
    // 衰减鼠标速度，创建平滑的惯性效果
    mouseVelocityRef.current.multiplyScalar(devicePerformance.isLowEndDevice ? 0.85 : 0.9); // 低性能设备更快衰减
    
    // 更新几何体
    positionAttribute.needsUpdate = true;
  });
  
  return (
    <points ref={particlesRef} geometry={particlesGeometry} material={particlesMaterial} />
  );
};

export default ParticleSystem;