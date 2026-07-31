const shared = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  clearMocks: true,
};

export default {
  rootDir: '.',
  projects: [
    {
      ...shared,
      displayName: 'unit',
      testMatch: ['**/__tests__/unit/**/*.test.ts'],
      setupFiles: ['<rootDir>/jest.setup.ts'],
    },
    {
      ...shared,
      displayName: 'integration',
      testMatch: ['**/__tests__/integration/**/*.test.ts'],
      setupFiles: ['<rootDir>/jest.integration.setup.ts'],
      testTimeout: 30_000,
    },
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/mocks/**',
    '!src/index.ts',
    '!src/scripts/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
