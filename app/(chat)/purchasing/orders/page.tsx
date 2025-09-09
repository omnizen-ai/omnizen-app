'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { PurchaseOrderForm } from '@/components/purchasing/purchase-order-form';
import { VendorForm } from '@/components/purchasing/vendor-form';
import { NoVendorDialog } from '@/components/purchasing/no-vendor-dialog';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ArrowUpDown, 
  ShoppingCart,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useDeletePurchaseOrder,
  usePurchaseOrdersSummary
} from '@/lib/hooks/use-purchase-orders';
import { useContacts, useCreateContact } from '@/lib/hooks/use-sales';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function PurchaseOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showNoVendorDialog, setShowNoVendorDialog] = useState(false);
  const [showVendorForm, setShowVendorForm] = useState(false);

  // React Query hooks
  const { data: orders = [], isLoading: ordersLoading, refetch } = usePurchaseOrders();
  const { data: summary } = usePurchaseOrdersSummary();
  const { data: vendors = [], isLoading: vendorsLoading } = useContacts({ type: 'vendor' });
  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const deleteMutation = useDeletePurchaseOrder();
  const createContactMutation = useCreateContact();

  // Columns definition for purchase orders table
  const orderColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'orderNumber',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Order #
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const order = row.original.order;
        return (
          <div>
            <div className="font-mono font-medium">{order.orderNumber}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(order.orderDate).toLocaleDateString()}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'vendorName',
      header: 'Vendor',
      cell: ({ row }) => {
        const vendor = row.original.vendor;
        return vendor ? (
          <div>
            <div className="font-medium">
              {vendor.companyName || vendor.name || 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">{vendor.email}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">No vendor</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.order.status;
        const statusColors = {
          draft: 'bg-gray-500/10 text-gray-500',
          submitted: 'bg-blue-500/10 text-blue-500',
          approved: 'bg-green-500/10 text-green-500',
          received: 'bg-purple-500/10 text-purple-500',
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
      accessorKey: 'warehouse',
      header: 'Ship To',
      cell: ({ row }) => {
        const warehouse = row.original.warehouse;
        return warehouse ? (
          <div>
            <div className="font-medium">{warehouse.name}</div>
            <div className="text-sm text-muted-foreground">{warehouse.code}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">No warehouse</span>
        );
      },
    },
    {
      accessorKey: 'totalAmount',
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
        const amount = parseFloat(row.original.order.totalAmount || '0');
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
        const order = row.original.order;

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
              <DropdownMenuItem onClick={() => handleEdit(order)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(order)}
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
    if (vendors.length === 0) {
      setShowNoVendorDialog(true);
      return;
    }
    setSelectedOrder(null);
    setFormOpen(true);
  };

  const handleEdit = (order: any) => {
    setSelectedOrder(order);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (selectedOrder) {
      await updateMutation.mutateAsync({
        id: selectedOrder.id,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setSelectedOrder(null);
  };

  const handleDelete = async (order: any) => {
    if (confirm(`Are you sure you want to delete order ${order.orderNumber}?`)) {
      await deleteMutation.mutateAsync(order.id);
    }
  };

  const handleCreateVendor = () => {
    setShowVendorForm(true);
  };

  const handleVendorSubmit = async (data: any) => {
    await createContactMutation.mutateAsync({ ...data, type: 'vendor' });
    setShowVendorForm(false);
    // After creating a vendor, open the purchase order form
    setTimeout(() => {
      setSelectedOrder(null);
      setFormOpen(true);
    }, 200);
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">

          {/* Summary Cards */}
          {summary && (
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">All orders</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Draft</CardTitle>
                  <FileText className="size-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{summary.draftOrders}</div>
                  <p className="text-xs text-muted-foreground">Pending orders</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved</CardTitle>
                  <CheckCircle className="size-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{summary.approvedOrders}</div>
                  <p className="text-xs text-muted-foreground">Ready orders</p>
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
                  <p className="text-xs text-muted-foreground">Order value</p>
                </CardContent>
              </Card>
            </div>
          )}

          <DataTableCrud
            columns={orderColumns}
            data={orders}
            searchKey="orderNumber"
            searchPlaceholder="Search purchase orders..."
            onAdd={handleAdd}
            onRefresh={refetch}
            isLoading={ordersLoading}
            addButtonLabel="Add Purchase Order"
            showActions={false}
          />
        </div>
      </div>

      {/* No Vendor Dialog */}
      <NoVendorDialog
        open={showNoVendorDialog}
        onOpenChange={setShowNoVendorDialog}
        onCreateVendor={handleCreateVendor}
      />

      {/* Vendor Form */}
      <VendorForm
        open={showVendorForm}
        onOpenChange={setShowVendorForm}
        onSubmit={handleVendorSubmit}
        vendor={null}
        isLoading={createContactMutation.isPending}
      />

      {/* Purchase Order Form */}
      {vendors.length > 0 && (
        <PurchaseOrderForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          purchaseOrder={selectedOrder}
          vendors={vendors}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}