import { describe, expect, it } from 'vitest';
import { parseSvg } from '@toolbox/svg-core';
import { defaultExportSelection, exportDownloadName, exportSelection, planExport } from './index';

function scene() {
  return parseSvg('<svg viewBox="0 0 24 24"><rect width="24" height="24" /></svg>').scene!;
}

describe('planExport', () => {
  it('plans svg + per-size combined png for the default selection', () => {
    const paths = planExport(defaultExportSelection, scene());
    expect(paths).toEqual(['icon.svg', 'icon-1024.png', 'icon-512.png', 'icon-192.png']);
  });
});

describe('exportDownloadName', () => {
  it('names a multi-file bundle after the project', () => {
    expect(exportDownloadName(['icon.svg', 'icon-512.png'], 'my-icon')).toBe('my-icon.zip');
  });

  it('renames a single file to the project, keeping size suffix and extension', () => {
    expect(exportDownloadName(['icon.svg'], 'my-icon')).toBe('my-icon.svg');
    expect(exportDownloadName(['icon-512.png'], 'my-icon')).toBe('my-icon-512.png');
    expect(exportDownloadName(['icon-background-512.png'], 'logo')).toBe('logo-background-512.png');
  });

  it('leaves the conventional favicon.ico name untouched', () => {
    expect(exportDownloadName(['favicon.ico'], 'my-icon')).toBe('favicon.ico');
  });

  it('falls back to the default names when no project name is given', () => {
    expect(exportDownloadName(['icon.svg'], undefined)).toBe('icon.svg');
    expect(exportDownloadName(['icon.svg', 'icon-512.png'], '  ')).toBe('iconforge-export.zip');
  });
});

describe('exportSelection naming', () => {
  it('names a single SVG export after the project', async () => {
    const { filename } = await exportSelection(
      scene(),
      { ...defaultExportSelection, svg: true, pngSizes: [], favicon: false },
      { name: 'my-icon' }
    );
    expect(filename).toBe('my-icon.svg');
  });
});
