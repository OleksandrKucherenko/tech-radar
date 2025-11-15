const defaultOptions = {
  demoSlug: 'tech-radar',
  onError: message => {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message);
    } else {
      console.error(message);
    }
  },
  onSuccess: () => {},
  sanitizeData: true,
  mergeOnImport: true,
};

const readerErrorMessages = {
  read: 'Failed to read the selected file. Please try again.',
  parse: 'The selected file is not valid JSON. Please choose a valid radar configuration.',
};

function mergeOptions(custom = {}) {
  const merged = {
    ...defaultOptions,
    ...custom,
  };

  merged.onError = typeof custom.onError === 'function' ? custom.onError : defaultOptions.onError;
  merged.onSuccess = typeof custom.onSuccess === 'function' ? custom.onSuccess : defaultOptions.onSuccess;

  return merged;
}

function formatTimestamp(date = new Date()) {
  const pad = value => value.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  return `${year}${pad(month)}${pad(day)}-${pad(hours)}${pad(minutes)}${pad(seconds)}`;
}

function buildDownloadLink(json, fileName) {
  const blob = new Blob([json], { type: 'application/json' });
  const linkCreator = typeof window !== 'undefined' && window.URL ? window.URL : URL;
  const url = linkCreator.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = url;
  return { link, url };
}

function handleError(message, options) {
  options.onError(message);
}

/**
 * Sanitizes configuration data by removing rendering properties from entries.
 * Only keeps the essential data properties: label, quadrant, ring, moved, active, link.
 * @param {Object} config - Configuration object to sanitize
 * @returns {Object} Sanitized configuration
 */
function sanitizeConfigForExport(config) {
  if (!config) return config;

  const sanitized = { ...config };

  // Sanitize entries - remove rendering properties
  if (Array.isArray(config.entries)) {
    sanitized.entries = config.entries.map(entry => {
      const clean = {
        label: entry.label,
        quadrant: entry.quadrant,
        ring: entry.ring,
        moved: entry.moved,
        active: entry.active,
      };

      // Include link only if it exists
      if (entry.link) {
        clean.link = entry.link;
      }

      return clean;
    });
  }

  // Remove any plugin instances or internal state using destructuring
  const { _pluginInstances, _internalState, ...cleanConfig } = sanitized;
  return cleanConfig;
}

/**
 * Merges imported configuration with base configuration.
 * Preserves base config structure but uses imported entries and key properties.
 * @param {Object} baseConfig - Base configuration to merge into
 * @param {Object} importedConfig - Imported configuration
 * @returns {Object} Merged configuration
 */
function mergeConfigs(baseConfig, importedConfig) {
  if (!baseConfig) return importedConfig;
  if (!importedConfig) return baseConfig;

  const merged = { ...baseConfig };

  // Always use imported entries if provided
  if (importedConfig.entries) {
    merged.entries = importedConfig.entries;
  }

  // Merge key properties from imported config
  const mergeableProps = ['title', 'date', 'quadrants', 'rings', 'print_layout', 'links_in_new_tabs'];
  mergeableProps.forEach(prop => {
    if (importedConfig[prop] !== undefined) {
      merged[prop] = importedConfig[prop];
    }
  });

  return merged;
}

function exportConfig(button, currentConfigProvider, options = {}) {
  if (!button) {
    throw new Error('exportConfig requires a button element');
  }
  if (typeof currentConfigProvider !== 'function') {
    throw new Error('exportConfig requires a config provider function');
  }

  const merged = mergeOptions(options);
  const demoSlug = merged.demoSlug || defaultOptions.demoSlug;

  const handleClick = async () => {
    try {
      const config = await currentConfigProvider();
      if (!config) {
        throw new Error('No radar configuration is available to export.');
      }

      // Sanitize config if enabled (default: true)
      const configToExport = merged.sanitizeData ? sanitizeConfigForExport(config) : config;

      const json = JSON.stringify(configToExport, null, 2);
      const timestamp = formatTimestamp();
      const fileName = `${demoSlug}-${timestamp}.json`;
      const { link, url } = buildDownloadLink(json, fileName);
      link.click();
      const revoker = typeof window !== 'undefined' && window.URL ? window.URL : URL;
      revoker.revokeObjectURL(url);
      merged.onSuccess({ fileName });
    } catch (error) {
      handleError(error.message || 'Unable to export JSON.', merged);
    }
  };

  button.addEventListener('click', handleClick);
  return () => button.removeEventListener('click', handleClick);
}

function importConfig(fileInput, applyConfig, options = {}) {
  if (!fileInput) {
    throw new Error('importConfig requires a file input element');
  }

  if (typeof applyConfig !== 'function') {
    throw new Error('importConfig requires an applyConfig callback');
  }

  const merged = mergeOptions(options);

  const handleChange = event => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async loadEvent => {
      let parsed;
      try {
        parsed = JSON.parse(loadEvent.target.result);
      } catch (_parseError) {
        handleError(readerErrorMessages.parse, merged);
        fileInput.value = '';
        return;
      }

      try {
        await applyConfig(parsed);
        merged.onSuccess({ fileName: file.name });
      } catch (error) {
        handleError(error.message || 'Unable to import configuration.', merged);
      } finally {
        fileInput.value = '';
      }
    };
    reader.onerror = () => {
      handleError(readerErrorMessages.read, merged);
      fileInput.value = '';
    };

    reader.readAsText(file);
  };

  fileInput.addEventListener('change', handleChange);
  return () => fileInput.removeEventListener('change', handleChange);
}

export function createJsonIOHelpers() {
  return {
    exportConfig,
    importConfig,
    sanitizeConfigForExport,
    mergeConfigs,
  };
}
