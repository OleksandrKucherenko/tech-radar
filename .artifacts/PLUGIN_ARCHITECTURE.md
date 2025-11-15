# Plugin-Based Architecture Proposal

## Overview

Move from hardcoded features to a flexible, plugin-based system where optional functionality is provided through composable plugins/adapters.

## Core Principle

**Separation of Concerns**: Core visualization logic remains pure, while optional features (storage, import/export, UI) are injected as plugins.

---

## Proposed API Design

### Option 1: Plugin Object Pattern

```javascript
radar_visualization({
  // Core config (required)
  svg_id: "radar",
  title: "My Radar",
  quadrants: [...],
  rings: [...],
  entries: [...],
  
  // Optional configuration
  colors: { ... },
  font_family: "Arial, Helvetica",
  
  // Plugin system (optional)
  plugins: {
    // Persistent storage plugin
    storage: {
      type: 'localStorage', // or 'indexedDB', 'sessionStorage', custom
      key: 'tech-radar-config',
      version: 1,
      
      // Optional: custom implementation
      save: (config) => { /* custom save logic */ },
      load: () => { /* custom load logic */ },
      clear: () => { /* custom clear logic */ }
    },
    
    // Import/Export plugin
    importExport: {
      enabled: true,
      formats: ['json'], // future: ['json', 'yaml', 'csv']
      fileNamePattern: '{slug}-{timestamp}',
      
      // Optional: custom handlers
      onImport: (config) => { /* pre-process */ return config; },
      onExport: (config) => { /* pre-process */ return config; }
    },
    
    // Toolbar UI plugin
    toolbar: {
      enabled: true,
      position: 'top-right', // or 'top-left', 'bottom-right', etc.
      buttons: ['import', 'export', 'reset', 'print'],
      
      // Optional: custom toolbar implementation
      render: (container, api) => { /* custom UI */ }
    }
  }
});
```

### Option 2: Function/Factory Pattern

```javascript
import { 
  localStoragePlugin, 
  jsonIOPlugin, 
  floatingToolbarPlugin 
} from './radar-plugins.js';

radar_visualization({
  svg_id: "radar",
  title: "My Radar",
  quadrants: [...],
  rings: [...],
  entries: [...],
  
  // Pass plugin instances
  use: [
    localStoragePlugin({ key: 'my-radar', autoSave: true }),
    jsonIOPlugin({ format: 'json', pretty: true }),
    floatingToolbarPlugin({ position: 'top-right' })
  ]
});
```

### Option 3: Builder Pattern (Fluent API)

```javascript
RadarBuilder
  .create({ svg_id: "radar" })
  .title("My Radar")
  .quadrants([...])
  .rings([...])
  .entries([...])
  .withStorage('localStorage', { key: 'radar-config' })
  .withImportExport('json')
  .withToolbar({ position: 'top-right' })
  .render();
```

---

## Plugin Interfaces

### Storage Plugin Interface

```typescript
interface StoragePlugin {
  type: 'localStorage' | 'indexedDB' | 'sessionStorage' | 'custom';
  
  // Lifecycle hooks
  save(config: RadarConfig): Promise<void> | void;
  load(): Promise<RadarConfig | null> | RadarConfig | null;
  clear(): Promise<void> | void;
  
  // Optional
  version?: number;
  migrate?(oldVersion: number, newVersion: number): Promise<void>;
}
```

### Import/Export Plugin Interface

```typescript
interface ImportExportPlugin {
  formats: string[];
  
  // Core methods
  export(config: RadarConfig, options?: ExportOptions): Blob | string;
  import(data: Blob | string): Promise<RadarConfig> | RadarConfig;
  
  // Optional hooks
  onBeforeExport?(config: RadarConfig): RadarConfig;
  onAfterImport?(config: RadarConfig): RadarConfig;
  validateImport?(data: unknown): boolean;
}
```

### Toolbar Plugin Interface

```typescript
interface ToolbarPlugin {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  buttons: string[];
  
  // Render method
  render(container: HTMLElement, api: ToolbarAPI): void | (() => void);
  
  // Optional
  style?: 'floating' | 'inline' | 'custom';
  customCSS?: string;
}

interface ToolbarAPI {
  importConfig: () => void;
  exportConfig: () => void;
  resetConfig: () => void;
  getCurrentConfig: () => RadarConfig;
  onConfigChange: (callback: (config: RadarConfig) => void) => void;
}
```

---

## Implementation Benefits

### 1. **Flexibility**
- Users choose only the features they need
- Easy to add custom implementations
- No bloat from unused features

### 2. **Testability**
- Plugins can be tested independently
- Mock plugins for testing core functionality
- Easier to isolate issues

### 3. **Extensibility**
- Third-party plugins possible
- Custom storage backends (e.g., Firebase, Supabase)
- Custom export formats (CSV, YAML, XML)
- Custom UI frameworks (React, Vue, Svelte components)

### 4. **Maintainability**
- Clear separation of concerns
- Single responsibility per plugin
- Easier to update individual features

---

## Migration Path

### Phase 1: Create Plugin System Infrastructure
- Define plugin interfaces
- Create plugin registry/manager
- Update core to support plugins

### Phase 2: Extract Existing Features to Plugins
- `localStorage` → `localStoragePlugin`
- JSON I/O → `jsonIOPlugin`
- Toolbar → `toolbarPlugin`

### Phase 3: Update Demos
- Show different plugin configurations
- Document plugin usage
- Provide plugin examples

### Phase 4: Future Plugins
- `indexedDBPlugin` - For large configurations
- `firebasePlugin` - Cloud sync
- `csvExportPlugin` - Export to CSV
- `themePlugin` - Dark mode, custom themes
- `analyticsPlugin` - Track radar interactions
- `collaborationPlugin` - Real-time multi-user editing

---

## Example: Current vs Plugin-Based

### Current Approach (Hardcoded)
```javascript
// Toolbar is always initialized
radar_visualization.initDemoToolbar({
  demoSlug: 'demo-3x4',
  getCurrentConfig: () => currentConfig,
  onConfigImport: (config) => renderRadar(config),
  jsonIO: radar_visualization.jsonIO
});
```

### Plugin Approach (Flexible)
```javascript
radar_visualization({
  svg_id: "radar",
  title: "3 Quadrants × 4 Rings",
  quadrants: [...],
  rings: [...],
  entries: [...],
  
  // Opt-in to features
  plugins: {
    storage: { type: 'localStorage', key: 'demo-3x4' },
    toolbar: { 
      enabled: true,
      features: ['import', 'export', 'reset']
    }
  }
});
```

---

## Recommendation

**Start with Option 1 (Plugin Object Pattern)** because:
- ✅ Most intuitive for JavaScript developers
- ✅ Easy to document and understand
- ✅ Familiar config-based approach
- ✅ Easy to make properties optional
- ✅ Good TypeScript support

**Then evolve to Option 2** for advanced users who want:
- Reusable plugin instances across multiple radars
- Custom plugin implementations
- More programmatic control

---

## Next Steps

1. **Gather Requirements**: What plugins do we need first?
2. **Design Interfaces**: Define plugin contracts
3. **Implement Core**: Plugin registry and lifecycle management
4. **Extract Features**: Convert toolbar, JSON I/O, storage to plugins
5. **Document**: Plugin development guide and examples
6. **Test**: Ensure backward compatibility

## Questions to Answer

1. Should plugins be optional dependencies or part of core bundle?
2. How to handle plugin dependencies (e.g., toolbar needs import/export)?
3. What's the plugin loading strategy (eager vs lazy)?
4. Should we support plugin composition/chaining?
5. How to handle plugin conflicts or priorities?
