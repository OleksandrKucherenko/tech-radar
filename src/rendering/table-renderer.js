// The MIT License (MIT)

// Copyright (c) 2017-2024 Zalando SE

/**
 * Table Renderer Module
 *
 * Phase 5 Refactoring: Extracted optional ring descriptions table rendering
 *
 * Renders an HTML table showing ring names and descriptions. This is an optional
 * feature that is rarely used, controlled by the config.print_ring_descriptions_table flag.
 */

/**
 * Renders a table with ring names and descriptions.
 *
 * Creates an HTML table element appended to the body, with column headers showing
 * ring names (color-coded) and a row showing ring descriptions. The table is
 * positioned below the radar visualization with responsive column widths.
 *
 * @param {Object} config - Configuration object containing:
 *   - rings: Array of ring objects with name, color, and description properties
 *   - font_family: Font family for text styling
 */
export function renderRingDescriptionsTable(config) {
  const d3 = window.d3;

  // Create table element
  const table = d3
    .select('body')
    .append('table')
    .attr('class', 'radar-table')
    .style('border-collapse', 'collapse')
    .style('position', 'relative')
    .style('top', '-70px') // Adjust vertical position relative to radar
    .style('margin-left', '50px')
    .style('margin-right', '50px')
    .style('font-family', config.font_family)
    .style('font-size', '13px')
    .style('text-align', 'left');

  // Create table structure
  const thead = table.append('thead');
  const tbody = table.append('tbody');

  // Calculate responsive column width
  const columnWidth = `${100 / config.rings.length}%`;

  // Create header row with ring names
  const headerRow = thead.append('tr').style('border', '1px solid #ddd');

  headerRow
    .selectAll('th')
    .data(config.rings)
    .enter()
    .append('th')
    .style('padding', '8px')
    .style('border', '1px solid #ddd')
    .style('background-color', d => d.color)
    .style('color', '#fff')
    .style('width', columnWidth)
    .text(d => d.name);

  // Create description row
  const descriptionRow = tbody.append('tr').style('border', '1px solid #ddd');

  descriptionRow
    .selectAll('td')
    .data(config.rings)
    .enter()
    .append('td')
    .style('padding', '8px')
    .style('border', '1px solid #ddd')
    .style('width', columnWidth)
    .text(d => d.description);
}
