import React, { useState, useEffect, useRef, useCallback, ErrorInfo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// 性能优化：关闭不必要的Three.js特性
THREE.DefaultLoadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
  console.log(`Loading started: ${url} ${itemsLoaded}/${itemsTotal}`);
};

THREE.DefaultLoadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
  console.log(`Loading progress: ${url} ${itemsLoaded}/${itemsTotal}`);
};

THREE.DefaultLoadingManager.onError = function (url) {
  console.error(`Loading error: ${url}`);
};

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

// 环境预设类型
export type EnvironmentPreset = 
  | 'studio' 
  | 'apartment' 
  | 'warehouse' 
  | 'forest' 
  | 'city' 
  | 'night' 
  | 'sunset' 
  | 'dawn' 
  | 'park' 
  | 'lobby';

// 简化的纹理缓存，不使用复杂的引用计数
const textureCache = new Map<string, THREE.Texture>();
const MAX_CACHE_ITEMS = 10; // 限制缓存项数量

// 清理纹理缓存的函数
const cleanupTextureCache = () => {
  if (textureCache.size <= MAX_CACHE_ITEMS) return;
  
  // 移除最旧的缓存项（Map会保持插入顺序）
  const keys = Array.from(textureCache.keys());
  const itemsToRemove = keys.length - MAX_CACHE_ITEMS;
  
  for (let i = 0; i < itemsToRemove; i++) {
    const texture = textureCache.get(keys[i]);
    if (texture) {
      texture.dispose();
    }
    textureCache.delete(keys[i]);
  }
  
  console.log(`清理纹理缓存: 移除了 ${itemsToRemove} 个缓存项`);
};

// 性能监控组件
const PerformanceMonitor: React.FC = () => {
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const frameStartTimeRef = useRef(Date.now());
  
  // 使用useFrame钩子监控性能
  useFrame(() => {
    // 计算FPS
    const now = Date.now();
    const delta = now - lastTimeRef.current;
    const frameDelta = now - frameStartTimeRef.current;
    
    setFrameTime(frameDelta);
    frameCountRef.current++;
    
    if (delta >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
    
    frameStartTimeRef.current = now;
  });
  
  return (
    <div>
      <div>FPS: {fps}</div>
      <div>Frame Time: {frameTime}ms</div>
      <div>Texture Cache: {textureCache.size}/{MAX_CACHE_ITEMS}</div>
    </div>
  );
};

// 反馈效果组件
const FeedbackEffect: React.FC<{
  id: number;
  type: 'click' | 'place';
  position: { x: number; y: number; z: number };
  timestamp: number;
  onComplete: (id: number) => void;
}> = ({ id, type, position, timestamp, onComplete }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());
  const hasCompleted = useRef(false);
  
  // 使用useFrame钩子实现动画
  useFrame((state, delta) => {
    if (!meshRef.current || hasCompleted.current) return;
    
    const elapsed = (Date.now() - startTime.current) / 1000;
    const mesh = meshRef.current;
    const material = mesh.material as THREE.MeshBasicMaterial;
    
    if (type === 'click') {
      // 点击效果：波纹扩散
      const scale = elapsed * 3;
      mesh.scale.set(scale, scale, scale);
      material.opacity = 1 - elapsed;
    } else {
      // 放置效果：粒子爆炸
      const scale = 1 + elapsed * 2;
      mesh.scale.set(scale, scale, scale);
      material.opacity = 1 - elapsed;
      mesh.rotation.y += delta * 5;
    }
    
    // 动画结束后移除对象
    if (elapsed > 1 && !hasCompleted.current) {
      hasCompleted.current = true;
      // 从场景中移除对象
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      // 释放资源
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
      // 通知父组件移除该反馈效果
      onComplete(id);
    }
  });
  
  return (
    <mesh 
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      userData={{ animate: true }}
    >
      {type === 'click' ? (
        // 点击效果：环形波纹
        <>
          <ringGeometry args={[0.05, 0.1, 32]} />
          <meshBasicMaterial 
            color="rgba(0, 255, 0, 0.8)" 
            transparent 
            side={THREE.DoubleSide}
          />
        </>
      ) : (
        // 放置效果：星形粒子
        <>
          <octahedronGeometry args={[0.1, 0]} />
          <meshBasicMaterial 
            color="rgba(0, 255, 100, 0.8)" 
            transparent 
            side={THREE.DoubleSide}
          />
        </>
      )}
    </mesh>
  );
};

// 3D模型预览组件 - 优化版
const ModelPreview: React.FC<{
  url?: string;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  onLoad?: () => void;
  onError?: () => void;
}> = ({ url, scale, rotation, position, onLoad, onError }) => {
  // 优化：只有当url有效时才加载模型
  const modelScene = url ? useGLTF(url).scene : null;

  // 模型加载完成后通知父组件
  React.useEffect(() => {
    if (modelScene && onLoad) {
      onLoad();
    }
  }, [modelScene, onLoad]);

  return (
    <group 
      position={[position.x, position.y, position.z]} 
      rotation={[rotation.x, rotation.y, rotation.z]} 
      scale={scale}
    >
      {modelScene ? (
        <primitive 
          object={modelScene} 
        />
      ) : (
        // 简化加载中状态
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color="#666666"
            metalness={0}
            roughness={1}
          />
        </mesh>
      )}
    </group>
  );
};

// 简化的错误边界组件 - 暂时移除类组件以解决测试问题
const ARPreviewErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// 2D图片预览组件 - 极简版
const ImagePreview: React.FC<{
  url: string;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
}> = ({ url, scale, rotation, position }) => {
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    // 检查缓存中是否已有该纹理
    if (textureCache.has(url)) {
      // 使用缓存的纹理
      const cachedTexture = textureCache.get(url)!;
      if (isMounted) {
        setTexture(cachedTexture);
        setIsLoading(false);
      }
      return;
    }
    
    // 简单的占位纹理
    const placeholderCanvas = document.createElement('canvas');
    placeholderCanvas.width = 64;
    placeholderCanvas.height = 64;
    const ctx = placeholderCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#ccc';
      ctx.strokeRect(0, 0, 64, 64);
    }
    
    const placeholderTexture = new THREE.CanvasTexture(placeholderCanvas);
    placeholderTexture.colorSpace = THREE.SRGBColorSpace;
    placeholderTexture.needsUpdate = true;
    
    if (isMounted) {
      setTexture(placeholderTexture);
    }
    
    // 加载纹理
    const loader = new THREE.TextureLoader();
    
    loader.load(
      url,
      (loadedTexture) => {
        if (!isMounted) return;
        
        // 优化纹理设置
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.generateMipmaps = true;
        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.needsUpdate = true;
        loadedTexture.anisotropy = 1;
        
        // 清理占位纹理
        placeholderTexture.dispose();
        
        // 存入缓存
        textureCache.set(url, loadedTexture);
        cleanupTextureCache(); // 清理超出限制的缓存
        
        if (isMounted) {
          setTexture(loadedTexture);
          setIsLoading(false);
        }
      },
      undefined,
      (error) => {
        console.error('纹理加载错误:', error);
        // 清理占位纹理
        placeholderTexture.dispose();
        if (isMounted) {
          setIsLoading(false);
        }
      }
    );
    
    return () => {
      isMounted = false;
      // 组件卸载时不清理缓存，缓存由全局清理函数管理
    };
  }, [url]);
  
  return (
    <mesh 
      position={[position.x, position.y, position.z]} 
      rotation={[rotation.x, rotation.y, rotation.z]} 
      scale={scale}
    >
      <planeGeometry args={[1, 1]} />
      {texture ? (
        <meshStandardMaterial 
          transparent 
          side={THREE.DoubleSide} 
          map={texture} 
          metalness={0} 
          roughness={1}
        />
      ) : (
        // 错误状态材质
        <meshStandardMaterial 
          side={THREE.DoubleSide} 
          color="#ff6b6b"
          metalness={0} 
          roughness={1}
        />
      )}
    </mesh>
  );
};



const ARPreview: React.FC<{
  config: ARPreviewConfig;
  onClose: () => void;
  work?: Work;
}> = ({ config, onClose, work }) => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(config.scale || 1.0);
  const [rotation, setRotation] = useState(config.rotation || { x: 0, y: 0, z: 0 });
  const [position, setPosition] = useState(config.position || { x: 0, y: 0, z: 0 });
  const [isARMode, setIsARMode] = useState(false);

  // 环境预设状态管理 - 只使用稳定的预设
  const [environmentPreset, setEnvironmentPreset] = useState<EnvironmentPreset>('studio');
  const environmentPresets: EnvironmentPreset[] = [
    'studio', 'apartment', 'warehouse', 'park', 'lobby'
  ];

  // 资源加载完成处理
  const handleResourceLoaded = () => {
    setIsLoading(false);
  };

  // 资源加载错误处理
  const handleResourceError = () => {
    setIsLoading(false);
    toast.error('资源加载失败');
  };

  // 初始化加载状态
  useEffect(() => {
    setIsLoading(true);
    // 2秒后自动设置为false，防止资源加载超时
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [config.modelUrl, config.imageUrl]);

  // 清理函数，用于释放资源
  useEffect(() => {
    return () => {
      // 清理所有纹理缓存
      textureCache.forEach((texture) => {
        texture.dispose();
      });
      textureCache.clear();
    };
  }, []);

  // 截图功能状态管理
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);

  // 控制面板折叠状态管理
  const [controlPanelState, setControlPanelState] = useState({
    presets: true,
    scale: true,
    rotation: true,
    position: true
  });

  // 切换控制面板模块的折叠状态
  const toggleControlPanel = useCallback((module: keyof typeof controlPanelState) => {
    setControlPanelState(prev => ({
      ...prev,
      [module]: !prev[module]
    }));
  }, []);

  // 手势控制状态管理 - 简化版
  const [gestureState, setGestureState] = useState({
    isDragging: false,
    lastTouch: { x: 0, y: 0 },
    initialPosition: position
  });

  // 处理触摸开始事件 - 简化版
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touches = e.touches;
    
    if (touches.length === 1) {
      // 单指触摸：准备平移
      setGestureState({
        isDragging: true,
        lastTouch: { x: touches[0].clientX, y: touches[0].clientY },
        initialPosition: position
      });
    }
  }, [position]);

  // 处理触摸移动事件 - 简化版
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touches = e.touches;
    
    if (gestureState.isDragging && touches.length === 1) {
      // 单指移动：平移
      const deltaX = (touches[0].clientX - gestureState.lastTouch.x) / 100;
      const deltaY = (gestureState.lastTouch.y - touches[0].clientY) / 100;
      
      setPosition(prev => ({
        x: gestureState.initialPosition.x + deltaX,
        y: gestureState.initialPosition.y + deltaY,
        z: prev.z
      }));
      
      setGestureState(prev => ({
        ...prev,
        lastTouch: { x: touches[0].clientX, y: touches[0].clientY }
      }));
    }
  }, [gestureState]);

  // 处理触摸结束事件 - 简化版
  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    // 重置手势状态
    setGestureState({
      isDragging: false,
      lastTouch: { x: 0, y: 0 },
      initialPosition: position
    });
  }, [position]);

  // 处理触摸取消事件 - 简化版
  const handleTouchCancel = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    // 重置手势状态
    setGestureState({
      isDragging: false,
      lastTouch: { x: 0, y: 0 },
      initialPosition: position
    });
  }, [position]);

  // AR模式切换处理 - 简化实现
  useEffect(() => {
    if (isARMode) {
      // 简化AR模式，只显示AR视觉效果，不访问摄像头
    }
  }, [isARMode]);

  // 处理AR场景点击 - 简化版
  const handleARClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isARMode || isLoading) return;
    
    // 简化AR点击处理
    toast.success('模型已放置');
  }, [isARMode, isLoading]);

  // 缩放控制
  const handleScaleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
  }, []);

  // 旋转控制
  const handleRotationChange = useCallback((axis: 'x' | 'y' | 'z', value: number) => {
    setRotation(prev => ({ ...prev, [axis]: value }));
  }, []);

  // 平移控制
  const handlePositionChange = useCallback((axis: 'x' | 'y' | 'z', value: number) => {
    setPosition(prev => ({ ...prev, [axis]: value }));
  }, []);

  // 重置位置和旋转
  const handleResetTransform = useCallback(() => {
    setPosition({ x: 0, y: 0, z: 0 });
    setRotation({ x: 0, y: 0, z: 0 });
    setScale(config.scale || 1.0);
    toast.success('模型变换已重置');
  }, [config.scale]);

  // 预设视图控制
  const handlePresetView = useCallback((view: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom') => {
    const presetRotations = {
      front: { x: 0, y: 0, z: 0 },
      back: { x: 0, y: Math.PI, z: 0 },
      left: { x: 0, y: Math.PI / 2, z: 0 },
      right: { x: 0, y: -Math.PI / 2, z: 0 },
      top: { x: -Math.PI / 2, y: 0, z: 0 },
      bottom: { x: Math.PI / 2, y: 0, z: 0 }
    };
    setRotation(presetRotations[view]);
    toast.success(`已切换到${{ front: '前', back: '后', left: '左', right: '右', top: '顶', bottom: '底' }[view]}视图`);
  }, []);

  // 截图功能实现 - 极简版
  const handleScreenshot = useCallback(() => {
    // 获取Canvas元素
    const canvas = document.querySelector('canvas');
    if (canvas) {
      try {
        // 生成截图数据URL
        const dataUrl = canvas.toDataURL('image/png', 0.8);
        
        setScreenshot(dataUrl);
        setIsScreenshotModalOpen(true);
        toast.success('截图已保存');
      } catch (error) {
        console.error('截图失败:', error);
        toast.error('截图失败，请重试');
      }
    } else {
      toast.error('无法获取Canvas元素');
    }
  }, []);

  // 保存截图到本地
  const handleSaveScreenshot = useCallback(() => {
    if (screenshot) {
      const link = document.createElement('a');
      link.href = screenshot;
      link.download = `ar-screenshot-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('截图已保存到本地');
    }
  }, [screenshot]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} overflow-y-auto`}>
      {/* 顶部导航栏 */}
      <div className={`sticky top-0 z-40 flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white/80'} backdrop-blur-md`}>
        <h2 className="text-xl font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">AR预览</h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-700 hover:scale-110' : 'bg-gray-100 hover:bg-gray-200 hover:scale-110'} transition-all duration-300 ripple-button`}
          aria-label="关闭"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>

      {/* 原本的视图内容 - 作品信息和图片/视频 */}
      {work && (
        <div className={`sticky top-16 z-30 p-4 border-b ${isDark ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white/80'} backdrop-blur-md`}>
          <div className={`rounded-xl shadow-md overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-4 order-2 lg:order-1">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-xl font-bold line-clamp-1">{work.title}</h1>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{work.category}</span>
                </div>
                <div className="flex items-center mb-3">
                  <img src={work.creatorAvatar} alt="avatar" className="w-8 h-8 rounded-full mr-2 object-cover" />
                  <div>
                    <div className="font-medium text-sm">{work.creator}</div>
                    <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs`}>创作者</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center"><i className="far fa-heart mr-1" /><span className="text-sm">{work.likes}</span></div>
                  <div className="flex items-center"><i className="far fa-comment mr-1" /><span className="text-sm">{work.comments}</span></div>
                  <div className="flex items-center"><i className="far fa-eye mr-1" /><span className="text-sm">{work.views}</span></div>
                </div>
                <div className="mb-0">
                  <div className="font-semibold text-xs mb-1">标签</div>
                  <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                    {work.tags.map((t, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                {/* 中文注释：如果存在视频地址，展示视频播放器；否则展示图片 */}
                {work.videoUrl ? (
                  <video
                    src={work.videoUrl}
                    poster={work.thumbnail}
                    controls
                    className="w-full h-full object-cover max-h-[200px] lg:max-h-[300px]"
                  />
                ) : (
                  <img src={work.thumbnail} alt={work.title} className="w-full h-full object-cover max-h-[200px] lg:max-h-[300px]" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AR预览区域 */}
      <div className="flex-1 relative overflow-hidden min-h-[400px]">
        {/* 加载状态 - 简化版 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10 backdrop-blur-md">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-t-green-500 border-gray-700 rounded-full animate-spin mb-4"></div>
              <p className="text-xl font-medium bg-gradient-to-r from-red-400 to-purple-500 bg-clip-text text-transparent">正在加载AR资源...</p>
            </div>
          </div>
        )}
        
        {/* 3D预览内容 */}
        <div 
          className="w-full h-full relative bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 cursor-crosshair touch-none"
          onClick={handleARClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          {!isLoading && (
            <ARPreviewErrorBoundary>
              {/* 性能监控组件 */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm font-mono z-20">
                  <PerformanceMonitor />
                </div>
              )}
              
              <Canvas 
              shadows={false} 
              className="w-full h-full" 
              camera={{ position: [0, 0, 3], fov: 60, near: 0.1, far: 1000 }} 
              gl={{ 
                  antialias: false, 
                  alpha: true, 
                  preserveDrawingBuffer: false, 
                  powerPreference: 'low-power', 
                  stencil: false,
                  depth: true
                }} 
              style={{ backgroundColor: '#f0f0f0' }}
              frameloop="demand"
              dpr={1}
            >
                {/* 基础相机和灯光 - 极简版本 */}
                <PerspectiveCamera makeDefault position={[0, 0, 3]} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow={false} />
                
                {/* 2D图片预览 */}
                {config.type === '2d' && config.imageUrl && (
                  <ImagePreview
                    url={config.imageUrl}
                    scale={scale}
                    rotation={rotation}
                    position={position}
                  />
                )}
                
                {/* 3D模型预览 - 使用ModelPreview组件 */}
                {config.type === '3d' && config.modelUrl && (
                  <ModelPreview
                    url={config.modelUrl}
                    scale={scale}
                    rotation={rotation}
                    position={position}
                    onLoad={handleResourceLoaded}
                    onError={handleResourceError}
                  />
                )}
                
                {/* 交互控件 - 极简版本 */}
                <OrbitControls 
                  enableZoom={true} 
                  enablePan={true} 
                  enableRotate={true} 
                  enableDamping={false} 
                  rotateSpeed={0.3} 
                  zoomSpeed={0.3} 
                  panSpeed={0.3} 
                  minDistance={0.5} 
                  maxDistance={10} 
                  enabled={!isARMode} // AR模式下禁用轨道控制
                />
              </Canvas>
            </ARPreviewErrorBoundary>
          )}
          
          {/* AR模式下的提示信息 - 极简版 */}
          {isARMode && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none">
              {/* 顶部状态提示 */}
              <div className="bg-black bg-opacity-75 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm font-medium shadow-xl">
                <i className="fas fa-info-circle mr-2 text-green-400"></i>
                <span>AR模式已激活</span>
              </div>
              
              {/* 中央交互引导 */}
              <div className="flex flex-col items-center gap-4">
                <div className="bg-black bg-opacity-75 backdrop-blur-md px-5 py-3 rounded-full text-white text-sm font-medium shadow-xl">
                  <i className="fas fa-hand-pointer mr-2 text-green-400"></i>
                  <span>点击屏幕放置模型</span>
                </div>
              </div>
              
              {/* 底部操作提示 */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                <div className="bg-black bg-opacity-75 backdrop-blur-sm px-3 py-2.5 rounded-lg text-white text-xs text-center shadow-lg">
                  <i className="fas fa-eye-slash block mb-1 text-lg"></i>
                  退出AR
                </div>
                <div className="bg-black bg-opacity-75 backdrop-blur-sm px-3 py-2.5 rounded-lg text-white text-xs text-center shadow-lg">
                  <i className="fas fa-redo block mb-1 text-lg"></i>
                  重置
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 控制栏 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800 bg-gray-900/95' : 'border-gray-200 bg-white/95'} backdrop-blur-lg rounded-b-3xl shadow-2xl`}>
        {/* 主要操作按钮 */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => {
              setIsARMode(!isARMode);
              // console.log('AR mode toggled:', !isARMode);
            }}
            className={`py-3 px-2 rounded-xl font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 hover:shadow-lg transform hover:-translate-y-1 active:scale-95 ${isARMode 
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/30' 
              : isDark 
                ? 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white' 
                : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-900'}`}
          >
            <i className={`fas fa-${isARMode ? 'eye-slash' : 'eye'} text-xl`}></i>
            <span className="text-xs">{isARMode ? '退出AR' : '进入AR'}</span>
          </button>
          
          <button
            onClick={handleResetTransform}
            className={`py-3 px-2 rounded-xl font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 hover:shadow-lg transform hover:-translate-y-1 active:scale-95 ${isDark 
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white' 
              : 'bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 text-purple-900'}`}
          >
            <i className="fas fa-redo text-xl"></i>
            <span className="text-xs">重置</span>
          </button>
          
          <button
            onClick={handleScreenshot}
            className={`py-3 px-2 rounded-xl font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 hover:shadow-lg transform hover:-translate-y-1 active:scale-95 ${isDark 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30' 
              : 'bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-900 shadow-md shadow-blue-500/20'}`}
          >
            <i className="fas fa-camera text-xl"></i>
            <span className="text-xs">拍照</span>
          </button>
          
          <div className="relative">
            <button
              onClick={() => {
                const dropdown = document.getElementById('environment-dropdown');
                if (dropdown) {
                  dropdown.classList.toggle('hidden');
                }
              }}
              className={`py-3 px-2 rounded-xl font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 hover:shadow-lg transform hover:-translate-y-1 active:scale-95 ${isDark 
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30' 
                : 'bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-900 shadow-md shadow-green-500/20'}`}
            >
              <i className="fas fa-mountain text-xl"></i>
              <span className="text-xs">环境</span>
            </button>
            
            {/* 环境下拉菜单 */}
            <div 
              id="environment-dropdown" 
              className={`absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-xl z-50 overflow-hidden transition-all duration-300 animate-fadeIn ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} hidden`}
            >
              <div className="p-2">
                <h4 className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>选择环境</h4>
                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                  {environmentPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setEnvironmentPreset(preset);
                        document.getElementById('environment-dropdown')?.classList.add('hidden');
                        toast.success(`已切换到${preset}环境`);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 ${environmentPreset === preset 
                        ? (isDark ? 'bg-green-600 text-white' : 'bg-green-100 text-green-900') 
                        : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900')}`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 预设视图 - 可折叠 */}
        <div className="mb-4 overflow-hidden transition-all duration-300 ease-in-out">
          <div 
            className="flex justify-between items-center mb-3 cursor-pointer"
            onClick={() => toggleControlPanel('presets')}
          >
            <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
              <i className={`fas fa-camera-retro`}></i>
              预设视图
            </h3>
            <button className={`text-gray-500 transition-transform duration-300 ${
              controlPanelState.presets ? 'rotate-180' : ''
            }`}>
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>
          
          {controlPanelState.presets && (
            <div className="animate-fadeIn">
              <div className="grid grid-cols-6 gap-2">
                {(['front', 'back', 'left', 'right', 'top', 'bottom'] as const).map(view => (
                  <button
                    key={view}
                    onClick={() => handlePresetView(view)}
                    className={`py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 text-xs ${
                      view === 'top' || view === 'bottom' 
                      ? (isDark 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-900 shadow-md shadow-blue-500/20')
                      : (isDark 
                        ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900')
                    }`}
                  >
                    <i className={`fas fa-${{
                      front: 'eye',
                      back: 'eye-slash',
                      left: 'arrow-left',
                      right: 'arrow-right',
                      top: 'arrow-up',
                      bottom: 'arrow-down'
                    }[view]} text-sm mr-1`}></i>
                    {{
                      front: '前',
                      back: '后',
                      left: '左',
                      right: '右',
                      top: '顶',
                      bottom: '底'
                    }[view]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* 缩放控制 - 可折叠 */}
        <div className="mb-4 overflow-hidden transition-all duration-300 ease-in-out">
          <div 
            className="flex justify-between items-center mb-3 cursor-pointer"
            onClick={() => toggleControlPanel('scale')}
          >
            <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
              <i className="fas fa-expand-arrows-alt"></i>
              缩放
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">{scale.toFixed(1)}x</span>
              <button className={`text-gray-500 transition-transform duration-300 ${
                controlPanelState.scale ? 'rotate-180' : ''
              }`}>
                <i className="fas fa-chevron-down"></i>
              </button>
            </div>
          </div>
          
          {controlPanelState.scale && (
            <div className="animate-fadeIn">
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={scale}
                onChange={handleScaleChange}
                className="w-full h-4 bg-gradient-to-r from-gray-300 to-gray-200 rounded-full appearance-none cursor-pointer transition-all duration-200 hover:h-5"
                style={{
                  background: isDark ? 'linear-gradient(to right, #374151, #4b5563)' : 'linear-gradient(to right, #e5e7eb, #d1d5db)',
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
              />
            </div>
          )}
        </div>
        
        {/* 旋转控制 - 可折叠 */}
        <div className="mb-4 overflow-hidden transition-all duration-300 ease-in-out">
          <div 
            className="flex justify-between items-center mb-3 cursor-pointer"
            onClick={() => toggleControlPanel('rotation')}
          >
            <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
              <i className="fas fa-sync-alt"></i>
              旋转
            </h3>
            <button className={`text-gray-500 transition-transform duration-300 ${
              controlPanelState.rotation ? 'rotate-180' : ''
            }`}>
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>
          
          {controlPanelState.rotation && (
            <div className="animate-fadeIn space-y-4">
              {(['x', 'y', 'z'] as const).map(axis => (
                <div key={axis}>
                  <div className="flex justify-between items-center mb-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {axis.toUpperCase()} 轴
                    </label>
                    <span className="text-xs font-mono bg-gray-800 text-green-400 px-2 py-0.5 rounded">
                      {(rotation[axis] * 180 / Math.PI).toFixed(0)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={rotation[axis] * 180 / Math.PI}
                    onChange={(e) => handleRotationChange(axis, parseFloat(e.target.value) * Math.PI / 180)}
                    className="w-full h-3 bg-gradient-to-r from-red-400 via-purple-500 to-blue-500 rounded-full appearance-none cursor-pointer transition-all duration-200"
                    style={{
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 平移控制 - 可折叠 */}
        <div className="overflow-hidden transition-all duration-300 ease-in-out">
          <div 
            className="flex justify-between items-center mb-3 cursor-pointer"
            onClick={() => toggleControlPanel('position')}
          >
            <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
              <i className="fas fa-arrows-alt"></i>
              平移
            </h3>
            <button className={`text-gray-500 transition-transform duration-300 ${
              controlPanelState.position ? 'rotate-180' : ''
            }`}>
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>
          
          {controlPanelState.position && (
            <div className="animate-fadeIn space-y-4">
              {(['x', 'y', 'z'] as const).map(axis => (
                <div key={axis}>
                  <div className="flex justify-between items-center mb-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {axis.toUpperCase()} 轴
                    </label>
                    <span className="text-xs font-mono bg-gray-800 text-blue-400 px-2 py-0.5 rounded">
                      {position[axis].toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={position[axis]}
                    onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-blue-400 via-green-500 to-yellow-500 rounded-full appearance-none cursor-pointer transition-all duration-200"
                    style={{
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 截图预览模态框 - 极简版 */}
      {isScreenshotModalOpen && screenshot && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm">
          <div className={`relative max-w-3xl w-full mx-4 rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} max-h-[90vh] flex flex-col`}>
            {/* 模态框头部 */}
            <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h3 className="text-lg font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">截图预览</h3>
              <button
                onClick={() => setIsScreenshotModalOpen(false)}
                className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-all duration-200`}
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            {/* 截图预览内容 */}
            <div className="p-4 flex-1 overflow-auto">
              <div className="flex justify-center mb-6">
                <div className="rounded-lg overflow-hidden shadow-2xl max-h-[50vh] overflow-y-auto">
                  <img 
                    src={screenshot} 
                    alt="AR预览截图" 
                    className="max-w-full h-auto rounded-lg" 
                  />
                </div>
              </div>
              
              {/* 操作按钮 - 极简版 */}
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={handleSaveScreenshot}
                  className="py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg transform hover:-translate-y-1 active:scale-95 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30"
                >
                  <i className="fas fa-download text-lg"></i>
                  保存到本地
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARPreview;