'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePanelState, type PanelType } from '@/lib/hooks/use-panel-state';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    description?: string;
    isNewChat?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const router = useRouter();
  const { state, setOpen } = useSidebar();
  const { openPanel, closePanel } = usePanelState();
  const [expandedItems, setExpandedItems] = useState<string[]>(() => 
    items.filter(item => item.isActive).map(item => item.title)
  );
  
  // Map URLs to panel types - only child items, not parent items
  const urlToPanelType: Record<string, PanelType> = {
    '/bookkeeping/general-ledger': 'bookkeeping/general-ledger',
    '/bookkeeping/bills': 'bookkeeping/bills',
    '/bookkeeping/invoices': 'bookkeeping/invoices',
    '/banking/payment-methods': 'banking/payment-methods',
    '/banking/transactions': 'banking/transactions',
    '/sales/crm': 'sales/crm',
    '/sales/orders': 'sales/orders',
    '/sales/quotations': 'sales/quotations',
    '/operations/inventory': 'operations/inventory',
    '/operations/products': 'operations/products',
    '/operations/warehouses': 'operations/warehouses',
    '/purchasing/orders': 'purchasing/orders',
    '/purchasing/vendors': 'purchasing/vendors',
    '/purchasing/receipts': 'purchasing/receipts',
  };
  
  const handleNavClick = (e: React.MouseEvent, url: string) => {
    const panelType = urlToPanelType[url];
    if (panelType) {
      e.preventDefault();
      openPanel(panelType);
    }
  };

  const handleCollapsedClick = (e: React.MouseEvent, item: any) => {
    // If sidebar is collapsed and item has sub-items (not Omni), expand sidebar
    if (state === 'collapsed' && item.items && item.items.length > 0 && item.title !== 'Omni') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
      // Delay the expansion to allow sidebar animation to complete
      setTimeout(() => {
        setExpandedItems(prev => [...prev, item.title]);
      }, 150);
    }
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              open={expandedItems.includes(item.title)}
              onOpenChange={(open) => {
                if (open) {
                  setExpandedItems(prev => [...prev, item.title]);
                } else {
                  setExpandedItems(prev => prev.filter(i => i !== item.title));
                }
              }}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    onClick={(e) => {
                      handleCollapsedClick(e, item);
                      // Parent items with children should only expand/collapse, not open panels
                    }}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a 
                            href={subItem.url}
                            onClick={(e) => handleNavClick(e, subItem.url)}
                          >
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.description || item.title}
                asChild={!item.isNewChat && item.title !== 'Omni'}
                onClick={
                  item.isNewChat ? () => {
                    router.push('/');
                    router.refresh();
                  } : item.title === 'Omni' ? () => {
                    // Close any open panel and navigate to chat
                    closePanel();
                    router.push('/');
                  } : undefined
                }
              >
                {item.isNewChat || item.title === 'Omni' ? (
                  <>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </>
                ) : (
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
