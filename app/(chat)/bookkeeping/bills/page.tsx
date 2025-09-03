'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { BillForm } from '@/components/accounting/bill-form';
import { PaymentDialog } from '@/components/accounting/payment-dialog';
import {
  useBills,
  useBillStats,
  useCreateBill,
  useUpdateBill,
  useDeleteBill,
  useRecordBillPayment,
} from '@/lib/hooks/use-bills';
import type { Bill } from '@/lib/db/schema/index';
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
import { ArrowUpDown, MoreHorizontal, CreditCard, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccountsPayablePage() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null);

  // React Query hooks
  const { data: billsData = [], isLoading, refetch } = useBills();
  const { data: stats } = useBillStats();
  const createMutation = useCreateBill();
  const updateMutation = useUpdateBill();
  const deleteMutation = useDeleteBill();
  const paymentMutation = useRecordBillPayment();

  // Extract bills from the query result
  const bills = Array.isArray(billsData) 
    ? billsData.map((item: any) => ({
        ...item.bill,
        vendorName: item.vendor?.displayName || 
                    item.vendor?.companyName || 
                    `${item.vendor?.firstName || ''} ${item.vendor?.lastName || ''}`.trim() ||
                    'Unknown Vendor',
      }))
    : [];

  // Columns definition
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'billNumber',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Bill #
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <span className="font-mono">{row.original.billNumber}</span>;
      },
    },
    {
      accessorKey: 'vendorName',
      header: 'Vendor',
      cell: ({ row }) => {
        return (
          <div>
            <div className="font-medium">{row.original.vendorName}</div>
            {row.original.vendorInvoiceNumber && (
              <div className="text-xs text-muted-foreground">
                Invoice: {row.original.vendorInvoiceNumber}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'billDate',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return format(new Date(row.original.billDate), 'MMM d, yyyy');
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = new Date(row.original.dueDate);
        const isOverdue = dueDate < new Date() && row.original.status !== 'paid';
        return (
          <span className={cn(isOverdue && 'text-red-500 font-semibold')}>
            {format(dueDate, 'MMM d, yyyy')}
          </span>
        );
      },
    },
    {
      accessorKey: 'totalAmount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Total
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.original.totalAmount);
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: row.original.currencyCode || 'USD',
        }).format(amount);
        return <span className="font-medium">{formatted}</span>;
      },
    },
    {
      accessorKey: 'paidAmount',
      header: 'Paid',
      cell: ({ row }) => {
        const paid = parseFloat(row.original.paidAmount || '0');
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: row.original.currencyCode || 'USD',
        }).format(paid);
        return <span>{formatted}</span>;
      },
    },
    {
      accessorKey: 'balanceDue',
      header: 'Balance',
      cell: ({ row }) => {
        const balance = parseFloat(row.original.balanceDue || row.original.totalAmount);
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: row.original.currencyCode || 'USD',
        }).format(balance);
        return (
          <span className={cn('font-medium', balance > 0 && 'text-orange-500')}>
            {formatted}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColors = {
          draft: 'bg-gray-500/10 text-gray-500',
          approved: 'bg-blue-500/10 text-blue-500',
          partially_paid: 'bg-orange-500/10 text-orange-500',
          paid: 'bg-green-500/10 text-green-500',
          cancelled: 'bg-red-500/10 text-red-500',
        };
        return (
          <Badge 
            variant="outline" 
            className={cn('capitalize', statusColors[status as keyof typeof statusColors])}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const bill = row.original;
        const canPay = bill.status === 'approved' || bill.status === 'partially_paid';
        const balance = parseFloat(bill.balanceDue || bill.totalAmount);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(bill)}>
                <FileText className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              {canPay && balance > 0 && (
                <DropdownMenuItem onClick={() => handleRecordPayment(bill)}>
                  <CreditCard className="mr-2 size-4" />
                  Record Payment
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Printer className="mr-2 size-4" />
                Print
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(bill)}
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
    setSelectedBill(null);
    setFormOpen(true);
  };

  const handleEdit = (bill: Bill) => {
    setSelectedBill(bill);
    setFormOpen(true);
  };

  const handleDelete = async (bill: Bill) => {
    if (confirm(`Are you sure you want to delete bill ${bill.billNumber}?`)) {
      await deleteMutation.mutateAsync(bill.id);
    }
  };

  const handleFormSubmit = async (data: Partial<Bill>) => {
    if (selectedBill) {
      await updateMutation.mutateAsync({
        id: selectedBill.id,
        ...data,
      });
    } else {
      // For demo, using a test vendor ID
      await createMutation.mutateAsync({
        ...data,
        vendorId: data.vendorId || '33333333-3333-3333-3333-333333333333',
      });
    }
    setFormOpen(false);
    setSelectedBill(null);
  };

  const handleRecordPayment = (bill: Bill) => {
    setPaymentBill(bill);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async (data: {
    amount: string;
    paymentDate: Date;
    paymentMethod?: string;
    reference?: string;
  }) => {
    if (paymentBill) {
      await paymentMutation.mutateAsync({
        billId: paymentBill.id,
        ...data,
      });
      setPaymentDialogOpen(false);
      setPaymentBill(null);
    }
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Bills</h2>
            <p className="text-muted-foreground mt-2">
              Manage vendor bills, track payments, and monitor outstanding payables.
            </p>
          </div>

          {/* Summary Cards */}
          {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <CreditCard className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${parseFloat(stats.totalOutstanding).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <FileText className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                ${parseFloat(stats.totalOverdue).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft Bills</CardTitle>
              <FileText className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${parseFloat(stats.totalDraft).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
              <FileText className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.count}</div>
            </CardContent>
          </Card>
        </div>
          )}

          <DataTableCrud
            columns={columns}
            data={bills}
            searchKey="billNumber"
            searchPlaceholder="Search by bill number..."
            onAdd={handleAdd}
            onRefresh={refetch}
            isLoading={isLoading}
            addButtonLabel="Add Bill"
            showActions={false}
          />
        </div>
      </div>

      <BillForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        bill={selectedBill}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {paymentBill && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          onSubmit={handlePaymentSubmit}
          maxAmount={parseFloat(paymentBill.balanceDue || paymentBill.totalAmount)}
          billNumber={paymentBill.billNumber}
          isLoading={paymentMutation.isPending}
        />
      )}
    </div>
  );
}