module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^react-native-url-polyfill/auto$': '<rootDir>/__mocks__/empty.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
  },
};