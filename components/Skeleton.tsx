import * as React from 'react';

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div 
      data-slot="skeleton" 
      className={cn('animate-pulse rounded-md bg-white/5', className)} 
      {...props} 
    />
  );
}

export { Skeleton };