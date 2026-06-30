import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/utils';

export const buttonVariants = cva(
  'inline-flex min-h-[32px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[13px] leading-[1.2] outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-[0.48] focus-visible:[outline:2px_solid_var(--ring)] focus-visible:outline-offset-2 [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:flex-none [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2]',
  {
    variants: {
      variant: {
        primary:
          'border-primary bg-primary text-primary-foreground enabled:hover:border-primary-hover enabled:hover:bg-primary-hover',
        secondary:
          'border-border bg-secondary text-foreground enabled:hover:border-border-strong enabled:hover:bg-accent',
        ghost:
          'border-transparent bg-transparent text-muted-foreground enabled:hover:border-border-strong enabled:hover:bg-accent',
        danger:
          'border-destructive bg-transparent text-destructive enabled:hover:border-danger-hover enabled:hover:bg-[color-mix(in_srgb,var(--destructive)_14%,transparent)] enabled:hover:text-danger-hover'
      }
    },
    defaultVariants: {
      variant: 'secondary'
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  readonly asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, asChild = false, type, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant }), className)}
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  );
});
