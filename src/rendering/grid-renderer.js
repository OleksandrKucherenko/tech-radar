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
 * Renders the radar grid including quadrant lines, rings, and ring labels.
 *
 * @param {Object} gridSelection - D3 selection of the grid group element
 * @param {Object} config - Configuration object
 * @param {Array<Object>} quadrants - Array of quadrant configurations
 * @param {Array<Object>} rings - Array of ring configurations
 * @param {number} outerRadius - Outer radius of the radar
 */
export function renderGrid(gridSelection, config, quadrants, rings, outerRadius) {
  const numQuadrants = quadrants.length;

  // Draw grid lines - N radial lines for N quadrants
  for (let i = 0; i < numQuadrants; i++) {
    const angle = -Math.PI + (i * 2 * Math.PI) / numQuadrants;
    gridSelection
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', outerRadius * Math.cos(angle))
      .attr('y2', outerRadius * Math.sin(angle))
      .attr('class', `quadrant-line quadrant-line-${i}`)
      .style('stroke', config.colors.grid)
      .style('stroke-width', 1.5)
      .style('stroke-opacity', 0.3);
  }

  // Background color filter for text labels
  // SOURCE: https://stackoverflow.com/a/31013492/2609980
  const defs = gridSelection.append('defs');
  const filter = defs.append('filter').attr('x', 0).attr('y', 0).attr('width', 1).attr('height', 1).attr('id', 'solid');
  filter.append('feFlood').attr('flood-color', 'rgb(0, 0, 0, 0.8)');
  filter.append('feComposite').attr('in', 'SourceGraphic');

  // Draw rings
  for (let i = 0; i < rings.length; i++) {
    const outer = rings[i].radius;
    const inner = i === 0 ? 0 : rings[i - 1].radius;
    const thickness = Math.max(outer - inner, 1);
    const labelRadius = outer - thickness / 2;
    const labelFontSize = Math.max(12, Math.min(32, thickness * 0.45));

    // Add subtle alternating background fills for better visual separation
    if (i > 0) {
      gridSelection
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', outer)
        .attr('class', `ring ring-${i}`)
        .style('fill', i % 2 === 0 ? 'rgba(0, 0, 0, 0.01)' : 'rgba(0, 0, 0, 0.015)')
        .style('stroke', 'none')
        .style('pointer-events', 'none');
    }

    // Draw ring boundary with enhanced styling
    gridSelection
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', outer)
      .attr('class', `ring-border ring-border-${i}`)
      .style('fill', 'none')
      .style('stroke', config.colors.grid)
      .style('stroke-width', i === 0 ? 2 : 1)
      .style('stroke-opacity', i === 0 ? 0.4 : 0.25);

    // Add ring name labels (if print layout enabled)
    if (config.print_layout) {
      gridSelection
        .append('text')
        .text(config.rings[i].name)
        .attr('y', -labelRadius)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('fill', config.rings[i].color)
        .style('opacity', 0.35)
        .style('font-family', config.font_family)
        .style('font-size', `${labelFontSize}px`)
        .style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .style('user-select', 'none');
    }
  }
}

/**
 * Renders optional title and footer text on the radar.
 *
 * @param {Object} radarSelection - D3 selection of the main radar group
 * @param {Object} config - Configuration object
 */
export function renderTitleAndFooter(radarSelection, config) {
  // Title
  if (config.title && config.print_layout) {
    const titleGroup = radarSelection
      .append('a')
      .attr('href', config.repo_url)
      .attr('target', config.links_in_new_tabs ? '_blank' : null);

    titleGroup
      .append('text')
      .attr('transform', `translate(${config.title_offset.x}, ${config.title_offset.y})`)
      .text(config.title)
      .style('font-family', config.font_family)
      .style('font-size', '34px')
      .style('font-weight', 'bold');

    titleGroup
      .append('text')
      .attr('transform', `translate(${config.title_offset.x}, ${config.title_offset.y + 30})`)
      .text(config.date ? config.date : '')
      .style('font-family', config.font_family)
      .style('font-size', '14px')
      .style('fill', '#999');
  }

  // Footer
  if (config.footer && config.print_layout) {
    radarSelection
      .append('text')
      .attr('transform', `translate(${config.footer_offset.x}, ${config.footer_offset.y})`)
      .text(config.footer)
      .attr('xml:space', 'preserve')
      .style('font-family', config.font_family)
      .style('font-size', '10px')
      .style('fill', '#999');
  }
}
