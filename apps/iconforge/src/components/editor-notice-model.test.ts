import { describe, expect, it } from 'vitest';
import { getExportTextWarningNotice } from './editor-notice-model';

describe('getExportTextWarningNotice', () => {
  it('uses singular copy for one un-bakeable text layer', () => {
    const notice = getExportTextWarningNotice(1);
    expect(notice.kind).toBe('info');
    expect(notice.body).toContain('One text layer');
  });

  it('uses plural copy with the count for several un-bakeable text layers', () => {
    const notice = getExportTextWarningNotice(3);
    expect(notice.kind).toBe('info');
    expect(notice.body).toContain('3 text layers');
  });
});
