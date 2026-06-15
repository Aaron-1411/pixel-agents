import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { isValidLayout, readLayoutFromFile, writeLayoutToFile } from '../src/layoutPersistence.js';

/** A minimal layout that satisfies every structural invariant. */
function validLayout(): Record<string, unknown> {
  return {
    version: 1,
    cols: 2,
    rows: 2,
    tiles: [0, 0, 0, 0],
    furniture: [],
  };
}

describe('isValidLayout', () => {
  it('accepts a well-formed layout', () => {
    expect(isValidLayout(validLayout())).toBe(true);
  });

  it('accepts an optional tileColors array', () => {
    expect(isValidLayout({ ...validLayout(), tileColors: [null, null, null, null] })).toBe(true);
  });

  it('rejects non-object input', () => {
    expect(isValidLayout(null)).toBe(false);
    expect(isValidLayout(undefined)).toBe(false);
    expect(isValidLayout('layout')).toBe(false);
    expect(isValidLayout(42)).toBe(false);
  });

  it('rejects a wrong or missing version', () => {
    expect(isValidLayout({ ...validLayout(), version: 2 })).toBe(false);
    const { version: _version, ...noVersion } = validLayout();
    expect(isValidLayout(noVersion)).toBe(false);
  });

  it('rejects when tiles is not an array', () => {
    expect(isValidLayout({ ...validLayout(), tiles: 'nope' })).toBe(false);
    const { tiles: _tiles, ...noTiles } = validLayout();
    expect(isValidLayout(noTiles)).toBe(false);
  });

  it('rejects when furniture is not an array', () => {
    expect(isValidLayout({ ...validLayout(), furniture: {} })).toBe(false);
    const { furniture: _furniture, ...noFurniture } = validLayout();
    expect(isValidLayout(noFurniture)).toBe(false);
  });

  it('rejects non-positive or non-integer dimensions', () => {
    expect(isValidLayout({ ...validLayout(), cols: 0, tiles: [] })).toBe(false);
    expect(isValidLayout({ ...validLayout(), rows: -1 })).toBe(false);
    expect(isValidLayout({ ...validLayout(), cols: 1.5 })).toBe(false);
    expect(isValidLayout({ ...validLayout(), cols: '2' })).toBe(false);
  });

  it('rejects when tiles.length does not equal cols * rows', () => {
    expect(isValidLayout({ ...validLayout(), tiles: [0, 0, 0] })).toBe(false);
    expect(isValidLayout({ ...validLayout(), cols: 3 })).toBe(false);
  });

  it('rejects when tileColors is present but not an array', () => {
    expect(isValidLayout({ ...validLayout(), tileColors: {} })).toBe(false);
  });
});

describe('readLayoutFromFile', () => {
  // getLayoutFilePath() builds from os.homedir(), which honours $HOME on POSIX,
  // so redirecting HOME lets the real file I/O run against a throwaway dir.
  const originalHome = process.env.HOME;
  let tempHome: string;

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'pxl-layout-read-test-'));
    process.env.HOME = tempHome;
  });

  afterEach(() => {
    if (originalHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = originalHome;
    }
    fs.rmSync(tempHome, { recursive: true, force: true });
  });

  function writeRawLayout(contents: string): void {
    const dir = path.join(tempHome, '.pixel-agents');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'layout.json'), contents, 'utf-8');
  }

  it('returns null when no layout file exists', () => {
    expect(readLayoutFromFile()).toBeNull();
  });

  it('round-trips a valid layout written by writeLayoutToFile', () => {
    writeLayoutToFile(validLayout());
    expect(readLayoutFromFile()).toEqual(validLayout());
  });

  it('returns null for malformed JSON', () => {
    writeRawLayout('{ not valid json');
    expect(readLayoutFromFile()).toBeNull();
  });

  it('returns null for a parseable but structurally invalid layout', () => {
    writeRawLayout(JSON.stringify({ ...validLayout(), furniture: 'nope' }));
    expect(readLayoutFromFile()).toBeNull();
  });
});
