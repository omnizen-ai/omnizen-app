'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
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

// Mock data for inventory
const mockInventory = [
  {
    id: '1',
    productSku: 'SKU001',
    productName: 'Wireless Mouse',
    category: 'Electronics',
    warehouse: 'Main Warehouse',
    quantityOnHand: 150,
    quantityAvailable: 120,
    quantityReserved: 30,
    reorderPoint: 50,
    reorderQuantity: 100,
    unitCost: 15.00,
    totalValue: 2250,
    status: 'in_stock',
    stockLevel: 75,
  },
  {
    id: '2',
    productSku: 'SKU002',
    productName: 'USB-C Cable',
    category: 'Accessories',
    warehouse: 'Main Warehouse',
    quantityOnHand: 45,
    quantityAvailable: 45,
    quantityReserved: 0,
    reorderPoint: 50,
    reorderQuantity: 200,
    unitCost: 8.50,
    totalValue: 382.50,
    status: 'low_stock',
    stockLevel: 45,
  },
  {
    id: '3',
    productSku: 'SKU003',
    productName: 'Mechanical Keyboard',
    category: 'Electronics',
    warehouse: 'Secondary Warehouse',
    quantityOnHand: 0,
    quantityAvailable: 0,
    quantityReserved: 0,
    reorderPoint: 20,
    reorderQuantity: 50,
    unitCost: 45.00,
    totalValue: 0,
    status: 'out_of_stock',
    stockLevel: 0,
  },
  {
    id: '4',
    productSku: 'SKU004',
    productName: 'Monitor Stand',
    category: 'Furniture',
    warehouse: 'Main Warehouse',
    quantityOnHand: 200,
    quantityAvailable: 180,
    quantityReserved: 20,
    reorderPoint: 30,
    reorderQuantity: 50,
    unitCost: 25.00,
    totalValue: 5000,
    status: 'in_stock',
    stockLevel: 100,
  },
  {
    id: '5',
    productSku: 'SKU005',
    productName: 'Desk Lamp',
    category: 'Furniture',
    warehouse: 'Secondary Warehouse',
    quantityOnHand: 75,
    quantityAvailable: 70,
    quantityReserved: 5,
    reorderPoint: 25,
    reorderQuantity: 40,
    unitCost: 35.00,
    totalValue: 2625,
    status: 'in_stock',
    stockLevel: 75,
  },
];

export default function InventoryPage() {
  const [inventory] = useState(mockInventory);

  // Calculate summary statistics
  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
  const totalQuantity = inventory.reduce((sum, item) => sum + item.quantityOnHand, 0);
  const lowStockItems = inventory.filter(item => item.status === 'low_stock').length;
  const outOfStockItems = inventory.filter(item => item.status === 'out_of_stock').length;

  // Columns definition
  const columns: ColumnDef<typeof mockInventory[0]>[] = [
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
          <div className="grid gap-4 md:grid-cols-5 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItems}</div>
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
                  {totalQuantity.toLocaleString()}
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
                  ${totalValue.toLocaleString()}
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
                  {lowStockItems}
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
                  {outOfStockItems}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items unavailable
                </p>
              </CardContent>
            </Card>
          </div>

          <DataTableCrud
            columns={columns}
            data={inventory}
            searchKey="productSku"
            searchPlaceholder="Search products..."
            onAdd={() => alert('Add inventory functionality coming soon')}
            onRefresh={() => {}}
            isLoading={false}
            addButtonLabel="Add Product"
            showActions={false}
          />
        </div>
      </div>
    </div>
  );
}