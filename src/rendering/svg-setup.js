// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

/**
 * SVG Setup Module
 *
 * Phase 5 Refactoring: Extracted SVG element creation and layout configuration
 *
 * Handles the creation and configuration of the main SVG element, layout structure,
 * legend columns, and radar group. This module sets up the D3 selections that will
 * be used throughout the rendering pipeline.
 */

import { translate, viewbox, ensureLayoutStructure } from './helpers.js';

/**
 * Sets up the SVG element and layout structure for the radar visualization.
 *
 * Creates or selects the SVG element, configures dimensions and scaling,
 * sets up the layout wrapper with legend columns, creates the radar group,
 * and applies transformations for centering or zoom mode.
 *
 * @param {Object} config - Configuration object with all defaults applied
 * @param {Array} quadrants - Array of quadrant configurations
 * @param {Array} rings - Array of ring configurations
 * @param {Object} dimensions - Calculated dimensions from calculateDimensions()
 * @returns {Object} D3 selections for SVG elements
 * @property {d3.Selection} svg - Main SVG element
 * @property {d3.Selection} radar - Radar group (transformed and scaled)
 * @property {d3.Selection} legendLeftColumn - Left legend column
 * @property {d3.Selection} legendRightColumn - Right legend column
 * @property {d3.Selection} grid - Grid group for rendering
 * @property {number} legendSectionColumns - Number of columns for legend sections
 */
export function setupSvg(config, quadrants, rings, dimensions) {
  const d3 = window.d3;

  // Apply scaling
  config.scale = config.scale || 1;
  const scaled_width = config.width * config.scale;
  const scaled_height = config.height * config.scale;

  // Create or select SVG element
  const svg = d3.select("svg#" + config.svg_id)
    .style("background-color", config.colors.background)
    .attr("width", scaled_width)
    .attr("height", scaled_height);

  // Set up layout structure with legend columns
  const layoutWrapper = ensureLayoutStructure(svg);
  const legendLeftColumn = layoutWrapper.select('.radar-legend-column.left');
  const legendRightColumn = layoutWrapper.select('.radar-legend-column.right');

  // Calculate legend column widths based on layout
  const layoutWidth = layoutWrapper.node().getBoundingClientRect().width || config.width;
  const minLegendColumnWidth = (config.legend_column_width * 2) + 60;
  const maxLegendColumnWidth = (config.legend_column_width * 4) + 80;
  const targetLegendColumnWidth = Math.min(
    maxLegendColumnWidth,
    Math.max(minLegendColumnWidth, layoutWidth * 0.3)
  );

  // Calculate number of columns for legend sections (adaptive: 2-4 columns)
  const legendSectionColumns = Math.min(
    4,
    Math.max(2, Math.floor(targetLegendColumnWidth / (config.legend_column_width + 20)))
  );

  // Configure legend columns with spacing and width
  legendLeftColumn
    .style('gap', config.legend_vertical_spacing + 'px')
    .style('width', targetLegendColumnWidth + 'px');

  legendRightColumn
    .style('gap', config.legend_vertical_spacing + 'px')
    .style('width', targetLegendColumnWidth + 'px');

  // Create radar group
  const radar = svg.append("g");

  // Apply transformation: either zoom to specific quadrant or center in available space
  if ("zoomed_quadrant" in config) {
    // Zoom mode: use viewBox to focus on specific quadrant
    svg.attr("viewBox", viewbox(config.zoomed_quadrant, quadrants, rings));
  } else {
    // Normal mode: center radar accounting for title/footer
    const radar_center_y = (scaled_height / 2) +
      ((dimensions.title_height - dimensions.footer_height) / 2);
    const radar_center_x = (scaled_width / 2) + config.radar_horizontal_offset;

    radar.attr("transform",
      translate(radar_center_x, radar_center_y).concat(`scale(${config.scale})`)
    );
  }

  // Set default font family
  config.font_family = config.font_family || "Arial, Helvetica";

  // Create grid group for rendering
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
