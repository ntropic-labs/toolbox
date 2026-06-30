import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CodeView } from './code-view';

function render(props: Partial<Parameters<typeof CodeView>[0]> = {}) {
  return renderToStaticMarkup(
    <CodeView
      value={'<svg viewBox="0 0 24 24"></svg>'}
      diagnostics={[]}
      onChange={() => undefined}
      onPrettify={() => undefined}
      onOptimize={() => undefined}
      optimizing={false}
      {...props}
    />
  );
}

describe('CodeView', () => {
  it('renders the source text inside the editor textarea', () => {
    const html = render();

    expect(html).toContain('<textarea');
    expect(html).toContain('&lt;svg');
  });

  it('lists each diagnostic message when the source is invalid', () => {
    const html = render({ value: '<svg>', diagnostics: [{ message: 'Unclosed tag svg.' }] });

    expect(html).toContain('<ul');
    expect(html).toContain('Unclosed tag svg.');
  });

  it('renders no diagnostics list when the source is valid', () => {
    const html = render();

    expect(html).not.toContain('<ul');
  });

  it('offers Prettify and Optimize actions above the editor', () => {
    const html = render();

    expect(html).toContain('>Prettify</button>');
    expect(html).toContain('>Optimize</button>');
  });

  it('shows progress and disables Optimize while optimizing', () => {
    const html = render({ optimizing: true });

    expect(html).toMatch(
      /<button[^>]*\bdisabled[^>]*title="Minify the SVG[^"]*"[^>]*>Optimizing…<\/button>/
    );
  });
});
