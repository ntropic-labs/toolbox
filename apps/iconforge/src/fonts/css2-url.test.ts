import { describe, expect, it } from 'vitest';
import { googleCss2Url } from './css2-url';

describe('googleCss2Url', () => {
  it('builds a css2 URL from a family name and weight', () => {
    expect(googleCss2Url('Roboto', 400)).toBe(
      'https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap',
    );
  });

  it('encodes spaces in multi-word family names as plus signs', () => {
    expect(googleCss2Url('Roboto Mono', 500)).toBe(
      'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&display=swap',
    );
  });
});
