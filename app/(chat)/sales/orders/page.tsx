'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { SalesOrderForm } from '@/components/sales/sales-order-form';
import { ContactForm } from '@/components/sales/contact-form';
import { NoCustomerDialog } from '@/components/sales/no-customer-dialog';
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
import { useContacts, useCreateContact } from '@/lib/hooks/use-sales';
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
  const [showNoCustomerDialog, setShowNoCustomerDialog] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // React Query hooks
  const { data: orders = [], isLoading: ordersLoading, refetch } = useSalesOrders();
  const { data: summary } = useSalesOrdersSummary();
  const { data: customers = [], isLoading: customersLoading } = useContacts({ type: 'customer' });
  const createMutation = useCreateSalesOrder();
  const updateMutation = useUpdateSalesOrder();
  const deleteMutation = useDeleteSalesOrder();
  const createContactMutation = useCreateContact();

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
    if (customers.length === 0) {
      setShowNoCustomerDialog(true);
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

  const handleCreateCustomer = () => {
    setShowCustomerForm(true);
  };

  const handleCustomerSubmit = async (data: any) => {
    await createContactMutation.mutateAsync({ ...data, type: 'customer' });
    setShowCustomerForm(false);
    // After creating a customer, open the sales order form
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

      {/* No Customer Dialog */}
      <NoCustomerDialog
        open={showNoCustomerDialog}
        onOpenChange={setShowNoCustomerDialog}
        onCreateCustomer={handleCreateCustomer}
      />

      {/* Customer Form */}
      <ContactForm
        open={showCustomerForm}
        onOpenChange={setShowCustomerForm}
        onSubmit={handleCustomerSubmit}
        contact={null}
        isLoading={createContactMutation.isPending}
      />

      {/* Sales Order Form */}
      {customers.length > 0 && (
        <SalesOrderForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          salesOrder={selectedOrder}
          customers={customers}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}