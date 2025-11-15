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

/**
 * Custom error class for configuration validation errors.
 * Provides structured error information for debugging.
 */
export class ConfigValidationError extends Error {
  /**
   * Creates a new ConfigValidationError.
   * @param {string} message - The error message
   * @param {string} field - The field that failed validation
   * @param {*} value - The invalid value
   */
  constructor(message, field, value) {
    super(message);
    this.name = 'ConfigValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Validates the radar visualization configuration.
 * Throws ConfigValidationError if validation fails.
 *
 * @param {Object} config - The configuration to validate
 * @throws {ConfigValidationError} If validation fails
 * @returns {boolean} True if validation passes
 */
export function validateConfig(config) {
  const errors = [];

  // Validate quadrants
  if (!config.quadrants || config.quadrants.length < 2 || config.quadrants.length > 8) {
    errors.push(
      new ConfigValidationError(
        `Number of quadrants must be between 2 and 8 (found: ${config.quadrants?.length || 0})`,
        'quadrants',
        config.quadrants?.length
      )
    );
  }

  // Validate rings
  if (!config.rings || config.rings.length < 4 || config.rings.length > 8) {
    errors.push(
      new ConfigValidationError(
        `Number of rings must be between 4 and 8 (found: ${config.rings?.length || 0})`,
        'rings',
        config.rings?.length
      )
    );
  }

  // Validate entries if they exist
  if (config.entries && config.quadrants && config.rings) {
    config.entries.forEach((entry, index) => {
      // Validate quadrant index
      if (entry.quadrant < 0 || entry.quadrant >= config.quadrants.length) {
        errors.push(
          new ConfigValidationError(
            `Entry '${entry.label}' has invalid quadrant: ${entry.quadrant} (must be 0-${config.quadrants.length - 1})`,
            `entries[${index}].quadrant`,
            entry.quadrant
          )
        );
      }

      // Validate ring index
      if (entry.ring < 0 || entry.ring >= config.rings.length) {
        errors.push(
          new ConfigValidationError(
            `Entry '${entry.label}' has invalid ring: ${entry.ring} (must be 0-${config.rings.length - 1})`,
            `entries[${index}].ring`,
            entry.ring
          )
        );
      }
    });
  }

  // Throw first error for backward compatibility with original implementation
  if (errors.length > 0) {
    throw errors[0];
  }

  return true;
}

/**
 * Validates the configuration and returns all errors instead of throwing.
 * Useful for collecting all validation issues at once.
 *
 * @param {Object} config - The configuration to validate
 * @returns {Array<ConfigValidationError>} Array of validation errors (empty if valid)
 */
export function validateConfigAll(config) {
  const errors = [];

  // Validate quadrants
  if (!config.quadrants || config.quadrants.length < 2 || config.quadrants.length > 8) {
    errors.push(
      new ConfigValidationError(
        `Number of quadrants must be between 2 and 8 (found: ${config.quadrants?.length || 0})`,
        'quadrants',
        config.quadrants?.length
      )
    );
  }

  // Validate rings
  if (!config.rings || config.rings.length < 4 || config.rings.length > 8) {
    errors.push(
      new ConfigValidationError(
        `Number of rings must be between 4 and 8 (found: ${config.rings?.length || 0})`,
        'rings',
        config.rings?.length
      )
    );
  }

  // Validate entries if they exist
  if (config.entries && config.quadrants && config.rings) {
    config.entries.forEach((entry, index) => {
      // Validate quadrant index
      if (entry.quadrant < 0 || entry.quadrant >= config.quadrants.length) {
        errors.push(
          new ConfigValidationError(
            `Entry '${entry.label}' has invalid quadrant: ${entry.quadrant} (must be 0-${config.quadrants.length - 1})`,
            `entries[${index}].quadrant`,
            entry.quadrant
          )
        );
      }

      // Validate ring index
      if (entry.ring < 0 || entry.ring >= config.rings.length) {
        errors.push(
          new ConfigValidationError(
            `Entry '${entry.label}' has invalid ring: ${entry.ring} (must be 0-${config.rings.length - 1})`,
            `entries[${index}].ring`,
            entry.ring
          )
        );
      }
    });
  }

  return errors;
}
