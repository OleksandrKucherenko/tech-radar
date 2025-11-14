#!/usr/bin/env bash
# Generate GitHub release notes

set -euo pipefail

# Generate release notes for GitHub Release
# Args: $1 - tag name, $2 - version, $3 - repository, $4 - commit SHA
generate_release_notes() {
  local tag="$1"
  local version="$2"
  local repository="$3"
  local commit_sha="$4"
  
  cat <<EOF
## Tech Radar Release $tag

### 📦 Release Artifact

- **Minified version:** \`radar-$version.js\`
- **Built from:** \`docs/radar.js\`
- **D3.js version:** v7
- **Supports:** 2-8 quadrants, 4-8 rings

### 🚀 Usage

\`\`\`html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://github.com/$repository/releases/download/$tag/radar-$version.js"></script>
<script>
  radar_visualization({
    svg_id: "radar",
    width: 1450,
    height: 1000,
    colors: {
      background: "#fff",
      grid: "#dddde0",
      inactive: "#ddd"
    },
    quadrants: [
      { name: "Languages" },
      { name: "Infrastructure" },
      { name: "Datastores" },
      { name: "Data Management" }
    ],
    rings: [
      { name: "ADOPT", color: "#5ba300" },
      { name: "TRIAL", color: "#009eb0" },
      { name: "ASSESS", color: "#c7ba00" },
      { name: "HOLD", color: "#e09b96" }
    ],
    entries: [
      // Your technology entries here
    ]
  });
</script>
\`\`\`

### 📝 Commit

**SHA:** \`${commit_sha:0:7}\`
EOF
}
