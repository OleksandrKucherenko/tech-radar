/**
 * Demo Toolbar Helper
 * Provides reusable toolbar initialization for JSON import/export functionality
 */

/**
 * Initialize the demo toolbar for JSON import/export
 * @param {Object} options - Configuration options
 * @param {string} options.demoSlug - Unique identifier for the demo (used in filename)
 * @param {Function} options.getCurrentConfig - Function that returns current configuration
 * @param {Function} options.onConfigImport - Callback when config is imported
 * @param {Object} options.jsonIO - JSON I/O helpers (importConfig, exportConfig)
 * @returns {Function} Cleanup function
 */
export function initDemoToolbar(options) {
  const { demoSlug, getCurrentConfig, onConfigImport, jsonIO } = options;

  if (!jsonIO || !jsonIO.importConfig || !jsonIO.exportConfig) {
    console.warn('JSON I/O helpers not available. Toolbar will not be initialized.');
    showToolbarMessage('JSON helpers unavailable.', 'error');
    return () => {};
  }

  const { importConfig, exportConfig } = jsonIO;

  // Get toolbar elements
  const importButton = document.getElementById('jsonImportButton');
  const exportButton = document.getElementById('jsonExportButton');
  const importInput = document.getElementById('jsonImportInput');

  if (!importButton || !exportButton || !importInput) {
    console.warn('Toolbar elements not found in DOM');
    return () => {};
  }

  // Setup import button click handler
  const handleImportClick = () => importInput.click();
  importButton.addEventListener('click', handleImportClick);

  // Setup import config handler
  const disposeImport = importConfig(
    importInput,
    config => {
      if (onConfigImport) {
        onConfigImport(config);
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
  const disposeExport = exportConfig(exportButton, getCurrentConfig, {
    demoSlug,
    onSuccess: ({ fileName }) => {
      showToolbarMessage(`Exported ${fileName}`, 'success');
    },
    onError: message => {
      showToolbarMessage(message, 'error');
    },
  });

  // Return cleanup function
  return () => {
    importButton.removeEventListener('click', handleImportClick);
    if (disposeImport) disposeImport();
    if (disposeExport) disposeExport();
  };
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
 * Get the standard toolbar HTML markup
 * @returns {string} HTML string for the toolbar
 */
export function getToolbarHTML() {
  return `
    <div class="demo-toolbar" role="region" aria-label="JSON configuration tools">
      <div class="demo-toolbar__controls">
        <button type="button" class="demo-toolbar__button" id="jsonImportButton">Import JSON</button>
        <button type="button" class="demo-toolbar__button" id="jsonExportButton">Export JSON</button>
        <input type="file" id="jsonImportInput" accept="application/json,.json" hidden />
      </div>
      <p class="demo-toolbar__message" id="jsonToolbarMessage" role="status" aria-live="polite"></p>
    </div>
  `.trim();
}
