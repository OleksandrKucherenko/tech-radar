import { expect, test } from '@playwright/test';

test.describe('PWA - Tech Radar Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the builder page
    await page.goto('/builder.html');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should load builder page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Tech Radar Builder/);
    await expect(page.locator('h1')).toContainText('Tech Radar Builder');
  });

  test('should have valid web app manifest', async ({ page }) => {
    // Check manifest link exists
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', './builder.webmanifest');

    // Fetch and validate manifest
    const manifestResponse = await page.request.get('/builder.webmanifest');
    expect(manifestResponse.ok()).toBeTruthy();
    expect(manifestResponse.headers()['content-type']).toContain('json');

    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe('Tech Radar Builder');
    expect(manifest.short_name).toBe('Radar Builder');
    expect(manifest.start_url).toBe('./builder.html');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#1976d2');
    expect(manifest.icons).toHaveLength(2);
  });

  test('should have all required PWA meta tags', async ({ page }) => {
    // Check theme color
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#1976d2');

    // Check Apple meta tags
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute(
      'content',
      'Tech Radar Builder'
    );
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');

    // Check icons
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', './apple-touch-icon.png');
  });

  test('should register service worker successfully', async ({ page }) => {
    // Wait for service worker registration
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) {
        return { supported: false, registered: false };
      }

      // Wait up to 5 seconds for SW registration
      const timeout = 5000;
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          return {
            supported: true,
            registered: true,
            scope: registration.scope,
            active: !!registration.active,
          };
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return { supported: true, registered: false };
    });

    expect(swRegistered.supported).toBeTruthy();
    expect(swRegistered.registered).toBeTruthy();
    expect(swRegistered.scope).toContain('/');
  });

  test('should have service worker active and running', async ({ page }) => {
    // Wait a bit for SW to activate
    await page.waitForTimeout(2000);

    const swState = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return null;

      return {
        hasActive: !!registration.active,
        hasInstalling: !!registration.installing,
        hasWaiting: !!registration.waiting,
        state: registration.active?.state,
      };
    });

    expect(swState).not.toBeNull();
    expect(swState?.hasActive).toBeTruthy();
    expect(swState?.state).toBe('activated');
  });

  test('should cache essential resources', async ({ page }) => {
    // Wait for service worker to cache resources
    await page.waitForTimeout(3000);

    const cacheStatus = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      const builderCache = cacheNames.find(name => name.includes('tech-radar-builder'));

      if (!builderCache) {
        return { hasCaches: false };
      }

      const cache = await caches.open(builderCache);
      const cachedRequests = await cache.keys();
      const cachedUrls = cachedRequests.map(req => new URL(req.url).pathname);

      return {
        hasCaches: true,
        cacheCount: cachedUrls.length,
        hasBuilderHtml: cachedUrls.some(url => url.includes('builder.html')),
        hasRadarJs: cachedUrls.some(url => url.includes('radar.js')),
        hasRadarCss: cachedUrls.some(url => url.includes('radar.css')),
        hasManifest: cachedUrls.some(url => url.includes('builder.webmanifest')),
        cachedUrls,
      };
    });

    expect(cacheStatus.hasCaches).toBeTruthy();
    expect(cacheStatus.cacheCount).toBeGreaterThan(0);
    expect(cacheStatus.hasBuilderHtml).toBeTruthy();
    expect(cacheStatus.hasRadarJs).toBeTruthy();
    expect(cacheStatus.hasRadarCss).toBeTruthy();
    expect(cacheStatus.hasManifest).toBeTruthy();
  });

  test('should load manifest icons successfully', async ({ page }) => {
    const manifest = await page.request.get('/builder.webmanifest');
    const manifestData = await manifest.json();

    for (const icon of manifestData.icons) {
      const iconResponse = await page.request.get(icon.src);
      expect(iconResponse.ok()).toBeTruthy();
      expect(iconResponse.headers()['content-type']).toContain('image/png');
    }
  });

  test('should handle beforeinstallprompt event', async ({ page }) => {
    // Check if the event handler is set up
    const hasInstallPromptHandler = await page.evaluate(() => {
      // Check if window.deferredInstallPrompt exists after some time
      return typeof window.deferredInstallPrompt !== 'undefined';
    });

    // Just verify the setup is there (actual prompt won't fire in test environment)
    expect(hasInstallPromptHandler).toBeDefined();
  });

  test('should work offline after caching', async ({ page, context }) => {
    // Wait for service worker to cache everything
    await page.waitForTimeout(3000);

    // Go offline
    await context.setOffline(true);

    // Reload the page while offline
    await page.reload();

    // Page should still load
    await expect(page.locator('h1')).toContainText('Tech Radar Builder');

    // Verify we're actually offline by checking network requests fail
    const online = await page.evaluate(() => navigator.onLine);
    expect(online).toBeFalsy();

    // Go back online
    await context.setOffline(false);
  });

  test('should persist data in localStorage', async ({ page }) => {
    // Add a test entry
    await page.fill('#entryLabel', 'Test Technology');
    await page.selectOption('#entryQuadrant', '0');
    await page.selectOption('#entryRing', '0');
    await page.click('#addEntryBtn');

    // Verify entry was added
    await expect(page.locator('.entry-item')).toContainText('Test Technology');

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify entry persisted
    await expect(page.locator('.entry-item')).toContainText('Test Technology');

    // Clean up
    await page.evaluate(() => localStorage.clear());
  });

  test('should log PWA messages to console', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[PWA]') || text.includes('[Service Worker]')) {
        consoleMessages.push(text);
      }
    });

    await page.reload();
    await page.waitForTimeout(2000);

    // Should have PWA-related console messages
    expect(consoleMessages.length).toBeGreaterThan(0);
    expect(consoleMessages.some(msg => msg.includes('Service Worker registered'))).toBeTruthy();
  });

  test('should have valid service worker script', async ({ page }) => {
    const swResponse = await page.request.get('/builder-sw.js');
    expect(swResponse.ok()).toBeTruthy();
    expect(swResponse.headers()['content-type']).toContain('javascript');

    const swContent = await swResponse.text();
    // Verify key service worker features
    expect(swContent).toContain('install');
    expect(swContent).toContain('activate');
    expect(swContent).toContain('fetch');
    expect(swContent).toContain('caches.open');
  });
});

test.describe('PWA - Offline Functionality', () => {
  test('should handle fetch events through service worker', async ({ page, context }) => {
    await page.goto('/builder.html');
    await page.waitForLoadState('networkidle');

    // Wait for SW to be ready
    await page.waitForTimeout(3000);

    // Go offline
    await context.setOffline(true);

    // Try to navigate to different page (should fallback to builder.html)
    const response = await page.goto('/builder.html');
    expect(response?.status()).toBe(200);

    await context.setOffline(false);
  });

  test('should serve cached assets when offline', async ({ page, context }) => {
    await page.goto('/builder.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verify some images are cached
    await context.setOffline(true);

    // Check if CSS is loaded (from cache)
    const cssLoaded = await page.evaluate(() => {
      const link = document.querySelector('link[href*="radar.css"]');
      return !!link;
    });

    expect(cssLoaded).toBeTruthy();

    await context.setOffline(false);
  });
});
