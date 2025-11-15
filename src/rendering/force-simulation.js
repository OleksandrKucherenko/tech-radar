// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

/**
 * Force Simulation Module
 *
 * Phase 4 Refactoring: Extracted D3 force simulation logic
 *
 * Handles blip positioning and collision avoidance using D3's force simulation.
 * The simulation prevents blips from overlapping while keeping them constrained
 * within their assigned radar segments.
 */

import { translate } from './helpers.js';

/**
 * Creates and configures the tick callback for force simulation.
 *
 * The tick callback is called on each iteration of the force simulation and:
 * - Clips blip positions to keep them within their segment bounds
 * - Updates blip transforms to reflect new positions
 * - Stores rendered positions for stable tooltip placement
 * - Updates debug collision circles if debug mode is enabled
 *
 * @param {d3.Selection} blipsSelection - D3 selection of blip groups
 * @param {Object} config - Visualization configuration
 * @returns {Function} Tick callback function
 */
export function createTickCallback(blipsSelection, config) {
  const d3 = window.d3;

  return function ticked() {
    // Update blip positions, ensuring they stay within segment bounds
    blipsSelection.attr('transform', d => {
      // Clip position to segment boundaries
      const clipped = d.segment.clip(d);

      // Store rendered position for stable tooltip positioning
      // This prevents tooltips from jumping when blips move during simulation
      d.rendered_x = clipped.x;
      d.rendered_y = clipped.y;

      return translate(clipped.x, clipped.y);
    });

    // Update debug visualizations if enabled
    if (config.debug_geometry) {
      d3.select('#debug-collision-radii')
        .selectAll('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    }
  };
}

/**
 * Configures and runs the D3 force simulation for blip positioning.
 *
 * The simulation uses collision detection to prevent blips from overlapping,
 * while the tick callback ensures blips stay within their segment bounds.
 *
 * Configuration:
 * - velocityDecay: 0.15 - Allows more movement for better spreading
 * - alphaDecay: 0.008 - Slower cooling for longer convergence time
 * - alphaMin: 0.00005 - Lower minimum for thorough settlement
 * - collision strength: 1.0 - Maximum strength for strict enforcement
 * - collision iterations: 6 - More iterations for better resolution
 * - pre-run ticks: 400 - Increased for better initial stabilization
 *
 * @param {Array} entries - Array of technology entries to position
 * @param {d3.Selection} blipsSelection - D3 selection of blip groups
 * @param {Object} config - Visualization configuration
 */
export function runForceSimulation(entries, blipsSelection, config) {
  const d3 = window.d3;

  // Create tick callback
  const tickCallback = createTickCallback(blipsSelection, config);

  // Configure and run force simulation
  d3.forceSimulation()
    .nodes(entries)
    .velocityDecay(0.15) // More movement freedom for better spreading
    .alphaDecay(0.008) // Slower cooling for longer convergence time
    .alphaMin(0.00005) // Lower minimum for thorough settlement
    .force(
      'collision',
      d3
        .forceCollide()
        .radius(d => d.collision_radius || config.blip_collision_radius)
        .strength(1.0) // Maximum collision strength for strict enforcement
        .iterations(6)
    ) // More iterations per tick for better collision resolution
    .on('tick', tickCallback)
    .tick(400); // Increased pre-run iterations for better stabilization
}
