import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { createJsonIOHelpers } from '../../src/integration/json-io.js';

const { exportConfig, importConfig } = createJsonIOHelpers();

describe('radar-json-io exportConfig', () => {
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  let originalCreateElement;

  beforeEach(() => {
    originalCreateObjectURL = global.URL.createObjectURL;
    originalRevokeObjectURL = global.URL.revokeObjectURL;
    originalCreateElement = document.createElement;
  });

  afterEach(() => {
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
    document.createElement = originalCreateElement;
    mock.restore();
  });

  it('exports configuration JSON using slugged file names and cleans up listener', async () => {
    // Note: Bun doesn't have fake timers like vitest, using manual date mocking
    const now = new Date('2024-01-02T03:04:05Z');
    const originalDateNow = Date.now;
    Date.now = () => now.getTime();

    const button = document.createElement('button');
    document.body.appendChild(button);

    const provider = mock(() => ({ value: 42 }));
    const onSuccess = mock();
    const onError = mock();

    const createObjectURL = mock(() => 'blob:12345');
    const revokeObjectURL = mock();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    const anchorDownloads = [];
    const anchorClicks = [];
    document.createElement = (tagName, options) => {
      const element = originalCreateElement.call(document, tagName, options);
      if (tagName === 'a') {
        const originalClick = element.click.bind(element);
        element.click = () => {
          anchorDownloads.push(element.download);
          anchorClicks.push(true);
          originalClick();
        };
      }
      return element;
    };

    const dispose = exportConfig(button, provider, {
      demoSlug: 'builder-demo',
      onSuccess,
      onError,
    });

    button.click();

    // Wait for async click handler to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(provider).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:12345');
    expect(anchorDownloads[0]).toMatch(/^builder-demo-\d{8}-\d{6}\.json$/);
    expect(onSuccess).toHaveBeenCalledWith({ fileName: anchorDownloads[0] });
    expect(onError).not.toHaveBeenCalled();

    dispose();
    button.click();
    await new Promise(resolve => setTimeout(resolve, 10));
    Date.now = originalDateNow;
    expect(provider).toHaveBeenCalledTimes(1);
  });
});

describe('radar-json-io importConfig', () => {
  let originalFileReader;
  let fileReaderResponse = '';
  let fileReaderShouldError = false;

  class FileReaderMock {
    constructor() {
      this.onload = null;
      this.onerror = null;
    }

    readAsText(file) {
      if (fileReaderShouldError) {
        this.onerror?.(new Event('error'));
        return;
      }
      this.onload?.({ target: { result: fileReaderResponse }, file });
    }
  }

  beforeEach(() => {
    originalFileReader = global.FileReader;
    global.FileReader = FileReaderMock;
    fileReaderResponse = '';
    fileReaderShouldError = false;
  });

  afterEach(() => {
    global.FileReader = originalFileReader;
    mock.restore();
  });

  function setFiles(input, files) {
    Object.defineProperty(input, 'files', {
      configurable: true,
      get: () => files,
    });
  }

  it('imports JSON configs and triggers success callback', async () => {
    const input = document.createElement('input');
    input.type = 'file';

    // Mock the value setter to avoid happy-dom restriction
    Object.defineProperty(input, 'value', {
      set: () => {}, // Allow setting to empty string
      get: () => '',
      configurable: true,
    });

    const applyConfig = mock();
    const onSuccess = mock();
    const onError = mock();

    fileReaderResponse = JSON.stringify({ demo: true });

    const dispose = importConfig(input, applyConfig, { onSuccess, onError });
    setFiles(input, [{ name: 'custom-config.json' }]);
    input.dispatchEvent(new Event('change'));

    // Wait for async file reading to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(applyConfig).toHaveBeenCalledWith({ demo: true });
    expect(onSuccess).toHaveBeenCalledWith({ fileName: 'custom-config.json' });
    expect(onError).not.toHaveBeenCalled();

    dispose();
  });

  it('surfaces parse errors with friendly messaging', () => {
    const input = document.createElement('input');
    input.type = 'file';
    const applyConfig = mock();
    const onError = mock();

    fileReaderResponse = '{invalid-json}';

    importConfig(input, applyConfig, { onError });
    setFiles(input, [{ name: 'broken.json' }]);
    input.dispatchEvent(new Event('change'));

    expect(onError).toHaveBeenCalledWith(
      'The selected file is not valid JSON. Please choose a valid radar configuration.'
    );
    expect(applyConfig).not.toHaveBeenCalled();
  });

  it('handles application errors thrown by applyConfig', () => {
    const input = document.createElement('input');
    input.type = 'file';
    const onError = mock();
    const applyConfig = mock(() => {
      throw new Error('Invalid rings');
    });

    fileReaderResponse = JSON.stringify({ quadrants: [] });

    importConfig(input, applyConfig, { onError });
    setFiles(input, [{ name: 'bad.json' }]);
    input.dispatchEvent(new Event('change'));

    expect(onError).toHaveBeenCalledWith('Invalid rings');
  });

  it('handles file read errors gracefully', () => {
    const input = document.createElement('input');
    input.type = 'file';
    const onError = mock();
    const applyConfig = mock();

    fileReaderShouldError = true;

    importConfig(input, applyConfig, { onError });
    setFiles(input, [{ name: 'any.json' }]);
    input.dispatchEvent(new Event('change'));

    expect(onError).toHaveBeenCalledWith('Failed to read the selected file. Please try again.');
    expect(applyConfig).not.toHaveBeenCalled();
  });
});
