import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/utils';

export const buttonVariants = cva('if-button inline-flex items-center justify-center gap-1.5', {
  variants: {
    variant: {
      primary: 'if-button-primary',
      secondary: 'if-button-secondary',
      ghost: 'if-button-ghost',
      danger: 'if-button-danger'
    }
  },
  defaultVariants: {
    variant: 'secondary'
  }
});

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
