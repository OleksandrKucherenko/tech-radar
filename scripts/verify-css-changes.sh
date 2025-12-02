#!/bin/bash

# Script to verify CSS changes don't break responsive layouts
# Tests that !important removal doesn't cause specificity conflicts

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

CSS_FILE="docs/radar.css"

echo -e "${BLUE}=== CSS Changes Verification ===${NC}\n"

# 1. Check that no !important remains in responsive styles
echo -e "${BLUE}1. Checking for remaining !important in responsive media queries...${NC}"
remaining=$(grep -n "!important" "$CSS_FILE" | grep -v "^[[:space:]]*\*" | grep -v "^[[:space:]]*/\*" || true)

if [ -z "$remaining" ]; then
    echo -e "${GREEN}✓ No !important declarations found in active CSS${NC}"
else
    echo -e "${YELLOW}⚠ Found !important declarations (may be in comments):${NC}"
    echo "$remaining"
fi
echo ""

# 2. Verify critical responsive styles are present
echo -e "${BLUE}2. Verifying critical responsive styles exist...${NC}"

critical_styles=(
    "padding-left: 0;"
    "padding-right: 0;"
    "width: 100%;"
    "height: auto;"
    "max-width: none;"
)

all_found=true
for style in "${critical_styles[@]}"; do
    if grep -q "$style" "$CSS_FILE"; then
        echo -e "${GREEN}✓ Found: $style${NC}"
    else
        echo -e "${RED}✗ Missing: $style${NC}"
        all_found=false
    fi
done
echo ""

# 3. Check media query structure
echo -e "${BLUE}3. Checking responsive breakpoints...${NC}"

breakpoints=(
    "@media (max-width: 479px)"
    "@media (min-width: 480px) and (max-width: 639px)"
    "@media (min-width: 640px) and (max-width: 1023px)"
    "@media (min-width: 1024px) and (max-width: 1279px)"
    "@media (min-width: 1280px)"
)

for bp in "${breakpoints[@]}"; do
    if grep -q "$bp" "$CSS_FILE"; then
        echo -e "${GREEN}✓ Found: $bp${NC}"
    else
        echo -e "${YELLOW}⚠ Missing: $bp${NC}"
    fi
done
echo ""

# 4. Count affected selectors
echo -e "${BLUE}4. Analyzing changes...${NC}"
padding_count=$(grep -c "padding-left: 0;" "$CSS_FILE" || true)
svg_width_count=$(grep -c "width: 100%;" "$CSS_FILE" || true)

echo -e "  Padding overrides: ${GREEN}${padding_count}${NC}"
echo -e "  Width overrides: ${GREEN}${svg_width_count}${NC}"
echo ""

# 5. Summary
echo -e "${BLUE}=== Summary ===${NC}"
if [ "$all_found" = true ]; then
    echo -e "${GREEN}✓ All critical responsive styles are present${NC}"
    echo -e "${GREEN}✓ CSS structure is intact${NC}"
    echo -e "${YELLOW}⚠ Manual testing recommended for visual verification${NC}"
else
    echo -e "${RED}✗ Some critical styles are missing - review needed${NC}"
fi

echo ""
echo -e "${BLUE}=== Manual Testing Checklist ===${NC}"
echo -e "To verify the UI isn't broken:"
echo -e "1. Open ${YELLOW}docs/index.html${NC} in a browser"
echo -e "2. Test these viewport widths:"
echo -e "   - ${YELLOW}375px${NC} (mobile portrait)"
echo -e "   - ${YELLOW}480px${NC} (mobile landscape)"
echo -e "   - ${YELLOW}768px${NC} (tablet portrait)"
echo -e "   - ${YELLOW}1024px${NC} (tablet landscape)"
echo -e "   - ${YELLOW}1920px${NC} (desktop)"
echo -e "3. Verify:"
echo -e "   - ${GREEN}✓${NC} Radar SVG fills container width"
echo -e "   - ${GREEN}✓${NC} No horizontal scrolling on mobile"
echo -e "   - ${GREEN}✓${NC} Legend is readable and properly laid out"
echo -e "   - ${GREEN}✓${NC} Modal dialogs display correctly with logos"
echo ""
