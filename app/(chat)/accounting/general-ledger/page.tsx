'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { AccountForm } from '@/components/accounting/account-form';
import {
  useChartAccounts,
  useCreateChartAccount,
  useUpdateChartAccount,
  useDeleteChartAccount,
} from '@/lib/hooks/use-chart-of-accounts';
import type { ChartAccount } from '@/lib/db/schema/index';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GeneralLedgerPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ChartAccount | null>(null);

  // React Query hooks
  const { data: accounts = [], isLoading, refetch } = useChartAccounts();
  const createMutation = useCreateChartAccount();
  const updateMutation = useUpdateChartAccount();
  const deleteMutation = useDeleteChartAccount();

  // Columns definition
  const columns: ColumnDef<ChartAccount>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Code
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <span className="font-mono">{row.original.code}</span>;
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.type;
        const typeColors = {
          asset: 'bg-blue-500/10 text-blue-500',
          liability: 'bg-orange-500/10 text-orange-500',
          equity: 'bg-purple-500/10 text-purple-500',
          income: 'bg-green-500/10 text-green-500',
          expense: 'bg-red-500/10 text-red-500',
          contra_asset: 'bg-cyan-500/10 text-cyan-500',
          contra_liability: 'bg-amber-500/10 text-amber-500',
          other: 'bg-gray-500/10 text-gray-500',
        };
        return (
          <Badge 
            variant="outline" 
            className={cn('capitalize', typeColors[type as keyof typeof typeColors])}
          >
            {type.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'normalBalance',
      header: 'Normal',
      cell: ({ row }) => {
        const balance = row.original.normalBalance;
        return (
          <Badge variant="secondary" className="capitalize">
            {balance}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'currentBalance',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Balance
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const balance = parseFloat(row.original.currentBalance || '0');
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: row.original.currencyCode || 'USD',
        }).format(balance);
        return (
          <span className={cn(
            'font-medium',
            balance < 0 && 'text-red-600'
          )}>
            {formatted}
          </span>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description = row.original.description;
        return description ? (
          <span className="text-muted-foreground text-sm">
            {description.length > 50 
              ? `${description.substring(0, 50)}...` 
              : description}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm italic">No description</span>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
  ];

  // Handlers
  const handleAdd = () => {
    setSelectedAccount(null);
    setFormOpen(true);
  };

  const handleEdit = (account: ChartAccount) => {
    setSelectedAccount(account);
    setFormOpen(true);
  };

  const handleDelete = async (account: ChartAccount) => {
    await deleteMutation.mutateAsync(account.id);
  };

  const handleFormSubmit = async (data: Partial<ChartAccount>) => {
    if (selectedAccount) {
      await updateMutation.mutateAsync({
        id: selectedAccount.id,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setSelectedAccount(null);
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Chart of Accounts</h2>
            <p className="text-muted-foreground mt-2">
              Manage your chart of accounts and track all financial transactions.
            </p>
          </div>

          <DataTableCrud
            columns={columns}
            data={accounts}
            searchKey="name"
            searchPlaceholder="Search accounts by name..."
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={refetch}
            isLoading={isLoading}
            addButtonLabel="Add Account"
          />
        </div>
      </div>

      <AccountForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        account={selectedAccount}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}