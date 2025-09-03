'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { BankAccount, BankTransaction } from '@/lib/db/schema/index';

// Bank Accounts hooks
export function useBankAccounts() {
  return useQuery({
    queryKey: ['bankAccounts'],
    queryFn: () => apiClient.get<BankAccount[]>('/api/banking/accounts'),
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<BankAccount>) =>
      apiClient.post<BankAccount>('/api/banking/accounts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<BankAccount> & { id: string }) =>
      apiClient.put<BankAccount>(`/api/banking/accounts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/banking/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
  });
}

// Bank Transactions hooks
export function useBankTransactions(filters?: {
  bankAccountId?: string;
  startDate?: Date;
  endDate?: Date;
  type?: string;
  reconciled?: boolean;
  search?: string;
}) {
  const params: any = {};
  if (filters?.bankAccountId) params.bankAccountId = filters.bankAccountId;
  if (filters?.startDate) params.startDate = filters.startDate.toISOString();
  if (filters?.endDate) params.endDate = filters.endDate.toISOString();
  if (filters?.type) params.type = filters.type;
  if (filters?.reconciled !== undefined) params.reconciled = filters.reconciled.toString();
  if (filters?.search) params.search = filters.search;
  
  return useQuery({
    queryKey: ['bankTransactions', filters || {}],
    queryFn: () => apiClient.get<Array<{
      transaction: BankTransaction;
      account: BankAccount;
    }>>('/api/banking/transactions', params),
  });
}

export function useCashFlowSummary(startDate?: Date, endDate?: Date) {
  const params: any = { summary: 'true' };
  if (startDate) params.startDate = startDate.toISOString();
  if (endDate) params.endDate = endDate.toISOString();
  
  return useQuery({
    queryKey: ['cashFlowSummary', { startDate, endDate }],
    queryFn: () => apiClient.get<{
      totalInflows: number;
      totalOutflows: number;
      netCashFlow: number;
      transactionCount: number;
      totalBalance: number;
      accountCount: number;
    }>('/api/banking/transactions', params),
  });
}

export function useCreateBankTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<BankTransaction>) =>
      apiClient.post<BankTransaction>('/api/banking/transactions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['cashFlowSummary'] });
    },
  });
}

export function useUpdateBankTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<BankTransaction> & { id: string }) =>
      apiClient.put<BankTransaction>(`/api/banking/transactions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['cashFlowSummary'] });
    },
  });
}

export function useDeleteBankTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/banking/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['cashFlowSummary'] });
    },
  });
}