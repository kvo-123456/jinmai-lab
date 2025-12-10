import { useState, useEffect, useRef, useCallback } from 'react';

// 手势类型枚举
export enum GestureType {
  UNKNOWN = 'unknown',
  OPEN_PALM = 'open_palm',
  CLOSED_FIST = 'closed_fist',
  PINCH = 'pinch',
  THUMBS_UP = 'thumbs_up',
  THUMBS_DOWN = 'thumbs_down',
  OK = 'ok',
  PEACE = 'peace',
  FINGER_GUNS = 'finger_guns'
}

// 手势数据类型
interface HandTrackingData {
  scale: number; // 双手张合程度 (0.5 - 2.0)
  spread: number; // 双手距离 (0 - 100)
  hands: number; // 检测到的手数量
  confidence: number; // 检测置信度 (0 - 1)
  dominantHand?: 'left' | 'right'; // 优势手
  gestureType?: GestureType; // 手势类型
  fingerCount: number; // 手指数量
  handPosition?: { x: number; y: number; z: number }[]; // 手部位置
  velocity?: number; // 手部移动速度
}

// 手势跟踪配置
interface HandTrackingConfig {
  onHandDetected?: (data: HandTrackingData) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

const useHandTracking = (config: HandTrackingConfig = {}) => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handData, setHandData] = useState<HandTrackingData>({
    scale: 1.0,
    spread: 50,
    hands: 0,
    confidence: 0,
    fingerCount: 0
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const enabledRef = useRef(config.enabled !== false);
  const originalConsoleLogRef = useRef<typeof console.log | null>(null);

  // 更新enabled状态
  useEffect(() => {
    enabledRef.current = config.enabled !== false;
    if (!enabledRef.current) {
      stopTracking();
    }
  }, [config.enabled]);

  // 初始化手势跟踪
  const initializeTracking = useCallback(async () => {
    if (isLoading || isActive || !enabledRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // 临时拦截console.log，过滤WebAssembly内存地址日志
      const originalConsoleLog = console.log;
      console.log = function(...args) {
        // 过滤掉看起来像内存地址的日志
        let isMemoryAddressLog = false;
        
        // 将所有参数转换为字符串，便于统一检查
        const allArgsString = args.map(arg => String(arg)).join(' ');
        
        // 1. 检查是否是包含多个内存地址的数组字符串，如：[0xc00b795760 0xc00b795790 ...]
        const bracketedMemoryAddressPattern = /^\[(\s*0x[0-9a-f]{8,}\s*){3,}\]$/i;
        
        // 2. 检查是否是纯内存地址格式，如：0xc00b795760
        const pureMemoryAddressPattern = /^0x[0-9a-f]{8,}$/i;
        
        // 3. 检查是否是多个独立的内存地址参数
        const multipleMemoryAddresses = args.length >= 3 && args.every(arg => {
          const argStr = String(arg);
          return pureMemoryAddressPattern.test(argStr);
        });
        
        // 检查每个参数
        for (const arg of args) {
          const argStr = String(arg);
          
          // 检查字符串形式的内存地址数组
          if (bracketedMemoryAddressPattern.test(argStr)) {
            isMemoryAddressLog = true;
            break;
          }
          
          // 检查纯内存地址字符串
          if (pureMemoryAddressPattern.test(argStr)) {
            isMemoryAddressLog = true;
            break;
          }
          
          // 检查实际的数组参数，可能包含多个内存地址
          if (Array.isArray(arg)) {
            // 如果数组长度大于等于3，且所有元素都是内存地址，过滤
            if (arg.length >= 3) {
              const allAreMemoryAddresses = arg.every(item => {
                const itemStr = String(item);
                return pureMemoryAddressPattern.test(itemStr) || 
                       (typeof item === 'number' && item > 0 && item.toString(16).length >= 8);
              });
              if (allAreMemoryAddresses) {
                isMemoryAddressLog = true;
                break;
              }
            }
          }
          
          // 检查对象中是否包含大量内存地址
          if (typeof arg === 'object' && arg !== null) {
            const objStr = JSON.stringify(arg);
            const memoryAddressCount = (objStr.match(/0x[0-9a-f]{8,}/gi) || []).length;
            if (memoryAddressCount >= 3) {
              isMemoryAddressLog = true;
              break;
            }
          }
        }
        
        // 检查是否是多个独立的内存地址参数
        if (multipleMemoryAddresses) {
          isMemoryAddressLog = true;
        }
        
        // 检查字符串中是否包含3个以上内存地址
        const memoryAddressCount = (allArgsString.match(/0x[0-9a-f]{8,}/gi) || []).length;
        if (memoryAddressCount >= 3) {
          isMemoryAddressLog = true;
        }
        
        // 检查是否是特定格式的MediaPipe内存地址日志
        if (/^\[(\s*0x[0-9a-f]{16,}\s*)+\]$/i.test(allArgsString)) {
          isMemoryAddressLog = true;
        }
        
        if (!isMemoryAddressLog) {
          originalConsoleLog.apply(console, args);
        }
      };
      // 保存原始console.log到ref以便在stopTracking中恢复
      originalConsoleLogRef.current = originalConsoleLog;

      // 动态导入MediaPipe Hands
      const { Hands } = await import('@mediapipe/hands');
      const Camera = (await import('@mediapipe/camera_utils')).default;

      // 检查摄像头权限
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());

      // 初始化Hands模型
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      });

      // 计算两点之间的距离
      const calculateDistance = (p1: any, p2: any) => {
        return Math.sqrt(
          Math.pow(p1.x - p2.x, 2) +
          Math.pow(p1.y - p2.y, 2) +
          Math.pow(p1.z - p2.z, 2)
        );
      };

      // 检测手指数量
      const countFingers = (landmarks: any[]) => {
        // 手指尖端索引：拇指(4), 食指(8), 中指(12), 无名指(16), 小指(20)
        // 手指指根索引：拇指(2), 食指(5), 中指(9), 无名指(13), 小指(17)
        const fingerTips = [4, 8, 12, 16, 20];
        const fingerRoots = [2, 5, 9, 13, 17];
        
        let count = 0;
        for (let i = 0; i < fingerTips.length; i++) {
          const tip = landmarks[fingerTips[i]];
          const root = landmarks[fingerRoots[i]];
          // 拇指特殊处理，比较与手掌中心的距离
          if (i === 0) {
            const palmCenter = landmarks[0];
            if (calculateDistance(tip, palmCenter) > calculateDistance(root, palmCenter)) {
              count++;
            }
          } else {
            // 其他手指比较与指根的Y坐标（Y轴向下）
            if (tip.y < root.y) {
              count++;
            }
          }
        }
        return count;
      };

      // 识别手势类型
      const recognizeGesture = (landmarks: any[], fingerCount: number) => {
        if (fingerCount === 0) {
          return GestureType.CLOSED_FIST;
        } else if (fingerCount === 5) {
          return GestureType.OPEN_PALM;
        } else if (fingerCount === 1) {
          // 检查是拇指还是其他手指
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          if (thumbTip.y < landmarks[2].y) {
            return GestureType.THUMBS_UP;
          } else if (thumbTip.y > landmarks[2].y) {
            return GestureType.THUMBS_DOWN;
          }
        } else if (fingerCount === 2) {
          // 检查是食指和中指（和平手势）还是食指和拇指（捏合）
          const indexTip = landmarks[8];
          const middleTip = landmarks[12];
          const thumbTip = landmarks[4];
          const distanceIndexMiddle = calculateDistance(indexTip, middleTip);
          const distanceIndexThumb = calculateDistance(indexTip, thumbTip);
          
          if (distanceIndexMiddle > distanceIndexThumb * 2) {
            return GestureType.PEACE;
          } else {
            return GestureType.PINCH;
          }
        } else if (fingerCount === 3) {
          // 检查是否是OK手势（拇指和食指形成圆圈）
          const indexTip = landmarks[8];
          const thumbTip = landmarks[4];
          const distance = calculateDistance(indexTip, thumbTip);
          if (distance < 0.05) {
            return GestureType.OK;
          }
        }
        return GestureType.UNKNOWN;
      };

      // 设置手势检测回调
      hands.onResults((results: any) => {
        if (!enabledRef.current) return;

        let newHandData: HandTrackingData = {
          scale: 1.0,
          spread: 50,
          hands: 0,
          confidence: 0,
          fingerCount: 0,
          velocity: 0
        };

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const handsCount = results.multiHandLandmarks.length;
          newHandData.hands = handsCount;

          // 计算置信度
          if (results.multiHandedness) {
            const totalConfidence = results.multiHandedness.reduce((sum: number, hand: any) => {
              return sum + hand.score;
            }, 0);
            newHandData.confidence = totalConfidence / handsCount;
            
            // 确定优势手
            if (handsCount === 1) {
              newHandData.dominantHand = results.multiHandedness[0].label;
            }
          }

          // 处理单只手
          if (handsCount >= 1) {
            const landmarks = results.multiHandLandmarks[0];
            const fingerCount = countFingers(landmarks);
            newHandData.fingerCount = fingerCount;
            newHandData.gestureType = recognizeGesture(landmarks, fingerCount);
            
            // 计算食指指尖到拇指指尖的距离（张合程度）
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];
            const distance = calculateDistance(indexTip, thumbTip);
            // 归一化到0.5-2.0范围
            newHandData.scale = 0.5 + Math.min(distance * 5, 1.5);
            
            // 记录手部位置
            newHandData.handPosition = landmarks.map((lm: any) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z
            }));
          }

          // 处理两只手的距离
          if (handsCount === 2) {
            const hand1 = results.multiHandLandmarks[0][0]; // 手腕
            const hand2 = results.multiHandLandmarks[1][0]; // 手腕
            const distance = calculateDistance(hand1, hand2);
            // 归一化到0-100范围
            newHandData.spread = Math.min(distance * 200, 100);
          }
        }

        setHandData(newHandData);
        if (config.onHandDetected) {
          config.onHandDetected(newHandData);
        }
      });

      handsRef.current = hands;

      // 初始化摄像头
      if (videoRef.current) {
        // 使用手动帧处理，不使用Camera类
        const startCamera = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            videoRef.current!.srcObject = stream;
            await videoRef.current!.play();
            setIsActive(true);
          } catch (error) {
            console.error('Error accessing camera:', error);
            setError('无法访问摄像头');
            setIsActive(false);
            return;
          }

          const processFrame = async () => {
            if (enabledRef.current && videoRef.current && handsRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                await handsRef.current.send({
                  image: videoRef.current
                });
              } catch (error) {
                console.error('Error processing frame:', error);
              }
            }
            requestAnimationFrame(processFrame);
          };

          requestAnimationFrame(processFrame);
        };

        startCamera();
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      if (config.onError) {
        config.onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [config, isLoading, isActive]);

  // 停止手势跟踪
  const stopTracking = useCallback(() => {
    if (!isActive) return;

    try {
      // 恢复原始console.log
      if (originalConsoleLogRef.current) {
        console.log = originalConsoleLogRef.current;
        originalConsoleLogRef.current = null;
      }
      
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
      setIsActive(false);
      setHandData({
        scale: 1.0,
        spread: 50,
        hands: 0,
        confidence: 0,
        fingerCount: 0
      });
    } catch (err) {
      console.error('Error stopping hand tracking:', err);
    }
  }, [isActive]);

  // 启动/停止跟踪
  useEffect(() => {
    if (enabledRef.current) {
      initializeTracking();
    }

    return () => {
      stopTracking();
    };
  }, [initializeTracking, stopTracking]);

  return {
    isActive,
    isLoading,
    error,
    handData,
    videoRef,
    startTracking: initializeTracking,
    stopTracking
  };
};

export default useHandTracking;