module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/services/**/*.test.ts',
    '**/__tests__/integration/**/*.test.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest',
  },
};