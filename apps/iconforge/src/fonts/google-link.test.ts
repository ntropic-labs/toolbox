import { describe, expect, it } from 'vitest';
import { parseGoogleFontsLink } from './google-link';

describe('Google Fonts link parsing', () => {
  it('parses a css2 link into family, weights, and css URL', () => {
    const parsed = parseGoogleFontsLink('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

    expect(parsed.family).toBe('Inter');
    expect(parsed.weights).toEqual([400, 700]);
    expect(parsed.cssUrl).toContain('fonts.googleapis.com/css2');
  });

  it('targets the requested family in a multi-family css2 link', () => {
    const parsed = parseGoogleFontsLink(
      'https://fonts.googleapis.com/css2?family=Inter:wght@400&family=Roboto+Mono:wght@500;700',
      'Roboto Mono',
    );

    expect(parsed.family).toBe('Roboto Mono');
    expect(parsed.weights).toEqual([500, 700]);
  });

  it('parses the legacy css endpoint weight syntax', () => {
    const parsed = parseGoogleFontsLink('https://fonts.googleapis.com/css?family=Open+Sans:400,700');

    expect(parsed.family).toBe('Open Sans');
    expect(parsed.weights).toEqual([400, 700]);
  });

  it('defaults to weight 400 when the link names no weights', () => {
    const parsed = parseGoogleFontsLink('https://fonts.googleapis.com/css2?family=Inter');

    expect(parsed.family).toBe('Inter');
    expect(parsed.weights).toEqual([400]);
  });

  it('expands variable-range weights into the standard weights inside the range', () => {
    const parsed = parseGoogleFontsLink('https://fonts.googleapis.com/css2?family=Recursive:wght@300..800');

    expect(parsed.weights).toEqual([300, 400, 500, 600, 700, 800]);
  });

  it('parses ital,wght tuples and keeps only the weight values', () => {
    const parsed = parseGoogleFontsLink('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,700;1,400');

    expect(parsed.weights).toEqual([400, 700]);
  });

  it('rejects non-Google-Fonts hosts with an explicit error', () => {
    expect(() => parseGoogleFontsLink('https://example.com/css2?family=Inter')).toThrow(
      'Only fonts.googleapis.com links are supported.',
    );
  });

  it('rejects links without a family parameter with an explicit error', () => {
    expect(() => parseGoogleFontsLink('https://fonts.googleapis.com/css2?display=swap')).toThrow(
      'The link does not name a font family.',
    );
  });
});
