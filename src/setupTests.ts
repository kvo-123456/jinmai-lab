import '@testing-library/jest-dom';

// Remove React mock to use the real React module
// jest.mock('react', () => jest.requireActual('react'));

// Simple mocks for Three.js related libraries
jest.mock('three', () => ({
  ...jest.requireActual('three'),
  WebGLRenderer: jest.fn(() => ({
    domElement: document.createElement('canvas'),
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
  })),
}));

jest.mock('@react-three/fiber', () => ({
  Canvas: jest.fn(({ children }) => {
    // 创建一个简单的div来模拟Canvas
    const div = document.createElement('div');
    div.setAttribute('data-testid', 'canvas-mock');
    return div;
  }),
  useFrame: jest.fn((callback) => {
    // 模拟useFrame钩子
    const mockState = { clock: { getElapsedTime: () => 0 } };
    const mockDelta = 0.016;
    if (typeof callback === 'function') {
      callback(mockState, mockDelta);
    }
  }),
}));

jest.mock('@react-three/drei', () => ({
  OrbitControls: jest.fn(() => {
    const div = document.createElement('div');
    div.setAttribute('data-testid', 'orbit-controls-mock');
    return div;
  }),
  PerspectiveCamera: jest.fn(() => {
    const div = document.createElement('div');
    div.setAttribute('data-testid', 'perspective-camera-mock');
    return div;
  }),
  Environment: jest.fn(() => {
    const div = document.createElement('div');
    div.setAttribute('data-testid', 'environment-mock');
    return div;
  }),
  useGLTF: jest.fn(() => ({ 
    scene: { 
      type: 'Group',
      children: [],
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    } 
  })),
}));

// Mock for sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Global test setup
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));