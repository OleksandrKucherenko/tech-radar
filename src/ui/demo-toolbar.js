/**
 * Demo Toolbar Helper
 * Provides reusable toolbar initialization for JSON import/export functionality
 */

/**
 * Initialize the demo toolbar for JSON import/export
 * Returns a toolbar instance with configurable properties
 * Automatically wires to radar instance methods if provided
 * @param {Object|null} radarInstance - Radar instance to wire to (optional, for auto-wiring)
 * @param {Object} options - Configuration options
 * @param {string} options.demoSlug - Unique identifier for the demo (used in filename)
 * @returns {Object} Toolbar instance with configurable properties
 */
export function initDemoToolbar(radarInstance = null, options = {}) {
  const { demoSlug = 'tech-radar' } = options;
  // Get jsonIO from global radar_visualization or from instance
  const jsonIO =
    (typeof radar_visualization !== 'undefined' && radar_visualization.jsonIO) || radarInstance?.importExport;

  if (!jsonIO || !jsonIO.importConfig || !jsonIO.exportConfig) {
    console.warn('JSON I/O helpers not available. Toolbar will not be initialized.');
    showToolbarMessage('JSON helpers unavailable.', 'error');
    return {
      onConfigImport: null,
      onConfigReset: null,
      getCurrentConfig: null,
      cleanup: () => {},
      showMessage: () => {},
    };
  }

  const { importConfig, exportConfig, mergeConfigs } = jsonIO;

  // Get toolbar elements
  const importButton = document.getElementById('jsonImportButton');
  const exportButton = document.getElementById('jsonExportButton');
  const resetButton = document.getElementById('jsonResetButton');
  const importInput = document.getElementById('jsonImportInput');

  if (!importButton || !exportButton || !importInput) {
    console.warn('Toolbar elements not found in DOM');
    return {
      onConfigImport: null,
      onConfigReset: null,
      getCurrentConfig: null,
      cleanup: () => {},
      showMessage: () => {},
    };
  }

  // Toolbar instance with configurable properties
  const toolbarInstance = {
    /**
     * Callback when config is imported
     * Default: calls radarInstance.render(config) if instance provided
     * Override to customize behavior
     * @type {Function|null}
     */
    onConfigImport: radarInstance ? config => radarInstance.render(config) : null,

    /**
     * Callback when reset is triggered
     * Default: calls radarInstance.reset() if instance provided
     * Override to customize behavior
     * @type {Function|null}
     */
    onConfigReset: radarInstance ? () => radarInstance.reset() : null,

    /**
     * Function to get current configuration
     * Default: calls radarInstance.getConfig() if instance provided
     * Override to customize behavior
     * @type {Function|null}
     */
    getCurrentConfig: radarInstance ? () => radarInstance.getConfig() : null,

    /**
     * Show message in toolbar
     * @param {string} message - Message to display
     * @param {string} state - 'info', 'success', or 'error'
     */
    showMessage(message, state = 'info') {
      showToolbarMessage(message, state);
    },

    /**
     * Cleanup function - call when destroying toolbar
     */
    cleanup: null, // Will be set below
  };

  // Setup import button click handler
  const handleImportClick = () => importInput.click();
  importButton.addEventListener('click', handleImportClick);

  // Setup import config handler with merge support
  const disposeImport = importConfig(
    importInput,
    importedConfig => {
      if (toolbarInstance.onConfigImport) {
        // Merge imported config with current config if mergeConfigs is available
        const currentConfig = toolbarInstance.getCurrentConfig ? toolbarInstance.getCurrentConfig() : null;
        const configToApply =
          mergeConfigs && currentConfig ? mergeConfigs(currentConfig, importedConfig) : importedConfig;
        toolbarInstance.onConfigImport(configToApply);
      }
    },
    {
      demoSlug,
      onSuccess: ({ fileName }) => {
        showToolbarMessage(`Imported ${fileName || 'configuration'} successfully`, 'success');
      },
      onError: message => {
        showToolbarMessage(message, 'error');
      },
    }
  );

  // Setup export config handler
  const disposeExport = exportConfig(
    exportButton,
    () => (toolbarInstance.getCurrentConfig ? toolbarInstance.getCurrentConfig() : {}),
    {
      demoSlug,
      onSuccess: ({ fileName }) => {
        showToolbarMessage(`Exported ${fileName}`, 'success');
      },
      onError: message => {
        showToolbarMessage(message, 'error');
      },
    }
  );

  // Setup reset button handler
  let handleResetClick = null;
  if (resetButton) {
    handleResetClick = () => {
      if (toolbarInstance.onConfigReset) {
        if (confirm('Reset to initial configuration? This will discard all changes.')) {
          toolbarInstance.onConfigReset();
          showToolbarMessage('Configuration reset to initial state', 'success');
        }
      }
    };
    resetButton.addEventListener('click', handleResetClick);
  }

  // Set cleanup function
  toolbarInstance.cleanup = () => {
    importButton.removeEventListener('click', handleImportClick);
    if (handleResetClick && resetButton) {
      resetButton.removeEventListener('click', handleResetClick);
    }
    if (disposeImport) disposeImport();
    if (disposeExport) disposeExport();
  };

  return toolbarInstance;
}

/**
 * Show a message in the toolbar message area
 * @param {string} message - Message to display
 * @param {string} state - State: 'info', 'success', or 'error'
 */
function showToolbarMessage(message, state = 'info') {
  const messageEl = document.getElementById('jsonToolbarMessage');
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.dataset.state = state;
    if (state !== 'error') {
      setTimeout(() => {
        messageEl.textContent = '';
        delete messageEl.dataset.state;
      }, 3000);
    }
  }
}

/**
 * Get the standard toolbar HTML markup with Font Awesome icons
 * @returns {string} HTML string for the floating toolbar
 */
export function getToolbarHTML() {
  return `
    <div class="demo-toolbar" role="region" aria-label="JSON configuration tools" style="position: relative;">
      <div class="demo-toolbar__controls">
        <button type="button" class="demo-toolbar__button demo-toolbar__button--icon" id="jsonImportButton" title="Import JSON Configuration" aria-label="Import JSON">
          <i class="fas fa-file-import"></i>
        </button>
        <button type="button" class="demo-toolbar__button demo-toolbar__button--icon" id="jsonExportButton" title="Export JSON Configuration" aria-label="Export JSON">
          <i class="fas fa-file-export"></i>
        </button>
        <button type="button" class="demo-toolbar__button demo-toolbar__button--icon" id="jsonResetButton" title="Reset to Initial Configuration" aria-label="Reset Configuration">
          <i class="fas fa-undo"></i>
        </button>
        <input type="file" id="jsonImportInput" accept="application/json,.json" hidden />
      </div>
      <p class="demo-toolbar__message" id="jsonToolbarMessage" role="status" aria-live="polite"></p>
    </div>
  `.trim();
}
