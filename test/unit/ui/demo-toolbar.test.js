/**
 * Tests for demo-toolbar.js - Legacy toolbar helper
 */

import { describe, expect, test } from 'bun:test';
import { getToolbarHTML, initDemoToolbar } from '../../../src/ui/demo-toolbar.js';

describe('Demo Toolbar', () => {
  describe('getToolbarHTML', () => {
    test('should be a function', () => {
      // THEN: getToolbarHTML should be exported and be a function
      expect(typeof getToolbarHTML).toBe('function');
    });

    test('should return HTML string', () => {
      // WHEN: Getting toolbar HTML
      const html = getToolbarHTML();

      // THEN: Should return a string
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    test('should include toolbar elements', () => {
      // WHEN: Getting toolbar HTML
      const html = getToolbarHTML();

      // THEN: Should contain expected elements
      expect(html).toContain('demo-toolbar');
      expect(html).toContain('button');
    });

    test('should include import and export buttons', () => {
      // WHEN: Getting toolbar HTML
      const html = getToolbarHTML();

      // THEN: Should contain import/export button IDs
      expect(html).toContain('jsonImportButton');
      expect(html).toContain('jsonExportButton');
    });
  });

  describe('initDemoToolbar', () => {
    test('should be a function', () => {
      // THEN: initDemoToolbar should be exported and be a function
      expect(typeof initDemoToolbar).toBe('function');
    });

    test('should accept config parameter', () => {
      // GIVEN: A radar config
      const config = {
        title: 'Test Radar',
        quadrants: [{ name: 'Q1' }, { name: 'Q2' }],
        entries: [],
      };

      // WHEN: Initializing toolbar
      // THEN: Should not throw
      expect(() => initDemoToolbar(config)).not.toThrow();
    });

    test('should handle minimal config', () => {
      // GIVEN: Minimal config with required properties
      const config = {
        demoSlug: 'test',
        title: 'Test',
      };

      // WHEN: Initializing with minimal config
      // THEN: Should not throw
      expect(() => initDemoToolbar(config)).not.toThrow();
    });
  });
});
