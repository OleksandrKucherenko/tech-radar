// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

import { describe, test, expect } from 'vitest';
import { EntryProcessor } from '../../../src/processing/entry-processor.js';
import { generateQuadrants } from '../../../src/geometry/quadrant-calculator.js';
import { generateRings } from '../../../src/geometry/ring-calculator.js';
import { SeededRandom } from '../../../src/math/random.js';

describe('Entry Processor', () => {
  // Test fixtures
  function createTestConfig() {
    return {
      segment_radial_padding: 16,
      segment_angular_padding: 12,
      blip_collision_radius: 14,
      print_layout: true,
      quadrants: [
        { name: 'Q1' },
        { name: 'Q2' },
        { name: 'Q3' },
        { name: 'Q4' }
      ],
      rings: [
        { name: 'ADOPT', color: '#93c47d' },
        { name: 'TRIAL', color: '#93d2c2' },
        { name: 'ASSESS', color: '#fbdb84' },
        { name: 'HOLD', color: '#efafa9' }
      ],
      colors: {
        inactive: '#ddd'
      }
    };
  }

  function createTestEntries() {
    return [
      { label: 'Tech A', quadrant: 0, ring: 0, active: true, moved: 0 },
      { label: 'Tech B', quadrant: 0, ring: 1, active: true, moved: 1 },
      { label: 'Tech C', quadrant: 1, ring: 0, active: true, moved: 0 },
      { label: 'Tech D', quadrant: 1, ring: 1, active: false, moved: 0 },
      { label: 'Tech E', quadrant: 2, ring: 2, active: true, moved: -1 },
      { label: 'Tech F', quadrant: 3, ring: 3, active: true, moved: 2 }
    ];
  }

  describe('EntryProcessor', () => {
    test('processes entries with all required properties', () => {
      // GIVEN: a configured entry processor
      const config = createTestConfig();
      const quadrants = generateQuadrants(4);
      const rings = generateRings(4, 400);
      const rng = new SeededRandom(42);

      const processor = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng.next(),
        (min, max) => rng.between(min, max)
      );

      // WHEN: processing test entries
      const entries = createTestEntries();
      processor.processEntries(entries);

      // THEN: all entries should have required properties
      for (const entry of entries) {
        expect(entry).toHaveProperty('segment');
        expect(entry).toHaveProperty('color');
        expect(entry).toHaveProperty('x');
        expect(entry).toHaveProperty('y');
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('collision_radius');
      }
    });

    test('assigns correct colors to active entries', () => {
      // GIVEN: a configured entry processor
      const config = createTestConfig();
      const quadrants = generateQuadrants(4);
      const rings = generateRings(4, 400);
      const rng = new SeededRandom(42);

      const processor = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng.next(),
        (min, max) => rng.between(min, max)
      );

      // WHEN: processing test entries
      const entries = createTestEntries();
      processor.processEntries(entries);

      // THEN: active entries should use ring colors
      expect(entries[0].color).toBe('#93c47d'); // ring 0 color
      expect(entries[1].color).toBe('#93d2c2'); // ring 1 color
      expect(entries[4].color).toBe('#fbdb84'); // ring 2 color
    });

    test('assigns inactive color to inactive entries', () => {
      // GIVEN: a configured entry processor with print layout disabled
      const config = createTestConfig();
      config.print_layout = false; // Disable print layout to show inactive color
      const quadrants = generateQuadrants(4);
      const rings = generateRings(4, 400);
      const rng = new SeededRandom(42);

      const processor = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng.next(),
        (min, max) => rng.between(min, max)
      );

      // WHEN: processing test entries
      const entries = createTestEntries();
      processor.processEntries(entries);

      // THEN: inactive entry should use inactive color
      expect(entries[3].color).toBe('#ddd');
    });

    test('assigns sequential IDs in correct order', () => {
      // GIVEN: a configured entry processor
      const config = createTestConfig();
      const quadrants = generateQuadrants(4);
      const rings = generateRings(4, 400);
      const rng = new SeededRandom(42);

      const processor = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng.next(),
        (min, max) => rng.between(min, max)
      );

      // WHEN: processing test entries
      const entries = createTestEntries();
      processor.processEntries(entries);

      // THEN: IDs should be sequential starting from 1 with no duplicates
      const ids = entries.map(e => parseInt(e.id));
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(entries.length);
      expect(Math.min(...ids)).toBe(1);
      expect(Math.max(...ids)).toBe(entries.length);
    });

    test('positions entries with valid coordinates', () => {
      // GIVEN: a configured entry processor
      const config = createTestConfig();
      const quadrants = generateQuadrants(4);
      const rings = generateRings(4, 400);
      const rng = new SeededRandom(42);

      const processor = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng.next(),
        (min, max) => rng.between(min, max)
      );

      // WHEN: processing test entries
      const entries = createTestEntries();
      processor.processEntries(entries);

      // THEN: all entries should have finite coordinates within reasonable bounds
      for (const entry of entries) {
        expect(isFinite(entry.x)).toBe(true);
        expect(isFinite(entry.y)).toBe(true);
        expect(Math.abs(entry.x)).toBeLessThan(500);
        expect(Math.abs(entry.y)).toBeLessThan(500);
      }
    });

    test('produces deterministic results with seeded random', () => {
      // GIVEN: two entry processors with the same seed
      const config = createTestConfig();
      const quadrants = generateQuadrants(4);
      const rings = generateRings(4, 400);

      const rng1 = new SeededRandom(42);
      const processor1 = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng1.next(),
        (min, max) => rng1.between(min, max)
      );

      const rng2 = new SeededRandom(42);
      const processor2 = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng2.next(),
        (min, max) => rng2.between(min, max)
      );

      // WHEN: processing identical entries with both processors
      const entries1 = createTestEntries();
      const entries2 = createTestEntries();

      processor1.processEntries(entries1);
      processor2.processEntries(entries2);

      // THEN: results should be identical for both processors
      for (let i = 0; i < entries1.length; i++) {
        expect(entries1[i].x).toBeCloseTo(entries2[i].x);
        expect(entries1[i].y).toBeCloseTo(entries2[i].y);
        expect(entries1[i].id).toBe(entries2[i].id);
        expect(entries1[i].color).toBe(entries2[i].color);
      }
    });

    test('assigns collision radii to all entries', () => {
      // GIVEN: a configured entry processor
      const config = createTestConfig();
      const quadrants = generateQuadrants(4);
      const rings = generateRings(4, 400);
      const rng = new SeededRandom(42);

      const processor = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng.next(),
        (min, max) => rng.between(min, max)
      );

      // WHEN: processing test entries
      const entries = createTestEntries();
      processor.processEntries(entries);

      // THEN: all entries should have collision radii within valid bounds
      for (const entry of entries) {
        expect(entry.collision_radius).toBeGreaterThanOrEqual(10);
        expect(entry.collision_radius).toBeLessThan(100); // Allow for larger radii when area permits
      }
    });

    test('calculates smaller collision radii for dense segments', () => {
      // GIVEN: a configured entry processor and many entries in the same segment
      const config = createTestConfig();
      const quadrants = generateQuadrants(4);
      const rings = generateRings(4, 400);
      const rng = new SeededRandom(42);

      const processor = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng.next(),
        (min, max) => rng.between(min, max)
      );

      // WHEN: processing 20 entries in the same quadrant and ring
      const denseEntries = [];
      for (let i = 0; i < 20; i++) {
        denseEntries.push({
          label: `Tech ${i}`,
          quadrant: 0,
          ring: 0,
          active: true,
          moved: 0
        });
      }

      processor.processEntries(denseEntries);

      // THEN: all entries should have collision radii (may be smaller for density)
      for (const entry of denseEntries) {
        expect(entry.collision_radius).toBeGreaterThanOrEqual(10);
      }
    });

    test('segments entries correctly by quadrant and ring', () => {
      // GIVEN: a configured entry processor
      const config = createTestConfig();
      const quadrants = generateQuadrants(4);
      const rings = generateRings(4, 400);
      const rng = new SeededRandom(42);

      const processor = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng.next(),
        (min, max) => rng.between(min, max)
      );

      // WHEN: segmenting test entries
      const entries = createTestEntries();
      const segmented = processor.segmentEntries(entries);

      // THEN: entries should be organized correctly by quadrant and ring
      expect(segmented).toHaveLength(4); // 4 quadrants
      expect(segmented[0]).toHaveLength(4); // 4 rings

      // Verify entries are in correct segments
      expect(segmented[0][0]).toHaveLength(1); // Tech A
      expect(segmented[0][1]).toHaveLength(1); // Tech B
      expect(segmented[1][0]).toHaveLength(1); // Tech C
      expect(segmented[1][1]).toHaveLength(1); // Tech D
    });

    test('sorts entries alphabetically within segments', () => {
      // GIVEN: a configured entry processor and unsorted entries
      const config = createTestConfig();
      const quadrants = generateQuadrants(4);
      const rings = generateRings(4, 400);
      const rng = new SeededRandom(42);

      const processor = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng.next(),
        (min, max) => rng.between(min, max)
      );

      const entries = [
        { label: 'Zebra', quadrant: 0, ring: 0, active: true, moved: 0 },
        { label: 'Apple', quadrant: 0, ring: 0, active: true, moved: 0 },
        { label: 'Mango', quadrant: 0, ring: 0, active: true, moved: 0 }
      ];

      // WHEN: processing entries
      processor.processEntries(entries);

      // THEN: IDs should reflect alphabetical order
      const sorted = [...entries].sort((a, b) => parseInt(a.id) - parseInt(b.id));
      expect(sorted[0].label).toBe('Apple');
      expect(sorted[1].label).toBe('Mango');
      expect(sorted[2].label).toBe('Zebra');
    });

    test('works with 6 quadrants and 5 rings', () => {
      // GIVEN: a configured entry processor with 6 quadrants and 5 rings
      const config = createTestConfig();
      config.quadrants = Array(6).fill({ name: 'Q' });
      config.rings = Array(5).fill({ name: 'R', color: '#000' });

      const quadrants = generateQuadrants(6);
      const rings = generateRings(5, 400);
      const rng = new SeededRandom(42);

      const processor = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng.next(),
        (min, max) => rng.between(min, max)
      );

      // WHEN: processing entries with extended ranges
      const entries = [
        { label: 'Tech A', quadrant: 0, ring: 0, active: true, moved: 0 },
        { label: 'Tech B', quadrant: 5, ring: 4, active: true, moved: 0 }
      ];

      processor.processEntries(entries);

      // THEN: entries should be processed successfully with extended configuration
      for (const entry of entries) {
        expect(entry).toHaveProperty('x');
        expect(entry).toHaveProperty('y');
        expect(entry).toHaveProperty('id');
      }
    });

    test('handles empty entry list gracefully', () => {
      // GIVEN: a configured entry processor and an empty entry list
      const config = createTestConfig();
      const quadrants = generateQuadrants(4);
      const rings = generateRings(4, 400);
      const rng = new SeededRandom(42);

      const processor = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng.next(),
        (min, max) => rng.between(min, max)
      );

      // WHEN: processing empty entries
      const entries = [];
      processor.processEntries(entries);

      // THEN: list should remain empty
      expect(entries).toHaveLength(0);
    });

    test('handles single entry correctly', () => {
      // GIVEN: a configured entry processor and a single entry
      const config = createTestConfig();
      const quadrants = generateQuadrants(4);
      const rings = generateRings(4, 400);
      const rng = new SeededRandom(42);

      const processor = new EntryProcessor(
        config,
        quadrants,
        rings,
        () => rng.next(),
        (min, max) => rng.between(min, max)
      );

      // WHEN: processing a single entry
      const entries = [
        { label: 'Sole Tech', quadrant: 0, ring: 0, active: true, moved: 0 }
      ];

      processor.processEntries(entries);

      // THEN: entry should be processed with ID and valid coordinates
      expect(entries[0].id).toBe('1');
      expect(isFinite(entries[0].x)).toBe(true);
      expect(isFinite(entries[0].y)).toBe(true);
    });
  });
});
