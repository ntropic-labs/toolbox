import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EditorShell } from './editor-shell';

describe('EditorShell', () => {
  it('renders the open-source header with brand, theme toggle, and GitHub link', () => {
    const html = renderToStaticMarkup(
      <EditorShell onToggleTheme={() => undefined} theme="dark">
        <div />
      </EditorShell>
    );

    expect(html).toContain('aria-label="IconForge open-source icon generator"');
    expect(html).toContain('Strike while the icon’s hot');
    expect(html).toContain('aria-label="Color theme"');
    expect(html).toContain('href="https://github.com/ntropic-labs/toolbox"');
    expect(html).toContain('GitHub');
  });
});
