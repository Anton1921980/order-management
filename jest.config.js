module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/client/'],
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/config/**',
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  testTimeout: 30000, // 30 seconds
  verbose: true,
  // Setup and teardown
  setupFilesAfterEnv: ['./src/tests/setup.js'],
  // Ensure tests exit properly
  forceExit: true,
  // Clean mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Handle async operations
  detectOpenHandles: true,
};
