// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

/**
 * Blip Renderer Module
 *
 * Phase 4 Refactoring: Extracted blip rendering logic
 *
 * Renders technology entry markers ("blips") on the radar visualization.
 * Each blip represents a technology entry and displays:
 * - Shape based on movement status (triangle up/down, star, or circle)
 * - Text label (ID in print mode, first letter otherwise)
 * - Interactive tooltips and highlights
 * - Optional clickable links
 */

import { translate } from './helpers.js';

/**
 * Renders blips (technology entry markers) on the radar.
 *
 * @param {d3.Selection} rinkSelection - D3 selection of the rink layer (entries container)
 * @param {Array} entries - Array of processed technology entries
 * @param {Object} config - Visualization configuration
 * @param {Function} showBubble - Function to show tooltip bubble
 * @param {Function} hideBubble - Function to hide tooltip bubble
 * @param {Function} highlightLegendItem - Function to highlight legend item
 * @param {Function} unhighlightLegendItem - Function to unhighlight legend item
 * @returns {d3.Selection} D3 selection of blip groups
 */
export function renderBlips(
  rinkSelection,
  entries,
  config,
  showBubble,
  hideBubble,
  highlightLegendItem,
  unhighlightLegendItem
) {
  const d3 = window.d3;

  // Create blip groups with data binding
  const blips = rinkSelection
    .selectAll('.blip')
    .data(entries)
    .enter()
    .append('g')
    .attr('class', 'blip')
    .attr('transform', d => translate(d.x, d.y))
    .on('mouseover', (_event, d) => {
      showBubble(d, config);
      highlightLegendItem(d);
    })
    .on('mouseout', (_event, d) => {
      hideBubble();
      unhighlightLegendItem(d);
    });

  // Configure each blip
  blips.each(function (d) {
    const blip = d3.select(this);

    // Add link wrapper if entry is active and has a link
    let blipContainer = blip;
    if (d.active && Object.hasOwn(d, 'link') && d.link) {
      blipContainer = blip.append('a').attr('xlink:href', d.link);

      if (config.links_in_new_tabs) {
        blipContainer.attr('target', '_blank');
      }
    }

    // Render blip shape based on movement status
    renderBlipShape(blipContainer, d);

    // Render blip text label
    renderBlipText(blipContainer, d, config);
  });

  return blips;
}

/**
 * Renders the shape of a blip based on its movement status.
 *
 * Movement indicators:
 * - moved = 1: Triangle pointing up (moved in/higher priority)
 * - moved = -1: Triangle pointing down (moved out/lower priority)
 * - moved = 2: Star (new entry)
 * - moved = 0: Circle (no change)
 *
 * @param {d3.Selection} container - D3 selection to append shape to
 * @param {Object} entry - Technology entry data
 */
function renderBlipShape(container, entry) {
  const d3 = window.d3;

  if (entry.moved === 1) {
    // Triangle pointing up - moved in
    container.append('path').attr('d', 'M -11,5 11,5 0,-13 z').style('fill', entry.color);
  } else if (entry.moved === -1) {
    // Triangle pointing down - moved out
    container.append('path').attr('d', 'M -11,-5 11,-5 0,13 z').style('fill', entry.color);
  } else if (entry.moved === 2) {
    // Star - new entry
    container.append('path').attr('d', d3.symbol().type(d3.symbolStar).size(200)).style('fill', entry.color);
  } else {
    // Circle - no change
    container.append('circle').attr('r', 9).attr('fill', entry.color);
  }
}

/**
 * Renders text label on a blip.
 *
 * In print mode: Shows entry ID number
 * In interactive mode: Shows first letter of label (for active entries only)
 *
 * @param {d3.Selection} container - D3 selection to append text to
 * @param {Object} entry - Technology entry data
 * @param {Object} config - Visualization configuration
 */
function renderBlipText(container, entry, config) {
  if (entry.active || config.print_layout) {
    const blipText = config.print_layout ? entry.id : entry.label.match(/[a-z]/i);

    container
      .append('text')
      .text(blipText)
      .attr('y', 3)
      .attr('text-anchor', 'middle')
      .style('fill', '#fff')
      .style('font-family', config.font_family)
      .style('font-size', _d => (blipText.length > 2 ? '8px' : '9px'))
      .style('pointer-events', 'none')
      .style('user-select', 'none');
  }
}
