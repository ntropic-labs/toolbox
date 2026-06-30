import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/utils';

export const alertVariants = cva('flex items-start gap-2.5 rounded-lg border px-3 py-2.5', {
  variants: {
    variant: {
      info: 'border-border bg-secondary',
      warning: 'border-primary/40 border-l-[3px] border-l-primary bg-primary/10'
    }
  },
  defaultVariants: {
    variant: 'info'
  }
});

const variantIcon = {
  info: 'ℹ',
  warning: '⚠'
} as const;

export interface AlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof alertVariants> {
  readonly title?: ReactNode;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { className, variant, title, children, role = 'alert', ...props },
  ref
) {
  const resolved = variant ?? 'info';
  return (
    <div ref={ref} role={role} className={cn(alertVariants({ variant }), className)} {...props}>
      <span aria-hidden="true" className="shrink-0 text-sm leading-tight text-primary">
        {variantIcon[resolved]}
      </span>
      <div className="flex flex-col gap-0.5">
        {title ? <strong className="text-xs font-semibold text-foreground">{title}</strong> : null}
        <div className="m-0 text-[11.5px] leading-relaxed text-muted-foreground [&_code]:rounded [&_code]:border [&_code]:border-border [&_code]:bg-secondary [&_code]:px-1 [&_code]:text-[11px] [&_code]:text-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
});
