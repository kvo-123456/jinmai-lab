import React, { useEffect, useRef } from 'react';

export default function ParticleArt() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 设置容器样式
    if (containerRef.current) {
      containerRef.current.style.position = 'relative';
      containerRef.current.style.width = '100%';
      containerRef.current.style.height = '100vh';
      containerRef.current.style.backgroundColor = '#050505';
      containerRef.current.style.margin = '0';
      containerRef.current.style.overflow = 'hidden';
      containerRef.current.style.fontFamily = 'Segoe UI, sans-serif';
      containerRef.current.innerHTML = `
        <!-- 加载遮罩层 -->
        <div id="loading-screen" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500">
          <div class="loader mb-4"></div>
          <h2 class="text-xl font-light tracking-widest text-blue-400">正在初始化神经系统...</h2>
          <p class="text-sm text-gray-500 mt-2">请允许摄像头权限以启用手势控制</p>
        </div>

        <!-- UI 控制层 -->
        <div class="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
            
          <!-- 左上角标题与状态 -->
          <div class="pointer-events-auto">
              <h1 class="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 drop-shadow-lg">
                  NEBULA FLOW
              </h1>
              <div class="flex items-center gap-2 mt-2">
                  <div id="status-dot" class="w-2 h-2 rounded-full bg-red-500"></div>
                  <span id="status-text" class="text-xs text-gray-400 uppercase tracking-widest">等待摄像头...</span>
              </div>
              <p class="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                  当前尺度因子: <span id="scale-readout" class="text-blue-300 font-bold">1.00</span>
              </p>
          </div>

          <!-- 右上角控制面板 -->
          <div class="flex flex-col gap-4 pointer-events-auto bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl transition-all hover:bg-black/60">
              
            <!-- 粒子形状选择器 (新增) -->
            <div class="group flex items-center justify-between gap-4">
                <span class="text-sm text-gray-300 font-medium"><i class="fas fa-shapes mr-2"></i>粒子形状</span>
                <select id="shape-selector" class="bg-white/10 text-white text-xs py-1.5 pl-2 pr-8 rounded-lg cursor-pointer border border-white/20">
                    <option value="galaxy">星系漩涡 (默认)</option>
                    <option value="shibajie_mahua">十八街麻花 (Braid)</option>
                    <option value="goubuli_baozi">狗不理包子 (Baozi)</option>
                    <option value="eryeyan_zhagao">耳朵眼炸糕 (Zhagao)</option>
                    <option value="darentang">达仁堂药丸 (Pill)</option>
                    <option value="yangliuqing">杨柳青年画 (Painting)</option>
                    <option value="kite">风筝魏 (Kite)</option>
                    <option value="clay_figure">泥人张 (Clay Figure)</option>
                </select>
            </div>
            
            <!-- 颜色选择器 -->
            <div class="group flex items-center justify-between gap-4">
                <span class="text-sm text-gray-300 font-medium"><i class="fas fa-palette mr-2"></i>粒子颜色</span>
                <input type="color" id="color-picker" value="#00ffff" title="选择粒子颜色">
            </div>

            <!-- Gemini LLM 功能按钮 -->
            <button id="generate-report-btn" class="flex items-center justify-center w-full py-2 px-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-sm transition-colors border border-purple-400/50 text-purple-300 font-bold">
                <i class="fas fa-microchip mr-2"></i> ✨ 生成异常报告
            </button>

            <!-- 全屏按钮 -->
            <button id="fullscreen-btn" class="flex items-center justify-center w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
                <i class="fas fa-expand mr-2"></i> 全屏沉浸
            </button>
          </div>
        </div>

        <!-- 摄像头预览 (左下角) -->
        <div class="absolute bottom-6 left-6 z-10 pointer-events-auto">
          <div class="relative group">
              <video id="input-video" class="w-32 h-24 object-cover hidden"></video> <!-- 原始视频隐藏，只用于计算 -->
              <canvas id="camera-preview" class="w-40 h-32 bg-black/50"></canvas>
              <div class="absolute bottom-1 left-1 bg-black/60 px-2 py-0.5 rounded text-[10px] text-gray-300 backdrop-blur-sm">
                  视觉传感器
              </div>
          </div>
        </div>

        <!-- WebGL 画布 -->
        <canvas id="webgl-canvas" class="block w-full h-full"></canvas>

        <!-- 异常报告模态窗口 -->
        <div id="report-modal" class="hidden fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div id="report-content" class="anomaly-modal p-8 w-full max-w-xl rounded-xl text-sm transition-transform duration-300">
              <h3 class="text-xl font-bold mb-4 border-b border-blue-400/50 pb-2 flex justify-between items-center text-blue-300">
                  <i class="fas fa-exclamation-triangle mr-2"></i> ANOMALY REPORT
              </h3>
              <div id="report-output" class="space-y-4">
                  <p class="text-gray-400 text-center"><i class="fas fa-circle-notch fa-spin mr-2"></i> 正在分析数据流...</p>
              </div>
              <button id="close-report-btn" class="mt-6 w-full py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-300 text-xs font-bold uppercase border border-red-500/30">
                  DISMISS [确认解除]
              </button>
          </div>
        </div>
      `;
    }

    // 加载外部样式
    const loadStyles = () => {
      // 加载Tailwind CSS
      const tailwindLink = document.createElement('link');
      tailwindLink.href = 'https://cdn.tailwindcss.com';
      tailwindLink.rel = 'stylesheet';
      document.head.appendChild(tailwindLink);

      // 加载Font Awesome
      const faLink = document.createElement('link');
      faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
      faLink.rel = 'stylesheet';
      document.head.appendChild(faLink);

      // 添加自定义样式
      const style = document.createElement('style');
      style.textContent = `
        /* 摄像头预览窗口样式 */
        #camera-preview {
          transform: scaleX(-1); /* 镜像翻转，使手势更自然 */
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        /* 自定义颜色选择器样式 */
        input[type="color"] {
          -webkit-appearance: none;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          cursor: pointer;
        }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; }

        /* 下拉选择器样式 */
        #shape-selector {
          appearance: none; /* 移除默认样式 */
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239CA3AF'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          padding-right: 2rem;
        }

        /* 加载动画 */
        .loader {
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left-color: #3b82f6;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* 模态窗口样式 - 突出科幻感 */
        .anomaly-modal {
          background-color: rgba(10, 25, 45, 0.9);
          border: 2px solid #3b82f6;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
        }
        /* 威胁等级颜色定义 */
        .threat-critical { color: #f87171; }
        .threat-high { color: #fbbf24; }
        .threat-medium { color: #34d399; }
        .threat-low { color: #60a5fa; }
      `;
      document.head.appendChild(style);
    };

    // 加载所需的外部库
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    // 初始化函数
    const init = async () => {
      try {
        // 加载样式
        loadStyles();
        
        // 加载Three.js
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        
        // 加载MediaPipe相关库
        await Promise.all([
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')
        ]);
        
        // 加载本地粒子系统脚本
        await loadScript('/particle-system.js');
      } catch (error) {
        console.error('Failed to load libraries:', error);
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
          loadingScreen.innerHTML = `
            <div class="text-red-500 text-2xl mb-4">⚠️</div>
            <h2 class="text-xl font-light tracking-widest text-red-400">加载失败</h2>
            <p class="text-sm text-gray-500 mt-2">无法加载必要的库文件，请检查网络连接</p>
          `;
        }
      }
    };

    // 调用初始化函数
    init();

    // 清理函数
    return () => {
      // 移除动态添加的样式和链接
      const links = document.querySelectorAll('link');
      links.forEach(link => {
        if (link.href.includes('tailwindcss.com') || link.href.includes('font-awesome')) {
          link.remove();
        }
      });
      
      const styles = document.querySelectorAll('style');
      styles.forEach(style => {
        if (style.textContent && style.textContent.includes('摄像头预览窗口样式')) {
          style.remove();
        }
      });
    };
  }, []);

  return <div ref={containerRef} className="w-full h-screen"></div>;
}
