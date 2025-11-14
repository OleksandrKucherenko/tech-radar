// Tech Radar Visualization - Bundled from ES6 modules
// Version: 0.14
// License: MIT
// Source: https://github.com/zalando/tech-radar

var radar_visualization = (function() {
  'use strict';

  // src/math/coordinates.js
function polar(cartesian) {
  const { x, y } = cartesian;
  return {
    t: Math.atan2(y, x),
    r: Math.sqrt(x * x + y * y)
  };
}
function cartesian(polar2) {
  const { r, t } = polar2;
  return {
    x: r * Math.cos(t),
    y: r * Math.sin(t)
  };
}
function boundedInterval(value, min, max) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.min(Math.max(value, low), high);
}
function boundedRing(polar2, r_min, r_max) {
  return {
    t: polar2.t,
    r: boundedInterval(polar2.r, r_min, r_max)
  };
}
function boundedBox(point, min, max) {
  return {
    x: boundedInterval(point.x, min.x, max.x),
    y: boundedInterval(point.y, min.y, max.y)
  };
}

// src/math/random.js
class SeededRandom {
  constructor(seed = 42) {
    this.seed = seed;
    this.initialSeed = seed;
  }
  next() {
    const x = Math.sin(this.seed++) * 1e4;
    return x - Math.floor(x);
  }
  between(min, max) {
    return min + this.next() * (max - min);
  }
  normalBetween(min, max) {
    return min + (this.next() + this.next()) * 0.5 * (max - min);
  }
  reset(seed) {
    this.seed = seed !== undefined ? seed : this.initialSeed;
  }
}

// src/validation/config-validator.js
class ConfigValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = "ConfigValidationError";
    this.field = field;
    this.value = value;
  }
}
function validateConfig(config) {
  const errors = [];
  if (!config.quadrants || config.quadrants.length < 2 || config.quadrants.length > 8) {
    errors.push(new ConfigValidationError(`Number of quadrants must be between 2 and 8 (found: ${config.quadrants?.length || 0})`, "quadrants", config.quadrants?.length));
  }
  if (!config.rings || config.rings.length < 4 || config.rings.length > 8) {
    errors.push(new ConfigValidationError(`Number of rings must be between 4 and 8 (found: ${config.rings?.length || 0})`, "rings", config.rings?.length));
  }
  if (config.entries && config.quadrants && config.rings) {
    config.entries.forEach((entry, index) => {
      if (entry.quadrant < 0 || entry.quadrant >= config.quadrants.length) {
        errors.push(new ConfigValidationError(`Entry '${entry.label}' has invalid quadrant: ${entry.quadrant} (must be 0-${config.quadrants.length - 1})`, `entries[${index}].quadrant`, entry.quadrant));
      }
      if (entry.ring < 0 || entry.ring >= config.rings.length) {
        errors.push(new ConfigValidationError(`Entry '${entry.label}' has invalid ring: ${entry.ring} (must be 0-${config.rings.length - 1})`, `entries[${index}].ring`, entry.ring));
      }
    });
  }
  if (errors.length > 0) {
    throw errors[0];
  }
  return true;
}

// src/index.js
function radar_visualization(config) {
  config.svg_id = config.svg || "radar";
  config.width = config.width || 1450;
  config.height = config.height || 1000;
  config.colors = "colors" in config ? config.colors : {
    background: "#fff",
    grid: "#dddde0",
    inactive: "#ddd"
  };
  config.print_layout = "print_layout" in config ? config.print_layout : true;
  config.links_in_new_tabs = "links_in_new_tabs" in config ? config.links_in_new_tabs : true;
  config.repo_url = config.repo_url || "#";
  config.print_ring_descriptions_table = "print_ring_descriptions_table" in config ? config.print_ring_descriptions_table : false;
  config.legend_column_width = config.legend_column_width || 140;
  config.legend_line_height = config.legend_line_height || 10;
  config.segment_radial_padding = "segment_radial_padding" in config ? config.segment_radial_padding : 16;
  config.segment_angular_padding = "segment_angular_padding" in config ? config.segment_angular_padding : 12;
  config.chart_padding = "chart_padding" in config ? config.chart_padding : 60;
  config.blip_collision_radius = "blip_collision_radius" in config ? config.blip_collision_radius : 14;
  config.legend_vertical_spacing = config.legend_vertical_spacing || 20;
  config.radar_horizontal_offset = "radar_horizontal_offset" in config ? config.radar_horizontal_offset : Math.round(config.legend_column_width * 0.25);
  config.debug_geometry = "debug_geometry" in config ? config.debug_geometry : false;
  var viewport_width = window.innerWidth || document.documentElement.clientWidth;
  var viewport_height = window.innerHeight || document.documentElement.clientHeight;
  if (viewport_width < 1024 && !config.scale) {
    var scale_factor = Math.min(viewport_width / 1450, viewport_height / 1000);
    config.scale = Math.max(0.5, Math.min(1, scale_factor));
  }
  var grid_quadrants = config.quadrants.length;
  var grid_rings = config.rings.length;
  if (grid_quadrants >= 5 || grid_rings >= 6) {
    var complexity_multiplier = 1 + (grid_quadrants - 4) * 0.05 + (grid_rings - 4) * 0.03;
    if (!config.width_override) {
      config.width = Math.round(config.width * Math.min(complexity_multiplier, 1.3));
    }
    if (!config.height_override) {
      config.height = Math.round(config.height * Math.min(complexity_multiplier, 1.3));
    }
    if (grid_quadrants >= 7 || grid_rings >= 7) {
      config.blip_collision_radius = Math.max(10, config.blip_collision_radius * 0.9);
    }
  }
  var title_height = config.print_layout && config.title ? 60 : 0;
  var footer_height = config.print_layout ? 40 : 0;
  var minimum_chart_height = 2 * config.chart_padding + 40;
  var available_height = Math.max(minimum_chart_height, config.height - title_height - footer_height);
  var available_width = Math.max(2 * config.chart_padding + 40, config.width);
  var raw_outer_radius = Math.min(available_width, available_height) / 2 - config.chart_padding;
  var target_outer_radius = Math.max(10, raw_outer_radius);
  validateConfig(config);
  const rng = new SeededRandom(42);
  const random = () => rng.next();
  const random_between = (min, max) => rng.between(min, max);
  const normal_between = (min, max) => rng.normalBetween(min, max);
  const quadrants = [];
  const num_quadrants = config.quadrants.length;
  const angle_per_quadrant = 2 / num_quadrants;
  const rotation_offset = num_quadrants === 2 ? -0.5 : 0;
  for (let i2 = 0;i2 < num_quadrants; i2++) {
    const start_angle = -1 + i2 * angle_per_quadrant + rotation_offset;
    const end_angle = -1 + (i2 + 1) * angle_per_quadrant + rotation_offset;
    const mid_angle2 = -Math.PI + (i2 + 0.5) * angle_per_quadrant * Math.PI + rotation_offset * Math.PI;
    quadrants.push({
      radial_min: start_angle,
      radial_max: end_angle,
      factor_x: Math.cos(mid_angle2),
      factor_y: Math.sin(mid_angle2)
    });
  }
  const num_rings = config.rings.length;
  const base_pattern = [130, 220, 310, 400];
  const max_base_radius = base_pattern[base_pattern.length - 1];
  const ring_template = [];
  if (num_rings === 4) {
    for (let i2 = 0;i2 < 4; i2++) {
      ring_template.push(base_pattern[i2]);
    }
  } else {
    for (let i2 = 0;i2 < num_rings; i2++) {
      const pattern_position = i2 / (num_rings - 1) * 3;
      const pattern_index = Math.floor(pattern_position);
      const fraction = pattern_position - pattern_index;
      let radius;
      if (pattern_index >= 3) {
        radius = max_base_radius;
      } else {
        radius = base_pattern[pattern_index] + (base_pattern[pattern_index + 1] - base_pattern[pattern_index]) * fraction;
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
    for (var i2 = 0;i2 < num_quads; i2++) {
      var targetColumn = i2 % 2 === 0 ? right_column : left_column;
      targetColumn.push(i2);
    }
    var baseY = -outer_radius + 80;
    var verticalAvailable = 2 * outer_radius - 160;
    function stepFor(count) {
      if (count <= 1) {
        return 0;
      }
      return Math.max(config.legend_vertical_spacing, verticalAvailable / (count - 1));
    }
    function assignOffsets(column, xPosition) {
      var step = stepFor(column.length);
      for (var idx = 0;idx < column.length; idx++) {
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
  const bounded_interval = boundedInterval;
  const bounded_ring = boundedRing;
  const bounded_box = boundedBox;
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
      3 * Math.PI / 2,
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
    candidates.forEach(function(angle2) {
      var cosA = Math.cos(angle2);
      var sinA = Math.sin(angle2);
      min_x = Math.min(min_x, cosA);
      max_x = Math.max(max_x, cosA);
      min_y = Math.min(min_y, sinA);
      max_y = Math.max(max_y, sinA);
    });
    var padding = 20;
    return {
      min: {
        x: min_x * radius - padding,
        y: min_y * radius - padding
      },
      max: {
        x: max_x * radius + padding,
        y: max_y * radius + padding
      }
    };
  }
  function segment(quadrant2, ring2) {
    var min_angle2 = quadrants[quadrant2].radial_min * Math.PI;
    var max_angle2 = quadrants[quadrant2].radial_max * Math.PI;
    var base_inner_radius = ring2 === 0 ? 30 : rings[ring2 - 1].radius;
    var base_outer_radius = rings[ring2].radius;
    var inner_radius = base_inner_radius + config.segment_radial_padding;
    var outer_radius2 = base_outer_radius - config.segment_radial_padding;
    if (outer_radius2 <= inner_radius) {
      var midpoint2 = (base_inner_radius + base_outer_radius) / 2;
      inner_radius = Math.max(0, midpoint2 - 1);
      outer_radius2 = midpoint2 + 1;
    }
    var ring_center = (inner_radius + outer_radius2) / 2;
    var angular_padding = config.segment_angular_padding / Math.max(ring_center, 1);
    var angular_limit2 = Math.max(0, (max_angle2 - min_angle2) / 2 - 0.01);
    angular_padding = Math.min(angular_padding, angular_limit2);
    var angle_min2 = min_angle2 + angular_padding;
    var angle_max2 = max_angle2 - angular_padding;
    if (angle_max2 <= angle_min2) {
      angle_min2 = min_angle2;
      angle_max2 = max_angle2;
    }
    var segment_bounds = computeQuadrantBounds(angle_min2, angle_max2, outer_radius2);
    var cartesian_min = segment_bounds.min;
    var cartesian_max = segment_bounds.max;
    function clampPoint(point) {
      var c = bounded_box(point, cartesian_min, cartesian_max);
      var p = polar(c);
      p.r = bounded_interval(p.r, inner_radius, outer_radius2);
      p.t = bounded_interval(p.t, angle_min2, angle_max2);
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
      clip: function(d) {
        var clipped = clampPoint({ x: d.x, y: d.y });
        d.x = clipped.x;
        d.y = clipped.y;
        return clipped;
      },
      random: function() {
        return cartesian({
          t: random_between(angle_min2, angle_max2),
          r: random_between(inner_radius, outer_radius2)
        });
      }
    };
  }
  function gridPosition(entries2, segmentInfo) {
    if (entries2.length === 0)
      return;
    var min_angle2 = quadrants[segmentInfo.quadrant].radial_min * Math.PI;
    var max_angle2 = quadrants[segmentInfo.quadrant].radial_max * Math.PI;
    var base_inner_radius = segmentInfo.ring === 0 ? 30 : rings[segmentInfo.ring - 1].radius;
    var base_outer_radius = rings[segmentInfo.ring].radius;
    var inner_radius = base_inner_radius + config.segment_radial_padding;
    var outer_radius2 = base_outer_radius - config.segment_radial_padding;
    if (outer_radius2 <= inner_radius) {
      var midpoint2 = (base_inner_radius + base_outer_radius) / 2;
      inner_radius = Math.max(0, midpoint2 - 1);
      outer_radius2 = midpoint2 + 1;
    }
    var ring_center = (inner_radius + outer_radius2) / 2;
    var angular_padding = config.segment_angular_padding / Math.max(ring_center, 1);
    var angular_limit2 = Math.max(0, (max_angle2 - min_angle2) / 2 - 0.01);
    angular_padding = Math.min(angular_padding, angular_limit2);
    var angle_min2 = min_angle2 + angular_padding;
    var angle_max2 = max_angle2 - angular_padding;
    var angle_range = angle_max2 - angle_min2;
    var radius_range = outer_radius2 - inner_radius;
    var count = entries2.length;
    var effective_radius = segmentInfo.ring === 0 ? inner_radius : ring_center;
    var segment_arc_length = angle_range * effective_radius;
    var segment_radial_depth = radius_range;
    var item_size = config.blip_collision_radius || 14;
    var max_angular_items = Math.max(3, Math.floor(segment_arc_length / (item_size * 0.7)));
    var max_radial_items = Math.max(3, Math.floor(segment_radial_depth / (item_size * 0.7)));
    var angular_divisions, radial_divisions;
    var base = Math.ceil(Math.sqrt(count));
    var aspect_ratio = segment_arc_length / Math.max(segment_radial_depth, 1);
    if (count === 1) {
      angular_divisions = 1;
      radial_divisions = 1;
    } else if (count <= 4) {
      angular_divisions = Math.min(count, max_angular_items);
      radial_divisions = Math.ceil(count / angular_divisions);
    } else {
      if (aspect_ratio > 2) {
        angular_divisions = Math.min(max_angular_items, Math.ceil(base * 1.5));
        radial_divisions = Math.ceil(count / angular_divisions);
      } else if (aspect_ratio > 1) {
        angular_divisions = Math.min(max_angular_items, Math.ceil(base * 1.2));
        radial_divisions = Math.ceil(count / angular_divisions);
      } else if (aspect_ratio < 0.5) {
        var radial_bias = segmentInfo.ring === 0 ? 0.85 : 0.7;
        angular_divisions = Math.min(max_angular_items, Math.max(3, Math.floor(base * radial_bias)));
        radial_divisions = Math.ceil(count / angular_divisions);
      } else {
        angular_divisions = Math.min(max_angular_items, Math.max(3, base));
        radial_divisions = Math.ceil(count / angular_divisions);
      }
      angular_divisions = Math.max(2, Math.min(angular_divisions, max_angular_items));
      radial_divisions = Math.max(2, Math.min(radial_divisions, max_radial_items));
    }
    for (var i2 = 0;i2 < entries2.length; i2++) {
      var entry2 = entries2[i2];
      var angular_index = i2 % angular_divisions;
      var radial_index = Math.floor(i2 / angular_divisions);
      var is_overcrowded = radial_index >= radial_divisions;
      if (is_overcrowded) {
        var total_cells = angular_divisions * radial_divisions;
        var cell_index = i2 % total_cells;
        angular_index = cell_index % angular_divisions;
        radial_index = Math.floor(cell_index / angular_divisions);
      }
      var angular_fraction = (angular_index + 0.15 + random() * 0.7) / angular_divisions;
      var radial_fraction = (radial_index + 0.15 + random() * 0.7) / radial_divisions;
      var angle2 = angle_min2 + angular_fraction * angle_range;
      var radius = inner_radius + radial_fraction * radius_range;
      var point = cartesian({ t: angle2, r: radius });
      entry2.x = point.x;
      entry2.y = point.y;
    }
  }
  var segmented = new Array(num_quadrants);
  for (let quadrant2 = 0;quadrant2 < num_quadrants; quadrant2++) {
    segmented[quadrant2] = new Array(num_rings);
    for (var ring = 0;ring < num_rings; ring++) {
      segmented[quadrant2][ring] = [];
    }
  }
  for (var i = 0;i < config.entries.length; i++) {
    var entry = config.entries[i];
    segmented[entry.quadrant][entry.ring].push(entry);
  }
  for (var i = 0;i < config.entries.length; i++) {
    var entry = config.entries[i];
    entry.segment = segment(entry.quadrant, entry.ring);
    entry.color = entry.active || config.print_layout ? config.rings[entry.ring].color : config.colors.inactive;
  }
  for (let quadrant2 = 0;quadrant2 < num_quadrants; quadrant2++) {
    for (let ring2 = 0;ring2 < num_rings; ring2++) {
      gridPosition(segmented[quadrant2][ring2], { quadrant: quadrant2, ring: ring2 });
    }
  }
  var id = 1;
  var quadrant_order = [];
  if (num_quadrants === 4) {
    quadrant_order = [2, 3, 1, 0];
  } else {
    var start_index = Math.floor(num_quadrants / 2);
    for (var i = 0;i < num_quadrants; i++) {
      quadrant_order.push((start_index + i) % num_quadrants);
    }
  }
  for (var quadrant of quadrant_order) {
    for (var ring = 0;ring < num_rings; ring++) {
      var entries = segmented[quadrant][ring];
      entries.sort(function(a, b) {
        return a.label.localeCompare(b.label);
      });
      for (var i = 0;i < entries.length; i++) {
        entries[i].id = "" + id++;
      }
    }
  }
  for (let quadrant2 = 0;quadrant2 < num_quadrants; quadrant2++) {
    for (let ring2 = 0;ring2 < num_rings; ring2++) {
      var entries = segmented[quadrant2][ring2];
      if (entries.length === 0)
        continue;
      var seg_base_inner_radius = ring2 === 0 ? 30 : rings[ring2 - 1].radius;
      var seg_base_outer_radius = rings[ring2].radius;
      var seg_inner_radius = seg_base_inner_radius + config.segment_radial_padding;
      var seg_outer_radius = seg_base_outer_radius - config.segment_radial_padding;
      if (seg_outer_radius <= seg_inner_radius) {
        var midpoint = (seg_base_inner_radius + seg_base_outer_radius) / 2;
        seg_inner_radius = Math.max(0, midpoint - 1);
        seg_outer_radius = midpoint + 1;
      }
      var seg_angle_range = (quadrants[quadrant2].radial_max - quadrants[quadrant2].radial_min) * Math.PI;
      var seg_ring_center = (seg_inner_radius + seg_outer_radius) / 2;
      var seg_radial_thickness = seg_outer_radius - seg_inner_radius;
      var segment_area = seg_angle_range * seg_ring_center * seg_radial_thickness;
      var area_per_entry = segment_area / entries.length;
      var ideal_radius = Math.sqrt(area_per_entry / Math.PI) * 0.55;
      var adaptive_radius = Math.max(12, ideal_radius);
      if (entries.length > 10) {
        adaptive_radius = Math.max(adaptive_radius, 13);
      }
      if (entries.length > 15) {
        adaptive_radius = Math.max(adaptive_radius, 14);
      }
      if (ring2 === 0 && num_quadrants >= 6) {
        adaptive_radius = Math.max(10, adaptive_radius * 0.9);
      }
      for (var i = 0;i < entries.length; i++) {
        entries[i].collision_radius = adaptive_radius;
      }
    }
  }
  function translate(x, y) {
    return "translate(" + x + "," + y + ")";
  }
  function viewbox(quadrant2) {
    var outer_radius2 = rings[rings.length - 1].radius;
    var padding = 20;
    return [
      Math.max(0, quadrants[quadrant2].factor_x * outer_radius2) - (outer_radius2 + padding),
      Math.max(0, quadrants[quadrant2].factor_y * outer_radius2) - (outer_radius2 + padding),
      outer_radius2 + 2 * padding,
      outer_radius2 + 2 * padding
    ].join(" ");
  }
  config.scale = config.scale || 1;
  var scaled_width = config.width * config.scale;
  var scaled_height = config.height * config.scale;
  var svg = d3.select("svg#" + config.svg_id).style("background-color", config.colors.background).attr("width", scaled_width).attr("height", scaled_height);
  function ensureLayoutStructure(svgSelection) {
    var existing = svgSelection.node().closest(".radar-layout");
    if (existing) {
      return d3.select(existing);
    }
    var svgNode = svgSelection.node();
    var parent = svgNode.parentNode;
    var wrapper = document.createElement("div");
    wrapper.className = "radar-layout";
    var leftColumn = document.createElement("div");
    leftColumn.className = "radar-legend-column left";
    var svgContainer = document.createElement("div");
    svgContainer.className = "radar-svg-container";
    var rightColumn = document.createElement("div");
    rightColumn.className = "radar-legend-column right";
    parent.insertBefore(wrapper, svgNode);
    svgContainer.appendChild(svgNode);
    wrapper.appendChild(leftColumn);
    wrapper.appendChild(svgContainer);
    wrapper.appendChild(rightColumn);
    return d3.select(wrapper);
  }
  var layoutWrapper = ensureLayoutStructure(svg);
  var legendLeftColumn = layoutWrapper.select(".radar-legend-column.left");
  var legendRightColumn = layoutWrapper.select(".radar-legend-column.right");
  var layoutWidth = layoutWrapper.node().getBoundingClientRect().width || config.width;
  var minLegendColumnWidth = config.legend_column_width * 2 + 60;
  var maxLegendColumnWidth = config.legend_column_width * 4 + 80;
  var targetLegendColumnWidth = Math.min(maxLegendColumnWidth, Math.max(minLegendColumnWidth, layoutWidth * 0.3));
  var legendSectionColumns = Math.min(4, Math.max(2, Math.floor(targetLegendColumnWidth / (config.legend_column_width + 20))));
  legendLeftColumn.style("gap", config.legend_vertical_spacing + "px").style("width", targetLegendColumnWidth + "px");
  legendRightColumn.style("gap", config.legend_vertical_spacing + "px").style("width", targetLegendColumnWidth + "px");
  var radar = svg.append("g");
  if ("zoomed_quadrant" in config) {
    svg.attr("viewBox", viewbox(config.zoomed_quadrant));
  } else {
    var radar_center_y = scaled_height / 2 + (title_height - footer_height) / 2;
    var radar_center_x = scaled_width / 2 + config.radar_horizontal_offset;
    radar.attr("transform", translate(radar_center_x, radar_center_y).concat(`scale(${config.scale})`));
  }
  var grid = radar.append("g");
  config.font_family = config.font_family || "Arial, Helvetica";
  for (var i = 0;i < num_quadrants; i++) {
    var angle = -Math.PI + i * 2 * Math.PI / num_quadrants;
    grid.append("line").attr("x1", 0).attr("y1", 0).attr("x2", outer_radius * Math.cos(angle)).attr("y2", outer_radius * Math.sin(angle)).attr("class", "quadrant-line quadrant-line-" + i).style("stroke", config.colors.grid).style("stroke-width", 1.5).style("stroke-opacity", 0.3);
  }
  var defs = grid.append("defs");
  var filter = defs.append("filter").attr("x", 0).attr("y", 0).attr("width", 1).attr("height", 1).attr("id", "solid");
  filter.append("feFlood").attr("flood-color", "rgb(0, 0, 0, 0.8)");
  filter.append("feComposite").attr("in", "SourceGraphic");
  for (var i = 0;i < rings.length; i++) {
    var outer = rings[i].radius;
    var inner = i === 0 ? 0 : rings[i - 1].radius;
    var thickness = Math.max(outer - inner, 1);
    var labelRadius = outer - thickness / 2;
    var labelFontSize = Math.max(12, Math.min(32, thickness * 0.45));
    if (i > 0) {
      grid.append("circle").attr("cx", 0).attr("cy", 0).attr("r", outer).attr("class", "ring ring-" + i).style("fill", i % 2 === 0 ? "rgba(0, 0, 0, 0.01)" : "rgba(0, 0, 0, 0.015)").style("stroke", "none").style("pointer-events", "none");
    }
    grid.append("circle").attr("cx", 0).attr("cy", 0).attr("r", outer).attr("class", "ring-border ring-border-" + i).style("fill", "none").style("stroke", config.colors.grid).style("stroke-width", i === 0 ? 2 : 1).style("stroke-opacity", i === 0 ? 0.4 : 0.25);
    if (config.print_layout) {
      grid.append("text").text(config.rings[i].name).attr("y", -labelRadius).attr("text-anchor", "middle").attr("dominant-baseline", "middle").style("fill", config.rings[i].color).style("opacity", 0.35).style("font-family", config.font_family).style("font-size", labelFontSize + "px").style("font-weight", "bold").style("pointer-events", "none").style("user-select", "none");
    }
  }
  function legend_transform(quadrant2, ring2, legendColumnWidth, index = null, currentHeight = 0) {
    var num_columns = num_rings >= 7 ? 3 : 2;
    var rings_per_column = Math.ceil(num_rings / num_columns);
    var column = Math.floor(ring2 / rings_per_column);
    const dx = column * legendColumnWidth;
    let dy;
    if (index == null) {
      dy = currentHeight;
    } else {
      dy = currentHeight + index * config.legend_line_height;
    }
    return translate(config.legend_offset[quadrant2].x + dx, config.legend_offset[quadrant2].y + dy);
  }
  if (config.print_layout) {
    radar.append("a").attr("href", config.repo_url).attr("transform", translate(config.title_offset.x, config.title_offset.y)).append("text").attr("class", "hover-underline").text(config.title).style("font-family", config.font_family).style("font-size", "30").style("font-weight", "bold");
    radar.append("text").attr("transform", translate(config.title_offset.x, config.title_offset.y + 20)).text(config.date || "").style("font-family", config.font_family).style("font-size", "14").style("fill", "#999");
    radar.append("text").attr("transform", translate(config.footer_offset.x, config.footer_offset.y)).text("▲ moved up     ▼ moved down     ★ new     ⬤ no change").attr("xml:space", "preserve").style("font-family", config.font_family).style("font-size", "12px");
    if (config.print_layout) {
      legendLeftColumn.style("display", "flex");
      legendRightColumn.style("display", "flex");
      renderLegendColumns();
    } else {
      legendLeftColumn.style("display", "none").html("");
      legendRightColumn.style("display", "none").html("");
    }
  }
  function renderLegendColumns() {
    legendLeftColumn.html("");
    legendRightColumn.html("");
    var right_count = Math.ceil(num_quadrants / 2);
    var left_count = Math.floor(num_quadrants / 2);
    var right_start = num_quadrants - 2;
    var leftQuadrants = [];
    var rightQuadrants = [];
    for (var i2 = 0;i2 < right_count; i2++) {
      rightQuadrants.push((right_start + i2) % num_quadrants);
    }
    for (var i2 = 0;i2 < left_count; i2++) {
      leftQuadrants.push((right_start - 1 - i2 + num_quadrants) % num_quadrants);
    }
    function targetColumn(quadrant2) {
      return leftQuadrants.includes(quadrant2) ? legendLeftColumn : legendRightColumn;
    }
    for (let quadrant2 = 0;quadrant2 < num_quadrants; quadrant2++) {
      var column = targetColumn(quadrant2);
      var section = column.append("div").attr("class", "legend-section").style("--legend-columns", legendSectionColumns);
      section.append("div").attr("class", "legend-quadrant-name").text(config.quadrants[quadrant2].name);
      var ringsContainer = section.append("div").attr("class", "legend-rings");
      for (let ring2 = 0;ring2 < num_rings; ring2++) {
        var entriesInRing = segmented[quadrant2][ring2];
        if (!entriesInRing.length) {
          continue;
        }
        var ringBlock = ringsContainer.append("div").attr("class", "legend-ring");
        ringBlock.append("div").attr("class", "legend-ring-name").style("color", config.rings[ring2].color).text(config.rings[ring2].name);
        var entriesList = ringBlock.append("div").attr("class", "legend-ring-entries");
        entriesList.selectAll("a").data(entriesInRing).enter().append("a").attr("href", function(d) {
          return d.link ? d.link : "#";
        }).attr("target", function(d) {
          return d.link && config.links_in_new_tabs ? "_blank" : null;
        }).attr("id", function(d) {
          return "legendItem" + d.id;
        }).attr("class", "legend-entry").text(function(d) {
          return d.id + ". " + d.label;
        }).on("mouseover", function(event, d) {
          showBubble(d);
          highlightLegendItem(d);
        }).on("mouseout", function(event, d) {
          hideBubble(d);
          unhighlightLegendItem(d);
        });
      }
    }
  }
  var rink = radar.append("g").attr("id", "rink");
  var bubble = radar.append("g").attr("id", "bubble").attr("x", 0).attr("y", 0).style("opacity", 0).style("pointer-events", "none").style("user-select", "none");
  bubble.append("rect").attr("rx", 4).attr("ry", 4).style("fill", "#333");
  bubble.append("text").style("font-family", config.font_family).style("font-size", "10px").style("fill", "#fff");
  bubble.append("path").attr("d", "M 0,0 10,0 5,8 z").style("fill", "#333");
  function showBubble(d) {
    if (d.active || config.print_layout) {
      var tooltip = d3.select("#bubble text").text(d.label);
      var bbox = tooltip.node().getBBox();
      var x = d.rendered_x !== undefined ? d.rendered_x : d.x;
      var y = d.rendered_y !== undefined ? d.rendered_y : d.y;
      d3.select("#bubble").attr("transform", translate(x - bbox.width / 2, y - 16)).style("opacity", 0.8);
      d3.select("#bubble rect").attr("x", -5).attr("y", -bbox.height).attr("width", bbox.width + 10).attr("height", bbox.height + 4);
      d3.select("#bubble path").attr("transform", translate(bbox.width / 2 - 5, 3));
    }
  }
  function hideBubble(d) {
    var bubble2 = d3.select("#bubble").attr("transform", translate(0, 0)).style("opacity", 0);
  }
  function highlightLegendItem(d) {
    var legendItem = document.getElementById("legendItem" + d.id);
    if (legendItem) {
      legendItem.classList.add("legend-highlight");
    }
  }
  function unhighlightLegendItem(d) {
    var legendItem = document.getElementById("legendItem" + d.id);
    if (legendItem) {
      legendItem.classList.remove("legend-highlight");
    }
  }
  var blips = rink.selectAll(".blip").data(config.entries).enter().append("g").attr("class", "blip").attr("transform", function(d, i2) {
    return legend_transform(d.quadrant, d.ring, config.legend_column_width, i2);
  }).on("mouseover", function(event, d) {
    showBubble(d);
    highlightLegendItem(d);
  }).on("mouseout", function(event, d) {
    hideBubble(d);
    unhighlightLegendItem(d);
  });
  blips.each(function(d) {
    var blip = d3.select(this);
    if (d.active && Object.prototype.hasOwnProperty.call(d, "link") && d.link) {
      blip = blip.append("a").attr("xlink:href", d.link);
      if (config.links_in_new_tabs) {
        blip.attr("target", "_blank");
      }
    }
    if (d.moved == 1) {
      blip.append("path").attr("d", "M -11,5 11,5 0,-13 z").style("fill", d.color);
    } else if (d.moved == -1) {
      blip.append("path").attr("d", "M -11,-5 11,-5 0,13 z").style("fill", d.color);
    } else if (d.moved == 2) {
      blip.append("path").attr("d", d3.symbol().type(d3.symbolStar).size(200)).style("fill", d.color);
    } else {
      blip.append("circle").attr("r", 9).attr("fill", d.color);
    }
    if (d.active || config.print_layout) {
      var blip_text = config.print_layout ? d.id : d.label.match(/[a-z]/i);
      blip.append("text").text(blip_text).attr("y", 3).attr("text-anchor", "middle").style("fill", "#fff").style("font-family", config.font_family).style("font-size", function(d2) {
        return blip_text.length > 2 ? "8px" : "9px";
      }).style("pointer-events", "none").style("user-select", "none");
    }
  });
  function ticked() {
    blips.attr("transform", function(d) {
      var clipped = d.segment.clip(d);
      d.rendered_x = clipped.x;
      d.rendered_y = clipped.y;
      return translate(clipped.x, clipped.y);
    });
    if (config.debug_geometry) {
      d3.select("#debug-collision-radii").selectAll("circle").attr("cx", function(d) {
        return d.x;
      }).attr("cy", function(d) {
        return d.y;
      });
    }
  }
  d3.forceSimulation().nodes(config.entries).velocityDecay(0.15).alphaDecay(0.008).alphaMin(0.00005).force("collision", d3.forceCollide().radius(function(d) {
    return d.collision_radius || config.blip_collision_radius;
  }).strength(1).iterations(6)).on("tick", ticked).tick(400);
  if (config.debug_geometry) {
    var debugLayer = radar.append("g").attr("id", "debug-layer");
    var debug_outer_radius = rings[rings.length - 1].radius;
    for (let q = 0;q < num_quadrants; q++) {
      for (let r = 0;r < num_rings; r++) {
        var seg_base_inner = r === 0 ? 30 : rings[r - 1].radius;
        var seg_base_outer = rings[r].radius;
        var seg_inner = seg_base_inner + config.segment_radial_padding;
        var seg_outer = seg_base_outer - config.segment_radial_padding;
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
        var offset_magnitude = Math.PI / (2 * num_quadrants);
        var arc_offset = num_quadrants % 4 === 1 ? offset_magnitude : -offset_magnitude;
        var arcPath = d3.arc().innerRadius(seg_inner).outerRadius(seg_outer).startAngle(-angle_max + arc_offset).endAngle(-angle_min + arc_offset);
        debugLayer.append("path").attr("d", arcPath).attr("fill", "none").attr("stroke", r === 0 ? "#ff0000" : "#00ffff").attr("stroke-width", r === 0 ? 2 : 1).attr("stroke-dasharray", "5,5").attr("opacity", 0.5);
        var bounds = computeQuadrantBounds(quadrants[q].radial_min * Math.PI, quadrants[q].radial_max * Math.PI, seg_outer);
        debugLayer.append("rect").attr("x", bounds.min.x).attr("y", bounds.min.y).attr("width", bounds.max.x - bounds.min.x).attr("height", bounds.max.y - bounds.min.y).attr("fill", "none").attr("stroke", "#ffff00").attr("stroke-width", 1).attr("stroke-dasharray", "3,3").attr("opacity", 0.3);
        if (r === 0) {
          var mid_angle = (angle_min + angle_max) / 2;
          var label_radius = (seg_inner + seg_outer) / 2;
          var label_x = Math.cos(mid_angle) * label_radius;
          var label_y = Math.sin(mid_angle) * label_radius;
          var entries_count = segmented[q][r].length;
          var arc_length = (angle_max - angle_min) * seg_inner;
          debugLayer.append("text").attr("x", label_x).attr("y", label_y).attr("text-anchor", "middle").attr("font-size", "10px").attr("fill", "#ff0000").attr("font-weight", "bold").text(`Q${q}R${r}: ${entries_count} items, arc=${arc_length.toFixed(0)}px`);
        }
      }
    }
    debugLayer.append("g").attr("id", "debug-collision-radii").selectAll("circle").data(config.entries).enter().append("circle").attr("cx", function(d) {
      return d.x;
    }).attr("cy", function(d) {
      return d.y;
    }).attr("r", function(d) {
      return d.collision_radius || config.blip_collision_radius;
    }).attr("fill", "none").attr("stroke", function(d) {
      return d.ring === 0 ? "#00ff00" : "#0000ff";
    }).attr("stroke-width", 1).attr("stroke-dasharray", "2,2").attr("opacity", 0.4);
    debugLayer.append("line").attr("x1", -debug_outer_radius).attr("y1", 0).attr("x2", debug_outer_radius).attr("y2", 0).attr("stroke", "#666").attr("stroke-width", 0.5).attr("opacity", 0.3);
    debugLayer.append("line").attr("x1", 0).attr("y1", -debug_outer_radius).attr("x2", 0).attr("y2", debug_outer_radius).attr("stroke", "#666").attr("stroke-width", 0.5).attr("opacity", 0.3);
    for (var i = 0;i < num_quadrants; i++) {
      var grid_angle = -Math.PI + i * 2 * Math.PI / num_quadrants;
      debugLayer.append("line").attr("x1", 0).attr("y1", 0).attr("x2", debug_outer_radius * Math.cos(grid_angle)).attr("y2", debug_outer_radius * Math.sin(grid_angle)).attr("stroke", "#ff00ff").attr("stroke-width", 2).attr("opacity", 0.6).attr("stroke-dasharray", "10,5");
    }
    var debugLegend = debugLayer.append("g").attr("transform", translate(-debug_outer_radius + 10, -debug_outer_radius + 10));
    debugLegend.append("text").attr("x", 0).attr("y", 0).attr("font-size", "11px").attr("font-weight", "bold").attr("fill", "#000").text("DEBUG MODE");
    debugLegend.append("text").attr("x", 0).attr("y", 15).attr("font-size", "9px").attr("fill", "#ff0000").text("━━ Ring 0 polar sector");
    debugLegend.append("text").attr("x", 0).attr("y", 28).attr("font-size", "9px").attr("fill", "#00ffff").text("━━ Other rings polar sector");
    debugLegend.append("text").attr("x", 0).attr("y", 41).attr("font-size", "9px").attr("fill", "#ffff00").text("━━ Cartesian bounding box");
    debugLegend.append("text").attr("x", 0).attr("y", 54).attr("font-size", "9px").attr("fill", "#00ff00").text("○ Collision radius (Ring 0)");
  }
  function ringDescriptionsTable() {
    var table = d3.select("body").append("table").attr("class", "radar-table").style("border-collapse", "collapse").style("position", "relative").style("top", "-70px").style("margin-left", "50px").style("margin-right", "50px").style("font-family", config.font_family).style("font-size", "13px").style("text-align", "left");
    var thead = table.append("thead");
    var tbody = table.append("tbody");
    var columnWidth = `${100 / config.rings.length}%`;
    var headerRow = thead.append("tr").style("border", "1px solid #ddd");
    headerRow.selectAll("th").data(config.rings).enter().append("th").style("padding", "8px").style("border", "1px solid #ddd").style("background-color", (d) => d.color).style("color", "#fff").style("width", columnWidth).text((d) => d.name);
    var descriptionRow = tbody.append("tr").style("border", "1px solid #ddd");
    descriptionRow.selectAll("td").data(config.rings).enter().append("td").style("padding", "8px").style("border", "1px solid #ddd").style("width", columnWidth).text((d) => d.description);
  }
  if (config.print_ring_descriptions_table) {
    ringDescriptionsTable();
  }
}
var src_default = radar_visualization;



  // Return the main function
  return radar_visualization;
})();

// Export for all environments
if (typeof window !== 'undefined') {
  window.radar_visualization = radar_visualization;
}
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = radar_visualization;
}
if (typeof global !== 'undefined') {
  global.radar_visualization = radar_visualization;
}
