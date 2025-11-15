/**
 * Tests for debug-renderer.js - Debug visualization helpers
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { renderDebugVisualization } from '../../../src/rendering/debug-renderer.js';

describe('Debug Renderer', () => {
  beforeEach(() => {
    // Setup DOM with SVG (happydom is configured in test setup)
    document.body.innerHTML = '<svg id="test-radar"><g id="radar-group"></g></svg>';
  });

  describe('renderDebugVisualization', () => {
    test('should be a function', () => {
      // THEN: renderDebugVisualization should be exported and be a function
      expect(typeof renderDebugVisualization).toBe('function');
    });

    test('should accept required parameters', () => {
      // GIVEN: Real D3 selection and parameters (D3 is available via happydom)
      const d3 = window.d3;
      const radarSelection = d3.select('#radar-group');
      const config = {
        show_segment_grid: true,
        entries: [],
        blip_collision_radius: 12,
      };
      const quadrants = [
        { name: 'Q1', radial_min: 0, radial_max: 0.25 },
        { name: 'Q2', radial_min: 0.25, radial_max: 0.5 },
      ];
      const rings = [{ name: 'R1', radius: 100 }];
      const numQuadrants = 2;
      const numRings = 1;
      const segmented = [
        [[], []],
        [[], []],
      ];

      // WHEN: Calling renderDebugVisualization
      // THEN: Should not throw
      expect(() =>
        renderDebugVisualization(radarSelection, config, quadrants, rings, numQuadrants, numRings, segmented)
      ).not.toThrow();

      // AND: Should create debug layer in DOM
      const debugLayer = document.querySelector('#debug-layer');
      expect(debugLayer).not.toBeNull();
    });

    test('should handle minimal config', () => {
      // GIVEN: Real D3 selection with minimal config
      const d3 = window.d3;
      const radarSelection = d3.select('#radar-group');
      const config = {
        entries: [],
        blip_collision_radius: 12,
      };
      const quadrants = [];
      const rings = [{ radius: 100 }];

      // WHEN: Calling with minimal config
      // THEN: Should not throw
      expect(() => renderDebugVisualization(radarSelection, config, quadrants, rings, 0, 0, [])).not.toThrow();
    });
  });
});
