import * as React from 'react';
import { motion } from 'framer-motion';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  itemWidth: number;
  columns: number;
  isDark: boolean;
  height?: number;
}

const VirtualList = <T,>({
  items,
  renderItem,
  itemHeight,
  itemWidth,
  columns,
  isDark,
  height = 600,
}: VirtualListProps<T>) => {
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // 响应式调整列数
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const responsiveColumns = React.useMemo(() => {
    if (windowWidth < 640) return 1;
    if (windowWidth < 1024) return Math.min(columns, 2);
    return columns;
  }, [windowWidth, columns]);

  return (
    <div 
      className="overflow-y-auto"
      style={{ 
        height, 
        padding: '8px',
        display: 'grid',
        gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
        gap: '16px',
      }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
};

export default VirtualList;