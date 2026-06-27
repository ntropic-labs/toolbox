import { defaultExportSelection, exportPngSizeChoices, type ExportSelection } from '@toolbox/export-engine';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ExportTab } from './export-tab';

const emptySelection: ExportSelection = {
  svg: false,
  pngSizes: [],
  favicon: false,
};

function render(props: Partial<Parameters<typeof ExportTab>[0]> = {}) {
  return renderToStaticMarkup(
    <ExportTab
      selection={defaultExportSelection}
      pngSizeChoices={exportPngSizeChoices}
      fileCount={4}
      exportInset={0}
      maxInset={40}
      exporting={false}
      onChange={() => undefined}
      onExportInsetChange={() => undefined}
      onDownload={() => undefined}
      {...props}
    />
  );
}

describe('ExportTab scoped picker', () => {
  it('renders a toggle for every export group and a chip per PNG size', () => {
    const html = render();

    expect(html).toContain('SVG source');
    expect(html).toContain('Favicon (.ico)');
    expect(html).not.toContain('iOS app icon set');
    expect(html).not.toContain('Android res/ folder');
    for (const size of exportPngSizeChoices) {
      expect(html).toContain(`>${size}</button>`);
    }
  });

  it('marks the chips for selected PNG sizes as pressed', () => {
    const html = render({ selection: { ...emptySelection, pngSizes: [512] } });

    expect(html).toContain('aria-pressed="true">512</button>');
    expect(html).toContain('aria-pressed="false">1024</button>');
  });

  it('labels the action Download for a single file and disables it when nothing is selected', () => {
    const html = render({ selection: emptySelection, fileCount: 0 });

    expect(html).toContain('Nothing selected');
    expect(html).toContain('Download');
    expect(html).not.toContain('Download ZIP');
    expect(html).toContain('disabled');
  });

  it('labels the action Download ZIP when more than one file is selected', () => {
    const html = render({ fileCount: 4 });

    expect(html).toContain('4 files');
    expect(html).toContain('Download ZIP');
  });

  it('shows the singular file count for exactly one file', () => {
    const html = render({ selection: { ...emptySelection, svg: true }, fileCount: 1 });

    expect(html).toContain('1 file<');
  });

  it('exposes the trim-edges control reflecting the current value', () => {
    const html = render({ exportInset: 12 });

    expect(html).toContain('Trim edges');
    expect(html).toContain('type="number"');
    expect(html).toContain('value="12"');
    expect(html).toContain('max="40"');
  });
});
