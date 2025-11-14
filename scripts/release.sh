#!/usr/bin/env bash
# Main release script for GitHub Actions
# Orchestrates the build and release process

set -euo pipefail

# Change to repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Source helper libraries
source "$SCRIPT_DIR/lib/version.sh"
source "$SCRIPT_DIR/lib/release-notes.sh"
source "$SCRIPT_DIR/lib/summary.sh"

# Main function
main() {
  local action="${1:-validate}"
  
  case "$action" in
    validate)
      validate_version
      ;;
    build)
      build_release
      ;;
    create)
      create_release
      ;;
    summary)
      add_summary
      ;;
    cleanup)
      cleanup_existing_release
      ;;
    *)
      echo "❌ Unknown action: $action"
      echo "Usage: $0 {validate|build|create|summary|cleanup}"
      exit 1
      ;;
  esac
}

# Validate version format
validate_version() {
  local version="${VERSION:-}"
  local tag="${TAG_NAME:-}"
  
  if [ -z "$version" ] || [ -z "$tag" ]; then
    echo "❌ Error: VERSION and TAG_NAME environment variables must be set"
    exit 1
  fi
  
  echo "📦 Tag: $tag"
  echo "🔢 Version: $version"
  
  if ! validate_semver "$version"; then
    print_validation_error "$tag"
    exit 0  # Exit gracefully to skip release
  fi
  
  echo "✅ Version format is valid semver"
  echo "is_valid=true" >> "${GITHUB_OUTPUT:-/dev/null}"
}

# Build minified release
build_release() {
  local version="${VERSION:-}"
  
  if [ -z "$version" ]; then
    echo "❌ Error: VERSION environment variable must be set"
    exit 1
  fi
  
  echo "🔨 Building radar.js version $version..."
  RELEASE_VERSION="$version" bun run build
  
  local release_file="docs/release/radar-$version.js"
  if [ ! -f "$release_file" ]; then
    echo "❌ Error: Release file not found at $release_file"
    exit 1
  fi
  
  local file_size
  file_size=$(stat -f%z "$release_file" 2>/dev/null || stat -c%s "$release_file")
  echo "✅ Built $release_file (${file_size} bytes)"
  echo "release_file=$release_file" >> "${GITHUB_ENV:-/dev/null}"
}

# Cleanup existing release if tag was reassigned
cleanup_existing_release() {
  local tag="${TAG_NAME:-}"
  
  if [ -z "$tag" ]; then
    echo "❌ Error: TAG_NAME environment variable must be set"
    exit 1
  fi
  
  if gh release view "$tag" >/dev/null 2>&1; then
    echo "⚠️  Release $tag already exists, deleting it..."
    gh release delete "$tag" --yes --cleanup-tag 2>/dev/null || true
    echo "✅ Existing release deleted"
  else
    echo "ℹ️  No existing release found for $tag"
  fi
}

# Create GitHub release
create_release() {
  local tag="${TAG_NAME:-}"
  local version="${VERSION:-}"
  local repository="${GITHUB_REPOSITORY:-}"
  local commit_sha="${GITHUB_SHA:-}"
  
  if [ -z "$tag" ] || [ -z "$version" ] || [ -z "$repository" ] || [ -z "$commit_sha" ]; then
    echo "❌ Error: TAG_NAME, VERSION, GITHUB_REPOSITORY, and GITHUB_SHA must be set"
    exit 1
  fi
  
  local release_file="docs/release/radar-$version.js"
  local release_notes
  release_notes=$(generate_release_notes "$tag" "$version" "$repository" "$commit_sha")
  
  gh release create "$tag" \
    "$release_file" \
    --title "Release $tag" \
    --notes "$release_notes" \
    --target "$commit_sha"
  
  echo "✅ Release $tag created successfully"
  
  local release_url
  release_url=$(gh release view "$tag" --json url -q .url)
  echo "release_url=$release_url" >> "${GITHUB_OUTPUT:-/dev/null}"
}

# Add release summary
add_summary() {
  local tag="${TAG_NAME:-}"
  local version="${VERSION:-}"
  local release_url="${RELEASE_URL:-}"
  local repository="${GITHUB_REPOSITORY:-}"
  
  if [ -z "$tag" ] || [ -z "$version" ] || [ -z "$release_url" ] || [ -z "$repository" ]; then
    echo "❌ Error: TAG_NAME, VERSION, RELEASE_URL, and GITHUB_REPOSITORY must be set"
    exit 1
  fi
  
  generate_success_summary "$tag" "$version" "$release_url" "$repository"
}

# Run main function
main "$@"
