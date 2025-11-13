# Radar.js Refactoring Analysis

## Executive Summary

This document analyzes the current radar.js implementation and proposes refactoring strategies to improve:
- **Testability**: Make individual components unit-testable
- **Maintainability**: Reduce complexity and improve code organization
- **Browser Compatibility**: Maintain direct script injection capability

## Current Architecture Analysis

### Overview
- **File Size**: 875 lines
- **Main Function**: `radar_visualization(config)` - a monolithic function containing all logic
- **Dependencies**: D3.js v7, browser DOM
- **Current Coverage**: 86.42% (good, but could be better with proper separation)

### Structure Breakdown

```
radar_visualization(config)
├── Config Defaults & Validation (lines 26-77)
├── Helper Functions
│   ├── Random number generators (lines 79-93)
│   ├── Coordinate transformations (lines 213-227)
│   ├── Bounded calculations (lines 229-247)
│   └── Geometry calculations (lines 249-305)
├── Data Processing
│   ├── Quadrant/ring generation (lines 95-148)
│   ├── Entry positioning (lines 369-378)
│   ├── Entry segmentation (lines 380-391)
│   └── ID assignment (lines 393-415)
├── SVG Rendering
│   ├── Grid rendering (lines 502-549)
│   ├── Ring rendering (lines 551-557)
│   ├── Legend rendering (lines 625-670)
│   ├── Blip rendering (lines 734-790)
│   └── Interaction handlers (lines 696-732)
└── D3 Force Simulation (lines 799-808)
```

## Identified Issues

### 1. **Monolithic Function** 🔴 Critical
**Problem**: Single 850+ line function that does everything
- Difficult to test individual components
- High cyclomatic complexity
- Tight coupling between concerns
- Hard to reason about and modify

**Impact on Testing**:
- Cannot test config validation separately from rendering
- Cannot test coordinate math without DOM
- Cannot test data processing without D3
- Mock dependencies are difficult to inject

### 2. **Mixed Concerns** 🔴 Critical
**Problem**: Business logic, data processing, and DOM manipulation intertwined

Example (lines 369-378):
```javascript
// Data processing mixed with rendering concerns
for (var i = 0; i < config.entries.length; i++) {
  var entry = config.entries[i];
  entry.segment = segment(entry.quadrant, entry.ring);
  var point = entry.segment.random();
  entry.x = point.x;
  entry.y = point.y;
  entry.color = entry.active || config.print_layout ?
    config.rings[entry.ring].color : config.colors.inactive;
}
```

### 3. **Hidden Dependencies** 🟡 Medium
**Problem**: Functions depend on outer scope variables

Example (lines 307-367):
```javascript
function segment(quadrant, ring) {
  // Uses: quadrants, rings, config, quadrant_bounds from outer scope
  var min_angle = quadrants[quadrant].radial_min * Math.PI;
  var base_inner_radius = ring === 0 ? 30 : rings[ring - 1].radius;
  // ... uses config.segment_radial_padding, etc.
}
```

**Impact**: Cannot test these functions in isolation

### 4. **Side Effects** 🟡 Medium
**Problem**: Functions modify input parameters

Example (lines 370-378):
```javascript
// Mutates entry objects directly
entry.segment = segment(entry.quadrant, entry.ring);
entry.x = point.x;
entry.y = point.y;
entry.color = ...;
```

### 5. **Hard-coded D3 Selectors** 🟡 Medium
**Problem**: Direct DOM manipulation throughout

Example (line 437):
```javascript
var svg = d3.select("svg#" + config.svg_id)
```

**Impact**: Requires full DOM and D3 setup for any test

### 6. **Magic Numbers** 🟢 Low
**Problem**: Unexplained constants scattered throughout

Examples:
- `var seed = 42;` (line 81)
- `base_inner_radius = ring === 0 ? 30 : ...` (line 310)
- `var padding = 20;` (line 294)
- `baseY = -outer_radius + 80;` (line 184)

### 7. **Inconsistent Variable Declarations** 🟢 Low
**Problem**: Mix of `var`, `let`, and `const`

Examples:
- `var` used predominantly (old style)
- `const` used for some arrays (lines 97-98)
- `let` used in some loops (line 102)

## Proposed Refactoring Strategy

### Phase 1: Extract Pure Functions (Low Risk) ✅

**Goal**: Extract functions with no side effects or external dependencies

#### 1.1 Configuration Module
```javascript
// config/defaults.js
export const CONFIG_DEFAULTS = {
  svg_id: 'radar',
  width: 1450,
  height: 1000,
  colors: {
    background: '#fff',
    grid: '#dddde0',
    inactive: '#ddd'
  },
  // ... all defaults
};

export function applyDefaults(userConfig) {
  return {
    ...CONFIG_DEFAULTS,
    ...userConfig,
    colors: { ...CONFIG_DEFAULTS.colors, ...(userConfig.colors || {}) }
  };
}
```

**Benefits**:
- Easy to test defaults application
- Clear documentation of all options
- Single source of truth

#### 1.2 Validation Module
```javascript
// validation/config-validator.js
export class ConfigValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.field = field;
    this.value = value;
    this.name = 'ConfigValidationError';
  }
}

export function validateConfig(config) {
  const errors = [];

  if (!config.quadrants || config.quadrants.length < 2 || config.quadrants.length > 8) {
    errors.push(new ConfigValidationError(
      `Number of quadrants must be between 2 and 8 (found: ${config.quadrants?.length || 0})`,
      'quadrants',
      config.quadrants?.length
    ));
  }

  if (!config.rings || config.rings.length < 4 || config.rings.length > 8) {
    errors.push(new ConfigValidationError(
      `Number of rings must be between 4 and 8 (found: ${config.rings?.length || 0})`,
      'rings',
      config.rings?.length
    ));
  }

  // Validate entries
  config.entries?.forEach((entry, index) => {
    if (entry.quadrant < 0 || entry.quadrant >= config.quadrants.length) {
      errors.push(new ConfigValidationError(
        `Entry '${entry.label}' has invalid quadrant: ${entry.quadrant}`,
        `entries[${index}].quadrant`,
        entry.quadrant
      ));
    }
    if (entry.ring < 0 || entry.ring >= config.rings.length) {
      errors.push(new ConfigValidationError(
        `Entry '${entry.label}' has invalid ring: ${entry.ring}`,
        `entries[${index}].ring`,
        entry.ring
      ));
    }
  });

  if (errors.length > 0) {
    throw errors[0]; // Throw first error for backward compatibility
  }

  return true;
}
```

**Benefits**:
- Complete test coverage for validation logic
- Better error messages with structured data
- Can be tested without any rendering

#### 1.3 Math Utilities Module
```javascript
// math/coordinates.js
export function polar(cartesian) {
  const { x, y } = cartesian;
  return {
    t: Math.atan2(y, x),
    r: Math.sqrt(x * x + y * y)
  };
}

export function cartesian(polar) {
  const { r, t } = polar;
  return {
    x: r * Math.cos(t),
    y: r * Math.sin(t)
  };
}

export function boundedInterval(value, min, max) {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.min(Math.max(value, low), high);
}

export function boundedRing(polar, r_min, r_max) {
  return {
    t: polar.t,
    r: boundedInterval(polar.r, r_min, r_max)
  };
}

export function boundedBox(point, min, max) {
  return {
    x: boundedInterval(point.x, min.x, max.x),
    y: boundedInterval(point.y, min.y, max.y)
  };
}
```

**Benefits**:
- 100% testable with simple unit tests
- No dependencies
- Can be reused in other projects

#### 1.4 Random Number Generator Module
```javascript
// math/random.js
export class SeededRandom {
  constructor(seed = 42) {
    this.seed = seed;
  }

  next() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  between(min, max) {
    return min + this.next() * (max - min);
  }

  normalBetween(min, max) {
    return min + (this.next() + this.next()) * 0.5 * (max - min);
  }

  reset(seed) {
    this.seed = seed;
  }
}
```

**Benefits**:
- Testable with deterministic output
- Can inject different seeds for testing
- Encapsulates random state

### Phase 2: Extract Data Processing (Medium Risk) ⚠️

#### 2.1 Quadrant Calculator
```javascript
// geometry/quadrant-calculator.js
export function generateQuadrants(numQuadrants) {
  const quadrants = [];
  const anglePerQuadrant = 2 / numQuadrants;
  const rotationOffset = (numQuadrants === 2) ? -0.5 : 0;

  for (let i = 0; i < numQuadrants; i++) {
    const startAngle = -1 + (i * anglePerQuadrant) + rotationOffset;
    const endAngle = -1 + ((i + 1) * anglePerQuadrant) + rotationOffset;
    const midAngle = (-Math.PI + (i + 0.5) * anglePerQuadrant * Math.PI) +
                     (rotationOffset * Math.PI);

    quadrants.push({
      radial_min: startAngle,
      radial_max: endAngle,
      factor_x: Math.cos(midAngle),
      factor_y: Math.sin(midAngle)
    });
  }

  return quadrants;
}

export function computeQuadrantBounds(startAngle, endAngle, radius) {
  // ... (extract existing function)
}
```

#### 2.2 Ring Calculator
```javascript
// geometry/ring-calculator.js
const BASE_PATTERN = [130, 220, 310, 400];
const MAX_BASE_RADIUS = 400;

export function generateRings(numRings, targetOuterRadius) {
  const ringTemplate = [];

  if (numRings === 4) {
    ringTemplate.push(...BASE_PATTERN);
  } else {
    for (let i = 0; i < numRings; i++) {
      const patternPosition = (i / (numRings - 1)) * 3;
      const patternIndex = Math.floor(patternPosition);
      const fraction = patternPosition - patternIndex;

      let radius;
      if (patternIndex >= 3) {
        radius = MAX_BASE_RADIUS;
      } else {
        radius = BASE_PATTERN[patternIndex] +
                 (BASE_PATTERN[patternIndex + 1] - BASE_PATTERN[patternIndex]) * fraction;
      }

      ringTemplate.push(radius);
    }
  }

  const radiusScale = targetOuterRadius / MAX_BASE_RADIUS;
  return ringTemplate.map(r => ({
    radius: Math.max(10, Math.round(r * radiusScale))
  }));
}
```

#### 2.3 Entry Processor
```javascript
// processing/entry-processor.js
import { SeededRandom } from '../math/random.js';

export class EntryProcessor {
  constructor(config, quadrants, rings, quadrantBounds) {
    this.config = config;
    this.quadrants = quadrants;
    this.rings = rings;
    this.quadrantBounds = quadrantBounds;
    this.random = new SeededRandom(config.seed || 42);
  }

  processEntries(entries) {
    // Position entries
    const positionedEntries = entries.map(entry =>
      this.positionEntry(entry)
    );

    // Segment entries
    const segmented = this.segmentEntries(positionedEntries);

    // Assign IDs
    const withIds = this.assignIds(segmented);

    return withIds;
  }

  positionEntry(entry) {
    const segment = this.createSegment(entry.quadrant, entry.ring);
    const point = segment.random();

    return {
      ...entry,
      segment,
      x: point.x,
      y: point.y,
      color: this.getEntryColor(entry)
    };
  }

  getEntryColor(entry) {
    return (entry.active || this.config.print_layout)
      ? this.config.rings[entry.ring].color
      : this.config.colors.inactive;
  }

  // ... other methods
}
```

**Benefits**:
- Clear separation of data processing from rendering
- Testable without DOM
- Can inject mock random generator for deterministic tests

### Phase 3: Extract Rendering (Higher Risk) ⚠️⚠️

#### 3.1 Renderer Interface
```javascript
// rendering/renderer-interface.js
export class RadarRenderer {
  constructor(d3Instance, config) {
    this.d3 = d3Instance;
    this.config = config;
  }

  render(processedData) {
    this.renderGrid(processedData);
    this.renderRings(processedData);
    this.renderBlips(processedData);
    this.renderLegend(processedData);
    this.attachInteractions(processedData);
    this.applyForceSimulation(processedData);
  }

  renderGrid(data) { /* ... */ }
  renderRings(data) { /* ... */ }
  renderBlips(data) { /* ... */ }
  renderLegend(data) { /* ... */ }
  attachInteractions(data) { /* ... */ }
  applyForceSimulation(data) { /* ... */ }
}
```

**Benefits**:
- Rendering logic separated from data processing
- Can mock D3 for testing
- Can create alternative renderers (Canvas, WebGL, SVG)

### Phase 4: Main Entry Point (Orchestration)

#### 4.1 Refactored radar_visualization
```javascript
// index.js
import { applyDefaults } from './config/defaults.js';
import { validateConfig } from './validation/config-validator.js';
import { generateQuadrants } from './geometry/quadrant-calculator.js';
import { generateRings } from './geometry/ring-calculator.js';
import { EntryProcessor } from './processing/entry-processor.js';
import { RadarRenderer } from './rendering/renderer.js';

export function radar_visualization(userConfig) {
  // 1. Apply defaults
  const config = applyDefaults(userConfig);

  // 2. Validate configuration
  validateConfig(config);

  // 3. Calculate geometry
  const quadrants = generateQuadrants(config.quadrants.length);
  const rings = generateRings(config.rings.length, config.target_outer_radius);
  const quadrantBounds = quadrants.map(q =>
    computeQuadrantBounds(q.radial_min * Math.PI, q.radial_max * Math.PI, rings[rings.length - 1].radius)
  );

  // 4. Process entries
  const processor = new EntryProcessor(config, quadrants, rings, quadrantBounds);
  const processedData = processor.processEntries(config.entries);

  // 5. Render
  const renderer = new RadarRenderer(d3, config);
  renderer.render({
    config,
    quadrants,
    rings,
    quadrantBounds,
    entries: processedData
  });
}

// Browser compatibility - make available globally
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = radar_visualization;
}
if (typeof window !== 'undefined') {
  window.radar_visualization = radar_visualization;
}
```

**Benefits**:
- Clear flow: validate → calculate → process → render
- Each step is independently testable
- Easy to understand and modify
- Maintains backward compatibility

## Migration Strategy

### Option A: Gradual Refactoring (Recommended)
**Approach**: Extract modules incrementally while maintaining backward compatibility

**Steps**:
1. **Week 1-2**: Extract pure functions (math, validation)
   - Create new modules alongside existing code
   - Add comprehensive tests for new modules
   - No breaking changes

2. **Week 3-4**: Extract data processing
   - Create EntryProcessor class
   - Test with existing radar_visualization
   - Verify identical output

3. **Week 5-6**: Extract rendering
   - Create RadarRenderer class
   - Test rendering separately
   - Ensure visual regression tests pass

4. **Week 7**: Integration
   - Refactor main function to use new modules
   - Run full test suite
   - Performance testing

5. **Week 8**: Cleanup & documentation
   - Remove old code
   - Update documentation
   - Final testing

**Risk**: Low - Incremental changes with continuous validation

### Option B: Big Bang Refactoring
**Approach**: Rewrite entire module at once

**Pros**:
- Clean slate
- Optimal architecture from start
- No legacy code concerns

**Cons**:
- High risk of breaking changes
- Long period without user-facing improvements
- Difficult to validate correctness
- May miss edge cases from original implementation

**Recommendation**: ❌ Not recommended

### Option C: Parallel Implementation
**Approach**: Create new implementation alongside old one

**Steps**:
1. Create `radar-v2.js` with new architecture
2. Add feature flag to choose version
3. Migrate users gradually
4. Remove old version when stable

**Pros**:
- Zero risk to existing users
- Can test new version thoroughly
- Easy rollback

**Cons**:
- Maintaining two versions temporarily
- More complex testing matrix

**Recommendation**: ⚠️ Consider if backward compatibility is critical

## Browser Compatibility Strategy

### Challenge
Modern ES6 modules vs. browser script injection

### Solution: Build-Time Bundling

#### Development Structure (ES6 Modules)
```
src/
├── index.js                    # Main entry
├── config/
│   ├── defaults.js
│   └── validator.js
├── math/
│   ├── coordinates.js
│   └── random.js
├── geometry/
│   ├── quadrant-calculator.js
│   └── ring-calculator.js
├── processing/
│   └── entry-processor.js
└── rendering/
    └── renderer.js
```

#### Build Process
```bash
# Use esbuild or rollup to bundle
esbuild src/index.js \
  --bundle \
  --format=iife \
  --global-name=radar_visualization \
  --outfile=dist/radar.js \
  --minify

# Or with Bun
bun build src/index.js \
  --outfile=dist/radar.js \
  --format=iife \
  --global-name=radar_visualization \
  --minify
```

#### Output (IIFE for browser)
```javascript
// dist/radar.js
(function() {
  'use strict';
  // ... bundled code ...
  window.radar_visualization = radar_visualization;
})();
```

**Benefits**:
- Modern development with ES6 modules
- Full browser compatibility in production
- Tree-shaking removes unused code
- Maintains backward compatibility

## Testing Strategy for Refactored Code

### Unit Tests (High Coverage Target: 95%+)

#### Pure Functions (100% coverage achievable)
```javascript
// test/unit/math/coordinates.test.js
import { polar, cartesian } from '../../../src/math/coordinates.js';

describe('Coordinate Transformations', () => {
  test('polar converts cartesian correctly', () => {
    // GIVEN: a cartesian coordinate
    const point = { x: 1, y: 0 };

    // WHEN: converting to polar
    const result = polar(point);

    // THEN: should have correct angle and radius
    expect(result.t).toBeCloseTo(0);
    expect(result.r).toBeCloseTo(1);
  });

  test('cartesian converts polar correctly', () => {
    // GIVEN: a polar coordinate
    const point = { r: 1, t: 0 };

    // WHEN: converting to cartesian
    const result = cartesian(point);

    // THEN: should have correct x and y
    expect(result.x).toBeCloseTo(1);
    expect(result.y).toBeCloseTo(0);
  });

  test('conversions are reversible', () => {
    // GIVEN: a cartesian point
    const original = { x: 3, y: 4 };

    // WHEN: converting to polar and back
    const result = cartesian(polar(original));

    // THEN: should match original
    expect(result.x).toBeCloseTo(original.x);
    expect(result.y).toBeCloseTo(original.y);
  });
});
```

#### Validation (100% coverage)
```javascript
// test/unit/validation/config-validator.test.js
import { validateConfig, ConfigValidationError } from '../../../src/validation/config-validator.js';

describe('Config Validation', () => {
  test('throws error for invalid quadrant count', () => {
    // GIVEN: config with 1 quadrant
    const config = {
      quadrants: [{ name: 'Q1' }],
      rings: Array(4).fill({ name: 'R', color: '#000' })
    };

    // WHEN/THEN: validation should throw
    expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    expect(() => validateConfig(config)).toThrow(/quadrants must be between 2 and 8/);
  });

  test('provides structured error information', () => {
    const config = { quadrants: [{ name: 'Q1' }], rings: [] };

    try {
      validateConfig(config);
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigValidationError);
      expect(error.field).toBe('quadrants');
      expect(error.value).toBe(1);
    }
  });
});
```

### Integration Tests (Target: 90%+)

#### Entry Processing
```javascript
// test/integration/entry-processor.test.js
import { EntryProcessor } from '../../src/processing/entry-processor.js';
import { generateQuadrants } from '../../src/geometry/quadrant-calculator.js';
import { generateRings } from '../../src/geometry/ring-calculator.js';

describe('Entry Processor Integration', () => {
  test('processes entries with deterministic positioning', () => {
    // GIVEN: standard configuration
    const config = createTestConfig();
    const quadrants = generateQuadrants(4);
    const rings = generateRings(4, 400);
    const processor = new EntryProcessor(config, quadrants, rings, bounds);

    const entries = [
      { label: 'Tech A', quadrant: 0, ring: 0, moved: 0, active: true },
      { label: 'Tech B', quadrant: 0, ring: 1, moved: 1, active: true }
    ];

    // WHEN: processing entries twice
    const result1 = processor.processEntries(entries);
    processor.random.reset(42); // Reset seed
    const result2 = processor.processEntries(entries);

    // THEN: positions should be identical (reproducible)
    expect(result1[0].x).toBe(result2[0].x);
    expect(result1[0].y).toBe(result2[0].y);
  });
});
```

### Visual Regression Tests

#### Screenshot Comparison
```javascript
// test/visual/radar-visual.test.js
import { test, expect } from '@playwright/test';

test('radar renders identically to baseline', async ({ page }) => {
  // GIVEN: radar configuration
  await page.goto('/test-configurations.html');

  // WHEN: radar is rendered
  await page.waitForSelector('svg#radar');

  // THEN: should match baseline screenshot
  await expect(page).toHaveScreenshot('radar-4x4.png', {
    maxDiffPixels: 100 // Allow minor anti-aliasing differences
  });
});
```

## Expected Outcomes

### Code Quality Metrics

| Metric | Before | After Target | Improvement |
|--------|--------|-------------|-------------|
| **Test Coverage** | 86% | 95%+ | +9% |
| **Lines of Code** | 875 (1 file) | ~1200 (15 files) | +37% (but modular) |
| **Cyclomatic Complexity** | ~50+ | <10 per function | -80% |
| **Testable Functions** | ~5% | ~80% | +75% |
| **Build Time** | N/A | <1s | Faster development |
| **Bundle Size** | 25KB | 22KB (minified) | -12% with tree-shaking |

### Maintainability Improvements

1. **Easier to Modify**
   - Change validation logic without touching rendering
   - Update coordinate math without DOM concerns
   - Add new features without breaking existing code

2. **Easier to Test**
   - Unit test each module independently
   - Mock dependencies easily
   - Faster test execution (no DOM for pure functions)

3. **Easier to Understand**
   - Clear module boundaries
   - Single responsibility per module
   - Self-documenting code structure

4. **Easier to Extend**
   - Add new renderers (Canvas, WebGL)
   - Create alternate positioning algorithms
   - Support additional geometry types

### Performance Considerations

**Potential Impacts**:
- ✅ Module bundling adds <0.1ms overhead (negligible)
- ✅ Class instantiation is ~10% slower than closure (acceptable)
- ❌ Multiple function calls could slow initialization by ~5%

**Mitigation**:
- Profile before/after with real-world data
- Optimize hot paths if needed
- Consider memoization for expensive calculations

## Risks and Mitigation

### Risk 1: Breaking Changes
**Severity**: High
**Mitigation**:
- Maintain backward compatibility during migration
- Comprehensive regression testing
- Visual regression tests for rendering
- Gradual rollout with feature flags

### Risk 2: Performance Regression
**Severity**: Medium
**Mitigation**:
- Benchmark before/after
- Profile with large datasets (1000+ entries)
- Optimize if >10% slower
- Consider performance budget

### Risk 3: Increased Complexity
**Severity**: Low
**Mitigation**:
- Clear documentation
- Module dependency diagram
- Example usage for each module
- Migration guide for developers

### Risk 4: Build Tooling Required
**Severity**: Low
**Mitigation**:
- Use zero-config bundler (Bun, esbuild)
- Provide pre-built browser version
- Document build process clearly
- CI/CD integration

## Recommendations

### Immediate Actions (Do Now)

1. ✅ **Extract Math Utilities** (1-2 days)
   - Zero risk
   - Immediate test coverage improvement
   - Foundation for further refactoring

2. ✅ **Extract Validation** (1 day)
   - Easy to test
   - Better error messages
   - No rendering dependencies

3. ✅ **Add Visual Regression Tests** (2-3 days)
   - Safety net for refactoring
   - Catch rendering bugs early
   - Already have screenshot infrastructure

### Short-Term Actions (Next Sprint)

4. **Extract Random Generator** (1 day)
   - Testable randomness
   - Injectable for deterministic tests

5. **Extract Quadrant/Ring Calculators** (2-3 days)
   - Pure functions
   - Easy to test
   - Significant complexity reduction

### Medium-Term Actions (Next Month)

6. **Extract Entry Processor** (1 week)
   - Separates data processing from rendering
   - Major testability improvement

7. **Set Up Build Process** (2-3 days)
   - Enable modern module development
   - Maintain browser compatibility

8. **Create Module Structure** (1 week)
   - Organize extracted modules
   - Update imports in main file

### Long-Term Actions (Next Quarter)

9. **Extract Renderer** (2 weeks)
   - Requires careful testing
   - Enable alternate rendering strategies

10. **Complete Migration** (1 week)
    - Remove old code
    - Update documentation
    - Celebrate! 🎉

## Conclusion

The current radar.js implementation works well but has reached a complexity level where maintenance and testing are challenging. A gradual refactoring approach following the strategy outlined above will:

- **Improve testability** from 86% to 95%+ coverage
- **Reduce complexity** by 80% per function
- **Maintain browser compatibility** through build-time bundling
- **Enable future enhancements** with modular architecture
- **Minimize risk** through incremental changes

The recommended approach is **Option A: Gradual Refactoring** starting with pure functions (math utilities, validation) and progressively extracting more complex modules while maintaining comprehensive test coverage at each step.

**Estimated Timeline**: 8 weeks for complete refactoring
**Risk Level**: Low (with proper testing and gradual approach)
**Expected ROI**: High (improved maintainability, faster feature development, better test coverage)
