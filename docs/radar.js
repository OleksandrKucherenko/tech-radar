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

  // Calculate space for title and footer
  var title_height = config.print_layout && config.title ? 60 : 0;  // Title + date + padding
  var footer_height = config.print_layout ? 40 : 0;  // Footer + padding
  var available_height = config.height - title_height - footer_height;
  var available_width = config.width;

  // Adjust title and footer positions to reserve proper space
  config.title_offset = config.title_offset || {
    x: -available_width / 2 + 20,
    y: -config.height / 2 + 30
  };
  config.footer_offset = config.footer_offset || {
    x: -200,
    y: config.height / 2 - 20
  };

  // Generate legend positions dynamically based on number of quadrants
  if (!config.legend_offset) {
    config.legend_offset = [];
    var num_quads = config.quadrants.length;
    // Use slightly less than half of available space for legend radius
    var legend_radius = Math.min(available_width, available_height) / 2 - 100;

    if (num_quads === 2) {
      // For 2 quadrants, place legends on left and right sides
      var legend_x = available_width / 2 - 200;
      config.legend_offset = [
        { x: -legend_x - 25, y: -available_height / 2 + 110 },
        { x: legend_x, y: -available_height / 2 + 110 }
      ];
    } else if (num_quads === 4) {
      // Use relative positions for 4 quadrants
      var legend_x = legend_radius - 50;
      var legend_y_top = -available_height / 2 + 110;
      var legend_y_bottom = available_height / 2 - 290;

      config.legend_offset = [
        { x: legend_x, y: legend_y_top },
        { x: -legend_x - 225, y: legend_y_top },
        { x: -legend_x - 225, y: legend_y_bottom },
        { x: legend_x, y: legend_y_bottom }
      ];
    } else {
      // Calculate positions in circular arrangement
      for (var i = 0; i < num_quads; i++) {
        var angle = -Math.PI + (i + 0.5) * (2 * Math.PI / num_quads);
        config.legend_offset.push({
          x: Math.round(legend_radius * Math.cos(angle)),
          y: Math.round(legend_radius * Math.sin(angle))
        });
      }
    }
  }

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

  for (let i = 0; i < num_quadrants; i++) {
    const start_angle = -1 + (i * angle_per_quadrant);
    const end_angle = -1 + ((i + 1) * angle_per_quadrant);
    const mid_angle = -Math.PI + (i + 0.5) * angle_per_quadrant * Math.PI;

    quadrants.push({
      radial_min: start_angle,
      radial_max: end_angle,
      factor_x: Math.cos(mid_angle),
      factor_y: Math.sin(mid_angle)
    });
  }

  // Generate rings dynamically based on config.rings.length
  // Scale the current pattern [130, 220, 310, 400] proportionally
  const rings = [];
  const num_rings = config.rings.length;
  const base_pattern = [130, 220, 310, 400];
  const max_radius = 400;

  if (num_rings === 4) {
    // Use original spacing for 4 rings
    for (let i = 0; i < 4; i++) {
      rings.push({ radius: base_pattern[i] });
    }
  } else {
    // Scale proportionally for other ring counts
    for (let i = 0; i < num_rings; i++) {
      // Interpolate position in the base pattern
      const pattern_position = (i / (num_rings - 1)) * 3; // Map to 0-3 range
      const pattern_index = Math.floor(pattern_position);
      const fraction = pattern_position - pattern_index;

      let radius;
      if (pattern_index >= 3) {
        radius = max_radius;
      } else {
        // Linear interpolation between pattern points
        radius = base_pattern[pattern_index] +
                 (base_pattern[pattern_index + 1] - base_pattern[pattern_index]) * fraction;
      }

      rings.push({ radius: Math.round(radius) });
    }
  }

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

  function segment(quadrant, ring) {
    var polar_min = {
      t: quadrants[quadrant].radial_min * Math.PI,
      r: ring === 0 ? 30 : rings[ring - 1].radius
    };
    var polar_max = {
      t: quadrants[quadrant].radial_max * Math.PI,
      r: rings[ring].radius
    };
    var cartesian_min = {
      x: 15 * quadrants[quadrant].factor_x,
      y: 15 * quadrants[quadrant].factor_y
    };
    var cartesian_max = {
      x: rings[rings.length - 1].radius * quadrants[quadrant].factor_x,
      y: rings[rings.length - 1].radius * quadrants[quadrant].factor_y
    };
    return {
      clipx: function(d) {
        var c = bounded_box(d, cartesian_min, cartesian_max);
        var p = bounded_ring(polar(c), polar_min.r + 15, polar_max.r - 15);
        d.x = cartesian(p).x; // adjust data too!
        return d.x;
      },
      clipy: function(d) {
        var c = bounded_box(d, cartesian_min, cartesian_max);
        var p = bounded_ring(polar(c), polar_min.r + 15, polar_max.r - 15);
        d.y = cartesian(p).y; // adjust data too!
        return d.y;
      },
      random: function() {
        return cartesian({
          t: random_between(polar_min.t, polar_max.t),
          r: normal_between(polar_min.r, polar_max.r)
        });
      }
    }
  }

  // position each entry randomly in its segment
  for (var i = 0; i < config.entries.length; i++) {
    var entry = config.entries[i];
    entry.segment = segment(entry.quadrant, entry.ring);
    var point = entry.segment.random();
    entry.x = point.x;
    entry.y = point.y;
    entry.color = entry.active || config.print_layout ?
      config.rings[entry.ring].color : config.colors.inactive;
  }

  // partition entries according to segments
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

  for (quadrant of quadrant_order) {
    for (var ring = 0; ring < num_rings; ring++) {
      var entries = segmented[quadrant][ring];
      entries.sort(function(a,b) { return a.label.localeCompare(b.label); })
      for (var i=0; i<entries.length; i++) {
        entries[i].id = "" + id++;
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

  var radar = svg.append("g");
  if ("zoomed_quadrant" in config) {
    svg.attr("viewBox", viewbox(config.zoomed_quadrant));
  } else {
    // Center radar in available space (accounting for title and footer)
    var radar_center_y = (scaled_height / 2) + ((title_height - footer_height) / 2);
    radar.attr("transform", translate(scaled_width / 2, radar_center_y).concat(`scale(${config.scale})`));
  }

  var grid = radar.append("g");

  // define default font-family
  config.font_family = config.font_family || "Arial, Helvetica";

  // draw grid lines - N radial lines for N quadrants
  var outer_radius = rings[rings.length - 1].radius;
  for (var i = 0; i < num_quadrants; i++) {
    var angle = -Math.PI + (i * 2 * Math.PI / num_quadrants);
    grid.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", outer_radius * Math.cos(angle))
      .attr("y2", outer_radius * Math.sin(angle))
      .style("stroke", config.colors.grid)
      .style("stroke-width", 1);
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
    grid.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", rings[i].radius)
      .style("fill", "none")
      .style("stroke", config.colors.grid)
      .style("stroke-width", 1);
    if (config.print_layout) {
      grid.append("text")
        .text(config.rings[i].name)
        .attr("y", -rings[i].radius + 62)
        .attr("text-anchor", "middle")
        .style("fill", config.rings[i].color)
        .style("opacity", 0.35)
        .style("font-family", config.font_family)
        .style("font-size", "42px")
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

    // legend
    const legend = radar.append("g");
    for (let quadrant = 0; quadrant < num_quadrants; quadrant++) {
      legend.append("text")
        .attr("transform", translate(
          config.legend_offset[quadrant].x,
          config.legend_offset[quadrant].y - 45
        ))
        .text(config.quadrants[quadrant].name)
        .style("font-family", config.font_family)
        .style("font-size", "18px")
        .style("font-weight", "bold");

      var num_columns = num_rings >= 7 ? 3 : 2;
      var rings_per_column = Math.ceil(num_rings / num_columns);

      // Track height separately for each column
      var columnHeights = new Array(num_columns).fill(0);

      for (let ring = 0; ring < num_rings; ring++) {
        var column = Math.floor(ring / rings_per_column);
        var row_in_column = ring % rings_per_column;

        // Get current height for this column
        var currentHeight = columnHeights[column];

        // Add spacing between rings (but not before the first ring in column)
        if (row_in_column > 0) {
          currentHeight += 36; // Space between rings
        }

        // Add ring name header
        legend.append("text")
          .attr("transform", legend_transform(quadrant, ring, config.legend_column_width, null, currentHeight))
          .text(config.rings[ring].name)
          .style("font-family", config.font_family)
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("fill", config.rings[ring].color);

        // Add space for the ring header itself
        currentHeight += 20; // Height of ring name text + padding

        // Add entries for this ring
        var entryStartHeight = currentHeight;
        legend.selectAll(".legend" + quadrant + ring)
          .data(segmented[quadrant][ring])
          .enter()
            .append("a")
              .attr("href", function (d, i) {
                 return d.link ? d.link : "#"; // stay on same page if no link was provided
              })
              // Add a target if (and only if) there is a link and we want new tabs
              .attr("target", function (d, i) {
                 return (d.link && config.links_in_new_tabs) ? "_blank" : null;
              })
            .append("text")
              .attr("transform", function(d, i) { return legend_transform(quadrant, ring, config.legend_column_width, i, entryStartHeight); })
              .attr("class", "legend" + quadrant + ring)
              .attr("id", function(d, i) { return "legendItem" + d.id; })
              .text(function(d) { return d.id + ". " + d.label; })
              .style("font-family", config.font_family)
              .style("font-size", "11px")
              .on("mouseover", function(event, d) { showBubble(d); highlightLegendItem(d); })
              .on("mouseout", function(event, d) { hideBubble(d); unhighlightLegendItem(d); })
              .call(wrap_text)
              .each(function() {
                currentHeight += d3.select(this).node().getBBox().height;
              });

        // Update column height tracker with accumulated height
        columnHeights[column] = currentHeight;
      }
    }
  }

  function wrap_text(text) {
    let heightForNextElement = 0;

    text.each(function() {
      const textElement = d3.select(this);
      const words = textElement.text().split(" ");
      let line = [];

      // Use '|' at the end of the string so that spaces are not trimmed during rendering.
      const number = `${textElement.text().split(".")[0]}. |`;
      const legendNumberText = textElement.append("tspan").text(number);
      const legendBar = textElement.append("tspan").text('|');
      const numberWidth = legendNumberText.node().getComputedTextLength() - legendBar.node().getComputedTextLength();

      textElement.text(null);

      let tspan = textElement
          .append("tspan")
          .attr("x", 0)
          .attr("y", heightForNextElement)
          .attr("dy", 0);

      for (let position = 0; position < words.length; position++) {
        line.push(words[position]);
        tspan.text(line.join(" "));

        // Avoid wrap for first line (position !== 1) to not end up in a situation where the long text without
        // whitespace is wrapped (causing the first line near the legend number to be blank).
        if (tspan.node().getComputedTextLength() > config.legend_column_width && position !== 1) {
          line.pop();
          tspan.text(line.join(" "));
          line = [words[position]];

          tspan = textElement.append("tspan")
              .attr("x", numberWidth)
              .attr("dy", config.legend_line_height)
              .text(words[position]);
        }
      }

      const textBoundingBox = textElement.node().getBBox();
      heightForNextElement = textBoundingBox.y + textBoundingBox.height;
    });
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
      d3.select("#bubble")
        .attr("transform", translate(d.x - bbox.width / 2, d.y - 16))
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
    legendItem.setAttribute("filter", "url(#solid)");
    legendItem.setAttribute("fill", "white");
  }

  function unhighlightLegendItem(d) {
    var legendItem = document.getElementById("legendItem" + d.id);
    legendItem.removeAttribute("filter");
    legendItem.removeAttribute("fill");
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
  function ticked() {
    blips.attr("transform", function(d) {
      return translate(d.segment.clipx(d), d.segment.clipy(d));
    })
  }

  // distribute blips, while avoiding collisions
  d3.forceSimulation()
    .nodes(config.entries)
    .velocityDecay(0.19) // magic number (found by experimentation)
    .force("collision", d3.forceCollide().radius(12).strength(0.85))
    .on("tick", ticked);

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
