// The MIT License (MIT)
// Copyright (c) 2017-2024 Zalando SE

import { polar, cartesian, boundedInterval, boundedRing, boundedBox } from './math/coordinates.js';
import { SeededRandom } from './math/random.js';
import { validateConfig } from './validation/config-validator.js';
import { generateQuadrants, computeQuadrantBounds } from './geometry/quadrant-calculator.js';
import { generateRings } from './geometry/ring-calculator.js';
import { createSegment } from './geometry/segment-calculator.js';
import { EntryProcessor } from './processing/entry-processor.js';
import { translate, viewbox, computeLegendOffsets, ensureLayoutStructure, legend_transform } from './rendering/helpers.js';
import { renderGrid, renderTitleAndFooter } from './rendering/grid-renderer.js';
import { renderLegendColumns } from './rendering/legend-renderer.js';
import { createBubble, showBubble, hideBubble, highlightLegendItem, unhighlightLegendItem, createBlipInteractions } from './rendering/interactions.js';
import { renderBlips } from './rendering/blip-renderer.js';
import { runForceSimulation } from './rendering/force-simulation.js';
import { renderDebugVisualization } from './rendering/debug-renderer.js';
import { applyConfigDefaults, calculateDimensions, configureOffsets } from './config/config-defaults.js';
import { setupSvg } from './rendering/svg-setup.js';
import { renderRingDescriptionsTable } from './rendering/table-renderer.js';

function radar_visualization(config) {

  applyConfigDefaults(config);
  const dimensions = calculateDimensions(config);
  const target_outer_radius = dimensions.target_outer_radius;

  validateConfig(config);

  const rng = new SeededRandom(42);
  const random = () => rng.next();
  const random_between = (min, max) => rng.between(min, max);
  const normal_between = (min, max) => rng.normalBetween(min, max);

  const num_quadrants = config.quadrants.length;
  const quadrants = generateQuadrants(num_quadrants);

  const num_rings = config.rings.length;
  const rings = generateRings(num_rings, target_outer_radius);
  const outer_radius = rings[rings.length - 1].radius;

  const quadrant_bounds = quadrants.map(function (q) {
    return computeQuadrantBounds(q.radial_min * Math.PI, q.radial_max * Math.PI, outer_radius);
  });

  configureOffsets(config, outer_radius, num_quadrants);

  const bounded_interval = boundedInterval;
  const bounded_ring = boundedRing;
  const bounded_box = boundedBox;

  function segment(quadrant, ring) {
    return createSegment(quadrant, ring, quadrants, rings, config, random_between);
  }

  const entryProcessor = new EntryProcessor(config, quadrants, rings, random, random_between);
  entryProcessor.processEntries(config.entries);

  const segmented = new Array(num_quadrants);
  for (let quadrant = 0; quadrant < num_quadrants; quadrant++) {
    segmented[quadrant] = new Array(num_rings);
    for (let ring = 0; ring < num_rings; ring++) {
      segmented[quadrant][ring] = [];
    }
  }
  for (let i = 0; i < config.entries.length; i++) {
    const entry = config.entries[i];
    segmented[entry.quadrant][entry.ring].push(entry);
  }

  const svgElements = setupSvg(config, quadrants, rings, dimensions);
  const { svg, radar, legendLeftColumn, legendRightColumn, grid } = svgElements;

  renderGrid(grid, config, quadrants, rings, outer_radius);

  if (!config.footer) {
    config.footer = "▲ moved up     ▼ moved down     ★ new     ⬤ no change";
  }
  renderTitleAndFooter(radar, config);

  if (config.print_layout) {
    legendLeftColumn.style('display', 'flex');
    legendRightColumn.style('display', 'flex');
    renderLegendColumns(
      legendLeftColumn,
      legendRightColumn,
      segmented,
      config,
      num_quadrants,
      num_rings,
      showBubble,
      hideBubble,
      highlightLegendItem,
      unhighlightLegendItem
    );
  } else {
    legendLeftColumn.style('display', 'none').html('');
    legendRightColumn.style('display', 'none').html('');
  }

  var rink = radar.append("g").attr("id", "rink");
  var bubble = createBubble(radar, config.font_family);

  var blips = renderBlips(
    rink,
    config.entries,
    config,
    showBubble,
    hideBubble,
    highlightLegendItem,
    unhighlightLegendItem
  );

  runForceSimulation(config.entries, blips, config);

  if (config.debug_geometry) {
    renderDebugVisualization(
      radar,
      config,
      quadrants,
      rings,
      num_quadrants,
      num_rings,
      segmented
    );
  }

  if (config.print_ring_descriptions_table) {
    renderRingDescriptionsTable(config);
  }
}

export default radar_visualization;
export { radar_visualization };
