module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock three.js and related libraries for testing
    '^three$': '<rootDir>/src/__mocks__/three.mock.ts',
    '^@react-three/fiber$': '<rootDir>/src/__mocks__/react-three-fiber.mock.ts',
    '^@react-three/drei$': '<rootDir>/src/__mocks__/react-three-drei.mock.ts',
    '^@react-three/xr$': '<rootDir>/src/__mocks__/react-three-xr.mock.ts'
  },
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.json'
    }],
    // Transform ESM modules from node_modules
    '^.+\.(js|jsx)$': ['babel-jest', {
      presets: ['@babel/preset-env', '@babel/preset-react'],
      plugins: ['@babel/plugin-transform-modules-commonjs']
    }]
  },
  transformIgnorePatterns: [
    // Don't ignore ESM modules from these packages
    'node_modules/(?!(@react-three/xr|@react-three/fiber|@react-three/drei|three|@mediapipe/|@tensorflow/))'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],
  // Enable ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
  // Handle ESM imports
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};