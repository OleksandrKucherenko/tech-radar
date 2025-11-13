# Tech Radar Unit Tests

This directory contains comprehensive unit tests for the radar.js visualization library using Bun's built-in test runner.

## Running Tests

### Prerequisites
- [Bun runtime](https://bun.sh) must be installed

### Commands

```bash
# Run all tests
bun test

# Run tests with watch mode (re-run on file changes)
bun test --watch

# Run tests with coverage
bun test --coverage
```

## Test Coverage

The test suite covers all critical functionality to ensure the radar visualization works correctly and to prevent regressions:

### 1. Configuration Validation ✓
Tests that validate the configuration boundaries and rules:
- **Quadrant count validation** (2-8 quadrants)
  - ✓ Rejects < 2 quadrants
  - ✓ Rejects > 8 quadrants
  - ✓ Accepts 2 quadrants (minimum)
  - ✓ Accepts 8 quadrants (maximum)
- **Ring count validation** (4-8 rings)
  - ✓ Rejects < 4 rings
  - ✓ Rejects > 8 rings
  - ✓ Accepts 4 rings (minimum)
  - ✓ Accepts 8 rings (maximum)

### 2. Entry Validation ✓
Tests that ensure all entries have valid quadrant and ring indices:
- ✓ Rejects entries with invalid quadrant index (>= quadrants.length)
- ✓ Rejects entries with negative quadrant index
- ✓ Rejects entries with invalid ring index (>= rings.length)
- ✓ Rejects entries with negative ring index
- ✓ Accepts entries with valid quadrant and ring indices

### 3. Entry Positioning and Layout ✓
Tests that verify the automatic positioning algorithm:
- **ID Assignment**
  - ✓ Assigns sequential IDs to all entries
  - ✓ IDs are unique across all entries
  - ✓ IDs are strings containing numbers
- **Sorting**
  - ✓ Entries are sorted alphabetically within the same quadrant/ring
- **Coordinate Assignment**
  - ✓ All entries receive x,y coordinates
  - ✓ Coordinates are finite numbers
- **Color Assignment**
  - ✓ Active entries get ring color
  - ✓ Inactive entries get inactive color (when print_layout is false)
  - ✓ All entries get ring color in print_layout mode

### 4. Reproducible Positioning ✓
Tests the seeded random number generator:
- ✓ Same configuration produces identical positions across runs
- ✓ Ensures reproducible placement for consistent visualization

### 5. Variable Quadrant Configurations ✓
Tests all supported quadrant counts (2-8):
- ✓ 2 quadrants (vertical split)
- ✓ 3 quadrants
- ✓ 4 quadrants (default)
- ✓ 5 quadrants
- ✓ 6 quadrants
- ✓ 7 quadrants
- ✓ 8 quadrants (maximum)

### 6. Variable Ring Configurations ✓
Tests all supported ring counts (4-8):
- ✓ 4 rings (default)
- ✓ 5 rings
- ✓ 6 rings
- ✓ 7 rings
- ✓ 8 rings (maximum)

### 7. Blip Movement Indicators ✓
Tests all movement states:
- ✓ moved = 0 (no change) - renders as circle
- ✓ moved = 1 (moved up) - renders as up triangle
- ✓ moved = -1 (moved down) - renders as down triangle
- ✓ moved = 2 (new) - renders as star

### 8. Complex Configurations ✓
Tests realistic and edge-case scenarios:
- ✓ 8 quadrants × 8 rings (maximum complexity)
- ✓ 2 quadrants × 4 rings (minimum quadrants)
- ✓ Many entries in the same quadrant/ring (collision handling)
- ✓ Entries distributed across all quadrants and rings
- ✓ Unique ID assignment for all entries

### 9. SVG Generation ✓
Tests that the visualization creates proper DOM elements:
- ✓ Creates SVG elements in the DOM
- ✓ Creates grid lines (N lines for N quadrants)
- ✓ Creates circles for rings (1 per ring)
- ✓ Creates groups for organization

### 10. Configuration Options ✓
Tests various configuration options:
- ✓ Custom width and height
- ✓ Custom colors (background, grid, inactive)
- ✓ print_layout option
- ✓ scale option

### 11. Edge Cases ✓
Tests boundary conditions and special cases:
- ✓ Empty entries array
- ✓ Entries with links
- ✓ Entries without links
- ✓ Very long entry labels
- ✓ Special characters in labels (C++, F#, Node.js, etc.)

## Critical Functionality Covered

The test suite focuses on these critical areas to avoid regressions:

### 1. **Data Integrity**
- Configuration validation prevents invalid setups
- Entry validation prevents runtime errors
- Boundary checks for all numeric inputs

### 2. **Layout Stability**
- Reproducible positioning with seeded random
- Consistent ID assignment and ordering
- Alphabetical sorting within segments

### 3. **Visual Correctness**
- Proper quadrant and ring generation
- Correct entry positioning within bounds
- Appropriate color assignment
- Correct movement indicator rendering

### 4. **Flexibility**
- Support for variable quadrant counts (2-8)
- Support for variable ring counts (4-8)
- Graceful handling of edge cases
- Support for all configuration options

### 5. **Robustness**
- Handles empty data
- Handles special characters
- Handles many entries in one segment
- Handles various quadrant/ring combinations

## Test Structure

Each test file follows this structure:

```javascript
describe('Feature Group', () => {
  test('specific behavior', () => {
    // Arrange: Setup test data
    const config = createMinimalConfig({ ... });

    // Act: Execute the function
    radar_visualization(config);

    // Assert: Verify the results
    expect(actual).toBe(expected);
  });
});
```

## Adding New Tests

When adding new features to radar.js:

1. **Add validation tests** if new configuration options are introduced
2. **Add layout tests** if positioning logic changes
3. **Add rendering tests** if visual elements are modified
4. **Add edge case tests** for boundary conditions
5. **Update this README** to reflect new coverage

## Test Dependencies

- **Bun Test Runner**: Built-in test framework for Bun
- **JSDOM**: DOM implementation for testing browser code in Node/Bun
- **D3.js v7**: The visualization library being tested

## Debugging Tests

To debug failing tests:

```bash
# Run a specific test file
bun test test/radar.test.js

# Run tests matching a pattern
bun test --test-name-pattern "Configuration Validation"

# Run with verbose output
bun test --verbose
```

## Continuous Integration

These tests should be run:
- Before committing changes to radar.js
- In CI/CD pipelines before deployment
- When updating D3.js or other dependencies
- When adding new configuration options

## Known Limitations

1. **D3 Force Simulation**: The force simulation (for collision avoidance) is asynchronous. Tests verify initial positioning but don't wait for final positions after simulation.

2. **Visual Testing**: These are unit/integration tests, not visual regression tests. For visual verification, use the screenshot tool:
   ```bash
   bun run screenshot
   ```

3. **Browser Compatibility**: Tests run in JSDOM, which may not perfectly match all browser behaviors.

## Future Test Improvements

- [ ] Add performance benchmarks
- [ ] Add visual regression tests with Playwright
- [ ] Test accessibility features
- [ ] Test responsive behavior
- [ ] Add mutation testing to verify test quality
