import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { XR, ARButton } from '@react-three/xr';
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
}> = ({ config, onClose }) => {
  const [isARMode, setIsARMode] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);

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
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, [config.imageUrl, config.type]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
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
          {...(isARMode && {
            sessionInit: {
              requiredFeatures: ['hit-test'],
              optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
              domOverlay: { root: document.body }
            } as any
          })}
        >
          {/* 光照 */}
          <ambientLight intensity={1} />
          <directionalLight position={[10, 10, 10]} intensity={1} />

          {/* XR组件 */}
          {isARMode && <XR />}

          {/* 控制器 */}
          {!isARMode && <OrbitControls />}

          {/* 地面网格 */}
          {!isARMode && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#e2e8f0" />
            </mesh>
          )}

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
        {!isARMode && (
          <div className="absolute bottom-4 left-4">
            <ARButton
              sessionInit={{
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
                domOverlay: { root: document.body }
              } as any}
              onClick={() => setIsARMode(true)}
            >
              进入AR模式
            </ARButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplifiedARPreview;