/**
 * Tests for storage-plugin.js - Persistent storage adapters
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { storagePlugin } from '../../../src/plugins/storage-plugin.js';

describe('Storage Plugin', () => {
  beforeEach(() => {
    // Clear localStorage and sessionStorage before each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });

  describe('Plugin Definition', () => {
    test('should have required plugin properties', () => {
      // THEN: Plugin should have name and init function
      expect(storagePlugin.name).toBe('storage');
      expect(typeof storagePlugin.init).toBe('function');
      expect(storagePlugin.defaults).toBeDefined();
    });

    test('should have default configuration', () => {
      // THEN: Defaults should include type and key
      expect(storagePlugin.defaults.type).toBe('localStorage');
      expect(storagePlugin.defaults.key).toBe('default');
      expect(storagePlugin.defaults.namespace).toBe('tech-radar');
    });
  });

  describe('LocalStorage Adapter', () => {
    test('should initialize with localStorage adapter', () => {
      // GIVEN: A config using localStorage
      const config = {
        enabled: true,
        type: 'localStorage',
        key: 'test-radar',
      };

      const context = {
        getCurrentConfig: () => ({ title: 'Test Radar' }),
      };

      // WHEN: Initializing the plugin
      const instance = storagePlugin.init(config, context);

      // THEN: Should return instance with storage adapter
      expect(instance).toBeDefined();
      expect(instance.storage).toBeDefined();
      expect(typeof instance.storage.save).toBe('function');
      expect(typeof instance.storage.load).toBe('function');
      expect(typeof instance.storage.clear).toBe('function');
    });

    test('should save and load config from localStorage', async () => {
      // GIVEN: A storage plugin instance
      const config = {
        enabled: true,
        type: 'localStorage',
        key: 'test-save-load',
      };

      const testConfig = { title: 'Test Radar', entries: [] };
      const context = {
        getCurrentConfig: () => testConfig,
      };

      const instance = storagePlugin.init(config, context);

      // WHEN: Saving and loading config
      await instance.save();
      const loaded = await instance.load();

      // THEN: Loaded config should match saved config
      expect(loaded).toEqual(testConfig);
      expect(loaded.title).toBe('Test Radar');
    });

    test('should clear stored config', async () => {
      // GIVEN: A storage plugin with saved data
      const config = {
        enabled: true,
        type: 'localStorage',
        key: 'test-clear',
      };

      const testConfig = { title: 'Test Radar' };
      const context = {
        getCurrentConfig: () => testConfig,
      };

      const instance = storagePlugin.init(config, context);
      await instance.save();

      // WHEN: Clearing storage
      await instance.clear();

      // THEN: Load should return null
      const loaded = await instance.load();
      expect(loaded).toBeNull();
    });

    test('should handle missing localStorage gracefully', () => {
      // GIVEN: localStorage might not be available
      const config = {
        enabled: true,
        type: 'localStorage',
        key: 'test-missing',
      };

      const context = {
        getCurrentConfig: () => ({}),
      };

      // WHEN: Initializing plugin
      // THEN: Should not throw
      expect(() => storagePlugin.init(config, context)).not.toThrow();
    });
  });

  describe('SessionStorage Adapter', () => {
    test('should initialize with sessionStorage adapter', () => {
      // GIVEN: A config using sessionStorage
      const config = {
        enabled: true,
        type: 'sessionStorage',
        key: 'session-test',
      };

      const context = {
        getCurrentConfig: () => ({ title: 'Session Test' }),
      };

      // WHEN: Initializing the plugin
      const instance = storagePlugin.init(config, context);

      // THEN: Should return instance with storage methods
      expect(instance).toBeDefined();
      expect(instance.storage).toBeDefined();
      expect(typeof instance.storage.save).toBe('function');
      expect(typeof instance.storage.load).toBe('function');
    });
  });

  describe('Cleanup', () => {
    test('should provide cleanup function', () => {
      // GIVEN: An initialized plugin
      const config = { enabled: true, type: 'localStorage', key: 'cleanup-test' };
      const context = { getCurrentConfig: () => ({}) };

      const instance = storagePlugin.init(config, context);

      // THEN: Cleanup should be callable
      expect(typeof instance.cleanup).toBe('function');
      expect(() => instance.cleanup()).not.toThrow();
    });
  });
});
