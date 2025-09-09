'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ArrowUpDown, 
  FileText,
  DollarSign,
  Send,
  Clock,
  CheckCircle,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useQuotations,
  useCreateQuotation,
  useUpdateQuotation,
  useDeleteQuotation,
  useQuotationsSummary
} from '@/lib/hooks/use-quotations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { QuotationForm } from '@/components/sales/quotation-form';

export default function QuotationsPage() {
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  // React Query hooks
  const { data: quotations = [], isLoading: quotationsLoading, refetch } = useQuotations();
  const { data: summary } = useQuotationsSummary();
  const createMutation = useCreateQuotation();
  const updateMutation = useUpdateQuotation();
  const deleteMutation = useDeleteQuotation();

  // Transform data for table display
  const transformedQuotations = quotations.map((item: any) => ({
    ...item.quotation,
    customerName: item.customer?.displayName || 
                  item.customer?.companyName || 
                  'Unknown Customer',
    customerEmail: item.customer?.email,
  }));

  // Columns definition for quotations table
  const quotationColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'quotationNumber',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Quote #
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const quotation = row.original;
        return (
          <div>
            <div className="font-mono font-medium">{quotation.quotationNumber}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(quotation.quotationDate).toLocaleDateString()}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => {
        const quotation = row.original;
        return (
          <div>
            <div className="font-medium">{quotation.customerName}</div>
            <div className="text-sm text-muted-foreground">{quotation.customerEmail}</div>
          </div>
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
          pending: 'bg-yellow-500/10 text-yellow-500',
          sent: 'bg-blue-500/10 text-blue-500',
          viewed: 'bg-purple-500/10 text-purple-500',
          accepted: 'bg-green-500/10 text-green-500',
          rejected: 'bg-red-500/10 text-red-500',
          expired: 'bg-orange-500/10 text-orange-500',
          converted: 'bg-emerald-500/10 text-emerald-500',
          cancelled: 'bg-red-500/10 text-red-500',
        };
        return (
          <Badge 
            variant="outline" 
            className={cn('capitalize', statusColors[status as keyof typeof statusColors] || 'bg-gray-500/10 text-gray-500')}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'validUntil',
      header: 'Valid Until',
      cell: ({ row }) => {
        const date = row.original.validUntil;
        if (!date) return <span className="text-muted-foreground">-</span>;
        
        const validDate = new Date(date);
        const isExpired = validDate < new Date();
        
        return (
          <div className={cn('text-sm', isExpired && 'text-red-500')}>
            {validDate.toLocaleDateString()}
            {isExpired && <span className="ml-1">(Expired)</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'total',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Total
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.original.total || '0');
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount);
        return <span className="font-mono">{formatted}</span>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const quotation = row.original;

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
              <DropdownMenuItem onClick={() => handleEdit(quotation)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(quotation)}
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
    setSelectedQuotation(null);
    setFormOpen(true);
  };

  const handleEdit = (quotation: any) => {
    setSelectedQuotation(quotation);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (selectedQuotation) {
      await updateMutation.mutateAsync({
        id: selectedQuotation.id,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setSelectedQuotation(null);
  };

  const handleDelete = async (quotation: any) => {
    if (confirm(`Are you sure you want to delete quotation ${quotation.quotationNumber}?`)) {
      await deleteMutation.mutateAsync(quotation.id);
    }
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">

          {/* Summary Cards */}
          {summary && (
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <FileText className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalQuotations}</div>
                  <p className="text-xs text-muted-foreground">All quotations</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Draft</CardTitle>
                  <FileText className="size-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{summary.draftQuotations}</div>
                  <p className="text-xs text-muted-foreground">Pending quotes</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sent</CardTitle>
                  <Send className="size-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{summary.sentQuotations}</div>
                  <p className="text-xs text-muted-foreground">Active quotes</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                  <CheckCircle className="size-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{summary.acceptedQuotations}</div>
                  <p className="text-xs text-muted-foreground">Won quotes</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Converted</CardTitle>
                  <CheckCircle className="size-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{summary.convertedQuotations}</div>
                  <p className="text-xs text-muted-foreground">To orders</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <DollarSign className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${summary.totalValue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Quote value</p>
                </CardContent>
              </Card>
            </div>
          )}

          <DataTableCrud
            columns={quotationColumns}
            data={transformedQuotations}
            searchKey="quotationNumber"
            searchPlaceholder="Search quotations..."
            onAdd={handleAdd}
            onRefresh={refetch}
            isLoading={quotationsLoading}
            addButtonLabel="Add Quotation"
            showActions={false}
          />
        </div>
      </div>

      <QuotationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        quotation={selectedQuotation}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}