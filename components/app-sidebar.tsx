'use client';

import * as React from 'react';
import type { User } from 'next-auth';
import {
  Sun,
  Calculator,
  Building2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

export function AppSidebar({ user }: { user: User | undefined }) {
  const navMain = [
    {
      title: 'Omni',
      url: '/',
      icon: Sun,
      isActive: true,
      description: 'AI Partner & Assistant',
    },
    {
      title: 'Bookkeeping',
      url: '/bookkeeping',
      icon: Calculator,
      items: [
        {
          title: 'General Ledger',
          url: '/bookkeeping/general-ledger',
        },
        {
          title: 'Bills',
          url: '/bookkeeping/bills',
        },
        {
          title: 'Invoices',
          url: '/bookkeeping/invoices',
        },
        // {
        //   title: 'Financial Reports',
        //   url: '/bookkeeping/reports',
        // },
      ],
    },
    {
      title: 'Operations',
      url: '/operations',
      icon: Building2,
      items: [
        {
          title: 'Inventory',
          url: '/operations/inventory',
        },
        {
          title: 'Products',
          url: '/operations/products',
        },
        {
          title: 'Warehouses',
          url: '/operations/warehouses',
        },
      ],
    },
    {
      title: 'Banking',
      url: '/banking',
      icon: DollarSign,
      items: [
        {
          title: 'Payment Methods',
          url: '/banking/payment-methods',
        },
        {
          title: 'Transactions',
          url: '/banking/transactions',
        },
        // {
        //   title: 'Budgeting',
        //   url: '/banking/budgeting',
        // },
        // {
        //   title: 'Investments',
        //   url: '/banking/investments',
        // },
        // {
        //   title: 'Financial Analysis',
        //   url: '/banking/analysis',
        // },
      ],
    },
    {
      title: 'Sales',
      url: '/sales',
      icon: TrendingUp,
      items: [
        {
          title: 'CRM',
          url: '/sales/crm',
        },
        {
          title: 'Sales Orders',
          url: '/sales/orders',
        },
        {
          title: 'Quotations',
          url: '/sales/quotations',
        },
      ],
    },
    {
      title: 'Purchasing',
      url: '/purchasing',
      icon: ShoppingCart,
      items: [
        {
          title: 'Purchase Orders',
          url: '/purchasing/orders',
        },
        {
          title: 'Vendors',
          url: '/purchasing/vendors',
        },
        {
          title: 'Receipts',
          url: '/purchasing/receipts',
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>
        {user && <SidebarUserNav user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
