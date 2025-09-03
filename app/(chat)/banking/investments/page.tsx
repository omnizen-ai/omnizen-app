'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUpDown, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for investments
const mockInvestments = [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'Stock',
    quantity: 100,
    purchasePrice: 150.00,
    currentPrice: 175.00,
    totalValue: 17500,
    gain: 2500,
    gainPercent: 16.67,
    status: 'profit',
  },
  {
    id: '2',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'Stock',
    quantity: 50,
    purchasePrice: 2800.00,
    currentPrice: 2950.00,
    totalValue: 147500,
    gain: 7500,
    gainPercent: 5.36,
    status: 'profit',
  },
  {
    id: '3',
    symbol: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    type: 'Bond ETF',
    quantity: 200,
    purchasePrice: 82.00,
    currentPrice: 79.50,
    totalValue: 15900,
    gain: -500,
    gainPercent: -3.05,
    status: 'loss',
  },
  {
    id: '4',
    symbol: 'VTIAX',
    name: 'Vanguard Total International Stock',
    type: 'Mutual Fund',
    quantity: 300,
    purchasePrice: 45.00,
    currentPrice: 48.00,
    totalValue: 14400,
    gain: 900,
    gainPercent: 6.67,
    status: 'profit',
  },
  {
    id: '5',
    symbol: 'GLD',
    name: 'SPDR Gold Shares',
    type: 'Commodity ETF',
    quantity: 75,
    purchasePrice: 170.00,
    currentPrice: 185.00,
    totalValue: 13875,
    gain: 1125,
    gainPercent: 8.82,
    status: 'profit',
  },
];

export default function InvestmentsPage() {
  const [investments] = useState(mockInvestments);

  // Calculate portfolio summary
  const totalValue = investments.reduce((sum, inv) => sum + inv.totalValue, 0);
  const totalGain = investments.reduce((sum, inv) => sum + inv.gain, 0);
  const totalCost = totalValue - totalGain;
  const totalGainPercent = (totalGain / totalCost) * 100;
  const profitableCount = investments.filter(inv => inv.status === 'profit').length;

  // Columns definition
  const columns: ColumnDef<typeof mockInvestments[0]>[] = [
    {
      accessorKey: 'symbol',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Symbol
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div>
            <div className="font-bold">{row.original.symbol}</div>
            <div className="text-xs text-muted-foreground">{row.original.name}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        return <Badge variant="secondary">{row.original.type}</Badge>;
      },
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => {
        return <span className="font-mono">{row.original.quantity}</span>;
      },
    },
    {
      accessorKey: 'purchasePrice',
      header: 'Purchase Price',
      cell: ({ row }) => {
        const price = row.original.purchasePrice;
        return <span className="font-mono">${price.toFixed(2)}</span>;
      },
    },
    {
      accessorKey: 'currentPrice',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Current Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const current = row.original.currentPrice;
        const purchase = row.original.purchasePrice;
        const isUp = current >= purchase;
        return (
          <div className="flex items-center gap-1">
            <span className="font-mono">${current.toFixed(2)}</span>
            {isUp ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
          </div>
        );
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
            <ArrowUpDown className="ml-2 h-4 w-4" />
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
      accessorKey: 'gain',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Gain/Loss
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const gain = row.original.gain;
        const percent = row.original.gainPercent;
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Math.abs(gain));
        return (
          <div>
            <div className={cn('font-medium', gain >= 0 ? 'text-green-600' : 'text-red-600')}>
              {gain >= 0 ? '+' : '-'}{formatted}
            </div>
            <div className={cn('text-xs', gain >= 0 ? 'text-green-500' : 'text-red-500')}>
              {gain >= 0 ? '+' : ''}{percent.toFixed(2)}%
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusConfig = {
          profit: { label: 'Profit', color: 'bg-green-500/10 text-green-500' },
          loss: { label: 'Loss', color: 'bg-red-500/10 text-red-500' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Badge variant="outline" className={cn('capitalize', config.color)}>
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Investment Portfolio</h2>
            <p className="text-muted-foreground mt-2">
              Track and manage your investment portfolio performance.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalValue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {investments.length} investments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
                {totalGain >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  totalGain >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {totalGain >= 0 ? '+' : '-'}${Math.abs(totalGain).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}% overall
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">AAPL</div>
                <p className="text-xs text-muted-foreground text-green-500">
                  +16.67% gain
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Health</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profitableCount}/{investments.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Profitable positions
                </p>
              </CardContent>
            </Card>
          </div>

          <DataTableCrud
            columns={columns}
            data={investments}
            searchKey="symbol"
            searchPlaceholder="Search investments..."
            onAdd={() => alert('Add investment functionality coming soon')}
            onRefresh={() => {}}
            isLoading={false}
            addButtonLabel="Add Investment"
            showActions={false}
          />
        </div>
      </div>
    </div>
  );
}