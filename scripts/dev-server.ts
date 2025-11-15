#!/usr/bin/env bun
// @ts-nocheck

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import chokidar from 'chokidar';

type BrowserSyncInstance = ReturnType<typeof import('browser-sync')['default']['create']>;

const SRC_ENTRY = './src/index.js';
const OUTPUT_FILE = './docs/radar.js';
const DEFAULT_DEV_VERSION = process.env.DEV_VERSION ?? '0.0.1-dev';
const WATCH_GLOBS = ['src/**/*.js', 'src/**/*.json'];

function timestamp() {
  return new Date().toLocaleTimeString();
}

function getRepositoryUrl(): string {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
  const repo = packageJson.repository;
  if (typeof repo === 'string') {
    return repo.replace(/^git\+/, '').replace(/\.git$/, '');
  }
  if (typeof repo === 'object' && repo.url) {
    return repo.url.replace(/^git\+/, '').replace(/\.git$/, '');
  }
  return 'https://github.com/zalando/tech-radar';
}

function getGitCommitHash(): string {
  try {
    return execSync('git log -1 --format=%h', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function formatVersion(version: string): string {
  if (version.includes('-dev')) {
    const hash = getGitCommitHash();
    return version.replace(/-dev$/, `-dev+${hash}`);
  }
  return version;
}

function wrapBundledCode(bundledCode: string, displayVersion: string, repositoryUrl: string): string {
  return `// Tech Radar Visualization - Bundled from ES6 modules\n// Version: ${displayVersion}\n// License: MIT\n// Source: ${repositoryUrl}\n\nvar radar_visualization = (function() {\n  'use strict';\n\n  ${bundledCode.replace(/export (default |{[^}]+};?)/g, '')}\n\n  // Return the main function\n  return radar_visualization;\n})();\n\n// Export for all environments\nif (typeof window !== 'undefined') {\n  window.radar_visualization = radar_visualization;\n}\nif (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {\n  module.exports = radar_visualization;\n}\nif (typeof global !== 'undefined') {\n  global.radar_visualization = radar_visualization;\n}\n`;
}

async function startBrowserSync(): Promise<BrowserSyncInstance> {
  const { default: browserSync } = await import('browser-sync');
  return new Promise((resolve, reject) => {
    const instance = browserSync.create('radar-dev');
    instance.init(
      {
        server: 'docs',
        open: true,
        notify: false,
        ui: false,
        logPrefix: 'radar-dev',
        logFileChanges: false,
        port: Number(process.env.PORT) || 3000,
        files: [
          'docs/**/*.html',
          'docs/**/*.css',
          'docs/**/*.js',
          'docs/**/*.json',
          'docs/**/*.png',
          'docs/**/*.jpg',
          'docs/**/*.svg',
          'docs/**/*.webmanifest',
        ],
      },
      err => {
        if (err) {
          reject(err);
          return;
        }
        console.log(
          `[${timestamp()}] ▶️  BrowserSync serving docs at http://localhost:${instance.getOption<number>('port')}`
        );
        resolve(instance);
      }
    );
  });
}

class DevRadarBuilder {
  private readonly repositoryUrl = getRepositoryUrl();
  private readonly displayVersion = formatVersion(DEFAULT_DEV_VERSION);
  private watcher: chokidar.FSWatcher | null = null;
  private building = false;
  private pendingReason: string | null = null;

  constructor(private readonly browserSyncGetter: () => BrowserSyncInstance | null) {}

  async start() {
    console.log(`[${timestamp()}] 🔧 Building docs/radar.js (watch mode)…`);
    await this.runBuild('initial-build');
    this.startWatcher();
  }

  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  private startWatcher() {
    this.watcher = chokidar.watch(WATCH_GLOBS, { ignoreInitial: true });
    this.watcher.on('all', (event, changedPath) => {
      const relPath = relative(process.cwd(), changedPath);
      console.log(`[${timestamp()}] 🔁 ${event} detected in ${relPath}`);
      this.scheduleBuild(`${event}:${relPath}`);
    });
    this.watcher.on('error', error => {
      console.error(`[${timestamp()}] ❌ Watcher error`, error);
    });
  }

  private scheduleBuild(reason: string) {
    if (this.building) {
      this.pendingReason = reason;
      return;
    }
    void this.runBuild(reason);
  }

  private async runBuild(reason: string) {
    this.building = true;
    try {
      const buildResult = await Bun.build({
        entrypoints: [SRC_ENTRY],
        outdir: './temp-dev',
        naming: 'bundle.js',
        format: 'esm',
        target: 'browser',
        minify: false,
      });

      if (!buildResult.success) {
        console.error(`[${timestamp()}] ❌ Build failed (${reason})`, buildResult.logs);
        return;
      }

      await this.handleOutputs(buildResult);
    } finally {
      this.building = false;
      if (this.pendingReason) {
        const next = this.pendingReason;
        this.pendingReason = null;
        this.scheduleBuild(next);
      }
    }
  }

  private async handleOutputs(result: Bun.BuildOutput) {
    const output = result.outputs[0];
    const bundledCode = await output.text();
    const wrappedCode = wrapBundledCode(bundledCode, this.displayVersion, this.repositoryUrl);
    writeFileSync(OUTPUT_FILE, wrappedCode);
    console.log(`[${timestamp()}] ✓ docs/radar.js rebuilt (${wrappedCode.length.toLocaleString()} bytes)`);

    const browserSync = this.browserSyncGetter();
    if (browserSync) {
      browserSync.reload('radar.js');
    }
  }
}

async function main() {
  let browserSyncInstance: BrowserSyncInstance | null = null;
  const builder = new DevRadarBuilder(() => browserSyncInstance);
  await builder.start();
  browserSyncInstance = await startBrowserSync();

  let shuttingDown = false;

  const shutdown = () => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    console.log(`\n[${timestamp()}] ⏹️  Shutting down dev server…`);
    browserSyncInstance?.exit();
    builder
      .stop()
      .catch(error => console.error(`[${timestamp()}] ❌ Error stopping watcher`, error))
      .finally(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(error => {
  console.error(`[${timestamp()}] ❌ Dev server crashed`, error);
  process.exit(1);
});
