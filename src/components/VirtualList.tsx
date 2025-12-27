import * as React from 'react';
import { motion } from 'framer-motion';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns: number;
  isDark: boolean;
  height?: number;
  itemHeight?: number;
  overscan?: number;
}

// 简化泛型组件定义
export default function VirtualList<T>({
  items,
  renderItem,
  columns,
  isDark,
  height = 600,
  itemHeight = 200,
  overscan = 2,
}: VirtualListProps<T>) {
  // 初始化默认值，避免SSR期间访问window
  const [windowWidth, setWindowWidth] = React.useState(1200);
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 在客户端挂载后初始化windowWidth并添加resize事件监听
  React.useEffect(() => {
    // 只在浏览器环境中执行
    if (typeof window === 'undefined') return;
    
    // 初始化windowWidth
    setWindowWidth(window.innerWidth);
    
    // 添加resize事件监听
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const responsiveColumns = React.useMemo(() => {
    if (windowWidth < 640) return 1;
    if (windowWidth < 1024) return Math.min(columns, 2);
    return columns;
  }, [windowWidth, columns]);

  // 计算可见区域的项目索引
  const getVisibleItemRange = React.useMemo(() => {
    // 计算可见区域的起始和结束行索引
    const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endRow = Math.min(
      Math.ceil(items.length / responsiveColumns),
      Math.ceil(scrollTop / itemHeight) + Math.ceil(height / itemHeight) + overscan
    );

    // 计算对应的项目索引范围
    const startIndex = startRow * responsiveColumns;
    const endIndex = Math.min(items.length, endRow * responsiveColumns);

    return { startIndex, endIndex, startRow };
  }, [scrollTop, height, itemHeight, items.length, responsiveColumns, overscan]);

  // 计算可见区域内的项目
  const visibleItems = React.useMemo(() => {
    return items.slice(getVisibleItemRange.startIndex, getVisibleItemRange.endIndex);
  }, [items, getVisibleItemRange.startIndex, getVisibleItemRange.endIndex]);

  // 计算顶部填充高度
  const topPadding = getVisibleItemRange.startRow * itemHeight;

  // 处理滚动事件
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div 
      ref={containerRef}
      className={`overflow-y-auto p-2 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
      style={{ 
        height,
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      {/* 虚拟列表容器 */}
      <div 
        className="grid gap-4"
        style={{ 
          gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
          minHeight: `${Math.ceil(items.length / responsiveColumns) * itemHeight}px`,
          position: 'relative',
        }}
      >
        {/* 顶部填充 */}
        <div style={{ height: topPadding }} />

        {/* 可见项目 */}
        {visibleItems.map((item, index) => {
          const actualIndex = getVisibleItemRange.startIndex + index;
          return (
            <div key={actualIndex} className="h-full" style={{ height: itemHeight - 16 }}>
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}