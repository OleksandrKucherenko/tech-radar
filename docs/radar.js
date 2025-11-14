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

  // Validate configuration
  if (!config.quadrants || config.quadrants.length < 2 || config.quadrants.length > 8) {
    throw new Error("Number of quadrants must be between 2 and 8 (found: " + (config.quadrants ? config.quadrants.length : 0) + ")");
  }
  if (!config.rings || config.rings.length < 4 || config.rings.length > 8) {
    throw new Error("Number of rings must be between 4 and 8 (found: " + (config.rings ? config.rings.length : 0) + ")");
  }

  // Validate entries
  for (var i = 0; i < config.entries.length; i++) {
    var entry = config.entries[i];
    if (entry.quadrant < 0 || entry.quadrant >= config.quadrants.length) {
      throw new Error("Entry '" + entry.label + "' has invalid quadrant: " + entry.quadrant + " (must be 0-" + (config.quadrants.length - 1) + ")");
    }
    if (entry.ring < 0 || entry.ring >= config.rings.length) {
      throw new Error("Entry '" + entry.label + "' has invalid ring: " + entry.ring + " (must be 0-" + (config.rings.length - 1) + ")");
    }
  }

  // custom random number generator, to make random sequence reproducible
  // source: https://stackoverflow.com/questions/521295
  var seed = 42;
  function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function random_between(min, max) {
    return min + random() * (max - min);
  }

  function normal_between(min, max) {
    return min + (random() + random()) * 0.5 * (max - min);
  }

  // Generate quadrants dynamically based on config.quadrants.length
  // radial_min / radial_max are multiples of PI
  const quadrants = [];
  const num_quadrants = config.quadrants.length;
  const angle_per_quadrant = 2 / num_quadrants; // in PI multiples
  const rotation_offset = (num_quadrants === 2) ? -0.5 : 0; // rotate to vertical split for 2 quadrants

  for (let i = 0; i < num_quadrants; i++) {
    const start_angle = -1 + (i * angle_per_quadrant) + rotation_offset;
    const end_angle = -1 + ((i + 1) * angle_per_quadrant) + rotation_offset;
    const mid_angle = (-Math.PI + (i + 0.5) * angle_per_quadrant * Math.PI) + (rotation_offset * Math.PI);

    quadrants.push({
      radial_min: start_angle,
      radial_max: end_angle,
      factor_x: Math.cos(mid_angle),
      factor_y: Math.sin(mid_angle)
    });
  }

  // Generate rings dynamically based on config.rings.length
  // Scale the current pattern [130, 220, 310, 400] proportionally
  const num_rings = config.rings.length;
  const base_pattern = [130, 220, 310, 400];
  const max_base_radius = base_pattern[base_pattern.length - 1];
  const ring_template = [];

  if (num_rings === 4) {
    for (let i = 0; i < 4; i++) {
      ring_template.push(base_pattern[i]);
    }
  } else {
    for (let i = 0; i < num_rings; i++) {
      const pattern_position = (i / (num_rings - 1)) * 3;
      const pattern_index = Math.floor(pattern_position);
      const fraction = pattern_position - pattern_index;

      let radius;
      if (pattern_index >= 3) {
        radius = max_base_radius;
      } else {
        radius = base_pattern[pattern_index] +
                 (base_pattern[pattern_index + 1] - base_pattern[pattern_index]) * fraction;
      }

      ring_template.push(radius);
    }
  }

  const radius_scale = target_outer_radius / max_base_radius;
  const rings = ring_template.map(function(r) {
    return { radius: Math.max(10, Math.round(r * radius_scale)) };
  });
  const outer_radius = rings[rings.length - 1].radius;
  const quadrant_bounds = quadrants.map(function(q) {
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

  function computeLegendOffsets() {
    if (config.legend_offset) {
      return config.legend_offset;
    }

    var num_quads = config.quadrants.length;
    var offsets = new Array(num_quads);
    var legend_overlap = outer_radius * 0.08;
    var left_x = -outer_radius - config.legend_column_width + legend_overlap;
    var right_x = outer_radius - legend_overlap;

    var left_column = [];
    var right_column = [];
    for (var i = 0; i < num_quads; i++) {
      var targetColumn = (i % 2 === 0) ? right_column : left_column;
      targetColumn.push(i);
    }

    var baseY = -outer_radius + 80;
    var verticalAvailable = (2 * outer_radius) - 160;

    function stepFor(count) {
      if (count <= 1) {
        return 0;
      }
      return Math.max(config.legend_vertical_spacing, verticalAvailable / (count - 1));
    }

    function assignOffsets(column, xPosition) {
      var step = stepFor(column.length);
      for (var idx = 0; idx < column.length; idx++) {
        var qIndex = column[idx];
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

  config.legend_offset = computeLegendOffsets();

  function polar(cartesian) {
    var x = cartesian.x;
    var y = cartesian.y;
    return {
      t: Math.atan2(y, x),
      r: Math.sqrt(x * x + y * y)
    }
  }

  function cartesian(polar) {
    return {
      x: polar.r * Math.cos(polar.t),
      y: polar.r * Math.sin(polar.t)
    }
  }

  function bounded_interval(value, min, max) {
    var low = Math.min(min, max);
    var high = Math.max(min, max);
    return Math.min(Math.max(value, low), high);
  }

  function bounded_ring(polar, r_min, r_max) {
    return {
      t: polar.t,
      r: bounded_interval(polar.r, r_min, r_max)
    }
  }

  function bounded_box(point, min, max) {
    return {
      x: bounded_interval(point.x, min.x, max.x),
      y: bounded_interval(point.y, min.y, max.y)
    }
  }

  function computeQuadrantBounds(startAngle, endAngle, radius) {
    var twoPi = 2 * Math.PI;
    var normalizedStart = startAngle;
    var normalizedEnd = endAngle;

    while (normalizedEnd <= normalizedStart) {
      normalizedEnd += twoPi;
    }

    var axisAngles = [
      -Math.PI,
      -Math.PI / 2,
      0,
      Math.PI / 2,
      Math.PI,
      (3 * Math.PI) / 2,
      2 * Math.PI
    ];

    var candidates = [normalizedStart, normalizedEnd];

    axisAngles.forEach(function(axisAngle) {
      var candidate = axisAngle;
      while (candidate < normalizedStart) {
        candidate += twoPi;
      }
      if (candidate <= normalizedEnd) {
        candidates.push(candidate);
      }
    });

    var min_x = Infinity;
    var max_x = -Infinity;
    var min_y = Infinity;
    var max_y = -Infinity;

    candidates.forEach(function(angle) {
      var cosA = Math.cos(angle);
      var sinA = Math.sin(angle);
      min_x = Math.min(min_x, cosA);
      max_x = Math.max(max_x, cosA);
      min_y = Math.min(min_y, sinA);
      max_y = Math.max(max_y, sinA);
    });

    var padding = 20;
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

  function segment(quadrant, ring) {
    var min_angle = quadrants[quadrant].radial_min * Math.PI;
    var max_angle = quadrants[quadrant].radial_max * Math.PI;
    var base_inner_radius = ring === 0 ? 30 : rings[ring - 1].radius;
    var base_outer_radius = rings[ring].radius;

    var inner_radius = base_inner_radius + config.segment_radial_padding;
    var outer_radius = base_outer_radius - config.segment_radial_padding;
    if (outer_radius <= inner_radius) {
      var midpoint = (base_inner_radius + base_outer_radius) / 2;
      inner_radius = Math.max(0, midpoint - 1);
      outer_radius = midpoint + 1;
    }

    var ring_center = (inner_radius + outer_radius) / 2;
    var angular_padding = config.segment_angular_padding / Math.max(ring_center, 1);
    var angular_limit = Math.max(0, (max_angle - min_angle) / 2 - 0.01);
    angular_padding = Math.min(angular_padding, angular_limit);

    var angle_min = min_angle + angular_padding;
    var angle_max = max_angle - angular_padding;
    if (angle_max <= angle_min) {
      angle_min = min_angle;
      angle_max = max_angle;
    }

    // FIX #7: Calculate bounding box PER SEGMENT, not per quadrant
    // Use segment's actual angles and outer_radius, not the full quadrant
    var segment_bounds = computeQuadrantBounds(angle_min, angle_max, outer_radius);
    var cartesian_min = segment_bounds.min;
    var cartesian_max = segment_bounds.max;

    function clampPoint(point) {
      var c = bounded_box(point, cartesian_min, cartesian_max);
      var p = polar(c);
      p.r = bounded_interval(p.r, inner_radius, outer_radius);
      p.t = bounded_interval(p.t, angle_min, angle_max);
      return cartesian(p);
    }

    function clampAndAssign(d) {
      var clipped = clampPoint({ x: d.x, y: d.y });
      d.x = clipped.x;
      d.y = clipped.y;
      return clipped;
    }

    return {
      clipx: function(d) {
        var clipped = clampAndAssign(d);
        return clipped.x;
      },
      clipy: function(d) {
        var clipped = clampAndAssign(d);
        return clipped.y;
      },
      // FIX #5: Single clip operation that doesn't double-clip
      clip: function(d) {
        var clipped = clampPoint({ x: d.x, y: d.y });
        d.x = clipped.x;
        d.y = clipped.y;
        return clipped;
      },
      random: function() {
        return cartesian({
          t: random_between(angle_min, angle_max),
          r: random_between(inner_radius, outer_radius)
        });
      }
    }
  }

  // Helper function to distribute entries in a grid pattern within their segment
  function gridPosition(entries, segmentInfo) {
    if (entries.length === 0) return;

    var min_angle = quadrants[segmentInfo.quadrant].radial_min * Math.PI;
    var max_angle = quadrants[segmentInfo.quadrant].radial_max * Math.PI;
    var base_inner_radius = segmentInfo.ring === 0 ? 30 : rings[segmentInfo.ring - 1].radius;
    var base_outer_radius = rings[segmentInfo.ring].radius;

    var inner_radius = base_inner_radius + config.segment_radial_padding;
    var outer_radius = base_outer_radius - config.segment_radial_padding;
    if (outer_radius <= inner_radius) {
      var midpoint = (base_inner_radius + base_outer_radius) / 2;
      inner_radius = Math.max(0, midpoint - 1);
      outer_radius = midpoint + 1;
    }

    var ring_center = (inner_radius + outer_radius) / 2;
    var angular_padding = config.segment_angular_padding / Math.max(ring_center, 1);
    var angular_limit = Math.max(0, (max_angle - min_angle) / 2 - 0.01);
    angular_padding = Math.min(angular_padding, angular_limit);

    var angle_min = min_angle + angular_padding;
    var angle_max = max_angle - angular_padding;

    // Calculate optimal grid dimensions to maximize spatial distribution
    var angle_range = angle_max - angle_min;
    var radius_range = outer_radius - inner_radius;
    var count = entries.length;

    // Calculate segment dimensions in pixels (approximate)
    // FIX #1: Use inner_radius for ring 0 to avoid overestimating angular capacity
    // Ring 0 has smallest inner arc, using center radius overestimates by ~74%
    var effective_radius = (segmentInfo.ring === 0) ? inner_radius : ring_center;
    var segment_arc_length = angle_range * effective_radius;
    var segment_radial_depth = radius_range;

    // Estimate item size (based on collision radius)
    var item_size = config.blip_collision_radius || 14;

    // Calculate maximum items that could fit in each dimension
    // Use a more generous calculation since force simulation will adjust spacing
    // Divide by 70% of item size to allow for better initial distribution
    var max_angular_items = Math.max(3, Math.floor(segment_arc_length / (item_size * 0.7)));
    var max_radial_items = Math.max(3, Math.floor(segment_radial_depth / (item_size * 0.7)));

    // Calculate balanced grid that uses both dimensions effectively
    var angular_divisions, radial_divisions;

    // Start with square root distribution
    var base = Math.ceil(Math.sqrt(count));

    // Calculate aspect ratio
    var aspect_ratio = segment_arc_length / Math.max(segment_radial_depth, 1);

    if (count === 1) {
      angular_divisions = 1;
      radial_divisions = 1;
    } else if (count <= 4) {
      // For small counts, spread evenly
      angular_divisions = Math.min(count, max_angular_items);
      radial_divisions = Math.ceil(count / angular_divisions);
    } else {
      // For larger counts, balance based on aspect ratio but enforce minimums
      if (aspect_ratio > 2) {
        // Much wider than tall - strongly prefer angular spread
        angular_divisions = Math.min(max_angular_items, Math.ceil(base * 1.5));
        radial_divisions = Math.ceil(count / angular_divisions);
      } else if (aspect_ratio > 1) {
        // Moderately wider - prefer angular spread
        angular_divisions = Math.min(max_angular_items, Math.ceil(base * 1.2));
        radial_divisions = Math.ceil(count / angular_divisions);
      } else if (aspect_ratio < 0.5) {
        // FIX #2: Much taller than wide - but don't over-favor radial in narrow segments
        // For ring 0 with many quadrants, radial depth is limited, so balance better
        var radial_bias = (segmentInfo.ring === 0) ? 0.85 : 0.7;
        angular_divisions = Math.min(max_angular_items, Math.max(3, Math.floor(base * radial_bias)));
        radial_divisions = Math.ceil(count / angular_divisions);
      } else {
        // Moderately tall or square - balanced approach
        angular_divisions = Math.min(max_angular_items, Math.max(3, base));
        radial_divisions = Math.ceil(count / angular_divisions);
      }

      // Ensure we don't exceed capacity in either dimension
      angular_divisions = Math.max(2, Math.min(angular_divisions, max_angular_items));
      radial_divisions = Math.max(2, Math.min(radial_divisions, max_radial_items));
    }

    // Distribute entries in grid with better spacing
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];

      // Grid cell indices
      var angular_index = i % angular_divisions;
      var radial_index = Math.floor(i / angular_divisions);

      // FIX #3: Better handling when entries exceed grid capacity
      // Instead of simple wrapping, detect overcrowding for collision radius adjustment
      var is_overcrowded = radial_index >= radial_divisions;
      if (is_overcrowded) {
        // Wrap excess entries back into the grid using modulo
        var total_cells = angular_divisions * radial_divisions;
        var cell_index = i % total_cells;
        angular_index = cell_index % angular_divisions;
        radial_index = Math.floor(cell_index / angular_divisions);
      }

      // Position within grid cell with increased jitter for better spread
      // Use 0.15-0.85 range instead of 0.3-0.7 to fill more of each cell
      var angular_fraction = (angular_index + 0.15 + random() * 0.7) / angular_divisions;
      var radial_fraction = (radial_index + 0.15 + random() * 0.7) / radial_divisions;

      var angle = angle_min + angular_fraction * angle_range;
      var radius = inner_radius + radial_fraction * radius_range;

      var point = cartesian({ t: angle, r: radius });
      entry.x = point.x;
      entry.y = point.y;
    }
  }

  // partition entries according to segments first
  var segmented = new Array(num_quadrants);
  for (let quadrant = 0; quadrant < num_quadrants; quadrant++) {
    segmented[quadrant] = new Array(num_rings);
    for (var ring = 0; ring < num_rings; ring++) {
      segmented[quadrant][ring] = [];
    }
  }
  for (var i=0; i<config.entries.length; i++) {
    var entry = config.entries[i];
    segmented[entry.quadrant][entry.ring].push(entry);
  }

  // position each entry using grid-based distribution
  for (var i = 0; i < config.entries.length; i++) {
    var entry = config.entries[i];
    entry.segment = segment(entry.quadrant, entry.ring);
    entry.color = entry.active || config.print_layout ?
      config.rings[entry.ring].color : config.colors.inactive;
  }

  // Apply grid positioning to each segment
  for (let quadrant = 0; quadrant < num_quadrants; quadrant++) {
    for (let ring = 0; ring < num_rings; ring++) {
      gridPosition(segmented[quadrant][ring], { quadrant: quadrant, ring: ring });
    }
  }

  // assign unique sequential id to each entry
  var id = 1;
  // Generate quadrant ordering (for 4 quadrants: [2,3,1,0], otherwise sequential with wrap)
  var quadrant_order = [];
  if (num_quadrants === 4) {
    quadrant_order = [2, 3, 1, 0]; // Original ordering for 4 quadrants
  } else {
    // For other counts, start from bottom-left and go counter-clockwise
    var start_index = Math.floor(num_quadrants / 2);
    for (var i = 0; i < num_quadrants; i++) {
      quadrant_order.push((start_index + i) % num_quadrants);
    }
  }

  for (var quadrant of quadrant_order) {
    for (var ring = 0; ring < num_rings; ring++) {
      var entries = segmented[quadrant][ring];
      entries.sort(function(a,b) { return a.label.localeCompare(b.label); })
      for (var i=0; i<entries.length; i++) {
        entries[i].id = "" + id++;
      }
    }
  }

  // Calculate adaptive collision radius based on segment density
  for (let quadrant = 0; quadrant < num_quadrants; quadrant++) {
    for (let ring = 0; ring < num_rings; ring++) {
      var entries = segmented[quadrant][ring];
      if (entries.length === 0) continue;

      // Calculate segment area
      var seg_base_inner_radius = ring === 0 ? 30 : rings[ring - 1].radius;
      var seg_base_outer_radius = rings[ring].radius;
      var seg_inner_radius = seg_base_inner_radius + config.segment_radial_padding;
      var seg_outer_radius = seg_base_outer_radius - config.segment_radial_padding;

      // Guard against zero-width or negative-width segments
      if (seg_outer_radius <= seg_inner_radius) {
        var midpoint = (seg_base_inner_radius + seg_base_outer_radius) / 2;
        seg_inner_radius = Math.max(0, midpoint - 1);
        seg_outer_radius = midpoint + 1;
      }

      var seg_angle_range = (quadrants[quadrant].radial_max - quadrants[quadrant].radial_min) * Math.PI;
      var seg_ring_center = (seg_inner_radius + seg_outer_radius) / 2;
      var seg_radial_thickness = seg_outer_radius - seg_inner_radius;

      // Approximate segment area (sector area)
      var segment_area = seg_angle_range * seg_ring_center * seg_radial_thickness;

      // Calculate area per entry
      var area_per_entry = segment_area / entries.length;

      // Collision radius based on available area (with safety factor)
      // Increased safety factor from 0.45 to 0.55 for better spacing
      var ideal_radius = Math.sqrt(area_per_entry / Math.PI) * 0.55;

      // Allow adaptive radius to exceed default when there's room
      // Use minimum of 12px to ensure reasonable spacing
      var adaptive_radius = Math.max(12, ideal_radius);

      // For very dense segments, ensure minimum spacing
      if (entries.length > 10) {
        adaptive_radius = Math.max(adaptive_radius, 13);
      }
      if (entries.length > 15) {
        adaptive_radius = Math.max(adaptive_radius, 14);
      }

      // FIX #4: Reduce collision radius for narrow segments (many quadrants in ring 0)
      // Narrow segments with small inner arc need tighter packing
      if (ring === 0 && num_quadrants >= 6) {
        adaptive_radius = Math.max(10, adaptive_radius * 0.9);
      }

      // Assign collision radius to each entry
      for (var i = 0; i < entries.length; i++) {
        entries[i].collision_radius = adaptive_radius;
      }
    }
  }

  function translate(x, y) {
    return "translate(" + x + "," + y + ")";
  }

  function viewbox(quadrant) {
    var outer_radius = rings[rings.length - 1].radius;
    var padding = 20;
    return [
      Math.max(0, quadrants[quadrant].factor_x * outer_radius) - (outer_radius + padding),
      Math.max(0, quadrants[quadrant].factor_y * outer_radius) - (outer_radius + padding),
      outer_radius + 2 * padding,
      outer_radius + 2 * padding
    ].join(" ");
  }

  // adjust with config.scale.
  config.scale = config.scale || 1;
  var scaled_width = config.width * config.scale;
  var scaled_height = config.height * config.scale;

  var svg = d3.select("svg#" + config.svg_id)
    .style("background-color", config.colors.background)
    .attr("width", scaled_width)
    .attr("height", scaled_height);

  function ensureLayoutStructure(svgSelection) {
    var existing = svgSelection.node().closest('.radar-layout');
    if (existing) {
      return d3.select(existing);
    }

    var svgNode = svgSelection.node();
    var parent = svgNode.parentNode;
    var wrapper = document.createElement('div');
    wrapper.className = 'radar-layout';
    var leftColumn = document.createElement('div');
    leftColumn.className = 'radar-legend-column left';
    var svgContainer = document.createElement('div');
    svgContainer.className = 'radar-svg-container';
    var rightColumn = document.createElement('div');
    rightColumn.className = 'radar-legend-column right';

    parent.insertBefore(wrapper, svgNode);
    svgContainer.appendChild(svgNode);
    wrapper.appendChild(leftColumn);
    wrapper.appendChild(svgContainer);
    wrapper.appendChild(rightColumn);

    return d3.select(wrapper);
  }

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
    svg.attr("viewBox", viewbox(config.zoomed_quadrant));
  } else {
    // Center radar in available space (accounting for title and footer)
    var radar_center_y = (scaled_height / 2) + ((title_height - footer_height) / 2);
    var radar_center_x = (scaled_width / 2) + config.radar_horizontal_offset;
    radar.attr("transform", translate(radar_center_x, radar_center_y).concat(`scale(${config.scale})`));
  }

  var grid = radar.append("g");

  // define default font-family
  config.font_family = config.font_family || "Arial, Helvetica";

  // draw grid lines - N radial lines for N quadrants
  for (var i = 0; i < num_quadrants; i++) {
    var angle = -Math.PI + (i * 2 * Math.PI / num_quadrants);
    grid.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", outer_radius * Math.cos(angle))
      .attr("y2", outer_radius * Math.sin(angle))
      .attr("class", "quadrant-line quadrant-line-" + i)
      .style("stroke", config.colors.grid)
      .style("stroke-width", 1.5)
      .style("stroke-opacity", 0.3);
  }

  // background color. Usage `.attr("filter", "url(#solid)")`
  // SOURCE: https://stackoverflow.com/a/31013492/2609980
  var defs = grid.append("defs");
  var filter = defs.append("filter")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 1)
    .attr("height", 1)
    .attr("id", "solid");
  filter.append("feFlood")
    .attr("flood-color", "rgb(0, 0, 0, 0.8)");
  filter.append("feComposite")
    .attr("in", "SourceGraphic");

  // draw rings
  for (var i = 0; i < rings.length; i++) {
    var outer = rings[i].radius;
    var inner = i === 0 ? 0 : rings[i - 1].radius;
    var thickness = Math.max(outer - inner, 1);
    var labelRadius = outer - (thickness / 2);
    var labelFontSize = Math.max(12, Math.min(32, thickness * 0.45));

    // Add subtle alternating background fills for better visual separation
    if (i > 0) {
      grid.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", outer)
        .attr("class", "ring ring-" + i)
        .style("fill", i % 2 === 0 ? "rgba(0, 0, 0, 0.01)" : "rgba(0, 0, 0, 0.015)")
        .style("stroke", "none")
        .style("pointer-events", "none");
    }

    // Draw ring boundary with enhanced styling
    grid.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", outer)
      .attr("class", "ring-border ring-border-" + i)
      .style("fill", "none")
      .style("stroke", config.colors.grid)
      .style("stroke-width", i === 0 ? 2 : 1)
      .style("stroke-opacity", i === 0 ? 0.4 : 0.25);
    if (config.print_layout) {
      grid.append("text")
        .text(config.rings[i].name)
        .attr("y", -labelRadius)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("fill", config.rings[i].color)
        .style("opacity", 0.35)
        .style("font-family", config.font_family)
        .style("font-size", labelFontSize + "px")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .style("user-select", "none");
    }
  }

  function legend_transform(quadrant, ring, legendColumnWidth, index=null, currentHeight = 0) {
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

  // draw title and legend (only in print layout)
  if (config.print_layout) {
    // title
    radar.append("a")
      .attr("href", config.repo_url)
      .attr("transform", translate(config.title_offset.x, config.title_offset.y))
      .append("text")
      .attr("class", "hover-underline")  // add class for hover effect
      .text(config.title)
      .style("font-family", config.font_family)
      .style("font-size", "30")
      .style("font-weight", "bold")

    // date
    radar
      .append("text")
      .attr("transform", translate(config.title_offset.x, config.title_offset.y + 20))
      .text(config.date || "")
      .style("font-family", config.font_family)
      .style("font-size", "14")
      .style("fill", "#999")

    // footer
    radar.append("text")
      .attr("transform", translate(config.footer_offset.x, config.footer_offset.y))
      .text("▲ moved up     ▼ moved down     ★ new     ⬤ no change")
      .attr("xml:space", "preserve")
      .style("font-family", config.font_family)
      .style("font-size", "12px");

    if (config.print_layout) {
      legendLeftColumn.style('display', 'flex');
      legendRightColumn.style('display', 'flex');
      renderLegendColumns();
    } else {
      legendLeftColumn.style('display', 'none').html('');
      legendRightColumn.style('display', 'none').html('');
    }
  }

  function renderLegendColumns() {
    legendLeftColumn.html('');
    legendRightColumn.html('');

    // Calculate which quadrants go in which column for clockwise ordering
    // Right column: clockwise from position (num_quadrants - 2)
    // Left column: remaining quadrants in reverse order (counter-clockwise visually)
    // This ensures legends are visually close to their radar sectors
    var right_count = Math.ceil(num_quadrants / 2);
    var left_count = Math.floor(num_quadrants / 2);
    var right_start = num_quadrants - 2;

    var leftQuadrants = [];
    var rightQuadrants = [];

    // Fill right column quadrants (clockwise from right_start)
    for (var i = 0; i < right_count; i++) {
      rightQuadrants.push((right_start + i) % num_quadrants);
    }

    // Fill left column quadrants (backward from right_start - 1)
    for (var i = 0; i < left_count; i++) {
      leftQuadrants.push((right_start - 1 - i + num_quadrants) % num_quadrants);
    }

    function targetColumn(quadrant) {
      return leftQuadrants.includes(quadrant) ? legendLeftColumn : legendRightColumn;
    }

    for (let quadrant = 0; quadrant < num_quadrants; quadrant++) {
      var column = targetColumn(quadrant);
      var section = column.append('div')
        .attr('class', 'legend-section')
        .style('--legend-columns', legendSectionColumns);
      section.append('div')
        .attr('class', 'legend-quadrant-name')
        .text(config.quadrants[quadrant].name);

      var ringsContainer = section.append('div').attr('class', 'legend-rings');

      for (let ring = 0; ring < num_rings; ring++) {
        var entriesInRing = segmented[quadrant][ring];
        if (!entriesInRing.length) {
          continue;
        }

        var ringBlock = ringsContainer.append('div').attr('class', 'legend-ring');
        ringBlock.append('div')
          .attr('class', 'legend-ring-name')
          .style('color', config.rings[ring].color)
          .text(config.rings[ring].name);

        var entriesList = ringBlock.append('div').attr('class', 'legend-ring-entries');
        entriesList.selectAll('a')
          .data(entriesInRing)
          .enter()
          .append('a')
            .attr('href', function(d) { return d.link ? d.link : '#'; })
            .attr('target', function(d) { return (d.link && config.links_in_new_tabs) ? '_blank' : null; })
            .attr('id', function(d) { return 'legendItem' + d.id; })
            .attr('class', 'legend-entry')
            .text(function(d) { return d.id + '. ' + d.label; })
            .on('mouseover', function(event, d) { showBubble(d); highlightLegendItem(d); })
            .on('mouseout', function(event, d) { hideBubble(d); unhighlightLegendItem(d); });
      }
    }
  }

  // layer for entries
  var rink = radar.append("g")
    .attr("id", "rink");

  // rollover bubble (on top of everything else)
  var bubble = radar.append("g")
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
    .style("font-family", config.font_family)
    .style("font-size", "10px")
    .style("fill", "#fff");
  bubble.append("path")
    .attr("d", "M 0,0 10,0 5,8 z")
    .style("fill", "#333");

  function showBubble(d) {
    if (d.active || config.print_layout) {
      var tooltip = d3.select("#bubble text")
        .text(d.label);
      var bbox = tooltip.node().getBBox();
      // Use rendered (clamped) position for stable tooltip positioning
      var x = d.rendered_x !== undefined ? d.rendered_x : d.x;
      var y = d.rendered_y !== undefined ? d.rendered_y : d.y;
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

  function hideBubble(d) {
    var bubble = d3.select("#bubble")
      .attr("transform", translate(0,0))
      .style("opacity", 0);
  }

  function highlightLegendItem(d) {
    var legendItem = document.getElementById("legendItem" + d.id);
    if (legendItem) {
      legendItem.classList.add('legend-highlight');
    }
  }

  function unhighlightLegendItem(d) {
    var legendItem = document.getElementById("legendItem" + d.id);
    if (legendItem) {
      legendItem.classList.remove('legend-highlight');
    }
  }

  // draw blips on radar
  var blips = rink.selectAll(".blip")
    .data(config.entries)
    .enter()
      .append("g")
        .attr("class", "blip")
        .attr("transform", function(d, i) { return legend_transform(d.quadrant, d.ring, config.legend_column_width, i); })
        .on("mouseover", function(event, d) { showBubble(d); highlightLegendItem(d); })
        .on("mouseout", function(event, d) { hideBubble(d); unhighlightLegendItem(d); });

  // configure each blip
  blips.each(function(d) {
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
        .style("font-size", function(d) { return blip_text.length > 2 ? "8px" : "9px"; })
        .style("pointer-events", "none")
        .style("user-select", "none");
    }
  });

  // make sure that blips stay inside their segment
  // FIX #5: Use single clip() instead of clipx/clipy to avoid double-clipping
  function ticked() {
    blips.attr("transform", function(d) {
      var clipped = d.segment.clip(d);
      return translate(clipped.x, clipped.y);
    })
  }

  // distribute blips, while avoiding collisions
  // FIX #6: Enhanced force simulation with better convergence
  d3.forceSimulation()
    .nodes(config.entries)
    .velocityDecay(0.15) // More movement freedom for better spreading
    .alphaDecay(0.008) // Slower cooling for longer convergence time
    .alphaMin(0.00005) // Lower minimum for thorough settlement
    .force("collision", d3.forceCollide()
      .radius(function(d) {
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
        var arcPath = d3.arc()
          .innerRadius(seg_inner)
          .outerRadius(seg_outer)
          .startAngle(angle_min)
          .endAngle(angle_max);
        
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
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return d.collision_radius || config.blip_collision_radius; })
      .attr("fill", "none")
      .attr("stroke", function(d) { return d.ring === 0 ? "#00ff00" : "#0000ff"; })
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

// Export for module systems (ES6, CommonJS) while keeping browser compatibility
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = radar_visualization;
}
if (typeof exports !== 'undefined') {
  exports.radar_visualization = radar_visualization;
}
// Make available globally for browser use
if (typeof window !== 'undefined') {
  window.radar_visualization = radar_visualization;
}
if (typeof global !== 'undefined') {
  global.radar_visualization = radar_visualization;
}
