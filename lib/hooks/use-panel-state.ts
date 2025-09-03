'use client';

import { create } from 'zustand';

export type PanelType = 
  | 'bookkeeping/general-ledger'
  | 'bookkeeping/bills' 
  | 'bookkeeping/invoices'
  | 'banking/payment-methods'
  | 'banking/transactions'
  | 'sales/crm'
  | 'sales/orders'
  | 'sales/quotations'
  | 'operations/inventory'
  | 'operations/products'
  | 'operations/warehouses'
  | 'purchasing/orders'
  | 'purchasing/vendors'
  | 'purchasing/receipts';

interface PanelState {
  isOpen: boolean;
  panelType: PanelType | null;
  panelWidth: number;
  openPanel: (type: PanelType) => void;
  closePanel: () => void;
  setPanelWidth: (width: number) => void;
}

export const usePanelState = create<PanelState>((set) => ({
  isOpen: false,
  panelType: null,
  panelWidth: 600, // Default width in pixels
  
  openPanel: (type) => set({ 
    isOpen: true, 
    panelType: type 
  }),
  
  closePanel: () => set({ 
    isOpen: false, 
    panelType: null 
  }),
  
  setPanelWidth: (width) => set({ 
    panelWidth: width 
  }),
}));