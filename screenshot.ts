// Screenshot generator using existing demo HTML pages
// Usage: bun run screenshot.ts
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Map demo HTML files to screenshot names
const demoPages = [
  { htmlFile: 'demo-2x4.html', screenshotName: '2x4-quadrants-rings', width: 1920, height: 1080 },
  { htmlFile: 'demo-3x4.html', screenshotName: '3x4-quadrants-rings', width: 1920, height: 1080 },
  { htmlFile: 'demo-4x8.html', screenshotName: '4x8-quadrants-rings', width: 1920, height: 1080 },
  { htmlFile: 'demo-5x4.html', screenshotName: '5x4-quadrants-rings', width: 1920, height: 1080 },
  { htmlFile: 'demo-6x5.html', screenshotName: '6x5-quadrants-rings', width: 1920, height: 1080 },
  { htmlFile: 'demo-7x4.html', screenshotName: '7x4-quadrants-rings', width: 1920, height: 1080 },
  { htmlFile: 'demo-8x8.html', screenshotName: '8x8-quadrants-rings', width: 1920, height: 1080 }
];

// JPEG quality setting (0-100, higher = better quality but larger file)
const JPEG_QUALITY = 65;

async function generateScreenshots() {
  console.log('Starting screenshot generation from demo HTML pages...\n');

  // Create screenshots directory
  try {
    mkdirSync('./docs/screenshots', { recursive: true });
  } catch (e) {
    // Directory exists
  }

  // Read radar.js and radar.css content once to inline in HTML
  const radarJsContent = readFileSync('./docs/radar.js', 'utf-8');
  const radarCssContent = readFileSync('./docs/radar.css', 'utf-8');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const demo of demoPages) {
    console.log(`Generating: ${demo.screenshotName}...`);

    const page = await browser.newPage({
      viewport: { width: demo.width, height: demo.height }
    });

    // Read the demo HTML file
    const htmlPath = resolve(process.cwd(), 'docs', demo.htmlFile);
    let htmlContent = readFileSync(htmlPath, 'utf-8');

    // Replace the radar.css link tag with inlined content
    htmlContent = htmlContent.replace(
      /<link rel="stylesheet" href="radar\.css">/,
      `<style>${radarCssContent}</style>`
    );

    // Replace the radar.js script tag with inlined content
    htmlContent = htmlContent.replace(
      /<script src="radar\.js"><\/script>/,
      `<script>${radarJsContent}</script>`
    );

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // Wait for radar to render (check for circles which are the blips)
    await page.waitForSelector('#radar circle', { timeout: 10000 });
    // Give extra time for CSS to fully apply and render
    await page.waitForTimeout(1000);

    // Take screenshot as JPEG with compression
    const outputPath = `./docs/screenshots/${demo.screenshotName}.jpg`;
    await page.screenshot({
      path: outputPath,
      type: 'jpeg',
      quality: JPEG_QUALITY,
      fullPage: false
    });

    console.log(`  ✓ Saved: ${outputPath}`);

    await page.close();
  }

  await browser.close();

  console.log('\n✅ All screenshots generated successfully as JPEG!');
  console.log(`📁 Location: ./docs/screenshots/ (Quality: ${JPEG_QUALITY}%)`);
}

generateScreenshots().catch(console.error);
