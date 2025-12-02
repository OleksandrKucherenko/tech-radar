#!/bin/bash

# Script to add logo fields to ALL entities in ai.html
# Uses the mapping file to find corresponding logos

set -euo pipefail

MAPPING_FILE="scripts/ai-logo-urls.json"
HTML_FILE="docs/ai.html"
BACKUP_FILE="docs/ai.html.backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Adding logo fields to all entities in ai.html...${NC}\n"

# Create backup
cp "$HTML_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✓ Created backup: $BACKUP_FILE${NC}\n"

# Read mapping and process each entry
added=0
skipped=0
total=0

while IFS='|' read -r label slug; do
    total=$((total + 1))

    # Escape special characters in label for sed
    label_escaped=$(echo "$label" | sed 's/[]\/$*.^[]/\\&/g')

    # Check if entity exists in HTML and doesn't already have a logo
    if grep -q "label: \"$label\"" "$HTML_FILE"; then
        # Check if this entity already has a logo field
        if grep -A1 "label: \"$label\"" "$HTML_FILE" | grep -q "logo:"; then
            echo -e "  ${YELLOW}⊘ Skipping: $label (already has logo)${NC}"
            skipped=$((skipped + 1))
        else
            # Add logo field after the label line
            # We need to be careful with sed to handle special characters
            sed -i "/label: \"${label_escaped}\",/a\\            logo: \"logos/${slug}-logo-64x64.webp\"," "$HTML_FILE"
            echo -e "  ${GREEN}✓ Added logo: $label${NC}"
            added=$((added + 1))
        fi
    else
        echo -e "  ${RED}✗ Not found in HTML: $label${NC}"
    fi
done < <(jq -r '.[] | "\(.label)|\(.slug)"' "$MAPPING_FILE")

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}Total processed: $total${NC}"
echo -e "${GREEN}Logos added: $added${NC}"
echo -e "${YELLOW}Already had logos: $skipped${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Verify final count
final_count=$(grep -c "logo:" "$HTML_FILE" || true)
echo -e "${GREEN}✓ Final logo count in ai.html: $final_count${NC}\n"

if [ "$final_count" -eq 107 ]; then
    echo -e "${GREEN}🎉 SUCCESS! All 107 entities now have logos!${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Expected 107 logos but found $final_count${NC}"
fi
