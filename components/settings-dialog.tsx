'use client';

import * as React from 'react';
import {
  Bell,
  Building2,
  Calculator,
  CreditCard,
  FileText,
  Globe,
  Key,
  Link,
  Lock,
  Palette,
  Receipt,
  Settings,
  Shield,
  UserPlus,
  Users,
  Workflow,
  Bot,
  Database,
  BarChart3,
} from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';

const data = {
  nav: [
    { name: 'General', icon: Settings, section: 'company' },
    { name: 'Company Profile', icon: Building2, section: 'company' },
    { name: 'Appearance', icon: Palette, section: 'company' },
    { name: 'Notifications', icon: Bell, section: 'company' },
    { name: 'AI Assistant', icon: Bot, section: 'ai' },
    { name: 'Integrations', icon: Link, section: 'ai' },
    { name: 'Accounting Settings', icon: Calculator, section: 'business' },
    { name: 'Tax Configuration', icon: Receipt, section: 'business' },
    { name: 'Invoice Templates', icon: FileText, section: 'business' },
    { name: 'Chart of Accounts', icon: BarChart3, section: 'business' },
    { name: 'Payment Methods', icon: CreditCard, section: 'business' },
    { name: 'User Management', icon: Users, section: 'security' },
    { name: 'Roles & Permissions', icon: UserPlus, section: 'security' },
    { name: 'Security', icon: Shield, section: 'security' },
    { name: 'API Keys', icon: Key, section: 'security' },
    { name: 'Data & Privacy', icon: Lock, section: 'security' },
    { name: 'Backup & Recovery', icon: Database, section: 'advanced' },
    { name: 'Workflows', icon: Workflow, section: 'advanced' },
    { name: 'Region & Language', icon: Globe, section: 'advanced' },
  ],
};

interface SettingsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({ open: controlledOpen, onOpenChange }: SettingsDialogProps) {
  const [open, setOpen] = React.useState(controlledOpen ?? false);
  const [activeItem, setActiveItem] = React.useState('General');

  React.useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen);
    }
  }, [controlledOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[900px] lg:max-w-[1000px]">
        <DialogTitle className="sr-only">Business Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Configure your business and application settings.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <div className="px-3 py-2">
                    <h2 className="mb-2 px-2 text-lg font-semibold">Settings</h2>
                  </div>
                  <SidebarMenu>
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">COMPANY</p>
                    </div>
                    {data.nav.filter(item => item.section === 'company').map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          onClick={() => setActiveItem(item.name)}
                          isActive={item.name === activeItem}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    
                    <div className="px-3 py-2 mt-2">
                      <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">AI & AUTOMATION</p>
                    </div>
                    {data.nav.filter(item => item.section === 'ai').map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          onClick={() => setActiveItem(item.name)}
                          isActive={item.name === activeItem}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    
                    <div className="px-3 py-2 mt-2">
                      <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">BUSINESS</p>
                    </div>
                    {data.nav.filter(item => item.section === 'business').map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          onClick={() => setActiveItem(item.name)}
                          isActive={item.name === activeItem}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    
                    <div className="px-3 py-2 mt-2">
                      <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">SECURITY</p>
                    </div>
                    {data.nav.filter(item => item.section === 'security').map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          onClick={() => setActiveItem(item.name)}
                          isActive={item.name === activeItem}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    
                    <div className="px-3 py-2 mt-2">
                      <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">ADVANCED</p>
                    </div>
                    {data.nav.filter(item => item.section === 'advanced').map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          onClick={() => setActiveItem(item.name)}
                          isActive={item.name === activeItem}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[550px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
              <div className="flex items-center gap-2 px-6">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink>Settings</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeItem}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{activeItem}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure your {activeItem.toLowerCase()} settings and preferences.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <p className="text-sm text-muted-foreground">
                    Settings content for {activeItem} will be implemented here.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
