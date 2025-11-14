// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

import { describe, test, expect } from 'vitest';
import { generateRings } from '../../../src/geometry/ring-calculator.js';

describe('Ring Calculator', () => {
  describe('generateRings', () => {
    test('generates 4 rings with base pattern when target radius is 400', () => {
      // GIVEN: 4 rings with target radius of 400
      const rings = generateRings(4, 400);

      // THEN: should generate exactly 4 rings with base pattern values
      expect(rings).toHaveLength(4);
      expect(rings[0].radius).toBe(130);
      expect(rings[1].radius).toBe(220);
      expect(rings[2].radius).toBe(310);
      expect(rings[3].radius).toBe(400);
    });

    test('scales 4 rings proportionally when target radius differs', () => {
      // GIVEN: 4 rings with target radius of 200 (half of base 400)
      const rings = generateRings(4, 200);

      // THEN: all radii should be scaled by 50%
      expect(rings).toHaveLength(4);
      // All radii should be scaled by 200/400 = 0.5
      expect(rings[0].radius).toBe(65);   // 130 * 0.5
      expect(rings[1].radius).toBe(110);  // 220 * 0.5
      expect(rings[2].radius).toBe(155);  // 310 * 0.5
      expect(rings[3].radius).toBe(200);  // 400 * 0.5
    });

    test('generates 5 rings with interpolated spacing', () => {
      // GIVEN: 5 rings with target radius of 400
      const rings = generateRings(5, 400);

      // THEN: should have interpolated spacing between base pattern values
      expect(rings).toHaveLength(5);
      // First ring should be at base pattern start
      expect(rings[0].radius).toBe(130);
      // Last ring should match target
      expect(rings[4].radius).toBe(400);
      // Middle rings should be interpolated
      expect(rings[1].radius).toBeGreaterThan(130);
      expect(rings[1].radius).toBeLessThan(220);
      expect(rings[2].radius).toBeGreaterThan(rings[1].radius);
      expect(rings[3].radius).toBeGreaterThan(rings[2].radius);
    });

    test('generates 6 rings with smooth progression', () => {
      // GIVEN: 6 rings with target radius of 400
      const rings = generateRings(6, 400);

      // THEN: should have smoothly increasing radii from first to last
      expect(rings).toHaveLength(6);
      expect(rings[0].radius).toBe(130);
      expect(rings[5].radius).toBe(400);

      // Verify monotonic increasing
      for (let i = 1; i < 6; i++) {
        expect(rings[i].radius).toBeGreaterThan(rings[i - 1].radius);
      }
    });

    test('generates 7 rings with smooth progression', () => {
      // GIVEN: 7 rings with target radius of 400
      const rings = generateRings(7, 400);

      // THEN: should have smoothly increasing radii from first to last
      expect(rings).toHaveLength(7);
      expect(rings[0].radius).toBe(130);
      expect(rings[6].radius).toBe(400);

      // Verify monotonic increasing
      for (let i = 1; i < 7; i++) {
        expect(rings[i].radius).toBeGreaterThan(rings[i - 1].radius);
      }
    });

    test('generates 8 rings with smooth progression', () => {
      // GIVEN: 8 rings with target radius of 400
      const rings = generateRings(8, 400);

      // THEN: should have smoothly increasing radii from first to last
      expect(rings).toHaveLength(8);
      expect(rings[0].radius).toBe(130);
      expect(rings[7].radius).toBe(400);

      // Verify monotonic increasing
      for (let i = 1; i < 8; i++) {
        expect(rings[i].radius).toBeGreaterThan(rings[i - 1].radius);
      }
    });

    test('enforces minimum radius of 10', () => {
      // GIVEN: 4 rings with very small target radius of 20
      const rings = generateRings(4, 20); // Very small target

      // THEN: all radii should be at least 10 (minimum threshold)
      expect(rings).toHaveLength(4);
      for (const ring of rings) {
        expect(ring.radius).toBeGreaterThanOrEqual(10);
      }
    });

    test('scales rings linearly with target radius', () => {
      // GIVEN: two sets of 4 rings with different target radii (400 and 800)
      const rings400 = generateRings(4, 400);
      const rings800 = generateRings(4, 800);

      // WHEN: comparing the two sets
      // THEN: radii should scale linearly (2x for 2x target radius)
      expect(rings800[0].radius).toBe(rings400[0].radius * 2);
      expect(rings800[1].radius).toBe(rings400[1].radius * 2);
      expect(rings800[2].radius).toBe(rings400[2].radius * 2);
      expect(rings800[3].radius).toBe(rings400[3].radius * 2);
    });

    test('rounds radii to integers', () => {
      // GIVEN: 5 rings with odd target radius of 333 (should force fractional values)
      const rings = generateRings(5, 333); // Odd target to force fractional values

      // THEN: all radii should be rounded to integers
      for (const ring of rings) {
        expect(ring.radius).toBe(Math.round(ring.radius));
      }
    });

    test('returns objects with radius property', () => {
      // GIVEN: 4 rings with target radius of 400
      const rings = generateRings(4, 400);

      // THEN: each ring should have a radius property that is a number
      for (const ring of rings) {
        expect(ring).toHaveProperty('radius');
        expect(typeof ring.radius).toBe('number');
      }
    });

    test('interpolation respects base pattern structure', () => {
      // GIVEN: 5 rings with target radius of 400
      const rings5 = generateRings(5, 400);

      // THEN: interpolated rings should respect base pattern boundaries
      // First ring should match base pattern[0]
      expect(rings5[0].radius).toBe(130);

      // Last ring should match base pattern[3]
      expect(rings5[4].radius).toBe(400);

      // Middle rings should be between base pattern values
      expect(rings5[2].radius).toBeGreaterThan(220);
      expect(rings5[2].radius).toBeLessThan(310);
    });

    test('handles edge case of 4 rings with very large target radius', () => {
      // GIVEN: 4 rings with very large target radius of 10000
      const rings = generateRings(4, 10000);

      // THEN: should scale correctly up to the target radius
      expect(rings).toHaveLength(4);
      expect(rings[0].radius).toBe(3250);   // 130 * 25
      expect(rings[3].radius).toBe(10000);  // 400 * 25
    });

    test('maintains proper spacing ratios across different configurations', () => {
      // GIVEN: two sets of rings with different counts (4 and 6) at same target radius
      const rings4 = generateRings(4, 400);
      const rings6 = generateRings(6, 400);

      // WHEN: checking spacing between consecutive rings
      // THEN: spacing should be reasonable and not too cramped
      for (let i = 1; i < 4; i++) {
        const spacing4 = rings4[i].radius - rings4[i - 1].radius;
        expect(spacing4).toBeGreaterThan(50);
      }

      for (let i = 1; i < 6; i++) {
        const spacing6 = rings6[i].radius - rings6[i - 1].radius;
        expect(spacing6).toBeGreaterThan(30);
      }
    });
  });
});
