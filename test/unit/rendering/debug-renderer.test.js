/**
 * Tests for debug-renderer.js - Debug visualization helpers
 */

import { describe, expect, test } from 'bun:test';
import { renderDebugVisualization } from '../../../src/rendering/debug-renderer.js';

describe('Debug Renderer', () => {
  describe('renderDebugVisualization', () => {
    test('should be a function', () => {
      // THEN: renderDebugVisualization should be exported and be a function
      expect(typeof renderDebugVisualization).toBe('function');
    });

    test('should accept required parameters', () => {
      // GIVEN: Mock parameters
      const radarSelection = { append: () => ({ attr: () => ({}) }) };
      const config = { show_segment_grid: true };
      const quadrants = [{ name: 'Q1' }, { name: 'Q2' }];
      const rings = [{ name: 'R1', radius: 100 }];
      const numQuadrants = 2;
      const numRings = 1;
      const segmented = [[[]]];

      // WHEN: Calling renderDebugVisualization
      // THEN: Should not throw
      expect(() =>
        renderDebugVisualization(radarSelection, config, quadrants, rings, numQuadrants, numRings, segmented)
      ).not.toThrow();
    });

    test('should handle minimal config', () => {
      // GIVEN: Minimal config
      const radarSelection = { append: () => ({ attr: () => ({}) }) };
      const config = {};
      const quadrants = [];
      const rings = [{ radius: 100 }];

      // WHEN: Calling with minimal config
      // THEN: Should not throw
      expect(() => renderDebugVisualization(radarSelection, config, quadrants, rings, 0, 0, [])).not.toThrow();
    });
  });
});
