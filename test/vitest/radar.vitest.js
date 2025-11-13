/**
 * Unit tests for radar.js using Vitest
 * Tests critical functionality to ensure the radar visualization works correctly
 * and to prevent regressions.
 *
 * Tests follow GIVEN/WHEN/THEN pattern for clarity and maintainability.
 */

import { describe, test, expect, beforeEach } from 'vitest';

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
      { name: 'Data Management' }
    ],
    rings: options.rings || [
      { name: 'ADOPT', color: '#5ba300' },
      { name: 'TRIAL', color: '#009eb0' },
      { name: 'ASSESS', color: '#c7ba00' },
      { name: 'HOLD', color: '#e09b96' }
    ],
    entries: options.entries || [],
    ...options
  };
}

// Note: DOM reset is handled by vitest-setup.js for Vitest
// Skip DOM reset for Bun to avoid conflicts

describe('Configuration Validation', () => {
  test('should throw error for less than 2 quadrants', () => {
    // GIVEN: a configuration with only 1 quadrant
    const config = createMinimalConfig({
      quadrants: [{ name: 'Only One' }]
    });

    // WHEN: the radar visualization is initialized
    // THEN: it should throw an error about quadrant count being out of bounds
    expect(() => radar_visualization(config)).toThrow(/Number of quadrants must be between 2 and 8/);
  });

  test('should throw error for more than 8 quadrants', () => {
    // GIVEN: a configuration with 9 quadrants
    const config = createMinimalConfig({
      quadrants: Array(9).fill(null).map((_, i) => ({ name: `Q${i}` }))
    });

    // WHEN: the radar visualization is initialized
    // THEN: it should throw an error about quadrant count being out of bounds
    expect(() => radar_visualization(config)).toThrow(/Number of quadrants must be between 2 and 8/);
  });

  test('should throw error for less than 4 rings', () => {
    // GIVEN: a configuration with only 3 rings
    const config = createMinimalConfig({
      rings: [
        { name: 'ADOPT', color: '#5ba300' },
        { name: 'TRIAL', color: '#009eb0' },
        { name: 'ASSESS', color: '#c7ba00' }
      ]
    });

    // WHEN: the radar visualization is initialized
    // THEN: it should throw an error about ring count being out of bounds
    expect(() => radar_visualization(config)).toThrow(/Number of rings must be between 4 and 8/);
  });

  test('should throw error for more than 8 rings', () => {
    // GIVEN: a configuration with 9 rings
    const config = createMinimalConfig({
      rings: Array(9).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' }))
    });

    // WHEN: the radar visualization is initialized
    // THEN: it should throw an error about ring count being out of bounds
    expect(() => radar_visualization(config)).toThrow(/Number of rings must be between 4 and 8/);
  });

  test('should accept 2 quadrants (minimum)', () => {
    // GIVEN: a configuration with 2 quadrants (minimum allowed)
    const config = createMinimalConfig({
      quadrants: [
        { name: 'Frontend' },
        { name: 'Backend' }
      ],
      entries: []
    });

    // WHEN: the radar visualization is initialized
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should accept 8 quadrants (maximum)', () => {
    // GIVEN: a configuration with 8 quadrants (maximum allowed)
    const config = createMinimalConfig({
      quadrants: Array(8).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: []
    });

    // WHEN: the radar visualization is initialized
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should accept 4 rings (minimum)', () => {
    // GIVEN: a configuration with 4 rings (minimum allowed)
    const config = createMinimalConfig({
      rings: Array(4).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: []
    });

    // WHEN: the radar visualization is initialized
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should accept 8 rings (maximum)', () => {
    // GIVEN: a configuration with 8 rings (maximum allowed)
    const config = createMinimalConfig({
      rings: Array(8).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: []
    });

    // WHEN: the radar visualization is initialized
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });
});

describe('Entry Validation', () => {
  test('should throw error for entry with invalid quadrant index', () => {
    // GIVEN: a configuration with an entry having quadrant index 5 when only 4 quadrants exist
    const config = createMinimalConfig({
      entries: [
        { label: 'Test Tech', quadrant: 5, ring: 0, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is initialized
    // THEN: it should throw an error about invalid quadrant index
    expect(() => radar_visualization(config)).toThrow(/Entry 'Test Tech' has invalid quadrant/);
  });

  test('should throw error for entry with negative quadrant index', () => {
    // GIVEN: a configuration with an entry having negative quadrant index
    const config = createMinimalConfig({
      entries: [
        { label: 'Test Tech', quadrant: -1, ring: 0, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is initialized
    // THEN: it should throw an error about invalid quadrant index
    expect(() => radar_visualization(config)).toThrow(/Entry 'Test Tech' has invalid quadrant/);
  });

  test('should throw error for entry with invalid ring index', () => {
    // GIVEN: a configuration with an entry having ring index 5 when only 4 rings exist
    const config = createMinimalConfig({
      entries: [
        { label: 'Test Tech', quadrant: 0, ring: 5, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is initialized
    // THEN: it should throw an error about invalid ring index
    expect(() => radar_visualization(config)).toThrow(/Entry 'Test Tech' has invalid ring/);
  });

  test('should throw error for entry with negative ring index', () => {
    // GIVEN: a configuration with an entry having negative ring index
    const config = createMinimalConfig({
      entries: [
        { label: 'Test Tech', quadrant: 0, ring: -1, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is initialized
    // THEN: it should throw an error about invalid ring index
    expect(() => radar_visualization(config)).toThrow(/Entry 'Test Tech' has invalid ring/);
  });

  test('should accept valid entries', () => {
    // GIVEN: a configuration with valid entries having correct quadrant and ring indices
    const config = createMinimalConfig({
      entries: [
        { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'TypeScript', quadrant: 0, ring: 1, moved: 1, active: true },
        { label: 'Python', quadrant: 1, ring: 2, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is initialized
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });
});

describe('Entry Positioning and Layout', () => {
  test('should assign sequential IDs to entries', () => {
    // GIVEN: three entries in the configuration
    const entries = [
      { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'TypeScript', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'Python', quadrant: 1, ring: 1, moved: 0, active: true }
    ];
    const config = createMinimalConfig({ entries });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: all entries should have IDs assigned
    const ids = entries.map(e => e.id).filter(Boolean);
    expect(ids.length).toBe(3);

    // THEN: IDs should be unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);

    // THEN: IDs should be strings of positive numbers
    ids.forEach(id => {
      expect(typeof id).toBe('string');
      expect(parseInt(id)).toBeGreaterThan(0);
    });
  });

  test('should assign x,y coordinates to all entries', () => {
    // GIVEN: three entries in different quadrants and rings
    const entries = [
      { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'TypeScript', quadrant: 1, ring: 1, moved: 0, active: true },
      { label: 'Python', quadrant: 2, ring: 2, moved: 0, active: true }
    ];
    const config = createMinimalConfig({ entries });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: all entries should have valid numeric x,y coordinates
    entries.forEach(entry => {
      expect(typeof entry.x).toBe('number');
      expect(typeof entry.y).toBe('number');
      expect(isFinite(entry.x)).toBe(true);
      expect(isFinite(entry.y)).toBe(true);
    });
  });
});

describe('SVG Generation', () => {
  test('should create SVG elements in the DOM', () => {
    // GIVEN: a configuration with an entry
    const config = createMinimalConfig({
      entries: [
        { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: the SVG element should exist in the DOM
    const svg = document.querySelector('svg#radar');
    expect(svg).toBeTruthy();

    // THEN: SVG should contain group elements
    const groups = svg.querySelectorAll('g');
    expect(groups.length).toBeGreaterThan(0);
  });
});

describe('Basic Functionality', () => {
  test('should handle empty entries array', () => {
    // GIVEN: a configuration with no entries
    const config = createMinimalConfig({
      entries: []
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle custom dimensions', () => {
    // GIVEN: a configuration with custom dimensions
    const config = createMinimalConfig({
      width: 800,
      height: 600,
      entries: []
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: the SVG should have the specified width and height
    const svg = document.querySelector('svg#radar');
    expect(svg.getAttribute('width')).toBe('800');
    expect(svg.getAttribute('height')).toBe('600');
  });
});