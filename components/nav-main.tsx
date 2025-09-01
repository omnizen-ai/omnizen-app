'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
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
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const { state, setOpen } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>(() => 
    items.filter(item => item.isActive).map(item => item.title)
  );

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
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
                    onClick={(e) => handleCollapsedClick(e, item)}
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
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
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
                asChild
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
