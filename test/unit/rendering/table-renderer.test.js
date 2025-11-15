/**
 * Tests for table-renderer.js - HTML table generation
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { renderRingDescriptionsTable } from '../../../src/rendering/table-renderer.js';

describe('Table Renderer', () => {
  beforeEach(() => {
    // Setup DOM (happydom is configured in test setup)
    document.body.innerHTML = '<div id="test-container"></div>';
  });

  describe('renderRingDescriptionsTable', () => {
    test('should be a function', () => {
      // THEN: renderRingDescriptionsTable should be exported and be a function
      expect(typeof renderRingDescriptionsTable).toBe('function');
    });

    test('should accept configuration parameter', () => {
      // GIVEN: Config with rings (D3 is available via happydom)
      const config = {
        quadrants: [{ name: 'Frontend' }, { name: 'Backend' }],
        rings: [
          { name: 'Adopt', color: '#5ba300', description: 'Use these' },
          { name: 'Trial', color: '#009eb0', description: 'Try these' },
        ],
        font_family: 'Arial',
      };

      // WHEN: Calling renderRingDescriptionsTable
      renderRingDescriptionsTable(config);

      // THEN: Should create table in DOM with correct class
      const table = document.querySelector('table');
      expect(table).not.toBeNull();
      expect(table.classList.contains('radar-table')).toBe(true);
    });

    test('should handle minimal config', () => {
      // GIVEN: Config with minimal rings
      const config = {
        rings: [{ name: 'R1', color: '#000' }],
      };

      // WHEN: Rendering with minimal config
      renderRingDescriptionsTable(config);

      // THEN: Should create table
      const table = document.querySelector('table');
      expect(table).not.toBeNull();
    });

    test('should require rings array in config', () => {
      // GIVEN: Config without rings
      const config = {};

      // WHEN: Rendering with no rings
      // THEN: Should throw because rings is required
      expect(() => renderRingDescriptionsTable(config)).toThrow();
    });
  });
});
