// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

/**
 * Debug Renderer Module
 *
 * Phase 4 Refactoring: Extracted debug visualization logic
 *
 * Renders debug overlays on the radar to help visualize:
 * - Segment boundaries (polar sectors)
 * - Cartesian bounding boxes
 * - Collision radii for blips
 * - Coordinate system axes
 * - Quadrant boundary lines
 * - Entry counts and arc lengths per segment
 */

import { translate } from './helpers.js';
import { computeQuadrantBounds } from '../geometry/quadrant-calculator.js';

/**
 * Renders debug visualizations on the radar.
 *
 * Debug mode displays geometric overlays to help understand and troubleshoot
 * the positioning algorithm:
 * - Red segments: Ring 0 polar sectors (actual blip placement area)
 * - Cyan segments: Other ring polar sectors
 * - Yellow boxes: Cartesian bounding boxes (rectangular approximation)
 * - Green circles: Collision radii for Ring 0 entries
 * - Blue circles: Collision radii for other entries
 * - Magenta lines: Quadrant boundaries
 * - Gray axes: Coordinate system (x/y axes)
 *
 * @param {d3.Selection} radarSelection - D3 selection of the radar group
 * @param {Object} config - Visualization configuration
 * @param {Array} quadrants - Array of quadrant configurations
 * @param {Array} rings - Array of ring configurations
 * @param {number} numQuadrants - Number of quadrants
 * @param {number} numRings - Number of rings
 * @param {Array} segmented - 2D array of entries grouped by quadrant/ring
 */
export function renderDebugVisualization(
  radarSelection,
  config,
  quadrants,
  rings,
  numQuadrants,
  numRings,
  segmented
) {
  const d3 = window.d3;
  const debugLayer = radarSelection.append("g").attr("id", "debug-layer");
  const outerRadius = rings[rings.length - 1].radius;

  // Render segment boundaries and bounding boxes
  renderSegmentBoundaries(
    debugLayer,
    config,
    quadrants,
    rings,
    numQuadrants,
    numRings,
    segmented
  );

  // Render collision radii for all entries
  renderCollisionRadii(debugLayer, config.entries, config.blip_collision_radius);

  // Render coordinate system axes
  renderCoordinateAxes(debugLayer, outerRadius);

  // Render quadrant boundary lines
  renderQuadrantBoundaries(debugLayer, numQuadrants, outerRadius);

  // Render debug legend
  renderDebugLegend(debugLayer, outerRadius);
}

/**
 * Renders segment boundaries for all quadrant/ring combinations.
 *
 * For each segment, draws:
 * - Polar sector boundary (actual segment shape)
 * - Cartesian bounding box (rectangular approximation)
 * - Text label with entry count and arc length (Ring 0 only)
 */
function renderSegmentBoundaries(
  debugLayer,
  config,
  quadrants,
  rings,
  numQuadrants,
  numRings,
  segmented
) {
  const d3 = window.d3;

  for (let q = 0; q < numQuadrants; q++) {
    for (let r = 0; r < numRings; r++) {
      // Calculate segment dimensions
      const segBaseInner = r === 0 ? 30 : rings[r - 1].radius;
      const segBaseOuter = rings[r].radius;
      const segInner = segBaseInner + config.segment_radial_padding;
      const segOuter = segBaseOuter - config.segment_radial_padding;

      // Calculate angular padding (convert from pixels to radians)
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

      // Draw polar sector boundary
      renderPolarSector(
        debugLayer,
        segInner,
        segOuter,
        angleMin,
        angleMax,
        numQuadrants,
        r
      );

      // Draw Cartesian bounding box
      renderBoundingBox(
        debugLayer,
        quadrants[q].radial_min * Math.PI,
        quadrants[q].radial_max * Math.PI,
        segOuter
      );

      // Add segment info label (Ring 0 only for clarity)
      if (r === 0) {
        renderSegmentLabel(
          debugLayer,
          q,
          r,
          angleMin,
          angleMax,
          segInner,
          segOuter,
          segmented[q][r].length
        );
      }
    }
  }
}

/**
 * Renders a polar sector (arc segment) boundary.
 */
function renderPolarSector(debugLayer, innerRadius, outerRadius, angleMin, angleMax, numQuadrants, ringIndex) {
  const d3 = window.d3;

  // d3.arc() uses clockwise angles, but our angles are counter-clockwise
  // Apply offset to align with coordinate system
  const offsetMagnitude = Math.PI / (2 * numQuadrants);
  const arcOffset = (numQuadrants % 4 === 1) ? offsetMagnitude : -offsetMagnitude;

  const arcPath = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .startAngle(-angleMax + arcOffset)
    .endAngle(-angleMin + arcOffset);

  debugLayer.append("path")
    .attr("d", arcPath)
    .attr("fill", "none")
    .attr("stroke", ringIndex === 0 ? "#ff0000" : "#00ffff")
    .attr("stroke-width", ringIndex === 0 ? 2 : 1)
    .attr("stroke-dasharray", "5,5")
    .attr("opacity", 0.5);
}

/**
 * Renders a Cartesian bounding box for a segment.
 */
function renderBoundingBox(debugLayer, minAngle, maxAngle, outerRadius) {
  const bounds = computeQuadrantBounds(minAngle, maxAngle, outerRadius);

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
}

/**
 * Renders a label showing segment information.
 */
function renderSegmentLabel(debugLayer, quadrant, ring, angleMin, angleMax, segInner, segOuter, entryCount) {
  const midAngle = (angleMin + angleMax) / 2;
  const labelRadius = (segInner + segOuter) / 2;
  const labelX = Math.cos(midAngle) * labelRadius;
  const labelY = Math.sin(midAngle) * labelRadius;
  const arcLength = (angleMax - angleMin) * segInner;

  debugLayer.append("text")
    .attr("x", labelX)
    .attr("y", labelY)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("fill", "#ff0000")
    .attr("font-weight", "bold")
    .text(`Q${quadrant}R${ring}: ${entryCount} items, arc=${arcLength.toFixed(0)}px`);
}

/**
 * Renders collision radii circles for all entries.
 */
function renderCollisionRadii(debugLayer, entries, defaultCollisionRadius) {
  const d3 = window.d3;

  debugLayer.append("g")
    .attr("id", "debug-collision-radii")
    .selectAll("circle")
    .data(entries)
    .enter()
    .append("circle")
    .attr("cx", function (d) { return d.x; })
    .attr("cy", function (d) { return d.y; })
    .attr("r", function (d) { return d.collision_radius || defaultCollisionRadius; })
    .attr("fill", "none")
    .attr("stroke", function (d) { return d.ring === 0 ? "#00ff00" : "#0000ff"; })
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "2,2")
    .attr("opacity", 0.4);
}

/**
 * Renders coordinate system axes (x and y axes).
 */
function renderCoordinateAxes(debugLayer, outerRadius) {
  // X-axis
  debugLayer.append("line")
    .attr("x1", -outerRadius)
    .attr("y1", 0)
    .attr("x2", outerRadius)
    .attr("y2", 0)
    .attr("stroke", "#666")
    .attr("stroke-width", 0.5)
    .attr("opacity", 0.3);

  // Y-axis
  debugLayer.append("line")
    .attr("x1", 0)
    .attr("y1", -outerRadius)
    .attr("x2", 0)
    .attr("y2", outerRadius)
    .attr("stroke", "#666")
    .attr("stroke-width", 0.5)
    .attr("opacity", 0.3);
}

/**
 * Renders quadrant boundary lines.
 */
function renderQuadrantBoundaries(debugLayer, numQuadrants, outerRadius) {
  for (let i = 0; i < numQuadrants; i++) {
    const gridAngle = -Math.PI + (i * 2 * Math.PI / numQuadrants);
    debugLayer.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", outerRadius * Math.cos(gridAngle))
      .attr("y2", outerRadius * Math.sin(gridAngle))
      .attr("stroke", "#ff00ff") // Magenta
      .attr("stroke-width", 2)
      .attr("opacity", 0.6)
      .attr("stroke-dasharray", "10,5");
  }
}

/**
 * Renders debug legend explaining the color coding.
 */
function renderDebugLegend(debugLayer, outerRadius) {
  const debugLegend = debugLayer.append("g")
    .attr("transform", translate(-outerRadius + 10, -outerRadius + 10));

  const legendItems = [
    { y: 0, text: "DEBUG MODE", color: "#000", bold: true, fontSize: "11px" },
    { y: 15, text: "━━ Ring 0 polar sector", color: "#ff0000", bold: false, fontSize: "9px" },
    { y: 28, text: "━━ Other rings polar sector", color: "#00ffff", bold: false, fontSize: "9px" },
    { y: 41, text: "━━ Cartesian bounding box", color: "#ffff00", bold: false, fontSize: "9px" },
    { y: 54, text: "○ Collision radius (Ring 0)", color: "#00ff00", bold: false, fontSize: "9px" }
  ];

  legendItems.forEach(item => {
    debugLegend.append("text")
      .attr("x", 0)
      .attr("y", item.y)
      .attr("font-size", item.fontSize)
      .attr("font-weight", item.bold ? "bold" : "normal")
      .attr("fill", item.color)
      .text(item.text);
  });
}
