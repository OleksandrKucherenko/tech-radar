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

import { ensureLayoutStructure, translate, viewbox } from './helpers.js';

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

  // Use original base dimensions for viewBox to ensure consistent coordinate system
  const baseWidth = config.originalWidth || 1450;
  const baseHeight = config.originalHeight || 1000;

  // Create or select SVG element with responsive viewBox
  const svg = d3
    .select(`svg#${config.svg_id}`)
    .style('background-color', config.colors.background)
    .attr('viewBox', `0 0 ${baseWidth} ${baseHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // Use fixed dimensions for desktop, responsive for mobile
  const viewport_width = window.innerWidth || document.documentElement.clientWidth;
  if (viewport_width >= 640) {
    // Desktop: use scaled dimensions
    svg.attr('width', scaled_width).attr('height', scaled_height);
  } else {
    // Mobile: remove width/height attributes, let CSS handle responsive sizing
    svg
      .attr('width', null)
      .attr('height', null)
      .style('width', '100%')
      .style('height', 'auto')
      .style('max-width', 'none');
  }

  // Set up layout structure with legend columns
  const layoutWrapper = ensureLayoutStructure(svg);
  const legendLeftColumn = layoutWrapper.select('.radar-legend-column.left');
  const legendRightColumn = layoutWrapper.select('.radar-legend-column.right');

  // Calculate legend column widths based on layout
  const layoutWidth = layoutWrapper.node().getBoundingClientRect().width || config.width;
  const minLegendColumnWidth = config.legend_column_width * 2 + 60;
  const maxLegendColumnWidth = config.legend_column_width * 4 + 80;
  const targetLegendColumnWidth = Math.min(maxLegendColumnWidth, Math.max(minLegendColumnWidth, layoutWidth * 0.3));

  // Calculate number of columns for legend sections (adaptive: 2-4 columns)
  const legendSectionColumns = Math.min(
    4,
    Math.max(2, Math.floor(targetLegendColumnWidth / (config.legend_column_width + 20)))
  );

  // Configure legend columns with spacing and width
  legendLeftColumn.style('gap', `${config.legend_vertical_spacing}px`).style('width', `${targetLegendColumnWidth}px`);

  legendRightColumn.style('gap', `${config.legend_vertical_spacing}px`).style('width', `${targetLegendColumnWidth}px`);

  // Create radar group
  const radar = svg.append('g');

  // Apply transformation: either zoom to specific quadrant or center in available space
  if ('zoomed_quadrant' in config) {
    // Zoom mode: use viewBox to focus on specific quadrant
    svg.attr('viewBox', viewbox(config.zoomed_quadrant, quadrants, rings));
  } else {
    // Normal mode: center radar accounting for title/footer
    // On mobile, use viewBox dimensions; on desktop, use scaled dimensions
    let radar_center_x, radar_center_y, transform_scale;

    if (viewport_width < 640) {
      // Mobile: center based on viewBox dimensions, scale(1)
      radar_center_y = baseHeight / 2 + (dimensions.title_height - dimensions.footer_height) / 2;
      radar_center_x = baseWidth / 2 + config.radar_horizontal_offset;
      transform_scale = 1;
    } else {
      // Desktop: center based on scaled dimensions, scale(config.scale)
      radar_center_y = scaled_height / 2 + (dimensions.title_height - dimensions.footer_height) / 2;
      radar_center_x = scaled_width / 2 + config.radar_horizontal_offset;
      transform_scale = config.scale;
    }

    radar.attr('transform', translate(radar_center_x, radar_center_y).concat(`scale(${transform_scale})`));
  }

  // Set default font family
  config.font_family = config.font_family || 'Arial, Helvetica';

  // Create grid group for rendering
  const grid = radar.append('g');

  return {
    svg,
    radar,
    legendLeftColumn,
    legendRightColumn,
    grid,
    legendSectionColumns,
  };
}
