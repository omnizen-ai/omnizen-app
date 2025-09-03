'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
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
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useSalesOrders,
  useCreateSalesOrder,
  useUpdateSalesOrder,
  useDeleteSalesOrder,
  useSalesOrdersSummary
} from '@/lib/hooks/use-sales-orders';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function SalesOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  // React Query hooks
  const { data: orders = [], isLoading: ordersLoading, refetch } = useSalesOrders();
  const { data: summary } = useSalesOrdersSummary();
  const createMutation = useCreateSalesOrder();
  const updateMutation = useUpdateSalesOrder();
  const deleteMutation = useDeleteSalesOrder();

  // Columns definition for sales orders table
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
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => {
        const customer = row.original.customer;
        return customer ? (
          <div>
            <div className="font-medium">
              {customer.companyName || customer.name || 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">{customer.email}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">No customer</span>
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
          confirmed: 'bg-blue-500/10 text-blue-500',
          fulfilled: 'bg-green-500/10 text-green-500',
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

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Sales Orders</h2>
            <p className="text-muted-foreground mt-2">
              Create and manage sales orders, track order status, and generate invoices.
            </p>
          </div>

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
                  <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                  <Clock className="size-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{summary.confirmedOrders}</div>
                  <p className="text-xs text-muted-foreground">Active orders</p>
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
            searchPlaceholder="Search orders..."
            onAdd={handleAdd}
            onRefresh={refetch}
            isLoading={ordersLoading}
            addButtonLabel="Add Order"
            showActions={false}
          />
        </div>
      </div>

      {/* Order Form Dialog */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {selectedOrder ? 'Edit Order' : 'New Order'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Order form functionality coming soon...
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}