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
 * Generates quadrant configuration for the radar visualization.
 * Quadrants are evenly distributed around the circle, with special handling for 2 quadrants.
 *
 * @param {number} numQuadrants - Number of quadrants (2-8)
 * @returns {Array<Object>} Array of quadrant objects with radial bounds and direction factors
 */
export function generateQuadrants(numQuadrants) {
  const quadrants = [];
  const anglePerQuadrant = 2 / numQuadrants; // in PI multiples
  const rotationOffset = (numQuadrants === 2) ? -0.5 : 0; // rotate to vertical split for 2 quadrants

  for (let i = 0; i < numQuadrants; i++) {
    const startAngle = -1 + (i * anglePerQuadrant) + rotationOffset;
    const endAngle = -1 + ((i + 1) * anglePerQuadrant) + rotationOffset;
    const midAngle = (-Math.PI + (i + 0.5) * anglePerQuadrant * Math.PI) + (rotationOffset * Math.PI);

    quadrants.push({
      radial_min: startAngle,  // in PI multiples
      radial_max: endAngle,    // in PI multiples
      factor_x: Math.cos(midAngle),  // x direction for positioning
      factor_y: Math.sin(midAngle)   // y direction for positioning
    });
  }

  return quadrants;
}

/**
 * Computes the Cartesian bounding box for a quadrant segment.
 * Determines min/max x,y coordinates that fully contain the angular segment.
 *
 * @param {number} startAngle - Starting angle in radians
 * @param {number} endAngle - Ending angle in radians
 * @param {number} radius - Outer radius of the segment
 * @returns {Object} Bounding box with min and max {x, y} coordinates
 */
export function computeQuadrantBounds(startAngle, endAngle, radius) {
  const twoPi = 2 * Math.PI;
  let normalizedStart = startAngle;
  let normalizedEnd = endAngle;

  // Ensure end angle is after start angle
  while (normalizedEnd <= normalizedStart) {
    normalizedEnd += twoPi;
  }

  // Check for intersections with cardinal axes
  const axisAngles = [
    -Math.PI,           // left (-x)
    -Math.PI / 2,       // bottom (-y)
    0,                  // right (+x)
    Math.PI / 2,        // top (+y)
    Math.PI,            // left (-x, wrapped)
    (3 * Math.PI) / 2,  // bottom (-y, wrapped)
    2 * Math.PI         // right (+x, wrapped)
  ];

  // Candidate angles include segment endpoints and axis intersections
  const candidates = [normalizedStart, normalizedEnd];

  axisAngles.forEach(function (axisAngle) {
    let candidate = axisAngle;
    // Bring axis angle into the [normalizedStart, normalizedEnd] range
    while (candidate < normalizedStart) {
      candidate += twoPi;
    }
    if (candidate <= normalizedEnd) {
      candidates.push(candidate);
    }
  });

  // Find min/max x,y from all candidate angles
  let min_x = Infinity;
  let max_x = -Infinity;
  let min_y = Infinity;
  let max_y = -Infinity;

  candidates.forEach(function (angle) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    min_x = Math.min(min_x, cosA);
    max_x = Math.max(max_x, cosA);
    min_y = Math.min(min_y, sinA);
    max_y = Math.max(max_y, sinA);
  });

  // Apply padding for safety margin
  const padding = 20;
  return {
    min: {
      x: (min_x * radius) - padding,
      y: (min_y * radius) - padding
    },
    max: {
      x: (max_x * radius) + padding,
      y: (max_y * radius) + padding
    }
  };
}

/**
 * Generates quadrant ordering for legend display.
 * For 4 quadrants, uses traditional ordering [2,3,1,0].
 * For other counts, starts from bottom-left and goes counter-clockwise.
 *
 * @param {number} numQuadrants - Number of quadrants (2-8)
 * @returns {Array<number>} Array of quadrant indices in display order
 */
export function generateQuadrantOrder(numQuadrants) {
  if (numQuadrants === 4) {
    return [2, 3, 1, 0]; // Original ordering for 4 quadrants
  }

  // For other counts, start from bottom-left and go counter-clockwise
  const quadrantOrder = [];
  const startIndex = Math.floor(numQuadrants / 2);
  for (let i = 0; i < numQuadrants; i++) {
    quadrantOrder.push((startIndex + i) % numQuadrants);
  }
  return quadrantOrder;
}
