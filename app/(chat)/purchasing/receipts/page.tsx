'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ArrowUpDown, 
  Package,
  Truck,
  CheckCircle,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  usePurchaseReceipts,
  useCreatePurchaseReceipt,
  useUpdatePurchaseReceipt,
  useDeletePurchaseReceipt,
  usePurchaseReceiptsSummary
} from '@/lib/hooks/use-purchase-receipts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PurchaseReceiptForm } from '@/components/purchasing/purchase-receipt-form';

export default function PurchaseReceiptsPage() {
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  // React Query hooks
  const { data: receipts = [], isLoading: receiptsLoading, refetch } = usePurchaseReceipts();
  const { data: summary } = usePurchaseReceiptsSummary();
  const createMutation = useCreatePurchaseReceipt();
  const updateMutation = useUpdatePurchaseReceipt();
  const deleteMutation = useDeletePurchaseReceipt();

  // Transform data for table display
  const transformedReceipts = receipts.map((item: any) => ({
    ...item.receipt,
    purchaseOrderNumber: item.purchaseOrder?.orderNumber || 'N/A',
    vendorName: item.vendor?.displayName || 
                item.vendor?.companyName || 
                'Unknown Vendor',
    warehouseName: item.warehouse?.name || 'Unknown Warehouse',
    warehouseCode: item.warehouse?.code,
  }));

  // Columns definition for purchase receipts table
  const receiptColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'receiptNumber',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Receipt #
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const receipt = row.original;
        return (
          <div>
            <div className="font-mono font-medium">{receipt.receiptNumber}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(receipt.receiptDate).toLocaleDateString()}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'purchaseOrderNumber',
      header: 'Purchase Order',
      cell: ({ row }) => {
        const receipt = row.original;
        return (
          <div>
            <div className="font-medium">{receipt.purchaseOrderNumber}</div>
            {receipt.vendorDeliveryNote && (
              <div className="text-sm text-muted-foreground">
                DN: {receipt.vendorDeliveryNote}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'vendorName',
      header: 'Vendor',
      cell: ({ row }) => {
        const receipt = row.original;
        return (
          <div>
            <div className="font-medium">{receipt.vendorName}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'warehouseName',
      header: 'Warehouse',
      cell: ({ row }) => {
        const receipt = row.original;
        return (
          <div>
            <div className="font-medium">{receipt.warehouseName}</div>
            {receipt.warehouseCode && (
              <div className="text-sm text-muted-foreground">{receipt.warehouseCode}</div>
            )}
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
          received: 'bg-blue-500/10 text-blue-500',
          inspecting: 'bg-yellow-500/10 text-yellow-500',
          accepted: 'bg-green-500/10 text-green-500',
          rejected: 'bg-red-500/10 text-red-500',
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
      accessorKey: 'qualityCheckRequired',
      header: 'Quality Check',
      cell: ({ row }) => {
        const receipt = row.original;
        if (!receipt.qualityCheckRequired) {
          return <span className="text-muted-foreground">Not Required</span>;
        }
        
        return (
          <div className="flex items-center gap-2">
            {receipt.qualityCheckCompleted ? (
              <>
                <CheckCircle className="size-4 text-green-500" />
                <span className="text-green-600">Completed</span>
              </>
            ) : (
              <>
                <Clock className="size-4 text-yellow-500" />
                <span className="text-yellow-600">Pending</span>
              </>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const receipt = row.original;

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
              <DropdownMenuItem onClick={() => handleEdit(receipt)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(receipt)}
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
    setSelectedReceipt(null);
    setFormOpen(true);
  };

  const handleEdit = (receipt: any) => {
    setSelectedReceipt(receipt);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (selectedReceipt) {
      await updateMutation.mutateAsync({
        id: selectedReceipt.id,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setSelectedReceipt(null);
  };

  const handleDelete = async (receipt: any) => {
    if (confirm(`Are you sure you want to delete receipt ${receipt.receiptNumber}?`)) {
      await deleteMutation.mutateAsync(receipt.id);
    }
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Purchase Receipts</h2>
            <p className="text-muted-foreground mt-2">
              Record purchase receipts, track deliveries, and update inventory levels.
            </p>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
                  <Package className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalReceipts}</div>
                  <p className="text-xs text-muted-foreground">All receipts</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="size-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{summary.pendingReceipts}</div>
                  <p className="text-xs text-muted-foreground">Awaiting processing</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Received</CardTitle>
                  <Truck className="size-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{summary.receivedReceipts}</div>
                  <p className="text-xs text-muted-foreground">Goods received</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                  <CheckCircle className="size-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{summary.acceptedReceipts}</div>
                  <p className="text-xs text-muted-foreground">Quality approved</p>
                </CardContent>
              </Card>
            </div>
          )}

          <DataTableCrud
            columns={receiptColumns}
            data={transformedReceipts}
            searchKey="receiptNumber"
            searchPlaceholder="Search receipts..."
            onAdd={handleAdd}
            onRefresh={refetch}
            isLoading={receiptsLoading}
            addButtonLabel="Add Receipt"
            showActions={false}
          />
        </div>
      </div>

      <PurchaseReceiptForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        receipt={selectedReceipt}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}