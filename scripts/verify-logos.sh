#!/bin/bash

# Verify all logo files referenced in ai.html actually exist

set -euo pipefail

HTML_FILE="docs/ai.html"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Verifying logo files..."

missing=0
found=0

while IFS= read -r logo_path; do
    if [ -f "docs/$logo_path" ]; then
        found=$((found + 1))
    else
        echo -e "${RED}✗ Missing: $logo_path${NC}"
        missing=$((missing + 1))
    fi
done < <(grep 'logo: "' "$HTML_FILE" | sed 's/.*logo: "\([^"]*\)".*/\1/')

echo ""
echo -e "${GREEN}Found: $found${NC}"
if [ $missing -gt 0 ]; then
    echo -e "${RED}Missing: $missing${NC}"
else
    echo -e "${GREEN}Missing: 0${NC}"
    echo -e "${GREEN}🎉 All logo files verified!${NC}"
fi
