# Screenshots

This directory contains screenshots demonstrating different quadrant/ring configurations.

## Generating Screenshots

### Option 1: Automated (Requires Playwright)

If you have Playwright installed with system dependencies:

```bash
bun run screenshot.ts
```

This will automatically generate screenshots for all configurations.

### Option 2: Manual Screenshots

1. Open the demo files in your browser:
   - `docs/demo-2x4.html` - 2 Quadrants × 4 Rings
   - `docs/index.html` - 4 Quadrants × 4 Rings (default)
   - `docs/demo-6x5.html` - 6 Quadrants × 5 Rings
   - `docs/demo-8x8.html` - 8 Quadrants × 8 Rings

2. Take screenshots using your browser's built-in tools or:
   - **Chrome/Edge**: Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac), type "screenshot", select "Capture screenshot"
   - **Firefox**: Press `Shift+F2`, type `screenshot --fullpage`
   - **macOS**: `Cmd+Shift+4` then press `Space` to capture window
   - **Windows**: Use Snipping Tool or Snip & Sketch

3. Save screenshots as:
   - `2x4-quadrants-rings.png`
   - `4x4-quadrants-rings.png`
   - `6x5-quadrants-rings.png`
   - `8x8-quadrants-rings.png`

### Option 3: Using Browser DevTools

```javascript
// Open browser console on any demo page
// Run this to download screenshot:
const svg = document.getElementById('radar');
const svgData = new XMLSerializer().serializeToString(svg);
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const img = new Image();
img.onload = function() {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  const a = document.createElement("a");
  a.download = "radar-screenshot.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
};
img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
```

## Demo Files

- **demo-2x4.html** - Minimal configuration (2 quadrants, 4 rings)
- **demo-6x5.html** - Medium configuration (6 quadrants, 5 rings)
- **demo-8x8.html** - Maximum configuration (8 quadrants, 8 rings)
- **index.html** - Standard configuration (4 quadrants, 4 rings)
