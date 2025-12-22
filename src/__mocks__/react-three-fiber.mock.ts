// Mock @react-three/fiber for testing
export const Canvas = jest.fn(({ children }) => {
  const div = document.createElement('div');
  div.setAttribute('data-testid', 'canvas');
  return div;
});

export const useThree = jest.fn().mockReturnValue({
  camera: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    lookAt: jest.fn(),
    updateProjectionMatrix: jest.fn(),
    projectionMatrix: { clone: jest.fn().mockReturnThis() }
  },
  gl: {
    domElement: document.createElement('canvas'),
    setClearColor: jest.fn(),
    shadowMap: { enabled: false, type: 0 },
    toneMappingExposure: 1.0,
    xr: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }
  },
  scene: {
    background: null,
    fog: null,
    children: [],
    add: jest.fn(),
    remove: jest.fn()
  }
});

export const useLoader = jest.fn().mockResolvedValue(null);
export const useFrame = jest.fn();
export const useUpdate = jest.fn();
export const useGraph = jest.fn();

export default {
  Canvas,
  useThree,
  useLoader,
  useFrame,
  useUpdate,
  useGraph
};
