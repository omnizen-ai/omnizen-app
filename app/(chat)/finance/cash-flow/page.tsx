'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { TransactionForm } from '@/components/banking/transaction-form';
import {
  useBankAccounts,
  useBankTransactions,
  useCashFlowSummary,
  useCreateBankTransaction,
  useUpdateBankTransaction,
  useDeleteBankTransaction,
} from '@/lib/hooks/use-banking';
import type { BankTransaction, BankAccount } from '@/lib/db/schema/index';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowUpDown, MoreHorizontal, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CashFlowPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // React Query hooks
  const { data: accounts = [], isLoading: accountsLoading } = useBankAccounts();
  const { data: transactionsData = [], isLoading: transactionsLoading, refetch } = useBankTransactions({
    bankAccountId: selectedAccountId === 'all' ? undefined : selectedAccountId,
  });
  const { data: summary } = useCashFlowSummary();
  const createMutation = useCreateBankTransaction();
  const updateMutation = useUpdateBankTransaction();
  const deleteMutation = useDeleteBankTransaction();

  // Extract transactions from the query result
  const transactions = Array.isArray(transactionsData)
    ? transactionsData.map((item: any) => ({
        ...item.transaction,
        accountName: item.account?.accountName || 'Unknown Account',
        accountType: item.account?.accountType || 'unknown',
      }))
    : [];

  // Columns definition
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'transactionDate',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return format(new Date(row.original.transactionDate), 'MMM d, yyyy');
      },
    },
    {
      accessorKey: 'accountName',
      header: 'Account',
      cell: ({ row }) => {
        return (
          <div>
            <div className="font-medium">{row.original.accountName}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {row.original.accountType?.replace('_', ' ')}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'transactionType',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.transactionType;
        const typeColors = {
          deposit: 'bg-green-500/10 text-green-500',
          withdrawal: 'bg-red-500/10 text-red-500',
          transfer: 'bg-blue-500/10 text-blue-500',
          fee: 'bg-orange-500/10 text-orange-500',
          interest: 'bg-purple-500/10 text-purple-500',
          adjustment: 'bg-gray-500/10 text-gray-500',
          opening_balance: 'bg-cyan-500/10 text-cyan-500',
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
      accessorKey: 'payee',
      header: 'Payee/Payer',
      cell: ({ row }) => {
        return row.original.payee || '-';
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description = row.original.description;
        const memo = row.original.memo;
        return (
          <div>
            {description && <div>{description}</div>}
            {memo && (
              <div className="text-xs text-muted-foreground">{memo}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        return row.original.category ? (
          <Badge variant="secondary">{row.original.category}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.original.amount);
        const type = row.original.transactionType;
        const isInflow = type === 'deposit' || type === 'interest';
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount);
        return (
          <span className={cn('font-medium', isInflow ? 'text-green-600' : 'text-red-600')}>
            {isInflow ? '+' : '-'}{formatted}
          </span>
        );
      },
    },
    {
      accessorKey: 'isReconciled',
      header: 'Status',
      cell: ({ row }) => {
        const reconciled = row.original.isReconciled;
        return (
          <Badge variant={reconciled ? 'default' : 'secondary'}>
            {reconciled ? 'Reconciled' : 'Pending'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const transaction = row.original;

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
              <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(transaction)}
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
    if (accounts.length === 0) {
      alert('Please create a bank account first before adding transactions.');
      return;
    }
    setSelectedTransaction(null);
    setFormOpen(true);
  };

  const handleEdit = (transaction: BankTransaction) => {
    setSelectedTransaction(transaction);
    setFormOpen(true);
  };

  const handleDelete = async (transaction: BankTransaction) => {
    if (confirm(`Are you sure you want to delete this transaction?`)) {
      await deleteMutation.mutateAsync(transaction.id);
    }
  };

  const handleFormSubmit = async (data: Partial<BankTransaction>) => {
    if (selectedTransaction) {
      await updateMutation.mutateAsync({
        id: selectedTransaction.id,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setSelectedTransaction(null);
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Cash Flow Management</h2>
            <p className="text-muted-foreground mt-2">
              Track cash inflows and outflows across all bank accounts.
            </p>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${parseFloat(summary.totalBalance || '0').toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across {summary.accountCount} accounts
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cash Inflows</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    +${parseFloat(summary.totalInflows || '0').toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This period
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cash Outflows</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    -${parseFloat(summary.totalOutflows || '0').toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This period
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold",
                    parseFloat(summary.netCashFlow || '0') >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    ${parseFloat(summary.netCashFlow || '0').toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {summary.transactionCount} transactions
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Account Filter */}
          <div className="mb-4">
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="All accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts.map((account: BankAccount) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.accountName} ({account.accountType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTableCrud
            columns={columns}
            data={transactions}
            searchKey="description"
            searchPlaceholder="Search transactions..."
            onAdd={handleAdd}
            onRefresh={refetch}
            isLoading={transactionsLoading || accountsLoading}
            addButtonLabel="Add Transaction"
            showActions={false}
          />
        </div>
      </div>

      {accounts.length > 0 && (
        <TransactionForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          transaction={selectedTransaction}
          accounts={accounts}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}