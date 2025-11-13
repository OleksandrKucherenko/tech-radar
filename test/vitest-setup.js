/**
 * Vitest setup file for radar.js tests
 * This sets up the D3 library globally for radar.js
 * DOM environment is provided by Vitest's jsdom environment
 */

import * as d3 from 'd3';

// Setup D3 globally (as radar.js expects it in browser environment)
global.d3 = d3;
window.d3 = d3;

// Add helper function to reset DOM between tests
global.resetDOM = () => {
  document.body.innerHTML = '<svg id="radar"></svg>';
};