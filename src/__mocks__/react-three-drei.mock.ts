// Mock @react-three/drei for testing
export const OrbitControls = jest.fn(() => null);
export const PerspectiveCamera = jest.fn(() => null);
export const OrthographicCamera = jest.fn(() => null);
export const Sky = jest.fn(() => null);
export const Environment = jest.fn(() => null);
export const useGLTF = jest.fn().mockResolvedValue(null);
export const useTexture = jest.fn().mockResolvedValue(null);
export const useAnimations = jest.fn().mockReturnValue({});
export const Grid = jest.fn(() => null);
export const Box = jest.fn(() => null);
export const Sphere = jest.fn(() => null);
export const Plane = jest.fn(() => null);
export const CameraShake = jest.fn(() => null);
export const TransformControls = jest.fn(() => null);
export const FirstPersonControls = jest.fn(() => null);
export const MapControls = jest.fn(() => null);
export const CameraControls = jest.fn(() => null);

export default {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  Sky,
  Environment,
  useGLTF,
  useTexture,
  useAnimations,
  Grid,
  Box,
  Sphere,
  Plane,
  CameraShake,
  TransformControls,
  FirstPersonControls,
  MapControls,
  CameraControls
};
