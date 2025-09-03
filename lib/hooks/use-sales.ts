'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { type Contact, type SalesOrder } from '@/lib/db/schema/index';

// Fetch contacts/customers
export function useContacts(params?: {
  search?: string;
  type?: string;
  status?: string;
}) {
  const queryParams: any = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.type) queryParams.type = params.type;
  if (params?.status) queryParams.status = params.status;
  
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => apiClient.get<Contact[]>('/api/sales/contacts', queryParams),
  });
}

// Create contact mutation
export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Contact>) =>
      apiClient.post<Contact>('/api/sales/contacts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
    },
  });
}

// Update contact mutation
export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Contact> & { id: string }) =>
      apiClient.put<Contact>(`/api/sales/contacts`, { id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
    },
  });
}

// Delete contact mutation
export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/sales/contacts?id=${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
    },
  });
}

// Fetch sales orders
export function useSalesOrders(params?: {
  status?: string;
  customerId?: string;
}) {
  const queryParams: any = {};
  if (params?.status) queryParams.status = params.status;
  if (params?.customerId) queryParams.customerId = params.customerId;
  
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
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
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
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
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
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
    },
  });
}

// Sales summary/stats
export function useSalesSummary() {
  return useQuery({
    queryKey: ['sales-summary'],
    queryFn: () => apiClient.get<{
      totalContacts: number;
      totalCustomers: number;
      activeCustomers: number;
      totalOrders: number;
      totalOrderValue: number;
    }>('/api/sales/contacts?summary=true'),
  });
}