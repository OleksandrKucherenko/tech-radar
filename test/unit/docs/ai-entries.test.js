import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('AI Tech Radar entries', () => {
  it('loads entries from docs/ai-entries.json', () => {
    const raw = readFileSync(resolve('docs/ai-entries.json'), 'utf-8');
    const data = JSON.parse(raw);

    expect(Array.isArray(data.entries)).toBe(true);
    expect(data.entries.length).toBeGreaterThan(0);
  });

  it('references ai-entries.json in docs/ai.html', () => {
    const html = readFileSync(resolve('docs/ai.html'), 'utf-8');

    expect(html).toContain('ai-entries.json');
  });
});
