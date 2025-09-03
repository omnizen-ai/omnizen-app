'use client';

import * as React from 'react';
import { usePanelState, type PanelType } from '@/lib/hooks/use-panel-state';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid loading them until needed
const GeneralLedgerPage = dynamic(() => import('@/app/(chat)/bookkeeping/general-ledger/page'), {
  loading: () => <PanelLoading />
});

const BillsPage = dynamic(() => import('@/app/(chat)/bookkeeping/bills/page'), {
  loading: () => <PanelLoading />
});

const InvoicesPage = dynamic(() => import('@/app/(chat)/bookkeeping/invoices/page'), {
  loading: () => <PanelLoading />
});

const PaymentMethodsPage = dynamic(() => import('@/app/(chat)/banking/payment-methods/page'), {
  loading: () => <PanelLoading />
});

const TransactionsPage = dynamic(() => import('@/app/(chat)/banking/transactions/page'), {
  loading: () => <PanelLoading />
});

// Sales components
const CRMPage = dynamic(() => import('@/app/(chat)/sales/crm/page'), {
  loading: () => <PanelLoading />
});

const SalesOrdersPage = dynamic(() => import('@/app/(chat)/sales/orders/page'), {
  loading: () => <PanelLoading />
});

const QuotationsPage = dynamic(() => import('@/app/(chat)/sales/quotations/page'), {
  loading: () => <PanelLoading />
});

// Operations components
const InventoryPage = dynamic(() => import('@/app/(chat)/operations/inventory/page'), {
  loading: () => <PanelLoading />
});

const ProductsPage = dynamic(() => import('@/app/(chat)/operations/products/page'), {
  loading: () => <PanelLoading />
});

const WarehousesPage = dynamic(() => import('@/app/(chat)/operations/warehouses/page'), {
  loading: () => <PanelLoading />
});

// Purchasing components
const PurchaseOrdersPage = dynamic(() => import('@/app/(chat)/purchasing/orders/page'), {
  loading: () => <PanelLoading />
});

const VendorsPage = dynamic(() => import('@/app/(chat)/purchasing/vendors/page'), {
  loading: () => <PanelLoading />
});

const PurchaseReceiptsPage = dynamic(() => import('@/app/(chat)/purchasing/receipts/page'), {
  loading: () => <PanelLoading />
});

function PanelLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full size-8 border-b-2 border-primary"></div>
    </div>
  );
}

const panelComponents: Record<PanelType, React.ComponentType> = {
  'bookkeeping/general-ledger': GeneralLedgerPage,
  'bookkeeping/bills': BillsPage,
  'bookkeeping/invoices': InvoicesPage,
  'banking/payment-methods': PaymentMethodsPage,
  'banking/transactions': TransactionsPage,
  'sales/crm': CRMPage,
  'sales/orders': SalesOrdersPage,
  'sales/quotations': QuotationsPage,
  'operations/inventory': InventoryPage,
  'operations/products': ProductsPage,
  'operations/warehouses': WarehousesPage,
  'purchasing/orders': PurchaseOrdersPage,
  'purchasing/vendors': VendorsPage,
  'purchasing/receipts': PurchaseReceiptsPage,
};

export function PanelContentWrapper() {
  const { panelType } = usePanelState();

  if (!panelType) return null;

  const Component = panelComponents[panelType];

  if (!Component) {
    console.error(`No component found for panel type: ${panelType}`);
    return null;
  }

  return (
    <div className="h-full">
      <Component />
    </div>
  );
}