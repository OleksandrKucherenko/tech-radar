/**
 * Import/Export Plugin
 * Provides configuration import/export functionality
 * Supports JSON format (extensible to CSV, YAML, etc.)
 */

import { createJsonIOHelpers } from '../integration/json-io.js';
import { definePlugin } from './plugin-base.js';

/**
 * Import/Export Plugin Definition
 */
export const importExportPlugin = definePlugin({
  name: 'importExport',
  defaults: {
    enabled: true,
    formats: ['json'],
    fileNamePattern: '{slug}-{timestamp}',
    pretty: true,
  },
  init: (config, context) => {
    const { formats: _formats, fileNamePattern, pretty } = config;
    const { getCurrentConfig, onConfigChange: _onConfigChange, demoSlug } = context;

    // Create JSON I/O helpers (existing implementation)
    const jsonIO = createJsonIOHelpers();

    // Track import/export operations
    const operations = {
      imports: 0,
      exports: 0,
      lastImport: null,
      lastExport: null,
    };

    /**
     * Generate filename based on pattern
     * @param {string} operation - 'import' or 'export'
     * @returns {string} Generated filename
     */
    const generateFileName = operation => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const slug = demoSlug || 'radar-config';

      return fileNamePattern
        .replace('{slug}', slug)
        .replace('{timestamp}', timestamp)
        .replace('{operation}', operation);
    };

    /**
     * Export configuration to JSON
     * @param {Object} options - Export options
     * @returns {Promise<{fileName: string, blob: Blob}>}
     */
    const exportJSON = async (options = {}) => {
      const configToExport = options.config || getCurrentConfig?.();
      if (!configToExport) {
        throw new Error('No configuration to export');
      }

      const fileName = options.fileName || `${generateFileName('export')}.json`;
      const jsonString = pretty ? JSON.stringify(configToExport, null, 2) : JSON.stringify(configToExport);

      const blob = new Blob([jsonString], { type: 'application/json' });

      // Update stats
      operations.exports++;
      operations.lastExport = {
        timestamp: Date.now(),
        fileName,
        size: blob.size,
      };

      return { fileName, blob };
    };

    /**
     * Import configuration from JSON
     * @param {File|Blob|string} source - Source data
     * @returns {Promise<Object>} Imported configuration
     */
    const importJSON = async source => {
      let data;

      if (source instanceof File || source instanceof Blob) {
        const text = await source.text();
        data = JSON.parse(text);
      } else if (typeof source === 'string') {
        data = JSON.parse(source);
      } else {
        throw new Error('Invalid import source');
      }

      // Update stats
      operations.imports++;
      operations.lastImport = {
        timestamp: Date.now(),
        fileName: source.name || 'unknown',
      };

      return data;
    };

    /**
     * Setup export for a button element
     * @param {HTMLElement} button - Export button element
     * @param {Function} getConfig - Function to get current config
     * @param {Object} options - Export options
     * @returns {Function} Cleanup function
     */
    const setupExport = (button, getConfig, options = {}) => {
      return jsonIO.exportConfig(button, getConfig, {
        ...options,
        demoSlug: demoSlug || options.demoSlug,
      });
    };

    /**
     * Setup import for an input element
     * @param {HTMLInputElement} input - File input element
     * @param {Function} onImport - Callback when config is imported
     * @param {Object} options - Import options
     * @returns {Function} Cleanup function
     */
    const setupImport = (input, onImport, options = {}) => {
      return jsonIO.importConfig(input, onImport, {
        ...options,
        demoSlug: demoSlug || options.demoSlug,
      });
    };

    // Return plugin API
    return {
      jsonIO, // Expose original jsonIO for backward compatibility

      /**
       * Export current configuration
       * @param {Object} options - Export options
       * @returns {Promise<{fileName: string, blob: Blob}>}
       */
      export: exportJSON,

      /**
       * Import configuration
       * @param {File|Blob|string} source - Source data
       * @returns {Promise<Object>} Imported configuration
       */
      import: importJSON,

      /**
       * Setup export button
       */
      setupExport,

      /**
       * Setup import input
       */
      setupImport,

      /**
       * Get import/export statistics
       * @returns {Object} Statistics
       */
      getStats: () => ({ ...operations }),

      /**
       * Cleanup function
       */
      cleanup: () => {
        // No cleanup needed for now
      },
    };
  },
});
