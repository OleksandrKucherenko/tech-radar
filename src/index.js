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

function radar_visualization(config) {

  config.svg_id = config.svg || "radar";
  config.width = config.width || 1450;
  config.height = config.height || 1000;
  config.colors = ("colors" in config) ? config.colors : {
    background: "#fff",
    grid: '#dddde0',
    inactive: "#ddd"
  };
  config.print_layout = ("print_layout" in config) ? config.print_layout : true;
  config.links_in_new_tabs = ("links_in_new_tabs" in config) ? config.links_in_new_tabs : true;
  config.repo_url = config.repo_url || '#';
  config.print_ring_descriptions_table = ("print_ring_descriptions_table" in config) ? config.print_ring_descriptions_table : false;

  config.legend_column_width = config.legend_column_width || 140
  config.legend_line_height = config.legend_line_height || 10
  config.segment_radial_padding = ("segment_radial_padding" in config) ? config.segment_radial_padding : 16;
  config.segment_angular_padding = ("segment_angular_padding" in config) ? config.segment_angular_padding : 12;
  config.chart_padding = ("chart_padding" in config) ? config.chart_padding : 60;
  config.blip_collision_radius = ("blip_collision_radius" in config) ? config.blip_collision_radius : 14;
  config.legend_vertical_spacing = config.legend_vertical_spacing || 20;
  config.radar_horizontal_offset = ("radar_horizontal_offset" in config)
    ? config.radar_horizontal_offset
    : Math.round(config.legend_column_width * 0.25);

  // DEBUG MODE: Enable geometric visualizations
  config.debug_geometry = ("debug_geometry" in config) ? config.debug_geometry : false;

  // Responsive sizing based on viewport and grid complexity
  var viewport_width = window.innerWidth || document.documentElement.clientWidth;
  var viewport_height = window.innerHeight || document.documentElement.clientHeight;

  // Apply responsive scaling for smaller viewports
  if (viewport_width < 1024 && !config.scale) {
    // Mobile/tablet scaling
    var scale_factor = Math.min(viewport_width / 1450, viewport_height / 1000);
    config.scale = Math.max(0.5, Math.min(1, scale_factor));
  }

  // Adjust sizing based on grid complexity (for 5+ quadrants)
  var grid_quadrants = config.quadrants.length;
  var grid_rings = config.rings.length;
  if (grid_quadrants >= 5 || grid_rings >= 6) {
    // Increase base size for complex grids to prevent overcrowding
    var complexity_multiplier = 1 + ((grid_quadrants - 4) * 0.05) + ((grid_rings - 4) * 0.03);
    if (!config.width_override) {
      config.width = Math.round(config.width * Math.min(complexity_multiplier, 1.3));
    }
    if (!config.height_override) {
      config.height = Math.round(config.height * Math.min(complexity_multiplier, 1.3));
    }

    // Slightly reduce collision radius for high-complexity grids
    if (grid_quadrants >= 7 || grid_rings >= 7) {
      config.blip_collision_radius = Math.max(10, config.blip_collision_radius * 0.9);
    }
  }

  // Calculate space for title and footer
  var title_height = config.print_layout && config.title ? 60 : 0;  // Title + date + padding
  var footer_height = config.print_layout ? 40 : 0;  // Footer + padding
  var minimum_chart_height = (2 * config.chart_padding) + 40;
  var available_height = Math.max(minimum_chart_height, config.height - title_height - footer_height);
  var available_width = Math.max((2 * config.chart_padding) + 40, config.width);

  var raw_outer_radius = Math.min(available_width, available_height) / 2 - config.chart_padding;
  var target_outer_radius = Math.max(10, raw_outer_radius);

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

  if (!config.title_offset) {
    config.title_offset = {
      x: -outer_radius,
      y: -outer_radius - 40
    };
  }
  if (!config.footer_offset) {
    config.footer_offset = {
      x: -outer_radius,
      y: outer_radius + 60
    };
  }

  config.legend_offset = computeLegendOffsets(num_quadrants, outer_radius, config);

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
  // Phase 3 Refactoring: Helper functions now imported from rendering/helpers.js
  // (translate, viewbox, computeLegendOffsets, ensureLayoutStructure, legend_transform)
  // ============================================================================

  // adjust with config.scale.
  config.scale = config.scale || 1;
  var scaled_width = config.width * config.scale;
  var scaled_height = config.height * config.scale;

  var svg = d3.select("svg#" + config.svg_id)
    .style("background-color", config.colors.background)
    .attr("width", scaled_width)
    .attr("height", scaled_height);

  var layoutWrapper = ensureLayoutStructure(svg);
  var legendLeftColumn = layoutWrapper.select('.radar-legend-column.left');
  var legendRightColumn = layoutWrapper.select('.radar-legend-column.right');
  var layoutWidth = layoutWrapper.node().getBoundingClientRect().width || config.width;
  var minLegendColumnWidth = (config.legend_column_width * 2) + 60;
  var maxLegendColumnWidth = (config.legend_column_width * 4) + 80;
  var targetLegendColumnWidth = Math.min(
    maxLegendColumnWidth,
    Math.max(minLegendColumnWidth, layoutWidth * 0.3)
  );
  var legendSectionColumns = Math.min(4, Math.max(2, Math.floor(targetLegendColumnWidth / (config.legend_column_width + 20))));

  legendLeftColumn
    .style('gap', config.legend_vertical_spacing + 'px')
    .style('width', targetLegendColumnWidth + 'px');
  legendRightColumn
    .style('gap', config.legend_vertical_spacing + 'px')
    .style('width', targetLegendColumnWidth + 'px');

  var radar = svg.append("g");
  if ("zoomed_quadrant" in config) {
    svg.attr("viewBox", viewbox(config.zoomed_quadrant, quadrants, rings));
  } else {
    // Center radar in available space (accounting for title and footer)
    var radar_center_y = (scaled_height / 2) + ((title_height - footer_height) / 2);
    var radar_center_x = (scaled_width / 2) + config.radar_horizontal_offset;
    radar.attr("transform", translate(radar_center_x, radar_center_y).concat(`scale(${config.scale})`));
  }

  // define default font-family
  config.font_family = config.font_family || "Arial, Helvetica";

  // ============================================================================
  // Phase 3 Refactoring: Grid rendering now uses imported module
  // ============================================================================
  var grid = radar.append("g");
  renderGrid(grid, config, quadrants, rings, outer_radius);

  function legend_transform(quadrant, ring, legendColumnWidth, index = null, currentHeight = 0) {
    // Determine number of columns based on ring count
    // 4-6 rings: 2 columns, 7-8 rings: 3 columns
    var num_columns = num_rings >= 7 ? 3 : 2;
    var rings_per_column = Math.ceil(num_rings / num_columns);

    var column = Math.floor(ring / rings_per_column);

    const dx = column * legendColumnWidth;
    // For ring header (index==null), just use currentHeight
    // For entries, add line height * index to currentHeight
    let dy;
    if (index == null) {
      // Ring header - use currentHeight directly with small adjustment
      dy = currentHeight;
    } else {
      // Entry - add line spacing
      dy = currentHeight + (index * config.legend_line_height);
    }

    return translate(
      config.legend_offset[quadrant].x + dx,
      config.legend_offset[quadrant].y + dy
    );
  }

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
    legend_transform,
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

  function ringDescriptionsTable() {
    var table = d3.select("body").append("table")
      .attr("class", "radar-table")
      .style("border-collapse", "collapse")
      .style("position", "relative")
      .style("top", "-70px")  // Adjust this value to move the table closer vertically
      .style("margin-left", "50px")
      .style("margin-right", "50px")
      .style("font-family", config.font_family)
      .style("font-size", "13px")
      .style("text-align", "left");

    var thead = table.append("thead");
    var tbody = table.append("tbody");

    // define fixed width for each column
    var columnWidth = `${100 / config.rings.length}%`;

    // create table header row with ring names
    var headerRow = thead.append("tr")
      .style("border", "1px solid #ddd");

    headerRow.selectAll("th")
      .data(config.rings)
      .enter()
      .append("th")
      .style("padding", "8px")
      .style("border", "1px solid #ddd")
      .style("background-color", d => d.color)
      .style("color", "#fff")
      .style("width", columnWidth)
      .text(d => d.name);

    // create table body row with descriptions
    var descriptionRow = tbody.append("tr")
      .style("border", "1px solid #ddd");

    descriptionRow.selectAll("td")
      .data(config.rings)
      .enter()
      .append("td")
      .style("padding", "8px")
      .style("border", "1px solid #ddd")
      .style("width", columnWidth)
      .text(d => d.description);
  }

  if (config.print_ring_descriptions_table) {
    ringDescriptionsTable();
  }
}

// ============================================================================
// Phase 1 Refactoring: ES6 export (build process will handle browser compatibility)
// ============================================================================
export default radar_visualization;
export { radar_visualization };
