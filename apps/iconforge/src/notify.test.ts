import { describe, expect, it } from 'vitest';
import {
  getExportFailedNotice,
  getExportReadyNotice,
  getLayerDeletedNotice
} from './components/editor-notice-model';
import { noticeToToast } from './notify';

describe('noticeToToast', () => {
  it('keeps error toasts on screen until the user dismisses them', () => {
    expect(noticeToToast(getExportFailedNotice()).duration).toBe(Infinity);
  });

  it('auto-dismisses transient confirmations after a few seconds', () => {
    expect(noticeToToast(getExportReadyNotice(1, 'icon.svg')).duration).toBe(5000);
    expect(noticeToToast(getLayerDeletedNotice('text')).duration).toBe(5000);
  });

  it('routes a notice to the matching sonner variant, carrying its copy', () => {
    expect(noticeToToast(getLayerDeletedNotice('text'))).toMatchObject({
      variant: 'info',
      title: 'Layer deleted',
      description: 'text was removed. Use Undo to restore it.'
    });
  });
});
