'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { type SalesQuotation } from '@/lib/types/database';

// Fetch quotations
export function useQuotations(params?: {
  customerId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  validityDateFrom?: string;
  validityDateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const queryParams: any = {};
  if (params?.customerId) queryParams.customerId = params.customerId;
  if (params?.status) queryParams.status = params.status;
  if (params?.dateFrom) queryParams.dateFrom = params.dateFrom;
  if (params?.dateTo) queryParams.dateTo = params.dateTo;
  if (params?.validityDateFrom) queryParams.validityDateFrom = params.validityDateFrom;
  if (params?.validityDateTo) queryParams.validityDateTo = params.validityDateTo;
  if (params?.search) queryParams.search = params.search;
  if (params?.limit) queryParams.limit = params.limit.toString();
  if (params?.offset) queryParams.offset = params.offset.toString();
  
  return useQuery({
    queryKey: ['quotations', params],
    queryFn: () => apiClient.get<any[]>('/api/sales/quotations', queryParams),
  });
}

// Fetch single quotation
export function useQuotation(id: string) {
  return useQuery({
    queryKey: ['quotation', id],
    queryFn: () => apiClient.get<any>(`/api/sales/quotations/${id}`),
    enabled: !!id,
  });
}

// Create quotation mutation
export function useCreateQuotation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<SalesQuotation>) =>
      apiClient.post<SalesQuotation>('/api/sales/quotations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotations-summary'] });
    },
  });
}

// Update quotation mutation
export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<SalesQuotation> & { id: string }) =>
      apiClient.put<SalesQuotation>(`/api/sales/quotations/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['quotations-summary'] });
    },
  });
}

// Delete quotation mutation
export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/sales/quotations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotations-summary'] });
    },
  });
}

// Quotations summary/stats
export function useQuotationsSummary() {
  return useQuery({
    queryKey: ['quotations-summary'],
    queryFn: () => apiClient.get<{
      totalQuotations: number;
      draftQuotations: number;
      sentQuotations: number;
      acceptedQuotations: number;
      rejectedQuotations: number;
      convertedQuotations: number;
      totalValue: number;
      potentialValue: number;
    }>('/api/sales/quotations?summary=true'),
  });
}