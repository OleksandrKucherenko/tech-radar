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
      // GIVEN: a request for 4 quadrants
      const quadrants = generateQuadrants(4);

      // THEN: should generate 4 quadrants with correct angle boundaries
      expect(quadrants).toHaveLength(4);
      expect(quadrants[0].radial_min).toBeCloseTo(-1);
      expect(quadrants[0].radial_max).toBeCloseTo(-0.5);
      expect(quadrants[3].radial_min).toBeCloseTo(0.5);
      expect(quadrants[3].radial_max).toBeCloseTo(1);
    });

    test('generates 2 quadrants with vertical split', () => {
      // GIVEN: a request for 2 quadrants
      const quadrants = generateQuadrants(2);

      // THEN: should generate 2 quadrants with vertical split
      expect(quadrants).toHaveLength(2);
      // With rotation offset of -0.5, should split vertically
      expect(quadrants[0].radial_min).toBeCloseTo(-1.5);
      expect(quadrants[0].radial_max).toBeCloseTo(-0.5);
      expect(quadrants[1].radial_min).toBeCloseTo(-0.5);
      expect(quadrants[1].radial_max).toBeCloseTo(0.5);
    });

    test('generates 6 quadrants evenly distributed', () => {
      // GIVEN: a request for 6 quadrants
      const quadrants = generateQuadrants(6);

      // THEN: should generate 6 quadrants with equal angle distribution
      expect(quadrants).toHaveLength(6);
      const anglePerQuadrant = 2 / 6;
      for (let i = 0; i < 6; i++) {
        expect(quadrants[i].radial_min).toBeCloseTo(-1 + i * anglePerQuadrant);
        expect(quadrants[i].radial_max).toBeCloseTo(-1 + (i + 1) * anglePerQuadrant);
      }
    });

    test('generates 8 quadrants evenly distributed', () => {
      // GIVEN: a request for 8 quadrants
      const quadrants = generateQuadrants(8);

      // THEN: should generate 8 quadrants with equal angle distribution
      expect(quadrants).toHaveLength(8);
      const anglePerQuadrant = 2 / 8;
      for (let i = 0; i < 8; i++) {
        expect(quadrants[i].radial_min).toBeCloseTo(-1 + i * anglePerQuadrant);
        expect(quadrants[i].radial_max).toBeCloseTo(-1 + (i + 1) * anglePerQuadrant);
      }
    });

    test('calculates correct direction factors for 4 quadrants', () => {
      // GIVEN: 4 generated quadrants
      const quadrants = generateQuadrants(4);

      // THEN: should have correct direction factors for each quadrant position
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
      // GIVEN: 4 generated quadrants
      const quadrants = generateQuadrants(4);

      // THEN: all direction factors should have unit magnitude
      for (const q of quadrants) {
        const magnitude = Math.sqrt(q.factor_x ** 2 + q.factor_y ** 2);
        expect(magnitude).toBeCloseTo(1, 5);
      }
    });
  });

  describe('computeQuadrantBounds', () => {
    test('computes bounds for full circle', () => {
      // GIVEN: an angle range covering the full circle with radius 100
      const bounds = computeQuadrantBounds(0, 2 * Math.PI, 100);

      // THEN: should compute bounds with padding around the circle
      expect(bounds.min.x).toBeCloseTo(-120); // -100 - 20 padding
      expect(bounds.max.x).toBeCloseTo(120);  // 100 + 20 padding
      expect(bounds.min.y).toBeCloseTo(-120);
      expect(bounds.max.y).toBeCloseTo(120);
    });

    test('computes bounds for right quadrant (0 to π/2)', () => {
      // GIVEN: an angle range for the right quadrant with radius 100
      const bounds = computeQuadrantBounds(0, Math.PI / 2, 100);

      // THEN: should compute bounds for right quadrant only
      expect(bounds.min.x).toBeCloseTo(-20);  // min cos(0 to π/2) = 0
      expect(bounds.max.x).toBeCloseTo(120);  // max cos(0) = 1
      expect(bounds.min.y).toBeCloseTo(-20);  // min sin(0) = 0
      expect(bounds.max.y).toBeCloseTo(120);  // max sin(π/2) = 1
    });

    test('computes bounds for top quadrant (π/2 to π)', () => {
      // GIVEN: an angle range for the top quadrant with radius 100
      const bounds = computeQuadrantBounds(Math.PI / 2, Math.PI, 100);

      // THEN: should compute bounds for top quadrant only
      expect(bounds.min.x).toBeCloseTo(-120); // min cos(π) = -1
      expect(bounds.max.x).toBeCloseTo(20);   // max cos(π/2) = 0
      expect(bounds.min.y).toBeCloseTo(-20);  // min sin at π/2 or π
      expect(bounds.max.y).toBeCloseTo(120);  // max sin(π/2) = 1
    });

    test('handles angles wrapping around 2π', () => {
      // GIVEN: an angle range that wraps around 2π boundary
      const bounds = computeQuadrantBounds(1.5 * Math.PI, 2.5 * Math.PI, 100);

      // THEN: should correctly compute bounds across the wraparound
      expect(bounds.min.x).toBeCloseTo(-20, 0);
      expect(bounds.max.x).toBeCloseTo(120);
      expect(bounds.min.y).toBeCloseTo(-120);
      expect(bounds.max.y).toBeCloseTo(120);
    });

    test('handles negative start angles', () => {
      // GIVEN: an angle range with negative start angle
      const bounds = computeQuadrantBounds(-Math.PI / 2, 0, 100);

      // THEN: should correctly compute bounds for negative angles
      expect(bounds.min.x).toBeCloseTo(-20);
      expect(bounds.max.x).toBeCloseTo(120);
      expect(bounds.min.y).toBeCloseTo(-120);
      expect(bounds.max.y).toBeCloseTo(20);
    });

    test('scales bounds proportionally with radius', () => {
      // GIVEN: the same angle range but different radii (200 vs 100)
      const bounds200 = computeQuadrantBounds(0, Math.PI / 2, 200);
      const bounds100 = computeQuadrantBounds(0, Math.PI / 2, 100);

      // WHEN: computing bounds with radius 200 vs 100
      const width200 = bounds200.max.x - bounds200.min.x;
      const width100 = bounds100.max.x - bounds100.min.x;

      // THEN: bounds should scale proportionally (not exactly 2x due to constant padding)
      // Expect ratio between 1.5 and 2.0
      expect(width200 / width100).toBeGreaterThan(1.5);
      expect(width200 / width100).toBeLessThan(2.1);
    });

    test('includes padding in all bounds', () => {
      // GIVEN: an angle range with radius 100
      const bounds = computeQuadrantBounds(0, Math.PI / 4, 100);

      // THEN: all bounds should extend beyond the mathematical circle by padding
      const maxRadius = Math.sqrt(bounds.max.x ** 2 + bounds.max.y ** 2);
      expect(maxRadius).toBeGreaterThan(100);
    });
  });

  describe('generateQuadrantOrder', () => {
    test('returns traditional order for 4 quadrants', () => {
      // GIVEN: a request for ordering 4 quadrants
      const order = generateQuadrantOrder(4);

      // THEN: should return traditional order [2, 3, 1, 0]
      expect(order).toEqual([2, 3, 1, 0]);
    });

    test('returns sequential order for 2 quadrants', () => {
      // GIVEN: a request for ordering 2 quadrants
      const order = generateQuadrantOrder(2);

      // THEN: should return sequential order [1, 0]
      expect(order).toEqual([1, 0]);
    });

    test('returns counter-clockwise order for 6 quadrants', () => {
      // GIVEN: a request for ordering 6 quadrants
      const order = generateQuadrantOrder(6);

      // THEN: should return counter-clockwise order starting from bottom-left
      expect(order).toHaveLength(6);
      expect(order[0]).toBe(3); // Start from bottom-left
    });

    test('returns counter-clockwise order for 8 quadrants', () => {
      // GIVEN: a request for ordering 8 quadrants
      const order = generateQuadrantOrder(8);

      // THEN: should return counter-clockwise order starting from bottom-left
      expect(order).toHaveLength(8);
      expect(order[0]).toBe(4); // Start from bottom-left
    });

    test('all quadrant indices appear exactly once', () => {
      // GIVEN: requests for ordering 2-8 quadrants
      for (let numQuadrants = 2; numQuadrants <= 8; numQuadrants++) {
        // WHEN: generating the order
        const order = generateQuadrantOrder(numQuadrants);
        const uniqueIndices = new Set(order);

        // THEN: each quadrant index should appear exactly once
        expect(uniqueIndices.size).toBe(numQuadrants);
        for (let i = 0; i < numQuadrants; i++) {
          expect(uniqueIndices.has(i)).toBe(true);
        }
      }
    });
  });
});
