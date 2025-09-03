'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { InvoiceForm } from '@/components/accounting/invoice-form';
import { PaymentDialog } from '@/components/accounting/payment-dialog';
import {
  useInvoices,
  useInvoiceStats,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useRecordInvoicePayment,
  useSendInvoice,
} from '@/lib/hooks/use-invoices';
import type { Invoice } from '@/lib/db/schema/index';
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
import { ArrowUpDown, MoreHorizontal, CreditCard, Send, FileText, Printer, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccountsReceivablePage() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  // React Query hooks
  const { data: invoicesData = [], isLoading, refetch } = useInvoices();
  const { data: stats } = useInvoiceStats();
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const deleteMutation = useDeleteInvoice();
  const paymentMutation = useRecordInvoicePayment();
  const sendMutation = useSendInvoice();

  // Extract invoices from the query result
  const invoices = Array.isArray(invoicesData)
    ? invoicesData.map((item: any) => ({
        ...item.invoice,
        customerName: item.customer?.displayName || 
                      item.customer?.companyName || 
                      `${item.customer?.firstName || ''} ${item.customer?.lastName || ''}`.trim() ||
                      'Unknown Customer',
      }))
    : [];

  // Columns definition
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Invoice #
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <span className="font-mono">{row.original.invoiceNumber}</span>;
      },
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => {
        return (
          <div>
            <div className="font-medium">{row.original.customerName}</div>
            {row.original.poNumber && (
              <div className="text-xs text-muted-foreground">
                PO: {row.original.poNumber}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'issueDate',
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
        return format(new Date(row.original.issueDate), 'MMM d, yyyy');
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = new Date(row.original.dueDate);
        const isOverdue = dueDate < new Date() && 
          !['paid', 'cancelled'].includes(row.original.status);
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
            <ArrowUpDown className="ml-2 h-4 w-4" />
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
          sent: 'bg-blue-500/10 text-blue-500',
          viewed: 'bg-purple-500/10 text-purple-500',
          partially_paid: 'bg-orange-500/10 text-orange-500',
          paid: 'bg-green-500/10 text-green-500',
          overdue: 'bg-red-500/10 text-red-500',
          cancelled: 'bg-red-500/10 text-red-500',
        };
        
        // Show additional indicators
        const icons = [];
        if (row.original.sentAt) icons.push('📤');
        if (row.original.viewedAt) icons.push('👁');
        if (row.original.paidAt) icons.push('✅');
        
        return (
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn('capitalize', statusColors[status as keyof typeof statusColors])}
            >
              {status}
            </Badge>
            {icons.length > 0 && (
              <span className="text-xs">{icons.join(' ')}</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const invoice = row.original;
        const canSend = invoice.status === 'draft';
        const canPay = ['sent', 'viewed', 'partially_paid'].includes(invoice.status);
        const balance = parseFloat(invoice.balanceDue || invoice.totalAmount);

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
              <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                <FileText className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {canSend && (
                <DropdownMenuItem onClick={() => handleSend(invoice)}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invoice
                </DropdownMenuItem>
              )}
              {canPay && balance > 0 && (
                <DropdownMenuItem onClick={() => handleRecordPayment(invoice)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record Payment
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(invoice)}
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
    setSelectedInvoice(null);
    setFormOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormOpen(true);
  };

  const handleDelete = async (invoice: Invoice) => {
    if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      await deleteMutation.mutateAsync(invoice.id);
    }
  };

  const handleFormSubmit = async (data: Partial<Invoice>) => {
    if (selectedInvoice) {
      await updateMutation.mutateAsync({
        id: selectedInvoice.id,
        ...data,
      });
    } else {
      // For demo, using a test customer ID
      await createMutation.mutateAsync({
        ...data,
        customerId: data.customerId || '44444444-4444-4444-4444-444444444444',
      });
    }
    setFormOpen(false);
    setSelectedInvoice(null);
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setPaymentInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async (data: {
    amount: string;
    paymentDate: Date;
    paymentMethod?: string;
    reference?: string;
  }) => {
    if (paymentInvoice) {
      await paymentMutation.mutateAsync({
        invoiceId: paymentInvoice.id,
        ...data,
      });
      setPaymentDialogOpen(false);
      setPaymentInvoice(null);
    }
  };

  const handleSend = async (invoice: Invoice) => {
    if (confirm(`Send invoice ${invoice.invoiceNumber} to customer?`)) {
      await sendMutation.mutateAsync(invoice.id);
    }
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Customer Invoices Management</h2>
            <p className="text-muted-foreground mt-2">
              Manage customer invoices, track payments, and monitor outstanding receivables.
            </p>
          </div>

          {/* Summary Cards */}
          {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
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
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                ${parseFloat(stats.totalOverdue).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${parseFloat(stats.totalDraft).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.count}</div>
            </CardContent>
          </Card>
        </div>
          )}

          <DataTableCrud
            columns={columns}
            data={invoices}
            searchKey="invoiceNumber"
            searchPlaceholder="Search by invoice number..."
            onAdd={handleAdd}
            onRefresh={refetch}
            isLoading={isLoading}
            addButtonLabel="Create Invoice"
            showActions={false}
          />
        </div>
      </div>

      <InvoiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        invoice={selectedInvoice}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {paymentInvoice && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          onSubmit={handlePaymentSubmit}
          maxAmount={parseFloat(paymentInvoice.balanceDue || paymentInvoice.totalAmount)}
          billNumber={paymentInvoice.invoiceNumber}
          isLoading={paymentMutation.isPending}
        />
      )}
    </div>
  );
}