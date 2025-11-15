/**
 * Base Plugin System
 * Provides infrastructure for optional features
 */

/**
 * Plugin registry to track registered plugins
 */
const pluginRegistry = new Map();

/**
 * Register a plugin
 * @param {string} name - Plugin name
 * @param {Object} plugin - Plugin instance
 */
export function registerPlugin(name, plugin) {
  pluginRegistry.set(name, plugin);
}

/**
 * Get a registered plugin
 * @param {string} name - Plugin name
 * @returns {Object|null} Plugin instance or null
 */
export function getPlugin(name) {
  return pluginRegistry.get(name) || null;
}

/**
 * Check if a plugin is registered
 * @param {string} name - Plugin name
 * @returns {boolean}
 */
export function hasPlugin(name) {
  return pluginRegistry.has(name);
}

/**
 * Initialize plugins from configuration
 * @param {Object} pluginConfig - Plugin configuration object
 * @param {Object} context - Context object with radar state and helpers
 * @returns {Object} Initialized plugins with cleanup functions
 */
export function initializePlugins(pluginConfig = {}, context = {}) {
  const initialized = {};
  const cleanupFunctions = [];

  // Process each plugin configuration
  for (const [pluginName, config] of Object.entries(pluginConfig)) {
    if (!config || config.enabled === false) {
      continue; // Skip disabled plugins
    }

    const plugin = getPlugin(pluginName);
    if (!plugin) {
      console.warn(`Plugin "${pluginName}" not registered, skipping...`);
      continue;
    }

    try {
      // Initialize plugin with config and context
      const instance = plugin.init(config, context);
      initialized[pluginName] = instance;

      // Collect cleanup function if provided
      if (instance && typeof instance.cleanup === 'function') {
        cleanupFunctions.push(instance.cleanup);
      }
    } catch (error) {
      console.error(`Failed to initialize plugin "${pluginName}":`, error);
    }
  }

  // Return initialized plugins with global cleanup function
  return {
    plugins: initialized,
    cleanup: () => {
      cleanupFunctions.forEach(fn => {
        try {
          fn();
        } catch (error) {
          console.error('Plugin cleanup error:', error);
        }
      });
    },
  };
}

/**
 * Create a plugin definition
 * @param {Object} definition - Plugin definition
 * @param {string} definition.name - Plugin name
 * @param {Function} definition.init - Initialization function
 * @param {Object} [definition.defaults] - Default configuration
 * @returns {Object} Plugin definition
 */
export function definePlugin({ name, init, defaults = {} }) {
  return {
    name,
    defaults,
    init: (config, context) => {
      const mergedConfig = { ...defaults, ...config };
      return init(mergedConfig, context);
    },
  };
}
