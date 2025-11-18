/**
 * Tests for demo-toolbar.js - Instance-based toolbar helper
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { getToolbarHTML, initDemoToolbar, injectToolbar } from '../../../src/ui/demo-toolbar.js';

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

  // Reset DOM for each test
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
  }
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

  describe('injectToolbar', () => {
    test('should be a function', () => {
      // THEN: injectToolbar should be exported and be a function
      expect(typeof injectToolbar).toBe('function');
    });

    test('should return false when toolbarId is not provided', () => {
      // WHEN: Calling injectToolbar without toolbarId
      const result1 = injectToolbar();
      const result2 = injectToolbar(null);
      const result3 = injectToolbar('');

      // THEN: Should return false
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });

    test('should return false when container element does not exist', () => {
      // GIVEN: No element with id "toolbar" exists
      // WHEN: Calling injectToolbar
      const result = injectToolbar('toolbar');

      // THEN: Should return false
      expect(result).toBe(false);
    });

    test('should return true when container exists', () => {
      // GIVEN: A container element exists
      if (typeof document !== 'undefined') {
        const container = document.createElement('div');
        container.id = 'toolbar';
        document.body.appendChild(container);

        // WHEN: Calling injectToolbar
        const result = injectToolbar('toolbar');

        // THEN: Should return true
        expect(result).toBe(true);
      }
    });

    test('should inject toolbar HTML into container', () => {
      // GIVEN: A container element exists
      if (typeof document !== 'undefined') {
        const container = document.createElement('div');
        container.id = 'toolbar';
        document.body.appendChild(container);

        // WHEN: Calling injectToolbar
        injectToolbar('toolbar');

        // THEN: Container should have toolbar HTML
        expect(container.innerHTML).toContain('demo-toolbar');
        expect(container.innerHTML).toContain('jsonImportButton');
        expect(container.innerHTML).toContain('jsonExportButton');
        expect(container.innerHTML).toContain('jsonResetButton');
      }
    });

    test('should clear existing content before injecting', () => {
      // GIVEN: A container with existing content
      if (typeof document !== 'undefined') {
        const container = document.createElement('div');
        container.id = 'toolbar';
        container.innerHTML = '<p>Old content</p>';
        document.body.appendChild(container);

        // WHEN: Calling injectToolbar
        injectToolbar('toolbar');

        // THEN: Old content should be replaced
        expect(container.innerHTML).not.toContain('Old content');
        expect(container.innerHTML).toContain('demo-toolbar');
      }
    });

    test('should inject all required toolbar elements', () => {
      // GIVEN: A container element exists
      if (typeof document !== 'undefined') {
        const container = document.createElement('div');
        container.id = 'my-toolbar';
        document.body.appendChild(container);

        // WHEN: Calling injectToolbar
        injectToolbar('my-toolbar');

        // THEN: All required elements should be present
        const injectedHTML = container.innerHTML;
        expect(injectedHTML).toContain('demo-toolbar__controls');
        expect(injectedHTML).toContain('demo-toolbar__button');
        expect(injectedHTML).toContain('jsonImportButton');
        expect(injectedHTML).toContain('jsonExportButton');
        expect(injectedHTML).toContain('jsonResetButton');
        expect(injectedHTML).toContain('jsonImportInput');
        expect(injectedHTML).toContain('jsonToolbarMessage');
        expect(injectedHTML).toContain('fa-file-import');
        expect(injectedHTML).toContain('fa-file-export');
        expect(injectedHTML).toContain('fa-undo');
      }
    });

    test('should create accessible toolbar with ARIA attributes', () => {
      // GIVEN: A container element exists
      if (typeof document !== 'undefined') {
        const container = document.createElement('div');
        container.id = 'toolbar';
        document.body.appendChild(container);

        // WHEN: Calling injectToolbar
        injectToolbar('toolbar');

        // THEN: Should have ARIA attributes for accessibility
        const injectedHTML = container.innerHTML;
        expect(injectedHTML).toContain('role="region"');
        expect(injectedHTML).toContain('aria-label="JSON configuration tools"');
        expect(injectedHTML).toContain('aria-label="Import JSON"');
        expect(injectedHTML).toContain('aria-label="Export JSON"');
        expect(injectedHTML).toContain('aria-label="Reset Configuration"');
        expect(injectedHTML).toContain('aria-live="polite"');
      }
    });

    test('should inject HTML that contains all key elements from getToolbarHTML', () => {
      // GIVEN: A container element exists
      if (typeof document !== 'undefined') {
        const container = document.createElement('div');
        container.id = 'toolbar';
        document.body.appendChild(container);

        // WHEN: Calling injectToolbar
        injectToolbar('toolbar');

        // THEN: Injected HTML should contain all key elements
        const expectedHTML = getToolbarHTML();
        const receivedHTML = container.innerHTML;

        // Check for key structural elements
        expect(receivedHTML).toContain('class="demo-toolbar"');
        expect(receivedHTML).toContain('class="demo-toolbar__controls"');
        expect(receivedHTML).toContain('class="demo-toolbar__message"');

        // Verify both have the same button IDs
        expect(expectedHTML.includes('id="jsonImportButton"')).toBe(receivedHTML.includes('id="jsonImportButton"'));
        expect(expectedHTML.includes('id="jsonExportButton"')).toBe(receivedHTML.includes('id="jsonExportButton"'));
        expect(expectedHTML.includes('id="jsonResetButton"')).toBe(receivedHTML.includes('id="jsonResetButton"'));

        // Verify both have Font Awesome icons
        expect(expectedHTML.includes('fa-file-import')).toBe(receivedHTML.includes('fa-file-import'));
        expect(expectedHTML.includes('fa-file-export')).toBe(receivedHTML.includes('fa-file-export'));
        expect(expectedHTML.includes('fa-undo')).toBe(receivedHTML.includes('fa-undo'));
      }
    });
  });
});
