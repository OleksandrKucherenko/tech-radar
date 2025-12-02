#!/usr/bin/env bash

# Tech Radar Logo Downloader
# Downloads, resizes, and standardizes entity logos
# Requires: curl, ImageMagick (convert)

set -euo pipefail

# Configuration
CONFIG_FILE="${1:-docs/config.json}"
LOGOS_DIR="docs/logos"
SIZE="64x64"
PREFERRED_FORMAT="webp"
FALLBACK_FORMAT="png"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check dependencies
check_dependencies() {
    local missing_deps=()

    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi

    if ! command -v convert &> /dev/null; then
        missing_deps+=("imagemagick")
    fi

    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}Error: Missing required dependencies: ${missing_deps[*]}${NC}"
        echo "Please install them before running this script."
        echo ""
        echo "On Ubuntu/Debian:"
        echo "  sudo apt-get install curl imagemagick jq"
        echo ""
        echo "On macOS:"
        echo "  brew install curl imagemagick jq"
        exit 1
    fi
}

# Create logos directory if it doesn't exist
create_logos_dir() {
    if [ ! -d "$LOGOS_DIR" ]; then
        echo -e "${BLUE}Creating directory: $LOGOS_DIR${NC}"
        mkdir -p "$LOGOS_DIR"
    fi
}

# Sanitize vendor name for filename
sanitize_vendor_name() {
    local name="$1"
    # Convert to lowercase, replace spaces and special chars with hyphens
    echo "$name" | tr '[:upper:]' '[:lower:]' | \
        sed 's/[^a-z0-9]/-/g' | \
        sed 's/--*/-/g' | \
        sed 's/^-//' | \
        sed 's/-$//'
}

# Download and process a single logo
process_logo() {
    local label="$1"
    local url="$2"
    local vendor_slug
    local temp_file
    local output_file
    local format

    vendor_slug=$(sanitize_vendor_name "$label")
    temp_file=$(mktemp)

    echo -e "${BLUE}Processing: ${NC}$label"
    echo -e "  URL: $url"

    # Download the file
    if ! curl -sL -o "$temp_file" "$url"; then
        echo -e "${RED}  ✗ Failed to download${NC}"
        rm -f "$temp_file"
        return 1
    fi

    # Detect if ImageMagick supports WebP
    if convert -list format | grep -q "WEBP"; then
        format="$PREFERRED_FORMAT"
    else
        format="$FALLBACK_FORMAT"
        echo -e "${YELLOW}  ⚠ WebP not supported, using PNG${NC}"
    fi

    output_file="$LOGOS_DIR/${vendor_slug}-logo-${SIZE}.${format}"

    # Resize and convert the image
    # -resize: Resize to 64x64, maintaining aspect ratio
    # -gravity center: Center the image
    # -extent: Crop/extend to exactly 64x64
    # -background transparent: Use transparent background for PNG/WebP
    if convert "$temp_file" \
        -resize "${SIZE}^" \
        -gravity center \
        -extent "$SIZE" \
        -background transparent \
        -quality 90 \
        "$output_file" 2>/dev/null; then

        local file_size=$(du -h "$output_file" | cut -f1)
        echo -e "${GREEN}  ✓ Saved: $output_file ($file_size)${NC}"

        # Clean up temp file
        rm -f "$temp_file"
        return 0
    else
        echo -e "${RED}  ✗ Failed to convert image${NC}"
        rm -f "$temp_file"
        return 1
    fi
}

# Extract and process all logos from config.json
process_all_logos() {
    local total=0
    local success=0
    local failed=0

    echo -e "${BLUE}Reading configuration from: $CONFIG_FILE${NC}"
    echo ""

    # Check if config file exists
    if [ ! -f "$CONFIG_FILE" ]; then
        echo -e "${RED}Error: Config file not found: $CONFIG_FILE${NC}"
        exit 1
    fi

    # Extract entries with logos using jq
    local entries
    entries=$(jq -r '.entries[] | select(.logo != null) | "\(.label)|\(.logo)"' "$CONFIG_FILE")

    if [ -z "$entries" ]; then
        echo -e "${YELLOW}No entries with logos found in $CONFIG_FILE${NC}"
        exit 0
    fi

    # Process each entry
    while IFS='|' read -r label url; do
        ((total++))
        if process_logo "$label" "$url"; then
            ((success++))
        else
            ((failed++))
        fi
        echo ""
    done <<< "$entries"

    # Print summary
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Summary:${NC}"
    echo -e "  Total:   $total"
    echo -e "  ${GREEN}Success: $success${NC}"
    if [ $failed -gt 0 ]; then
        echo -e "  ${RED}Failed:  $failed${NC}"
    fi
    echo ""

    if [ $success -gt 0 ]; then
        echo -e "${GREEN}Logos saved to: $LOGOS_DIR${NC}"
        echo ""
        echo "To use local logos, update your config.json entries:"
        echo -e "${YELLOW}  \"logo\": \"logos/{vendor}-logo-64x64.{webp|png}\"${NC}"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Tech Radar Logo Downloader${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    check_dependencies
    create_logos_dir
    process_all_logos
}

main "$@"
