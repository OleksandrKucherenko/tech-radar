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
 * Coordinate transformation utilities for the radar visualization.
 * These are pure functions with no side effects or external dependencies.
 */

/**
 * Converts cartesian coordinates to polar coordinates.
 * @param {Object} cartesian - The cartesian coordinate {x, y}
 * @param {number} cartesian.x - The x coordinate
 * @param {number} cartesian.y - The y coordinate
 * @returns {Object} Polar coordinate {t: angle, r: radius}
 */
export function polar(cartesian) {
  const { x, y } = cartesian;
  return {
    t: Math.atan2(y, x),
    r: Math.sqrt(x * x + y * y)
  };
}

/**
 * Converts polar coordinates to cartesian coordinates.
 * @param {Object} polar - The polar coordinate {r, t}
 * @param {number} polar.r - The radius
 * @param {number} polar.t - The angle in radians
 * @returns {Object} Cartesian coordinate {x, y}
 */
export function cartesian(polar) {
  const { r, t } = polar;
  return {
    x: r * Math.cos(t),
    y: r * Math.sin(t)
  };
}

/**
 * Constrains a value to be within a specified interval.
 * @param {number} value - The value to constrain
 * @param {number} min - The minimum bound
 * @param {number} max - The maximum bound
 * @returns {number} The constrained value
 */
export function boundedInterval(value, min, max) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.min(Math.max(value, low), high);
}

/**
 * Constrains a polar coordinate to be within a ring (between two radii).
 * @param {Object} polar - The polar coordinate {r, t}
 * @param {number} r_min - The minimum radius
 * @param {number} r_max - The maximum radius
 * @returns {Object} Bounded polar coordinate {t, r}
 */
export function boundedRing(polar, r_min, r_max) {
  return {
    t: polar.t,
    r: boundedInterval(polar.r, r_min, r_max)
  };
}

/**
 * Constrains a point to be within a rectangular box.
 * @param {Object} point - The point {x, y}
 * @param {Object} min - The minimum bounds {x, y}
 * @param {Object} max - The maximum bounds {x, y}
 * @returns {Object} Bounded point {x, y}
 */
export function boundedBox(point, min, max) {
  return {
    x: boundedInterval(point.x, min.x, max.x),
    y: boundedInterval(point.y, min.y, max.y)
  };
}
