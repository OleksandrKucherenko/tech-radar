// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

import { describe, test, expect } from 'vitest';
import { generateRings } from '../../../src/geometry/ring-calculator.js';

describe('Ring Calculator', () => {
  describe('generateRings', () => {
    test('generates 4 rings with base pattern when target radius is 400', () => {
      const rings = generateRings(4, 400);

      expect(rings).toHaveLength(4);
      expect(rings[0].radius).toBe(130);
      expect(rings[1].radius).toBe(220);
      expect(rings[2].radius).toBe(310);
      expect(rings[3].radius).toBe(400);
    });

    test('scales 4 rings proportionally when target radius differs', () => {
      const rings = generateRings(4, 200);

      expect(rings).toHaveLength(4);
      // All radii should be scaled by 200/400 = 0.5
      expect(rings[0].radius).toBe(65);   // 130 * 0.5
      expect(rings[1].radius).toBe(110);  // 220 * 0.5
      expect(rings[2].radius).toBe(155);  // 310 * 0.5
      expect(rings[3].radius).toBe(200);  // 400 * 0.5
    });

    test('generates 5 rings with interpolated spacing', () => {
      const rings = generateRings(5, 400);

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
      const rings = generateRings(6, 400);

      expect(rings).toHaveLength(6);
      expect(rings[0].radius).toBe(130);
      expect(rings[5].radius).toBe(400);

      // Verify monotonic increasing
      for (let i = 1; i < 6; i++) {
        expect(rings[i].radius).toBeGreaterThan(rings[i - 1].radius);
      }
    });

    test('generates 7 rings with smooth progression', () => {
      const rings = generateRings(7, 400);

      expect(rings).toHaveLength(7);
      expect(rings[0].radius).toBe(130);
      expect(rings[6].radius).toBe(400);

      // Verify monotonic increasing
      for (let i = 1; i < 7; i++) {
        expect(rings[i].radius).toBeGreaterThan(rings[i - 1].radius);
      }
    });

    test('generates 8 rings with smooth progression', () => {
      const rings = generateRings(8, 400);

      expect(rings).toHaveLength(8);
      expect(rings[0].radius).toBe(130);
      expect(rings[7].radius).toBe(400);

      // Verify monotonic increasing
      for (let i = 1; i < 8; i++) {
        expect(rings[i].radius).toBeGreaterThan(rings[i - 1].radius);
      }
    });

    test('enforces minimum radius of 10', () => {
      const rings = generateRings(4, 20); // Very small target

      expect(rings).toHaveLength(4);
      for (const ring of rings) {
        expect(ring.radius).toBeGreaterThanOrEqual(10);
      }
    });

    test('scales rings linearly with target radius', () => {
      const rings400 = generateRings(4, 400);
      const rings800 = generateRings(4, 800);

      expect(rings800[0].radius).toBe(rings400[0].radius * 2);
      expect(rings800[1].radius).toBe(rings400[1].radius * 2);
      expect(rings800[2].radius).toBe(rings400[2].radius * 2);
      expect(rings800[3].radius).toBe(rings400[3].radius * 2);
    });

    test('rounds radii to integers', () => {
      const rings = generateRings(5, 333); // Odd target to force fractional values

      for (const ring of rings) {
        expect(ring.radius).toBe(Math.round(ring.radius));
      }
    });

    test('returns objects with radius property', () => {
      const rings = generateRings(4, 400);

      for (const ring of rings) {
        expect(ring).toHaveProperty('radius');
        expect(typeof ring.radius).toBe('number');
      }
    });

    test('interpolation respects base pattern structure', () => {
      const rings5 = generateRings(5, 400);

      // First ring should match base pattern[0]
      expect(rings5[0].radius).toBe(130);

      // Last ring should match base pattern[3]
      expect(rings5[4].radius).toBe(400);

      // Middle rings should be between base pattern values
      expect(rings5[2].radius).toBeGreaterThan(220);
      expect(rings5[2].radius).toBeLessThan(310);
    });

    test('handles edge case of 4 rings with very large target radius', () => {
      const rings = generateRings(4, 10000);

      expect(rings).toHaveLength(4);
      expect(rings[0].radius).toBe(3250);   // 130 * 25
      expect(rings[3].radius).toBe(10000);  // 400 * 25
    });

    test('maintains proper spacing ratios across different configurations', () => {
      const rings4 = generateRings(4, 400);
      const rings6 = generateRings(6, 400);

      // Spacing between consecutive rings should be reasonable
      // (not too cramped, not too spread out)
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
