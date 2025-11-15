/**
 * Tests for table-renderer.js - HTML table generation
 */

import { describe, expect, test } from 'bun:test';
import { renderRingDescriptionsTable } from '../../../src/rendering/table-renderer.js';

describe('Table Renderer', () => {
  describe('renderRingDescriptionsTable', () => {
    test('should be a function', () => {
      // THEN: renderRingDescriptionsTable should be exported and be a function
      expect(typeof renderRingDescriptionsTable).toBe('function');
    });

    test('should accept configuration parameter', () => {
      // GIVEN: Minimal config
      const config = {
        quadrants: [{ name: 'Frontend' }, { name: 'Backend' }],
        rings: [
          { name: 'Adopt', color: '#5ba300', description: 'Use these' },
          { name: 'Trial', color: '#009eb0', description: 'Try these' },
        ],
        font_family: 'Arial',
      };

      // WHEN: Calling renderRingDescriptionsTable
      // THEN: Should not throw
      expect(() => renderRingDescriptionsTable(config)).not.toThrow();
    });

    test('should handle minimal config', () => {
      // GIVEN: Config with minimal rings
      const config = {
        rings: [{ name: 'R1', color: '#000' }],
      };

      // WHEN: Rendering with minimal config
      // THEN: Should not throw
      expect(() => renderRingDescriptionsTable(config)).not.toThrow();
    });

    test('should handle config without rings', () => {
      // GIVEN: Config without rings
      const config = {};

      // WHEN: Rendering with no rings
      // THEN: Should not throw
      expect(() => renderRingDescriptionsTable(config)).not.toThrow();
    });
  });
});
