'use client';

import * as React from 'react';
import { X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePanelState } from '@/lib/hooks/use-panel-state';
import { QuickCreateMenu } from '@/components/ui/quick-create-menu';

interface ResizablePanelProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

// Panel title mapping
const panelTitles: Record<string, string> = {
  'bookkeeping/general-ledger': 'General Ledger',
  'bookkeeping/bills': 'Bills',
  'bookkeeping/invoices': 'Invoices',
  'banking/payment-methods': 'Payment Methods',
  'banking/transactions': 'Transactions',
  'sales/crm': 'CRM',
  'sales/orders': 'Sales Orders',
  'sales/quotations': 'Quotations',
  'operations/inventory': 'Inventory',
  'operations/products': 'Products',
  'operations/warehouses': 'Warehouses',
  'purchasing/orders': 'Purchase Orders',
  'purchasing/vendors': 'Vendors',
  'purchasing/receipts': 'Purchase Receipts',
};

export function ResizableSidePanel({
  children,
  className,
  minWidth = 50, // percentage
  maxWidth = 80, // percentage
  defaultWidth = 600,
}: ResizablePanelProps) {
  const { isOpen, closePanel, setPanelWidth, panelType } = usePanelState();
  const [width, setWidth] = React.useState(defaultWidth);
  const panelTitle = panelType ? panelTitles[panelType] || 'Panel' : 'Panel';

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
            const newWidth = Math.max(
              window.innerWidth * (minWidth / 100), 
              Math.min(window.innerWidth * (maxWidth / 100), startWidth + delta)
            );
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
        {/* Professional Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{panelTitle}</h2>
            </div>
            <div className="flex items-center gap-2">
              <QuickCreateMenu />
              <button
                onClick={closePanel}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 p-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto" style={{ height: 'calc(100% - 73px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}