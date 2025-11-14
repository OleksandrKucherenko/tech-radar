// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

import { describe, test, expect } from 'vitest';
import { createSegment } from '../../../src/geometry/segment-calculator.js';
import { generateQuadrants } from '../../../src/geometry/quadrant-calculator.js';
import { generateRings } from '../../../src/geometry/ring-calculator.js';

describe('Segment Calculator', () => {
  // Test fixtures
  const quadrants = generateQuadrants(4);
  const rings = generateRings(4, 400);
  const config = {
    segment_radial_padding: 16,
    segment_angular_padding: 12
  };

  // Simple random function for testing
  const randomBetween = (min, max) => min + (max - min) * 0.5;

  describe('createSegment', () => {
    test('creates segment with required functions', () => {
      // GIVEN: quadrant 0, ring 0, standard config and random function
      const segment = createSegment(0, 0, quadrants, rings, config, randomBetween);

      // WHEN: accessing segment properties
      // THEN: should have all required functions
      expect(segment).toHaveProperty('clipx');
      expect(segment).toHaveProperty('clipy');
      expect(segment).toHaveProperty('clip');
      expect(segment).toHaveProperty('random');
      expect(typeof segment.clipx).toBe('function');
      expect(typeof segment.clipy).toBe('function');
      expect(typeof segment.clip).toBe('function');
      expect(typeof segment.random).toBe('function');
    });

    test('random() generates points within segment bounds', () => {
      // GIVEN: a segment at quadrant 0, ring 1 with Math.random
      const segment = createSegment(0, 1, quadrants, rings, config, Math.random);

      // WHEN: generating 100 random points
      for (let i = 0; i < 100; i++) {
        const point = segment.random();

        // THEN: each point should have valid x and y coordinates
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(isFinite(point.x)).toBe(true);
        expect(isFinite(point.y)).toBe(true);
      }
    });

    test('random() respects seeded randomness', () => {
      // GIVEN: a seeded random function and two segments created with the same seed
      let seed = 0;
      const seededRandom = (min, max) => {
        seed++;
        const x = Math.sin(seed) * 10000;
        return min + (x - Math.floor(x)) * (max - min);
      };

      const segment1 = createSegment(0, 1, quadrants, rings, config, seededRandom);
      seed = 0; // Reset seed
      const segment2 = createSegment(0, 1, quadrants, rings, config, seededRandom);

      // WHEN: generating a random point from each segment with reset seeds
      const point1 = segment1.random();
      seed = 0; // Reset seed again
      const point2 = segment2.random();

      // THEN: points should be identical due to seed reset
      expect(point1.x).toBeCloseTo(point2.x);
      expect(point1.y).toBeCloseTo(point2.y);
    });

    test('clip() constrains point to segment bounds', () => {
      // GIVEN: a segment and a point far outside its bounds
      const segment = createSegment(0, 1, quadrants, rings, config, randomBetween);
      const farPoint = { x: 1000, y: 1000 };

      // WHEN: clipping the far point to segment bounds
      const clipped = segment.clip(farPoint);

      // THEN: coordinates should be significantly reduced
      expect(Math.abs(clipped.x)).toBeLessThan(500);
      expect(Math.abs(clipped.y)).toBeLessThan(500);
    });

    test('clip() modifies input object in place', () => {
      // GIVEN: a segment and a point object
      const segment = createSegment(0, 1, quadrants, rings, config, randomBetween);
      const point = { x: 1000, y: 1000 };

      // WHEN: clipping the point
      const clipped = segment.clip(point);

      // THEN: returned object should be the same reference with modified coordinates
      expect(point.x).toBe(clipped.x);
      expect(point.y).toBe(clipped.y);
    });

    test('clipx() returns constrained x coordinate', () => {
      // GIVEN: a segment and a point with large x value
      const segment = createSegment(0, 1, quadrants, rings, config, randomBetween);
      const point = { x: 1000, y: 0 };

      // WHEN: getting the clipped x coordinate
      const clippedX = segment.clipx(point);

      // THEN: should return a constrained number
      expect(typeof clippedX).toBe('number');
      expect(Math.abs(clippedX)).toBeLessThan(500);
    });

    test('clipy() returns constrained y coordinate', () => {
      // GIVEN: a segment and a point with large y value
      const segment = createSegment(0, 1, quadrants, rings, config, randomBetween);
      const point = { x: 0, y: 1000 };

      // WHEN: getting the clipped y coordinate
      const clippedY = segment.clipy(point);

      // THEN: should return a constrained number
      expect(typeof clippedY).toBe('number');
      expect(Math.abs(clippedY)).toBeLessThan(500);
    });

    test('handles ring 0 (innermost ring) correctly', () => {
      // GIVEN: a segment at the innermost ring (ring 0)
      const segment = createSegment(0, 0, quadrants, rings, config, randomBetween);

      // WHEN: generating a random point in that segment
      const point = segment.random();
      const radius = Math.sqrt(point.x ** 2 + point.y ** 2);

      // THEN: point radius should be within ring 0 bounds (accounting for padding)
      expect(radius).toBeGreaterThan(30);
      expect(radius).toBeLessThan(rings[0].radius);
    });

    test('handles different quadrants correctly', () => {
      // GIVEN: segments for each of the 4 quadrants
      for (let q = 0; q < 4; q++) {
        const segment = createSegment(q, 1, quadrants, rings, config, randomBetween);

        // WHEN: generating a random point from each quadrant segment
        const point = segment.random();

        // THEN: all points should be within reasonable bounds
        expect(Math.abs(point.x)).toBeLessThan(500);
        expect(Math.abs(point.y)).toBeLessThan(500);
      }
    });

    test('handles different rings correctly', () => {
      // GIVEN: segments for each of the 4 rings
      for (let r = 0; r < 4; r++) {
        const segment = createSegment(0, r, quadrants, rings, config, randomBetween);

        // WHEN: generating a random point from each ring segment
        const point = segment.random();
        const radius = Math.sqrt(point.x ** 2 + point.y ** 2);

        // THEN: point should be within expected ring bounds
        expect(radius).toBeLessThan(rings[r].radius + 50);
        if (r > 0) {
          expect(radius).toBeGreaterThan(rings[r - 1].radius - 50);
        }
      }
    });

    test('applies radial padding correctly', () => {
      // GIVEN: a segment with large radial padding (50 pixels)
      const configWithPadding = { segment_radial_padding: 50, segment_angular_padding: 12 };
      const segment = createSegment(0, 1, quadrants, rings, configWithPadding, randomBetween);

      // WHEN: generating a random point from the padded segment
      const point = segment.random();
      const radius = Math.sqrt(point.x ** 2 + point.y ** 2);

      // THEN: point should respect the padding constraints
      expect(radius).toBeGreaterThan(rings[0].radius + 40);
      expect(radius).toBeLessThan(rings[1].radius - 40);
    });

    test('handles collapsed segments gracefully', () => {
      // GIVEN: a very narrow ring (5 pixels) with large padding that exceeds the ring width
      const narrowRings = [
        { radius: 100 },
        { radius: 105 }  // Only 5 pixels wide
      ];
      const largePadding = { segment_radial_padding: 10, segment_angular_padding: 12 };

      // WHEN: creating a segment with these constraints
      const segment = createSegment(0, 1, quadrants, narrowRings, largePadding, randomBetween);

      // THEN: should handle gracefully without crashing and return valid point
      const point = segment.random();
      expect(isFinite(point.x)).toBe(true);
      expect(isFinite(point.y)).toBe(true);
    });

    test('clipping is idempotent', () => {
      // GIVEN: a segment and a point that requires clipping
      const segment = createSegment(0, 1, quadrants, rings, config, randomBetween);
      const point = { x: 1000, y: 1000 };

      // WHEN: clipping the point twice
      segment.clip(point);
      const firstClip = { x: point.x, y: point.y };

      segment.clip(point);
      const secondClip = { x: point.x, y: point.y };

      // THEN: second clip should produce same result as first (idempotent)
      expect(firstClip.x).toBeCloseTo(secondClip.x);
      expect(firstClip.y).toBeCloseTo(secondClip.y);
    });

    test('works with 6 quadrants', () => {
      // GIVEN: a configuration with 6 quadrants instead of the default 4
      const quadrants6 = generateQuadrants(6);

      // WHEN: creating a segment and generating a random point
      const segment = createSegment(0, 1, quadrants6, rings, config, randomBetween);
      const point = segment.random();

      // THEN: should handle 6-quadrant configuration correctly
      expect(isFinite(point.x)).toBe(true);
      expect(isFinite(point.y)).toBe(true);
    });

    test('works with 8 rings', () => {
      // GIVEN: a configuration with 8 rings instead of the default 4
      const rings8 = generateRings(8, 400);

      // WHEN: creating a segment with ring 3 and generating a random point
      const segment = createSegment(0, 3, quadrants, rings8, config, randomBetween);
      const point = segment.random();

      // THEN: should handle 8-ring configuration correctly
      expect(isFinite(point.x)).toBe(true);
      expect(isFinite(point.y)).toBe(true);
    });

    test('maintains point within bounds after multiple clips', () => {
      // GIVEN: a segment and a random point from that segment
      const segment = createSegment(0, 1, quadrants, rings, config, randomBetween);
      const point = segment.random();
      const originalRadius = Math.sqrt(point.x ** 2 + point.y ** 2);

      // WHEN: applying clip operation multiple times (10 times)
      for (let i = 0; i < 10; i++) {
        segment.clip(point);
      }

      // THEN: radius should remain stable (variation within 10%)
      const finalRadius = Math.sqrt(point.x ** 2 + point.y ** 2);
      expect(Math.abs(finalRadius - originalRadius) / originalRadius).toBeLessThan(0.1);
    });
  });
});
