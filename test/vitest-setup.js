/**
 * Vitest setup file for radar.js tests
 * This sets up the DOM environment and loads radar.js
 */

import { JSDOM } from 'jsdom';
import * as d3 from 'd3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body><svg id="radar"></svg></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

// Make DOM globals available globally
global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.NodeList = dom.window.NodeList;
global.HTMLCollection = dom.window.HTMLCollection;

// Setup D3 globally (as the radar.js expects it)
global.d3 = d3;

// Load radar.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const radarCode = fs.readFileSync(path.join(__dirname, '../docs/radar.js'), 'utf-8');

// Execute radar.js in global scope to make radar_visualization available
(0, eval)(radarCode);

// Make the radar_visualization function globally available for tests
global.radar_visualization = globalThis.radar_visualization;

// Add helper function to reset DOM between tests
global.resetDOM = () => {
  document.body.innerHTML = '<svg id="radar"></svg>';
};