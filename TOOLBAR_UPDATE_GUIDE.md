# Toolbar Update Guide

## 🎨 Design: Floating Overlay Toolbar

The toolbar now floats as an overlay in the **top-right corner** of the page:
- ✅ **Fixed positioning** - stays visible while scrolling
- ✅ **Glassmorphic design** - semi-transparent with backdrop blur
- ✅ **Hover effects** - subtle animations and shadow changes
- ✅ **Floating messages** - success/error messages appear below toolbar
- ✅ **Print-friendly** - automatically hidden when printing
- ✅ **Responsive** - adapts on mobile devices

## Status
✅ **Completed:**
- `docs/index.html` - Uses inline toolbar code (can be refactored later)
- `docs/demo-2x4.html` - Uses inline toolbar code (can be refactored later) 
- `docs/demo-3x4.html` - ✨ Uses new `initDemoToolbar()` helper
- `docs/builder.html` - Already had toolbar functionality

❌ **Remaining:**
- `docs/demo-4x8.html`
- `docs/demo-5x4.html`
- `docs/demo-6x5.html`
- `docs/demo-7x4.html`
- `docs/demo-8x8.html`
- `docs/ai.html`

## Pattern to Apply

For each remaining demo file, make these changes:

### 1. Add Toolbar HTML (after `</nav>`)

```html
</nav>

<div class="demo-toolbar" role="region" aria-label="JSON configuration tools">
  <div class="demo-toolbar__controls">
    <button type="button" class="demo-toolbar__button" id="jsonImportButton">Import JSON</button>
    <button type="button" class="demo-toolbar__button" id="jsonExportButton">Export JSON</button>
    <input type="file" id="jsonImportInput" accept="application/json,.json" hidden />
  </div>
  <p class="demo-toolbar__message" id="jsonToolbarMessage" role="status" aria-live="polite"></p>
</div>

<div class="radar-container">
```

### 2. Update JavaScript (in `<script>` tag)

**BEFORE:**
```javascript
<script>
  radar_visualization({
    svg_id: "radar",
    title: "Demo Title",
    quadrants: [...],
    rings: [...],
    entries: [...]
  });
</script>
```

**AFTER:**
```javascript
<script>
  let currentConfig = null;
  function renderRadar(config) {
    currentConfig = config;
    radar_visualization(config);
  }
  
  const initialConfig = {
    svg_id: "radar",
    title: "Demo Title",
    quadrants: [...],
    rings: [...],
    entries: [...]
  };
  
  renderRadar(initialConfig);
  
  // Initialize toolbar using the helper
  radar_visualization.initDemoToolbar({
    demoSlug: 'demo-4x8',  // Change this for each file!
    getCurrentConfig: () => currentConfig,
    onConfigImport: (config) => renderRadar(config),
    jsonIO: radar_visualization.jsonIO
  });
</script>
```

### Demo Slugs

| File          | demoSlug Value |
| ------------- | -------------- |
| demo-4x8.html | `'demo-4x8'`   |
| demo-5x4.html | `'demo-5x4'`   |
| demo-6x5.html | `'demo-6x5'`   |
| demo-7x4.html | `'demo-7x4'`   |
| demo-8x8.html | `'demo-8x8'`   |
| ai.html       | `'ai-demo'`    |

## Navigation Check

Ensure all demo files have identical navigation:

```html
<nav class="demo-links">
  <strong>Demo pages:</strong>
  <a href="./index.html">Default</a>
  <a href="./demo-2x4.html">2 Quadrants × 4 Rings</a>
  <a href="./demo-3x4.html">3 Quadrants × 4 Rings</a>
  <a href="./demo-4x8.html">4 Quadrants × 8 Rings</a>
  <a href="./demo-5x4.html">5 Quadrants × 4 Rings</a>
  <a href="./demo-6x5.html">6 Quadrants × 5 Rings</a>
  <a href="./demo-7x4.html">7 Quadrants × 4 Rings</a>
  <a href="./demo-8x8.html">8 Quadrants × 8 Rings</a>
  <span class="separator">|</span>
  <a href="./builder.html" class="builder-link">⚙️ Tech Radar Builder</a>
</nav>
```

## Testing

After updating each file:
1. Open the demo in a browser
2. Click "Export JSON" - should download `<demoSlug>-YYYYMMDD-HHMMSS.json`
3. Click "Import JSON" and select the downloaded file
4. Verify the radar re-renders correctly
5. Check console for any errors

## Why This Approach?

The `initDemoToolbar()` helper:
- ✅ Reduces code from ~40 lines to ~12 lines per demo
- ✅ Centralizes toolbar logic in one maintainable module
- ✅ Provides consistent error handling across all demos
- ✅ Makes future toolbar updates easy (change once, apply everywhere)
- ✅ Compiled into `radar.js` bundle - no additional HTTP requests
