// 粒子系统的主要逻辑
const state = {
  targetScale: 1.0,
  currentScale: 1.0,
  baseColor: new THREE.Color(0x00ffff),
  handsDetected: false,
  isLoaded: false
};

// 粒子系统相关全局变量
let particlesMesh;
let coreMesh;
let material;
let currentShape = 'galaxy';

// 颜色主题配置 
const COLOR_THEMES = {
    'galaxy': { hex: '#00ffff', name: '宇宙青色' }, 
    'kite': { hex: '#ff4500', name: '烈焰红' },
    'shibajie_mahua': { hex: '#ffcc00', name: '金黄焦糖' },
    'clay_figure': { hex: '#a0522d', name: '陶土棕' },
    'goubuli_baozi': { hex: '#ccffcc', name: '嫩绿蒸汽' },
    'yangliuqing': { hex: '#4169e1', name: '宝蓝色' },
    'eryeyan_zhagao': { hex: '#ffc72c', name: '金黄琥珀' },
    'darentang': { hex: '#8b0000', name: '古朴朱红' }
};

// 形状配置常量
const SHAPE_CONFIG = {
    particlesCount: 8000,
    size: 50
};

// DOM 元素
const canvas = document.getElementById('webgl-canvas');
const videoElement = document.getElementById('input-video');
const previewCanvas = document.getElementById('camera-preview');
const previewCtx = previewCanvas.getContext('2d');
const loadingScreen = document.getElementById('loading-screen');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const scaleReadout = document.getElementById('scale-readout');
const shapeSelector = document.getElementById('shape-selector');
const colorPicker = document.getElementById('color-picker');
const generateReportBtn = document.getElementById('generate-report-btn');
const reportModal = document.getElementById('report-modal');
const closeReportBtn = document.getElementById('close-report-btn');
const reportContent = document.getElementById('report-content');
const reportOutput = document.getElementById('report-output');
const fullscreenBtn = document.getElementById('fullscreen-btn');

// 检查必要的元素是否存在
if (!canvas || !previewCtx) {
  console.error('粒子系统初始化失败：缺少必要的DOM元素');
  if (loadingScreen) {
    loadingScreen.innerHTML = `
      <div class="text-red-500 text-2xl mb-4">⚠️</div>
      <h2 class="text-xl font-light tracking-widest text-red-400">初始化失败</h2>
      <p class="text-sm text-gray-500 mt-2">缺少必要的DOM元素，请检查页面结构</p>
    `;
  }
  // 使用throw代替return，确保错误被捕获
  throw new Error('粒子系统初始化失败：缺少必要的DOM元素');
}

/**
 * Three.js 场景初始化
 */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.002);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * 粒子形状生成函数
 */
function createParticleGeometry(shape) {
    const particlesCount = SHAPE_CONFIG.particlesCount;
    const posArray = new Float32Array(particlesCount * 3);
    const randomArray = new Float32Array(particlesCount);
    
    for(let i = 0; i < particlesCount; i++) {
        const index = i * 3;
        let x = 0, y = 0, z = 0;
        
        if (shape === 'kite') {
            const scale = 15;
            const r = Math.random();
            const kiteThickness = 2.0;

            if (r < 0.15) {
                x = (Math.random() - 0.5) * 1;
                y = (Math.random() - 0.5) * scale * 1.5;
                z = (Math.random() - 0.5) * kiteThickness;
            } else if (r < 0.3) {
                x = (Math.random() - 0.5) * scale * 2;
                y = (Math.random() - 0.5) * 1;
                z = (Math.random() - 0.5) * kiteThickness;
            } else {
                x = (Math.random() - 0.5) * scale * 2;
                y = (Math.random() - 0.5) * scale * 1.5;
                z = (Math.random() - 0.5) * kiteThickness;
                
                if (Math.abs(x) / (scale * 1.0) + Math.abs(y) / (scale * 0.75) > 1.0) {
                    x *= 0.5;
                    y *= 0.5;
                }
            }
        } else if (shape === 'shibajie_mahua') {
            const R = 8;
            const r_cross = 2;
            const twist = 3;
            const t = Math.random() * Math.PI * 4;
            const u = Math.random() * Math.PI * 2;
            
            const base_x = R * Math.cos(t);
            const base_y = R * Math.sin(t);
            const base_z = t * 2;
            
            const twisted_u = u + t * twist * 0.1;
            
            x = base_x + r_cross * Math.cos(twisted_u);
            y = base_y + r_cross * Math.sin(twisted_u);
            z = base_z - 15;
        } else if (shape === 'clay_figure') {
            const radius = 12;
            const r = Math.pow(Math.random(), 1/3) * radius;
            const u = Math.random() * 2 * Math.PI;
            let v = Math.acos(Math.random() * 2 - 1);
            
            x = r * Math.sin(v) * Math.cos(u) * 0.8;
            y = r * Math.cos(v) * 1.5;
            z = r * Math.sin(v) * Math.sin(u) * 0.8;
            
            y = y - 5;
        } else if (shape === 'goubuli_baozi') {
            const radius = 10;
            const r = Math.pow(Math.random(), 1/3) * radius;
            const u = Math.random() * Math.PI * 2;
            let v = Math.acos(Math.random() * 2 - 1);
            
            if (Math.random() < 0.6) {
                v = Math.acos(Math.random() * 0.5 + 0.5);
            }
            
            x = r * Math.sin(v) * Math.cos(u);
            y = r * Math.sin(v) * Math.sin(u);
            z = r * Math.cos(v);
            
            if (z > 0) z *= 1.1;
        } else if (shape === 'yangliuqing') {
            const width = 20;
            const height = 15;
            const thickness = 4;
            
            x = (Math.random() - 0.5) * width;
            y = (Math.random() - 0.5) * height;
            z = (Math.random() - 0.5) * thickness;
        } else if (shape === 'eryeyan_zhagao') {
            const radius = 10;
            const r = Math.pow(Math.random(), 1/3) * radius;
            const u = Math.random() * 2 * Math.PI;
            const v = Math.acos(Math.random() * 2 - 1);
            
            const heightFactor = 0.6;
            
            x = r * Math.sin(v) * Math.cos(u);
            y = r * Math.cos(v) * heightFactor;
            z = r * Math.sin(v) * Math.sin(u);
        } else if (shape === 'darentang') {
            const radius = 8;
            const r = Math.pow(Math.random(), 1/3) * radius;
            const u = Math.random() * 2 * Math.PI;
            const v = Math.acos(Math.random() * 2 - 1);
            
            x = r * Math.sin(v) * Math.cos(u);
            y = r * Math.cos(v);
            z = r * Math.sin(v) * Math.sin(u);
        } else {
            const distance = Math.pow(Math.random(), 3) * 25 + 5;
            const angle = Math.random() * Math.PI * 2;
            const armOffset = (Math.random() - 0.5) * 5;
            
            x = distance * Math.cos(angle) + armOffset;
            y = (Math.random() - 0.5) * 5;
            z = distance * Math.sin(angle);
            
            const spiralAngle = angle * 2;
            x += Math.cos(spiralAngle) * 2;
            z += Math.sin(spiralAngle) * 2;
        }

        posArray[index] = x;
        posArray[index + 1] = y;
        posArray[index + 2] = z;
        
        randomArray[i] = Math.random();
    }

    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    newGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));
    return newGeometry;
}

function initializeParticles(shapeName) {
    if (particlesMesh) {
        scene.remove(particlesMesh);
        particlesMesh.geometry.dispose();
    }
    if (coreMesh) {
        scene.remove(coreMesh);
        coreMesh.geometry.dispose();
    }
    
    currentShape = shapeName;

    const theme = COLOR_THEMES[shapeName] || COLOR_THEMES['galaxy'];
    const newColor = new THREE.Color(theme.hex);
    state.baseColor.set(newColor);
    colorPicker.value = theme.hex;
    
    const newGeometry = createParticleGeometry(shapeName);
    
    if (!material) {
        const sprite = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');
        material = new THREE.PointsMaterial({
            size: 0.2,
            map: sprite,
            transparent: true,
            color: state.baseColor,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.8
        });
    }

    material.color.set(newColor);
    
    particlesMesh = new THREE.Points(newGeometry, material);
    scene.add(particlesMesh);

    const coreRadius = (shapeName === 'galaxy' || shapeName === 'goubuli_baozi') ? 1 : (shapeName === 'darentang' ? 0.8 : 0.2);
    const coreMaterial = new THREE.MeshBasicMaterial({ 
        color: newColor,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    const coreGeometry = new THREE.SphereGeometry(coreRadius, 32, 32);
    coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreMesh);
    
    if (shapeName === 'shibajie_mahua') {
        camera.position.set(0, 0, 45);
        camera.rotation.x = 0;
    } else if (shapeName === 'kite') {
        camera.position.set(0, 0, 35);
        camera.rotation.x = -0.3;
    } else if (shapeName === 'yangliuqing') {
        camera.position.set(0, 0, 30);
        camera.rotation.x = -0.5;
    } else if (shapeName === 'eryeyan_zhagao') {
        camera.position.set(0, 0, 30);
        camera.rotation.x = -0.1;
    } else if (shapeName === 'darentang') {
        camera.position.set(0, 0, 25);
        camera.rotation.x = 0;
    } else {
        camera.position.set(0, 0, 30);
        camera.rotation.x = 0;
    }
    
    state.targetScale = 1.0;
    state.currentScale = 1.0;
    camera.fov = 75;
    camera.updateProjectionMatrix();
    particlesMesh.rotation.set(0, 0, 0);
}

// 初始化粒子系统
initializeParticles('galaxy');

/**
 * MediaPipe Hands 初始化与逻辑
 */
function onResults(results) {
    previewCtx.save();
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.drawImage(results.image, 0, 0, previewCanvas.width, previewCanvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        state.handsDetected = true;
        updateStatus(true);

        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(previewCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 1});
            drawLandmarks(previewCtx, landmarks, {color: '#FF0000', lineWidth: 1, radius: 2});
        }

        let newScale = 1.0;

        if (results.multiHandLandmarks.length === 2) {
            const hand1 = results.multiHandLandmarks[0][9];
            const hand2 = results.multiHandLandmarks[1][9];
            
            const distance = Math.sqrt(
                Math.pow(hand1.x - hand2.x, 2) + 
                Math.pow(hand1.y - hand2.y, 2)
            );
            
            newScale = Math.max(0.5, Math.min(distance * 4, 5.0));
        } else if (results.multiHandLandmarks.length === 1) {
            const landmarks = results.multiHandLandmarks[0];
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];

            const pinchDistance = Math.sqrt(
                Math.pow(thumbTip.x - indexTip.x, 2) + 
                Math.pow(thumbTip.y - indexTip.y, 2)
            );

            newScale = Math.max(0.5, Math.min(3.0 - pinchDistance * 3.5, 3.0));
        }

        state.targetScale = newScale;
    } else {
        state.handsDetected = false;
        updateStatus(false);
        state.targetScale = 1.0 + Math.sin(Date.now() * 0.001) * 0.05;
    }
    previewCtx.restore();
}

const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const cameraUtils = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 640,
    height: 480
});

cameraUtils.start()
    .then(() => {
        loadingScreen.classList.add('opacity-0');
        setTimeout(() => loadingScreen.remove(), 500);
    })
    .catch(err => {
        console.error("Camera error:", err);
        statusText.innerText = "摄像头访问失败";
        statusDot.classList.replace('bg-red-500', 'bg-gray-500');
        loadingScreen.classList.add('opacity-0');
        setTimeout(() => loadingScreen.remove(), 500);
    });

/**
 * 动画循环
 */
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    state.currentScale += (state.targetScale - state.currentScale) * 0.08;

    if (particlesMesh) {
        particlesMesh.scale.setScalar(state.currentScale);
    }
    
    if (material) {
        const scaleFactor = state.currentScale;
        material.size = 0.2;
        material.opacity = Math.min(1.0, 0.5 + Math.max(0, (scaleFactor - 1.0)) * 1.0);
    }

    if (coreMesh && coreMesh.material) {
        coreMesh.material.opacity = Math.min(1.0, 0.3 + (state.currentScale - 1.0) * 1.0);
        coreMesh.scale.setScalar(state.currentScale * 0.8);
    }
    
    const maxFovShift = 50;
    const fovInfluence = Math.pow(Math.max(0, state.currentScale - 1.0), 2);
    const targetFov = 75 + fovInfluence * maxFovShift;
    camera.fov += (targetFov - camera.fov) * 0.1;
    camera.updateProjectionMatrix();

    if (particlesMesh) {
        const slowFactor = 0.4;
        
        if (currentShape === 'shibajie_mahua') {
            particlesMesh.rotation.y = elapsedTime * 0.15;
            particlesMesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.2;
        } else if (currentShape === 'kite') {
            particlesMesh.rotation.z = elapsedTime * 0.08;
            particlesMesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.3;
        } else if (currentShape === 'yangliuqing') {
            particlesMesh.rotation.y = elapsedTime * 0.02;
            particlesMesh.rotation.x = -0.5 + Math.sin(elapsedTime * 0.2) * 0.05;
        } else if (currentShape === 'goubuli_baozi') {
            particlesMesh.rotation.x = elapsedTime * 0.03;
            particlesMesh.rotation.z = Math.sin(elapsedTime * 0.3) * 0.1;
        } else if (currentShape === 'eryeyan_zhagao') {
            particlesMesh.rotation.y = elapsedTime * 0.05;
            particlesMesh.rotation.z = Math.sin(elapsedTime * 0.2) * 0.05;
        } else if (currentShape === 'darentang') {
            particlesMesh.rotation.y = elapsedTime * 0.01;
            particlesMesh.rotation.x = elapsedTime * 0.005;
        } else {
            particlesMesh.rotation.y = elapsedTime * 0.02;
            particlesMesh.rotation.x = elapsedTime * 0.01;
        }
    }
    
    scaleReadout.innerText = state.currentScale.toFixed(2);

    renderer.render(scene, camera);
}

animate();

/**
 * LLM 异常报告生成器功能
 */
function getCurrentHexColor() {
    return `#${state.baseColor.getHexString()}`;
}

const apiKey = "";
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

async function fetchWithRetry(url, options, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (response.status === 429 && i < maxRetries - 1) {
                    const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function generateAnomalyReport() {
    generateReportBtn.disabled = true;
    generateReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> 正在生成报告...';
    reportOutput.innerHTML = '<p class="text-gray-400 text-center"><i class="fas fa-circle-notch fa-spin mr-2"></i> 正在分析数据流...</p>';
    reportModal.classList.remove('hidden');

    const scaleFactor = state.currentScale.toFixed(2);
    const colorHex = getCurrentHexColor();
    const shapeNameCn = shapeSelector.options[shapeSelector.selectedIndex].text.split(' ')[0];

    const systemInstruction = "你是一位专业的星际分析员，专注于编写简洁、正式、具有科幻风格的异常报告。你的报告必须基于提供的参数并严格遵守给定的JSON格式。";

    let scaleType;
    if (scaleFactor > 2.0) {
        scaleType = "极度膨胀 (Extreme Expansion)";
    } else if (scaleFactor > 1.2) {
        scaleType = "快速膨胀 (Rapid Expansion)";
    } else if (scaleFactor < 0.7) {
        scaleType = "引力坍缩 (Gravitational Collapse)";
    } else {
        scaleType = "系统稳定 (System Stability)";
    }

    const userQuery = `分析当前粒子系统的状态并生成异常报告。
    当前粒子形态: ${shapeNameCn}
    当前尺度因子 (Scale Factor): ${scaleFactor}
    粒子主要颜色 (Primary Color): ${colorHex}
    尺度类型 (Scale Type): ${scaleType}
    
    请根据这些参数，创建一个异常标题、一个不超过60字的中文描述，并确认威胁等级。`;
    
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "anomaly_title_cn": { "type": "STRING", "description": "富有科幻感的中文异常标题" },
                    "anomaly_title_en": { "type": "STRING", "description": "对应的英文标题" },
                    "threat_level": { "type": "STRING", "description": "威胁等级，必须是：CRITICAL, HIGH, MEDIUM, 或 LOW" },
                    "description_cn": { "type": "STRING", "description": "基于参数的中文报告描述，不超过60字" }
                },
                "propertyOrdering": ["anomaly_title_cn", "anomaly_title_en", "threat_level", "description_cn"]
            }
        }
    };

    try {
        const result = await fetchWithRetry(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            const jsonString = candidate.content.parts[0].text;
            const report = JSON.parse(jsonString);

            let threatClass;
            switch (report.threat_level.toUpperCase()) {
                case 'CRITICAL': threatClass = 'threat-critical'; break;
                case 'HIGH': threatClass = 'threat-high'; break;
                case 'MEDIUM': threatClass = 'threat-medium'; break;
                case 'LOW': threatClass = 'threat-low'; break;
                default: threatClass = 'text-gray-400';
            }

            reportOutput.innerHTML = `
                <div class="space-y-2">
                    <p class="text-xs text-gray-500 uppercase">TITLE / 标题</p>
                    <p class="text-lg font-bold text-white">${report.anomaly_title_cn} <span class="text-gray-400 font-normal ml-2 text-sm">(${report.anomaly_title_en})</span></p>
                </div>
                <div class="flex justify-between border-t border-b border-white/10 py-3 mt-4 text-xs font-mono">
                    <div>THREAT LEVEL: <span class="${threatClass} font-bold">${report.threat_level.toUpperCase()}</span></div>
                    <div>SHAPE / 形态: <span class="text-white">${shapeNameCn}</span></div>
                    <div>SCALE FACTOR: <span class="text-white">${scaleFactor}</span></div>
                </div>
                <div class="mt-4">
                    <p class="text-xs text-gray-500 uppercase mb-2">MISSION LOG / 任务日志</p>
                    <p class="text-base text-gray-300 leading-relaxed">${report.description_cn}</p>
                </div>
            `;
        } else {
            reportOutput.innerHTML = '<p class="text-red-400 text-center"><i class="fas fa-bug mr-2"></i> 报告系统故障：数据解析失败。</p>';
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        reportOutput.innerHTML = `<p class="text-red-400 text-center"><i class="fas fa-times-circle mr-2"></i> CRITICAL ERROR: 无法连接到分析核心。</p>`;
    } finally {
        generateReportBtn.disabled = false;
        generateReportBtn.innerHTML = '<i class="fas fa-microchip mr-2"></i> ✨ 生成异常报告';
    }
}

/**
 * 事件监听与 UI 交互
 */
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

colorPicker.addEventListener('input', (e) => {
    const color = new THREE.Color(e.target.value);
    state.baseColor.set(color);
    if (material) material.color.set(color);
    if (coreMesh && coreMesh.material) coreMesh.material.color.set(color);
});

shapeSelector.addEventListener('change', (e) => {
    initializeParticles(e.target.value);
});

generateReportBtn.addEventListener('click', generateAnomalyReport);

closeReportBtn.addEventListener('click', () => {
    reportModal.classList.add('hidden');
});

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
            .then(() => {
                fullscreenBtn.innerHTML = '<i class="fas fa-compress mr-2"></i> 退出全屏';
            })
            .catch(err => {
                console.warn("当前环境禁止全屏 API:", err);
            });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen()
                .then(() => {
                    fullscreenBtn.innerHTML = '<i class="fas fa-expand mr-2"></i> 全屏沉浸';
                })
                .catch(err => console.warn("退出全屏失败:", err));
        }
    }
});

function updateStatus(isDetected) {
    if (isDetected) {
        statusDot.classList.replace('bg-red-500', 'bg-green-500');
        statusDot.classList.replace('bg-gray-500', 'bg-green-500');
        statusDot.classList.add('animate-pulse');
        statusText.innerText = "信号已链接";
        statusText.classList.add('text-green-400');
    } else {
        statusDot.classList.replace('bg-green-500', 'bg-red-500');
        statusDot.classList.remove('animate-pulse');
        statusText.innerText = "搜索手势信号...";
        statusText.classList.remove('text-green-400');
    }
}

previewCanvas.width = 320;
previewCanvas.height = 240;