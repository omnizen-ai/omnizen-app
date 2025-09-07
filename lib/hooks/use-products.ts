'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { type Product, type ProductsSummary } from '@/lib/types/database';

// Fetch products
export function useProducts(params?: {
  search?: string;
  category?: string;
  type?: string;
  status?: string;
}) {
  const queryParams: any = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.category) queryParams.category = params.category;
  if (params?.type) queryParams.type = params.type;
  if (params?.status) queryParams.status = params.status;
  
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => apiClient.get<Product[]>('/api/sales/products', queryParams),
  });
}

// Create product mutation
export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Product>) =>
      apiClient.post<Product>('/api/sales/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-summary'] });
    },
  });
}

// Update product mutation
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Product> & { id: string }) =>
      apiClient.put<Product>(`/api/sales/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-summary'] });
    },
  });
}

// Delete product mutation
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/sales/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-summary'] });
    },
  });
}

// Product summary/stats
export function useProductSummary() {
  return useQuery({
    queryKey: ['product-summary'],
    queryFn: () => apiClient.get<{
      totalProducts: number;
      activeProducts: number;
      categories: number;
      totalValue: number;
    }>('/api/sales/products?summary=true'),
  });
}