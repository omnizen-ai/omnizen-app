import { db } from '@/lib/db';
import {
  bankAccounts,
  bankTransactions,
  cashFlowForecasts,
  type BankAccount,
  type BankTransaction,
  type CashFlowForecast,
} from '@/lib/db/schema/index';
import { eq, desc, and, gte, lte, sql, or, like, asc } from 'drizzle-orm';

// Get all bank accounts
export async function getBankAccounts(organizationId: string) {
  const accounts = await db
    .select()
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.organizationId, organizationId),
        eq(bankAccounts.isActive, true)
      )
    )
    .orderBy(asc(bankAccounts.accountName));
  
  return accounts || [];
}

// Get bank account by ID
export async function getBankAccountById(id: string, organizationId: string) {
  const [account] = await db
    .select()
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.id, id),
        eq(bankAccounts.organizationId, organizationId)
      )
    );
  
  return account || null;
}

// Create bank account
export async function createBankAccount(data: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) {
  const [account] = await db
    .insert(bankAccounts)
    .values(data)
    .returning();
  return account;
}

// Update bank account
export async function updateBankAccount(
  id: string,
  organizationId: string,
  data: Partial<Omit<BankAccount, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
) {
  const [account] = await db
    .update(bankAccounts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bankAccounts.id, id),
        eq(bankAccounts.organizationId, organizationId)
      )
    )
    .returning();
  return account;
}

// Delete bank account
export async function deleteBankAccount(id: string, organizationId: string) {
  await db
    .delete(bankAccounts)
    .where(
      and(
        eq(bankAccounts.id, id),
        eq(bankAccounts.organizationId, organizationId)
      )
    );
}

// Get bank transactions with filters
export async function getBankTransactions(
  organizationId: string,
  filters?: {
    bankAccountId?: string;
    startDate?: Date;
    endDate?: Date;
    transactionType?: string;
    isReconciled?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const conditions: any[] = [eq(bankTransactions.organizationId, organizationId)];
  
  if (filters?.bankAccountId) {
    conditions.push(eq(bankTransactions.bankAccountId, filters.bankAccountId));
  }
  
  if (filters?.startDate) {
    conditions.push(gte(bankTransactions.transactionDate, filters.startDate));
  }
  
  if (filters?.endDate) {
    conditions.push(lte(bankTransactions.transactionDate, filters.endDate));
  }
  
  if (filters?.transactionType) {
    conditions.push(eq(bankTransactions.transactionType, filters.transactionType as any));
  }
  
  if (filters?.isReconciled !== undefined) {
    conditions.push(eq(bankTransactions.isReconciled, filters.isReconciled));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(bankTransactions.description, `%${filters.search}%`),
        like(bankTransactions.payee, `%${filters.search}%`),
        like(bankTransactions.bankReferenceNumber, `%${filters.search}%`)
      )
    );
  }
  
  let query = db
    .select({
      transaction: bankTransactions,
      account: bankAccounts,
    })
    .from(bankTransactions)
    .leftJoin(bankAccounts, eq(bankTransactions.bankAccountId, bankAccounts.id))
    .where(and(...conditions))
    .orderBy(desc(bankTransactions.transactionDate), desc(bankTransactions.createdAt));
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  const result = await query;
  return result || [];
}

// Create bank transaction
export async function createBankTransaction(data: Omit<BankTransaction, 'id' | 'createdAt' | 'updatedAt'>) {
  const [transaction] = await db
    .insert(bankTransactions)
    .values(data)
    .returning();
  
  // Update bank account balance
  if (transaction) {
    const account = await getBankAccountById(data.bankAccountId, data.organizationId);
    if (account) {
      const amount = parseFloat(data.amount);
      let newBalance = parseFloat(account.currentBalance);
      
      if (data.transactionType === 'deposit' || data.transactionType === 'interest') {
        newBalance += amount;
      } else if (data.transactionType === 'withdrawal' || data.transactionType === 'fee') {
        newBalance -= amount;
      }
      
      await updateBankAccount(data.bankAccountId, data.organizationId, {
        currentBalance: newBalance.toFixed(2),
        availableBalance: newBalance.toFixed(2),
      });
    }
  }
  
  return transaction;
}

// Update bank transaction
export async function updateBankTransaction(
  id: string,
  organizationId: string,
  data: Partial<Omit<BankTransaction, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
) {
  const [transaction] = await db
    .update(bankTransactions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bankTransactions.id, id),
        eq(bankTransactions.organizationId, organizationId)
      )
    )
    .returning();
  return transaction;
}

// Delete bank transaction
export async function deleteBankTransaction(id: string, organizationId: string) {
  // Get the transaction first to update the balance
  const [transaction] = await db
    .select()
    .from(bankTransactions)
    .where(
      and(
        eq(bankTransactions.id, id),
        eq(bankTransactions.organizationId, organizationId)
      )
    );
  
  if (transaction) {
    // Delete the transaction
    await db
      .delete(bankTransactions)
      .where(
        and(
          eq(bankTransactions.id, id),
          eq(bankTransactions.organizationId, organizationId)
        )
      );
    
    // Update bank account balance
    const account = await getBankAccountById(transaction.bankAccountId, organizationId);
    if (account) {
      const amount = parseFloat(transaction.amount);
      let newBalance = parseFloat(account.currentBalance);
      
      // Reverse the transaction
      if (transaction.transactionType === 'deposit' || transaction.transactionType === 'interest') {
        newBalance -= amount;
      } else if (transaction.transactionType === 'withdrawal' || transaction.transactionType === 'fee') {
        newBalance += amount;
      }
      
      await updateBankAccount(transaction.bankAccountId, organizationId, {
        currentBalance: newBalance.toFixed(2),
        availableBalance: newBalance.toFixed(2),
      });
    }
  }
}

// Get cash flow summary
export async function getCashFlowSummary(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
) {
  const dateConditions = [];
  if (startDate) {
    dateConditions.push(gte(bankTransactions.transactionDate, startDate));
  }
  if (endDate) {
    dateConditions.push(lte(bankTransactions.transactionDate, endDate));
  }
  
  const result = await db
    .select({
      totalInflows: sql<number>`
        COALESCE(SUM(CASE WHEN transaction_type IN ('deposit', 'interest') THEN ${bankTransactions.amount} ELSE 0 END), 0)
      `,
      totalOutflows: sql<number>`
        COALESCE(SUM(CASE WHEN transaction_type IN ('withdrawal', 'fee', 'transfer') THEN ${bankTransactions.amount} ELSE 0 END), 0)
      `,
      netCashFlow: sql<number>`
        COALESCE(SUM(
          CASE 
            WHEN transaction_type IN ('deposit', 'interest') THEN ${bankTransactions.amount}
            WHEN transaction_type IN ('withdrawal', 'fee', 'transfer') THEN -${bankTransactions.amount}
            ELSE 0 
          END
        ), 0)
      `,
      transactionCount: sql<number>`COUNT(*)`,
    })
    .from(bankTransactions)
    .where(
      and(
        eq(bankTransactions.organizationId, organizationId),
        ...dateConditions
      )
    );
  
  // Get account balances
  const accountBalances = await db
    .select({
      totalBalance: sql<number>`COALESCE(SUM(${bankAccounts.currentBalance}), 0)`,
      accountCount: sql<number>`COUNT(*)`,
    })
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.organizationId, organizationId),
        eq(bankAccounts.isActive, true)
      )
    );
  
  return {
    ...result[0],
    ...accountBalances[0],
  } || {
    totalInflows: 0,
    totalOutflows: 0,
    netCashFlow: 0,
    transactionCount: 0,
    totalBalance: 0,
    accountCount: 0,
  };
}

// Get cash flow forecasts
export async function getCashFlowForecasts(organizationId: string) {
  const forecasts = await db
    .select()
    .from(cashFlowForecasts)
    .where(
      and(
        eq(cashFlowForecasts.organizationId, organizationId),
        eq(cashFlowForecasts.isActive, true)
      )
    )
    .orderBy(desc(cashFlowForecasts.createdAt));
  
  return forecasts || [];
}

// Create cash flow forecast
export async function createCashFlowForecast(data: Omit<CashFlowForecast, 'id' | 'createdAt' | 'updatedAt'>) {
  const [forecast] = await db
    .insert(cashFlowForecasts)
    .values(data)
    .returning();
  return forecast;
}

// Update cash flow forecast
export async function updateCashFlowForecast(
  id: string,
  organizationId: string,
  data: Partial<Omit<CashFlowForecast, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
) {
  const [forecast] = await db
    .update(cashFlowForecasts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(cashFlowForecasts.id, id),
        eq(cashFlowForecasts.organizationId, organizationId)
      )
    )
    .returning();
  return forecast;
}

// Delete cash flow forecast
export async function deleteCashFlowForecast(id: string, organizationId: string) {
  await db
    .delete(cashFlowForecasts)
    .where(
      and(
        eq(cashFlowForecasts.id, id),
        eq(cashFlowForecasts.organizationId, organizationId)
      )
    );
}