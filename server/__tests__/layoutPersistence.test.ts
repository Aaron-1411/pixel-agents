import { describe, expect, it } from 'vitest';

import { isValidLayout } from '../src/layoutPersistence.js';

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
