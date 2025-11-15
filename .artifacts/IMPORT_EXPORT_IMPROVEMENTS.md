# Import/Export Functionality Improvements

## Summary

Updated import/export functionality across all `docs/*.html` pages to meet the following requirements:

### ✅ Requirements Implemented

1. **Clean JSON Export** - Save current state of tech radar to JSON with only data properties:
   - ✅ Includes: `label`, `quadrant`, `ring`, `moved`, `active`, `link` (optional)
   - ✅ Excludes: `x`, `y`, `id`, `collision_radius`, `segment`, `color`, `_pluginInstances`, `_internalState`
   - Implemented in: `src/integration/json-io.js` → `sanitizeConfigForExport()`

2. **Config Merging on Import** - Load JSON and merge with current hardcoded configuration:
   - ✅ Preserves base configuration structure (colors, svg_id, repo_url, font_family, etc.)
   - ✅ Merges imported properties: `title`, `date`, `quadrants`, `rings`, `print_layout`, `links_in_new_tabs`
   - ✅ Always replaces `entries` with imported entries
   - Implemented in: `src/integration/json-io.js` → `mergeConfigs()`

3. **Reset Button** - Toolbar button to recover tech radar to initial state:
   - ✅ Added Reset button with undo icon to all toolbars
   - ✅ Prompts user for confirmation before reset
   - ✅ Restores exact initial configuration (deep clone)
   - ✅ Shows success message after reset
   - Implemented in: `src/ui/demo-toolbar.js` → `initDemoToolbar()`

## Files Modified

### Source Files (src/)
1. **`src/integration/json-io.js`**
   - Added `sanitizeConfigForExport()` function
   - Added `mergeConfigs()` function
   - Updated `exportConfig()` to use sanitization
   - Exported helper functions via `createJsonIOHelpers()`

2. **`src/ui/demo-toolbar.js`**
   - Added Reset button support
   - Added `onConfigReset` callback parameter
   - Added `initialConfig` parameter
   - Updated `getToolbarHTML()` to include Reset button
   - Import handler now merges configs using `mergeConfigs()`

### Demo Pages (docs/)
All pages have been updated with Reset button and proper config management:

#### ✅ Fully Updated (using initDemoToolbar)
- `docs/ai.html` - AI Tech Radar
- `docs/demo-3x4.html` - 3 Quadrants × 4 Rings
- `docs/demo-4x8.html` - 4 Quadrants × 8 Rings
- `docs/demo-5x4.html` - 5 Quadrants × 4 Rings
- `docs/demo-6x5.html` - 6 Quadrants × 5 Rings
- `docs/demo-7x4.html` - 7 Quadrants × 4 Rings
- `docs/demo-8x8.html` - 8 Quadrants × 8 Rings

#### ✅ Fully Updated (manual setup)
- `docs/index.html` - Main Tech Radar page
- `docs/demo-2x4.html` - 2 Quadrants × 4 Rings

#### ℹ️ Not Updated (special pages)
- `docs/demo-3x4-debug.html` - Debug mode demo (legacy, not in main navigation)
- `docs/builder.html` - Tech Radar Builder (already has reset functionality built-in)

## Implementation Details

### Export Sanitization Example

**Before (with rendering properties):**
```json
{
  "entries": [
    {
      "label": "React",
      "quadrant": 0,
      "ring": 0,
      "moved": 0,
      "active": true,
      "x": 234.5,
      "y": 156.2,
      "id": "1",
      "collision_radius": 14,
      "segment": { /* complex object */ },
      "color": "#5ba300"
    }
  ]
}
```

**After (clean data only):**
```json
{
  "entries": [
    {
      "label": "React",
      "quadrant": 0,
      "ring": 0,
      "moved": 0,
      "active": true
    }
  ]
}
```

### Config Merging Example

**Initial Config (hardcoded):**
```javascript
{
  repo_url: "https://github.com/...",
  svg_id: "radar",
  colors: { background: "#fff", grid: "#bbb" },
  title: "My Tech Radar",
  quadrants: [{ name: "Tools" }, { name: "Platforms" }],
  rings: [{ name: "ADOPT", color: "#5ba300" }],
  entries: [/* 10 entries */]
}
```

**Imported Config:**
```javascript
{
  title: "Updated Radar",
  entries: [/* 5 new entries */]
}
```

**Merged Result:**
```javascript
{
  repo_url: "https://github.com/...",  // preserved
  svg_id: "radar",                     // preserved
  colors: { background: "#fff", grid: "#bbb" }, // preserved
  title: "Updated Radar",              // merged from import
  quadrants: [{ name: "Tools" }, { name: "Platforms" }], // preserved
  rings: [{ name: "ADOPT", color: "#5ba300" }],          // preserved
  entries: [/* 5 new entries */]       // replaced with import
}
```

### Reset Button Usage

The Reset button:
1. Shows confirmation dialog: "Reset to initial configuration? This will discard all changes."
2. On confirm: Restores initial config using deep clone
3. Re-renders the radar visualization
4. Shows success message: "Configuration reset to initial state"

## Testing

### Manual Test Checklist

1. **Export Functionality**
   - [ ] Click Export button
   - [ ] Verify downloaded JSON contains no `x`, `y`, `id`, `collision_radius`, `segment`, `color`
   - [ ] Verify all data fields are present: `label`, `quadrant`, `ring`, `moved`, `active`, `link`

2. **Import Functionality**
   - [ ] Export current config
   - [ ] Modify entries in exported JSON
   - [ ] Import modified JSON
   - [ ] Verify entries are updated
   - [ ] Verify base config (colors, svg_id, etc.) remains unchanged

3. **Reset Functionality**
   - [ ] Import a modified config
   - [ ] Click Reset button
   - [ ] Confirm dialog
   - [ ] Verify radar returns to initial state
   - [ ] Verify success message appears

## Build Information

Built with version: **2025.11.4** (November 15, 2025)

Build command used:
```bash
RELEASE_VERSION=2025.11.4 bun run build
```

Generated files:
- `docs/radar.js` (70,332 bytes - bundled)
- `docs/release/radar-2025.11.4.js` (34,812 bytes - minified)

**Version History:**
- `2025.11.0` - Initial import/export/reset implementation
- `2025.11.1` - Added centralized `radar_visualization.render()` method
- `2025.11.2` - **Major refactoring:** Instance-based API pattern
- `2025.11.3` - **Toolbar instance pattern:** `instance.toolbar = initDemoToolbar(...)`
- `2025.11.4` - **Automatic wiring:** `initDemoToolbar(radarInstance, options)` auto-configures callbacks

## ⚠️ API Change Notice

Version 2025.11.2 introduces a new **instance-based API pattern**. This is a significant architectural improvement that provides:

- ✅ Clear separation between static config and runtime instance
- ✅ Instance methods: `getConfig()`, `render()`, `reset()`
- ✅ Composable capabilities: `instance.importExport = radar_visualization.jsonIO`
- ✅ Better encapsulation and testability

**Backward compatibility maintained** - old code continues to work while new pattern is preferred.

See **[API_REFACTORING.md](./API_REFACTORING.md)** for complete details, migration guide, and examples.

## Architectural Improvements

### Centralized Render Method
**Issue:** The SVG clearing and rendering logic was duplicated across all 9+ HTML demo pages.

**Solution:** Created a centralized `radar_visualization.render()` method in the core library (`src/index.js`):

```javascript
// Core library (src/index.js)
radar_visualization.render = config => {
  // Clear existing SVG content to prevent duplicate diagrams
  const svg = document.getElementById(config.svg_id || 'radar');
  if (svg) {
    svg.innerHTML = '';
  }

  // Render the radar
  radar_visualization(config);

  return config;
};
```

**Benefits:**
- ✅ **DRY Principle:** Single source of truth for rendering logic
- ✅ **Maintainability:** Bug fixes and improvements happen in one place
- ✅ **Consistency:** All pages use the same rendering approach
- ✅ **Professional API:** Better developer experience with `radar_visualization.render()`

**HTML pages now use:**
```javascript
function renderRadar(config) {
  currentConfig = config;
  radar_visualization.render(config);  // ← Uses centralized method
}
```

Instead of duplicating the SVG clearing logic.

## Bug Fixes

### Fixed: Duplicate Radar Diagrams on Import
**Issue:** When importing JSON configuration, two overlapping radar diagrams would appear instead of one.

**Root Cause:** The rendering process wasn't clearing existing SVG content before rendering the new configuration.

**Solution:** Implemented centralized `radar_visualization.render()` method that handles SVG clearing automatically. This fix is now built into the core library and used by all demo pages.

## Testing Checklist

All pages have been updated! To verify the implementation:

1. ✅ All demo-*.html files now have Reset button
2. ✅ All pages use config merging on import
3. ✅ All pages clear SVG before re-rendering (no duplicate diagrams)
4. ⏳ Test each demo page individually (see Manual Test Checklist above)
5. ⏳ Run automated tests: `bun test`
6. ⏳ Run linting: `npm run lint:js && npm run lint:html`
7. ⏳ Update screenshots if needed: `bun run screenshot`

## Quick Test

To quickly verify the functionality on your local server:

```bash
# Start the development server (if not already running)
bun start

# Then visit these URLs:
http://localhost:3000/demo-2x4.html
http://localhost:3000/demo-3x4.html
http://localhost:3000/demo-4x8.html
http://localhost:3000/demo-5x4.html
http://localhost:3000/demo-6x5.html
http://localhost:3000/demo-7x4.html
http://localhost:3000/demo-8x8.html
http://localhost:3000/ai.html
http://localhost:3000/index.html
```

Each page should now have:
- 📥 Import button (file-import icon)
- 📤 Export button (file-export icon)
- 🔄 Reset button (undo icon)

## API Reference

### radar_visualization.render(config)

Centralized render method that clears existing SVG content before rendering.

**Parameters:**
- `config` (object) - Radar configuration object

**Returns:**
- `config` (object) - The config that was rendered (for chaining)

**Features:**
- Automatically clears existing SVG content
- Uses `config.svg_id` or defaults to 'radar'
- Prevents duplicate diagrams on re-render

**Example:**
```javascript
let currentConfig = null;
function renderRadar(config) {
  currentConfig = config;
  radar_visualization.render(config);
}

// Or use directly
radar_visualization.render({
  svg_id: 'radar',
  title: 'Tech Radar',
  entries: [...],
  // ... other config
});
```

### initDemoToolbar(options)

Initialize toolbar with import/export/reset functionality.

**Parameters:**
- `demoSlug` (string) - Unique identifier for filename
- `getCurrentConfig` (function) - Returns current config
- `onConfigImport` (function) - Called when config imported
- `onConfigReset` (function) - Called when reset triggered
- `initialConfig` (object) - Initial config for reset
- `jsonIO` (object) - JSON I/O helpers from `radar_visualization.jsonIO`

**Example:**
```javascript
radar_visualization.initDemoToolbar({
  demoSlug: "demo-3x4",
  getCurrentConfig: () => currentConfig,
  onConfigImport: config => renderRadar(config),
  onConfigReset: config => renderRadar(config),
  initialConfig: initialConfig,
  jsonIO: radar_visualization.jsonIO,
});
```
