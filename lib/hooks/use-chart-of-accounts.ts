import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api/client';
import { 
  handleMutationError, 
  handleMutationSuccess 
} from '@/lib/api/client';
import type { ChartAccount } from '@/lib/db/schema/index';

const QUERY_KEY = 'chart-of-accounts';

// Fetch all accounts
export function useChartAccounts() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const data = await ApiClient.get<ChartAccount[]>('/accounting/api/accounts');
      return data || [];
    },
  });
}

// Fetch single account
export function useChartAccount(id?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => ApiClient.get<ChartAccount>(`/accounting/api/accounts/${id}`),
    enabled: !!id,
  });
}

// Create account
export function useCreateChartAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<ChartAccount>) => 
      ApiClient.post<ChartAccount>('/accounting/api/accounts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      handleMutationSuccess('Account created successfully');
    },
    onError: (error) => {
      handleMutationError(error, 'Failed to create account');
    },
  });
}

// Update account
export function useUpdateChartAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ChartAccount> & { id: string }) => 
      ApiClient.put<ChartAccount>(`/accounting/api/accounts/${id}`, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.id] });
      handleMutationSuccess('Account updated successfully');
    },
    onError: (error) => {
      handleMutationError(error, 'Failed to update account');
    },
  });
}

// Delete account
export function useDeleteChartAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => 
      ApiClient.delete(`/accounting/api/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      handleMutationSuccess('Account deleted successfully');
    },
    onError: (error) => {
      handleMutationError(error, 'Failed to delete account');
    },
  });
}