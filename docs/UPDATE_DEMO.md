# Demo Pages Upgrade Plan

## 1. JSON Import/Export Everywhere
- **Scope**: All demo entry points under `docs/` (index, builder, specialized examples).
- **Todo**:
  - [x] Extract shared helpers in `src/integration/json-io.js` (bundled into `radar_visualization`) with `importConfig(fileInput, applyConfig)` and `exportConfig(button, currentConfigProvider)`.
  - [x] Add toolbar CSS styles to `radar.css` for consistent UI across all demos.
  - [x] Embed toolbar controls in `index.html` with full import/export functionality.
  - [x] Embed toolbar controls in `demo-2x4.html` with full import/export functionality.
  - [ ] Embed toolbar controls in remaining demos: `demo-3x4.html`, `demo-4x8.html`, `demo-5x4.html`, `demo-6x5.html`, `demo-7x4.html`, `demo-8x8.html`.
  - [x] Add user-friendly error handling for malformed JSON and name downloads `<demoSlug>-<timestamp>.json`.
- **Validation**:
  - [x] Bun unit tests covering helper behavior with mocked `FileReader`.
  - [ ] Manual smoke verification that configs round-trip across all demos.

## 2. Local Storage Customization
- **Scope**: Persist per-demo overrides so users can edit radars locally.
- **Todo**:
  - [ ] Implement schema `{ version, updatedAt, config }` stored under `techRadarConfig:<demoSlug>`.
  - [ ] Hydrate on load when schema version matches; otherwise fall back to defaults and show a notice.
  - [ ] Route all updates through `updateConfig(nextConfig)` that validates, re-renders, writes to storage, powers “Reset to defaults”, and feeds JSON import/export.
- **Validation**:
  - [ ] Vitest tests covering read/write/reset flows plus private-mode failures.
  - [ ] README/demo documentation describing persistence behavior.

## 3. Light/Dark Theme Support
- **Scope**: Introduce two palettes for both UI chrome and SVG rendering.
- **Todo**:
  - [ ] Define CSS variables guarded by `:root[data-theme="light"]` and `:root[data-theme="dark"]`.
  - [ ] Provide a theme toggle honoring `prefers-color-scheme` initially and persisting the selection.
  - [ ] Thread theme colors through `radar_visualization` so toggling re-renders blips, rings, and legend.
  - [ ] Teach `screenshot.ts` to capture both palettes.
- **Validation**:
  - [ ] Contrast/accessibility review for each theme.
  - [ ] Automated smoke tests (Playwright/Vitest) asserting DOM attribute changes.
  - [ ] Manual visual QA on representative demos.

## 4. Embedded Layout CSS + Customization Hooks
- **Scope**: Ensure the bundle contains only essential layout rules while empowering users to restyle via classes.
- **Todo**:
  - [ ] Separate `docs/radar.css` into layout vs. theme rules; inline layout rules via namespaced style injection inside `src/index.js`.
  - [ ] Introduce semantic CSS hooks (`radar-blip`, `radar-legend`, `radar-ring`, etc.) across the SVG/DOM.
  - [ ] Limit external CSS to theme variables and document override patterns.
  - [ ] Update `build.ts` to minify/embed the injected CSS snippet.
- **Validation**:
  - [ ] Unit tests confirming style injection executes once.
  - [ ] Manual validation that `radar.js` renders correctly standalone.
  - [ ] Docs detailing customization examples.

## 5. Scale Control UI
- **Scope**: Give users interactive control over the radar’s scale on every demo.
- **Todo**:
  - [ ] Add slider/stepper (0.5–1.5) plus reset + label into the shared toolbar.
  - [ ] Connect slider to the `radar_visualization` `scale` option with debounced writes and persistence.
  - [ ] Preserve automatic downscaling until users interact; after manual change, respect user value.
- **Validation**:
  - [ ] DOM/unit tests verifying slider updates SVG dimensions.
  - [ ] Manual QA covering persistence + reset flows.

## 6. Contextual Quadrant Add Buttons
- **Scope**: Improve discoverability of per-quadrant additions without crowding the UI.
- **Todo**:
  - [ ] Add quadrant legend `+` controls that appear while holding the configured modifier key (`Ctrl` default).
  - [ ] Listen for modifier shortcuts globally, provide alternative keyboard accessibility, and toggle button visibility.
  - [ ] Prefill new-entry forms with quadrant/ring defaults when triggered from a contextual button.
  - [ ] Ensure local-storage persistence immediately captures new entries.
- **Validation**:
  - [ ] Unit tests for modifier detection + accessibility shortcut logic.
  - [ ] UI tests checking button visibility behavior.
  - [ ] Manual QA verifying prefilled quadrant flow across demos.
