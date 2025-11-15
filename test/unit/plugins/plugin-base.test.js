/**
 * Tests for plugin-base.js - Plugin registration and initialization system
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  definePlugin,
  getPlugin,
  hasPlugin,
  initializePlugins,
  registerPlugin,
} from '../../../src/plugins/plugin-base.js';

describe('Plugin Base System', () => {
  beforeEach(() => {
    // Clear plugin registry before each test
    // Note: We need to access the internal registry, which is not exported
    // For now, we'll work with the public API
  });

  afterEach(() => {
    // Cleanup is handled by the plugin system
  });

  describe('definePlugin', () => {
    test('should create a plugin definition with required properties', () => {
      // GIVEN: A plugin configuration
      const config = {
        name: 'testPlugin',
        init: () => ({ cleanup: () => {} }),
      };

      // WHEN: defining a plugin
      const plugin = definePlugin(config);

      // THEN: it should return a valid plugin definition
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('testPlugin');
      expect(typeof plugin.init).toBe('function');
      expect(plugin.defaults).toEqual({});
    });

    test('should include defaults when provided', () => {
      // GIVEN: A plugin configuration with defaults
      const config = {
        name: 'testPlugin',
        defaults: { enabled: true, timeout: 1000 },
        init: () => ({ cleanup: () => {} }),
      };

      // WHEN: defining a plugin
      const plugin = definePlugin(config);

      // THEN: defaults should be included
      expect(plugin.defaults).toEqual({ enabled: true, timeout: 1000 });
    });

    test('should merge defaults with config in init function', () => {
      // GIVEN: A plugin with defaults
      let receivedConfig = null;
      const plugin = definePlugin({
        name: 'mergeTest',
        defaults: { option1: 'default', option2: 'default' },
        init: config => {
          receivedConfig = config;
          return { cleanup: () => {} };
        },
      });

      // WHEN: initializing with partial config
      plugin.init({ option1: 'override' }, {});

      // THEN: config should be merged with defaults
      expect(receivedConfig).toEqual({ option1: 'override', option2: 'default' });
    });
  });

  describe('registerPlugin', () => {
    test('should register a plugin successfully', () => {
      // GIVEN: A valid plugin
      const testPlugin = definePlugin({
        name: 'uniqueTestPlugin',
        init: () => ({ cleanup: () => {} }),
      });

      // WHEN: registering the plugin
      registerPlugin('uniqueTest', testPlugin);

      // THEN: the plugin should be retrievable
      expect(hasPlugin('uniqueTest')).toBe(true);
      const retrieved = getPlugin('uniqueTest');
      expect(retrieved).not.toBeNull();
      expect(retrieved.name).toBe('uniqueTestPlugin');
    });

    test('should allow re-registration of the same plugin', () => {
      // GIVEN: A plugin that's already registered
      const testPlugin = definePlugin({
        name: 'reregisterTest',
        init: () => ({ cleanup: () => {} }),
      });

      registerPlugin('reregister', testPlugin);

      // WHEN: registering it again
      // THEN: it should not throw an error
      expect(() => registerPlugin('reregister', testPlugin)).not.toThrow();
    });
  });

  describe('hasPlugin', () => {
    test('should return true for registered plugins', () => {
      // GIVEN: A registered plugin
      const testPlugin = definePlugin({
        name: 'hasTest',
        init: () => ({ cleanup: () => {} }),
      });
      registerPlugin('hasTest', testPlugin);

      // WHEN: checking if plugin exists
      // THEN: it should return true
      expect(hasPlugin('hasTest')).toBe(true);
    });

    test('should return false for non-existent plugins', () => {
      // WHEN: checking for a plugin that doesn't exist
      // THEN: it should return false
      expect(hasPlugin('nonExistentPlugin123')).toBe(false);
    });
  });

  describe('getPlugin', () => {
    test('should return plugin definition for registered plugins', () => {
      // GIVEN: A registered plugin
      const testPlugin = definePlugin({
        name: 'getTest',
        init: () => ({ cleanup: () => {} }),
      });
      registerPlugin('getTest', testPlugin);

      // WHEN: getting the plugin
      const retrieved = getPlugin('getTest');

      // THEN: it should return the plugin definition
      expect(retrieved).not.toBeNull();
      expect(retrieved.name).toBe('getTest');
    });

    test('should return null for non-existent plugins', () => {
      // WHEN: getting a plugin that doesn't exist
      const retrieved = getPlugin('nonExistent456');

      // THEN: it should return null
      expect(retrieved).toBeNull();
    });
  });

  describe('initializePlugins', () => {
    test('should initialize plugins with context', () => {
      // GIVEN: A plugin configuration and context
      let initCalled = false;
      let receivedContext = null;

      const testPlugin = definePlugin({
        name: 'initTest',
        init: (_config, context) => {
          initCalled = true;
          receivedContext = context;
          return { cleanup: () => {} };
        },
      });

      registerPlugin('initTest', testPlugin);

      const pluginConfig = { initTest: { enabled: true } };
      const context = { testData: 'test value' };

      // WHEN: initializing plugins
      const result = initializePlugins(pluginConfig, context);

      // THEN: plugin should be initialized with context
      expect(initCalled).toBe(true);
      expect(receivedContext).toEqual(context);
      expect(result.plugins).toBeDefined();
      expect(result.cleanup).toBeDefined();
      expect(typeof result.cleanup).toBe('function');
    });

    test('should skip disabled plugins', () => {
      // GIVEN: A plugin that's disabled
      let initCalled = false;

      const testPlugin = definePlugin({
        name: 'disabledTest',
        init: () => {
          initCalled = true;
          return { cleanup: () => {} };
        },
      });

      registerPlugin('disabledTest', testPlugin);

      const pluginConfig = { disabledTest: { enabled: false } };
      const context = {};

      // WHEN: initializing plugins
      initializePlugins(pluginConfig, context);

      // THEN: plugin should not be initialized
      expect(initCalled).toBe(false);
    });

    test('should call cleanup functions when returned cleanup is called', () => {
      // GIVEN: A plugin with a cleanup function
      let cleanupCalled = false;

      const testPlugin = definePlugin({
        name: 'cleanupTest',
        init: () => ({
          cleanup: () => {
            cleanupCalled = true;
          },
        }),
      });

      registerPlugin('cleanupTest', testPlugin);

      const pluginConfig = { cleanupTest: { enabled: true } };

      // WHEN: initializing and then cleaning up
      const { cleanup } = initializePlugins(pluginConfig, {});
      cleanup();

      // THEN: cleanup function should be called
      expect(cleanupCalled).toBe(true);
    });

    test('should handle plugins without cleanup functions', () => {
      // GIVEN: A plugin that doesn't return a cleanup function
      const testPlugin = definePlugin({
        name: 'noCleanup',
        init: () => ({}),
      });

      registerPlugin('noCleanup', testPlugin);

      const pluginConfig = { noCleanup: { enabled: true } };

      // WHEN: initializing plugins
      const { cleanup } = initializePlugins(pluginConfig, {});

      // THEN: cleanup should be callable without errors
      expect(() => cleanup()).not.toThrow();
    });

    test('should return empty result when no plugins configured', () => {
      // GIVEN: No plugin configuration
      const pluginConfig = {};

      // WHEN: initializing plugins
      const result = initializePlugins(pluginConfig, {});

      // THEN: result should have empty plugins and working cleanup
      expect(result.plugins).toEqual({});
      expect(typeof result.cleanup).toBe('function');
      expect(() => result.cleanup()).not.toThrow();
    });

    test('should handle multiple plugins initialization', () => {
      // GIVEN: Multiple plugins
      let plugin1Init = false;
      let plugin2Init = false;

      const plugin1 = definePlugin({
        name: 'multi1',
        init: () => {
          plugin1Init = true;
          return { cleanup: () => {} };
        },
      });

      const plugin2 = definePlugin({
        name: 'multi2',
        init: () => {
          plugin2Init = true;
          return { cleanup: () => {} };
        },
      });

      registerPlugin('multi1', plugin1);
      registerPlugin('multi2', plugin2);

      const pluginConfig = {
        multi1: { enabled: true },
        multi2: { enabled: true },
      };

      // WHEN: initializing all plugins
      initializePlugins(pluginConfig, {});

      // THEN: both plugins should be initialized
      expect(plugin1Init).toBe(true);
      expect(plugin2Init).toBe(true);
    });
  });
});
