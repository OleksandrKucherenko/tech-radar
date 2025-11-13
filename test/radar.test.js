/**
 * Unit tests for radar.js
 * Tests critical functionality to ensure the radar visualization works correctly
 * and to prevent regressions.
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
    const config = createMinimalConfig({
      quadrants: [{ name: 'Only One' }]
    });

    expect(() => radar_visualization(config)).toThrow(/Number of quadrants must be between 2 and 8/);
  });

  test('should throw error for more than 8 quadrants', () => {
    const config = createMinimalConfig({
      quadrants: Array(9).fill(null).map((_, i) => ({ name: `Q${i}` }))
    });

    expect(() => radar_visualization(config)).toThrow(/Number of quadrants must be between 2 and 8/);
  });

  test('should throw error for less than 4 rings', () => {
    const config = createMinimalConfig({
      rings: [
        { name: 'ADOPT', color: '#5ba300' },
        { name: 'TRIAL', color: '#009eb0' },
        { name: 'ASSESS', color: '#c7ba00' }
      ]
    });

    expect(() => radar_visualization(config)).toThrow(/Number of rings must be between 4 and 8/);
  });

  test('should throw error for more than 8 rings', () => {
    const config = createMinimalConfig({
      rings: Array(9).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' }))
    });

    expect(() => radar_visualization(config)).toThrow(/Number of rings must be between 4 and 8/);
  });

  test('should accept 2 quadrants (minimum)', () => {
    const config = createMinimalConfig({
      quadrants: [
        { name: 'Frontend' },
        { name: 'Backend' }
      ],
      entries: []
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should accept 8 quadrants (maximum)', () => {
    const config = createMinimalConfig({
      quadrants: Array(8).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: []
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should accept 4 rings (minimum)', () => {
    const config = createMinimalConfig({
      rings: Array(4).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: []
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should accept 8 rings (maximum)', () => {
    const config = createMinimalConfig({
      rings: Array(8).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: []
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });
});

describe('Entry Validation', () => {
  test('should throw error for entry with invalid quadrant index', () => {
    const config = createMinimalConfig({
      entries: [
        { label: 'Test Tech', quadrant: 5, ring: 0, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).toThrow(/Entry 'Test Tech' has invalid quadrant/);
  });

  test('should throw error for entry with negative quadrant index', () => {
    const config = createMinimalConfig({
      entries: [
        { label: 'Test Tech', quadrant: -1, ring: 0, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).toThrow(/Entry 'Test Tech' has invalid quadrant/);
  });

  test('should throw error for entry with invalid ring index', () => {
    const config = createMinimalConfig({
      entries: [
        { label: 'Test Tech', quadrant: 0, ring: 5, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).toThrow(/Entry 'Test Tech' has invalid ring/);
  });

  test('should throw error for entry with negative ring index', () => {
    const config = createMinimalConfig({
      entries: [
        { label: 'Test Tech', quadrant: 0, ring: -1, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).toThrow(/Entry 'Test Tech' has invalid ring/);
  });

  test('should accept valid entries', () => {
    const config = createMinimalConfig({
      entries: [
        { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'TypeScript', quadrant: 0, ring: 1, moved: 1, active: true },
        { label: 'Python', quadrant: 1, ring: 2, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });
});

describe('Entry Positioning and Layout', () => {
  test('should assign sequential IDs to entries', () => {
    const entries = [
      { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'TypeScript', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'Python', quadrant: 1, ring: 1, moved: 0, active: true }
    ];

    const config = createMinimalConfig({ entries });
    radar_visualization(config);

    // After visualization, entries should have IDs assigned
    const ids = entries.map(e => e.id).filter(Boolean);
    expect(ids.length).toBe(3);

    // IDs should be unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);

    // IDs should be strings of numbers
    ids.forEach(id => {
      expect(typeof id).toBe('string');
      expect(parseInt(id)).toBeGreaterThan(0);
    });
  });

  test('should sort entries alphabetically within the same quadrant and ring', () => {
    const entries = [
      { label: 'Zebra', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'Apple', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'Mango', quadrant: 0, ring: 0, moved: 0, active: true }
    ];

    const config = createMinimalConfig({ entries });
    radar_visualization(config);

    // Entries should be sorted: Apple (1), Mango (2), Zebra (3)
    const appleId = parseInt(entries.find(e => e.label === 'Apple').id);
    const mangoId = parseInt(entries.find(e => e.label === 'Mango').id);
    const zebraId = parseInt(entries.find(e => e.label === 'Zebra').id);

    expect(appleId).toBeLessThan(mangoId);
    expect(mangoId).toBeLessThan(zebraId);
  });

  test('should assign x,y coordinates to all entries', () => {
    const entries = [
      { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'TypeScript', quadrant: 1, ring: 1, moved: 0, active: true },
      { label: 'Python', quadrant: 2, ring: 2, moved: 0, active: true }
    ];

    const config = createMinimalConfig({ entries });
    radar_visualization(config);

    entries.forEach(entry => {
      expect(typeof entry.x).toBe('number');
      expect(typeof entry.y).toBe('number');
      expect(isFinite(entry.x)).toBe(true);
      expect(isFinite(entry.y)).toBe(true);
    });
  });

  test('should assign color to entries based on ring and active status', () => {
    const entries = [
      { label: 'Active Tech', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'Inactive Tech', quadrant: 0, ring: 1, moved: 0, active: false }
    ];

    const config = createMinimalConfig({
      entries,
      print_layout: false  // With print_layout: false, inactive items get special color
    });
    radar_visualization(config);

    const activeEntry = entries.find(e => e.label === 'Active Tech');
    const inactiveEntry = entries.find(e => e.label === 'Inactive Tech');

    expect(activeEntry.color).toBe('#5ba300'); // ADOPT ring color
    expect(inactiveEntry.color).toBe('#ddd'); // inactive color
  });

  test('should use print_layout colors for all entries when print_layout is true', () => {
    const entries = [
      { label: 'Inactive Tech', quadrant: 0, ring: 1, moved: 0, active: false }
    ];

    const config = createMinimalConfig({
      entries,
      print_layout: true
    });
    radar_visualization(config);

    const entry = entries[0];
    expect(entry.color).toBe('#009eb0'); // TRIAL ring color (not inactive gray)
  });
});

describe('Reproducible Positioning', () => {
  test('should produce identical positions for the same configuration', () => {
    // Reset DOM for each test
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

    const firstRun = setupRadar();
    const firstPositions = firstRun.map(e => ({ label: e.label, x: e.x, y: e.y }));

    const secondRun = setupRadar();
    const secondPositions = secondRun.map(e => ({ label: e.label, x: e.x, y: e.y }));

    expect(firstPositions).toEqual(secondPositions);
  });
});

describe('Variable Quadrant Configurations', () => {
  test('should handle 2 quadrants configuration', () => {
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

    expect(() => radar_visualization(config)).not.toThrow();

    // Verify entries got positioned
    config.entries.forEach(entry => {
      expect(typeof entry.x).toBe('number');
      expect(typeof entry.y).toBe('number');
    });
  });

  test('should handle 3 quadrants configuration', () => {
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

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle 5 quadrants configuration', () => {
    const config = createMinimalConfig({
      quadrants: Array(5).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 2, ring: 1, moved: 0, active: true },
        { label: 'Tech3', quadrant: 4, ring: 2, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle 6 quadrants configuration', () => {
    const config = createMinimalConfig({
      quadrants: Array(6).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 3, ring: 1, moved: 0, active: true },
        { label: 'Tech3', quadrant: 5, ring: 2, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle 7 quadrants configuration', () => {
    const config = createMinimalConfig({
      quadrants: Array(7).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 3, ring: 1, moved: 0, active: true },
        { label: 'Tech3', quadrant: 6, ring: 2, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });
});

describe('Variable Ring Configurations', () => {
  test('should handle 5 rings configuration', () => {
    const config = createMinimalConfig({
      rings: Array(5).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 1, ring: 2, moved: 0, active: true },
        { label: 'Tech3', quadrant: 2, ring: 4, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle 6 rings configuration', () => {
    const config = createMinimalConfig({
      rings: Array(6).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 1, ring: 3, moved: 0, active: true },
        { label: 'Tech3', quadrant: 2, ring: 5, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle 7 rings configuration', () => {
    const config = createMinimalConfig({
      rings: Array(7).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 1, ring: 3, moved: 0, active: true },
        { label: 'Tech3', quadrant: 2, ring: 6, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });
});

describe('Blip Movement Indicators', () => {
  test('should support moved=0 (no change)', () => {
    const config = createMinimalConfig({
      entries: [
        { label: 'Stable Tech', quadrant: 0, ring: 0, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should support moved=1 (moved up)', () => {
    const config = createMinimalConfig({
      entries: [
        { label: 'Rising Tech', quadrant: 0, ring: 0, moved: 1, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should support moved=-1 (moved down)', () => {
    const config = createMinimalConfig({
      entries: [
        { label: 'Declining Tech', quadrant: 0, ring: 0, moved: -1, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should support moved=2 (new)', () => {
    const config = createMinimalConfig({
      entries: [
        { label: 'New Tech', quadrant: 0, ring: 0, moved: 2, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });
});

describe('Complex Configurations', () => {
  test('should handle 8 quadrants × 8 rings (maximum)', () => {
    const config = createMinimalConfig({
      quadrants: Array(8).fill(null).map((_, i) => ({ name: `Q${i}` })),
      rings: Array(8).fill(null).map((_, i) => ({ name: `Ring${i}`, color: `#${i}${i}${i}` })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 3, ring: 4, moved: 0, active: true },
        { label: 'Tech3', quadrant: 7, ring: 7, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle 2 quadrants × 4 rings (minimum quadrants)', () => {
    const config = createMinimalConfig({
      quadrants: [{ name: 'Q1' }, { name: 'Q2' }],
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 1, ring: 3, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle many entries in the same quadrant/ring', () => {
    const entries = Array(20).fill(null).map((_, i) => ({
      label: `Tech${i}`,
      quadrant: 0,
      ring: 0,
      moved: 0,
      active: true
    }));

    const config = createMinimalConfig({ entries });

    expect(() => radar_visualization(config)).not.toThrow();

    // All entries should get positioned
    entries.forEach(entry => {
      expect(typeof entry.x).toBe('number');
      expect(typeof entry.y).toBe('number');
      expect(entry.id).toBeDefined();
    });
  });

  test('should handle entries distributed across all quadrants and rings', () => {
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

    expect(() => radar_visualization(config)).not.toThrow();

    // Verify all entries got positioned
    expect(entries.every(e => typeof e.x === 'number' && typeof e.y === 'number')).toBe(true);

    // Verify all entries got unique IDs
    const ids = entries.map(e => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(entries.length);
  });
});

describe('SVG Generation', () => {
  test('should create SVG elements in the DOM', () => {
    document.body.innerHTML = '<svg id="radar"></svg>';

    const config = createMinimalConfig({
      entries: [
        { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true }
      ]
    });

    radar_visualization(config);

    const svg = document.querySelector('svg#radar');
    expect(svg).toBeTruthy();

    // Should have created groups
    const groups = svg.querySelectorAll('g');
    expect(groups.length).toBeGreaterThan(0);
  });

  test('should create grid lines for quadrants', () => {
    document.body.innerHTML = '<svg id="radar"></svg>';

    const config = createMinimalConfig({
      quadrants: Array(6).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: []
    });

    radar_visualization(config);

    const lines = document.querySelectorAll('svg#radar line');
    // Should have N radial lines for N quadrants
    expect(lines.length).toBeGreaterThanOrEqual(6);
  });

  test('should create circles for rings', () => {
    document.body.innerHTML = '<svg id="radar"></svg>';

    const config = createMinimalConfig({
      rings: Array(5).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: []
    });

    radar_visualization(config);

    const circles = document.querySelectorAll('svg#radar circle');
    // Should have at least N circles for N rings
    expect(circles.length).toBeGreaterThanOrEqual(5);
  });
});

describe('Configuration Options', () => {
  test('should respect custom width and height', () => {
    document.body.innerHTML = '<svg id="radar"></svg>';

    const config = createMinimalConfig({
      width: 800,
      height: 600,
      entries: []
    });

    radar_visualization(config);

    const svg = document.querySelector('svg#radar');
    expect(svg.getAttribute('width')).toBe('800');
    expect(svg.getAttribute('height')).toBe('600');
  });

  test('should respect custom colors', () => {
    document.body.innerHTML = '<svg id="radar"></svg>';

    const config = createMinimalConfig({
      colors: {
        background: '#f0f0f0',
        grid: '#cccccc',
        inactive: '#aaaaaa'
      },
      entries: []
    });

    radar_visualization(config);

    const svg = document.querySelector('svg#radar');
    expect(svg.style.backgroundColor).toBe('rgb(240, 240, 240)'); // #f0f0f0
  });

  test('should handle print_layout option', () => {
    document.body.innerHTML = '<svg id="radar"></svg>';

    const config = createMinimalConfig({
      print_layout: true,
      title: 'Test Radar',
      date: '2024-01',
      entries: []
    });

    expect(() => radar_visualization(config)).not.toThrow();

    // In print layout, title should be rendered
    const titleText = document.querySelector('svg#radar text');
    expect(titleText).toBeTruthy();
  });

  test('should handle scale option', () => {
    document.body.innerHTML = '<svg id="radar"></svg>';

    const config = createMinimalConfig({
      width: 1000,
      height: 800,
      scale: 0.5,
      entries: []
    });

    radar_visualization(config);

    const svg = document.querySelector('svg#radar');
    expect(svg.getAttribute('width')).toBe('500'); // 1000 * 0.5
    expect(svg.getAttribute('height')).toBe('400'); // 800 * 0.5
  });
});

describe('Edge Cases', () => {
  test('should handle empty entries array', () => {
    const config = createMinimalConfig({
      entries: []
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle entries with links', () => {
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

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle entries without links', () => {
    const config = createMinimalConfig({
      entries: [
        { label: 'JavaScript', quadrant: 0, ring: 0, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle very long entry labels', () => {
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

    expect(() => radar_visualization(config)).not.toThrow();
  });

  test('should handle special characters in entry labels', () => {
    const config = createMinimalConfig({
      entries: [
        { label: 'C++', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'F#', quadrant: 0, ring: 1, moved: 0, active: true },
        { label: 'Node.js', quadrant: 1, ring: 0, moved: 0, active: true },
        { label: 'Vue.js 3.0', quadrant: 1, ring: 1, moved: 0, active: true }
      ]
    });

    expect(() => radar_visualization(config)).not.toThrow();

    // All entries should get IDs
    config.entries.forEach(entry => {
      expect(entry.id).toBeDefined();
    });
  });
});
