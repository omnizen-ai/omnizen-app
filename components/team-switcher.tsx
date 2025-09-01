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
            className="w-full justify-start"
            style={{ height: 'auto', padding: '0.5rem' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center shrink-0">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="16" cy="16" r="16" fill="#F97316" />
                  <path
                    d="M10 22C10 17.5817 13.5817 14 18 14H22V18C22 22.4183 18.4183 26 14 26H10V22Z"
                    fill="white"
                  />
                  <path
                    d="M22 10C22 14.4183 18.4183 18 14 18H10V14C10 9.58172 13.5817 6 18 6H22V10Z"
                    fill="#FED7AA"
                  />
                </svg>
              </div>
              <span style={{ 
                fontFamily: 'League Spartan', 
                fontWeight: 900, 
                fontSize: '1.72rem', 
                lineHeight: '1',
                letterSpacing: '-0.02em',
                marginTop: '0.30rem',
                borderBottom: '2px solid #F97316',
                paddingBottom: '0'
              }}>
                <span className="text-foreground">OMNI</span>
                <span style={{ color: '#F97316' }}>ZEN</span>
                <span className="text-foreground">.ai</span>
              </span>
            </div>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
