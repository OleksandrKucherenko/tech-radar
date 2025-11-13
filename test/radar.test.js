/**
 * DEPRECATED: Bun Test Runner Guidance
 *
 * This file serves as a placeholder to guide users to the Vitest setup.
 * The original Bun tests have been replaced with Vitest for better coverage and CI/CD integration.
 *
 * To run tests, please use:
 * - bun test                    # Runs Vitest (recommended)
 * - bun run test:coverage      # Vitest with coverage reports
 * - bun run test:junit         # Vitest with JUnit output for CI/CD
 * - bun run test:watch         # Vitest in watch mode for development
 * - bun run test:bun           # Original Bun runner (deprecated)
 *
 * Why the change?
 * ================
 * Bun cannot generate code coverage for radar.js because it's loaded via eval().
 * Vitest provides better test infrastructure, JUnit integration, and coverage reports.
 *
 * If you need the original Bun tests for compatibility:
 * ==========================================================
 * 1. Rename this file to radar.test.js.bak
 * 2. Restore the original test file from git history
 * 3. Run: bun run test:bun
 */

import { test, expect } from 'bun:test';

test('provides guidance about using Vitest instead of Bun for testing', () => {
  // This test serves as a helpful reminder to use Vitest
  const guidance = `
  ╔══════════════════════════════════════════════════════════════╗
  ║   Please use Vitest for testing radar.js                    ║
  ║   =======================================================   ║
  ║   bun test                    # Run Vitest (recommended)   ║
  ║   bun run test:coverage      # Vitest with coverage         ║
  ║   bun run test:junit         # JUnit for CI/CD            ║
  ║   bun run test:watch         # Watch mode for development  ║
  ║                                                              ║
  ║   See TESTING_SOLUTION.md for detailed instructions         ║
  ╚══════════════════════════════════════════════════════════════╝
  `;

  expect(guidance).toContain('Vitest');
  expect(guidance).toContain('bun test');
});

test('explains why Vitest is recommended over Bun', () => {
  const reasons = [
    'Vitest provides proper JUnit integration for CI/CD pipelines',
    'Better test infrastructure and reporting',
    'Coverage reports (though limited due to eval() usage)',
    'Watch mode for improved development experience',
    'Bun cannot track coverage for eval() loaded code'
  ];

  reasons.forEach(reason => {
    expect(typeof reason).toBe('string');
    expect(reason.length).toBeGreaterThan(10);
  });
});