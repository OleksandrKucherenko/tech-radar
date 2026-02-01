# Contributing to Tech Radar

Thank you for your interest in contributing to the Tech Radar! This guide will help you get started with adding new technologies, handling logos, and working with the codebase.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Adding New Technologies](#adding-new-technologies)
  - [AI and LLM Tools](#ai-and-llm-tools)
  - [Technology Categories (Quadrants)](#technology-categories-quadrants)
  - [Adoption Levels (Rings)](#adoption-levels-rings)
  - [Technology Status Indicators](#technology-status-indicators)
- [Handling Brand Logos](#handling-brand-logos)
  - [Using Remote URLs](#using-remote-urls)
  - [Using Local Files](#using-local-files)
  - [Downloading and Standardizing Logos](#downloading-and-standardizing-logos)
- [Testing Your Changes](#testing-your-changes)
- [Code Quality and Linting](#code-quality-and-linting)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Overview

The Tech Radar is an interactive D3.js visualization that helps engineering teams align on technology choices. Technologies are organized into quadrants (categories) and rings (adoption levels).

### Current Quadrants:
0. **Languages** - Programming languages and frameworks
1. **Infrastructure** - Cloud platforms, containers, and deployment tools
2. **Datastores** - Databases and storage solutions
3. **Data Management** - ETL, data processing, and analytics tools

### Current Rings:
0. **ADOPT** - Technologies we have confidence in and use for production projects
1. **TRIAL** - Technologies we are evaluating for potential adoption
2. **ASSESS** - Technologies we are learning about and assessing
3. **HOLD** - Technologies we avoid for new projects

## Prerequisites

Before you begin, make sure you have:

1. **Bun runtime** installed ([https://bun.sh](https://bun.sh))
2. **Git** for version control
3. A modern web browser for testing

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/zalando/tech-radar.git
   cd tech-radar
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Start the development server**
   ```bash
   bun start
   ```

4. **Open your browser** to [http://localhost:3000](http://localhost:3000)

## Adding New Technologies

To add a new technology to the radar:

1. Edit `docs/config.json`
2. Add a new entry to the `entries` array

### Basic Entry Structure

```json
{
  "quadrant": 0,           // 0-3 (see quadrants above)
  "ring": 1,              // 0-3 (see rings above)
  "label": "Technology Name",
  "active": true,
  "moved": 0              // See status indicators below
}
```

### AI and LLM Tools

The Tech Radar includes a dedicated AI Tech Radar (see `docs/ai.html`) with additional quadrants for AI-specific technologies:

**AI Quadrants:**
0. **Core AI Providers** - OpenAI, Anthropic, Google AI, etc.
1. **AI Coding Tools** - GitHub Copilot, CodeRabbit, Greptile, etc.
2. **RAG & Retrieval** - Vector databases, retrieval systems
3. **Databases** - AI-optimized databases, graph databases
4. **Low-Code & MCP** - AI-powered development tools
5. **Observability & Testing** - AI testing, monitoring, evaluation tools

When adding AI/LLM tools to the main radar or the AI radar:

- **Main Radar**: Add to appropriate quadrant (0-3)
- **AI Radar**: Use the specialized AI quadrants (0-5)

**Example AI tool entry (for main radar):**
```json
{
  "quadrant": 0,
  "ring": 1,
  "label": "Claude",
  "description": "Claude is an AI assistant developed by Anthropic...",
  "link": "https://claude.ai",
  "logo": "https://www.anthropic.com/images/brand/logo.png",
  "active": true,
  "moved": 0
}
```

**Example AI tool entry (for AI radar):**
```json
{
  "quadrant": 1,
  "ring": 4,
  "label": "Greptile",
  "description": "AI-powered code analysis and search tool...",
  "link": "https://www.greptile.com/",
  "logo": "logos/greptile-logo-64x64.webp",
  "active": true,
  "moved": 0
}
```

### Technology Categories (Quadrants)

**Main Radar Quadrants:**

| Quadrant | Index | Category      | Example Technologies              |
|----------|-------|---------------|-----------------------------------|
| Languages | 0     | Languages     | Python, Rust, TypeScript, Claude  |
| Infrastructure | 1   | Infrastructure | Kubernetes, Docker, AWS, Azure    |
| Datastores | 2     | Datastores    | PostgreSQL, MongoDB, Redis        |
| Data Management | 3   | Data Mgmt     | Apache Spark, Airflow, Databricks |

**AI Radar Quadrants (see `docs/ai.html`):**

| Quadrant | Index | Category                  | Example Technologies                |
|----------|-------|---------------------------|------------------------------------|
| Core AI Providers | 0   | Core AI Providers         | OpenAI, Anthropic, Azure AI Foundry |
| AI Coding Tools | 1    | AI Coding Tools           | GitHub Copilot, CodeRabbit, Greptile |
| RAG & Retrieval | 2    | RAG & Retrieval           | Pinecone, Chroma, Weaviate         |
| Databases | 3     | Databases                 | Vector DBs, Graph DBs, AI databases |
| Low-Code & MCP | 4     | Low-Code & MCP           | AI-powered dev tools, MCP servers  |
| Observability & Testing | 5 | Observability & Testing   | AI testing, monitoring, eval tools |

### Adoption Levels (Rings)

**Main Radar Rings:**

| Ring | Index | Level   | Description                                      |
|------|-------|---------|--------------------------------------------------|
| ADOPT | 0     | Adopt   | Technologies we have confidence in and use       |
| TRIAL | 1     | Trial   | Technologies we are evaluating                   |
| ASSESS | 2    | Assess  | Technologies we are learning about               |
| HOLD | 3     | Hold    | Technologies we avoid for new projects           |

**AI Radar Rings:**

| Ring | Index | Level   | Description                                      |
|------|-------|---------|--------------------------------------------------|
| ADOPT | 0     | Adopt   | Strategic defaults for AI projects              |
| VALUE | 1     | Value   | Clear value for new AI projects                 |
| HOLD | 2     | Hold    | Use but won't choose for new projects           |
| SKIP | 3     | Skip    | Intentionally skipped tools                      |
| TRIAL | 4     | Trial   | Currently evaluating in practice                 |
| WATCH | 5     | Watch   | Awareness, tracking signals before evaluation   |

### Technology Status Indicators

The `moved` field indicates the technology's recent status change:

| Value | Indicator | Description                               |
|-------|-----------|-------------------------------------------|
| -1    | ↓ Triangle | Moved out (removed from ring)           |
| 0     | ○ Circle  | No change                                 |
| 1     | ↑ Triangle | Moved in (adopted to higher ring)         |
| 2     | ★ Star    | New technology recently added            |

## Handling Brand Logos

The Tech Radar supports displaying logos for technologies in the details modal. You can use either remote URLs or local files.

### Using Remote URLs

For quick additions, use remote URLs:

```json
{
  "label": "PostgreSQL",
  "logo": "https://www.postgresql.org/media/img/about/press/elephant.png"
}
```

**Pros:**
- Quick to implement
- No additional setup required
- Always up-to-date if source changes

**Cons:**
- Slower loading (external requests)
- May not work offline
- Privacy concerns (external tracking)

### Using Local Files

For production use, download and host logos locally:

```json
{
  "label": "PostgreSQL",
  "logo": "logos/postgresql-logo-64x64.webp"
}
```

**Pros:**
- Faster loading
- Works offline
- Better privacy
- Consistent sizing and format
- Version controlled

**Cons:**
- Requires additional setup
- Need to update files when logos change

## Logo Management

The project includes comprehensive logo management tools for both regular and AI technologies.

### For AI/LLM Tools (Recommended)

Use the dedicated AI logo downloader for AI tools:

```bash
# Step 1: Generate mapping file
./scripts/download-ai-logos.sh --generate-mapping

# Step 2: Auto-fetch missing URLs (optional, needs API token)
./scripts/download-ai-logos.sh --auto-fetch YOUR_TOKEN logodev

# Step 3: Download all logos
./scripts/download-ai-logos.sh --download
```

**Benefits of the AI workflow:**
- Fully automated extraction from AI entries
- Auto-finds logo URLs with fallback support
- Handles URL validation and broken links
- Integrated with logo.dev API for high-quality logos

**Getting a logo.dev token:**
1. Visit https://logo.dev and get a free token
2. The token provides access to thousands of high-resolution logos
3. Free tier includes attribution requirements

### For Regular Technologies

Use the general logo downloader for non-AI technologies:

```bash
# Download all logos from URLs in config.json
./scripts/download-logos.sh
```

### Logo Requirements

For a logo to display:
- The entry must have a `description` field
- The entry must have a `logo` field
- The logo file must exist at the specified path

### Logo Directory Structure

```
docs/
├── config.json          # Main configuration
├── ai-entries.json      # AI-specific entries
├── logos/               # Logo directory
│   ├── postgresql-logo-64x64.webp
│   ├── kubernetes-logo-64x64.webp
│   ├── openai-logo-64x64.webp
│   └── anthropic-logo-64x64.webp
└── scripts/             # Logo processing scripts
    ├── download-logos.sh
    ├── download-ai-logos.sh
    └── ai-logo-urls.json
```

### Manual Logo Addition

You can manually add logos:

1. Create a 64x64px image (PNG, WebP, SVG, or JPG)
2. Name it following the pattern: `{vendor}-logo-64x64.{ext}`
3. Place it in `docs/logos/`
4. Update `config.json` or `ai-entries.json` to reference it:
   ```json
   "logo": "logos/your-logo-64x64.webp"
   ```

### Requirements

**Dependencies:**
- `curl` for downloading
- `ImageMagick` for image processing
- `jq` for JSON parsing

**Installation:**
```bash
# On Ubuntu/Debian:
sudo apt-get install curl imagemagick jq

# On macOS:
brew install curl imagemagick jq
```

### Logo Processing

Both scripts will:
- Download logos from remote URLs
- Resize to 64x64 pixels
- Convert to WebP format (preferred)
- Save with standardized naming: `{vendor}-logo-64x64.webp`
- Provide feedback on success/failure
- Create fallback versions for older browsers

**Logo specifications:**
- **Size**: 64x64 pixels (displayed as circular)
- **Format**: WebP (preferred), PNG, SVG, JPG
- **Mobile**: Scales to 48x48px on small screens
- **Position**: Top-left of details modal

**Example output filename:**
```
docs/logos/postgresql-logo-64x64.webp
```

## Testing Your Changes

### Local Testing

1. **Start the development server**:
   ```bash
   bun start
   ```

2. **Test different configurations**:
   - Open `docs/index.html` for the default 4x4 radar
   - Try demo files like `docs/demo-6x5.html` for different layouts
   - For AI tools, test `docs/ai.html` (AI Tech Radar)
   - Verify entries appear in the correct quadrant and ring

3. **Test the minified version**:
   - Open `docs/test-minified.html` to verify the built version works

### Testing Checklist

- [ ] New technology appears in correct position
- [ ] Logo displays correctly (if specified)
- [ ] Clicking the technology shows the modal
- [ ] Modal displays title, description, and link (if provided)
- [ ] Technology has the correct status indicator
- [ ] No overlapping entries with other technologies
- [ ] Works on different screen sizes
- [ ] AI tools appear in the AI radar if appropriate

### Logo Verification

After updating logos:

```bash
# Verify all logos exist
./scripts/verify-logos.sh docs/config.json
./scripts/verify-logos.sh docs/ai-entries.json

# Check AI logo mapping
./scripts/download-ai-logos.sh --update-html
```

### Special Considerations for AI Tools

For AI/LLM tools:

1. **Main Radar** (`docs/index.json`):
   - Add to standard quadrants (0-3)
   - Use for general-purpose technologies

2. **AI Radar** (`docs/ai-entries.json`):
   - Use specialized AI quadrants (0-5)
   - Include detailed descriptions of AI capabilities
   - Add specific AI-related metadata if applicable

3. **Testing AI Radar**:
   - Open `docs/ai.html` separately
   - Verify AI-specific rings (ADOPT, VALUE, HOLD, SKIP, TRIAL, WATCH)
   - Check quadrant-specific behavior for AI tools

## Code Quality and Linting

The project includes ESLint for code quality:

```bash
# Run all linters
bun run lint

# Lint JavaScript only
bun run lint:js

# Lint HTML only
bun run lint:html
```

### Code Standards

- Follow the existing code style in `radar.js`
- Use meaningful variable names
- Add comments for complex logic
- Test thoroughly before submitting changes

## Submitting Changes

### For Main Radar Entries

1. **Create a new branch**:
   ```bash
   git checkout -b feature/add-new-technology
   ```

2. **Make your changes** to `docs/config.json`

3. **Test thoroughly** as described above

4. **Stage your changes**:
   ```bash
   git add docs/config.json
   ```

5. **Commit your changes**:
   ```bash
   git commit -m "feat: add new technology to Tech Radar"
   ```

6. **Push to your fork**:
   ```bash
   git push origin feature/add-new-technology
   ```

### For AI Radar Entries

1. **Create a new branch**:
   ```bash
   git checkout -b feature/add-ai-tool
   ```

2. **Make your changes** to `docs/ai-entries.json`

3. **Test AI radar**:
   ```bash
   # The dev server will serve ai.html automatically
   # Open http://localhost:3000/ai.html to test
   ```

4. **Download logo if needed**:
   ```bash
   ./scripts/download-ai-logos.sh
   ```

5. **Stage your changes**:
   ```bash
   git add docs/ai-entries.json docs/logos/*.webp
   ```

6. **Commit your changes**:
   ```bash
   git commit -m "feat: add AI tool to AI Tech Radar"
   ```

### Creating Pull Requests

When creating a PR:

1. **For main radar**: Reference `docs/config.json` changes
2. **For AI radar**: Reference `docs/ai-entries.json` changes
3. Include:
   - Clear description of the changes
   - Testing performed
   - Reason for adding/removing the technology
   - Quadrant and ring justification
   - Logo information (if applicable)

## Release Process

### Automatic Release (Recommended)

For version releases, use the automated CI/CD:

1. **Create and push a version tag** (semver with `v` prefix):
   ```bash
   git tag v0.14.0
   git push origin v0.14.0
   ```

2. **GitHub Actions will automatically**:
   - Validate the semver format
   - Build the minified release file
   - Create a GitHub Release with the artifact
   - Handle tag reassignment if needed

### Supported Tag Formats

- `v0.14.1` - Standard release
- `v1.0.0-alpha.2` - Pre-release with identifier
- `v0.20.0-beta+meta.1` - Pre-release with metadata

### Manual Release

If needed, you can create a release locally:

1. Set the version:
   ```bash
   export RELEASE_VERSION=0.14.0
   ```

2. Build the release:
   ```bash
   bun run build
   ```

3. Test the generated file in `docs/release/`

4. Commit and tag the new version

## Quick Reference

### Essential Commands

**Development:**
```bash
bun install        # Install dependencies
bun start          # Start dev server
bun run build      # Build minified version
bun run lint       # Run linters
```

**Logo Management:**
```bash
# AI Tools (Recommended)
./scripts/download-ai-logos.sh --generate-mapping
./scripts/download-ai-logos.sh --auto-fetch TOKEN logodev  # Optional
./scripts/download-ai-logos.sh --download

# Regular Technologies
./scripts/download-logos.sh

# Verification
./scripts/verify-logos.sh docs/config.json
./scripts/verify-logos.sh docs/ai-entries.json
```

**Testing:**
- Open `http://localhost:3000` for main radar
- Open `http://localhost:3000/ai.html` for AI radar

### Key Files

- `docs/config.json` - Main radar technologies
- `docs/ai-entries.json` - AI-specific technologies
- `docs/logos/` - Logo directory
- `scripts/download-ai-logos.sh` - AI logo downloader
- `scripts/ai-logo-urls.json` - AI logo mapping

## Special Considerations

### AI-Specific Contributions

When contributing AI tools:

1. **Decide which radar to use**:
   - Main radar for general-purpose AI tools
   - AI radar for specialized AI tools

2. **Follow AI radar conventions**:
   - Use AI-specific quadrants (0-5)
   - Use AI-specific ring meanings (ADOPT, VALUE, HOLD, etc.)
   - Include detailed AI capabilities in descriptions

3. **Automatic logo management**:
   ```bash
   # After adding AI tools to ai-entries.json:
   ./scripts/download-ai-logos.sh --generate-mapping  # Creates mapping
   ./scripts/download-ai-logos.sh --download         # Downloads logos
   ```

The AI logo downloader will:
- Extract all AI tools from ai-entries.json
- Find logo URLs automatically
- Download and standardize all logos
- Handle any missing logos with placeholders

### Bulk Additions

For adding multiple technologies:

1. **Batch them together** in a single PR
2. **Group by quadrant/ring** for better organization
3. **Test thoroughly** after each addition
4. **Update documentation** if adding new categories

For bulk AI additions:
- Add all entries to ai-entries.json first
- Run the automated logo workflow once
- Verify all logos downloaded correctly

## Troubleshooting

### Common Issues

1. **Technology not appearing**:
   - Check quadrant and ring indices are valid
   - Verify the entry has `active: true`
   - Ensure no duplicate labels

2. **Logo not displaying**:
   - Check URL is valid and accessible
   - Verify local file path is correct
   - Ensure image format is supported

3. **Overlapping entries**:
   - The automatic positioning should prevent this
   - Check if there are too many entries in one quadrant/ring
   - Consider adjusting the scale parameter

### Environment Variables

The project uses `mise.toml` for environment configuration:

- `LOGODEV_TOKEN`: API token for logo.dev (used by AI logo downloader)
  - Get a free token at https://logo.dev
  - Token is automatically used when running `--auto-fetch` commands

### Getting Help

If you encounter issues:

1. Check existing issues on GitHub
2. Search the codebase for similar entries
3. Review the [CLAUDE.md](CLAUDE.md) file for technical details
4. Open an issue with detailed description

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Happy contributing! 🎉