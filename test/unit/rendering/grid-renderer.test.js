/**
 * Tests for grid-renderer.js - curved quadrant (sector) labels
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { renderQuadrantLabels } from '../../../src/rendering/grid-renderer.js';

const QUADRANTS = [
  { radial_min: -1, radial_max: -1 / 3 }, // upper half
  { radial_min: -1 / 3, radial_max: 1 / 3 }, // right side
  { radial_min: 1 / 3, radial_max: 1 }, // bottom half (reversed arc)
];

function makeConfig(overrides = {}) {
  return {
    svg_id: 'radar',
    curved_quadrant_labels: true,
    font_family: 'Arial',
    colors: { background: '#fff' },
    quadrants: [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma Long Name Sector' }],
    ...overrides,
  };
}

describe('renderQuadrantLabels', () => {
  beforeEach(() => {
    document.body.innerHTML = '<svg id="test-radar"><g id="radar-group"></g></svg>';
  });

  test('is opt-in: renders nothing when the flag is off', () => {
    const radar = window.d3.select('#radar-group');
    renderQuadrantLabels(radar, makeConfig({ curved_quadrant_labels: false }), QUADRANTS, 400);

    expect(document.querySelectorAll('#radar-group text.quadrant-label').length).toBe(0);
    expect(document.querySelectorAll('#radar-group defs path').length).toBe(0);
  });

  test('renders one curved label per quadrant with the sector name', () => {
    const radar = window.d3.select('#radar-group');
    renderQuadrantLabels(radar, makeConfig(), QUADRANTS, 400);

    const labels = document.querySelectorAll('#radar-group text.quadrant-label');
    const arcs = document.querySelectorAll('#radar-group defs path');
    const textPaths = document.querySelectorAll('#radar-group textPath');

    // One arc path + one label (with a textPath) per quadrant
    expect(arcs.length).toBe(3);
    expect(labels.length).toBe(3);
    expect(textPaths.length).toBe(3);

    // Labels carry the configured sector names
    expect([...textPaths].map(t => t.textContent)).toEqual(['Alpha', 'Beta', 'Gamma Long Name Sector']);

    // Each textPath references its arc by id
    const ids = [...arcs].map(p => p.getAttribute('id'));
    expect(ids).toEqual(['radar-qlabel-radar-0', 'radar-qlabel-radar-1', 'radar-qlabel-radar-2']);
    [...textPaths].forEach((tp, i) => {
      expect(tp.getAttribute('href')).toBe(`#${ids[i]}`);
    });
  });
});
