import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the CSV generation logic by capturing what exportResultsCSV produces
// Since it triggers a download, we mock DOM APIs
describe('exportResultsCSV', () => {
  let clickSpy;

  beforeEach(() => {
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURL;

    clickSpy = vi.fn();
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        return { click: clickSpy, href: '', download: '' };
      }
      return document.createElement(tag);
    });
  });

  async function getModule() {
    const mod = await import('./exportResults.js');
    return mod;
  }

  it('generates CSV with correct columns and ranking', async () => {
    const { exportResultsCSV } = await getModule();
    let blobContent = '';
    const OrigBlob = globalThis.Blob;
    globalThis.Blob = class {
      constructor(parts) { blobContent = parts[0]; }
    };

    exportResultsCSV([
      { name: 'Alice', score: 30 },
      { name: 'Bob', score: 20 },
      { name: 'Charlie', score: 10 },
    ], 'Test Quiz');

    expect(blobContent).toContain('Rank,Name,Score');
    expect(blobContent).toContain('1,Alice,30');
    expect(blobContent).toContain('2,Bob,20');
    expect(blobContent).toContain('3,Charlie,10');

    globalThis.Blob = OrigBlob;
  });

  it('handles tied scores with same rank', async () => {
    const { exportResultsCSV } = await getModule();
    let blobContent = '';
    const OrigBlob = globalThis.Blob;
    globalThis.Blob = class {
      constructor(parts) { blobContent = parts[0]; }
    };

    exportResultsCSV([
      { name: 'Alice', score: 30 },
      { name: 'Bob', score: 30 },
      { name: 'Charlie', score: 10 },
    ], 'Tie Quiz');

    const lines = blobContent.split('\n');
    // Both Alice and Bob should be rank 1
    expect(lines[1]).toContain('1,');
    expect(lines[2]).toContain('1,');
    // Charlie should be rank 3
    expect(lines[3]).toContain('3,');

    globalThis.Blob = OrigBlob;
  });

  it('escapes special characters in names', async () => {
    const { exportResultsCSV } = await getModule();
    let blobContent = '';
    const OrigBlob = globalThis.Blob;
    globalThis.Blob = class {
      constructor(parts) { blobContent = parts[0]; }
    };

    exportResultsCSV([
      { name: 'O"Brien, Jr.', score: 10 },
    ], 'Special');

    // Name with comma and quote should be escaped
    expect(blobContent).toContain('"O""Brien, Jr."');

    globalThis.Blob = OrigBlob;
  });

  it('sorts participants by score descending', async () => {
    const { exportResultsCSV } = await getModule();
    let blobContent = '';
    const OrigBlob = globalThis.Blob;
    globalThis.Blob = class {
      constructor(parts) { blobContent = parts[0]; }
    };

    exportResultsCSV([
      { name: 'Charlie', score: 10 },
      { name: 'Alice', score: 30 },
      { name: 'Bob', score: 20 },
    ], 'Sort Test');

    const lines = blobContent.split('\n');
    expect(lines[1]).toContain('Alice');
    expect(lines[2]).toContain('Bob');
    expect(lines[3]).toContain('Charlie');

    globalThis.Blob = OrigBlob;
  });
});
