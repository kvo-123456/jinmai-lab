import { useState, useEffect } from 'react';
import { ParticleModelType } from '@/lib/particleModels';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import ParticleSystem from '@/components/ParticleSystem';
import { Canvas } from '@react-three/fiber';

// 津门老字号主题配置 - 优化颜色方案
const tianjinThemes = [
  {
    name: '泥人张',
    description: '天津传统彩塑，形神兼备的艺术风格',
    color: '#d4a574',
    model: 'buddha' as ParticleModelType,
    icon: '🗿',
    behavior: 'default' as const
  },
  {
    name: '杨柳青年画',
    description: '中国著名民间木版年画，色彩鲜艳',
    color: '#ff6b6b',
    model: 'flower' as ParticleModelType,
    icon: '🖼️',
    behavior: 'wave' as const
  },
  {
    name: '风筝魏',
    description: '天津特色风筝，精巧工艺',
    color: '#4ecdc4',
    model: 'firework' as ParticleModelType,
    icon: '🪁',
    behavior: 'spiral' as const
  },
  {
    name: '狗不理包子',
    description: '天津传统美食，皮薄馅大',
    color: '#f9d79b', // 优化为更符合包子的金黄色
    model: 'baozi' as ParticleModelType,
    icon: '🥟',
    behavior: 'orbit' as const
  },
  {
    name: '桂发祥麻花',
    description: '天津特色小吃，酥脆香甜',
    color: '#ff9f43',
    model: 'saturn' as ParticleModelType,
    icon: '🥨',
    behavior: 'explosion' as const
  }
];

// 粒子效果预设类型
interface ParticlePreset {
  id: string;
  name: string;
  icon: string;
  controls: ParticleControls;
}

// 定义粒子行为类型
type ParticleBehavior = 'spiral' | 'explosion' | 'wave' | 'orbit' | 'chaos' | 'default';

// 粒子效果控制选项
interface ParticleControls {
  showTrails: boolean;
  particleCount: number;
  animationSpeed: number;
  colorVariation: number;
  particleSize: number;
  rotationSpeed: number;
  gestureSensitivity: number; // 保留此参数用于粒子扩散控制
  behavior: ParticleBehavior;
}

// 粒子效果预设
const particlePresets: ParticlePreset[] = [
  {
    id: 'default',
    name: '默认效果',
    icon: '✨',
    controls: {
      showTrails: true,
      particleCount: 400, // 增加粒子数量，增强形状表现力
      animationSpeed: 1.2,
      colorVariation: 0.4,
      particleSize: 1.8,
      rotationSpeed: 1.0,
      gestureSensitivity: 1.0,
      behavior: 'default'
    }
  },
  {
    id: 'dense',
    name: '密集效果',
    icon: '🌊',
    controls: {
      showTrails: true,
      particleCount: 500, // 增加粒子数量，增强形状表现力
      animationSpeed: 0.8,
      colorVariation: 0.3,
      particleSize: 1.5,
      rotationSpeed: 0.8,
      gestureSensitivity: 0.8,
      behavior: 'wave'
    }
  },
  {
    id: 'shaped',
    name: '形状效果',
    icon: '🎯',
    controls: {
      showTrails: false,
      particleCount: 450, // 增加粒子数量，增强形状表现力
      animationSpeed: 0.6,
      colorVariation: 0.2,
      particleSize: 2.0,
      rotationSpeed: 0.4,
      gestureSensitivity: 0.6,
      behavior: 'orbit'
    }
  },
  {
    id: 'fast',
    name: '快速效果',
    icon: '⚡',
    controls: {
      showTrails: true,
      particleCount: 300,
      animationSpeed: 2.0,
      colorVariation: 0.6,
      particleSize: 1.5,
      rotationSpeed: 1.5,
      gestureSensitivity: 1.2,
      behavior: 'explosion'
    }
  },
  {
    id: 'slow',
    name: '慢速效果',
    icon: '🐌',
    controls: {
      showTrails: true,
      particleCount: 450, // 增加粒子数量，增强形状表现力
      animationSpeed: 0.5,
      colorVariation: 0.3,
      particleSize: 2.0,
      rotationSpeed: 0.4,
      gestureSensitivity: 0.8,
      behavior: 'spiral'
    }
  }
];

export default function ParticleArt() {
  const { isDark, theme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [model, setModel] = useState<ParticleModelType>(tianjinThemes[0].model);
  const [color, setColor] = useState(tianjinThemes[0].color);
  const [controls, setControls] = useState<ParticleControls>({
    showTrails: false,
    particleCount: 300,
    animationSpeed: 1.5,
    colorVariation: 0.6,
    particleSize: 1.5,
    rotationSpeed: 1.2,
    gestureSensitivity: 1.2,
    behavior: 'default'
  });
  const [showControls, setShowControls] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [customPresets, setCustomPresets] = useState<ParticlePreset[]>([]);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetIcon, setNewPresetIcon] = useState('🎨');
  const [particleSystemError, setParticleSystemError] = useState(false);
  const [showBrandCards, setShowBrandCards] = useState(true);
  
  // 组件挂载后强制触发一次状态更新，确保Framer Motion动画能正常触发
  useEffect(() => {
    setIsMounted(true);
    
    // 延迟100ms后强制更新一个状态，触发组件重新渲染，确保Framer Motion动画能正常触发
    const timer = setTimeout(() => {
      // 强制组件重新渲染，触发所有Framer Motion动画
      setShowControls(prev => prev);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // 自动收回品牌卡片的功能 - 点击任意品牌卡片后延迟1秒自动隐藏卡片
  // 添加一个状态来跟踪是否是通过点击品牌卡片触发的显示
  const [themeSelectedRecently, setThemeSelectedRecently] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 错误处理：粒子系统渲染失败时显示友好信息
  const handleParticleSystemError = () => {
    setParticleSystemError(true);
  };

  // 主题切换处理 - 优化自动隐藏逻辑
  const handleThemeChange = (index: number) => {
    setSelectedTheme(index);
    setModel(tianjinThemes[index].model);
    setColor(tianjinThemes[index].color);
    setThemeSelectedRecently(true);
    
    // 清除之前的定时器
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }
    
    // 1.2秒后自动隐藏品牌卡片，给用户足够的视觉反馈时间
    const timer = setTimeout(() => {
      setShowBrandCards(false);
      setThemeSelectedRecently(false);
    }, 1200);
    
    setAutoHideTimer(timer);
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  };
  
  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [autoHideTimer]);
  
  // 点击显示卡片时重置自动隐藏状态
  const handleToggleBrandCards = () => {
    setShowBrandCards(!showBrandCards);
    setThemeSelectedRecently(false);
    
    // 清除之前的定时器
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
      setAutoHideTimer(null);
    }
  };

  // 控制选项变化处理
  const handleControlChange = (key: keyof ParticleControls, value: number | boolean | ParticleBehavior) => {
    setControls(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // 保存自定义预设
  const saveCustomPreset = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset: ParticlePreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      icon: newPresetIcon,
      controls: { ...controls }
    };
    
    setCustomPresets(prev => [...prev, newPreset]);
    setShowSavePresetModal(false);
    setNewPresetName('');
    setNewPresetIcon('🎨');
  };
  
  // 全屏模式处理
  const handleFullscreen = () => {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // 删除自定义预设
  const deleteCustomPreset = (presetId: string) => {
    setCustomPresets(prev => prev.filter(preset => preset.id !== presetId));
  };
  
  // 合并所有预设（内置预设 + 自定义预设）
  const allPresets = [...particlePresets, ...customPresets];

  // 动态样式类
  const containerClasses = `relative overflow-hidden min-h-screen ${isDark ? 'bg-gradient-to-br from-[#0a0e17] via-[#1a1f2e] to-[#0a0e17]' : theme === 'pink' ? 'bg-gradient-to-br from-pink-50 to-purple-50' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`;

  return (
    <div className={`${containerClasses} overflow-hidden`}>
      {/* 粒子系统容器 - 确保全屏显示，z-index最高 */}
      <div className={`absolute inset-0 z-10 transition-all duration-1000 ease-in-out ${showBrandCards ? 'scale-100' : 'scale-105'}`}>
        {particleSystemError ? (
          // 粒子系统渲染失败时的回退内容
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm">
            <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
              <h3 className="text-2xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  粒子系统加载失败
                </span>
              </h3>
              <p className="text-gray-300 mb-6">
                很抱歉，粒子系统暂时无法加载。这可能是由于浏览器兼容性问题或资源加载失败导致的。
              </p>
              <button
                onClick={() => setParticleSystemError(false)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                重试加载
              </button>
            </div>
          </div>
        ) : (
          // 正常渲染粒子系统
          <div onError={handleParticleSystemError} className="w-full h-full">
            <Canvas>
              <ParticleSystem 
                model={model} 
                color={color} 
                behavior={controls.behavior} // 使用用户选择的行为模式
                particleCount={controls.particleCount}
                particleSize={controls.particleSize}
                animationSpeed={controls.animationSpeed}
                rotationSpeed={controls.rotationSpeed}
                colorVariation={controls.colorVariation}
                showTrails={controls.showTrails}
              />
            </Canvas>
          </div>
        )}
      </div>
      
      {/* 背景装饰 - 放在粒子系统下面 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* 动态渐变光环 - 根据品牌卡片状态调整效果 */}
        <motion.div 
          className={`absolute top-1/2 left-1/2 w-[120vw] h-[120vw] rounded-full bg-gradient-to-r from-pink-500/15 to-purple-500/15 blur-[80px] transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out ${showBrandCards ? '' : 'opacity-1.2'}`}
          animate={{ 
            scale: showBrandCards ? [1, 1.1, 1] : [1.1, 1.3, 1.1], 
            opacity: showBrandCards ? [0.3, 0.6, 0.3] : [0.4, 0.8, 0.4],
            rotate: [0, 90, 0]
          }} 
          transition={{ 
            duration: showBrandCards ? 15 : 10, 
            ease: "easeInOut", 
            repeat: Infinity, 
            repeatType: "reverse"
          }} 
        />
        {/* 辅助光环 - 根据品牌卡片状态调整效果 */}
        <motion.div 
          className={`absolute top-1/2 left-1/2 w-[100vw] h-[100vw] rounded-full bg-gradient-to-r from-blue-500/15 to-cyan-500/15 blur-[60px] transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out ${showBrandCards ? '' : 'opacity-1.2'}`}
          animate={{ 
            scale: showBrandCards ? [1, 1.2, 1] : [1.2, 1.4, 1.2], 
            opacity: showBrandCards ? [0.2, 0.4, 0.2] : [0.3, 0.6, 0.3],
            rotate: [0, -60, 0]
          }} 
          transition={{ 
            duration: showBrandCards ? 12 : 8, 
            ease: "easeInOut", 
            repeat: Infinity, 
            repeatType: "reverse"
          }} 
        />
        {/* 新增背景粒子效果 - 只在隐藏品牌卡片时显示 */}
        {!showBrandCards && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-white/20 backdrop-blur-sm"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 主内容区域 - 确保内容在粒子效果之上，可交互 */}
      <div className={`relative z-20 flex flex-col min-h-screen transition-all duration-800 ease-in-out ${showBrandCards ? 'opacity-100' : 'opacity-0.9'}`} data-mounted={isMounted}>
        {/* 顶部标题区 */}
        <header className={`py-8 px-6 text-center transition-all duration-1000 ease-in-out ${showBrandCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-20px] pointer-events-none'}`}>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              津门老字号 · 粒子艺术
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              探索天津传统文化与现代科技的完美融合
            </p>
          </div>
        </header>

        {/* 主题选择区 */}
        <main className="flex-1 px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            {/* 品牌选择卡片区域 - 添加动画过渡 */}
            <div className="relative mb-12">
              {/* 切换按钮 - 进一步优化样式和交互 */}
              <motion.button
                onClick={handleToggleBrandCards}
                className={`fixed top-8 left-8 z-30 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-400 backdrop-blur-lg ${showBrandCards 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40' 
                  : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'}`}
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: showBrandCards ? '0 10px 30px -5px rgba(139, 92, 246, 0.4)' : '0 10px 30px -5px rgba(255, 255, 255, 0.2)' 
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -50, rotate: -10 }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  rotate: 0,
                  boxShadow: showBrandCards ? '0 5px 15px -3px rgba(139, 92, 246, 0.3)' : '0 5px 15px -3px rgba(255, 255, 255, 0.15)' 
                }}
                transition={{ 
                  duration: 0.5, 
                  ease: 'easeOut',
                  type: 'spring',
                  stiffness: 250,
                  damping: 20
                }}
              >
                <motion.i 
                  className={`fas ${showBrandCards ? 'fa-eye-slash' : 'fa-eye'}`}
                  animate={{ 
                    rotate: showBrandCards ? 180 : 0,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 0.4,
                    ease: 'easeInOut'
                  }}
                />
                <motion.span 
                  className="font-semibold"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  {showBrandCards ? '隐藏卡片' : '显示卡片'}
                </motion.span>
              </motion.button>
              
              <AnimatePresence mode="wait">
                {showBrandCards && (
                  <motion.div
                    className="space-y-8"
                    initial={{ opacity: 0, height: 0, transform: 'translateY(-30px)' }}
                    animate={{ opacity: 1, height: 'auto', transform: 'translateY(0)' }}
                    exit={{ opacity: 0, height: 0, transform: 'translateY(-30px)' }}
                    transition={{ 
                      duration: 0.8, 
                      ease: 'easeInOut',
                      height: { duration: 0.6 },
                      opacity: { duration: 0.5 }
                    }}
                  >
                    {/* 标题 - 添加动画效果 */}
                    <motion.h2 
                      className="text-2xl font-bold text-white text-center bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: -20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{ 
                        duration: 0.6, 
                        ease: 'easeOut',
                        delay: 0.2
                      }}
                    >
                      选择一个津门老字号品牌
                    </motion.h2>
                    
                    {/* 主题选择卡片 */}
                    <motion.div 
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 40, scale: 0.9 }}
                      transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
                    >
                      {tianjinThemes.map((theme, index) => (
                        <motion.div
                          key={index}
                          className={`group relative rounded-2xl p-6 cursor-pointer transition-all duration-600 ${selectedTheme === index 
                            ? 'bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border-2 border-white shadow-2xl shadow-purple-500/30 scale-108' 
                            : 'bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/15'}`}
                          onClick={() => handleThemeChange(index)}
                          initial={{ opacity: 0, y: 50, scale: 0.8, rotateY: -15 }}
                          animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                          exit={{ opacity: 0, y: 50, scale: 0.8, rotateY: 15 }}
                          transition={{ 
                            delay: index * 0.12,
                            duration: 0.6,
                            ease: 'easeOut',
                            type: 'spring',
                            stiffness: 180,
                            damping: 20
                          }}
                          whileHover={{ 
                            scale: 1.1,
                            rotateY: 8,
                            boxShadow: '0 25px 50px rgba(0,0,0,0.35), 0 0 40px rgba(139, 92, 246, 0.4)',
                            borderColor: 'rgba(255, 255, 255, 0.5)'
                          }}
                          whileTap={{ scale: 0.95, rotateY: 0, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                        >
                          {/* 卡片背景光效 */}
                          <div 
                            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                            style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.color}33 0%, transparent 70%)` }}
                          ></div>
                          
                          {/* 品牌图标 - 动态效果 */}
                          <motion.div 
                            className="text-4xl mb-4 text-center relative z-10"
                            whileHover={{
                              rotate: 12,
                              scale: 1.2
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            {theme.icon}
                          </motion.div>
                          
                          {/* 品牌名称 */}
                          <motion.h3 
                            className="text-xl font-bold text-white mb-2 text-center relative z-10 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {theme.name}
                          </motion.h3>
                          
                          {/* 品牌描述 */}
                          <motion.p 
                            className="text-sm text-gray-300 mb-4 text-center line-clamp-2 relative z-10"
                            whileHover={{ 
                              color: '#ffffff',
                              scale: 1.05
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            {theme.description}
                          </motion.p>
                          
                          {/* 颜色条 */}
                          <div 
                            className="h-2 rounded-full overflow-hidden bg-white/20 relative z-10"
                          >
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: theme.color }}
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              exit={{ width: 0 }}
                              transition={{ 
                                duration: 1.5, 
                                delay: 0.5,
                                ease: 'easeOut' 
                              }}
                            />
                          </div>
                          
                          {/* 选中状态指示器 - 增强动画 */}
                          {selectedTheme === index && (
                            <motion.div 
                              className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-2xl"
                              initial={{ scale: 0, rotate: -180, opacity: 0 }}
                              animate={{ scale: 1, rotate: 0, opacity: 1 }}
                              exit={{ scale: 0, rotate: 180, opacity: 0 }}
                              transition={{ 
                                type: 'spring', 
                                stiffness: 500, 
                                damping: 25,
                                delay: 0.3
                              }}
                            >
                              <i className="fas fa-check text-xl"></i>
                            </motion.div>
                          )}
                          
                          {/* 悬停效果 - 多层次 */}
                          <div 
                            className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-80 blur-sm transition-opacity duration-700"
                          ></div>
                          
                          {/* 底部光效 */}
                          <motion.div 
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100"
                            initial={{ scaleX: 0 }}
                            whileHover={{ scaleX: 1 }}
                            transition={{ duration: 0.5 }}
                          ></motion.div>
                          
                          {/* 粒子装饰效果 - 增强视觉体验 */}
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full"
                                style={{ 
                                  backgroundColor: theme.color,
                                  left: `${Math.random() * 100}%`,
                                  top: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                  opacity: [0, 1, 0],
                                  scale: [0, 2.5, 0],
                                  x: [0, (Math.random() - 0.5) * 40],
                                  y: [0, (Math.random() - 0.5) * 40],
                                  rotate: [0, 360]
                                }}
                                transition={{
                                  duration: 3 + Math.random() * 2,
                                  repeat: Infinity,
                                  delay: Math.random() * 3,
                                  ease: 'easeInOut'
                                }}
                              />
                            ))}
                          </div>
                          
                          {/* 卡片边框发光效果 */}
                          <motion.div 
                            className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/50 transition-all duration-500"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                          ></motion.div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 控制区域 */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-1000 ease-in-out ${showBrandCards ? 'opacity-100' : 'opacity-0.9'}`}>
              {/* 控制面板切换按钮 - 固定在底部中央 */}
              <div className="flex justify-center pb-6">
                <motion.button
                  onClick={() => setShowControls(!showControls)}
                  className={`flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg shadow-purple-500/20 hover:scale-105 transition-all duration-300 ${!showBrandCards ? 'opacity-0.8' : ''}`}
                  whileHover={{ 
                    scale: 1.1,
                    boxShadow: '0 10px 30px -5px rgba(139, 92, 246, 0.5)' 
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0
                  }}
                  transition={{ 
                    duration: 0.5, 
                    ease: 'easeOut',
                    type: 'spring',
                    stiffness: 250,
                    damping: 20
                  }}
                >
                  <motion.i 
                    className={`fas ${showControls ? 'fa-chevron-up' : 'fa-chevron-down'}`}
                    animate={{ 
                      rotate: showControls ? 180 : 0,
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 0.4,
                      ease: 'easeInOut'
                    }}
                  />
                  <motion.span 
                    className="font-semibold"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    {showControls ? '隐藏控制面板' : '显示控制面板'}
                  </motion.span>
                </motion.button>
              </div>
              
              {/* 控制面板 - 从底部滑入，固定在底部 */}
              <AnimatePresence>
                {showControls && (
                  <motion.div
                    className="overflow-hidden bg-white/5 backdrop-blur-xl border-t border-white/10 shadow-2xl"
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ 
                      duration: 0.8, 
                      ease: 'easeInOut',
                      type: 'spring',
                      stiffness: 200,
                      damping: 20
                    }}
                  >
                    {/* 面板顶部装饰 */}
                    <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
                    
                    <div className="p-8 pb-12">
                      <h3 className="text-2xl font-bold text-white mb-8 text-center">
                        <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                          粒子效果控制
                        </span>
                      </h3>
                      
                      {/* 预设选择 */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-white">效果预设</h4>
                          <motion.button
                            onClick={() => setShowSavePresetModal(true)}
                            className="flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white hover:shadow-lg transition-all duration-300 hover:scale-105"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <i className="fas fa-save"></i>
                            <span>保存预设</span>
                          </motion.button>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center">
                          {allPresets.map((preset) => (
                            <motion.button
                              key={preset.id}
                              onClick={() => setControls(preset.controls)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${JSON.stringify(preset.controls) === JSON.stringify(controls) 
                                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-purple-500/30' 
                                : 'bg-white/10 hover:bg-white/20 text-white hover:shadow-md'}`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: Math.random() * 0.1 }}
                            >
                              <span>{preset.icon}</span>
                              <span>{preset.name}</span>
                              {preset.id.startsWith('custom-') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCustomPreset(preset.id);
                                  }}
                                  className="ml-1 text-red-500 hover:text-red-400 transition-colors"
                                >
                                  <i className="fas fa-times text-xs"></i>
                                </button>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    
                    {/* 保存预设模态框 */}
                    <AnimatePresence>
                      {showSavePresetModal && (
                        <motion.div
                          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <motion.div
                            className="bg-gradient-to-br from-purple-900/80 to-pink-900/80 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          >
                            <h3 className="text-xl font-bold text-white mb-4 text-center">保存自定义预设</h3>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="block text-white font-medium mb-2">预设名称</label>
                                <input
                                  type="text"
                                  value={newPresetName}
                                  onChange={(e) => setNewPresetName(e.target.value)}
                                  placeholder="输入预设名称"
                                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-white font-medium mb-2">预设图标</label>
                                <input
                                  type="text"
                                  value={newPresetIcon}
                                  onChange={(e) => setNewPresetIcon(e.target.value)}
                                  placeholder="输入表情符号作为图标"
                                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => setShowSavePresetModal(false)}
                                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                  取消
                                </button>
                                <button
                                  onClick={saveCustomPreset}
                                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300"
                                >
                                  保存
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {/* 行为模式 */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="block text-white font-medium text-sm mb-3">
                          行为模式
                        </label>
                        <select
                          value={controls.behavior}
                          onChange={(e) => handleControlChange('behavior', e.target.value as ParticleBehavior)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="default">默认浮动</option>
                          <option value="spiral">螺旋运动</option>
                          <option value="explosion">爆炸效果</option>
                          <option value="wave">波浪运动</option>
                          <option value="orbit">轨道运动</option>
                          <option value="chaos">混沌运动</option>
                        </select>
                        <p className="text-xs text-gray-400 mt-2">选择粒子的运动方式</p>
                      </div>
                      
                      {/* 拖尾效果 */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="flex items-center justify-between mb-3">
                          <span className="text-white font-medium text-sm">拖尾效果</span>
                          <button
                            onClick={() => handleControlChange('showTrails', !controls.showTrails)}
                            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 ${controls.showTrails ? 'bg-green-600' : 'bg-gray-600'}`}
                          >
                            <span 
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-out ${controls.showTrails ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
                            />
                          </button>
                        </label>
                        <p className="text-xs text-gray-400">{controls.showTrails ? '开启粒子拖尾' : '关闭粒子拖尾'}</p>
                      </div>
                       
                      {/* 粒子数量 */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="block text-white font-medium text-sm mb-3">
                          粒子数量: <span className="text-purple-400">{controls.particleCount}</span>
                        </label>
                        <input
                          type="range"
                          min="50"
                          max="500"
                          step="20"
                          value={controls.particleCount}
                          onChange={(e) => handleControlChange('particleCount', Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-purple-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>50</span>
                          <span>500</span>
                        </div>
                      </div>
                       
                      {/* 粒子大小 */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="block text-white font-medium text-sm mb-3">
                          粒子大小: <span className="text-cyan-400">{controls.particleSize.toFixed(1)}</span>
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={controls.particleSize}
                          onChange={(e) => handleControlChange('particleSize', Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>小</span>
                          <span>大</span>
                        </div>
                      </div>
                       
                      {/* 动画速度 */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="block text-white font-medium text-sm mb-3">
                          动画速度: <span className="text-blue-400">{controls.animationSpeed.toFixed(1)}x</span>
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.1"
                          value={controls.animationSpeed}
                          onChange={(e) => handleControlChange('animationSpeed', Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>慢</span>
                          <span>快</span>
                        </div>
                      </div>
                       
                      {/* 旋转速度 */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="block text-white font-medium text-sm mb-3">
                          旋转速度: <span className="text-orange-400">{controls.rotationSpeed.toFixed(1)}x</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="0.1"
                          value={controls.rotationSpeed}
                          onChange={(e) => handleControlChange('rotationSpeed', Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-orange-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>静态</span>
                          <span>快速</span>
                        </div>
                      </div>
                       
                      {/* 颜色变化 */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="block text-white font-medium text-sm mb-3">
                          颜色变化: <span className="text-pink-400">{controls.colorVariation.toFixed(1)}</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={controls.colorVariation}
                          onChange={(e) => handleControlChange('colorVariation', Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-pink-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>统一</span>
                          <span>丰富</span>
                        </div>
                      </div>
                       
                      {/* 粒子扩散范围 */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]">
                        <label className="block text-white font-medium text-sm mb-3">
                          粒子扩散: <span className="text-green-400">{controls.gestureSensitivity.toFixed(1)}</span>
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={controls.gestureSensitivity}
                          onChange={(e) => handleControlChange('gestureSensitivity', Number(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-green-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>集中</span>
                          <span>扩散</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 使用说明 */}
          <div className={`transition-all duration-1000 ease-in-out ${showBrandCards ? 'opacity-100' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
              {/* 装饰背景 */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl"></div>
              
              <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                <div className="text-6xl">
                  🖐️
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6 text-center md:text-left">
                    <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                      使用说明
                    </span>
                  </h3>
                  <div className="space-y-4 text-gray-300">
                    {[
                      { icon: 'fa-mouse-pointer', color: 'text-pink-500', text: '点击品牌卡片选择不同的粒子效果主题' },
                      { icon: 'fa-eye-slash', color: 'text-blue-500', text: '使用左上角按钮切换显示/隐藏品牌卡片' },
                      { icon: 'fa-sliders-h', color: 'text-purple-500', text: '通过控制面板调整粒子效果参数' },
                      { icon: 'fa-palette', color: 'text-yellow-500', text: '品牌卡片选择后1秒自动隐藏，展现完整粒子效果' }
                    ].map((item, index) => (
                      <p 
                        key={index}
                        className="flex items-center gap-3 hover:translate-x-2.5 transition-transform duration-300 hover:text-white"
                      >
                        <i className={`fas ${item.icon} ${item.color} text-lg`}></i>
                        <span>{item.text}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

        {/* 页脚 */}
        <footer className={`py-8 px-6 text-center text-gray-400 text-sm bg-gradient-to-t from-white/5 to-transparent backdrop-blur-sm transition-all duration-1000 ease-in-out ${showBrandCards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}>
          <div className="max-w-3xl mx-auto">
            <div className="mb-4">
              <p className="text-lg font-medium text-white">
                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                  津脉智坊 · 3D粒子艺术展示
                </span>
              </p>
            </div>
            
            <div className="space-y-3">
              <p>结合传统津门文化与现代科技，打造沉浸式视觉体验</p>
              
              {/* 品牌标签 */}
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {tianjinThemes.map((theme, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 rounded-full text-xs bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:scale-110 transition-all duration-300"
                  >
                    {theme.name}
                  </span>
                ))}
              </div>
            </div>
            
            {/* 分隔线 */}
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto my-6"></div>
            
            <p className="text-xs text-gray-500">© 2024 津脉智坊. 保留所有权利.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
