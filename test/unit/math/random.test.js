// Test suite for seeded random number generator
import { describe, expect, test } from 'bun:test';
import { SeededRandom } from '../../../src/math/random.js';

describe('SeededRandom', () => {
  describe('constructor', () => {
    test('creates instance with default seed 42', () => {
      // WHEN: creating a new instance without seed
      const rng = new SeededRandom();

      // THEN: should use default seed 42
      expect(rng.seed).toBe(42);
      expect(rng.initialSeed).toBe(42);
    });

    test('creates instance with custom seed', () => {
      // WHEN: creating a new instance with seed 123
      const rng = new SeededRandom(123);

      // THEN: should use the provided seed
      expect(rng.seed).toBe(123);
      expect(rng.initialSeed).toBe(123);
    });
  });

  describe('next()', () => {
    test('generates deterministic sequence', () => {
      // GIVEN: two RNGs with the same seed
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      // WHEN: generating 10 numbers from each
      const sequence1 = Array.from({ length: 10 }, () => rng1.next());
      const sequence2 = Array.from({ length: 10 }, () => rng2.next());

      // THEN: sequences should be identical
      expect(sequence1).toEqual(sequence2);
    });

    test('generates numbers between 0 and 1', () => {
      // GIVEN: an RNG
      const rng = new SeededRandom(42);

      // WHEN: generating 100 numbers
      const numbers = Array.from({ length: 100 }, () => rng.next());

      // THEN: all should be in range [0, 1)
      numbers.forEach(num => {
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(1);
      });
    });

    test('different seeds produce different sequences', () => {
      // GIVEN: two RNGs with different seeds
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(99);

      // WHEN: generating sequences
      const sequence1 = Array.from({ length: 10 }, () => rng1.next());
      const sequence2 = Array.from({ length: 10 }, () => rng2.next());

      // THEN: sequences should be different
      expect(sequence1).not.toEqual(sequence2);
    });

    test('advances seed with each call', () => {
      // GIVEN: an RNG with seed 42
      const rng = new SeededRandom(42);

      // WHEN: calling next()
      const initialSeed = rng.seed;
      rng.next();

      // THEN: seed should advance
      expect(rng.seed).toBe(initialSeed + 1);
    });

    test('produces expected first value for seed 42', () => {
      // GIVEN: an RNG with default seed 42
      const rng = new SeededRandom(42);

      // WHEN: generating first number
      const first = rng.next();

      // THEN: should match expected value (regression test)
      // This is the same algorithm used in radar.js
      const expected = Math.sin(42) * 10000;
      const expectedValue = expected - Math.floor(expected);
      expect(first).toBeCloseTo(expectedValue, 10);
    });
  });

  describe('between()', () => {
    test('generates numbers in specified range', () => {
      // GIVEN: an RNG
      const rng = new SeededRandom(42);

      // WHEN: generating 100 numbers between 10 and 20
      const numbers = Array.from({ length: 100 }, () => rng.between(10, 20));

      // THEN: all should be in range [10, 20)
      numbers.forEach(num => {
        expect(num).toBeGreaterThanOrEqual(10);
        expect(num).toBeLessThan(20);
      });
    });

    test('produces deterministic sequence', () => {
      // GIVEN: two RNGs with the same seed
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      // WHEN: generating sequences with same range
      const sequence1 = Array.from({ length: 10 }, () => rng1.between(5, 15));
      const sequence2 = Array.from({ length: 10 }, () => rng2.between(5, 15));

      // THEN: sequences should be identical
      expect(sequence1).toEqual(sequence2);
    });

    test('handles negative ranges', () => {
      // GIVEN: an RNG
      const rng = new SeededRandom(42);

      // WHEN: generating numbers between -20 and -10
      const numbers = Array.from({ length: 100 }, () => rng.between(-20, -10));

      // THEN: all should be in range [-20, -10)
      numbers.forEach(num => {
        expect(num).toBeGreaterThanOrEqual(-20);
        expect(num).toBeLessThan(-10);
      });
    });

    test('handles range crossing zero', () => {
      // GIVEN: an RNG
      const rng = new SeededRandom(42);

      // WHEN: generating numbers between -5 and 5
      const numbers = Array.from({ length: 100 }, () => rng.between(-5, 5));

      // THEN: all should be in range [-5, 5)
      numbers.forEach(num => {
        expect(num).toBeGreaterThanOrEqual(-5);
        expect(num).toBeLessThan(5);
      });
    });

    test('handles zero-width range', () => {
      // GIVEN: an RNG
      const rng = new SeededRandom(42);

      // WHEN: generating numbers with min === max
      const numbers = Array.from({ length: 10 }, () => rng.between(5, 5));

      // THEN: all should be exactly 5
      numbers.forEach(num => {
        expect(num).toBe(5);
      });
    });
  });

  describe('normalBetween()', () => {
    test('generates numbers in specified range', () => {
      // GIVEN: an RNG
      const rng = new SeededRandom(42);

      // WHEN: generating 100 numbers between 10 and 20
      const numbers = Array.from({ length: 100 }, () => rng.normalBetween(10, 20));

      // THEN: all should be in range [10, 20)
      numbers.forEach(num => {
        expect(num).toBeGreaterThanOrEqual(10);
        expect(num).toBeLessThan(20);
      });
    });

    test('produces deterministic sequence', () => {
      // GIVEN: two RNGs with the same seed
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      // WHEN: generating sequences with same range
      const sequence1 = Array.from({ length: 10 }, () => rng1.normalBetween(5, 15));
      const sequence2 = Array.from({ length: 10 }, () => rng2.normalBetween(5, 15));

      // THEN: sequences should be identical
      expect(sequence1).toEqual(sequence2);
    });

    test('distribution differs from uniform distribution', () => {
      // GIVEN: two RNGs with the same seed
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      // WHEN: generating uniform and normal distributions
      const uniform = Array.from({ length: 100 }, () => rng1.between(0, 100));
      const normal = Array.from({ length: 100 }, () => rng2.normalBetween(0, 100));

      // THEN: the distributions should be different
      // (normal distribution should cluster more toward center)
      expect(uniform).not.toEqual(normal);
    });

    test('advances seed by 2 with each call', () => {
      // GIVEN: an RNG with seed 42
      const rng = new SeededRandom(42);

      // WHEN: calling normalBetween()
      const initialSeed = rng.seed;
      rng.normalBetween(0, 100);

      // THEN: seed should advance by 2 (uses next() twice)
      expect(rng.seed).toBe(initialSeed + 2);
    });
  });

  describe('reset()', () => {
    test('resets to initial seed when called without argument', () => {
      // GIVEN: an RNG that has generated some numbers
      const rng = new SeededRandom(42);
      Array.from({ length: 10 }, () => rng.next());

      // WHEN: resetting without argument
      rng.reset();

      // THEN: seed should be back to initial value
      expect(rng.seed).toBe(42);
    });

    test('resets to specified seed', () => {
      // GIVEN: an RNG with seed 42
      const rng = new SeededRandom(42);
      Array.from({ length: 10 }, () => rng.next());

      // WHEN: resetting to seed 99
      rng.reset(99);

      // THEN: seed should be 99
      expect(rng.seed).toBe(99);
    });

    test('produces same sequence after reset', () => {
      // GIVEN: an RNG
      const rng = new SeededRandom(42);

      // WHEN: generating sequence, resetting, and generating again
      const sequence1 = Array.from({ length: 10 }, () => rng.next());
      rng.reset();
      const sequence2 = Array.from({ length: 10 }, () => rng.next());

      // THEN: sequences should be identical
      expect(sequence1).toEqual(sequence2);
    });

    test('reset to different seed produces different sequence', () => {
      // GIVEN: an RNG
      const rng = new SeededRandom(42);

      // WHEN: generating sequence, resetting to different seed, and generating again
      const sequence1 = Array.from({ length: 10 }, () => rng.next());
      rng.reset(99);
      const sequence2 = Array.from({ length: 10 }, () => rng.next());

      // THEN: sequences should be different
      expect(sequence1).not.toEqual(sequence2);
    });
  });

  describe('reproducibility (regression tests)', () => {
    test('matches original radar.js random() implementation', () => {
      // GIVEN: the original radar.js random implementation
      let seed = 42;
      function originalRandom() {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      }

      // AND: our SeededRandom implementation
      const rng = new SeededRandom(42);

      // WHEN: generating 100 numbers from both
      const original = Array.from({ length: 100 }, () => originalRandom());
      const ours = Array.from({ length: 100 }, () => rng.next());

      // THEN: sequences should be identical
      for (let i = 0; i < 100; i++) {
        expect(ours[i]).toBeCloseTo(original[i], 10);
      }
    });

    test('matches original radar.js random_between() implementation', () => {
      // GIVEN: the original radar.js implementations
      let seed = 42;
      function originalRandom() {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      }
      function originalRandomBetween(min, max) {
        return min + originalRandom() * (max - min);
      }

      // AND: our SeededRandom implementation
      const rng = new SeededRandom(42);

      // WHEN: generating 100 numbers from both
      const original = Array.from({ length: 100 }, () => originalRandomBetween(10, 50));
      const ours = Array.from({ length: 100 }, () => rng.between(10, 50));

      // THEN: sequences should be identical
      for (let i = 0; i < 100; i++) {
        expect(ours[i]).toBeCloseTo(original[i], 10);
      }
    });

    test('matches original radar.js normal_between() implementation', () => {
      // GIVEN: the original radar.js implementations
      let seed = 42;
      function originalRandom() {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      }
      function originalNormalBetween(min, max) {
        return min + (originalRandom() + originalRandom()) * 0.5 * (max - min);
      }

      // AND: our SeededRandom implementation
      const rng = new SeededRandom(42);

      // WHEN: generating 100 numbers from both
      const original = Array.from({ length: 100 }, () => originalNormalBetween(10, 50));
      const ours = Array.from({ length: 100 }, () => rng.normalBetween(10, 50));

      // THEN: sequences should be identical
      for (let i = 0; i < 100; i++) {
        expect(ours[i]).toBeCloseTo(original[i], 10);
      }
    });
  });
});
