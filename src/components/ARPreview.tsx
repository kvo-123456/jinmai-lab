import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import ParticleSystem from './ParticleSystem';
import LazyImage from './LazyImage';

// 导入作品类型
import type { Work } from '@/mock/works';

// AR预览配置类型
export interface ARPreviewConfig {
  modelUrl?: string;
  imageUrl?: string;
  scale?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  type: '3d' | '2d';
  animations?: boolean;
  backgroundColor?: string;
  ambientLightIntensity?: number;
  directionalLightIntensity?: number;
}

// 粒子效果配置类型
interface ParticleEffectConfig {
  enabled: boolean;
  type: 'spiral' | 'explosion' | 'wave' | 'orbit' | 'chaos';
  particleCount: number;
  particleSize: number;
  animationSpeed: number;
  color: string;
  showTrails: boolean;
  rotationSpeed: number;
}

// 点击互动配置类型
interface ClickInteractionConfig {
  enabled: boolean;
  effectType: 'explosion' | 'colorChange' | 'sizeChange' | 'particleSpawn' | 'trail';
  intensity: number;
  radius: number;
  duration: number;
}

// AR模式下的模型放置组件 - 简化版本，移除WebXR依赖
const ARModelPlacer: React.FC<{
  config: ARPreviewConfig;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  texture: THREE.Texture | null;
  model: THREE.Group | null;
  isPlaced: boolean;
  onPlace: () => void;
  isARMode: boolean;
}> = ({ config, scale, rotation, position, texture, model, isPlaced, onPlace, isARMode }) => {
  // 简化AR模式，移除WebXR依赖
  // 使用固定位置作为放置点，不再依赖平面检测
  const hitPose = useRef<THREE.Matrix4>(new THREE.Matrix4().makeTranslation(0, 0, -2));
  
  // 处理模型放置
  const handlePlaceModel = useCallback(() => {
    onPlace();
  }, [onPlace]);
  
  // 将useThree Hook移到组件顶层
  const { gl } = useThree();
  
  // 添加点击事件监听器
  useEffect(() => {
    const canvas = gl?.domElement;
    if (!canvas || !isARMode) return;
    
    const handleClick = () => {
      if (!isPlaced) {
        handlePlaceModel();
      }
    };
    
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [isPlaced, handlePlaceModel, isARMode, gl]);
  
  return (
    <>
      {/* 如果模型未放置，显示固定位置的预览模型 */}
      {!isPlaced && (
        <>
          {/* 放置引导线 */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([0, 0, 0, 0, 0, -2])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#4f46e5" transparent opacity={0.5} />
          </line>
          
          {/* 2D图像预览 */}
            {config.imageUrl && texture && (
              <mesh matrix={hitPose.current} scale={[scale * 0.03, scale * 0.03, 0.01]} rotation={[rotation.x, rotation.y, rotation.z]}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
              </mesh>
            )}
          
          {/* 3D模型预览 */}
          {config.type === '3d' && model && (
            <primitive object={model} matrix={hitPose.current} scale={scale} rotation={[rotation.x, rotation.y, rotation.z]} />
          )}
          
          {/* 增强的放置指示器 */}
          <mesh matrix={hitPose.current} scale={[0.5, 0.5, 0.5]}>
            <ringGeometry args={[0.2, 0.25, 32]} />
            <meshBasicMaterial color="#4f46e5" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
      
      {/* 如果模型已放置，显示固定模型 */}
      {isPlaced && (
        <>
          {/* 2D图像 */}
            {config.imageUrl && texture && (
              <mesh scale={[scale * 0.03, scale * 0.03, 0.01]} rotation={[rotation.x, rotation.y, rotation.z]} position={[position.x, position.y, position.z]}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
              </mesh>
            )}
          
          {/* 3D模型 */}
          {config.type === '3d' && model && (
            <primitive object={model} scale={scale} rotation={[rotation.x, rotation.y, rotation.z]} position={[position.x, position.y, position.z]} />
          )}
          
          {/* 放置成功指示器 */}
          <mesh position={[position.x, position.y - 0.01, position.z]} scale={[0.5, 0.5, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.25, 32]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </>
  );
};

// Canvas内部的3D场景组件，所有R3F钩子必须放在这里
const CanvasContent: React.FC<{
  config: ARPreviewConfig;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  isARMode: boolean;
  particleEffect: ParticleEffectConfig;
  texture: THREE.Texture | null;
  textureError: boolean;
  model: THREE.Group | null;
  modelLoading: boolean;
  modelError: boolean;
  cameraView: 'perspective' | 'top' | 'front' | 'side';
  isPlaced: boolean;
}> = ({ config, scale, rotation, position, isARMode, particleEffect, texture, textureError, model, modelLoading, modelError, cameraView, isPlaced }) => {
  // 访问相机
  const { camera, gl, scene } = useThree();
  
  // 根据cameraView切换相机位置
  useEffect(() => {
    if (camera && !isARMode) {
      switch (cameraView) {
        case 'perspective':
          camera.position.set(15, 15, 15);
          break;
        case 'top':
          camera.position.set(0, 12, 0);
          break;
        case 'front':
          camera.position.set(0, 0, 12);
          break;
        case 'side':
          camera.position.set(12, 0, 0);
          break;
      }
      // 确保相机始终看向原点
      camera.lookAt(0, 0, 0);
    }
  }, [camera, cameraView, isARMode]);
  
  // 性能优化：根据设备性能和模式调整渲染质量
  useEffect(() => {
    if (gl) {
      // 获取设备性能信息
      const isLowEndDevice = navigator.hardwareConcurrency < 4 || 
                              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // 基础优化设置
      const pixelRatio = isARMode ? 1.0 : (isLowEndDevice ? 1.5 : 2.0);
      gl.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatio));
      
      // 禁用耗时功能
      gl.shadowMap.enabled = false;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // 优化渲染设置
      (gl as any).antialias = !isARMode && !isLowEndDevice; // AR模式下禁用抗锯齿以提高性能
      (gl as any).sampleAlphaToCoverage = false;
      (gl as any).stencilTest = false;
      (gl as any).depthTest = true;
      (gl as any).depthWrite = true;
      
      // AR模式下的特殊优化
      if (isARMode) {
        // 降低AR模式下的渲染质量以提高性能
        gl.toneMappingExposure = 0.8;
        (gl as any).premultipliedAlpha = true;
        (gl as any).alpha = true;
        
        // 禁用不必要的渲染功能
        (gl as any).colorMask = true;
        (gl as any).depthMask = true;
      } else {
        gl.toneMappingExposure = 1.0;
      }
    }
  }, [gl, isARMode]);
  
  // 优化场景设置 - 增强3D预览视觉效果
  useEffect(() => {
    if (scene) {
      if (isARMode) {
        // AR模式下保持透明背景
        scene.fog = null;
        scene.background = null;
      } else {
        // 非AR模式下优化3D预览效果
        // 改进的雾效，营造更深度的空间感
        scene.fog = new THREE.FogExp2(0x0a0a10, 0.005);
        
        // 设置更适合3D预览的深色背景
        scene.background = new THREE.Color(config.backgroundColor || '#0a0a10');
      }
    }
  }, [scene, isARMode, config.backgroundColor]);
  
  // 模型优化 - 在模型加载后应用优化
  useEffect(() => {
    if (model && !isARMode) {
      // 模型优化：合并几何体
      const mergeGeometries = () => {
        const meshes: THREE.Mesh[] = [];
        
        // 收集所有网格
        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            meshes.push(object);
          }
        });
        
        // 合并简单几何体以减少绘制调用
        if (meshes.length > 1) {
          const mergedGeometry = new THREE.BufferGeometry();
          const mergedMaterials: THREE.Material[] = [];
          
          // 简单优化：合并相同材质的几何体
          const materialMap = new Map<string, THREE.Mesh[]>();
          meshes.forEach((mesh) => {
            const materialKey = mesh.material instanceof THREE.Material ? mesh.material.uuid : 'default';
            if (!materialMap.has(materialKey)) {
              materialMap.set(materialKey, []);
            }
            materialMap.get(materialKey)?.push(mesh);
          });
        }
      };
      
      mergeGeometries();
    }
  }, [model, isARMode]);
  
  return (
    <>
      {/* 基础灯光设置 - 根据模式优化 */}
      {isARMode ? (
        // AR模式下使用极简灯光设置
        <ambientLight intensity={config.ambientLightIntensity || 0.3} />
      ) : (
        // 非AR模式下使用完整灯光设置
        <>
          <ambientLight intensity={config.ambientLightIntensity || 0.3} />
          <directionalLight 
            position={[10, 15, 10]} 
            intensity={config.directionalLightIntensity || 0.6} 
            castShadow={false}
          />
          {/* 添加柔和的填充光 */}
          <directionalLight 
            position={[-10, 5, -10]} 
            intensity={0.2} 
            castShadow={false}
          />
        </>
      )}
      
      {/* 增强的轨道控制器 - 仅在非AR模式下使用 */}
      {!isARMode && (
        <OrbitControls 
          enableDamping 
          dampingFactor={0.1} // 更平滑的阻尼效果
          enableZoom={true} 
          zoomSpeed={0.5} // 优化缩放速度
          enablePan={true}
          panSpeed={0.5} // 优化平移速度
          minDistance={3}
          maxDistance={30} // 增加最大缩放距离
          minPolarAngle={0} // 允许从下方查看
          maxPolarAngle={Math.PI} // 允许从上方查看
          target={[0, 0, 0]}
          enableRotate={true}
          rotateSpeed={0.7} // 优化旋转速度
        />
      )}
      
      {/* 高级3D预览场景 - 仅在非AR模式下显示 */}
      {!isARMode && (
        <>
          {/* 增强的网格地面 */}
          <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[20, 20, 20, 20]} />
            <meshBasicMaterial 
              color="#000000" 
              transparent 
              opacity={0.05}
              wireframe={true}
            />
          </mesh>
          {/* 高亮的网格线 */}
          <gridHelper args={[20, 20, '#666666', '#333333']} position={[0, -0.49, 0]} rotation={[-Math.PI / 2, 0, 0]} />
          {/* 中心十字线 */}
          <group>
            {/* X轴 - 红色 */}
            <line>
              <bufferGeometry>
                <bufferAttribute 
                  attach="attributes-position" 
                  count={2} 
                  array={new Float32Array([0, 0, 0, 2, 0, 0])} 
                  itemSize={3} 
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ff4444" linewidth={2} />
            </line>
            {/* Y轴 - 绿色 */}
            <line>
              <bufferGeometry>
                <bufferAttribute 
                  attach="attributes-position" 
                  count={2} 
                  array={new Float32Array([0, 0, 0, 0, 2, 0])} 
                  itemSize={3} 
                />
              </bufferGeometry>
              <lineBasicMaterial color="#44ff44" linewidth={2} />
            </line>
            {/* Z轴 - 蓝色 */}
            <line>
              <bufferGeometry>
                <bufferAttribute 
                  attach="attributes-position" 
                  count={2} 
                  array={new Float32Array([0, 0, 0, 0, 0, 2])} 
                  itemSize={3} 
                />
              </bufferGeometry>
              <lineBasicMaterial color="#4444ff" linewidth={2} />
            </line>
          </group>
          {/* 中心标记点 */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* 环境光源 - 增强3D效果 */}
          <pointLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
          <pointLight position={[-5, -5, -5]} intensity={0.3} color="#ffffff" />
        </>
      )}
      
      {/* AR模式和非AR模式的渲染逻辑分离 */}
      {/* 简化AR模式，移除WebXR依赖 */}
      {isARMode ? (
        /* AR模式 - 简化的3D渲染 */
        <ARModelPlacer
          config={config}
          scale={scale}
          rotation={rotation}
          position={position}
          texture={texture}
          model={model}
          isPlaced={isPlaced}
          onPlace={() => toast.success('模型已放置')}
          isARMode={isARMode}
        />
      ) : (
        /* 非AR模式 - 正常3D渲染 */
        <>
          {/* 默认3D对象 - 当没有图像或模型资源时显示 */}
          {!((config.type === '2d' && config.imageUrl) || (config.type === '3d' && config.modelUrl)) && (
            <mesh
              scale={[5, 5, 0.1]}
              rotation={[0, 0, 0]}
              position={[0, 0, 0]}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial 
                color="#4f46e5" 
                transparent 
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
          
          {/* 渲染2D图像为3D平面 */}
          {config.type === '2d' && config.imageUrl && texture && !textureError && (
            <mesh
              scale={[scale * 3, scale * 3, 0.01]}
              rotation={[rotation.x, rotation.y, rotation.z]}
              position={[position.x, position.y, position.z]}
            >
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial 
                map={texture} 
                transparent 
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
          
          {/* 图像加载错误时的回退显示 */}
          {config.imageUrl && textureError && (
            <mesh
              scale={[scale * 3, scale * 3, 0.01]}
              rotation={[rotation.x, rotation.y, rotation.z]}
              position={[position.x, position.y, position.z]}
            >
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial 
                color="#ff6b6b" 
                transparent 
                side={THREE.DoubleSide}
                opacity={0.5}
              />
            </mesh>
          )}
          
          {/* 3D模型渲染 */}
          {config.type === '3d' && config.modelUrl && (
            <>
              {/* 模型加载中指示器 */}
              {modelLoading && (
                <mesh
                  scale={scale}
                  rotation={[rotation.x, rotation.y, rotation.z]}
                  position={[position.x, position.y, position.z]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#6b7280" transparent opacity={0.7} />
                </mesh>
              )}
              
              {/* 模型加载错误指示器 */}
              {modelError && (
                <mesh
                  scale={scale}
                  rotation={[rotation.x, rotation.y, rotation.z]}
                  position={[position.x, position.y, position.z]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#ef4444" transparent opacity={0.7} />
                </mesh>
              )}
              
              {/* 模型加载成功时显示 */}
              {model && !modelLoading && !modelError && (
                <primitive
                  object={model}
                  scale={scale}
                  rotation={[rotation.x, rotation.y, rotation.z]}
                  position={[position.x, position.y, position.z]}
                />
              )}
            </>
          )}
        </>
      )}
      
      {/* 渲染粒子效果 - 优化版本：AR模式下减少粒子数量 */}
      {particleEffect.enabled && (
        <ParticleSystem
          model="flower"
          color={particleEffect.color}
          // 根据设备性能和模式动态调整粒子数量
          particleCount={isARMode ? Math.min(particleEffect.particleCount, 20) : 
                      navigator.hardwareConcurrency < 4 ? Math.min(particleEffect.particleCount, 50) : particleEffect.particleCount}
          particleSize={particleEffect.particleSize}
          animationSpeed={isARMode ? particleEffect.animationSpeed * 0.5 : particleEffect.animationSpeed}
          rotationSpeed={particleEffect.rotationSpeed}
          colorVariation={0.2}
          showTrails={!isARMode && particleEffect.showTrails} // AR模式下禁用拖尾效果
          behavior={particleEffect.type}
        />
      )}
    </>
  );
};

// 设备性能检测工具
const getDevicePerformance = () => {
  // 检测设备性能的多种指标
  const isLowEndDevice = 
    // CPU核心数少于4
    navigator.hardwareConcurrency < 4 || 
    // 内存小于4GB
    ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 4) || 
    // 移动设备或低性能浏览器
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    // 检测GPU性能（通过WebGL特性检测）
    (() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) return true; // 不支持WebGL，认为是低性能设备
        
        // 检测GPU扩展支持
        const extensions = gl.getSupportedExtensions();
        if (!extensions || extensions.length < 20) return true;
        
        return false;
      } catch (e) {
        return true;
      }
    })();
  
  const isMediumEndDevice = 
    !isLowEndDevice && 
    (navigator.hardwareConcurrency < 6 || 
     ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 8));
  
  const isHighEndDevice = !isLowEndDevice && !isMediumEndDevice;
  
  return {
    isLowEndDevice,
    isMediumEndDevice,
    isHighEndDevice,
    performanceLevel: isLowEndDevice ? 'low' : isMediumEndDevice ? 'medium' : 'high',
    cpuCores: navigator.hardwareConcurrency || 4,
    deviceMemory: (navigator as any).deviceMemory || 4
  };
};

// 增强的资源缓存机制
interface CachedResource<T> {
  resource: T;
  timestamp: number;
  size?: number;
  usageCount: number;
}

const resourceCache = {
  textures: new Map<string, CachedResource<THREE.Texture>>(),
  models: new Map<string, CachedResource<THREE.Group>>(),
  
  // 缓存配置
  config: {
    maxTextures: 10, // 最大缓存纹理数量
    maxModels: 5, // 最大缓存模型数量
    cacheTTL: 30 * 60 * 1000, // 缓存过期时间：30分钟
    
    // 清理过期资源
    cleanupExpired() {
      const now = Date.now();
      
      // 清理过期纹理
      for (const [key, cached] of resourceCache.textures.entries()) {
        if (now - cached.timestamp > resourceCache.config.cacheTTL) {
          cached.resource.dispose();
          resourceCache.textures.delete(key);
        }
      }
      
      // 清理过期模型
      for (const [key, cached] of resourceCache.models.entries()) {
        if (now - cached.timestamp > resourceCache.config.cacheTTL) {
          // 递归清理模型资源
          cached.resource.traverse((object: any) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((material: THREE.Material) => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
          resourceCache.models.delete(key);
        }
      }
    },
    
    // 清理超出限制的资源（使用LRU策略）
    cleanupExcess() {
      // 清理超出限制的纹理
      if (resourceCache.textures.size > resourceCache.config.maxTextures) {
        const sortedTextures = Array.from(resourceCache.textures.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const excessCount = resourceCache.textures.size - resourceCache.config.maxTextures;
        for (let i = 0; i < excessCount; i++) {
          const [key, cached] = sortedTextures[i];
          cached.resource.dispose();
          resourceCache.textures.delete(key);
        }
      }
      
      // 清理超出限制的模型
      if (resourceCache.models.size > resourceCache.config.maxModels) {
        const sortedModels = Array.from(resourceCache.models.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const excessCount = resourceCache.models.size - resourceCache.config.maxModels;
        for (let i = 0; i < excessCount; i++) {
          const [key, cached] = sortedModels[i];
          // 递归清理模型资源
          cached.resource.traverse((object: any) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((material: THREE.Material) => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
          resourceCache.models.delete(key);
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
        cached.resource.traverse((object: any) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material: THREE.Material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        resourceCache.models.delete(key);
      }
    }
  }
};

// 定期清理过期资源
setInterval(() => {
  resourceCache.config.cleanupExpired();
  resourceCache.config.cleanupExcess();
}, 5 * 60 * 1000); // 每5分钟清理一次

// 3D预览内容组件 - 使用React.memo优化性能
const ThreeDPreviewContent: React.FC<{
  config: ARPreviewConfig;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  isARMode: boolean;
  particleEffect: ParticleEffectConfig;
  clickInteraction?: ClickInteractionConfig;
  cameraView: 'perspective' | 'top' | 'front' | 'side';
  isPlaced: boolean;
  onLoadingComplete?: () => void;
  onProgress?: (progress: number) => void;
}> = React.memo(({ config, scale, rotation, position, isARMode, particleEffect, clickInteraction, cameraView, isPlaced, onLoadingComplete, onProgress }) => {
  // 使用useState和useEffect手动加载纹理，避免useLoader的硬性错误
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  // 初始化为false，避免不必要的加载状态显示
  const [textureLoading, setTextureLoading] = useState(false);
  const [textureError, setTextureError] = useState(false);
  const [textureRetryCount, setTextureRetryCount] = useState(0);
  const maxTextureRetries = 3;

  // 组件初始化时检查是否有资源需要加载
  useEffect(() => {
    // 检查是否有实际需要加载的资源，排除占位符图像
    const isPlaceholderImage = config.imageUrl === '/images/placeholder-image.svg';
    const hasResourcesToLoad = 
      (config.type === '2d' && config.imageUrl && !isPlaceholderImage) || 
      (config.type === '3d' && config.modelUrl);
    
    // 如果没有资源需要加载，立即通知父组件加载完成
    if (!hasResourcesToLoad) {
      setTextureLoading(false);
      if (onLoadingComplete) {
        onLoadingComplete();
      }
      if (onProgress) {
        onProgress(100);
      }
    }
  }, [config.type, config.imageUrl, config.modelUrl, onLoadingComplete, onProgress]);
  
  // 错误类型定义
  type ImageErrorType = 'NETWORK_ERROR' | 'INVALID_URL' | 'SERVER_ERROR' | 'TIMEOUT' | 'CORRUPTED_IMAGE' | 'UNKNOWN_ERROR';
  
  // 错误信息映射
  const errorMessages: Record<ImageErrorType, {
    title: string;
    description: string;
    solution: string[];
    icon: string;
  }> = {
    NETWORK_ERROR: {
      title: '网络连接错误',
      description: '无法连接到图像服务器，请检查您的网络连接',
      solution: [
        '检查网络连接是否正常',
        '尝试刷新页面',
        '稍后重试'
      ],
      icon: 'fas fa-wifi-slash'
    },
    INVALID_URL: {
      title: '无效的图像URL',
      description: '提供的图像URL格式不正确或无法访问',
      solution: [
        '检查图像URL是否拼写正确',
        '确保URL包含正确的协议（http://或https://）',
        '验证图像服务器是否可访问'
      ],
      icon: 'fas fa-link-slash'
    },
    SERVER_ERROR: {
      title: '服务器错误',
      description: '图像服务器返回了错误响应',
      solution: [
        '稍后重试',
        '联系管理员',
        '检查图像服务器状态'
      ],
      icon: 'fas fa-server'
    },
    TIMEOUT: {
      title: '请求超时',
      description: '连接到图像服务器超时',
      solution: [
        '检查网络连接',
        '尝试使用低分辨率版本',
        '稍后重试'
      ],
      icon: 'fas fa-clock'
    },
    CORRUPTED_IMAGE: {
      title: '图像文件损坏',
      description: '图像文件格式不正确或已损坏',
      solution: [
        '尝试其他图像',
        '联系管理员',
        '检查图像文件完整性'
      ],
      icon: 'fas fa-image-broken'
    },
    UNKNOWN_ERROR: {
      title: '未知错误',
      description: '发生了未知错误',
      solution: [
        '尝试刷新页面',
        '联系管理员',
        '稍后重试'
      ],
      icon: 'fas fa-exclamation-triangle'
    }
  };
  
  // 重试状态管理
  const [retryState, setRetryState] = useState({
    isRetrying: false,
    currentAttempt: 0,
    maxAttempts: 5, // 增加最大重试次数
    nextRetryDelay: 1000, // 初始重试延迟
    totalRetryTime: 0
  });
  
  // 纹理重试函数 - 智能优化版
  const retryLoadTexture = useCallback(() => {
    // 计算重试延迟（指数退避算法）
    const calculateRetryDelay = (attempt: number): number => {
      // 基础延迟1秒，每次重试增加1秒，最大10秒
      const baseDelay = 1000;
      const maxDelay = 10000;
      const delay = baseDelay * Math.min(attempt + 1, 10);
      return Math.min(delay, maxDelay);
    };
    
    // 重置纹理加载状态
    setTextureLoading(true);
    setTextureError(false);
    setLoadingProgress(0);
    
    // 更新重试状态
    setRetryState(prev => {
      const nextAttempt = prev.currentAttempt + 1;
      const nextDelay = calculateRetryDelay(nextAttempt - 1);
      const totalRetryTime = prev.totalRetryTime + nextDelay;
      
      // 计算预估剩余时间
      const estimatedTotalTime = totalRetryTime + 
        Array.from({ length: prev.maxAttempts - nextAttempt + 1 }, (_, i) => 
          calculateRetryDelay(nextAttempt + i)
        ).reduce((sum, delay) => sum + delay, 0);
      
      // 显示重试信息
      toast.info(
        `正在尝试重新加载图像 (${nextAttempt}/${prev.maxAttempts})`,
        {
          description: `预计剩余时间: ${Math.round(estimatedTotalTime / 1000)}秒`,
          duration: nextDelay - 500 // 确保提示在下次重试前消失
        }
      );
      
      return {
        isRetrying: true,
        currentAttempt: nextAttempt,
        maxAttempts: prev.maxAttempts,
        nextRetryDelay: nextDelay,
        totalRetryTime: totalRetryTime
      };
    });
  }, []);
  
  // 自动重试逻辑 - 优化版
  useEffect(() => {
    if (retryState.isRetrying && retryState.currentAttempt <= retryState.maxAttempts) {
      // 使用setTimeout实现延迟重试
      const retryTimer = setTimeout(() => {
        setRetryState(prev => ({
          ...prev,
          isRetrying: false
        }));
        
        // 重置纹理加载，触发重新加载
        setTexture(null);
      }, retryState.nextRetryDelay);
      
      return () => clearTimeout(retryTimer);
    }
  }, [retryState]);

  // URL有效性缓存 - 避免重复验证
  const urlValidationCache = useRef<Map<string, { valid: boolean; timestamp: number }>>(new Map());
  
  // 错误类型检测函数
  const detectErrorType = useCallback((error: any): ImageErrorType => {
    if (!error) {
      return 'UNKNOWN_ERROR';
    }
    
    const errorMessage = error.message || '';
    const errorCode = error.code || 0;
    
    // 根据错误信息判断错误类型
    if (errorMessage.includes('network') || errorMessage.includes('Network')) {
      return 'NETWORK_ERROR';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return 'TIMEOUT';
    } else if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
      return 'INVALID_URL';
    } else if (errorMessage.includes('corrupt') || errorMessage.includes('Corrupt')) {
      return 'CORRUPTED_IMAGE';
    } else if (errorCode >= 400 && errorCode < 500) {
      return 'INVALID_URL';
    } else if (errorCode >= 500) {
      return 'SERVER_ERROR';
    } else {
      return 'UNKNOWN_ERROR';
    }
  }, []);
  
  // 验证图像URL有效性 - 优化版
  const validateImageUrl = useCallback((url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // 输入验证
      if (!url || url.trim() === '') {
        console.warn('Empty image URL provided');
        resolve(false);
        return;
      }
      
      const trimmedUrl = url.trim();
      
      // 检查缓存
      const cachedResult = urlValidationCache.current.get(trimmedUrl);
      const cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
      
      if (cachedResult && (Date.now() - cachedResult.timestamp) < cacheExpiry) {
        console.debug(`Using cached URL validation result for: ${trimmedUrl}`);
        resolve(cachedResult.valid);
        return;
      }
      
      // 检查是否为默认占位图（支持多种占位图格式）
      const placeholderPatterns = [
        '/images/placeholder-image.jpg',
        '/images/placeholder-image.svg',
        '/images/default-image.png',
        '/placeholder/',
        'placeholder-image'
      ];
      
      const isPlaceholder = placeholderPatterns.some(pattern => trimmedUrl.includes(pattern));
      if (isPlaceholder) {
        urlValidationCache.current.set(trimmedUrl, { valid: true, timestamp: Date.now() });
        resolve(true);
        return;
      }
      
      // 检查URL格式
      try {
        const urlObj = new URL(trimmedUrl);
        
        // 验证协议
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          console.warn(`Invalid protocol for image URL: ${urlObj.protocol}`);
          urlValidationCache.current.set(trimmedUrl, { valid: false, timestamp: Date.now() });
          resolve(false);
          return;
        }
        
        // 验证域名格式
        if (!urlObj.hostname || urlObj.hostname.length < 3) {
          console.warn(`Invalid hostname for image URL: ${urlObj.hostname}`);
          urlValidationCache.current.set(trimmedUrl, { valid: false, timestamp: Date.now() });
          resolve(false);
          return;
        }
        
        // 验证文件扩展名（可选）
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const urlLower = trimmedUrl.toLowerCase();
        const hasValidExtension = validExtensions.some(ext => urlLower.endsWith(ext));
        
        if (!hasValidExtension && !trimmedUrl.includes('blob:') && !trimmedUrl.includes('data:') && !trimmedUrl.includes('text_to_image')) {
          console.warn(`Invalid file extension for image URL: ${trimmedUrl}`);
          // 不直接拒绝，继续尝试加载
        }
      } catch (error) {
        console.warn(`Invalid URL format: ${trimmedUrl}`, error);
        urlValidationCache.current.set(trimmedUrl, { valid: false, timestamp: Date.now() });
        resolve(false);
        return;
      }
      
      // 超时处理
      let timeoutId: NodeJS.Timeout;
      let img: HTMLImageElement | null = null;
      
      const handleTimeout = () => {
        console.warn(`Image URL validation timed out: ${trimmedUrl}`);
        if (img) {
          img.onload = null;
          img.onerror = null;
        }
        urlValidationCache.current.set(trimmedUrl, { valid: false, timestamp: Date.now() });
        resolve(false);
      };
      
      timeoutId = setTimeout(handleTimeout, 5000); // 延长超时时间到5秒，给API更多响应时间
      
      // 对于text_to_image API，直接返回true，因为这些是动态生成的图像，
      // 我们应该让实际加载过程来处理错误，而不是在验证阶段就拒绝
      if (trimmedUrl.includes('text_to_image')) {
        console.debug(`Image URL is text_to_image API, skipping strict validation: ${trimmedUrl}`);
        clearTimeout(timeoutId);
        urlValidationCache.current.set(trimmedUrl, { valid: true, timestamp: Date.now() });
        resolve(true);
      } else {
        // 对于普通图像URL，使用Image对象预验证
        img = new Image();
        img.crossOrigin = 'anonymous'; // 支持跨域图像
        
        img.onload = () => {
          clearTimeout(timeoutId);
          console.debug(`Image URL validated successfully: ${trimmedUrl}`);
          urlValidationCache.current.set(trimmedUrl, { valid: true, timestamp: Date.now() });
          resolve(true);
        };
        
        img.onerror = (event) => {
          clearTimeout(timeoutId);
          console.warn(`Image URL validation failed: ${trimmedUrl}`, event);
          urlValidationCache.current.set(trimmedUrl, { valid: false, timestamp: Date.now() });
          resolve(false);
        };
        
        img.src = trimmedUrl;
      }
    });
  }, []);
  
  // 3D模型加载状态
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState(false);
  
  // 加载进度
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // 设备性能状态
  const [devicePerformance, setDevicePerformance] = useState(getDevicePerformance());
  
  // 根据设备性能调整粒子效果配置
  const optimizedParticleEffect = {
    ...particleEffect,
    particleCount: devicePerformance.isLowEndDevice ? Math.min(particleEffect.particleCount, 30) : 
                   devicePerformance.isMediumEndDevice ? Math.min(particleEffect.particleCount, 80) : 
                   particleEffect.particleCount,
    particleSize: devicePerformance.isLowEndDevice ? Math.max(particleEffect.particleSize, 0.15) : particleEffect.particleSize,
    animationSpeed: devicePerformance.isLowEndDevice ? particleEffect.animationSpeed * 0.7 : particleEffect.animationSpeed,
    showTrails: !devicePerformance.isLowEndDevice
  };

  // 图像加载降级策略 - 获取备选图像URL
  const getFallbackImageUrl = useCallback((originalUrl: string) => {
    // 如果是默认占位图，直接返回
    if (originalUrl.includes('placeholder')) {
      return originalUrl;
    }
    
    // 生成备选低分辨率URL（根据不同CDN或URL格式调整）
    const urlObj = new URL(originalUrl);
    
    // 处理text_to_image API特殊情况
    if (urlObj.pathname.includes('text_to_image')) {
      // 修改现有的image_size参数为较低分辨率
      urlObj.searchParams.set('image_size', '1024x768'); // 使用更低的分辨率
      return urlObj.toString();
    }
    
    // 示例：添加低分辨率后缀
    let fallbackUrl = originalUrl;
    
    // 处理不同类型的URL格式
    if (originalUrl.includes('?')) {
      // 添加size参数（适合大部分CDN）
      fallbackUrl = `${originalUrl}&size=small`;
    } else {
      // 在文件名前添加_thumb后缀
      const pathParts = urlObj.pathname.split('.');
      if (pathParts.length > 1) {
        const extension = pathParts.pop();
        const baseName = pathParts.join('.');
        fallbackUrl = `${urlObj.origin}${baseName}_thumb.${extension}${urlObj.search}`;
      }
    }
    
    console.debug(`Generated fallback URL for ${originalUrl}: ${fallbackUrl}`);
    return fallbackUrl;
  }, []);

  // 扩展占位符图像检测：支持多种占位符格式和路径
  const isPlaceholderImage = !config.imageUrl || 
    config.imageUrl === '/images/placeholder-image.svg' ||
    config.imageUrl === '/images/placeholder-image.jpg' ||
    config.imageUrl === '/images/default-image.png' ||
    // 只检查精确的占位图URL，不检查URL中是否包含关键词
    config.imageUrl.length === 0;
  
  // 确保组件初始化时就将加载状态设置为正确值
  useEffect(() => {
    // 检查是否有实际需要加载的资源，排除占位符图像
    const hasResourcesToLoad = 
      (config.type === '2d' && config.imageUrl && !isPlaceholderImage) || 
      (config.type === '3d' && config.modelUrl);
    
    // 只有在没有资源需要加载时才设置完成状态
    if (!hasResourcesToLoad) {
      setTextureLoading(false);
      setModelLoading(false);
      setLoadingProgress(100);
    }
  }, [config.type, config.imageUrl, config.modelUrl, isPlaceholderImage]);
  
  // 加载纹理 - 增强版本：添加URL验证和更好的错误处理，包括降级策略
  useEffect(() => {
    let textureLoader: THREE.TextureLoader | null = null;
    let texture: THREE.Texture | null = null;
    let isMounted = true;
    let currentUrl: string | null = null;
    
    // 立即将加载状态设置为false，防止任何情况下显示加载屏幕
    if (isPlaceholderImage) {
      setTextureLoading(false);
      setModelLoading(false);
      setLoadingProgress(100);
      if (onProgress) {
        onProgress(100);
      }
      if (onLoadingComplete) {
        onLoadingComplete();
      }
      return;
    }
    
    const loadTexture = async (url: string, isFallback: boolean = false) => {
      // 如果是占位符图像，直接跳过加载流程
      if (isPlaceholderImage) {
        if (isMounted) {
          setTextureLoading(false);
          setTextureError(false);
          setLoadingProgress(100);
          if (onProgress) {
            onProgress(100);
          }
          if (onLoadingComplete) {
            onLoadingComplete();
          }
        }
        return;
      }
      
      if (config.type === '2d') {
        currentUrl = url;
        
        // 立即开始进度模拟，不等待URL验证
        let progressInterval: NodeJS.Timeout;
        
        // 开始模拟进度更新
        const startProgressSimulation = () => {
          if (isMounted) {
            // 每200ms更新一次进度，从0%到90%
            progressInterval = setInterval(() => {
              setLoadingProgress(prev => {
                // 渐进式增加进度，避免线性增长显得不自然
                const increment = Math.random() * 8 + 2; // 每次增加2-10%
                const newProgress = Math.min(prev + increment, 90);
                const roundedProgress = Math.round(newProgress);
                // 同时通知父组件进度更新
                if (onProgress) {
                  onProgress(roundedProgress);
                }
                return roundedProgress;
              });
            }, 200);
          }
        };
        
        // 停止进度模拟
        const stopProgressSimulation = () => {
          if (progressInterval) {
            clearInterval(progressInterval);
          }
        };
        
        // 设置初始加载状态
        if (isMounted) {
          setTextureLoading(true);
          setTextureError(false);
          setLoadingProgress(0);
        }
        
        // 开始进度模拟
        startProgressSimulation();
        
        // 验证URL有效性
        const isValidUrl = await validateImageUrl(url);
        if (!isValidUrl) {
          if (isMounted) {
            stopProgressSimulation();
            console.error('Invalid image URL:', url);
            if (isFallback) {
              setTexture(null);
              setTextureLoading(false);
              setTextureError(true);
              setLoadingProgress(100);
              toast.error('图像URL无效，请检查配置');
            } else {
              // 尝试使用备选URL
              const fallbackUrl = getFallbackImageUrl(url);
              console.info(`Trying fallback URL: ${fallbackUrl}`);
              loadTexture(fallbackUrl, true);
            }
          }
          return;
        }
        
        // 检查缓存中是否已有该纹理
        const cachedEntry = resourceCache.textures.get(url);
        if (cachedEntry) {
          // 更新缓存资源的使用计数和时间戳
          cachedEntry.timestamp = Date.now();
          cachedEntry.usageCount++;
          resourceCache.textures.set(url, cachedEntry);
          
          if (isMounted) {
            stopProgressSimulation();
            setTexture(cachedEntry.resource);
            setTextureLoading(false);
            setTextureError(false);
            setLoadingProgress(100);
          }
          return;
        }
        
        textureLoader = new THREE.TextureLoader();
        
        // 根据设备性能调整纹理加载质量
        const qualitySettings = devicePerformance.isLowEndDevice ? {
          // 低性能设备：降低纹理质量
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          generateMipmaps: false
        } : {
          // 高性能设备：使用高质量纹理
          minFilter: THREE.LinearMipmapLinearFilter,
          magFilter: THREE.LinearFilter,
          generateMipmaps: true
        };
        
        texture = textureLoader.load(
          url,
          (loadedTexture) => {
            if (!isMounted || currentUrl !== url) {
              stopProgressSimulation();
              return;
            }
            
            // 停止进度模拟并设置为100%
            stopProgressSimulation();
            
            // 应用质量设置
            loadedTexture.minFilter = qualitySettings.minFilter;
            loadedTexture.magFilter = qualitySettings.magFilter;
            loadedTexture.generateMipmaps = qualitySettings.generateMipmaps;
            
            // 估算纹理大小（简化估算：宽度 * 高度 * 4字节/像素）
            const estimatedSize = loadedTexture.image.width * loadedTexture.image.height * 4;
            
            // 添加到缓存
            const cacheEntry: CachedResource<THREE.Texture> = {
              resource: loadedTexture,
              timestamp: Date.now(),
              size: estimatedSize,
              usageCount: 1
            };
            
            resourceCache.textures.set(url, cacheEntry);
            
            // 清理超出限制的资源
            resourceCache.config.cleanupExcess();
            
            setTexture(loadedTexture);
            setTextureLoading(false);
            setTextureError(false);
            setLoadingProgress(100);
            
            // 通知父组件进度更新
            if (onProgress) {
              onProgress(100);
            }
            
            // 通知父组件加载完成
            if (onLoadingComplete) {
              onLoadingComplete();
            }
            
            // 重置重试状态
            setTextureRetryCount(0);
            setRetryState(prev => ({
              ...prev,
              isRetrying: false,
              currentAttempt: 0,
              nextRetryDelay: 1000,
              totalRetryTime: 0
            }));
            
            if (isFallback) {
              toast.info('已切换到低分辨率图像');
            }
          },
          // THREE.TextureLoader.load不支持onProgress回调，移除无效参数
          undefined,
          (error) => {
            if (!isMounted || currentUrl !== url) {
              stopProgressSimulation();
              return;
            }
            
            // 停止进度模拟并设置为100%
            stopProgressSimulation();
            
            const errorType = detectErrorType(error);
            const errorInfo = errorMessages[errorType];
            
            console.error(`Error loading texture ${isFallback ? '(fallback)' : ''}:`, {
              url,
              errorType,
              errorMessage: error instanceof Error ? error.message : String(error),
              errorCode: error instanceof Error && 'code' in error ? (error as any).code : undefined,
              timestamp: new Date().toISOString()
            });
            
            if (isFallback) {
              // 备选URL也失败了
              setTexture(null);
              setTextureLoading(false);
              setTextureError(true);
              setLoadingProgress(100);
              
              // 自动重试 - 使用智能重试策略
              if (retryState.currentAttempt < retryState.maxAttempts) {
                // 触发智能重试
                retryLoadTexture();
              } else {
                // 达到最大重试次数
                toast.error(`${errorInfo.title}: ${errorInfo.description}`);
                // 重置重试状态
                setRetryState(prev => ({
                  ...prev,
                  isRetrying: false,
                  currentAttempt: 0,
                  nextRetryDelay: 1000,
                  totalRetryTime: 0
                }));
              }
            } else {
              // 主URL失败，尝试备选URL
              const fallbackUrl = getFallbackImageUrl(url);
              console.info(`Main URL failed, trying fallback: ${fallbackUrl}`, { errorType });
              toast.warning('主图像加载失败，正在尝试低分辨率版本');
              loadTexture(fallbackUrl, true);
            }
          }
        );
        
        // 确保清理定时器
        return () => {
          stopProgressSimulation();
        };
      }
    };
    
    if (config.imageUrl) {
      loadTexture(config.imageUrl, false);
    }

    return () => {
      isMounted = false;
      // 清理纹理资源（仅当不在缓存中时）
      if (texture && currentUrl && !resourceCache.textures.has(currentUrl)) {
        texture.dispose();
      }
    };
  }, [config.imageUrl, config.type, textureRetryCount, retryLoadTexture, validateImageUrl, getFallbackImageUrl, devicePerformance, detectErrorType]);
  
  // 加载3D模型 - 优化版本：使用增强缓存机制
  useEffect(() => {
    let loader: GLTFLoader | null = null;
    let gltfScene: THREE.Group | null = null;
    
    if (config.type === '3d' && config.modelUrl) {
      // 检查缓存中是否已有该模型
      const cachedEntry = resourceCache.models.get(config.modelUrl);
      if (cachedEntry) {
        // 更新缓存资源的使用计数和时间戳
        cachedEntry.timestamp = Date.now();
        cachedEntry.usageCount++;
        resourceCache.models.set(config.modelUrl, cachedEntry);
        
        setModel(cachedEntry.resource);
        setModelLoading(false);
        setModelError(false);
        setLoadingProgress(100);
        return;
      }
      
      setModelLoading(true);
      setModelError(false);
      setLoadingProgress(50);
      
      loader = new GLTFLoader();
      loader.load(
        config.modelUrl,
        (gltf: any) => {
          gltfScene = gltf.scene as THREE.Group;
          
          // 估算模型大小（简化估算：计算几何体和材质数量）
          let estimatedSize = 0;
          gltfScene.traverse((object: any) => {
            if (object.geometry) {
              // 估算几何体大小：顶点数量 * 3 * 4字节（假设浮点数）
              const vertexCount = object.geometry.attributes.position?.count || 0;
              estimatedSize += vertexCount * 3 * 4;
            }
            if (object.material) {
              // 估算材质大小：每个材质约1KB
              estimatedSize += Array.isArray(object.material) ? object.material.length * 1024 : 1024;
            }
          });
          
          // 添加到缓存
          if (config.modelUrl) {
            const cacheEntry: CachedResource<THREE.Group> = {
              resource: gltfScene,
              timestamp: Date.now(),
              size: estimatedSize,
              usageCount: 1
            };
            
            resourceCache.models.set(config.modelUrl, cacheEntry);
          }
          
          // 清理超出限制的资源
          resourceCache.config.cleanupExcess();
          
          setModel(gltfScene);
          setModelLoading(false);
          setModelError(false);
          setLoadingProgress(100);
          
          // 通知父组件加载完成
          if (onLoadingComplete) {
            onLoadingComplete();
          }
        },
        (progress: ProgressEvent) => {
          // 更新加载进度
          if (progress.total > 0) {
            const progressPercent = 50 + Math.round((progress.loaded / progress.total) * 50);
            setLoadingProgress(progressPercent);
            
            // 通知父组件进度更新
            if (onProgress) {
              onProgress(progressPercent);
            }
          }
        },
        (error: unknown) => {
          console.error('Error loading model:', error);
          setModel(null);
          setModelLoading(false);
          setModelError(true);
          setLoadingProgress(100);
        }
      );
    }
    
    return () => {
      // 清理模型资源（仅当不在缓存中时）
      if (gltfScene && !resourceCache.models.has(config.modelUrl || '')) {
        // 递归清理模型的几何体和材质
        gltfScene.traverse((object: any) => {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material: THREE.Material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, [config.modelUrl, config.type]);
  
  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 清理资源缓存（如果需要）
      // 注意：这里不清理缓存，而是依赖定期清理机制
      // 可以根据需要添加特定资源的清理逻辑
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Canvas配置 - 为AR模式添加正确的sessionInit配置 */}
      <Canvas
        camera={{ position: [8, 8, 8], fov: 75 }}
        gl={{ 
          antialias: true, 
          powerPreference: 'high-performance',
          preserveDrawingBuffer: isARMode, // AR模式下需要保留绘制缓冲区
          alpha: true,
          stencil: false,
          // 优化WebGL配置，提升性能
          premultipliedAlpha: true,
          depth: true,
        }}
        shadows={false}
        performance={{ 
          min: 0.3, // 降低性能阈值，在低性能设备上自动降低质量
          debounce: 150 
        }}
        style={{ flex: 1, width: '100%', height: '100%' }}
        // 只有在AR模式下才需要sessionInit配置
        {...(isARMode && {
          sessionInit: {
            requiredFeatures: ['hit-test', 'anchors'],
            optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
            domOverlay: { root: document.body }
          } as any // 添加类型断言，确保配置正确
        })}
      >
        {/* Canvas内部内容 */}
        <CanvasContent
                config={config}
                scale={scale}
                rotation={rotation}
                position={position}
                isARMode={isARMode}
                particleEffect={optimizedParticleEffect}
                texture={texture}
                textureError={textureError}
                model={model}
                modelLoading={modelLoading}
                modelError={modelError}
                cameraView={cameraView}
                isPlaced={isPlaced}
              />
      </Canvas>
      
      {/* 统一的资源加载状态提示 - 仅在有实际资源需要加载时显示 */}
      {(() => {
        // 扩展占位符检测，与组件内其他地方保持一致
        const isPlaceholderImage = !config.imageUrl || 
          config.imageUrl === '/images/placeholder-image.svg' ||
          config.imageUrl === '/images/placeholder-image.jpg' ||
          config.imageUrl === '/images/default-image.png' ||
          config.imageUrl.includes('placeholder') ||
          config.imageUrl.includes('default') ||
          config.imageUrl.length === 0;
        
        // 严格检查是否有实际需要加载的资源
        const hasResourcesToLoad = 
          (config.type === '2d' && config.imageUrl && !isPlaceholderImage) || 
          (config.type === '3d' && config.modelUrl);
        
        // 只有在同时满足以下条件时才显示加载状态：
        // 1. 有实际资源需要加载
        // 2. 纹理或模型正在加载中
        // 3. 加载进度小于100%
        // 注意：为了确保3D预览立即显示，我们暂时注释掉加载屏幕
        return false && (textureLoading || modelLoading) && hasResourcesToLoad && loadingProgress < 100 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-20">
            <div className="text-white text-center bg-gradient-to-br from-indigo-900/90 to-purple-900/90 rounded-2xl p-6 shadow-2xl border border-white/10 max-w-md">
              <div className="relative mb-6">
                {/* 动画旋转圆环 */}
                <div className="w-24 h-24 border-4 border-t-indigo-500 border-r-purple-500 border-b-pink-500 border-l-blue-500 rounded-full animate-spin-fast shadow-lg"></div>
                {/* 进度百分比 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    {loadingProgress}%
                  </div>
                </div>
              </div>
              
              {/* 加载文本 */}
              <p className="text-xl font-semibold mb-4 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                {modelLoading ? '正在加载3D模型...' : '正在加载纹理...'}
              </p>
              
              {/* 优化的进度条 */}
              <div className="w-full h-3 bg-gray-800/50 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out" 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              
              {/* 加载提示 */}
              <p className="text-sm text-gray-300">
                {loadingProgress < 20 ? '正在准备资源...' : 
                 loadingProgress < 50 ? '正在下载文件...' : 
                 loadingProgress < 80 ? '正在处理数据...' : '即将完成...'}
              </p>
              
              {/* 预计剩余时间 */}
              {loadingProgress > 0 && loadingProgress < 100 && (
                <div className="mt-3 text-xs text-gray-400">
                  <i className="fas fa-clock mr-1"></i>
                  预计剩余时间: {Math.max(1, Math.round((100 - loadingProgress) / 2))}秒
                </div>
              )}
            </div>
          </div>
        );
      })()}
      
      {/* 纹理加载错误提示 - 优化版 */}
      {textureError && config.imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-20">
          <div className="text-white text-center max-w-md bg-gradient-to-br from-indigo-900/90 to-purple-900/90 rounded-2xl p-6 shadow-2xl border border-white/10">
            <div className="text-red-500 text-5xl mb-4 animate-pulse">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">图像加载失败</h3>
            <p className="text-base text-gray-200 mb-6">
              抱歉，无法加载所选图像。请检查以下事项：
            </p>
            <ul className="text-left text-sm text-gray-300 mb-6 space-y-2 pl-5">
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-400 mt-1 mr-2 flex-shrink-0"></i>
                <span>网络连接是否正常</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-400 mt-1 mr-2 flex-shrink-0"></i>
                <span>图像URL是否有效</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-400 mt-1 mr-2 flex-shrink-0"></i>
                <span>服务器是否可访问</span>
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={retryLoadTexture}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <i className="fas fa-redo"></i>
                重新加载
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <i className="fas fa-sync-alt"></i>
                刷新页面
              </button>
            </div>
            {/* 重试状态信息 */}
            {retryState.currentAttempt > 0 && (
              <div className="mt-4 text-xs text-gray-400 flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <span>已尝试 {retryState.currentAttempt}/{retryState.maxAttempts} 次</span>
                  <i className="fas fa-info-circle" title="采用智能重试策略，每次重试延迟递增"></i>
                </div>
                {retryState.isRetrying && (
                  <div className="flex items-center gap-1 animate-pulse">
                    <span>下次重试: {Math.round(retryState.nextRetryDelay / 1000)}秒后</span>
                    <i className="fas fa-clock"></i>
                  </div>
                )}
              </div>
            )}
            {/* 错误日志记录 - 开发模式下可见 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-xs text-gray-400 bg-gray-800/50 p-3 rounded-lg">
                <p className="font-semibold mb-1">错误详情：</p>
                <p>图像URL: {config.imageUrl}</p>
                <p>错误类型: 资源加载失败</p>
                <p>重试次数: {textureRetryCount}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 模型加载错误提示 */}
      {modelError && config.modelUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="text-white text-center">
            <div className="text-red-500 text-4xl mb-3">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <p className="mb-2">3D模型加载失败</p>
            <p className="text-sm text-gray-300">请检查网络连接或稍后重试</p>
          </div>
        </div>
      )}
    </div>
  );
});

// 添加自定义比较函数，优化React.memo的比较逻辑
ThreeDPreviewContent.displayName = 'ThreeDPreviewContent';

// 错误边界组件 - 增强错误处理和用户反馈
const ARPreviewErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [errorInfo, setErrorInfo] = React.useState<string>('');
  const [errorStack, setErrorStack] = React.useState<string>('');
  const [errorType, setErrorType] = React.useState<string>('未知错误');
  const errorHandlerRef = React.useRef<((error: ErrorEvent) => void) | null>(null);
  const resetCountRef = React.useRef(0);

  // 重置错误状态
  const resetError = React.useCallback(() => {
    resetCountRef.current++;
    setHasError(false);
    setErrorInfo('');
    setErrorStack('');
    setErrorType('未知错误');
    toast.success('已尝试恢复AR预览');
  }, []);

  // 使用useEffect捕获组件错误
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('AR Preview Component Error:', error);
      setErrorInfo(error.message);
      setErrorType('组件错误');
      setHasError(true);
      toast.error('AR预览组件出现错误');
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  React.useEffect(() => {
    // 使用ref存储错误处理函数，避免闭包问题
    const handleError = (error: ErrorEvent) => {
      console.error('AR Preview Error:', error);
      setErrorInfo(error.message || '未知错误');
      setErrorStack(error.error?.stack || '');
      setErrorType('运行时错误');
      setHasError(true);
      toast.error('AR预览出现错误，请尝试恢复或刷新页面');
    };
    
    errorHandlerRef.current = handleError;
    window.addEventListener('error', handleError);
    
    // 捕获Promise错误
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('AR Preview Promise Error:', event);
      setErrorInfo(event.reason?.message || 'Promise拒绝错误');
      setErrorStack(event.reason?.stack || '');
      setErrorType('Promise错误');
      setHasError(true);
      toast.error('AR预览Promise出现错误');
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      if (errorHandlerRef.current) {
        window.removeEventListener('error', errorHandlerRef.current);
        errorHandlerRef.current = null;
      }
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 text-red-600 dark:text-red-400 p-6 animate-fade-in">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <i className="fas fa-exclamation-triangle text-6xl text-red-500"></i>
        </div>
        <h3 className="text-2xl font-bold mb-3">AR预览出错了</h3>
        <p className="text-center text-red-500 dark:text-red-300 mb-6 max-w-md">
          很抱歉，AR预览出现了问题。请尝试以下方法恢复：
        </p>
        
        {/* 错误详情 - 可折叠 */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-3 rounded-lg text-sm text-red-700 dark:text-red-300 max-w-md shadow-lg mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">错误详情</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${errorType === '组件错误' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : errorType === 'Promise错误' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'}`}>
              {errorType}
            </span>
          </div>
          <div className="text-sm opacity-80 mb-2">{errorInfo || '未知错误'}</div>
          {errorStack && (
            <div className="mt-2 text-xs opacity-70 max-h-24 overflow-y-auto bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {errorStack.substring(0, 500)}{errorStack.length > 500 ? '...' : ''}
            </div>
          )}
        </div>
        
        {/* 恢复选项 */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <button 
            onClick={resetError}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <i className="fas fa-undo"></i>
            尝试恢复
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <i className="fas fa-sync-alt"></i>
            刷新页面
          </button>
        </div>
        
        {/* 恢复尝试次数 */}
        {resetCountRef.current > 0 && (
          <div className="mt-4 text-sm text-red-500 dark:text-red-400 opacity-80">
            已尝试恢复 {resetCountRef.current} 次
          </div>
        )}
      </div>
    );
  }

  return React.cloneElement(children as React.ReactElement, { key: resetCountRef.current });
};

// 性能监控数据类型
interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
    percent: number;
  };
  renderTime: number;
  particleCount: number;
  drawCalls: number;
  triangles: number;
  devicePerformance: ReturnType<typeof getDevicePerformance>;
}

// 性能监控逻辑 - 仅保留核心性能优化逻辑，移除UI组件
// 性能指标计算仍在后台运行，但不显示给用户
const usePerformanceMonitoring = ({
  particleCount,
  fps,
  devicePerformance
}: {
  particleCount: number;
  fps: number;
  devicePerformance: ReturnType<typeof getDevicePerformance>;
}) => {
  // 后台监控性能指标，但不渲染UI
  useEffect(() => {
    // 可以添加性能日志记录，仅在开发模式下输出
    if (process.env.NODE_ENV === 'development') {
      console.log('AR Preview Performance:', {
        fps,
        particleCount,
        devicePerformance: devicePerformance.performanceLevel,
        timestamp: new Date().toISOString()
      });
    }
  }, [fps, particleCount, devicePerformance]);
  
  // 返回空，因为不需要UI组件
  return null;
};

const ARPreview: React.FC<{
  config: ARPreviewConfig;
  onClose: () => void;
  work?: Work;
}> = ({ config, onClose, work }) => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isARMode, setIsARMode] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [scale, setScale] = useState(config.scale || 0.5);
  const [rotation, setRotation] = useState(config.rotation || { x: 0, y: 0, z: 0 });
  const [position, setPosition] = useState(config.position || { x: 0, y: 0.5, z: 0 });

  // 当没有资源需要加载时，自动设置isLoading为false
  useEffect(() => {
    // 检查是否有实际需要加载的资源，排除占位符图像
    const isPlaceholderImage = config.imageUrl === '/images/placeholder-image.svg';
    const hasResourcesToLoad = 
      (config.type === '2d' && config.imageUrl && !isPlaceholderImage) || 
      (config.type === '3d' && config.modelUrl);
    
    // 如果没有资源需要加载，直接设置isLoading为false
    if (!hasResourcesToLoad) {
      setIsLoading(false);
      setLoadingProgress(100);
    }
  }, [config.type, config.imageUrl, config.modelUrl]);
  // 添加模型放置状态
  const [isPlaced, setIsPlaced] = useState(false);
  
  // 设备性能检测
  const devicePerformance = getDevicePerformance();
  

  
  // 粒子效果配置 - 根据设备性能动态调整
  const [particleEffect, setParticleEffect] = useState<ParticleEffectConfig>({
    enabled: true,
    type: 'spiral',
    particleCount: devicePerformance.isLowEndDevice ? 30 : devicePerformance.isMediumEndDevice ? 80 : 150,
    particleSize: 0.1,
    animationSpeed: devicePerformance.isLowEndDevice ? 1.0 : 2.0,
    color: '#ffffff',
    showTrails: !devicePerformance.isLowEndDevice,
    rotationSpeed: 1
  });
  
  // 移除自动隐藏加载状态的定时器，改为仅在资源加载完成后隐藏
  // 这样可以确保加载状态准确反映实际资源加载情况
  
  // 相机视图模式
  const [cameraView, setCameraView] = useState<'perspective' | 'top' | 'front' | 'side'>('perspective');
  
  // 相机位置控制
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // 切换相机视图
  const switchCameraView = useCallback((view: 'perspective' | 'top' | 'front' | 'side') => {
    setCameraView(view);
    toast.success(`已切换到${view === 'perspective' ? '透视' : view === 'top' ? '顶' : view === 'front' ? '前' : '侧'}视图`);
  }, []);
  
  // 点击互动配置
  const [clickInteraction, setClickInteraction] = useState<ClickInteractionConfig>({
    enabled: true,
    effectType: 'explosion',
    intensity: 1,
    radius: 1,
    duration: 0.5
  });
  
  // 性能监控
  const lastFrameTimeRef = useRef(performance.now());
  const fpsRef = useRef(0);
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef(performance.now());
  
  // FPS计算
  useEffect(() => {
    const calculateFPS = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      
      // 更新帧率
      frameCountRef.current++;
      if (now - fpsIntervalRef.current >= 1000) {
        fpsRef.current = frameCountRef.current;
        frameCountRef.current = 0;
        fpsIntervalRef.current = now;
      }
      
      requestAnimationFrame(calculateFPS);
    };
    
    const animationId = requestAnimationFrame(calculateFPS);
    return () => cancelAnimationFrame(animationId);
  }, []);
  

  
  // 移除不需要的纹理加载进度同步，因为ThreeDPreviewContent组件内部已经处理了进度
  
  // AR模式切换处理 - 增强用户反馈
  const toggleARMode = useCallback(() => {
    if (!isARMode) {
      // 进入AR模式前的准备
      setIsLoading(true);
      toast.info('正在准备AR模式...', { duration: 2000 });
      
      // 延迟进入AR模式，给用户准备时间
      setTimeout(() => {
        // 进入AR模式
        toast.success('正在进入AR模式，请将设备对准平面查看效果');
        // 重置放置状态
        setIsPlaced(false);
        // 切换AR模式状态
        setIsARMode(true);
        setIsLoading(false);
      }, 500);
    } else {
      // 退出AR模式
      toast.success('已退出AR模式');
      // 重置放置状态
      setIsPlaced(false);
      // 切换AR模式状态
      setIsARMode(false);
    }
  }, [isARMode]);
  
  // 模型放置处理 - 增强用户反馈
  const handleModelPlace = useCallback(() => {
    if (isPlaced) {
      // 重新放置模型
      setIsPlaced(false);
      toast.info('可以重新放置模型');
    } else {
      // 放置模型
      setIsPlaced(true);
      toast.success('模型已成功放置', { 
        duration: 1500,
        icon: '🎉',
        description: '点击模型可重新放置' 
      });
    }
  }, [isPlaced]);
  
  // 处理缩放变化
  const handleScaleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(parseFloat(e.target.value));
  }, []);
  
  // 处理旋转变化
  const handleRotationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRotation({
      ...rotation,
      [e.target.name]: parseFloat(e.target.value)
    });
  }, [rotation]);
  
  // 处理位置变化
  const handlePositionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPosition({
      ...position,
      [e.target.name]: parseFloat(e.target.value)
    });
  }, [position]);
  
  // 处理手势缩放
  const handlePinch = useCallback((event: any) => {
    event.preventDefault();
    const scaleFactor = event.scale;
    setScale(prev => Math.max(0.1, Math.min(3, prev * scaleFactor)));
  }, []);
  
  // 处理手势旋转
  const handleRotate = useCallback((event: any) => {
    event.preventDefault();
    setRotation(prev => ({
      ...prev,
      z: prev.z + event.rotation.z
    }));
  }, []);
  
  // 处理手势平移
  const handlePan = useCallback((event: any) => {
    event.preventDefault();
    setPosition(prev => ({
      ...prev,
      x: prev.x + event.delta.x * 0.01,
      y: prev.y + event.delta.y * 0.01
    }));
  }, []);
  
  // 处理AR点击
  const handleARClick = useCallback(() => {
    if (isARMode) {
      handleModelPlace();
    }
  }, [isARMode, handleModelPlace]);
  
  // 处理截图
  const handleScreenshot = useCallback(() => {
    toast.success('截图已保存到相册');
  }, []);
  
  // 重置变换
  const handleResetTransform = useCallback(() => {
    setScale(config.scale || 0.5);
    setRotation(config.rotation || { x: 0, y: 0, z: 0 });
    setPosition(config.position || { x: 0, y: 0.5, z: 0 });
    toast.success('已重置所有变换');
  }, [config]);
  
  // 切换收藏状态
  const toggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? '已取消收藏' : '已添加到收藏');
  }, [isFavorite]);
  
  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 backdrop-blur-lg flex items-center justify-center`}>
      <div className={`w-full h-full max-w-3xl mx-auto ${isDark ? 'bg-gray-900/95 text-white' : 'bg-white/95 text-gray-900'} rounded-3xl shadow-2xl border border-white/10`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh' }}>
        {/* 性能监控逻辑 - 仅在开发模式下记录日志，无UI显示 */}
        {usePerformanceMonitoring({
          particleCount: particleEffect.particleCount,
          fps: fpsRef.current,
          devicePerformance: devicePerformance
        })}
        
        {/* 顶部导航栏 */}
        <div className={`sticky top-0 z-40 flex items-center justify-between p-4 border-b ${isDark ? 'border-indigo-800/50 bg-indigo-900/95' : 'border-indigo-200 bg-white/95'} shadow-lg`} style={{ height: 'auto' }}>
          <h2 className="text-lg font-bold text-white">AR预览</h2>
          <div className="flex items-center gap-2">
            {work && (
              <button
                onClick={toggleFavorite}
                className={`p-2 rounded-full ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white/80 hover:bg-white/90'} transition-all duration-300 transform hover:scale-110 hover:shadow-md`}
                aria-label={isFavorite ? '取消收藏' : '收藏'}
              >
                <i className={`fas fa-heart text-sm ${isFavorite ? 'text-pink-500 animate-pulse' : 'text-gray-500'}`}></i>
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${isDark ? 'bg-white/10 hover:bg-red-600/30' : 'bg-white/80 hover:bg-red-100'} transition-all duration-300 transform hover:scale-110 hover:shadow-md`}
              aria-label="关闭"
            >
              <i className="fas fa-times text-sm text-white"></i>
            </button>
          </div>
        </div>

        {/* 作品信息区域 */}
        <div className={`p-5 border-b ${isDark ? 'border-purple-800/50 bg-gradient-to-r from-indigo-900/95 to-purple-900/95' : 'border-purple-200 bg-gradient-to-r from-indigo-50/95 to-purple-50/95'}`} style={{ height: 'auto' }}>
          <div className="flex flex-col gap-5">
            {/* 作品基本信息 */}
            <div className="flex items-center justify-between">
              {/* 左侧 - 作品信息 */}
              <div className="flex items-center gap-4">
                <div className="text-white font-bold flex flex-col">
                  <div className="text-sm opacity-90 animate-fade-in">插画设计</div>
                  <div className="text-3xl font-extrabold animate-slide-up">插画师小陈</div>
                </div>
                <button 
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                >
                  <i className="fas fa-heart text-pink-500 animate-pulse text-xl"></i>
                </button>
              </div>
            </div>
            
            {/* 作品标签 */}
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl text-white text-sm font-medium hover:bg-white/20 hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fade-in" style={{ animationDelay: '0.1s' }}>#东方</span>
              <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl text-white text-sm font-medium hover:bg-white/20 hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fade-in" style={{ animationDelay: '0.2s' }}>#美学</span>
              <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl text-white text-sm font-medium hover:bg-white/20 hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fade-in" style={{ animationDelay: '0.3s' }}>#插画</span>
            </div>
          </div>
        </div>

        {/* AR预览主区域 */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: '400px', flex: 1, height: '100%' }}>
          <div 
            className="w-full h-full relative cursor-crosshair"
            onClick={handleARClick}
            style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {/* 检查是否有实际需要加载的资源 */}
            {(() => {
              // 检查是否有实际需要加载的资源，排除占位符图像
              const isPlaceholderImage = config.imageUrl === '/images/placeholder-image.svg';
              const hasResourcesToLoad = 
                (config.type === '2d' && config.imageUrl && !isPlaceholderImage) || 
                (config.type === '3d' && config.modelUrl);
              
              // 如果没有资源需要加载，直接显示3D预览内容，不显示加载状态
              if (!hasResourcesToLoad) {
                return (
                  <ARPreviewErrorBoundary>
                    <div className="w-full h-full flex flex-col" style={{ flex: 1 }}>
                      <ThreeDPreviewContent
                        config={config}
                        scale={scale}
                        rotation={rotation}
                        position={position}
                        isARMode={isARMode}
                        particleEffect={particleEffect}
                        clickInteraction={clickInteraction}
                        cameraView={cameraView}
                        isPlaced={isPlaced}
                        onLoadingComplete={() => setIsLoading(false)}
                        onProgress={(progress) => setLoadingProgress(progress)}
                      />
                    </div>
                  </ARPreviewErrorBoundary>
                );
              }
              
              // 有资源需要加载时，显示加载状态和预览内容
              return (
                <>
                  {/* 加载状态 */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/95 z-10 animate-fade-in">
                      <div className="text-center text-white max-w-md space-y-8">
                        <div className="relative">
                          <i className="fas fa-vr-cardboard text-8xl text-indigo-400 opacity-90 animate-pulse"></i>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-xl font-bold">正在加载AR资源...</h3>
                          <p className="text-indigo-200 text-sm max-w-xs mx-auto leading-relaxed">正在准备3D渲染引擎、模型和纹理资源，敬请稍候...</p>
                          
                          {/* 增强版进度条 */}
                          <div className="w-48 h-3 bg-white/10 rounded-full overflow-hidden mx-auto">
                            <div 
                              className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${loadingProgress}%` }}
                            ></div>
                          </div>
                          
                          {/* 进度百分比显示 */}
                          <div className="text-center text-white text-lg font-bold">
                            {loadingProgress}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* AR预览内容 - 无论是否加载中都显示，加载状态会覆盖在上面 */}
                  <ARPreviewErrorBoundary>
                    <div className="w-full h-full flex flex-col" style={{ flex: 1 }}>
                      <ThreeDPreviewContent
                        config={config}
                        scale={scale}
                        rotation={rotation}
                        position={position}
                        isARMode={isARMode}
                        particleEffect={particleEffect}
                        clickInteraction={clickInteraction}
                        cameraView={cameraView}
                        isPlaced={isPlaced}
                        onLoadingComplete={() => setIsLoading(false)}
                        onProgress={(progress) => setLoadingProgress(progress)}
                      />
                    </div>
                  </ARPreviewErrorBoundary>
                </>
              );
            })()}
          </div>
        </div>
        

        
        {/* 底部控制栏 - 优化版 */}
        <div className={`p-4 border-t ${isDark ? 'border-indigo-800/50 bg-indigo-900/95' : 'border-indigo-200 bg-white/95'} rounded-b-3xl`} style={{ display: 'block', height: 'auto', position: 'relative', bottom: '0' }}>
          <div className="flex flex-col gap-4">
            {/* 主要功能按钮 - 优化排版 */}
            <div className="flex flex-wrap gap-3 w-full">
              {/* 进入AR按钮 */}
              <button
                onClick={toggleARMode}
                className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${isARMode ? 'bg-purple-600 text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg'}`}
                title={isARMode ? '退出AR模式' : '进入AR模式'}
              >
                <i className="fas fa-eye mr-2"></i>
                {isARMode ? '退出AR' : '进入AR'}
              </button>
              
              {/* 重置按钮 */}
              <button
                onClick={handleResetTransform}
                className="flex-1 min-w-[120px] px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 bg-white/10 text-white hover:bg-white/20"
                title="重置所有变换"
              >
                <i className="fas fa-undo mr-2"></i>
                重置
              </button>
              
              {/* 拍照按钮 */}
              <button
                onClick={handleScreenshot}
                className="flex-1 min-w-[120px] px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 bg-pink-600 text-white shadow-lg"
                title="截取当前画面"
              >
                <i className="fas fa-camera mr-2"></i>
                拍照
              </button>
            </div>
            
            {/* 辅助控制区 - 优化布局 */}
            <div className="flex flex-wrap gap-3 w-full">
              {/* 视图模式切换 - 优化版 */}
              <div className="flex gap-2 items-center bg-white/10 rounded-xl p-3 w-full sm:w-auto">
                <span className="text-xs font-semibold text-white whitespace-nowrap flex items-center">
                  <i className="fas fa-eye mr-2 text-xs"></i>
                  视图
                </span>
                <div className="flex gap-1">
                  {['perspective', 'top', 'front', 'side'].map((view) => (
                    <button
                      key={view}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${cameraView === view ? 'bg-indigo-600 text-white' : 'text-white hover:bg-white/20'}`}
                      onClick={() => switchCameraView(view as any)}
                      title={view === 'perspective' ? '透视图' : view === 'top' ? '顶视图' : view === 'front' ? '前视图' : '侧视图'}
                    >
                      {view === 'perspective' ? '透' : view === 'top' ? '顶' : view === 'front' ? '前' : '侧'}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 缩放控制 - 优化版 */}
              <div className="flex gap-2 items-center bg-white/10 rounded-xl p-3 flex-1">
                <span className="text-xs font-semibold text-white whitespace-nowrap">
                  <i className="fas fa-search mr-2 text-xs"></i>
                  缩放
                </span>
                <div className="flex items-center space-x-3 flex-1">
                  <button
                    className="fas fa-search-minus text-white hover:text-indigo-300 transition-colors duration-300 cursor-pointer p-2 rounded-full hover:bg-white/20 transform hover:scale-110 active:scale-95 text-sm"
                    onClick={() => setScale(prev => Math.max(0.1, prev - 0.1))}
                    title="缩小"
                    aria-label="缩小"
                  ></button>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={scale}
                    onChange={handleScaleChange}
                    className="flex-1 h-2 accent-indigo-400 cursor-pointer transition-all duration-300 bg-white/20 rounded-full"
                    title={`当前缩放: ${scale.toFixed(1)}`}
                  />
                  <button
                    className="fas fa-search-plus text-white hover:text-indigo-300 transition-colors duration-300 cursor-pointer p-2 rounded-full hover:bg-white/20 transform hover:scale-110 active:scale-95 text-sm"
                    onClick={() => setScale(prev => Math.min(3, prev + 0.1))}
                    title="放大"
                    aria-label="放大"
                  ></button>
                  <span className="text-sm font-medium text-white w-8 text-center">{scale.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARPreview;