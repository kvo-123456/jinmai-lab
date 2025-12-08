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
  // 粒子位置和颜色状态
  const [positions, setPositions] = useState<Float32Array>(new Float32Array(particleCount * 3));
  const [colors, setColors] = useState<Float32Array>(new Float32Array(particleCount * 3));
  const [angles, setAngles] = useState<Float32Array>(new Float32Array(particleCount));
  const originalPositionsRef = useRef<Float32Array>(new Float32Array(particleCount * 3)); // 保存原始位置
  
  // 基础颜色
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  
  // 鼠标交互相关状态
  const { camera, gl } = useThree();
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouse3DPosition, setMouse3DPosition] = useState(new THREE.Vector3());
  const [bloomScale, setBloomScale] = useState(1.0); // 绽放收缩缩放比例
  const particlesRef = useRef<THREE.Points>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const bloomSpeed = 0.05; // 绽放收缩速度
  const mouseVelocityRef = useRef(new THREE.Vector3()); // 鼠标速度
  const prevMouse3DPositionRef = useRef(new THREE.Vector3()); // 上一帧鼠标位置
  const particleVelocitiesRef = useRef<Float32Array>(new Float32Array(particleCount * 3)); // 粒子速度
  
  // 鼠标和滚动交互逻辑
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      setIsMouseDown(true);
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      // 计算鼠标在标准化设备坐标中的位置
      const rect = gl.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // 将鼠标位置转换为3D空间中的点
      raycaster.current.setFromCamera(mouseRef.current, camera);
      // 创建一个平面（Z=0）用于交点计算
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(plane, intersectPoint);
      
      if (intersectPoint) {
        setMouse3DPosition(intersectPoint);
      }
    };
    
    const handleMouseUp = () => {
      setIsMouseDown(false);
    };
    
    // 鼠标滚动事件 - 实现粒子绽放收缩效果
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      
      // 根据滚动方向调整绽放缩放比例
      if (event.deltaY < 0) {
        // 向上滚动 - 绽放效果
        setBloomScale(prev => Math.min(prev + bloomSpeed, 2.0)); // 最大缩放2倍
      } else {
        // 向下滚动 - 收缩效果
        setBloomScale(prev => Math.max(prev - bloomSpeed, 0.5)); // 最小缩放0.5倍
      }
    };
    
    // 添加事件监听器
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    // 清理事件监听器
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [camera, gl]);
  
  // 生成粒子初始位置和颜色
  useEffect(() => {
    const newPositions = new Float32Array(particleCount * 3);
    const newColors = new Float32Array(particleCount * 3);
    const newAngles = new Float32Array(particleCount);
    
    // 初始化粒子位置和颜色
    for (let i = 0; i < particleCount; i++) {
      const index = i * 3;
      let x = 0, y = 0, z = 0;
      
      // 根据模型设置不同的初始位置分布
      switch (model) {
        case 'heart':
          // 心形分布
          const t = (i / particleCount) * Math.PI * 2;
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
    }
    
    setPositions(newPositions);
    setColors(newColors);
    setAngles(newAngles);
    
    // 保存原始位置
    originalPositionsRef.current = newPositions.slice();
    
    // 重新初始化粒子速度数组
    particleVelocitiesRef.current = new Float32Array(particleCount * 3);
  }, [model, color, particleCount, shapeIntensity, colorVariation, baseColor]);
  
  // 粒子几何体
  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [positions, colors]);
  
  // 粒子材质
  const particlesMaterial = useMemo(() => {
    // 将UI滑块值（0.5-3.0）映射到实际粒子大小（0.01-0.15），扩大范围让粒子能设置更大
    const mappedSize = 0.01 + (particleSize - 0.5) * (0.14 / 2.5);
    return new THREE.PointsMaterial({
      size: mappedSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.9, // 提高不透明度，确保小粒子清晰可见
      sizeAttenuation: true,
      depthTest: false,
      depthWrite: false, // 进一步提高性能
      blending: THREE.AdditiveBlending
    });
  }, [particleSize]);
  
  // 粒子系统引用已经在鼠标交互逻辑中声明
  
  // 粒子动画
  useFrame((state) => {
    if (!particlesRef.current) return;
    
    const particleSystem = particlesRef.current;
    const geometry = particleSystem.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;
    const positions = positionAttribute.array as Float32Array;
    const time = state.clock.elapsedTime;
    
    // 旋转粒子系统
    particleSystem.rotation.y += rotationSpeed * 0.01;
    
    // 更新粒子位置
    for (let i = 0; i < particleCount; i++) {
      const index = i * 3;
      let x = positions[index];
      let y = positions[index + 1];
      let z = positions[index + 2];
      
      // 1. 粒子绽放收缩效果
      // 使用保存的原始位置进行缩放
      const originalIndex = i * 3;
      const baseX = originalPositionsRef.current[originalIndex];
      const baseY = originalPositionsRef.current[originalIndex + 1];
      const baseZ = originalPositionsRef.current[originalIndex + 2];
      
      // 计算缩放后的位置（以原点为中心缩放原始位置）
      const scaledX = baseX * bloomScale;
      const scaledY = baseY * bloomScale;
      const scaledZ = baseZ * bloomScale;
      
      // 平滑过渡到缩放位置
      const scaleSmoothness = 0.1;
      positions[index] += (scaledX - x) * scaleSmoothness;
      positions[index + 1] += (scaledY - y) * scaleSmoothness;
      positions[index + 2] += (scaledZ - z) * scaleSmoothness;
      
      // 更新当前位置用于后续计算
      x = positions[index];
      y = positions[index + 1];
      z = positions[index + 2];
      
      // 2. 优化的鼠标点击拖动交互 - 添加惯性和物理效果
      if (isMouseDown) {
        // 计算粒子到鼠标3D位置的距离
        const dx = mouse3DPosition.x - x;
        const dy = mouse3DPosition.y - y;
        const dz = mouse3DPosition.z - z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // 设置影响范围
        const influenceRadius = 4.0;
        if (distance < influenceRadius) {
          // 计算影响强度，距离越近影响越大
          const influence = Math.pow(1.0 - (distance / influenceRadius), 2);
          
          // 计算鼠标速度
          const mouseVelocity = mouse3DPosition.clone().sub(prevMouse3DPositionRef.current);
          
          // 应用吸引力和鼠标惯性
          const attractionForce = 0.8 * influence * animationSpeed;
          const mouseInfluence = 0.3 * influence;
          
          // 计算合力
          const forceX = dx * attractionForce * 0.05 + mouseVelocity.x * mouseInfluence;
          const forceY = dy * attractionForce * 0.05 + mouseVelocity.y * mouseInfluence;
          const forceZ = dz * attractionForce * 0.05 + mouseVelocity.z * mouseInfluence;
          
          // 更新粒子速度
          const velIndex = i * 3;
          particleVelocitiesRef.current[velIndex] += forceX;
          particleVelocitiesRef.current[velIndex + 1] += forceY;
          particleVelocitiesRef.current[velIndex + 2] += forceZ;
          
          // 应用速度到粒子位置
          positions[index] += particleVelocitiesRef.current[velIndex];
          positions[index + 1] += particleVelocitiesRef.current[velIndex + 1];
          positions[index + 2] += particleVelocitiesRef.current[velIndex + 2];
          
          // 速度衰减
          const damping = 0.95;
          particleVelocitiesRef.current[velIndex] *= damping;
          particleVelocitiesRef.current[velIndex + 1] *= damping;
          particleVelocitiesRef.current[velIndex + 2] *= damping;
        }
      } else {
        // 鼠标释放后，粒子继续运动并逐渐减速
        const velIndex = i * 3;
        if (particleVelocitiesRef.current[velIndex] !== 0 || 
            particleVelocitiesRef.current[velIndex + 1] !== 0 || 
            particleVelocitiesRef.current[velIndex + 2] !== 0) {
          
          // 应用剩余速度
          positions[index] += particleVelocitiesRef.current[velIndex];
          positions[index + 1] += particleVelocitiesRef.current[velIndex + 1];
          positions[index + 2] += particleVelocitiesRef.current[velIndex + 2];
          
          // 更快的衰减
          const damping = 0.9;
          particleVelocitiesRef.current[velIndex] *= damping;
          particleVelocitiesRef.current[velIndex + 1] *= damping;
          particleVelocitiesRef.current[velIndex + 2] *= damping;
          
          // 当速度很小时，重置为0
          const minVelocity = 0.001;
          if (Math.abs(particleVelocitiesRef.current[velIndex]) < minVelocity) {
            particleVelocitiesRef.current[velIndex] = 0;
          }
          if (Math.abs(particleVelocitiesRef.current[velIndex + 1]) < minVelocity) {
            particleVelocitiesRef.current[velIndex + 1] = 0;
          }
          if (Math.abs(particleVelocitiesRef.current[velIndex + 2]) < minVelocity) {
            particleVelocitiesRef.current[velIndex + 2] = 0;
          }
        }
      }
      
      // 根据行为模式更新粒子位置
      switch (behavior) {
        case 'spiral':
          // 螺旋运动
          const spiralAngle = angles[i] + time * animationSpeed * 0.5;
          positions[index] = x + Math.cos(spiralAngle) * 0.01 * animationSpeed;
          positions[index + 1] = y + Math.sin(spiralAngle) * 0.01 * animationSpeed;
          positions[index + 2] = z + time * 0.01 * animationSpeed;
          angles[i] = spiralAngle;
          break;
          
        case 'explosion':
          // 爆炸运动
          const explosionSpeed = 0.02 * animationSpeed;
          positions[index] += (Math.random() - 0.5) * explosionSpeed;
          positions[index + 1] += (Math.random() - 0.5) * explosionSpeed;
          positions[index + 2] += (Math.random() - 0.5) * explosionSpeed;
          break;
          
        case 'wave':
          // 波浪运动
          positions[index + 1] = y + Math.sin(time * animationSpeed + x * 0.5) * 0.1 * animationSpeed;
          break;
          
        case 'orbit':
          // 轨道运动
          const orbitAngle = angles[i] + time * animationSpeed * 0.5;
          const orbitRadius = Math.sqrt(x * x + z * z);
          positions[index] = Math.cos(orbitAngle) * orbitRadius;
          positions[index + 2] = Math.sin(orbitAngle) * orbitRadius;
          angles[i] = orbitAngle;
          break;
          
        case 'chaos':
          // 混沌运动
          positions[index] += (Math.random() - 0.5) * 0.02 * animationSpeed;
          positions[index + 1] += (Math.random() - 0.5) * 0.02 * animationSpeed;
          positions[index + 2] += (Math.random() - 0.5) * 0.02 * animationSpeed;
          break;
          
        default:
          // 默认轻微浮动
          positions[index] += (Math.random() - 0.5) * 0.01 * animationSpeed;
          positions[index + 1] += (Math.random() - 0.5) * 0.01 * animationSpeed;
          positions[index + 2] += (Math.random() - 0.5) * 0.01 * animationSpeed;
          break;
      }
    }
    
    // 更新几何体
    positionAttribute.needsUpdate = true;
    
    // 更新上一帧鼠标位置
    prevMouse3DPositionRef.current.copy(mouse3DPosition);
  });
  
  return (
    <points ref={particlesRef} geometry={particlesGeometry} material={particlesMaterial} />
  );
};

export default ParticleSystem;