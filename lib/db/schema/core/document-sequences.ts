import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { organizations } from './organizations';

// Document types that need sequential numbering
// Note: Using existing document_numbering_type enum from database
export const documentNumberingTypeEnum = pgEnum('document_numbering_type', [
  'invoice',
  'bill',
  'payment',
  'journal_entry',
  'sales_order',
  'purchase_order',
  'quotation',
  'fulfillment',
  'receipt',
  'stock_move',
  'adjustment',
  'bank_transaction',
  'forecast'
]);

// Reset frequency for sequences
export const resetFrequencyEnum = pgEnum('reset_frequency', [
  'never',
  'yearly',
  'monthly',
  'quarterly'
]);

// Document Number Sequences - Track sequential numbering per organization per document type
export const documentNumberSequences = pgTable('document_number_sequences', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  documentType: documentNumberingTypeEnum('document_type').notNull(),
  
  // Current sequence state
  currentNumber: integer('current_number').notNull().default(0),
  
  // Pattern configuration
  prefix: text('prefix').notNull().default(''), // e.g., "INV-", "SO-"
  suffix: text('suffix').notNull().default(''), // e.g., ""
  padding: integer('padding').notNull().default(3), // Zero-padding: 001, 002, etc.
  includeYear: boolean('include_year').notNull().default(true), // Include year: INV-2024-001
  includePeriod: boolean('include_period').notNull().default(false), // Include period: INV-2024-01-001
  
  // Reset configuration
  resetFrequency: resetFrequencyEnum('reset_frequency').notNull().default('yearly'),
  lastResetAt: timestamp('last_reset_at'),
  
  // Sample format for display: "INV-2024-{###}"
  sampleFormat: text('sample_format').notNull(),
  
  // Settings
  isActive: boolean('is_active').notNull().default(true),
  allowManualOverride: boolean('allow_manual_override').notNull().default(true),
  
  // Custom format expression (advanced)
  customFormat: text('custom_format'), // PostgreSQL expression for complex formats
  
  // Metadata
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one sequence per org per document type
  orgDocTypeIdx: uniqueIndex('core_doc_seq_org_type_idx').on(table.organizationId, table.documentType),
  activeIdx: index('core_doc_seq_active_idx').on(table.isActive),
  typeIdx: index('core_doc_seq_type_idx').on(table.documentType),
}));

// Generated Document Numbers - Track all generated numbers for audit and gaps
export const generatedDocumentNumbers = pgTable('generated_document_numbers', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  sequenceId: uuid('sequence_id').notNull().references(() => documentNumberSequences.id, { onDelete: 'cascade' }),
  
  // Generated number details
  documentType: documentNumberingTypeEnum('document_type').notNull(),
  generatedNumber: text('generated_number').notNull(),
  sequenceNumber: integer('sequence_number').notNull(),
  
  // Usage tracking
  documentId: uuid('document_id'), // Actual document ID when used
  isUsed: boolean('is_used').notNull().default(false),
  usedAt: timestamp('used_at'),
  
  // Context
  generatedFor: text('generated_for'), // 'api', 'agent', 'manual', etc.
  userId: uuid('user_id'), // Who generated it
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgNumberIdx: uniqueIndex('core_gen_doc_org_number_idx').on(table.organizationId, table.generatedNumber),
  sequenceIdx: index('core_gen_doc_sequence_idx').on(table.sequenceId),
  documentIdx: index('core_gen_doc_document_idx').on(table.documentId),
  usedIdx: index('core_gen_doc_used_idx').on(table.isUsed),
  typeIdx: index('core_gen_doc_type_idx').on(table.documentType),
}));

// Type exports
export type DocumentSequence = InferSelectModel<typeof documentNumberSequences>;
export type GeneratedDocumentNumber = InferSelectModel<typeof generatedDocumentNumbers>;

// Relations
export const documentNumberSequencesRelations = relations(documentNumberSequences, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [documentNumberSequences.organizationId],
    references: [organizations.id],
  }),
  generatedNumbers: many(generatedDocumentNumbers),
}));

export const generatedDocumentNumbersRelations = relations(generatedDocumentNumbers, ({ one }) => ({
  organization: one(organizations, {
    fields: [generatedDocumentNumbers.organizationId],
    references: [organizations.id],
  }),
  sequence: one(documentNumberSequences, {
    fields: [generatedDocumentNumbers.sequenceId],
    references: [documentNumberSequences.id],
  }),
}));