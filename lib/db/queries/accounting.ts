import { db } from '@/lib/db';
import { 
  chartAccounts, 
  journalEntries, 
  journalLines,
  type ChartAccount,
  type JournalEntry,
  type JournalLine 
} from '@/lib/db/schema/index';
import { eq, desc, and, gte, lte, like, sql } from 'drizzle-orm';

// Chart of Accounts queries
export async function getChartOfAccounts(organizationId: string) {
  return await db
    .select()
    .from(chartAccounts)
    .where(eq(chartAccounts.organizationId, organizationId))
    .orderBy(chartAccounts.code);
}

export async function getChartOfAccountById(id: string, organizationId: string) {
  const [account] = await db
    .select()
    .from(chartAccounts)
    .where(
      and(
        eq(chartAccounts.id, id),
        eq(chartAccounts.organizationId, organizationId)
      )
    );
  return account;
}

export async function createChartOfAccount(data: Omit<ChartAccount, 'id' | 'createdAt' | 'updatedAt'>) {
  const [account] = await db
    .insert(chartAccounts)
    .values(data)
    .returning();
  return account;
}

export async function updateChartOfAccount(
  id: string, 
  organizationId: string,
  data: Partial<Omit<ChartAccount, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
) {
  const [account] = await db
    .update(chartAccounts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(chartAccounts.id, id),
        eq(chartAccounts.organizationId, organizationId)
      )
    )
    .returning();
  return account;
}

export async function deleteChartOfAccount(id: string, organizationId: string) {
  await db
    .delete(chartAccounts)
    .where(
      and(
        eq(chartAccounts.id, id),
        eq(chartAccounts.organizationId, organizationId)
      )
    );
}

// Journal Entries queries
export async function getJournalEntries(
  organizationId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    accountId?: string;
    limit?: number;
    offset?: number;
  }
) {
  let query = db
    .select({
      entry: journalEntries,
      lines: sql<JournalLine[]>`
        COALESCE(
          json_agg(
            json_build_object(
              'id', ${journalLines.id},
              'accountId', ${journalLines.accountId},
              'debit', ${journalLines.debit},
              'credit', ${journalLines.credit},
              'description', ${journalLines.description}
            )
          ) FILTER (WHERE ${journalLines.id} IS NOT NULL),
          '[]'::json
        )
      `.as('lines')
    })
    .from(journalEntries)
    .leftJoin(
      journalLines,
      eq(journalEntries.id, journalLines.journalEntryId)
    )
    .where(eq(journalEntries.organizationId, organizationId))
    .groupBy(journalEntries.id)
    .orderBy(desc(journalEntries.date));

  // Apply filters
  const conditions: any[] = [eq(journalEntries.organizationId, organizationId)];
  
  if (filters?.startDate) {
    conditions.push(gte(journalEntries.date, filters.startDate));
  }
  
  if (filters?.endDate) {
    conditions.push(lte(journalEntries.date, filters.endDate));
  }
  
  if (conditions.length > 1) {
    query = query.where(and(...conditions)) as any;
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  return await query;
}

export async function createJournalEntry(
  organizationId: string,
  workspaceId: string,
  data: {
    date: Date;
    reference?: string;
    description?: string;
    lines: Array<{
      accountId: string;
      debit: number;
      credit: number;
      description?: string;
    }>;
  }
) {
  return await db.transaction(async (tx) => {
    // Create journal entry
    const [entry] = await tx
      .insert(journalEntries)
      .values({
        organizationId,
        workspaceId,
        date: data.date,
        reference: data.reference,
        description: data.description,
        status: 'posted',
      })
      .returning();
    
    // Create journal entry lines
    if (data.lines.length > 0) {
      await tx
        .insert(journalLines)
        .values(
          data.lines.map((line, index) => ({
            journalEntryId: entry.id,
            organizationId,
            workspaceId,
            lineNumber: index + 1,
            ...line,
          }))
        );
    }
    
    return entry;
  });
}

export async function getAccountBalance(accountId: string, organizationId: string) {
  const result = await db
    .select({
      debitTotal: sql<number>`COALESCE(SUM(${journalLines.debit}), 0)`,
      creditTotal: sql<number>`COALESCE(SUM(${journalLines.credit}), 0)`,
    })
    .from(journalLines)
    .where(
      and(
        eq(journalLines.accountId, accountId),
        eq(journalLines.organizationId, organizationId)
      )
    );
  
  const { debitTotal, creditTotal } = result[0] || { debitTotal: 0, creditTotal: 0 };
  return {
    debitTotal,
    creditTotal,
    balance: debitTotal - creditTotal,
  };
}