/**
 * Storage Plugin
 * Provides persistent storage for radar configurations
 * Supports localStorage, sessionStorage, and custom implementations
 */

import { definePlugin } from './plugin-base.js';

/**
 * LocalStorage implementation
 */
class LocalStorageAdapter {
  constructor(key, options = {}) {
    this.key = key;
    this.version = options.version || 1;
    this.namespace = options.namespace || 'tech-radar';
    this.fullKey = `${this.namespace}:${this.key}`;
  }

  /**
   * Save configuration to localStorage
   * @param {Object} config - Configuration to save
   * @returns {Promise<void>}
   */
  async save(config) {
    try {
      const data = {
        version: this.version,
        timestamp: Date.now(),
        config,
      };
      localStorage.setItem(this.fullKey, JSON.stringify(data));
    } catch (error) {
      console.error('localStorage save error:', error);
      throw new Error('Failed to save to localStorage');
    }
  }

  /**
   * Load configuration from localStorage
   * @returns {Promise<Object|null>} Loaded configuration or null
   */
  async load() {
    try {
      const item = localStorage.getItem(this.fullKey);
      if (!item) return null;

      const data = JSON.parse(item);

      // Check version compatibility
      if (data.version !== this.version) {
        console.warn(`Storage version mismatch: expected ${this.version}, got ${data.version}`);
        // Could implement migration here
      }

      return data.config;
    } catch (error) {
      console.error('localStorage load error:', error);
      return null;
    }
  }

  /**
   * Clear stored configuration
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      localStorage.removeItem(this.fullKey);
    } catch (error) {
      console.error('localStorage clear error:', error);
    }
  }

  /**
   * Check if configuration exists
   * @returns {Promise<boolean>}
   */
  async exists() {
    return localStorage.getItem(this.fullKey) !== null;
  }
}

/**
 * SessionStorage implementation
 */
class SessionStorageAdapter {
  constructor(key, options = {}) {
    // Note: options reserved for future use (e.g., namespace)
    this.key = key;
    this.namespace = options.namespace || 'tech-radar';
    this.fullKey = `${this.namespace}:${this.key}`;
  }

  async save(config) {
    try {
      const data = {
        timestamp: Date.now(),
        config,
      };
      sessionStorage.setItem(this.fullKey, JSON.stringify(data));
    } catch (error) {
      console.error('sessionStorage save error:', error);
      throw new Error('Failed to save to sessionStorage');
    }
  }

  async load() {
    try {
      const item = sessionStorage.getItem(this.fullKey);
      if (!item) return null;
      const data = JSON.parse(item);
      return data.config;
    } catch (error) {
      console.error('sessionStorage load error:', error);
      return null;
    }
  }

  async clear() {
    try {
      sessionStorage.removeItem(this.fullKey);
    } catch (error) {
      console.error('sessionStorage clear error:', error);
    }
  }

  async exists() {
    return sessionStorage.getItem(this.fullKey) !== null;
  }
}

/**
 * IndexedDB implementation (for future large configs)
 */
class IndexedDBAdapter {
  constructor(key, options = {}) {
    this.key = key;
    this.dbName = options.dbName || 'tech-radar-db';
    this.storeName = options.storeName || 'configurations';
    this.version = options.version || 1;
  }

  async save(_config) {
    // Placeholder for IndexedDB implementation
    throw new Error('IndexedDB adapter not yet implemented');
  }

  async load() {
    throw new Error('IndexedDB adapter not yet implemented');
  }

  async clear() {
    throw new Error('IndexedDB adapter not yet implemented');
  }

  async exists() {
    return false;
  }
}

/**
 * Create storage adapter based on type
 * @param {string} type - Storage type ('localStorage', 'sessionStorage', 'indexedDB', 'custom')
 * @param {string} key - Storage key
 * @param {Object} options - Storage options
 * @returns {Object} Storage adapter
 */
function createStorageAdapter(type, key, options = {}) {
  switch (type) {
    case 'localStorage':
      return new LocalStorageAdapter(key, options);
    case 'sessionStorage':
      return new SessionStorageAdapter(key, options);
    case 'indexedDB':
      return new IndexedDBAdapter(key, options);
    case 'custom':
      // User provides their own save/load/clear functions
      if (!options.save || !options.load || !options.clear) {
        throw new Error('Custom storage requires save, load, and clear functions');
      }
      return {
        save: options.save,
        load: options.load,
        clear: options.clear,
        exists: options.exists || (() => Promise.resolve(false)),
      };
    default:
      throw new Error(`Unknown storage type: ${type}`);
  }
}

/**
 * Storage Plugin Definition
 */
export const storagePlugin = definePlugin({
  name: 'storage',
  defaults: {
    type: 'localStorage',
    key: 'default',
    autoLoad: false,
    autoSave: false,
    namespace: 'tech-radar',
    version: 1,
  },
  init: (config, context) => {
    const { type, key, autoLoad, autoSave, ...options } = config;
    const { getCurrentConfig, onConfigChange } = context;

    // Create storage adapter
    const storage = createStorageAdapter(type, key, options);

    // Auto-load on initialization
    let loadPromise = null;
    if (autoLoad) {
      loadPromise = storage.load().then(loadedConfig => {
        if (loadedConfig && context.applyConfig) {
          context.applyConfig(loadedConfig);
        }
        return loadedConfig;
      });
    }

    // Auto-save on config changes
    let unsubscribe = null;
    if (autoSave && onConfigChange) {
      unsubscribe = onConfigChange(config => {
        storage.save(config).catch(error => {
          console.error('Auto-save failed:', error);
        });
      });
    }

    // Return plugin API
    return {
      storage,

      /**
       * Manually save current configuration
       * @returns {Promise<void>}
       */
      save: async () => {
        const config = getCurrentConfig ? getCurrentConfig() : null;
        if (!config) {
          throw new Error('No configuration to save');
        }
        return storage.save(config);
      },

      /**
       * Manually load configuration
       * @returns {Promise<Object|null>}
       */
      load: async () => {
        return storage.load();
      },

      /**
       * Clear stored configuration
       * @returns {Promise<void>}
       */
      clear: async () => {
        return storage.clear();
      },

      /**
       * Check if configuration exists in storage
       * @returns {Promise<boolean>}
       */
      exists: async () => {
        return storage.exists();
      },

      /**
       * Cleanup function
       */
      cleanup: () => {
        if (unsubscribe) {
          unsubscribe();
        }
      },

      // Expose initialization promise for auto-load
      _loadPromise: loadPromise,
    };
  },
});
