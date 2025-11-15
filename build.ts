// Build script to bundle and minify radar.js using Bun + terser
// Phase 1 Refactoring: Now bundles ES6 modules from src/ into browser-compatible output
//
// Usage:
//   RELEASE_VERSION=0.15.0 bun run build            # Build new version
//   RELEASE_VERSION=0.14.0 bun run build --force    # Override existing version (use with caution!)
//
// IMPORTANT: Released versions should never be modified.
//            Always create a new version for changes.
//            Version must follow strict semantic versioning (MAJOR.MINOR.PATCH)

import { $ } from 'bun';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import semver from 'semver';

// Parse command line arguments
const args = process.argv.slice(2);
const forceFlag = args.includes('--force');

// Require explicit version via environment variable
const version = process.env.RELEASE_VERSION;

if (!version) {
  console.error('❌ ERROR: RELEASE_VERSION environment variable is required');
  console.error('');
  console.error('Released versions should never be modified. You must specify a version.');
  console.error('');
  console.error('Usage:');
  console.error('  RELEASE_VERSION=0.15.0 bun run build            # Build new version');
  console.error('  RELEASE_VERSION=0.14.0 bun run build --force    # Override existing (dangerous!)');
  console.error('');
  console.error('Example:');
  console.error('  RELEASE_VERSION=0.15.0 bun run build');
  process.exit(1);
}

// Validate version format using semver library
// See https://semver.org/ for specification
// Note: We reject 'v' prefix to keep filenames clean (use semver.clean() to normalize)
const cleanedVersion = semver.clean(version);
if (!cleanedVersion) {
  console.error(`❌ ERROR: Invalid version format: ${version}`);
  console.error('');
  console.error('Version must follow strict semantic versioning: MAJOR.MINOR.PATCH');
  console.error('See https://semver.org/ for details');
  console.error('');
  console.error('Valid examples:');
  console.error('  ✓ 0.14.0           - Standard release');
  console.error('  ✓ 0.14.1           - Patch release');
  console.error('  ✓ 1.0.0            - Major release');
  console.error('  ✓ 1.0.0-alpha.1    - Pre-release with identifier');
  console.error('  ✓ 1.0.0-beta+001   - Pre-release with build metadata');
  console.error('');
  console.error('Invalid examples:');
  console.error('  ✗ 0.14             - Missing PATCH version');
  console.error('  ✗ 1.0              - Missing PATCH version');
  console.error('');
  process.exit(1);
}

// Reject 'v' prefix to ensure consistent filenames
if (version !== cleanedVersion) {
  console.error(`❌ ERROR: Version should not include 'v' prefix: ${version}`);
  console.error('');
  console.error(`Use: ${cleanedVersion} instead of ${version}`);
  console.error('');
  process.exit(1);
}

async function buildRadar() {
  console.log(`Building radar.js version ${version}...`);

  const srcInputPath = './src/index.js';
  const bundledOutputPath = './docs/radar.js';
  const minifiedOutputPath = `./docs/release/radar-${version}.js`;

  // Check if release version already exists
  if (existsSync(minifiedOutputPath)) {
    if (!forceFlag) {
      console.error('');
      console.error(`❌ ERROR: Release version ${version} already exists!`);
      console.error(`   File: ${minifiedOutputPath}`);
      console.error('');
      console.error('Released versions should NEVER be modified.');
      console.error('');

      // Use semver to suggest next patch version
      const nextVersion = semver.inc(version, 'patch');

      console.error('Options:');
      console.error('  1. Use a new version number (recommended):');
      console.error(`     RELEASE_VERSION=${nextVersion} bun run build`);
      console.error('');
      console.error('  2. Force overwrite (USE WITH EXTREME CAUTION):');
      console.error(`     RELEASE_VERSION=${version} bun run build --force`);
      console.error('');
      process.exit(1);
    } else {
      console.warn('');
      console.warn(`⚠️  WARNING: Forcing overwrite of existing release ${version}`);
      console.warn('   This should only be done during development, NEVER for production releases!');
      console.warn('');
    }
  }

  console.log('Phase 1: Bundling ES6 modules from src/...');

  // Step 1: Bundle ES6 modules using Bun's built-in bundler
  const buildResult = await Bun.build({
    entrypoints: [srcInputPath],
    outdir: './temp-build',
    naming: 'bundle.js',
    format: 'esm',
    minify: false,
    target: 'browser'
  });

  if (!buildResult.success) {
    console.error('❌ Bundle failed:', buildResult.logs);
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
    console.error('❌ Minification failed:', result.stderr.toString());
    process.exit(1);
  }

  // Get minified size
  const minifiedSize = readFileSync(minifiedOutputPath, 'utf-8').length;
  const reduction = ((1 - minifiedSize / bundledSize) * 100).toFixed(1);

  console.log(`✓ Minified to: ${minifiedOutputPath}`);
  console.log(`  Bundled size: ${bundledSize.toLocaleString()} bytes`);
  console.log(`  Minified size: ${minifiedSize.toLocaleString()} bytes`);
  console.log(`  Size reduction: ${reduction}%`);
  console.log('');
  console.log(`✅ Build complete!`);

  if (!forceFlag) {
    console.log('');
    console.log('Release checklist:');
    console.log(`  1. Test the bundled file: open docs/index.html`);
    console.log(`  2. Test the minified file: open docs/test-minified.html`);
    console.log(`  3. Run tests: bun test`);
    console.log(`  4. Commit changes: git add . && git commit -m "release: version ${version}"`);
    console.log(`  5. Create git tag: git tag v${version}`);
    console.log(`  6. Push: git push && git push --tags`);
  }
}

buildRadar().catch(console.error);
