/**
 * Tests for interactions.js - User interaction handlers
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import {
  createBlipInteractions,
  createBubble,
  hideBubble,
  highlightLegendItem,
  showBubble,
  unhighlightLegendItem,
} from '../../../src/rendering/interactions.js';

describe('Interactions', () => {
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '<svg id="test-radar"></svg>';
  });

  describe('createBubble', () => {
    test('should be a function', () => {
      // THEN: createBubble should be exported and be a function
      expect(typeof createBubble).toBe('function');
    });

    test('should accept radar selection and font family', () => {
      // GIVEN: Real D3 selection (D3 is available via happydom)
      const d3 = window.d3;
      const radarSelection = d3.select('#test-radar');

      // WHEN: Creating bubble
      createBubble(radarSelection, 'Arial');

      // THEN: Should create bubble element in DOM
      const bubble = document.querySelector('#bubble');
      expect(bubble).not.toBeNull();

      // AND: Should have text element
      const bubbleText = bubble.querySelector('text');
      expect(bubbleText).not.toBeNull();
    });
  });

  describe('showBubble', () => {
    test('should be a function', () => {
      // THEN: showBubble should be exported
      expect(typeof showBubble).toBe('function');
    });

    test('sizes the background rect with >=4px padding on every side of the label', () => {
      // GIVEN: a bubble in the DOM and a known text bounding box
      const d3 = window.d3;
      createBubble(d3.select('#test-radar'), 'Arial');
      const textNode = document.querySelector('#bubble text');
      // happy-dom doesn't implement SVG layout, so stub the measured bbox
      textNode.getBBox = () => ({ x: 0, y: -10, width: 60, height: 14 });

      // WHEN: showing the bubble for an entry
      showBubble({ label: 'Test Tool', active: true, x: 100, y: 100 }, { print_layout: true });

      // THEN: the rect pads the text by 8px horizontally and 6px vertically
      const rect = document.querySelector('#bubble rect');
      const left = 0 - Number.parseFloat(rect.getAttribute('x'));
      const top = -10 - Number.parseFloat(rect.getAttribute('y'));
      const right = Number.parseFloat(rect.getAttribute('width')) - 60 - left;
      const bottom = Number.parseFloat(rect.getAttribute('height')) - 14 - top;
      expect(left).toBeGreaterThanOrEqual(4);
      expect(right).toBeGreaterThanOrEqual(4);
      expect(top).toBeGreaterThanOrEqual(4);
      expect(bottom).toBeGreaterThanOrEqual(4);
    });
  });

  describe('hideBubble', () => {
    test('should be a function', () => {
      // THEN: hideBubble should be exported
      expect(typeof hideBubble).toBe('function');
    });
  });

  describe('highlightLegendItem', () => {
    test('should be a function', () => {
      // THEN: highlightLegendItem should be exported
      expect(typeof highlightLegendItem).toBe('function');
    });

    test('should handle entry with id', () => {
      // GIVEN: Entry with id
      const entry = { id: 1 };

      // WHEN: Highlighting (element may not exist)
      // THEN: Should not throw
      expect(() => highlightLegendItem(entry)).not.toThrow();
    });
  });

  describe('unhighlightLegendItem', () => {
    test('should be a function', () => {
      // THEN: unhighlightLegendItem should be exported
      expect(typeof unhighlightLegendItem).toBe('function');
    });

    test('should handle entry with id', () => {
      // GIVEN: Entry with id
      const entry = { id: 1 };

      // WHEN: Unhighlighting (element may not exist)
      // THEN: Should not throw
      expect(() => unhighlightLegendItem(entry)).not.toThrow();
    });
  });

  describe('createBlipInteractions', () => {
    test('should be a function', () => {
      // THEN: createBlipInteractions should be exported
      expect(typeof createBlipInteractions).toBe('function');
    });

    test('should return object with mouseover and mouseout handlers', () => {
      // GIVEN: Config
      const config = { print_layout: false };

      // WHEN: Creating interactions
      const interactions = createBlipInteractions(config);

      // THEN: Should return handlers
      expect(interactions).toBeDefined();
      expect(typeof interactions.mouseover).toBe('function');
      expect(typeof interactions.mouseout).toBe('function');
    });
  });
});
