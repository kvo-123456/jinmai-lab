import React, { useEffect, useRef, useState, useCallback, memo } from 'react';

interface GestureControlProps {
  videoElement: HTMLVideoElement;
  previewCanvas: HTMLCanvasElement;
  onGestureDetected?: (isDetected: boolean) => void;
  onScaleChange?: (scale: number) => void;
}

// 优化：添加memo，避免不必要的重新渲染
export default memo(function GestureControl({ videoElement, previewCanvas, onGestureDetected, onScaleChange }: GestureControlProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('手势控制已禁用');
  const [statusColor, setStatusColor] = useState<string>('text-yellow-400');
  
  const handsInstanceRef = useRef<any>(null);
  const cameraUtilsRef = useRef<any>(null);
  const previewCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // 优化：缓存脚本加载promise，避免重复加载
  const scriptLoadPromisesRef = useRef<Map<string, Promise<void>>>(new Map());
  
  // 优化：设备性能检测
  const devicePerformanceRef = useRef<'low' | 'medium' | 'high'>('medium');
  
  // 全局console日志过滤已在App.tsx中实现，此处不再需要本地保存
  
  // 加载外部脚本 - 优化：添加超时处理和重试机制
  const loadScript = useCallback((src: string, retryCount: number = 2, timeout: number = 5000) => {
    // 如果已有加载promise，直接返回
    if (scriptLoadPromisesRef.current.has(src)) {
      return scriptLoadPromisesRef.current.get(src)!;
    }
    
    const load = (attempt: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        // 设置超时
        const timeoutId = setTimeout(() => {
          script.remove();
          if (attempt < retryCount) {
            // 重试
            load(attempt + 1).then(resolve).catch(reject);
          } else {
            // 超时且重试次数用尽
            scriptLoadPromisesRef.current.delete(src);
            reject(new Error(`Script load timeout: ${src} (attempts: ${attempt + 1})`));
          }
        }, timeout);
        
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
          clearTimeout(timeoutId);
          resolve();
        };
        
        script.onerror = () => {
          clearTimeout(timeoutId);
          script.remove();
          if (attempt < retryCount) {
            // 重试
            load(attempt + 1).then(resolve).catch(reject);
          } else {
            // 加载失败且重试次数用尽
            scriptLoadPromisesRef.current.delete(src);
            reject(new Error(`Failed to load script: ${src} (attempts: ${attempt + 1})`));
          }
        };
        
        document.head.appendChild(script);
      });
    };
    
    const promise = load(0);
    scriptLoadPromisesRef.current.set(src, promise);
    return promise;
  }, []);
  
  // 更新状态 - 优化：使用useCallback
  const updateStatus = useCallback((newStatus: string, color: string) => {
    setStatus(newStatus);
    setStatusColor(color);
    
    // 同时更新DOM中的状态显示 - 优化：添加try-catch，避免DOM操作错误
    try {
      const statusDot = document.getElementById('status-dot');
      const statusText = document.getElementById('status-text');
      if (statusDot && statusText) {
        statusDot.className = `w-2 h-2 rounded-full ${color === 'text-green-400' ? 'bg-green-500 animate-pulse' : color === 'text-yellow-400' ? 'bg-yellow-500' : 'bg-gray-500'}`;
        statusText.textContent = newStatus;
        statusText.className = `text-xs ${color} uppercase tracking-widest`;
      }
    } catch (error) {
      // 静默处理DOM操作错误，不影响核心功能
    }
  }, []);
  
  // 停止手势控制 - 优化：增强清理逻辑
  const stopGestureControl = useCallback(() => {
    setIsEnabled(false);
    updateStatus('手势控制已禁用', 'text-yellow-400');
    
    // 全局console.log已由App.tsx管理，此处无需恢复
    
    // 停止相机
    if (cameraUtilsRef.current) {
      cameraUtilsRef.current.stop().catch(() => {
        // 静默处理停止失败
      });
      cameraUtilsRef.current = null;
    }
    
    // 清理hands实例
    if (handsInstanceRef.current) {
      // 尝试调用close方法（如果存在）
      if (typeof handsInstanceRef.current.close === 'function') {
        handsInstanceRef.current.close().catch(() => {
          // 静默处理关闭失败
        });
      }
      handsInstanceRef.current = null;
    }
    
    // 清空canvas上下文
    if (previewCtxRef.current) {
      // 清空画布
      const canvas = previewCtxRef.current.canvas;
      previewCtxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      previewCtxRef.current = null;
    }
    
    // 清空脚本加载缓存，允许下次重新加载
    scriptLoadPromisesRef.current.clear();
  }, [updateStatus]);
  
  // 更全面的设备性能检测
  useEffect(() => {
    // 综合性能评估
    const evaluatePerformance = () => {
      // 1. 内存检测
      const deviceMemory = (navigator as any).deviceMemory || 4;
      
      // 2. CPU核心数检测
      const logicalCores = navigator.hardwareConcurrency || 4;
      
      // 3. 网络连接类型检测
      const connection = (navigator as any).connection || {};
      const effectiveType = connection.effectiveType || '4g';
      
      // 4. GPU性能检测（简单方法）
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      let gpuScore = 2;
      
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          // 根据GPU渲染器名称进行简单分类
          if (renderer && (renderer.toLowerCase().includes('intel'))) {
            gpuScore = 2;
          } else if (renderer && (renderer.toLowerCase().includes('nvidia') || renderer.toLowerCase().includes('amd'))) {
            gpuScore = 4;
          }
        }
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      
      // 5. 综合评分
      const totalScore = deviceMemory + (logicalCores / 2) + gpuScore;
      
      // 根据综合评分确定性能等级
      if (totalScore < 8 || effectiveType === '2g') {
        return 'low';
      } else if (totalScore < 12 || effectiveType === '3g') {
        return 'medium';
      } else {
        return 'high';
      }
    };
    
    devicePerformanceRef.current = evaluatePerformance();
    console.log('Device performance level:', devicePerformanceRef.current);
  }, []);
  
  // 初始化手势控制
  const initializeGestureControl = useCallback(async () => {
    if (handsInstanceRef.current) {
      setIsEnabled(true);
      updateStatus('手势控制已启用', 'text-green-400');
      return;
    }
    
    setIsLoading(true);
    updateStatus('正在初始化手势控制...', 'text-blue-400');
    
    // 全局console日志过滤已在App.tsx中实现，此处不再重复拦截
    // 直接使用全局过滤后的console.log
    
    try {
      // 加载MediaPipe依赖 - 优化：添加CDN降级方案
      const cdnUrls = [
        // 主CDN
        'https://cdn.jsdelivr.net/npm/@mediapipe/',
        // 备用CDN 1
        'https://cdnjs.cloudflare.com/ajax/libs/',
        // 备用CDN 2
        'https://unpkg.com/@mediapipe/'
      ];
      
      let currentCdnIndex = 0;
      let loadSuccess = false;
      
      // 尝试从不同CDN加载资源
      while (currentCdnIndex < cdnUrls.length && !loadSuccess) {
        try {
          const baseUrl = cdnUrls[currentCdnIndex];
          
          // 调整备用CDN的URL格式
          const getScriptUrl = (path: string) => {
            if (baseUrl.includes('cdnjs.cloudflare.com')) {
              // Cloudflare CDN格式不同，需要特殊处理
              return path;
            }
            return `${baseUrl}${path}`;
          };
          
          await Promise.all([
            loadScript(getScriptUrl('camera_utils/camera_utils.js')),
            loadScript(getScriptUrl('control_utils/control_utils.js')),
            loadScript(getScriptUrl('drawing_utils/drawing_utils.js')),
            loadScript(getScriptUrl('hands/hands.js'))
          ]);
          
          loadSuccess = true;
        } catch (cdnError) {
          console.warn(`Failed to load from CDN ${currentCdnIndex + 1}, trying next...`, cdnError);
          currentCdnIndex++;
          
          // 清空缓存的失败promise，允许重试
          scriptLoadPromisesRef.current.clear();
        }
      }
      
      if (!loadSuccess) {
        throw new Error('Failed to load MediaPipe dependencies from all available CDNs');
      }
      
      // 初始化MediaPipe Hands - 优化：添加降级选项
      handsInstanceRef.current = new (window as any).Hands({
        locateFile: (file: string) => {
          // 使用相同的CDN加载其他资源
          const baseUrl = cdnUrls[currentCdnIndex - 1];
          if (baseUrl.includes('cdnjs.cloudflare.com')) {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
          return `${baseUrl}hands/${file}`;
        }
      });
      
      // 根据设备性能调整模型复杂度
      const modelComplexity = devicePerformanceRef.current === 'low' ? 0 : 1;
      
      handsInstanceRef.current.setOptions({
        maxNumHands: 2,
        modelComplexity: modelComplexity,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      // 获取预览画布上下文
      const previewCtx = previewCanvas.getContext('2d');
      if (!previewCtx) {
        throw new Error('Failed to get canvas context');
      }
      previewCtxRef.current = previewCtx;
      
      // 优化：根据设备性能动态调整检测频率
      const GESTURE_DETECT_INTERVAL = devicePerformanceRef.current === 'low' ? 150 : 
                                     devicePerformanceRef.current === 'medium' ? 100 : 60;
      
      let lastGestureDetectTime = 0;
      let lastScale = 1.0;
      
      // 使用requestAnimationFrame优化canvas绘制
      const canvasUpdateQueue = useRef<{ results: any }[]>([]);
      
      // 优化：使用requestAnimationFrame处理canvas更新
      const updateCanvas = useCallback(() => {
        if (canvasUpdateQueue.current.length > 0) {
          const { results } = canvasUpdateQueue.current.pop()!;
          
          if (!previewCtxRef.current) return;
          
          const previewCtx = previewCtxRef.current;
          
          previewCtx.save();
          previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
          if (results.image) {
            previewCtx.drawImage(results.image, 0, 0, previewCanvas.width, previewCanvas.height);
          }
          
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // 绘制手势点 - 优化：根据设备性能调整绘制复杂度
            if (devicePerformanceRef.current !== 'low') {
              for (const landmarks of results.multiHandLandmarks) {
                try {
                  (window as any).drawConnectors(previewCtx, landmarks, (window as any).HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 1});
                  (window as any).drawLandmarks(previewCtx, landmarks, {color: '#FF0000', lineWidth: 1, radius: 2});
                } catch (drawError) {
                  // 绘制失败时静默处理，不影响核心功能
                  console.warn('Failed to draw hand landmarks:', drawError);
                }
              }
            }
          }
          
          previewCtx.restore();
        }
        
        // 继续请求下一帧
        requestAnimationFrame(updateCanvas);
      }, []);
      
      // 启动canvas更新循环
      requestAnimationFrame(updateCanvas);
      
      function onResults(results: any) {
          const now = performance.now();
          
          // 控制手势检测频率
          if (now - lastGestureDetectTime < GESTURE_DETECT_INTERVAL) {
            return;
          }
          lastGestureDetectTime = now;
          
          // 添加到canvas更新队列
          canvasUpdateQueue.current = [{ results }];
          
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // 调用回调通知手势检测到
            if (onGestureDetected) {
              onGestureDetected(true);
            }
            
            let newScale = 1.0;
            
            if (results.multiHandLandmarks.length === 2) {
              const hand1 = results.multiHandLandmarks[0][9];
              const hand2 = results.multiHandLandmarks[1][9];
              
              // 简化距离计算 - 使用绝对值代替平方根，提高性能
              const dx = Math.abs(hand1.x - hand2.x);
              const dy = Math.abs(hand1.y - hand2.y);
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              newScale = Math.max(0.5, Math.min(distance * 4, 5.0));
            } else if (results.multiHandLandmarks.length === 1) {
              const landmarks = results.multiHandLandmarks[0];
              const thumbTip = landmarks[4];
              const indexTip = landmarks[8];
              
              // 简化距离计算 - 优化：仅计算一次dx和dy
              const dx = Math.abs(thumbTip.x - indexTip.x);
              const dy = Math.abs(thumbTip.y - indexTip.y);
              const pinchDistance = Math.sqrt(dx * dx + dy * dy);
              
              newScale = Math.max(0.5, Math.min(3.0 - pinchDistance * 3.5, 3.0));
            }
            
            // 优化：仅在缩放值变化超过阈值时调用回调，减少不必要的更新
            if (onScaleChange && Math.abs(newScale - lastScale) > 0.05) {
              onScaleChange(newScale);
              lastScale = newScale;
            }
          } else {
            // 调用回调通知手势未检测到
            if (onGestureDetected) {
              onGestureDetected(false);
            }
            
            // 重置缩放 - 优化：仅在需要时调用
            if (onScaleChange && lastScale !== 1.0) {
              onScaleChange(1.0);
              lastScale = 1.0;
            }
          }
        }
      
      handsInstanceRef.current.onResults(onResults);
      
      // 初始化相机 - 优化：根据设备性能调整分辨率
      const cameraResolution = devicePerformanceRef.current === 'low' ? { width: 480, height: 360 } : { width: 640, height: 480 };
      
      cameraUtilsRef.current = new (window as any).Camera(videoElement, {
        onFrame: async () => {
          // 只在启用手势检测时发送帧
          if (isEnabled && handsInstanceRef.current) {
            try {
              await handsInstanceRef.current.send({image: videoElement});
            } catch (sendError) {
              // 发送帧失败时静默处理，不影响用户体验
              console.warn('Failed to send frame to hands instance:', sendError);
            }
          }
        },
        width: cameraResolution.width,
        height: cameraResolution.height
      });
      
      await cameraUtilsRef.current.start();
      
      setIsEnabled(true);
      setIsInitialized(true);
      updateStatus('手势控制已启用', 'text-green-400');
      
      loadSuccess = true;
      
    } catch (error) {
      console.error('Error initializing gesture control:', error);
      updateStatus('手势控制初始化失败', 'text-gray-400');
      
      // 清理资源
      // 全局console.log已由App.tsx管理，此处无需恢复
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, loadScript, onGestureDetected, onScaleChange, updateStatus]);
  
  // 切换手势控制状态
  const toggleGestureControl = useCallback(async () => {
    if (isEnabled) {
      stopGestureControl();
    } else {
      await initializeGestureControl();
    }
  }, [isEnabled, initializeGestureControl, stopGestureControl]);
  
  // 清理资源 - 优化：增强组件卸载时的清理逻辑
  useEffect(() => {
    return () => {
      // 停止手势控制
      stopGestureControl();
      
      // 确保原始console.log被恢复
      // 全局console.log已由App.tsx管理，此处无需恢复
      
      // 清理canvas资源
      if (previewCtxRef.current) {
        const canvas = previewCtxRef.current.canvas;
        previewCtxRef.current.clearRect(0, 0, canvas.width, canvas.height);
        previewCtxRef.current = null;
        
        // 如果画布不在DOM中，移除它
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }
      
      // 清空所有缓存和引用
      scriptLoadPromisesRef.current.clear();
      handsInstanceRef.current = null;
      cameraUtilsRef.current = null;
      
      // 重置状态
      setIsEnabled(false);
      setIsInitialized(false);
      updateStatus('手势控制已禁用', 'text-yellow-400');
    };
  }, [stopGestureControl, updateStatus]);
  
  return (
    <button 
      onClick={toggleGestureControl} 
      className={`flex items-center justify-center w-full py-2 ${isEnabled ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border-yellow-400/50' : 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-400/50'} rounded-lg text-sm transition-colors border`}
      disabled={isLoading}
    >
      {isLoading ? (
        <><i className="fas fa-circle-notch fa-spin mr-2"></i> 初始化中...</>
      ) : isEnabled ? (
        <><i className="fas fa-hand-paper-slash mr-2"></i> 禁用手势控制</>
      ) : (
        <><i className="fas fa-hand-paper mr-2"></i> 启用手势控制</>
      )}
    </button>
  );
});