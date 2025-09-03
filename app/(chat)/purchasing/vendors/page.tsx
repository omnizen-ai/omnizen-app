'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ArrowUpDown, 
  Users,
  UserCheck,
  UserPlus,
  TrendingUp,
  Mail,
  Phone,
  Building,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
  useVendorsSummary
} from '@/lib/hooks/use-vendors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function VendorsPage() {
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  // React Query hooks
  const { data: vendors = [], isLoading: vendorsLoading, refetch } = useVendors();
  const { data: summary } = useVendorsSummary();
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();
  const deleteMutation = useDeleteVendor();

  // Columns definition for vendors table
  const vendorColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <div>
            <div className="font-medium">
              {vendor.companyName || vendor.displayName}
            </div>
            <div className="text-sm text-muted-foreground">
              {vendor.companyName ? vendor.displayName : vendor.email}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'contactInfo',
      header: 'Contact',
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <div className="space-y-1">
            {vendor.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-3 text-muted-foreground" />
                <span>{vendor.email}</span>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-3 text-muted-foreground" />
                <span>{vendor.phone}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'address',
      header: 'Location',
      cell: ({ row }) => {
        const vendor = row.original;
        const address = [vendor.city, vendor.state, vendor.country].filter(Boolean).join(', ');
        return address ? (
          <div className="text-sm">
            <div>{address}</div>
            {vendor.postalCode && (
              <div className="text-muted-foreground">{vendor.postalCode}</div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">No address</span>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge 
            variant="outline" 
            className={cn(
              'capitalize',
              isActive 
                ? 'bg-green-500/10 text-green-500' 
                : 'bg-gray-500/10 text-gray-500'
            )}
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Added',
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const vendor = row.original;

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
              <DropdownMenuItem onClick={() => handleEdit(vendor)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(vendor)}
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
    setSelectedVendor(null);
    setFormOpen(true);
  };

  const handleEdit = (vendor: any) => {
    setSelectedVendor(vendor);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (selectedVendor) {
      await updateMutation.mutateAsync({
        id: selectedVendor.id,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setSelectedVendor(null);
  };

  const handleDelete = async (vendor: any) => {
    const vendorName = vendor.companyName || vendor.displayName;
    if (confirm(`Are you sure you want to delete vendor ${vendorName}?`)) {
      await deleteMutation.mutateAsync(vendor.id);
    }
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Vendors</h2>
            <p className="text-muted-foreground mt-2">
              Manage vendor information, track performance, and maintain contact details.
            </p>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                  <Users className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalVendors}</div>
                  <p className="text-xs text-muted-foreground">All vendors</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <UserCheck className="size-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{summary.activeVendors}</div>
                  <p className="text-xs text-muted-foreground">Active vendors</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                  <UserPlus className="size-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{summary.recentVendors}</div>
                  <p className="text-xs text-muted-foreground">Recent additions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                  <TrendingUp className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalPurchases}</div>
                  <p className="text-xs text-muted-foreground">Purchase orders</p>
                </CardContent>
              </Card>
            </div>
          )}

          <DataTableCrud
            columns={vendorColumns}
            data={vendors}
            searchKey="companyName"
            searchPlaceholder="Search vendors..."
            onAdd={handleAdd}
            onRefresh={refetch}
            isLoading={vendorsLoading}
            addButtonLabel="Add Vendor"
            showActions={false}
          />
        </div>
      </div>

      {/* Vendor Form Dialog */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {selectedVendor ? 'Edit Vendor' : 'New Vendor'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Vendor form functionality coming soon...
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