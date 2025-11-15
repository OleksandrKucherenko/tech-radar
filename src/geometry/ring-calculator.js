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
 * Base pattern for ring radii (4 rings).
 * These values have been tuned for optimal visual spacing.
 */
const BASE_PATTERN = [130, 220, 310, 400];

/**
 * Maximum base radius (outermost ring in base pattern).
 */
const MAX_BASE_RADIUS = 400;

/**
 * Generates ring configuration for the radar visualization.
 * Scales the base 4-ring pattern proportionally to support 4-8 rings.
 *
 * For 4 rings: Uses BASE_PATTERN directly, then scales to targetOuterRadius.
 * For other counts: Interpolates between BASE_PATTERN values to create smooth spacing.
 *
 * @param {number} numRings - Number of rings (4-8)
 * @param {number} targetOuterRadius - Desired outer radius for the largest ring
 * @returns {Array<Object>} Array of ring objects with radius property
 */
export function generateRings(numRings, targetOuterRadius) {
  const ringTemplate = [];

  if (numRings === 4) {
    // Use base pattern directly for 4 rings
    for (let i = 0; i < 4; i++) {
      ringTemplate.push(BASE_PATTERN[i]);
    }
  } else {
    // Interpolate pattern for other ring counts
    for (let i = 0; i < numRings; i++) {
      // Map ring index to position in base pattern (0-3 range)
      const patternPosition = (i / (numRings - 1)) * 3;
      const patternIndex = Math.floor(patternPosition);
      const fraction = patternPosition - patternIndex;

      let radius;
      if (patternIndex >= 3) {
        // Beyond base pattern, use max radius
        radius = MAX_BASE_RADIUS;
      } else {
        // Interpolate between pattern values
        radius = BASE_PATTERN[patternIndex] + (BASE_PATTERN[patternIndex + 1] - BASE_PATTERN[patternIndex]) * fraction;
      }

      ringTemplate.push(radius);
    }
  }

  // Scale all radii to match target outer radius
  const radiusScale = targetOuterRadius / MAX_BASE_RADIUS;
  return ringTemplate.map(r => ({ radius: Math.max(10, Math.round(r * radiusScale)) }));
}
