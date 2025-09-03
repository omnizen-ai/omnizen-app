'use client';

import * as React from 'react';
import type { User } from 'next-auth';
import {
  Sun,
  Calculator,
  Building2,
  TrendingUp,
  DollarSign,
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
      title: 'Accounting',
      url: '/accounting',
      icon: Calculator,
      items: [
        {
          title: 'General Ledger',
          url: '/accounting/general-ledger',
        },
        {
          title: 'Accounts Payable',
          url: '/accounting/accounts-payable',
        },
        {
          title: 'Accounts Receivable',
          url: '/accounting/accounts-receivable',
        },
        // {
        //   title: 'Financial Reports',
        //   url: '/accounting/reports',
        // },
      ],
    },
    // {
    //   title: 'Operations',
    //   url: '/operations',
    //   icon: Building2,
    //   items: [
    //     {
    //       title: 'Inventory Management',
    //       url: '/operations/inventory',
    //     },
    //     // {
    //     //   title: 'Supply Chain',
    //     //   url: '/operations/supply-chain',
    //     // },
    //     // {
    //     //   title: 'Production Planning',
    //     //   url: '/operations/production',
    //     // },
    //     // {
    //     //   title: 'Quality Control',
    //     //   url: '/operations/quality',
    //     // },
    //   ],
    // },
    {
      title: 'Finance',
      url: '/finance',
      icon: DollarSign,
      items: [
        {
          title: 'Bank Accounts',
          url: '/finance/bank-accounts',
        },
        {
          title: 'Cash Flow',
          url: '/finance/cash-flow',
        },
        // {
        //   title: 'Budgeting',
        //   url: '/finance/budgeting',
        // },
        // {
        //   title: 'Investments',
        //   url: '/finance/investments',
        // },
        // {
        //   title: 'Financial Analysis',
        //   url: '/finance/analysis',
        // },
      ],
    },
    // {
    //   title: 'Sales',
    //   url: '/sales',
    //   icon: TrendingUp,
    //   items: [
    //     {
    //       title: 'CRM',
    //       url: '/sales/crm',
    //     },
    //     {
    //       title: 'Pipeline Management',
    //       url: '/sales/pipeline',
    //     },
    //     {
    //       title: 'Quotations',
    //       url: '/sales/quotations',
    //     },
    //     {
    //       title: 'Sales Reports',
    //       url: '/sales/reports',
    //     },
    //   ],
    // },
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
