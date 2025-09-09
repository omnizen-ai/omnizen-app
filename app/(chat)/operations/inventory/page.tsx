'use client';

import React, { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { ProductForm } from '@/components/operations/product-form';
import { NoInventoryDialog } from '@/components/operations/no-inventory-dialog';
import { WarehouseForm } from '@/components/operations/warehouse-form';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/lib/hooks/use-products';
import {
  useWarehouses,
  useCreateWarehouse,
} from '@/lib/hooks/use-warehouses';
import {
  useInventoryLevels,
  useInventorySummary,
} from '@/lib/hooks/use-inventory';
import type { Product, Warehouse } from '@/lib/db/schema/index';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  ArrowUpDown, 
  Package, 
  AlertTriangle, 
  TrendingDown,
  Warehouse as WarehouseIcon 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function InventoryPage() {
  const [showNoInventoryDialog, setShowNoInventoryDialog] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // React Query hooks
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: warehouses = [], isLoading: warehousesLoading } = useWarehouses();
  const { data: inventoryData, isLoading: inventoryLoading, error: inventoryError, refetch } = useInventoryLevels();
  const { data: summary, error: summaryError } = useInventorySummary();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const createWarehouseMutation = useCreateWarehouse();

  // Helper functions for data transformation
  const getInventoryStatus = (inventory: any) => {
    if (inventory.quantityOnHand === 0) return 'out_of_stock';
    if (inventory.quantityOnHand <= inventory.reorderPoint) return 'low_stock';
    return 'in_stock';
  };

  const getStockLevel = (inventory: any) => {
    if (inventory.quantityOnHand === 0) return 0;
    const maxLevel = Math.max(inventory.reorderPoint * 2, 100);
    return Math.min((inventory.quantityOnHand / maxLevel) * 100, 100);
  };

  const transformInventoryDataToTableFormat = (data: any[]) => {
    return data.map((item: any) => ({
      id: item.inventory.id,
      productSku: item.product?.sku || 'N/A',
      productName: item.product?.name || 'Unknown Product',
      category: item.product?.category || 'Uncategorized',
      warehouse: item.warehouse?.name || 'Unknown Warehouse',
      quantityOnHand: item.inventory.quantityOnHand || 0,
      quantityAvailable: item.inventory.quantityAvailable || 0,
      quantityReserved: item.inventory.quantityReserved || 0,
      reorderPoint: item.inventory.reorderPoint || 0,
      reorderQuantity: item.inventory.reorderQuantity || 0,
      unitCost: item.inventory.averageCost || 0,
      totalValue: (item.inventory.quantityOnHand || 0) * (item.inventory.averageCost || 0),
      status: getInventoryStatus(item.inventory),
      stockLevel: getStockLevel(item.inventory),
    }));
  };

  // Transform inventory data for the table
  const inventory = React.useMemo(() => {
    if (!inventoryData) return [];
    return transformInventoryDataToTableFormat(inventoryData);
  }, [inventoryData]);

  // Handlers following banking pattern
  const handleAdd = () => {
    if (products.length === 0 && warehouses.length === 0) {
      setShowNoInventoryDialog(true);
      return;
    }
    // If we have prerequisites, show product form directly
    setSelectedProduct(null);
    setShowProductForm(true);
  };

  const handleCreateProduct = () => {
    setShowProductForm(true);
  };

  const handleCreateWarehouse = () => {
    setShowWarehouseForm(true);
  };

  const handleProductSubmit = async (data: Partial<Product>) => {
    if (selectedProduct) {
      await updateProductMutation.mutateAsync({
        id: selectedProduct.id,
        ...data,
      });
    } else {
      await createProductMutation.mutateAsync(data);
    }
    setShowProductForm(false);
    setSelectedProduct(null);
  };

  const handleWarehouseSubmit = async (data: Partial<Warehouse>) => {
    await createWarehouseMutation.mutateAsync(data);
    setShowWarehouseForm(false);
    // After creating a warehouse, optionally open the product form
    setTimeout(() => {
      setSelectedProduct(null);
      setShowProductForm(true);
    }, 200);
  };

  // Columns definition
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'productSku',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            SKU
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div>
            <div className="font-mono font-medium">{row.original.productSku}</div>
            <div className="text-xs text-muted-foreground">{row.original.productName}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        return <Badge variant="secondary">{row.original.category}</Badge>;
      },
    },
    {
      accessorKey: 'warehouse',
      header: 'Warehouse',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1">
            <WarehouseIcon className="size-3 text-muted-foreground" />
            <span className="text-sm">{row.original.warehouse}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'quantityOnHand',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            On Hand
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const onHand = row.original.quantityOnHand;
        const available = row.original.quantityAvailable;
        const reserved = row.original.quantityReserved;
        return (
          <div>
            <div className="font-medium">{onHand}</div>
            <div className="text-xs text-muted-foreground">
              {available} avail, {reserved} reserved
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'reorderPoint',
      header: 'Reorder Point',
      cell: ({ row }) => {
        const reorderPoint = row.original.reorderPoint;
        const reorderQty = row.original.reorderQuantity;
        return (
          <div>
            <div>{reorderPoint}</div>
            <div className="text-xs text-muted-foreground">
              Order: {reorderQty}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'stockLevel',
      header: 'Stock Level',
      cell: ({ row }) => {
        const level = row.original.stockLevel;
        const status = row.original.status;
        
        let color = 'bg-green-500';
        if (status === 'low_stock') color = 'bg-orange-500';
        if (status === 'out_of_stock') color = 'bg-red-500';
        
        return (
          <div className="w-24">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{level}%</span>
            </div>
            <Progress 
              value={level} 
              className="h-2"
              indicatorClassName={color}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'unitCost',
      header: 'Unit Cost',
      cell: ({ row }) => {
        const cost = row.original.unitCost;
        return <span className="font-mono">${cost.toFixed(2)}</span>;
      },
    },
    {
      accessorKey: 'totalValue',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Total Value
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const value = row.original.totalValue;
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
        return <span className="font-medium">{formatted}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusConfig = {
          in_stock: { label: 'In Stock', color: 'bg-green-500/10 text-green-500', icon: null },
          low_stock: { label: 'Low Stock', color: 'bg-orange-500/10 text-orange-500', icon: AlertTriangle },
          out_of_stock: { label: 'Out of Stock', color: 'bg-red-500/10 text-red-500', icon: TrendingDown },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        const Icon = config.icon;
        return (
          <Badge variant="outline" className={cn('capitalize', config.color)}>
            {Icon && <Icon className="size-3 mr-1" />}
            {config.label}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto py-8 px-4">

          {/* Summary Cards */}
          {(summary || !summaryError) && (
            <div className="grid gap-4 md:grid-cols-5 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <Package className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalItems || inventory.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Unique products
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                  <Package className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(summary?.totalQuantity || inventory.reduce((sum, item) => sum + item.quantityOnHand, 0)).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Units on hand
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <Package className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(summary?.totalValue || inventory.reduce((sum, item) => sum + item.totalValue, 0)).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Inventory value
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                  <AlertTriangle className="size-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {summary?.lowStockItems || inventory.filter(item => item.status === 'low_stock').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Items need reorder
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                  <TrendingDown className="size-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {summary?.outOfStockItems || inventory.filter(item => item.status === 'out_of_stock').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Items unavailable
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <DataTableCrud
            columns={columns}
            data={inventory}
            searchKey="productSku"
            searchPlaceholder="Search products..."
            onAdd={handleAdd}
            onRefresh={refetch}
            isLoading={inventoryLoading || productsLoading || warehousesLoading}
            addButtonLabel="Add Product"
            showActions={false}
          />
        </div>
      </div>

      {/* No Inventory Dialog */}
      <NoInventoryDialog
        open={showNoInventoryDialog}
        onOpenChange={setShowNoInventoryDialog}
        onCreateProduct={handleCreateProduct}
        onCreateWarehouse={handleCreateWarehouse}
      />

      {/* Warehouse Form */}
      <WarehouseForm
        open={showWarehouseForm}
        onOpenChange={setShowWarehouseForm}
        onSubmit={handleWarehouseSubmit}
        warehouse={null}
        isLoading={createWarehouseMutation.isPending}
      />

      {/* Product Form */}
      <ProductForm
        open={showProductForm}
        onOpenChange={setShowProductForm}
        onSubmit={handleProductSubmit}
        product={selectedProduct}
        isLoading={createProductMutation.isPending || updateProductMutation.isPending}
      />
    </div>
  );
}