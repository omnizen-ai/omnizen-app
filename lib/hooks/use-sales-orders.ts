'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { type SalesOrder } from '@/lib/db/schema/index';

// Fetch sales orders
export function useSalesOrders(params?: {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) {
  const queryParams: any = {};
  if (params?.status) queryParams.status = params.status;
  if (params?.customerId) queryParams.customerId = params.customerId;
  if (params?.dateFrom) queryParams.dateFrom = params.dateFrom;
  if (params?.dateTo) queryParams.dateTo = params.dateTo;
  if (params?.search) queryParams.search = params.search;
  
  return useQuery({
    queryKey: ['sales-orders', params],
    queryFn: () => apiClient.get<any[]>('/api/sales/orders', queryParams),
  });
}

// Create sales order mutation
export function useCreateSalesOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<SalesOrder> & { lines?: any[] }) =>
      apiClient.post<SalesOrder>('/api/sales/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders-summary'] });
    },
  });
}

// Update sales order mutation
export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<SalesOrder> & { id: string; lines?: any[] }) =>
      apiClient.put<SalesOrder>(`/api/sales/orders`, { id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders-summary'] });
    },
  });
}

// Delete sales order mutation
export function useDeleteSalesOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/sales/orders?id=${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders-summary'] });
    },
  });
}

// Sales orders summary/stats
export function useSalesOrdersSummary() {
  return useQuery({
    queryKey: ['sales-orders-summary'],
    queryFn: () => apiClient.get<{
      totalOrders: number;
      draftOrders: number;
      confirmedOrders: number;
      totalValue: number;
    }>('/api/sales/orders?summary=true'),
  });
}