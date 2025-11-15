#!/bin/bash
# Temporary script to help update demo HTML files with toolbar
# This is a helper - the actual updates are done via IDE tools

DEMOS=("demo-4x8" "demo-5x4" "demo-6x5" "demo-7x4" "demo-8x8")

echo "Demo files that need toolbar updates:"
for demo in "${DEMOS[@]}"; do
  echo "  - docs/${demo}.html"
done

echo ""
echo "Pattern to apply:"
echo "1. Add toolbar HTML after </nav>"
echo "2. Wrap radar_visualization call in renderRadar() function"
echo "3. Change radar_visualization({ to: const initialConfig = {"
echo "4. Change closing }); to: };"
echo "5. Add: renderRadar(initialConfig);"
echo "6. Add toolbar initialization"
