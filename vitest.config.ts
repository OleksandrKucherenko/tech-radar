import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom environment for DOM manipulation
    environment: 'jsdom',

    // Global setup for DOM and D3
    setupFiles: ['./test/vitest-setup.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        'test/**',
        'coverage/**',
        'dist/**',
        '**/*.config.*',
        '**/*.d.ts',
      ],
      include: [
        'docs/radar.js',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },

    // Test reporter configuration
    reporter: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results.xml',
    },

    // Global variables
    globals: true,

    // Include patterns
    include: ['test/vitest/**/*.vitest.{js,ts}'],
    exclude: ['node_modules', 'dist'],
  },
});