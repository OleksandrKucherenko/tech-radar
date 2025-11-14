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
 * Generates SVG transform translate string.
 *
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {string} SVG transform string
 */
export function translate(x, y) {
  return "translate(" + x + "," + y + ")";
}

/**
 * Generates SVG viewBox attribute for a specific quadrant zoom.
 *
 * @param {number} quadrantIndex - Index of the quadrant to zoom
 * @param {Array<Object>} quadrants - Array of quadrant configurations
 * @param {Array<Object>} rings - Array of ring configurations
 * @returns {string} SVG viewBox attribute value
 */
export function viewbox(quadrantIndex, quadrants, rings) {
  const outer_radius = rings[rings.length - 1].radius;
  const padding = 20;
  return [
    Math.max(0, quadrants[quadrantIndex].factor_x * outer_radius) - (outer_radius + padding),
    Math.max(0, quadrants[quadrantIndex].factor_y * outer_radius) - (outer_radius + padding),
    outer_radius + 2 * padding,
    outer_radius + 2 * padding
  ].join(" ");
}

/**
 * Calculates legend positioning offsets for all quadrants.
 * Distributes quadrant legends in left and right columns.
 *
 * @param {number} numQuadrants - Number of quadrants (2-8)
 * @param {number} outerRadius - Outer radius of the radar
 * @param {Object} config - Configuration object
 * @returns {Array<Object>} Array of offset objects with x, y coordinates
 */
export function computeLegendOffsets(numQuadrants, outerRadius, config) {
  if (config.legend_offset) {
    return config.legend_offset;
  }

  const offsets = new Array(numQuadrants);
  const legend_overlap = outerRadius * 0.08;
  const left_x = -outerRadius - config.legend_column_width + legend_overlap;
  const right_x = outerRadius - legend_overlap;

  const left_column = [];
  const right_column = [];

  // Alternate between right and left columns
  for (let i = 0; i < numQuadrants; i++) {
    const targetColumn = (i % 2 === 0) ? right_column : left_column;
    targetColumn.push(i);
  }

  const baseY = -outerRadius + 80;
  const verticalAvailable = (2 * outerRadius) - 160;

  function stepFor(count) {
    if (count <= 1) {
      return 0;
    }
    return Math.max(config.legend_vertical_spacing, verticalAvailable / (count - 1));
  }

  function assignOffsets(column, xPosition) {
    const step = stepFor(column.length);
    for (let idx = 0; idx < column.length; idx++) {
      const qIndex = column[idx];
      offsets[qIndex] = {
        x: xPosition,
        y: baseY + idx * step
      };
    }
  }

  assignOffsets(left_column, left_x);
  assignOffsets(right_column, right_x);

  return offsets;
}

/**
 * Creates or retrieves the layout structure wrapper around the SVG.
 * Ensures the radar is wrapped in a flex container with legend columns.
 *
 * @param {Object} svgSelection - D3 selection of the SVG element
 * @returns {Object} D3 selection of the layout wrapper
 */
export function ensureLayoutStructure(svgSelection) {
  const existing = svgSelection.node().closest('.radar-layout');
  if (existing) {
    return svgSelection.select(function() { return existing; });
  }

  const svgNode = svgSelection.node();
  const parent = svgNode.parentNode;
  const wrapper = document.createElement('div');
  wrapper.className = 'radar-layout';

  const leftColumn = document.createElement('div');
  leftColumn.className = 'radar-legend-column left';

  const svgContainer = document.createElement('div');
  svgContainer.className = 'radar-svg-container';

  const rightColumn = document.createElement('div');
  rightColumn.className = 'radar-legend-column right';

  parent.insertBefore(wrapper, svgNode);
  svgContainer.appendChild(svgNode);
  wrapper.appendChild(leftColumn);
  wrapper.appendChild(svgContainer);
  wrapper.appendChild(rightColumn);

  return svgSelection.select(function() { return wrapper; });
}

/**
 * Generates the legend transform for positioning legend items.
 * Legacy function maintained for compatibility.
 *
 * @param {number} quadrant - Quadrant index
 * @param {number} ring - Ring index
 * @param {number} legendColumnWidth - Width of legend columns
 * @param {number} index - Entry index within segment
 * @returns {string} SVG transform string
 */
export function legend_transform(quadrant, ring, legendColumnWidth, index) {
  return translate(
    legendColumnWidth * Math.round(quadrant / 2),
    ring * legendColumnWidth + index * 12
  );
}
