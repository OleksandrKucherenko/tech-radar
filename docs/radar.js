// Tech Radar Visualization - Bundled from ES6 modules
// Version: 0.0.1-dev+0583ae2
// License: MIT
// Source: https://github.com/OleksandrKucherenko/tech-radar

var radar_visualization = (function() {
  'use strict';

  // src/rendering/helpers.js
function translate(x, y) {
  return `translate(${x},${y})`;
}
function viewbox(quadrantIndex, quadrants, rings) {
  const outer_radius = rings[rings.length - 1].radius;
  const padding = 20;
  return [
    Math.max(0, quadrants[quadrantIndex].factor_x * outer_radius) - (outer_radius + padding),
    Math.max(0, quadrants[quadrantIndex].factor_y * outer_radius) - (outer_radius + padding),
    outer_radius + 2 * padding,
    outer_radius + 2 * padding
  ].join(" ");
}
function computeLegendOffsets(numQuadrants, outerRadius, config) {
  if (config.legend_offset) {
    return config.legend_offset;
  }
  const offsets = new Array(numQuadrants);
  const legend_overlap = outerRadius * 0.08;
  const left_x = -outerRadius - config.legend_column_width + legend_overlap;
  const right_x = outerRadius - legend_overlap;
  const left_column = [];
  const right_column = [];
  for (let i = 0;i < numQuadrants; i++) {
    const targetColumn = i % 2 === 0 ? right_column : left_column;
    targetColumn.push(i);
  }
  const baseY = -outerRadius + 80;
  const verticalAvailable = 2 * outerRadius - 160;
  function stepFor(count) {
    if (count <= 1) {
      return 0;
    }
    return Math.max(config.legend_vertical_spacing, verticalAvailable / (count - 1));
  }
  function assignOffsets(column, xPosition) {
    const step = stepFor(column.length);
    for (let idx = 0;idx < column.length; idx++) {
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
function ensureLayoutStructure(svgSelection) {
  const existing = svgSelection.node().closest(".radar-layout");
  if (existing) {
    return svgSelection.select(() => existing);
  }
  const svgNode = svgSelection.node();
  const parent = svgNode.parentNode;
  const wrapper = document.createElement("div");
  wrapper.className = "radar-layout";
  const leftColumn = document.createElement("div");
  leftColumn.className = "radar-legend-column left";
  const svgContainer = document.createElement("div");
  svgContainer.className = "radar-svg-container";
  const rightColumn = document.createElement("div");
  rightColumn.className = "radar-legend-column right";
  parent.insertBefore(wrapper, svgNode);
  svgContainer.appendChild(svgNode);
  wrapper.appendChild(leftColumn);
  wrapper.appendChild(svgContainer);
  wrapper.appendChild(rightColumn);
  return svgSelection.select(() => wrapper);
}

// src/config/config-defaults.js
function applyConfigDefaults(config) {
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
  const viewport_width = window.innerWidth || document.documentElement.clientWidth;
  const viewport_height = window.innerHeight || document.documentElement.clientHeight;
  if (viewport_width < 1024 && !config.scale) {
    const scale_factor = Math.min(viewport_width / 1450, viewport_height / 1000);
    config.scale = Math.max(0.5, Math.min(1, scale_factor));
  }
  const grid_quadrants = config.quadrants.length;
  const grid_rings = config.rings.length;
  if (grid_quadrants >= 5 || grid_rings >= 6) {
    const complexity_multiplier = 1 + (grid_quadrants - 4) * 0.05 + (grid_rings - 4) * 0.03;
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
}
function calculateDimensions(config) {
  const title_height = config.print_layout && config.title ? 60 : 0;
  const footer_height = config.print_layout ? 40 : 0;
  const minimum_chart_height = 2 * config.chart_padding + 40;
  const available_height = Math.max(minimum_chart_height, config.height - title_height - footer_height);
  const available_width = Math.max(2 * config.chart_padding + 40, config.width);
  const raw_outer_radius = Math.min(available_width, available_height) / 2 - config.chart_padding;
  const target_outer_radius = Math.max(10, raw_outer_radius);
  return {
    title_height,
    footer_height,
    available_height,
    available_width,
    target_outer_radius
  };
}
function configureOffsets(config, outerRadius, numQuadrants) {
  if (!config.title_offset) {
    config.title_offset = {
      x: -outerRadius,
      y: -outerRadius - 40
    };
  }
  if (!config.footer_offset) {
    config.footer_offset = {
      x: -outerRadius,
      y: outerRadius + 60
    };
  }
  config.legend_offset = computeLegendOffsets(numQuadrants, outerRadius, config);
}

// src/geometry/quadrant-calculator.js
function generateQuadrants(numQuadrants) {
  const quadrants = [];
  const anglePerQuadrant = 2 / numQuadrants;
  const rotationOffset = numQuadrants === 2 ? -0.5 : 0;
  for (let i = 0;i < numQuadrants; i++) {
    const startAngle = -1 + i * anglePerQuadrant + rotationOffset;
    const endAngle = -1 + (i + 1) * anglePerQuadrant + rotationOffset;
    const midAngle = -Math.PI + (i + 0.5) * anglePerQuadrant * Math.PI + rotationOffset * Math.PI;
    quadrants.push({
      radial_min: startAngle,
      radial_max: endAngle,
      factor_x: Math.cos(midAngle),
      factor_y: Math.sin(midAngle)
    });
  }
  return quadrants;
}
function computeQuadrantBounds(startAngle, endAngle, radius) {
  const twoPi = 2 * Math.PI;
  const normalizedStart = startAngle;
  let normalizedEnd = endAngle;
  while (normalizedEnd <= normalizedStart) {
    normalizedEnd += twoPi;
  }
  const axisAngles = [
    -Math.PI,
    -Math.PI / 2,
    0,
    Math.PI / 2,
    Math.PI,
    3 * Math.PI / 2,
    2 * Math.PI
  ];
  const candidates = [normalizedStart, normalizedEnd];
  axisAngles.forEach((axisAngle) => {
    let candidate = axisAngle;
    while (candidate < normalizedStart) {
      candidate += twoPi;
    }
    if (candidate <= normalizedEnd) {
      candidates.push(candidate);
    }
  });
  let min_x = Infinity;
  let max_x = -Infinity;
  let min_y = Infinity;
  let max_y = -Infinity;
  candidates.forEach((angle) => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    min_x = Math.min(min_x, cosA);
    max_x = Math.max(max_x, cosA);
    min_y = Math.min(min_y, sinA);
    max_y = Math.max(max_y, sinA);
  });
  const padding = 20;
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
function generateQuadrantOrder(numQuadrants) {
  if (numQuadrants === 4) {
    return [2, 3, 1, 0];
  }
  const quadrantOrder = [];
  const startIndex = Math.floor(numQuadrants / 2);
  for (let i = 0;i < numQuadrants; i++) {
    quadrantOrder.push((startIndex + i) % numQuadrants);
  }
  return quadrantOrder;
}

// src/geometry/ring-calculator.js
var BASE_PATTERN = [130, 220, 310, 400];
var MAX_BASE_RADIUS = 400;
function generateRings(numRings, targetOuterRadius) {
  const ringTemplate = [];
  if (numRings === 4) {
    for (let i = 0;i < 4; i++) {
      ringTemplate.push(BASE_PATTERN[i]);
    }
  } else {
    for (let i = 0;i < numRings; i++) {
      const patternPosition = i / (numRings - 1) * 3;
      const patternIndex = Math.floor(patternPosition);
      const fraction = patternPosition - patternIndex;
      let radius;
      if (patternIndex >= 3) {
        radius = MAX_BASE_RADIUS;
      } else {
        radius = BASE_PATTERN[patternIndex] + (BASE_PATTERN[patternIndex + 1] - BASE_PATTERN[patternIndex]) * fraction;
      }
      ringTemplate.push(radius);
    }
  }
  const radiusScale = targetOuterRadius / MAX_BASE_RADIUS;
  return ringTemplate.map((r) => ({ radius: Math.max(10, Math.round(r * radiusScale)) }));
}

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

// src/geometry/segment-calculator.js
function createSegment(quadrantIndex, ringIndex, quadrants, rings, config, randomBetween) {
  const min_angle = quadrants[quadrantIndex].radial_min * Math.PI;
  const max_angle = quadrants[quadrantIndex].radial_max * Math.PI;
  const base_inner_radius = ringIndex === 0 ? 30 : rings[ringIndex - 1].radius;
  const base_outer_radius = rings[ringIndex].radius;
  let inner_radius = base_inner_radius + config.segment_radial_padding;
  let outer_radius = base_outer_radius - config.segment_radial_padding;
  if (outer_radius <= inner_radius) {
    const midpoint = (base_inner_radius + base_outer_radius) / 2;
    inner_radius = Math.max(0, midpoint - 1);
    outer_radius = midpoint + 1;
  }
  const ring_center = (inner_radius + outer_radius) / 2;
  let angular_padding = config.segment_angular_padding / Math.max(ring_center, 1);
  const angular_limit = Math.max(0, (max_angle - min_angle) / 2 - 0.01);
  angular_padding = Math.min(angular_padding, angular_limit);
  let angle_min = min_angle + angular_padding;
  let angle_max = max_angle - angular_padding;
  if (angle_max <= angle_min) {
    angle_min = min_angle;
    angle_max = max_angle;
  }
  const segment_bounds = computeQuadrantBounds(angle_min, angle_max, outer_radius);
  const cartesian_min = segment_bounds.min;
  const cartesian_max = segment_bounds.max;
  function clampPoint(point) {
    const c = boundedBox(point, cartesian_min, cartesian_max);
    const p = polar(c);
    p.r = boundedInterval(p.r, inner_radius, outer_radius);
    p.t = boundedInterval(p.t, angle_min, angle_max);
    return cartesian(p);
  }
  function clampAndAssign(d) {
    const clipped = clampPoint({ x: d.x, y: d.y });
    d.x = clipped.x;
    d.y = clipped.y;
    return clipped;
  }
  return {
    clipx: (d) => {
      const clipped = clampAndAssign(d);
      return clipped.x;
    },
    clipy: (d) => {
      const clipped = clampAndAssign(d);
      return clipped.y;
    },
    clip: (d) => {
      const clipped = clampPoint({ x: d.x, y: d.y });
      d.x = clipped.x;
      d.y = clipped.y;
      return clipped;
    },
    random: () => cartesian({
      t: randomBetween(angle_min, angle_max),
      r: randomBetween(inner_radius, outer_radius)
    })
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

// src/processing/entry-processor.js
class EntryProcessor {
  constructor(config, quadrants, rings, randomNext, randomBetween) {
    this.config = config;
    this.quadrants = quadrants;
    this.rings = rings;
    this.randomNext = randomNext;
    this.randomBetween = randomBetween;
    this.numQuadrants = quadrants.length;
    this.numRings = rings.length;
  }
  processEntries(entries) {
    const segmented = this.segmentEntries(entries);
    this.assignSegmentsAndColors(entries);
    this.positionEntries(segmented);
    this.assignIds(segmented);
    this.calculateCollisionRadii(segmented);
    return entries;
  }
  segmentEntries(entries) {
    const segmented = new Array(this.numQuadrants);
    for (let quadrant = 0;quadrant < this.numQuadrants; quadrant++) {
      segmented[quadrant] = new Array(this.numRings);
      for (let ring = 0;ring < this.numRings; ring++) {
        segmented[quadrant][ring] = [];
      }
    }
    for (let i = 0;i < entries.length; i++) {
      const entry = entries[i];
      segmented[entry.quadrant][entry.ring].push(entry);
    }
    return segmented;
  }
  assignSegmentsAndColors(entries) {
    for (let i = 0;i < entries.length; i++) {
      const entry = entries[i];
      entry.segment = createSegment(entry.quadrant, entry.ring, this.quadrants, this.rings, this.config, this.randomBetween);
      entry.color = entry.active || this.config.print_layout ? this.config.rings[entry.ring].color : this.config.colors.inactive;
    }
  }
  positionEntries(segmented) {
    for (let quadrant = 0;quadrant < this.numQuadrants; quadrant++) {
      for (let ring = 0;ring < this.numRings; ring++) {
        this.gridPosition(segmented[quadrant][ring], quadrant, ring);
      }
    }
  }
  gridPosition(entries, quadrant, ring) {
    if (entries.length === 0)
      return;
    const min_angle = this.quadrants[quadrant].radial_min * Math.PI;
    const max_angle = this.quadrants[quadrant].radial_max * Math.PI;
    const base_inner_radius = ring === 0 ? 30 : this.rings[ring - 1].radius;
    const base_outer_radius = this.rings[ring].radius;
    let inner_radius = base_inner_radius + this.config.segment_radial_padding;
    let outer_radius = base_outer_radius - this.config.segment_radial_padding;
    if (outer_radius <= inner_radius) {
      const midpoint = (base_inner_radius + base_outer_radius) / 2;
      inner_radius = Math.max(0, midpoint - 1);
      outer_radius = midpoint + 1;
    }
    const ring_center = (inner_radius + outer_radius) / 2;
    let angular_padding = this.config.segment_angular_padding / Math.max(ring_center, 1);
    const angular_limit = Math.max(0, (max_angle - min_angle) / 2 - 0.01);
    angular_padding = Math.min(angular_padding, angular_limit);
    const angle_min = min_angle + angular_padding;
    const angle_max = max_angle - angular_padding;
    const angle_range = angle_max - angle_min;
    const radius_range = outer_radius - inner_radius;
    const count = entries.length;
    const effective_radius = ring === 0 ? inner_radius : ring_center;
    const segment_arc_length = angle_range * effective_radius;
    const segment_radial_depth = radius_range;
    const item_size = this.config.blip_collision_radius || 14;
    const max_angular_items = Math.max(3, Math.floor(segment_arc_length / (item_size * 0.7)));
    const max_radial_items = Math.max(3, Math.floor(segment_radial_depth / (item_size * 0.7)));
    let angular_divisions, radial_divisions;
    const base = Math.ceil(Math.sqrt(count));
    const aspect_ratio = segment_arc_length / Math.max(segment_radial_depth, 1);
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
        const radial_bias = ring === 0 ? 0.85 : 0.7;
        angular_divisions = Math.min(max_angular_items, Math.max(3, Math.floor(base * radial_bias)));
        radial_divisions = Math.ceil(count / angular_divisions);
      } else {
        angular_divisions = Math.min(max_angular_items, Math.max(3, base));
        radial_divisions = Math.ceil(count / angular_divisions);
      }
      angular_divisions = Math.max(2, Math.min(angular_divisions, max_angular_items));
      radial_divisions = Math.max(2, Math.min(radial_divisions, max_radial_items));
    }
    for (let i = 0;i < entries.length; i++) {
      const entry = entries[i];
      let angular_index = i % angular_divisions;
      let radial_index = Math.floor(i / angular_divisions);
      const is_overcrowded = radial_index >= radial_divisions;
      if (is_overcrowded) {
        const total_cells = angular_divisions * radial_divisions;
        const cell_index = i % total_cells;
        angular_index = cell_index % angular_divisions;
        radial_index = Math.floor(cell_index / angular_divisions);
      }
      const angular_fraction = (angular_index + 0.15 + this.randomNext() * 0.7) / angular_divisions;
      const radial_fraction = (radial_index + 0.15 + this.randomNext() * 0.7) / radial_divisions;
      const angle = angle_min + angular_fraction * angle_range;
      const radius = inner_radius + radial_fraction * radius_range;
      const point = cartesian({ t: angle, r: radius });
      entry.x = point.x;
      entry.y = point.y;
    }
  }
  assignIds(segmented) {
    let id = 1;
    const quadrant_order = generateQuadrantOrder(this.numQuadrants);
    for (const quadrant of quadrant_order) {
      for (let ring = 0;ring < this.numRings; ring++) {
        const entries = segmented[quadrant][ring];
        entries.sort((a, b) => a.label.localeCompare(b.label));
        for (let i = 0;i < entries.length; i++) {
          entries[i].id = `${id++}`;
        }
      }
    }
  }
  calculateCollisionRadii(segmented) {
    for (let quadrant = 0;quadrant < this.numQuadrants; quadrant++) {
      for (let ring = 0;ring < this.numRings; ring++) {
        const entries = segmented[quadrant][ring];
        if (entries.length === 0)
          continue;
        const seg_base_inner_radius = ring === 0 ? 30 : this.rings[ring - 1].radius;
        const seg_base_outer_radius = this.rings[ring].radius;
        let seg_inner_radius = seg_base_inner_radius + this.config.segment_radial_padding;
        let seg_outer_radius = seg_base_outer_radius - this.config.segment_radial_padding;
        if (seg_outer_radius <= seg_inner_radius) {
          const midpoint = (seg_base_inner_radius + seg_base_outer_radius) / 2;
          seg_inner_radius = Math.max(0, midpoint - 1);
          seg_outer_radius = midpoint + 1;
        }
        const seg_angle_range = (this.quadrants[quadrant].radial_max - this.quadrants[quadrant].radial_min) * Math.PI;
        const seg_ring_center = (seg_inner_radius + seg_outer_radius) / 2;
        const seg_radial_thickness = seg_outer_radius - seg_inner_radius;
        const segment_area = seg_angle_range * seg_ring_center * seg_radial_thickness;
        const area_per_entry = segment_area / entries.length;
        const ideal_radius = Math.sqrt(area_per_entry / Math.PI) * 0.55;
        let adaptive_radius = Math.max(12, ideal_radius);
        if (entries.length > 10) {
          adaptive_radius = Math.max(adaptive_radius, 13);
        }
        if (entries.length > 15) {
          adaptive_radius = Math.max(adaptive_radius, 14);
        }
        if (ring === 0 && this.numQuadrants >= 6) {
          adaptive_radius = Math.max(10, adaptive_radius * 0.9);
        }
        for (let i = 0;i < entries.length; i++) {
          entries[i].collision_radius = adaptive_radius;
        }
      }
    }
  }
}

// src/rendering/blip-renderer.js
function renderBlips(rinkSelection, entries, config, showBubble, hideBubble, highlightLegendItem, unhighlightLegendItem) {
  const d3 = window.d3;
  const blips = rinkSelection.selectAll(".blip").data(entries).enter().append("g").attr("class", "blip").attr("transform", (d) => translate(d.x, d.y)).on("mouseover", (_event, d) => {
    showBubble(d, config);
    highlightLegendItem(d);
  }).on("mouseout", (_event, d) => {
    hideBubble();
    unhighlightLegendItem(d);
  });
  blips.each(function(d) {
    const blip = d3.select(this);
    let blipContainer = blip;
    if (d.active && Object.hasOwn(d, "link") && d.link) {
      blipContainer = blip.append("a").attr("xlink:href", d.link);
      if (config.links_in_new_tabs) {
        blipContainer.attr("target", "_blank");
      }
    }
    renderBlipShape(blipContainer, d);
    renderBlipText(blipContainer, d, config);
  });
  return blips;
}
function renderBlipShape(container, entry) {
  const d3 = window.d3;
  if (entry.moved === 1) {
    container.append("path").attr("d", "M -11,5 11,5 0,-13 z").style("fill", entry.color);
  } else if (entry.moved === -1) {
    container.append("path").attr("d", "M -11,-5 11,-5 0,13 z").style("fill", entry.color);
  } else if (entry.moved === 2) {
    container.append("path").attr("d", d3.symbol().type(d3.symbolStar).size(200)).style("fill", entry.color);
  } else {
    container.append("circle").attr("r", 9).attr("fill", entry.color);
  }
}
function renderBlipText(container, entry, config) {
  if (entry.active || config.print_layout) {
    const blipText = config.print_layout ? entry.id : entry.label.match(/[a-z]/i);
    container.append("text").text(blipText).attr("y", 3).attr("text-anchor", "middle").style("fill", "#fff").style("font-family", config.font_family).style("font-size", (_d) => blipText.length > 2 ? "8px" : "9px").style("pointer-events", "none").style("user-select", "none");
  }
}

// src/rendering/debug-renderer.js
function renderDebugVisualization(radarSelection, config, quadrants, rings, numQuadrants, numRings, segmented) {
  const _d3 = window.d3;
  const debugLayer = radarSelection.append("g").attr("id", "debug-layer");
  const outerRadius = rings[rings.length - 1].radius;
  renderSegmentBoundaries(debugLayer, config, quadrants, rings, numQuadrants, numRings, segmented);
  renderCollisionRadii(debugLayer, config.entries, config.blip_collision_radius);
  renderCoordinateAxes(debugLayer, outerRadius);
  renderQuadrantBoundaries(debugLayer, numQuadrants, outerRadius);
  renderDebugLegend(debugLayer, outerRadius);
}
function renderSegmentBoundaries(debugLayer, config, quadrants, rings, numQuadrants, numRings, segmented) {
  const _d3 = window.d3;
  for (let q = 0;q < numQuadrants; q++) {
    for (let r = 0;r < numRings; r++) {
      const segBaseInner = r === 0 ? 30 : rings[r - 1].radius;
      const segBaseOuter = rings[r].radius;
      const segInner = segBaseInner + config.segment_radial_padding;
      const segOuter = segBaseOuter - config.segment_radial_padding;
      const segRingCenter = (segInner + segOuter) / 2;
      let segAngularPadding = config.segment_angular_padding / Math.max(segRingCenter, 1);
      const minAngle = quadrants[q].radial_min * Math.PI;
      const maxAngle = quadrants[q].radial_max * Math.PI;
      const angularLimit = Math.max(0, (maxAngle - minAngle) / 2 - 0.01);
      segAngularPadding = Math.min(segAngularPadding, angularLimit);
      let angleMin = minAngle + segAngularPadding;
      let angleMax = maxAngle - segAngularPadding;
      if (angleMax <= angleMin) {
        angleMin = minAngle;
        angleMax = maxAngle;
      }
      renderPolarSector(debugLayer, segInner, segOuter, angleMin, angleMax, numQuadrants, r);
      renderBoundingBox(debugLayer, quadrants[q].radial_min * Math.PI, quadrants[q].radial_max * Math.PI, segOuter);
      if (r === 0) {
        renderSegmentLabel(debugLayer, q, r, angleMin, angleMax, segInner, segOuter, segmented[q][r].length);
      }
    }
  }
}
function renderPolarSector(debugLayer, innerRadius, outerRadius, angleMin, angleMax, numQuadrants, ringIndex) {
  const d3 = window.d3;
  const offsetMagnitude = Math.PI / (2 * numQuadrants);
  const arcOffset = numQuadrants % 4 === 1 ? offsetMagnitude : -offsetMagnitude;
  const arcPath = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius).startAngle(-angleMax + arcOffset).endAngle(-angleMin + arcOffset);
  debugLayer.append("path").attr("d", arcPath).attr("fill", "none").attr("stroke", ringIndex === 0 ? "#ff0000" : "#00ffff").attr("stroke-width", ringIndex === 0 ? 2 : 1).attr("stroke-dasharray", "5,5").attr("opacity", 0.5);
}
function renderBoundingBox(debugLayer, minAngle, maxAngle, outerRadius) {
  const bounds = computeQuadrantBounds(minAngle, maxAngle, outerRadius);
  debugLayer.append("rect").attr("x", bounds.min.x).attr("y", bounds.min.y).attr("width", bounds.max.x - bounds.min.x).attr("height", bounds.max.y - bounds.min.y).attr("fill", "none").attr("stroke", "#ffff00").attr("stroke-width", 1).attr("stroke-dasharray", "3,3").attr("opacity", 0.3);
}
function renderSegmentLabel(debugLayer, quadrant, ring, angleMin, angleMax, segInner, segOuter, entryCount) {
  const midAngle = (angleMin + angleMax) / 2;
  const labelRadius = (segInner + segOuter) / 2;
  const labelX = Math.cos(midAngle) * labelRadius;
  const labelY = Math.sin(midAngle) * labelRadius;
  const arcLength = (angleMax - angleMin) * segInner;
  debugLayer.append("text").attr("x", labelX).attr("y", labelY).attr("text-anchor", "middle").attr("font-size", "10px").attr("fill", "#ff0000").attr("font-weight", "bold").text(`Q${quadrant}R${ring}: ${entryCount} items, arc=${arcLength.toFixed(0)}px`);
}
function renderCollisionRadii(debugLayer, entries, defaultCollisionRadius) {
  const _d3 = window.d3;
  debugLayer.append("g").attr("id", "debug-collision-radii").selectAll("circle").data(entries).enter().append("circle").attr("cx", (d) => d.x).attr("cy", (d) => d.y).attr("r", (d) => d.collision_radius || defaultCollisionRadius).attr("fill", "none").attr("stroke", (d) => d.ring === 0 ? "#00ff00" : "#0000ff").attr("stroke-width", 1).attr("stroke-dasharray", "2,2").attr("opacity", 0.4);
}
function renderCoordinateAxes(debugLayer, outerRadius) {
  debugLayer.append("line").attr("x1", -outerRadius).attr("y1", 0).attr("x2", outerRadius).attr("y2", 0).attr("stroke", "#666").attr("stroke-width", 0.5).attr("opacity", 0.3);
  debugLayer.append("line").attr("x1", 0).attr("y1", -outerRadius).attr("x2", 0).attr("y2", outerRadius).attr("stroke", "#666").attr("stroke-width", 0.5).attr("opacity", 0.3);
}
function renderQuadrantBoundaries(debugLayer, numQuadrants, outerRadius) {
  for (let i = 0;i < numQuadrants; i++) {
    const gridAngle = -Math.PI + i * 2 * Math.PI / numQuadrants;
    debugLayer.append("line").attr("x1", 0).attr("y1", 0).attr("x2", outerRadius * Math.cos(gridAngle)).attr("y2", outerRadius * Math.sin(gridAngle)).attr("stroke", "#ff00ff").attr("stroke-width", 2).attr("opacity", 0.6).attr("stroke-dasharray", "10,5");
  }
}
function renderDebugLegend(debugLayer, outerRadius) {
  const debugLegend = debugLayer.append("g").attr("transform", translate(-outerRadius + 10, -outerRadius + 10));
  const legendItems = [
    { y: 0, text: "DEBUG MODE", color: "#000", bold: true, fontSize: "11px" },
    { y: 15, text: "━━ Ring 0 polar sector", color: "#ff0000", bold: false, fontSize: "9px" },
    { y: 28, text: "━━ Other rings polar sector", color: "#00ffff", bold: false, fontSize: "9px" },
    { y: 41, text: "━━ Cartesian bounding box", color: "#ffff00", bold: false, fontSize: "9px" },
    { y: 54, text: "○ Collision radius (Ring 0)", color: "#00ff00", bold: false, fontSize: "9px" }
  ];
  legendItems.forEach((item) => {
    debugLegend.append("text").attr("x", 0).attr("y", item.y).attr("font-size", item.fontSize).attr("font-weight", item.bold ? "bold" : "normal").attr("fill", item.color).text(item.text);
  });
}

// src/rendering/force-simulation.js
function createTickCallback(blipsSelection, config) {
  const d3 = window.d3;
  return function ticked() {
    blipsSelection.attr("transform", (d) => {
      const clipped = d.segment.clip(d);
      d.rendered_x = clipped.x;
      d.rendered_y = clipped.y;
      return translate(clipped.x, clipped.y);
    });
    if (config.debug_geometry) {
      d3.select("#debug-collision-radii").selectAll("circle").attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    }
  };
}
function runForceSimulation(entries, blipsSelection, config) {
  const d3 = window.d3;
  const tickCallback = createTickCallback(blipsSelection, config);
  d3.forceSimulation().nodes(entries).velocityDecay(0.15).alphaDecay(0.008).alphaMin(0.00005).force("collision", d3.forceCollide().radius((d) => d.collision_radius || config.blip_collision_radius).strength(1).iterations(6)).on("tick", tickCallback).tick(400);
}

// src/rendering/grid-renderer.js
function renderGrid(gridSelection, config, quadrants, rings, outerRadius) {
  const numQuadrants = quadrants.length;
  for (let i = 0;i < numQuadrants; i++) {
    const angle = -Math.PI + i * 2 * Math.PI / numQuadrants;
    gridSelection.append("line").attr("x1", 0).attr("y1", 0).attr("x2", outerRadius * Math.cos(angle)).attr("y2", outerRadius * Math.sin(angle)).attr("class", `quadrant-line quadrant-line-${i}`).style("stroke", config.colors.grid).style("stroke-width", 1.5).style("stroke-opacity", 0.3);
  }
  const defs = gridSelection.append("defs");
  const filter = defs.append("filter").attr("x", 0).attr("y", 0).attr("width", 1).attr("height", 1).attr("id", "solid");
  filter.append("feFlood").attr("flood-color", "rgb(0, 0, 0, 0.8)");
  filter.append("feComposite").attr("in", "SourceGraphic");
  for (let i = 0;i < rings.length; i++) {
    const outer = rings[i].radius;
    const inner = i === 0 ? 0 : rings[i - 1].radius;
    const thickness = Math.max(outer - inner, 1);
    const labelRadius = outer - thickness / 2;
    const labelFontSize = Math.max(12, Math.min(32, thickness * 0.45));
    if (i > 0) {
      gridSelection.append("circle").attr("cx", 0).attr("cy", 0).attr("r", outer).attr("class", `ring ring-${i}`).style("fill", i % 2 === 0 ? "rgba(0, 0, 0, 0.01)" : "rgba(0, 0, 0, 0.015)").style("stroke", "none").style("pointer-events", "none");
    }
    gridSelection.append("circle").attr("cx", 0).attr("cy", 0).attr("r", outer).attr("class", `ring-border ring-border-${i}`).style("fill", "none").style("stroke", config.colors.grid).style("stroke-width", i === 0 ? 2 : 1).style("stroke-opacity", i === 0 ? 0.4 : 0.25);
    if (config.print_layout) {
      gridSelection.append("text").text(config.rings[i].name).attr("y", -labelRadius).attr("text-anchor", "middle").attr("dominant-baseline", "middle").style("fill", config.rings[i].color).style("opacity", 0.35).style("font-family", config.font_family).style("font-size", `${labelFontSize}px`).style("font-weight", "bold").style("pointer-events", "none").style("user-select", "none");
    }
  }
}
function renderTitleAndFooter(radarSelection, config) {
  if (config.title && config.print_layout) {
    const titleGroup = radarSelection.append("a").attr("href", config.repo_url).attr("target", config.links_in_new_tabs ? "_blank" : null);
    titleGroup.append("text").attr("transform", `translate(${config.title_offset.x}, ${config.title_offset.y})`).text(config.title).style("font-family", config.font_family).style("font-size", "34px").style("font-weight", "bold");
    titleGroup.append("text").attr("transform", `translate(${config.title_offset.x}, ${config.title_offset.y + 30})`).text(config.date ? config.date : "").style("font-family", config.font_family).style("font-size", "14px").style("fill", "#999");
  }
  if (config.footer && config.print_layout) {
    radarSelection.append("text").attr("transform", `translate(${config.footer_offset.x}, ${config.footer_offset.y})`).text(config.footer).attr("xml:space", "preserve").style("font-family", config.font_family).style("font-size", "10px").style("fill", "#999");
  }
}

// src/rendering/interactions.js
function createBubble(radarSelection, fontFamily) {
  const bubble = radarSelection.append("g").attr("id", "bubble").attr("x", 0).attr("y", 0).style("opacity", 0).style("pointer-events", "none").style("user-select", "none");
  bubble.append("rect").attr("rx", 4).attr("ry", 4).style("fill", "#333");
  bubble.append("text").style("font-family", fontFamily).style("font-size", "10px").style("fill", "#fff");
  bubble.append("path").attr("d", "M 0,0 10,0 5,8 z").style("fill", "#333");
  return bubble;
}
function showBubble(d, config) {
  if (d.active || config.print_layout) {
    const d3 = window.d3;
    const tooltip = d3.select("#bubble text").text(d.label);
    const bbox = tooltip.node().getBBox();
    const x = d.rendered_x !== undefined ? d.rendered_x : d.x;
    const y = d.rendered_y !== undefined ? d.rendered_y : d.y;
    d3.select("#bubble").attr("transform", translate(x - bbox.width / 2, y - 16)).style("opacity", 0.8);
    d3.select("#bubble rect").attr("x", -5).attr("y", -bbox.height).attr("width", bbox.width + 10).attr("height", bbox.height + 4);
    d3.select("#bubble path").attr("transform", translate(bbox.width / 2 - 5, 3));
  }
}
function hideBubble() {
  const d3 = window.d3;
  d3.select("#bubble").attr("transform", translate(0, 0)).style("opacity", 0);
}
function highlightLegendItem(d) {
  const legendItem = document.getElementById(`legendItem${d.id}`);
  if (legendItem) {
    legendItem.classList.add("legend-highlight");
  }
}
function unhighlightLegendItem(d) {
  const legendItem = document.getElementById(`legendItem${d.id}`);
  if (legendItem) {
    legendItem.classList.remove("legend-highlight");
  }
}

// src/rendering/legend-renderer.js
function renderLegendColumns(legendLeftColumn, legendRightColumn, segmented, config, numQuadrants, numRings, showBubble2, hideBubble2, highlightLegendItem2, unhighlightLegendItem2) {
  legendLeftColumn.html("");
  legendRightColumn.html("");
  const legendSectionColumns = numRings >= 7 ? 3 : 2;
  const right_count = Math.ceil(numQuadrants / 2);
  const left_count = Math.floor(numQuadrants / 2);
  const right_start = numQuadrants - 2;
  const leftQuadrants = [];
  const rightQuadrants = [];
  for (let i = 0;i < right_count; i++) {
    rightQuadrants.push((right_start + i) % numQuadrants);
  }
  for (let i = 0;i < left_count; i++) {
    leftQuadrants.push((right_start - 1 - i + numQuadrants) % numQuadrants);
  }
  function targetColumn(quadrant) {
    return leftQuadrants.includes(quadrant) ? legendLeftColumn : legendRightColumn;
  }
  for (let quadrant = 0;quadrant < numQuadrants; quadrant++) {
    const column = targetColumn(quadrant);
    const section = column.append("div").attr("class", "legend-section").style("--legend-columns", legendSectionColumns);
    section.append("div").attr("class", "legend-quadrant-name").text(config.quadrants[quadrant].name);
    const ringsContainer = section.append("div").attr("class", "legend-rings");
    for (let ring = 0;ring < numRings; ring++) {
      const entriesInRing = segmented[quadrant][ring];
      if (!entriesInRing.length) {
        continue;
      }
      const ringBlock = ringsContainer.append("div").attr("class", "legend-ring");
      ringBlock.append("div").attr("class", "legend-ring-name").style("color", config.rings[ring].color).text(config.rings[ring].name);
      const entriesList = ringBlock.append("div").attr("class", "legend-ring-entries");
      entriesList.selectAll("a").data(entriesInRing).enter().append("a").attr("href", (d) => d.link ? d.link : "#").attr("target", (d) => d.link && config.links_in_new_tabs ? "_blank" : null).attr("id", (d) => `legendItem${d.id}`).attr("class", "legend-entry").text((d) => `${d.id}. ${d.label}`).on("mouseover", (_event, d) => {
        showBubble2(d, config);
        highlightLegendItem2(d);
      }).on("mouseout", (_event, d) => {
        hideBubble2();
        unhighlightLegendItem2(d);
      });
    }
  }
}

// src/rendering/svg-setup.js
function setupSvg(config, quadrants, rings, dimensions) {
  const d3 = window.d3;
  config.scale = config.scale || 1;
  const scaled_width = config.width * config.scale;
  const scaled_height = config.height * config.scale;
  const svg = d3.select(`svg#${config.svg_id}`).style("background-color", config.colors.background).attr("width", scaled_width).attr("height", scaled_height);
  const layoutWrapper = ensureLayoutStructure(svg);
  const legendLeftColumn = layoutWrapper.select(".radar-legend-column.left");
  const legendRightColumn = layoutWrapper.select(".radar-legend-column.right");
  const layoutWidth = layoutWrapper.node().getBoundingClientRect().width || config.width;
  const minLegendColumnWidth = config.legend_column_width * 2 + 60;
  const maxLegendColumnWidth = config.legend_column_width * 4 + 80;
  const targetLegendColumnWidth = Math.min(maxLegendColumnWidth, Math.max(minLegendColumnWidth, layoutWidth * 0.3));
  const legendSectionColumns = Math.min(4, Math.max(2, Math.floor(targetLegendColumnWidth / (config.legend_column_width + 20))));
  legendLeftColumn.style("gap", `${config.legend_vertical_spacing}px`).style("width", `${targetLegendColumnWidth}px`);
  legendRightColumn.style("gap", `${config.legend_vertical_spacing}px`).style("width", `${targetLegendColumnWidth}px`);
  const radar = svg.append("g");
  if ("zoomed_quadrant" in config) {
    svg.attr("viewBox", viewbox(config.zoomed_quadrant, quadrants, rings));
  } else {
    const radar_center_y = scaled_height / 2 + (dimensions.title_height - dimensions.footer_height) / 2;
    const radar_center_x = scaled_width / 2 + config.radar_horizontal_offset;
    radar.attr("transform", translate(radar_center_x, radar_center_y).concat(`scale(${config.scale})`));
  }
  config.font_family = config.font_family || "Arial, Helvetica";
  const grid = radar.append("g");
  return {
    svg,
    radar,
    legendLeftColumn,
    legendRightColumn,
    grid,
    legendSectionColumns
  };
}

// src/rendering/table-renderer.js
function renderRingDescriptionsTable(config) {
  const d3 = window.d3;
  const table = d3.select("body").append("table").attr("class", "radar-table").style("border-collapse", "collapse").style("position", "relative").style("top", "-70px").style("margin-left", "50px").style("margin-right", "50px").style("font-family", config.font_family).style("font-size", "13px").style("text-align", "left");
  const thead = table.append("thead");
  const tbody = table.append("tbody");
  const columnWidth = `${100 / config.rings.length}%`;
  const headerRow = thead.append("tr").style("border", "1px solid #ddd");
  headerRow.selectAll("th").data(config.rings).enter().append("th").style("padding", "8px").style("border", "1px solid #ddd").style("background-color", (d) => d.color).style("color", "#fff").style("width", columnWidth).text((d) => d.name);
  const descriptionRow = tbody.append("tr").style("border", "1px solid #ddd");
  descriptionRow.selectAll("td").data(config.rings).enter().append("td").style("padding", "8px").style("border", "1px solid #ddd").style("width", columnWidth).text((d) => d.description);
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
  applyConfigDefaults(config);
  const dimensions = calculateDimensions(config);
  const target_outer_radius = dimensions.target_outer_radius;
  validateConfig(config);
  const rng = new SeededRandom(42);
  const random = () => rng.next();
  const random_between = (min, max) => rng.between(min, max);
  const _normal_between = (min, max) => rng.normalBetween(min, max);
  const num_quadrants = config.quadrants.length;
  const quadrants = generateQuadrants(num_quadrants);
  const num_rings = config.rings.length;
  const rings = generateRings(num_rings, target_outer_radius);
  const outer_radius = rings[rings.length - 1].radius;
  const _quadrant_bounds = quadrants.map((q) => computeQuadrantBounds(q.radial_min * Math.PI, q.radial_max * Math.PI, outer_radius));
  configureOffsets(config, outer_radius, num_quadrants);
  const _bounded_interval = boundedInterval;
  const _bounded_ring = boundedRing;
  const _bounded_box = boundedBox;
  function _segment(quadrant, ring) {
    return createSegment(quadrant, ring, quadrants, rings, config, random_between);
  }
  const entryProcessor = new EntryProcessor(config, quadrants, rings, random, random_between);
  entryProcessor.processEntries(config.entries);
  const segmented = new Array(num_quadrants);
  for (let quadrant = 0;quadrant < num_quadrants; quadrant++) {
    segmented[quadrant] = new Array(num_rings);
    for (let ring = 0;ring < num_rings; ring++) {
      segmented[quadrant][ring] = [];
    }
  }
  for (let i = 0;i < config.entries.length; i++) {
    const entry = config.entries[i];
    segmented[entry.quadrant][entry.ring].push(entry);
  }
  const svgElements = setupSvg(config, quadrants, rings, dimensions);
  const { radar, legendLeftColumn, legendRightColumn, grid } = svgElements;
  renderGrid(grid, config, quadrants, rings, outer_radius);
  if (!config.footer) {
    config.footer = "▲ moved up     ▼ moved down     ★ new     ⬤ no change";
  }
  renderTitleAndFooter(radar, config);
  if (config.print_layout) {
    legendLeftColumn.style("display", "flex");
    legendRightColumn.style("display", "flex");
    renderLegendColumns(legendLeftColumn, legendRightColumn, segmented, config, num_quadrants, num_rings, showBubble, hideBubble, highlightLegendItem, unhighlightLegendItem);
  } else {
    legendLeftColumn.style("display", "none").html("");
    legendRightColumn.style("display", "none").html("");
  }
  const rink = radar.append("g").attr("id", "rink");
  const _bubble = createBubble(radar, config.font_family);
  const blips = renderBlips(rink, config.entries, config, showBubble, hideBubble, highlightLegendItem, unhighlightLegendItem);
  runForceSimulation(config.entries, blips, config);
  if (config.debug_geometry) {
    renderDebugVisualization(radar, config, quadrants, rings, num_quadrants, num_rings, segmented);
  }
  if (config.print_ring_descriptions_table) {
    renderRingDescriptionsTable(config);
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
