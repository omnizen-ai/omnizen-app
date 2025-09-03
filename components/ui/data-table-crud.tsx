'use client';

import * as React from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
  DotsHorizontalIcon,
} from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

export interface DataTableCrudProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  showColumnVisibility?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  className?: string;
  // CRUD operations
  onAdd?: () => void;
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  // Action column customization
  showActions?: boolean;
  customActions?: (row: TData) => React.ReactNode;
  // Toolbar customization
  toolbarActions?: React.ReactNode;
  // Add button customization
  addButtonLabel?: string;
}

export function DataTableCrud<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  showColumnVisibility = true,
  showPagination = true,
  pageSize = 10,
  onRowSelectionChange,
  className,
  onAdd,
  onEdit,
  onDelete,
  onRefresh,
  isLoading = false,
  showActions = true,
  customActions,
  toolbarActions,
  addButtonLabel = 'Add New',
}: DataTableCrudProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [rowToDelete, setRowToDelete] = React.useState<TData | null>(null);

  // Add action column if needed
  const columnsWithActions = React.useMemo(() => {
    // Check if an actions column already exists
    const hasActionsColumn = columns.some(col => 
      (col as any).id === 'actions' || (col as any).accessorKey === 'actions'
    );
    
    if (hasActionsColumn || !showActions || (!onEdit && !onDelete && !customActions)) {
      return columns;
    }

    const actionColumn: ColumnDef<TData, unknown> = {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const rowData = row.original;

        return (
          <div className="flex items-center gap-2">
            {customActions && customActions(rowData)}
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <DotsHorizontalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(rowData)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      {onEdit && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onClick={() => {
                          setRowToDelete(rowData);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      },
    };

    return [...columns, actionColumn];
  }, [columns, showActions, onEdit, onDelete, customActions]);

  const table = useReactTable({
    data,
    columns: columnsWithActions,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
      if (onRowSelectionChange) {
        const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map((key) => data[Number.parseInt(key)]);
        onRowSelectionChange(selectedRows);
      }
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const handleDelete = () => {
    if (rowToDelete && onDelete) {
      onDelete(rowToDelete);
      setDeleteDialogOpen(false);
      setRowToDelete(null);
    }
  };

  if (isLoading) {
    return <DataTableSkeleton columns={columns.length + (showActions ? 1 : 0)} />;
  }

  return (
    <>
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            {searchKey && (
              <Input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                  table.getColumn(searchKey)?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
            )}
            {toolbarActions}
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="icon" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {showColumnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Columns</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {onAdd && (
              <Button onClick={onAdd}>
                <Plus className="mr-2 h-4 w-4" />
                {addButtonLabel}
              </Button>
            )}
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={columnsWithActions.length} 
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {showPagination && <DataTablePagination table={table} />}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DataTablePagination<TData>({ table }: { table: any }) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="h-8 w-[70px] rounded-md border border-input bg-transparent px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DataTableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-[100px]" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: columns }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}