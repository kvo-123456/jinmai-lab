import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// 简化的AR预览配置类型 - 兼容原ARPreviewConfig类型
export interface SimplifiedARPreviewConfig {
  modelUrl?: string;
  imageUrl?: string;
  type: '3d' | '2d';
  scale?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  animations?: boolean;
  backgroundColor?: string;
  ambientLightIntensity?: number;
  directionalLightIntensity?: number;
}

// 简化的AR预览组件
const SimplifiedARPreview: React.FC<{
  config: SimplifiedARPreviewConfig;
  onClose: () => void;
  work?: any;
}> = ({ config, onClose, work }) => {
  const [isARMode, setIsARMode] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // 检查AR支持
  useEffect(() => {
    const checkARSupport = async () => {
      try {
        // 检查WebXR AR会话支持
        const supported = await navigator.xr?.isSessionSupported('immersive-ar') || false;
        setIsSupported(supported);
      } catch (err) {
        console.warn('AR support check failed:', err);
        setIsSupported(false);
      }
    };

    checkARSupport();
  }, []);

  // 加载纹理
  useEffect(() => {
    if (config.type === '2d' && config.imageUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(
        config.imageUrl,
        (loadedTexture) => {
          setTexture(loadedTexture);
          setLoading(false);
        },
        undefined,
        (error) => {
          console.error('Error loading texture:', error);
          setError('资源加载失败，请重试');
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, [config.imageUrl, config.type]);

  // 处理模态框点击事件，防止事件冒泡影响底层main元素
  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // 阻止背景滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div 
      ref={modalRef}
      onClick={handleModalClick}
      className="fixed inset-0 z-50 flex flex-col bg-black"
      style={{ pointerEvents: 'auto' }}
    >
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white z-10">
        <h2 className="text-xl font-bold">AR预览</h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          关闭
        </button>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 relative">
        {/* Canvas */}
        <Canvas
          camera={{ position: [5, 5, 5] }}
          gl={{ antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* 光照 */}
          <ambientLight intensity={1} />
          <directionalLight position={[10, 10, 10]} intensity={1} />

          {/* 控制器 */}
          <OrbitControls />

          {/* 地面网格 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>

          {/* 2D图像 */}
          {config.type === '2d' && texture && (
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[3, 3]} />
              <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* 3D模型占位符 */}
          {config.type === '3d' && (
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial color="#4f46e5" />
            </mesh>
          )}
        </Canvas>

        {/* AR按钮 */}
        <div className="absolute bottom-4 left-4 z-10">
          {isSupported === null ? (
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed">
              检查AR支持...
            </button>
          ) : isSupported ? (
            <button
              onClick={() => {
                setIsARMode(true);
                // 简化版本，不实际进入AR模式，只显示提示
                alert('AR模式需要在支持WebXR的设备上运行');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              进入AR模式
            </button>
          ) : (
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed">
              设备不支持AR
            </button>
          )}
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="text-white text-center">
              <div className="animate-spin w-12 h-12 border-4 border-t-transparent border-white rounded-full mx-auto mb-3"></div>
              <p>正在加载资源...</p>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="text-white text-center p-6 bg-red-900 bg-opacity-70 rounded-lg">
              <p className="text-xl font-bold mb-2">加载失败</p>
              <p>{error}</p>
              <button 
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  // 重新加载资源
                  if (config.type === '2d' && config.imageUrl) {
                    const loader = new THREE.TextureLoader();
                    loader.load(
                      config.imageUrl,
                      (loadedTexture) => {
                        setTexture(loadedTexture);
                        setLoading(false);
                      },
                      undefined,
                      (err) => {
                        console.error('Error reloading texture:', err);
                        setError('资源加载失败，请重试');
                        setLoading(false);
                      }
                    );
                  } else {
                    setLoading(false);
                  }
                }} 
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AR DOM Overlay容器 - 独立容器，避免影响整个页面 */}
      <div 
        ref={overlayRef} 
        className="xr-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000,
          display: isARMode ? 'block' : 'none'
        }}
      >
        {/* AR模式下的UI元素可以放在这里 */}
        {isARMode && (
          <div 
            className="absolute top-4 left-0 right-0 flex justify-center"
            style={{ pointerEvents: 'auto' }}
          >
            <button
              onClick={() => setIsARMode(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg"
            >
              退出AR模式
            </button>
          </div>
        )}
      </div>

      {/* 样式隔离 - 确保AR模式不影响页面其他部分 */}
      <style>{`
        /* 隔离AR预览的样式，确保不影响main元素 */
        .xr-overlay {
          all: unset;
        }
        
        /* 确保模态框不影响页面其他元素的z-index */
        [data-ar-mode="true"] {
          /* AR模式下的全局样式 */
        }
      `}</style>
    </div>
  );
};

export default SimplifiedARPreview;