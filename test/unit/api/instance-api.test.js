/**
 * Tests for Instance-Based API (v2025.11.x)
 * Tests the new factory pattern where radar_visualization returns an instance
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import radar_visualization from '../../../src/index.js';

// Helper to create a minimal valid configuration
function createMinimalConfig(options = {}) {
  return {
    svg_id: 'radar',
    width: 1450,
    height: 1000,
    title: 'Test Radar',
    date: '2024-01',
    quadrants: options.quadrants || [
      { name: 'Languages' },
      { name: 'Infrastructure' },
      { name: 'Datastores' },
      { name: 'Data Management' },
    ],
    rings: options.rings || [
      { name: 'ADOPT', color: '#5ba300' },
      { name: 'TRIAL', color: '#009eb0' },
      { name: 'ASSESS', color: '#c7ba00' },
      { name: 'HOLD', color: '#e09b96' },
    ],
    entries: options.entries || [],
    ...options,
  };
}

beforeEach(() => {
  // Reset DOM before each test
  document.body.innerHTML = '<svg id="radar"></svg>';
});

describe('Instance-Based API', () => {
  describe('radar_visualization(config) returns instance', () => {
    test('should return an object (instance)', () => {
      // GIVEN: A valid configuration
      const config = createMinimalConfig();

      // WHEN: Creating a radar instance
      const instance = radar_visualization(config);

      // THEN: Should return an object
      expect(instance).toBeDefined();
      expect(typeof instance).toBe('object');
      expect(instance).not.toBeNull();
    });

    test('should render radar immediately when instance is created', () => {
      // GIVEN: A valid configuration
      const config = createMinimalConfig({
        entries: [{ label: 'Test', quadrant: 0, ring: 0, moved: 0, active: true }],
      });

      // WHEN: Creating a radar instance
      radar_visualization(config);

      // THEN: SVG should be rendered in DOM
      const svg = document.querySelector('svg#radar');
      expect(svg).toBeTruthy();
      const blips = svg.querySelectorAll('.blip');
      expect(blips.length).toBe(1);
    });
  });

  describe('instance.getConfig()', () => {
    test('should return current configuration', () => {
      // GIVEN: A radar instance
      const config = createMinimalConfig({ title: 'My Radar' });
      const instance = radar_visualization(config);

      // WHEN: Getting configuration
      const currentConfig = instance.getConfig();

      // THEN: Should return config with title
      expect(currentConfig).toBeDefined();
      expect(currentConfig.title).toBe('My Radar');
    });

    test('should return a copy, not reference to internal state', () => {
      // GIVEN: A radar instance
      const config = createMinimalConfig({ title: 'Original' });
      const instance = radar_visualization(config);

      // WHEN: Getting config and modifying it
      const config1 = instance.getConfig();
      config1.title = 'Modified';
      const config2 = instance.getConfig();

      // THEN: Internal state should not be affected
      expect(config2.title).toBe('Original');
    });

    test('should include all configuration properties', () => {
      // GIVEN: A radar instance with custom properties
      const config = createMinimalConfig({
        title: 'Test Radar',
        date: '2025-11',
        print_layout: true,
      });
      const instance = radar_visualization(config);

      // WHEN: Getting configuration
      const currentConfig = instance.getConfig();

      // THEN: Should include all properties
      expect(currentConfig.title).toBe('Test Radar');
      expect(currentConfig.date).toBe('2025-11');
      expect(currentConfig.print_layout).toBe(true);
      expect(currentConfig.quadrants).toBeDefined();
      expect(currentConfig.rings).toBeDefined();
    });
  });

  describe('instance.render(newConfig)', () => {
    test('should re-render with new configuration', () => {
      // GIVEN: A radar instance
      const config = createMinimalConfig({
        entries: [{ label: 'Original', quadrant: 0, ring: 0, moved: 0, active: true }],
      });
      const instance = radar_visualization(config);

      // WHEN: Rendering with new entries
      instance.render({
        entries: [
          { label: 'Updated1', quadrant: 0, ring: 0, moved: 0, active: true },
          { label: 'Updated2', quadrant: 1, ring: 1, moved: 0, active: true },
        ],
      });

      // THEN: SVG should show new entries
      const blips = document.querySelectorAll('.blip');
      expect(blips.length).toBe(2);
    });

    test('should merge new config with existing config', () => {
      // GIVEN: A radar instance with title
      const config = createMinimalConfig({ title: 'Original Title' });
      const instance = radar_visualization(config);

      // WHEN: Rendering with only new entries (not title)
      instance.render({
        entries: [{ label: 'New Entry', quadrant: 0, ring: 0, moved: 0, active: true }],
      });

      // THEN: Title should still be present
      const currentConfig = instance.getConfig();
      expect(currentConfig.title).toBe('Original Title');
      expect(currentConfig.entries.length).toBe(1);
    });

    test('should update existing properties', () => {
      // GIVEN: A radar instance
      const config = createMinimalConfig({ title: 'Old Title' });
      const instance = radar_visualization(config);

      // WHEN: Rendering with new title
      instance.render({ title: 'New Title' });

      // THEN: Title should be updated
      const currentConfig = instance.getConfig();
      expect(currentConfig.title).toBe('New Title');
    });

    test('should return instance for method chaining', () => {
      // GIVEN: A radar instance
      const config = createMinimalConfig();
      const instance = radar_visualization(config);

      // WHEN: Calling render
      const result = instance.render({ title: 'Chained' });

      // THEN: Should return the same instance
      expect(result).toBe(instance);
    });

    test('should clear SVG before re-rendering to prevent duplicates', () => {
      // GIVEN: A radar with one entry
      const config = createMinimalConfig({
        entries: [{ label: 'First', quadrant: 0, ring: 0, moved: 0, active: true }],
      });
      const instance = radar_visualization(config);

      // WHEN: Re-rendering with same entry
      instance.render({
        entries: [{ label: 'First', quadrant: 0, ring: 0, moved: 0, active: true }],
      });

      // THEN: Should have only one blip (not duplicated)
      const blips = document.querySelectorAll('.blip');
      expect(blips.length).toBe(1);
    });
  });

  describe('instance.reset()', () => {
    test('should reset to initial configuration', () => {
      // GIVEN: A radar instance with initial config
      const initialConfig = createMinimalConfig({
        title: 'Initial',
        entries: [{ label: 'Initial Entry', quadrant: 0, ring: 0, moved: 0, active: true }],
      });
      const instance = radar_visualization(initialConfig);

      // AND: Configuration has been modified
      instance.render({
        title: 'Modified',
        entries: [{ label: 'Modified Entry', quadrant: 1, ring: 1, moved: 0, active: true }],
      });

      // WHEN: Resetting
      instance.reset();

      // THEN: Should return to initial config
      const currentConfig = instance.getConfig();
      expect(currentConfig.title).toBe('Initial');
      expect(currentConfig.entries.length).toBe(1);
      expect(currentConfig.entries[0].label).toBe('Initial Entry');
    });

    test('should re-render with initial configuration', () => {
      // GIVEN: A radar instance
      const initialConfig = createMinimalConfig({
        entries: [
          { label: 'A', quadrant: 0, ring: 0, moved: 0, active: true },
          { label: 'B', quadrant: 1, ring: 1, moved: 0, active: true },
        ],
      });
      const instance = radar_visualization(initialConfig);

      // AND: Modified to have different entries
      instance.render({
        entries: [{ label: 'C', quadrant: 2, ring: 2, moved: 0, active: true }],
      });

      // WHEN: Resetting
      instance.reset();

      // THEN: Should show initial entries in DOM
      const blips = document.querySelectorAll('.blip');
      expect(blips.length).toBe(2);
    });

    test('should return instance for method chaining', () => {
      // GIVEN: A radar instance
      const config = createMinimalConfig();
      const instance = radar_visualization(config);

      // WHEN: Calling reset
      const result = instance.reset();

      // THEN: Should return the same instance
      expect(result).toBe(instance);
    });

    test('should work after multiple render calls', () => {
      // GIVEN: A radar instance
      const initialConfig = createMinimalConfig({ title: 'Version 1' });
      const instance = radar_visualization(initialConfig);

      // AND: Multiple modifications
      instance.render({ title: 'Version 2' });
      instance.render({ title: 'Version 3' });
      instance.render({ title: 'Version 4' });

      // WHEN: Resetting
      instance.reset();

      // THEN: Should return to version 1
      const currentConfig = instance.getConfig();
      expect(currentConfig.title).toBe('Version 1');
    });
  });

  describe('instance properties', () => {
    test('should have importExport property initialized to null', () => {
      // GIVEN: A radar instance
      const config = createMinimalConfig();
      const instance = radar_visualization(config);

      // THEN: Should have importExport property
      expect(instance).toHaveProperty('importExport');
      expect(instance.importExport).toBeNull();
    });

    test('should allow assignment of importExport capability', () => {
      // GIVEN: A radar instance
      const config = createMinimalConfig();
      const instance = radar_visualization(config);

      // WHEN: Assigning importExport
      const mockIO = { export: () => {}, import: () => {} };
      instance.importExport = mockIO;

      // THEN: Should be assigned
      expect(instance.importExport).toBe(mockIO);
    });

    test('should have persistentStorage property initialized to null', () => {
      // GIVEN: A radar instance
      const config = createMinimalConfig();
      const instance = radar_visualization(config);

      // THEN: Should have persistentStorage property
      expect(instance).toHaveProperty('persistentStorage');
      expect(instance.persistentStorage).toBeNull();
    });

    test('should allow assignment of persistentStorage capability', () => {
      // GIVEN: A radar instance
      const config = createMinimalConfig();
      const instance = radar_visualization(config);

      // WHEN: Assigning persistentStorage
      const mockStorage = { save: () => {}, load: () => {} };
      instance.persistentStorage = mockStorage;

      // THEN: Should be assigned
      expect(instance.persistentStorage).toBe(mockStorage);
    });
  });

  describe('method chaining', () => {
    test('should support chaining render calls', () => {
      // GIVEN: A radar instance
      const config = createMinimalConfig();
      const instance = radar_visualization(config);

      // WHEN: Chaining multiple render calls
      const result = instance.render({ title: 'V1' }).render({ title: 'V2' }).render({ title: 'V3' });

      // THEN: Should work and return instance
      expect(result).toBe(instance);
      expect(result.getConfig().title).toBe('V3');
    });

    test('should support chaining render and reset', () => {
      // GIVEN: A radar instance
      const config = createMinimalConfig({ title: 'Initial' });
      const instance = radar_visualization(config);

      // WHEN: Chaining render and reset
      const result = instance.render({ title: 'Modified' }).reset();

      // THEN: Should work and be reset
      expect(result).toBe(instance);
      expect(result.getConfig().title).toBe('Initial');
    });

    test('should support chaining reset and render', () => {
      // GIVEN: A radar instance
      const config = createMinimalConfig({ title: 'Initial' });
      const instance = radar_visualization(config);

      // WHEN: Modifying, then chaining reset and render
      instance.render({ title: 'Modified1' });
      const result = instance.reset().render({ title: 'Modified2' });

      // THEN: Should work correctly
      expect(result).toBe(instance);
      expect(result.getConfig().title).toBe('Modified2');
    });
  });
});
