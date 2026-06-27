import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ComponentView } from './component-view';

describe('ComponentView', () => {
  it('renders the generated code in the textarea fallback and a Copy control', () => {
    const code = 'export default Icon;';
    const html = renderToStaticMarkup(
      <ComponentView code={code} label="React component" onCopy={() => {}} theme="dark" />
    );
    expect(html).toContain('export default Icon;');
    expect(html).toContain('Copy');
    expect(html).toMatch(/<textarea[^>]*\sreadOnly=""/);
  });
});
