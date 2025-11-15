# Tech Radar API Refactoring - Instance-Based Pattern

**Version:** 2025.11.2  
**Date:** November 15, 2025

## Overview

The Tech Radar API has been refactored from a static/procedural approach to a clean instance-based pattern. This provides better encapsulation, clearer separation of concerns, and more intuitive usage.

## Core Principles

1. **Users operate only with `radar_visualization` and its properties** - Single entry point
2. **`radar_visualization(config)` returns an instance** - Factory pattern
3. **Capabilities are assigned to instances** - Composable behaviors
4. **Storage is configurable** - In-memory by default, can use localStorage, sessionStorage, etc.

## New API Pattern

### Creating an Instance

```javascript
// Create a radar instance
const instance = radar_visualization(config);

// The radar is immediately rendered on the page
// Returns an instance object with methods
```

### Instance Methods

```javascript
// Get current configuration
const currentConfig = instance.getConfig();

// Render with new configuration (merges with current)
instance.render(newConfig);

// Reset to initial configuration
instance.reset();

// Method chaining is supported
instance.render({ title: 'Updated' }).reset();
```

### Assigning Capabilities

```javascript
// Assign import/export capability
instance.importExport = radar_visualization.jsonIO;

// Assign persistent storage (future feature)
instance.persistentStorage = radar_visualization.localStorageIO;
```

## Complete Example (AI Tech Radar)

```javascript
// Define initial configuration
const initialConfig = {
  svg_id: "radar",
  title: "AI Tech Radar (2025-11)",
  quadrants: [
    { name: "Core AI Providers" },
    { name: "AI Coding Tools" },
    { name: "RAG & Retrieval" },
    { name: "Databases" },
  ],
  rings: [
    { name: "ADOPT", color: "#5ba300" },
    { name: "TRIAL", color: "#009eb0" },
    { name: "ASSESS", color: "#c7ba00" },
    { name: "HOLD", color: "#e09b96" },
    { name: "WATCH", color: "#bb6bd9" },
    { name: "AVOID", color: "#e09b96" },
  ],
  entries: [
    { label: "OpenAI", quadrant: 0, ring: 0, moved: 0, active: true },
    { label: "Windsurf", quadrant: 1, ring: 1, moved: 2, active: true },
    // ... more entries
  ],
};

// Create instance
const radarInstance = radar_visualization(initialConfig);

// Assign capabilities
radarInstance.importExport = radar_visualization.jsonIO;

// Initialize and assign toolbar (automatic wiring)
radarInstance.toolbar = radar_visualization.initDemoToolbar(radarInstance, { 
  demoSlug: "ai-demo" 
});
// Toolbar is now automatically wired to instance methods!
// Only override if you need custom behavior:
// radarInstance.toolbar.onConfigImport = customConfig => { /* custom logic */ };

// Use instance methods
radarInstance.getConfig();  // Returns current config
radarInstance.render({ title: "Updated Title" });  // Update and re-render
radarInstance.reset();  // Reset to initial config
```

## Integration with Toolbar

The toolbar follows the instance-based pattern with **automatic wiring**:

```javascript
// Initialize and assign toolbar - automatically wires to instance
radarInstance.toolbar = radar_visualization.initDemoToolbar(radarInstance, { 
  demoSlug: "ai-demo" 
});

// That's it! The toolbar is now fully functional with:
// - Import button → calls radarInstance.render(config)
// - Reset button → calls radarInstance.reset()
// - Export button → calls radarInstance.getConfig()

// Only override if you need custom behavior:
radarInstance.toolbar.onConfigImport = customConfig => {
  // Your custom import logic
  console.log('Custom import:', customConfig);
  radarInstance.render(customConfig);
};

// Optional: Show custom messages
radarInstance.toolbar.showMessage('Custom message', 'info');

// Optional: Cleanup when done
radarInstance.toolbar.cleanup();
```

## Static Helpers (Available for Assignment)

### radar_visualization.jsonIO

Import/export helpers for JSON configuration files.

```javascript
// Assign to instance
instance.importExport = radar_visualization.jsonIO;

// Or use directly (advanced usage)
const jsonIO = radar_visualization.jsonIO;
jsonIO.exportConfig(button, () => instance.getConfig(), options);
jsonIO.importConfig(input, config => instance.render(config), options);
```

### radar_visualization.initDemoToolbar(radarInstance, options)

Helper to initialize the import/export/reset toolbar with automatic wiring.

**Parameters:**
- `radarInstance` (Object|null) - Radar instance to automatically wire to (pass instance for auto-wiring)
- `options.demoSlug` (string) - Unique identifier for export filename (default: 'tech-radar')

**Returns:** Toolbar instance with configurable properties

**Automatic Wiring:**
When `radarInstance` is provided, the toolbar automatically sets:
- `toolbar.getCurrentConfig = () => radarInstance.getConfig()`
- `toolbar.onConfigImport = config => radarInstance.render(config)`
- `toolbar.onConfigReset = () => radarInstance.reset()`

**Example:**
```javascript
// Automatic wiring (recommended)
radarInstance.toolbar = radar_visualization.initDemoToolbar(radarInstance, { 
  demoSlug: "my-radar" 
});

// Manual wiring (if no instance provided or custom behavior needed)
const toolbar = radar_visualization.initDemoToolbar(null, { demoSlug: "custom" });
toolbar.getCurrentConfig = () => getConfigSomehow();
toolbar.onConfigImport = config => doSomethingCustom(config);
toolbar.onConfigReset = () => resetSomehow();
```

### radar_visualization.render (Backward Compatibility)

Static render method for backward compatibility.

```javascript
// Old pattern (still works)
radar_visualization.render(config);

// New pattern (preferred)
const instance = radar_visualization(config);
instance.render(newConfig);
```

## Benefits of New API

### 1. **Clear Separation of Concerns**

```javascript
// Configuration data (static)
const config = { title: "Tech Radar", entries: [...] };

// Runtime instance (dynamic)
const instance = radar_visualization(config);
```

### 2. **Encapsulation**

```javascript
// Each instance manages its own state
const radar1 = radar_visualization(config1);
const radar2 = radar_visualization(config2);

// Independent configurations
radar1.render({ title: "Radar 1" });
radar2.render({ title: "Radar 2" });
```

### 3. **Composable Behaviors**

```javascript
// Assign only the capabilities you need
instance.importExport = radar_visualization.jsonIO;

// Future: Add storage
instance.persistentStorage = radar_visualization.localStorageIO;

// Future: Add custom behaviors
instance.analytics = customAnalyticsPlugin;
```

### 4. **Intuitive Method Chaining**

```javascript
radar_visualization(config)
  .render({ title: "Updated" })
  .reset();
```

### 5. **Better Testing**

```javascript
// Easy to mock and test
const instance = radar_visualization(testConfig);
expect(instance.getConfig()).toEqual(testConfig);
instance.render({ title: "Test" });
expect(instance.getConfig().title).toBe("Test");
```

## Migration Guide

### Old Pattern (Procedural)

```javascript
let currentConfig = null;

function renderRadar(config) {
  currentConfig = config;
  radar_visualization.render(config);
}

renderRadar(initialConfig);

// Import
onImport(config => renderRadar(config));

// Reset
onReset(() => renderRadar(initialConfig));
```

### New Pattern (Instance-Based)

```javascript
// Create instance
const radarInstance = radar_visualization(initialConfig);

// Assign capabilities
radarInstance.importExport = radar_visualization.jsonIO;

// Import
onImport(config => radarInstance.render(config));

// Reset
onReset(() => radarInstance.reset());
```

## Backward Compatibility

The old pattern still works because:

1. `radar_visualization(config)` immediately renders (even though it returns an instance)
2. `radar_visualization.render(config)` static method is maintained
3. Existing code that doesn't use the return value continues to work

```javascript
// This still works (renders immediately, ignores return value)
radar_visualization(config);

// This also still works
radar_visualization.render(config);

// But the new pattern is preferred
const instance = radar_visualization(config);
instance.render(newConfig);
```

## Future Enhancements

### Persistent Storage API

```javascript
// LocalStorage implementation (to be added)
instance.persistentStorage = radar_visualization.localStorageIO;

// Auto-save on config changes
instance.autoSave = true;

// Restore from storage
instance.restore();
```

### Event System

```javascript
// Listen to events
instance.on('render', config => console.log('Rendered:', config));
instance.on('import', config => console.log('Imported:', config));
instance.on('reset', () => console.log('Reset to initial state'));
```

### Multiple Instances

```javascript
// Multiple radars on same page
const mainRadar = radar_visualization(mainConfig);
const comparisonRadar = radar_visualization(comparisonConfig);

// Independent operations
mainRadar.render({ title: "Main" });
comparisonRadar.render({ title: "Comparison" });
```

## API Reference

### Factory Function

**`radar_visualization(config)`**

Creates and returns a Tech Radar instance.

- **Parameters:** `config` (Object) - Initial radar configuration
- **Returns:** Instance object with methods
- **Side Effect:** Immediately renders the radar to the DOM

### Instance Methods

**`instance.getConfig()`**

Returns a copy of the current configuration.

- **Returns:** Object - Current configuration

**`instance.render(newConfig)`**

Updates configuration and re-renders the radar.

- **Parameters:** `newConfig` (Object) - New configuration (merged with current)
- **Returns:** Instance (for chaining)

**`instance.reset()`**

Resets to initial configuration and re-renders.

- **Returns:** Instance (for chaining)

### Instance Properties

**`instance.importExport`**

Import/export capability (assign `radar_visualization.jsonIO`).

- **Type:** Object | null
- **Default:** null

**`instance.persistentStorage`**

Persistent storage capability (to be implemented).

- **Type:** Object | null
- **Default:** null

**`instance.toolbar`**

Toolbar instance for import/export/reset UI (assign `radar_visualization.initDemoToolbar(...)`).

- **Type:** Object | null
- **Default:** null

### Toolbar Instance Properties

When you assign a toolbar: `instance.toolbar = radar_visualization.initDemoToolbar({...})`

**`toolbar.getCurrentConfig`**

Function to get current configuration.

- **Type:** Function | null
- **Default:** `() => radarInstance.getConfig()` (if instance provided), otherwise `null`
- **Override Example:** `toolbar.getCurrentConfig = () => getCustomConfig()`

**`toolbar.onConfigImport`**

Callback when config is imported.

- **Type:** Function | null
- **Default:** `config => radarInstance.render(config)` (if instance provided), otherwise `null`
- **Override Example:** `toolbar.onConfigImport = config => { validate(config); instance.render(config); }`

**`toolbar.onConfigReset`**

Callback when reset is triggered.

- **Type:** Function | null
- **Default:** `() => radarInstance.reset()` (if instance provided), otherwise `null`
- **Override Example:** `toolbar.onConfigReset = () => { confirmReset(); instance.reset(); }`

**`toolbar.showMessage(message, state)`**

Show message in toolbar area.

- **Parameters:** 
  - `message` (string) - Message to display
  - `state` (string) - 'info', 'success', or 'error'
- **Returns:** void

**`toolbar.cleanup()`**

Cleanup toolbar event listeners and resources.

- **Returns:** void

## Examples by Use Case

### Simple Static Radar

```javascript
radar_visualization({
  title: "Tech Radar",
  entries: [/*...*/],
});
```

### Interactive Radar with Import/Export

```javascript
const instance = radar_visualization(config);
instance.importExport = radar_visualization.jsonIO;

// Setup toolbar with automatic wiring
instance.toolbar = radar_visualization.initDemoToolbar(instance, { 
  demoSlug: "my-radar" 
});

// Done! Toolbar is fully functional.
// Override only if custom behavior needed:
// instance.toolbar.onConfigImport = config => { /* custom logic */ };
```

### Dynamic Configuration Updates

```javascript
const instance = radar_visualization(initialConfig);

// Update title only
instance.render({ title: "Updated Title" });

// Add new entries
const newEntries = [...instance.getConfig().entries, newEntry];
instance.render({ entries: newEntries });

// Reset if needed
instance.reset();
```

## Testing the New API

Visit the updated demo page to see the new pattern in action:

```
http://localhost:3000/ai.html
```

All other pages maintain backward compatibility and will be updated gradually.

## Summary

The new instance-based API provides:

- ✅ **Clear separation** between static configuration and runtime instance
- ✅ **Composable behaviors** via capability assignment (`importExport`, `toolbar`, `persistentStorage`)
- ✅ **Better encapsulation** with instance methods (`getConfig()`, `render()`, `reset()`)
- ✅ **Configurable properties** on sub-instances (e.g., `toolbar.onConfigImport`)
- ✅ **Intuitive usage** following common JavaScript patterns
- ✅ **Backward compatibility** with existing code
- ✅ **Future-proof** for additional features

### Key Design Principles

1. **User operates only with `radar_visualization` and its properties** - Single entry point
2. **Factory pattern** - `radar_visualization(config)` returns instance
3. **Capability assignment** - `instance.importExport = radar_visualization.jsonIO`
4. **Runtime configuration** - `instance.toolbar.onConfigImport = () => {...}`
5. **Storage flexibility** - Default in-memory, configurable for persistence

This architecture aligns with modern JavaScript best practices and provides a solid foundation for future enhancements.
