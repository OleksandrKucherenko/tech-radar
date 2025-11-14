// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

import { describe, test, expect } from 'vitest';
import {
  generateQuadrants,
  computeQuadrantBounds,
  generateQuadrantOrder
} from '../../../src/geometry/quadrant-calculator.js';

describe('Quadrant Calculator', () => {
  describe('generateQuadrants', () => {
    test('generates 4 quadrants with correct angles', () => {
      const quadrants = generateQuadrants(4);

      expect(quadrants).toHaveLength(4);
      expect(quadrants[0].radial_min).toBeCloseTo(-1);
      expect(quadrants[0].radial_max).toBeCloseTo(-0.5);
      expect(quadrants[3].radial_min).toBeCloseTo(0.5);
      expect(quadrants[3].radial_max).toBeCloseTo(1);
    });

    test('generates 2 quadrants with vertical split', () => {
      const quadrants = generateQuadrants(2);

      expect(quadrants).toHaveLength(2);
      // With rotation offset of -0.5, should split vertically
      expect(quadrants[0].radial_min).toBeCloseTo(-1.5);
      expect(quadrants[0].radial_max).toBeCloseTo(-0.5);
      expect(quadrants[1].radial_min).toBeCloseTo(-0.5);
      expect(quadrants[1].radial_max).toBeCloseTo(0.5);
    });

    test('generates 6 quadrants evenly distributed', () => {
      const quadrants = generateQuadrants(6);

      expect(quadrants).toHaveLength(6);
      const anglePerQuadrant = 2 / 6;
      for (let i = 0; i < 6; i++) {
        expect(quadrants[i].radial_min).toBeCloseTo(-1 + i * anglePerQuadrant);
        expect(quadrants[i].radial_max).toBeCloseTo(-1 + (i + 1) * anglePerQuadrant);
      }
    });

    test('generates 8 quadrants evenly distributed', () => {
      const quadrants = generateQuadrants(8);

      expect(quadrants).toHaveLength(8);
      const anglePerQuadrant = 2 / 8;
      for (let i = 0; i < 8; i++) {
        expect(quadrants[i].radial_min).toBeCloseTo(-1 + i * anglePerQuadrant);
        expect(quadrants[i].radial_max).toBeCloseTo(-1 + (i + 1) * anglePerQuadrant);
      }
    });

    test('calculates correct direction factors for 4 quadrants', () => {
      const quadrants = generateQuadrants(4);

      // Quadrants start at -π and go counter-clockwise
      // Quadrant 0: left side (around -3π/4)
      expect(quadrants[0].factor_x).toBeLessThan(0);
      expect(quadrants[0].factor_y).toBeLessThan(0);

      // Quadrant 1: bottom side (around -π/4)
      expect(quadrants[1].factor_x).toBeGreaterThan(0);
      expect(quadrants[1].factor_y).toBeLessThan(0);

      // Quadrant 2: right side (around π/4)
      expect(quadrants[2].factor_x).toBeGreaterThan(0);
      expect(quadrants[2].factor_y).toBeGreaterThan(0);

      // Quadrant 3: top side (around 3π/4)
      expect(quadrants[3].factor_x).toBeLessThan(0);
      expect(quadrants[3].factor_y).toBeGreaterThan(0);
    });

    test('direction factors have unit magnitude', () => {
      const quadrants = generateQuadrants(4);

      for (const q of quadrants) {
        const magnitude = Math.sqrt(q.factor_x ** 2 + q.factor_y ** 2);
        expect(magnitude).toBeCloseTo(1, 5);
      }
    });
  });

  describe('computeQuadrantBounds', () => {
    test('computes bounds for full circle', () => {
      const bounds = computeQuadrantBounds(0, 2 * Math.PI, 100);

      expect(bounds.min.x).toBeCloseTo(-120); // -100 - 20 padding
      expect(bounds.max.x).toBeCloseTo(120);  // 100 + 20 padding
      expect(bounds.min.y).toBeCloseTo(-120);
      expect(bounds.max.y).toBeCloseTo(120);
    });

    test('computes bounds for right quadrant (0 to π/2)', () => {
      const bounds = computeQuadrantBounds(0, Math.PI / 2, 100);

      expect(bounds.min.x).toBeCloseTo(-20);  // min cos(0 to π/2) = 0
      expect(bounds.max.x).toBeCloseTo(120);  // max cos(0) = 1
      expect(bounds.min.y).toBeCloseTo(-20);  // min sin(0) = 0
      expect(bounds.max.y).toBeCloseTo(120);  // max sin(π/2) = 1
    });

    test('computes bounds for top quadrant (π/2 to π)', () => {
      const bounds = computeQuadrantBounds(Math.PI / 2, Math.PI, 100);

      expect(bounds.min.x).toBeCloseTo(-120); // min cos(π) = -1
      expect(bounds.max.x).toBeCloseTo(20);   // max cos(π/2) = 0
      expect(bounds.min.y).toBeCloseTo(-20);  // min sin at π/2 or π
      expect(bounds.max.y).toBeCloseTo(120);  // max sin(π/2) = 1
    });

    test('handles angles wrapping around 2π', () => {
      const bounds = computeQuadrantBounds(1.5 * Math.PI, 2.5 * Math.PI, 100);

      expect(bounds.min.x).toBeCloseTo(-20, 0);
      expect(bounds.max.x).toBeCloseTo(120);
      expect(bounds.min.y).toBeCloseTo(-120);
      expect(bounds.max.y).toBeCloseTo(120);
    });

    test('handles negative start angles', () => {
      const bounds = computeQuadrantBounds(-Math.PI / 2, 0, 100);

      expect(bounds.min.x).toBeCloseTo(-20);
      expect(bounds.max.x).toBeCloseTo(120);
      expect(bounds.min.y).toBeCloseTo(-120);
      expect(bounds.max.y).toBeCloseTo(20);
    });

    test('scales bounds proportionally with radius', () => {
      const bounds200 = computeQuadrantBounds(0, Math.PI / 2, 200);
      const bounds100 = computeQuadrantBounds(0, Math.PI / 2, 100);

      // Width and height should scale approximately 2x
      // (not exactly due to constant padding of 20 on each side)
      const width200 = bounds200.max.x - bounds200.min.x;
      const width100 = bounds100.max.x - bounds100.min.x;
      // Expect ratio between 1.5 and 2.0
      expect(width200 / width100).toBeGreaterThan(1.5);
      expect(width200 / width100).toBeLessThan(2.1);
    });

    test('includes padding in all bounds', () => {
      const bounds = computeQuadrantBounds(0, Math.PI / 4, 100);

      // All bounds should extend beyond the mathematical circle by padding
      const maxRadius = Math.sqrt(bounds.max.x ** 2 + bounds.max.y ** 2);
      expect(maxRadius).toBeGreaterThan(100);
    });
  });

  describe('generateQuadrantOrder', () => {
    test('returns traditional order for 4 quadrants', () => {
      const order = generateQuadrantOrder(4);

      expect(order).toEqual([2, 3, 1, 0]);
    });

    test('returns sequential order for 2 quadrants', () => {
      const order = generateQuadrantOrder(2);

      expect(order).toEqual([1, 0]);
    });

    test('returns counter-clockwise order for 6 quadrants', () => {
      const order = generateQuadrantOrder(6);

      expect(order).toHaveLength(6);
      expect(order[0]).toBe(3); // Start from bottom-left
    });

    test('returns counter-clockwise order for 8 quadrants', () => {
      const order = generateQuadrantOrder(8);

      expect(order).toHaveLength(8);
      expect(order[0]).toBe(4); // Start from bottom-left
    });

    test('all quadrant indices appear exactly once', () => {
      for (let numQuadrants = 2; numQuadrants <= 8; numQuadrants++) {
        const order = generateQuadrantOrder(numQuadrants);
        const uniqueIndices = new Set(order);

        expect(uniqueIndices.size).toBe(numQuadrants);
        for (let i = 0; i < numQuadrants; i++) {
          expect(uniqueIndices.has(i)).toBe(true);
        }
      }
    });
  });
});
