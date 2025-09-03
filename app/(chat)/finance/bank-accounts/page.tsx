'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { BankAccountForm } from '@/components/banking/bank-account-form';
import {
  useBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
} from '@/lib/hooks/use-banking';
import type { BankAccount } from '@/lib/db/schema/index';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ArrowUpDown, MoreHorizontal, Building2, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export default function BankAccountsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

  // React Query hooks
  const { data: accounts = [], isLoading, refetch } = useBankAccounts();
  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const deleteMutation = useDeleteBankAccount();

  // Columns definition
  const columns: ColumnDef<BankAccount>[] = [
    {
      accessorKey: 'accountName',
      header: 'Account Name',
      cell: ({ row }) => {
        return (
          <div>
            <div className="font-medium">{row.original.accountName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.bankName}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'accountNumber',
      header: 'Account Number',
      cell: ({ row }) => {
        const number = row.original.accountNumber;
        // Mask account number for security
        const masked = number ? `****${number.slice(-4)}` : '-';
        return <span className="font-mono">{masked}</span>;
      },
    },
    {
      accessorKey: 'accountType',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.accountType;
        const typeColors = {
          checking: 'bg-blue-500/10 text-blue-500',
          savings: 'bg-green-500/10 text-green-500',
          credit_card: 'bg-purple-500/10 text-purple-500',
          investment: 'bg-orange-500/10 text-orange-500',
          loan: 'bg-red-500/10 text-red-500',
          other: 'bg-gray-500/10 text-gray-500',
        };
        
        return (
          <Badge 
            variant="outline" 
            className={cn('capitalize', typeColors[type as keyof typeof typeColors])}
          >
            {type?.replace('_', ' ')}
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
        const amount = parseFloat(row.original.currentBalance || '0');
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: row.original.currencyCode || 'USD',
        }).format(amount);
        return (
          <span className={cn(
            'font-medium',
            amount < 0 && 'text-red-500'
          )}>
            {formatted}
          </span>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        return row.original.isActive ? (
          <Badge variant="outline" className="bg-green-500/10 text-green-500">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-500">
            Inactive
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const account = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(account)}>
                Edit Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                View Transactions
              </DropdownMenuItem>
              <DropdownMenuItem>
                Reconcile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(account)}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Handlers
  const handleAdd = () => {
    setSelectedAccount(null);
    setFormOpen(true);
  };

  const handleEdit = (account: BankAccount) => {
    setSelectedAccount(account);
    setFormOpen(true);
  };

  const handleDelete = async (account: BankAccount) => {
    if (confirm(`Are you sure you want to delete account ${account.accountName}?`)) {
      await deleteMutation.mutateAsync(account.id);
    }
  };

  const handleFormSubmit = async (data: Partial<BankAccount>) => {
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
            <h2 className="text-2xl font-bold">Bank Accounts</h2>
            <p className="text-muted-foreground mt-2">
              Manage your company's bank accounts and financial institutions.
            </p>
          </div>

          <DataTableCrud
            columns={columns}
            data={accounts}
            searchKey="accountName"
            searchPlaceholder="Search accounts..."
            onAdd={handleAdd}
            onRefresh={refetch}
            isLoading={isLoading}
            addButtonLabel="Add Account"
            showActions={false}
          />
        </div>
      </div>

      <BankAccountForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        account={selectedAccount}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}