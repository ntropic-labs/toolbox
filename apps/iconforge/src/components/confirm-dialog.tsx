import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '@toolbox/ui';

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
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-[color-mix(in_srgb,#000_55%,transparent)] p-5 backdrop-blur-[3px]"
      onClick={onCancel}
    >
      <div
        className="grid w-[min(340px,100%)] gap-[11px] rounded-xl border border-border-strong bg-card p-4 shadow-[0_24px_60px_-20px_rgb(0_0_0_/_70%)] motion-safe:animate-[if-confirm-in_140ms_cubic-bezier(0.22,1,0.36,1)]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="if-confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-[9px]">
          <span
            className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[7px] bg-[color-mix(in_srgb,var(--gold)_16%,transparent)] text-gold data-[danger]:bg-[color-mix(in_srgb,var(--destructive)_16%,transparent)] data-[danger]:text-destructive [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2]"
            data-danger={danger || undefined}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24">
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </span>
          <span className="text-[13.5px] font-bold tracking-[-0.01em]" id="if-confirm-title">
            {title}
          </span>
        </div>
        <p className="m-0 text-[12px] leading-[1.55] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
          {body}
        </p>
        <div className="mt-px flex justify-end gap-2">
          <Button ref={cancelRef} variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
