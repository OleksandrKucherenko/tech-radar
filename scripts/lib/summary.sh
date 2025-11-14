#!/usr/bin/env bash
# Generate GitHub Actions step summary

set -euo pipefail

# Generate success summary for GitHub Actions
# Args: $1 - tag name, $2 - version, $3 - release URL, $4 - repository
generate_success_summary() {
  local tag="$1"
  local version="$2"
  local release_url="$3"
  local repository="$4"
  
  cat >> "$GITHUB_STEP_SUMMARY" <<EOF
## 🎉 Release $tag Created Successfully!

**Version:** \`$version\`
**Release:** [$tag]($release_url)

### 📦 Artifacts

- \`radar-$version.js\` - Minified release version

### 📥 Download

\`\`\`bash
# Direct download
wget https://github.com/$repository/releases/download/$tag/radar-$version.js
\`\`\`

---

✅ The release has been published to GitHub Releases.
EOF
}
