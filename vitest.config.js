import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    // Enable mocking capabilities compatible with jest style imports
    // (vi is used directly in test files).
    setupFiles: [],
    // Increase timeout for async fetch mocks if needed
    hookTimeout: 10000,
    // Include test files with .test.* pattern inside src folder
  },
});