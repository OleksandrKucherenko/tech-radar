/**
 * Unit tests for radar.js using Vitest
 * Tests critical functionality to ensure the radar visualization works correctly
 * and to prevent regressions.
 *
 * Tests follow GIVEN/WHEN/THEN pattern for clarity and maintainability.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import radar_visualization from '../../docs/radar.js';

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

beforeEach(() => {
  // Reset DOM before each test
  if (typeof resetDOM === 'function') {
    resetDOM();
  } else {
    document.body.innerHTML = '<svg id="radar"></svg>';
  }
});

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

  test('should assign color property to entries based on ring', () => {
    // GIVEN: entries in different rings with different colors
    const entries = [
      { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'TypeScript', quadrant: 0, ring: 1, moved: 0, active: true },
      { label: 'Python', quadrant: 0, ring: 2, moved: 0, active: true }
    ];
    const config = createMinimalConfig({ entries });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: each entry should have the color from its corresponding ring
    expect(entries[0].color).toBe('#5ba300'); // ADOPT ring color
    expect(entries[1].color).toBe('#009eb0'); // TRIAL ring color
    expect(entries[2].color).toBe('#c7ba00'); // ASSESS ring color
  });

  test('should sort entries alphabetically by label within each ring', () => {
    // GIVEN: entries with unsorted labels in the same quadrant and ring
    const entries = [
      { label: 'Zebra', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'Apple', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'Mango', quadrant: 0, ring: 0, moved: 0, active: true }
    ];
    const config = createMinimalConfig({ entries });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: entries should be sorted alphabetically by label
    // (IDs are assigned after sorting, so we check ID order)
    const sortedLabels = entries.map(e => e.label).sort();
    const entryLabelsById = entries.sort((a, b) => parseInt(a.id) - parseInt(b.id)).map(e => e.label);
    expect(entryLabelsById).toEqual(sortedLabels);
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

  test('should set correct SVG dimensions from config', () => {
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

  test('should create grid with quadrant lines', () => {
    // GIVEN: a standard 4-quadrant configuration
    const config = createMinimalConfig({
      entries: []
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: the SVG should contain grid lines for quadrant divisions
    const svg = document.querySelector('#radar');
    const lines = svg.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });

  test('should create blips for each entry', () => {
    // GIVEN: a configuration with multiple entries
    const entries = [
      { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'TypeScript', quadrant: 1, ring: 1, moved: 1, active: true },
      { label: 'Python', quadrant: 2, ring: 2, moved: 0, active: true }
    ];
    const config = createMinimalConfig({ entries });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: the SVG should contain blip elements
    const blips = document.querySelectorAll('.blip');
    expect(blips.length).toBe(3);
  });
});

describe('Movement Indicators', () => {
  test('should render circle for entries with moved=0 (no change)', () => {
    // GIVEN: an entry with moved=0 indicating no change
    const entries = [
      { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true }
    ];
    const config = createMinimalConfig({ entries });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: the blip should contain a circle
    const blip = document.querySelector('.blip');
    const circle = blip.querySelector('circle');
    expect(circle).toBeTruthy();
  });

  test('should render triangle pointing up for entries with moved=1', () => {
    // GIVEN: an entry with moved=1 indicating moved inward
    const entries = [
      { label: 'JavaScript', quadrant: 0, ring: 0, moved: 1, active: true }
    ];
    const config = createMinimalConfig({ entries });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: the blip should contain a path (triangle)
    const blip = document.querySelector('.blip');
    const path = blip.querySelector('path');
    expect(path).toBeTruthy();
    expect(path.getAttribute('d')).toContain('M -11,5 11,5 0,-13 z');
  });

  test('should render triangle pointing down for entries with moved=-1', () => {
    // GIVEN: an entry with moved=-1 indicating moved outward
    const entries = [
      { label: 'JavaScript', quadrant: 0, ring: 0, moved: -1, active: true }
    ];
    const config = createMinimalConfig({ entries });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: the blip should contain a path (triangle pointing down)
    const blip = document.querySelector('.blip');
    const path = blip.querySelector('path');
    expect(path).toBeTruthy();
    expect(path.getAttribute('d')).toContain('M -11,-5 11,-5 0,13 z');
  });

  test('should render star for entries with moved=2 (new)', () => {
    // GIVEN: an entry with moved=2 indicating new entry
    const entries = [
      { label: 'JavaScript', quadrant: 0, ring: 0, moved: 2, active: true }
    ];
    const config = createMinimalConfig({ entries });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: the blip should contain a path (star shape)
    const blip = document.querySelector('.blip');
    const path = blip.querySelector('path');
    expect(path).toBeTruthy();
    // Star shape is generated by d3.symbol().type(d3.symbolStar)
    expect(path.getAttribute('d')).toBeTruthy();
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

  test('should apply default values for missing config properties', () => {
    // GIVEN: a minimal configuration without optional properties
    const config = {
      quadrants: [
        { name: 'Q1' },
        { name: 'Q2' }
      ],
      rings: [
        { name: 'R1', color: '#000' },
        { name: 'R2', color: '#111' },
        { name: 'R3', color: '#222' },
        { name: 'R4', color: '#333' }
      ],
      entries: []
    };

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: it should apply default width and height
    const svg = document.querySelector('svg#radar');
    expect(svg.getAttribute('width')).toBe('1450'); // default width
    expect(svg.getAttribute('height')).toBe('1000'); // default height
  });

  test('should handle entries with special characters in labels', () => {
    // GIVEN: entries with special characters in labels
    const entries = [
      { label: 'C++', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'F#', quadrant: 0, ring: 1, moved: 0, active: true },
      { label: 'Node.js', quadrant: 1, ring: 0, moved: 0, active: true }
    ];
    const config = createMinimalConfig({ entries });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();

    // THEN: entries should be processed and have IDs assigned
    entries.forEach(entry => {
      expect(entry.id).toBeTruthy();
    });
  });
});

describe('Reproducible Positioning', () => {
  test('should generate identical coordinates across multiple runs', () => {
    // GIVEN: a configuration with multiple entries
    const entries1 = [
      { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'TypeScript', quadrant: 0, ring: 1, moved: 0, active: true },
      { label: 'Python', quadrant: 1, ring: 0, moved: 0, active: true }
    ];
    const config1 = createMinimalConfig({ entries: entries1 });

    // WHEN: the radar visualization is created first time
    radar_visualization(config1);
    const coords1 = entries1.map(e => ({ label: e.label, x: e.x, y: e.y }));

    // Reset DOM
    resetDOM();

    // GIVEN: same configuration for second run
    const entries2 = [
      { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'TypeScript', quadrant: 0, ring: 1, moved: 0, active: true },
      { label: 'Python', quadrant: 1, ring: 0, moved: 0, active: true }
    ];
    const config2 = createMinimalConfig({ entries: entries2 });

    // WHEN: the radar visualization is created second time
    radar_visualization(config2);
    const coords2 = entries2.map(e => ({ label: e.label, x: e.x, y: e.y }));

    // THEN: coordinates should be identical across both runs
    expect(coords1).toEqual(coords2);
  });
});

describe('Variable Quadrant Configurations', () => {
  test('should correctly render 2 quadrants', () => {
    // GIVEN: a configuration with 2 quadrants
    const config = createMinimalConfig({
      quadrants: [
        { name: 'Frontend' },
        { name: 'Backend' }
      ],
      entries: [
        { label: 'React', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Node.js', quadrant: 1, ring: 0, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: it should create blips for both quadrants
    const blips = document.querySelectorAll('.blip');
    expect(blips.length).toBe(2);
  });

  test('should correctly render 6 quadrants', () => {
    // GIVEN: a configuration with 6 quadrants
    const config = createMinimalConfig({
      quadrants: Array(6).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: Array(6).fill(null).map((_, i) => ({
        label: `Tech${i}`,
        quadrant: i,
        ring: 0,
        moved: 0,
        active: true
      }))
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: it should create blips for all quadrants
    const blips = document.querySelectorAll('.blip');
    expect(blips.length).toBe(6);
  });
});

describe('Variable Ring Configurations', () => {
  test('should correctly render 5 rings', () => {
    // GIVEN: a configuration with 5 rings
    const config = createMinimalConfig({
      rings: Array(5).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: Array(5).fill(null).map((_, i) => ({
        label: `Tech${i}`,
        quadrant: 0,
        ring: i,
        moved: 0,
        active: true
      }))
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: all entries should be positioned in their respective rings
    const blips = document.querySelectorAll('.blip');
    expect(blips.length).toBe(5);
  });

  test('should correctly render 8 rings', () => {
    // GIVEN: a configuration with 8 rings (maximum)
    const config = createMinimalConfig({
      rings: Array(8).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: Array(8).fill(null).map((_, i) => ({
        label: `Tech${i}`,
        quadrant: 0,
        ring: i,
        moved: 0,
        active: true
      }))
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: all entries should be positioned in their respective rings
    const blips = document.querySelectorAll('.blip');
    expect(blips.length).toBe(8);
  });
});
