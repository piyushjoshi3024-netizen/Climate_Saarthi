import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// shadcn/ui-style Button (JavaScript). Use `asChild`-free composition: pass `as={Link}` for links.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
        outline: 'border border-input bg-transparent text-foreground hover:bg-surface-2',
        ghost: 'text-foreground hover:bg-surface-2',
        link: 'text-primary underline-offset-4 hover:underline rounded-md',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        default: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

const Button = forwardRef(function Button({ className, variant, size, as: Comp = 'button', ...props }, ref) {
  const extra = Comp === 'button' && !props.type ? { type: 'button' } : {};
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...extra} {...props} />;
});

export { Button, buttonVariants };
