'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { InventoryLevel, StockMove, Warehouse, Product } from '@/lib/db/schema/index';

// Inventory levels hooks
export function useInventoryLevels(filters?: {
  warehouseId?: string;
  productId?: string;
  lowStock?: boolean;
  search?: string;
}) {
  const params: any = {};
  if (filters?.warehouseId) params.warehouseId = filters.warehouseId;
  if (filters?.productId) params.productId = filters.productId;
  if (filters?.lowStock) params.lowStock = 'true';
  if (filters?.search) params.search = filters.search;
  
  return useQuery({
    queryKey: ['inventoryLevels', filters || {}],
    queryFn: () => apiClient.get<Array<{
      inventory: InventoryLevel;
      product: Product;
      warehouse: Warehouse;
    }>>('/api/inventory/levels', params),
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: ['inventorySummary'],
    queryFn: () => apiClient.get<{
      totalItems: number;
      totalQuantity: number;
      totalValue: number;
      lowStockItems: number;
      outOfStockItems: number;
      warehouseCount: number;
    }>('/api/inventory/levels', { summary: 'true' }),
  });
}

export function useCreateInventoryLevel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<InventoryLevel>) =>
      apiClient.post<InventoryLevel>('/api/inventory/levels', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryLevels'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
    },
  });
}

export function useUpdateInventoryLevel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<InventoryLevel> & { id: string }) =>
      apiClient.put<InventoryLevel>(`/api/inventory/levels/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryLevels'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
    },
  });
}

// Stock moves hooks
export function useStockMoves(filters?: {
  warehouseId?: string;
  productId?: string;
  moveType?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const params: any = {};
  if (filters?.warehouseId) params.warehouseId = filters.warehouseId;
  if (filters?.productId) params.productId = filters.productId;
  if (filters?.moveType) params.moveType = filters.moveType;
  if (filters?.startDate) params.startDate = filters.startDate.toISOString();
  if (filters?.endDate) params.endDate = filters.endDate.toISOString();
  
  return useQuery({
    queryKey: ['stockMoves', filters || {}],
    queryFn: () => apiClient.get<Array<{
      move: StockMove;
      product: Product;
      sourceWarehouse: Warehouse;
    }>>('/api/inventory/moves', params),
  });
}

export function useCreateStockMove() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<StockMove>) =>
      apiClient.post<StockMove>('/api/inventory/moves', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockMoves'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryLevels'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
    },
  });
}

// Warehouses hooks
export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: () => apiClient.get<Warehouse[]>('/api/inventory/warehouses'),
  });
}