/**
 * Tests for svg-setup.js - SVG sizing and layout configuration
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { applyConfigDefaults, calculateDimensions } from '../../../src/config/config-defaults.js';
import { generateQuadrants } from '../../../src/geometry/quadrant-calculator.js';
import { generateRings } from '../../../src/geometry/ring-calculator.js';
import { setupSvg } from '../../../src/rendering/svg-setup.js';

function createConfig(options = {}) {
  return {
    svg_id: 'radar',
    width: 1450,
    height: 1000,
    quadrants: options.quadrants || [
      { name: 'Q1' },
      { name: 'Q2' },
      { name: 'Q3' },
      { name: 'Q4' },
      { name: 'Q5' },
      { name: 'Q6' },
      { name: 'Q7' },
      { name: 'Q8' },
    ],
    rings: options.rings || [
      { name: 'R1', color: '#000' },
      { name: 'R2', color: '#000' },
      { name: 'R3', color: '#000' },
      { name: 'R4', color: '#000' },
      { name: 'R5', color: '#000' },
      { name: 'R6', color: '#000' },
      { name: 'R7', color: '#000' },
      { name: 'R8', color: '#000' },
    ],
    entries: [],
    title: 'Test Radar',
    ...options,
  };
}

function setViewport(width, height) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

describe('setupSvg', () => {
  beforeEach(() => {
    document.body.innerHTML = '<svg id="radar"></svg>';
    setViewport(1600, 900);
  });

  test('uses adjusted dimensions for viewBox when complexity scaling applies', () => {
    // GIVEN: An 8x8 configuration that triggers complexity-based resizing
    const config = createConfig();

    applyConfigDefaults(config);
    const dimensions = calculateDimensions(config);
    const quadrants = generateQuadrants(config.quadrants.length);
    const rings = generateRings(config.rings.length, dimensions.target_outer_radius);

    // WHEN: Setting up the SVG
    setupSvg(config, quadrants, rings, dimensions);

    // THEN: viewBox should match the adjusted config width/height
    const svg = document.querySelector('svg#radar');
    expect(svg).toBeTruthy();
    expect(config.width).toBeGreaterThan(1450);
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${config.width} ${config.height}`);
  });
});
