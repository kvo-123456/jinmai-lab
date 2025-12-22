// Mock three.js for testing
export const Texture = jest.fn();
export const Group = jest.fn();
export const Vector3 = jest.fn().mockImplementation(() => ({
  set: jest.fn(),
  copy: jest.fn(),
  lerpVectors: jest.fn(),
  fromArray: jest.fn(),
  x: 0,
  y: 0,
  z: 0
}));
export const Quaternion = jest.fn().mockImplementation(() => ({
  set: jest.fn(),
  copy: jest.fn()
}));
export const Matrix4 = jest.fn().mockImplementation(() => ({
  fromArray: jest.fn(),
  decompose: jest.fn(),
  clone: jest.fn().mockReturnThis()
}));
export const CanvasTexture = jest.fn();
export const Color = jest.fn().mockImplementation(() => ({
  set: jest.fn()
}));
export const BasicShadowMap = 0;
export const PCFShadowMap = 1;
export const PCFSoftShadowMap = 2;
export const BackSide = 0;
export const DoubleSide = 1;
export const MeshBasicMaterial = jest.fn();
export const MeshStandardMaterial = jest.fn();
export const Mesh = jest.fn();
export const PlaneGeometry = jest.fn();
export const SphereGeometry = jest.fn();
export const BoxGeometry = jest.fn();
export const CircleGeometry = jest.fn();
export const RingGeometry = jest.fn();
export const LineSegments = jest.fn();
export const BufferGeometry = jest.fn();
export const BufferAttribute = jest.fn();
export const LineBasicMaterial = jest.fn();
export const AmbientLight = jest.fn();
export const DirectionalLight = jest.fn();
export const PointLight = jest.fn();
export const Fog = jest.fn();
export const FogExp2 = jest.fn();
export const XRRay = jest.fn().mockImplementation(() => ({
  origin: { x: 0, y: 0, z: 0 },
  direction: { x: 0, y: 0, z: -1 }
}));
export const TextureLoader = jest.fn().mockImplementation(() => ({
  load: jest.fn().mockImplementation((url, onLoad) => {
    const texture = new Texture();
    if (onLoad) {
      onLoad(texture);
    }
    return texture;
  })
}));

export default {
  Texture,
  Group,
  Vector3,
  Quaternion,
  Matrix4,
  CanvasTexture,
  Color,
  BasicShadowMap,
  PCFShadowMap,
  PCFSoftShadowMap,
  BackSide,
  DoubleSide,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Mesh,
  PlaneGeometry,
  SphereGeometry,
  BoxGeometry,
  CircleGeometry,
  RingGeometry,
  LineSegments,
  BufferGeometry,
  BufferAttribute,
  LineBasicMaterial,
  AmbientLight,
  DirectionalLight,
  PointLight,
  Fog,
  FogExp2,
  XRRay,
  TextureLoader
};
