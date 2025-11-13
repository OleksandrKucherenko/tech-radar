# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository generates a **Technology Radar visualization** for Zalando's engineering teams. It's a static site that creates an interactive D3.js-based visualization showing technology choices categorized into quadrants (Languages, Infrastructure, Datastores, Data Management) and rings (ADOPT, TRIAL, ASSESS, HOLD).

## Core Architecture

### Main Components

- **`docs/radar.js`** (599 lines): The core visualization library built on D3.js v7. This is the heart of the project containing:
  - `radar_visualization()`: Main entry point function that creates the SVG-based radar
  - Coordinate transformation functions (`polar()`, `cartesian()`)
  - Automatic positioning algorithm to prevent entry overlap
  - Rendering logic for quadrants, rings, legend, and entries
  - Custom seeded random number generator for reproducible positioning

- **`docs/config.json`**: Data file containing all technology entries. Each entry has:
  - `quadrant`: 0-3 (clockwise from bottom right: Languages, Infrastructure, Datastores, Data Management)
  - `ring`: 0-3 (inside to outside: ADOPT, TRIAL, ASSESS, HOLD)
  - `label`: Technology name
  - `active`: Boolean flag
  - `moved`: Movement indicator (-1=out, 0=no change, 1=in, 2=new)
  - `link`: Optional URL to more info

- **`docs/index.html`**: Demo page that loads config.json and initializes the radar visualization

### Data Flow

1. HTML page loads D3.js v7 and radar.js
2. Fetches config.json containing technology entries
3. Passes configuration to `radar_visualization()` including quadrant names, ring names/colors, and entries
4. radar.js renders interactive SVG visualization with automatic positioning

### Release Process

Versioned releases are stored in `docs/release/radar-{version}.js`. Current version is 0.13 (using d3.js v7, supports 2-8 quadrants and 4-8 rings).

#### Automated Release (Recommended)

The repository has automated CI/CD for releases via GitHub Actions:

1. **Create and push a version tag** (must follow semver with `v` prefix):
   ```bash
   git tag v0.14.0
   git push origin v0.14.0
   ```

2. **GitHub Actions automatically**:
   - Validates the semver format
   - Builds the minified release file
   - Creates a GitHub Release with the artifact
   - Handles tag reassignment (deletes and recreates existing releases)

**Supported tag formats** (semver):
- `v0.14.1` - Standard release
- `v1.0.0-alpha.2` - Pre-release with identifier
- `v0.20.0-beta+meta.1` - Pre-release with metadata

**Tag reassignment**: If you delete and reassign a tag to a different commit, the CI will automatically update the release.

#### Manual Release

To create a release locally:
1. Set the version: `export RELEASE_VERSION=0.14.0`
2. Run `bun run build`
3. Test the generated file in `docs/release/` (use `test-minified.html`)
4. Commit the new release file

## Development Commands

**Prerequisites:** [Bun runtime](https://bun.sh) must be installed for development and building.

### Setup
```bash
bun install       # Install dependencies
```

### Development
```bash
bun start         # Start local dev server with live reload (opens http://localhost:3000)
```

### Building
```bash
bun run build     # Build minified version using Bun + terser
                  # Output: docs/release/radar-0.13.js (~56% smaller)
```

The build process:
- Uses Bun to run the build script (`build.ts`)
- Minifies with terser while preserving the `radar_visualization` function name
- Generates versioned output in `docs/release/`
- Typical size reduction: ~56% (25KB → 11KB)

### Linting
```bash
bun run lint      # Run all linters (JS + HTML)
bun run lint:js   # Lint JavaScript files only
bun run lint:html # Lint HTML files only
```

## Key Technical Details

### D3.js Version
Since v0.12, this project uses **d3.js v7** (breaking change from previous versions). If updating forks, refer to [PR #197](https://github.com/zalando/tech-radar/pull/197/files).

### Positioning Algorithm
Entries are positioned automatically using a seeded random number generator (seed=42) to ensure:
- Reproducible placement across page loads
- No overlapping entries
- Visual distribution within quadrant/ring boundaries

### Configuration Options
The `radar_visualization()` function accepts extensive configuration:
- **Variable Quadrants**: Supports 2-8 quadrants (default: 4)
- **Variable Rings**: Supports 4-8 rings (default: 4)
- Dimensions (`width`, `height`, `scale`)
- Colors (`background`, `grid`, `inactive`)
- Layout options (`print_layout`, `links_in_new_tabs`)
- Offset positions for legends, title, footer
- Font family (Arial/Helvetica recommended to avoid sizing issues)

**Important**: The visualization now dynamically adapts to the number of quadrants and rings:
- Grid lines automatically adjust (N radial lines for N quadrants)
- Ring radii scale proportionally from the base 4-ring pattern
- Legend positions are calculated in a circular arrangement
- Legend columns adapt: 2 columns for 4-6 rings, 3 columns for 7-8 rings

### ESLint Configuration
The project disables several ESLint rules (`no-redeclare`, `no-undef`, `no-unused-vars`) to accommodate the visualization code style.

## Editing Technology Entries

To update the Tech Radar:
1. Edit `docs/config.json`
2. Adjust the number of quadrants/rings in `docs/index.html` if needed (2-8 quadrants, 4-8 rings)
3. Add/modify entries with appropriate quadrant and ring indices (0-based, must be within configured ranges)
4. Set `moved` to indicate status change (-1=moved out, 0=no change, 1=moved in, 2=new)
5. Test locally with `bun start`

## Testing Variable Configurations

Test files are available in the `docs/` directory:

**`test-configurations.html`** - Verifies different quadrant/ring combinations:
- 4 quadrants x 4 rings (regression test)
- 2 quadrants x 4 rings
- 6 quadrants x 5 rings
- 8 quadrants x 8 rings

**`test-minified.html`** - Tests the minified release version (`release/radar-0.13.js`):
- Verifies the minified version works correctly
- Confirms `radar_visualization` function is accessible
- Uses the same configuration as the main radar

**Demo files** - Individual configuration examples:
- `demo-2x4.html` - 2 Quadrants × 4 Rings
- `index.html` - 4 Quadrants × 4 Rings (default)
- `demo-6x5.html` - 6 Quadrants × 5 Rings
- `demo-8x8.html` - 8 Quadrants × 8 Rings (maximum)

Open these files in a browser to visually verify functionality.

### Generating Screenshots

```bash
bun run screenshot    # Generate screenshots (requires Playwright + system deps)
```

Alternatively, open the demo files in a browser and take manual screenshots. See `docs/screenshots/README.md` for detailed instructions.

### Validation Rules
The radar.js automatically validates:
- Quadrant count must be between 2-8
- Ring count must be between 4-8
- All entry `quadrant` and `ring` indices must be valid
- Throws clear error messages for invalid configurations

## Deployment

This is a static site - deploy the `docs/` directory to any static hosting provider (GitHub Pages, Netlify, Vercel, S3, etc.).
