/**
 * Unit tests for radar.js
 * Tests critical functionality to ensure the radar visualization works correctly
 * and to prevent regressions.
 *
 * Tests follow GIVEN/WHEN/THEN pattern for clarity and maintainability.
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import * as d3Module from 'd3';

// Setup DOM environment for D3
let dom, document, window, d3;
let radar_visualization; // Will be assigned after eval

beforeAll(() => {
  // Create a JSDOM instance
  dom = new JSDOM('<!DOCTYPE html><html><body><svg id="radar"></svg></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  });

  document = dom.window.document;
  window = dom.window;

  // Make DOM globals available
  global.document = document;
  global.window = window;
  global.navigator = window.navigator;

  // Setup D3 with the JSDOM window
  d3 = d3Module;
  global.d3 = d3;

  // Load radar.js by evaluating it in our context
  const fs = require('fs');
  const path = require('path');
  const radarCode = fs.readFileSync(path.join(__dirname, '../docs/radar.js'), 'utf-8');

  // Eval in global scope to make radar_visualization available
  (0, eval)(radarCode);

  // Retrieve the function from global scope
  radar_visualization = globalThis.radar_visualization;
});

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

  test('should sort entries alphabetically within the same quadrant and ring', () => {
    // GIVEN: three entries in the same quadrant and ring with unsorted labels
    const entries = [
      { label: 'Zebra', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'Apple', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'Mango', quadrant: 0, ring: 0, moved: 0, active: true }
    ];
    const config = createMinimalConfig({ entries });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: entries should be sorted alphabetically: Apple, Mango, Zebra
    const appleId = parseInt(entries.find(e => e.label === 'Apple').id);
    const mangoId = parseInt(entries.find(e => e.label === 'Mango').id);
    const zebraId = parseInt(entries.find(e => e.label === 'Zebra').id);

    expect(appleId).toBeLessThan(mangoId);
    expect(mangoId).toBeLessThan(zebraId);
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

  test('should assign color to entries based on ring and active status', () => {
    // GIVEN: two entries, one active and one inactive, with print_layout disabled
    const entries = [
      { label: 'Active Tech', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'Inactive Tech', quadrant: 0, ring: 1, moved: 0, active: false }
    ];
    const config = createMinimalConfig({
      entries,
      print_layout: false
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: active entry should have the ring color
    const activeEntry = entries.find(e => e.label === 'Active Tech');
    expect(activeEntry.color).toBe('#5ba300'); // ADOPT ring color

    // THEN: inactive entry should have the inactive color
    const inactiveEntry = entries.find(e => e.label === 'Inactive Tech');
    expect(inactiveEntry.color).toBe('#ddd');
  });

  test('should use print_layout colors for all entries when print_layout is true', () => {
    // GIVEN: an inactive entry with print_layout enabled
    const entries = [
      { label: 'Inactive Tech', quadrant: 0, ring: 1, moved: 0, active: false }
    ];
    const config = createMinimalConfig({
      entries,
      print_layout: true
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: the entry should use the ring color, not the inactive color
    const entry = entries[0];
    expect(entry.color).toBe('#009eb0'); // TRIAL ring color
  });
});

describe('Reproducible Positioning', () => {
  test('should produce identical positions for the same configuration', () => {
    // GIVEN: a helper function that creates a fresh radar with the same configuration
    const setupRadar = () => {
      document.body.innerHTML = '<svg id="radar"></svg>';
      const entries = [
        { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'TypeScript', quadrant: 0, ring: 1, moved: 0, active: true },
        { label: 'Python', quadrant: 1, ring: 2, moved: 0, active: true }
      ];
      const config = createMinimalConfig({ entries });
      radar_visualization(config);
      return entries;
    };

    // WHEN: the radar is created twice with identical configuration
    const firstRun = setupRadar();
    const firstPositions = firstRun.map(e => ({ label: e.label, x: e.x, y: e.y }));

    const secondRun = setupRadar();
    const secondPositions = secondRun.map(e => ({ label: e.label, x: e.x, y: e.y }));

    // THEN: both runs should produce identical positions
    expect(firstPositions).toEqual(secondPositions);
  });
});

describe('Variable Quadrant Configurations', () => {
  test('should handle 2 quadrants configuration', () => {
    // GIVEN: a configuration with 2 quadrants and 2 entries
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
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();

    // THEN: all entries should have valid numeric positions
    config.entries.forEach(entry => {
      expect(typeof entry.x).toBe('number');
      expect(typeof entry.y).toBe('number');
    });
  });

  test('should handle 3 quadrants configuration', () => {
    // GIVEN: a configuration with 3 quadrants and 3 entries
    const config = createMinimalConfig({
      quadrants: [
        { name: 'Q1' },
        { name: 'Q2' },
        { name: 'Q3' }
      ],
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 1, ring: 1, moved: 0, active: true },
        { label: 'Tech3', quadrant: 2, ring: 2, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle 5 quadrants configuration', () => {
    // GIVEN: a configuration with 5 quadrants and 3 entries
    const config = createMinimalConfig({
      quadrants: Array(5).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 2, ring: 1, moved: 0, active: true },
        { label: 'Tech3', quadrant: 4, ring: 2, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle 6 quadrants configuration', () => {
    // GIVEN: a configuration with 6 quadrants and 3 entries
    const config = createMinimalConfig({
      quadrants: Array(6).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 3, ring: 1, moved: 0, active: true },
        { label: 'Tech3', quadrant: 5, ring: 2, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle 7 quadrants configuration', () => {
    // GIVEN: a configuration with 7 quadrants and 3 entries
    const config = createMinimalConfig({
      quadrants: Array(7).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 3, ring: 1, moved: 0, active: true },
        { label: 'Tech3', quadrant: 6, ring: 2, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });
});

describe('Variable Ring Configurations', () => {
  test('should handle 5 rings configuration', () => {
    // GIVEN: a configuration with 5 rings and 3 entries
    const config = createMinimalConfig({
      rings: Array(5).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 1, ring: 2, moved: 0, active: true },
        { label: 'Tech3', quadrant: 2, ring: 4, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle 6 rings configuration', () => {
    // GIVEN: a configuration with 6 rings and 3 entries
    const config = createMinimalConfig({
      rings: Array(6).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 1, ring: 3, moved: 0, active: true },
        { label: 'Tech3', quadrant: 2, ring: 5, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle 7 rings configuration', () => {
    // GIVEN: a configuration with 7 rings and 3 entries
    const config = createMinimalConfig({
      rings: Array(7).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 1, ring: 3, moved: 0, active: true },
        { label: 'Tech3', quadrant: 2, ring: 6, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });
});

describe('Blip Movement Indicators', () => {
  test('should support moved=0 (no change)', () => {
    // GIVEN: an entry with moved=0 indicating no change in position
    const config = createMinimalConfig({
      entries: [
        { label: 'Stable Tech', quadrant: 0, ring: 0, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should support moved=1 (moved up)', () => {
    // GIVEN: an entry with moved=1 indicating it moved up/in
    const config = createMinimalConfig({
      entries: [
        { label: 'Rising Tech', quadrant: 0, ring: 0, moved: 1, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should support moved=-1 (moved down)', () => {
    // GIVEN: an entry with moved=-1 indicating it moved down/out
    const config = createMinimalConfig({
      entries: [
        { label: 'Declining Tech', quadrant: 0, ring: 0, moved: -1, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should support moved=2 (new)', () => {
    // GIVEN: an entry with moved=2 indicating it is new to the radar
    const config = createMinimalConfig({
      entries: [
        { label: 'New Tech', quadrant: 0, ring: 0, moved: 2, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });
});

describe('Complex Configurations', () => {
  test('should handle 8 quadrants × 8 rings (maximum)', () => {
    // GIVEN: maximum complexity configuration with 8 quadrants and 8 rings
    const config = createMinimalConfig({
      quadrants: Array(8).fill(null).map((_, i) => ({ name: `Q${i}` })),
      rings: Array(8).fill(null).map((_, i) => ({ name: `Ring${i}`, color: `#${i}${i}${i}` })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 3, ring: 4, moved: 0, active: true },
        { label: 'Tech3', quadrant: 7, ring: 7, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle 2 quadrants × 4 rings (minimum quadrants)', () => {
    // GIVEN: minimum quadrants configuration with 2 quadrants and 4 rings
    const config = createMinimalConfig({
      quadrants: [{ name: 'Q1' }, { name: 'Q2' }],
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 1, ring: 3, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle many entries in the same quadrant/ring', () => {
    // GIVEN: 20 entries all positioned in the same quadrant and ring
    const entries = Array(20).fill(null).map((_, i) => ({
      label: `Tech${i}`,
      quadrant: 0,
      ring: 0,
      moved: 0,
      active: true
    }));
    const config = createMinimalConfig({ entries });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();

    // THEN: all entries should have valid positions
    entries.forEach(entry => {
      expect(typeof entry.x).toBe('number');
      expect(typeof entry.y).toBe('number');
      expect(entry.id).toBeDefined();
    });
  });

  test('should handle entries distributed across all quadrants and rings', () => {
    // GIVEN: entries distributed across all 4 quadrants and 4 rings (16 entries total)
    const entries = [];
    for (let q = 0; q < 4; q++) {
      for (let r = 0; r < 4; r++) {
        entries.push({
          label: `Tech-Q${q}-R${r}`,
          quadrant: q,
          ring: r,
          moved: 0,
          active: true
        });
      }
    }
    const config = createMinimalConfig({ entries });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();

    // THEN: all entries should have valid numeric positions
    expect(entries.every(e => typeof e.x === 'number' && typeof e.y === 'number')).toBe(true);

    // THEN: all entries should have unique IDs
    const ids = entries.map(e => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(entries.length);
  });
});

describe('SVG Generation', () => {
  test('should create SVG elements in the DOM', () => {
    // GIVEN: a fresh DOM with an empty SVG element
    document.body.innerHTML = '<svg id="radar"></svg>';
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

  test('should create grid lines for quadrants', () => {
    // GIVEN: a fresh DOM and a configuration with 6 quadrants
    document.body.innerHTML = '<svg id="radar"></svg>';
    const config = createMinimalConfig({
      quadrants: Array(6).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: []
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: SVG should contain at least N radial lines for N quadrants
    const lines = document.querySelectorAll('svg#radar line');
    expect(lines.length).toBeGreaterThanOrEqual(6);
  });

  test('should create circles for rings', () => {
    // GIVEN: a fresh DOM and a configuration with 5 rings
    document.body.innerHTML = '<svg id="radar"></svg>';
    const config = createMinimalConfig({
      rings: Array(5).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: []
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: SVG should contain at least N circles for N rings
    const circles = document.querySelectorAll('svg#radar circle');
    expect(circles.length).toBeGreaterThanOrEqual(5);
  });
});

describe('Configuration Options', () => {
  test('should respect custom width and height', () => {
    // GIVEN: a fresh DOM and a configuration with custom dimensions
    document.body.innerHTML = '<svg id="radar"></svg>';
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

  test('should respect custom colors', () => {
    // GIVEN: a fresh DOM and a configuration with custom colors
    document.body.innerHTML = '<svg id="radar"></svg>';
    const config = createMinimalConfig({
      colors: {
        background: '#f0f0f0',
        grid: '#cccccc',
        inactive: '#aaaaaa'
      },
      entries: []
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: the SVG should use the specified background color
    const svg = document.querySelector('svg#radar');
    expect(svg.style.backgroundColor).toBe('rgb(240, 240, 240)');
  });

  test('should handle print_layout option', () => {
    // GIVEN: a fresh DOM and a configuration with print_layout enabled
    document.body.innerHTML = '<svg id="radar"></svg>';
    const config = createMinimalConfig({
      print_layout: true,
      title: 'Test Radar',
      date: '2024-01',
      entries: []
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();

    // THEN: the title should be rendered in the SVG
    const titleText = document.querySelector('svg#radar text');
    expect(titleText).toBeTruthy();
  });

  test('should handle scale option', () => {
    // GIVEN: a fresh DOM and a configuration with custom scale factor
    document.body.innerHTML = '<svg id="radar"></svg>';
    const config = createMinimalConfig({
      width: 1000,
      height: 800,
      scale: 0.5,
      entries: []
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: the SVG dimensions should be scaled by the scale factor
    const svg = document.querySelector('svg#radar');
    expect(svg.getAttribute('width')).toBe('500'); // 1000 * 0.5
    expect(svg.getAttribute('height')).toBe('400'); // 800 * 0.5
  });
});

describe('Edge Cases', () => {
  test('should handle empty entries array', () => {
    // GIVEN: a configuration with no entries
    const config = createMinimalConfig({
      entries: []
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle entries with links', () => {
    // GIVEN: a configuration with an entry containing a link URL
    const config = createMinimalConfig({
      entries: [
        {
          label: 'JavaScript',
          quadrant: 0,
          ring: 0,
          moved: 0,
          active: true,
          link: 'https://javascript.info'
        }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle entries without links', () => {
    // GIVEN: a configuration with an entry without a link URL
    const config = createMinimalConfig({
      entries: [
        { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle very long entry labels', () => {
    // GIVEN: a configuration with an entry having a 100-character label
    const config = createMinimalConfig({
      entries: [
        {
          label: 'A'.repeat(100),
          quadrant: 0,
          ring: 0,
          moved: 0,
          active: true
        }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle special characters in entry labels', () => {
    // GIVEN: a configuration with entries containing special characters
    const config = createMinimalConfig({
      entries: [
        { label: 'C++', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'F#', quadrant: 0, ring: 1, moved: 0, active: true },
        { label: 'Node.js', quadrant: 1, ring: 0, moved: 0, active: true },
        { label: 'Vue.js 3.0', quadrant: 1, ring: 1, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw any error
    expect(() => radar_visualization(config)).not.toThrow();

    // THEN: all entries should have IDs assigned
    config.entries.forEach(entry => {
      expect(entry.id).toBeDefined();
    });
  });
});
