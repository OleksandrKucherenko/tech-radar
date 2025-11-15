/**
 * Plugins Module
 * Exports all available plugins and plugin infrastructure
 */

export { registerPlugin, getPlugin, hasPlugin, initializePlugins, definePlugin } from './plugin-base.js';

export { storagePlugin } from './storage-plugin.js';
export { importExportPlugin } from './import-export-plugin.js';
export { toolbarPlugin } from './toolbar-plugin.js';

// Register built-in plugins
import { registerPlugin } from './plugin-base.js';
import { storagePlugin } from './storage-plugin.js';
import { importExportPlugin } from './import-export-plugin.js';
import { toolbarPlugin } from './toolbar-plugin.js';

registerPlugin('storage', storagePlugin);
registerPlugin('importExport', importExportPlugin);
registerPlugin('toolbar', toolbarPlugin);
