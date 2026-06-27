import { describe, expect, it } from 'vitest';
import { thumbnailUri, tightThumbnailUri } from './project-thumb';

describe('thumbnailUri', () => {
  it('injects the SVG namespace so <img> can render stored icons', () => {
    const uri = thumbnailUri('<svg viewBox="0 0 24 24"><rect width="24" height="24" /></svg>');
    expect(decodeURIComponent(uri)).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('does not double up an existing namespace', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>';
    const decoded = decodeURIComponent(thumbnailUri(svg));
    expect(decoded.match(/xmlns=/g)).toHaveLength(1);
  });
});

describe('tightThumbnailUri', () => {
  it('falls back to a namespaced data URI when there is no DOM to measure with', () => {
    const uri = tightThumbnailUri(
      '<svg viewBox="0 0 1024 1024"><rect x="160" y="160" width="704" height="704" /></svg>'
    );
    expect(uri.startsWith('data:image/svg+xml')).toBe(true);
    expect(decodeURIComponent(uri)).toContain('xmlns="http://www.w3.org/2000/svg"');
  });
});
