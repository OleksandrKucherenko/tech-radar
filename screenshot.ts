// Screenshot generator for different radar configurations
// Usage: bun run screenshot.ts
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const configurations = [
  {
    name: '2x4-quadrants-rings',
    title: '2 Quadrants × 4 Rings',
    quadrants: [
      { name: "Frontend" },
      { name: "Backend" }
    ],
    rings: [
      { name: "ADOPT", color: "#5ba300" },
      { name: "TRIAL", color: "#009eb0" },
      { name: "ASSESS", color: "#c7ba00" },
      { name: "HOLD", color: "#e09b96" }
    ],
    entries: [
      { label: "React", quadrant: 0, ring: 0, moved: 1, active: true },
      { label: "Vue", quadrant: 0, ring: 1, moved: 0, active: true },
      { label: "Angular", quadrant: 0, ring: 2, moved: 0, active: true },
      { label: "Svelte", quadrant: 0, ring: 2, moved: 2, active: true },
      { label: "Node.js", quadrant: 1, ring: 0, moved: 0, active: true },
      { label: "Django", quadrant: 1, ring: 1, moved: 0, active: true },
      { label: "Flask", quadrant: 1, ring: 1, moved: 0, active: true },
      { label: "Rails", quadrant: 1, ring: 3, moved: -1, active: true }
    ],
    width: 900,
    height: 700
  },
  {
    name: '4x4-quadrants-rings',
    title: '4 Quadrants × 4 Rings (Default)',
    quadrants: [
      { name: "Languages" },
      { name: "Infrastructure" },
      { name: "Datastores" },
      { name: "Data Management" }
    ],
    rings: [
      { name: "ADOPT", color: "#5ba300" },
      { name: "TRIAL", color: "#009eb0" },
      { name: "ASSESS", color: "#c7ba00" },
      { name: "HOLD", color: "#e09b96" }
    ],
    entries: [
      { label: "Python", quadrant: 0, ring: 0, moved: 0, active: true },
      { label: "JavaScript", quadrant: 0, ring: 0, moved: 1, active: true },
      { label: "TypeScript", quadrant: 0, ring: 0, moved: 0, active: true },
      { label: "Rust", quadrant: 0, ring: 2, moved: 2, active: true },
      { label: "Kubernetes", quadrant: 1, ring: 0, moved: 0, active: true },
      { label: "Docker", quadrant: 1, ring: 0, moved: 0, active: true },
      { label: "Terraform", quadrant: 1, ring: 1, moved: 0, active: true },
      { label: "PostgreSQL", quadrant: 2, ring: 0, moved: 0, active: true },
      { label: "Redis", quadrant: 2, ring: 1, moved: 0, active: true },
      { label: "MongoDB", quadrant: 2, ring: 3, moved: 0, active: true },
      { label: "Kafka", quadrant: 3, ring: 0, moved: 0, active: true },
      { label: "Airflow", quadrant: 3, ring: 1, moved: 1, active: true },
      { label: "Spark", quadrant: 3, ring: 1, moved: 0, active: true }
    ],
    width: 1000,
    height: 800
  },
  {
    name: '6x5-quadrants-rings',
    title: '6 Quadrants × 5 Rings',
    quadrants: [
      { name: "Languages" },
      { name: "Frameworks" },
      { name: "Platforms" },
      { name: "Tools" },
      { name: "Techniques" },
      { name: "Infrastructure" }
    ],
    rings: [
      { name: "ADOPT", color: "#5ba300" },
      { name: "TRIAL", color: "#009eb0" },
      { name: "ASSESS", color: "#c7ba00" },
      { name: "HOLD", color: "#e09b96" },
      { name: "DEPRECATED", color: "#cc0000" }
    ],
    entries: [
      { label: "Python", quadrant: 0, ring: 0, moved: 0, active: true },
      { label: "Go", quadrant: 0, ring: 1, moved: 1, active: true },
      { label: "React", quadrant: 1, ring: 0, moved: 0, active: true },
      { label: "Next.js", quadrant: 1, ring: 1, moved: 2, active: true },
      { label: "AWS", quadrant: 2, ring: 0, moved: 0, active: true },
      { label: "Vercel", quadrant: 2, ring: 1, moved: 0, active: true },
      { label: "Git", quadrant: 3, ring: 0, moved: 0, active: true },
      { label: "Figma", quadrant: 3, ring: 0, moved: 0, active: true },
      { label: "TDD", quadrant: 4, ring: 0, moved: 0, active: true },
      { label: "Microservices", quadrant: 4, ring: 1, moved: 0, active: true },
      { label: "Docker", quadrant: 5, ring: 0, moved: 0, active: true },
      { label: "Kubernetes", quadrant: 5, ring: 1, moved: 0, active: true }
    ],
    width: 1200,
    height: 1000
  },
  {
    name: '8x8-quadrants-rings',
    title: '8 Quadrants × 8 Rings (Maximum)',
    quadrants: [
      { name: "Lang" },
      { name: "Frame" },
      { name: "Plat" },
      { name: "Tools" },
      { name: "Tech" },
      { name: "Infra" },
      { name: "Data" },
      { name: "Sec" }
    ],
    rings: [
      { name: "R1", color: "#00ff00" },
      { name: "R2", color: "#00dd00" },
      { name: "R3", color: "#00bb00" },
      { name: "R4", color: "#009900" },
      { name: "R5", color: "#007700" },
      { name: "R6", color: "#cc8800" },
      { name: "R7", color: "#dd4400" },
      { name: "R8", color: "#ff0000" }
    ],
    entries: [
      { label: "A1", quadrant: 0, ring: 0, moved: 0, active: true },
      { label: "A2", quadrant: 0, ring: 1, moved: 0, active: true },
      { label: "B1", quadrant: 1, ring: 2, moved: 0, active: true },
      { label: "B2", quadrant: 1, ring: 3, moved: 0, active: true },
      { label: "C1", quadrant: 2, ring: 4, moved: 0, active: true },
      { label: "C2", quadrant: 2, ring: 5, moved: 0, active: true },
      { label: "D1", quadrant: 3, ring: 6, moved: 0, active: true },
      { label: "D2", quadrant: 3, ring: 7, moved: 0, active: true },
      { label: "E1", quadrant: 4, ring: 0, moved: 1, active: true },
      { label: "E2", quadrant: 4, ring: 1, moved: 0, active: true },
      { label: "F1", quadrant: 5, ring: 2, moved: 0, active: true },
      { label: "F2", quadrant: 5, ring: 3, moved: 0, active: true },
      { label: "G1", quadrant: 6, ring: 4, moved: 2, active: true },
      { label: "G2", quadrant: 6, ring: 5, moved: 0, active: true },
      { label: "H1", quadrant: 7, ring: 6, moved: -1, active: true },
      { label: "H2", quadrant: 7, ring: 7, moved: 0, active: true }
    ],
    width: 1400,
    height: 1200
  }
];

async function generateScreenshots() {
  console.log('Starting screenshot generation...\n');

  // Create screenshots directory
  try {
    mkdirSync('./docs/screenshots', { recursive: true });
  } catch (e) {
    // Directory exists
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const config of configurations) {
    console.log(`Generating: ${config.title}...`);

    const page = await browser.newPage({
      viewport: { width: config.width, height: config.height }
    });

    // Create HTML content
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${config.title}</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, Helvetica, sans-serif;
      background: white;
    }
    svg {
      display: block;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <svg id="radar"></svg>
  <script src="file://${process.cwd()}/docs/radar.js"></script>
  <script>
    radar_visualization(${JSON.stringify({
      svg_id: "radar",
      width: config.width - 40,
      height: config.height - 40,
      title: config.title,
      quadrants: config.quadrants,
      rings: config.rings,
      entries: config.entries
    })});
  </script>
</body>
</html>
    `;

    await page.setContent(html);

    // Wait for radar to render
    await page.waitForTimeout(2000);

    // Take screenshot
    const outputPath = `./docs/screenshots/${config.name}.png`;
    await page.screenshot({
      path: outputPath,
      fullPage: false
    });

    console.log(`  ✓ Saved: ${outputPath}`);

    await page.close();
  }

  await browser.close();

  console.log('\n✅ All screenshots generated successfully!');
  console.log('📁 Location: ./docs/screenshots/');
}

generateScreenshots().catch(console.error);
