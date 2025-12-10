// 核心React hooks
import { useState, useMemo, useCallback } from 'react';

// 动画库
import { motion, useReducedMotion } from 'framer-motion';

// 自定义hooks
import { useTheme } from '@/hooks/useTheme';

// 内部组件
import LazyImage from './LazyImage';
import imageService from '../services/imageService';

// 天津特色按钮组件 - 风筝飘带效果
export const TianjinButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean; // 中文注释：兼容旧用法，等同于 variant="primary"
  className?: string;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'heritage'; // 中文注释：按钮风格变体
  size?: 'sm' | 'md' | 'lg'; // 中文注释：按钮尺寸
  loading?: boolean; // 中文注释：加载中状态（展示旋转动画并禁用点击）
  disabled?: boolean; // 中文注释：禁用状态
  fullWidth?: boolean; // 中文注释：占满容器宽度
  leftIcon?: React.ReactNode; // 中文注释：左侧图标
  rightIcon?: React.ReactNode; // 中文注释：右侧图标
}> = ({
  children,
  onClick,
  primary = false,
  className = '',
  ariaLabel,
  type = 'button',
  variant,
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
}) => {
  // 为useTheme解构添加默认值，防止返回undefined导致崩溃
  const { isDark = false } = useTheme() || {};
  const reduceMotion = useReducedMotion();

  // 中文注释：风筝飘带动画变体（悬浮轻微上抬）
  // 中文注释：添加will-change属性提示浏览器，使用硬件加速属性
  const ribbonVariants = useMemo(() => ({
    rest: { scale: 1, transition: { duration: 0.25 } },
    hover: { scale: 1.03, y: -2, transition: { duration: 0.25, type: 'spring', stiffness: 380, damping: 14 } },
  }), []);

  // 中文注释：尺寸映射（统一内边距与字号）
  // 中文注释：统一提升触控目标尺寸，保证手机端最小44px高度
  // 中文注释：添加响应式样式，在小屏幕上调整内边距
  const sizeMap = useMemo(() => ({
    sm: 'px-3 py-2 text-sm min-h-[44px] sm:px-3 sm:py-2 md:px-3 md:py-2',
    md: 'px-3 py-2.5 text-sm min-h-[44px] sm:px-4 sm:py-2.5 md:px-4 md:py-2.5',
    lg: 'px-4 py-3 text-base min-h-[48px] sm:px-5 sm:py-3 md:px-5 md:py-3',
  }), []);

  // 中文注释：风格变体（根据主题与暗色模式切换）
  const v = useMemo(() => variant || (primary ? 'primary' : 'secondary'), [variant, primary]);
  
  const bgMap = useMemo(() => ({
    primary: isDark ? 'bg-[var(--accent-red)] hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-700',
    secondary: isDark ? 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] ring-1 ring-[var(--border-primary)]' : 'bg-white hover:bg-gray-50 ring-1 ' + (isDark ? 'ring-gray-600' : 'ring-gray-200'),
    danger: isDark ? 'bg-[var(--accent-red)] hover:bg-red-700' : 'bg-red-600 hover:bg-red-700',
    ghost: isDark ? 'bg-transparent hover:bg-[var(--bg-hover)] ring-1 ring-[var(--border-secondary)]' : 'bg-transparent hover:bg-gray-50 ring-1 ring-gray-200',
    heritage: 'bg-gradient-to-r from-red-700 to-amber-500 hover:from-red-600 hover:to-amber-600',
  }), [isDark]);
  
  const textMap = useMemo(() => ({
    primary: 'text-white',
    secondary: isDark ? 'text-[var(--text-primary)]' : 'text-gray-900',
    danger: 'text-white',
    ghost: isDark ? 'text-[var(--text-secondary)]' : 'text-gray-800',
    heritage: 'text-white',
  }), [isDark]);

  // 中文注释：禁用与加载状态样式
  const disabledCls = useMemo(() => (disabled || loading) ? 'opacity-60 cursor-not-allowed' : '', [disabled, loading]);
  const widthCls = useMemo(() => fullWidth ? 'w-full' : '', [fullWidth]);

  // 合并className
  const combinedClassName = useMemo(() => {
    return `rounded-lg font-medium transition-colors relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${sizeMap[size]} ${bgMap[v]} ${textMap[v]} ${widthCls} ${disabledCls} ${className}`;
  }, [size, bgMap, v, textMap, widthCls, disabledCls, className, sizeMap]);

  return (
    <motion.button
      variants={ribbonVariants}
      initial={reduceMotion ? undefined : 'rest'}
      whileHover={disabled || loading || reduceMotion ? undefined : 'hover'}
      whileTap={disabled || loading || reduceMotion ? undefined : { scale: 0.98 }}
      onClick={disabled || loading ? undefined : onClick}
      type={type}
      aria-label={ariaLabel}
      aria-busy={loading}
      disabled={disabled || loading}
      className={combinedClassName}
    >
      {/* 中文注释：点击涟漪（加载或禁用时关闭动画） */}
      {/* 中文注释：在“减少动态效果”偏好下关闭点击涟漪动画 */}
      {!disabled && !loading && !reduceMotion && (
        <motion.div
          className="absolute inset-0 bg-white opacity-20 rounded-full scale-0 origin-center"
          initial={{ scale: 0 }}
          whileTap={{ scale: 4, opacity: 0, transition: { duration: 0.6 } }}
        />
      )}

      {/* 中文注释：内容区域，支持左右图标与加载小圆圈 */}
      <span className="relative z-10 inline-flex items-center gap-2">
        {loading && (
          <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        )}
        {leftIcon}
        <span>{children}</span>
        {rightIcon}
      </span>
    </motion.button>
  );
};

// 杨柳青年画风格图标容器
export const YangliuqingIconContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 border-2 border-blue-600 rounded-lg transform rotate-1"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// 天津特色图标 - 风筝线轴 (设置)
export const KiteSpoolIcon: React.FC<{ className?: string; ariaLabel?: string; role?: string }> = ({ 
  className = '', 
  ariaLabel = '设置图标',
  role = 'img'
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      aria-label={ariaLabel}
      role={role}
    >
      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
      <div className="absolute -left-1 -top-1 w-8 h-8 border-2 border-blue-600 rounded-full"></div>
    </div>
  );
};

// 天津特色图标 - 鼓楼铃铛 (搜索)
export const DrumTowerBellIcon: React.FC<{ className?: string; ariaLabel?: string; role?: string }> = ({ 
  className = '', 
  ariaLabel = '搜索图标',
  role = 'img'
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      aria-label={ariaLabel}
      role={role}
    >
      <div className="w-5 h-6 bg-red-600 rounded-t-full flex items-center justify-center">
        <div className="w-1 h-1 bg-white rounded-full"></div>
      </div>
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-red-600"></div>
      <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-red-600 rounded-b-full"></div>
    </div>
  );
};

// 天津特色图标 - 杨柳青娃娃手持灯笼 (通知)
export const YangliuqingDollIcon: React.FC<{ className?: string; ariaLabel?: string; role?: string }> = ({ 
  className = '', 
  ariaLabel = '通知图标',
  role = 'img'
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      aria-label={ariaLabel}
      role={role}
    >
      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
        <div className="w-1 h-1 bg-white rounded-full"></div>
      </div>
      <div className="absolute -right-1 -top-1 w-2 h-2 bg-red-600 rounded-full"></div>
    </div>
  );
};

// 天津快板加载动画
export const TianjinAllegroLoader: React.FC<{ size?: 'small' | 'medium' | 'large'; ariaLabel?: string; role?: string }> = ({ 
  size = 'medium',
  ariaLabel = '加载中...',
  role = 'status'
}) => {
  // 缓存sizeMap，避免每次渲染都重新创建
  const sizeMap = useMemo(() => ({
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  }), []);
  
  return (
    <div 
      className={`${sizeMap[size]} relative`}
      aria-label={ariaLabel}
      role={role}
    >
      <motion.div 
        className="absolute inset-0 bg-blue-600 rounded-md"
        animate={{ 
          rotate: [0, 30, -30, 0],
          scale: [1, 1.05, 0.95, 1]
        }}
        transition={{ 
          duration: 0.8, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute inset-2 bg-red-600 rounded-sm"
        animate={{ 
          rotate: [0, -20, 20, 0],
          scale: [1, 0.95, 1.05, 1]
        }}
        transition={{ 
          duration: 0.8, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.1
        }}
      />
    </div>
  );
};

// 天津之眼摩天轮加载动画
export const TianjinEyeLoader: React.FC<{ size?: 'small' | 'medium' | 'large'; ariaLabel?: string; role?: string }> = ({ 
  size = 'medium',
  ariaLabel = '加载中...',
  role = 'status'
}) => {
  // 缓存sizeMap和座舱位置，避免每次渲染都重新计算
  const sizeMap = useMemo(() => ({
    small: 'h-10 w-10',
    medium: 'h-16 w-16',
    large: 'h-24 w-24'
  }), []);
  
  const radius = useMemo(() => {
    return size === 'small' ? '18' : size === 'medium' ? '30' : '45';
  }, [size]);
  
  return (
    <div 
      className={`${sizeMap[size]} relative mx-auto`}
      aria-label={ariaLabel}
      role={role}
    >
      {/* 中心轴 */}
      <div className="absolute inset-1 bg-blue-600 rounded-full"></div>
      
      {/* 轮子 */}
      <motion.div 
        className="absolute inset-0 border-4 border-red-600 rounded-full"
        animate={{ 
          rotate: 360
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* 座舱 */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
        <motion.div 
          key={index}
          className="absolute w-3 h-3 bg-yellow-500 rounded-full"
          style={{
            top: '50%',
            left: '50%',
            transformOrigin: 'center',
            transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${radius}px)`,
            willChange: 'transform' // 提示浏览器优化动画性能
          }}
          animate={{ 
            rotate: -360
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

// 杨柳青娃娃点头动画
export const YangliuqingNodAnimation: React.FC = () => {
  return (
    <div className="w-16 h-24 mx-auto relative">
      {/* 娃娃头部 */}
      <motion.div 
        className="w-16 h-16 bg-red-600 rounded-full absolute top-0"
        animate={{ 
          y: [0, -5, 0],
          rotate: [0, -5, 0]
        }}
        transition={{ 
          duration: 1, 
          repeat: Infinity,
          repeatType: "loop"
        }}
      />
      
      {/* 娃娃身体 */}
      <div className="w-12 h-16 bg-yellow-500 rounded-t-3xl absolute bottom-0 left-2"></div>
      
      {/* 娃娃眼睛 */}
      <div className="w-2 h-2 bg-white rounded-full absolute top-6 left-6"></div>
      <div className="w-2 h-2 bg-white rounded-full absolute top-6 right-6"></div>
      
      {/* 娃娃嘴巴 */}
      <div className="w-5 h-2 bg-black rounded-b-full absolute top-10 left-5.5"></div>
    </div>
  );
};

// 天津风格空状态组件
export const TianjinEmptyState: React.FC = () => {
  // 为useTheme解构添加默认值，防止返回undefined导致崩溃
  const { isDark = false } = useTheme() || {};
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center sm:py-16 md:py-20">
      <div className="mb-6 relative w-full max-w-xs sm:max-w-sm md:max-w-md">
        <img 
          src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Tianjin%20ancient%20city%20scenery%20traditional%20Chinese%20painting%20style" 
          alt="天津卫历史场景" 
          className="w-full h-auto max-w-full rounded-xl shadow-lg border-4 border-double border-blue-600 sm:w-64 sm:h-48 md:w-80 md:h-60 object-cover"
        />
        <div className="absolute -bottom-3 -right-3 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-red-600 rounded-full opacity-20 z-0"></div>
      </div>
      <h3 className={`text-lg font-bold mb-2 sm:text-xl md:text-2xl ${isDark ? 'text-gray-200' : 'text-gray-800'} font-tianjin`}>
        暂无内容
      </h3>
      <p className={`max-w-sm sm:max-w-md md:max-w-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base`}>
        暂时没有找到相关内容，您可以尝试其他搜索条件或创建新内容
      </p>
    </div>
  );
};

// 天津特色分隔线
export const TianjinDivider: React.FC = () => {
  return (
    <div className="flex items-center my-8">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-600 to-transparent"></div>
      <div className="mx-4 relative">
        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
          津
        </div>
        {/* 杨柳青年画风格装饰 */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full opacity-50"></div>
        <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-blue-600 rounded-full opacity-50"></div>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-600 to-transparent"></div>
    </div>
  );
};

// 天津风格标签
export const TianjinTag: React.FC<{ 
  children: React.ReactNode;
  color?: 'blue' | 'red' | 'green' | 'yellow';
  className?: string;
}> = ({ children, color = 'blue', className = '' }) => {
  // 为useTheme解构添加默认值，防止返回undefined导致崩溃
  const { isDark = false } = useTheme() || {};
  
  // 缓存colorMap，避免每次渲染都重新创建
  const colorMap = useMemo(() => ({
    blue: isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-600 border-blue-200',
    red: isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-100 text-red-600 border-red-200',
    green: isDark ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-100 text-green-600 border-green-200',
    yellow: isDark ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' : 'bg-yellow-100 text-yellow-600 border-yellow-200'
  }), [isDark]);
  
  // 缓存最终className
  const combinedClassName = useMemo(() => {
    return `inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border transform rotate-1 ${colorMap[color]} ${className}`;
  }, [colorMap, color, className]);
  
  return (
    <motion.span 
      className={combinedClassName}
      whileHover={{ scale: 1.05, rotate: -1 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.span>
  );
};

// 杨柳青年画风格卡片
export const YangliuqingCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  // 为useTheme解构添加默认值，防止返回undefined导致崩溃
  const { isDark = false } = useTheme() || {};
  
  return (
    <div className={`relative overflow-hidden rounded-xl ${isDark ? 'shadow-[var(--shadow-lg)] bg-[var(--bg-secondary)]' : 'shadow-md'} ${className} card`}>
      {/* 边框装饰 */}
      <div className={`absolute inset-0 border-2 border-double ${isDark ? 'border-blue-500' : 'border-blue-600'} rounded-xl pointer-events-none`}></div>
      
      {/* 四角装饰 */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${isDark ? 'border-red-500' : 'border-red-600'} rounded-tl-xl`}></div>
      <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${isDark ? 'border-red-500' : 'border-red-600'} rounded-tr-xl`}></div>
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${isDark ? 'border-red-500' : 'border-red-600'} rounded-bl-xl`}></div>
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${isDark ? 'border-red-500' : 'border-red-600'} rounded-br-xl`}></div>
      
      <div className={`p-4 relative z-10 ${isDark ? 'text-[var(--text-primary)]' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// 海河游船页面过渡组件
export const HaiheBoatTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 水滴入河扩散效果组件
export const WaterDropEffect: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const [isClicked, setIsClicked] = useState(false);
  
  // 缓存点击处理函数和动画完成回调
  const handleClick = useCallback(() => {
    setIsClicked(true);
  }, []);
  
  const handleAnimationComplete = useCallback(() => {
    setIsClicked(false);
  }, []);
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isClicked && (
        <motion.div
          className="absolute inset-0 bg-blue-500 opacity-20 rounded-full scale-0 origin-center"
          initial={{ scale: 0 }}
          animate={{ 
            scale: 4,
            opacity: 0,
            transition: { duration: 0.6 }
          }}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
      <div 
        onClick={handleClick}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  );
};

// 捞面动作动画
export const NoodleFishingAnimation: React.FC = () => {
  return (
    <div className="w-20 h-24 mx-auto relative flex items-end justify-center pb-2">
      {/* 筷子 */}
      <motion.div 
        className="absolute w-2 h-20 bg-yellow-700 rounded-t-md transform -rotate-45"
        animate={{ 
          y: [0, -15, 0],
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ left: '35%' }}
      />
      <motion.div 
        className="absolute w-2 h-20 bg-yellow-700 rounded-t-md transform rotate-45"
        animate={{ 
          y: [0, -15, 0],
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ right: '35%' }}
      />
      
      {/* 面条 */}
      <motion.div 
        className="w-12 h-6 bg-yellow-100 rounded-b-full"
        animate={{ 
          height: [6, 30, 6],
          y: [0, -20, 0]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};

// 贴饽饽熬小鱼完成提示动画
export const FishAndPancakeAnimation: React.FC = () => {
  return (
    <div className="w-24 h-16 mx-auto relative">
      {/* 锅 */}
      <div className="w-24 h-8 bg-gray-700 rounded-t-xl"></div>
      
      {/* 鱼 */}
      <motion.div 
        className="absolute left-2 bottom-8 w-8 h-4 bg-gray-600 rounded-full"
        animate={{ 
          x: [0, 10, 0],
          y: [0, -2, 0]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* 饽饽 */}
      <motion.div 
        className="absolute right-4 top-2 w-6 h-6 bg-yellow-700 rounded-full"
        animate={{ 
          y: [0, -2, 0]
        }}
        transition={{ 
          duration: 1, 
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
    </div>
  );
};



// 天津风格图片组件 - 优化版，轻量高效
export const TianjinImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  ratio?: 'auto' | 'square' | 'landscape' | 'portrait';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  withBorder?: boolean;
  badge?: string;
  fit?: 'cover' | 'contain';
  onClick?: () => void;
  loading?: 'eager' | 'lazy';
  imageTag?: string;
  priority?: boolean;
  quality?: 'low' | 'medium' | 'high';
}> = ({
  src,
  alt,
  className = '',
  ratio = 'auto',
  rounded = 'xl',
  withBorder = false,
  badge,
  fit = 'cover',
  onClick,
  loading = 'lazy',
  imageTag,
  priority = false,
  quality = 'medium',
}) => {
  // 简化主题处理
  const { isDark = false } = useTheme() || {};
  
  // 缓存roundedMap，避免每次渲染都重新创建
  const roundedMap = useMemo(() => ({
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  }), []);
  
  // 缓存最终className，添加响应式样式
  const combinedClassName = useMemo(() => {
    return `relative overflow-hidden ${roundedMap[rounded]} ${className} ${withBorder ? (isDark ? 'ring-1 ring-gray-700' : 'ring-1 ring-gray-200') : ''} cursor-pointer sm:max-w-full md:max-w-full lg:max-w-full`;
  }, [roundedMap, rounded, className, withBorder, isDark]);
  
  return (
    <div
      className={combinedClassName}
      onClick={onClick}
    >
      <LazyImage
        src={src}
        alt={alt}
        className={`w-full h-full`}
        ratio={ratio}
        fit={fit}
        loading={loading}
        priority={priority}
        quality={quality}
      />
      
      {badge && (
        <span
          className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-800/70 ring-1 ring-gray-700 text-gray-200' : 'bg-white/80 ring-1 ring-gray-200 text-gray-700'} backdrop-blur-sm`}
        >
          {badge}
        </span>
      )}
      
      {imageTag && (
        <span
          className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-800/90 ring-1 ring-gray-700 text-gray-200' : 'bg-white/90 ring-1 ring-gray-200 text-gray-700'} backdrop-blur-sm z-50`}
          style={{ fontSize: '10px', fontWeight: 'bold' }}
        >
          {imageTag.split('_').find(part => ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(part)) || '图片'}
        </span>
      )}
    </div>
  );
};

// 天津风格头像组件
export const TianjinAvatar: React.FC<{
  src: string;
  alt: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  onClick?: () => void;
  withBorder?: boolean;
  variant?: 'default' | 'gradient' | 'heritage'; // 新增：头像变体
}> = ({
  src,
  alt,
  className = '',
  size = 'md',
  online = false,
  onClick,
  withBorder = true,
  variant = 'default', // 新增：默认变体
}) => {
  // 简化主题处理
  const { isDark = false } = useTheme() || {};
  
  // 尺寸映射
  const sizeMap = useMemo(() => ({
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }), []);
  
  // 边框变体映射
  const borderVariants = useMemo(() => {
    const baseBorder = withBorder ? (isDark ? 'ring-2 ring-gray-700' : 'ring-2 ring-gray-300') : '';
    const gradientBorder = withBorder ? (isDark ? 'ring-2 ring-blue-500/60' : 'ring-2 ring-blue-600') : '';
    const heritageBorder = withBorder ? (isDark ? 'ring-2 ring-red-500/60' : 'ring-2 ring-red-600') : '';
    
    return {
      default: baseBorder,
      gradient: gradientBorder,
      heritage: heritageBorder,
    };
  }, [withBorder, isDark]);
  
  // 缓存最终className
  const combinedClassName = useMemo(() => {
    return `relative ${sizeMap[size]} ${className} cursor-pointer group transition-all duration-300`;
  }, [sizeMap, size, className]);
  
  return (
    <div 
      className={combinedClassName}
      onClick={onClick}
    >
      {/* 渐变光环效果 */}
      {variant === 'gradient' && (
        <motion.div
          className="absolute inset-[-2px] rounded-full bg-gradient-to-r from-red-500 via-blue-500 to-green-500 blur-sm opacity-70"
          initial={{ scale: 0.95 }}
          whileHover={{ scale: 1.1 }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* 非遗风格装饰环效果 */}
      {variant === 'heritage' && (
        <motion.div
          className="absolute inset-[-3px] rounded-full border-2 border-dashed border-red-500/60 opacity-80"
          whileHover={{ rotate: 5, scale: 1.05 }}
          animate={{ rotate: [0, 360] }}
          transition={{ 
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
      
      <motion.div
        className={`relative z-10 w-full h-full rounded-full overflow-hidden ${borderVariants[variant]}`}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        <LazyImage
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          ratio="square"
          fit="cover"
          loading="lazy"
        />
        
        {/* 添加轻微的发光效果 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>
      
      {/* 改进的在线状态指示器 */}
      {online && (
        <motion.span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ${isDark ? 'ring-2 ring-gray-800' : 'ring-2 ring-white'} z-20`}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* 在线状态光晕 */}
          <motion.span
            className="absolute inset-[-2px] rounded-full bg-green-500 opacity-50"
            animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.span>
      )}
    </div>
  );
};
