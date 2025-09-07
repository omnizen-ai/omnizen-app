'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { type PurchaseReceipt } from '@/lib/types/database';

// Fetch purchase receipts
export function usePurchaseReceipts(params?: {
  purchaseOrderId?: string;
  warehouseId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const queryParams: any = {};
  if (params?.purchaseOrderId) queryParams.purchaseOrderId = params.purchaseOrderId;
  if (params?.warehouseId) queryParams.warehouseId = params.warehouseId;
  if (params?.status) queryParams.status = params.status;
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;
  if (params?.search) queryParams.search = params.search;
  if (params?.limit) queryParams.limit = params.limit.toString();
  if (params?.offset) queryParams.offset = params.offset.toString();
  
  return useQuery({
    queryKey: ['purchase-receipts', params],
    queryFn: () => apiClient.get<any[]>('/api/purchasing/receipts', queryParams),
  });
}

// Fetch single purchase receipt
export function usePurchaseReceipt(id: string) {
  return useQuery({
    queryKey: ['purchase-receipt', id],
    queryFn: () => apiClient.get<any>(`/api/purchasing/receipts/${id}`),
    enabled: !!id,
  });
}

// Create purchase receipt mutation
export function useCreatePurchaseReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<PurchaseReceipt>) =>
      apiClient.post<PurchaseReceipt>('/api/purchasing/receipts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-receipts-summary'] });
    },
  });
}

// Update purchase receipt mutation
export function useUpdatePurchaseReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<PurchaseReceipt> & { id: string }) =>
      apiClient.put<PurchaseReceipt>(`/api/purchasing/receipts/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-receipt', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-receipts-summary'] });
    },
  });
}

// Delete purchase receipt mutation
export function useDeletePurchaseReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/purchasing/receipts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-receipts-summary'] });
    },
  });
}

// Purchase receipts summary/stats
export function usePurchaseReceiptsSummary() {
  return useQuery({
    queryKey: ['purchase-receipts-summary'],
    queryFn: () => apiClient.get<{
      totalReceipts: number;
      pendingReceipts: number;
      completedReceipts: number;
      totalValue: number;
    }>('/api/purchasing/receipts?summary=true'),
  });
}