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
  // Phase 3 Refactoring: Interaction functions now imported from rendering/interactions.js
  // (showBubble, hideBubble, highlightLegendItem, unhighlightLegendItem, createBubble)
  // ============================================================================

  // draw blips on radar
  var blips = rink.selectAll(".blip")
    .data(config.entries)
    .enter()
    .append("g")
    .attr("class", "blip")
    .attr("transform", function (d, i) { return legend_transform(d.quadrant, d.ring, config.legend_column_width, i); })
    .on("mouseover", function (event, d) { showBubble(d, config); highlightLegendItem(d); })
    .on("mouseout", function (event, d) { hideBubble(); unhighlightLegendItem(d); });

  // configure each blip
  blips.each(function (d) {
    var blip = d3.select(this);

    // blip link
    if (d.active && Object.prototype.hasOwnProperty.call(d, "link") && d.link) {
      blip = blip.append("a")
        .attr("xlink:href", d.link);

      if (config.links_in_new_tabs) {
        blip.attr("target", "_blank");
      }
    }

    // blip shape
    if (d.moved == 1) {
      blip.append("path")
        .attr("d", "M -11,5 11,5 0,-13 z") // triangle pointing up
        .style("fill", d.color);
    } else if (d.moved == -1) {
      blip.append("path")
        .attr("d", "M -11,-5 11,-5 0,13 z") // triangle pointing down
        .style("fill", d.color);
    } else if (d.moved == 2) {
      blip.append("path")
        .attr("d", d3.symbol().type(d3.symbolStar).size(200))
        .style("fill", d.color);
    } else {
      blip.append("circle")
        .attr("r", 9)
        .attr("fill", d.color);
    }

    // blip text
    if (d.active || config.print_layout) {
      var blip_text = config.print_layout ? d.id : d.label.match(/[a-z]/i);
      blip.append("text")
        .text(blip_text)
        .attr("y", 3)
        .attr("text-anchor", "middle")
        .style("fill", "#fff")
        .style("font-family", config.font_family)
        .style("font-size", function (d) { return blip_text.length > 2 ? "8px" : "9px"; })
        .style("pointer-events", "none")
        .style("user-select", "none");
    }
  });

  // make sure that blips stay inside their segment
  // FIX #5: Use single clip() instead of clipx/clipy to avoid double-clipping
  function ticked() {
    blips.attr("transform", function (d) {
      var clipped = d.segment.clip(d);
      // Store rendered position for stable tooltip positioning and to prevent jumping on hover
      d.rendered_x = clipped.x;
      d.rendered_y = clipped.y;
      return translate(clipped.x, clipped.y);
    });

    // Update debug collision circles if debug mode is enabled
    if (config.debug_geometry) {
      d3.select("#debug-collision-radii").selectAll("circle")
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });
    }
  }

  // distribute blips, while avoiding collisions
  // FIX #6: Enhanced force simulation with better convergence
  d3.forceSimulation()
    .nodes(config.entries)
    .velocityDecay(0.15) // More movement freedom for better spreading
    .alphaDecay(0.008) // Slower cooling for longer convergence time
    .alphaMin(0.00005) // Lower minimum for thorough settlement
    .force("collision", d3.forceCollide()
      .radius(function (d) {
        return d.collision_radius || config.blip_collision_radius;
      })
      .strength(1.0) // Maximum collision strength for strict enforcement
      .iterations(6)) // More iterations per tick for better collision resolution
    .on("tick", ticked)
    .tick(400); // Increased pre-run iterations for better stabilization

  // DEBUG VISUALIZATIONS: Show segment boundaries, grids, and collision radii
  if (config.debug_geometry) {
    var debugLayer = radar.append("g")
      .attr("id", "debug-layer");

    // Get outer radius for coordinate system
    var debug_outer_radius = rings[rings.length - 1].radius;

    // Draw segment boundaries for each quadrant/ring combination
    for (let q = 0; q < num_quadrants; q++) {
      for (let r = 0; r < num_rings; r++) {
        var seg_base_inner = r === 0 ? 30 : rings[r - 1].radius;
        var seg_base_outer = rings[r].radius;
        var seg_inner = seg_base_inner + config.segment_radial_padding;
        var seg_outer = seg_base_outer - config.segment_radial_padding;

        // FIX: Use same angular padding calculation as segment() function
        // segment_angular_padding is in PIXELS, convert to radians based on ring_center
        var seg_ring_center = (seg_inner + seg_outer) / 2;
        var seg_angular_padding = config.segment_angular_padding / Math.max(seg_ring_center, 1);

        var min_angle = quadrants[q].radial_min * Math.PI;
        var max_angle = quadrants[q].radial_max * Math.PI;
        var angular_limit = Math.max(0, (max_angle - min_angle) / 2 - 0.01);
        seg_angular_padding = Math.min(seg_angular_padding, angular_limit);

        var angle_min = min_angle + seg_angular_padding;
        var angle_max = max_angle - seg_angular_padding;
        if (angle_max <= angle_min) {
          angle_min = min_angle;
          angle_max = max_angle;
        }

        // Draw polar sector boundary (actual segment shape)
        // NOTE: d3.arc() uses clockwise angle convention, but our angles are counter-clockwise
        // So we negate the angles to flip direction, plus apply offset to align with coordinate system
        // Pattern: offset sign alternates based on num_quadrants mod 4
        // - num_quadrants ≡ 1 (mod 4): positive offset (e.g., 5, 9, 13...)
        // - num_quadrants ≡ 3 (mod 4): negative offset (e.g., 3, 7, 11...)
        var offset_magnitude = Math.PI / (2 * num_quadrants);
        var arc_offset = (num_quadrants % 4 === 1) ? offset_magnitude : -offset_magnitude;
        
        var arcPath = d3.arc()
          .innerRadius(seg_inner)
          .outerRadius(seg_outer)
          .startAngle(-angle_max + arc_offset)
          .endAngle(-angle_min + arc_offset);

        debugLayer.append("path")
          .attr("d", arcPath)
          .attr("fill", "none")
          .attr("stroke", r === 0 ? "#ff0000" : "#00ffff")
          .attr("stroke-width", r === 0 ? 2 : 1)
          .attr("stroke-dasharray", "5,5")
          .attr("opacity", 0.5);

        // Draw Cartesian bounding box (rectangular approximation)
        var bounds = computeQuadrantBounds(
          quadrants[q].radial_min * Math.PI,
          quadrants[q].radial_max * Math.PI,
          seg_outer
        );

        debugLayer.append("rect")
          .attr("x", bounds.min.x)
          .attr("y", bounds.min.y)
          .attr("width", bounds.max.x - bounds.min.x)
          .attr("height", bounds.max.y - bounds.min.y)
          .attr("fill", "none")
          .attr("stroke", "#ffff00")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,3")
          .attr("opacity", 0.3);

        // Add text labels for segment info (Ring 0 only for clarity)
        if (r === 0) {
          var mid_angle = (angle_min + angle_max) / 2;
          var label_radius = (seg_inner + seg_outer) / 2;
          var label_x = Math.cos(mid_angle) * label_radius;
          var label_y = Math.sin(mid_angle) * label_radius;

          var entries_count = segmented[q][r].length;
          var arc_length = (angle_max - angle_min) * seg_inner;

          debugLayer.append("text")
            .attr("x", label_x)
            .attr("y", label_y)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "#ff0000")
            .attr("font-weight", "bold")
            .text(`Q${q}R${r}: ${entries_count} items, arc=${arc_length.toFixed(0)}px`);
        }
      }
    }

    // Draw collision radius circles for each blip
    debugLayer.append("g")
      .attr("id", "debug-collision-radii")
      .selectAll("circle")
      .data(config.entries)
      .enter()
      .append("circle")
      .attr("cx", function (d) { return d.x; })
      .attr("cy", function (d) { return d.y; })
      .attr("r", function (d) { return d.collision_radius || config.blip_collision_radius; })
      .attr("fill", "none")
      .attr("stroke", function (d) { return d.ring === 0 ? "#00ff00" : "#0000ff"; })
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2")
      .attr("opacity", 0.4);

    // Draw coordinate system axes
    debugLayer.append("line")
      .attr("x1", -debug_outer_radius)
      .attr("y1", 0)
      .attr("x2", debug_outer_radius)
      .attr("y2", 0)
      .attr("stroke", "#666")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.3);

    debugLayer.append("line")
      .attr("x1", 0)
      .attr("y1", -debug_outer_radius)
      .attr("x2", 0)
      .attr("y2", debug_outer_radius)
      .attr("stroke", "#666")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.3);

    // Draw quadrant boundary lines (should match grid lines)
    for (var i = 0; i < num_quadrants; i++) {
      var grid_angle = -Math.PI + (i * 2 * Math.PI / num_quadrants);
      debugLayer.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", debug_outer_radius * Math.cos(grid_angle))
        .attr("y2", debug_outer_radius * Math.sin(grid_angle))
        .attr("stroke", "#ff00ff") // Magenta to distinguish from other lines
        .attr("stroke-width", 2)
        .attr("opacity", 0.6)
        .attr("stroke-dasharray", "10,5");
    }

    // Add legend for debug colors
    var debugLegend = debugLayer.append("g")
      .attr("transform", translate(-debug_outer_radius + 10, -debug_outer_radius + 10));

    debugLegend.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("fill", "#000")
      .text("DEBUG MODE");

    debugLegend.append("text")
      .attr("x", 0)
      .attr("y", 15)
      .attr("font-size", "9px")
      .attr("fill", "#ff0000")
      .text("━━ Ring 0 polar sector");

    debugLegend.append("text")
      .attr("x", 0)
      .attr("y", 28)
      .attr("font-size", "9px")
      .attr("fill", "#00ffff")
      .text("━━ Other rings polar sector");

    debugLegend.append("text")
      .attr("x", 0)
      .attr("y", 41)
      .attr("font-size", "9px")
      .attr("fill", "#ffff00")
      .text("━━ Cartesian bounding box");

    debugLegend.append("text")
      .attr("x", 0)
      .attr("y", 54)
      .attr("font-size", "9px")
      .attr("fill", "#00ff00")
      .text("○ Collision radius (Ring 0)");
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
