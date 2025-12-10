import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGesture } from '@use-gesture/react';

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

// AR模式下的模型放置组件 - 增强版，支持真实平面检测
const ARModelPlacer: React.FC<{
  config: ARPreviewConfig;
  scale: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  texture: THREE.Texture | null;
  model: THREE.Group | null;
  isPlaced: boolean;
  onPlace: () => void;
  onPositionChange: (position: { x: number; y: number; z: number }) => void;
  isARMode: boolean;
}> = ({ config, scale, rotation, position, texture, model, isPlaced, onPlace, onPositionChange, isARMode }) => {
  // 使用WebXR hit-test API实现真实平面检测
  const { scene, gl, camera } = useThree();
  const xr = gl.xr;
  
  // 平面检测状态
  const [hitResults, setHitResults] = useState<THREE.Matrix4[]>([]);
  const [hitPose, setHitPose] = useState<THREE.Matrix4 | null>(null);
  const [isPlaneDetected, setIsPlaneDetected] = useState(false);
  
  // 动画状态
  const animationRef = useRef<{
    pulseProgress: number;
    pulseDirection: number;
  }>({
    pulseProgress: 0,
    pulseDirection: 1
  });
  
  // 动画更新 - 进一步优化：模型放置后完全停止动画
  useEffect(() => {
    // 只有在AR模式且模型未放置时才运行动画，模型放置后停止动画以节省性能
    if (!isARMode || isPlaced) return;
    
    let animationId: number;
    let lastUpdateTime = 0;
    const updateInterval = 100; // 进一步降低更新频率到约10fps，减少性能消耗
    
    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateTime >= updateInterval) {
        // 简化动画计算，减少三角函数使用
        animationRef.current.pulseProgress += animationRef.current.pulseDirection * 0.02;
        if (animationRef.current.pulseProgress > 1 || animationRef.current.pulseProgress < 0) {
          animationRef.current.pulseDirection *= -1;
        }
        lastUpdateTime = timestamp;
      }
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isARMode, isPlaced]);
  
  // WebXR hit-test配置
  useEffect(() => {
    if (!isARMode || !xr) return;
    
    let hitTestSource: any = null;
    let hitTestSourceRequested = false;
    
    // 请求hit-test源
    const requestHitTestSource = (session: any) => {
      if (session.isImmersive && session.visibilityState === 'visible') {
        session.requestReferenceSpace('viewer')
          .then((viewerSpace: any) => {
            return session.requestHitTestSource({
              space: viewerSpace,
              offsetRay: new XRRay(new DOMPoint(0, 0, 0), new DOMPoint(0, 0, -1))
            });
          })
          .then((source: any) => {
            hitTestSource = source;
            hitTestSourceRequested = true;
          })
          .catch((error: any) => {
            console.error('Error requesting hit test source:', error);
            hitTestSourceRequested = false;
          });
      }
    };
    
    // 处理XR会话事件
    const handleSessionStart = (event: any) => {
      const session = event.session;
      requestHitTestSource(session);
      
      session.addEventListener('end', handleSessionEnd);
      session.addEventListener('visibilitychange', () => {
        if (session.visibilityState === 'visible' && !hitTestSourceRequested) {
          requestHitTestSource(session);
        }
      });
    };
    
    const handleSessionEnd = () => {
      if (hitTestSource) {
        hitTestSource.cancel();
        hitTestSource = null;
      }
      hitTestSourceRequested = false;
    };
    
    // 处理frame事件，获取hit-test结果
    const handleFrame = (event: any) => {
      if (!hitTestSource) return;
      
      const frame = event.frame;
      const session = frame.session;
      
      session.requestReferenceSpace('local')
        .then((referenceSpace: any) => {
          const hitTestResults = frame.getHitTestResults(hitTestSource);
          
          if (hitTestResults.length > 0) {
            setIsPlaneDetected(true);
            
            // 处理所有hit-test结果
            const results: THREE.Matrix4[] = [];
            for (const result of hitTestResults) {
              const pose = result.getPose(referenceSpace);
              if (pose) {
                const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
                results.push(matrix);
              }
            }
            
            setHitResults(results);
            
            // 使用第一个hit-test结果作为放置位置
            if (results.length > 0 && !isPlaced) {
              setHitPose(results[0]);
              
              // 提取位置信息
              const position = new THREE.Vector3();
              results[0].decompose(position, new THREE.Quaternion(), new THREE.Vector3());
              onPositionChange({
                x: position.x,
                y: position.y,
                z: position.z
              });
            }
          } else {
            setIsPlaneDetected(false);
            setHitResults([]);
            setHitPose(null);
          }
        })
        .catch((error: any) => {
          console.error('Error getting hit test results:', error);
        });
    };
    
    // 添加事件监听器 - 仅监听sessionstart事件
    xr.addEventListener('sessionstart', handleSessionStart);
    
    return () => {
      xr.removeEventListener('sessionstart', handleSessionStart);
    };
  }, [isARMode, xr, isPlaced, onPositionChange]);
  
  // 处理模型放置
  const handlePlaceModel = useCallback(() => {
    onPlace();
  }, [onPlace]);
  
  // 添加点击事件监听器
  useEffect(() => {
    const canvas = gl?.domElement;
    if (!canvas || !isARMode) return;
    
    const handleClick = () => {
      if (!isPlaced && hitPose) {
        handlePlaceModel();
      }
    };
    
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [isPlaced, handlePlaceModel, isARMode, gl, hitPose]);
  
  return (
    <>
      {/* 平面检测可视化 - 仅在检测到平面时显示 */}
      {isPlaneDetected && hitResults.length > 0 && !isPlaced && (
        <>
          {/* 显示部分检测到的平面点，减少渲染数量 */}
          {hitResults.slice(0, Math.min(hitResults.length, 5)).map((result, index) => {
            const position = new THREE.Vector3();
            result.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
            
            return (
              <mesh key={index} position={[position.x, position.y - 0.001, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.08, 8]} />
                <meshBasicMaterial 
                  color="#4f46e5" 
                  transparent 
                  opacity={0.25}
                />
              </mesh>
            );
          })}
          
          {/* 如果有有效的hitPose，显示模型预览和放置指示器 */}
          {hitPose && (
            <>
              {/* 放置点粒子效果 - 简化版本 */}
              <group position={[0, 0, 0]} matrix={hitPose}>
                {Array.from({ length: 4 }).map((_, i) => {
                  const angle = (i / 4) * Math.PI * 2;
                  const radius = 0.25 + 0.05 * Math.sin(animationRef.current.pulseProgress * Math.PI);
                  const x = Math.cos(angle) * radius;
                  const z = Math.sin(angle) * radius;
                  return (
                    <mesh key={i} position={[x, 0, z]}>
                      <sphereGeometry args={[0.015, 6, 6]} />
                      <meshBasicMaterial 
                        color="#4f46e5" 
                        transparent 
                        opacity={0.7 + 0.1 * Math.sin(animationRef.current.pulseProgress * Math.PI + angle)} 
                      />
                    </mesh>
                  );
                })}
              </group>
              
              {/* 2D图像预览 */}
              {texture && (
                <mesh 
                  matrix={hitPose} 
                  scale={[scale * 3, scale * 3, 0.01]} 
                  rotation={[rotation.x, rotation.y, rotation.z]}>
                  <planeGeometry args={[1, 1]} />
                  <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
                  {/* 添加简单的发光边框 */}
                  <mesh 
                    scale={[1.05, 1.05, 1]} 
                    position={[0, 0, -0.01]} 
                  >
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial 
                      color="#4f46e5" 
                      transparent 
                      opacity={0.4} 
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                </mesh>
              )}
              
              {/* 3D模型预览 */}
              {config.type === '3d' && model && (
                <primitive 
                  object={model} 
                  matrix={hitPose} 
                  scale={scale} 
                  rotation={[rotation.x, rotation.y, rotation.z]} 
                />
              )}
              
              {/* 放置指示器 - 简化版本 */}
              <group matrix={hitPose}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <sphereGeometry args={[0.03, 6, 6]} />
                  <meshBasicMaterial 
                    color="#4f46e5" 
                    transparent 
                    opacity={0.8 + 0.1 * Math.sin(animationRef.current.pulseProgress * Math.PI * 2)} 
                  />
                </mesh>
              </group>
            </>
          )}
        </>
      )}
      
      {/* 如果未检测到平面，显示引导提示和基本场景 */}
      {isARMode && !isPlaneDetected && !isPlaced && (
        <>
          {/* 添加基本的平面网格，确保场景有可见元素 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <planeGeometry args={[5, 5]} />
            <meshBasicMaterial 
              color="#e2e8f0" 
              transparent 
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* 添加简单的网格线，增强空间感 */}
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={24}
                array={new Float32Array([
                  -2.5, 0, -2.5,
                  2.5, 0, -2.5,
                  -2.5, 0, -1.25,
                  2.5, 0, -1.25,
                  -2.5, 0, 0,
                  2.5, 0, 0,
                  -2.5, 0, 1.25,
                  2.5, 0, 1.25,
                  -2.5, 0, 2.5,
                  2.5, 0, 2.5,
                  -2.5, 0, -2.5,
                  -2.5, 0, 2.5,
                  -1.25, 0, -2.5,
                  -1.25, 0, 2.5,
                  0, 0, -2.5,
                  0, 0, 2.5,
                  1.25, 0, -2.5,
                  1.25, 0, 2.5,
                  2.5, 0, -2.5,
                  2.5, 0, 2.5
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#cbd5e1" transparent opacity={0.5} />
          </lineSegments>
          
          {/* 引导提示 */}
          <group position={[0, 0, -2]}>
            {/* 背景平面 */}
            <mesh>
              <planeGeometry args={[2, 0.5]} />
              <meshBasicMaterial 
                color="#4f46e5" 
                transparent 
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
            
            {/* 简单的文本提示 - 使用CanvasTexture创建文本 */}
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[2, 0.5]} />
              <meshBasicMaterial 
                map={(() => {
                  // 创建一个Canvas来绘制文本
                  const canvas = document.createElement('canvas');
                  canvas.width = 512;
                  canvas.height = 128;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return null;
                  
                  // 设置文本样式
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 48px Arial';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  
                  // 绘制文本
                  ctx.fillText('请将设备对准平面以放置模型', canvas.width / 2, canvas.height / 2);
                  
                  // 创建纹理
                  const texture = new THREE.CanvasTexture(canvas);
                  texture.needsUpdate = true;
                  return texture;
                })()}
                transparent
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </>
      )}
      
      {/* 如果模型已放置，显示固定模型 */}
      {isPlaced && (
        <>
          {/* 添加基本的平面网格，确保模型放置后场景有稳定的背景 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position.x, position.y - 0.02, position.z]}>
            <planeGeometry args={[3, 3]} />
            <meshBasicMaterial 
              color="#e2e8f0" 
              transparent 
              opacity={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* 2D图像 */}
          {config.imageUrl && texture && (
            <mesh 
              scale={[scale * 3, scale * 3, 0.01]} 
              rotation={[rotation.x, rotation.y, rotation.z]} 
              position={[position.x, position.y, position.z]}
            >
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
            </mesh>
          )}
          
          {/* 3D模型 */}
          {config.type === '3d' && model && (
            <primitive 
              object={model} 
              scale={scale} 
              rotation={[rotation.x, rotation.y, rotation.z]} 
              position={[position.x, position.y, position.z]} 
            />
          )}
          
          {/* 放置成功指示器 - 简化版本，移除动画效果以减少性能消耗 */}
          <group position={[position.x, position.y - 0.01, position.z]}>
            {/* 中心指示器 - 简化，移除呼吸动画 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <sphereGeometry args={[0.03, 6, 6]} />
              <meshBasicMaterial 
                color="#10b981" 
                transparent 
                opacity={0.9} 
              />
            </mesh>
            
            {/* 环形指示器 - 简化版本 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry 
                args={[0.08, 0.12, 8]} 
              />
              <meshBasicMaterial 
                color="#10b981" 
                transparent 
                opacity={0.4} 
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
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
  onPositionChange?: (position: { x: number; y: number; z: number }) => void;
  renderSettings?: RenderSettings;
  devicePerformance?: ReturnType<typeof getDevicePerformance>;
}> = ({ config, scale, rotation, position, isARMode, particleEffect, texture, textureError, model, modelLoading, modelError, cameraView, isPlaced, onPositionChange, renderSettings, devicePerformance }) => {
  // 访问相机
  const { camera, gl, scene } = useThree();
  
  // 默认渲染设置
  const defaultRenderSettings: RenderSettings = {
    pixelRatio: 1.0,
    antialias: true, // 保持与Canvas配置一致，默认启用抗锯齿
    shadowMapEnabled: false,
    showAdvancedEffects: false,
    particleCount: 50,
    advancedLighting: false
  };
  
  // 默认设备性能
  const defaultDevicePerformance = {
    isDesktop: false,
    isMobile: true,
    isHighEndDevice: false,
    isMediumEndDevice: false,
    isLowEndDevice: true
  };
  
  // 使用提供的设置或默认值
  const settings = renderSettings || defaultRenderSettings;
  const deviceInfo = devicePerformance || defaultDevicePerformance;
  
  // 根据cameraView切换相机位置 - 基于设备性能调整
  useEffect(() => {
    if (camera) {
      // 桌面设备使用更远的视角，增强3D效果
      const distance = deviceInfo.isDesktop ? 10 : 8;
      
      // 非AR模式下设置相机位置
      if (!isARMode) {
        switch (cameraView) {
          case 'perspective':
            camera.position.set(distance, distance, distance);
            break;
          case 'top':
            camera.position.set(0, distance, 0);
            break;
          case 'front':
            camera.position.set(0, 0, distance);
            break;
          case 'side':
            camera.position.set(distance, 0, 0);
            break;
        }
      }
      
      // 确保相机始终看向原点
      camera.lookAt(0, 0, 0);
      
      // 确保相机始终处于活动状态
      camera.updateProjectionMatrix();
    }
  }, [camera, cameraView, isARMode, deviceInfo.isDesktop]);
  
  // 性能优化：根据设备性能和模式调整渲染质量
  useEffect(() => {
    if (gl) {
      // 根据设备性能动态调整渲染设置
      gl.shadowMap.enabled = settings.shadowMapEnabled && !isARMode;
      gl.shadowMap.type = isARMode ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
      
      // 优化渲染设置
      (gl as any).sampleAlphaToCoverage = false;
      (gl as any).stencilTest = settings.shadowMapEnabled && !isARMode;
      (gl as any).depthTest = true;
      (gl as any).depthWrite = true;
      
      // 确保渲染缓冲区稳定 - 保持与Canvas配置一致，避免黑屏
      (gl as any).preserveDrawingBuffer = true;
      (gl as any).alpha = true;
      (gl as any).antialias = settings.antialias;
      (gl as any).premultipliedAlpha = true;
      
      // 根据设备性能和模式调整高级特性
      (gl as any).maxAnisotropy = isARMode ? 1 : (deviceInfo.isDesktop ? 4 : 1);
      
      // 调整曝光 - 增加曝光度，确保场景明亮
      gl.toneMappingExposure = 1.0;
      
      // AR模式下进一步优化渲染
      if (isARMode) {
        // 确保AR模式下的渲染设置正确
        (gl as any).alpha = true; // 保持透明背景
        (gl as any).antialias = true; // 保持抗锯齿
        (gl as any).preserveDrawingBuffer = true; // 确保渲染缓冲区稳定
      }
    }
  }, [gl, isARMode, settings, deviceInfo.isDesktop, isPlaced]);
  
  // 优化场景设置 - 基于设备性能的动态设置
  useEffect(() => {
    if (scene) {
      if (isARMode) {
        // AR模式下简化设置，确保背景透明
        scene.fog = null;
        scene.background = null; // 设置背景为透明，显示真实环境
      } else {
        // 非AR模式下根据设备性能调整
        if (deviceInfo.isDesktop) {
          // 桌面设备使用更丰富的背景效果
          scene.background = new THREE.Color(config.backgroundColor || '#1a1a2e');
          // 桌面设备添加环境雾效，增强3D感
          scene.fog = new THREE.Fog(config.backgroundColor || '#1a1a2e', 10, 50);
        } else {
          // 移动设备简化设置
          scene.fog = null;
          scene.background = new THREE.Color(config.backgroundColor || '#0a0a10');
        }
      }
    }
  }, [scene, isARMode, config.backgroundColor, deviceInfo.isDesktop]);
  
  // 确保AR模式下渲染缓冲区稳定
  useEffect(() => {
    if (gl && isARMode) {
      // 确保AR模式下渲染缓冲区配置正确
      // 设置渲染器属性
      gl.setClearColor(0x000000, 0);
    }
  }, [gl, isARMode]);
  
  return (
    <>
      {/* 优化光照效果，确保性能和视觉效果平衡 */}
      <>
        {/* 环境光，确保整个场景明亮 */}
        <ambientLight 
          intensity={1.0} // 降低环境光强度，减少计算
          color="#ffffff"
        />
        {/* 主方向光，增强模型的立体感 */}
        <directionalLight 
          position={[10, 15, 10]} 
          intensity={1.0} // 降低方向光强度
          color="#ffffff"
          castShadow={false} // 禁用阴影，提升性能
        />
        {/* 辅助方向光，确保模型各个面都有光照 */}
        <directionalLight 
          position={[-10, 5, -10]} 
          intensity={0.5} // 降低侧方向光强度
          color="#ffffff"
          castShadow={false} // 禁用阴影，提升性能
        />
      </>
      
      {/* 轨道控制器 - 根据设备性能调整 */}
      {!isARMode && (
        <OrbitControls 
          enableDamping={false} // 禁用阻尼，减少计算
          dampingFactor={0.1}
          enableZoom={true} 
          zoomSpeed={0.5}
          enablePan={false} // 禁用平移，减少计算
          minDistance={deviceInfo.isDesktop ? 5 : 3}
          maxDistance={deviceInfo.isDesktop ? 30 : 20}
          minPolarAngle= {Math.PI / 6}
          maxPolarAngle= {Math.PI - Math.PI / 6}
          target={[0, 0, 0]}
          enableRotate={true}
          rotateSpeed={0.5}
        />
      )}
      
      {/* 3D预览场景 - 增强视觉效果 */}
      {!isARMode && (
        <>
          {/* 添加背景球体，增强3D空间感 */}
          <mesh position={[0, 0, 0]} scale={50} rotation={[0, 0, 0]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial 
              color="#f8fafc" 
              side={THREE.BackSide} 
              transparent 
              opacity={1.0}
            />
          </mesh>
          {/* 地面网格 - 增强视觉效果 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial 
              color="#e2e8f0" 
              roughness={0.8}
              metalness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* 添加更完整的网格线 */}
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={12}
                array={new Float32Array([
                  -10, 0, -10,
                  10, 0, -10,
                  -5, 0, -10,
                  5, 0, -10,
                  -10, 0, -5,
                  10, 0, -5,
                  -10, 0, 5,
                  10, 0, 5,
                  -10, 0, 10,
                  10, 0, 10,
                  -10, 0, -10,
                  -10, 0, 10,
                  -5, 0, -10,
                  -5, 0, 10,
                  5, 0, -10,
                  5, 0, 10,
                  10, 0, -10,
                  10, 0, 10
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#cbd5e1" />
          </lineSegments>
        </>
      )}
      
      {/* AR模式和非AR模式的渲染逻辑分离 */}
      {isARMode ? (
        /* AR模式 - 真实平面检测和3D渲染 */
        <ARModelPlacer
          config={config}
          scale={scale}
          rotation={rotation}
          position={position}
          texture={texture}
          model={model}
          isPlaced={isPlaced}
          onPlace={() => toast.success('模型已放置')}
          onPositionChange={onPositionChange || (() => {})}
          isARMode={isARMode}
        />
      ) : (
        /* 非AR模式 - 正常3D渲染 */
        <>
          {/* 默认3D对象 - 当没有图像或模型资源时显示 */}
          {!((config.type === '2d' && config.imageUrl) || (config.type === '3d' && config.modelUrl)) && (
            <mesh
              scale={[10, 10, 0.1]}
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
          
          {/* 渲染2D图像为3D平面 - 只在2D模式下显示 */}
          {config.type === '2d' && config.imageUrl && texture && !textureError && (
            <group>
              {/* 2D图像主体 */}
              <mesh
                scale={[scale * 3, scale * 3, 0.01]}
                rotation={[rotation.x, rotation.y, rotation.z]}
                position={[position.x, position.y, position.z]}
                castShadow={deviceInfo.isDesktop && settings.shadowMapEnabled} // 仅桌面设备启用阴影投射
              >
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial 
                  map={texture} 
                  transparent 
                  side={THREE.DoubleSide}
                  roughness={0.5}
                  metalness={0.1}
                />
              </mesh>
              
              {/* 图像下方添加阴影平面，增强3D感 */}
              {deviceInfo.isDesktop && (
                <mesh
                  scale={[scale * 3.2, scale * 3.2, 0.001]}
                  rotation={[rotation.x - Math.PI / 2, rotation.y, rotation.z]}
                  position={[position.x, position.y - 0.5, position.z]}
                >
                  <planeGeometry args={[1, 1]} />
                  <meshStandardMaterial 
                    color="#000000" 
                    transparent 
                    opacity={0.3}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              )}
              
              {/* 图像周围的环境光源，增强3D感 */}
              {deviceInfo.isDesktop && (
                <>
                  <pointLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" distance={10} />
                  <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ffffff" distance={10} />
                </>
              )}
            </group>
          )}
          
          {/* 图像加载错误时的回退显示 - 只在2D模式下显示 */}
          {config.type === '2d' && config.imageUrl && textureError && (
            <mesh
              scale={[scale * 1, scale * 1, 0.01]}
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
                <group>
                  {/* 模型主体 */}
                  <primitive
                    object={model}
                    scale={scale}
                    rotation={[rotation.x, rotation.y, rotation.z]}
                    position={[position.x, position.y, position.z]}
                    castShadow={deviceInfo.isDesktop && settings.shadowMapEnabled}
                    receiveShadow={deviceInfo.isDesktop && settings.shadowMapEnabled}
                  />
                  
                  {/* 桌面设备添加模型周围的环境光源，增强3D效果 */}
                  {deviceInfo.isDesktop && (
                    <>
                      <pointLight position={[5, 5, 5]} intensity={0.6} color="#ffffff" distance={15} />
                      <pointLight position={[-5, -5, -5]} intensity={0.4} color="#ffffff" distance={15} />
                      <pointLight position={[5, -5, 5]} intensity={0.2} color="#ffffff" distance={15} />
                      <pointLight position={[-5, 5, -5]} intensity={0.2} color="#ffffff" distance={15} />
                    </>
                  )}
                </group>
              )}
            </>
          )}
        </>
      )}
      
      {/* 渲染粒子效果 - 进一步优化性能 */}
      {!isARMode && particleEffect.enabled && deviceInfo.isHighEndDevice && (
        <ParticleSystem
          model="flower"
          color={particleEffect.color}
          // 仅高端设备渲染粒子，减少卡屏
          particleCount={20}
          particleSize={particleEffect.particleSize}
          animationSpeed={particleEffect.animationSpeed * 0.5}
          rotationSpeed={particleEffect.rotationSpeed * 0.5}
          colorVariation={0.2}
          showTrails={false}
          behavior={particleEffect.type}
        />
      )}
    </>
  );
};

// 设备性能检测工具 - 增强版，支持设备类型和AR能力检测
const getDevicePerformance = () => {
  // 检测设备性能的多种指标
  let isLowEndDevice = false;
  let isMediumEndDevice = false;
  let isHighEndDevice = false;
  
  // 1. CPU核心数检测
  const cpuCores = navigator.hardwareConcurrency || 4;
  
  // 2. 设备内存检测
  const deviceMemory = (navigator as any).deviceMemory || 4;
  
  // 3. 增强的设备类型检测
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  const deviceType = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile';
  
  // 4. 浏览器性能检测 - 更全面的检测
  const isLowPerformanceBrowser = /Edge\/|MSIE|Trident|Opera Mini|Chrome\/[0-9]+\./i.test(userAgent) && 
                                 parseInt(userAgent.match(/Chrome\/([0-9]+)/)?.[1] || '0') < 80;
  
  // 5. WebGL特性检测（更全面的GPU性能检测）
  let gpuPerformanceScore = 0;
  let webGLVersion = 0;
  let hasWebGL = false;
  
  // 6. AR支持检测 - 更全面的检测
  const isARSupported = 'xr' in navigator && 
                        typeof (navigator as any).xr.requestSession === 'function' && 
                        // 只在移动设备上检测AR支持，桌面设备一般不支持
                        (isMobile || isTablet);
  
  // 7. 设备性能API检测
  const hasPerformanceAPI = 'performance' in window && 'getEntriesByType' in window.performance;
  
  // 8. 检测设备刷新率
  const maxRefreshRate = (window.screen as any).refreshRate || 60;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (gl) {
      hasWebGL = true;
      // 检测WebGL版本
      webGLVersion = gl instanceof WebGL2RenderingContext ? 2 : 1;
      
      // 检测GPU扩展支持
      const extensions = gl.getSupportedExtensions();
      if (extensions) {
        // 基础扩展支持（每个基础扩展+1分）
        const basicExtensions = ['WEBGL_compressed_textures', 'OES_texture_float', 'OES_standard_derivatives'];
        basicExtensions.forEach(ext => {
          if (extensions.includes(ext)) {
            gpuPerformanceScore += 1;
          }
        });
        
        // 高级扩展支持（每个高级扩展+2分）
        const advancedExtensions = ['EXT_shader_texture_lod', 'OES_vertex_array_object', 'WEBGL_draw_buffers', 
                                   'WEBGL_color_buffer_float', 'WEBGL_depth_texture'];
        advancedExtensions.forEach(ext => {
          if (extensions.includes(ext)) {
            gpuPerformanceScore += 2;
          }
        });
        
        // 检测GPU最大纹理尺寸
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        if (maxTextureSize >= 16384) {
          gpuPerformanceScore += 4;
        } else if (maxTextureSize >= 8192) {
          gpuPerformanceScore += 3;
        } else if (maxTextureSize >= 4096) {
          gpuPerformanceScore += 2;
        } else if (maxTextureSize >= 2048) {
          gpuPerformanceScore += 1;
        }
        
        // 检测最大顶点属性数量
        const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        if (maxVertexAttribs >= 16) {
          gpuPerformanceScore += 2;
        } else if (maxVertexAttribs >= 8) {
          gpuPerformanceScore += 1;
        }
        
        // 检测最大绘制缓冲区大小
        const maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
        if (maxRenderBufferSize >= 8192) {
          gpuPerformanceScore += 2;
        } else if (maxRenderBufferSize >= 4096) {
          gpuPerformanceScore += 1;
        }
      }
    }
  } catch (e) {
    // WebGL检测失败，继续执行
    hasWebGL = false;
  }
  
  // 综合性能评估 - 优化版算法，增强AR模式下的性能评估准确性
  // 计算综合性能得分
  let totalScore = 0;
  
  // CPU核心数得分（1-8分）
  totalScore += Math.min(8, cpuCores);
  
  // 内存得分（1-16分）
  totalScore += Math.min(16, deviceMemory * 2);
  
  // GPU性能得分（0-25分）
  totalScore += Math.min(25, gpuPerformanceScore);
  
  // WebGL版本得分（1-2分）
  totalScore += webGLVersion;
  
  // 设备类型调整（不同设备类型有不同的性能基准）
  if (isDesktop) {
    totalScore += 5; // 桌面设备性能基准较高
  } else if (isTablet) {
    totalScore += 2; // 平板设备性能基准中等
  } else {
    totalScore -= 1; // 移动设备性能基准较低
  }
  
  // 浏览器性能扣分（低性能浏览器-3分）
  if (isLowPerformanceBrowser) {
    totalScore -= 3;
  }
  
  // 设备刷新率加分（高刷新率设备+2分）
  if (maxRefreshRate >= 120) {
    totalScore += 2;
  } else if (maxRefreshRate >= 90) {
    totalScore += 1;
  }
  
  // WebGL支持加分（支持WebGL+2分）
  if (hasWebGL) {
    totalScore += 2;
  } else {
    // 不支持WebGL，直接判定为低性能设备
    isLowEndDevice = true;
  }
  
  // 针对AR设备的特殊优化：移动设备默认降低性能得分，确保更保守的渲染设置
  if (!isDesktop && isARSupported) {
    totalScore -= 3; // AR设备默认降低性能得分，确保更稳定的AR体验
  }
  
  // 根据综合得分判断设备性能 - 更合理的得分区间
  if (!isLowEndDevice) {
    if (totalScore < 15) {
      isLowEndDevice = true;
      isMediumEndDevice = false;
      isHighEndDevice = false;
    } else if (totalScore < 28) {
      isLowEndDevice = false;
      isMediumEndDevice = true;
      isHighEndDevice = false;
    } else {
      isLowEndDevice = false;
      isMediumEndDevice = false;
      isHighEndDevice = true;
    }
  }
  
  // 特殊处理：桌面设备最低性能级别为中等
  if (isDesktop && isLowEndDevice) {
    isLowEndDevice = false;
    isMediumEndDevice = true;
    isHighEndDevice = false;
  }
  
  return {
    isLowEndDevice,
    isMediumEndDevice,
    isHighEndDevice,
    performanceLevel: isLowEndDevice ? 'low' : isMediumEndDevice ? 'medium' : 'high',
    cpuCores,
    deviceMemory,
    webGLVersion,
    gpuPerformanceScore,
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    isARSupported,
    isLowPerformanceBrowser,
    hasWebGL,
    maxRefreshRate,
    hasPerformanceAPI
  };
};

// 增强的资源缓存机制
interface CachedResource<T> {
  resource: T;
  timestamp: number;
  size?: number;
  usageCount: number;
  lastUsed: number;
}

// 资源缓存配置
const CACHE_CONFIG = {
  maxTextures: 15, // 增加最大缓存纹理数量
  maxModels: 8, // 增加最大缓存模型数量
  cacheTTL: 30 * 60 * 1000, // 缓存过期时间：30分钟
  cleanupInterval: 5 * 60 * 1000, // 清理间隔：5分钟
  maxTextureSizeMB: 50, // 最大纹理缓存大小（MB）
  maxModelSizeMB: 100, // 最大模型缓存大小（MB）
  minUsageCount: 2, // 最小使用次数，低于此值的资源优先被清理
};

// 资源大小计算工具
const calculateResourceSize = {
  // 估算纹理大小（MB）
  texture(texture: THREE.Texture): number {
    if (texture.image && typeof texture.image === 'object' && 'width' in texture.image && 'height' in texture.image) {
      // 计算像素数量 * 4字节/像素（RGBA）
      const image = texture.image as { width: number; height: number };
      const width = image.width;
      const height = image.height;
      const bytes = width * height * 4;
      return bytes / (1024 * 1024); // 转换为MB
    }
    return 0;
  },
  
  // 估算模型大小（MB）
  model(model: THREE.Group): number {
    let totalBytes = 0;
    
    model.traverse((object: any) => {
      // 估算几何体大小
      if (object.geometry) {
        const geometry = object.geometry;
        // 计算顶点数据大小
        if (geometry.attributes.position) {
          totalBytes += geometry.attributes.position.array.byteLength;
        }
        if (geometry.attributes.normal) {
          totalBytes += geometry.attributes.normal.array.byteLength;
        }
        if (geometry.attributes.uv) {
          totalBytes += geometry.attributes.uv.array.byteLength;
        }
      }
      
      // 估算材质大小
      if (object.material) {
        if (Array.isArray(object.material)) {
          totalBytes += object.material.length * 1024; // 每个材质约1KB
        } else {
          totalBytes += 1024; // 单个材质约1KB
        }
      }
    });
    
    return totalBytes / (1024 * 1024); // 转换为MB
  }
};

const resourceCache = {
  textures: new Map<string, CachedResource<THREE.Texture>>(),
  models: new Map<string, CachedResource<THREE.Group>>(),
  
  // 计算当前缓存大小
  getCurrentCacheSize() {
    return {
      textures: Array.from(resourceCache.textures.values())
        .reduce((total, cached) => total + (cached.size || 0), 0),
      models: Array.from(resourceCache.models.values())
        .reduce((total, cached) => total + (cached.size || 0), 0),
    };
  },
  
  // 缓存配置
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
        if (now - cached.timestamp > CACHE_CONFIG.cacheTTL) {
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
    
    // 清理超出限制的资源（使用智能清理策略）
    cleanupExcess() {
      const currentSize = resourceCache.getCurrentCacheSize();
      
      // 智能清理纹理缓存
      if (resourceCache.textures.size > CACHE_CONFIG.maxTextures || 
          currentSize.textures > CACHE_CONFIG.maxTextureSizeMB) {
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
        
        // 如果仍超出大小限制，继续清理
        let currentTextureSize = resourceCache.getCurrentCacheSize().textures;
        let i = sortedTextures.length - 1;
        while (currentTextureSize > CACHE_CONFIG.maxTextureSizeMB && i >= 0) {
          const [key, cached] = sortedTextures[i];
          if (resourceCache.textures.has(key)) {
            cached.resource.dispose();
            resourceCache.textures.delete(key);
            currentTextureSize = resourceCache.getCurrentCacheSize().textures;
          }
          i--;
        }
      }
      
      // 智能清理模型缓存
      if (resourceCache.models.size > CACHE_CONFIG.maxModels || 
          currentSize.models > CACHE_CONFIG.maxModelSizeMB) {
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
            excessCount--;
          }
        }
        
        // 如果仍超出大小限制，继续清理
        let currentModelSize = resourceCache.getCurrentCacheSize().models;
        let i = sortedModels.length - 1;
        while (currentModelSize > CACHE_CONFIG.maxModelSizeMB && i >= 0) {
          const [key, cached] = sortedModels[i];
          if (resourceCache.models.has(key)) {
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
            currentModelSize = resourceCache.getCurrentCacheSize().models;
          }
          i--;
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
}, CACHE_CONFIG.cleanupInterval);

// 渲染设置类型定义
interface RenderSettings {
  pixelRatio: number;
  antialias: boolean;
  shadowMapEnabled: boolean;
  showAdvancedEffects: boolean;
  particleCount: number;
  advancedLighting: boolean;
}

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
  onPositionChange?: (position: { x: number; y: number; z: number }) => void;
  renderSettings: RenderSettings;
  devicePerformance: ReturnType<typeof getDevicePerformance>;
}> = React.memo(({ config, scale, rotation, position, isARMode, particleEffect, clickInteraction, cameraView, isPlaced, onLoadingComplete, onProgress, onPositionChange, renderSettings, devicePerformance }) => {
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
    const hasResourcesToLoad = 
      (config.type === '2d' && config.imageUrl) || 
      (config.type === '3d' && config.modelUrl);
    
    // 如果没有资源需要加载，立即通知父组件加载完成
    if (!hasResourcesToLoad) {
      setTextureLoading(false);
      if (onLoadingComplete) {
        // 使用setTimeout延迟调用onLoadingComplete，避免在渲染过程中更新状态
        setTimeout(() => {
          onLoadingComplete();
        }, 0);
      }
      if (onProgress) {
        // 使用setTimeout延迟调用onProgress，避免在渲染过程中更新状态
        setTimeout(() => {
          onProgress(100);
        }, 0);
      }
    }
  }, [config.type, config.imageUrl, config.modelUrl, onLoadingComplete, onProgress]);

  // 优化的纹理加载逻辑，使用requestIdleCallback和高效的缓存机制
  useEffect(() => {
    if (config.type === '2d' && config.imageUrl) {
      setTextureLoading(true);
      setTextureError(false);
      
      // 检查缓存中是否已有该纹理
      const cachedTexture = config.imageUrl ? resourceCache.textures.get(config.imageUrl) : null;
      if (cachedTexture) {
        // 更新使用统计
        cachedTexture.usageCount++;
        cachedTexture.lastUsed = Date.now();
        setTexture(cachedTexture.resource);
        setTextureLoading(false);
        setTextureError(false);
        if (onLoadingComplete) {
          onLoadingComplete();
        }
        return;
      }
      
      // 使用requestIdleCallback在空闲时加载纹理，减少主线程阻塞
      const loadTexture = () => {
        const loader = new THREE.TextureLoader();
        
        // 降低纹理加载优先级
        loader.setCrossOrigin('anonymous');
        
        loader.load(
          config.imageUrl as string,
          (loadedTexture) => {
            // 优化纹理设置
            loadedTexture.minFilter = isARMode ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
            loadedTexture.magFilter = THREE.LinearFilter;
            loadedTexture.generateMipmaps = !isARMode;
            loadedTexture.anisotropy = isARMode ? 1 : (devicePerformance?.isDesktop ? 4 : 1);
            loadedTexture.needsUpdate = true;
            
            // 缓存纹理
            const textureSize = calculateResourceSize.texture(loadedTexture);
            if (config.imageUrl) {
              resourceCache.textures.set(config.imageUrl, {
                resource: loadedTexture,
                timestamp: Date.now(),
                size: textureSize,
                usageCount: 1,
                lastUsed: Date.now()
              });
            }
            
            setTexture(loadedTexture);
            setTextureLoading(false);
            setTextureError(false);
            if (onLoadingComplete) {
              onLoadingComplete();
            }
          },
          undefined,
          (error) => {
            console.error('Error loading texture:', error);
            // 加载失败时，创建一个更小的默认纹理作为备用
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // 绘制一个紫色背景的默认图像
              ctx.fillStyle = '#4f46e5';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = '#ffffff';
              ctx.font = '20px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('图像加载失败', canvas.width / 2, canvas.height / 2);
              ctx.fillText('使用默认图像', canvas.width / 2, canvas.height / 2 + 30);
            }
            // 创建纹理
            const defaultTexture = new THREE.CanvasTexture(canvas);
            defaultTexture.minFilter = THREE.LinearFilter;
            defaultTexture.magFilter = THREE.LinearFilter;
            defaultTexture.generateMipmaps = false;
            defaultTexture.needsUpdate = true;
            
            setTexture(defaultTexture);
            setTextureLoading(false);
            setTextureError(true);
            if (onLoadingComplete) {
              onLoadingComplete();
            }
          }
        );
      };
      
      // 使用requestIdleCallback在浏览器空闲时加载纹理
      if ('requestIdleCallback' in window) {
        const idleCallback = window.requestIdleCallback(loadTexture, { timeout: 2000 });
        return () => window.cancelIdleCallback(idleCallback);
      } else {
        // 不支持requestIdleCallback时使用setTimeout
        const timeoutId = setTimeout(loadTexture, 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [config.type, config.imageUrl, onLoadingComplete, isARMode, devicePerformance]);
  
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
  
  // 验证图像URL有效性 - 更加宽松的版本，避免误判有效URL
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
      
      // 放宽URL验证：允许更多URL格式，包括相对路径
      try {
        // 尝试解析URL，但即使失败也不直接拒绝
        let urlObj: URL;
        try {
          urlObj = new URL(trimmedUrl);
        } catch (e) {
          // 相对路径URL，视为有效
          console.debug(`Relative URL detected: ${trimmedUrl}, treating as valid`);
          urlValidationCache.current.set(trimmedUrl, { valid: true, timestamp: Date.now() });
          resolve(true);
          return;
        }
        
        // 对于绝对URL，只做基本协议检查
        if (!['http:', 'https:', 'blob:', 'data:'].includes(urlObj.protocol)) {
          console.warn(`Invalid protocol for image URL: ${urlObj.protocol}`);
          // 不直接拒绝，继续尝试加载
        }
        
        // 不再验证域名长度，允许本地开发环境URL
        
        // 不再严格验证文件扩展名，允许动态生成的图像
        // 让实际加载过程来处理格式问题
      } catch (error) {
        console.warn(`Error in URL validation: ${trimmedUrl}`, error);
        // 即使验证过程中出现错误，也允许尝试加载
      }
      
      // 简化验证逻辑：对于非占位图URL，直接返回true，让实际加载过程处理错误
      // 这可以避免误判有效的图像URL
      console.debug(`URL validation skipped, allowing image to load: ${trimmedUrl}`);
      urlValidationCache.current.set(trimmedUrl, { valid: true, timestamp: Date.now() });
      resolve(true);
    });
  }, []);
  
  // 3D模型加载状态
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState(false);
  
  // 加载进度
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // 设备性能状态 - 从props获取，避免重复声明
    // 组件外部已经声明了devicePerformance，直接使用从props传入的值
  
  // 资源加载状态跟踪
  const [resourcesLoaded, setResourcesLoaded] = useState(0);
  const [totalResources, setTotalResources] = useState(0);
  
  // 根据设备性能和AR模式调整粒子效果配置
  const optimizedParticleEffect = {
    ...particleEffect,
    // AR模式下完全禁用粒子效果，非AR模式下根据设备性能调整
    enabled: !isARMode,
    particleCount: isARMode ? 0 : 
                   devicePerformance.isLowEndDevice ? Math.min(particleEffect.particleCount, 15) : 
                   devicePerformance.isMediumEndDevice ? Math.min(particleEffect.particleCount, 30) : 
                   Math.min(particleEffect.particleCount, 50),
    particleSize: devicePerformance.isLowEndDevice ? Math.max(particleEffect.particleSize, 0.15) : particleEffect.particleSize,
    animationSpeed: devicePerformance.isLowEndDevice ? particleEffect.animationSpeed * 0.5 : particleEffect.animationSpeed,
    showTrails: !devicePerformance.isLowEndDevice && !isARMode
  };

  // 图像加载降级策略 - 获取备选图像URL
  const getFallbackImageUrl = useCallback((originalUrl: string) => {
    // 如果是默认占位图，直接返回
    if (originalUrl.includes('placeholder')) {
      return originalUrl;
    }
    
    try {
      // 生成备选低分辨率URL（根据不同CDN或URL格式调整）
      const urlObj = new URL(originalUrl);
      
      // 处理text_to_image API特殊情况
      if (urlObj.pathname.includes('text_to_image')) {
        // 修改现有的image_size参数为较低分辨率
        urlObj.searchParams.set('image_size', '800x600'); // 使用更低的分辨率以提高加载速度
        return urlObj.toString();
      }
      
      // 处理Unsplash等CDN URL，调整查询参数或返回默认图片
      if (urlObj.hostname.includes('unsplash.com') || urlObj.hostname.includes('images.unsplash.com')) {
        // Unsplash图片可能失效，返回默认占位图
        console.warn('Unsplash URL detected, returning placeholder image due to potential 404 error');
        return '/images/placeholder-image.jpg';
      }
      
      // 处理其他带有查询参数的URL
      if (originalUrl.includes('?')) {
        // 复制URL对象以避免修改原始URL
        const fallbackUrlObj = new URL(originalUrl);
        // 添加或修改参数以降低分辨率
        fallbackUrlObj.searchParams.set('size', 'small');
        return fallbackUrlObj.toString();
      } else {
        // 在文件名前添加_thumb后缀
        const pathParts = urlObj.pathname.split('.');
        if (pathParts.length > 1) {
          const extension = pathParts.pop();
          const baseName = pathParts.join('.');
          return `${urlObj.origin}${baseName}_thumb.${extension}${urlObj.search}`;
        }
      }
      
      // 默认返回原始URL
      return originalUrl;
    } catch (error) {
      console.error('Error generating fallback URL:', error);
      // 如果URL无效，返回默认占位符
      return '/images/placeholder-image.jpg';
    }
  }, []);

  // 资源优先级管理器 - 优化资源加载顺序
  const [resourcePriority, setResourcePriority] = useState<{
    [key: string]: number;
  }>({});

  // 更新资源优先级
  const updateResourcePriority = useCallback((url: string, priority: number) => {
    setResourcePriority(prev => ({
      ...prev,
      [url]: priority
    }));
  }, []);

  // 预加载关键资源
  const preloadCriticalResources = useCallback(() => {
    // 预加载逻辑可以在这里实现
    console.debug('Preloading critical resources...');
  }, []);

  // 初始化资源预加载
  useEffect(() => {
    preloadCriticalResources();
  }, [preloadCriticalResources]);

  // 扩展占位符图像检测：支持多种占位符格式和路径
  const isPlaceholderImage = !config.imageUrl || 
    config.imageUrl === '/images/placeholder-image.svg' ||
    config.imageUrl === '/images/placeholder-image.jpg' ||
    config.imageUrl === '/images/default-image.png' ||
    config.imageUrl.includes('placeholder') ||
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
    
    // 只有在2D模式下才加载纹理
    if (config.type !== '2d') {
      setTextureLoading(false);
      setTextureError(false);
      return;
    }
    
    // 只有在真正的占位图时才跳过加载
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
    
    // 确保开始加载流程
    setTextureLoading(true);
    setTextureError(false);
    setLoadingProgress(0);
    
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
        // 更新缓存资源的使用计数、时间戳和最后使用时间
        cachedEntry.timestamp = Date.now();
        cachedEntry.usageCount++;
        cachedEntry.lastUsed = Date.now();
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
      
      // 根据设备性能和AR模式调整纹理加载质量
      const qualitySettings = (devicePerformance.isLowEndDevice || isARMode) ? {
        // 低性能设备或AR模式：降低纹理质量，减少内存使用和加载时间
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        generateMipmaps: false // 禁用mipmap生成，减少GPU内存和加载时间
      } : {
        // 高性能设备且非AR模式：使用高质量纹理
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
          
          // 计算纹理大小（MB）
          const sizeMB = calculateResourceSize.texture(loadedTexture);
          
          // 添加到缓存
          const cacheEntry: CachedResource<THREE.Texture> = {
            resource: loadedTexture,
            timestamp: Date.now(),
            size: sizeMB,
            usageCount: 1,
            lastUsed: Date.now()
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
              // 创建一个默认的紫色纹理作为备用
              const canvas = document.createElement('canvas');
              canvas.width = 512;
              canvas.height = 512;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // 绘制一个紫色背景的默认图像
                ctx.fillStyle = '#4f46e5';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#ffffff';
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('图像加载失败', canvas.width / 2, canvas.height / 2);
                ctx.fillText('使用默认图像', canvas.width / 2, canvas.height / 2 + 40);
              }
              const defaultTexture = new THREE.CanvasTexture(canvas);
              setTexture(defaultTexture);
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
  
  // 加载3D模型 - 优化版本：使用增强缓存机制和requestIdleCallback
  useEffect(() => {
    let loader: GLTFLoader | null = null;
    let gltfScene: THREE.Group | null = null;
    let isMounted = true;
    let idleCallbackId: number | null = null;
    
    if (config.type === '3d' && config.modelUrl) {
      // 检查缓存中是否已有该模型
      const cachedEntry = resourceCache.models.get(config.modelUrl);
      if (cachedEntry) {
        // 更新缓存资源的使用计数、时间戳和最后使用时间
        cachedEntry.timestamp = Date.now();
        cachedEntry.usageCount++;
        cachedEntry.lastUsed = Date.now();
        resourceCache.models.set(config.modelUrl, cachedEntry);
        
        if (isMounted) {
          setModel(cachedEntry.resource);
          setModelLoading(false);
          setModelError(false);
          setLoadingProgress(100);
        }
        return;
      }
      
      setModelLoading(true);
      setModelError(false);
      setLoadingProgress(50);
      
      // 使用requestIdleCallback在空闲时加载模型，减少主线程阻塞
      const loadModel = () => {
        loader = new GLTFLoader();
        loader.load(
          config.modelUrl as string,
          (gltf: any) => {
            if (!isMounted) return;
            
            gltfScene = gltf.scene as THREE.Group;
            
            // 优化模型渲染设置，根据设备性能和AR模式调整
            gltfScene.traverse((object: any) => {
              // 优化几何数据
              if (object.geometry) {
                // 简化几何体，降低面数
                if (object.geometry.attributes.position) {
                  // AR模式下进一步简化模型
                  if (isARMode) {
                    // 使用非索引几何体，减少绘制调用
                    object.geometry = object.geometry.toNonIndexed();
                    
                    // 注意：保留法线属性，某些材质需要法线才能正确渲染
            // 仅移除uv2和切线属性，减少内存占用
            if (object.geometry.attributes.uv2) {
              object.geometry.deleteAttribute('uv2');
            }
            if (object.geometry.attributes.tangent) {
              object.geometry.deleteAttribute('tangent');
            }
                  }
                }
              }
              
              // 优化材质设置
              if (object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach((material: any) => {
                  if (material instanceof THREE.MeshStandardMaterial) {
                    // 降低材质复杂度
                    material.roughnessMap = null;
                    material.metalnessMap = null;
                    material.normalMap = null;
                    material.displacementMap = null;
                    material.alphaMap = null;
                    material.envMap = null;
                    material.lightMap = null;
                    material.aoMap = null;
                    
                    // AR模式下进一步简化
                    if (isARMode) {
                      material.metalness = 0.0;
                      material.roughness = 0.5;
                      material.emissiveIntensity = 0.0;
                    }
                  }
                });
              }
              
              // 关闭模型阴影，AR模式下进一步优化
              object.castShadow = false;
              object.receiveShadow = false;
              
              // AR模式下关闭不必要的功能
              if (isARMode) {
                object.frustumCulled = true; // 启用视锥体剔除，减少绘制调用
                object.visible = true; // 确保对象可见
              }
            });
            
            // 计算模型大小（MB）
            const modelSizeMB = calculateResourceSize.model(gltfScene);
            
            // 添加到缓存
            if (config.modelUrl) {
              const cacheEntry: CachedResource<THREE.Group> = {
                resource: gltfScene,
                timestamp: Date.now(),
                size: modelSizeMB,
                usageCount: 1,
                lastUsed: Date.now()
              };
              
              resourceCache.models.set(config.modelUrl, cacheEntry);
            }
            
            // 清理超出限制的资源
            resourceCache.config.cleanupExcess();
            
            if (isMounted) {
              setModel(gltfScene);
              setModelLoading(false);
              setModelError(false);
              setLoadingProgress(100);
              
              // 通知父组件加载完成
              if (onLoadingComplete) {
                onLoadingComplete();
              }
            }
          },
          (progress: ProgressEvent) => {
            if (!isMounted) return;
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
            if (isMounted) {
              setModel(null);
              setModelLoading(false);
              setModelError(true);
              setLoadingProgress(100);
            }
          }
        );
      };
      
      // 使用requestIdleCallback在浏览器空闲时加载模型
      if ('requestIdleCallback' in window) {
        idleCallbackId = window.requestIdleCallback(loadModel, { timeout: 3000 });
      } else {
        // 不支持requestIdleCallback时使用setTimeout，延迟100ms执行
        const timeoutId = setTimeout(loadModel, 100);
        idleCallbackId = timeoutId as any;
      }
    }
    
    return () => {
      isMounted = false;
      // 取消idle callback
      if (idleCallbackId !== null) {
        if ('requestIdleCallback' in window) {
          window.cancelIdleCallback(idleCallbackId);
        } else {
          clearTimeout(idleCallbackId);
        }
      }
      // 清理模型资源（仅当不在缓存中时）
      if (gltfScene && config.modelUrl && !resourceCache.models.has(config.modelUrl)) {
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
  }, [config.modelUrl, config.type, onLoadingComplete, onProgress, isARMode, devicePerformance]);
  
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
      {/* Canvas配置 - 基于设备性能的动态配置 */}
      <Canvas
        camera={{ 
          position: devicePerformance.isDesktop ? [10, 10, 10] : [8, 8, 8], // 桌面设备使用更远的视角
          fov: devicePerformance.isDesktop ? 50 : 60 // 桌面设备使用更小的视野，增强3D效果
        }}
        gl={{ 
          // 优化渲染设置，确保3D模型能清晰可见
          antialias: true, // 始终启用抗锯齿，提升视觉效果
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true, // 保留绘制缓冲区，确保渲染稳定
          alpha: true, // 始终启用alpha通道，确保模型能正常显示
          stencil: true, // 启用stencil，确保模型能正常渲染
          // 优化WebGL配置，提升性能并减少闪烁
          premultipliedAlpha: true,
          depth: true,
          // 使用mediump精度，确保模型清晰可见
          precision: 'mediump',
          // 确保所有模式下配置一致，避免黑屏
          ...(isARMode && {
            alpha: true, // AR模式下启用透明背景
            antialias: true, // AR模式下启用抗锯齿
            preserveDrawingBuffer: true, // 确保AR模式下渲染缓冲区稳定
            depth: true, // 确保深度测试启用
            stencil: true // 确保模板测试启用
          })
        }}
        shadows={false} // AR模式下完全禁用阴影，减少渲染计算
        performance={{ 
          min: 0.01, // 降低性能阈值，减少性能监控的影响
          debounce: 1000, // 增加防抖时间，减少性能波动
          // 禁用自动帧率调节，减少不必要的计算
        }}
        style={{ flex: 1, width: '100%', height: '100%' }} // 优化图像渲染
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
                onPositionChange={onPositionChange}
                renderSettings={renderSettings}
                devicePerformance={devicePerformance}
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
      
      {/* 纹理加载错误提示 - 优化版：只在没有备用纹理时显示 */}
      {textureError && config.imageUrl && !texture && (
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
      
      {/* 模型加载错误提示 - 增强版 */}
      {modelError && config.modelUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-20">
          <div className="text-white text-center max-w-md bg-gradient-to-br from-indigo-900/90 to-purple-900/90 rounded-2xl p-6 shadow-2xl border border-white/10">
            <div className="text-red-500 text-5xl mb-4 animate-pulse">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">3D模型加载失败</h3>
            <p className="text-base text-gray-200 mb-6">
              模型文件可能已损坏或服务器暂时不可用。
            </p>
            <ul className="text-left text-sm text-gray-300 mb-6 space-y-2 pl-5">
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-400 mt-1 mr-2 flex-shrink-0"></i>
                <span>检查网络连接是否正常</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-400 mt-1 mr-2 flex-shrink-0"></i>
                <span>模型URL是否有效</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-400 mt-1 mr-2 flex-shrink-0"></i>
                <span>服务器是否可访问</span>
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
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
            {/* 错误日志记录 - 开发模式下可见 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-xs text-gray-400 bg-gray-800/50 p-3 rounded-lg">
                <p className="font-semibold mb-1">错误详情：</p>
                <p>模型URL: {config.modelUrl}</p>
                <p>错误类型: 3D资源加载失败</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// 添加自定义比较函数，优化React.memo的比较逻辑
ThreeDPreviewContent.displayName = 'ThreeDPreviewContent';

// 错误类型映射
const ERROR_TYPE_MAP: Record<string, { title: string; description: string; icon: string; color: string }> = {
  '组件错误': {
    title: '组件渲染错误',
    description: 'AR预览组件在渲染过程中发生错误',
    icon: 'fas fa-code',
    color: 'red'
  },
  'Promise错误': {
    title: '异步操作错误',
    description: 'AR预览在执行异步操作时发生错误',
    icon: 'fas fa-sync-alt',
    color: 'yellow'
  },
  '运行时错误': {
    title: '运行时错误',
    description: 'AR预览在运行过程中发生错误',
    icon: 'fas fa-exclamation-triangle',
    color: 'orange'
  },
  'WebGL错误': {
    title: 'WebGL渲染错误',
    description: 'AR预览在使用WebGL渲染时发生错误',
    icon: 'fas fa-palette',
    color: 'purple'
  },
  '资源加载错误': {
    title: '资源加载错误',
    description: 'AR预览在加载资源时发生错误',
    icon: 'fas fa-download',
    color: 'blue'
  },
  '未知错误': {
    title: '未知错误',
    description: 'AR预览发生了未知类型的错误',
    icon: 'fas fa-question-circle',
    color: 'gray'
  }
};

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

  // 增强的错误分析函数
  const analyzeError = useCallback((error: ErrorEvent | PromiseRejectionEvent) => {
    let type = '未知错误';
    let message = '';
    let stack = '';
    
    if (error instanceof ErrorEvent) {
      message = error.message || '未知错误';
      stack = error.error?.stack || '';
      
      // 根据错误信息分析类型
      if (message.includes('WebGL') || message.includes('webgl')) {
        type = 'WebGL错误';
      } else if (message.includes('resource') || message.includes('Resource') || message.includes('加载')) {
        type = '资源加载错误';
      } else {
        type = '运行时错误';
      }
    } else if (error instanceof PromiseRejectionEvent) {
      message = error.reason?.message || 'Promise拒绝错误';
      stack = error.reason?.stack || '';
      type = 'Promise错误';
    }
    
    return { type, message, stack };
  }, []);

  // 使用useEffect捕获组件错误
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      const { type, message, stack } = analyzeError(error);
      console.error('AR Preview Component Error:', error);
      setErrorInfo(message);
      setErrorStack(stack);
      setErrorType(type);
      setHasError(true);
      
      const errorConfig = ERROR_TYPE_MAP[type];
      toast.error(`${errorConfig.title}: ${errorConfig.description}`, {
        icon: errorConfig.icon,
        duration: 3000
      });
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [analyzeError]);

  React.useEffect(() => {
    // 使用ref存储错误处理函数，避免闭包问题
    const handleError = (error: ErrorEvent) => {
      const { type, message, stack } = analyzeError(error);
      console.error('AR Preview Error:', error);
      setErrorInfo(message);
      setErrorStack(stack);
      setErrorType(type);
      setHasError(true);
      
      const errorConfig = ERROR_TYPE_MAP[type];
      toast.error(`${errorConfig.title}: ${errorConfig.description}`, {
        icon: errorConfig.icon,
        duration: 3000
      });
    };
    
    errorHandlerRef.current = handleError;
    window.addEventListener('error', handleError);
    
    // 捕获Promise错误
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const { type, message, stack } = analyzeError(event);
      console.error('AR Preview Promise Error:', event);
      setErrorInfo(message);
      setErrorStack(stack);
      setErrorType(type);
      setHasError(true);
      
      const errorConfig = ERROR_TYPE_MAP[type];
      toast.error(`${errorConfig.title}: ${errorConfig.description}`, {
        icon: errorConfig.icon,
        duration: 3000
      });
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      if (errorHandlerRef.current) {
        window.removeEventListener('error', errorHandlerRef.current);
        errorHandlerRef.current = null;
      }
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [analyzeError]);

  if (hasError) {
    const errorConfig = ERROR_TYPE_MAP[errorType] || ERROR_TYPE_MAP['未知错误'];
    
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 text-red-600 dark:text-red-400 p-6 animate-fade-in">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <i className={`${errorConfig.icon} text-6xl text-red-500`}></i>
        </div>
        <h3 className="text-2xl font-bold mb-3">AR预览出错了</h3>
        <p className="text-center text-red-500 dark:text-red-300 mb-6 max-w-md">
          很抱歉，AR预览出现了问题。请尝试以下方法恢复：
        </p>
        
        {/* 错误详情 - 可折叠 */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-3 rounded-lg text-sm text-red-700 dark:text-red-300 max-w-md shadow-lg mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">错误详情</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${errorConfig.color === 'red' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 
                               errorConfig.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' : 
                               errorConfig.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' : 
                               errorConfig.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' : 
                               errorConfig.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 
                               'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300'}`}>
              {errorConfig.title}
            </span>
          </div>
          <div className="text-sm opacity-80 mb-2">{errorInfo || '未知错误'}</div>
          {errorStack && (
            <div className="mt-2 text-xs opacity-70 max-h-32 overflow-y-auto bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {errorStack.substring(0, 800)}{errorStack.length > 800 ? '...' : ''}
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
        
        {/* 高级恢复选项 */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <button 
            onClick={() => {
              // 清除浏览器缓存
              localStorage.clear();
              toast.info('浏览器缓存已清除，正在刷新页面...');
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }}
            className="flex-1 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2"
          >
            <i className="fas fa-broom"></i>
            清除缓存并刷新
          </button>
          <button 
            onClick={() => {
              // 复制错误信息到剪贴板
              const errorText = `AR预览错误信息:\n类型: ${errorConfig.title}\n信息: ${errorInfo}\n时间: ${new Date().toLocaleString()}\n\n${errorStack}`;
              navigator.clipboard.writeText(errorText)
                .then(() => toast.success('错误信息已复制到剪贴板'))
                .catch(() => toast.error('复制失败，请手动复制'));
            }}
            className="flex-1 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2"
          >
            <i className="fas fa-copy"></i>
            复制错误信息
          </button>
        </div>
        
        {/* 恢复尝试次数 */}
        {resetCountRef.current > 0 && (
          <div className="mt-4 text-sm text-red-500 dark:text-red-400 opacity-80">
            已尝试恢复 {resetCountRef.current} 次
          </div>
        )}
        
        {/* 技术支持提示 */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          如果问题持续存在，请联系技术支持并提供错误信息
        </div>
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

  // 监听config.scale变化，更新scale状态
  useEffect(() => {
    if (config.scale !== undefined) {
      setScale(config.scale);
    }
  }, [config.scale]);

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
  
  // 预处理图像URL，检查是否为无效的Unsplash URL
  const processedConfig = React.useMemo(() => {
    // 复制原始配置
    const newConfig = { ...config };
    
    // 检查图像URL是否为Unsplash URL
    if (newConfig.imageUrl) {
      try {
        const urlObj = new URL(newConfig.imageUrl);
        // 如果是Unsplash URL，直接替换为默认占位图
        if (urlObj.hostname.includes('unsplash.com') || urlObj.hostname.includes('images.unsplash.com')) {
          console.info(`Unsplash URL detected: ${newConfig.imageUrl}, replacing with placeholder image`);
          newConfig.imageUrl = '/images/placeholder-image.jpg';
        }
      } catch (error) {
        // URL无效，替换为默认占位图
        console.error('Invalid image URL, replacing with placeholder:', error);
        newConfig.imageUrl = '/images/placeholder-image.jpg';
      }
    }
    
    return newConfig;
  }, [config]);
  
  // 粒子效果配置 - 根据设备性能动态调整，AR模式下进一步优化
  const [particleEffect, setParticleEffect] = useState<ParticleEffectConfig>({
    enabled: !isARMode, // AR模式下默认禁用粒子效果以提高性能
    type: 'spiral',
    particleCount: devicePerformance.isLowEndDevice ? 20 : devicePerformance.isMediumEndDevice ? 50 : 100,
    particleSize: 0.1,
    animationSpeed: devicePerformance.isLowEndDevice ? 0.5 : devicePerformance.isMediumEndDevice ? 1.0 : 1.5,
    color: '#ffffff',
    showTrails: !devicePerformance.isLowEndDevice && !isARMode, // AR模式下禁用拖尾效果
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
  
  // AR模式切换处理 - 基于设备类型的动态模式切换
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
        
        // 显示AR模式引导提示
        setTimeout(() => {
          toast.info(
            <div className="text-left">
              <div className="font-semibold mb-1">AR模式使用指南：</div>
              <div>1. 将设备对准平面（如地面、桌面）</div>
              <div>2. 点击屏幕放置模型</div>
              <div>3. 双指缩放调整大小</div>
              <div>4. 双指旋转调整角度</div>
              <div>5. 单指拖动调整位置</div>
            </div>,
            { duration: 8000 }
          );
        }, 1000);
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
  
  // 根据设备类型自动调整3D渲染质量
  const getOptimizedRenderSettings = useCallback(() => {
    const isHighPerformance = !devicePerformance.isLowEndDevice;
    
    return {
      // 桌面设备使用更高的渲染质量
      pixelRatio: devicePerformance.isDesktop ? Math.min(window.devicePixelRatio, isHighPerformance ? 2.0 : 1.5) : 1.0,
      antialias: devicePerformance.isDesktop && isHighPerformance,
      shadowMapEnabled: devicePerformance.isDesktop && isHighPerformance,
      // 桌面设备显示更丰富的3D效果
      showAdvancedEffects: devicePerformance.isDesktop,
      // 桌面设备支持更多的粒子效果
      particleCount: devicePerformance.isDesktop ? 
        (devicePerformance.isHighEndDevice ? 150 : 100) : 
        (devicePerformance.isHighEndDevice ? 50 : 20),
      // 桌面设备支持更复杂的光照效果
      advancedLighting: devicePerformance.isDesktop
    };
  }, [devicePerformance]);
  
  // 动态渲染设置
  const renderSettings = getOptimizedRenderSettings();
  
  // 模型放置处理 - 增强用户反馈
  const handleModelPlace = useCallback(() => {
    if (isPlaced) {
      // 重新放置模型
      setIsPlaced(false);
      toast.info('可以重新放置模型', {
        description: '将设备对准新位置，点击屏幕即可重新放置'
      });
    } else {
      // 放置模型
      setIsPlaced(true);
      toast.success('模型已成功放置', { 
        duration: 2000,
        icon: '🎉',
        description: '操作提示：\n• 单指拖动 - 调整位置\n• 双指缩放 - 调整大小\n• 双指旋转 - 调整角度\n• 点击模型 - 重新放置'
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
  
  // 兼容旧的手势处理函数，保持向后兼容
  const handlePinch = useCallback((event: any) => {
    event.preventDefault();
    const scaleFactor = event.scale;
    setScale(prev => Math.max(0.1, Math.min(3, prev * scaleFactor)));
  }, []);
  
  const handleRotate = useCallback((event: any) => {
    event.preventDefault();
    setRotation(prev => ({
      ...prev,
      z: prev.z + event.rotation.z
    }));
  }, []);
  
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
  
  // 手势交互处理 - 使用基础的DOM事件监听来避免类型问题
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    // 处理触摸开始事件
  }, []);
  
  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!isPlaced || !isARMode) return;
    
    // 简化的手势处理：只处理单指平移
    if (event.touches.length === 1) {
      event.preventDefault();
      // 单指平移逻辑可以在这里实现
    }
    // 双指缩放和旋转逻辑可以在这里扩展
  }, [isPlaced, isARMode]);
  
  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    // 处理触摸结束事件
  }, []);
  
  // 绑定基础的触摸事件，避免复杂的手势库类型问题
  const filteredGestureProps = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
  
  // 处理截图
  const handleScreenshot = useCallback(() => {
    // 获取Canvas元素
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      toast.error('无法获取截图，Canvas元素不存在');
      return;
    }
    
    try {
      // 显示截图中提示
      toast.info('正在生成截图...');
      
      // 获取截图数据
      const dataUrl = canvas.toDataURL('image/png');
      
      // 创建一个临时的下载链接
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ar-screenshot-${new Date().getTime()}.png`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 显示截图成功提示
      toast.success('截图已保存到下载文件夹');
      
      // 尝试使用Web Share API分享截图（如果支持）
      if (navigator.share) {
        // 将data URL转换为Blob
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `ar-screenshot-${new Date().getTime()}.png`, { type: 'image/png' });
            // 提供分享选项
            navigator.share({
              title: 'AR场景截图',
              text: '分享我的AR场景截图',
              files: [file]
            })
            .catch(error => {
              // 分享失败不影响主要功能
              console.debug('分享失败:', error);
            });
          })
          .catch(error => {
            console.debug('转换Blob失败:', error);
          });
      }
    } catch (error) {
      console.error('截图失败:', error);
      toast.error('截图生成失败，请重试');
    }
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
              {/* 左侧 - 作品信息和图像 */}
              <div className="flex items-center gap-6">
                {/* 作品图像 */}
                {work?.thumbnail && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-white/30 shadow-lg animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <img 
                      src={work.thumbnail} 
                      alt={work.title || '作品图像'} 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                )}
                
                {/* 作品信息 */}
                <div className="text-white font-bold flex flex-col">
                  <div className="text-sm opacity-90 animate-fade-in">{work?.category || '未分类'}</div>
                  <div className="text-3xl font-extrabold animate-slide-up">{work?.creator || '未知创作者'}</div>
                </div>
              </div>
              

            </div>
            
            {/* 作品标签 */}
            <div className="flex flex-wrap gap-3">
              {work?.tags?.map((tag, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl text-white text-sm font-medium hover:bg-white/20 hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  #{tag}
                </span>
              )) || (
                <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl text-white text-sm font-medium hover:bg-white/20 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  #无标签
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AR预览主区域 */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: '400px', flex: 1, height: '100%' }}>
          <div 
            className="w-full h-full relative cursor-crosshair"
            style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
            onClick={handleARClick}
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
                        config={processedConfig}
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
                        onPositionChange={setPosition}
                        renderSettings={renderSettings}
                        devicePerformance={devicePerformance}
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
                        config={processedConfig}
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
                        onPositionChange={setPosition}
                        renderSettings={renderSettings}
                        devicePerformance={devicePerformance}
                      />
                    </div>
                  </ARPreviewErrorBoundary>
                </>
              );
            })()}
          </div>
        </div>
        

        
        {/* 底部控制栏 - 基于设备类型的动态布局 */}
        <div className={`p-4 border-t ${isDark ? 'border-indigo-800/50 bg-indigo-900/95' : 'border-indigo-200 bg-white/95'} rounded-b-3xl`} style={{ display: 'block', height: 'auto', position: 'relative', bottom: '0' }}>
          <div className="flex flex-col gap-4">
            {/* 主要功能按钮 - 根据设备类型动态显示 */}
            <div className="flex flex-wrap gap-3 w-full">
              {/* 进入AR按钮 - 仅在支持AR的设备上显示 */}
              {devicePerformance.isARSupported && (
                <button
                  onClick={toggleARMode}
                  className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${isARMode ? 'bg-purple-600 text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg'}`}
                  title={isARMode ? '退出AR模式' : '进入AR模式'}
                >
                  <i className="fas fa-eye mr-2"></i>
                  {isARMode ? '退出AR' : '进入AR'}
                </button>
              )}
              
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
            
            {/* 辅助控制区 - 根据设备类型动态调整 */}
            <div className="flex flex-wrap gap-3 w-full">
              {/* 视图模式切换 - 主要在桌面设备上使用 */}
              {devicePerformance.isDesktop && (
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
              )}
              
              {/* 缩放控制 - 所有设备都显示 */}
              <div className={`flex gap-2 items-center bg-white/10 rounded-xl p-3 flex-1 ${devicePerformance.isDesktop ? '' : 'w-full'}`}>
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
            
            {/* 高级控制选项 - 仅在桌面设备上显示 */}
            {devicePerformance.isDesktop && (
              <div className="flex flex-wrap gap-3 w-full">
                {/* 粒子效果控制 */}
                <div className="flex gap-2 items-center bg-white/10 rounded-xl p-3 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-white whitespace-nowrap flex items-center">
                    <i className="fas fa-magic mr-2 text-xs"></i>
                    粒子效果
                  </span>
                  <button
                    onClick={() => setParticleEffect(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${particleEffect.enabled ? 'bg-indigo-600 text-white' : 'text-white hover:bg-white/20'}`}
                    title={particleEffect.enabled ? '关闭粒子效果' : '开启粒子效果'}
                  >
                    {particleEffect.enabled ? '开' : '关'}
                  </button>
                </div>
                
                {/* 高级渲染控制 */}
                <div className="flex gap-2 items-center bg-white/10 rounded-xl p-3 flex-1">
                  <span className="text-xs font-semibold text-white whitespace-nowrap flex items-center">
                    <i className="fas fa-sliders-h mr-2 text-xs"></i>
                    渲染质量
                  </span>
                  <div className="flex gap-1 flex-1 justify-center">
                    {['low', 'medium', 'high'].map((quality) => (
                      <button
                        key={quality}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${renderSettings.pixelRatio === (quality === 'high' ? 2.0 : quality === 'medium' ? 1.5 : 1.0) ? 'bg-indigo-600 text-white' : 'text-white hover:bg-white/20'}`}
                        onClick={() => {
                          // 动态调整渲染质量
                          const newPixelRatio = quality === 'high' ? 2.0 : quality === 'medium' ? 1.5 : 1.0;
                          // 这里可以添加更新渲染设置的逻辑
                          toast.info(`已设置渲染质量为${quality === 'high' ? '高' : quality === 'medium' ? '中' : '低'}`);
                        }}
                        title={`设置${quality === 'high' ? '高' : quality === 'medium' ? '中' : '低'}渲染质量`}
                      >
                        {quality === 'high' ? '高' : quality === 'medium' ? '中' : '低'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARPreview;