// Test suite for configuration validation
import { describe, test, expect } from 'vitest';
import {
  ConfigValidationError,
  validateConfig,
  validateConfigAll
} from '../../../src/validation/config-validator.js';

describe('ConfigValidationError', () => {
  test('creates error with message, field, and value', () => {
    // WHEN: creating a validation error
    const error = new ConfigValidationError(
      'Invalid quadrant count',
      'quadrants',
      1
    );

    // THEN: should have correct properties
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ConfigValidationError);
    expect(error.name).toBe('ConfigValidationError');
    expect(error.message).toBe('Invalid quadrant count');
    expect(error.field).toBe('quadrants');
    expect(error.value).toBe(1);
  });
});

describe('validateConfig()', () => {
  describe('quadrant validation', () => {
    test('accepts 2 quadrants (minimum)', () => {
      // GIVEN: config with 2 quadrants
      const config = {
        quadrants: [{ name: 'Q1' }, { name: 'Q2' }],
        rings: [
          { name: 'R1', color: '#000' },
          { name: 'R2', color: '#111' },
          { name: 'R3', color: '#222' },
          { name: 'R4', color: '#333' }
        ],
        entries: []
      };

      // WHEN/THEN: validation should pass
      expect(() => validateConfig(config)).not.toThrow();
      expect(validateConfig(config)).toBe(true);
    });

    test('accepts 8 quadrants (maximum)', () => {
      // GIVEN: config with 8 quadrants
      const config = {
        quadrants: Array(8).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: []
      };

      // WHEN/THEN: validation should pass
      expect(() => validateConfig(config)).not.toThrow();
      expect(validateConfig(config)).toBe(true);
    });

    test('accepts 4 quadrants (standard)', () => {
      // GIVEN: config with 4 quadrants
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: []
      };

      // WHEN/THEN: validation should pass
      expect(() => validateConfig(config)).not.toThrow();
    });

    test('rejects 1 quadrant', () => {
      // GIVEN: config with 1 quadrant
      const config = {
        quadrants: [{ name: 'Q1' }],
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: []
      };

      // WHEN/THEN: validation should throw
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow(/quadrants must be between 2 and 8/);
    });

    test('rejects 9 quadrants', () => {
      // GIVEN: config with 9 quadrants
      const config = {
        quadrants: Array(9).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: []
      };

      // WHEN/THEN: validation should throw
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow(/quadrants must be between 2 and 8/);
    });

    test('rejects missing quadrants', () => {
      // GIVEN: config without quadrants
      const config = {
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: []
      };

      // WHEN/THEN: validation should throw
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow(/quadrants must be between 2 and 8/);
    });

    test('error includes field and value information', () => {
      // GIVEN: config with invalid quadrants
      const config = {
        quadrants: [{ name: 'Q1' }],
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' }))
      };

      // WHEN: catching validation error
      try {
        validateConfig(config);
        expect.fail('Should have thrown');
      } catch (error) {
        // THEN: error should have structured data
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect(error.field).toBe('quadrants');
        expect(error.value).toBe(1);
      }
    });
  });

  describe('ring validation', () => {
    test('accepts 4 rings (minimum)', () => {
      // GIVEN: config with 4 rings
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: []
      };

      // WHEN/THEN: validation should pass
      expect(() => validateConfig(config)).not.toThrow();
      expect(validateConfig(config)).toBe(true);
    });

    test('accepts 8 rings (maximum)', () => {
      // GIVEN: config with 8 rings
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(8).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: []
      };

      // WHEN/THEN: validation should pass
      expect(() => validateConfig(config)).not.toThrow();
      expect(validateConfig(config)).toBe(true);
    });

    test('rejects 3 rings', () => {
      // GIVEN: config with 3 rings
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(3).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: []
      };

      // WHEN/THEN: validation should throw
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow(/rings must be between 4 and 8/);
    });

    test('rejects 9 rings', () => {
      // GIVEN: config with 9 rings
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(9).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: []
      };

      // WHEN/THEN: validation should throw
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow(/rings must be between 4 and 8/);
    });

    test('rejects missing rings', () => {
      // GIVEN: config without rings
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        entries: []
      };

      // WHEN/THEN: validation should throw
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow(/rings must be between 4 and 8/);
    });
  });

  describe('entry validation', () => {
    test('accepts entries with valid quadrant and ring indices', () => {
      // GIVEN: config with valid entries
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: [
          { label: 'Tech A', quadrant: 0, ring: 0, moved: 0, active: true },
          { label: 'Tech B', quadrant: 3, ring: 3, moved: 0, active: true }
        ]
      };

      // WHEN/THEN: validation should pass
      expect(() => validateConfig(config)).not.toThrow();
    });

    test('rejects entry with negative quadrant index', () => {
      // GIVEN: config with entry having negative quadrant
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: [
          { label: 'Tech A', quadrant: -1, ring: 0, moved: 0, active: true }
        ]
      };

      // WHEN/THEN: validation should throw
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow(/Tech A.*invalid quadrant/);
    });

    test('rejects entry with quadrant index out of bounds', () => {
      // GIVEN: config with entry having quadrant >= length
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: [
          { label: 'Tech B', quadrant: 4, ring: 0, moved: 0, active: true }
        ]
      };

      // WHEN/THEN: validation should throw
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow(/Tech B.*invalid quadrant/);
    });

    test('rejects entry with negative ring index', () => {
      // GIVEN: config with entry having negative ring
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: [
          { label: 'Tech C', quadrant: 0, ring: -1, moved: 0, active: true }
        ]
      };

      // WHEN/THEN: validation should throw
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow(/Tech C.*invalid ring/);
    });

    test('rejects entry with ring index out of bounds', () => {
      // GIVEN: config with entry having ring >= length
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: [
          { label: 'Tech D', quadrant: 0, ring: 4, moved: 0, active: true }
        ]
      };

      // WHEN/THEN: validation should throw
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
      expect(() => validateConfig(config)).toThrow(/Tech D.*invalid ring/);
    });

    test('includes entry label in error message', () => {
      // GIVEN: config with invalid entry
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: [
          { label: 'MyTechnology', quadrant: 10, ring: 0, moved: 0, active: true }
        ]
      };

      // WHEN: catching validation error
      try {
        validateConfig(config);
        expect.fail('Should have thrown');
      } catch (error) {
        // THEN: error message should include entry label
        expect(error.message).toContain('MyTechnology');
      }
    });

    test('throws on first invalid entry', () => {
      // GIVEN: config with multiple invalid entries
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: [
          { label: 'First Bad', quadrant: 10, ring: 0, moved: 0, active: true },
          { label: 'Second Bad', quadrant: 0, ring: 10, moved: 0, active: true }
        ]
      };

      // WHEN: catching validation error
      try {
        validateConfig(config);
        expect.fail('Should have thrown');
      } catch (error) {
        // THEN: should only report first error
        expect(error.message).toContain('First Bad');
      }
    });

    test('accepts empty entries array', () => {
      // GIVEN: config with no entries
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
        entries: []
      };

      // WHEN/THEN: validation should pass
      expect(() => validateConfig(config)).not.toThrow();
    });

    test('accepts missing entries field', () => {
      // GIVEN: config without entries field
      const config = {
        quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
        rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' }))
      };

      // WHEN/THEN: validation should pass (entries are optional)
      expect(() => validateConfig(config)).not.toThrow();
    });
  });
});

describe('validateConfigAll()', () => {
  test('returns empty array for valid config', () => {
    // GIVEN: valid config
    const config = {
      quadrants: Array(4).fill(null).map((_, i) => ({ name: `Q${i}` })),
      rings: Array(4).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })),
      entries: []
    };

    // WHEN: validating
    const errors = validateConfigAll(config);

    // THEN: should return no errors
    expect(errors).toEqual([]);
  });

  test('returns all validation errors', () => {
    // GIVEN: config with multiple issues
    const config = {
      quadrants: [{ name: 'Q1' }], // Invalid: only 1
      rings: Array(3).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' })), // Invalid: only 3
      entries: [
        { label: 'Tech A', quadrant: 5, ring: 0, moved: 0, active: true }, // Invalid quadrant
        { label: 'Tech B', quadrant: 0, ring: 10, moved: 0, active: true } // Invalid ring
      ]
    };

    // WHEN: validating
    const errors = validateConfigAll(config);

    // THEN: should return all errors
    expect(errors.length).toBe(4);
    expect(errors[0].field).toBe('quadrants');
    expect(errors[1].field).toBe('rings');
    expect(errors[2].field).toContain('entries[0]');
    expect(errors[3].field).toContain('entries[1]');
  });

  test('all errors are ConfigValidationError instances', () => {
    // GIVEN: invalid config
    const config = {
      quadrants: [{ name: 'Q1' }],
      rings: Array(3).fill(null).map((_, i) => ({ name: `R${i}`, color: '#000' }))
    };

    // WHEN: validating
    const errors = validateConfigAll(config);

    // THEN: all errors should be proper instances
    errors.forEach(error => {
      expect(error).toBeInstanceOf(ConfigValidationError);
      expect(error.name).toBe('ConfigValidationError');
    });
  });
});
