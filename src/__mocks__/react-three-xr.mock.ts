// Mock @react-three/xr for testing
export const XR = jest.fn(({ children }) => {
  const div = document.createElement('div');
  div.setAttribute('data-testid', 'xr');
  return div;
});

export const ARButton = jest.fn(() => {
  const button = document.createElement('button');
  button.setAttribute('data-testid', 'ar-button');
  button.textContent = '进入AR';
  return button;
});

export const createXRStore = jest.fn().mockReturnValue({
  getState: jest.fn().mockReturnValue({}),
  setState: jest.fn(),
  subscribe: jest.fn()
});

export const useXR = jest.fn().mockReturnValue({
  isPresenting: false,
  session: null,
  referenceSpace: null,
  inputSources: []
});

export const useHitTest = jest.fn().mockReturnValue([]);

export const useInputSource = jest.fn().mockReturnValue(null);

export const useSession = jest.fn().mockReturnValue(null);

export const useReferenceSpace = jest.fn().mockReturnValue(null);

export const useXRFrame = jest.fn();

export const useXRSessionEvent = jest.fn();

export const useXRInputSourceEvent = jest.fn();

export default {
  XR,
  ARButton,
  createXRStore,
  useXR,
  useHitTest,
  useInputSource,
  useSession,
  useReferenceSpace,
  useXRFrame,
  useXRSessionEvent,
  useXRInputSourceEvent
};
