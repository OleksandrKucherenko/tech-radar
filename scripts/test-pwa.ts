#!/usr/bin/env bun
/**
 * Lightweight PWA Testing Script
 * Tests PWA readiness without launching a full browser
 * Usage: bun run scripts/test-pwa.ts
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: unknown;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean | { passed: boolean; message: string; details?: unknown }): void {
  try {
    const result = fn();
    if (typeof result === 'boolean') {
      results.push({ name, passed: result, message: result ? '✓ Pass' : '✗ Fail' });
    } else {
      results.push({ name, passed: result.passed, message: result.message, details: result.details });
    }
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

console.log('🔍 Testing PWA Configuration...\n');

// Test 1: Check builder.html exists
test('Builder HTML exists', () => {
  const exists = existsSync(resolve('docs/builder.html'));
  return {
    passed: exists,
    message: exists ? '✓ docs/builder.html found' : '✗ docs/builder.html not found',
  };
});

// Test 2: Check manifest file exists
test('Manifest file exists', () => {
  const exists = existsSync(resolve('docs/builder.webmanifest'));
  return {
    passed: exists,
    message: exists ? '✓ docs/builder.webmanifest found' : '✗ docs/builder.webmanifest not found',
  };
});

// Test 3: Check service worker exists
test('Service worker exists', () => {
  const exists = existsSync(resolve('docs/builder-sw.js'));
  return {
    passed: exists,
    message: exists ? '✓ docs/builder-sw.js found' : '✗ docs/builder-sw.js not found',
  };
});

// Test 4: Validate manifest JSON
test('Manifest JSON is valid', () => {
  try {
    const manifestPath = resolve('docs/builder.webmanifest');
    const content = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    const missingFields = requiredFields.filter(field => !manifest[field]);

    if (missingFields.length > 0) {
      return {
        passed: false,
        message: `✗ Missing required fields: ${missingFields.join(', ')}`,
      };
    }

    return {
      passed: true,
      message: '✓ Manifest JSON is valid with all required fields',
      details: {
        name: manifest.name,
        start_url: manifest.start_url,
        display: manifest.display,
        icons: manifest.icons.length,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: `✗ Failed to parse manifest: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// Test 5: Check manifest icons exist
test('Manifest icons exist', () => {
  try {
    const manifestPath = resolve('docs/builder.webmanifest');
    const content = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    const missingIcons: string[] = [];
    for (const icon of manifest.icons || []) {
      const iconPath = resolve('docs', icon.src.replace('./', ''));
      if (!existsSync(iconPath)) {
        missingIcons.push(icon.src);
      }
    }

    if (missingIcons.length > 0) {
      return {
        passed: false,
        message: `✗ Missing icon files: ${missingIcons.join(', ')}`,
      };
    }

    return {
      passed: true,
      message: `✓ All ${manifest.icons.length} icon files exist`,
    };
  } catch (error) {
    return {
      passed: false,
      message: `✗ Error checking icons: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// Test 6: Check builder.html references manifest
test('Builder HTML references manifest', () => {
  const htmlPath = resolve('docs/builder.html');
  const content = readFileSync(htmlPath, 'utf-8');

  const hasManifestLink = content.includes('rel="manifest"') && content.includes('builder.webmanifest');

  return {
    passed: hasManifestLink,
    message: hasManifestLink ? '✓ builder.html includes manifest link' : '✗ builder.html missing manifest link',
  };
});

// Test 7: Check builder.html registers service worker
test('Builder HTML registers service worker', () => {
  const htmlPath = resolve('docs/builder.html');
  const content = readFileSync(htmlPath, 'utf-8');

  // Check for service worker registration (handle multi-line formatting)
  const hasServiceWorkerAPI =
    content.includes('serviceWorker') && (content.includes('.register(') || content.includes('serviceWorker.register'));
  const hasSwScript = content.includes('builder-sw.js');

  const hasSwRegistration = hasServiceWorkerAPI && hasSwScript;

  return {
    passed: hasSwRegistration,
    message: hasSwRegistration
      ? '✓ builder.html registers service worker'
      : '✗ builder.html missing service worker registration',
  };
});

// Test 8: Check PWA meta tags
test('PWA meta tags present', () => {
  const htmlPath = resolve('docs/builder.html');
  const content = readFileSync(htmlPath, 'utf-8');

  const requiredMetaTags = ['theme-color', 'apple-mobile-web-app-capable', 'apple-mobile-web-app-title'];

  const missingTags = requiredMetaTags.filter(tag => !content.includes(tag));

  if (missingTags.length > 0) {
    return {
      passed: false,
      message: `✗ Missing meta tags: ${missingTags.join(', ')}`,
    };
  }

  return {
    passed: true,
    message: '✓ All required PWA meta tags present',
  };
});

// Test 9: Service worker has required event listeners
test('Service worker has required events', () => {
  const swPath = resolve('docs/builder-sw.js');
  const content = readFileSync(swPath, 'utf-8');

  const requiredEvents = ['install', 'activate', 'fetch'];
  const missingEvents = requiredEvents.filter(event => !content.includes(`addEventListener('${event}'`));

  if (missingEvents.length > 0) {
    return {
      passed: false,
      message: `✗ Service worker missing events: ${missingEvents.join(', ')}`,
    };
  }

  return {
    passed: true,
    message: '✓ Service worker has all required event listeners',
  };
});

// Test 10: Service worker caches essential resources
test('Service worker caches essential resources', () => {
  const swPath = resolve('docs/builder-sw.js');
  const content = readFileSync(swPath, 'utf-8');

  const essentialResources = ['builder.html', 'radar.js', 'radar.css', 'builder.webmanifest'];

  const missingResources = essentialResources.filter(resource => !content.includes(resource));

  if (missingResources.length > 0) {
    return {
      passed: false,
      message: `✗ Service worker missing resources: ${missingResources.join(', ')}`,
    };
  }

  return {
    passed: true,
    message: '✓ Service worker caches all essential resources',
  };
});

// Print results
console.log(`\n${'='.repeat(60)}`);
console.log('Test Results:');
console.log(`${'='.repeat(60)}\n`);

let passCount = 0;
let failCount = 0;

for (const result of results) {
  console.log(`${result.passed ? '✓' : '✗'} ${result.name}`);
  console.log(`  ${result.message}`);
  if (result.details) {
    console.log(`  Details:`, JSON.stringify(result.details, null, 2));
  }
  console.log();

  if (result.passed) passCount++;
  else failCount++;
}

console.log('='.repeat(60));
console.log(`Summary: ${passCount} passed, ${failCount} failed`);
console.log('='.repeat(60));

if (failCount > 0) {
  console.log('\n⚠️  PWA configuration has issues. Fix them before testing in browser.');
  process.exit(1);
} else {
  console.log('\n✅ PWA configuration looks good!');
  console.log('\nNext steps:');
  console.log('1. Run: bun start');
  console.log('2. Open: http://localhost:3000/builder.html');
  console.log('3. Open DevTools → Application → Service Workers');
  console.log('4. Check for service worker registration');
  console.log('5. Open DevTools → Application → Manifest');
  console.log('6. Verify manifest loads correctly');
  console.log('7. Look for install prompt in browser (+ icon in address bar)');
}
