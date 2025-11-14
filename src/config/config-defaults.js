// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

/**
 * Configuration Defaults Module
 *
 * Phase 5 Refactoring: Extracted configuration management
 *
 * Centralizes all default configuration values, responsive scaling calculations,
 * and grid complexity adjustments. This module handles the setup phase of the
 * radar visualization before geometry generation begins.
 */

import { computeLegendOffsets } from '../rendering/helpers.js';

/**
 * Applies default values to all configuration properties.
 *
 * Mutates the config object by setting defaults for any missing properties.
 * Handles responsive viewport scaling and grid complexity adjustments.
 *
 * @param {Object} config - User-provided configuration object
 */
export function applyConfigDefaults(config) {
  // SVG element configuration
  config.svg_id = config.svg || "radar";
  config.width = config.width || 1450;
  config.height = config.height || 1000;

  // Color scheme
  config.colors = ("colors" in config) ? config.colors : {
    background: "#fff",
    grid: '#dddde0',
    inactive: "#ddd"
  };

  // Layout flags
  config.print_layout = ("print_layout" in config) ? config.print_layout : true;
  config.links_in_new_tabs = ("links_in_new_tabs" in config) ? config.links_in_new_tabs : true;
  config.repo_url = config.repo_url || '#';
  config.print_ring_descriptions_table = ("print_ring_descriptions_table" in config)
    ? config.print_ring_descriptions_table
    : false;

  // Spacing and sizing
  config.legend_column_width = config.legend_column_width || 140;
  config.legend_line_height = config.legend_line_height || 10;
  config.segment_radial_padding = ("segment_radial_padding" in config)
    ? config.segment_radial_padding
    : 16;
  config.segment_angular_padding = ("segment_angular_padding" in config)
    ? config.segment_angular_padding
    : 12;
  config.chart_padding = ("chart_padding" in config) ? config.chart_padding : 60;
  config.blip_collision_radius = ("blip_collision_radius" in config)
    ? config.blip_collision_radius
    : 14;
  config.legend_vertical_spacing = config.legend_vertical_spacing || 20;
  config.radar_horizontal_offset = ("radar_horizontal_offset" in config)
    ? config.radar_horizontal_offset
    : Math.round(config.legend_column_width * 0.25);

  // Debug mode
  config.debug_geometry = ("debug_geometry" in config) ? config.debug_geometry : false;

  // Apply responsive scaling for smaller viewports
  const viewport_width = window.innerWidth || document.documentElement.clientWidth;
  const viewport_height = window.innerHeight || document.documentElement.clientHeight;

  if (viewport_width < 1024 && !config.scale) {
    // Mobile/tablet scaling
    const scale_factor = Math.min(viewport_width / 1450, viewport_height / 1000);
    config.scale = Math.max(0.5, Math.min(1, scale_factor));
  }

  // Adjust sizing based on grid complexity (5+ quadrants or 6+ rings)
  const grid_quadrants = config.quadrants.length;
  const grid_rings = config.rings.length;

  if (grid_quadrants >= 5 || grid_rings >= 6) {
    // Increase base size for complex grids to prevent overcrowding
    const complexity_multiplier = 1 + ((grid_quadrants - 4) * 0.05) + ((grid_rings - 4) * 0.03);

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
}

/**
 * Calculates dimensions for the radar visualization.
 *
 * Computes available space accounting for title/footer, and calculates
 * the target outer radius for the radar rings.
 *
 * @param {Object} config - Configuration object with defaults applied
 * @returns {Object} Calculated dimensions
 * @property {number} title_height - Height reserved for title
 * @property {number} footer_height - Height reserved for footer
 * @property {number} available_height - Height available for radar
 * @property {number} available_width - Width available for radar
 * @property {number} target_outer_radius - Target radius for outermost ring
 */
export function calculateDimensions(config) {
  // Calculate space for title and footer
  const title_height = config.print_layout && config.title ? 60 : 0;
  const footer_height = config.print_layout ? 40 : 0;
  const minimum_chart_height = (2 * config.chart_padding) + 40;

  const available_height = Math.max(
    minimum_chart_height,
    config.height - title_height - footer_height
  );
  const available_width = Math.max((2 * config.chart_padding) + 40, config.width);

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

/**
 * Configures offset positions for title, footer, and legend.
 *
 * Sets up positioning for title, footer, and legend based on the outer radius.
 * Mutates the config object to add offset properties.
 *
 * @param {Object} config - Configuration object
 * @param {number} outerRadius - Outer radius of the radar
 * @param {number} numQuadrants - Number of quadrants
 */
export function configureOffsets(config, outerRadius, numQuadrants) {
  // Set title offset if not provided
  if (!config.title_offset) {
    config.title_offset = {
      x: -outerRadius,
      y: -outerRadius - 40
    };
  }

  // Set footer offset if not provided
  if (!config.footer_offset) {
    config.footer_offset = {
      x: -outerRadius,
      y: outerRadius + 60
    };
  }

  // Calculate legend offsets
  config.legend_offset = computeLegendOffsets(numQuadrants, outerRadius, config);
}
