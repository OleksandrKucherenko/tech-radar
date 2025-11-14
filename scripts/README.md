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
