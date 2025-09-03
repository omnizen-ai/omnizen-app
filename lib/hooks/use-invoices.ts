'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Invoice } from '@/lib/db/schema/index';
import { toast } from 'sonner';

export function useInvoices(filters?: {
  status?: string;
  customerId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  return useQuery({
    queryKey: ['invoices', filters || {}],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
      
      const response = await apiClient.get(`/accounting/api/invoices?${params}`);
      return response || [];
    },
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ['invoice-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/accounting/api/invoices?stats=true');
      return response || { totalOutstanding: 0, totalOverdue: 0, totalDraft: 0, count: 0 };
    },
  });
}

export function useInvoiceById(id: string | null) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get(`/accounting/api/invoices/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Invoice>) => {
      const response = await apiClient.post('/accounting/api/invoices', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Invoice created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Invoice> & { id: string }) => {
      const response = await apiClient.put(`/accounting/api/invoices/${id}`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update invoice');
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/accounting/api/invoices/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete invoice');
    },
  });
}

export function useRecordInvoicePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      invoiceId,
      amount,
      paymentDate,
      paymentMethod,
      reference,
    }: {
      invoiceId: string;
      amount: string;
      paymentDate: Date;
      paymentMethod?: string;
      reference?: string;
    }) => {
      const response = await apiClient.post(`/accounting/api/invoices/${invoiceId}`, {
        action: 'record-payment',
        amount,
        paymentDate,
        paymentMethod,
        reference,
      });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await apiClient.post(`/accounting/api/invoices/${invoiceId}`, {
        action: 'send',
      });
      return response;
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Invoice sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send invoice');
    },
  });
}