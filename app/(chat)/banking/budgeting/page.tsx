'use client';

import { useState } from 'react';
import { DataTableCrud } from '@/components/ui/data-table-crud';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ArrowUpDown, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for budgets
const mockBudgets = [
  {
    id: '1',
    name: 'Marketing Budget Q1 2024',
    category: 'Marketing',
    period: 'Q1 2024',
    budgetAmount: 50000,
    actualAmount: 42000,
    variance: 8000,
    percentUsed: 84,
    status: 'on_track',
  },
  {
    id: '2',
    name: 'Operations Budget 2024',
    category: 'Operations',
    period: '2024',
    budgetAmount: 200000,
    actualAmount: 185000,
    variance: 15000,
    percentUsed: 92.5,
    status: 'warning',
  },
  {
    id: '3',
    name: 'R&D Budget H1 2024',
    category: 'Research & Development',
    period: 'H1 2024',
    budgetAmount: 150000,
    actualAmount: 155000,
    variance: -5000,
    percentUsed: 103.3,
    status: 'over_budget',
  },
  {
    id: '4',
    name: 'Sales Team Budget',
    category: 'Sales',
    period: 'Monthly',
    budgetAmount: 25000,
    actualAmount: 18500,
    variance: 6500,
    percentUsed: 74,
    status: 'on_track',
  },
];

export default function BudgetingPage() {
  const [budgets] = useState(mockBudgets);

  // Calculate summary statistics
  const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalActual = budgets.reduce((sum, b) => sum + b.actualAmount, 0);
  const totalVariance = totalBudget - totalActual;
  const overallPercent = (totalActual / totalBudget) * 100;

  // Columns definition
  const columns: ColumnDef<typeof mockBudgets[0]>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Budget Name
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">{row.original.period}</div>
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
      accessorKey: 'budgetAmount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Budget
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = row.original.budgetAmount;
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount);
        return <span className="font-medium">{formatted}</span>;
      },
    },
    {
      accessorKey: 'actualAmount',
      header: 'Actual',
      cell: ({ row }) => {
        const amount = row.original.actualAmount;
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount);
        return <span>{formatted}</span>;
      },
    },
    {
      accessorKey: 'variance',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Variance
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const variance = row.original.variance;
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Math.abs(variance));
        return (
          <span className={cn('font-medium', variance >= 0 ? 'text-green-600' : 'text-red-600')}>
            {variance >= 0 ? '+' : '-'}{formatted}
          </span>
        );
      },
    },
    {
      accessorKey: 'percentUsed',
      header: 'Progress',
      cell: ({ row }) => {
        const percent = row.original.percentUsed;
        const status = row.original.status;
        
        const progressColor = {
          on_track: 'bg-green-500',
          warning: 'bg-orange-500',
          over_budget: 'bg-red-500',
        };
        
        return (
          <div className="w-32">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{percent.toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(percent, 100)} 
              className="h-2"
              indicatorClassName={progressColor[status as keyof typeof progressColor]}
            />
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
          on_track: { label: 'On Track', color: 'bg-green-500/10 text-green-500' },
          warning: { label: 'Warning', color: 'bg-orange-500/10 text-orange-500' },
          over_budget: { label: 'Over Budget', color: 'bg-red-500/10 text-red-500' },
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

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                <DollarSign className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalBudget.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {budgets.length} budgets
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <TrendingUp className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalActual.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {overallPercent.toFixed(1)}% of budget
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Variance</CardTitle>
                <TrendingDown className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  totalVariance >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {totalVariance >= 0 ? '+' : '-'}${Math.abs(totalVariance).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalVariance >= 0 ? 'Under budget' : 'Over budget'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                <Target className="size-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {budgets.filter(b => b.status === 'warning' || b.status === 'over_budget').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Budgets need attention
                </p>
              </CardContent>
            </Card>
          </div>

          <DataTableCrud
            columns={columns}
            data={budgets}
            searchKey="name"
            searchPlaceholder="Search budgets..."
            onAdd={() => alert('Add budget functionality coming soon')}
            onRefresh={() => {}}
            isLoading={false}
            addButtonLabel="Create Budget"
            showActions={false}
          />
        </div>
      </div>
    </div>
  );
}