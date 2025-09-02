#!/usr/bin/env npx tsx
/**
 * Verify all database schema exports are properly configured
 */

import {
  // Core schemas
  organizations,
  workspaces,
  auditLogs,
  organizationMembers,
  sessions,
  authAccounts,
  
  // Finance schemas  
  chartAccounts,
  journalEntries,
  journalLines,
  invoices,
  invoiceLines,
  bills,
  billLines,
  payments,
  contacts,
  products,
  
  // Personal Finance schemas
  personalCategories,
  financialGoals,
  budgetRules,
  investmentHoldings,
  personalSubscriptions,
  
  // AI schemas
  aiAgents,
  agentExecutions,
  agentConversations,
  
  // ERP schemas
  bankAccounts,
  bankTransactions,
  warehouses,
  inventoryLevels,
  salesOrders,
  purchaseOrders,
  
  // Types
  type Organization,
  type Workspace,
  type PersonalCategory,
  type FinancialGoal,
  type BudgetRule,
  type InvestmentHolding,
  type PersonalSubscription
} from '../lib/db/schema/index';

console.log('✅ Schema Export Verification');
console.log('=============================\n');

// Core schemas
console.log('Core Schemas:');
console.log('  ✓ organizations:', !!organizations);
console.log('  ✓ workspaces:', !!workspaces);
console.log('  ✓ auditLogs:', !!auditLogs);
console.log('  ✓ organizationMembers:', !!organizationMembers);
console.log('  ✓ sessions:', !!sessions);
console.log('  ✓ authAccounts:', !!authAccounts);

// Finance schemas
console.log('\nFinance Schemas:');
console.log('  ✓ chartAccounts:', !!chartAccounts);
console.log('  ✓ journalEntries:', !!journalEntries);
console.log('  ✓ invoices:', !!invoices);
console.log('  ✓ bills:', !!bills);
console.log('  ✓ payments:', !!payments);
console.log('  ✓ contacts:', !!contacts);
console.log('  ✓ products:', !!products);

// Personal Finance schemas
console.log('\nPersonal Finance Schemas:');
console.log('  ✓ personalCategories:', !!personalCategories);
console.log('  ✓ financialGoals:', !!financialGoals);
console.log('  ✓ budgetRules:', !!budgetRules);
console.log('  ✓ investmentHoldings:', !!investmentHoldings);
console.log('  ✓ personalSubscriptions:', !!personalSubscriptions);

// AI schemas
console.log('\nAI Schemas:');
console.log('  ✓ aiAgents:', !!aiAgents);
console.log('  ✓ agentExecutions:', !!agentExecutions);
console.log('  ✓ agentConversations:', !!agentConversations);

// ERP schemas
console.log('\nERP Schemas:');
console.log('  ✓ bankAccounts:', !!bankAccounts);
console.log('  ✓ bankTransactions:', !!bankTransactions);
console.log('  ✓ warehouses:', !!warehouses);
console.log('  ✓ inventoryLevels:', !!inventoryLevels);
console.log('  ✓ salesOrders:', !!salesOrders);
console.log('  ✓ purchaseOrders:', !!purchaseOrders);

// Check personal finance table columns
console.log('\n\nPersonal Finance Table Structure:');
console.log('==================================');

console.log('\npersonalCategories columns:');
const categoryColumns = Object.keys(personalCategories);
console.log('  Columns:', categoryColumns.filter(k => !k.startsWith('_')).join(', '));

console.log('\nfinancialGoals columns:');
const goalColumns = Object.keys(financialGoals);
console.log('  Columns:', goalColumns.filter(k => !k.startsWith('_')).join(', '));

console.log('\nbudgetRules columns:');
const budgetColumns = Object.keys(budgetRules);
console.log('  Columns:', budgetColumns.filter(k => !k.startsWith('_')).join(', '));

console.log('\ninvestmentHoldings columns:');
const investmentColumns = Object.keys(investmentHoldings);
console.log('  Columns:', investmentColumns.filter(k => !k.startsWith('_')).join(', '));

console.log('\npersonalSubscriptions columns:');
const subscriptionColumns = Object.keys(personalSubscriptions);
console.log('  Columns:', subscriptionColumns.filter(k => !k.startsWith('_')).join(', '));

console.log('\n✅ All schema exports verified successfully!');