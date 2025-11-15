/**
 * Bun test setup file for radar.js tests
 * This sets up the happy-dom environment and D3 library globally
 */

import { GlobalRegistrator } from '@happy-dom/global-registrator';
import * as d3 from 'd3';

// Register happy-dom globals (window, document, etc.)
GlobalRegistrator.register();

// Setup D3 globally (as radar.js expects it in browser environment)
global.d3 = d3;
globalThis.d3 = d3;
if (typeof window !== 'undefined') {
  window.d3 = d3;
}

// Add helper function to reset DOM between tests
global.resetDOM = () => {
  if (typeof document !== 'undefined' && document.body) {
    document.body.innerHTML = '<svg id="radar"></svg>';
  }
};

// Initialize DOM with radar svg element
if (typeof document !== 'undefined' && document.body) {
  document.body.innerHTML = '<svg id="radar"></svg>';
}
