// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/**
 * Seeded random number generator for reproducible randomness.
 * Uses a simple sine-based algorithm for deterministic output.
 *
 * Source: https://stackoverflow.com/questions/521295
 */
export class SeededRandom {
  /**
   * Creates a new seeded random number generator.
   * @param {number} seed - The initial seed value (default: 42)
   */
  constructor(seed = 42) {
    this.seed = seed;
    this.initialSeed = seed;
  }

  /**
   * Generates the next random number in the sequence.
   * @returns {number} A pseudo-random number between 0 and 1
   */
  next() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Generates a random number between min and max.
   * @param {number} min - The minimum value (inclusive)
   * @param {number} max - The maximum value (exclusive)
   * @returns {number} A random number in the range [min, max)
   */
  between(min, max) {
    return min + this.next() * (max - min);
  }

  /**
   * Generates a normally distributed random number between min and max.
   * Uses the average of two random numbers to create a crude normal distribution.
   * @param {number} min - The minimum value (inclusive)
   * @param {number} max - The maximum value (exclusive)
   * @returns {number} A normally distributed random number in the range [min, max)
   */
  normalBetween(min, max) {
    return min + (this.next() + this.next()) * 0.5 * (max - min);
  }

  /**
   * Resets the random number generator to a specific seed.
   * @param {number} seed - The seed value to reset to (defaults to initial seed)
   */
  reset(seed) {
    this.seed = seed !== undefined ? seed : this.initialSeed;
  }
}
