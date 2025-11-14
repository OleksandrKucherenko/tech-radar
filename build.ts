// Build script to bundle and minify radar.js using Bun + terser
// Phase 1 Refactoring: Now bundles ES6 modules from src/ into browser-compatible output
// Usage: bun run build.ts
// Can override version via RELEASE_VERSION environment variable
import { $ } from 'bun';
import { readFileSync, writeFileSync } from 'fs';

const version = process.env.RELEASE_VERSION || '0.14'; // Update this when creating new releases

async function buildRadar() {
  console.log(`Building radar.js version ${version}...`);
  console.log('Phase 1: Bundling ES6 modules from src/...');

  const srcInputPath = './src/index.js';
  const bundledOutputPath = './docs/radar.js';
  const minifiedOutputPath = `./docs/release/radar-${version}.js`;

  // Step 1: Bundle ES6 modules using Bun's built-in bundler
  // Use esm format and we'll wrap it ourselves
  const buildResult = await Bun.build({
    entrypoints: [srcInputPath],
    outdir: './temp-build',
    naming: 'bundle.js',
    format: 'esm',
    minify: false,
    target: 'browser'
  });

  if (!buildResult.success) {
    console.error('Bundle failed:', buildResult.logs);
    process.exit(1);
  }

  // Get the bundled ESM output
  const bundledCode = await buildResult.outputs[0].text();

  // Wrap in IIFE to make it browser-compatible and expose globally
  const wrappedCode = `// Tech Radar Visualization - Bundled from ES6 modules
// Version: ${version}
// License: MIT
// Source: https://github.com/zalando/tech-radar

var radar_visualization = (function() {
  'use strict';

  ${bundledCode.replace(/export (default |{[^}]+};?)/g, '')}

  // Return the main function
  return radar_visualization;
})();

// Export for all environments
if (typeof window !== 'undefined') {
  window.radar_visualization = radar_visualization;
}
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = radar_visualization;
}
if (typeof global !== 'undefined') {
  global.radar_visualization = radar_visualization;
}
`;

  // Write bundled version to docs/radar.js
  writeFileSync(bundledOutputPath, wrappedCode);
  const bundledSize = wrappedCode.length;
  console.log(`✓ Bundled to: ${bundledOutputPath} (${bundledSize.toLocaleString()} bytes)`);

  // Step 2: Minify the bundled version using terser
  console.log('Phase 2: Minifying...');
  const result = await $`npx terser ${bundledOutputPath} --compress --mangle reserved=['radar_visualization'] --output ${minifiedOutputPath}`.quiet();

  if (result.exitCode !== 0) {
    console.error('Minification failed:', result.stderr.toString());
    process.exit(1);
  }

  // Get minified size
  const minifiedSize = readFileSync(minifiedOutputPath, 'utf-8').length;
  const reduction = ((1 - minifiedSize / bundledSize) * 100).toFixed(1);

  console.log(`✓ Minified to: ${minifiedOutputPath}`);
  console.log(`  Bundled size: ${bundledSize.toLocaleString()} bytes`);
  console.log(`  Minified size: ${minifiedSize.toLocaleString()} bytes`);
  console.log(`  Size reduction: ${reduction}%`);
  console.log(`\n✓ Build complete!`);
}

buildRadar().catch(console.error);
