/**
 * Tests for description field support in builder.html
 * These tests verify that descriptions are properly:
 * - Added to entries
 * - Exported to JSON
 * - Included in share URLs
 * - Preserved during import/export
 */

import { beforeAll, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Builder Description Support', () => {
  let builderHtml: string;

  beforeAll(() => {
    builderHtml = readFileSync(resolve('docs/builder.html'), 'utf-8');
  });

  test('builder.html contains description textarea field', () => {
    expect(builderHtml).toContain('id="entryDescription"');
    expect(builderHtml).toContain('Description (Optional, supports Markdown)');
  });

  test('addOrUpdateEntry function captures description', () => {
    expect(builderHtml).toContain("const description = document.getElementById('entryDescription').value.trim();");
    expect(builderHtml).toContain('description: description || undefined');
  });

  test('editEntry function populates description field', () => {
    // Check that editEntry sets the description field value
    expect(builderHtml).toContain("document.getElementById('entryDescription').value = entry.description || '';");
  });

  test('cancelEdit function clears description field', () => {
    // Check that cancelEdit resets the description field
    expect(builderHtml).toContain("document.getElementById('entryDescription').value = '';");
  });

  test('updateEntriesList displays description preview', () => {
    // Check that the entry list shows description previews
    expect(builderHtml).toContain('entry.description');
    expect(builderHtml).toContain('.substring(0, 80)');
  });

  test('encodeStateToURL includes description', () => {
    // Check that share URLs include descriptions
    const encodeFunction = builderHtml.substring(
      builderHtml.indexOf('function encodeStateToURL()'),
      builderHtml.indexOf('function loadFromURL()')
    );
    expect(encodeFunction).toContain('if (entry.description) clean.description = entry.description;');
  });

  test('buildVisualizationConfigFromState includes description', () => {
    // Check that visualization config includes descriptions
    const buildFunction = builderHtml.substring(
      builderHtml.indexOf('function buildVisualizationConfigFromState()'),
      builderHtml.indexOf('function normalizeImportedConfig(')
    );
    expect(buildFunction).toContain('if (entry.description)');
    expect(buildFunction).toContain('clean.description = entry.description;');
  });

  test('generateEmbedCode includes description', () => {
    // Check that embed code includes descriptions
    const embedFunction = builderHtml.substring(
      builderHtml.indexOf('function generateEmbedCode()'),
      builderHtml.indexOf('function exportAsPNG()')
    );
    expect(embedFunction).toContain('if (entry.description)');
    expect(embedFunction).toContain('clean.description = entry.description;');
  });

  test('description field supports markdown', () => {
    // Check that the description textarea mentions markdown support
    expect(builderHtml).toContain('supports Markdown');
  });

  test('description is optional (not required)', () => {
    // Check that description is marked as optional
    expect(builderHtml).toContain('Description (Optional');
  });

  test('renderRadar includes descriptionTransform for markdown', () => {
    // Check that renderRadar sets up descriptionTransform
    const renderFunction = builderHtml.substring(
      builderHtml.indexOf('function renderRadar()'),
      builderHtml.indexOf('function saveToLocalStorage()')
    );
    expect(renderFunction).toContain('descriptionTransform:');
    expect(renderFunction).toContain('marked.parse');
  });

  test('buildVisualizationConfigFromState includes descriptionTransform', () => {
    // Check that visualization config includes descriptionTransform
    const buildFunction = builderHtml.substring(
      builderHtml.indexOf('function buildVisualizationConfigFromState()'),
      builderHtml.indexOf('function normalizeImportedConfig(')
    );
    expect(buildFunction).toContain('descriptionTransform:');
    expect(buildFunction).toContain('marked.parse');
  });

  test('generateEmbedCode includes descriptionTransform in output', () => {
    // Check that embed code includes descriptionTransform
    const embedFunction = builderHtml.substring(
      builderHtml.indexOf('function generateEmbedCode()'),
      builderHtml.indexOf('function copyEmbedCode()')
    );
    expect(embedFunction).toContain('config.descriptionTransform');
    expect(embedFunction).toContain('marked.parse');
  });
});
