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

// ============================================================================
// Phase 1 Refactoring: Import extracted pure function modules
// ============================================================================
import { polar, cartesian, boundedInterval, boundedRing, boundedBox } from './math/coordinates.js';
import { SeededRandom } from './math/random.js';
import { validateConfig } from './validation/config-validator.js';

// ============================================================================
// Phase 2 Refactoring: Import extracted geometry and processing modules
// ============================================================================
import { generateQuadrants, computeQuadrantBounds } from './geometry/quadrant-calculator.js';
import { generateRings } from './geometry/ring-calculator.js';
import { createSegment } from './geometry/segment-calculator.js';
import { EntryProcessor } from './processing/entry-processor.js';

// ============================================================================
// Phase 3 Refactoring: Import extracted rendering modules
// ============================================================================
import {
  translate,
  viewbox,
  computeLegendOffsets,
  ensureLayoutStructure,
  legend_transform
} from './rendering/helpers.js';
import { renderGrid, renderTitleAndFooter } from './rendering/grid-renderer.js';
import { renderLegendColumns } from './rendering/legend-renderer.js';
import {
  createBubble,
  showBubble,
  hideBubble,
  highlightLegendItem,
  unhighlightLegendItem,
  createBlipInteractions
} from './rendering/interactions.js';

// ============================================================================
// Phase 4 Refactoring: Import blip rendering, simulation, and debug modules
// ============================================================================
import { renderBlips } from './rendering/blip-renderer.js';
import { runForceSimulation } from './rendering/force-simulation.js';
import { renderDebugVisualization } from './rendering/debug-renderer.js';

// ============================================================================
// Phase 5 Refactoring: Import config defaults, SVG setup, and table renderer
// ============================================================================
import { applyConfigDefaults, calculateDimensions, configureOffsets } from './config/config-defaults.js';
import { setupSvg } from './rendering/svg-setup.js';
import { renderRingDescriptionsTable } from './rendering/table-renderer.js';

function radar_visualization(config) {

  // ============================================================================
  // Phase 5 Refactoring: Apply config defaults and calculate dimensions
  // ============================================================================
  applyConfigDefaults(config);
  const dimensions = calculateDimensions(config);
  const target_outer_radius = dimensions.target_outer_radius;

  // ============================================================================
  // Phase 1 Refactoring: Use extracted validation module
  // ============================================================================
  validateConfig(config);

  // ============================================================================
  // Phase 1 Refactoring: Use extracted SeededRandom class
  // ============================================================================
  const rng = new SeededRandom(42);
  const random = () => rng.next();
  const random_between = (min, max) => rng.between(min, max);
  const normal_between = (min, max) => rng.normalBetween(min, max);

  // ============================================================================
  // Phase 2 Refactoring: Use extracted quadrant calculator module
  // ============================================================================
  const num_quadrants = config.quadrants.length;
  const quadrants = generateQuadrants(num_quadrants);

  // ============================================================================
  // Phase 2 Refactoring: Use extracted ring calculator module
  // ============================================================================
  const num_rings = config.rings.length;
  const rings = generateRings(num_rings, target_outer_radius);
  const outer_radius = rings[rings.length - 1].radius;

  // ============================================================================
  // Phase 2 Refactoring: Use extracted computeQuadrantBounds function
  // ============================================================================
  const quadrant_bounds = quadrants.map(function (q) {
    return computeQuadrantBounds(q.radial_min * Math.PI, q.radial_max * Math.PI, outer_radius);
  });

  // ============================================================================
  // Phase 5 Refactoring: Configure offsets
  // ============================================================================
  configureOffsets(config, outer_radius, num_quadrants);

  // ============================================================================
  // Phase 1 Refactoring: Coordinate transformation functions now imported
  // from src/math/coordinates.js (polar, cartesian, boundedInterval,
  // boundedRing, boundedBox)
  // ============================================================================

  // ============================================================================
  // Phase 1 Refactoring: Alias coordinate functions for naming convention
  // ============================================================================
  const bounded_interval = boundedInterval;
  const bounded_ring = boundedRing;
  const bounded_box = boundedBox;

  // ============================================================================
  // Phase 2 Refactoring: Use extracted segment calculator module
  // ============================================================================
  function segment(quadrant, ring) {
    return createSegment(quadrant, ring, quadrants, rings, config, random_between);
  }

  // ============================================================================
  // Phase 2 Refactoring: Use extracted entry processor module
  // ============================================================================
  const entryProcessor = new EntryProcessor(config, quadrants, rings, random, random_between);
  entryProcessor.processEntries(config.entries);

  // Create segmented array for legend rendering (entries grouped by quadrant/ring)
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

  // ============================================================================
  // Phase 5 Refactoring: SVG setup now uses imported module
  // ============================================================================
  const svgElements = setupSvg(config, quadrants, rings, dimensions);
  const { svg, radar, legendLeftColumn, legendRightColumn, grid } = svgElements;

  // ============================================================================
  // Phase 3 Refactoring: Grid rendering now uses imported module
  // ============================================================================
  renderGrid(grid, config, quadrants, rings, outer_radius);

  // ============================================================================
  // Phase 3 Refactoring: Title/footer rendering now uses imported module
  // ============================================================================
  // Set default footer text if not provided
  if (!config.footer) {
    config.footer = "▲ moved up     ▼ moved down     ★ new     ⬤ no change";
  }
  renderTitleAndFooter(radar, config);

  // ============================================================================
  // Phase 3 Refactoring: Legend rendering now uses imported module
  // ============================================================================
  // Show/hide legend columns based on print layout
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

  // layer for entries
  var rink = radar.append("g")
    .attr("id", "rink");

  // ============================================================================
  // Phase 3 Refactoring: Bubble creation now uses imported module
  // ============================================================================
  var bubble = createBubble(radar, config.font_family);

  // ============================================================================
  // Phase 4 Refactoring: Blip rendering now uses imported module
  // ============================================================================
  var blips = renderBlips(
    rink,
    config.entries,
    config,
    showBubble,
    hideBubble,
    highlightLegendItem,
    unhighlightLegendItem
  );

  // ============================================================================
  // Phase 4 Refactoring: Force simulation now uses imported module
  // ============================================================================
  runForceSimulation(config.entries, blips, config);

  // ============================================================================
  // Phase 4 Refactoring: Debug visualization now uses imported module
  // ============================================================================
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

  // ============================================================================
  // Phase 5 Refactoring: Ring descriptions table now uses imported module
  // ============================================================================
  if (config.print_ring_descriptions_table) {
    renderRingDescriptionsTable(config);
  }
}

// ============================================================================
// Phase 1 Refactoring: ES6 export (build process will handle browser compatibility)
// ============================================================================
export default radar_visualization;
export { radar_visualization };
