# Entity Logos

This directory contains logos for Tech Radar entities, displayed in the details modal dialog.

## Usage

Logos are automatically displayed when an entity has both a `description` and `logo` field in `config.json`:

```json
{
  "label": "PostgreSQL",
  "description": "PostgreSQL is a powerful, open-source database...",
  "logo": "logos/postgresql-logo-64x64.webp"
}
```

## Generating Logos

Use the automated script to download, resize, and standardize logos:

```bash
# Download all logos from URLs in config.json
./scripts/download-logos.sh
```

This will:
- Download logos from remote URLs
- Resize to 64x64 pixels
- Convert to WebP (preferred) or PNG
- Save with standardized naming: `{vendor}-logo-64x64.{webp|png}`

## Logo Specifications

- **Size**: 64x64 pixels (displayed as circular)
- **Format**: WebP (preferred) or PNG
- **Naming**: `{vendor}-logo-64x64.{webp|png}`
- **Display**: Circular with 2px border, positioned top-left in modal
- **Responsive**: Scales to 48x48px on mobile devices

## Manual Upload

You can also manually add logos:

1. Create a 64x64px image (PNG, WebP, SVG, or JPG)
2. Name it following the pattern: `{vendor}-logo-64x64.{ext}`
3. Place it in this directory
4. Update `config.json` to reference it:
   ```json
   "logo": "logos/your-logo-64x64.webp"
   ```

## Examples

```
logos/
├── postgresql-logo-64x64.webp
├── kubernetes-logo-64x64.webp
├── python-logo-64x64.png
├── kafka-logo-64x64.webp
└── docker-logo-64x64.webp
```

## CI/CD Integration

The `logos/` directory is automatically deployed to GitHub Pages along with the rest of the `docs/` folder. No additional configuration is needed.
