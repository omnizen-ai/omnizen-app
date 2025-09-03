'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Bill } from '@/lib/db/schema/index';
import { toast } from 'sonner';

export function useBills(filters?: {
  status?: string;
  vendorId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['bills', filters || {}],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.vendorId) params.append('vendorId', filters.vendorId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      
      const response = await apiClient.get(`/bookkeeping/api/bills?${params}`);
      return response || [];
    },
  });
}

export function useBillStats() {
  return useQuery({
    queryKey: ['bill-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/bookkeeping/api/bills?stats=true');
      return response || { totalOutstanding: 0, totalOverdue: 0, totalDraft: 0, count: 0 };
    },
  });
}

export function useBillById(id: string | null) {
  return useQuery({
    queryKey: ['bill', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get(`/bookkeeping/api/bills/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Bill>) => {
      const response = await apiClient.post('/bookkeeping/api/bills', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['bill-stats'] });
      toast.success('Bill created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create bill');
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Bill> & { id: string }) => {
      const response = await apiClient.put(`/bookkeeping/api/bills/${id}`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['bill', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['bill-stats'] });
      toast.success('Bill updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update bill');
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/bookkeeping/api/bills/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['bill-stats'] });
      toast.success('Bill deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete bill');
    },
  });
}

export function useRecordBillPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      billId,
      amount,
      paymentDate,
      paymentMethod,
      reference,
    }: {
      billId: string;
      amount: string;
      paymentDate: Date;
      paymentMethod?: string;
      reference?: string;
    }) => {
      const response = await apiClient.post(`/bookkeeping/api/bills/${billId}`, {
        action: 'record-payment',
        amount,
        paymentDate,
        paymentMethod,
        reference,
      });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['bill', variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['bill-stats'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });
}