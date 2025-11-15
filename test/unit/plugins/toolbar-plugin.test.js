/**
 * Tests for toolbar-plugin.js - Floating toolbar UI
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { toolbarPlugin } from '../../../src/plugins/toolbar-plugin.js';

describe('Toolbar Plugin', () => {
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '';
  });

  describe('Plugin Definition', () => {
    test('should have required plugin properties', () => {
      // THEN: Plugin should have name and init function
      expect(toolbarPlugin.name).toBe('toolbar');
      expect(typeof toolbarPlugin.init).toBe('function');
      expect(toolbarPlugin.defaults).toBeDefined();
    });

    test('should have default configuration', () => {
      // THEN: Defaults should include enabled flag
      expect(toolbarPlugin.defaults.enabled).toBe(true);
    });
  });

  describe('Initialization', () => {
    test('should initialize plugin with config and context', () => {
      // GIVEN: Valid config and context
      const config = {
        enabled: true,
        containerId: 'test-toolbar',
      };

      const context = {
        importExportPlugin: {
          exportConfig: () => {},
          importConfig: () => {},
        },
        getCurrentConfig: () => ({ title: 'Test' }),
        demoSlug: 'test',
      };

      // WHEN: Initializing the plugin
      const instance = toolbarPlugin.init(config, context);

      // THEN: Should return instance with render method and cleanup
      expect(instance).toBeDefined();
      expect(typeof instance.render).toBe('function');
      expect(typeof instance.cleanup).toBe('function');
    });

    test('should skip initialization when disabled', () => {
      // GIVEN: A disabled config
      const config = { enabled: false };
      const context = {};

      // WHEN: Initializing the plugin
      const instance = toolbarPlugin.init(config, context);

      // THEN: Should return minimal instance with cleanup
      expect(instance).toBeDefined();
      expect(typeof instance.cleanup).toBe('function');
    });

    test('should handle missing importExportPlugin gracefully', () => {
      // GIVEN: Context without importExportPlugin
      const config = { enabled: true };
      const context = {
        getCurrentConfig: () => ({}),
        demoSlug: 'test',
      };

      // WHEN: Initializing plugin
      // THEN: Should not throw
      expect(() => toolbarPlugin.init(config, context)).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    test('should provide cleanup function that is callable', () => {
      // GIVEN: An initialized plugin
      const config = { enabled: true };
      const context = {
        importExportPlugin: {},
        getCurrentConfig: () => ({}),
        demoSlug: 'cleanup-test',
      };

      const instance = toolbarPlugin.init(config, context);

      // THEN: Cleanup should be callable without errors
      expect(typeof instance.cleanup).toBe('function');
      expect(() => instance.cleanup()).not.toThrow();
    });
  });
});
