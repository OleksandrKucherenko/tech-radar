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

# Detect ImageMagick version and set appropriate command
if command -v magick &> /dev/null; then
    MAGICK_CMD="magick"  # ImageMagick v7
elif command -v convert &> /dev/null; then
    MAGICK_CMD="convert"  # ImageMagick v6
else
    MAGICK_CMD=""  # Not installed
fi

# Check dependencies
check_dependencies() {
    local action="$1"
    local missing_deps=()

    # jq is always required
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi

    # curl needed for auto-fetch and download operations
    if [[ "$action" == "--auto-fetch" ]] || [[ "$action" == "--download" ]] || [[ "$action" == "--all" ]]; then
        if ! command -v curl &> /dev/null; then
            missing_deps+=("curl")
        fi
    fi

    # imagemagick only needed for download operations
    if [[ "$action" == "--download" ]] || [[ "$action" == "--all" ]]; then
        if [ -z "$MAGICK_CMD" ]; then
            missing_deps+=("imagemagick")
        fi
        if ! command -v bun &> /dev/null; then
            missing_deps+=("bun")
        fi
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}Error: Missing required dependencies: ${missing_deps[*]}${NC}"
        echo "Please install them before running this script."
        echo ""
        echo "On Ubuntu/Debian:"
        echo "  sudo apt-get install curl imagemagick jq"
        echo "  # plus Bun: https://bun.sh/docs/installation"
        echo ""
        echo "On macOS:"
        echo "  brew install curl imagemagick jq"
        echo "  # plus Bun: https://bun.sh/docs/installation"
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

# Convert vendor name to likely domain
vendor_to_domain() {
    local vendor="$1"
    local vendor_lower=$(echo "$vendor" | tr '[:upper:]' '[:lower:]')

    # Handle specific known mappings
    case "$vendor_lower" in
        "anthropic claude"|"claude desktop"|"claude code cli")
            echo "anthropic.com"
            ;;
        "chatgpt desktop"|"openai")
            echo "openai.com"
            ;;
        "google gemini"|"google ai studio"|"google vertex ai"|"notebooklm")
            echo "google.com"
            ;;
        "microsoft copilot")
            echo "microsoft.com"
            ;;
        "github copilot"|"copilot cli"|"codex cli"|"codex vscode")
            echo "github.com"
            ;;
        "vscode + copilot")
            echo "code.visualstudio.com"
            ;;
        "jetbrains ai")
            echo "jetbrains.com"
            ;;
        "docker mcp toolkit")
            echo "docker.com"
            ;;
        "perplexity ai")
            echo "perplexity.ai"
            ;;
        "hugging face")
            echo "huggingface.co"
            ;;
        "xai grok")
            echo "x.ai"
            ;;
        "amazon q"|"amazon q developer cli")
            echo "aws.amazon.com"
            ;;
        "azure ai foundry"|"azure devops mcp")
            echo "azure.microsoft.com"
            ;;
        "brave search mcp")
            echo "brave.com"
            ;;
        "exa mcp")
            echo "exa.ai"
            ;;
        "gemini cli")
            echo "google.com"
            ;;
        "aider cli")
            echo "aider.chat"
            ;;
        "bolt.new")
            echo "bolt.new"
            ;;
        "v0")
            echo "v0.dev"
            ;;
        *)
            # Generic conversion: extract main word and add .com/.ai/.io
            local main_word=$(echo "$vendor_lower" | \
                sed 's/ cli$//' | \
                sed 's/ desktop$//' | \
                sed 's/ vscode$//' | \
                sed 's/ intellij$//' | \
                sed 's/ mcp$//' | \
                sed 's/ ai$//' | \
                sed 's/[^a-z0-9]//g' | \
                head -c 20)

            # Try common TLDs
            if [ -n "$main_word" ]; then
                echo "${main_word}.com"
            else
                echo ""
            fi
            ;;
    esac
}

# Auto-fetch logos using Logo API providers
auto_fetch_logos() {
    local api_token="$1"
    local provider="${2:-logokit}"  # Default to logokit if not specified

    if [ -z "$api_token" ]; then
        echo -e "${RED}Error: API token required${NC}"
        echo "Usage: $0 --auto-fetch YOUR_API_TOKEN [PROVIDER]"
        echo ""
        echo "Providers:"
        echo "  logokit  - LogoKit API (default) - https://logokit.com"
        echo "  logodev  - Logo.dev API - https://logo.dev"
        echo ""
        echo "Examples:"
        echo "  $0 --auto-fetch pk_abc123xyz logokit"
        echo "  $0 --auto-fetch pk_Z7FJx3u logodev"
        exit 1
    fi

    # Validate provider
    if [[ "$provider" != "logokit" && "$provider" != "logodev" ]]; then
        echo -e "${RED}Error: Invalid provider '$provider'${NC}"
        echo "Valid providers: logokit, logodev"
        exit 1
    fi

    # Set provider-specific details
    local provider_name
    local api_base_url
    case "$provider" in
        logokit)
            provider_name="LogoKit"
            api_base_url="https://img.logokit.com"
            ;;
        logodev)
            provider_name="Logo.dev"
            api_base_url="https://img.logo.dev"
            ;;
    esac

    echo -e "${BLUE}Auto-fetching logos using ${provider_name} API${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ ! -f "$MAPPING_FILE" ]; then
        echo -e "${RED}Error: Mapping file not found: $MAPPING_FILE${NC}"
        echo "Please run --generate-mapping first"
        exit 1
    fi

    local total_vendors=$(jq 'length' "$MAPPING_FILE")
    local missing_vendors=$(jq '[.[] | select(.status == "missing")] | length' "$MAPPING_FILE")
    local existing_vendors=$(jq '[.[] | select(.status == "found")] | length' "$MAPPING_FILE")
    local processed=0
    local found=0
    local fixed=0
    local failed=0

    echo -e "Total vendors: $total_vendors"
    echo -e "  Existing logos: $existing_vendors"
    echo -e "  Missing logos: $missing_vendors"
    echo ""

    # Create temporary file for updates
    local temp_mapping=$(mktemp)
    cp "$MAPPING_FILE" "$temp_mapping"

    # Process ALL vendors (validate existing + fetch missing)
    while IFS= read -r entry; do
        local label=$(echo "$entry" | jq -r '.label')
        local slug=$(echo "$entry" | jq -r '.slug')
        local current_url=$(echo "$entry" | jq -r '.url')
        local current_status=$(echo "$entry" | jq -r '.status')

        processed=$((processed + 1))
        echo -e "${CYAN}[$processed/$total_vendors]${NC} $label"

        # Get likely domain
        local domain=$(vendor_to_domain "$label")

        if [ -z "$domain" ]; then
            echo -e "  ${YELLOW}⚠ Could not determine domain${NC}"
            if [[ "$current_url" == *"PLACEHOLDER"* ]]; then
                failed=$((failed + 1))
            fi
            echo ""
            continue
        fi

        echo -e "  Domain: $domain"

        # Check if existing URL is valid
        local needs_update=false
        if [[ "$current_url" != *"PLACEHOLDER"* ]]; then
            echo -e "  Current: $current_url"
            echo -e "  ${BLUE}Validating existing URL...${NC}"

            local validate_file=$(mktemp)
            if curl -sf -o "$validate_file" "$current_url" 2>/dev/null; then
                if file "$validate_file" | grep -q "image"; then
                    echo -e "  ${GREEN}✓ Existing URL is valid${NC}"
                    rm -f "$validate_file"
                    echo ""
                    continue
                else
                    echo -e "  ${YELLOW}⚠ Existing URL returned invalid image${NC}"
                    needs_update=true
                fi
            else
                echo -e "  ${RED}✗ Existing URL is broken${NC}"
                needs_update=true
            fi
            rm -f "$validate_file"
        else
            needs_update=true
        fi

        # Try to fetch from provider
        if [ "$needs_update" = true ]; then
            local logo_url="${api_base_url}/${domain}?token=${api_token}"
            local test_file=$(mktemp)

            echo -e "  ${BLUE}Fetching from ${provider_name}...${NC}"

            if curl -sf -o "$test_file" "$logo_url" 2>/dev/null; then
                # Verify it's actually an image
                if file "$test_file" | grep -q "image"; then
                    if [[ "$current_url" == *"PLACEHOLDER"* ]]; then
                        echo -e "  ${GREEN}✓ Found new logo via ${provider_name}${NC}"
                        found=$((found + 1))
                    else
                        echo -e "  ${GREEN}✓ Fixed broken URL via ${provider_name}${NC}"
                        fixed=$((fixed + 1))
                    fi

                    # Update mapping file
                    local updated_json=$(jq --arg label "$label" --arg url "$logo_url" \
                        'map(if .label == $label then .url = $url | .status = "found" else . end)' \
                        "$temp_mapping")
                    echo "$updated_json" > "$temp_mapping"
                else
                    echo -e "  ${YELLOW}⚠ Invalid image response from ${provider_name}${NC}"
                    failed=$((failed + 1))
                fi
            else
                echo -e "  ${YELLOW}⚠ Logo not found on ${provider_name}${NC}"
                failed=$((failed + 1))
            fi

            rm -f "$test_file"
        fi

        echo ""
    done < <(jq -c '.[]' "$MAPPING_FILE")

    # Save updated mapping
    mv "$temp_mapping" "$MAPPING_FILE"

    # Show summary
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Summary${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  Processed: $processed"
    echo -e "  ${GREEN}New logos found: $found${NC}"
    if [ "$fixed" -gt 0 ]; then
        echo -e "  ${GREEN}Broken URLs fixed: $fixed${NC}"
    fi
    echo -e "  ${YELLOW}Not found: $failed${NC}"
    echo ""

    local remaining=$(jq '[.[] | select(.status == "missing")] | length' "$MAPPING_FILE")
    local total_found=$(jq '[.[] | select(.status == "found")] | length' "$MAPPING_FILE")

    echo -e "Updated mapping file: $MAPPING_FILE"
    echo -e "  Total found: ${GREEN}$total_found${NC}/$total_vendors"
    echo -e "  Still missing: ${YELLOW}$remaining${NC}"
    echo ""

    if [ "$found" -gt 0 ] || [ "$fixed" -gt 0 ]; then
        local changes=$((found + fixed))
        echo -e "${GREEN}✓ Updated $changes logo URL(s)!${NC}"
        echo -e "Run ${CYAN}--download${NC} to download the logos"
    fi
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

    # Patch SVGs that use advanced CSS colors (e.g. OKLCH) that many SVG rasterizers don't support.
    # This prevents unexpected color shifts when ImageMagick rasterizes the SVG for resizing.
    if head -c 256 "$temp_file" | grep -qi "<svg"; then
        if grep -qi "oklch(" "$temp_file"; then
            echo -e "  ${BLUE}Patching SVG OKLCH colors...${NC}"
            if ! bun scripts/svg-patch.ts "$temp_file" >/dev/null; then
                echo -e "${RED}  ✗ Failed to patch SVG colors${NC}"
                rm -f "$temp_file"
                return 1
            fi
        fi
    fi

    # Detect format
    local format="$PREFERRED_FORMAT"
    if ! $MAGICK_CMD -list format | grep -q "WEBP"; then
        format="$FALLBACK_FORMAT"
        echo -e "${YELLOW}  ⚠ WebP not supported, using PNG${NC}"
    fi

    local output_file="$LOGOS_DIR/${slug}-logo-${SIZE}.${format}"

    # Process image
    if $MAGICK_CMD "$temp_file" \
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
        echo -e "${RED}  ✗ Failed to process image${NC}"
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
        total=$((total + 1))

        local label=$(echo "$entry" | jq -r '.label')
        local slug=$(echo "$entry" | jq -r '.slug')
        local url=$(echo "$entry" | jq -r '.url')

        if download_logo "$label" "$slug" "$url"; then
            if [[ "$url" == *"PLACEHOLDER"* ]]; then
                skipped=$((skipped + 1))
            else
                success=$((success + 1))
            fi
        else
            failed=$((failed + 1))
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
    --generate-mapping              Extract vendors and create/update URL mapping file
    --auto-fetch <TOKEN> [PROVIDER] Auto-fetch logos using Logo API (default: logokit)
    --download                      Download logos from mapping file
    --update-html                   Show which logos are available for ai.html
    --all                           Do everything: generate, download, update
    -h, --help                      Show this help message

PROVIDERS:
    logokit  - LogoKit API (default) - Free tier: 64x64 logos
    logodev  - Logo.dev API - Free tier with attribution

WORKFLOW (Automated):
    1. Generate mapping:  $0 --generate-mapping
    2. Auto-fetch logos:  $0 --auto-fetch YOUR_TOKEN [PROVIDER]
    3. Download logos:    $0 --download

WORKFLOW (Manual):
    1. Generate mapping:  $0 --generate-mapping
    2. Edit mapping file: $MAPPING_FILE
       (Replace PLACEHOLDER with actual logo URLs)
    3. Download logos:    $0 --download
    4. Update HTML:       Manually add logo paths to ai.html

EXAMPLES:
    # Automated workflow with LogoKit (default)
    $0 --generate-mapping
    $0 --auto-fetch pk_abc123xyz
    $0 --download

    # Automated workflow with Logo.dev
    $0 --generate-mapping
    $0 --auto-fetch pk_Z7FJx3u logodev
    $0 --download

    # Specify provider explicitly
    $0 --auto-fetch pk_abc123xyz logokit

    # Manual workflow
    $0 --generate-mapping
    vim $MAPPING_FILE  # Add missing URLs
    $0 --download

    # Quick start (manual placeholders)
    $0 --all

LOGO API TOKENS:
    LogoKit: Get free token at https://logokit.com
             Free tier: 64x64 resolution logos (perfect for our needs!)

    Logo.dev: Get free token at https://logo.dev
              Free tier: Requires attribution, high-resolution logos

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
        --auto-fetch)
            local token="${2:-}"
            local provider="${3:-logokit}"
            auto_fetch_logos "$token" "$provider"
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
