import { tool } from 'ai';
import { z } from 'zod';
import { apiClient, ApiError } from '@/lib/api/client';

// Helper to get current user context
interface UserContext {
  userId: string;
  orgId: string;
  workspaceId?: string;
  role: string;
}

// Type definitions for financial operations
interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
  balance: string;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
}

interface BankTransaction {
  id: string;
  accountId: string;
  account?: BankAccount;
  transactionDate: string;
  description: string;
  reference?: string;
  debit: string;
  credit: string;
  balance: string;
  category?: string;
  reconciled: boolean;
  statementId?: string;
}

interface Payment {
  id: string;
  paymentDate: string;
  amount: string;
  paymentMethod: string;
  reference?: string;
  description?: string;
  fromAccountId?: string;
  toAccountId?: string;
  customerId?: string;
  vendorId?: string;
  invoiceId?: string;
  billId?: string;
  status: string;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: string;
  isBase: boolean;
  isActive: boolean;
}

/**
 * Get bank accounts with filtering
 */
export const createGetBankAccountsApiTool = (context: UserContext) => tool({
  description: 'Get bank accounts with optional filtering. Fast API-based retrieval for banking information.',
  inputSchema: z.object({
    search: z.string().optional().describe('Search term to filter accounts by name or account number'),
    accountType: z.string().optional().describe('Filter by account type (checking, savings, etc.)'),
    currency: z.string().optional().describe('Filter by currency code (USD, EUR, etc.)'),
    isActive: z.boolean().optional().describe('Filter by active status'),
    isDefault: z.boolean().optional().describe('Filter by default account status'),
    limit: z.number().min(1).max(100).default(20).describe('Maximum number of accounts to return'),
    offset: z.number().min(0).default(0).describe('Number of records to skip for pagination'),
  }),
  execute: async ({ search, accountType, currency, isActive, isDefault, limit, offset }) => {
    try {
      const params: Record<string, any> = { limit, offset };
      if (search) params.search = search;
      if (accountType) params.accountType = accountType;
      if (currency) params.currency = currency;
      if (isActive !== undefined) params.isActive = isActive;
      if (isDefault !== undefined) params.isDefault = isDefault;

      const data = await apiClient.get<{ accounts: BankAccount[]; total: number }>('/api/banking/accounts', params);
      
      return {
        success: true,
        data: data.accounts,
        total: data.total,
        message: `Found ${data.total} bank accounts${search ? ` matching "${search}"` : ''}`,
      };
    } catch (error) {
      console.error('[getBankAccounts] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to fetch bank accounts',
      };
    }
  },
});

/**
 * Get bank transactions with filtering
 */
export const createGetBankTransactionsApiTool = (context: UserContext) => tool({
  description: 'Get bank transactions with filtering by account, date range, or amount. Fast API-based retrieval.',
  inputSchema: z.object({
    accountId: z.string().uuid().optional().describe('Filter by specific bank account ID'),
    accountName: z.string().optional().describe('Filter by account name (will resolve to account ID)'),
    dateFrom: z.string().optional().describe('Start date filter (YYYY-MM-DD format)'),
    dateTo: z.string().optional().describe('End date filter (YYYY-MM-DD format)'),
    minAmount: z.string().optional().describe('Minimum transaction amount'),
    maxAmount: z.string().optional().describe('Maximum transaction amount'),
    transactionType: z.enum(['debit', 'credit', 'all']).default('all').describe('Filter by transaction type'),
    reconciled: z.boolean().optional().describe('Filter by reconciliation status'),
    category: z.string().optional().describe('Filter by transaction category'),
    search: z.string().optional().describe('Search in description or reference'),
    limit: z.number().min(1).max(100).default(20).describe('Maximum number of transactions to return'),
    offset: z.number().min(0).default(0).describe('Number of records to skip for pagination'),
  }),
  execute: async ({ accountId, accountName, dateFrom, dateTo, minAmount, maxAmount, transactionType, reconciled, category, search, limit, offset }) => {
    try {
      // If accountName provided but not accountId, resolve account first
      let resolvedAccountId = accountId;
      if (accountName && !accountId) {
        const accountParams = { search: accountName, limit: 5 };
        const accountData = await apiClient.get<{ accounts: BankAccount[]; total: number }>('/api/banking/accounts', accountParams);
        
        if (accountData.accounts && accountData.accounts.length > 0) {
          resolvedAccountId = accountData.accounts[0].id;
        } else {
          return {
            success: false,
            error: `No bank account found matching "${accountName}"`,
          };
        }
      }

      const params: Record<string, any> = { limit, offset };
      if (resolvedAccountId) params.accountId = resolvedAccountId;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;
      if (transactionType !== 'all') params.transactionType = transactionType;
      if (reconciled !== undefined) params.reconciled = reconciled;
      if (category) params.category = category;
      if (search) params.search = search;

      const data = await apiClient.get<{ transactions: BankTransaction[]; total: number; summary?: any }>('/api/banking/transactions', params);
      
      return {
        success: true,
        data: data.transactions,
        total: data.total,
        message: `Found ${data.total} bank transactions${accountName ? ` for account "${accountName}"` : ''}`,
        summary: data.summary,
      };
    } catch (error) {
      console.error('[getBankTransactions] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to fetch bank transactions',
      };
    }
  },
});

/**
 * Get supported currencies
 */
export const createGetCurrenciesApiTool = (context: UserContext) => tool({
  description: 'Get supported currencies with exchange rates. Fast API-based retrieval.',
  inputSchema: z.object({
    isActive: z.boolean().optional().describe('Filter by active status'),
    isBase: z.boolean().optional().describe('Filter by base currency status'),
    limit: z.number().min(1).max(100).default(50).describe('Maximum number of currencies to return'),
  }),
  execute: async ({ isActive, isBase, limit }) => {
    try {
      const params: Record<string, any> = { limit };
      if (isActive !== undefined) params.isActive = isActive;
      if (isBase !== undefined) params.isBase = isBase;

      const data = await apiClient.get<{ currencies: Currency[]; total: number }>('/api/banking/currencies', params);
      
      return {
        success: true,
        data: data.currencies,
        total: data.total,
        message: `Found ${data.total} currencies`,
      };
    } catch (error) {
      console.error('[getCurrencies] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to fetch currencies',
      };
    }
  },
});

/**
 * Create a new bank account
 */
export const createCreateBankAccountApiTool = (context: UserContext) => tool({
  description: 'Create a new bank account with validation. Fast API-based creation.',
  inputSchema: z.object({
    name: z.string().min(1).describe('Account name (required)'),
    accountNumber: z.string().min(1).describe('Account number (required)'),
    bankName: z.string().min(1).describe('Bank name (required)'),
    accountType: z.enum(['checking', 'savings', 'credit', 'investment', 'other']).default('checking').describe('Account type'),
    balance: z.string().default('0').describe('Initial account balance'),
    currency: z.string().default('USD').describe('Currency code (e.g., USD, EUR)'),
    isDefault: z.boolean().default(false).describe('Set as default account'),
    description: z.string().optional().describe('Account description or notes'),
  }),
  execute: async ({ name, accountNumber, bankName, accountType, balance, currency, isDefault, description }) => {
    try {
      const accountData = {
        name,
        accountNumber,
        bankName,
        accountType,
        balance,
        currency,
        isDefault,
        description,
      };

      const data = await apiClient.post<{ account: BankAccount }>('/api/banking/accounts', accountData);
      
      return {
        success: true,
        data: data.account,
        message: `Bank account "${name}" created successfully`,
      };
    } catch (error) {
      console.error('[createBankAccount] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to create bank account',
      };
    }
  },
});

/**
 * Get account reconciliation status and unreconciled items
 */
export const createGetReconciliationStatusApiTool = (context: UserContext) => tool({
  description: 'Get reconciliation status for bank accounts and identify unreconciled transactions.',
  inputSchema: z.object({
    accountId: z.string().uuid().optional().describe('Filter by specific bank account ID'),
    dateFrom: z.string().optional().describe('Start date for reconciliation period (YYYY-MM-DD format)'),
    dateTo: z.string().optional().describe('End date for reconciliation period (YYYY-MM-DD format)'),
    showOnlyUnreconciled: z.boolean().default(true).describe('Show only unreconciled transactions'),
    limit: z.number().min(1).max(100).default(50).describe('Maximum number of unreconciled items to return'),
  }),
  execute: async ({ accountId, dateFrom, dateTo, showOnlyUnreconciled, limit }) => {
    try {
      const params: Record<string, any> = { 
        limit,
        reconciled: showOnlyUnreconciled ? false : undefined 
      };
      if (accountId) params.accountId = accountId;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      // Get transactions for reconciliation
      const data = await apiClient.get<{ 
        transactions: BankTransaction[]; 
        total: number;
        summary: {
          totalTransactions: number;
          reconciledTransactions: number;
          unreconciledTransactions: number;
          reconciledAmount: string;
          unreconciledAmount: string;
          reconciliationPercentage: number;
        }
      }>('/api/banking/transactions', params);
      
      return {
        success: true,
        data: data.transactions,
        total: data.total,
        message: `Found ${data.total} ${showOnlyUnreconciled ? 'unreconciled' : ''} transactions`,
        reconciliationSummary: data.summary,
      };
    } catch (error) {
      console.error('[getReconciliationStatus] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to get reconciliation status',
      };
    }
  },
});

/**
 * Get cash flow summary
 */
export const createGetCashFlowSummaryApiTool = (context: UserContext) => tool({
  description: 'Get cash flow summary showing money in, money out, and net cash flow for specified period.',
  inputSchema: z.object({
    accountId: z.string().uuid().optional().describe('Filter by specific bank account ID'),
    dateFrom: z.string().optional().describe('Start date for cash flow period (YYYY-MM-DD format, default: 30 days ago)'),
    dateTo: z.string().optional().describe('End date for cash flow period (YYYY-MM-DD format, default: today)'),
    groupBy: z.enum(['day', 'week', 'month']).default('month').describe('Group cash flow by time period'),
  }),
  execute: async ({ accountId, dateFrom, dateTo, groupBy }) => {
    try {
      const params: Record<string, any> = { groupBy };
      if (accountId) params.accountId = accountId;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      // Use banking statements analytics endpoint for cash flow
      const data = await apiClient.get<{
        cashFlow: Array<{
          period: string;
          moneyIn: string;
          moneyOut: string;
          netCashFlow: string;
        }>;
        summary: {
          totalMoneyIn: string;
          totalMoneyOut: string;
          netCashFlow: string;
          averageDaily: string;
          periodDays: number;
        };
      }>('/api/banking/statements/analytics', params);
      
      return {
        success: true,
        data: data.cashFlow,
        summary: data.summary,
        message: `Generated cash flow summary for ${data.summary.periodDays} days`,
      };
    } catch (error) {
      console.error('[getCashFlowSummary] Error:', error);
      return {
        success: false,
        error: error instanceof ApiError ? error.message : 'Failed to generate cash flow summary',
      };
    }
  },
});

// Export all financial API tools as a collection
export function createFinancialApiTools(context: UserContext) {
  return {
    getBankAccounts: createGetBankAccountsApiTool(context),
    getBankTransactions: createGetBankTransactionsApiTool(context),
    getCurrencies: createGetCurrenciesApiTool(context),
    createBankAccount: createCreateBankAccountApiTool(context),
    getReconciliationStatus: createGetReconciliationStatusApiTool(context),
    getCashFlowSummary: createGetCashFlowSummaryApiTool(context),
  };
}