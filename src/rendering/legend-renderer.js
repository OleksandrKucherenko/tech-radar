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
 * Renders legend columns in the left and right containers.
 * Distributes quadrants across columns and renders rings with their entries.
 *
 * @param {Object} legendLeftColumn - D3 selection of left legend column
 * @param {Object} legendRightColumn - D3 selection of right legend column
 * @param {Array<Array<Array<Object>>>} segmented - 2D array of entries [quadrant][ring]
 * @param {Object} config - Configuration object
 * @param {number} numQuadrants - Number of quadrants
 * @param {number} numRings - Number of rings
 * @param {Function} showBubble - Function to show tooltip bubble
 * @param {Function} hideBubble - Function to hide tooltip bubble
 * @param {Function} highlightLegendItem - Function to highlight legend item
 * @param {Function} unhighlightLegendItem - Function to unhighlight legend item
 */
export function renderLegendColumns(
  legendLeftColumn,
  legendRightColumn,
  segmented,
  config,
  numQuadrants,
  numRings,
  showBubble,
  hideBubble,
  highlightLegendItem,
  unhighlightLegendItem
) {
  legendLeftColumn.html('');
  legendRightColumn.html('');

  // Determine number of columns per section based on ring count
  // 4-6 rings: 2 columns, 7-8 rings: 3 columns
  const legendSectionColumns = numRings >= 7 ? 3 : 2;

  // Calculate which quadrants go in which column for clockwise ordering
  // Right column: clockwise from position (num_quadrants - 2)
  // Left column: remaining quadrants in reverse order (counter-clockwise visually)
  // This ensures legends are visually close to their radar sectors
  const right_count = Math.ceil(numQuadrants / 2);
  const left_count = Math.floor(numQuadrants / 2);
  const right_start = numQuadrants - 2;

  const leftQuadrants = [];
  const rightQuadrants = [];

  // Fill right column quadrants (clockwise from right_start)
  for (let i = 0; i < right_count; i++) {
    rightQuadrants.push((right_start + i) % numQuadrants);
  }

  // Fill left column quadrants (backward from right_start - 1)
  for (let i = 0; i < left_count; i++) {
    leftQuadrants.push((right_start - 1 - i + numQuadrants) % numQuadrants);
  }

  function targetColumn(quadrant) {
    return leftQuadrants.includes(quadrant) ? legendLeftColumn : legendRightColumn;
  }

  // Render each quadrant's legend section
  for (let quadrant = 0; quadrant < numQuadrants; quadrant++) {
    const column = targetColumn(quadrant);
    const section = column.append('div')
      .attr('class', 'legend-section')
      .style('--legend-columns', legendSectionColumns);

    section.append('div')
      .attr('class', 'legend-quadrant-name')
      .text(config.quadrants[quadrant].name);

    const ringsContainer = section.append('div').attr('class', 'legend-rings');

    // Render each ring's entries
    for (let ring = 0; ring < numRings; ring++) {
      const entriesInRing = segmented[quadrant][ring];
      if (!entriesInRing.length) {
        continue; // Skip empty rings
      }

      const ringBlock = ringsContainer.append('div').attr('class', 'legend-ring');
      ringBlock.append('div')
        .attr('class', 'legend-ring-name')
        .style('color', config.rings[ring].color)
        .text(config.rings[ring].name);

      const entriesList = ringBlock.append('div').attr('class', 'legend-ring-entries');
      entriesList.selectAll('a')
        .data(entriesInRing)
        .enter()
        .append('a')
        .attr('href', function (d) { return d.link ? d.link : '#'; })
        .attr('target', function (d) { return (d.link && config.links_in_new_tabs) ? '_blank' : null; })
        .attr('id', function (d) { return 'legendItem' + d.id; })
        .attr('class', 'legend-entry')
        .text(function (d) { return d.id + '. ' + d.label; })
        .on('mouseover', function (event, d) {
          showBubble(d, config);
          highlightLegendItem(d);
        })
        .on('mouseout', function (event, d) {
          hideBubble();
          unhighlightLegendItem(d);
        });
    }
  }
}
