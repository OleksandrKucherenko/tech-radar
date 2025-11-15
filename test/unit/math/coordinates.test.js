// Test suite for coordinate transformation utilities
import { describe, expect, test } from 'bun:test';
import { boundedBox, boundedInterval, boundedRing, cartesian, polar } from '../../../src/math/coordinates.js';

describe('Coordinate Transformations', () => {
  describe('polar()', () => {
    test('converts cartesian (1, 0) to polar correctly', () => {
      // GIVEN: a point on the positive x-axis
      const point = { x: 1, y: 0 };

      // WHEN: converting to polar
      const result = polar(point);

      // THEN: should have angle 0 and radius 1
      expect(result.t).toBeCloseTo(0, 10);
      expect(result.r).toBeCloseTo(1, 10);
    });

    test('converts cartesian (0, 1) to polar correctly', () => {
      // GIVEN: a point on the positive y-axis
      const point = { x: 0, y: 1 };

      // WHEN: converting to polar
      const result = polar(point);

      // THEN: should have angle π/2 and radius 1
      expect(result.t).toBeCloseTo(Math.PI / 2, 10);
      expect(result.r).toBeCloseTo(1, 10);
    });

    test('converts cartesian (-1, 0) to polar correctly', () => {
      // GIVEN: a point on the negative x-axis
      const point = { x: -1, y: 0 };

      // WHEN: converting to polar
      const result = polar(point);

      // THEN: should have angle π and radius 1
      expect(Math.abs(result.t)).toBeCloseTo(Math.PI, 10);
      expect(result.r).toBeCloseTo(1, 10);
    });

    test('converts cartesian (3, 4) to polar correctly', () => {
      // GIVEN: a point at (3, 4)
      const point = { x: 3, y: 4 };

      // WHEN: converting to polar
      const result = polar(point);

      // THEN: should have correct angle and radius 5 (Pythagorean triple)
      expect(result.t).toBeCloseTo(Math.atan2(4, 3), 10);
      expect(result.r).toBeCloseTo(5, 10);
    });

    test('handles origin correctly', () => {
      // GIVEN: the origin
      const point = { x: 0, y: 0 };

      // WHEN: converting to polar
      const result = polar(point);

      // THEN: should have radius 0
      expect(result.r).toBe(0);
    });
  });

  describe('cartesian()', () => {
    test('converts polar (r=1, t=0) to cartesian correctly', () => {
      // GIVEN: a polar coordinate on the positive x-axis
      const point = { r: 1, t: 0 };

      // WHEN: converting to cartesian
      const result = cartesian(point);

      // THEN: should be at (1, 0)
      expect(result.x).toBeCloseTo(1, 10);
      expect(result.y).toBeCloseTo(0, 10);
    });

    test('converts polar (r=1, t=π/2) to cartesian correctly', () => {
      // GIVEN: a polar coordinate on the positive y-axis
      const point = { r: 1, t: Math.PI / 2 };

      // WHEN: converting to cartesian
      const result = cartesian(point);

      // THEN: should be at (0, 1)
      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(1, 10);
    });

    test('converts polar (r=5, t=atan2(4,3)) to cartesian correctly', () => {
      // GIVEN: a polar coordinate
      const point = { r: 5, t: Math.atan2(4, 3) };

      // WHEN: converting to cartesian
      const result = cartesian(point);

      // THEN: should be at (3, 4)
      expect(result.x).toBeCloseTo(3, 10);
      expect(result.y).toBeCloseTo(4, 10);
    });

    test('handles zero radius correctly', () => {
      // GIVEN: polar coordinate with zero radius
      const point = { r: 0, t: Math.PI / 4 };

      // WHEN: converting to cartesian
      const result = cartesian(point);

      // THEN: should be at origin
      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(0, 10);
    });
  });

  describe('polar-cartesian round trip', () => {
    test('conversions are reversible for positive x-axis', () => {
      // GIVEN: a cartesian point
      const original = { x: 5, y: 0 };

      // WHEN: converting to polar and back
      const result = cartesian(polar(original));

      // THEN: should match original
      expect(result.x).toBeCloseTo(original.x, 10);
      expect(result.y).toBeCloseTo(original.y, 10);
    });

    test('conversions are reversible for arbitrary point', () => {
      // GIVEN: an arbitrary cartesian point
      const original = { x: 3, y: 4 };

      // WHEN: converting to polar and back
      const result = cartesian(polar(original));

      // THEN: should match original
      expect(result.x).toBeCloseTo(original.x, 10);
      expect(result.y).toBeCloseTo(original.y, 10);
    });

    test('conversions are reversible for negative coordinates', () => {
      // GIVEN: a point with negative coordinates
      const original = { x: -7, y: -24 };

      // WHEN: converting to polar and back
      const result = cartesian(polar(original));

      // THEN: should match original
      expect(result.x).toBeCloseTo(original.x, 10);
      expect(result.y).toBeCloseTo(original.y, 10);
    });
  });

  describe('boundedInterval()', () => {
    test('constrains value below minimum', () => {
      // GIVEN: a value below the minimum
      const value = 5;
      const min = 10;
      const max = 20;

      // WHEN: applying bounds
      const result = boundedInterval(value, min, max);

      // THEN: should return minimum
      expect(result).toBe(10);
    });

    test('constrains value above maximum', () => {
      // GIVEN: a value above the maximum
      const value = 25;
      const min = 10;
      const max = 20;

      // WHEN: applying bounds
      const result = boundedInterval(value, min, max);

      // THEN: should return maximum
      expect(result).toBe(20);
    });

    test('keeps value within bounds', () => {
      // GIVEN: a value within bounds
      const value = 15;
      const min = 10;
      const max = 20;

      // WHEN: applying bounds
      const result = boundedInterval(value, min, max);

      // THEN: should return the value unchanged
      expect(result).toBe(15);
    });

    test('handles reversed min/max correctly', () => {
      // GIVEN: min and max in wrong order
      const value = 15;
      const min = 20;
      const max = 10;

      // WHEN: applying bounds
      const result = boundedInterval(value, min, max);

      // THEN: should still constrain correctly
      expect(result).toBe(15);
    });

    test('handles equal min and max', () => {
      // GIVEN: equal min and max
      const value = 15;
      const min = 12;
      const max = 12;

      // WHEN: applying bounds
      const result = boundedInterval(value, min, max);

      // THEN: should return the bound value
      expect(result).toBe(12);
    });
  });

  describe('boundedRing()', () => {
    test('constrains radius below minimum', () => {
      // GIVEN: a polar coordinate with radius below minimum
      const point = { r: 5, t: Math.PI / 4 };
      const r_min = 10;
      const r_max = 20;

      // WHEN: applying ring bounds
      const result = boundedRing(point, r_min, r_max);

      // THEN: should constrain radius to minimum
      expect(result.t).toBe(Math.PI / 4);
      expect(result.r).toBe(10);
    });

    test('constrains radius above maximum', () => {
      // GIVEN: a polar coordinate with radius above maximum
      const point = { r: 25, t: Math.PI / 4 };
      const r_min = 10;
      const r_max = 20;

      // WHEN: applying ring bounds
      const result = boundedRing(point, r_min, r_max);

      // THEN: should constrain radius to maximum
      expect(result.t).toBe(Math.PI / 4);
      expect(result.r).toBe(20);
    });

    test('keeps radius within bounds', () => {
      // GIVEN: a polar coordinate with radius within bounds
      const point = { r: 15, t: Math.PI / 4 };
      const r_min = 10;
      const r_max = 20;

      // WHEN: applying ring bounds
      const result = boundedRing(point, r_min, r_max);

      // THEN: should keep original values
      expect(result.t).toBe(Math.PI / 4);
      expect(result.r).toBe(15);
    });

    test('preserves angle', () => {
      // GIVEN: a polar coordinate with any radius
      const point = { r: 100, t: 2.5 };
      const r_min = 10;
      const r_max = 20;

      // WHEN: applying ring bounds
      const result = boundedRing(point, r_min, r_max);

      // THEN: angle should be preserved
      expect(result.t).toBe(2.5);
    });
  });

  describe('boundedBox()', () => {
    test('constrains x below minimum', () => {
      // GIVEN: a point with x below minimum
      const point = { x: 5, y: 15 };
      const min = { x: 10, y: 10 };
      const max = { x: 20, y: 20 };

      // WHEN: applying box bounds
      const result = boundedBox(point, min, max);

      // THEN: should constrain x to minimum
      expect(result.x).toBe(10);
      expect(result.y).toBe(15);
    });

    test('constrains y above maximum', () => {
      // GIVEN: a point with y above maximum
      const point = { x: 15, y: 25 };
      const min = { x: 10, y: 10 };
      const max = { x: 20, y: 20 };

      // WHEN: applying box bounds
      const result = boundedBox(point, min, max);

      // THEN: should constrain y to maximum
      expect(result.x).toBe(15);
      expect(result.y).toBe(20);
    });

    test('constrains both coordinates', () => {
      // GIVEN: a point outside box on both axes
      const point = { x: 5, y: 25 };
      const min = { x: 10, y: 10 };
      const max = { x: 20, y: 20 };

      // WHEN: applying box bounds
      const result = boundedBox(point, min, max);

      // THEN: should constrain both coordinates
      expect(result.x).toBe(10);
      expect(result.y).toBe(20);
    });

    test('keeps point within bounds', () => {
      // GIVEN: a point inside the box
      const point = { x: 15, y: 15 };
      const min = { x: 10, y: 10 };
      const max = { x: 20, y: 20 };

      // WHEN: applying box bounds
      const result = boundedBox(point, min, max);

      // THEN: should keep original coordinates
      expect(result.x).toBe(15);
      expect(result.y).toBe(15);
    });

    test('handles point at corner', () => {
      // GIVEN: a point at the corner
      const point = { x: 10, y: 20 };
      const min = { x: 10, y: 10 };
      const max = { x: 20, y: 20 };

      // WHEN: applying box bounds
      const result = boundedBox(point, min, max);

      // THEN: should keep corner coordinates
      expect(result.x).toBe(10);
      expect(result.y).toBe(20);
    });
  });
});
