'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { type PurchaseOrder } from '@/lib/db/schema/index';

// Fetch purchase orders
export function usePurchaseOrders(params?: {
  status?: string;
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) {
  const queryParams: any = {};
  if (params?.status) queryParams.status = params.status;
  if (params?.vendorId) queryParams.vendorId = params.vendorId;
  if (params?.dateFrom) queryParams.dateFrom = params.dateFrom;
  if (params?.dateTo) queryParams.dateTo = params.dateTo;
  if (params?.search) queryParams.search = params.search;
  
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => apiClient.get<any[]>('/api/purchasing/orders', queryParams),
  });
}

// Create purchase order mutation
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<PurchaseOrder> & { lines?: any[] }) =>
      apiClient.post<PurchaseOrder>('/api/purchasing/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-summary'] });
    },
  });
}

// Update purchase order mutation
export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<PurchaseOrder> & { id: string; lines?: any[] }) =>
      apiClient.put<PurchaseOrder>(`/api/purchasing/orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-summary'] });
    },
  });
}

// Delete purchase order mutation
export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/purchasing/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-summary'] });
    },
  });
}

// Purchase orders summary/stats
export function usePurchaseOrdersSummary() {
  return useQuery({
    queryKey: ['purchase-orders-summary'],
    queryFn: () => apiClient.get<{
      totalOrders: number;
      draftOrders: number;
      approvedOrders: number;
      receivedOrders: number;
      totalValue: number;
    }>('/api/purchasing/orders?summary=true'),
  });
}