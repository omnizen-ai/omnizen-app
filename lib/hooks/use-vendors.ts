'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { type Contact } from '@/lib/db/schema/index';

// Fetch vendors
export function useVendors(params?: {
  search?: string;
  status?: string;
}) {
  const queryParams: any = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.status) queryParams.status = params.status;
  
  return useQuery({
    queryKey: ['vendors', params],
    queryFn: () => apiClient.get<Contact[]>('/api/purchasing/vendors', queryParams),
  });
}

// Create vendor mutation
export function useCreateVendor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Contact>) =>
      apiClient.post<Contact>('/api/purchasing/vendors', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-summary'] });
    },
  });
}

// Update vendor mutation
export function useUpdateVendor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Contact> & { id: string }) =>
      apiClient.put<Contact>(`/api/purchasing/vendors`, { id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-summary'] });
    },
  });
}

// Delete vendor mutation
export function useDeleteVendor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/purchasing/vendors?id=${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-summary'] });
    },
  });
}

// Vendors summary/stats
export function useVendorsSummary() {
  return useQuery({
    queryKey: ['vendors-summary'],
    queryFn: () => apiClient.get<{
      totalVendors: number;
      activeVendors: number;
      recentVendors: number;
      totalPurchases: number;
    }>('/api/purchasing/vendors?summary=true'),
  });
}