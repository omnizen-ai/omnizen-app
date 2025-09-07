'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { type Warehouse, type WarehousesSummary } from '@/lib/types/database';

// Fetch warehouses
export function useWarehouses(params?: {
  search?: string;
  type?: string;
  status?: string;
}) {
  const queryParams: any = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.type) queryParams.type = params.type;
  if (params?.status) queryParams.status = params.status;
  
  return useQuery({
    queryKey: ['warehouses', params],
    queryFn: () => apiClient.get<Warehouse[]>('/api/operations/warehouses', queryParams),
  });
}

// Create warehouse mutation
export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Warehouse>) =>
      apiClient.post<Warehouse>('/api/operations/warehouses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses-summary'] });
    },
  });
}

// Update warehouse mutation
export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Warehouse> & { id: string }) =>
      apiClient.put<Warehouse>(`/api/operations/warehouses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses-summary'] });
    },
  });
}

// Delete warehouse mutation
export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/operations/warehouses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses-summary'] });
    },
  });
}

// Warehouses summary/stats
export function useWarehousesSummary() {
  return useQuery({
    queryKey: ['warehouses-summary'],
    queryFn: () => apiClient.get<WarehousesSummary>('/api/operations/warehouses?summary=true'),
  });
}