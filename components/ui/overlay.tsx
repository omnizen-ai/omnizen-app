'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface OverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isVisible: boolean;
}

export function Overlay({ isVisible, className, onClick, ...props }: OverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className
      )}
      onClick={onClick}
      {...props}
    />
  );
}