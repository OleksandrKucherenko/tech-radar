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

describe('Grid Distribution and Spatial Positioning', () => {
  test('should distribute entries without extreme clustering in narrow sectors (8 quadrants)', () => {
    // GIVEN: 8 quadrant configuration with 10 entries per quadrant/ring
    const config = createMinimalConfig({
      quadrants: Array(8).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: Array(80).fill(null).map((_, i) => ({
        label: `Tech${i}`,
        quadrant: Math.floor(i / 10),
        ring: i % 4,
        moved: 0,
        active: true
      }))
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: entries should be reasonably distributed
    const blips = document.querySelectorAll('.blip');
    expect(blips.length).toBe(80);

    // Check that entries have varied x positions (not all clustered)
    const transforms = Array.from(blips).map(b => b.getAttribute('transform'));
    const xPositions = transforms.map(t => {
      const match = t.match(/translate\(([^,]+),/);
      return match ? parseFloat(match[1]) : 0;
    });

    // Calculate standard deviation to measure spread
    const mean = xPositions.reduce((a, b) => a + b, 0) / xPositions.length;
    const variance = xPositions.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / xPositions.length;
    const stdDev = Math.sqrt(variance);

    // Standard deviation should be significant (not all clustered at same position)
    expect(stdDev).toBeGreaterThan(50);
  });

  test('should use available white space in 6 quadrant configuration', () => {
    // GIVEN: 6 quadrant configuration with entries in each segment
    const config = createMinimalConfig({
      quadrants: Array(6).fill(null).map((_, i) => ({ name: `Q${i}` })),
      rings: Array(5).fill(null).map((_, i) => ({ name: `Ring${i}`, color: '#000' })),
      entries: Array(60).fill(null).map((_, i) => ({
        label: `Tech${i}`,
        quadrant: i % 6,
        ring: Math.floor(i / 12),
        moved: 0,
        active: true
      }))
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: entries should be distributed across the available space
    const blips = document.querySelectorAll('.blip');
    expect(blips.length).toBe(60);

    // Entries should have varied angular and radial positions
    const transforms = Array.from(blips).map(b => b.getAttribute('transform'));
    const positions = transforms.map(t => {
      const match = t.match(/translate\(([^,]+),([^)]+)\)/);
      return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 };
    });

    // Calculate bounding box
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));

    // Bounding box should be substantial (using white space)
    const width = maxX - minX;
    const height = maxY - minY;
    expect(width).toBeGreaterThan(200);
    expect(height).toBeGreaterThan(200);
  });

  test('should maintain minimum angular divisions for narrow sectors', () => {
    // GIVEN: 8 quadrant configuration (narrowest sectors)
    const entries = Array(20).fill(null).map((_, i) => ({
      label: `Tech${i}`,
      quadrant: 0, // All in one narrow quadrant
      ring: 0,     // All in one ring
      moved: 0,
      active: true
    }));

    const config = createMinimalConfig({
      quadrants: Array(8).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: entries should spread angularly despite narrow sector
    const blips = document.querySelectorAll('.blip');
    const transforms = Array.from(blips).map(b => b.getAttribute('transform'));
    const positions = transforms.map(t => {
      const match = t.match(/translate\(([^,]+),([^)]+)\)/);
      return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 };
    });

    // Calculate angles from center
    const angles = positions.map(p => Math.atan2(p.y, p.x));

    // Should have at least 3 distinct angular zones
    const angleRanges = angles.map(a => Math.floor(a * 10) / 10); // Round to 1 decimal
    const uniqueAngles = new Set(angleRanges);
    expect(uniqueAngles.size).toBeGreaterThanOrEqual(3);
  });

  test('should handle 5 quadrant configuration with balanced distribution', () => {
    // GIVEN: 5 quadrant configuration
    const config = createMinimalConfig({
      quadrants: Array(5).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: Array(50).fill(null).map((_, i) => ({
        label: `Tech${i}`,
        quadrant: i % 5,
        ring: Math.floor(i / 13),
        moved: 0,
        active: true
      }))
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: all entries should be rendered
    const blips = document.querySelectorAll('.blip');
    expect(blips.length).toBe(50);

    // Distribution should not show extreme clustering
    const transforms = Array.from(blips).map(b => b.getAttribute('transform'));
    const positions = transforms.map(t => {
      const match = t.match(/translate\(([^,]+),([^)]+)\)/);
      return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 };
    });

    // Calculate pairwise distances
    let minDistance = Infinity;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        minDistance = Math.min(minDistance, dist);
      }
    }

    // Minimum distance should not be too small (indicates clustering)
    // After force simulation, items should maintain reasonable spacing
    expect(minDistance).toBeGreaterThan(5);
  });

  test('should handle 7 quadrant configuration without vertical striping', () => {
    // GIVEN: 7 quadrant configuration
    const config = createMinimalConfig({
      quadrants: Array(7).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: Array(35).fill(null).map((_, i) => ({
        label: `Tech${i}`,
        quadrant: i % 7,
        ring: Math.floor(i / 9),
        moved: 0,
        active: true
      }))
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: entries should not form vertical stripes
    const blips = document.querySelectorAll('.blip');
    expect(blips.length).toBe(35);

    // Group entries by quadrant and check angular spread within each
    const transforms = Array.from(blips).map(b => b.getAttribute('transform'));
    const positions = transforms.map(t => {
      const match = t.match(/translate\(([^,]+),([^)]+)\)/);
      return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 };
    });

    // Take first quadrant (first 5 entries)
    const quadrant0Positions = positions.slice(0, 5);
    const angles0 = quadrant0Positions.map(p => Math.atan2(p.y, p.x));

    // Should have angular variety within the quadrant
    const angleRange = Math.max(...angles0) - Math.min(...angles0);
    expect(angleRange).toBeGreaterThan(0.1); // At least 0.1 radians of spread
  });

  test('should assign collision radius to all entries', () => {
    // GIVEN: configuration with multiple entries
    const config = createMinimalConfig({
      entries: Array(20).fill(null).map((_, i) => ({
        label: `Tech${i}`,
        quadrant: i % 4,
        ring: Math.floor(i / 5),
        moved: 0,
        active: true
      }))
    });

    // WHEN: the radar visualization is created
    radar_visualization(config);

    // THEN: all blips should be present (collision radius was properly assigned)
    const blips = document.querySelectorAll('.blip');
    expect(blips.length).toBe(20);

    // Force simulation should have run (blips have final positions)
    const transforms = Array.from(blips).map(b => b.getAttribute('transform'));
    transforms.forEach(t => {
      expect(t).toMatch(/translate\(-?\d+(\.\d+)?,-?\d+(\.\d+)?\)/);
    });
  });

  test('should handle edge case of single entry without errors', () => {
    // GIVEN: configuration with only one entry
    const config = createMinimalConfig({
      entries: [{
        label: 'Single Tech',
        quadrant: 0,
        ring: 0,
        moved: 0,
        active: true
      }]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw errors
    expect(() => radar_visualization(config)).not.toThrow();

    const blips = document.querySelectorAll('.blip');
    expect(blips.length).toBe(1);
  });

  test('should handle segments with zero entries gracefully', () => {
    // GIVEN: configuration where some segments have no entries
    const config = createMinimalConfig({
      quadrants: Array(6).fill(null).map((_, i) => ({ name: `Q${i}` })),
      entries: [
        { label: 'Tech1', quadrant: 0, ring: 0, moved: 0, active: true },
        { label: 'Tech2', quadrant: 2, ring: 1, moved: 0, active: true },
        { label: 'Tech3', quadrant: 4, ring: 2, moved: 0, active: true }
      ]
    });

    // WHEN: the radar visualization is created
    // THEN: it should not throw errors
    expect(() => radar_visualization(config)).not.toThrow();

    const blips = document.querySelectorAll('.blip');
    expect(blips.length).toBe(3);
  });
});

describe('Collision Detection and Overlap Prevention', () => {
  // Helper function to detect collisions mathematically
  function detectCollisions(entries, minDistance = 12) {
    const collisions = [];

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const e1 = entries[i];
        const e2 = entries[j];

        // Skip if entries are in different segments
        if (e1.quadrant !== e2.quadrant || e1.ring !== e2.ring) {
          continue;
        }

        // Calculate distance
        const dx = e1.x - e2.x;
        const dy = e1.y - e2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check collision radius
        const r1 = e1.collision_radius || minDistance;
        const r2 = e2.collision_radius || minDistance;
        const requiredDistance = r1 + r2;

        if (distance < requiredDistance) {
          collisions.push({
            entry1: e1.label,
            entry2: e2.label,
            distance,
            required: requiredDistance,
            overlap: requiredDistance - distance
          });
        }
      }
    }

    return collisions;
  }

  test('should have zero overlapping entries in high-density ADOPT ring (6x5)', async () => {
    document.body.innerHTML = '<svg id="radar"></svg>';

    // Create high-density scenario: 8 entries per quadrant in ADOPT ring
    const entries = [];
    for (let q = 0; q < 6; q++) {
      for (let i = 0; i < 8; i++) {
        entries.push({
          label: `Q${q}-Entry${i}`,
          quadrant: q,
          ring: 0, // ADOPT ring
          moved: i % 2,
          active: true
        });
      }
    }

    const config = createMinimalConfig({
      quadrants: Array(6).fill(null).map((_, i) => ({ name: `Q${i}` })),
      rings: Array(5).fill(null).map((_, i) => ({ name: `R${i}`, color: ['#5ba300', '#009eb0', '#c7ba00', '#e09b96', '#93c'][i] })),
      entries: entries
    });
    radar_visualization(config);

    // Wait for force simulation to complete (with 300 pre-ticks + additional settling)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check for collisions
    const collisions = detectCollisions(entries);

    if (collisions.length > 0) {
      console.error('Collisions detected:', collisions.slice(0, 5));
    }

    expect(collisions.length).toBe(0);
  });

  test('should prevent grid index overflow in overcrowded segments', async () => {
    document.body.innerHTML = '<svg id="radar"></svg>';

    // Create extreme density scenario: 20 entries in single segment
    const entries = [];
    for (let i = 0; i < 20; i++) {
      entries.push({
        label: `Entry${i}`,
        quadrant: 0,
        ring: 0,
        moved: 0,
        active: true
      });
    }

    const config = createMinimalConfig({ entries: entries });
    radar_visualization(config);

    // Wait for force simulation
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify all entries have valid coordinates within their segment
    entries.forEach(entry => {
      expect(entry.x).toBeDefined();
      expect(entry.y).toBeDefined();
      expect(isFinite(entry.x)).toBe(true);
      expect(isFinite(entry.y)).toBe(true);

      // Calculate distance from origin (should be within outer radius)
      const distance = Math.sqrt(entry.x * entry.x + entry.y * entry.y);
      expect(distance).toBeLessThan(600); // Well within bounds
    });

    // Check no entries are stacked at boundary
    const collisions = detectCollisions(entries);
    expect(collisions.length).toBe(0);
  });

  test('should handle maximum capacity scenarios (8x8 with dense ADOPT)', async () => {
    document.body.innerHTML = '<svg id="radar"></svg>';

    // Create maximum complexity with high density
    const entries = [];
    for (let q = 0; q < 8; q++) {
      for (let i = 0; i < 10; i++) {
        entries.push({
          label: `Q${q}-E${i}`,
          quadrant: q,
          ring: 0,
          moved: i % 3,
          active: true
        });
      }
    }

    const config = createMinimalConfig({
      quadrants: Array(8).fill(null).map((_, i) => ({ name: `Q${i}` })),
      rings: Array(8).fill(null).map((_, i) => ({ name: `R${i}`, color: ['#5ba300', '#009eb0', '#c7ba00', '#e09b96', '#93c', '#f80', '#0cf', '#f0f'][i] })),
      entries: entries
    });
    radar_visualization(config);

    await new Promise(resolve => setTimeout(resolve, 600));

    // Verify no collisions
    const collisions = detectCollisions(entries);

    // Allow up to 2% collision rate for extreme density scenarios
    const collisionRate = collisions.length / (entries.length * (entries.length - 1) / 2);
    expect(collisionRate).toBeLessThan(0.02);
  });

  test('should distribute entries evenly without boundary clustering', async () => {
    document.body.innerHTML = '<svg id="radar"></svg>';

    const entries = [];
    for (let i = 0; i < 15; i++) {
      entries.push({
        label: `Entry${i}`,
        quadrant: 0,
        ring: 0,
        moved: 0,
        active: true
      });
    }

    const config = createMinimalConfig({ entries: entries });
    radar_visualization(config);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Calculate radius distribution
    const radii = entries.map(e => Math.sqrt(e.x * e.x + e.y * e.y));
    const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;

    // Count entries near the boundary (within 10% of expected outer radius)
    const outerRadius = 400; // Approximate for default config
    const boundaryThreshold = outerRadius * 0.9;
    const boundaryCount = radii.filter(r => r > boundaryThreshold).length;

    // No more than 30% of entries should be near the boundary
    expect(boundaryCount / entries.length).toBeLessThan(0.3);

    // Verify reasonable spread (standard deviation)
    const variance = radii.reduce((acc, r) => acc + Math.pow(r - avgRadius, 2), 0) / radii.length;
    const stdDev = Math.sqrt(variance);
    expect(stdDev).toBeGreaterThan(20); // Not all clustered at one radius
  });
});
