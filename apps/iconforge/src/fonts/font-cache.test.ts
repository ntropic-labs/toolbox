import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { getCachedFont, putCachedFont } from './font-cache';

describe('font byte cache', () => {
  it('returns null for an uncached key', async () => {
    expect(await getCachedFont('missing#400')).toBeNull();
  });

  it('round-trips bytes through IndexedDB', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]).buffer;
    await putCachedFont('roboto#400', bytes);
    const got = await getCachedFont('roboto#400');
    expect(got).not.toBeNull();
    expect(new Uint8Array(got!)).toEqual(new Uint8Array(bytes));
  });
});
