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

import { boundedBox, boundedInterval, cartesian, polar } from '../math/coordinates.js';
import { computeQuadrantBounds } from './quadrant-calculator.js';

/**
 * Creates a segment object for positioning entries within a specific quadrant and ring.
 * A segment defines the angular and radial bounds for entry placement, with padding.
 *
 * @param {number} quadrantIndex - Index of the quadrant (0-based)
 * @param {number} ringIndex - Index of the ring (0-based)
 * @param {Array<Object>} quadrants - Array of quadrant configurations
 * @param {Array<Object>} rings - Array of ring configurations with radius
 * @param {Object} config - Configuration object with padding settings
 * @param {Function} randomBetween - Random number generator function (min, max) => number
 * @returns {Object} Segment object with clip and random functions
 */
export function createSegment(quadrantIndex, ringIndex, quadrants, rings, config, randomBetween) {
  const min_angle = quadrants[quadrantIndex].radial_min * Math.PI;
  const max_angle = quadrants[quadrantIndex].radial_max * Math.PI;
  const base_inner_radius = ringIndex === 0 ? 30 : rings[ringIndex - 1].radius;
  const base_outer_radius = rings[ringIndex].radius;

  // Apply radial padding
  let inner_radius = base_inner_radius + config.segment_radial_padding;
  let outer_radius = base_outer_radius - config.segment_radial_padding;

  // Guard against collapsed segments (outer <= inner)
  if (outer_radius <= inner_radius) {
    const midpoint = (base_inner_radius + base_outer_radius) / 2;
    inner_radius = Math.max(0, midpoint - 1);
    outer_radius = midpoint + 1;
  }

  // Apply angular padding (scaled by ring size to maintain visual consistency)
  const ring_center = (inner_radius + outer_radius) / 2;
  let angular_padding = config.segment_angular_padding / Math.max(ring_center, 1);
  const angular_limit = Math.max(0, (max_angle - min_angle) / 2 - 0.01);
  angular_padding = Math.min(angular_padding, angular_limit);

  let angle_min = min_angle + angular_padding;
  let angle_max = max_angle - angular_padding;

  // Guard against collapsed angles
  if (angle_max <= angle_min) {
    angle_min = min_angle;
    angle_max = max_angle;
  }

  // Calculate bounding box for this specific segment (not the full quadrant)
  // This ensures entries are clipped to their actual segment boundaries
  const segment_bounds = computeQuadrantBounds(angle_min, angle_max, outer_radius);
  const cartesian_min = segment_bounds.min;
  const cartesian_max = segment_bounds.max;

  /**
   * Clamps a point to stay within segment boundaries.
   * Uses both Cartesian (bounding box) and polar (angular/radial) constraints.
   *
   * @param {Object} point - Point with x, y coordinates
   * @returns {Object} Clamped point with x, y coordinates
   */
  function clampPoint(point) {
    // First apply Cartesian bounding box
    const c = boundedBox(point, cartesian_min, cartesian_max);
    // Then apply polar constraints (angle and radius)
    const p = polar(c);
    p.r = boundedInterval(p.r, inner_radius, outer_radius);
    p.t = boundedInterval(p.t, angle_min, angle_max);
    return cartesian(p);
  }

  /**
   * Clamps a point and updates the original object in place.
   *
   * @param {Object} d - Data object with x, y properties
   * @returns {Object} Clamped point coordinates
   */
  function clampAndAssign(d) {
    const clipped = clampPoint({ x: d.x, y: d.y });
    d.x = clipped.x;
    d.y = clipped.y;
    return clipped;
  }

  return {
    /**
     * Clips the x-coordinate of an entry to stay within segment bounds.
     * @param {Object} d - Data object with x, y properties
     * @returns {number} Clipped x-coordinate
     */
    clipx: d => {
      const clipped = clampAndAssign(d);
      return clipped.x;
    },

    /**
     * Clips the y-coordinate of an entry to stay within segment bounds.
     * @param {Object} d - Data object with x, y properties
     * @returns {number} Clipped y-coordinate
     */
    clipy: d => {
      const clipped = clampAndAssign(d);
      return clipped.y;
    },

    /**
     * Clips both coordinates of an entry to stay within segment bounds.
     * Single clip operation that doesn't double-clip.
     * @param {Object} d - Data object with x, y properties
     * @returns {Object} Clipped point with x, y coordinates
     */
    clip: d => {
      const clipped = clampPoint({ x: d.x, y: d.y });
      d.x = clipped.x;
      d.y = clipped.y;
      return clipped;
    },

    /**
     * Generates a random point within the segment bounds.
     * @returns {Object} Random point with x, y coordinates
     */
    random: () =>
      cartesian({
        t: randomBetween(angle_min, angle_max),
        r: randomBetween(inner_radius, outer_radius),
      }),
  };
}
