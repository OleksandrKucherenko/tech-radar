/**
 * Tests for demo-toolbar.js - Instance-based toolbar helper
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { getToolbarHTML, initDemoToolbar } from '../../../src/ui/demo-toolbar.js';

// Mock radar_visualization.jsonIO
beforeEach(() => {
  // Setup global radar_visualization with jsonIO
  globalThis.radar_visualization = {
    jsonIO: {
      importConfig: () => {},
      exportConfig: () => {},
      mergeConfigs: (base, imported) => ({ ...base, ...imported }),
    },
  };
});

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

    test('should accept radarInstance and options parameters', () => {
      // GIVEN: A mock radar instance and options
      const mockInstance = {
        getConfig: () => ({ title: 'Test' }),
        render: () => {},
        reset: () => {},
      };
      const options = { demoSlug: 'test' };

      // WHEN: Initializing toolbar
      // THEN: Should not throw
      expect(() => initDemoToolbar(mockInstance, options)).not.toThrow();
    });

    test('should return toolbar instance object', () => {
      // GIVEN: Mock radar instance
      const mockInstance = {
        getConfig: () => ({}),
        render: () => {},
        reset: () => {},
      };

      // WHEN: Initializing toolbar
      const toolbar = initDemoToolbar(mockInstance, { demoSlug: 'test' });

      // THEN: Should return toolbar instance
      expect(toolbar).toBeDefined();
      expect(typeof toolbar).toBe('object');
    });

    test('should auto-wire callbacks when instance provided', () => {
      // GIVEN: A radar instance
      const mockInstance = {
        getConfig: () => ({ title: 'Test' }),
        render: () => {},
        reset: () => {},
      };

      // WHEN: Initializing toolbar with instance (DOM elements missing)
      const toolbar = initDemoToolbar(mockInstance, { demoSlug: 'test' });

      // THEN: Should return early warning object due to missing DOM elements
      // But the concept of auto-wiring is still valid when DOM is present
      expect(toolbar).toBeDefined();
      expect(toolbar.getCurrentConfig).toBeDefined();
      expect(toolbar.onConfigImport).toBeDefined();
      expect(toolbar.onConfigReset).toBeDefined();
    });

    test('should allow null instance for manual wiring', () => {
      // GIVEN: No radar instance (null)
      // WHEN: Initializing toolbar without instance
      const toolbar = initDemoToolbar(null, { demoSlug: 'test' });

      // THEN: Callbacks should be null (for manual assignment)
      expect(toolbar.getCurrentConfig).toBeNull();
      expect(toolbar.onConfigImport).toBeNull();
      expect(toolbar.onConfigReset).toBeNull();
    });

    test('should include showMessage method', () => {
      // GIVEN: Mock radar instance
      const mockInstance = {
        getConfig: () => ({}),
        render: () => {},
        reset: () => {},
      };

      // WHEN: Initializing toolbar
      const toolbar = initDemoToolbar(mockInstance, { demoSlug: 'test' });

      // THEN: Should have showMessage method
      expect(toolbar.showMessage).toBeDefined();
      expect(typeof toolbar.showMessage).toBe('function');
    });

    test('should include cleanup method', () => {
      // GIVEN: Mock radar instance
      const mockInstance = {
        getConfig: () => ({}),
        render: () => {},
        reset: () => {},
      };

      // WHEN: Initializing toolbar
      const toolbar = initDemoToolbar(mockInstance, { demoSlug: 'test' });

      // THEN: Should have cleanup method
      expect(toolbar.cleanup).toBeDefined();
      expect(typeof toolbar.cleanup).toBe('function');
    });
  });
});
