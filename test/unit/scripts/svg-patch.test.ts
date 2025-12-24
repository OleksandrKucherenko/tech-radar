import { describe, expect, test } from 'bun:test';

import { patchSvgText } from '../../../scripts/svg-patch.ts';

describe('svg-patch', () => {
  test('converts OKLCH colors to sRGB hex', () => {
    const input = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="oklch(95% 0.15 108)"/>
</svg>`;

    const { patchedText, replacements } = patchSvgText(input);

    expect(replacements).toBe(1);
    expect(patchedText).not.toContain('oklch(');
    expect(patchedText).toContain('fill="#F8F676"');
  });
});
