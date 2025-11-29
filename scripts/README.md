# Release Scripts

Modular bash scripts for automating the GitHub release process.

## Structure

```
scripts/
├── release.sh           # Main orchestrator script
└── lib/
    ├── version.sh       # Version extraction and validation
    ├── release-notes.sh # Release notes generation
    └── summary.sh       # GitHub Actions step summary
```

## Usage

### In GitHub Actions

The workflow calls the main script with different actions:

```yaml
# Validate version
- env:
    VERSION: ${{ steps.version.outputs.version }}
    TAG_NAME: ${{ steps.version.outputs.tag }}
  run: ./scripts/release.sh validate

# Build release
- env:
    VERSION: ${{ steps.version.outputs.version }}
  run: ./scripts/release.sh build

# Cleanup existing release
- env:
    TAG_NAME: ${{ steps.version.outputs.tag }}
    GH_TOKEN: ${{ github.token }}
  run: ./scripts/release.sh cleanup

# Create release
- env:
    TAG_NAME: ${{ steps.version.outputs.tag }}
    VERSION: ${{ steps.version.outputs.version }}
    GITHUB_REPOSITORY: ${{ github.repository }}
    GITHUB_SHA: ${{ github.sha }}
    GH_TOKEN: ${{ github.token }}
  run: ./scripts/release.sh create

# Add summary
- env:
    TAG_NAME: ${{ steps.version.outputs.tag }}
    VERSION: ${{ steps.version.outputs.version }}
    RELEASE_URL: ${{ steps.create_release.outputs.release_url }}
    GITHUB_REPOSITORY: ${{ github.repository }}
  run: ./scripts/release.sh summary
```

### Local Testing

You can test individual actions locally:

```bash
# Test validation
export VERSION="0.14.1"
export TAG_NAME="v0.14.1"
./scripts/release.sh validate

# Test build (requires bun)
export VERSION="0.14.1"
./scripts/release.sh build

# Test release notes generation
export TAG_NAME="v0.14.1"
export VERSION="0.14.1"
export GITHUB_REPOSITORY="user/repo"
export GITHUB_SHA="abc123def456"
./scripts/release.sh create  # Requires GH_TOKEN
```

## Actions

- **`validate`** - Validate semver format and print status
- **`build`** - Build minified release with bun
- **`cleanup`** - Delete existing release if tag was reassigned
- **`create`** - Create GitHub release with generated notes
- **`summary`** - Generate GitHub Actions step summary

## Environment Variables

### Required by specific actions

**validate:**
- `VERSION` - Version string (e.g., "0.14.1")
- `TAG_NAME` - Git tag name (e.g., "v0.14.1")
- `GITHUB_OUTPUT` - (GitHub Actions) Output file path
- `GITHUB_STEP_SUMMARY` - (GitHub Actions) Summary file path

**build:**
- `VERSION` - Version string
- `GITHUB_ENV` - (GitHub Actions) Environment file path

**cleanup:**
- `TAG_NAME` - Git tag name
- `GH_TOKEN` - GitHub token for API access

**create:**
- `TAG_NAME` - Git tag name
- `VERSION` - Version string
- `GITHUB_REPOSITORY` - Repository slug (e.g., "user/repo")
- `GITHUB_SHA` - Git commit SHA
- `GH_TOKEN` - GitHub token for API access
- `GITHUB_OUTPUT` - (GitHub Actions) Output file path

**summary:**
- `TAG_NAME` - Git tag name
- `VERSION` - Version string
- `RELEASE_URL` - GitHub release URL
- `GITHUB_REPOSITORY` - Repository slug
- `GITHUB_STEP_SUMMARY` - (GitHub Actions) Summary file path

## Benefits

1. **Maintainability** - Logic separated from YAML syntax
2. **Testability** - Can run and test scripts locally
3. **Reusability** - Functions can be sourced individually
4. **Readability** - Clean workflow file, detailed logic in bash
5. **Debugging** - Easier to trace issues in bash vs inline YAML

---

## download-logos.sh

Downloads, resizes, and standardizes entity logos from URLs defined in `config.json`.

### Features

- **Automatic download**: Fetches logos from URLs in the config file
- **Resize**: Standardizes all logos to 64x64 pixels
- **Format conversion**: Converts to WebP (preferred) or PNG (fallback)
- **Naming convention**: `{vendor}-logo-64x64.{webp|png}`
- **Error handling**: Gracefully handles download and conversion failures

### Prerequisites

```bash
# Ubuntu/Debian
sudo apt-get install curl imagemagick jq

# macOS
brew install curl imagemagick jq

# Arch Linux
sudo pacman -S curl imagemagick jq
```

### Usage

```bash
# Download all logos from config.json
./scripts/download-logos.sh

# Specify a different config file
./scripts/download-logos.sh path/to/config.json
```

### Output

Logos are saved to `docs/logos/` with the naming pattern:
- `postgresql-logo-64x64.webp`
- `kubernetes-logo-64x64.webp`
- `python-logo-64x64.png`
- `kafka-logo-64x64.webp`

### How it Works

1. **Parse config.json**: Extracts all entries with a `logo` field
2. **Download**: Uses `curl` to fetch the logo from the URL
3. **Process**: Uses ImageMagick to:
   - Resize to 64x64 pixels
   - Center crop if needed
   - Convert to WebP or PNG
   - Optimize quality (90%)
4. **Save**: Stores in `docs/logos/` with standardized naming

### Configuration

Edit the script to customize:

```bash
SIZE="64x64"              # Output size
PREFERRED_FORMAT="webp"   # Preferred format
FALLBACK_FORMAT="png"     # Fallback format
LOGOS_DIR="docs/logos"    # Output directory
```

### Using Local Logos

After downloading, update your `config.json` to use local paths:

```json
{
  "label": "PostgreSQL",
  "logo": "logos/postgresql-logo-64x64.webp"
}
```

Benefits of local logos:
- ✅ Faster loading (no external requests)
- ✅ Works offline
- ✅ Consistent sizing and format
- ✅ No external dependencies
- ✅ Better privacy (no external tracking)

### Troubleshooting

**WebP not supported:**
- The script automatically falls back to PNG if WebP is not supported
- To enable WebP support: `sudo apt-get install webp libwebp-dev`

**Download failures:**
- Check your internet connection
- Verify logo URLs are accessible
- Some servers may block automated requests

**Image conversion errors:**
- Ensure the source is a valid image file
- Check ImageMagick installation: `convert --version`
- Try updating ImageMagick: `sudo apt-get upgrade imagemagick`
