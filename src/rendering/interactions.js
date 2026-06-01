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

import { translate } from './helpers.js';

/**
 * Creates and appends the tooltip bubble element to the radar.
 *
 * @param {Object} radarSelection - D3 selection of the main radar group
 * @param {string} fontFamily - Font family for bubble text
 * @returns {Object} D3 selection of the bubble element
 */
export function createBubble(radarSelection, fontFamily) {
  const bubble = radarSelection
    .append('g')
    .attr('id', 'bubble')
    .attr('x', 0)
    .attr('y', 0)
    .style('opacity', 0)
    .style('pointer-events', 'none')
    .style('user-select', 'none');

  bubble.append('rect').attr('rx', 4).attr('ry', 4).style('fill', '#333');

  bubble.append('text').style('font-family', fontFamily).style('font-size', '10px').style('fill', '#fff');

  bubble.append('path').attr('d', 'M 0,0 10,0 5,8 z').style('fill', '#333');

  return bubble;
}

/**
 * Shows the tooltip bubble for an entry.
 * Uses rendered (clamped) position for stable tooltip positioning.
 *
 * @param {Object} d - Entry data object
 * @param {Object} config - Configuration object
 */
export function showBubble(d, config) {
  if (d.active || config.print_layout) {
    const d3 = window.d3; // Access global d3
    const tooltip = d3.select('#bubble text').text(d.label);
    const bbox = tooltip.node().getBBox();

    // Use rendered (clamped) position for stable tooltip positioning
    const x = d.rendered_x !== undefined ? d.rendered_x : d.x;
    const y = d.rendered_y !== undefined ? d.rendered_y : d.y;

    // Symmetric padding derived from the text's actual bounding box, so the
    // label always clears every edge (>= 4px) regardless of font/size.
    const padX = 8;
    const padY = 6;
    const rectX = bbox.x - padX;
    const rectY = bbox.y - padY;
    const rectWidth = bbox.width + padX * 2;
    const rectHeight = bbox.height + padY * 2;

    d3.select('#bubble')
      .attr('transform', translate(x - bbox.width / 2, y - 16))
      .style('opacity', 0.85);

    d3.select('#bubble rect').attr('x', rectX).attr('y', rectY).attr('width', rectWidth).attr('height', rectHeight);

    // Pointer centered under the label and attached to the rect's bottom edge.
    d3.select('#bubble path').attr('transform', translate(bbox.x + bbox.width / 2 - 5, rectY + rectHeight));
  }
}

/**
 * Hides the tooltip bubble.
 */
export function hideBubble() {
  const d3 = window.d3; // Access global d3
  d3.select('#bubble').attr('transform', translate(0, 0)).style('opacity', 0);
}

/**
 * Highlights a legend item by adding a CSS class.
 *
 * @param {Object} d - Entry data object with id property
 */
export function highlightLegendItem(d) {
  const legendItem = document.getElementById(`legendItem${d.id}`);
  if (legendItem) {
    legendItem.classList.add('legend-highlight');
  }
}

/**
 * Removes highlight from a legend item.
 *
 * @param {Object} d - Entry data object with id property
 */
export function unhighlightLegendItem(d) {
  const legendItem = document.getElementById(`legendItem${d.id}`);
  if (legendItem) {
    legendItem.classList.remove('legend-highlight');
  }
}

/**
 * Creates interaction event handlers for blips.
 * Returns an object with mouseover and mouseout handlers.
 *
 * @param {Object} config - Configuration object
 * @returns {Object} Object with mouseover and mouseout handler functions
 */
export function createBlipInteractions(config) {
  return {
    mouseover: (_event, d) => {
      showBubble(d, config);
      highlightLegendItem(d);
    },
    mouseout: (_event, d) => {
      hideBubble();
      unhighlightLegendItem(d);
    },
  };
}

/**
 * Creates or returns the description modal DOM element.
 * The modal is created once and reused for all descriptions.
 *
 * @returns {HTMLElement} The modal DOM element
 */
export function createDescriptionModal() {
  let modal = document.getElementById('tech-radar-description-modal');
  if (modal) {
    return modal;
  }

  modal = document.createElement('div');
  modal.id = 'tech-radar-description-modal';
  modal.className = 'tech-radar-modal';
  // Inline critical styles so modal works without external CSS (e.g., Confluence HTML macro)
  modal.style.cssText =
    'display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:10000;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div class="tech-radar-modal-backdrop" style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);"></div>
    <div class="tech-radar-modal-content" style="position:relative;background:white;border-radius:12px;padding:32px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:10001;">
      <button class="tech-radar-modal-close" aria-label="Close" style="position:absolute;top:16px;right:16px;background:transparent;border:none;font-size:28px;line-height:1;color:#666;cursor:pointer;padding:4px 8px;border-radius:4px;">&times;</button>
      <div class="tech-radar-modal-body" style="font-size:15px;line-height:1.6;color:#555;"></div>
    </div>
  `;

  document.body.appendChild(modal);

  // Setup close handlers
  const backdrop = modal.querySelector('.tech-radar-modal-backdrop');
  const closeButton = modal.querySelector('.tech-radar-modal-close');

  const closeModal = () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };

  backdrop.addEventListener('click', closeModal);
  closeButton.addEventListener('click', closeModal);

  // ESC key handler
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeModal();
    }
  });

  return modal;
}

/**
 * Shows the description modal for an entry.
 * Displays the entry's description with optional Markdown rendering.
 * Displays the entity logo if available (64x64px circular image).
 *
 * @param {Object} entry - Entry data object with description and optional logo property
 * @param {Object} config - Configuration object with optional descriptionTransform function
 */
export function showDescriptionModal(entry, config) {
  if (!entry.description) {
    return;
  }

  const modal = createDescriptionModal();
  const modalContent = modal.querySelector('.tech-radar-modal-content');
  const body = modal.querySelector('.tech-radar-modal-body');

  // Remove existing header/title if any (for modal reuse)
  modalContent.querySelectorAll('.tech-radar-modal-header, .tech-radar-modal-title').forEach(el => {
    el.remove();
  });

  // Create header container
  const header = document.createElement('div');
  header.className = 'tech-radar-modal-header';
  header.style.cssText = 'display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;';

  // Add logo if available
  if (entry.logo) {
    const logo = document.createElement('img');
    logo.className = 'tech-radar-modal-logo';
    logo.src = entry.logo;
    logo.alt = `${entry.label} logo`;
    logo.style.cssText =
      'flex-shrink:0;width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #e0e0e0;';
    // Hide logo if it fails to load
    logo.onerror = function () {
      this.style.display = 'none';
    };
    header.appendChild(logo);
  }

  // Create and add title
  const title = document.createElement('h2');
  title.className = 'tech-radar-modal-title';
  title.style.cssText = 'margin:0 32px 0 0;font-size:24px;font-weight:600;color:#333;line-height:1.3;flex:1;';
  title.textContent = entry.label;
  header.appendChild(title);

  // Insert header before body
  modalContent.insertBefore(header, body);

  // Transform description (e.g., Markdown to HTML)
  let descriptionHtml = '';
  if (config.descriptionTransform && typeof config.descriptionTransform === 'function') {
    descriptionHtml = config.descriptionTransform(entry.description);
  } else {
    // Default: split into paragraphs
    const paragraphs = entry.description
      .split('\n\n')
      .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('');
    descriptionHtml = paragraphs;
  }

  body.innerHTML = descriptionHtml;

  // Add link if present
  if (entry.link) {
    const linkEl = document.createElement('p');
    linkEl.className = 'tech-radar-modal-link';
    const anchor = document.createElement('a');
    anchor.href = entry.link;
    anchor.textContent = 'Learn more →';
    if (config.links_in_new_tabs) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
    linkEl.appendChild(anchor);
    body.appendChild(linkEl);
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
