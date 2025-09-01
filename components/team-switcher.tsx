'use client';

import * as React from 'react';
import Link from 'next/link';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function TeamSwitcher() {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link
          href="/"
          onClick={() => {
            setOpenMobile(false);
          }}
          className="w-full"
        >
          <SidebarMenuButton
            size="lg"
            className="w-full"
          >
            <div className="flex aspect-square size-8 items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="16" cy="16" r="16" fill="#6366F1" />
                <path
                  d="M10 22C10 17.5817 13.5817 14 18 14H22V18C22 22.4183 18.4183 26 14 26H10V22Z"
                  fill="white"
                />
                <path
                  d="M22 10C22 14.4183 18.4183 18 14 18H10V14C10 9.58172 13.5817 6 18 6H22V10Z"
                  fill="#A5B4FC"
                />
              </svg>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Omnizen</span>
              <span className="truncate text-xs text-muted-foreground">AI Business Suite</span>
            </div>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
