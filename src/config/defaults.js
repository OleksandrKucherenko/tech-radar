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

/**
 * Default configuration values for the radar visualization.
 */
export const CONFIG_DEFAULTS = {
  svg_id: 'radar',
  width: 1450,
  height: 1000,
  colors: {
    background: '#fff',
    grid: '#dddde0',
    inactive: '#ddd'
  },
  print_layout: true,
  links_in_new_tabs: true,
  repo_url: '#',
  print_ring_descriptions_table: false,
  legend_column_width: 140,
  legend_line_height: 10,
  segment_radial_padding: 16,
  segment_angular_padding: 12,
  chart_padding: 60,
  blip_collision_radius: 14,
  legend_vertical_spacing: 20,
  debug_geometry: false,
  seed: 42
};

/**
 * Applies default values to user configuration.
 * Performs deep merge for nested objects like colors.
 *
 * @param {Object} userConfig - User-provided configuration
 * @returns {Object} Configuration with defaults applied
 */
export function applyDefaults(userConfig) {
  const config = {
    ...CONFIG_DEFAULTS,
    ...userConfig
  };

  // Deep merge colors
  if (userConfig.colors) {
    config.colors = {
      ...CONFIG_DEFAULTS.colors,
      ...userConfig.colors
    };
  }

  // Handle svg_id alias (svg or svg_id)
  config.svg_id = userConfig.svg || userConfig.svg_id || CONFIG_DEFAULTS.svg_id;

  // Calculate radar_horizontal_offset if not provided
  if (!('radar_horizontal_offset' in userConfig)) {
    config.radar_horizontal_offset = Math.round(config.legend_column_width * 0.25);
  }

  return config;
}

/**
 * Calculates responsive sizing adjustments based on viewport and grid complexity.
 *
 * @param {Object} config - Configuration object
 * @param {number} viewportWidth - Viewport width in pixels
 * @param {number} viewportHeight - Viewport height in pixels
 * @returns {Object} Config with responsive adjustments applied
 */
export function applyResponsiveSizing(config, viewportWidth, viewportHeight) {
  const adjusted = { ...config };

  // Apply responsive scaling for smaller viewports
  if (viewportWidth < 1024 && !config.scale) {
    const scale_factor = Math.min(viewportWidth / 1450, viewportHeight / 1000);
    adjusted.scale = Math.max(0.5, Math.min(1, scale_factor));
  }

  // Adjust sizing based on grid complexity (for 5+ quadrants)
  const grid_quadrants = config.quadrants?.length || 4;
  const grid_rings = config.rings?.length || 4;

  if (grid_quadrants >= 5 || grid_rings >= 6) {
    // Increase base size for complex grids to prevent overcrowding
    const complexity_multiplier = 1 + ((grid_quadrants - 4) * 0.05) + ((grid_rings - 4) * 0.03);

    if (!config.width_override) {
      adjusted.width = Math.round(config.width * Math.min(complexity_multiplier, 1.3));
    }
    if (!config.height_override) {
      adjusted.height = Math.round(config.height * Math.min(complexity_multiplier, 1.3));
    }

    // Slightly reduce collision radius for high-complexity grids
    if (grid_quadrants >= 7 || grid_rings >= 7) {
      adjusted.blip_collision_radius = Math.max(10, config.blip_collision_radius * 0.9);
    }
  }

  return adjusted;
}

/**
 * Calculates available space for the radar chart after accounting for title and footer.
 *
 * @param {Object} config - Configuration object
 * @returns {Object} Object containing available_height, available_width, and target_outer_radius
 */
export function calculateAvailableSpace(config) {
  const title_height = config.print_layout && config.title ? 60 : 0;
  const footer_height = config.print_layout ? 40 : 0;
  const minimum_chart_height = (2 * config.chart_padding) + 40;

  const available_height = Math.max(
    minimum_chart_height,
    config.height - title_height - footer_height
  );
  const available_width = Math.max(
    (2 * config.chart_padding) + 40,
    config.width
  );

  const raw_outer_radius = Math.min(available_width, available_height) / 2 - config.chart_padding;
  const target_outer_radius = Math.max(10, raw_outer_radius);

  return {
    available_height,
    available_width,
    target_outer_radius
  };
}
