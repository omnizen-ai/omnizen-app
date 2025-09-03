'use client';

import * as React from 'react';
import { usePanelState } from '@/lib/hooks/use-panel-state';
import { ResizableSidePanel } from '@/components/ui/resizable-panel';
import { PanelContentWrapper } from '@/components/panel-content-wrapper';

export function PanelLayout({ children }: { children: React.ReactNode }) {
  const { isOpen, closePanel } = usePanelState();

  return (
    <>
      {/* Main content with overlay effect only on chat area */}
      <div className="relative h-full">
        {children}
        {/* Overlay that only dims the chat content, not the navigation */}
        {isOpen && (
          <div
            className="absolute inset-0 bg-black/50 transition-opacity duration-300 z-30"
            onClick={closePanel}
          />
        )}
      </div>

      {/* Resizable Panel - higher z-index than overlay */}
      <ResizableSidePanel>
        <PanelContentWrapper />
      </ResizableSidePanel>
    </>
  );
}