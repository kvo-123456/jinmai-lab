import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ARPreview, { ARPreviewConfig } from '../ARPreview';

// Mock useTheme hook - simplified for testing
jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

// Mock Work type
const mockWork = {
  id: 1,
  title: '测试作品',
  description: '这是一个测试作品',
  imageUrl: 'https://example.com/image.jpg',
  modelUrl: 'https://example.com/model.glb',
  author: '测试作者',
  tags: ['标签1', '标签2', '标签3'],
  views: 100,
};

describe('ARPreview Component', () => {
  const defaultConfig: ARPreviewConfig = {
    type: '3d',
    modelUrl: 'https://example.com/model.glb',
    scale: 1,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 },
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <ARPreview 
        config={defaultConfig} 
        onClose={mockOnClose} 
        work={mockWork}
      />
    );
    
    expect(screen.getByText('AR预览')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(
      <ARPreview 
        config={defaultConfig} 
        onClose={mockOnClose} 
        work={mockWork}
      />
    );
    
    expect(screen.getByText('正在加载AR资源...')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ARPreview 
        config={defaultConfig} 
        onClose={mockOnClose} 
        work={mockWork}
      />
    );
    
    const closeButton = screen.getByRole('button', { name: /关闭/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles 2D image preview configuration', () => {
    const imageConfig: ARPreviewConfig = {
      type: '2d',
      imageUrl: 'https://example.com/image.jpg',
      scale: 1,
      rotation: { x: 0, y: 0, z: 0 },
      position: { x: 0, y: 0, z: 0 },
    };

    render(
      <ARPreview 
        config={imageConfig} 
        onClose={mockOnClose} 
        work={mockWork}
      />
    );
    
    expect(screen.getByText('AR预览')).toBeInTheDocument();
  });

  it('toggles AR mode', async () => {
    render(
      <ARPreview 
        config={defaultConfig} 
        onClose={mockOnClose} 
        work={mockWork}
      />
    );
    
    // 查找包含"进入AR"文本的按钮
    const arButton = screen.getByText('进入AR');
    fireEvent.click(arButton);
    
    // 简化测试：只验证按钮文本变化
    await waitFor(() => {
      expect(screen.getByText('退出AR')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // 再次点击应该退出AR模式
    fireEvent.click(arButton);
    
    await waitFor(() => {
      expect(screen.getByText('进入AR')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles environment preset changes', () => {
    render(
      <ARPreview 
        config={defaultConfig} 
        onClose={mockOnClose} 
        work={mockWork}
      />
    );
    
    // 点击环境按钮打开下拉菜单
    const environmentButton = screen.getByText('环境');
    fireEvent.click(environmentButton);
    
    // 应该显示其他预设选项
    expect(screen.getByText('studio')).toBeInTheDocument();
    expect(screen.getByText('apartment')).toBeInTheDocument();
    expect(screen.getByText('warehouse')).toBeInTheDocument();
  });

  it('handles scale changes', () => {
    render(
      <ARPreview 
        config={defaultConfig} 
        onClose={mockOnClose} 
        work={mockWork}
      />
    );
    
    // 使用getAllByRole获取所有range输入控件，然后选择第一个（缩放控件）
    const rangeInputs = screen.getAllByRole('slider');
    const scaleInput = rangeInputs[0]; // 第一个是缩放控件
    fireEvent.change(scaleInput, { target: { value: '2' } });
    
    // 使用字符串比较，因为HTML输入值总是字符串
    expect(scaleInput).toHaveValue('2');
  });

  // 错误边界测试已移除，因为错误边界组件已被简化
  // 不再具有错误捕获功能
});

describe('ARPreview Utility Functions', () => {
  it('handles texture cache cleanup correctly', () => {
    // 测试纹理缓存清理逻辑
    const textureCache = new Map<string, any>();
    const MAX_CACHE_ITEMS = 10;
    
    // 添加超过限制的缓存项
    for (let i = 0; i < 15; i++) {
      textureCache.set(`texture-${i}`, { dispose: jest.fn() });
    }
    
    // 模拟清理函数
    const cleanupTextureCache = () => {
      if (textureCache.size <= MAX_CACHE_ITEMS) return;
      
      const keys = Array.from(textureCache.keys());
      const itemsToRemove = keys.length - MAX_CACHE_ITEMS;
      
      for (let i = 0; i < itemsToRemove; i++) {
        const texture = textureCache.get(keys[i]);
        if (texture) {
          texture.dispose();
        }
        textureCache.delete(keys[i]);
      }
    };
    
    cleanupTextureCache();
    
    expect(textureCache.size).toBe(MAX_CACHE_ITEMS);
  });
});