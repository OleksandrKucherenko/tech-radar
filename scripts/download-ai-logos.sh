#!/usr/bin/env bash

# AI Tech Radar Logo Downloader
# Extracts vendors from ai.html, finds logos, and downloads them
# Creates placeholders for missing logos that humans can fill in later

set -euo pipefail

# Configuration
HTML_FILE="docs/ai.html"
LOGOS_DIR="docs/logos"
MAPPING_FILE="scripts/ai-logo-urls.json"
SIZE="64x64"
PREFERRED_FORMAT="webp"
FALLBACK_FORMAT="png"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check dependencies
check_dependencies() {
    local action="$1"
    local missing_deps=()

    # jq is always required
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi

    # curl and imagemagick only needed for download operations
    if [[ "$action" == "--download" ]] || [[ "$action" == "--all" ]]; then
        if ! command -v curl &> /dev/null; then
            missing_deps+=("curl")
        fi

        if ! command -v convert &> /dev/null; then
            missing_deps+=("imagemagick")
        fi
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

# Create directories
create_dirs() {
    mkdir -p "$LOGOS_DIR"
    mkdir -p "$(dirname "$MAPPING_FILE")"
}

# Sanitize vendor name for filename
sanitize_name() {
    local name="$1"
    echo "$name" | tr '[:upper:]' '[:lower:]' | \
        sed 's/[^a-z0-9]/-/g' | \
        sed 's/--*/-/g' | \
        sed 's/^-//' | \
        sed 's/-$//'
}

# Extract vendors from ai.html
extract_vendors() {
    # Extract label fields from the entries array in ai.html
    grep -o 'label: "[^"]*"' "$HTML_FILE" | \
        sed 's/label: "\(.*\)"/\1/' | \
        sort -u
}

# Common logo URL patterns for well-known vendors
get_common_logo_url() {
    local vendor="$1"
    local vendor_lower=$(echo "$vendor" | tr '[:upper:]' '[:lower:]')

    # Known logo URLs for common vendors
    case "$vendor_lower" in
        "openai")
            echo "https://cdn.openai.com/assets/og-image.png"
            ;;
        "anthropic claude"|"claude desktop"|"claude code cli")
            echo "https://www.anthropic.com/images/icons/app-icon.png"
            ;;
        "google gemini"|"google vertex ai"|"google ai studio")
            echo "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg"
            ;;
        "microsoft copilot")
            echo "https://www.microsoft.com/en-us/microsoft-365/blog/wp-content/uploads/sites/2/2023/11/Microsoft-Copilot_Icon_1200x630.png"
            ;;
        "github copilot"|"copilot cli"|"codex cli"|"codex vscode")
            echo "https://github.githubassets.com/images/modules/site/copilot/copilot.png"
            ;;
        "cursor")
            echo "https://cursor.sh/brand/icon.svg"
            ;;
        "perplexity ai")
            echo "https://www.perplexity.ai/favicon.svg"
            ;;
        "hugging face")
            echo "https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
            ;;
        "ollama")
            echo "https://github.com/ollama/ollama/raw/main/docs/images/ollama.png"
            ;;
        "langchain")
            echo "https://python.langchain.com/img/brand/wordmark.png"
            ;;
        "llamaindex")
            echo "https://www.llamaindex.ai/favicon.svg"
            ;;
        "pinecone")
            echo "https://www.pinecone.io/images/pinecone-logo.svg"
            ;;
        "qdrant")
            echo "https://qdrant.tech/img/logo_with_text.png"
            ;;
        "neo4j")
            echo "https://dist.neo4j.com/wp-content/uploads/neo4j-logo-2020-1.svg"
            ;;
        "elasticsearch")
            echo "https://www.elastic.co/static-res/images/elastic-logo-200.png"
            ;;
        "chromadb")
            echo "https://www.trychroma.com/chroma-logo.png"
            ;;
        "pgvector")
            echo "https://www.postgresql.org/media/img/about/press/elephant.png"
            ;;
        "notebooklm")
            echo "https://www.gstatic.com/lamda/images/notebooklm_app_icon_1920x1920_cd8af91fe8c5063c5244.png"
            ;;
        "obsidian"*)
            echo "https://obsidian.md/images/obsidian-logo-gradient.svg"
            ;;
        "n8n")
            echo "https://n8n.io/favicon.svg"
            ;;
        "flowise")
            echo "https://raw.githubusercontent.com/FlowiseAI/Flowise/main/images/flowise.png"
            ;;
        "langflow")
            echo "https://raw.githubusercontent.com/langflow-ai/langflow/main/docs/static/img/langflow-icon.png"
            ;;
        "docker"*)
            echo "https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png"
            ;;
        "vscode"*|"vs code"*)
            echo "https://code.visualstudio.com/assets/images/code-stable.png"
            ;;
        "jetbrains"*)
            echo "https://resources.jetbrains.com/storage/products/company/brand/logos/jetbrains.svg"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Create or update mapping file
create_mapping_file() {
    echo -e "${BLUE}Creating logo URL mapping file${NC}"

    local vendors_json="[]"

    while IFS= read -r vendor; do
        local slug=$(sanitize_name "$vendor")
        local known_url=$(get_common_logo_url "$vendor")

        # Check if already in mapping file
        if [ -f "$MAPPING_FILE" ] && jq -e ".[] | select(.label == \"$vendor\")" "$MAPPING_FILE" &>/dev/null; then
            continue
        fi

        local entry
        if [ -n "$known_url" ]; then
            entry=$(jq -n \
                --arg label "$vendor" \
                --arg slug "$slug" \
                --arg url "$known_url" \
                --arg status "found" \
                '{label: $label, slug: $slug, url: $url, status: $status}')
        else
            entry=$(jq -n \
                --arg label "$vendor" \
                --arg slug "$slug" \
                '{label: $label, slug: $slug, url: "PLACEHOLDER - Add logo URL here", status: "missing"}')
        fi

        vendors_json=$(echo "$vendors_json" | jq --argjson entry "$entry" '. + [$entry]')
    done < <(extract_vendors)

    # Merge with existing mapping if it exists
    if [ -f "$MAPPING_FILE" ]; then
        echo -e "${YELLOW}Merging with existing mapping file${NC}"
        local existing=$(cat "$MAPPING_FILE")
        vendors_json=$(jq -s '.[0] + .[1] | unique_by(.label)' <(echo "$existing") <(echo "$vendors_json"))
    fi

    echo "$vendors_json" | jq '.' > "$MAPPING_FILE"

    # Count stats
    local total=$(echo "$vendors_json" | jq 'length')
    local found=$(echo "$vendors_json" | jq '[.[] | select(.status == "found")] | length')
    local missing=$(echo "$vendors_json" | jq '[.[] | select(.status == "missing")] | length')

    echo -e "${GREEN}✓ Mapping file created: $MAPPING_FILE${NC}"
    echo -e "  Total vendors: $total"
    echo -e "  ${GREEN}Found: $found${NC}"
    echo -e "  ${YELLOW}Missing: $missing${NC}"
    echo ""

    if [ "$missing" -gt 0 ]; then
        echo -e "${YELLOW}⚠ Please edit $MAPPING_FILE to add URLs for missing logos${NC}"
        echo -e "${YELLOW}  Search pattern: \"PLACEHOLDER\"${NC}"
        echo ""
    fi
}

# Download and process a logo
download_logo() {
    local label="$1"
    local slug="$2"
    local url="$3"
    local temp_file=$(mktemp)

    echo -e "${BLUE}Processing: ${NC}$label"
    echo -e "  Slug: $slug"
    echo -e "  URL: $url"

    # Skip placeholders
    if [[ "$url" == *"PLACEHOLDER"* ]]; then
        echo -e "${YELLOW}  ⚠ Skipped: URL is a placeholder${NC}"
        return 1
    fi

    # Check if already exists
    local webp_file="$LOGOS_DIR/${slug}-logo-${SIZE}.webp"
    local png_file="$LOGOS_DIR/${slug}-logo-${SIZE}.png"
    if [ -f "$webp_file" ] || [ -f "$png_file" ]; then
        echo -e "${CYAN}  ℹ Already exists, skipping${NC}"
        return 0
    fi

    # Download
    if ! curl -sL -o "$temp_file" "$url"; then
        echo -e "${RED}  ✗ Failed to download${NC}"
        rm -f "$temp_file"
        return 1
    fi

    # Detect format
    local format="$PREFERRED_FORMAT"
    if ! convert -list format | grep -q "WEBP"; then
        format="$FALLBACK_FORMAT"
        echo -e "${YELLOW}  ⚠ WebP not supported, using PNG${NC}"
    fi

    local output_file="$LOGOS_DIR/${slug}-logo-${SIZE}.${format}"

    # Process image
    if convert "$temp_file" \
        -resize "${SIZE}^" \
        -gravity center \
        -extent "$SIZE" \
        -background transparent \
        -quality 90 \
        "$output_file" 2>/dev/null; then

        local file_size=$(du -h "$output_file" | cut -f1)
        echo -e "${GREEN}  ✓ Saved: $(basename "$output_file") ($file_size)${NC}"
        rm -f "$temp_file"
        return 0
    else
        echo -e "${RED}  ✗ Failed to convert image${NC}"
        rm -f "$temp_file"
        return 1
    fi
}

# Download all logos from mapping file
download_all_logos() {
    echo -e "${BLUE}Downloading logos from mapping file${NC}"
    echo ""

    if [ ! -f "$MAPPING_FILE" ]; then
        echo -e "${RED}Error: Mapping file not found: $MAPPING_FILE${NC}"
        echo "Run this script with --generate-mapping first"
        exit 1
    fi

    local total=0
    local success=0
    local skipped=0
    local failed=0

    while IFS= read -r entry; do
        ((total++))

        local label=$(echo "$entry" | jq -r '.label')
        local slug=$(echo "$entry" | jq -r '.slug')
        local url=$(echo "$entry" | jq -r '.url')

        if download_logo "$label" "$slug" "$url"; then
            if [[ "$url" == *"PLACEHOLDER"* ]]; then
                ((skipped++))
            else
                ((success++))
            fi
        else
            ((failed++))
        fi
        echo ""
    done < <(jq -c '.[]' "$MAPPING_FILE")

    # Print summary
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Summary:${NC}"
    echo -e "  Total:   $total"
    echo -e "  ${GREEN}Success: $success${NC}"
    echo -e "  ${CYAN}Skipped: $skipped${NC}"
    if [ $failed -gt 0 ]; then
        echo -e "  ${RED}Failed:  $failed${NC}"
    fi
    echo ""

    if [ $success -gt 0 ]; then
        echo -e "${GREEN}Logos saved to: $LOGOS_DIR${NC}"
    fi

    if [ $skipped -gt 0 ]; then
        echo -e "${YELLOW}To download remaining logos:${NC}"
        echo -e "${YELLOW}1. Edit $MAPPING_FILE${NC}"
        echo -e "${YELLOW}2. Replace PLACEHOLDER with actual logo URLs${NC}"
        echo -e "${YELLOW}3. Run: $0 --download${NC}"
    fi
}

# Update ai.html with local logo paths
update_html_with_logos() {
    echo -e "${BLUE}Updating ai.html with local logo paths${NC}"

    if [ ! -f "$MAPPING_FILE" ]; then
        echo -e "${RED}Error: Mapping file not found: $MAPPING_FILE${NC}"
        exit 1
    fi

    local backup_file="${HTML_FILE}.backup"
    cp "$HTML_FILE" "$backup_file"
    echo -e "${CYAN}Backup created: $backup_file${NC}"

    local updated=0
    local html_content=$(cat "$HTML_FILE")

    while IFS= read -r entry; do
        local label=$(echo "$entry" | jq -r '.label')
        local slug=$(echo "$entry" | jq -r '.slug')

        # Check if logo file exists
        local logo_file=""
        if [ -f "$LOGOS_DIR/${slug}-logo-${SIZE}.webp" ]; then
            logo_file="logos/${slug}-logo-${SIZE}.webp"
        elif [ -f "$LOGOS_DIR/${slug}-logo-${SIZE}.png" ]; then
            logo_file="logos/${slug}-logo-${SIZE}.png"
        fi

        if [ -n "$logo_file" ]; then
            # Add logo field to entry (if label matches and no logo exists)
            # This is a simple approach - for production, use a proper HTML/JS parser
            echo -e "${GREEN}  ✓ Logo available for: $label${NC}"
            ((updated++))
        fi
    done < <(jq -c '.[]' "$MAPPING_FILE")

    echo -e "${GREEN}Found $updated logos that can be added to ai.html${NC}"
    echo -e "${YELLOW}Note: Auto-updating ai.html requires manual editing${NC}"
    echo -e "${YELLOW}Add logo field to entries like: logo: \"logos/{slug}-logo-64x64.webp\"${NC}"
}

# Show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

AI Tech Radar Logo Downloader - Extract vendors from ai.html and download logos

OPTIONS:
    --generate-mapping    Extract vendors and create/update URL mapping file
    --download           Download logos from mapping file
    --update-html        Show which logos are available for ai.html
    --all                Do everything: generate, download, update
    -h, --help           Show this help message

WORKFLOW:
    1. Generate mapping:  $0 --generate-mapping
    2. Edit mapping file: $MAPPING_FILE
       (Replace PLACEHOLDER with actual logo URLs)
    3. Download logos:    $0 --download
    4. Update HTML:       Manually add logo paths to ai.html

EXAMPLES:
    # Full workflow
    $0 --generate-mapping
    vim $MAPPING_FILE  # Add missing URLs
    $0 --download

    # Or do it all at once (will have placeholders for unknown logos)
    $0 --all

EOF
}

# Main
main() {
    local action="${1:-}"

    if [ -z "$action" ] || [ "$action" = "-h" ] || [ "$action" = "--help" ]; then
        usage
        exit 0
    fi

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}AI Tech Radar Logo Downloader${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    check_dependencies "$action"
    create_dirs

    case "$action" in
        --generate-mapping)
            create_mapping_file
            ;;
        --download)
            download_all_logos
            ;;
        --update-html)
            update_html_with_logos
            ;;
        --all)
            create_mapping_file
            echo ""
            download_all_logos
            echo ""
            update_html_with_logos
            ;;
        *)
            echo -e "${RED}Error: Unknown option: $action${NC}"
            echo ""
            usage
            exit 1
            ;;
    esac
}

main "$@"
