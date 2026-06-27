import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PreviewModeToggle } from './preview-mode-toggle';

describe('PreviewModeToggle', () => {
  it('offers preview, code, react, and react native options', () => {
    const html = renderToStaticMarkup(<PreviewModeToggle mode="preview" onChange={() => {}} />);
    expect(html).toContain('Preview');
    expect(html).toContain('Code');
    expect(html).toContain('React');
    expect(html).toContain('React Native');
  });
});
