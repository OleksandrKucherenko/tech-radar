#!/usr/bin/env bash
# Version extraction and validation utilities

set -euo pipefail

# Extract tag name from GitHub context
# Args: $1 - event name, $2 - manual tag input (optional), $3 - GITHUB_REF
extract_tag() {
  local event_name="$1"
  local manual_tag="${2:-}"
  local github_ref="${3:-}"
  
  if [ "$event_name" = "workflow_dispatch" ]; then
    echo "$manual_tag"
  else
    echo "${github_ref#refs/tags/}"
  fi
}

# Remove 'v' prefix from tag to get version
# Args: $1 - tag name
extract_version() {
  local tag="$1"
  echo "${tag#v}"
}

# Validate semver format using Node.js semver package
# Args: $1 - version string
# Returns: 0 if valid, 1 if invalid
validate_semver() {
  local version="$1"
  
  local validation_result
  validation_result=$(node -e "
    const semver = require('semver');
    const version = '$version';
    const isValid = semver.valid(version);
    
    if (isValid) {
      console.log('valid');
      process.exit(0);
    } else {
      console.log('invalid');
      process.exit(0);
    }
  ")
  
  if [ "$validation_result" = "invalid" ]; then
    return 1
  fi
  
  return 0
}

# Print validation error message and GitHub step summary
# Args: $1 - tag name
print_validation_error() {
  local tag="$1"
  
  echo "ℹ️  Tag '$tag' is not a valid semver version, skipping release"
  echo "   Only tags matching semver format will trigger releases"
  echo "   Examples: v0.14.1, v1.0.0-alpha.2, v0.20.0-beta+meta.1"
  echo ""
  
  cat >> "$GITHUB_STEP_SUMMARY" <<EOF
## ⏭️ Skipped Release

Tag \`$tag\` is not a valid semver version.

Only tags matching semver format will trigger releases.

**Valid examples:**
- \`v0.14.1\`
- \`v1.0.0-alpha.2\`
- \`v0.20.0-beta+meta.1\`
EOF
}
