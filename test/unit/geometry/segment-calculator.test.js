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
      const segment = createSegment(0, 0, quadrants, rings, config, randomBetween);

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
      const segment = createSegment(0, 1, quadrants, rings, config, Math.random);

      for (let i = 0; i < 100; i++) {
        const point = segment.random();

        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(isFinite(point.x)).toBe(true);
        expect(isFinite(point.y)).toBe(true);
      }
    });

    test('random() respects seeded randomness', () => {
      let seed = 0;
      const seededRandom = (min, max) => {
        seed++;
        const x = Math.sin(seed) * 10000;
        return min + (x - Math.floor(x)) * (max - min);
      };

      const segment1 = createSegment(0, 1, quadrants, rings, config, seededRandom);
      seed = 0; // Reset seed
      const segment2 = createSegment(0, 1, quadrants, rings, config, seededRandom);

      const point1 = segment1.random();
      seed = 0; // Reset seed again
      const point2 = segment2.random();

      expect(point1.x).toBeCloseTo(point2.x);
      expect(point1.y).toBeCloseTo(point2.y);
    });

    test('clip() constrains point to segment bounds', () => {
      const segment = createSegment(0, 1, quadrants, rings, config, randomBetween);

      const farPoint = { x: 1000, y: 1000 };
      const clipped = segment.clip(farPoint);

      expect(Math.abs(clipped.x)).toBeLessThan(500);
      expect(Math.abs(clipped.y)).toBeLessThan(500);
    });

    test('clip() modifies input object in place', () => {
      const segment = createSegment(0, 1, quadrants, rings, config, randomBetween);

      const point = { x: 1000, y: 1000 };
      const clipped = segment.clip(point);

      expect(point.x).toBe(clipped.x);
      expect(point.y).toBe(clipped.y);
    });

    test('clipx() returns constrained x coordinate', () => {
      const segment = createSegment(0, 1, quadrants, rings, config, randomBetween);

      const point = { x: 1000, y: 0 };
      const clippedX = segment.clipx(point);

      expect(typeof clippedX).toBe('number');
      expect(Math.abs(clippedX)).toBeLessThan(500);
    });

    test('clipy() returns constrained y coordinate', () => {
      const segment = createSegment(0, 1, quadrants, rings, config, randomBetween);

      const point = { x: 0, y: 1000 };
      const clippedY = segment.clipy(point);

      expect(typeof clippedY).toBe('number');
      expect(Math.abs(clippedY)).toBeLessThan(500);
    });

    test('handles ring 0 (innermost ring) correctly', () => {
      const segment = createSegment(0, 0, quadrants, rings, config, randomBetween);

      const point = segment.random();
      const radius = Math.sqrt(point.x ** 2 + point.y ** 2);

      // Ring 0 has inner radius of 30 + padding
      expect(radius).toBeGreaterThan(30);
      expect(radius).toBeLessThan(rings[0].radius);
    });

    test('handles different quadrants correctly', () => {
      for (let q = 0; q < 4; q++) {
        const segment = createSegment(q, 1, quadrants, rings, config, randomBetween);
        const point = segment.random();

        // All points should be within reasonable bounds
        expect(Math.abs(point.x)).toBeLessThan(500);
        expect(Math.abs(point.y)).toBeLessThan(500);
      }
    });

    test('handles different rings correctly', () => {
      for (let r = 0; r < 4; r++) {
        const segment = createSegment(0, r, quadrants, rings, config, randomBetween);
        const point = segment.random();

        const radius = Math.sqrt(point.x ** 2 + point.y ** 2);

        // Verify point is within expected ring radius
        expect(radius).toBeLessThan(rings[r].radius + 50);
        if (r > 0) {
          expect(radius).toBeGreaterThan(rings[r - 1].radius - 50);
        }
      }
    });

    test('applies radial padding correctly', () => {
      const configWithPadding = { segment_radial_padding: 50, segment_angular_padding: 12 };
      const segment = createSegment(0, 1, quadrants, rings, configWithPadding, randomBetween);

      const point = segment.random();
      const radius = Math.sqrt(point.x ** 2 + point.y ** 2);

      // Point should respect padding (but not exceed it by much due to angular constraints)
      // With padding of 50, expect radius to be comfortably above ring[0].radius
      expect(radius).toBeGreaterThan(rings[0].radius + 40);
      expect(radius).toBeLessThan(rings[1].radius - 40);
    });

    test('handles collapsed segments gracefully', () => {
      // Create a very narrow ring with large padding
      const narrowRings = [
        { radius: 100 },
        { radius: 105 }  // Only 5 pixels wide
      ];
      const largePadding = { segment_radial_padding: 10, segment_angular_padding: 12 };

      const segment = createSegment(0, 1, quadrants, narrowRings, largePadding, randomBetween);

      // Should still create valid segment without crashing
      const point = segment.random();
      expect(isFinite(point.x)).toBe(true);
      expect(isFinite(point.y)).toBe(true);
    });

    test('clipping is idempotent', () => {
      const segment = createSegment(0, 1, quadrants, rings, config, randomBetween);

      const point = { x: 1000, y: 1000 };
      segment.clip(point);
      const firstClip = { x: point.x, y: point.y };

      segment.clip(point);
      const secondClip = { x: point.x, y: point.y };

      expect(firstClip.x).toBeCloseTo(secondClip.x);
      expect(firstClip.y).toBeCloseTo(secondClip.y);
    });

    test('works with 6 quadrants', () => {
      const quadrants6 = generateQuadrants(6);
      const segment = createSegment(0, 1, quadrants6, rings, config, randomBetween);

      const point = segment.random();
      expect(isFinite(point.x)).toBe(true);
      expect(isFinite(point.y)).toBe(true);
    });

    test('works with 8 rings', () => {
      const rings8 = generateRings(8, 400);
      const segment = createSegment(0, 3, quadrants, rings8, config, randomBetween);

      const point = segment.random();
      expect(isFinite(point.x)).toBe(true);
      expect(isFinite(point.y)).toBe(true);
    });

    test('maintains point within bounds after multiple clips', () => {
      const segment = createSegment(0, 1, quadrants, rings, config, randomBetween);

      const point = segment.random();
      const originalRadius = Math.sqrt(point.x ** 2 + point.y ** 2);

      // Clip multiple times
      for (let i = 0; i < 10; i++) {
        segment.clip(point);
      }

      const finalRadius = Math.sqrt(point.x ** 2 + point.y ** 2);

      // Radius should remain relatively stable (within 10%)
      expect(Math.abs(finalRadius - originalRadius) / originalRadius).toBeLessThan(0.1);
    });
  });
});
