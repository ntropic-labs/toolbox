import { toast } from '@toolbox/ui';
import type { EditorNotice } from './components/editor-notice-model';

const TRANSIENT_MS = 5000;

export interface ToastDispatch {
  readonly variant: EditorNotice['kind'];
  readonly title: string;
  readonly description?: string | undefined;
  readonly duration: number;
}

export function noticeToToast(notice: EditorNotice): ToastDispatch {
  return {
    variant: notice.kind,
    title: notice.title,
    description: notice.body,
    duration: notice.kind === 'error' ? Infinity : TRANSIENT_MS
  };
}

export function showNotice(notice: EditorNotice): void {
  const { variant, title, description, duration } = noticeToToast(notice);
  toast[variant](title, { description, duration });
}
