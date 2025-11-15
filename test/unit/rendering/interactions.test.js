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
