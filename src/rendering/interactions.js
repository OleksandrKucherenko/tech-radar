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

import { translate } from './helpers.js';

/**
 * Creates and appends the tooltip bubble element to the radar.
 *
 * @param {Object} radarSelection - D3 selection of the main radar group
 * @param {string} fontFamily - Font family for bubble text
 * @returns {Object} D3 selection of the bubble element
 */
export function createBubble(radarSelection, fontFamily) {
  const bubble = radarSelection.append("g")
    .attr("id", "bubble")
    .attr("x", 0)
    .attr("y", 0)
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("user-select", "none");

  bubble.append("rect")
    .attr("rx", 4)
    .attr("ry", 4)
    .style("fill", "#333");

  bubble.append("text")
    .style("font-family", fontFamily)
    .style("font-size", "10px")
    .style("fill", "#fff");

  bubble.append("path")
    .attr("d", "M 0,0 10,0 5,8 z")
    .style("fill", "#333");

  return bubble;
}

/**
 * Shows the tooltip bubble for an entry.
 * Uses rendered (clamped) position for stable tooltip positioning.
 *
 * @param {Object} d - Entry data object
 * @param {Object} config - Configuration object
 */
export function showBubble(d, config) {
  if (d.active || config.print_layout) {
    const d3 = window.d3; // Access global d3
    const tooltip = d3.select("#bubble text")
      .text(d.label);
    const bbox = tooltip.node().getBBox();

    // Use rendered (clamped) position for stable tooltip positioning
    const x = d.rendered_x !== undefined ? d.rendered_x : d.x;
    const y = d.rendered_y !== undefined ? d.rendered_y : d.y;

    d3.select("#bubble")
      .attr("transform", translate(x - bbox.width / 2, y - 16))
      .style("opacity", 0.8);

    d3.select("#bubble rect")
      .attr("x", -5)
      .attr("y", -bbox.height)
      .attr("width", bbox.width + 10)
      .attr("height", bbox.height + 4);

    d3.select("#bubble path")
      .attr("transform", translate(bbox.width / 2 - 5, 3));
  }
}

/**
 * Hides the tooltip bubble.
 */
export function hideBubble() {
  const d3 = window.d3; // Access global d3
  d3.select("#bubble")
    .attr("transform", translate(0, 0))
    .style("opacity", 0);
}

/**
 * Highlights a legend item by adding a CSS class.
 *
 * @param {Object} d - Entry data object with id property
 */
export function highlightLegendItem(d) {
  const legendItem = document.getElementById("legendItem" + d.id);
  if (legendItem) {
    legendItem.classList.add('legend-highlight');
  }
}

/**
 * Removes highlight from a legend item.
 *
 * @param {Object} d - Entry data object with id property
 */
export function unhighlightLegendItem(d) {
  const legendItem = document.getElementById("legendItem" + d.id);
  if (legendItem) {
    legendItem.classList.remove('legend-highlight');
  }
}

/**
 * Creates interaction event handlers for blips.
 * Returns an object with mouseover and mouseout handlers.
 *
 * @param {Object} config - Configuration object
 * @returns {Object} Object with mouseover and mouseout handler functions
 */
export function createBlipInteractions(config) {
  return {
    mouseover: function(event, d) {
      showBubble(d, config);
      highlightLegendItem(d);
    },
    mouseout: function(event, d) {
      hideBubble();
      unhighlightLegendItem(d);
    }
  };
}
