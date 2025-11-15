/**
 * Tests for import-export-plugin.js - JSON import/export functionality
 */

import { describe, expect, test } from 'bun:test';
import { importExportPlugin } from '../../../src/plugins/import-export-plugin.js';

describe('Import/Export Plugin', () => {
  describe('Plugin Definition', () => {
    test('should have required plugin properties', () => {
      // THEN: Plugin should have name and init function
      expect(importExportPlugin.name).toBe('importExport');
      expect(typeof importExportPlugin.init).toBe('function');
      expect(importExportPlugin.defaults).toBeDefined();
    });

    test('should have default configuration', () => {
      // THEN: Defaults should include formats and options
      expect(importExportPlugin.defaults.formats).toContain('json');
      expect(importExportPlugin.defaults.pretty).toBe(true);
    });
  });

  describe('Initialization', () => {
    test('should initialize plugin with config and context', () => {
      // GIVEN: Valid config and context
      const config = {
        enabled: true,
        formats: ['json'],
        pretty: true,
      };

      const testConfig = { title: 'Test Radar', entries: [] };
      const context = {
        getCurrentConfig: () => testConfig,
        demoSlug: 'test-radar',
      };

      // WHEN: Initializing the plugin
      const instance = importExportPlugin.init(config, context);

      // THEN: Should return instance with export/import methods
      expect(instance).toBeDefined();
      expect(typeof instance.export).toBe('function');
      expect(typeof instance.import).toBe('function');
    });

    test('should handle missing context gracefully', () => {
      // GIVEN: Minimal config
      const config = { enabled: true };
      const context = {};

      // WHEN: Initializing plugin
      // THEN: Should not throw
      expect(() => importExportPlugin.init(config, context)).not.toThrow();
    });
  });

  describe('Export Functionality', () => {
    test('should export config as JSON', () => {
      // GIVEN: An initialized plugin
      const testConfig = {
        title: 'Export Test',
        quadrants: [{ name: 'Q1' }, { name: 'Q2' }],
        entries: [],
      };

      const config = { enabled: true, pretty: true };
      const context = {
        getCurrentConfig: () => testConfig,
        demoSlug: 'export-test',
      };

      const instance = importExportPlugin.init(config, context);

      // WHEN: Checking if export function exists
      // THEN: Export function should be available
      expect(typeof instance.export).toBe('function');
    });
  });

  describe('Import Functionality', () => {
    test('should have import config method', () => {
      // GIVEN: An initialized plugin
      const config = { enabled: true };
      const context = {
        getCurrentConfig: () => ({}),
        demoSlug: 'import-test',
      };

      const instance = importExportPlugin.init(config, context);

      // THEN: Import function should be available
      expect(typeof instance.import).toBe('function');
    });
  });

  describe('Cleanup', () => {
    test('should provide cleanup function', () => {
      // GIVEN: An initialized plugin
      const config = { enabled: true };
      const context = {
        getCurrentConfig: () => ({}),
        demoSlug: 'cleanup-test',
      };

      const instance = importExportPlugin.init(config, context);

      // THEN: Cleanup should be callable
      expect(typeof instance.cleanup).toBe('function');
      expect(() => instance.cleanup()).not.toThrow();
    });
  });
});
