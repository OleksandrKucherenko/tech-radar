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

---

## download-ai-logos.sh

Extracts vendor names from `ai.html`, creates a URL mapping file with intelligent logo URL detection, and downloads logos automatically.

### Features

- **Automatic vendor extraction**: Parses ai.html to find all vendors
- **Intelligent URL detection**: Built-in database of 30+ common AI vendor logos
- **Placeholder system**: Creates placeholders for unknown logos
- **Two-phase workflow**: Generate mapping → edit placeholders → download
- **Conditional dependencies**: Only requires ImageMagick for download phase
- **Statistics**: Shows found vs. missing logo counts

### Prerequisites

For mapping generation (--generate-mapping):
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

For logo download (--download):
```bash
# Ubuntu/Debian
sudo apt-get install curl imagemagick jq

# macOS
brew install curl imagemagick jq
```

### Usage

**Automated workflow with LogoKit (Recommended):**

```bash
# 1. Generate mapping file
./scripts/download-ai-logos.sh --generate-mapping

# 2. Auto-fetch missing logos using LogoKit
./scripts/download-ai-logos.sh --auto-fetch YOUR_LOGOKIT_TOKEN

# 3. Download all logos
./scripts/download-ai-logos.sh --download

# 4. Check which logos are ready for ai.html
./scripts/download-ai-logos.sh --update-html
```

**Manual workflow:**

```bash
# 1. Generate mapping file
./scripts/download-ai-logos.sh --generate-mapping

# 2. Edit the mapping file to add missing logo URLs
vim scripts/ai-logo-urls.json

# 3. Download all logos
./scripts/download-ai-logos.sh --download

# 4. Check which logos are ready for ai.html
./scripts/download-ai-logos.sh --update-html
```

**Quick start (download known logos only):**

```bash
# Do everything at once
./scripts/download-ai-logos.sh --all
```

### Commands

- `--generate-mapping` - Extract vendors from ai.html and create/update URL mapping
- `--auto-fetch <TOKEN>` - Auto-fetch missing logos using LogoKit API (NEW!)
- `--download` - Download all logos from mapping file (skips placeholders)
- `--update-html` - Show which logos are available for ai.html
- `--all` - Run all steps: generate, download, update
- `-h, --help` - Show help message

### Output Files

**Mapping file**: `scripts/ai-logo-urls.json`
```json
[
  {
    "label": "Anthropic Claude",
    "slug": "anthropic-claude",
    "url": "https://www.anthropic.com/images/icons/app-icon.png",
    "status": "found"
  },
  {
    "label": "Unknown Vendor",
    "slug": "unknown-vendor",
    "url": "PLACEHOLDER - Add logo URL here",
    "status": "missing"
  }
]
```

**Logo files**: `docs/logos/`
- `anthropic-claude-logo-64x64.webp`
- `openai-logo-64x64.webp`
- `cursor-logo-64x64.webp`

### LogoKit API Integration (NEW!)

The script now supports automatic logo fetching using the **LogoKit API**:

**Get Your Free Token:**
1. Visit [https://logokit.com](https://logokit.com)
2. Sign up for a free account
3. Get your publishable API token (starts with `pk_`)

**Benefits:**
- ✅ **Free tier**: 64×64 resolution logos (exactly what we need!)
- ✅ **Automated**: No manual URL hunting
- ✅ **Fast**: <100ms response time via global CDN
- ✅ **High coverage**: Automatically finds ~50-70% of missing logos
- ✅ **Safe**: Publishable token can be used in scripts

**How it Works:**
1. Script converts vendor names to likely domains (e.g., "Anthropic Claude" → "anthropic.com")
2. Queries LogoKit API: `https://img.logokit.com/anthropic.com?token=YOUR_TOKEN`
3. Verifies the response is a valid image
4. Updates mapping file with found logo URLs
5. You then download the logos using `--download`

**Example:**
```bash
$ ./scripts/download-ai-logos.sh --auto-fetch pk_abc123xyz

Auto-fetching logos using LogoKit API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total vendors: 107
Missing logos: 75

[1/75] Bolt.new
  Domain: bolt.new
  ✓ Found logo via LogoKit

[2/75] Windsurf
  Domain: windsurf.com
  ✓ Found logo via LogoKit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Processed: 75
  Found: 45
  Not found: 30

✓ Found 45 new logos!
Run --download to download the newly found logos
```

### Built-in Logo Database

The script includes built-in URLs for 30+ popular AI vendors:

**AI Models & Platforms:**
- OpenAI, Anthropic Claude, Google Gemini, Microsoft Copilot, Perplexity AI

**AI Code Tools:**
- GitHub Copilot, Cursor, Claude Desktop, Claude Code CLI

**Vector Databases:**
- Pinecone, Qdrant, ChromaDB, Elasticsearch, pgvector

**AI Frameworks:**
- LangChain, LlamaIndex, Ollama, Hugging Face

**Workflow Tools:**
- n8n, Flowise, Langflow, NotebookLM, Obsidian

**Development Tools:**
- Docker, VSCode, JetBrains, Neo4j

### Example Session

```bash
$ ./scripts/download-ai-logos.sh --generate-mapping
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI Tech Radar Logo Downloader
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Creating logo URL mapping file
✓ Mapping file created: scripts/ai-logo-urls.json
  Total vendors: 107
  Found: 32
  Missing: 75

⚠ Please edit scripts/ai-logo-urls.json to add URLs for missing logos
  Search pattern: "PLACEHOLDER"

$ ./scripts/download-ai-logos.sh --download
Processing: Anthropic Claude
  Slug: anthropic-claude
  URL: https://www.anthropic.com/images/icons/app-icon.png
  ✓ Saved: anthropic-claude-logo-64x64.webp (2.4K)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary:
  Total:   107
  Success: 32
  Skipped: 75
```

### Configuration

Edit the script to customize:

```bash
HTML_FILE="docs/ai.html"           # Source HTML file
LOGOS_DIR="docs/logos"             # Output directory
MAPPING_FILE="scripts/ai-logo-urls.json"  # Mapping file location
SIZE="64x64"                       # Logo size
PREFERRED_FORMAT="webp"            # Preferred format
FALLBACK_FORMAT="png"              # Fallback format
```

### Adding Custom Logo URLs

To add logo URLs for vendors with PLACEHOLDERs:

1. Open the mapping file:
   ```bash
   vim scripts/ai-logo-urls.json
   ```

2. Find entries with `"status": "missing"`

3. Replace the PLACEHOLDER with actual logo URL:
   ```json
   {
     "label": "My Vendor",
     "slug": "my-vendor",
     "url": "https://example.com/logo.png",
     "status": "found"
   }
   ```

4. Save and run download again:
   ```bash
   ./scripts/download-ai-logos.sh --download
   ```

### Troubleshooting

**No vendors extracted:**
- Check that `docs/ai.html` exists
- Verify the HTML contains `label: "Vendor Name"` entries

**All vendors show PLACEHOLDER:**
- The built-in database only covers common vendors
- You'll need to manually add URLs for niche/new vendors

**Download failures:**
- Check logo URLs are accessible
- Some servers may block automated requests
- Try downloading manually and adding to docs/logos/
