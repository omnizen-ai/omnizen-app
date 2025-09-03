'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ArrowUpDown, 
  Warehouse,
  MapPin,
  Settings,
  Building,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useWarehouses,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
  useWarehousesSummary
} from '@/lib/hooks/use-warehouses';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function WarehousesPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  // React Query hooks
  const { data: warehouses = [], isLoading: warehousesLoading, refetch } = useWarehouses();
  const { data: summary } = useWarehousesSummary();
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();

  // Columns definition for warehouses table
  const warehouseColumns: ColumnDef<any>[] = [
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
        const warehouse = row.original;
        return (
          <div>
            <div className="font-medium">{warehouse.name}</div>
            <div className="text-sm text-muted-foreground">{warehouse.code}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.type;
        const typeColors = {
          main: 'bg-blue-500/10 text-blue-500',
          satellite: 'bg-green-500/10 text-green-500',
          distribution: 'bg-purple-500/10 text-purple-500',
          retail: 'bg-orange-500/10 text-orange-500',
        };
        return (
          <Badge 
            variant="outline" 
            className={cn('capitalize', typeColors[type as keyof typeof typeColors] || 'bg-gray-500/10 text-gray-500')}
          >
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const warehouse = row.original;
        return (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{warehouse.city}, {warehouse.state}</div>
              <div className="text-sm text-muted-foreground">{warehouse.country}</div>
            </div>
          </div>
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
      accessorKey: 'isDefault',
      header: 'Default',
      cell: ({ row }) => {
        const isDefault = row.original.isDefault;
        return isDefault ? (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
            Default
          </Badge>
        ) : null;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const warehouse = row.original;

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
              <DropdownMenuItem onClick={() => handleEdit(warehouse)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(warehouse)}
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
    setSelectedWarehouse(null);
    setFormOpen(true);
  };

  const handleEdit = (warehouse: any) => {
    setSelectedWarehouse(warehouse);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (selectedWarehouse) {
      await updateMutation.mutateAsync({
        id: selectedWarehouse.id,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setSelectedWarehouse(null);
  };

  const handleDelete = async (warehouse: any) => {
    if (confirm(`Are you sure you want to delete warehouse ${warehouse.name}?`)) {
      await deleteMutation.mutateAsync(warehouse.id);
    }
  };

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Warehouses</h2>
            <p className="text-muted-foreground mt-2">
              Manage warehouse locations, track storage capacity, and organize inventory distribution.
            </p>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
                  <Warehouse className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalWarehouses}</div>
                  <p className="text-xs text-muted-foreground">All locations</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <Settings className="size-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{summary.activeWarehouses}</div>
                  <p className="text-xs text-muted-foreground">Operational</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Main Locations</CardTitle>
                  <Building className="size-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{summary.mainWarehouses}</div>
                  <p className="text-xs text-muted-foreground">Primary facilities</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Default</CardTitle>
                  <MapPin className="size-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{summary.defaultWarehouses}</div>
                  <p className="text-xs text-muted-foreground">Default location</p>
                </CardContent>
              </Card>
            </div>
          )}

          <DataTableCrud
            columns={warehouseColumns}
            data={warehouses}
            searchKey="name"
            searchPlaceholder="Search warehouses..."
            onAdd={handleAdd}
            onRefresh={refetch}
            isLoading={warehousesLoading}
            addButtonLabel="Add Warehouse"
            showActions={false}
          />
        </div>
      </div>

      {/* Warehouse Form Dialog */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {selectedWarehouse ? 'Edit Warehouse' : 'New Warehouse'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Warehouse form functionality coming soon...
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