// Build script to minify radar.js using Bun + terser
// Usage: bun run build.ts
// Can override version via RELEASE_VERSION environment variable
import { $ } from 'bun';
import { readFileSync } from 'fs';

const version = process.env.RELEASE_VERSION || '0.13'; // Update this when creating new releases

async function buildRadar() {
  console.log(`Building radar.js version ${version}...`);

  const inputPath = './docs/radar.js';
  const outputPath = `./docs/release/radar-${version}.js`;

  // Get original size
  const originalSize = readFileSync(inputPath, 'utf-8').length;

  // Use terser via npx to minify while preserving the radar_visualization function name
  // --compress: enable compression
  // --mangle: shorten variable names except reserved ones
  // reserved=['radar_visualization']: keep this function name intact
  const result = await $`npx terser ${inputPath} --compress --mangle reserved=['radar_visualization'] --output ${outputPath}`.quiet();

  if (result.exitCode !== 0) {
    console.error('Build failed:', result.stderr.toString());
    process.exit(1);
  }

  // Get minified size
  const minifiedSize = readFileSync(outputPath, 'utf-8').length;
  const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(1);

  console.log(`✓ Built minified version: ${outputPath}`);
  console.log(`  Original size: ${originalSize.toLocaleString()} bytes`);
  console.log(`  Minified size: ${minifiedSize.toLocaleString()} bytes`);
  console.log(`  Size reduction: ${reduction}%`);
}

buildRadar().catch(console.error);
