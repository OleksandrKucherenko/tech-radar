/**
 * Toolbar Plugin
 * Provides UI toolbar for radar interactions
 * Supports floating, inline, and custom rendering
 */

import { definePlugin } from './plugin-base.js';

/**
 * Show a message in the toolbar
 * @param {HTMLElement} messageEl - Message element
 * @param {string} message - Message to display
 * @param {string} state - State: 'info', 'success', or 'error'
 */
function showToolbarMessage(messageEl, message, state = 'info') {
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.dataset.state = state;

  if (state !== 'error') {
    setTimeout(() => {
      messageEl.textContent = '';
      delete messageEl.dataset.state;
    }, 3000);
  }
}

/**
 * Default floating toolbar HTML with Font Awesome icons
 * @returns {string} HTML markup
 */
function getDefaultToolbarHTML() {
  return `
    <div class="demo-toolbar" role="region" aria-label="JSON configuration tools">
      <div class="demo-toolbar__controls">
        <button type="button" class="demo-toolbar__button demo-toolbar__button--icon" id="jsonImportButton" title="Import JSON Configuration" aria-label="Import JSON">
          <i class="fas fa-file-import"></i>
        </button>
        <button type="button" class="demo-toolbar__button demo-toolbar__button--icon" id="jsonExportButton" title="Export JSON Configuration" aria-label="Export JSON">
          <i class="fas fa-file-export"></i>
        </button>
        <input type="file" id="jsonImportInput" accept="application/json,.json" hidden />
      </div>
      <p class="demo-toolbar__message" id="jsonToolbarMessage" role="status" aria-live="polite"></p>
    </div>
  `.trim();
}

/**
 * Toolbar Plugin Definition
 */
export const toolbarPlugin = definePlugin({
  name: 'toolbar',
  defaults: {
    enabled: true,
    position: 'top-right',
    buttons: ['import', 'export'],
    containerId: null,
    autoRender: true,
  },
  init: (config, context) => {
    const { enabled, containerId, autoRender, buttons } = config;
    const { importExportPlugin, getCurrentConfig, onConfigImport, demoSlug } = context;

    if (!enabled) {
      return { cleanup: () => {} };
    }

    let toolbarContainer = null;
    let cleanupFunctions = [];

    /**
     * Render the toolbar
     * @param {HTMLElement} container - Container element (optional)
     */
    const render = (container = null) => {
      // Find or create container
      if (container) {
        toolbarContainer = container;
      } else if (containerId) {
        toolbarContainer = document.getElementById(containerId);
      } else {
        // Find existing toolbar or create one
        toolbarContainer = document.querySelector('.demo-toolbar');
        if (!toolbarContainer) {
          // Insert after nav element
          const nav = document.querySelector('nav.demo-links');
          if (nav) {
            toolbarContainer = document.createElement('div');
            nav.insertAdjacentElement('afterend', toolbarContainer);
          }
        }
      }

      if (!toolbarContainer) {
        console.warn('Toolbar container not found');
        return;
      }

      // Check if toolbar already has content
      if (!toolbarContainer.querySelector('.demo-toolbar__controls')) {
        toolbarContainer.innerHTML = getDefaultToolbarHTML();
      }

      // Get toolbar elements
      const importButton = document.getElementById('jsonImportButton');
      const exportButton = document.getElementById('jsonExportButton');
      const importInput = document.getElementById('jsonImportInput');
      const messageEl = document.getElementById('jsonToolbarMessage');

      if (!importButton || !exportButton || !importInput) {
        console.warn('Toolbar elements not found');
        return;
      }

      // Filter buttons based on config
      if (!buttons.includes('import')) {
        importButton.style.display = 'none';
      }
      if (!buttons.includes('export')) {
        exportButton.style.display = 'none';
      }

      // Setup import/export functionality
      if (importExportPlugin) {
        const { setupImport, setupExport } = importExportPlugin;

        // Setup import
        const handleImportClick = () => importInput.click();
        importButton.addEventListener('click', handleImportClick);

        const disposeImport = setupImport(
          importInput,
          importedConfig => {
            if (onConfigImport) {
              onConfigImport(importedConfig);
            }
          },
          {
            demoSlug,
            onSuccess: ({ fileName }) => {
              showToolbarMessage(messageEl, `Imported ${fileName || 'configuration'} successfully`, 'success');
            },
            onError: message => {
              showToolbarMessage(messageEl, message, 'error');
            },
          }
        );

        // Setup export
        const disposeExport = setupExport(exportButton, getCurrentConfig, {
          demoSlug,
          onSuccess: ({ fileName }) => {
            showToolbarMessage(messageEl, `Exported ${fileName}`, 'success');
          },
          onError: message => {
            showToolbarMessage(messageEl, message, 'error');
          },
        });

        // Collect cleanup functions
        cleanupFunctions.push(
          () => importButton.removeEventListener('click', handleImportClick),
          disposeImport,
          disposeExport
        );
      } else {
        console.warn('Import/Export plugin not available for toolbar');
      }
    };

    // Auto-render if enabled
    if (autoRender) {
      // Defer rendering until DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => render());
      } else {
        render();
      }
    }

    // Return plugin API
    return {
      /**
       * Manually render the toolbar
       * @param {HTMLElement} container - Optional container element
       */
      render,

      /**
       * Show a message in the toolbar
       * @param {string} message - Message to display
       * @param {string} state - State: 'info', 'success', or 'error'
       */
      showMessage: (message, state = 'info') => {
        const messageEl = document.getElementById('jsonToolbarMessage');
        showToolbarMessage(messageEl, message, state);
      },

      /**
       * Get toolbar container element
       * @returns {HTMLElement|null}
       */
      getContainer: () => toolbarContainer,

      /**
       * Cleanup function
       */
      cleanup: () => {
        cleanupFunctions.forEach(fn => {
          if (typeof fn === 'function') {
            try {
              fn();
            } catch (error) {
              console.error('Toolbar cleanup error:', error);
            }
          }
        });
        cleanupFunctions = [];
      },
    };
  },
});
