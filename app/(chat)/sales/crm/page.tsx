'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  ArrowUpDown, 
  Mail, 
  Phone, 
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

// Mock CRM data
const mockCustomers = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@techcorp.com',
    phone: '+1 (555) 123-4567',
    company: 'TechCorp Solutions',
    type: 'enterprise',
    status: 'active',
    value: 125000,
    deals: 3,
    lastContact: new Date('2024-01-20'),
    owner: 'Sarah Johnson',
    avatar: null,
    initials: 'JS',
    leadScore: 85,
  },
  {
    id: '2',
    name: 'Emily Davis',
    email: 'emily@startupinc.com',
    phone: '+1 (555) 234-5678',
    company: 'StartupInc',
    type: 'startup',
    status: 'prospect',
    value: 45000,
    deals: 1,
    lastContact: new Date('2024-01-18'),
    owner: 'Mike Chen',
    avatar: null,
    initials: 'ED',
    leadScore: 72,
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'rjohnson@globalenterprises.com',
    phone: '+1 (555) 345-6789',
    company: 'Global Enterprises',
    type: 'enterprise',
    status: 'active',
    value: 250000,
    deals: 5,
    lastContact: new Date('2024-01-15'),
    owner: 'Sarah Johnson',
    avatar: null,
    initials: 'RJ',
    leadScore: 95,
  },
  {
    id: '4',
    name: 'Lisa Chen',
    email: 'lisa@designstudio.com',
    phone: '+1 (555) 456-7890',
    company: 'Design Studio Pro',
    type: 'smb',
    status: 'lead',
    value: 15000,
    deals: 0,
    lastContact: new Date('2024-01-22'),
    owner: 'Tom Wilson',
    avatar: null,
    initials: 'LC',
    leadScore: 60,
  },
  {
    id: '5',
    name: 'Michael Brown',
    email: 'mbrown@retailchain.com',
    phone: '+1 (555) 567-8901',
    company: 'Retail Chain LLC',
    type: 'enterprise',
    status: 'inactive',
    value: 180000,
    deals: 4,
    lastContact: new Date('2023-12-10'),
    owner: 'Sarah Johnson',
    avatar: null,
    initials: 'MB',
    leadScore: 40,
  },
];

export default function CRMPage() {
  const [customers] = useState(mockCustomers);

  // Calculate summary statistics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalValue = customers.reduce((sum, c) => sum + c.value, 0);
  const totalDeals = customers.reduce((sum, c) => sum + c.deals, 0);
  const avgLeadScore = customers.reduce((sum, c) => sum + c.leadScore, 0) / customers.length;

  // Columns definition
  const columns: ColumnDef<typeof mockCustomers[0]>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Customer
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={row.original.avatar || undefined} />
              <AvatarFallback className="text-xs">{row.original.initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{row.original.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3" />
                {row.original.company}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => {
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <Mail className="size-3 text-muted-foreground" />
              {row.original.email}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="size-3" />
              {row.original.phone}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.type;
        const typeConfig = {
          enterprise: { label: 'Enterprise', color: 'bg-purple-500/10 text-purple-500' },
          smb: { label: 'SMB', color: 'bg-blue-500/10 text-blue-500' },
          startup: { label: 'Startup', color: 'bg-green-500/10 text-green-500' },
        };
        const config = typeConfig[type as keyof typeof typeConfig];
        return (
          <Badge variant="outline" className={cn('capitalize', config.color)}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusConfig = {
          active: { label: 'Active', color: 'bg-green-500/10 text-green-500' },
          prospect: { label: 'Prospect', color: 'bg-blue-500/10 text-blue-500' },
          lead: { label: 'Lead', color: 'bg-orange-500/10 text-orange-500' },
          inactive: { label: 'Inactive', color: 'bg-gray-500/10 text-gray-500' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Badge variant="outline" className={cn('capitalize', config.color)}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'value',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Total Value
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const value = row.original.value;
        const deals = row.original.deals;
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
        return (
          <div>
            <div className="font-medium">{formatted}</div>
            <div className="text-xs text-muted-foreground">{deals} deals</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'leadScore',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Lead Score
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const score = row.original.leadScore;
        let color = 'text-green-600';
        if (score < 70) color = 'text-orange-600';
        if (score < 50) color = 'text-red-600';
        
        return (
          <div className={cn('font-bold text-lg', color)}>
            {score}
          </div>
        );
      },
    },
    {
      accessorKey: 'lastContact',
      header: 'Last Contact',
      cell: ({ row }) => {
        const date = row.original.lastContact;
        const daysAgo = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div>
            <div className="text-sm">{format(date, 'MMM d, yyyy')}</div>
            <div className="text-xs text-muted-foreground">{daysAgo} days ago</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'owner',
      header: 'Owner',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1">
            <UserCheck className="size-3 text-muted-foreground" />
            <span className="text-sm">{row.original.owner}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Customer Relationship Management</h2>
            <p className="text-muted-foreground mt-2">
              Manage customer relationships and track sales opportunities.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-5 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  All contacts
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <UserCheck className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  Paying customers
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(totalValue / 1000).toFixed(0)}K
                </div>
                <p className="text-xs text-muted-foreground">
                  Lifetime value
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
                <TrendingUp className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDeals}</div>
                <p className="text-xs text-muted-foreground">
                  Open opportunities
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                <TrendingUp className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgLeadScore.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">
                  Lead quality
                </p>
              </CardContent>
            </Card>
          </div>

          <DataTableCrud
            columns={columns}
            data={customers}
            searchKey="name"
            searchPlaceholder="Search customers..."
            onAdd={() => alert('Add customer functionality coming soon')}
            onRefresh={() => {}}
            isLoading={false}
            addButtonLabel="Add Customer"
            showActions={false}
          />
        </div>
      </div>
    </div>
  );
}