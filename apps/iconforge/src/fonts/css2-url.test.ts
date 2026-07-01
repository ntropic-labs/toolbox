import { describe, expect, it } from 'vitest';
import { googleCss2Url } from './css2-url';

describe('googleCss2Url', () => {
  it('requests the full weight range so variable fonts arrive variable', () => {
    expect(googleCss2Url('Roboto')).toBe(
      'https://fonts.googleapis.com/css2?family=Roboto:wght@100..900&display=swap',
    );
  });

  it('encodes spaces in multi-word family names as plus signs', () => {
    expect(googleCss2Url('Roboto Mono')).toBe(
      'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100..900&display=swap',
    );
  });
});
