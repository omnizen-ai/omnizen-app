'use client';

import * as React from 'react';
import { X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePanelState } from '@/lib/hooks/use-panel-state';

interface ResizablePanelProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

export function ResizableSidePanel({
  children,
  className,
  minWidth = 400,
  maxWidth = 80, // percentage
  defaultWidth = 600,
}: ResizablePanelProps) {
  const { isOpen, closePanel, setPanelWidth } = usePanelState();
  const [width, setWidth] = React.useState(defaultWidth);

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closePanel();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closePanel]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-y-0 right-0 z-50 flex',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        'data-[state=closed]:duration-300 data-[state=open]:duration-500',
        className
      )}
      data-state={isOpen ? 'open' : 'closed'}
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className="group flex w-4 cursor-col-resize items-center justify-center bg-border hover:bg-muted transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = width;

          const handleMouseMove = (e: MouseEvent) => {
            const delta = startX - e.clientX;
            const newWidth = Math.max(minWidth, Math.min(window.innerWidth * (maxWidth / 100), startWidth + delta));
            setWidth(newWidth);
            setPanelWidth(newWidth);
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>

      {/* Panel Content */}
      <div className="flex-1 bg-background border-l shadow-lg overflow-hidden relative">
        {/* Close Button */}
        <div className="absolute right-4 top-4 z-10">
          <button
            onClick={closePanel}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-background/80 backdrop-blur-sm p-2 shadow-sm"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Content with consistent top padding */}
        <div className="h-full overflow-y-auto pt-16">
          {children}
        </div>
      </div>
    </div>
  );
}