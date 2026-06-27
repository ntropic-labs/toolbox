import { useEffect, useRef, type ReactNode } from 'react';

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel
}: {
  readonly open: boolean;
  readonly title: string;
  readonly body: ReactNode;
  readonly confirmLabel: string;
  readonly danger?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="if-modal-backdrop" onClick={onCancel}>
      <div
        className="if-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="if-confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="if-confirm-head">
          <span className="if-confirm-ic" data-danger={danger || undefined} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </span>
          <span className="if-confirm-title" id="if-confirm-title">
            {title}
          </span>
        </div>
        <p className="if-confirm-body">{body}</p>
        <div className="if-confirm-actions">
          <button
            ref={cancelRef}
            type="button"
            className="if-button if-button-ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`if-button ${danger ? 'if-button-danger' : 'if-button-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
